"""Completar partidos de la BD con estadísticas ficticias coherentes.

    py database/scripts/generate_game_stats.py --season 2025-26
    py database/scripts/generate_game_stats.py --season 2026-27
    py database/scripts/generate_game_stats.py --season 2026-27 --dry-run --limit 5

Lee games: temporada solicitada, jornadas cerradas a las 10:00, finished=false.
No descarga estadísticas reales, no crea partidos ni cambia el esquema.
Requiere rosters.py junto al script y una importación de referencias confirmada.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, time, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
import json
import logging
import os
from pathlib import Path
import platform
import random
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rosters import RosterError, atomic_bytes, atomic_json, normalize_season, utc_now

VERSION = "1.0.0"
ROOT = Path(__file__).resolve().parents[2]
LOG = logging.getLogger("simulation")
TEAM_SCORE_MIN, TEAM_SCORE_MAX, PLAYER_POINT_MAX = 80, 145, 50
REQUIRED = {
    "teams": {"id", "short_name"},
    "players": {"id", "name", "position"},
    "games": {"id", "date", "season_init_year", "home_team_id", "away_team_id", "finished",
              "home_score", "away_score", "home_period_scores", "away_period_scores"},
    "player_game_stats": {"player_id", "game_id", "team_id", "seconds_played", "points", "rebounds",
        "ofe_rebounds", "def_rebounds", "assists", "steals", "blocks", "turnovers", "plusminus",
        "fg_made", "fg_attempted", "three_made", "three_attempted", "ft_made", "ft_attempted"},
    "team_game_stats": {"team_id", "game_id", "possessions", "fg_made", "fg_attempted", "three_made",
        "three_attempted", "ft_made", "ft_attempted", "paint_points", "fastbreak_points", "bench_points",
        "second_chance_points", "effective_field_goal_percentage", "true_shooting_percentage",
        "offensive_rating", "defensive_rating", "rebounds", "assists", "steals", "tapones",
        "turnovers", "personal_fouls"},
    "player_season_stats": {"player_id", "season_init_year", "total_points", "total_rebounds",
        "total_ofe_rebounds", "total_def_rebounds", "total_assists", "total_steals", "total_blocks",
        "total_turnovers", "plusminus", "total_fg_made", "total_fg_attempted", "total_three_made",
        "total_three_attempted", "games_played"},
    "team_season_stats": {"team_id", "season_init_year", "victorys", "losses", "home_victory", "home_losses",
        "streak_number", "streak_victory", "total_points", "total_points_allowed", "total_possessions",
        "total_opponent_possessions"},
}
PLAYER_FIELDS = tuple(sorted(REQUIRED["player_game_stats"] - {"game_id", "team_id"}))
TEAM_FIELDS = tuple(sorted(REQUIRED["team_game_stats"] - {"game_id", "team_id"}))


class SimulationError(RuntimeError):
    pass


def integer(value, label):
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise SimulationError(f"Identificador no válido: {label}.")
    return value


def load_json(raw):
    try:
        result = json.loads(raw, parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
        if not isinstance(result, dict):
            raise ValueError
        return result
    except (ValueError, UnicodeError):
        raise SimulationError("JSON no válido; no se utiliza parcialmente.") from None


def aware_datetime(value):
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if result.tzinfo is None or result.utcoffset() is None:
            raise ValueError
        return result.astimezone(timezone.utc)
    except (ValueError, AttributeError, TypeError):
        raise SimulationError("Fecha sin zona horaria o no válida.") from None


def cutoff_utc(now, zone_name):
    try:
        zone = ZoneInfo(zone_name)
    except ZoneInfoNotFoundError:
        raise SimulationError("Zona horaria no disponible. Instala tzdata con requirements-simulation.txt.") from None
    if now.tzinfo is None or now.utcoffset() is None:
        raise SimulationError("El reloj debe incluir zona horaria.")
    local_now = now.astimezone(zone)
    cutoff = datetime.combine(local_now.date(), time(10), tzinfo=zone)
    if local_now < cutoff:
        cutoff -= timedelta(days=1)
    return cutoff.astimezone(timezone.utc)


def stable_seed(*parts):
    return int.from_bytes(sha256(json.dumps(parts, ensure_ascii=True, separators=(",", ":")).encode()).digest()[:16], "big")


def pct(numerator, denominator):
    if not denominator:
        return "0.00"
    return str((Decimal(str(numerator)) * 100 / Decimal(str(denominator))).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class Player:
    id: int
    provider_id: int
    name: str
    position: str | None


@dataclass(frozen=True)
class Game:
    id: int
    provider_id: int
    date: datetime
    season: int
    home: int
    away: int
    finished: bool = False
    has_data: bool = False


@dataclass
class Line:
    player_id: int
    provider_id: int
    name: str
    starter: bool
    seconds_played: int = 0
    points: int = 0
    ofe_rebounds: int = 0
    def_rebounds: int = 0
    assists: int = 0
    steals: int = 0
    blocks: int = 0
    turnovers: int = 0
    plusminus: int = 0
    fg_made: int = 0
    fg_attempted: int = 0
    three_made: int = 0
    three_attempted: int = 0
    ft_made: int = 0
    ft_attempted: int = 0
    personal_fouls: int = 0

    @property
    def rebounds(self):
        return self.ofe_rebounds + self.def_rebounds

    def record(self):
        return {**asdict(self), "rebounds": self.rebounds}


@dataclass
class Side:
    team_id: int
    rotation: list[Player]
    profiles: dict
    lines: dict[int, Line]
    lineups: list[list[int]] = field(default_factory=list)
    periods: list[int] = field(default_factory=list)
    possessions: int = 0
    paint_points: int = 0
    fastbreak_points: int = 0
    second_chance_points: int = 0

    @property
    def score(self):
        return sum(line.points for line in self.lines.values())


def profile(player, seed, season):
    rng = random.Random(stable_seed(VERSION, seed, season, "profile", player.provider_id))
    position = player.position or "F"
    big = position in {"C", "PF"}
    guard = position in {"G", "PG", "SG"}
    return {"usage": rng.uniform(0.65, 1.7), "two": rng.uniform(0.50, 0.62),
            "three": rng.uniform(0.31, 0.41), "free": rng.uniform(0.68, 0.91),
            "three_share": rng.uniform(0.06, 0.25) if big else rng.uniform(0.33, 0.55),
            "rebound": rng.uniform(1.2, 2.0) if big else rng.uniform(0.6, 1.2),
            "pass": rng.uniform(1.2, 2.0) if guard else rng.uniform(0.55, 1.2),
            "block": 2.2 if big else 0.7}


def choose(rng, candidates, weights):
    if not candidates:
        raise SimulationError("No hay participantes elegibles en la simulación.")
    return rng.choices(candidates, weights=weights, k=1)[0]


def make_side(team_id, pool, rng, seed, season):
    if len(pool) < 8:
        raise SimulationError(f"El equipo local {team_id} tiene menos de 8 jugadores de temporada identificados.")
    profiles = {p.id: profile(p, seed, season) for p in pool}
    
    ranked = sorted(pool, key=lambda p: (-profiles[p.id]["usage"], p.provider_id))
    core = []
    for positions, count in (({"G", "PG", "SG"}, 2), ({"F", "SF", "PF"}, 2), ({"C"}, 1)):
        core.extend([p for p in ranked if p.position in positions and p not in core][:count])
    core.extend([p for p in ranked if p not in core][:5-len(core)])
    reserves = [p for p in ranked if p not in core]
    rng.shuffle(reserves)
    rotation = core + reserves[:min(len(reserves), rng.randint(4, 6))]
    lines = {p.id: Line(p.id, p.provider_id, p.name, p in core) for p in rotation}
    side = Side(team_id, rotation, profiles, lines)
    
    targets = {p.id: 10 for p in rotation}
    weights = {p.id: profiles[p.id]["usage"] * (1.55 if p in core else 0.85) for p in rotation}
    for _ in range(240 - sum(targets.values())):
        eligible = [p.id for p in rotation if targets[p.id] < 40]
        selected = choose(rng, eligible, [weights[p] for p in eligible])
        targets[selected] += 1
    remaining = dict(targets)
    for minute in range(48):
        left = 48 - minute
        lineup = [pid for pid, count in remaining.items() if count == left]
        if minute == 0:
            lineup = [p.id for p in core]
        while len(lineup) < 5:
            eligible = [pid for pid, count in remaining.items() if count > 0 and pid not in lineup]
            pid = choose(rng, eligible, [remaining[p] ** 1.4 for p in eligible])
            lineup.append(pid)
        for pid in lineup:
            remaining[pid] -= 1
            side.lines[pid].seconds_played += 60
        side.lineups.append(lineup)
    if any(remaining.values()):
        raise SimulationError("No cuadran los minutos de la rotación.")
    return side


def overtime_lineups(side, rng):
    
    for _ in range(5):
        lineup = []
        while len(lineup) < 5:
            eligible = [p.id for p in side.rotation if p.id not in lineup]
            pid = choose(rng, eligible, [side.profiles[p]["usage"] for p in eligible])
            lineup.append(pid)
        for pid in lineup:
            side.lines[pid].seconds_played += 60
        side.lineups.append(lineup)


def actor(side, lineup, rng, key="usage", exclude=None):
    candidates = [pid for pid in lineup if pid != exclude]
    return choose(rng, candidates, [side.profiles[p][key] for p in candidates])


def score_points(off, defense, attack, defend, pid, points, *, paint=False, fast=False, second=False):
    off.lines[pid].points += points
    for player in attack:
        off.lines[player].plusminus += points
    for player in defend:
        defense.lines[player].plusminus -= points
    if paint:
        off.paint_points += points
    if fast:
        off.fastbreak_points += points
    if second:
        off.second_chance_points += points


def rebound(off, defense, attack, defend, rng, chance=0.23):
    if rng.random() < chance:
        off.lines[actor(off, attack, rng, "rebound")].ofe_rebounds += 1
        return True
    defense.lines[actor(defense, defend, rng, "rebound")].def_rebounds += 1
    return False


def possession(off, defense, attack, defend, rng, shooting_adjustment):
    off.possessions += 1
    second = False
    fast = rng.random() < 0.15
    for continuation in range(7):
        shooter = actor(off, attack, rng)
        line, skill = off.lines[shooter], off.profiles[shooter]
        if rng.random() < (0.13 if not second else 0.08):
            line.turnovers += 1
            if rng.random() < 0.60:
                defense.lines[actor(defense, defend, rng)].steals += 1
            return
        three = rng.random() < skill["three_share"]
        eligible = [p for p in defend if defense.lines[p].personal_fouls < 5]
        foul = rng.random() < 0.115 and bool(eligible)
        if foul:
            defense.lines[choose(rng, eligible, [1] * len(eligible))].personal_fouls += 1
            attempts = 3 if three and rng.random() < 0.16 else 2
            last_made = True
            for _ in range(attempts):
                line.ft_attempted += 1
                last_made = rng.random() < skill["free"]
                if last_made:
                    line.ft_made += 1
                    score_points(off, defense, attack, defend, shooter, 1, second=second)
            if not last_made and rebound(off, defense, attack, defend, rng, 0.16 if continuation < 6 else 0):
                second = True
                fast = False
                continue
            return
        line.fg_attempted += 1
        line.three_attempted += int(three)
        made = rng.random() < max(0.15, min(0.80, skill["three" if three else "two"] + shooting_adjustment))
        if made:
            line.fg_made += 1
            line.three_made += int(three)
            score_points(off, defense, attack, defend, shooter, 3 if three else 2,
                         paint=not three and rng.random() < 0.72, fast=fast, second=second)
            if rng.random() < 0.62:
                off.lines[actor(off, attack, rng, "pass", exclude=shooter)].assists += 1
            return
        if rng.random() < 0.085:
            defense.lines[actor(defense, defend, rng, "block")].blocks += 1
        if rebound(off, defense, attack, defend, rng, 0.23 if continuation < 6 else 0):
            second = True
            fast = False
            continue
        return


def summarize(side, opponent):
    totals = {key: sum(getattr(line, key) for line in side.lines.values()) for key in (
        "fg_made", "fg_attempted", "three_made", "three_attempted", "ft_made", "ft_attempted",
        "rebounds", "assists", "steals", "blocks", "turnovers", "personal_fouls")}
    return {**{k: v for k, v in totals.items() if k != "blocks"}, "tapones": totals["blocks"],
        "possessions": side.possessions, "paint_points": side.paint_points,
        "fastbreak_points": side.fastbreak_points,
        "bench_points": sum(line.points for line in side.lines.values() if not line.starter),
        "second_chance_points": side.second_chance_points,
        "effective_field_goal_percentage": pct(totals["fg_made"] + 0.5 * totals["three_made"], totals["fg_attempted"]),
        "true_shooting_percentage": pct(side.score, 2 * (totals["fg_attempted"] + 0.44 * totals["ft_attempted"])),
        "offensive_rating": round(side.score * 100 / side.possessions),
        "defensive_rating": round(opponent.score * 100 / opponent.possessions)}


def validate_box(box):
    sides = [box["home"], box["away"]]
    periods = len(sides[0]["period_scores"])
    if periods not in {4, 5, 6} or len(sides[1]["period_scores"]) != periods:
        raise SimulationError("Número de periodos no válido.")
    if sides[0]["score"] == sides[1]["score"]:
        raise SimulationError("El partido no puede terminar empatado.")
    for end in range(4, periods):
        if sum(sides[0]["period_scores"][:end]) != sum(sides[1]["period_scores"][:end]):
            raise SimulationError("Una prórroga requiere empate previo.")
    for own, other in (sides, sides[::-1]):
        lines, totals = own["players"], own["stats"]
        if not TEAM_SCORE_MIN <= own["score"] <= TEAM_SCORE_MAX or sum(own["period_scores"]) != own["score"]:
            raise SimulationError("Marcador fuera del rango de simulación.")
        if len(lines) < 8 or len(lines) > 11 or sum(p["starter"] for p in lines) != 5:
            raise SimulationError("Rotación no válida.")
        seconds = (48 + 5 * (periods - 4)) * 60
        if sum(p["seconds_played"] for p in lines) != seconds * 5:
            raise SimulationError("No cuadran los minutos del equipo.")
        if sum(p["points"] for p in lines) != own["score"]:
            raise SimulationError("El marcador no coincide con los jugadores.")
        if sum(p["plusminus"] for p in lines) != 5 * (own["score"] - other["score"]):
            raise SimulationError("El +/- no coincide con el resultado.")
        for p in lines:
            if not 0 < p["seconds_played"] <= (40 + 5 * (periods - 4)) * 60:
                raise SimulationError("Minutos individuales fuera del rango.")
            if not 0 <= p["points"] <= PLAYER_POINT_MAX or p["points"] != 2*p["fg_made"] + p["three_made"] + p["ft_made"]:
                raise SimulationError("Puntuación individual fuera de rango o incoherente.")
            if not 0 <= p["three_made"] <= p["three_attempted"] <= p["fg_attempted"] or not p["three_made"] <= p["fg_made"] <= p["fg_attempted"]:
                raise SimulationError("Tiros de campo incoherentes.")
            if p["fg_made"]-p["three_made"] > p["fg_attempted"]-p["three_attempted"] or not 0 <= p["ft_made"] <= p["ft_attempted"]:
                raise SimulationError("Tiros de dos o libres incoherentes.")
            if p["rebounds"] != p["ofe_rebounds"]+p["def_rebounds"]:
                raise SimulationError("Rebotes incoherentes.")
            if p["rebounds"] > 23 or p["assists"] > 16 or p["steals"] > 6 or p["blocks"] > 7 or p["turnovers"] > 8:
                raise SimulationError("Estadísticas individuales fuera del rango de simulación.")
        for key in ("fg_made", "fg_attempted", "three_made", "three_attempted", "ft_made", "ft_attempted", "rebounds", "assists", "steals", "turnovers", "personal_fouls"):
            if totals[key] != sum(p[key] for p in lines):
                raise SimulationError(f"El total de {key} no coincide con los jugadores.")
        if totals["tapones"] != sum(p["blocks"] for p in lines) or totals["assists"] > totals["fg_made"]:
            raise SimulationError("Tapones o asistencias incoherentes.")
        if totals["steals"] > other["stats"]["turnovers"]:
            raise SimulationError("Más robos que pérdidas del rival.")
        if totals["paint_points"] > 2*(totals["fg_made"]-totals["three_made"]):
            raise SimulationError("Puntos en la pintura incoherentes.")
        if totals["bench_points"] != sum(p["points"] for p in lines if not p["starter"]):
            raise SimulationError("Puntos del banquillo incoherentes.")
    home_ids = {p["player_id"] for p in sides[0]["players"]}
    if home_ids & {p["player_id"] for p in sides[1]["players"]}:
        raise SimulationError("Un jugador aparece en ambos equipos.")


def simulate(game, pools, seed):
    for attempt in range(100):
        rng = random.Random(stable_seed(VERSION, seed, game.season, game.provider_id, "game", attempt))
        home = make_side(game.home, pools[game.home], rng, seed, game.season)
        away = make_side(game.away, pools[game.away], rng, seed, game.season)
        pace = rng.uniform(94, 105)
        adjustments = [rng.gauss(0.009, 0.025), rng.gauss(-0.003, 0.025)]
        for period in range(6):
            overtime = period >= 4
            if overtime:
                overtime_lineups(home, rng)
                overtime_lineups(away, rng)
            minutes = 5 if overtime else 12
            offset = 48 + 5*(period-4) if overtime else period*12
            count = round(pace * minutes / 48 + rng.uniform(-1, 1))
            before = (home.score, away.score)
            for number in range(count):
                minute = min(minutes-1, number*minutes//count)
                attack, defense = home.lineups[offset+minute], away.lineups[offset+minute]
                possession(home, away, attack, defense, rng, adjustments[0])
                possession(away, home, defense, attack, rng, adjustments[1])
            home.periods.append(home.score-before[0])
            away.periods.append(away.score-before[1])
            if period >= 3 and home.score != away.score:
                break
        box = {"generator_version": VERSION, "statistics_source": "synthetic",
               "seed": seed, "attempt": attempt, "provider_game_id": game.provider_id,
               "local_game_id": game.id, "season_init_year": game.season,
               "home": {"team_id": home.team_id, "score": home.score, "period_scores": home.periods,
                        "players": [p.record() for p in home.lines.values()], "stats": summarize(home, away)},
               "away": {"team_id": away.team_id, "score": away.score, "period_scores": away.periods,
                        "players": [p.record() for p in away.lines.values()], "stats": summarize(away, home)}}
        try:
            validate_box(box)
            return box
        except SimulationError:
            continue
    raise SimulationError(f"No se pudo generar un partido válido para {game.provider_id} tras 100 intentos.")


def within(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise SimulationError("Una ruta de procedencia sale de su carpeta.")
    return path


def reference_input(root, season, explicit=None):
    reports = []
    for path in (root / "runs").glob("*.json"):
        try:
            report = load_json(path.read_bytes())
        except (SimulationError, OSError):
            continue
        if (report.get("script") == "import_reference_data.py" and report.get("season") == season
                and report.get("status") in {"success", "success_with_warnings"}
                and report.get("database", {}).get("status") == "committed" and report.get("prepared")):
            reports.append((aware_datetime(report["started_at_utc"]), path, report))
    if not reports:
        raise SimulationError("No hay una importación confirmada para esa temporada. Ejecuta primero import_reference_data.py y usa el mismo --provenance-dir.")
    reports.sort(key=lambda item: (item[0], str(item[1])), reverse=True)
    explicit_raw = explicit.read_bytes() if explicit else None
    if explicit:
        expected = sha256(explicit_raw).hexdigest()
        reports = [item for item in reports if item[2]["prepared"].get("sha256") == expected]
        if not reports:
            raise SimulationError("--reference-file no coincide con una importación confirmada y registrada.")
    _, path, report = reports[0]
    prepared_path = explicit or within(root, report["prepared"]["file"])
    raw = explicit_raw if explicit else prepared_path.read_bytes()
    if sha256(raw).hexdigest() != report["prepared"]["sha256"]:
        raise SimulationError("La copia preparada no coincide con su SHA-256. No se utiliza otra copia silenciosamente.")
    data = load_json(raw)
    if data.get("season") != season or data.get("run_id") != report.get("run_id"):
        raise SimulationError("La copia preparada pertenece a otra temporada o ejecución.")
    if not all(isinstance(data.get(key), list) and data[key] for key in ("teams", "players", "memberships", "games")):
        raise SimulationError("La copia de referencias está incompleta.")
    return data, raw, {"report": str(path), "file": str(prepared_path), "sha256": sha256(raw).hexdigest(), "run_id": report["run_id"]}


def schema_layout(connection):
    columns = defaultdict(set)
    for table, column in connection.execute("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema()").fetchall():
        columns[table].add(column)
    for table, required in REQUIRED.items():
        missing = required-columns[table]
        if missing:
            raise SimulationError(f"Faltan columnas en {table}: {', '.join(sorted(missing))}.")
    result = {}
    for table in ("teams", "players", "games"):
        result[table] = next((name for name in ("balldontlie_id", "nba_id") if name in columns[table]), None)
        if result[table] is None:
            raise SimulationError(f"Falta identificador del proveedor en {table}.")
    flags = {"schedule_status", "date_confirmed"} & columns["games"]
    if flags and len(flags) != 2:
        raise SimulationError("El calendario tiene columnas de confirmación incompletas.")
    result["calendar_flags"] = bool(flags)
    return result


def roster_pools(connection, layout, reference, seed):
    teams = {row[1]: row[0] for row in connection.execute(f"SELECT id,{layout['teams']} FROM teams").fetchall()}
    codes = {}
    for team in reference["teams"]:
        provider_id = integer(team.get("balldontlie_id"), "team")
        if provider_id not in teams or team["short_name"] in codes:
            raise SimulationError("Los equipos de la BD no coinciden con las referencias importadas.")
        codes[team["short_name"]] = teams[provider_id]
    database_codes = dict(connection.execute("SELECT id,short_name FROM teams").fetchall())
    if any(database_codes[local_id] != code for code, local_id in codes.items()):
        raise SimulationError("Los códigos e identificadores de los equipos no coinciden.")
    selected_ids = {integer(p.get("balldontlie_id"), "player") for p in reference["players"]}
    players = {row[1]: Player(*row) for row in connection.execute(
        f"SELECT id,{layout['players']},name,position FROM players WHERE {layout['players']}=ANY(%s)", (sorted(selected_ids),)).fetchall()}
    candidates = defaultdict(set)
    for member in reference["memberships"]:
        pid, code = integer(member.get("balldontlie_player_id"), "membership.player"), member.get("team_code")
        if pid not in players or code not in codes:
            raise SimulationError("Faltan jugadores o equipos de las plantillas en la BD; completa antes la importación de referencias.")
        candidates[pid].add(code)
    pools, assignments = {team: [] for team in codes.values()}, []
    
    
    for pid in sorted(candidates, key=lambda p: (len(candidates[p]), stable_seed(seed, reference["season"], p))):
        options = candidates[pid]
        code = min(options, key=lambda c: (len(pools[codes[c]]), stable_seed(seed, pid, c)))
        pools[codes[code]].append(players[pid])
        if len(options) > 1:
            assignments.append({"provider_player_id": pid, "candidate_teams": sorted(options), "fictional_team": code})
    for team, pool in pools.items():
        pool.sort(key=lambda p: p.provider_id)
        if len(pool) < 8:
            raise SimulationError(f"El equipo local {team} solo tiene {len(pool)} jugadores elegibles. Revisa la selección de temporada.")
    return pools, teams, assignments


def query_games(connection, layout, season, cutoff):
    status = "g.schedule_status,g.date_confirmed" if layout["calendar_flags"] else "'scheduled',TRUE"
    rows = connection.execute(f"""SELECT g.id,g.{layout['games']},g.date,g.season_init_year,
        g.home_team_id,g.away_team_id,g.finished,
        (g.home_score IS NOT NULL OR g.away_score IS NOT NULL OR g.home_period_scores IS NOT NULL
         OR g.away_period_scores IS NOT NULL OR EXISTS(SELECT 1 FROM player_game_stats p WHERE p.game_id=g.id)
         OR EXISTS(SELECT 1 FROM team_game_stats t WHERE t.game_id=g.id)), {status}
        FROM games g WHERE g.season_init_year=%s AND g.date<%s AND NOT g.finished ORDER BY g.date,g.id""",
        (int(season[:4]), cutoff)).fetchall()
    return [(Game(*row[:8]), row[8], row[9]) for row in rows]


TEAM_AGGREGATES = """
WITH results AS (
 SELECT id,date,home_team_id AS team_id,away_team_id AS opponent_id,home_score AS scored,
        away_score AS allowed,TRUE AS is_home,home_score>away_score AS won
 FROM games WHERE finished AND season_init_year=%s AND home_team_id=ANY(%s)
 UNION ALL
 SELECT id,date,away_team_id,home_team_id,away_score,home_score,FALSE,away_score>home_score
 FROM games WHERE finished AND season_init_year=%s AND away_team_id=ANY(%s)
), ordered AS (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY team_id ORDER BY date DESC,id DESC) AS rn,
 FIRST_VALUE(won) OVER(PARTITION BY team_id ORDER BY date DESC,id DESC) AS last_won FROM results
), totals AS (
 SELECT r.team_id,COUNT(*) FILTER(WHERE won)::INTEGER AS wins,COUNT(*) FILTER(WHERE NOT won)::INTEGER AS losses,
 COUNT(*) FILTER(WHERE is_home AND won)::INTEGER AS home_wins,
 COUNT(*) FILTER(WHERE is_home AND NOT won)::INTEGER AS home_losses,
 SUM(scored)::INTEGER AS scored,SUM(allowed)::INTEGER AS allowed,
 COALESCE(MIN(rn) FILTER(WHERE won<>last_won)-1,COUNT(*))::INTEGER AS streak,
 BOOL_OR(last_won) AS streak_won,COALESCE(SUM(a.possessions),0)::INTEGER AS possessions,
 COALESCE(SUM(b.possessions),0)::INTEGER AS opponent_possessions
 FROM ordered r LEFT JOIN team_game_stats a ON a.game_id=r.id AND a.team_id=r.team_id
 LEFT JOIN team_game_stats b ON b.game_id=r.id AND b.team_id=r.opponent_id GROUP BY r.team_id
)
INSERT INTO team_season_stats(team_id,season_init_year,victorys,losses,home_victory,home_losses,
 total_points,total_points_allowed,streak_number,streak_victory,total_possessions,total_opponent_possessions)
 SELECT team_id,%s,wins,losses,home_wins,home_losses,scored,allowed,streak,streak_won,possessions,opponent_possessions FROM totals
 ON CONFLICT(team_id,season_init_year) DO UPDATE SET victorys=EXCLUDED.victorys,losses=EXCLUDED.losses,
 home_victory=EXCLUDED.home_victory,home_losses=EXCLUDED.home_losses,total_points=EXCLUDED.total_points,
 total_points_allowed=EXCLUDED.total_points_allowed,streak_number=EXCLUDED.streak_number,
 streak_victory=EXCLUDED.streak_victory,total_possessions=EXCLUDED.total_possessions,
 total_opponent_possessions=EXCLUDED.total_opponent_possessions
"""
PLAYER_AGGREGATES = """
INSERT INTO player_season_stats(player_id,season_init_year,total_points,total_rebounds,total_ofe_rebounds,
 total_def_rebounds,total_assists,total_steals,total_blocks,total_turnovers,plusminus,total_fg_made,
 total_fg_attempted,total_three_made,total_three_attempted,games_played)
 SELECT p.player_id,%s,SUM(p.points),SUM(p.rebounds),SUM(p.ofe_rebounds),SUM(p.def_rebounds),SUM(p.assists),
 SUM(p.steals),SUM(p.blocks),SUM(p.turnovers),SUM(p.plusminus),SUM(p.fg_made),SUM(p.fg_attempted),
 SUM(p.three_made),SUM(p.three_attempted),COUNT(*)
 FROM player_game_stats p JOIN games g ON g.id=p.game_id
 WHERE g.finished AND g.season_init_year=%s AND p.player_id=ANY(%s) GROUP BY p.player_id
 ON CONFLICT(player_id,season_init_year) DO UPDATE SET total_points=EXCLUDED.total_points,
 total_rebounds=EXCLUDED.total_rebounds,total_ofe_rebounds=EXCLUDED.total_ofe_rebounds,
 total_def_rebounds=EXCLUDED.total_def_rebounds,total_assists=EXCLUDED.total_assists,
 total_steals=EXCLUDED.total_steals,total_blocks=EXCLUDED.total_blocks,total_turnovers=EXCLUDED.total_turnovers,
 plusminus=EXCLUDED.plusminus,total_fg_made=EXCLUDED.total_fg_made,total_fg_attempted=EXCLUDED.total_fg_attempted,
 total_three_made=EXCLUDED.total_three_made,total_three_attempted=EXCLUDED.total_three_attempted,games_played=EXCLUDED.games_played
"""


def persist_game(connection, game, box, layout, cutoff):
    validate_box(box)
    if (box["local_game_id"] != game.id or box["provider_game_id"] != game.provider_id
            or box["season_init_year"] != game.season or box["home"]["team_id"] != game.home
            or box["away"]["team_id"] != game.away):
        raise SimulationError("Las estadísticas preparadas pertenecen a otro partido.")
    with connection.transaction():
        current = connection.execute(f"SELECT {layout['games']},date,home_team_id,away_team_id,season_init_year,finished FROM games WHERE id=%s FOR UPDATE", (game.id,)).fetchone()
        if current is None:
            return "game_removed"
        if current[5]:
            return "already_finished"
        if current[:5] != (game.provider_id, game.date, game.home, game.away, game.season) or current[1] >= cutoff:
            return "calendar_changed"
        if layout["calendar_flags"]:
            status, confirmed = connection.execute("SELECT schedule_status,date_confirmed FROM games WHERE id=%s", (game.id,)).fetchone()
            if status != "scheduled" or not confirmed:
                return "unconfirmed_calendar"
        partial = connection.execute("""SELECT home_score IS NOT NULL OR away_score IS NOT NULL
            OR home_period_scores IS NOT NULL OR away_period_scores IS NOT NULL
            OR EXISTS(SELECT 1 FROM player_game_stats WHERE game_id=%s)
            OR EXISTS(SELECT 1 FROM team_game_stats WHERE game_id=%s) FROM games WHERE id=%s""", (game.id, game.id, game.id)).fetchone()[0]
        if partial:
            return "existing_partial_data"
        with connection.cursor() as cursor:
            for side in (box["home"], box["away"]):
                fields = ("game_id", "team_id") + PLAYER_FIELDS
                cursor.executemany(f"INSERT INTO player_game_stats ({','.join(fields)}) VALUES ({','.join(['%s']*len(fields))})",
                    [(game.id, side["team_id"]) + tuple(p[name] for name in PLAYER_FIELDS) for p in side["players"]])
                fields = ("game_id", "team_id") + TEAM_FIELDS
                cursor.execute(f"INSERT INTO team_game_stats ({','.join(fields)}) VALUES ({','.join(['%s']*len(fields))})",
                    (game.id, side["team_id"]) + tuple(side["stats"][name] for name in TEAM_FIELDS))
            cursor.execute("""UPDATE games SET home_score=%s,away_score=%s,home_period_scores=%s,
                away_period_scores=%s,finished=TRUE WHERE id=%s""", (box["home"]["score"], box["away"]["score"],
                box["home"]["period_scores"], box["away"]["period_scores"], game.id))
            teams = sorted([game.home, game.away])
            cursor.execute(TEAM_AGGREGATES, (game.season, teams, game.season, teams, game.season))
            players = sorted(p["player_id"] for side in (box["home"], box["away"]) for p in side["players"])
            cursor.execute(PLAYER_AGGREGATES, (game.season, game.season, players))
    return "committed"


class Run:
    def __init__(self, args, cutoff):
        self.root = args.provenance_dir
        self.id = "simulation_" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ_") + uuid4().hex[:12]
        self.folder = self.root / "simulations" / self.id
        self.path = self.root / "runs" / (self.id + ".json")
        self.data = {"format_version": 1, "run_id": self.id, "script": "generate_game_stats.py",
            "script_version": VERSION, "script_sha256": sha256(Path(__file__).read_bytes()).hexdigest(),
            "python_version": platform.python_version(), "season": args.season, "statistics_source": "synthetic",
            "seed": args.seed, "dry_run": args.dry_run, "timezone": args.timezone,
            "cutoff_exclusive_utc": cutoff.isoformat(), "started_at_utc": utc_now(),
            "finished_at_utc": None, "status": "running", "games": [], "warnings": [],
            "limits": {"team_points": [TEAM_SCORE_MIN, TEAM_SCORE_MAX], "player_points_max": PLAYER_POINT_MAX},
            "roster_policy": "fictional_fixed_team_per_season_among_sourced_memberships"}
        self.save()

    def save(self):
        atomic_json(self.path, self.data)


def execute(args, connection, *, now=None):
    cutoff = cutoff_utc(now or datetime.now(timezone.utc), args.timezone)
    run = Run(args, cutoff)
    locked = False
    active = None
    try:
        reference, raw, source = reference_input(args.provenance_dir, args.season, args.reference_file)
        atomic_bytes(run.folder / "reference_input.json", raw)
        run.data["reference"] = {**source, "retained_file": str((run.folder / "reference_input.json").relative_to(run.root))}
        layout = schema_layout(connection)
        run.data["provider_id_columns"] = layout
        pools, teams, assignments = roster_pools(connection, layout, reference, args.seed)
        run.data["fictional_multi_team_assignments"] = assignments
        roster_file = run.folder / "roster_input.json"
        atomic_json(roster_file, {str(team): [asdict(player) for player in pool] for team, pool in pools.items()})
        run.data["effective_rosters"] = {"file": str(roster_file.relative_to(run.root)),
                                          "sha256": sha256(roster_file.read_bytes()).hexdigest()}
        if assignments:
            LOG.warning("%s jugadores figuraban en varios equipos; se asigna uno ficticio por temporada. Consulta el registro.", len(assignments))
        scheduled = {}
        for item in reference["games"]:
            pid = integer(item.get("balldontlie_id"), "game")
            if pid in scheduled:
                raise SimulationError("Partido repetido en las referencias.")
            scheduled[pid] = item
        if not args.dry_run:
            locked = connection.execute("SELECT pg_try_advisory_lock(%s,%s)", (19472861, int(args.season[:4]))).fetchone()[0]
            if not locked:
                raise SimulationError("Ya hay otro generador trabajando en esa temporada.")
        candidates = query_games(connection, layout, args.season, cutoff)
        run.data["candidate_games"] = len(candidates)
        run.save()
        processed = 0
        for game, status, confirmed in candidates:
            item = scheduled.get(game.provider_id)
            reason = None
            if game.has_data:
                reason = "existing_partial_data"
            elif item is None:
                reason = "not_in_latest_reference_calendar"
            elif not confirmed or status != "scheduled" or item.get("date_confirmed") is not True or item.get("schedule_status") != "scheduled":
                reason = "unconfirmed_calendar"
            elif (aware_datetime(item.get("date")) != game.date or teams.get(item.get("home_balldontlie_id")) != game.home
                  or teams.get(item.get("away_balldontlie_id")) != game.away or item.get("season_init_year") != game.season):
                reason = "calendar_differs_from_reference"
            active = {"local_game_id": game.id, "provider_game_id": game.provider_id, "status": "skipped", "reason": reason}
            run.data["games"].append(active)
            if reason:
                LOG.warning("Partido %s omitido: %s.", game.provider_id, reason)
                run.save()
                continue
            if args.limit is not None and processed >= args.limit:
                run.data["games"].pop()
                break
            box = simulate(game, pools, args.seed)
            target = run.folder / f"game_{game.provider_id}.json"
            atomic_json(target, box)
            active.update(status="prepared", file=str(target.relative_to(run.root)), sha256=sha256(target.read_bytes()).hexdigest())
            run.save()
            if not args.dry_run:
                active["status"] = "writing"
                run.save()
                active["status"] = persist_game(connection, game, box, layout, cutoff)
                if active["status"] == "committed":
                    active["committed_at_utc"] = utc_now()
            processed += 1
            LOG.info("%s %s: %s-%s (%s periodos).", "Preparado" if args.dry_run else active["status"],
                     game.provider_id, box["home"]["score"], box["away"]["score"], len(box["home"]["period_scores"]))
            run.save()
        counts = Counter(item["status"] for item in run.data["games"])
        run.data["result"] = dict(counts)
        run.data["status"] = ("prepared" if args.dry_run else "success") + ("_with_warnings" if counts["skipped"] or assignments else "")
        run.data["finished_at_utc"] = utc_now()
        run.save()
        return run
    except BaseException as exc:
        if active and active["status"] == "writing":
            disconnected = any(cls.__name__ in {"OperationalError", "InterfaceError"} for cls in type(exc).__mro__)
            active["status"] = "outcome_unknown" if disconnected else "rolled_back"
        run.data["status"] = "interrupted" if isinstance(exc, (KeyboardInterrupt, SystemExit)) else "failed"
        run.data["finished_at_utc"] = utc_now()
        run.data["error"] = {"type": type(exc).__name__}
        if isinstance(exc, (SimulationError, RosterError)):
            run.data["error"]["message"] = str(exc)
        elif getattr(exc, "sqlstate", None):
            run.data["error"]["sqlstate"] = exc.sqlstate
        try:
            run.save()
        except Exception:
            LOG.error("No se pudo actualizar el registro de error %s.", run.path)
        raise
    finally:
        if locked:
            try:
                connection.execute("SELECT pg_advisory_unlock(%s,%s)", (19472861, int(args.season[:4])))
            except Exception:
                LOG.warning("No se pudo liberar el bloqueo; se liberará al cerrar la conexión.")
        LOG.info("Registro: %s", run.path)


def arguments(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--season", required=True)
    parser.add_argument("--seed", type=int, default=1, help="Semilla reproducible; predeterminada: 1")
    parser.add_argument("--timezone", default="Europe/Madrid", help="Zona del cierre de jornada a las 10:00")
    parser.add_argument("--dry-run", action="store_true", help="Leer la BD y preparar estadísticas sin escribir en ella")
    parser.add_argument("--limit", type=int, help="Máximo de partidos que preparar o completar")
    parser.add_argument("--provenance-dir", type=Path, default=ROOT / "database/provenance")
    parser.add_argument("--reference-file", type=Path, help="prepared.json de una importación confirmada concreta")
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.local")
    args = parser.parse_args(argv)
    try:
        args.season = normalize_season(args.season)
        cutoff_utc(datetime.now(timezone.utc), args.timezone)
    except (RosterError, SimulationError) as exc:
        parser.error(str(exc))
    if args.limit is not None and args.limit <= 0:
        parser.error("--limit debe ser positivo")
    return args


def main(argv=None):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = arguments(argv)
    try:
        if args.env_file.is_file():
            try:
                from dotenv import load_dotenv
            except ImportError:
                raise SimulationError("Instala requirements-simulation.txt para leer .env.local.") from None
            load_dotenv(args.env_file, override=False)
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise SimulationError("Falta DATABASE_URL en el entorno o en .env.local.")
        try:
            import psycopg
        except ImportError:
            raise SimulationError("Instala las dependencias de requirements-simulation.txt.") from None
        with psycopg.connect(database_url, autocommit=True, connect_timeout=10, prepare_threshold=None) as connection:
            run = execute(args, connection)
        LOG.info("Resultado: %s", run.data["result"])
        return 0
    except KeyboardInterrupt:
        LOG.warning("Interrumpido. Los partidos confirmados se conservan; vuelve a ejecutar para continuar.")
        return 130
    except (SimulationError, RosterError) as exc:
        LOG.error("%s", exc)
        return 1
    except Exception as exc:
        LOG.error("%s durante la simulación. Consulta database/provenance/runs o tu --provenance-dir.", type(exc).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
