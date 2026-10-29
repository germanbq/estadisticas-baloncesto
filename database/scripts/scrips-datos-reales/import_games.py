
"""Importa el calendario NBA y completa games, team_game_stats y player_game_stats.

py database/scripts/scrips-datos-reales/import_games.py --season 2026-27 --mode full
py database/scripts/scrips-datos-reales/import_games.py --season 2026-27 --mode update
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from collections.abc import Callable
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from functools import partial
from itertools import takewhile
from pathlib import Path
from typing import Any
from uuid import uuid4

import psycopg
from dotenv import load_dotenv
from nba_api.stats.endpoints import (
    boxscoreadvancedv3,
    boxscoresummaryv3,
    boxscoretraditionalv3,
    scheduleleaguev2,
)
from psycopg import sql

ROOT = Path(__file__).resolve().parents[3]
LOG = logging.getLogger("import_games")
FINAL = 3
CALENDAR_BATCH_SIZE = 250
TEAM_COLUMNS = (
    "possessions",
    "fg_made",
    "fg_attempted",
    "three_made",
    "three_attempted",
    "ft_made",
    "ft_attempted",
    "paint_points",
    "fastbreak_points",
    "bench_points",
    "second_chance_points",
    "effective_field_goal_percentage",
    "true_shooting_percentage",
    "offensive_rating",
    "defensive_rating",
    "rebounds",
    "assists",
    "steals",
    "tapones",
    "turnovers",
    "personal_fouls",
)
PLAYER_COLUMNS = (
    "seconds_played",
    "points",
    "rebounds",
    "ofe_rebounds",
    "def_rebounds",
    "assists",
    "steals",
    "blocks",
    "turnovers",
    "plusminus",
    "fg_made",
    "fg_attempted",
    "three_made",
    "three_attempted",
    "ft_made",
    "ft_attempted",
)
BASIC_FIELDS = {
    "fg_made": "fieldGoalsMade",
    "fg_attempted": "fieldGoalsAttempted",
    "three_made": "threePointersMade",
    "three_attempted": "threePointersAttempted",
    "ft_made": "freeThrowsMade",
    "ft_attempted": "freeThrowsAttempted",
    "rebounds": "reboundsTotal",
    "assists": "assists",
    "steals": "steals",
    "turnovers": "turnovers",
}


class ImportErrorNBA(Exception):
    pass


def decimal_number(
    value: Any, label: str, minimum: Decimal | None = Decimal(0)
) -> Decimal:
    try:
        if isinstance(value, bool) or value is None or str(value).strip() == "":
            raise ValueError
        result = Decimal(str(value))
        if not result.is_finite() or (minimum is not None and result < minimum):
            raise ValueError
        return result
    except (InvalidOperation, ValueError) as exc:
        raise ImportErrorNBA(
            f"Falta un número válido para {label}: {value!r}."
        ) from exc


def integer(value: Any, label: str, minimum: int | None = 0) -> int:
    number = decimal_number(value, label, None if minimum is None else Decimal(minimum))
    if number != number.to_integral_value() or not -(2**31) <= number < 2**31:
        raise ImportErrorNBA(f"{label} no es un entero compatible: {value!r}.")
    return int(number)


def game_id(value: Any) -> str:
    if isinstance(value, Decimal):
        if not value.is_finite() or value != value.to_integral_value():
            raise ImportErrorNBA(f"Identificador de partido inválido: {value!r}.")
        value = int(value)
    raw = str(value).strip()
    if not re.fullmatch(r"\d{1,10}", raw) or int(raw) == 0:
        raise ImportErrorNBA(f"Identificador de partido inválido: {value!r}.")
    return raw.zfill(10)


def utc_date(value: Any) -> datetime:
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        if parsed.year < 1946:
            raise ValueError
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError) as exc:
        raise ImportErrorNBA(f"Fecha UTC sin confirmar o inválida: {value!r}.") from exc


def seconds(value: Any) -> Decimal:
    
    raw = str(value).strip()
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?", raw)
    if match and any(part is not None for part in match.groups()):
        hours, minutes, secs = match.groups()
        return (
            Decimal(hours or 0) * 3600 + Decimal(minutes or 0) * 60 + Decimal(secs or 0)
        )
    match = re.fullmatch(r"(\d+):(\d+(?:\.\d+)?)", raw)
    if match and Decimal(match[2]) < 60:
        return Decimal(match[1]) * 60 + Decimal(match[2])
    raise ImportErrorNBA(f"Tiempo de juego inválido: {value!r}.")


def rounded(value: Any, label: str) -> int:
    return int(
        decimal_number(value, label).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    )


def percentage(numerator: Decimal, denominator: Decimal) -> Decimal:
    value = numerator * 100 / denominator if denominator else Decimal(0)
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class NBAClient:
    def __init__(
        self,
        cache_dir: Path,
        delay: float = 0.8,
        timeout: float = 30,
        retries: int = 3,
        refresh: bool = False,
    ):
        self.cache_dir = cache_dir
        self.delay, self.timeout, self.retries = delay, timeout, retries
        self.refresh = refresh
        self.last_request = 0.0
        self.requests = 0
        self.cache_hits = 0

    def call(self, key: str, factory: Callable, cache: bool = False) -> dict:
        path = self.cache_dir / f"{key}.json"
        if cache and not self.refresh and path.is_file():
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(payload, dict):
                    self.cache_hits += 1
                    return payload
            except (OSError, ValueError):
                pass
        for attempt in range(1, self.retries + 1):
            time.sleep(max(0, self.delay - (time.monotonic() - self.last_request)))
            self.last_request = time.monotonic()
            self.requests += 1
            try:
                payload = factory(timeout=self.timeout).get_dict()
                if not isinstance(payload, dict):
                    raise ImportErrorNBA("Respuesta NBA sin objeto JSON.")
                return payload
            except Exception as exc:
                if attempt == self.retries:
                    raise ImportErrorNBA(
                        f"No se pudo descargar {key} tras {attempt} intentos "
                        f"({type(exc).__name__})."
                    ) from exc
                LOG.warning("Reintentando %s (%s/%s)", key, attempt, self.retries)
                time.sleep(min(2**attempt, 8))
        raise AssertionError("retries debe ser positivo")

    def remember(self, key: str, payload: dict) -> None:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        path = self.cache_dir / f"{key}.json"
        temporary = path.with_name(path.name + f".{uuid4().hex}.tmp")
        try:
            temporary.write_text(json.dumps(payload), encoding="utf-8")
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)

    def forget_game(self, nba_id: str) -> None:
        for kind in (
            "live",
            "traditional",
            "advanced",
            "stats-v3-summary",
            "stats-v3-traditional",
            "stats-v3-advanced",
        ):
            (self.cache_dir / f"{kind}-{nba_id}.json").unlink(missing_ok=True)


@dataclass(frozen=True)
class Game:
    nba_id: str
    home_nba_id: int
    away_nba_id: int
    date: datetime
    season: int
    status: int


@dataclass
class FinalGame:
    game: Game
    home_score: int
    away_score: int
    home_periods: list[int]
    away_periods: list[int]
    teams: dict[int, dict]
    players: list[dict]
    omitted_players: list[dict] = field(default_factory=list)


def parse_schedule(payload: dict, season: str) -> tuple[list[Game], list[dict]]:
    year = int(season[:4])
    league = payload.get("leagueSchedule", {})
    if league.get("seasonYear") != season or str(league.get("leagueId")) != "00":
        raise ImportErrorNBA(
            "El calendario no corresponde a la temporada NBA solicitada."
        )
    dates = league.get("gameDates")
    if not isinstance(dates, list) or not dates:
        raise ImportErrorNBA("La NBA no devolvió un calendario de temporada.")
    result, unassigned, seen = [], [], set()
    for day in dates:
        for raw in day.get("games", []):
            nba_id = game_id(raw.get("gameId"))
            if not nba_id.startswith("002"):
                continue  
            if nba_id[3:5] != season[2:4]:
                raise ImportErrorNBA(f"El partido {nba_id} pertenece a otra temporada.")
            if nba_id in seen:
                raise ImportErrorNBA(f"El calendario repite el partido {nba_id}.")
            seen.add(nba_id)
            status = integer(raw.get("gameStatus"), "gameStatus", 1)
            home = integer(raw.get("homeTeam", {}).get("teamId") or 0, "equipo local")
            away = integer(
                raw.get("awayTeam", {}).get("teamId") or 0, "equipo visitante"
            )
            try:
                when = utc_date(raw.get("gameDateTimeUTC"))
            except ImportErrorNBA:
                if status == FINAL:
                    raise
                unassigned.append(
                    {"nba_id": nba_id, "reason": "Fecha/hora UTC por confirmar."}
                )
                continue
            if not home or not away:
                if status == FINAL:
                    raise ImportErrorNBA(
                        f"El partido finalizado {nba_id} no informa de sus equipos."
                    )
                unassigned.append(
                    {"nba_id": nba_id, "reason": "Equipos por confirmar."}
                )
                continue
            if home == away or when.year not in (year, year + 1):
                raise ImportErrorNBA(f"Equipos o año inválidos para {nba_id}.")
            result.append(Game(nba_id, home, away, when, year, status))
    if not result:
        raise ImportErrorNBA(
            "No hay partidos de temporada regular con equipos y fecha definidos."
        )
    return sorted(result, key=lambda g: (g.date, g.nba_id)), unassigned


def shooting(stats: dict, label: str) -> dict:
    result = {
        column: integer(stats.get(source), f"{label}.{source}")
        for column, source in BASIC_FIELDS.items()
    }
    if (
        result["fg_made"] > result["fg_attempted"]
        or result["three_made"] > result["three_attempted"]
        or result["three_attempted"] > result["fg_attempted"]
        or result["three_made"] > result["fg_made"]
        or result["ft_made"] > result["ft_attempted"]
    ):
        raise ImportErrorNBA(f"Tiros incoherentes en {label}.")
    return result


def period_scores(team: dict, count: int) -> list[int]:
    periods = team.get("periods")
    if not isinstance(periods, list):
        raise ImportErrorNBA("Faltan los puntos por período.")
    indexed = {}
    for period in periods:
        number = integer(period.get("period"), "período", 1)
        score = integer(period.get("score"), "puntos del período")
        if number in indexed or score > 32767:
            raise ImportErrorNBA("Períodos repetidos o puntuación incompatible.")
        indexed[number] = score
    if set(indexed) != set(range(1, count + 1)):
        raise ImportErrorNBA("Faltan períodos o prórrogas del partido finalizado.")
    return [indexed[number] for number in range(1, count + 1)]


def keyed_players(team: dict) -> dict[int, dict]:
    rows = team.get("players")
    if not isinstance(rows, list):
        raise ImportErrorNBA("Falta la lista de jugadores del box score.")
    result = {}
    for row in rows:
        nba_id = integer(row.get("personId"), "personId", 1)
        if nba_id in result:
            raise ImportErrorNBA(f"El box score repite al jugador {nba_id}.")
        result[nba_id] = row
    return result


def parse_final(
    game: Game,
    summary: dict,
    traditional: dict,
    advanced: dict,
    player_ids: dict[int, int],
) -> FinalGame:
    detail = summary.get("boxScoreSummary", {})
    trad = traditional.get("boxScoreTraditional", {})
    adv = advanced.get("boxScoreAdvanced", {})
    for payload in (detail, trad, adv):
        if game_id(payload.get("gameId")) != game.nba_id:
            raise ImportErrorNBA("Un box score no corresponde al partido solicitado.")
    if integer(detail.get("gameStatus"), "estado") != FINAL:
        raise ImportErrorNBA(
            "El box score todavía no confirma que el partido haya terminado."
        )
    count = integer(detail.get("period"), "último período", 4)
    game = replace(game, date=utc_date(detail.get("gameTimeUTC")))
    team_lines, player_lines, omitted, scores, periods, player_teams = (
        {},
        [],
        [],
        {},
        {},
        {},
    )
    for side, expected in (
        ("homeTeam", game.home_nba_id),
        ("awayTeam", game.away_nba_id),
    ):
        team, normal, advanced_team = (
            detail.get(side, {}),
            trad.get(side, {}),
            adv.get(side, {}),
        )
        chart = detail.get("postgameCharts", {}).get(side, {})
        for source in (team, normal, advanced_team, chart):
            if integer(source.get("teamId"), "teamId", 1) != expected:
                raise ImportErrorNBA(
                    "Los equipos del calendario y del box score no coinciden."
                )
        extra_stats, stats, a_stats = (
            chart.get("statistics", {}),
            normal.get("statistics", {}),
            advanced_team.get("statistics", {}),
        )
        score = integer(team.get("score"), "marcador")
        traditional_score = integer(stats.get("points"), "puntos del equipo")
        if traditional_score != score:
            raise ImportErrorNBA(
                f"Partido {game.nba_id}, equipo {expected}: "
                f"SummaryV3 indica {score} puntos y TraditionalV3 {traditional_score}."
            )
        line = shooting(stats, str(expected))
        if 2 * line["fg_made"] + line["three_made"] + line["ft_made"] != score:
            raise ImportErrorNBA("Los tiros no suman los puntos del equipo.")
        line.update(
            {
                "possessions": integer(a_stats.get("possessions"), "posesiones", 1),
                "paint_points": integer(
                    extra_stats.get("pointsInThePaint"), "puntos en la pintura"
                ),
                "fastbreak_points": integer(
                    extra_stats.get("pointsFastBreak"), "puntos al contraataque"
                ),
                "bench_points": integer(
                    extra_stats.get("benchPoints"), "puntos del banquillo"
                ),
                "second_chance_points": integer(
                    extra_stats.get("pointsSecondChance"), "segunda oportunidad"
                ),
                "effective_field_goal_percentage": percentage(
                    Decimal(line["fg_made"]) + Decimal("0.5") * line["three_made"],
                    Decimal(line["fg_attempted"]),
                ),
                "true_shooting_percentage": percentage(
                    Decimal(score),
                    2
                    * (
                        Decimal(line["fg_attempted"])
                        + Decimal("0.44") * line["ft_attempted"]
                    ),
                ),
                "offensive_rating": rounded(
                    a_stats.get("offensiveRating"), "rating ofensivo"
                ),
                "defensive_rating": rounded(
                    a_stats.get("defensiveRating"), "rating defensivo"
                ),
                "tapones": integer(stats.get("blocks"), "tapones"),
                "personal_fouls": integer(stats.get("foulsPersonal"), "faltas"),
            }
        )
        for key in (
            "paint_points",
            "fastbreak_points",
            "bench_points",
            "second_chance_points",
        ):
            if line[key] > score:
                raise ImportErrorNBA(f"{key} supera los puntos del equipo.")
        scores[side], periods[side] = score, period_scores(team, count)
        if sum(periods[side]) != score:
            raise ImportErrorNBA(
                f"Partido {game.nba_id}, equipo {expected}: los parciales "
                f"{periods[side]} suman {sum(periods[side])}, pero el marcador es {score}."
            )
        team_lines[expected] = line
        trad_players = keyed_players(normal)
        if not trad_players:
            raise ImportErrorNBA("El box score final aún no contiene los jugadores.")
        player_points = sum(
            integer(
                player.get("statistics", {}).get("points")
                if player.get("statistics", {}).get("points") not in (None, "")
                else 0,
                "puntos del jugador",
            )
            for player in trad_players.values()
        )
        if player_points != score:
            raise ImportErrorNBA(
                f"Partido {game.nba_id}, equipo {expected}: los jugadores suman "
                f"{player_points} puntos y el equipo {score}."
            )
        for nba_id in sorted(trad_players):
            if nba_id in player_teams and player_teams[nba_id] != expected:
                raise ImportErrorNBA(
                    "Un jugador aparece en ambos equipos del mismo partido."
                )
            player_teams[nba_id] = expected
            traditional_person = trad_players[nba_id]
            values = traditional_person.get("statistics", {})
            duration = values.get("minutes")
            actual_seconds = (
                seconds(duration) if duration not in (None, "") else Decimal(0)
            )
            has_statistics = any(
                decimal_number(values.get(key, 0), key) > 0
                for key in (
                    "points",
                    "fieldGoalsAttempted",
                    "freeThrowsAttempted",
                    "reboundsTotal",
                    "assists",
                    "steals",
                    "blocks",
                    "turnovers",
                    "foulsPersonal",
                )
                if values.get(key) not in (None, "")
            )
            if actual_seconds == 0 and has_statistics:
                raise ImportErrorNBA(
                    f"Partido {game.nba_id}: el jugador {nba_id} tiene estadísticas "
                    "pero no informa de un tiempo de juego positivo."
                )
            if actual_seconds == 0:
                continue
            if nba_id not in player_ids:
                if actual_seconds > 0:
                    name = " ".join(
                        str(traditional_person.get(k) or "")
                        for k in ("firstName", "familyName")
                    ).strip() or str(nba_id)
                    omitted.append(
                        {
                            "nba_id": nba_id,
                            "name": name,
                            "game_nba_id": game.nba_id,
                            "team_nba_id": expected,
                            "seconds_played": str(actual_seconds),
                        }
                    )
                continue
            p_line = shooting(values, str(nba_id))
            p_line.update(
                {
                    "player_id": player_ids[nba_id],
                    "nba_id": nba_id,
                    "team_nba_id": expected,
                    "seconds_played": int(
                        actual_seconds.quantize(Decimal(1), rounding=ROUND_HALF_UP)
                    ),
                    "points": integer(values.get("points"), "puntos del jugador"),
                    "ofe_rebounds": integer(
                        values.get("reboundsOffensive"), "rebotes ofensivos"
                    ),
                    "def_rebounds": integer(
                        values.get("reboundsDefensive"), "rebotes defensivos"
                    ),
                    "blocks": integer(values.get("blocks"), "tapones del jugador"),
                    "plusminus": integer(values.get("plusMinusPoints"), "+/-", None),
                }
            )
            if p_line["rebounds"] != p_line["ofe_rebounds"] + p_line["def_rebounds"]:
                raise ImportErrorNBA(f"Los rebotes del jugador {nba_id} no cuadran.")
            if (
                2 * p_line["fg_made"] + p_line["three_made"] + p_line["ft_made"]
                != p_line["points"]
            ):
                raise ImportErrorNBA(
                    f"Los tiros del jugador {nba_id} no suman sus puntos."
                )
            player_lines.append(p_line)
    if scores["homeTeam"] == scores["awayTeam"]:
        raise ImportErrorNBA("Un partido NBA finalizado no puede terminar empatado.")
    return FinalGame(
        game,
        scores["homeTeam"],
        scores["awayTeam"],
        periods["homeTeam"],
        periods["awayTeam"],
        team_lines,
        player_lines,
        omitted,
    )


def fetch_final(client: NBAClient, game: Game, player_ids: dict[int, int]) -> FinalGame:
    sources = (
        ("summary", partial(boxscoresummaryv3.BoxScoreSummaryV3, game_id=game.nba_id)),
        (
            "traditional",
            partial(boxscoretraditionalv3.BoxScoreTraditionalV3, game_id=game.nba_id),
        ),
        (
            "advanced",
            partial(boxscoreadvancedv3.BoxScoreAdvancedV3, game_id=game.nba_id),
        ),
    )
    payloads = [
        client.call(f"stats-v3-{kind}-{game.nba_id}", factory, cache=True)
        for kind, factory in sources
    ]
    try:
        result = parse_final(game, *payloads, player_ids)
    except ImportErrorNBA:
        client.forget_game(game.nba_id)
        raise
    
    for (kind, _), payload in zip(sources, payloads, strict=True):
        client.remember(f"stats-v3-{kind}-{game.nba_id}", payload)
    return result


@dataclass
class DatabaseState:
    team_ids: dict[int, int]
    player_ids: dict[int, int]
    game_id_is_text: bool
    games: dict[str, dict]

    def db_id(self, nba_id: str) -> str | int:
        return nba_id if self.game_id_is_text else int(nba_id)


def check_database(cursor, season: int) -> DatabaseState:
    required = {
        "teams": {"id", "nba_id"},
        "players": {"id", "nba_id"},
        "games": {
            "id",
            "nba_id",
            "home_team_id",
            "away_team_id",
            "date",
            "season_init_year",
            "finished",
            "home_score",
            "away_score",
            "home_period_scores",
            "away_period_scores",
        },
        "team_game_stats": {"team_id", "game_id", *TEAM_COLUMNS},
        "player_game_stats": {"player_id", "game_id", "team_id", *PLAYER_COLUMNS},
        "team_season_stats": {
            "team_id",
            "season_init_year",
            "streak_number",
            "streak_victory",
        },
        "player_season_stats": {"player_id", "season_init_year"},
    }
    cursor.execute("""SELECT table_name,column_name,data_type FROM information_schema.columns
                      WHERE table_schema=current_schema()""")
    columns = {(table, column): kind for table, column, kind in cursor.fetchall()}
    for table, names in required.items():
        missing = names - {column for t, column in columns if t == table}
        if missing:
            raise ImportErrorNBA(
                f"Faltan columnas de {table}: {', '.join(sorted(missing))}."
            )
    kind = columns[("games", "nba_id")]
    if kind not in (
        "text",
        "character varying",
        "character",
        "integer",
        "bigint",
        "numeric",
    ):
        raise ImportErrorNBA(
            "games.nba_id debe ser texto o un tipo numérico entero compatible."
        )
    maps = []
    for table in ("teams", "players"):
        cursor.execute(
            sql.SQL("SELECT id,nba_id FROM {} WHERE nba_id IS NOT NULL").format(
                sql.Identifier(table)
            )
        )
        mapping = {}
        for local_id, nba_id in cursor.fetchall():
            nba_id = integer(nba_id, f"{table}.nba_id", 1)
            if nba_id in mapping:
                raise ImportErrorNBA(f"Hay nba_id repetidos en {table}.")
            mapping[nba_id] = local_id
        maps.append(mapping)
    cursor.execute(
        """SELECT g.id,g.nba_id,g.home_team_id,g.away_team_id,g.date,g.season_init_year,
                             g.finished,g.home_score,g.away_score,g.home_period_scores,g.away_period_scores,
                             (SELECT COUNT(*) FROM team_game_stats t WHERE t.game_id=g.id)
                      FROM games g WHERE g.season_init_year=%s""",
        (season,),
    )
    games = {}
    keys = (
        "id",
        "nba_id",
        "home_id",
        "away_id",
        "date",
        "season",
        "finished",
        "home_score",
        "away_score",
        "home_periods",
        "away_periods",
        "team_rows",
    )
    for raw in cursor.fetchall():
        row = dict(zip(keys, raw, strict=True))
        nba_id = game_id(row["nba_id"])
        if nba_id in games:
            raise ImportErrorNBA("Hay nba_id de partido repetidos al normalizarlos.")
        games[nba_id] = row
    
    cursor.execute("""SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                      JOIN pg_namespace n ON n.oid=c.relnamespace
                      WHERE n.nspname=current_schema() AND NOT t.tgisinternal AND t.tgenabled <> 'D'""")
    triggers = {row[0] for row in cursor.fetchall()}
    needed = {
        "trg_finish_game_update_team_season_stats",
        "trg_update_team_season_stats_from_game_stats",
        "trg_update_player_season_stats",
        "check_player_game_team",
    }
    if needed - triggers:
        raise ImportErrorNBA(
            "Faltan triggers del repositorio: " + ", ".join(sorted(needed - triggers))
        )
    return DatabaseState(
        maps[0], maps[1], kind in ("text", "character varying", "character"), games
    )


def verify_identity(game: Game, old: dict | None, state: DatabaseState) -> None:
    if old and (old["home_id"], old["away_id"], old["season"]) != (
        state.team_ids[game.home_nba_id],
        state.team_ids[game.away_nba_id],
        game.season,
    ):
        raise ImportErrorNBA(
            f"El nba_id {game.nba_id} ya corresponde a otros equipos o temporada en tu BD."
        )


def sync_calendar(connection, game: Game, state: DatabaseState) -> str:
    with connection.transaction(), connection.cursor() as cursor:
        cursor.execute(
            """SELECT id,home_team_id,away_team_id,season_init_year,finished,date
                          FROM games WHERE nba_id=%s FOR UPDATE""",
            (state.db_id(game.nba_id),),
        )
        old = cursor.fetchone()
        if old:
            old_dict = dict(
                zip(
                    ("id", "home_id", "away_id", "season", "finished", "date"),
                    old,
                    strict=True,
                )
            )
            verify_identity(game, old_dict, state)
            if old_dict["finished"] or old_dict["date"] == game.date:
                return "unchanged"
            cursor.execute(
                "UPDATE games SET date=%s WHERE id=%s", (game.date, old_dict["id"])
            )
            return "updated"
        cursor.execute(
            """INSERT INTO games
                          (nba_id,home_team_id,away_team_id,date,season_init_year,finished)
                          VALUES (%s,%s,%s,%s,%s,FALSE)""",
            (
                state.db_id(game.nba_id),
                state.team_ids[game.home_nba_id],
                state.team_ids[game.away_nba_id],
                game.date,
                game.season,
            ),
        )
        return "inserted"


def sync_calendar_batch(
    connection, games: list[Game], state: DatabaseState
) -> dict[str, str]:
    
    if not games:
        return {}
    actions = {}
    with connection.transaction(), connection.cursor() as cursor:
        
        
        cursor.execute("LOCK TABLE games IN SHARE ROW EXCLUSIVE MODE")
        cursor.execute(
            """SELECT nba_id,id,home_team_id,away_team_id,season_init_year,finished,date
               FROM games WHERE nba_id=ANY(%s)""",
            ([state.db_id(game.nba_id) for game in games],),
        )
        existing = {
            game_id(row[0]): dict(
                zip(
                    ("id", "home_id", "away_id", "season", "finished", "date"),
                    row[1:],
                    strict=True,
                )
            )
            for row in cursor.fetchall()
        }
        inserts, updates = [], []
        for game in games:
            old = existing.get(game.nba_id)
            verify_identity(game, old, state)
            if old is None:
                actions[game.nba_id] = "inserted"
                inserts.append(
                    (
                        state.db_id(game.nba_id),
                        state.team_ids[game.home_nba_id],
                        state.team_ids[game.away_nba_id],
                        game.date,
                        game.season,
                    )
                )
            elif old["finished"] or old["date"] == game.date:
                actions[game.nba_id] = "unchanged"
            else:
                actions[game.nba_id] = "updated"
                updates.append((old["id"], game.date))
        if inserts:
            cursor.execute(
                sql.SQL("""INSERT INTO games
                           (nba_id,home_team_id,away_team_id,date,season_init_year,finished)
                           VALUES {}""").format(
                    sql.SQL(",").join(
                        sql.SQL("(%s,%s,%s,%s,%s,FALSE)") for _ in inserts
                    )
                ),
                tuple(value for row in inserts for value in row),
            )
        if updates:
            cursor.execute(
                sql.SQL("""UPDATE games AS g SET date=incoming.date
                           FROM (VALUES {}) AS incoming(id,date)
                           WHERE g.id=incoming.id""").format(
                    sql.SQL(",").join(
                        sql.SQL("(%s::bigint,%s::timestamptz)") for _ in updates
                    )
                ),
                tuple(value for row in updates for value in row),
            )
    return actions


def synchronize_calendar(
    connection, games: list[Game], state: DatabaseState, dry_run: bool = False
) -> tuple[dict[str, int], set[str], list[dict]]:
    counts = {"inserted": 0, "updated": 0, "unchanged": 0}
    blocked, errors, pending = set(), [], []

    def record_error(game: Game, exc: Exception) -> None:
        message = (
            exc.diag.message_primary if isinstance(exc, psycopg.Error) else str(exc)
        )
        blocked.add(game.nba_id)
        errors.append({"nba_id": game.nba_id, "stage": "calendar", "reason": message})
        LOG.error("Calendario %s: %s", game.nba_id, message)

    for game in games:
        try:
            old = state.games.get(game.nba_id)
            verify_identity(game, old, state)
            if old and (old["finished"] or old["date"] == game.date):
                counts["unchanged"] += 1
            elif dry_run:
                counts["updated" if old else "inserted"] += 1
            else:
                pending.append(game)
        except ImportErrorNBA as exc:
            record_error(game, exc)

    for start in range(0, len(pending), CALENDAR_BATCH_SIZE):
        batch = pending[start : start + CALENDAR_BATCH_SIZE]
        try:
            actions = sync_calendar_batch(connection, batch, state)
        except (ImportErrorNBA, psycopg.Error):
            if connection.closed:
                raise
            
            for game in batch:
                try:
                    counts[sync_calendar(connection, game, state)] += 1
                except (ImportErrorNBA, psycopg.Error) as exc:
                    record_error(game, exc)
        else:
            for action in actions.values():
                counts[action] += 1
    return counts, blocked, errors


def insert_stat(
    cursor,
    table: str,
    key_columns: tuple[str, ...],
    key_values: tuple,
    columns: tuple[str, ...],
    values: tuple,
) -> int:
    
    all_columns = key_columns + columns
    cursor.execute(
        sql.SQL("INSERT INTO {} ({}) VALUES ({}) ON CONFLICT ({}) DO NOTHING").format(
            sql.Identifier(table),
            sql.SQL(",").join(map(sql.Identifier, all_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in all_columns),
            sql.SQL(",").join(map(sql.Identifier, key_columns[:2])),
        ),
        key_values + values,
    )
    return cursor.rowcount


def refresh_streaks(cursor, team_ids: tuple[int, int], season: int) -> None:
    
    for team_id in sorted(team_ids):
        cursor.execute(
            """SELECT CASE WHEN home_team_id=%s THEN home_score>away_score
                                     ELSE away_score>home_score END AS won
                          FROM games WHERE finished AND season_init_year=%s
                            AND (home_team_id=%s OR away_team_id=%s)
                          ORDER BY date DESC,id DESC""",
            (team_id, season, team_id, team_id),
        )
        results = [row[0] for row in cursor.fetchall()]
        if results:
            streak = sum(
                1
                for _ in takewhile(
                    lambda won, latest=results[0]: won == latest, results
                )
            )
            cursor.execute(
                """UPDATE team_season_stats SET streak_number=%s,streak_victory=%s
                              WHERE team_id=%s AND season_init_year=%s""",
                (streak, results[0], team_id, season),
            )


def persist_final(connection, final: FinalGame, state: DatabaseState) -> dict:
    game = final.game
    home, away = state.team_ids[game.home_nba_id], state.team_ids[game.away_nba_id]
    result = {
        "team_rows_inserted": 0,
        "player_rows_inserted": 0,
        "newly_finished": False,
    }
    with connection.transaction(), connection.cursor() as cursor:
        
        cursor.execute(
            "LOCK TABLE games,team_game_stats,player_game_stats IN SHARE ROW EXCLUSIVE MODE"
        )
        cursor.execute(
            """SELECT id,home_team_id,away_team_id,season_init_year,finished,
                                 home_score,away_score,home_period_scores,away_period_scores
                          FROM games WHERE nba_id=%s FOR UPDATE""",
            (state.db_id(game.nba_id),),
        )
        raw = cursor.fetchone()
        if raw is None:
            raise ImportErrorNBA(
                "El partido debe existir en el calendario antes de completar sus datos."
            )
        old = dict(
            zip(
                (
                    "id",
                    "home_id",
                    "away_id",
                    "season",
                    "finished",
                    "home_score",
                    "away_score",
                    "home_periods",
                    "away_periods",
                ),
                raw,
                strict=True,
            )
        )
        verify_identity(game, old, state)
        if old["finished"] and (
            old["home_score"],
            old["away_score"],
            old["home_periods"],
            old["away_periods"],
        ) != (
            final.home_score,
            final.away_score,
            final.home_periods,
            final.away_periods,
        ):
            raise ImportErrorNBA(
                "El resultado final ya guardado difiere del box score recibido; se conserva la BD."
            )
        for nba_id in sorted(final.teams, key=lambda x: state.team_ids[x]):
            line = final.teams[nba_id]
            result["team_rows_inserted"] += insert_stat(
                cursor,
                "team_game_stats",
                ("team_id", "game_id"),
                (state.team_ids[nba_id], old["id"]),
                TEAM_COLUMNS,
                tuple(line[k] for k in TEAM_COLUMNS),
            )
        for line in sorted(final.players, key=lambda x: x["player_id"]):
            result["player_rows_inserted"] += insert_stat(
                cursor,
                "player_game_stats",
                ("player_id", "game_id", "team_id"),
                (line["player_id"], old["id"], state.team_ids[line["team_nba_id"]]),
                PLAYER_COLUMNS,
                tuple(line[k] for k in PLAYER_COLUMNS),
            )
        
        if not old["finished"]:
            cursor.execute(
                """UPDATE games SET date=%s,home_score=%s,away_score=%s,
                              home_period_scores=%s,away_period_scores=%s,finished=TRUE WHERE id=%s""",
                (
                    game.date,
                    final.home_score,
                    final.away_score,
                    final.home_periods,
                    final.away_periods,
                    old["id"],
                ),
            )
            result["newly_finished"] = True
            refresh_streaks(cursor, (home, away), game.season)
    return result


def write_report(path: Path, report: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f".{uuid4().hex}.tmp")
    try:
        temporary.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def run(args, client: NBAClient, now: datetime | None = None) -> tuple[int, dict]:
    started = now or datetime.now(timezone.utc)
    report = {
        "season": args.season,
        "mode": args.mode,
        "statistics_source": "NBA Stats V3: Summary, Traditional, Advanced",
        "dry_run": args.dry_run,
        "started_at_utc": started.isoformat(),
        "calendar": {},
        "completed_games": [],
        "omitted_players": [],
        "unassigned_games": [],
        "errors": [],
    }
    payload = client.call(
        "schedule-" + args.season,
        partial(scheduleleaguev2.ScheduleLeagueV2, season=args.season),
    )
    games, report["unassigned_games"] = parse_schedule(payload, args.season)
    LOG.info(
        "Calendario: %s partidos definidos; %s por confirmar.",
        len(games),
        len(report["unassigned_games"]),
    )
    with psycopg.connect(
        os.environ["DATABASE_URL"],
        connect_timeout=10,
        autocommit=True,
        prepare_threshold=None,
    ) as connection:
        with connection.transaction(), connection.cursor() as cursor:
            if args.dry_run:
                cursor.execute("SET TRANSACTION READ ONLY")
            state = check_database(cursor, int(args.season[:4]))
        missing_teams = {
            team for g in games for team in (g.home_nba_id, g.away_nba_id)
        } - state.team_ids.keys()
        if missing_teams:
            raise ImportErrorNBA(
                "Importa primero los equipos que faltan en teams.nba_id: "
                + ", ".join(map(str, sorted(missing_teams)))
            )
        if args.mode == "update" and not any(
            row["season"] == int(args.season[:4]) for row in state.games.values()
        ):
            raise ImportErrorNBA(
                "No hay calendario de esta temporada en tu BD. Ejecuta primero --mode full."
            )
        counts, blocked, calendar_errors = synchronize_calendar(
            connection, games, state, args.dry_run
        )
        report["errors"].extend(calendar_errors)
        report["calendar"] = counts
        finals = [g for g in games if g.status == FINAL and g.nba_id not in blocked]
        if args.mode == "update":
            finals = [
                g
                for g in finals
                if not (
                    state.games.get(g.nba_id, {}).get("finished")
                    and state.games[g.nba_id]["team_rows"] == 2
                )
            ]
        report["final_games_to_check"] = len(finals)
        for number, game in enumerate(finals, 1):
            LOG.info("Partido final %s/%s: %s", number, len(finals), game.nba_id)
            try:
                if game.date > started:
                    raise ImportErrorNBA(
                        "La API indica Final para una fecha posterior a esta ejecución."
                    )
                final = fetch_final(client, game, state.player_ids)
                report["omitted_players"].extend(final.omitted_players)
                for person in final.omitted_players:
                    LOG.warning(
                        "AVISO: %s (nba_id=%s) jugó %s segundos en el partido %s. "
                        "Se omiten sus estadísticas porque no existe en players.",
                        person["name"],
                        person["nba_id"],
                        person["seconds_played"],
                        game.nba_id,
                    )
                outcome = (
                    {
                        "team_rows_prepared": 2,
                        "player_rows_prepared": len(final.players),
                    }
                    if args.dry_run
                    else persist_final(connection, final, state)
                )
                report["completed_games"].append({"nba_id": game.nba_id, **outcome})
            except (ImportErrorNBA, psycopg.Error) as exc:
                message = (
                    exc.diag.message_primary
                    if isinstance(exc, psycopg.Error)
                    else str(exc)
                )
                report["errors"].append(
                    {"nba_id": game.nba_id, "stage": "statistics", "reason": message}
                )
                LOG.error("Partido %s pendiente de completar: %s", game.nba_id, message)
    report["finished_at_utc"] = datetime.now(timezone.utc).isoformat()
    report["api_requests"], report["cache_hits"] = client.requests, client.cache_hits
    return (2 if report["errors"] else 0), report


def arguments(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--season", required=True, help="Temporada, por ejemplo 2026-27"
    )
    parser.add_argument("--mode", required=True, choices=("full", "update"))
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.local")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / ".nba-games-cache")
    parser.add_argument(
        "--report", type=Path, default=Path(__file__).resolve().parent / "nba_games_import_report.json"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Lee la BD y consulta la API sin escribir en PostgreSQL",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Ignora las respuestas finales guardadas en caché",
    )
    parser.add_argument("--delay", type=float, default=0.8)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--retries", type=int, default=3)
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
    if not os.getenv("DATABASE_URL"):
        LOG.error("Falta DATABASE_URL en %s o en el entorno.", args.env_file)
        return 1
    try:
        client = NBAClient(
            args.cache_dir, args.delay, args.timeout, args.retries, args.refresh
        )
        code, report = run(args, client)
        write_report(args.report, report)
        LOG.info(
            "%s: %s partidos finales revisados; %s avisos de jugadores; %s errores. Informe: %s",
            "Simulación" if args.dry_run else "Importación",
            len(report["completed_games"]),
            len(report["omitted_players"]),
            len(report["errors"]),
            args.report,
        )
        return code
    except ImportErrorNBA as exc:
        LOG.error("%s", exc)
    except psycopg.Error as exc:
        LOG.error(
            "PostgreSQL (%s): %s",
            type(exc).__name__,
            exc.diag.message_primary or "Revisa conexión y permisos.",
        )
    except OSError as exc:
        LOG.error("Error de archivos: %s", exc)
    except KeyboardInterrupt:
        LOG.error("Importación interrumpida; puedes repetir el comando para continuar.")
    return 1


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    sys.exit(main())
