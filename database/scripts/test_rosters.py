"""Pruebas sin red: parsing, trazabilidad y conservación de la última selección."""
import io
import json
from datetime import date
from hashlib import sha256
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rosters as r


def players_text(team, count=6):
    return "\n".join(
        "{{player2|first=" + team.code + str(n) + "|last=Example|note=TW}}"
        for n in range(count)
    )


def wiki_payload(teams=r.TEAMS):
    return {"query": {"pages": [
        {"title": f"Template:{team.name} roster", "pageid": n + 1,
         "revisions": [{"revid": n + 100, "timestamp": "2026-10-29T12:00:00Z",
                        "slots": {"main": {"content": players_text(team)}}}]}
        for n, team in enumerate(teams)
    ]}}


def binding(**values):
    return {key: {"value": str(value)} for key, value in values.items()}


def sparql(rows):
    return {"results": {"bindings": rows}}


def wd_games():
    return sparql([binding(
        game=f"http://www.wikidata.org/entity/Q{100000 + n}",
        source=f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_00225{n:05d}.json"
    ) for n in range(1, 1231)])


def wd_players(teams=r.TEAMS):
    return sparql([binding(player=f"http://www.wikidata.org/entity/Q{200000 + n}",
                           playerLabel=f"Example {team.code}",
                           team=f"http://www.wikidata.org/entity/{team.wikidata_id}",
                           gameCount=50)
                   for n, team in enumerate(teams)])


class Response(io.BytesIO):
    def __init__(self, value, headers=None):
        super().__init__(value if isinstance(value, bytes) else json.dumps(value).encode())
        self.status = 200
        self.headers = headers or {"Content-Type": "application/json"}


class Opener:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        if not self.responses:
            raise AssertionError("Petición no prevista por la prueba")
        value = self.responses.pop(0)
        if isinstance(value, BaseException):
            raise value
        return value if isinstance(value, Response) else Response(value)


def factory(opener):
    return lambda run, **kwargs: r.HttpClient(run, opener=opener, sleep=lambda delay: None, **kwargs)


class SourceClient:
    def __init__(self, *payloads):
        self.payloads = iter(payloads)
        self.request_id = 0

    def get_json(self, *args, **kwargs):
        self.request_id += 1
        return next(self.payloads), self.request_id


class ParserTests(unittest.TestCase):
    def test_seasons_and_invalid_paths(self):
        self.assertEqual(r.normalize_season("2025-2026"), "2025-26")
        self.assertEqual(r.normalize_season(" 2026-27 "), "2026-27")
        for value in ["2025", "2025-27", "2024-25", "../../2026-27", "2026-2026"]:
            with self.subTest(value=value), self.assertRaises(r.RosterError):
                r.normalize_season(value)

    def test_nested_multiline_links_comments_and_alias(self):
        text = players_text(r.TEAMS[0], 5) + """
<!-- {{player2|first=Ignored|last=Example}} -->
{{player2
 | first = {{nowrap|Hansen}}
 | last = [[Yang Hansen|Yang]]
 | link = Yang Hansen
 | note = TW
 | inj = yes
}}
"""
        players, warnings = r.parse_wikipedia_players(text, r.TEAMS[0], {"revision_id": 12})
        self.assertEqual(len(players), 6)
        self.assertEqual(players[-1]["name"], "Hansen Yang")
        self.assertEqual(players[-1]["aliases"], ["Yang Hansen"])
        self.assertEqual(players[-1]["evidence"], {"revision_id": 12})
        self.assertEqual(warnings, [])

    def test_unsigned_excluded_but_two_way_included(self):
        text = players_text(r.TEAMS[0])
        for marker in ["DP", "FA"]:
            text += "{{player2|first=" + marker + "|last=Unsigned|note=" + marker + "}}"
        players, warnings = r.parse_wikipedia_players(text, r.TEAMS[0], {})
        self.assertEqual(len(players), 6)
        self.assertEqual(len(warnings), 2)

    def test_unknown_broken_or_empty_format_is_rejected(self):
        cases = ["", "{{player2|first=A|last=B", "{{player3|first=A|last=B}}",
                 players_text(r.TEAMS[0]) + "{{player2|first=A}}",
                 players_text(r.TEAMS[0]) + "{{player2|first={{unknown|A}}|last=B}}",
                 players_text(r.TEAMS[0]) + "{{player2|first=A|first=B|last=C}}"]
        for text in cases:
            with self.subTest(text=text[-90:]), self.assertRaises(r.RosterError):
                r.parse_wikipedia_players(text, r.TEAMS[0], {})

    def test_duplicate_player_within_team_rejected(self):
        text = players_text(r.TEAMS[0]) + "{{player2|first=ATL0|last=Example}}"
        with self.assertRaises(r.RosterError):
            r.parse_wikipedia_players(text, r.TEAMS[0], {})

    def test_all_wikipedia_teams_and_permanent_revisions(self):
        result = r.wikipedia_rosters(SourceClient(wiki_payload()))
        r.validate_selection(result)
        self.assertEqual(result["coverage"]["teams_with_players"], 30)
        self.assertEqual(result["coverage"]["player_team_entries"], 180)
        self.assertTrue(all("oldid=" in p["evidence"]["revision_url"] for p in result["players"]))
        self.assertTrue(all(p["balldontlie_id"] is None for p in result["players"]))

    def test_missing_team_or_revision_rejected(self):
        payload = wiki_payload()
        payload["query"]["pages"].pop()
        with self.assertRaises(r.RosterError):
            r.wikipedia_rosters(SourceClient(payload))
        payload = wiki_payload()
        del payload["query"]["pages"][0]["revisions"][0]["slots"]
        with self.assertRaises(r.RosterError):
            r.wikipedia_rosters(SourceClient(payload))

    def test_current_duplicate_name_flagged_without_guessing_identity(self):
        result = r.wikipedia_rosters(SourceClient(wiki_payload()))
        result["players"][6]["name"] = result["players"][0]["name"]
        r.validate_selection(result)
        self.assertEqual(result["coverage"]["entries_needing_review"], 2)
        self.assertEqual(result["warnings"][0]["code"], "name_in_multiple_current_teams")

    def test_missing_team_in_selection_rejected(self):
        result = r.wikipedia_rosters(SourceClient(wiki_payload()))
        result["players"] = [p for p in result["players"] if p["team_code"] != "ATL"]
        with self.assertRaises(r.RosterError):
            r.validate_selection(result)

    def test_historical_player_can_have_multiple_teams(self):
        players = wd_players()
        players["results"]["bindings"][1]["player"] = players["results"]["bindings"][0]["player"]
        players["results"]["bindings"][1]["playerLabel"] = players["results"]["bindings"][0]["playerLabel"]
        result = r.wikidata_rosters(SourceClient(wd_games(), players))
        r.validate_selection(result)
        self.assertEqual(result["coverage"]["distinct_source_players"], 29)
        self.assertEqual(result["warnings"], [])
        self.assertEqual(len(result["source_identifiers"]["games"]), 1230)

    def test_missing_wikidata_label_preserves_id_for_review(self):
        players = wd_players()
        players["results"]["bindings"][0].pop("playerLabel")
        result = r.wikidata_rosters(SourceClient(wd_games(), players))
        self.assertIsNone(result["players"][0]["name"])
        self.assertTrue(result["players"][0]["needs_review"])
        self.assertEqual(result["players"][0]["source_player_id"], "Q200000")

    def test_missing_game_is_audited(self):
        games = wd_games()
        games["results"]["bindings"].pop()
        result = r.wikidata_rosters(SourceClient(games, wd_players()))
        self.assertEqual(result["coverage"]["observed_games"], 1229)
        self.assertEqual(result["coverage"]["missing_reference_game_ids"], ["0022501230"])
        self.assertEqual(result["coverage"]["player_completeness"], "not_verified")

    def test_wrong_game_source_and_conflicting_identifiers_rejected(self):
        games = wd_games()
        games["results"]["bindings"][0]["source"]["value"] = "https://example.org/boxscore_0022500001.json"
        with self.assertRaises(r.RosterError):
            r.wikidata_rosters(SourceClient(games))
        games = wd_games()
        games["results"]["bindings"][1]["game"] = games["results"]["bindings"][0]["game"]
        with self.assertRaises(r.RosterError):
            r.wikidata_rosters(SourceClient(games))

    def test_unexpected_team_or_invalid_game_count_rejected(self):
        for key, value in [("team", "http://www.wikidata.org/entity/Q999"), ("gameCount", "83")]:
            players = wd_players()
            players["results"]["bindings"][0][key]["value"] = value
            with self.subTest(key=key), self.assertRaises(r.RosterError):
                r.wikidata_rosters(SourceClient(wd_games(), players))


class RunTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "provenance"
        self.latest = self.root / "rosters" / "2026-27" / "latest.json"

    def build(self, opener, **kwargs):
        return r.build_rosters("2026-27", provenance_dir=self.root,
                               client_factory=factory(opener), today=date(2026, 10, 29), **kwargs)

    def reports(self):
        return [json.loads(path.read_text()) for path in sorted((self.root / "runs").glob("*.json"))]

    def test_success_archives_raw_hashes_and_unique_runs(self):
        first = self.build(Opener(wiki_payload()))
        second = self.build(Opener(wiki_payload()))
        self.assertNotEqual(first["run_id"], second["run_id"])
        self.assertEqual(json.loads(self.latest.read_text())["run_id"], second["run_id"])
        self.assertTrue((self.root / first["provenance"]["snapshot"]).is_file())
        for report in self.reports():
            self.assertEqual(report["status"], "success")
            self.assertEqual(report["providers"], ["Wikipedia"])
            self.assertEqual(len(report["source_identifiers"]["wikipedia_revisions"]), 30)
            event = report["requests"][0]
            self.assertEqual(event["endpoint"], r.WIKIPEDIA_API)
            self.assertTrue(event["finished_at_utc"])
            self.assertEqual(sha256((self.root / event["response_file"]).read_bytes()).hexdigest(), event["sha256"])

    def test_download_failure_preserves_previous_selection(self):
        self.build(Opener(wiki_payload()))
        previous = self.latest.read_bytes()
        opener = Opener(HTTPError(r.WIKIPEDIA_API, 503, "unavailable", {}, None))
        with self.assertRaises(r.RosterError):
            self.build(opener, retries=0)
        self.assertEqual(self.latest.read_bytes(), previous)
        self.assertEqual(self.reports()[-1]["status"], "failed")

    def test_truncated_json_is_archived_but_not_published(self):
        with self.assertRaises(r.RosterError):
            self.build(Opener(b'{"query": {"pages": ['))
        self.assertFalse(self.latest.exists())
        report = self.reports()[0]
        self.assertEqual(report["requests"][0]["status"], "failed")
        self.assertTrue((self.root / report["requests"][0]["response_file"]).is_file())

    def test_paginated_response_rejected(self):
        payload = wiki_payload()
        payload["continue"] = {"rvcontinue": "next"}
        with self.assertRaises(r.RosterError):
            self.build(Opener(payload))
        self.assertFalse(self.latest.exists())

    def test_interrupt_preserves_previous_selection_and_is_logged(self):
        self.build(Opener(wiki_payload()))
        previous = self.latest.read_bytes()
        with self.assertRaises(KeyboardInterrupt):
            self.build(Opener(KeyboardInterrupt()))
        self.assertEqual(self.latest.read_bytes(), previous)
        self.assertEqual(self.reports()[-1]["status"], "interrupted")

    def test_current_templates_cannot_be_mislabeled_as_history(self):
        opener = Opener()
        with self.assertRaises(r.RosterError):
            r.build_rosters("2026-27", provenance_dir=self.root,
                            client_factory=factory(opener), today=date(2028, 1, 1))
        self.assertEqual(opener.requests, [])
        self.assertFalse(self.latest.exists())
        self.assertEqual(self.reports()[0]["status"], "failed")

    def test_historical_run_records_identifiers_and_warning(self):
        games = wd_games()
        games["results"]["bindings"].pop()
        result = r.build_rosters("2025-26", provenance_dir=self.root,
                                  client_factory=factory(Opener(games, wd_players())))
        self.assertEqual(result["coverage"]["observed_games"], 1229)
        report = self.reports()[0]
        self.assertEqual(report["status"], "success_with_warnings")
        self.assertEqual(len(report["source_identifiers"]["games"]), 1229)
        self.assertEqual(len(report["requests"]), 2)

    def test_invalid_timeout_rejected_before_network(self):
        for value in [0, -1, 61, float("nan"), float("inf")]:
            with self.subTest(timeout=value), self.assertRaises(r.RosterError):
                self.build(Opener(), timeout=value)

    def test_disk_failure_is_not_retried_as_network_failure(self):
        original = r.atomic_bytes
        def write(path, content):
            if path.parent.name == "raw":
                raise OSError("disk full")
            original(path, content)
        opener = Opener(wiki_payload())
        with patch.object(r, "atomic_bytes", side_effect=write), self.assertRaises(r.RosterError):
            self.build(opener)
        self.assertEqual(len(opener.requests), 1)
        self.assertFalse(self.latest.exists())


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.run = r.Run(Path(self.temp.name), "2026-27")
        self.delays = []

    def fetch(self, opener, **kwargs):
        return r.HttpClient(self.run, opener=opener, sleep=self.delays.append, **kwargs).get_json(
            "Wikipedia", "test", r.WIKIPEDIA_API, {"action": "query"})

    def test_network_retry_has_separate_audit_events(self):
        payload, request_id = self.fetch(Opener(URLError("offline"), {"ok": True}))
        self.assertTrue(payload["ok"])
        self.assertEqual(request_id, 2)
        self.assertEqual([event["status"] for event in self.run.data["requests"]], ["failed", "success"])
        self.assertEqual(self.delays, [2.0])

    def test_retry_after_is_respected(self):
        error = HTTPError(r.WIKIPEDIA_API, 429, "rate limited", {"Retry-After": "7"}, None)
        self.fetch(Opener(error, {"ok": True}))
        self.assertEqual(self.delays, [7.0])

    def test_long_retry_after_aborts_instead_of_retrying_early(self):
        opener = Opener(HTTPError(r.WIKIPEDIA_API, 429, "rate limited", {"Retry-After": "120"}, None))
        with self.assertRaises(r.RosterError):
            self.fetch(opener)
        self.assertEqual(self.delays, [])
        self.assertEqual(len(opener.requests), 1)

    def test_api_maxlag_retry_after_is_respected(self):
        lag = Response({"error": {"code": "maxlag"}}, {"Retry-After": "5"})
        self.fetch(Opener(lag, {"ok": True}))
        self.assertEqual(self.delays, [5.0])

    def test_not_found_is_not_retried(self):
        opener = Opener(HTTPError(r.WIKIPEDIA_API, 404, "not found", {}, None))
        with self.assertRaises(r.RosterError):
            self.fetch(opener)
        self.assertEqual(len(opener.requests), 1)
        self.assertEqual(self.delays, [])

    def test_other_providers_are_not_queried(self):
        client = r.HttpClient(self.run, opener=Opener())
        for url in ["https://api.balldontlie.io/v1/players", "https://cdn.nba.com/test", "http://en.wikipedia.org/w/api.php"]:
            with self.subTest(url=url), self.assertRaises(r.RosterError):
                client.get_json("test", "test", url, {})


if __name__ == "__main__":
    unittest.main()
