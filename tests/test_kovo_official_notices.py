"""Offline contract tests for the KOVO official-notice public-data collector."""
import importlib.util
from pathlib import Path
import unittest

target = Path(__file__).resolve().parents[1] / "scripts" / "kovo_official_notices.py"
spec = importlib.util.spec_from_file_location("kovo_notices", target)
kovo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kovo)

HTML = """<p>공시내용</p><table><tbody>
<tr><th>구 분</th><th>성 명</th><th>포지션</th><th>연 봉(천원)</th><th>옵션(천원)</th><th>합계</th><th>비 고</th></tr>
<tr><td>1</td><td><strong>김우진</strong></td><td>아웃사이드히터</td><td>360,000</td><td>30,000</td><td>390,000</td><td>FA 계약</td></tr>
<tr><td>3</td><td>박준서</td><td>세터</td><td>42,000</td><td>10,000</td><td>52,000</td><td></td></tr>
</tbody></table>"""


class KovoNoticeTests(unittest.TestCase):
    def test_salary_is_in_thousand_krw(self):
        self.assertEqual(kovo.money_to_krw("360,000"), 360_000_000)
        self.assertIsNone(kovo.money_to_krw("확인 중"))

    def test_parse_official_roster_table(self):
        rows = kovo.extract_rows([{"languageCode": "ko", "body": HTML}])
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["player_name"], "김우진")
        self.assertEqual(rows[0]["position"], "아웃사이드히터")
        self.assertEqual(rows[0]["number"], "1")
        self.assertEqual(rows[0]["salary_krw"], 360_000_000)
        self.assertEqual(rows[0]["option_krw"], 30_000_000)
        self.assertEqual(rows[0]["total_krw"], 390_000_000)

    def test_unknown_currency_unit_is_not_guessed(self):
        no_unit = HTML.replace("(천원)", "")
        rows = kovo.extract_rows([{"body": no_unit}])
        self.assertIsNone(rows[0]["salary_krw"])

    def test_missing_columns_and_line_breaks(self):
        html = "<table><tr><th>성명</th><th>포지션</th></tr><tr><td>테스트</td><td>세터<br>겸용</td></tr></table>"
        rows = kovo.extract_rows([{"body": html}])
        self.assertEqual(rows[0]["position"], "세터 겸용")
        self.assertIsNone(rows[0]["salary_krw"])

    def test_detect_team_and_category(self):
        self.assertEqual(kovo.detect_team("2026-27 현대캐피탈 선수등록"), ("현대캐피탈", "남"))
        self.assertEqual(kovo.detect_team("2026-27 현대건설 선수등록"), ("현대건설", "여"))
        self.assertEqual(kovo.detect_kind("선수등록(1차) 공시"), "registration")

    def test_notice_normalization(self):
        item = kovo.normalize_detail({
            "id": 155583, "createdAt": "2026-06-30T12:00:00",
            "titles": [{"languageCode": "ko", "title": "2026-2027시즌 삼성화재 선수등록(1차) 공시"}],
            "bodies": [{"languageCode": "ko", "body": HTML}],
        })
        self.assertEqual(item["id"], 155583)
        self.assertEqual(item["gender"], "남")
        self.assertEqual(item["source_url"], "https://kovo.co.kr/news/official-notices/155583")
        self.assertEqual(len(item["players"]), 2)

    def test_filter_by_season_and_date(self):
        self.assertTrue(kovo.relevant("2026-2027시즌 삼성화재 선수등록(1차) 공시", "2026-06-30", "2026-27", "2026-04-01"))
        self.assertFalse(kovo.relevant("2023-2024시즌 삼성화재 선수등록 공시", "2023-06-30", "2026-27", "2026-04-01"))


if __name__ == "__main__":
    unittest.main()
