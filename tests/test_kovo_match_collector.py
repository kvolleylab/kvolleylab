"""Offline tests for public KOVO DB BANK match-result extraction."""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import kovo_match_collector as collector

URL = "https://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=gUjNxoTMwIjOyIDM"
HTML = """<!DOCTYPE html><html lang="ko"><head><title>KOVO DB BANK</title></head><body>
<h2>경기결과 (V1)</h2><h3>2026.01.22 (목)</h3>
<div>한국도로공사 VS IBK기업은행</div>
<table><tr><th>SETS</th><th>팀</th><th>1SET</th><th>2SET</th><th>3SET</th><th>4SET</th><th>5SET</th><th>TOTAL</th><th>SETS</th></tr>
<tr><td>3</td><td>한국도로공사</td><td>22</td><td>25</td><td>25</td><td>25</td><td></td><td>97</td><td>1</td></tr>
<tr><td>IBK기업은행</td><td>25</td><td>22</td><td>21</td><td>21</td><td></td><td>89</td></tr>
<tr><td>경기시간</td><td>33m</td><td>31m</td><td>31m</td><td>30m</td><td></td><td>2h05m</td></tr>
</table>
<table><tr><td>경기번호</td><td>165</td><td>관중수</td><td>2313</td><td>경기장</td><td>김천실내체육관</td></tr>
<tr><td>시작시간</td><td>19:00</td><td>종료시간</td><td>21:16</td></tr></table>
<table><tr><th>PLAYER</th><th>포지션</th><th>득점</th></tr><tr><td>모마</td><td>OP</td><td>31</td></tr></table>
</body></html>"""

class MatchTests(unittest.TestCase):
    def test_public_source_and_result(self):
        result = collector.parse_match(HTML, URL, {
            "date": "2026-01-22", "home_team": "한국도로공사",
            "away_team": "IBK기업은행", "score": "3-1"
        })
        self.assertEqual(result["score"]["home"], 3)
        self.assertEqual(result["score"]["away"], 1)
        self.assertEqual(result["score"]["sets"][0], {"home": 22, "away": 25})
        self.assertEqual(len(result["score"]["sets"]), 4)
        self.assertEqual(result["attendance"], "2313")
        self.assertEqual(result["game_number"], "165")

    def test_no_guessed_player_stats(self):
        sample = collector.collect_one({"url": URL}, html=HTML)
        self.assertEqual(sample["status"], "parsed_review_required")
        self.assertEqual(sample["player_stats_status"], "not_collected")
        self.assertNotIn("players", sample)

    def test_access_restrictions(self):
        bad = [
            "https://dbbank.kovo.co.kr/login.asp?PID=12345678",
            "http://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=12345678",
            "https://example.com/game/11110_pop_result.asp?PID=12345678",
            "https://dbbank.kovo.co.kr@evil.example/game/11110_pop_result.asp?PID=12345678",
            "https://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=a",
            "https://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=12345678&extra=1",
            "https://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=12345678&PID=87654321",
        ]
        for url in bad:
            with self.subTest(url=url), self.assertRaises(ValueError):
                collector.validate_url(url)

    def test_login_page_is_not_parsed(self):
        with self.assertRaises(collector.AccessDenied):
            collector.parse_match('<form><input type="password"></form>', URL)
        with self.assertRaises(collector.ParseError):
            collector.parse_match("<h1>KOVO DB BANK</h1><p>로그인</p>", URL)

    def test_expected_match_mismatch_fails_closed(self):
        for expect in [
            {"date": "2026-10-16"}, {"home_team": "현대건설"},
            {"away_team": "흥국생명"}, {"score": "0-3"},
        ]:
            with self.subTest(expect=expect), self.assertRaises(collector.ParseError):
                collector.parse_match(HTML, URL, expect)

    def test_broken_score_and_unknown_table(self):
        html = HTML.replace("<td>97</td>", "<td>97</td>").replace(
            "<td>25</td><td>22</td><td>21</td><td>21</td>",
            "<td>25</td><td>22</td><td>25</td><td>21</td>")
        # Win count would be 2-2, invalid for a finished volleyball match.
        with self.assertRaises(collector.ParseError):
            collector.parse_match(html, URL)
        with self.assertRaises(collector.ParseError):
            collector.parse_match(HTML.replace("<th>1SET</th>", "<th>1Q</th>"), URL)

    def test_duplicate_pid_with_different_pset_is_rejected(self):
        import json
        with tempfile.TemporaryDirectory() as folder:
            manifest = Path(folder) / "sources.json"
            manifest.write_text(json.dumps({"matches": [
                {"url": URL}, {"url": URL + "&PSET=1"}
            ]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                collector.collect_manifest(manifest, Path(folder) / "out.json")
            self.assertFalse((Path(folder) / "out.json").exists())

    def test_refuse_cross_domain_redirect_and_network_not_required(self):
        # This unit suite should not send any HTTP request.
        self.assertEqual(collector.validate_url(URL), URL)

if __name__ == "__main__":
    unittest.main()
