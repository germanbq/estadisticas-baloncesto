"""Importar equipos, jugadores y calendario con BALLDONTLIE y Wikidata.

    py database/scripts/import_reference_data.py --season 2025-26 --dry-run
    py database/scripts/import_reference_data.py --season 2026-27

Wikidata completa entrenador y estadio. Compatible con el esquema original.
Reutiliza rosters.py; archiva condiciones y cada descarga. No importa resultados
ni estadísticas reales. Requiere Python 3.10+, psycopg[binary] y python-dotenv
para la importación a PostgreSQL y la lectura de .env.local, respectivamente.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from hashlib import sha256
import json
import logging
import math
import os
from pathlib import Path
import re
import time
import unicodedata
import rosters as roster_source
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

from balldontlie_provenance import ImportRun, TermsError
from rosters import (TEAMS, RosterError, atomic_bytes, atomic_json, build_rosters,
                     normalize_season, normalized_name, retry_seconds, utc_now)

LOG = logging.getLogger("import_reference_data")
ROOT = Path(__file__).resolve().parents[2]
VERSION = "1.1.0"
API_URL = "https://api.balldontlie.io"

ENDPOINTS = {"teams": "/nba/v1/teams", "players": "/nba/v1/players", "games": "/nba/v1/games"}
MIN_DELAY = 12.5  
MAX_BYTES = 16 * 1024 * 1024
POSITIONS = {"PG", "SG", "SF", "PF", "C", "G", "F"}
OPTIONAL_FIELDS = ("height", "weight", "draft", "country", "jersey_number", "position")


class ReferenceError(RuntimeError):
    pass


def integer(value, label: str, *, minimum: int = 1) -> int:
    if isinstance(value, bool) or not re.fullmatch(r"[0-9]+", str(value)) or int(value) < minimum:
        raise ReferenceError(f"{label}: se esperaba un entero >= {minimum}.")
    return int(value)


def text(value, label: str) -> str:
    if not isinstance(value, str) or value.strip().upper() in {"", "-", "N/A", "NULL", "NONE", "TBD"}:
        raise ReferenceError(f"Falta {label}.")
    return value.strip()


def decode_json(raw: bytes) -> dict:
    def invalid_constant(value):
        raise ValueError(value)
    try:
        result = json.loads(raw, parse_constant=invalid_constant)
        if not isinstance(result, dict):
            raise ValueError
        return result
    except (ValueError, UnicodeError):
        raise ReferenceError("JSON inválido o truncado; no se utiliza parcialmente.") from None


def json_ready(value):
    if isinstance(value, (Decimal, Path)):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: json_ready(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_ready(item) for item in value]
    return value


def warn(run, code: str, message: str, **details):
    run.data["warnings"].append({"code": code, "message": message, **details})
    LOG.warning("%s: %s", code, message)


class ReferenceRun(ImportRun):
    def __init__(self, directory, *, season, dry_run=False, **kwargs):
        super().__init__(directory, script=__file__, season=season, **kwargs)
        self.folder = self.directory / "imports" / self.id
        self.data.update({"script_version": VERSION,
                          "script_sha256": sha256(Path(__file__).read_bytes()).hexdigest(),
                          "dry_run": dry_run, "warnings": [], "skipped_players": [],
                          "pending_games": [], "excluded_games": [], "statistics_imported": False,
                          "providers": ["BALLDONTLIE"], "requests": [],
                          "database": {"status": "not_started"}, "result": None})

    def save(self):
        
        self._save()

    def _finish(self, exc_type=None):
        self.data["finished_at_utc"] = utc_now()
        if exc_type is not None:
            self.data["status"] = "interrupted" if issubclass(exc_type, (KeyboardInterrupt, SystemExit)) else "failed"
            self.data["error_type"] = exc_type.__name__
        elif self.data["dry_run"]:
            self.data["status"] = "prepared_with_warnings" if self.data["warnings"] else "prepared"
        else:
            self.data["status"] = "success_with_warnings" if self.data["warnings"] else "success"
        self._save()

    def event(self, **data):
        self.data["events"].append({"at_utc": utc_now(), **json_ready(data)})
        self._save()

    def relative(self, path):
        return Path(path).relative_to(self.directory).as_posix()


class _NoApiRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


class BallDontLieClient:
    def __init__(self, run: ReferenceRun, api_key: str, *, delay=MIN_DELAY, timeout=30,
                 retries=2, refresh=False, cache_ttl=86400, opener=None,
                 sleep=time.sleep, clock=time.monotonic):
        self.run, self.api_key = run, api_key
        self.delay, self.timeout, self.retries = max(MIN_DELAY, delay), timeout, retries
        self.refresh, self.cache_ttl = refresh, cache_ttl
        self.opener = opener or build_opener(_NoApiRedirects())
        self.sleep, self.clock, self.last_request = sleep, clock, None
        self.requests, self.cache_hits = 0, 0

    def wait(self, seconds):
        while seconds > 0:
            interval = min(seconds, 30)
            self.sleep(interval)
            seconds -= interval

    def _cache(self, endpoint, params):
        key = json.dumps({"endpoint": endpoint, "params": params}, sort_keys=True, separators=(",", ":"))
        return self.run.directory / "cache" / (sha256(key.encode()).hexdigest() + ".json")

    def _from_cache(self, path, endpoint, params):
        if self.refresh or self.cache_ttl <= 0 or not path.is_file():
            return None
        try:
            cached = decode_json(path.read_bytes())
            stamp = datetime.fromisoformat(cached["downloaded_at_utc"])
            age = (datetime.now(timezone.utc) - stamp).total_seconds()
            if (cached["provider"] != "BALLDONTLIE" or cached["endpoint"] != endpoint
                    or cached["params"] != params or not 0 <= age < self.cache_ttl):
                return None
            source = (self.run.directory / cached["response_file"]).resolve()
            if not source.is_relative_to(self.run.directory.resolve()):
                return None
            raw = source.read_bytes()
            if len(raw) > MAX_BYTES or sha256(raw).hexdigest() != cached["response_sha256"]:
                return None
            payload = decode_json(raw)
            self._validate_page(payload, endpoint)
        except (OSError, ReferenceError, KeyError, ValueError, TypeError):
            return None
        self.cache_hits += 1
        self.run.event(kind="cache_reuse", endpoint=endpoint, params=params,
                       provider="BALLDONTLIE", provider_record_ids=[row["id"] for row in payload["data"]],
                       **{key: cached[key] for key in ("downloaded_at_utc", "origin_run_id", "terms_sha256",
                                                       "response_file", "response_sha256")})
        return payload

    @staticmethod
    def _validate_page(payload, endpoint):
        rows = payload.get("data")
        if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
            raise ReferenceError("La API no ha devuelto una lista de registros.")
        for row in rows:
            integer(row.get("id"), "ID de BALLDONTLIE")
        if endpoint != ENDPOINTS["teams"] and not isinstance(payload.get("meta"), dict):
            raise ReferenceError("Falta la información de paginación de BALLDONTLIE.")
        meta = payload.get("meta", {})
        if meta.get("next_cursor") is not None:
            integer(meta["next_cursor"], "next_cursor")

    def page(self, endpoint, params):
        if endpoint not in ENDPOINTS.values():
            raise ReferenceError("Este módulo solo consulta equipos, jugadores y partidos.")
        cache = self._cache(endpoint, params)
        hit = self._from_cache(cache, endpoint, params)
        if hit is not None:
            return hit
        for attempt in range(self.retries + 1):
            if self.last_request is not None:
                self.wait(max(0, self.delay - (self.clock() - self.last_request)))
            self.last_request = self.clock()
            self.requests += 1
            number = len(self.run.data["events"]) + 1
            event = {"kind": "fetch", "provider": "BALLDONTLIE", "endpoint": endpoint,
                     "params": params, "attempt": attempt + 1, "started_at_utc": utc_now(),
                     "http_status": None, "status": "running"}
            self.run.data["events"].append(event)
            self.run._save()
            retry_after, retryable = None, False
            try:
                LOG.info("BALLDONTLIE %s, cursor=%s (intento %s)", endpoint, params.get("cursor", "inicial"), attempt + 1)
                request = Request(API_URL + endpoint + ("?" + urlencode(params, doseq=True) if params else ""), headers={
                    "Authorization": self.api_key, "User-Agent": f"StatsReferenceImporter/{VERSION}",
                    "Accept": "application/json", "Accept-Encoding": "identity"})
                try:
                    with self.opener.open(request, timeout=self.timeout) as response:
                        event["http_status"] = response.status
                        raw = response.read(MAX_BYTES + 1)
                        event["response_headers"] = {name: response.headers[name] for name in
                            ("Date", "Content-Type", "ETag", "Last-Modified") if name in response.headers}
                except HTTPError as exc:
                    retry_after = exc.headers.get("Retry-After") if exc.headers else None
                    retryable = exc.code in {429, 500, 502, 503, 504}
                    event["http_status"] = exc.code
                    detail = " Revisa BALLDONTLIE_API_KEY y el acceso del plan gratuito." if exc.code in {401, 403} else ""
                    raise ReferenceError(f"BALLDONTLIE: HTTP {exc.code}.{detail}") from None
                except (URLError, TimeoutError, OSError):
                    retryable = True
                    raise ReferenceError("Fallo de conexión con BALLDONTLIE.") from None
                if event["http_status"] != 200 or len(raw) > MAX_BYTES:
                    raise ReferenceError("Respuesta de BALLDONTLIE inesperada o demasiado grande.")
                captured = utc_now()
                target = self.run.folder / "raw" / f"{number:04d}_{endpoint.rsplit('/', 1)[-1]}.json"
                atomic_bytes(target, raw)
                metadata = {"provider": "BALLDONTLIE", "endpoint": endpoint, "params": params,
                            "downloaded_at_utc": captured, "origin_run_id": self.run.id,
                            "terms_sha256": self.run.data["terms"]["html_sha256"],
                            "response_file": self.run.relative(target), "response_sha256": sha256(raw).hexdigest()}
                event.update(metadata)
                payload = decode_json(raw)
                self._validate_page(payload, endpoint)
                event.update(status="success", provider_record_ids=[row["id"] for row in payload["data"]])
                atomic_json(cache, metadata)
                return payload
            except ReferenceError as exc:
                event.update(status="failed", error=str(exc))
                failure = exc
            except BaseException as exc:
                event.update(status="interrupted" if isinstance(exc, KeyboardInterrupt) else "failed",
                             error_type=type(exc).__name__)
                raise
            finally:
                event["finished_at_utc"] = utc_now()
                self.run._save()
            if not retryable or attempt >= self.retries:
                raise failure
            pause = retry_seconds(retry_after, attempt + 1)
            if pause > 300:
                raise ReferenceError("El proveedor exige una espera larga; reanuda la importación más tarde.")
            LOG.warning("%s Reintento en %.1f segundos o al terminar el intervalo del plan.", failure, pause)
            self.wait(pause)
        raise ReferenceError("No se pudo descargar la página.")

    def records(self, resource, params=None):
        endpoint = ENDPOINTS[resource]
        params = dict(params or {})
        if resource != "teams":
            params["per_page"] = 100
        seen_cursors, seen_ids, rows = set(), {}, []
        for _ in range(1000):
            payload = self.page(endpoint, params)
            for row in payload["data"]:
                record_id = integer(row["id"], "ID")
                if record_id in seen_ids:
                    if seen_ids[record_id] != row:
                        raise ReferenceError("Un ID aparece con contenido contradictorio dentro de la paginación.")
                    continue
                seen_ids[record_id] = row
                rows.append(row)
            next_cursor = payload.get("meta", {}).get("next_cursor")
            if next_cursor is None:
                return rows
            cursor = integer(next_cursor, "next_cursor")
            if cursor in seen_cursors or not payload["data"]:
                raise ReferenceError("Paginación repetida o vacía con continuación; no se publica una lista incompleta.")
            seen_cursors.add(cursor)
            params = {**params, "cursor": cursor}
        raise ReferenceError("La paginación excede el límite de seguridad del importador.")


def load_selection(args, run, *, builder=build_rosters):
    path = args.rosters_file or args.provenance_dir / "rosters" / args.season / "latest.json"
    if args.refresh_rosters or not path.is_file():
        if args.rosters_file:
            raise ReferenceError("No existe el archivo indicado por --rosters-file.")
        LOG.info("Generando la selección de %s con rosters.py.", args.season)
        builder(args.season, provenance_dir=args.provenance_dir,
                timeout=args.timeout, retries=args.retries)
    if path.stat().st_size > MAX_BYTES:
        raise ReferenceError("La selección de jugadores supera el tamaño permitido.")
    raw = path.read_bytes()
    selection = decode_json(raw)
    if selection.get("format_version") != 1 or selection.get("season") != args.season:
        raise ReferenceError("La selección no corresponde a la temporada o formato solicitados.")
    if selection.get("selection_kind") not in {"season_game_participants", "current_roster_snapshot"}:
        raise ReferenceError("Criterio de selección desconocido.")
    expected = {team.code for team in TEAMS}
    players = selection.get("players")
    if not isinstance(players, list) or not players:
        raise ReferenceError("No hay jugadores en la selección.")
    observed = set()
    for player in players:
        if not isinstance(player, dict) or player.get("team_code") not in expected:
            raise ReferenceError("Equipo inesperado en la selección de jugadores.")
        if player.get("name") is not None:
            text(player["name"], "nombre en la selección")
        if player.get("source_player_id") is not None and not re.fullmatch(r"Q[1-9][0-9]*", player["source_player_id"]):
            raise ReferenceError("Identificador de jugador de la selección no válido.")
        if not player.get("name") and not player.get("source_player_id"):
            raise ReferenceError("Un jugador no tiene nombre ni identificador de origen.")
        if not isinstance(player.get("aliases", []), list) or not all(isinstance(a, str) for a in player.get("aliases", [])):
            raise ReferenceError("Alias de jugador inválidos.")
        if not isinstance(player.get("needs_review", False), bool):
            raise ReferenceError("Marca de revisión de jugador inválida.")
        observed.add(player["team_code"])
    if observed != expected:
        raise ReferenceError("La selección debe cubrir los 30 equipos.")
    archived = run.folder / "rosters_input.json"
    atomic_bytes(archived, raw)
    run.data["rosters"] = {"source_file": str(path), "retained_file": run.relative(archived),
                           "sha256": sha256(raw).hexdigest(), "source_run_id": selection.get("run_id"),
                           "captured_at_utc": selection.get("captured_at_utc"),
                           "provider": selection.get("source", {}).get("provider"),
                           "selection_kind": selection["selection_kind"],
                           "coverage": selection.get("coverage", {})}
    for warning in selection.get("warnings", []):
        warn(run, "roster_" + warning.get("code", "warning"), warning.get("message", "Aviso de rosters.py"))
    run._save()
    return selection


@dataclass
class Team:
    balldontlie_id: int
    name: str
    short_name: str
    logo: str
    conference: str
    division: str
    stadium: str | None = None
    coach: str | None = None
    manual_fields: tuple[str, ...] = ()


def parse_teams(rows):
    canonical = {team.code: team for team in TEAMS}
    selected, ids = {}, set()
    for row in rows:
        code = row.get("abbreviation")
        if code not in canonical:
            continue  
        allowed_names = {normalized_name(canonical[code].name)}
        if code == "LAC":
            allowed_names.add(normalized_name("LA Clippers"))
        if not isinstance(row.get("full_name"), str) or normalized_name(row["full_name"]) not in allowed_names:
            continue  
        source_id = integer(row.get("id"), "team.id")
        if code in selected or source_id in ids:
            raise ReferenceError("Equipos duplicados en BALLDONTLIE.")
        conference = text(row.get("conference"), "conferencia")
        division = text(row.get("division"), "división")
        if conference not in {"East", "West"} or division not in {
                "Atlantic", "Central", "Southeast", "Northwest", "Pacific", "Southwest"}:
            raise ReferenceError("Conferencia o división desconocidas.")
        slug = re.sub(r"[^a-z0-9]+", "-", canonical[code].name.lower()).strip("-")
        selected[code] = Team(source_id, text(row.get("full_name"), "nombre del equipo"),
                              code, f"/logos/{slug}.webp", conference, division)
        ids.add(source_id)
    if set(selected) != set(canonical):
        raise ReferenceError("BALLDONTLIE no devolvió los 30 equipos actuales: " + ", ".join(sorted(canonical.keys() - selected.keys())))
    return sorted(selected.values(), key=lambda team: team.short_name)


def _entity_id(uri):
    if not isinstance(uri, str) or not re.fullmatch(r"https?://www\.wikidata\.org/entity/[QP][1-9][0-9]*", uri):
        raise ReferenceError("Identificador inesperado en la respuesta de Wikidata.")
    return uri.rsplit("/", 1)[-1]


def parse_team_details(payload, *, as_of=None):
    
    as_of = as_of or datetime.now(timezone.utc)
    try:
        rows = payload["results"]["bindings"]
        if not isinstance(rows, list):
            raise TypeError
    except (KeyError, TypeError):
        raise ReferenceError("Respuesta de Wikidata sin resultados de equipos.") from None
    expected = {team.wikidata_id for team in TEAMS}
    grouped = defaultdict(list)
    for row in rows:
        try:
            qid = _entity_id(row["team"]["value"])
            prop = _entity_id(row["property"]["value"])
            target = _entity_id(row["target"]["value"])
            rank = row["rank"]["value"].rsplit("#", 1)[-1]
            label = row.get("targetLabel", {}).get("value")
            start = row.get("start", {}).get("value")
            end = row.get("end", {}).get("value")
            if qid not in expected or prop not in {"P115", "P286"} or not target.startswith("Q"):
                raise ReferenceError("Equipo o propiedad inesperados en Wikidata.")
            if rank not in {"NormalRank", "PreferredRank", "DeprecatedRank"}:
                raise ReferenceError("Rango desconocido en una afirmación de Wikidata.")
            begin = datetime.fromisoformat(start.replace("Z", "+00:00")) if start else None
            finish = datetime.fromisoformat(end.replace("Z", "+00:00")) if end else None
            if any(stamp.tzinfo is None for stamp in (begin, finish) if stamp is not None):
                raise ValueError
        except (KeyError, TypeError, AttributeError, ValueError):
            raise ReferenceError("Afirmación de Wikidata con formato inesperado.") from None
        if rank == "DeprecatedRank" or begin and begin > as_of or finish and finish <= as_of:
            continue
        if not isinstance(label, str) or not label.strip() or re.fullmatch(r"Q[0-9]+", label):
            continue
        grouped[(qid, prop)].append({"entity_id": target, "label": label.strip(), "rank": rank,
                                    "start": start, "end": end,
                                    "statement": row.get("statement", {}).get("value")})
    result = {}
    for team in TEAMS:
        details = {}
        for prop, field in (("P115", "stadium"), ("P286", "coach")):
            candidates = grouped[(team.wikidata_id, prop)]
            preferred = [item for item in candidates if item["rank"] == "PreferredRank"]
            eligible = preferred or candidates
            targets = {item["entity_id"] for item in eligible}
            selected = eligible[0] if len(targets) == 1 else None
            details[field] = {"value": selected["label"] if selected else None,
                              "selected": selected, "candidates": candidates,
                              "selection": "unique_preferred" if selected and preferred else "unique_unended" if selected else "unresolved"}
        result[team.code] = details
    return result


def enrich_team_details(teams, run, *, timeout=30, retries=2, overrides_file=None, client_factory=None):
    
    values = " ".join("wd:" + team.wikidata_id for team in TEAMS)
    query = roster_source.PREFIXES + """SELECT ?team ?property ?statement ?target ?targetLabel ?rank ?start ?end WHERE {
 VALUES ?team { """ + values + """ }
 VALUES ?property { wd:P286 wd:P115 }
 ?property wikibase:claim ?claim; wikibase:statementProperty ?value.
 ?team ?claim ?statement.
 ?statement ?value ?target; wikibase:rank ?rank.
 OPTIONAL { ?statement pq:P580 ?start. }
 OPTIONAL { ?statement pq:P582 ?end. }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul,es". }
}"""
    client = (client_factory or roster_source.HttpClient)(run, timeout=timeout, retries=retries)
    payload, request_id = client.get_json("Wikidata", "wikidata_team_details", roster_source.WIKIDATA_ENDPOINT,
                                           {"query": query, "format": "json"})
    details = parse_team_details(payload)
    overrides = {}
    if overrides_file:
        raw = Path(overrides_file).read_bytes()
        overrides = decode_json(raw)
        override_metadata = overrides.pop("_meta", None)
        for code, fields in overrides.items():
            if code not in details or not isinstance(fields, dict) or set(fields) - {"coach", "stadium"}:
                raise ReferenceError("El JSON manual solo admite códigos de equipo y campos coach/stadium.")
            for field, value in fields.items():
                text(value, f"{code}.{field} manual")
        retained = run.folder / "team_overrides_input.json"
        atomic_bytes(retained, raw)
        run.data["team_overrides"] = {"file": run.relative(retained), "sha256": sha256(raw).hexdigest(),
                                      "metadata": override_metadata}
    missing = []
    for team in teams:
        manual = overrides.get(team.short_name, {})
        team.manual_fields = tuple(sorted(manual))
        for field in ("stadium", "coach"):
            value = manual.get(field, details[team.short_name][field]["value"])
            setattr(team, field, value.strip() if isinstance(value, str) else None)
            if not getattr(team, field):
                missing.append(f"{team.short_name}.{field}")
    run.data["wikidata_team_details"] = {
        "request_id": request_id, "license": "CC0-1.0", "as_of_utc": utc_now(),
        "independently_verified": False, "teams": details,
        "missing_fields": missing,
        "notice": "Los valores sin fecha final o preferentes pueden estar desactualizados. Revisar entrenadores."}
    run.event(kind="team_details_selection", provider="Wikidata", request_id=request_id,
              team_wikidata_ids=[team.wikidata_id for team in TEAMS],
              target_wikidata_ids=sorted({item["selected"]["entity_id"] for d in details.values()
                                          for item in d.values() if item["selected"]}))
    warn(run, "coach_freshness", "Los entrenadores de Wikidata necesitan revisión de actualidad; se conservarán tus correcciones en la BD.")
    if missing:
        raise ReferenceError("Faltan datos inequívocos para mantener los NOT NULL del esquema anterior: "
                             + ", ".join(missing) + ". Completa --team-overrides con los valores comprobados.")


def validate_team_details(teams, *, check_unique=True):
    for field in ("stadium", "coach"):
        seen = {}
        for team in teams:
            value = text(getattr(team, field), f"{team.short_name}.{field}")
            if check_unique and value in seen:
                raise ReferenceError(f"{field} compartido por {seen[value]} y {team.short_name}; el esquema anterior exige UNIQUE. Revisa la fuente o el JSON manual.")
            seen[value] = team.short_name


def measurement(value, kind):
    try:
        if kind == "height":
            match = re.fullmatch(r"(\d+)-(\d+)", str(value).strip())
            if not match or not 0 <= int(match[2]) < 12:
                raise ValueError
            number = (Decimal(match[1]) * 12 + Decimal(match[2])) * Decimal("0.0254")
        else:
            number = Decimal(str(value)) * Decimal("0.45359237")
        if not number.is_finite() or number <= 0:
            raise ValueError
        number = number.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if not 0 < number <= (Decimal("9.99") if kind == "height" else Decimal("999.99")):
            raise ValueError
        return number
    except (InvalidOperation, ValueError):
        raise ReferenceError(f"{kind} no válido.") from None


def position(value):
    raw = text(value, "posición").upper()
    primary = raw.split("-")[0].strip()
    primary = {"GUARD": "G", "FORWARD": "F", "CENTER": "C"}.get(primary, primary)
    if primary not in POSITIONS:
        raise ReferenceError("Posición desconocida.")
    return primary


def optional(value, parser):
    if value is None or isinstance(value, str) and value.strip().upper() in {"", "-", "N/A", "TBD", "NULL", "NONE", "UNKNOWN"}:
        return None
    try:
        return parser(value)
    except ReferenceError:
        return None


def jersey(value):
    result = str(value).strip()
    if not re.fullmatch(r"[0-9]{1,2}", result):
        raise ReferenceError("Dorsal inválido.")
    return result


def player_image(name, aliases, directory):
    keys = {normalized_name(n) for n in [name, *aliases]}
    if directory.is_dir():
        matches = sorted((path for path in directory.iterdir()
                          if path.is_file() and path.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg", ".avif"}
                          and normalized_name(path.stem) in keys),
                         key=lambda path: (path.suffix.lower() != ".webp", path.name))
        if matches:
            return "/players/" + matches[0].name
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    filename = re.sub(r"[^A-Za-z0-9_\- ]", "", ascii_name)
    filename = re.sub(r"[ _]+", "_", filename).strip("_")
    if not filename:
        raise ReferenceError("No se puede preparar la ruta de imagen del jugador.")
    return f"/players/{filename}.webp"


@dataclass
class Player:
    balldontlie_id: int
    name: str
    height: Decimal | None
    weight: Decimal | None
    draft: int | None
    current_team_balldontlie_id: int | None
    country: str | None
    jersey_number: str | None
    position: str | None
    image: str


def parse_players(rows, selection, teams, run, *, image_dir, player_map=None):
    by_id, by_name = {}, defaultdict(list)
    for row in rows:
        source_id = integer(row.get("id"), "player.id")
        try:
            name = text(row.get("first_name"), "nombre de jugador") + " " + text(row.get("last_name"), "apellido de jugador")
        except ReferenceError:
            name = None  
        if source_id in by_id:
            raise ReferenceError("ID repetido en el catálogo de jugadores.")
        by_id[source_id] = (row, name)
        if name:
            by_name[normalized_name(name)].append(source_id)
    if not by_id:
        raise ReferenceError("BALLDONTLIE devolvió un catálogo de jugadores vacío.")
    mapping = player_map or {}
    identities = defaultdict(list)
    for entry in selection["players"]:
        key = entry.get("source_player_id") or normalized_name(entry["name"])
        identities[key].append(entry)
    result, memberships, owners = {}, [], {}
    nba_team_ids = {team.balldontlie_id for team in teams}
    for key, entries in identities.items():
        example = entries[0]
        explicit = mapping.get(key)
        if explicit is None and example.get("name"):
            explicit = mapping.get(example["name"])
        reviewed = isinstance(explicit, dict) and explicit.get("reviewed") is True
        manual_id = explicit.get("balldontlie_id") if isinstance(explicit, dict) else explicit
        candidate_ids = set()
        if manual_id is not None:
            candidate_ids = {integer(manual_id, "ID del mapa manual")}
            if not candidate_ids <= by_id.keys():
                raise ReferenceError(f"El mapa manual referencia un ID ausente del catálogo: {manual_id}.")
        else:
            for entry in entries:
                for name in [entry.get("name"), *entry.get("aliases", [])]:
                    if name:
                        candidate_ids.update(by_name.get(normalized_name(name), []))
        team_codes = sorted({entry["team_code"] for entry in entries})
        reason = None
        if selection["selection_kind"] == "current_roster_snapshot" and len(team_codes) > 1:
            reason = "La misma identidad aparece en varias plantillas actuales; corrige o revisa la copia de rosters."
        elif any(entry.get("needs_review") for entry in entries) and not reviewed:
            reason = "La selección exige revisión; utiliza el mapa manual con reviewed=true tras comprobarla."
        elif len(candidate_ids) != 1:
            reason = "No hay coincidencia de nombre" if not candidate_ids else "Nombre ambiguo; no se elige un jugador automáticamente"
        elif by_id[next(iter(candidate_ids))][1] is None:
            reason = "La ficha seleccionada de BALLDONTLIE no tiene nombre completo."
        if reason:
            run.data["skipped_players"].append({"identity_key": key, "name": example.get("name"),
                "team_codes": team_codes, "reason": reason,
                "candidates": [{"balldontlie_id": cid, "name": by_id[cid][1]} for cid in sorted(candidate_ids)]})
            continue
        source_id = next(iter(candidate_ids))
        if source_id in owners and owners[source_id] != key:
            raise ReferenceError("Dos identidades de la selección se resuelven al mismo jugador de BALLDONTLIE; revisa el mapa.")
        owners[source_id] = key
        row, name = by_id[source_id]
        current_team = row.get("team")
        current_id = current_team.get("id") if isinstance(current_team, dict) else row.get("team_id")
        current_id = optional(current_id, lambda v: integer(v, "team.id"))
        if current_id not in nba_team_ids:
            current_id = None
        draft = optional(row.get("draft_year"), lambda v: integer(v, "draft_year", minimum=0))
        aliases = [entry["name"] for entry in entries if entry.get("name")]
        aliases += [alias for entry in entries for alias in entry.get("aliases", [])]
        player = Player(source_id, name,
                        optional(row.get("height"), lambda v: measurement(v, "height")),
                        optional(row.get("weight"), lambda v: measurement(v, "weight")),
                        draft, current_id, optional(row.get("country"), lambda v: text(v, "país")),
                        optional(row.get("jersey_number"), jersey), optional(row.get("position"), position),
                        player_image(name, aliases, image_dir))
        result[source_id] = player
        missing = [field for field in OPTIONAL_FIELDS if getattr(player, field) is None]
        if missing:
            run.data.setdefault("incomplete_players", []).append({"balldontlie_id": source_id, "name": name, "missing_fields": missing})
        for code in team_codes:
            evidence = [entry.get("evidence", {}) for entry in entries if entry["team_code"] == code]
            memberships.append({"balldontlie_player_id": source_id, "team_code": code,
                                "source_identity": key, "evidence": evidence})
    if not result:
        raise ReferenceError("Ningún jugador seleccionado se pudo identificar en BALLDONTLIE.")
    if run.data["skipped_players"]:
        warn(run, "skipped_players", f"{len(run.data['skipped_players'])} identidades requieren revisión; consulta el informe.")
    if run.data.get("incomplete_players"):
        warn(run, "optional_player_data", f"{len(run.data['incomplete_players'])} fichas tienen campos opcionales ausentes o inválidos; se conservan los jugadores.")
    jerseys = defaultdict(list)
    for player in result.values():
        if player.current_team_balldontlie_id is not None and player.jersey_number is not None:
            jerseys[(player.current_team_balldontlie_id, player.jersey_number)].append(player.balldontlie_id)
    conflicts = [{"team_balldontlie_id": key[0], "jersey_number": key[1], "player_ids": ids}
                 for key, ids in jerseys.items() if len(ids) > 1]
    if conflicts:
        run.data["jersey_conflicts"] = conflicts
        warn(run, "jersey_conflicts", f"{len(conflicts)} dorsales repetidos; se registran sin excluir jugadores.")
    return sorted(result.values(), key=lambda p: p.balldontlie_id), memberships


@dataclass(frozen=True)
class Game:
    balldontlie_id: int
    home_balldontlie_id: int
    away_balldontlie_id: int
    date: datetime
    season_init_year: int
    schedule_status: str
    date_confirmed: bool


def parse_calendar(rows, season, teams, run):
    year = int(season[:4])
    ids = {team.balldontlie_id for team in teams}
    games, counts, pending_ids, excluded_ids = {}, Counter(), {}, set()
    for row in rows:
        source_id = integer(row.get("id"), "game.id")
        if integer(row.get("season"), "game.season") != year:
            raise ReferenceError("BALLDONTLIE devolvió un partido de otra temporada.")
        postseason = row.get("postseason")
        if not isinstance(postseason, bool):
            raise ReferenceError("Falta la clasificación postseason del partido.")
        stage = row.get("ist_stage")
        if stage is not None and not isinstance(stage, str):
            raise ReferenceError("Fase de NBA Cup no válida.")
        if postseason or stage and stage.strip().casefold() == "championship":
            if source_id not in excluded_ids:
                run.data["excluded_games"].append({"balldontlie_id": source_id, "reason": "postseason" if postseason else "cup_final"})
                excluded_ids.add(source_id)
            continue
        home = integer(row.get("home_team", {}).get("id"), "home_team.id")
        away = integer(row.get("visitor_team", {}).get("id"), "visitor_team.id")
        if home == away or home not in ids or away not in ids:
            raise ReferenceError("Partido con equipos iguales o ajenos a los 30 equipos importados.")
        state = str(row.get("status_state") or row.get("status") or "").casefold()
        schedule_status = "canceled" if state in {"canceled", "cancelled", "abandoned"} else "postponed" if row.get("postponed") is True or state == "postponed" else "scheduled"
        try:
            raw_time = row.get("datetime")
            stamp = datetime.fromisoformat(raw_time.replace("Z", "+00:00"))
            if stamp.tzinfo is None or stamp.utcoffset() is None:
                raise ValueError
            stamp = stamp.astimezone(timezone.utc)
            if not year <= stamp.year <= year + 1:
                raise ValueError
        except (ValueError, TypeError, AttributeError):
            pending = {"balldontlie_id": source_id, "home_balldontlie_id": home,
                "away_balldontlie_id": away, "season_init_year": year,
                "schedule_status": schedule_status if schedule_status != "scheduled" else "unconfirmed",
                "reason": "No hay datetime con zona horaria; no se inventa una hora a partir del día."}
            if source_id in games or source_id in pending_ids and pending_ids[source_id] != pending:
                raise ReferenceError("El estado o la hora de un partido cambió entre las consultas; vuelve a descargar el calendario.")
            if source_id not in pending_ids:
                run.data["pending_games"].append(pending)
                pending_ids[source_id] = pending
            continue
        if source_id in pending_ids:
            raise ReferenceError("El estado o la hora de un partido cambió entre las consultas; vuelve a descargar el calendario.")
        game = Game(source_id, home, away, stamp, year, schedule_status, schedule_status == "scheduled")
        if source_id in games:
            if games[source_id] != game:
                raise ReferenceError("Dos consultas devolvieron datos de calendario contradictorios para un partido.")
            continue
        games[source_id] = game
        counts[home] += 1
        counts[away] += 1
    if not games:
        raise ReferenceError("No hay partidos con fecha y equipos válidos para esta temporada.")
    if len(games) != 1230 or any(counts[team_id] != 82 for team_id in ids):
        warn(run, "calendar_coverage", f"Calendario disponible: {len(games)}/1230 partidos con hora; puede haber partidos pendientes de publicación.",
             games_per_team={str(key): counts[key] for key in sorted(ids)})
    if run.data["pending_games"]:
        warn(run, "pending_game_time", f"{len(run.data['pending_games'])} registros sin hora confirmada; quedan en el informe para una ejecución posterior.")
    return sorted(games.values(), key=lambda game: (game.date, game.balldontlie_id))


def collect(args, run, client, selection, *, wikidata_factory=None):
    teams = parse_teams(client.records("teams"))
    enrich_team_details(teams, run, timeout=args.timeout, retries=args.retries,
                        overrides_file=args.team_overrides, client_factory=wikidata_factory)
    validate_team_details(teams, check_unique=False)
    
    
    catalog = client.records("players")
    player_map = {}
    if args.player_map:
        raw_map = args.player_map.read_bytes()
        player_map = decode_json(raw_map)
        retained_map = run.folder / "player_map_input.json"
        atomic_bytes(retained_map, raw_map)
        run.data["player_map"] = {"retained_file": run.relative(retained_map), "sha256": sha256(raw_map).hexdigest()}
    run.data["matching_strategy"] = "normalized_full_name_or_explicit_map_without_fuzzy_matching"
    players, memberships = parse_players(catalog, selection, teams, run,
                                         image_dir=args.public_dir / "players", player_map=player_map)
    rows = client.records("games", {"seasons[]": int(args.season[:4]), "season_type": "regular"})
    
    
    rows += client.records("games", {"seasons[]": int(args.season[:4]), "season_type": "ist"})
    games = parse_calendar(rows, args.season, teams, run)
    run.data["missing_images"] = [{"balldontlie_id": p.balldontlie_id, "name": p.name, "image": p.image}
        for p in players if not (args.public_dir / p.image.lstrip("/")).is_file()]
    if run.data["missing_images"]:
        warn(run, "missing_images", f"{len(run.data['missing_images'])} fotos pendientes; se mantienen sus rutas previstas.")
    run.data["result"] = {"teams": len(teams), "players": len(players), "player_team_entries": len(memberships),
                          "games": len(games), "api_requests": client.requests, "cache_hits": client.cache_hits}
    manifest = {"format_version": 1, "run_id": run.id, "season": args.season, "statistics_source": "future_own_generator",
                "rosters": run.data["rosters"], "teams": [asdict(team) for team in teams],
                "players": [asdict(player) for player in players], "memberships": memberships,
                "games": [asdict(game) for game in games]}
    target = run.folder / "prepared.json"
    atomic_json(target, json_ready(manifest))
    run.data["prepared"] = {"file": run.relative(target), "sha256": sha256(target.read_bytes()).hexdigest()}
    run._save()
    if args.strict and (run.data["skipped_players"] or run.data["pending_games"]):
        raise ReferenceError("--strict: hay jugadores sin identificar o partidos sin hora; no se escribe en PostgreSQL.")
    return teams, players, memberships, games


REQUIRED_COLUMNS = {
    "teams": {"id", "name", "short_name", "logo", "conference", "division", "stadium", "coach"},
    "players": {"id", "name", "height", "weight", "age", "draft", "team_id", "country", "jersey_number", "position", "image"},
    "games": {"id", "home_team_id", "away_team_id", "date", "season_init_year", "finished"},
    "player_season_teams": {"player_id", "team_id", "season_init_year", "source_run_id", "source_identity", "source_evidence"},
}


@dataclass(frozen=True)
class DatabaseLayout:
    id_columns: dict[str, str]
    memberships: bool
    calendar_flags: bool


def check_schema(cursor):
    cursor.execute("""SELECT table_name,column_name,is_nullable,data_type FROM information_schema.columns
                      WHERE table_schema=current_schema() AND table_name IN
                      ('teams','players','games','player_season_teams')""")
    columns = {(table, column): (nullable, kind) for table, column, nullable, kind in cursor.fetchall()}
    for table, required in REQUIRED_COLUMNS.items():
        if table == "player_season_teams" and not any(t == table for t, _ in columns):
            continue
        missing = sorted(column for column in required if (table, column) not in columns)
        if missing:
            raise ReferenceError(f"Esquema incompatible: faltan {table}: {', '.join(missing)}.")
    id_columns = {}
    for table in ("teams", "players", "games"):
        column = "balldontlie_id" if (table, "balldontlie_id") in columns else "nba_id"
        if columns.get((table, column), (None, None))[1] not in {"integer", "bigint"}:
            raise ReferenceError(f"{table} necesita un identificador externo INTEGER/BIGINT (balldontlie_id o nba_id).")
        if column == "balldontlie_id" and columns.get((table, "nba_id"), ("YES",))[0] == "NO":
            raise ReferenceError(f"{table} tiene dos IDs externos obligatorios; no se inventarán identificadores NBA.")
        id_columns[table] = column
    for table, fields in {"players": (*OPTIONAL_FIELDS, "age", "team_id")}.items():
        if any(columns[(table, field)][0] != "YES" for field in fields):
            raise ReferenceError(f"Los campos opcionales de {table} deben admitir NULL.")
    if columns[("players", "jersey_number")][1] not in {"text", "character varying", "character"}:
        raise ReferenceError("El dorsal debe ser texto para conservar valores como 00.")
    flags = [("games", key) in columns for key in ("schedule_status", "date_confirmed")]
    if any(flags) and not all(flags):
        raise ReferenceError("El esquema tiene solo una de las columnas opcionales de estado del calendario.")
    return DatabaseLayout(id_columns, any(t == "player_season_teams" for t, _ in columns), all(flags))


def persist(connection, teams, players, memberships, games, season, run):
    
    from psycopg.types.json import Jsonb
    database = {"status": "writing", "teams": [], "players": [], "games": [], "memberships": 0,
                "calendar": {"inserted": 0, "updated": 0, "unchanged": 0, "preserved_simulated": 0}}
    run.data["database"] = database
    run._save()
    with connection.transaction(), connection.cursor() as cursor:
        layout = check_schema(cursor)
        validate_team_details(teams, check_unique=False)
        tid, pid, gid = (layout.id_columns[table] for table in ("teams", "players", "games"))
        database["provider_id_columns"] = layout.id_columns
        database["id_provider"] = "BALLDONTLIE"
        if "nba_id" in layout.id_columns.values():
            warn(run, "legacy_id_column", "Se conserva el nombre nba_id del esquema original, pero contiene IDs de BALLDONTLIE. No ejecutar sobre datos antiguos de NBA sin reconstruir la BD.")
        cursor.execute("LOCK TABLE teams,players,games" + (",player_season_teams" if layout.memberships else "") + " IN SHARE ROW EXCLUSIVE MODE")
        cursor.execute(f"SELECT id,{tid},short_name,stadium,coach FROM teams")
        existing_teams = {row[1]: row for row in cursor.fetchall()}
        by_code = {row[2]: row for row in existing_teams.values()}
        for team in teams:
            old = by_code.get(team.short_name)
            if old and old[1] != team.balldontlie_id:
                raise ReferenceError("Hay equipos con otros identificadores externos. Esta versión conserva el esquema, pero requiere la reconstrucción con datos de BALLDONTLIE que has previsto.")
            old = existing_teams.get(team.balldontlie_id)
            if old:
                for index, field in ((3, "stadium"), (4, "coach")):
                    if field in team.manual_fields and old[index] != getattr(team, field):
                        
                        cursor.execute(f"UPDATE teams SET {field}=%s WHERE id=%s",
                                       (f"__reference_{run.id}_{field}_{old[0]}", old[0]))
                    elif old[index] and old[index] != getattr(team, field):
                        run.data.setdefault("preserved_team_details", []).append({
                            "team_code": team.short_name, "field": field, "value": old[index],
                            "downloaded_value": getattr(team, field), "origin": "existing_database_value"})
                        setattr(team, field, old[index])
        validate_team_details(teams)
        team_ids = {}
        for team in teams:
            cursor.execute(f"""INSERT INTO teams ({tid},name,short_name,logo,conference,division,stadium,coach)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT ({tid}) DO UPDATE SET
                name=EXCLUDED.name,short_name=EXCLUDED.short_name,
                logo=COALESCE(NULLIF(teams.logo,''),EXCLUDED.logo),
                conference=EXCLUDED.conference,division=EXCLUDED.division,
                stadium=CASE WHEN %s THEN EXCLUDED.stadium ELSE COALESCE(NULLIF(teams.stadium,''),EXCLUDED.stadium) END,
                coach=CASE WHEN %s THEN EXCLUDED.coach ELSE COALESCE(NULLIF(teams.coach,''),EXCLUDED.coach) END
                RETURNING id""", (team.balldontlie_id,team.name,team.short_name,team.logo,team.conference,team.division,
                                   team.stadium,team.coach,"stadium" in team.manual_fields,"coach" in team.manual_fields))
            team_ids[team.balldontlie_id] = cursor.fetchone()[0]
        code_to_id = {team.short_name: team_ids[team.balldontlie_id] for team in teams}
        player_ids = {}
        for player in players:
            cursor.execute(f"""INSERT INTO players
                ({pid},name,height,weight,draft,team_id,country,jersey_number,position,image)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT ({pid}) DO UPDATE SET name=EXCLUDED.name,
                height=COALESCE(EXCLUDED.height,players.height),weight=COALESCE(EXCLUDED.weight,players.weight),
                draft=COALESCE(EXCLUDED.draft,players.draft),team_id=EXCLUDED.team_id,
                country=COALESCE(EXCLUDED.country,players.country),jersey_number=COALESCE(EXCLUDED.jersey_number,players.jersey_number),
                position=CASE WHEN EXCLUDED.position='G' AND players.position IN ('PG','SG') THEN players.position
                              WHEN EXCLUDED.position='F' AND players.position IN ('SF','PF') THEN players.position
                              ELSE COALESCE(EXCLUDED.position,players.position) END,
                image=COALESCE(NULLIF(players.image,''),EXCLUDED.image) RETURNING id""",
                (player.balldontlie_id, player.name, player.height, player.weight, player.draft,
                 team_ids.get(player.current_team_balldontlie_id), player.country, player.jersey_number, player.position, player.image))
            player_ids[player.balldontlie_id] = cursor.fetchone()[0]
        
        
        if layout.memberships and not run.data["skipped_players"]:
            cursor.execute("DELETE FROM player_season_teams WHERE season_init_year=%s", (int(season[:4]),))
        for entry in memberships if layout.memberships else []:
            cursor.execute("""INSERT INTO player_season_teams
                (player_id,team_id,season_init_year,source_run_id,source_identity,source_evidence)
                VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (player_id,team_id,season_init_year)
                DO UPDATE SET source_run_id=EXCLUDED.source_run_id,source_identity=EXCLUDED.source_identity,
                              source_evidence=EXCLUDED.source_evidence""",
                (player_ids[entry["balldontlie_player_id"]], code_to_id[entry["team_code"]], int(season[:4]),
                 run.id, entry["source_identity"], Jsonb(entry["evidence"])))
        database["memberships"] = len(memberships) if layout.memberships else 0
        database["membership_storage"] = "player_season_teams" if layout.memberships else "prepared_json"
        flag_select = "g.schedule_status,g.date_confirmed" if layout.calendar_flags else "'scheduled'::text,TRUE"
        cursor.execute(f"""SELECT g.id,g.{gid},g.home_team_id,g.away_team_id,g.season_init_year,g.date,g.finished,
                           {flag_select},
                           EXISTS(SELECT 1 FROM player_game_stats WHERE game_id=g.id)
                           OR EXISTS(SELECT 1 FROM team_game_stats WHERE game_id=g.id) AS has_stats
                          FROM games AS g WHERE g.season_init_year=%s""", (int(season[:4]),))
        existing = {row[1]: row for row in cursor.fetchall()}
        game_ids = []
        def verify(old, source_id, home, away, year):
            if old and (old[2], old[3], old[4]) != (home, away, year):
                raise ReferenceError(f"El partido {source_id} ya existe con otros equipos o temporada; se revierte la importación.")
        for game in games:
            if not layout.calendar_flags and not game.date_confirmed:
                database.setdefault("unconfirmed_games_not_written", []).append(game.balldontlie_id)
                continue
            home, away = team_ids[game.home_balldontlie_id], team_ids[game.away_balldontlie_id]
            old = existing.get(game.balldontlie_id)
            verify(old, game.balldontlie_id, home, away, game.season_init_year)
            if old:
                if old[6] or old[9]:
                    database["calendar"]["preserved_simulated"] += 1
                    if old[5] != game.date:
                        warn(run, "simulated_game_date", f"Se conserva la fecha del partido simulado {game.balldontlie_id}; el proveedor indica otra.")
                elif (old[5], old[7], old[8]) != (game.date, game.schedule_status, game.date_confirmed):
                    if layout.calendar_flags:
                        cursor.execute("UPDATE games SET date=%s,schedule_status=%s,date_confirmed=%s WHERE id=%s",
                                       (game.date, game.schedule_status, game.date_confirmed, old[0]))
                    else:
                        cursor.execute("UPDATE games SET date=%s WHERE id=%s", (game.date, old[0]))
                    database["calendar"]["updated"] += 1
                else:
                    database["calendar"]["unchanged"] += 1
                game_ids.append(old[0])
            else:
                if layout.calendar_flags:
                    cursor.execute(f"""INSERT INTO games
                        ({gid},home_team_id,away_team_id,date,season_init_year,finished,schedule_status,date_confirmed)
                        VALUES (%s,%s,%s,%s,%s,FALSE,%s,%s) RETURNING id""",
                        (game.balldontlie_id, home, away, game.date, game.season_init_year, game.schedule_status, game.date_confirmed))
                else:
                    cursor.execute(f"""INSERT INTO games
                        ({gid},home_team_id,away_team_id,date,season_init_year,finished)
                        VALUES (%s,%s,%s,%s,%s,FALSE) RETURNING id""",
                        (game.balldontlie_id, home, away, game.date, game.season_init_year))
                game_ids.append(cursor.fetchone()[0])
                database["calendar"]["inserted"] += 1
        for pending in run.data["pending_games"]:
            old = existing.get(pending["balldontlie_id"])
            if old:
                verify(old, pending["balldontlie_id"], team_ids[pending["home_balldontlie_id"]],
                       team_ids[pending["away_balldontlie_id"]], pending["season_init_year"])
                if not old[6] and not old[9] and layout.calendar_flags:
                    cursor.execute("UPDATE games SET date_confirmed=FALSE,schedule_status=%s WHERE id=%s",
                                   (pending["schedule_status"], old[0]))
        database["teams"], database["players"], database["games"] = sorted(team_ids.values()), sorted(player_ids.values()), sorted(game_ids)
    
    database.update(status="committed", committed_at_utc=utc_now())
    run.event(kind="database_commit", local_record_ids={key: database[key] for key in ("teams", "players", "games")},
              memberships=database["memberships"])


def execute(args, *, api_key, database_url=None, terms_fetcher=None,
            client_factory=BallDontLieClient, roster_builder=build_rosters, connect=None, wikidata_factory=None):
    options = {"fetcher": terms_fetcher} if terms_fetcher is not None else {}
    run = ReferenceRun(args.provenance_dir, season=args.season, dry_run=args.dry_run, timeout=args.timeout, **options)
    try:
        with run:
            selection = load_selection(args, run, builder=roster_builder)
            client = client_factory(run, api_key, delay=args.delay, timeout=args.timeout, retries=args.retries,
                                    refresh=args.refresh, cache_ttl=args.cache_ttl)
            teams, players, memberships, games = collect(args, run, client, selection, wikidata_factory=wikidata_factory)
            if args.dry_run:
                run.data["database"]["status"] = "not_requested"
            else:
                if connect is None:
                    try:
                        import psycopg
                    except ImportError:
                        raise ReferenceError('Instala psycopg: py -m pip install "psycopg[binary]>=3.1,<4"') from None
                    connect = psycopg.connect
                if not database_url:
                    raise ReferenceError("Falta DATABASE_URL.")
                with connect(database_url, connect_timeout=10, autocommit=True, prepare_threshold=None) as connection:
                    persist(connection, teams, players, memberships, games, args.season, run)
            run._save()
    except BaseException as exc:
        if run.data["database"]["status"] == "writing":
            
            
            disconnected = any(cls.__name__ in {"OperationalError", "InterfaceError"}
                               for cls in type(exc).__mro__)
            run.data["database"]["status"] = "outcome_unknown" if disconnected else "rolled_back"
        if isinstance(exc, (ReferenceError, RosterError, TermsError)):
            run.data["error"] = {"type": type(exc).__name__, "message": str(exc)}
        elif getattr(exc, "sqlstate", None):
            run.data["error"] = {"type": type(exc).__name__, "sqlstate": exc.sqlstate,
                                 "constraint": getattr(exc.diag, "constraint_name", None)}
        if run.data["database"]["status"] == "committed":
            LOG.error("PostgreSQL ya confirmó los cambios; ocurrió un error posterior al guardar el informe.")
        run._save()
        raise
    finally:
        LOG.info("Registro: %s", run.path)
    return run


def arguments(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--season", required=True)
    parser.add_argument("--dry-run", action="store_true", help="Descargar y preparar sin conectar a PostgreSQL")
    parser.add_argument("--strict", action="store_true", help="Abortar si quedan jugadores sin resolver o partidos sin hora")
    parser.add_argument("--refresh", action="store_true", help="Ignorar la caché de respuestas de BALLDONTLIE")
    roster = parser.add_mutually_exclusive_group()
    roster.add_argument("--refresh-rosters", action="store_true", help="Volver a ejecutar rosters.py")
    roster.add_argument("--rosters-file", type=Path, help="Usar una copia concreta de rosters.json")
    parser.add_argument("--player-map", type=Path, help="JSON de identidades verificadas manualmente")
    default_overrides = Path(__file__).with_name("team_overrides.json")
    parser.add_argument("--team-overrides", type=Path, default=default_overrides if default_overrides.is_file() else None,
                        help="JSON de correcciones; usa team_overrides.json junto al script si existe")
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.local")
    parser.add_argument("--provenance-dir", type=Path, default=ROOT / "database/provenance")
    parser.add_argument("--public-dir", type=Path, default=ROOT / "public")
    parser.add_argument("--cache-ttl", type=float, default=86400, help="Segundos de validez de cada página; 0 desactiva reutilización")
    parser.add_argument("--delay", type=float, default=MIN_DELAY, help="Intervalo mínimo entre peticiones; mínimo 12.5 s")
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--retries", type=int, default=2, help="Reintentos adicionales por petición")
    args = parser.parse_args(argv)
    try:
        args.season = normalize_season(args.season)
    except RosterError as exc:
        parser.error(str(exc))
    if (not all(math.isfinite(v) for v in (args.delay, args.timeout, args.cache_ttl))
            or args.delay < MIN_DELAY or not 0 < args.timeout <= 60 or args.retries < 0 or args.cache_ttl < 0):
        parser.error("delay >= 12.5, 0 < timeout <= 60, retries >= 0 y cache-ttl >= 0")
    return args


def main(argv=None):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = arguments(argv)
    if args.env_file.is_file():
        try:
            from dotenv import load_dotenv
        except ImportError:
            LOG.error("Instala python-dotenv para leer %s.", args.env_file)
            return 1
        load_dotenv(args.env_file, override=False)
    api_key, database_url = os.getenv("BALLDONTLIE_API_KEY"), os.getenv("DATABASE_URL")
    if not api_key or not api_key.strip():
        LOG.error("Falta BALLDONTLIE_API_KEY en el entorno o en %s.", args.env_file)
        return 1
    if not args.dry_run and not database_url:
        LOG.error("Falta DATABASE_URL en el entorno o en %s.", args.env_file)
        return 1
    try:
        run = execute(args, api_key=api_key.strip(), database_url=database_url)
        result = run.data["result"]
        LOG.info("%s: %s equipos, %s jugadores, %s relaciones de temporada y %s partidos.",
                 "Preparado" if args.dry_run else "Importado", result["teams"], result["players"],
                 result["player_team_entries"], result["games"])
        LOG.info("Datos preparados: %s", args.provenance_dir / run.data["prepared"]["file"])
        return 0
    except KeyboardInterrupt:
        LOG.warning("Interrumpido. Puedes repetir el comando para reutilizar las descargas válidas.")
        return 130
    except (ReferenceError, RosterError, TermsError) as exc:
        LOG.error("%s", exc)
        return 1
    except Exception as exc:
        
        LOG.error("%s durante la importación. Consulta el registro en %s/runs/.", type(exc).__name__, args.provenance_dir)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
