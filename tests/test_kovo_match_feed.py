"""Match-only feed offline unit tests. Never use production match scores."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import kovo_match_feed as feed


class MatchFeedTests(unittest.TestCase):
    def scheduled(self):
        return {'status':'scheduled','sets':[],'sets_won':{'home':0,'away':0},'current_set':None}

    def live(self,h=12,a=10):
        return {'status':'live','sets':[
            {'home':25,'away':19,'complete':True},
            {'home':h,'away':a,'complete':False}
        ],'sets_won':{'home':1,'away':0},'current_set':2}

    def final(self):
        return {'status':'final','sets':[
            {'home':25,'away':19,'complete':True},
            {'home':25,'away':20,'complete':True},
            {'home':25,'away':23,'complete':True}
        ],'sets_won':{'home':3,'away':0},'current_set':None}

    def sample(self,root):
        entry={'match_id':'KVLTEST001','competition_slug':'kovo-cup-women-2026',
               'date':'2026-10-18',
               'home':{'code':'GSC','name':'GS칼텍스'},
               'away':{'code':'KEX','name':'한국도로공사'},
               'source':{'type':'fixture_only','path':'snapshot.json'}}
        (root/'manifest.json').write_text(json.dumps({'matches':[entry]}),encoding='utf-8')
        return entry

    def test_state_validation(self):
        for s in (self.scheduled(),self.live(),self.final()):
            self.assertEqual(feed.normalize_state(s),s)
        self.assertTrue(feed.safe_update({'state':self.scheduled()},self.live()))
        self.assertTrue(feed.safe_update({'state':self.live()},self.final()))

    def test_impossible_final_is_rejected(self):
        cases=[
            {**self.final(),'sets_won':{'home':2,'away':1}},
            {**self.final(),'sets':[{'home':25,'away':24,'complete':True}]*3},
            {**self.final(),'current_set':3}
        ]
        for item in cases:
            with self.subTest(item=item),self.assertRaises(feed.FeedError):
                feed.normalize_state(item)

    def test_live_regression_needs_review(self):
        with self.assertRaises(feed.FeedError):
            feed.safe_update({'state':self.live()},self.live(11,10))
        self.assertTrue(feed.safe_update({'state':self.live()},self.live(11,10),True))
        with self.assertRaises(feed.FeedError):
            feed.safe_update({'state':self.final()},self.live())
        with self.assertRaises(feed.FeedError):
            feed.safe_update({'state':self.final()},self.final()|
                {'sets_won':{'home':2,'away':1}})

    def test_fixtures_never_feed_normal_collection(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            entry=self.sample(root)
            (root/'snapshot.json').write_text(json.dumps(self.live()),encoding='utf-8')
            with self.assertRaises(feed.FeedError):
                feed.observation(entry,root,simulate=False)
            state,source=feed.observation(entry,root,simulate=True)
            self.assertEqual(state['status'],'live')
            self.assertEqual(source['type'],'simulation_only')

    def test_lifecycle_revision_and_idempotency(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            self.sample(root)
            snapshot=root/'snapshot.json'
            snapshot.write_text(json.dumps(self.scheduled()),encoding='utf-8')
            a=feed.collect(root/'manifest.json',root/'a.json',simulate=True)
            self.assertEqual(a['matches'][0]['revision'],1)
            self.assertEqual(a['mode'],'SIMULATION_ONLY')
            snapshot.write_text(json.dumps(self.live()),encoding='utf-8')
            b=feed.collect(root/'manifest.json',root/'b.json',root/'a.json',True)
            self.assertEqual(b['matches'][0]['revision'],2)
            c=feed.collect(root/'manifest.json',root/'c.json',root/'b.json',True)
            self.assertEqual(c['matches'][0]['revision'],2)
            snapshot.write_text(json.dumps(self.final()),encoding='utf-8')
            d=feed.collect(root/'manifest.json',root/'d.json',root/'c.json',True)
            self.assertEqual(d['matches'][0]['revision'],3)
            self.assertEqual(d['matches'][0]['state']['sets_won']['home'],3)
            self.assertNotIn('players',str(d))

    def test_reject_identity_change_and_no_partial_file(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.sample(root)
            (root/'snapshot.json').write_text(json.dumps(self.live()),encoding='utf-8')
            previous={'matches':[{'match_id':'KVLTEST001','date':'2026-10-18',
                'home_code':'IBK','away_code':'KEX','state':self.scheduled(),'revision':1}]}
            (root/'previous.json').write_text(json.dumps(previous),encoding='utf-8')
            with self.assertRaises(feed.FeedError):
                feed.collect(root/'manifest.json',root/'out.json',root/'previous.json',True)
            self.assertFalse((root/'out.json').exists())

    def test_reject_duplicate_match_and_path_traversal(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);entry=self.sample(root)
            with self.assertRaises(feed.FeedError):
                feed.validate_manifest({'matches':[entry,entry]})
            entry['source']['path']='../outside.json'
            with self.assertRaises(feed.FeedError):
                feed.fixture_state(entry,root,True)


if __name__=='__main__':
    unittest.main()
