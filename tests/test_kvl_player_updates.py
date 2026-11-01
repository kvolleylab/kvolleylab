"""Offline evidence/review boundary and publisher RSS contract tests."""
import copy
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
import importlib.util
import io
from pathlib import Path
import unittest
from unittest.mock import patch
import sys

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/kvl_player_updates.py"
sys.path.insert(0, str(SCRIPT.parent))
spec = importlib.util.spec_from_file_location("player_updates", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def index(**change):
    event = {"kind": "registration", "player_name": "김테스트", "gender": "남",
             "to_team": "삼성화재", "confidence": "high", "effective_date": "2026-11-01",
             "effective_date_basis": "notice_date_fallback", "jersey_number": "7"}
    event.update(change)
    return {"season": "2026-27", "notices": [{"id": 42, "published_at": "2026-11-01T12:00:00",
            "title": "삼성화재 선수 등록", "kind": "registration", "team": "삼성화재", "gender": "남",
            "source_url": "https://kovo.co.kr/news/official-notices/42", "html_sha256": "a" * 64,
            "players": [], "events": [event]}]}


def approve(candidate, **extra):
    review = {key: candidate[key] for key in ("candidate_id", "revision_id", "source_version", "source_url")}
    review.update(decision="approve", player_id="KVL-P-000001", reviewer="KVL-OP-TEST",
                  reviewed_at="2026-11-02", identity_basis="canonical_id_review", effective_date="2026-11-03",
                  effective_date_basis="official_notice_text", effective_date_evidence={
                      "source_url": candidate["source_url"], "locator": "paragraph:2", "asserted_date": "2026-11-03"})
    review.update(extra)
    return review


SOURCE = {"id": "TEST-PUBLISHER", "publisher": "Example Publisher", "url": "https://news.example/feed.xml",
          "enabled": True, "feed_hosts": ["news.example"], "article_hosts": ["news.example"]}
RSS = b'''<rss version="2.0"><channel><item><title>Volleyball registration report</title>
<link>https://news.example/article?id=7&amp;utm_source=rss#top</link>
<pubDate>Sun, 01 Nov 2026 10:00:00 +0900</pubDate>
<description>DO NOT STORE ARTICLE TEXT</description></item>
<item><title>Baseball report</title><link>https://news.example/baseball</link></item></channel></rss>'''


class PlayerReviewTests(unittest.TestCase):
    def test_publication_date_does_not_establish_membership_date(self):
        candidate = module.official_candidates(index())[0]
        self.assertEqual(candidate["effective_date"], "")
        explicit = module.official_candidates(index(effective_date_basis="explicit_effective_date"))[0]
        self.assertEqual(explicit["effective_date"], "2026-11-01")

    def test_no_name_only_identity_or_master_write(self):
        ledger, export = module.build_ledger(index(), {}, [], {"KVL-P-000001"})
        self.assertEqual(ledger["master_connection"], "NOT_CONNECTED")
        self.assertNotIn("player_id", ledger["candidates"][0])
        self.assertEqual(export["events"], [])

    def test_reviewed_export_requires_existing_id_source_and_effective_date(self):
        candidates = module.official_candidates(index())
        decision = approve(candidates[0])
        approved, _, issues = module.review_export(candidates, [decision], {"KVL-P-000001"})
        self.assertEqual(issues, [])
        self.assertEqual(approved[0]["effective_date"], "2026-11-03")
        self.assertEqual(approved[0]["status"], "reviewed_export_not_applied")
        for changes in ({"player_id": "KVL-P-999999"}, {"effective_date": ""}, {"identity_basis": "same_name"},
                        {"source_version": "changed"}, {"source_url": "https://news.example/article"}):
            with self.subTest(changes=changes):
                approved, _, issues = module.review_export(candidates, [approve(candidates[0], **changes)], {"KVL-P-000001"})
                self.assertEqual(approved, [])
                self.assertTrue(issues)

    def test_corrected_source_retains_history_and_invalidates_old_approval(self):
        original = index()
        candidate = module.official_candidates(original)[0]
        decision = approve(candidate)
        previous, _ = module.build_ledger(original, {}, [decision], {"KVL-P-000001"})
        corrected = copy.deepcopy(original)
        corrected["notices"][0]["html_sha256"] = "b" * 64
        ledger, export = module.build_ledger(corrected, previous, [decision], {"KVL-P-000001"})
        self.assertEqual(len(ledger["candidates"]), 2)
        self.assertEqual(export["events"], [])
        self.assertEqual(ledger["review_issues"][0]["reason"], "stale_or_unknown_revision")
        self.assertEqual({row["review_status"] for row in ledger["candidates"]},
                         {"superseded_requires_new_review", "needs_review"})

    def test_partial_scan_does_not_invent_release_or_erase_history(self):
        previous, _ = module.build_ledger(index(), {}, [], set())
        later, export = module.build_ledger({"notices": []}, previous, [], set())
        self.assertEqual(later["candidates"], previous["candidates"])
        self.assertEqual(export["events"], [])

    def test_revised_empty_notice_supersedes_old_candidate_without_departure(self):
        previous, _ = module.build_ledger(index(), {}, [], set())
        source = index()
        source["notices"][0]["events"] = []
        source["notices"][0]["html_sha256"] = "b" * 64
        later, export = module.build_ledger(source, previous, [], set())
        self.assertEqual(later["candidates"][0]["review_status"], "superseded_requires_new_review")
        self.assertEqual(export["events"], [])

    def test_ambiguous_multiple_names_cannot_be_approved_as_one_player(self):
        candidates = module.official_candidates(index(kind="release", player_name="손현종, 황두연"))
        approved, _, issues = module.review_export(candidates, [approve(candidates[0])], {"KVL-P-000001"})
        self.assertEqual(approved, [])
        self.assertIn("multiple_names_require_separate_evidence", issues[0]["reasons"])

    def test_old_cached_quota_release_requires_parser_refresh(self):
        source = index(kind="foreign_or_asian_quota")
        source["notices"][0]["title"] = "KB손해보험 아시아쿼터 선수 등록 해지 공시"
        candidate = module.official_candidates(source)[0]
        self.assertIn("source_parser_refresh_required", candidate["blocking_reasons"])

    def test_reordered_source_events_keep_candidate_identity(self):
        first = index()
        second = dict(first["notices"][0]["events"][0], player_name="박테스트")
        first["notices"][0]["events"].append(second)
        reordered = copy.deepcopy(first)
        reordered["notices"][0]["events"].reverse()
        self.assertEqual({row["revision_id"] for row in module.official_candidates(first)},
                         {row["revision_id"] for row in module.official_candidates(reordered)})

    def test_snapshot_is_observation_not_a_guessed_registration_start(self):
        source = index()
        source["notices"][0]["events"] = []
        source["notices"][0]["players"] = [{"player_name": "김테스트", "number": "7", "position": "세터"}]
        candidates = module.official_candidates(source)
        approved, _, issues = module.review_export(candidates, [approve(candidates[0], effective_date="")], {"KVL-P-000001"})
        self.assertEqual(issues, [])
        self.assertEqual(approved[0]["kind"], "roster_snapshot")
        self.assertEqual(approved[0]["effective_date"], "")

    def test_duplicate_decisions_fail_closed(self):
        candidates = module.official_candidates(index())
        decision = approve(candidates[0])
        with self.assertRaises(ValueError):
            module.review_export(candidates, [decision, decision], {"KVL-P-000001"})

    def test_exact_duplicate_candidate_has_one_revision_and_is_blocked(self):
        source = index()
        source["notices"][0]["events"] *= 2
        candidates = module.official_candidates(source)
        self.assertEqual(len(candidates), 1)
        self.assertIn("duplicate_identity_in_notice", candidates[0]["blocking_reasons"])

    def test_event_identity_survives_corrected_source_revision(self):
        original = module.official_candidates(index())
        old, _, _ = module.review_export(original, [approve(original[0])], {"KVL-P-000001"})
        corrected = index(jersey_number="11")
        corrected["notices"][0]["html_sha256"] = "b" * 64
        revised = module.official_candidates(corrected)
        new, _, _ = module.review_export(revised, [approve(revised[0])], {"KVL-P-000001"})
        self.assertEqual(old[0]["event_id"], new[0]["event_id"])
        self.assertNotEqual(old[0]["revision_id"], new[0]["revision_id"])

    def test_review_fields_cannot_publish_private_text(self):
        candidates = module.official_candidates(index())
        for extra in ({"reviewer": "synthetic@example.invalid"}, {"effective_date_evidence": "Private family note"}):
            rows, _, issues = module.review_export(candidates, [approve(candidates[0], **extra)], {"KVL-P-000001"})
            self.assertEqual(rows, [])
            self.assertTrue(issues)

    def test_historical_extra_private_field_blocks_publication(self):
        old, _ = module.build_ledger(index(), {}, [], set())
        old["candidates"][0]["private_note"] = "SYNTHETIC_PRIVATE_CONTENT"
        with self.assertRaisesRegex(ValueError, "publication blocked"):
            module.build_ledger({"notices": []}, old, [], set())
        self.assertEqual(old["candidates"][0]["private_note"], "SYNTHETIC_PRIVATE_CONTENT")

    def test_next_season_is_not_silently_relabelled_current_season(self):
        source = index()
        source["notices"][0]["title"] = "2027-2028시즌 삼성화재 선수 등록"
        self.assertEqual(module.official_candidates(source)[0]["season"], "2027-28")

    def test_monitoring_dates_pause_on_review_deadline_and_end(self):
        config = {"monitoring_window": {"enabled": True, "season": "2026-27", "starts_on": "2026-11-01",
                  "ends_on": "2027-10-31", "review_due_on": "2027-06-01", "timezone": "Asia/Seoul"}}
        for today, reason in (("2026-10-31", "before_monitoring_start"), ("2027-06-01", "season_review_due"),
                              ("2027-11-01", "monitoring_ended")):
            result = module.monitoring_status(config, today)
            self.assertFalse(result["allowed"])
            self.assertEqual(result["reason"], reason)
        self.assertTrue(module.monitoring_status(config, "2027-05-31")["allowed"])
        with self.assertRaises(ValueError):
            module.monitoring_status({}, "2026-11-01")

    def test_required_window_rechecks_actual_kst_clock_without_output_writes(self):
        config = {"monitoring_window": {"enabled": True, "season": "2026-27", "starts_on": "2026-11-01",
                  "ends_on": "2027-10-31", "review_due_on": "2027-06-01", "timezone": "Asia/Seoul"}}
        clock_values = iter((datetime(2027, 5, 31, 14, 59, 59, tzinfo=timezone.utc),
                             datetime(2027, 5, 31, 15, 0, 0, tzinfo=timezone.utc)))
        with patch.object(module, "datetime") as clock, patch.object(module, "read", return_value=config), \
                patch.object(module, "write") as write, patch.object(module, "collect_news") as collect, \
                patch.object(module, "validate_public_outputs") as validate, \
                patch.object(sys, "argv", [str(SCRIPT), "--require-active-window"]), \
                redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()) as errors:
            clock.now.side_effect = lambda zone: next(clock_values).astimezone(zone)
            module.main()
            with self.assertRaises(SystemExit) as stopped:
                module.main()
            self.assertEqual(stopped.exception.code, 1)
            self.assertIn("season_review_due on 2027-06-01", errors.getvalue())
            self.assertEqual(clock.now.call_count, 2)
            write.assert_not_called()
            collect.assert_not_called()
            validate.assert_not_called()

    def test_required_window_cannot_be_bypassed_by_validation_or_collection_mode(self):
        for other in ("--validate-public", "--collect-news", "--check-window"):
            with self.subTest(other=other), \
                    patch.object(sys, "argv", [str(SCRIPT), "--require-active-window", other]), \
                    patch.object(module, "read") as read, redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as stopped:
                    module.main()
                self.assertEqual(stopped.exception.code, 2)
                read.assert_not_called()


class NewsMetadataTests(unittest.TestCase):
    def test_news_metadata_cannot_become_official_player_facts(self):
        rows = module.parse_feed(RSS, SOURCE, ["volleyball"])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["url"], "https://news.example/article?id=7")
        self.assertEqual(rows[0]["status"], "unverified_report")
        self.assertFalse(rows[0]["may_update_player_master"])
        self.assertNotIn("description", rows[0])
        self.assertNotIn("player_id", rows[0])

    def test_repeated_rss_run_is_idempotent_and_failed_feed_preserves_records(self):
        config = {"news_keywords": ["volleyball"], "news_sources": [SOURCE]}
        first, _ = module.collect_news(config, {}, fetch=lambda _: RSS, now="2026-11-01T00:00:00Z")
        second, _ = module.collect_news(config, first, fetch=lambda _: RSS, now="2026-11-02T00:00:00Z")
        self.assertEqual(first, second)

        def fail(_):
            raise TimeoutError("fixture timeout")

        failed, report = module.collect_news(config, first, fetch=fail)
        self.assertEqual(first, failed)
        self.assertEqual(report[0]["status"], "error")

    def test_atom_and_invalid_publication_date(self):
        data = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Volleyball news</title>
          <link href="https://news.example/a"/><published>unknown</published><content>private text</content></entry></feed>'''
        rows = module.parse_feed(data, SOURCE, ["volleyball"])
        self.assertEqual(rows[0]["published_at"], "")
        self.assertNotIn("content", rows[0])

    def test_entities_oversized_xml_and_untrusted_hosts_are_rejected(self):
        for data in (b'<!DOCTYPE rss [<!ENTITY e "bad">]><rss/>', b"x" * (module.MAX_FEED_BYTES + 1)):
            with self.assertRaises(ValueError):
                module.parse_feed(data, SOURCE, ["volleyball"])
        for url in ("http://news.example/a", "https://127.0.0.1/a", "https://news.example:444/a", "https://user@news.example/a"):
            with self.assertRaises(ValueError):
                module.safe_url(url, SOURCE["feed_hosts"])
        malicious = RSS.replace(b"https://news.example/article", b"https://other.example/article")
        self.assertEqual(module.parse_feed(malicious, SOURCE, ["volleyball"]), [])

    def test_signed_and_tokenized_publisher_urls_are_never_retained(self):
        for query in ("access_token=SYNTHETIC", "api_key=SYNTHETIC", "X-Amz-Signature=SYNTHETIC", "auth=SYNTHETIC"):
            with self.assertRaises(ValueError):
                module.safe_url("https://news.example/article?" + query, SOURCE["article_hosts"])
            malicious = RSS.replace(b"id=7&amp;utm_source=rss", query.encode())
            self.assertEqual(module.parse_feed(malicious, SOURCE, ["volleyball"]), [])

    def test_old_news_private_fields_are_not_copied_forward(self):
        config = {"news_keywords": ["volleyball"], "news_sources": [SOURCE]}
        old, _ = module.collect_news(config, {}, fetch=lambda _: RSS)
        old["candidates"][0]["private_note"] = "SYNTHETIC_PRIVATE_CONTENT"
        with self.assertRaisesRegex(ValueError, "publication blocked"):
            module.collect_news(config, old, fetch=lambda _: RSS)

    def test_public_security_scan_covers_historical_url_and_email_values(self):
        for value in ({"title": "Contact synthetic@example.invalid"}, {"url": "https://news.example/a?signature=SYNTHETIC"}):
            with self.assertRaisesRegex(ValueError, "publication blocked"):
                module.public_security_scan(value)
        with self.assertRaisesRegex(ValueError, "publication blocked"):
            module.public_security_scan({"title": "Synthetic 010-1234-5678"})
        module.public_security_scan({"salary_krw": "1100000000"})


if __name__ == "__main__":
    unittest.main()
