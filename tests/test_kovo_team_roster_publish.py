import csv
from datetime import datetime
import json
from pathlib import Path
import sys
import tempfile
import unittest
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import kovo_team_roster_publish as roster_publish


class TeamRosterPublishTests(unittest.TestCase):
    def write_json(self, root, rel, payload):
        path=Path(root)/rel
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(payload,ensure_ascii=False),encoding="utf-8")

    def make_root(self):
        tmp=tempfile.TemporaryDirectory()
        root=Path(tmp.name)
        index={
            "schema_version":1,
            "currentSeason":"2026-27",
            "seasons":[{
                "season":"2026-27","status":"active",
                "startsOn":"2026-10-31","endsOn":"2027-04-22",
                "men":"men.json","women":"women.json",
                "projection":"projection.json","reviewQueue":"queue.json",
                "changeEvents":"events.csv","frozen":False
            }]
        }
        automation={
            "schema_version":1,"timezone":"Asia/Seoul",
            "manual_dispatch_always_runs":True,
            "cadence":{
                "intensive_hours":1,"active_season_hours":3,
                "offseason_hours":24,"offseason_run_hour_kst":8,
                "active_anchor_hour_kst":8,"intensive_recent_change_days":14
            }
        }
        self.write_json(root,"data/team-rosters/v-league/index.json",index)
        self.write_json(root,"data/team-rosters/v-league/automation.json",automation)
        return tmp,root

    def test_publish_preserves_alias_and_review_hold_and_requires_explicit_removal(self):
        tmp,root=self.make_root()
        self.addCleanup(tmp.cleanup)
        men={
            "KAL":{"sourceId":"SRC","players":[
                {"number":5,"name":"류","position":"S","playerId":"P1",
                 "registrationSource":"S1","lastChangeSource":"S1"},
                {"number":13,"name":"이준","position":"OH","playerId":"P2",
                 "registrationSource":"B1","lastChangeSource":"B1"}
            ]},
            "KBI":{"sourceId":"SRC","players":[
                {"number":5,"name":"타루샤","position":"OH","playerId":"P3",
                 "registrationSource":"S2","lastChangeSource":"S2"}
            ]}
        }
        projection={
            "season":"2026-27",
            "active_players":[
                {"gender":"남","team":"대한항공","name":"야마모토 류","number":"5",
                 "position":"세터","registration_source":"S1","last_change_source":"S1",
                 "last_status":"foreign_or_asian_quota","latest_change_date":"2026-11-10"},
                {"gender":"남","team":"대한항공","name":"신규 선수","number":"3",
                 "position":"아웃사이드히터","registration_source":"A1","last_change_source":"A1",
                 "last_status":"registration","latest_change_date":"2026-11-12"}
            ],
            "audit":{"applied_event_ids":["E1"]}
        }
        queue={"blocked_events":[{"source_url":"B1"}]}
        self.write_json(root,"men.json",men)
        self.write_json(root,"women.json",{})
        self.write_json(root,"projection.json",projection)
        self.write_json(root,"queue.json",queue)
        with (root/"events.csv").open("w",encoding="utf-8",newline="") as handle:
            writer=csv.DictWriter(handle,fieldnames=[
                "event_id","season","kind","player_name","registered_name","gender",
                "from_team","to_team","destination","confidence","source_url"
            ])
            writer.writeheader()
            writer.writerow({
                "event_id":"E1","season":"2026-27","kind":"registration_termination",
                "player_name":"타루샤 차메스","registered_name":"타루샤","gender":"남",
                "from_team":"","to_team":"","destination":"","confidence":"high","source_url":"TERM"
            })
        report=roster_publish.publish(root,write=True)
        published=json.loads((root/"men.json").read_text(encoding="utf-8"))
        kal=published["KAL"]["players"]
        self.assertEqual(report["matched_existing"],1)
        self.assertEqual(report["official_additions_unlinked"],1)
        self.assertEqual(report["explicit_removals"],1)
        self.assertEqual(report["review_holds"],1)
        self.assertEqual([p["name"] for p in kal],["신규 선수","류","이준"])
        alias=next(p for p in kal if p["name"]=="류")
        self.assertEqual(alias["playerId"],"P1")
        self.assertEqual(alias["position"],"S")
        newcomer=next(p for p in kal if p["name"]=="신규 선수")
        self.assertIsNone(newcomer["playerId"])
        self.assertEqual(newcomer["profileLinkStatus"],"pending-player-id")
        held=next(p for p in kal if p["name"]=="이준")
        self.assertEqual(held["recordStatus"],"review-hold")
        self.assertEqual(published["KBI"]["players"],[])

    def test_cadence_is_hourly_after_recent_change(self):
        tmp,root=self.make_root()
        self.addCleanup(tmp.cleanup)
        self.write_json(root,"projection.json",{
            "season":"2026-27",
            "active_players":[{"latest_change_date":"2026-11-12"}]
        })
        now=datetime(2026,11,17,9,13,tzinfo=ZoneInfo("Asia/Seoul"))
        decision=roster_publish.cadence_decision(root,now,"schedule")
        self.assertTrue(decision["run"])
        self.assertEqual(decision["mode"],"intensive")
        self.assertEqual(decision["interval_hours"],1)

    def test_cadence_falls_back_to_three_hours_then_daily_offseason(self):
        tmp,root=self.make_root()
        self.addCleanup(tmp.cleanup)
        self.write_json(root,"projection.json",{
            "season":"2026-27",
            "active_players":[{"latest_change_date":"2026-10-31"}]
        })
        active=datetime(2026,12,1,11,13,tzinfo=ZoneInfo("Asia/Seoul"))
        decision=roster_publish.cadence_decision(root,active,"schedule")
        self.assertTrue(decision["run"])
        self.assertEqual(decision["mode"],"active")
        self.assertEqual(decision["interval_hours"],3)
        off=datetime(2027,5,1,8,13,tzinfo=ZoneInfo("Asia/Seoul"))
        decision=roster_publish.cadence_decision(root,off,"schedule")
        self.assertTrue(decision["run"])
        self.assertEqual(decision["mode"],"offseason")
        off_skip=datetime(2027,5,1,9,13,tzinfo=ZoneInfo("Asia/Seoul"))
        self.assertFalse(roster_publish.cadence_decision(root,off_skip,"schedule")["run"])

    def test_manual_dispatch_always_runs(self):
        tmp,root=self.make_root()
        self.addCleanup(tmp.cleanup)
        self.write_json(root,"projection.json",{"season":"2026-27","active_players":[]})
        now=datetime(2027,5,1,3,0,tzinfo=ZoneInfo("Asia/Seoul"))
        decision=roster_publish.cadence_decision(root,now,"workflow_dispatch")
        self.assertTrue(decision["run"])
        self.assertEqual(decision["mode"],"manual")


if __name__=="__main__":
    unittest.main()
