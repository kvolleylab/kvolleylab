import importlib.util
import pathlib
import unittest

TARGET=pathlib.Path(__file__).resolve().parents[1]/"scripts"/"kovo_verify_roster_contracts.py"
spec=importlib.util.spec_from_file_location("kovo_verify_roster_contracts",TARGET)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def notice(nid,gender,team,title,people=None,events=None,date="2026-06-30"):
    return {"id":nid,"gender":gender,"team":team,"title":title,"source_url":f"https://kovo.co.kr/news/official-notices/{nid}","published_at":date,
            "players":people or [],"events":events or []}

def event(nid,name,kind,gender="남",team="OK저축은행",**extra):
    item={"event_id":str(nid)+"-01","source_url":f"https://kovo.co.kr/news/official-notices/{nid}",
          "notice_date":"2026-09-01","effective_date":"2026-09-01","season":"2026-27",
          "gender":gender,"kind":kind,"player_name":name,"confidence":"high"}
    item.update(extra)
    return item

class TestProjection(unittest.TestCase):
    def base(self):
        return notice(10,"남","OK저축은행","2026-2027시즌 OK저축은행 선수등록(1차) 공시",
          people=[{"player_name":"김테스트","number":"10","position":"세터","salary_krw":50000000,"option_krw":10000000,"total_krw":60000000}])

    def test_new_and_release(self):
        docs=[self.base(),notice(11,"남","OK저축은행","추가선수 등록",events=[
            event(11,"박테스트","registration",to_team="OK저축은행",jersey_number="2",salary_krw=20000000,option_krw=5000000)]),
            notice(12,"남","OK저축은행","자유신분",events=[event(12,"김테스트","free_agent")])]
        result=module.project(docs)
        self.assertEqual(result["audit"]["total"],1)
        self.assertEqual(result["active_players"][0]["name"],"박테스트")
        self.assertEqual(result["active_players"][0]["total_krw"],25000000)

    def test_transfer_removes_from_source(self):
        first=self.base()
        ev=event(15,"김테스트","transfer",from_team="OK저축은행",to_team="삼성화재",salary_krw=45000000,option_krw=5000000)
        result=module.project([first,notice(15,"남","삼성화재","이적선수",events=[ev])])
        self.assertEqual(result["audit"]["total"],1)
        self.assertEqual(result["active_players"][0]["team"],"삼성화재")
        self.assertEqual(result["active_players"][0]["salary_krw"],45000000)

    def test_change_and_reject_low_confidence(self):
        first=self.base()
        a=event(11,"김테스트","number_change",new_number="5")
        b=event(12,"김테스트","position_change",confidence="review",new_position="리베로")
        result=module.project([first,notice(11,"남","OK저축은행","배번 변경",events=[a]),
                                     notice(12,"남","OK저축은행","포지션 변경",events=[b])])
        self.assertEqual(result["active_players"][0]["number"],"5")
        self.assertEqual(result["active_players"][0]["position"],"세터")
        self.assertEqual(len(result["audit"]["blocked_events"]),1)

    def test_old_season_not_reapplied(self):
        old=event(20,"김테스트","free_agent",season="2025-26")
        result=module.project([self.base(),notice(20,"남","OK저축은행","2025-26 자유신분",events=[old])])
        self.assertEqual(result["audit"]["total"],1)
        self.assertEqual(result["audit"]["prior_season_events_ignored"],1)

    def test_identical_names_different_clubs_not_merged(self):
        docs=[self.base(),notice(11,"남","삼성화재","2026-2027시즌 삼성화재 선수등록(1차) 공시",
             people=[{"player_name":"김테스트","number":"3","position":"OH"}])]
        result=module.project(docs)
        self.assertEqual(result["audit"]["total"],2)
        self.assertEqual(len(result["audit"]["same_name_multi_team"]),1)

if __name__=="__main__":
    unittest.main()
