"""KOVO public-source discovery offline guard checks."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import kovo_live_source_probe as probe

class PublicDiscoveryTests(unittest.TestCase):
    def test_urls_same_origin_only(self):
        self.assertTrue(probe.first_party("https://kovo.co.kr/game/v-league"))
        for url in ("http://kovo.co.kr/", "https://evil.co.kr/", "https://kovo.co.kr.evil.tld/",
                    "https://kovo.co.kr:443/path", "https://user-api.kovo.co.kr/contents",
                    "https://me:secret@kovo.co.kr/"):
            with self.subTest(url=url):
                self.assertFalse(probe.first_party(url))

    def test_strip_queries_and_skip_foreign_scripts(self):
        html = """<script id="__NEXT_DATA__" type="application/json">{}</script>
        <script src="/_next/static/chunks/app.js?token=SECRET"></script>
        <script src="https://evil.com/x.js"></script>
        <script src="/scripts/common.js?sid=12345"></script>
        <link rel="preload" as="script" href="/_next/static/runtime.js">"""
        paths, nextdata = probe.public_js_paths(html,"https://kovo.co.kr/game/v-league")
        self.assertTrue(nextdata)
        self.assertEqual(paths,[
            "https://kovo.co.kr/_next/static/chunks/app.js",
            "https://kovo.co.kr/scripts/common.js",
            "https://kovo.co.kr/_next/static/runtime.js"])
        self.assertNotIn("SECRET",str(paths))
        self.assertNotIn("evil.com",str(paths))

    def test_endpoint_hints_only_never_tokens(self):
        js = """const a="/api/v2/game/schedule?key=SECRET"; const b='/api/game/live';
        const c="https://user-api.kovo.co.kr/contents/competition/matches";
        const d='https://evil.com/api/match';
        const e='/assets/img/volleyball.webp';"""
        paths = probe.endpoint_path_hints(js)
        self.assertIn("/api/v2/game/schedule",paths)
        self.assertIn("/api/game/live",paths)
        self.assertIn("/contents/competition/matches",paths)
        self.assertNotIn("SECRET",str(paths))
        self.assertNotIn("/assets/img/volleyball.webp",paths)

    def test_no_inferred_api_requests(self):
        old=probe.fetch_public
        calls=[]
        try:
            def fake(url):
                calls.append(url)
                return ('<script src="/_next/static/chunks/main.js"></script>',
                        {'status':200,'content_type':'text/html','bytes':53,'pathname':'/'})
            probe.fetch_public=fake
            r=probe.probe(0)
            self.assertEqual(len(calls),3)
            self.assertTrue(all(url.startswith("https://kovo.co.kr/") for url in calls))
            self.assertEqual(r['asset_hints'],[])
        finally:
            probe.fetch_public=old

    def test_reject_large_asset_scope(self):
        with self.assertRaises(probe.Blocked):
            probe.probe(4)

if __name__ == "__main__":
    unittest.main()
