"""Selección de jugadores para la simulación. Python 3.10+, sin dependencias.

    py database/scripts/rosters.py --season 2025-26
    py database/scripts/rosters.py --season 2026-27

2025-26: participantes con equipo en partidos de Wikidata, temporada regular.
2026-27: fotografía de las plantillas actuales de Wikipedia.

Uso como módulo:
    selection = build_rosters("2026-27")
    for player in selection["players"]:
        # El futuro importador buscará su ficha e ID en BALLDONTLIE.
        ...

No consulta BALLDONTLIE, NBA.com o PostgreSQL. No deduce actividad de P54 sin
fechas. Los jugadores de 2025-26 pueden aparecer con varios equipos; las listas
no reconstruyen fechas de traspasos ni garantizan que todos disputaran minutos.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from hashlib import sha256
from html import unescape
import json
import logging
import math
import os
from pathlib import Path
import re
import tempfile
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4

LOG = logging.getLogger("rosters")
SCRIPT_VERSION = "1.0.1"
DEFAULT_PROVENANCE_DIR = Path(__file__).resolve().parent.parent / "provenance"
USER_AGENT = "StatsRosters/1.0 (https://github.com/germanbq/estadisticas-baloncesto)"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
MAX_RESPONSE_BYTES = 16 * 1024 * 1024
_REPLACE_DELAYS = (0.05, 0.1, 0.2, 0.4, 0.8, 1.6)
PREFIXES = """PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
"""


class RosterError(RuntimeError):
    pass


@dataclass(frozen=True)
class Team:
    code: str
    name: str
    wikidata_id: str



TEAMS = (
    Team("ATL", "Atlanta Hawks", "Q159893"),
    Team("BOS", "Boston Celtics", "Q131371"),
    Team("BKN", "Brooklyn Nets", "Q572134"),
    Team("CHA", "Charlotte Hornets", "Q163480"),
    Team("CHI", "Chicago Bulls", "Q128109"),
    Team("CLE", "Cleveland Cavaliers", "Q162990"),
    Team("DAL", "Dallas Mavericks", "Q132893"),
    Team("DEN", "Denver Nuggets", "Q162954"),
    Team("DET", "Detroit Pistons", "Q169661"),
    Team("GSW", "Golden State Warriors", "Q157376"),
    Team("HOU", "Houston Rockets", "Q161345"),
    Team("IND", "Indiana Pacers", "Q170329"),
    Team("LAC", "Los Angeles Clippers", "Q976396"),
    Team("LAL", "Los Angeles Lakers", "Q121783"),
    Team("MEM", "Memphis Grizzlies", "Q165529"),
    Team("MIA", "Miami Heat", "Q169138"),
    Team("MIL", "Milwaukee Bucks", "Q169637"),
    Team("MIN", "Minnesota Timberwolves", "Q170558"),
    Team("NOP", "New Orleans Pelicans", "Q172339"),
    Team("NYK", "New York Knicks", "Q131364"),
    Team("OKC", "Oklahoma City Thunder", "Q180950"),
    Team("ORL", "Orlando Magic", "Q161337"),
    Team("PHI", "Philadelphia 76ers", "Q138089"),
    Team("PHX", "Phoenix Suns", "Q164177"),
    Team("POR", "Portland Trail Blazers", "Q167253"),
    Team("SAC", "Sacramento Kings", "Q166105"),
    Team("SAS", "San Antonio Spurs", "Q159729"),
    Team("TOR", "Toronto Raptors", "Q132880"),
    Team("UTA", "Utah Jazz", "Q170649"),
    Team("WAS", "Washington Wizards", "Q169165"),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_season(value: str) -> str:
    match = re.fullmatch(r"(\d{4})-(\d{2}|\d{4})", value.strip())
    if not match:
        raise RosterError("La temporada debe ser YYYY-YY o YYYY-YYYY.")
    first, second = match.groups()
    if int(second) != (int(first) + 1 if len(second) == 4 else (int(first) + 1) % 100):
        raise RosterError("Los años de la temporada deben ser consecutivos.")
    season = f"{first}-{(int(first) + 1) % 100:02d}"
    if season not in {"2025-26", "2026-27"}:
        raise RosterError("Esta versión solo configura 2025-26 y 2026-27.")
    return season


def normalized_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def _replace_file(source: str, target: Path) -> None:
    
    for attempt in range(len(_REPLACE_DELAYS) + 1):
        try:
            os.replace(source, target)
            return
        except PermissionError as exc:
            code = getattr(exc, "winerror", None)
            if code not in {5, 32, 33}:
                raise
            if attempt == len(_REPLACE_DELAYS):
                raise RosterError(
                    f"Windows no permite reemplazar '{target}' (WinError {code}). "
                    "Comprueba los permisos de la carpeta y cierra las aplicaciones "
                    "que mantengan el archivo abierto. Puedes elegir otra carpeta "
                    "con --provenance-dir. Se conserva el archivo anterior."
                ) from exc
            if attempt == 0:
                LOG.warning("Windows bloquea el reemplazo de %s; se reintentará durante 3.15 s.", target)
            time.sleep(_REPLACE_DELAYS[attempt])


def atomic_bytes(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="rosters-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        
        _replace_file(temporary, path)
    finally:
        try:
            Path(temporary).unlink(missing_ok=True)
        except OSError:
            LOG.warning("No se pudo eliminar el temporal %s.", temporary)


def atomic_json(path: Path, value: object) -> None:
    content = json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    atomic_bytes(path, content.encode("utf-8"))


class Run:
    def __init__(self, root: Path, season: str):
        self.root = Path(root)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        self.id = f"rosters_{stamp}_{uuid4().hex[:12]}"
        self.folder = self.root / "rosters" / season / self.id
        self.report_path = self.root / "runs" / f"{self.id}.json"
        self.data = {
            "format_version": 1, "run_id": self.id, "script": "rosters.py",
            "script_version": SCRIPT_VERSION,
            "script_sha256": sha256(Path(__file__).read_bytes()).hexdigest(),
            "season": season, "providers": [], "started_at_utc": utc_now(),
            "finished_at_utc": None, "status": "running", "requests": [],
            "warnings": [], "result": None,
        }
        self.save()

    def relative(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    def save(self):
        atomic_json(self.report_path, self.data)

    def finish(self, status: str, error: BaseException | None = None):
        self.data["status"] = status
        self.data["finished_at_utc"] = utc_now()
        if error is not None:
            self.data["error"] = {
                "type": type(error).__name__,
                "message": str(error) if isinstance(error, RosterError) else "Error durante la recopilación.",
            }
        self.save()


class _SafeRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        parsed = urlsplit(new_url)
        if (parsed.scheme != "https" or parsed.hostname not in
                {"query.wikidata.org", "en.wikipedia.org"} or parsed.username or parsed.password):
            raise RosterError("El servicio redirige a una dirección inesperada.")
        return super().redirect_request(request, fp, code, message, headers, new_url)


def retry_seconds(value: str | None, attempt: int) -> float:
    if value:
        try:
            seconds = max(0.0, float(value))
            if math.isfinite(seconds):
                return seconds
        except ValueError:
            try:
                parsed = parsedate_to_datetime(value)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return max(0.0, (parsed - datetime.now(timezone.utc)).total_seconds())
            except (ValueError, TypeError, OverflowError):
                pass
    return float(min(2 ** attempt, 15))


class HttpClient:
    def __init__(self, run: Run, *, timeout: float = 60, retries: int = 2,
                 user_agent: str = USER_AGENT, opener=None, sleep=time.sleep):
        self.run, self.timeout, self.retries = run, timeout, retries
        self.user_agent = user_agent
        self.opener = opener or build_opener(_SafeRedirects())
        self.sleep = sleep

    def get_json(self, provider: str, purpose: str, endpoint: str, params: dict) -> tuple[dict, int]:
        parsed = urlsplit(endpoint)
        if (parsed.scheme != "https" or parsed.hostname not in
                {"query.wikidata.org", "en.wikipedia.org"} or parsed.username or parsed.password):
            raise RosterError("Endpoint no permitido para este módulo.")
        url = endpoint + "?" + urlencode(params)
        if provider not in self.run.data["providers"]:
            self.run.data["providers"].append(provider)
        for attempt in range(self.retries + 1):
            request_id = len(self.run.data["requests"]) + 1
            event = {
                "id": request_id, "provider": provider, "purpose": purpose,
                "endpoint": endpoint, "params": params, "attempt": attempt + 1,
                "started_at_utc": utc_now(), "finished_at_utc": None,
                "http_status": None, "status": "running",
            }
            self.run.data["requests"].append(event)
            self.run.save()
            retry_after = None
            retryable = False
            try:
                LOG.info("%s: %s (intento %s)", provider, purpose, attempt + 1)
                request = Request(url, headers={
                    "User-Agent": self.user_agent, "Accept-Encoding": "identity",
                    "Accept": "application/sparql-results+json, application/json",
                })
                with self.opener.open(request, timeout=self.timeout) as response:
                    event["http_status"] = response.status
                    retry_after = response.headers.get("Retry-After")
                    raw = response.read(MAX_RESPONSE_BYTES + 1)
                    event["response_headers"] = {
                        name: response.headers[name] for name in ("Date", "Content-Type", "ETag", "Last-Modified")
                        if name in response.headers
                    }
                if len(raw) > MAX_RESPONSE_BYTES:
                    raise RosterError("La respuesta supera el límite de tamaño del módulo.")
                raw_path = self.run.folder / "raw" / f"{request_id:03d}_{purpose}.json"
                try:
                    atomic_bytes(raw_path, raw)
                except OSError as exc:
                    raise RosterError("No se pudo archivar la respuesta; no se publica la selección.") from exc
                event.update({"response_file": self.run.relative(raw_path),
                              "sha256": sha256(raw).hexdigest(), "size_bytes": len(raw)})
                try:
                    payload = json.loads(raw)
                except (ValueError, UnicodeError):
                    raise RosterError("El servicio devolvió JSON incompleto o no válido; no se usa parcialmente.") from None
                if not isinstance(payload, dict):
                    raise RosterError("La respuesta JSON no es un objeto.")
                if "error" in payload:
                    api_error = payload["error"]
                    code = api_error.get("code", "unknown") if isinstance(api_error, dict) else "unknown"
                    retryable = code in {"maxlag", "readonly", "ratelimited"}
                    raise RosterError(f"La API devolvió el error {code}.")
                if "continue" in payload:
                    raise RosterError("La respuesta está paginada; esta versión no publicará una lista truncada.")
                event["status"] = "success"
                return payload, request_id
            except HTTPError as exc:
                event.update({"http_status": exc.code, "error_type": "HTTPError"})
                retryable = exc.code in {429, 500, 502, 503, 504}
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                failure = RosterError(f"{provider}: HTTP {exc.code} al obtener {purpose}.")
            except (URLError, TimeoutError, OSError) as exc:
                event["error_type"] = type(exc).__name__
                retryable = True
                failure = RosterError(f"{provider}: fallo de conexión al obtener {purpose}.")
            except RosterError as exc:
                event["error_type"] = type(exc).__name__
                failure = exc
            except BaseException as exc:
                event.update({"status": "interrupted" if isinstance(exc, KeyboardInterrupt) else "failed",
                              "error_type": type(exc).__name__})
                raise
            finally:
                event["finished_at_utc"] = utc_now()
                if event["status"] == "running":
                    event["status"] = "failed"
                self.run.save()
            event["error"] = str(failure)
            self.run.save()
            if not retryable or attempt >= self.retries:
                raise failure
            delay = retry_seconds(retry_after, attempt + 1)
            if delay > 30:
                raise RosterError(f"{provider} solicita esperar {math.ceil(delay)} segundos. Reintenta más tarde.")
            LOG.warning("%s Reintento en %.1f segundos.", failure, delay)
            self.sleep(delay)
        raise RosterError("No se pudo completar la petición.")


def _sparql_rows(payload: dict) -> list[dict]:
    try:
        rows = payload["results"]["bindings"]
        if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
            raise TypeError
        return rows
    except (KeyError, TypeError):
        raise RosterError("La respuesta no tiene la estructura de resultados SPARQL esperada.") from None


def _value(row: dict, key: str) -> str:
    try:
        value = row[key]["value"]
        if not isinstance(value, str) or not value.strip():
            raise TypeError
        return value
    except (KeyError, TypeError):
        raise RosterError(f"Falta el campo {key} en un resultado de la fuente.") from None


def _qid(value: str) -> str:
    if not re.fullmatch(r"https?://www\.wikidata\.org/entity/Q[1-9][0-9]*", value):
        raise RosterError("Un resultado contiene un identificador Wikidata no válido.")
    return value.rsplit("/", 1)[-1]


def _base_player(name: str | None, team: Team) -> dict:
    return {
        "name": name, "aliases": [], "team_code": team.code,
        "team_name": team.name, "team_wikidata_id": team.wikidata_id,
        "source_player_id": None, "balldontlie_id": None,
        "needs_review": False, "evidence": {},
    }


def wikidata_rosters(client: HttpClient, teams: tuple[Team, ...] = TEAMS) -> dict:
    
    query_games = PREFIXES + """SELECT DISTINCT ?game ?source WHERE {
 ?game wdt:P361 wd:Q133872457; wdt:P6269 ?source.
 FILTER(CONTAINS(STR(?source), "boxscore_00225"))
}"""
    payload, games_request = client.get_json("Wikidata", "wikidata_games", WIKIDATA_ENDPOINT,
                                             {"query": query_games, "format": "json"})
    game_ids, game_entities, references = {}, {}, []
    for row in _sparql_rows(payload):
        game_qid = _qid(_value(row, "game"))
        source = _value(row, "source")
        match = re.fullmatch(r"https?://cdn\.nba\.com/static/json/liveData/boxscore/boxscore_(00225\d{5})\.json", source)
        if not match or not 1 <= int(match.group(1)[5:]) <= 1230:
            raise RosterError("Wikidata devolvió una referencia de partido inesperada.")
        game_id = match.group(1)
        if ((game_id in game_ids and game_ids[game_id] != game_qid) or
                (game_qid in game_entities and game_entities[game_qid] != game_id)):
            raise RosterError("Hay identificadores de partido contradictorios en Wikidata.")
        if game_id not in game_ids:
            references.append({"wikidata_id": game_qid, "reference_game_id": game_id})
        game_ids[game_id], game_entities[game_qid] = game_qid, game_id
        
    if not game_ids:
        raise RosterError("Wikidata no devolvió partidos de temporada regular 2025-26.")
    expected = {f"00225{number:05d}" for number in range(1, 1231)}
    missing = sorted(expected - game_ids.keys())
    values = " ".join("wd:" + team.wikidata_id for team in teams)
    query_players = PREFIXES + """SELECT ?player ?playerLabel ?team ?gameCount WHERE {
 { SELECT ?player ?team (COUNT(DISTINCT ?game) AS ?gameCount) WHERE {
    VALUES ?team { """ + values + """ }
    ?game wdt:P361 wd:Q133872457; wdt:P6269 ?source; p:P710 ?participation.
    FILTER(CONTAINS(STR(?source), "boxscore_00225"))
    ?participation ps:P710 ?player; pq:P54 ?team.
   } GROUP BY ?player ?team }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul,es". }
}"""
    payload, players_request = client.get_json("Wikidata", "wikidata_players", WIKIDATA_ENDPOINT,
                                               {"query": query_players, "format": "json"})
    by_qid = {team.wikidata_id: team for team in teams}
    players, seen, warnings = [], {}, []
    for index, row in enumerate(_sparql_rows(payload)):
        player_id, team_id = _qid(_value(row, "player")), _qid(_value(row, "team"))
        if team_id not in by_qid:
            raise RosterError("Wikidata devolvió un equipo que no está en el catálogo.")
        count = _value(row, "gameCount")
        if not count.isdigit() or not 1 <= int(count) <= 82:
            raise RosterError("El número de partidos de una relación jugador-equipo no es válido.")
        label = row.get("playerLabel", {}).get("value", "").strip()
        missing_name = not label or bool(re.fullmatch(r"Q\d+", label))
        player = _base_player(None if missing_name else label, by_qid[team_id])
        player.update({"source_player_id": player_id, "observed_game_count": int(count),
                       "needs_review": missing_name,
                       "evidence": {"request_id": players_request, "result_index": index,
                                    "identity_url": f"https://www.wikidata.org/wiki/{player_id}"}})
        key = (player_id, team_id)
        if key in seen:
            if seen[key]["name"] != player["name"] or seen[key]["observed_game_count"] != int(count):
                raise RosterError("Hay resultados contradictorios para el mismo jugador y equipo.")
            continue
        seen[key] = player
        players.append(player)
        if missing_name:
            warnings.append({"code": "missing_name", "player_id": player_id,
                             "message": "Identidad conservada para revisión; falta un nombre legible."})
    if missing:
        warnings.append({"code": "missing_games", "message":
                         f"La fuente cubre {len(game_ids)}/1230 partidos; esto no demuestra que falten jugadores.",
                         "reference_game_ids": missing})
    return {
        "source": {"provider": "Wikidata", "license": "CC0-1.0",
                   "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                   "source_url": "https://www.wikidata.org/wiki/Q133872457"},
        "selection_kind": "season_game_participants", "players": players,
        "teams": [asdict(team) for team in teams], "warnings": warnings,
        "coverage": {"observed_games": len(game_ids), "expected_regular_games": 1230,
                     "missing_reference_game_ids": missing,
                     "player_completeness": "not_verified"},
        "source_identifiers": {"games": sorted(references, key=lambda game: game["reference_game_id"]),
                               "player_wikidata_ids": sorted({p["source_player_id"] for p in players}),
                               "team_wikidata_ids": sorted(by_qid)},
        "source_requests": [games_request, players_request],
    }


def templates(wikitext: str):
    
    source = re.sub(r"<!--.*?-->|<nowiki\b[^>]*>.*?</nowiki>", "", wikitext, flags=re.S | re.I)
    stack, index = [], 0
    while index < len(source):
        if source.startswith("{{{", index):
            stack.append((index, 3)); index += 3
        elif source.startswith("{{", index):
            stack.append((index, 2)); index += 2
        elif stack and source.startswith("}" * stack[-1][1], index):
            start, width = stack.pop()
            if width == 2:
                yield source[start + 2:index]
            index += width
        else:
            index += 1
    if stack:
        raise RosterError("El wikitexto contiene plantillas sin cerrar.")


def split_fields(body: str) -> list[str]:
    
    fields, start, index, braces, links = [], 0, 0, 0, 0
    while index < len(body):
        token = body[index:index + 2]
        if token == "{{": braces += 1; index += 2
        elif token == "}}": braces -= 1; index += 2
        elif token == "[[": links += 1; index += 2
        elif token == "]]": links -= 1; index += 2
        elif body[index] == "|" and not braces and not links:
            fields.append(body[start:index]); start = index + 1; index += 1
        else: index += 1
    fields.append(body[start:])
    return fields


def clean_name(value: str) -> str:
    
    while "{{" in value:
        previous = value
        def unwrap(match):
            fields = split_fields(match.group(1))
            if fields[0].strip().casefold() not in {"nowrap", "nobr", "small", "lang"}:
                raise RosterError("Formato de nombre desconocido en Wikipedia; revisar la plantilla.")
            return fields[-1]
        value = re.sub(r"\{\{([^{}]*)\}\}", unwrap, value)
        if value == previous:
            raise RosterError("No se puede interpretar un nombre de Wikipedia.")
    value = re.sub(r"\[\[([^\[\]]+)\]\]", lambda m: m.group(1).split("|")[-1], value)
    value = re.sub(r"<[^>]*>", "", value).replace("''", "")
    value = " ".join(unescape(value).replace("_", " ").split())
    if not value or any(character in value for character in "{}[]|\r\n"):
        raise RosterError("Wikipedia contiene un nombre vacío o con formato no reconocido.")
    return unicodedata.normalize("NFC", value)


def parse_wikipedia_players(content: str, team: Team, evidence: dict) -> tuple[list[dict], list[dict]]:
    players, warnings, seen = [], [], set()
    for body in templates(content):
        fields = split_fields(body)
        name = fields[0].strip().replace("_", " ").removeprefix("Template:").casefold()
        if name != "player2":
            if re.fullmatch(r"player\d*", name):
                raise RosterError(f"Formato de jugador {name} no soportado en {team.code}.")
            continue
        params = {}
        for field in fields[1:]:
            if "=" not in field:
                if field.strip():
                    raise RosterError(f"Parámetro de jugador sin nombre en {team.code}.")
                continue
            key, value = field.split("=", 1)
            key = key.strip().casefold()
            if key in params:
                raise RosterError(f"Parámetro de jugador duplicado en {team.code}: {key}.")
            params[key] = value.strip()
        if "first" not in params or "last" not in params:
            raise RosterError(f"Falta nombre o apellido en la plantilla de {team.code}.")
        player_name = clean_name(params["first"]) + " " + clean_name(params["last"])
        if re.search(r"\b(DP|FA)\b", params.get("note", ""), re.I):
            warnings.append({"code": "excluded_unsigned_player", "team_code": team.code,
                             "name": player_name, "message": "La fuente lo marca como DP o FA."})
            continue
        key = normalized_name(player_name)
        if not key or key in seen:
            raise RosterError(f"Jugador vacío o duplicado dentro de {team.code}: {player_name}.")
        seen.add(key)
        player = _base_player(player_name, team)
        player["evidence"] = dict(evidence)
        if params.get("link"):
            alias = clean_name(params["link"])
            if alias != player_name:
                player["aliases"].append(alias)
        
        players.append(player)
    if not 5 <= len(players) <= 40:
        raise RosterError(f"Plantilla de {team.code} inesperada: {len(players)} jugadores. Revisar la fuente.")
    return players, warnings


def wikipedia_rosters(client: HttpClient, teams: tuple[Team, ...] = TEAMS) -> dict:
    titles = {f"Template:{team.name} roster": team for team in teams}
    payload, request_id = client.get_json("Wikipedia", "wikipedia_rosters", WIKIPEDIA_API, {
        "action": "query", "prop": "revisions", "rvprop": "ids|timestamp|content",
        "rvslots": "main", "titles": "|".join(titles), "redirects": "1",
        "format": "json", "formatversion": "2", "maxlag": "5",
    })
    query = payload.get("query", {})
    pages = query.get("pages")
    if not isinstance(pages, list):
        raise RosterError("Wikipedia no devolvió la lista de páginas esperada.")
    canonical = dict(titles)
    for redirect in query.get("normalized", []) + query.get("redirects", []):
        if redirect.get("from") in canonical:
            target = redirect.get("to")
            if target in canonical and canonical[target] != canonical[redirect["from"]]:
                raise RosterError("Dos equipos resuelven a la misma plantilla de Wikipedia.")
            canonical[target] = canonical[redirect["from"]]
    players, sources, warnings, received = [], [], [], set()
    for page in pages:
        title = page.get("title")
        if title not in canonical or page.get("missing") or page.get("invalid"):
            raise RosterError(f"Plantilla de Wikipedia ausente o inesperada: {title}.")
        team = canonical[title]
        if team.code in received:
            raise RosterError("Wikipedia devolvió dos páginas para el mismo equipo.")
        received.add(team.code)
        try:
            revision = page["revisions"][0]
            revision_id, revision_time = revision["revid"], revision["timestamp"]
            content = revision["slots"]["main"]["content"]
            if isinstance(revision_id, bool) or not isinstance(revision_id, int) or revision_id <= 0:
                raise TypeError
            datetime.fromisoformat(revision_time.replace("Z", "+00:00"))
            if not isinstance(content, str):
                raise TypeError
        except (KeyError, IndexError, TypeError, ValueError, AttributeError):
            raise RosterError(f"Falta contenido o revisión válida para {team.code}.") from None
        url = "https://en.wikipedia.org/w/index.php?" + urlencode({"title": title, "oldid": revision_id})
        evidence = {"request_id": request_id, "page_title": title, "revision_id": revision_id,
                    "revision_timestamp": revision_time, "revision_url": url}
        selected, notes = parse_wikipedia_players(content, team, evidence)
        players.extend(selected); warnings.extend(notes)
        sources.append({**asdict(team), "source": evidence})
    missing = sorted({team.code for team in teams} - received)
    if missing:
        raise RosterError("Faltan plantillas de Wikipedia: " + ", ".join(missing))
    return {
        "source": {"provider": "Wikipedia", "license": "CC-BY-SA-4.0",
                   "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
                   "source_url": "https://en.wikipedia.org/wiki/Category:NBA_roster_navigational_boxes"},
        "selection_kind": "current_roster_snapshot", "players": players,
        "teams": sources, "warnings": warnings,
        "coverage": {"snapshot_as_of_utc": utc_now(), "player_completeness": "not_verified"},
        "source_identifiers": {"wikipedia_revisions": [
            {"team_code": team["code"], "page_title": team["source"]["page_title"],
             "revision_id": team["source"]["revision_id"]} for team in sources]},
        "source_requests": [request_id],
    }


def validate_selection(selection: dict, teams: tuple[Team, ...] = TEAMS) -> None:
    expected = {team.code for team in teams}
    counts = Counter(player["team_code"] for player in selection["players"])
    if set(counts) != expected:
        raise RosterError("La selección no cubre exactamente los equipos esperados.")
    if selection["selection_kind"] == "current_roster_snapshot":
        by_name = defaultdict(list)
        for player in selection["players"]:
            by_name[normalized_name(player["name"])].append(player)
        for group in by_name.values():
            if len(group) > 1:
                for player in group:
                    player["needs_review"] = True
                selection["warnings"].append({
                    "code": "name_in_multiple_current_teams", "name": group[0]["name"],
                    "team_codes": [player["team_code"] for player in group],
                    "message": "Posible desactualización o coincidencia de nombres; requiere revisión.",
                })
        unique = len(by_name)
    else:
        unique = len({player["source_player_id"] for player in selection["players"]})
    selection["players"].sort(key=lambda player: (player["team_code"], player["name"] or "", player["source_player_id"] or ""))
    selection["teams"].sort(key=lambda team: team["code"])
    selection["coverage"].update({"expected_teams": len(teams), "teams_with_players": len(counts),
                                  "player_team_entries": len(selection["players"]),
                                  "distinct_source_players": unique,
                                  "entries_needing_review": sum(p["needs_review"] for p in selection["players"]),
                                  "entries_by_team": dict(sorted(counts.items()))})


def build_rosters(season: str, *, provenance_dir: Path | str = DEFAULT_PROVENANCE_DIR,
                  timeout: float = 60, retries: int = 2, user_agent: str = USER_AGENT,
                  client_factory=HttpClient, today: date | None = None) -> dict:
    
    season = normalize_season(season)
    if not math.isfinite(timeout) or not 0 < timeout <= 60 or retries < 0:
        raise RosterError("timeout debe estar entre 0 y 60 segundos y retries debe ser >= 0.")
    run = Run(Path(provenance_dir), season)
    try:
        if season == "2026-27":
            now = today or datetime.now(timezone.utc).date()
            current_start = now.year if now.month >= 7 else now.year - 1
            if current_start != 2026:
                raise RosterError("Las plantillas de Wikipedia son actuales: no pueden reconstruir 2026-27 en esta fecha.")
        client = client_factory(run, timeout=timeout, retries=retries, user_agent=user_agent)
        selection = wikidata_rosters(client) if season == "2025-26" else wikipedia_rosters(client)
        validate_selection(selection)
        snapshot = run.folder / "rosters.json"
        latest = run.root / "rosters" / season / "latest.json"
        selection.update({"format_version": 1, "season": season, "run_id": run.id,
                          "captured_at_utc": utc_now(),
                          "provenance": {"run_log": run.relative(run.report_path),
                                         "snapshot": run.relative(snapshot),
                                         "requests": run.data["requests"]}})
        run.data["warnings"] = selection["warnings"]
        run.data["source_identifiers"] = selection["source_identifiers"]
        atomic_json(snapshot, selection)
        run.data["result"] = {"snapshot": run.relative(snapshot), "latest": run.relative(latest),
                              "sha256": sha256(snapshot.read_bytes()).hexdigest(),
                              "coverage": selection["coverage"]}
        
        atomic_json(latest, selection)
        run.finish("success_with_warnings" if selection["warnings"] else "success")
        return selection
    except BaseException as exc:
        try:
            run.finish("interrupted" if isinstance(exc, (KeyboardInterrupt, SystemExit)) else "failed", exc)
        except Exception as report_error:
            
            LOG.error("No se pudo finalizar el registro %s (%s).", run.report_path,
                      type(report_error).__name__)
        raise


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--season", required=True)
    parser.add_argument("--provenance-dir", type=Path, default=DEFAULT_PROVENANCE_DIR)
    parser.add_argument("--timeout", type=float, default=60)
    parser.add_argument("--retries", type=int, default=2, help="Reintentos adicionales, por defecto 2")
    parser.add_argument("--user-agent", default=os.getenv("WIKIMEDIA_USER_AGENT", USER_AGENT))
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        result = build_rosters(args.season, provenance_dir=args.provenance_dir,
                               timeout=args.timeout, retries=args.retries, user_agent=args.user_agent)
        coverage = result["coverage"]
        LOG.info("%s: %s equipos; %s jugadores de fuente; %s relaciones jugador-equipo.",
                 result["season"], coverage["teams_with_players"],
                 coverage["distinct_source_players"], coverage["player_team_entries"])
        for warning in result["warnings"]:
            LOG.warning("%s: %s", warning["code"], warning["message"])
        LOG.info("Selección: %s", args.provenance_dir / result["provenance"]["snapshot"])
        LOG.info("Registro: %s", args.provenance_dir / result["provenance"]["run_log"])
        return 0
    except KeyboardInterrupt:
        LOG.warning("Interrumpido. Consulta el registro en %s/runs/.", args.provenance_dir)
        return 130
    except (RosterError, OSError) as exc:
        LOG.error("%s", exc)
        LOG.error("Consulta el registro disponible en %s/runs/.", args.provenance_dir)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
