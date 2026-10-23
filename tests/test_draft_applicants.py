import copy,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('draft_build',Path(__file__).resolve().parents[1]/'scripts/draft_applicants/build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class IdentitySafety(unittest.TestCase):
    def setUp(self):
        self.r={'name':'테스트','birth_date':'2004-01-01','school_or_team':'인하대','positions':['OH'],'source_url':'https://kovo.co.kr/'}
        self.p={'id':'KVL-P-000001','name':'테스트','gender':'M','birthDate':'2004-01-01','school':'인하대학교','rawPosition':'OH'}
    def match(self,ps,ds=[]):return m.match(self.r,'M',ps,ds)[0]
    def test_exact_and_homonym(self):
        other={**self.p,'id':'KVL-P-000002','birthDate':'2009-01-01'}
        self.assertEqual(self.match([self.p,other])['player_id'],self.p['id'])
    def test_name_only_never_links(self):self.assertIsNone(self.match([{**self.p,'birthDate':'','school':'다른학교'}])['player_id'])
    def test_dob_conflict_cannot_fall_back(self):self.assertEqual(self.match([{**self.p,'birthDate':'2004-04-01'}])['status'],'needs_review')
    def test_unknown_dob_never_links_even_with_matching_affiliation_position(self):self.assertEqual(self.match([{**self.p,'birthDate':''}])['status'],'needs_review')
    def test_both_dobs_missing_never_links(self):
        self.r['birth_date']=''
        self.assertEqual(self.match([{**self.p,'birthDate':''}])['status'],'needs_review')
    def test_affiliation_conflict_is_reviewed(self):self.assertEqual(self.match([{**self.p,'school':'경희대학교'}])['status'],'needs_review')
    def test_grade_conflict_is_reviewed(self):
        self.r['grade']=4
        self.assertEqual(self.match([{**self.p,'grade':3}])['status'],'needs_review')
    def test_two_exact_ids_quarantined(self):self.assertEqual(self.match([self.p,{**self.p,'id':'KVL-P-000002'}])['status'],'duplicate_review')
    def test_master_conflict_veto(self):self.assertIsNone(self.match([self.p],[{'id':self.p['id'],'name':'다른선수','birth_date':'2004-01-01'}])['player_id'])
    def test_other_master_id_veto(self):self.assertEqual(self.match([self.p],[{'id':'KVL-P-000002','name':'테스트','birth_date':'2004-01-01'}])['status'],'duplicate_review')
    def test_source_renumber_keeps_applicant_id(self):self.assertEqual(m.record_id('2026-27','M',self.r),m.record_id('2026-27','M',{**self.r,'source_sequence':99}))
    def test_different_year_separate_event_identity(self):self.assertNotEqual(m.record_id('2026-27','M',self.r),m.record_id('2027-28','M',self.r))
    def test_recapture_and_correction_history(self):
        a={'applicants':[{'applicant_id':'x','height_cm':190}],'verified_at':'2026-10-22','sources':[]};h=m.revisions({},a,[])
        self.assertEqual(len(m.revisions(a,copy.deepcopy(a),h)),1)
        b=copy.deepcopy(a);b['applicants'][0]['height_cm']=191;h=m.revisions(a,b,h)
        self.assertEqual(h[-1]['changes'][0]['before']['height_cm'],190);self.assertEqual(len(h),2)
    def test_disappearance_not_withdrawal(self):
        a={'applicants':[{'applicant_id':'x','application_status':'confirmed'}]};b={'applicants':[],'verified_at':'x','sources':[]};h=m.revisions(a,b,[])
        self.assertEqual(h[0]['changes'][0]['note'],'absence is not evidence of withdrawal')
if __name__=='__main__':unittest.main()
