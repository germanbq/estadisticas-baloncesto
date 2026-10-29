"""Archivo de condiciones y trazabilidad para los nuevos importadores.

Solo utiliza la biblioteca estándar de Python 3.10+.
Uso independiente:
    py database/scripts/balldontlie_provenance.py

Uso desde un importador:
    with ImportRun(PROVENANCE_DIR, script=__file__, season="2025-26") as run:
        # Descargar realmente de BALLDONTLIE y registrar cada respuesta.
        run.record_fetch("/v1/games", {"seasons[]": 2025}, [123], http_status=200)
        # Registrar escrituras solamente después de confirmar la transacción.
        run.record_committed_rows("games", [local_game_id])
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
import logging
import os
from pathlib import Path
import re
import tempfile
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4

TERMS_URL = "https://www.balldontlie.io/terms.html"
MAX_TERMS_BYTES = 2 * 1024 * 1024
DEFAULT_DIRECTORY = Path(__file__).resolve().parent.parent / "provenance"
LOG = logging.getLogger("balldontlie_provenance")
_REPLACE_DELAYS = (0.05, 0.1, 0.2, 0.4, 0.8, 1.6)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


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
                raise TermsError(
                    f"Windows no permite reemplazar '{target}' (WinError {code}). "
                    "Comprueba los permisos de la carpeta y cierra las aplicaciones "
                    "que mantengan el archivo abierto. En el importador puedes "
                    "elegir otra carpeta con --provenance-dir. "
                    "Se conserva el archivo anterior."
                ) from exc
            if attempt == 0:
                LOG.warning("Windows bloquea el reemplazo de %s; se reintentará durante 3.15 s.", target)
            time.sleep(_REPLACE_DELAYS[attempt])


def _remove_temporary(path: str) -> None:
    try:
        Path(path).unlink(missing_ok=True)
    except OSError:
        LOG.warning("No se pudo eliminar el temporal %s.", path)


def atomic_json(path: Path, value: Any) -> None:
    
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix="json-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        _replace_file(temporary, path)
    finally:
        _remove_temporary(temporary)


class TermsError(RuntimeError):
    pass


class _OfficialTermsRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        parsed = urlsplit(new_url)
        if (parsed.scheme != "https"
                or parsed.hostname not in {"balldontlie.io", "www.balldontlie.io"}
                or parsed.path != "/terms.html"
                or parsed.username or parsed.password):
            raise TermsError("La página de condiciones redirige a una dirección inesperada.")
        return super().redirect_request(request, fp, code, message, headers, new_url)


def fetch_terms(timeout: float) -> tuple[bytes, dict[str, Any]]:
    request = Request(TERMS_URL, headers={
        "User-Agent": "Stats-terms-archive/1.0",
        "Accept-Encoding": "identity",
    })
    try:
        with build_opener(_OfficialTermsRedirects()).open(request, timeout=timeout) as response:
            data = response.read(MAX_TERMS_BYTES + 1)
            if response.status != 200 or len(data) > MAX_TERMS_BYTES:
                raise TermsError("Respuesta de condiciones no válida o demasiado grande.")
            metadata = {
                "source_url": TERMS_URL,
                "final_url": response.url,
                "http_status": response.status,
                "retrieved_at_utc": utc_now(),
                "response_headers": {
                    name: response.headers[name]
                    for name in ("Date", "Content-Type", "ETag", "Last-Modified")
                    if name in response.headers
                },
            }
    except HTTPError as exc:
        raise TermsError(f"No se pudieron descargar las condiciones: HTTP {exc.code}.") from None
    except (URLError, TimeoutError, OSError):
        raise TermsError("No se pudieron descargar las condiciones por un error de conexión.") from None
    return data, metadata


class _TermsText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current: str | None = None
        self.parts: list[str] = []
        self.blocks: list[tuple[str, str]] = []
        self.skip = 0
        self.started = False
        self.stopped = False

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.skip += 1
        if tag == "h1" and not self.skip and not self.started:
            self.started = True
        if (self.started and not self.stopped and not self.skip
                and tag in {"h1", "h2", "h3", "p", "li"}):
            if self.current:
                raise TermsError("La estructura de las condiciones ha cambiado; revisar la página.")
            self.current, self.parts = tag, []
        if tag == "br" and self.current:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag == self.current:
            text = " ".join("".join(self.parts).split())
            if tag in {"h2", "h3"} and not re.match(r"^\d+\.", text):
                self.stopped = True
            elif text:
                self.blocks.append((tag, text))
            self.current, self.parts = None, []
        if tag in {"script", "style"}:
            self.skip -= 1

    def handle_data(self, data):
        if self.current and not self.skip:
            self.parts.append(data)


def terms_text(raw_html: bytes) -> tuple[str, str | None]:
    try:
        parser = _TermsText()
        parser.feed(raw_html.decode("utf-8-sig"))
    except UnicodeError:
        raise TermsError("Las condiciones no se pueden leer como UTF-8.") from None
    headings = [text for tag, text in parser.blocks if tag in {"h2", "h3"}]
    if (not parser.blocks or parser.blocks[0] != ("h1", "Terms of Service")
            or not any("Permitted Use of Data" in text for text in headings)
            or not any("Intellectual Property" in text for text in headings)
            or not any("Contact Us" in text for text in headings)):
        raise TermsError("No se ha reconocido el documento completo de condiciones.")
    updated = next((text.partition(":")[2].strip() for _, text in parser.blocks
                    if text.startswith("Last Updated:")), None)
    return "\n\n".join(text for _, text in parser.blocks) + "\n", updated


@dataclass(frozen=True)
class TermsSnapshot:
    source_url: str
    checked_at_utc: str
    archived_at_utc: str
    html_sha256: str
    text_sha256: str
    declared_last_updated: str | None
    html_file: str
    text_file: str
    capture_file: str


def archive_terms(directory: Path, *, timeout: float = 30,
                  fetcher: Callable = fetch_terms) -> TermsSnapshot:
    
    if timeout <= 0:
        raise ValueError("timeout debe ser mayor que cero")
    directory = Path(directory)
    raw, metadata = fetcher(timeout)
    if not raw or len(raw) > MAX_TERMS_BYTES:
        raise TermsError("Archivo de condiciones vacío o demasiado grande.")
    text, updated = terms_text(raw)
    raw_hash = sha256(raw).hexdigest()
    text_hash = sha256(text.encode("utf-8")).hexdigest()
    target = directory / "terms" / raw_hash
    target.mkdir(parents=True, exist_ok=True)
    html_file = target / "original.html"
    text_file = target / "terms.txt"
    capture_file = target / "capture.json"
    if capture_file.exists():
        previous = json.loads(capture_file.read_text(encoding="utf-8"))
        if (not html_file.is_file() or sha256(html_file.read_bytes()).hexdigest() != raw_hash
                or not text_file.is_file() or sha256(text_file.read_bytes()).hexdigest() != text_hash
                or previous.get("html_sha256") != raw_hash
                or previous.get("text_sha256") != text_hash):
            raise TermsError("La copia archivada no coincide con sus huellas; revisar los archivos.")
        archived_at = previous["retrieved_at_utc"]
    else:
        
        for path, contents in ((html_file, raw), (text_file, text.encode("utf-8"))):
            fd, temporary = tempfile.mkstemp(prefix="terms-", suffix=".tmp", dir=target)
            try:
                with os.fdopen(fd, "wb") as stream:
                    stream.write(contents)
                    stream.flush()
                    os.fsync(stream.fileno())
                _replace_file(temporary, path)
            finally:
                _remove_temporary(temporary)
        archived_at = metadata["retrieved_at_utc"]
        atomic_json(capture_file, {
            **metadata, "html_sha256": raw_hash, "text_sha256": text_hash,
            "declared_last_updated": updated, "size_bytes": len(raw),
        })
    return TermsSnapshot(
        TERMS_URL, metadata["retrieved_at_utc"], archived_at, raw_hash, text_hash,
        updated, str(html_file.relative_to(directory)), str(text_file.relative_to(directory)),
        str(capture_file.relative_to(directory)),
    )


def _public_params(params: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in params.items()
            if not re.search(r"key|token|secret|authorization|password", key, re.I)}


class ImportRun:
    
    def __init__(self, directory: Path, *, script: str, season: str | None = None,
                 timeout: float = 30, fetcher: Callable = fetch_terms):
        self.directory = Path(directory)
        self.timeout = timeout
        self.fetcher = fetcher
        self.id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ_") + uuid4().hex
        self.path = self.directory / "runs" / f"{self.id}.json"
        self.data: dict[str, Any] = {
            "format_version": 1, "run_id": self.id, "provider": "BALLDONTLIE",
            "script": Path(script).name, "season": season,
            "started_at_utc": utc_now(), "finished_at_utc": None,
            "status": "running", "terms": None, "events": [],
        }

    def _save(self):
        atomic_json(self.path, self.data)

    def _finish(self, exc_type=None):
        self.data["finished_at_utc"] = utc_now()
        self.data["status"] = (
            "success" if exc_type is None else
            "interrupted" if issubclass(exc_type, (KeyboardInterrupt, SystemExit)) else "failed"
        )
        if exc_type is not None:
            
            self.data["error_type"] = exc_type.__name__
        self._save()

    def __enter__(self):
        self._save()
        try:
            self.data["terms"] = asdict(archive_terms(
                self.directory, timeout=self.timeout, fetcher=self.fetcher))
            self._save()
        except BaseException as exc:
            try:
                self._finish(type(exc))
            except Exception as report_error:
                LOG.error("No se pudo finalizar el registro %s (%s).", self.path,
                          type(report_error).__name__)
            raise
        return self

    def __exit__(self, exc_type, exc, traceback):
        try:
            self._finish(exc_type)
        except Exception as report_error:
            if exc_type is None:
                raise
            LOG.error("No se pudo finalizar el registro %s (%s).", self.path,
                      type(report_error).__name__)
        return False

    def record_fetch(self, endpoint: str, params: dict[str, Any], record_ids: list[int],
                     *, http_status: int, response_sha256: str | None = None):
        
        if not endpoint.startswith("/") or endpoint.startswith("//") or any(c in endpoint for c in "?#"):
            raise ValueError("endpoint debe ser solo la ruta, sin dominio ni parámetros")
        self.data["events"].append({
            "kind": "fetch", "at_utc": utc_now(), "endpoint": endpoint,
            "params": _public_params(params), "http_status": http_status,
            "provider_record_ids": sorted(set(record_ids)),
            "response_sha256": response_sha256,
        })
        self._save()

    def record_committed_rows(self, table: str, local_ids: list[int]):
        
        if not re.fullmatch(r"[a-z_][a-z0-9_]*", table):
            raise ValueError("Nombre de tabla no válido")
        self.data["events"].append({
            "kind": "database_commit", "at_utc": utc_now(), "table": table,
            "local_record_ids": sorted(set(local_ids)),
        })
        self._save()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Archivar condiciones y registrar esta ejecución.")
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_DIRECTORY)
    parser.add_argument("--timeout", type=float, default=30)
    args = parser.parse_args(argv)
    if args.timeout <= 0:
        parser.error("--timeout debe ser mayor que cero")
    run = ImportRun(args.archive_dir, script=__file__, timeout=args.timeout)
    try:
        with run:
            print("Condiciones archivadas:", args.archive_dir / run.data["terms"]["html_file"])
        print("Registro de ejecución:", run.path)
        return 0
    except KeyboardInterrupt:
        print("Interrumpido. Registro:", run.path)
        return 130
    except (TermsError, OSError, ValueError) as exc:
        print("Error:", str(exc))
        print("Registro de ejecución:", run.path)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
