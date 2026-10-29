
"""
Los datos incompletos y los dorsales repetidos generan avisos, no exclusiones.

--season	Temporada que solicita
--dry-run	Descarga y prepara datos sin conectar a PostgreSQL
--strict	Aborta si algún jugador queda omitido
--refresh	Vuelve a descargar ignorando la caché
--as-of	Fecha utilizada para calcular edades
--env-file	Archivo de variables de entorno
--cache-dir	Carpeta de respuestas guardadas
--report	Ruta del informe
--delay, --timeout, --retries	Configuración de las peticiones
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from collections.abc import Callable
from dataclasses import asdict, dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from functools import partial
from pathlib import Path
from typing import Any
from uuid import uuid4

import psycopg
from dotenv import load_dotenv
from nba_api.stats.endpoints import (
    commonplayerinfo,
    commonteamroster,
    playerindex,
    teamdetails,
    teaminfocommon,
)
from nba_api.stats.static import teams as nba_teams

ROOT = Path(__file__).resolve().parents[3]
LOG = logging.getLogger("import_nba")
OPTIONAL_PLAYER_FIELDS = (
    "height",
    "weight",
    "age",
    "draft",
    "country",
    "jersey_number",
    "position",
)
POSITIONS = {"PG", "SG", "SF", "PF", "C", "G", "F"}


class ImportErrorNBA(Exception):
    pass


def integer(value: Any, label: str) -> int:
    if isinstance(value, bool) or not re.fullmatch(r"\d+", str(value)):
        raise ImportErrorNBA(f"{label}: se esperaba un entero no negativo.")
    return int(value)


def text(value: Any, label: str) -> str:
    if not isinstance(value, str) or value.strip() in ("", "-", "TBD", "N/A"):
        raise ImportErrorNBA(f"Falta {label} en la respuesta NBA.")
    return value.strip()


def dataset_rows(payload: dict, name: str) -> list[dict]:
    for result in payload.get("resultSets", []):
        if result.get("name") == name:
            return [
                dict(zip(result["headers"], row, strict=True))
                for row in result["rowSet"]
            ]
    raise ImportErrorNBA(f"La NBA no devolvió el conjunto {name}.")


@dataclass
class Team:
    nba_id: int
    name: str
    short_name: str
    logo: str
    conference: str
    division: str
    stadium: str
    coach: str


class NBAClient:
    def __init__(
        self, cache_dir: Path, delay: float, timeout: float, retries: int, refresh: bool
    ):
        self.cache_dir = cache_dir
        self.delay = delay
        self.timeout = timeout
        self.retries = retries
        self.refresh = refresh
        self.last_request = 0.0

    def call(self, key: str, factory: Callable, ttl: float = 0) -> dict:
        
        path = self.cache_dir / f"{key}.json"
        if (
            ttl
            and not self.refresh
            and path.is_file()
            and time.time() - path.stat().st_mtime < ttl
        ):
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                pass
        for attempt in range(1, self.retries + 1):
            time.sleep(max(0, self.delay - (time.monotonic() - self.last_request)))
            self.last_request = time.monotonic()
            try:
                payload = factory(timeout=self.timeout).get_dict()
                if not isinstance(payload, dict):
                    raise ImportErrorNBA("Respuesta NBA sin objeto JSON.")
            except Exception as exc:
                if attempt == self.retries:
                    raise ImportErrorNBA(
                        f"No se pudo descargar {key} tras {attempt} intentos "
                        f"({type(exc).__name__}). Vuelve a ejecutar el comando; "
                        "se reutilizarán las respuestas en caché."
                    ) from exc
                LOG.warning("Reintentando %s (%s/%s)", key, attempt, self.retries)
                time.sleep(min(2**attempt, 8))
                continue
            if ttl:
                path.parent.mkdir(parents=True, exist_ok=True)
                temporary = path.with_suffix(".tmp")
                temporary.write_text(json.dumps(payload), encoding="utf-8")
                temporary.replace(path)
            return payload
        raise AssertionError("retries debe ser mayor que cero")


def fetch_teams(client: NBAClient, season: str) -> list[Team]:
    result = []
    for index, static in enumerate(nba_teams.get_teams(), start=1):
        nba_id = static["id"]
        LOG.info("Equipo %s/30: %s", index, static["full_name"])
        background = client.call(
            f"team-{nba_id}",
            partial(teamdetails.TeamDetails, team_id=nba_id),
            ttl=86400,
        )
        info = client.call(
            f"team-info-{nba_id}-{season}",
            partial(
                teaminfocommon.TeamInfoCommon, team_id=nba_id, season_nullable=season
            ),
            ttl=86400,
        )
        details_rows = dataset_rows(background, "TeamBackground")
        info_rows = dataset_rows(info, "TeamInfoCommon")
        if len(details_rows) != 1 or len(info_rows) != 1:
            raise ImportErrorNBA(f"Información incompleta del equipo {nba_id}.")
        details, common = details_rows[0], info_rows[0]
        if (
            integer(details["TEAM_ID"], "TEAM_ID") != nba_id
            or integer(common["TEAM_ID"], "TEAM_ID") != nba_id
        ):
            raise ImportErrorNBA(f"La respuesta no corresponde al equipo {nba_id}.")
        conference = text(common["TEAM_CONFERENCE"], "conferencia")
        if conference not in ("East", "West"):
            raise ImportErrorNBA(f"Conferencia inesperada: {conference}.")
        slug = re.sub(r"[^a-z0-9]+", "-", static["full_name"].lower()).strip("-")

        if static["abbreviation"] == "LAC":
            slug = "los-angeles-clippers"
        result.append(
            Team(
                nba_id,
                static["full_name"],
                static["abbreviation"],
                f"/logos/{slug}.webp",
                conference,
                text(common["TEAM_DIVISION"], "división"),
                text(details["ARENA"], "estadio"),
                text(details["HEADCOACH"], "entrenador"),
            )
        )

    for field in ("nba_id", "short_name", "name", "stadium", "coach"):
        values = [getattr(team, field) for team in result]
        if len(values) != len(set(values)):
            raise ImportErrorNBA(
                f"La NBA devuelve {field} repetidos; tu esquema exige valores únicos."
            )
    return result


def save_teams(cursor, teams: list[Team]) -> dict[int, int]:
    mapping = {}
    plans = []
    for team in teams:
        cursor.execute(
            "SELECT id, nba_id, logo FROM teams WHERE nba_id = %s OR short_name = %s",
            (team.nba_id, team.short_name),
        )
        matches = cursor.fetchall()
        if len(matches) > 1 or (matches and matches[0][1] not in (None, team.nba_id)):
            raise ImportErrorNBA(
                f"Los identificadores del equipo {team.short_name} están en conflicto."
            )
        plans.append((team, matches[0] if matches else None))

    token = uuid4().hex
    for _, old in plans:
        if old:
            cursor.execute(
                "UPDATE teams SET stadium=%s,coach=%s WHERE id=%s",
                (
                    f"__import_{token}_stadium_{old[0]}",
                    f"__import_{token}_coach_{old[0]}",
                    old[0],
                ),
            )
    for team, old in plans:
        if old:
            local_id, _, logo = old
            cursor.execute(
                """UPDATE teams SET nba_id=%s, name=%s, short_name=%s, logo=%s,
                   conference=%s, division=%s, stadium=%s, coach=%s WHERE id=%s""",
                (
                    team.nba_id,
                    team.name,
                    team.short_name,
                    logo,
                    team.conference,
                    team.division,
                    team.stadium,
                    team.coach,
                    local_id,
                ),
            )
        else:
            cursor.execute(
                """INSERT INTO teams (nba_id, name, short_name, logo, conference, division, stadium, coach)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                tuple(asdict(team).values()),
            )
            local_id = cursor.fetchone()[0]
        mapping[team.nba_id] = local_id
    return mapping


@dataclass
class Player:
    nba_id: int
    name: str
    height: Decimal | None
    weight: Decimal | None
    age: int | None
    draft: int | None
    team_nba_id: int | None
    country: str | None
    jersey_number: str | None
    position: str | None
    image: str
    team_known: bool = True


def normalized(value: str) -> str:
    
    ascii_value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    )
    return re.sub(r"[^a-z0-9]", "", ascii_value.lower())


def player_image(name: str, directory: Path) -> str:
    if directory.is_dir():
        matches = sorted(
            (
                path
                for path in directory.iterdir()
                if path.is_file()
                and path.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg", ".avif")
                and normalized(path.stem) == normalized(name)
            ),
            key=lambda path: (path.suffix.lower() != ".webp", path.name),
        )
        if matches:
            return "/players/" + matches[0].name
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    filename = re.sub(r"[^A-Za-z0-9_\- ]", "", ascii_name)
    filename = re.sub(r"[ _]+", "_", filename).strip("_")
    if not filename:
        raise ImportErrorNBA(f"No se puede generar el nombre de foto para {name!r}.")
    return f"/players/{filename}.webp"


def measurement(value: Any, kind: str) -> Decimal:
    try:
        if kind == "height":
            feet, inches = re.fullmatch(r"(\d+)-(\d+)", str(value).strip()).groups()
            amount = (Decimal(feet) * 12 + Decimal(inches)) * Decimal("0.0254")
        else:
            amount = Decimal(str(value)) * Decimal("0.45359237")
        if not amount.is_finite() or amount <= 0:
            raise ValueError
        amount = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        limit = Decimal("9.99") if kind == "height" else Decimal("999.99")
        if amount <= 0 or amount > limit:
            raise ValueError
        return amount
    except (AttributeError, InvalidOperation, ValueError) as exc:
        raise ImportErrorNBA(f"Falta una medida válida de {kind}: {value!r}.") from exc


def birth_date(value: Any) -> date:
    value = str(value).strip()
    if re.match(r"\d{4}-\d{2}-\d{2}", value):
        try:
            return date.fromisoformat(value[:10])
        except ValueError as exc:
            raise ImportErrorNBA(f"Fecha de nacimiento inválida: {value!r}.") from exc
    months = {
        name: number
        for number, name in enumerate(
            (
                "JAN",
                "FEB",
                "MAR",
                "APR",
                "MAY",
                "JUN",
                "JUL",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC",
            ),
            1,
        )
    }
    try:
        month, day, year = value.replace(",", "").upper().split()
        return date(int(year), months[month], int(day))
    except (ValueError, KeyError) as exc:
        raise ImportErrorNBA(
            f"Falta una fecha de nacimiento válida: {value!r}."
        ) from exc


def position(value: Any) -> str:
    raw = text(value, "posición").upper()
    if raw in POSITIONS:
        return raw
    primary = raw.split("-")[0].strip()
    if primary in POSITIONS:
        return primary
    result = {
        "G": "G",
        "GUARD": "G",
        "F": "F",
        "FORWARD": "F",
        "C": "C",
        "CENTER": "C",
    }.get(primary)
    if result is None:
        raise ImportErrorNBA(f"Posición NBA desconocida: {value!r}.")
    return result


def compatible_position(incoming: str | None, existing: str | None) -> str | None:
    if incoming is None:
        return existing if existing in POSITIONS else None
    family = {"PG": "G", "SG": "G", "SF": "F", "PF": "F", "C": "C"}
    return existing if family.get(existing) == incoming else incoming


def optional_value(values: tuple, parser: Callable) -> Any:
    
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if value.upper() in ("", "-", "TBD", "N/A", "NULL", "NONE", "UNKNOWN"):
                continue
        try:
            return parser(value)
        except ImportErrorNBA:
            continue
    return None


def player_age(value: Any, as_of: date) -> int:
    born = birth_date(value)
    age = as_of.year - born.year - ((as_of.month, as_of.day) < (born.month, born.day))
    if age <= 0:
        raise ImportErrorNBA(
            "Fecha de nacimiento incompatible con la fecha de cálculo."
        )
    return age


def draft_year(value: Any) -> int:
    if isinstance(value, str) and value.strip().upper() == "UNDRAFTED":
        return 0
    return integer(value, "draft")


def jersey_number(value: Any) -> str:
    jersey = str(value).strip()
    if not re.fullmatch(r"[0-9]{1,2}", jersey):
        raise ImportErrorNBA("La NBA no informa de un dorsal válido.")
    return jersey


def parse_player(
    index: dict, roster: dict, extra: dict, as_of: date, image_dir: Path
) -> Player:
    nba_id = integer(index["PERSON_ID"], "PERSON_ID")
    if nba_id == 0:
        raise ImportErrorNBA("El identificador NBA del jugador debe ser positivo.")
    name = text(
        " ".join(
            str(index.get(key) or "").strip()
            for key in ("PLAYER_FIRST_NAME", "PLAYER_LAST_NAME")
        ),
        "nombre",
    )
    age = optional_value(
        (roster.get("BIRTH_DATE"), extra.get("BIRTHDATE")),
        partial(player_age, as_of=as_of),
    )
    jersey = optional_value(
        (roster.get("NUM"), index.get("JERSEY_NUMBER"), extra.get("JERSEY")),
        jersey_number,
    )
    draft = optional_value(
        (index.get("DRAFT_YEAR"), extra.get("DRAFT_YEAR")), draft_year
    )
    team_id = optional_value(
        (index.get("TEAM_ID"), extra.get("TEAM_ID"), roster.get("TeamID")),
        partial(integer, label="TEAM_ID"),
    )
    return Player(
        nba_id,
        name,
        optional_value(
            (index.get("HEIGHT"), roster.get("HEIGHT"), extra.get("HEIGHT")),
            partial(measurement, kind="height"),
        ),
        optional_value(
            (index.get("WEIGHT"), roster.get("WEIGHT"), extra.get("WEIGHT")),
            partial(measurement, kind="weight"),
        ),
        age,
        draft,
        team_id or None,
        optional_value(
            (index.get("COUNTRY"), extra.get("COUNTRY")), partial(text, label="país")
        ),
        jersey,
        optional_value(
            (index.get("POSITION"), roster.get("POSITION"), extra.get("POSITION")),
            position,
        ),
        player_image(name, image_dir),
        team_known=team_id is not None,
    )


def fetch_players(
    client: NBAClient,
    season: str,
    teams: list[Team],
    as_of: date,
    image_dir: Path,
    skipped: list[dict],
) -> list[Player]:
    payload = client.call(
        "player-index-" + season,
        partial(
            playerindex.PlayerIndex,
            season=season,
            historical_nullable=0,
            active_nullable=1,
        ),
        ttl=86400,
    )
    index_rows = dataset_rows(payload, "PlayerIndex")
    if not index_rows:
        raise ImportErrorNBA(f"No hay jugadores en PlayerIndex para {season}.")
    rosters = defaultdict(list)
    for number, team in enumerate(teams, 1):
        LOG.info("Plantilla %s/%s: %s", number, len(teams), team.short_name)
        payload = client.call(
            f"roster-{team.nba_id}-{season}",
            partial(
                commonteamroster.CommonTeamRoster, team_id=team.nba_id, season=season
            ),
            ttl=86400,
        )
        for row in dataset_rows(payload, "CommonTeamRoster"):
            if integer(row["TeamID"], "TeamID") != team.nba_id:
                raise ImportErrorNBA(
                    f"Plantilla de un equipo incorrecto: {team.short_name}."
                )
            if str(row.get("SEASON")) not in (season[:4], season):
                raise ImportErrorNBA(
                    f"La plantilla de {team.short_name} no corresponde a {season}."
                )
            rosters[integer(row["PLAYER_ID"], "PLAYER_ID")].append(row)
    result = []
    for row in index_rows:
        nba_id = integer(row["PERSON_ID"], "PERSON_ID")
        candidates = rosters[nba_id]
        roster = next(
            (r for r in candidates if r["TeamID"] == row.get("TEAM_ID")),
            candidates[0] if candidates else {},
        )
        extra = {}
        needs_extra = (
            not roster.get("BIRTH_DATE")
            or not row.get("COUNTRY")
            or not (row.get("HEIGHT") or roster.get("HEIGHT"))
            or not (row.get("POSITION") or roster.get("POSITION"))
            or not (row.get("WEIGHT") or roster.get("WEIGHT"))
            or not (roster.get("NUM") or row.get("JERSEY_NUMBER"))
            or not row.get("DRAFT_YEAR")
        )
        if needs_extra:
            try:
                payload = client.call(
                    f"player-{nba_id}",
                    partial(commonplayerinfo.CommonPlayerInfo, player_id=nba_id),
                    ttl=86400,
                )
                extras = dataset_rows(payload, "CommonPlayerInfo")
                if (
                    len(extras) != 1
                    or integer(extras[0].get("PERSON_ID"), "PERSON_ID") != nba_id
                ):
                    raise ImportErrorNBA(f"Ficha individual incorrecta para {nba_id}.")
                extra = extras[0]
            except ImportErrorNBA as exc:
                LOG.warning(
                    "AVISO: ficha adicional no disponible para nba_id=%s: %s "
                    "Se utilizarán los datos disponibles.",
                    nba_id,
                    exc,
                )
        try:
            player = parse_player(row, roster, extra, as_of, image_dir)
            if player.team_nba_id is not None and player.team_nba_id not in {
                team.nba_id for team in teams
            }:
                LOG.warning(
                    "AVISO: equipo NBA %s desconocido para %s (nba_id=%s). "
                    "Se conservará el equipo previo; si es nuevo, quedará NULL.",
                    player.team_nba_id,
                    player.name,
                    player.nba_id,
                )
                player.team_nba_id = None
                player.team_known = False
            missing = [
                field
                for field in OPTIONAL_PLAYER_FIELDS
                if getattr(player, field) is None
            ]
            if missing:
                LOG.warning(
                    "AVISO: %s (nba_id=%s), datos no disponibles: %s. "
                    "Se conservarán los datos previos; si no existen, se guardará NULL.",
                    player.name,
                    player.nba_id,
                    ", ".join(missing),
                )
            result.append(player)
        except ImportErrorNBA as exc:
            skipped.append(
                {
                    "nba_id": nba_id,
                    "name": f"{row.get('PLAYER_FIRST_NAME', '')} {row.get('PLAYER_LAST_NAME', '')}".strip(),
                    "reason": str(exc),
                }
            )
    if len({p.nba_id for p in result}) != len(result):
        raise ImportErrorNBA("La NBA devolvió identificadores de jugador repetidos.")
    if not result:
        raise ImportErrorNBA("No se pudo preparar ningún jugador válido.")
    return result


def check_schema(cursor) -> bool:
    
    cursor.execute("""SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns
                   WHERE table_schema=current_schema() AND table_name IN ('teams','players')""")
    rows = cursor.fetchall()
    columns = {(table, column): kind for table, column, kind, _ in rows}
    nullable = {(table, column): value for table, column, _, value in rows}
    for table in ("teams", "players"):
        if (table, "nba_id") not in columns:
            raise ImportErrorNBA(
                f"Falta {table}.nba_id. Añade tú esa columna INTEGER UNIQUE antes de ejecutar el script."
            )
        if columns[(table, "nba_id")] not in (
            "integer",
            "bigint",
            "numeric",
        ):
            raise ImportErrorNBA(f"Tipo no compatible para {table}.nba_id.")
        cursor.execute(
            f"SELECT nba_id FROM {table} WHERE nba_id IS NOT NULL GROUP BY nba_id HAVING COUNT(*) > 1"
        )
        if cursor.fetchone():
            raise ImportErrorNBA(f"Hay valores nba_id repetidos en {table}.")
    required_nullable = (*OPTIONAL_PLAYER_FIELDS, "team_id")
    incompatible = [
        field
        for field in required_nullable
        if nullable.get(("players", field)) != "YES"
    ]
    if incompatible:
        raise ImportErrorNBA(
            "Los campos opcionales de players deben existir y admitir NULL: "
            + ", ".join(incompatible)
            + ". Aplica primero los cambios de esquema acordados."
        )
    cursor.execute("""SELECT c.conname FROM pg_constraint AS c
                      WHERE c.conrelid='players'::regclass AND c.contype='u'
                      AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
                           FROM unnest(c.conkey) AS k(attnum)
                           JOIN pg_attribute AS a
                             ON a.attrelid=c.conrelid AND a.attnum=k.attnum)
                          = ARRAY['jersey_number','team_id']""")
    if cursor.fetchone():
        raise ImportErrorNBA(
            "players todavía tiene UNIQUE(team_id, jersey_number). "
            "Elimina esa restricción antes de importar dorsales repetidos."
        )
    return columns.get(("players", "jersey_number")) in (
        "text",
        "character varying",
        "character",
    )


def match_players(
    cursor, players: list[Player]
) -> tuple[list[tuple[Player, int | None]], list[tuple]]:
    cursor.execute(
        """SELECT p.id,p.nba_id,p.name,p.image,p.position,p.team_id,p.jersey_number,
                  p.height,p.weight,p.age,p.draft,p.country,t.nba_id
           FROM players AS p LEFT JOIN teams AS t ON t.id=p.team_id ORDER BY p.id"""
    )
    existing = cursor.fetchall()
    by_id = {str(row[1]): row for row in existing if row[1] is not None}
    by_name = defaultdict(list)
    for row in existing:
        by_name[normalized(row[2])].append(row)
    names = Counter(normalized(player.name) for player in players)
    matched, claimed = [], set()
    for player in players:
        old = by_id.get(str(player.nba_id))
        if old is None:
            candidates = by_name[normalized(player.name)]
            if candidates and (
                len(candidates) != 1 or names[normalized(player.name)] > 1
            ):
                raise ImportErrorNBA(
                    f"Hay varias personas con el nombre {player.name}; asigna nba_id manualmente para identificarlas."
                )
            if candidates:
                old = candidates[0]
                if old[1] is not None:
                    raise ImportErrorNBA(
                        f"El nombre {player.name} ya tiene otro nba_id; revisa ese registro."
                    )
        if old is not None:
            if old[0] in claimed:
                raise ImportErrorNBA(
                    f"Dos jugadores se han asociado al mismo ID local: {player.name}."
                )
            claimed.add(old[0])
            player.image = old[3] or player.image
            player.position = compatible_position(player.position, old[4])
            previous = {
                "height": old[7],
                "weight": old[8],
                "age": old[9],
                "draft": old[10],
                "country": old[11],
                "jersey_number": old[6],
            }
            for field, value in previous.items():
                if getattr(player, field) is None:
                    setattr(player, field, value)
            if not player.team_known:
                player.team_nba_id = old[12]
        matched.append((player, old[0] if old else None))
    return matched, existing


def warn_jersey_conflicts(
    matched: list[tuple[Player, int | None]],
    existing: list[tuple],
    mapping: dict[int, int],
    textual: bool,
) -> list[dict]:
    
    updated_ids = {local_id for _, local_id in matched if local_id is not None}
    groups = defaultdict(list)
    for row in existing:
        if row[0] not in updated_ids and row[5] is not None and row[6] is not None:
            jersey = str(row[6]) if textual else int(row[6])
            groups[(row[5], jersey)].append({"nba_id": row[1], "name": row[2]})
    for player, _ in matched:
        team_id = mapping.get(player.team_nba_id)
        if team_id is not None and player.jersey_number is not None:
            jersey = player.jersey_number if textual else int(player.jersey_number)
            groups[(team_id, jersey)].append(
                {"nba_id": player.nba_id, "name": player.name}
            )
    reverse_mapping = {local_id: nba_id for nba_id, local_id in mapping.items()}
    conflicts = []
    for (team_id, jersey), players in groups.items():
        if len(players) > 1:
            conflict = {
                "team_nba_id": reverse_mapping.get(team_id),
                "jersey_number": str(jersey),
                "players": players,
            }
            conflicts.append(conflict)
            LOG.warning(
                "AVISO: dorsal %s repetido en el equipo NBA %s: %s. "
                "Se conservarán todos los jugadores.",
                jersey,
                conflict["team_nba_id"],
                ", ".join(f"{p['name']} (nba_id={p['nba_id']})" for p in players),
            )
    return conflicts


def save_players(
    cursor,
    players: list[Player],
    mapping: dict[int, int],
    textual: bool,
    skipped: list[dict],
    strict: bool = False,
    jersey_conflicts: list[dict] | None = None,
) -> list[Player]:
    matched, existing = match_players(cursor, players)
    conflicts = warn_jersey_conflicts(matched, existing, mapping, textual)
    if jersey_conflicts is not None:
        jersey_conflicts.extend(conflicts)
    if strict and skipped:
        raise ImportErrorNBA(
            f"Hay {len(skipped)} jugadores incompatibles. Consulta el informe o ejecuta sin --strict para omitirlos."
        )

    for player, local_id in matched:
        values = (
            player.nba_id,
            player.name,
            player.height,
            player.weight,
            player.age,
            player.draft,
            mapping.get(player.team_nba_id),
            player.country,
            player.jersey_number
            if textual or player.jersey_number is None
            else int(player.jersey_number),
            player.position,
            player.image,
        )
        if local_id is not None:
            cursor.execute(
                """UPDATE players SET nba_id=%s,name=%s,height=%s,weight=%s,age=%s,
                           draft=%s,team_id=%s,country=%s,jersey_number=%s,position=%s,image=%s WHERE id=%s""",
                (*values, local_id),
            )
        else:
            cursor.execute(
                """INSERT INTO players (nba_id,name,height,weight,age,draft,team_id,country,jersey_number,position,image)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                values,
            )
    return [player for player, _ in matched]


def import_database(
    database_url: str,
    teams: list[Team],
    players: list[Player],
    skipped: list[dict],
    strict: bool = False,
    jersey_conflicts: list[dict] | None = None,
) -> list[Player]:
    with (
        psycopg.connect(
            database_url, connect_timeout=10, prepare_threshold=None
        ) as connection,
        connection.cursor() as cursor,
    ):
        textual = check_schema(cursor)
        cursor.execute("LOCK TABLE teams,players IN SHARE ROW EXCLUSIVE MODE")
        mapping = save_teams(cursor, teams)
        saved = save_players(
            cursor, players, mapping, textual, skipped, strict, jersey_conflicts
        )
    return saved


def image_report(players: list[Player], public: Path) -> list[dict]:
    missing = []
    for player in players:
        if (
            player.image.startswith("/")
            and not (public / player.image.lstrip("/")).is_file()
        ):
            missing.append(
                {"nba_id": player.nba_id, "name": player.name, "image": player.image}
            )
    return missing


def arguments(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--season", required=True, help="Temporada NBA, por ejemplo 2026-27"
    )
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.local")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / ".nba-import-cache")
    parser.add_argument(
        "--report", type=Path, default=Path(__file__).resolve().parent / "nba_import_report.json"
    )
    parser.add_argument(
        "--as-of",
        type=date.fromisoformat,
        default=date.today(),
        help="Fecha para calcular la edad; por defecto hoy",
    )
    parser.add_argument("--delay", type=float, default=0.8)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Volver a descargar los datos ignorando la caché de 24 horas",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Descargar y validar sin conectar a PostgreSQL",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Abortar si algún jugador no se puede identificar; los datos opcionales no lo excluyen",
    )
    args = parser.parse_args(argv)
    if (
        not re.fullmatch(r"\d{4}-\d{2}", args.season)
        or int(args.season[5:]) != (int(args.season[:4]) + 1) % 100
    ):
        parser.error("--season debe tener formato YYYY-YY con años consecutivos")
    if args.delay < 0 or args.timeout <= 0 or args.retries < 1:
        parser.error("delay debe ser >= 0, timeout > 0 y retries >= 1")
    return args


def main(argv: list[str] | None = None) -> int:
    args = arguments(argv)
    load_dotenv(args.env_file, override=False)
    database_url = os.getenv("DATABASE_URL")
    if not args.dry_run and not database_url:
        LOG.error("Falta DATABASE_URL en %s o en el entorno.", args.env_file)
        return 1
    skipped = []
    jersey_conflicts = []
    try:
        client = NBAClient(
            args.cache_dir, args.delay, args.timeout, args.retries, args.refresh
        )
        teams = fetch_teams(client, args.season)
        players = fetch_players(
            client, args.season, teams, args.as_of, ROOT / "public/players", skipped
        )
        if args.dry_run:
            if args.strict and skipped:
                raise ImportErrorNBA(
                    f"Hay {len(skipped)} jugadores con datos incompletos."
                )
            saved = players
            jersey_conflicts.extend(
                warn_jersey_conflicts(
                    [(player, None) for player in players],
                    [],
                    {team.nba_id: team.nba_id for team in teams},
                    True,
                )
            )
            LOG.info(
                "Simulación: %s equipos y %s jugadores preparados; no se ha conectado a PostgreSQL.",
                len(teams),
                len(saved),
            )
        else:
            saved = import_database(
                database_url, teams, players, skipped, args.strict, jersey_conflicts
            )
            LOG.info("Guardados %s equipos y %s jugadores.", len(teams), len(saved))
        report = {
            "season": args.season,
            "dry_run": args.dry_run,
            "teams": len(teams),
            "players": len(saved),
            "missing_images": image_report(saved, ROOT / "public"),
            "skipped_players": skipped,
            "incomplete_players": [
                {
                    "nba_id": player.nba_id,
                    "name": player.name,
                    "missing_fields": missing,
                }
                for player in saved
                if (
                    missing := [
                        field
                        for field in OPTIONAL_PLAYER_FIELDS
                        if getattr(player, field) is None
                    ]
                )
            ],
            "jersey_conflicts": jersey_conflicts,
        }
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        LOG.info(
            "Informe: %s. Fotos pendientes: %s. Jugadores omitidos: %s.",
            args.report,
            len(report["missing_images"]),
            len(skipped),
        )
        return 0
    except ImportErrorNBA as exc:
        LOG.error("%s", exc)
        if skipped:
            try:
                args.report.parent.mkdir(parents=True, exist_ok=True)
                args.report.write_text(
                    json.dumps(
                        {
                            "status": "aborted",
                            "error": str(exc),
                            "skipped_players": skipped,
                        },
                        ensure_ascii=False,
                        indent=2,
                    ),
                    encoding="utf-8",
                )
                LOG.error("Casos para revisar: %s", args.report)
            except OSError:
                LOG.error("No se pudo guardar el informe de incidencias.")
    except psycopg.Error as exc:
        LOG.error(
            "PostgreSQL (%s): %s",
            type(exc).__name__,
            exc.diag.message_primary or "Revisa DATABASE_URL, conexión y permisos.",
        )
    except OSError as exc:
        LOG.error("No se pudo leer/escribir un archivo: %s", exc)
    except KeyboardInterrupt:
        LOG.error("Importación interrumpida. Puedes repetir el comando.")
    return 1


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    sys.exit(main())
