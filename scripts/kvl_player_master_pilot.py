#!/usr/bin/env python3
"""Gated, one-event player MASTER pilot; no auth or requests when disabled.

Preflight is local and read-only. Apply verifies one fresh official revision,
uses the scoped Sheets writer, then exports verified local roster/provenance
files. It never invents approvals, creates tabs, pushes Git, or publishes Pages.
Raw sources, MASTER snapshots and notes are never saved in public artifacts.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
from zoneinfo import ZoneInfo

from kovo_official_notices import detail, normalize_detail
from kvl_player_master_apply import (JOURNAL_HEADERS, JOURNAL_TITLE, PlayerMasterError,
                                     PlayerSheetsClient, SCOPE_KEYS, apply_application,
                                     prepare_application)
from kvl_player_master_export import export_from_receipt
from kvl_player_updates import (digest, iso_date, monitoring_status, official_candidates,
                                public_security_scan, validate_public_export,
                                validate_public_ledger)

REPOSITORY = "kvolleylab/kvolleylab"
WORKFLOW_REF = REPOSITORY + "/.github/workflows/vleague-auto-update-v1.yml@refs/heads/main"
PILOT_PATH = "data/player-updates/pilot.json"
TARGETS_PATH = "data/player-updates/master_targets.json"
EVENTS_PATH = "data/player-updates/reviewed_events.json"
LEDGER_PATH = "data/player-updates/official_candidates.json"
MONITORING_PATH = "data/player-updates/config.json"
SCOPE_FIELDS = {"candidate_id", "player_id", "source_id", "revision_id"}


class PilotError(ValueError):
    pass


def require(condition, code):
    if not condition:
        raise PilotError(code)


def _read(root, relative):
    path = root / relative
    require(path.resolve().is_relative_to(root) and not path.is_symlink(), "input_path_outside_checkout")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise PilotError("required_local_configuration_unavailable") from None


def _now(now=None):
    return now or datetime.now(timezone.utc)


def _stamp(now):
    return now.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _context(environment):
    return (environment.get("GITHUB_REPOSITORY") == REPOSITORY
            and environment.get("GITHUB_REF") == "refs/heads/main"
            and environment.get("GITHUB_WORKFLOW_REF") == WORKFLOW_REF
            and environment.get("GITHUB_EVENT_NAME") in {"schedule", "workflow_dispatch"})


def _blocked(reason, now, configured_status=None):
    report = {"schema_version": 1, "status": "BLOCKED", "ready": False, "reason": reason,
              "checked_at": _stamp(now), "source_requests": 0, "authentication_attempted": False,
              "master_write_attempted": False, "receipt_written": False, "local_export_written": False}
    if configured_status is not None:
        report["configured_status"] = configured_status
    public_security_scan(report)
    return report


def preflight(root, *, environment=None, now=None):
    """Read fixed local files only, returning ready=false before any auth/network."""
    root = Path(root).resolve()
    now, environment = _now(now), os.environ if environment is None else environment
    try:
        pilot = _read(root, PILOT_PATH)
        require(isinstance(pilot, dict) and pilot.get("schema_version") == 1, "unsupported_pilot_configuration")
        public_security_scan(pilot)
        if pilot.get("enabled") is not True:
            return _blocked("pilot_disabled", now, pilot.get("status"))
        event_scope = pilot.get("event_scope")
        if not isinstance(event_scope, dict) or set(event_scope) != set(SCOPE_KEYS):
            return _blocked("approved_event_scope_missing", now)
        scope = pilot.get("scope")
        require(isinstance(scope, dict) and set(scope) == SCOPE_FIELDS,
                "one_candidate_scope_required")
        require(all(isinstance(value, str) and value for value in [*scope.values(), *event_scope.values()]),
                "incomplete_pilot_scope")
        require(all(event_scope[key] == scope[key] for key in ("player_id", "source_id", "revision_id")),
                "candidate_and_event_scope_mismatch")
        events = _read(root, EVENTS_PATH)
        ledger = _read(root, LEDGER_PATH)
        validate_public_export(events)
        validate_public_ledger(ledger)
        require(events.get("status") == "reviewed_export_only" and len(events.get("events", [])) == 1,
                "exactly_one_approved_event_required")
        event = events["events"][0]
        require(all(event.get(key) == value for key, value in event_scope.items())
                and all(event.get(key) == value for key, value in scope.items()), "reviewed_event_outside_scope")
        require(event.get("kind") in {"number_change", "position_change"}
                and event.get("status") == "reviewed_export_not_applied", "approved_number_or_position_event_required")
        candidates = [item for item in ledger.get("candidates", []) if item.get("revision_id") == scope["revision_id"]]
        require(len(candidates) == 1, "unique_current_candidate_required")
        candidate = candidates[0]
        require(candidate.get("review_status") == "reviewed_export_not_applied" and not candidate.get("blocking_reasons"),
                "unblocked_reviewed_candidate_required")
        require(candidate.get("candidate_id") == scope["candidate_id"] and candidate.get("source_id") == scope["source_id"],
                "candidate_scope_mismatch")
        require(candidate["revision_id"] == "KVL-PCR-" + digest({key: value for key, value in candidate.items()
                    if key not in {"revision_id", "review_status"}}), "candidate_revision_checksum_mismatch")
        effective = iso_date(event.get("effective_date"))
        require(effective and event.get("effective_date_basis") == "official_notice_text"
                and candidate.get("effective_date") == effective
                and candidate.get("effective_date_basis") == "explicit_effective_date", "explicit_effective_date_required")
        require(effective <= now.astimezone(ZoneInfo("Asia/Seoul")).date().isoformat(), "future_effective_date")
        require(all(event.get(key) == candidate.get(key) for key in
                    ("candidate_id", "revision_id", "source_id", "source_version", "source_url", "kind", "gender", "season", "observed")),
                "reviewed_event_source_mismatch")
        config = _read(root, TARGETS_PATH)
        require(config.get("pilot_scope") == event_scope, "master_target_pilot_scope_mismatch")
        targets = [target for target in config.get("targets", []) if target.get("gender") == event["gender"]]
        require(len(targets) == 1, "verified_master_target_missing")
        journal = targets[0].get("journal", {})
        require(journal.get("title") == JOURNAL_TITLE and journal.get("headers") == JOURNAL_HEADERS
                and journal.get("header_row") == 1 and type(journal.get("sheet_id")) is int,
                "verified_journal_configuration_missing")
        window = monitoring_status(_read(root, MONITORING_PATH),
                                   now.astimezone(ZoneInfo("Asia/Seoul")).date().isoformat())
        require(window["allowed"] and window["season"] == event["season"], "player_monitoring_window_closed")
        require(_context(environment), "trusted_runtime_context_required")
        return {"schema_version": 1, "status": "READY_FOR_RUNTIME_VERIFICATION", "ready": True, "reason": "ready",
                "checked_at": _stamp(now), "scope": copy.deepcopy(scope), "event_scope": copy.deepcopy(event_scope),
                "target_id": targets[0]["id"], "source_requests": 0, "authentication_attempted": False,
                "master_write_attempted": False, "receipt_written": False, "local_export_written": False}
    except (PilotError, PlayerMasterError) as error:
        return _blocked(str(error), now)
    except (TypeError, KeyError, ValueError):
        return _blocked("invalid_local_review_or_configuration", now)


def _require_ready(root, environment, now=None):
    report = preflight(root, environment=environment, now=now)
    require(report["ready"], report["reason"])
    return report


def fresh_source(ledger, scope, season, fetch_notice=detail, *, now=None):
    """Fetch one official detail; derive its revision again instead of re-dating cache."""
    match = re.fullmatch(r"KVL-SRC-KOVO-NOTICE-(\d+)", scope["source_id"])
    require(match is not None, "invalid_official_notice_id")
    normalized = normalize_detail(fetch_notice(int(match[1])))
    require(normalized["id"] == int(match[1]), "official_notice_identity_changed")
    fresh = official_candidates({"season": season, "notices": [normalized]})
    candidates = [item for item in fresh if item.get("candidate_id") == scope["candidate_id"]]
    require(len(candidates) == 1, "fresh_official_candidate_not_unique")
    candidate = candidates[0]
    current = [item for item in ledger["candidates"] if item.get("revision_id") == scope["revision_id"]]
    require(len(current) == 1 and candidate == {key: value for key, value in current[0].items() if key != "review_status"},
            "fresh_official_revision_requires_new_review")
    require(candidate.get("effective_date") and candidate.get("effective_date_basis") == "explicit_effective_date",
            "fresh_explicit_effective_date_required")
    proof = {key: candidate[key] for key in ("source_id", "source_version", "revision_id", "source_body_sha256")}
    proof.update(fetched_at=_stamp(_now(now)), parsed_effective_date=candidate["effective_date"])
    return proof


def _output_dir(root, output):
    output = Path(output).resolve()
    require(not output.is_relative_to(root), "runtime_output_must_be_outside_checkout")
    return output


def _write(path, content):
    public_security_scan(content)
    path.parent.mkdir(parents=True, exist_ok=True)
    require(not path.is_symlink(), "artifact_symlink_not_allowed")
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


class _WindowCheckedClient:
    def __init__(self, client, check):
        self.client, self.check = client, check
        self.spreadsheet_id = client.spreadsheet_id
        self.write_attempted = False

    def read_snapshot(self):
        return self.client.read_snapshot()

    def read_journal(self, scope):
        return self.client.read_journal(scope)

    def batch_apply(self, requests):
        self.check()
        self.write_attempted = True
        return self.client.batch_apply(requests)


def run_pilot(root, output, *, environment=None, now=None, fetch_notice=detail,
              client_factory=PlayerSheetsClient.from_environment, exporter=export_from_receipt):
    """Apply only after all local gates; return sanitized progress, never raw rows."""
    root = Path(root).resolve()
    output = _output_dir(root, output)
    environment = os.environ if environment is None else environment
    report = preflight(root, environment=environment, now=now)
    if not report["ready"]:
        _write(output / "report.json", report)
        return report
    wrapped = None
    stage = "local_gate"
    try:
        check = lambda: _require_ready(root, environment, now)
        check()
        pilot = _read(root, PILOT_PATH)
        config = _read(root, TARGETS_PATH)
        exported, ledger = _read(root, EVENTS_PATH), _read(root, LEDGER_PATH)
        event = exported["events"][0]
        target = next(item for item in config["targets"] if item["id"] == report["target_id"])
        stage = "official_source"
        check()
        report["source_requests"] = 1
        proof = fresh_source(ledger, pilot["scope"], event["season"], fetch_notice, now=now)
        stage = "authentication"
        check()
        report["authentication_attempted"] = True
        wrapped = _WindowCheckedClient(client_factory(config, target), check)
        stage = "master_prepare"
        snapshot = wrapped.read_snapshot()
        journal = wrapped.read_journal(config["pilot_scope"])
        plan = prepare_application(config, exported, ledger, snapshot, journal, source_readback=proof, now=now)
        stage = "master_apply_readback"
        receipt = apply_application(wrapped, plan, now=now)
        report["master_write_attempted"] = wrapped.write_attempted
        _write(output / "receipt.json", receipt)
        report["receipt_written"] = True
        stage = "local_roster_export"
        check()
        exported_files = exporter(root, receipt, apply=True, now=now)
        public_security_scan(exported_files)
        _write(output / "export.json", exported_files)
        report.update(status="MASTER_VERIFIED_LOCAL_EXPORT_COMPLETE", reason="complete",
                      local_export_written=True, finished_at=_stamp(_now(now)),
                      changed_master_cells=receipt["changed_cells"], journal_rows_added=receipt["journal_rows_added"],
                      application_status=receipt["application_status"])
    except Exception as error:
        report.update(status="FAILED", ready=False, reason=str(error) if isinstance(error, (PilotError, PlayerMasterError))
                      else "runtime_verification_failed", failed_stage=stage, finished_at=_stamp(_now(now)))
        report["master_write_attempted"] = bool(wrapped and wrapped.write_attempted)
    _write(output / "report.json", report)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--preflight", action="store_true")
    mode.add_argument("--apply", action="store_true")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--github-output", type=Path)
    parser.add_argument("--require-ready", action="store_true")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    try:
        output = _output_dir(root, args.output)
        if args.preflight:
            report = preflight(root)
            _write(output / "report.json", report)
        else:
            report = run_pilot(root, output)
        if args.github_output:
            destination = args.github_output.resolve()
            require(not destination.is_relative_to(root) and not args.github_output.is_symlink(), "github_output_must_be_outside_checkout")
            require(re.fullmatch(r"[a-z0-9_]+", report["reason"]) is not None, "unsafe_github_output_reason")
            with destination.open("a", encoding="utf-8") as stream:
                stream.write(f"ready={str(report['ready']).lower()}\nreason={report['reason']}\n")
        print(f"PLAYER_MASTER_PILOT status={report['status']} ready={str(report['ready']).lower()} reason={report['reason']}")
        return 0 if (args.preflight and not args.require_ready) or report["ready"] else 2
    except (PilotError, OSError):
        print("PLAYER_MASTER_PILOT status=FAILED ready=false reason=runtime_output_or_configuration_error")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
