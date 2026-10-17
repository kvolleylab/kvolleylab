"""Offline guards for the 2026-10-18 KOVO Cup final one-day monitor."""
from datetime import datetime,timedelta,timezone
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import kovo_cup_final_20261018_monitor as p


def fixture(status="scheduled",score=(0,0),number=12,home="GS칼텍스",away="한국도로공사"):
    row={
        "season":{"value":"824","name":"2026 여수·NH농협컵 프로배구대회"},
        "league":{"value":"214","name":"결승전"},
        "gender":"FEMALE","match":"002","round":1,"number":number,
        "gameDate":"2026-10-18","startTime":"13:30",
        "homeTeam":{"code":"2005","name":home,"score":score[0]},
        "awayTeam":{"code":"2002","name":away,"score":score[1]},
        "currentSet":1 if status=="live" else 0
    }
    if status=="final":
        row["endTime"]="16:05"
        row["currentSet"]=5
    return row


def make_root(root):
    pth=root/"data"/"competitions"/"kovo-cup-women-2026"
    pth.mkdir(parents=True)
    (pth/"data.json").write_text(json.dumps({
        "participants":[{"code":"GSC","name":"GS칼텍스"},
                        {"code":"KEX","name":"한국도로공사"}],
        "matches":[{"id":"KOVOCUP26-12","date":"2026-10-18",
                    "home":{"code":"GSC"},"away":{"code":"KEX"},
                    "stage":"결승"}]
    }),encoding="utf-8")


class OneDayMonitorTests(unittest.TestCase):
    def test_scope_and_no_player_fields(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path);make_root(root)
            item=p.official_target([fixture()],"female",root)
            self.assertEqual(item["match_id"],"KOVOCUP26-12")
            obs=p.snapshot(item,datetime(2026,10,18,4,tzinfo=timezone.utc))
            self.assertEqual(obs["status"],"scheduled")
            self.assertIsNone(obs["set_points"])
            self.assertNotIn("player",str(obs).lower())
            for wrong in [fixture(number=13),fixture(home="흥국생명")]:
                if wrong["number"]==13:
                    self.assertIsNone(p.official_target([wrong],"female",root))
                else:
                    with self.assertRaises(p.SourceError):
                        p.official_target([wrong],"female",root)

    def test_poll_prefers_ended_after_game(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path);make_root(root)
            def fake(endpoint):
                if endpoint==p.SCHEDULE_PATH:return [fixture("final",(3,2))]
                if endpoint==p.ENDED_PATH:return [fixture("final",(3,2))]
                raise AssertionError("unapproved source")
            self.assertEqual(p.poll(root,fetch=fake)["source_kind"],"ended")

    def test_conflicting_sources_fail_closed(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path);make_root(root)
            def fake(endpoint):
                if endpoint==p.SCHEDULE_PATH:return [fixture("final",(3,2))]
                if endpoint==p.ENDED_PATH:return [fixture("final",(2,3))]
            with self.assertRaises(p.SourceError):
                p.poll(root,fetch=fake)

    def test_time_gate_and_not_ever_in_2027(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path);make_root(root)
            with self.assertRaises(p.SourceError):
                p.monitor(root,root/"out.jsonl",interval=300,
                    now_fn=lambda:datetime(2027,10,18,4,tzinfo=timezone.utc),
                    fetch=lambda _: [])
            self.assertFalse((root/"out.jsonl").exists())

    def test_missed_live_and_two_final_confirmations(self):
        with tempfile.TemporaryDirectory() as path:
            root=Path(path);make_root(root)
            state={"i":0,"instant":datetime(2026,10,18,4,30,tzinfo=timezone.utc)}
            versions=[
                fixture(),
                fixture("live",(0,0)),
                fixture("live",(1,0)),
                fixture("final",(3,2)),
                fixture("final",(3,2)),
            ]
            def now():return state["instant"]
            def sleep(seconds):
                state["i"]+=1
                state["instant"]+=timedelta(seconds=seconds)
            def fetch(endpoint):
                row=versions[min(state["i"],len(versions)-1)]
                if endpoint==p.SCHEDULE_PATH:return [row]
                if endpoint==p.ENDED_PATH:return [row] if row.get("endTime") else []
                raise AssertionError("unapproved path")
            file=root/"events.jsonl"
            self.assertEqual(p.monitor(root,file,interval=300,now_fn=now,
                sleep_fn=sleep,fetch=fetch,max_checks=10),0)
            data=[json.loads(l) for l in file.read_text().splitlines()]
            self.assertEqual(len(data),5)
            self.assertEqual([x["status"] for x in data],
                             ["scheduled","live","live","final","final"])
            self.assertFalse(data[-1]["changed_from_previous"])
            self.assertEqual(data[-1]["sets_won"],{"home":3,"away":2})
            self.assertEqual(len({x["game_key"] for x in data}),1)

    def test_interval_limit(self):
        with self.assertRaises(ValueError):
            p.monitor(".", "anything", once=True, interval=30)

if __name__=="__main__":
    unittest.main()
