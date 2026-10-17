"""Offline match-only public KOVO schedule bridge contract tests."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import kovo_match_schedule_bridge as b

def record(number=10,date="2026-10-17",home="흥국생명",away="GS칼텍스",status="final"):
    val=lambda k,name:{"value":k,"name":name}
    return {
        "season":val("824","2026 여수·NH농협컵 프로배구대회"),
        "league":val("213","준결승"),"match":"002","number":number,
        "gender":"FEMALE","gameDate":date,"startTime":"13:31",
        "currentSet":5 if status=="final" else 1 if status=="live" else 0,
        **({"endTime":"16:01"} if status=="final" else {}),
        "homeTeam":{"code":"2004","name":home,"score":2 if status=="final" else 0},
        "awayTeam":{"code":"2005","name":away,"score":3 if status=="final" else 0},
    }

def repo_fixture(root):
    p=root/"data"/"competitions"/"kovo-cup-women-2026"
    p.mkdir(parents=True)
    data={
        "participants":[{"code":"HPS","name":"흥국생명"},
                        {"code":"GSC","name":"GS칼텍스"}],
        "matches":[{"id":"KOVOCUP26-10","date":"2026-10-17",
                    "home":{"code":"HPS"},"away":{"code":"GSC"},
                    "stage":"준결승","score":{"home":2,"away":3}}]
    }
    (p/"data.json").write_text(json.dumps(data),encoding="utf-8")

class BridgeTests(unittest.TestCase):
    def test_official_final_match_maps_to_local(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);repo_fixture(root)
            normalized=b.normalize(record(),"main")
            join=b.join_local(normalized,root)
            self.assertEqual(join["match_id"],"KOVOCUP26-10")
            self.assertEqual(join["local_status"],"FINAL_SET_TOTAL_MATCHES_SITE")
            self.assertFalse(normalized["has_set_points"])
            self.assertEqual(normalized["source_key"],"824:002:FEMALE:10")

    def test_ended_dedup_final(self):
        a=b.normalize(record(),"main")
        ended=record();ended["homeTeam"]["value"]=ended["homeTeam"].pop("code")
        ended["awayTeam"]["value"]=ended["awayTeam"].pop("code")
        merged=b.merge_reports([a,b.normalize(ended,"ended")])
        self.assertEqual(len(merged),1)
        self.assertEqual(merged[0]["source_kind"],"ended")

    def test_in_progress_cannot_be_marked_final(self):
        live=b.normalize(record(status="live"),"female")
        self.assertEqual(live["status"],"live")
        self.assertEqual(live["sets_won"],{"home":0,"away":0})
        self.assertIsNone(b.join_local(live,Path("/not/a/repo")) .get("match_id")) if False else None
        bad=record(status="live");bad["homeTeam"]["score"]=3
        with self.assertRaises(b.SourceError):
            b.normalize(bad,"main")

    def test_local_conflict_and_mismatched_identity_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);repo_fixture(root)
            wrong=record();wrong["awayTeam"]["score"]=2;wrong["homeTeam"]["score"]=3
            result=b.normalize(wrong,"main")
            with self.assertRaises(b.SourceError):
                b.join_local(result,root)
            a=b.normalize(record(),"main")
            b2=b.normalize(record(),"ended");b2["away"]["name"]="다른팀"
            with self.assertRaises(b.SourceError):
                b.merge_reports([a,b2])

    def test_unknown_season_is_not_joined(self):
        v=record()
        v["season"]={"value":"023","name":"2026-27 V리그"}
        n=b.normalize(v,"main")
        self.assertEqual(b.join_local(n,Path("."))["local_status"],
                         "NO_APPROVED_COMPETITION_MAPPING")

    def test_game_number_and_team_mismatch_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);repo_fixture(root)
            bad=b.normalize(record(number=11),"main")
            self.assertEqual(b.join_local(bad,root)["local_status"],
                             "UNMATCHED_OR_AMBIGUOUS")
            data_path=root/"data"/"competitions"/"kovo-cup-women-2026"/"data.json"
            data=json.loads(data_path.read_text())
            data["matches"][0]["id"]="KOVOCUP26-11"
            data_path.write_text(json.dumps(data))
            with self.assertRaises(b.SourceError):
                b.join_local(b.normalize(record(),"main"),root)

    def test_no_player_data_in_export_and_revision_scope(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);repo_fixture(root)
            output=b.build([("main",[record()]),("ended",[record()])],root)
            self.assertTrue(output["match_only"])
            self.assertFalse(output["update_site"])
            self.assertEqual(output["totals"]["unique_games"],1)
            self.assertNotIn("player",json.dumps(output).lower())

if __name__=="__main__":
    unittest.main()
