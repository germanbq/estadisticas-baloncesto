#!/usr/bin/env python3
"""
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

ROOT = Path(__file__).resolve().parents[2]
LOG = logging.getLogger("import_nba")


class ImportErrorNBA(Exception):
    """Datos incompletos o incompatibles: no se deben guardar."""


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
        """Reintenta peticiones y guarda respuestas para poder reanudar una descarga."""
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
    height: Decimal
    weight: Decimal
    age: int
    draft: int
    team_nba_id: int | None
    country: str
    jersey_number: str
    position: str
    image: str


def normalized(value: str) -> str:
    """Hace coincidir Nikola Jokić, Nikola Jokic y Nikola_Jokic.webp."""
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
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
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
    if raw in ("PG", "SG", "SF", "PF", "C"):
        return raw
    primary = raw.split("-")[0].strip()
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


def compatible_position(incoming: str, existing: str | None) -> str:
    
    family = {"PG": "G", "SG": "G", "SF": "F", "PF": "F", "C": "C"}
    return existing if family.get(existing) == incoming else incoming


def parse_player(
    index: dict, roster: dict, extra: dict, as_of: date, image_dir: Path
) -> Player:
    nba_id = integer(index["PERSON_ID"], "PERSON_ID")
    name = text(
        " ".join(
            str(index.get(key) or "").strip()
            for key in ("PLAYER_FIRST_NAME", "PLAYER_LAST_NAME")
        ),
        "nombre",
    )
    born = birth_date(roster.get("BIRTH_DATE") or extra.get("BIRTHDATE"))
    age = as_of.year - born.year - ((as_of.month, as_of.day) < (born.month, born.day))
    if age <= 0:
        raise ImportErrorNBA(f"Edad inválida para {name}.")
    jersey = next(
        (
            str(v).strip()
            for v in (
                roster.get("NUM"),
                index.get("JERSEY_NUMBER"),
                extra.get("JERSEY"),
            )
            if v is not None and str(v).strip()
        ),
        "",
    )
    if not re.fullmatch(r"\d{1,2}", jersey):
        raise ImportErrorNBA(
            "La NBA aún no informa de un dorsal válido; tu esquema lo exige."
        )
    draft = index.get("DRAFT_YEAR")
    
    draft = (
        integer(draft, "draft")
        if draft not in (None, "", "Undrafted", "UNDRAFTED")
        else 0
    )
    team_id = integer(index.get("TEAM_ID") or 0, "TEAM_ID") or None
    return Player(
        nba_id,
        name,
        measurement(
            index.get("HEIGHT") or roster.get("HEIGHT") or extra.get("HEIGHT"), "height"
        ),
        measurement(
            index.get("WEIGHT") or roster.get("WEIGHT") or extra.get("WEIGHT"), "weight"
        ),
        age,
        draft,
        team_id,
        text(index.get("COUNTRY") or extra.get("COUNTRY"), "país"),
        jersey,
        position(
            index.get("POSITION") or roster.get("POSITION") or extra.get("POSITION")
        ),
        player_image(name, image_dir),
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
        )
        if needs_extra:
            payload = client.call(
                f"player-{nba_id}",
                partial(commonplayerinfo.CommonPlayerInfo, player_id=nba_id),
                ttl=86400,
            )
            extras = dataset_rows(payload, "CommonPlayerInfo")
            if (
                len(extras) != 1
                or integer(extras[0]["PERSON_ID"], "PERSON_ID") != nba_id
            ):
                raise ImportErrorNBA(f"Ficha individual incorrecta para {nba_id}.")
            extra = extras[0]
        try:
            player = parse_player(row, roster, extra, as_of, image_dir)
            if player.team_nba_id is not None and player.team_nba_id not in {
                team.nba_id for team in teams
            }:
                raise ImportErrorNBA(
                    "El equipo del jugador no pertenece a los equipos importados."
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
    """Solo comprueba columnas; no crea ni modifica el esquema. Devuelve si el dorsal es texto."""
    cursor.execute("""SELECT table_name,column_name,data_type FROM information_schema.columns
                   WHERE table_schema=current_schema() AND table_name IN ('teams','players')""")
    columns = {(table, column): kind for table, column, kind in cursor.fetchall()}
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
    return columns.get(("players", "jersey_number")) in (
        "text",
        "character varying",
        "character",
    )


def match_players(
    cursor, players: list[Player]
) -> tuple[list[tuple[Player, int | None]], list[tuple]]:
    cursor.execute(
        "SELECT id,nba_id,name,image,position,team_id,jersey_number FROM players ORDER BY id"
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
        matched.append((player, old[0] if old else None))
    return matched, existing


def compatible_jerseys(
    matched: list[tuple[Player, int | None]],
    existing: list[tuple],
    mapping: dict[int, int],
    textual: bool,
    skipped: list[dict],
) -> list[tuple[Player, int | None]]:
    def key(player):
        return (
            mapping.get(player.team_nba_id),
            player.jersey_number if textual else int(player.jersey_number),
        )

    groups = defaultdict(list)
    for item in matched:
        if item[0].team_nba_id is not None:
            groups[key(item[0])].append(item)
    excluded = set()
    for group in groups.values():
        if len(group) <= 1:
            continue
        old_players = [item for item in group if item[1] is not None]
        keep = old_players[0][0].nba_id if len(old_players) == 1 else None
        for player, _ in group:
            if player.nba_id != keep:
                excluded.add(player.nba_id)
                skipped.append(
                    {
                        "nba_id": player.nba_id,
                        "name": player.name,
                        "reason": "Dorsal repetido para el mismo equipo. Tu UNIQUE(team_id, jersey_number) no lo permite; INTEGER también identifica 0 y 00 como iguales.",
                    }
                )
    candidates = [item for item in matched if item[0].nba_id not in excluded]
    
    while True:
        updated_ids = {local_id for _, local_id in candidates if local_id is not None}
        occupied = {
            (row[5], str(row[6]) if textual else int(row[6]))
            for row in existing
            if row[0] not in updated_ids and row[5] is not None
        }
        blocked = [
            item
            for item in candidates
            if item[0].team_nba_id is not None and key(item[0]) in occupied
        ]
        if not blocked:
            return candidates
        blocked_ids = {player.nba_id for player, _ in blocked}
        for player, _ in blocked:
            skipped.append(
                {
                    "nba_id": player.nba_id,
                    "name": player.name,
                    "reason": "El dorsal de destino está ocupado por un jugador existente que no se actualiza.",
                }
            )
        candidates = [item for item in candidates if item[0].nba_id not in blocked_ids]


def save_players(
    cursor,
    players: list[Player],
    mapping: dict[int, int],
    textual: bool,
    skipped: list[dict],
    strict: bool = False,
) -> list[Player]:
    matched, existing = match_players(cursor, players)
    compatible = compatible_jerseys(matched, existing, mapping, textual, skipped)
    if strict and skipped:
        raise ImportErrorNBA(
            f"Hay {len(skipped)} jugadores incompatibles. Consulta el informe o ejecuta sin --strict para omitirlos."
        )
    
    local_ids = [local_id for _, local_id in compatible if local_id is not None]
    if local_ids:
        cursor.execute("UPDATE players SET team_id=NULL WHERE id=ANY(%s)", (local_ids,))
    for player, local_id in compatible:
        values = (
            player.nba_id,
            player.name,
            player.height,
            player.weight,
            player.age,
            player.draft,
            mapping.get(player.team_nba_id),
            player.country,
            player.jersey_number if textual else int(player.jersey_number),
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
    return [player for player, _ in compatible]


def import_database(
    database_url: str,
    teams: list[Team],
    players: list[Player],
    skipped: list[dict],
    strict: bool = False,
) -> list[Player]:
    with psycopg.connect(
        database_url, connect_timeout=10, prepare_threshold=None
    ) as connection:
        with connection.cursor() as cursor:
            textual = check_schema(cursor)
            cursor.execute("LOCK TABLE teams,players IN SHARE ROW EXCLUSIVE MODE")
            mapping = save_teams(cursor, teams)
            saved = save_players(cursor, players, mapping, textual, skipped, strict)
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
        "--report", type=Path, default=ROOT / "database/scripts/nba_import_report.json"
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
        help="Abortar si algún jugador no se puede guardar",
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
            LOG.info(
                "Simulación: %s equipos y %s jugadores preparados; no se ha conectado a PostgreSQL.",
                len(teams),
                len(saved),
            )
        else:
            saved = import_database(database_url, teams, players, skipped, args.strict)
            LOG.info("Guardados %s equipos y %s jugadores.", len(teams), len(saved))
        report = {
            "season": args.season,
            "dry_run": args.dry_run,
            "teams": len(teams),
            "players": len(saved),
            "missing_images": image_report(saved, ROOT / "public"),
            "skipped_players": skipped,
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
