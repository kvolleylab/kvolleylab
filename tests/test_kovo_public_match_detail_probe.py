import sys,unittest
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import kovo_public_match_detail_probe as p
class DetailProbeTests(unittest.TestCase):
    def match(self):
        return {"number":10,"gameDate":"2026-10-17","gender":"FEMALE",
        "match":"002","season":{"value":"824"},"league":{"value":"213"},
        "round":1,"homeTeam":{"name":"흥국생명","code":"2004"},
        "awayTeam":{"name":"GS칼텍스","code":"2005"}}
    def test_only_official_match_used(self):
        row=p.source_match([self.match()])
        self.assertEqual(row["number"],10)
        uri=urlsplit(p.detail_url(row))
        self.assertEqual(uri.path,"/stat/game-schedule/10")
        qs=parse_qs(uri.query)
        self.assertEqual(qs["seasonCode"],["824"])
        self.assertEqual(qs["tcode"],["2004"])
        self.assertEqual(qs["acode"],["2005"])
    def test_reject_unrelated_fixture(self):
        wrong=self.match();wrong["season"]["value"]="023"
        with self.assertRaises(ValueError):
            p.detail_url(wrong)
        wrong=self.match();wrong["number"]=11
        with self.assertRaises(ValueError):
            p.source_match([wrong])
    def test_player_records_never_leave_schema_probe(self):
        payload={"player":{"name":"DO_NOT_LOG"},"scores":{"sets":[{"home":25,"away":21}]}}
        snap=p.shape(payload)
        self.assertNotIn("player",snap)
        self.assertNotIn("DO_NOT_LOG",str(snap))
        self.assertEqual(snap["scores"]["sets"]["length"],1)
if __name__=="__main__":unittest.main()
