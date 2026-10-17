import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import kovo_public_schedule_probe as p

class ScheduleProbeTests(unittest.TestCase):
    def test_exact_allowlist(self):
        for x in p.PATHS:
            self.assertEqual(p.validate_url(p.API_ORIGIN+x),p.API_ORIGIN+x)
        for u in ("https://evil.com/mains/games/schedules",
                  "http://user-api.kovo.co.kr/mains/games/schedules",
                  "https://user-api.kovo.co.kr/mains/games/schedules?secret=1",
                  "https://user-api.kovo.co.kr/contents/news/official-notices",
                  "https://user-api.kovo.co.kr/mains/games/schedules?gender=MALE",
                  "https://user:pass@user-api.kovo.co.kr/mains/games/schedules"):
            with self.subTest(url=u),self.assertRaises(ValueError):
                p.validate_url(u)

    def test_no_raw_records_in_schema(self):
        data={"result":{"status":200},"payload":{"matches":[{
            "playerName":"NONPUBLIC_TEST_PLAYER","gameId":"hidden_test",
            "date":"2026-10-17","home":"GS칼텍스"}]}}
        summary=p.describe(data)
        self.assertEqual(summary["result_status"],200)
        self.assertEqual(summary["payload.matches"]["length"],1)
        self.assertNotIn("NONPUBLIC_TEST_PLAYER",str(summary))
        self.assertNotIn("hidden_test",str(summary))
        self.assertIn("gameId",summary["payload.matches"]["sample_keys"])

if __name__=="__main__":
    unittest.main()
