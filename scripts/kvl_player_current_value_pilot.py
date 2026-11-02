#!/usr/bin/env python3
"""Manual one-player current-value journal runtime; never a historical event.

The ready check reads local configuration only. Collection uses five pinned
official GETs before the workflow authenticates. Recording independently fetches
the same evidence again, reads the fixed MASTER and separate journal, and may
append one literal observation row. Every output is bounded, sanitized JSON
outside the checkout; private Sheet snapshots/plans are never serialized.
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

import kvl_player_current_value as current
from kvl_player_current_value_sources import (
    CURRENT_NORMALIZED_SHA256, ERROR_CODES as SOURCE_ERROR_CODES,
    CurrentValueSourceError, collect_source_evidence,
)
from kvl_player_updates import digest, monitoring_status, public_security_scan

PILOT_PATH = "data/player-updates/current_value_pilot.json"
TARGETS_PATH = "data/player-updates/master_targets.json"
MONITORING_PATH = "data/player-updates/config.json"
EVENT_PILOT_PATH = "data/player-updates/pilot.json"
TARGET_ID = "vleague-men-2026-27-player-master"
APPROVED_ON = "2026-11-03"
REVIEWER = "KVL-OP-CURRENT-REVIEW"
MAX_JSON_BYTES = 262_144
EXPECTED_CONFIG = {
    "schema_version": 1, "enabled": True, "status": "MANUAL_CURRENT_VALUE_VERIFICATION_ONLY",
    "execution_mode": "manual_only", "record_type": current.RECORD_TYPE,
    "approved_on": APPROVED_ON, "reviewer": REVIEWER, "target_id": TARGET_ID,
    "scope": current.SCOPE, "expected_current_sha256": CURRENT_NORMALIZED_SHA256,
    "notice_html_sha256": current.NOTICE_SHA256, "effective_date": None,
    "effective_date_status": "unknown", "maximum_observation_age_seconds": current.MAX_AGE_SECONDS,
    "player_cell_writes": False, "event_journal_writes": False,
    "automatic_schedule": False, "publication": False,
}
ERROR_CODES = frozenset({
    "pilot_disabled", "approved_configuration_changed", "event_pilot_must_remain_blocked",
    "fixed_master_target_changed", "player_monitoring_window_closed",
    "trusted_manual_runtime_required", "explicit_numeric_github_run_id_required",
    "approval_date_not_reached", "invalid_local_configuration", "configuration_changed_during_run",
    "runtime_context_changed_during_run", "official_evidence_changed_between_fetches",
    "prepared_evidence_invalid_or_stale", "official_source_invalid_or_stale",
    "official_evidence_invalid_or_stale_before_append", "input_path_not_allowed",
    "json_file_invalid", "json_file_too_large", "runtime_output_must_be_outside_checkout",
    "runtime_json_path_required", "artifact_symlink_not_allowed", "artifact_write_failed",
    "github_output_path_not_allowed", "invalid_command_arguments", "runtime_clock_invalid",
    "runtime_failed", "source_collection_failed", "sheets_authentication_failed",
    "sheets_read_failed", "record_preparation_failed", "record_readback_not_verified",
})


class CurrentValuePilotError(ValueError):
    def __init__(self, code):
        self.code = code if code in ERROR_CODES else "runtime_failed"
        super().__init__(self.code)


def require(condition, code):
    if not condition:
        raise CurrentValuePilotError(code)


def _now(value=None):
    value = value() if callable(value) else value
    value = datetime.now(timezone.utc) if value is None else value
    require(isinstance(value, datetime) and value.tzinfo is not None, "runtime_clock_invalid")
    return value.astimezone(timezone.utc)


def _stamp(value):
    return current.timestamp(value)


def _no_symlinks(path):
    require(not any(item.is_symlink() for item in (path, *path.parents)), "artifact_symlink_not_allowed")


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "json_file_invalid")
        result[key] = value
    return result


def _read_json(path):
    _no_symlinks(path)
    try:
        with path.open("rb") as stream:
            body = stream.read(MAX_JSON_BYTES + 1)
        require(len(body) <= MAX_JSON_BYTES, "json_file_too_large")
        return json.loads(body.decode("utf-8"), object_pairs_hook=_unique_object,
                          parse_constant=lambda value: (_ for _ in ()).throw(CurrentValuePilotError("json_file_invalid")))
    except CurrentValuePilotError:
        raise
    except (OSError, ValueError, UnicodeError):
        raise CurrentValuePilotError("json_file_invalid") from None


def _read_local(root, relative):
    path = root / relative
    require(path.resolve().is_relative_to(root), "input_path_not_allowed")
    return _read_json(path)


def _runtime_path(root, path, *, json_only=True):
    path = Path(os.path.abspath(os.fspath(path)))
    _no_symlinks(path)
    require(not path.resolve().is_relative_to(root), "runtime_output_must_be_outside_checkout")
    require(not json_only or path.suffix == ".json", "runtime_json_path_required")
    require(not path.exists() or path.is_file(), "input_path_not_allowed")
    return path


def _write_json(root, path, content):
    path = _runtime_path(root, path)
    public_security_scan(content)
    body = (json.dumps(content, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode("utf-8")
    require(len(body) <= MAX_JSON_BYTES, "json_file_too_large")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        _no_symlinks(path)
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(body)
    except OSError:
        raise CurrentValuePilotError("artifact_write_failed") from None


def _runtime_context(environment):
    fixed = {"GITHUB_ACTIONS": "true", "GITHUB_REPOSITORY": current.REPOSITORY,
             "GITHUB_REF": "refs/heads/main", "GITHUB_WORKFLOW_REF": current.WORKFLOW_REF,
             "GITHUB_EVENT_NAME": "workflow_dispatch", "KVL_PLAYER_CURRENT_VALUE_CHECK": "true",
             "KVL_PLAYER_MASTER_SERVICE_ACCOUNT": current.SERVICE_ACCOUNT}
    require(all(environment.get(key) == value for key, value in fixed.items()), "trusted_manual_runtime_required")
    run_id = environment.get("GITHUB_RUN_ID")
    require(isinstance(run_id, str) and re.fullmatch(r"[1-9][0-9]{0,24}", run_id) is not None,
            "explicit_numeric_github_run_id_required")
    # Attempt is deliberately excluded: a retry must reuse the original record.
    return {"repository": current.REPOSITORY, "ref": "refs/heads/main",
            "workflow_ref": current.WORKFLOW_REF, "event_name": "workflow_dispatch", "run_id": run_id}


def _gate(root, environment, now):
    runtime = _runtime_context(environment)
    pilot = _read_local(root, PILOT_PATH)
    require(isinstance(pilot, dict), "invalid_local_configuration")
    require(pilot.get("enabled") is True, "pilot_disabled")
    # Digest comparison preserves JSON type distinctions (true is not 1).
    require(digest(pilot) == digest(EXPECTED_CONFIG), "approved_configuration_changed")
    require(now.astimezone(ZoneInfo("Asia/Seoul")).date().isoformat() >= APPROVED_ON, "approval_date_not_reached")
    old_pilot = _read_local(root, EVENT_PILOT_PATH)
    require(isinstance(old_pilot, dict) and old_pilot.get("enabled") is False
            and old_pilot.get("event_scope") is None and old_pilot.get("status") == "BLOCKED_EFFECTIVE_DATE",
            "event_pilot_must_remain_blocked")
    config = _read_local(root, TARGETS_PATH)
    require(isinstance(config, dict) and isinstance(config.get("targets"), list), "fixed_master_target_changed")
    matches = [item for item in config["targets"] if isinstance(item, dict) and item.get("id") == TARGET_ID]
    fixed = {"spreadsheet_id": current.SPREADSHEET_ID, "spreadsheet_title": current.SPREADSHEET_TITLE,
             "sheet_id": current.CURRENT_ID, "sheet_title": current.CURRENT_TITLE,
             "gender": current.SCOPE["gender"], "snapshot_kind": "current_roster"}
    require(len(matches) == 1 and all(matches[0].get(key) == value for key, value in fixed.items())
            and config.get("season") == current.SCOPE["season"] and config.get("header_row") == 3
            and config.get("headers") == current.CURRENT_HEADERS, "fixed_master_target_changed")
    monitoring = _read_local(root, MONITORING_PATH)
    require(isinstance(monitoring, dict), "invalid_local_configuration")
    window = monitoring_status(monitoring, now.astimezone(ZoneInfo("Asia/Seoul")).date().isoformat())
    require(window["allowed"] and window["season"] == current.SCOPE["season"], "player_monitoring_window_closed")
    fingerprint = digest({"pilot": pilot, "target_configuration": config,
                          "monitoring_window": monitoring.get("monitoring_window"), "event_pilot": old_pilot})
    return {"configuration_sha256": fingerprint, "github_runtime": runtime,
            "target_config": config, "target": matches[0]}


def _base_report(now):
    return {"schema_version": 1, "record_type": current.RECORD_TYPE, "status": "BLOCKED", "ready": False,
            "stage": "local_gate", "reason": "runtime_failed", "checked_at": _stamp(now),
            "execution_origin": "github_actions", "github_runtime_verified": False,
            "source_collection_attempted": False, "official_evidence_verified": False,
            "workflow_authentication_precedes_record": False,
            "service_client_creation_attempted": False, "service_client_created": False,
            "sheets_read_attempted": False, "write_attempted": False,
            "record_rows_added": 0, "record_state": "NOT_ATTEMPTED", "player_cells_changed": 0,
            "event_journal_rows_added": 0, "roster_files_changed": 0, "publication_performed": False,
            "verification_record_readback_verified": False, "effective_date": None,
            "effective_date_status": "unknown"}


def _safe_reason(error, stage):
    if isinstance(error, CurrentValuePilotError):
        return error.code
    if isinstance(error, CurrentValueSourceError) and error.code in SOURCE_ERROR_CODES:
        return error.code
    return {"local_gate": "invalid_local_configuration", "prepared_evidence": "prepared_evidence_invalid_or_stale",
            "official_source": "official_source_invalid_or_stale", "authentication": "sheets_authentication_failed",
            "master_read": "sheets_read_failed", "prepare_record": "record_preparation_failed",
            "record_readback": "record_readback_not_verified"}.get(stage, "runtime_failed")


def _failed(report, error, stage, *, wrapped=None):
    report = copy.deepcopy(report)
    if wrapped is not None and wrapped.gate_failure is not None:
        error, stage = wrapped.gate_failure, "pre_append_recheck"
    attempted = bool(wrapped is not None and wrapped.write_attempted)
    report.update(status="FAILED" if attempted else "BLOCKED", ready=False, stage=stage,
                  reason=_safe_reason(error, stage), write_attempted=attempted,
                  record_rows_added=None if attempted else 0,
                  record_state="UNVERIFIED_AFTER_WRITE_ATTEMPT" if attempted else "NOT_ATTEMPTED",
                  verification_record_readback_verified=False)
    public_security_scan(report)
    return report


def preflight(root, *, environment=None, now=None):
    """No source request, token lookup, client construction, or remote write."""
    root = Path(root).resolve()
    environment = os.environ if environment is None else environment
    report = _base_report(_now(now))
    try:
        gate = _gate(root, environment, _now(now))
        report.update(status="READY_FOR_RUNTIME_VERIFICATION", ready=True, reason="ready",
                      github_runtime_verified=True, github_runtime=gate["github_runtime"],
                      configuration_sha256=gate["configuration_sha256"], scope=copy.deepcopy(current.SCOPE),
                      approved_on=APPROVED_ON, target_id=TARGET_ID)
        public_security_scan(report)
        return report
    except Exception as error:
        return _failed(report, error, "local_gate")


def _recheck(root, environment, baseline, now):
    gate = _gate(root, environment, _now(now))
    require(gate["configuration_sha256"] == baseline["configuration_sha256"], "configuration_changed_during_run")
    require(gate["github_runtime"] == baseline["github_runtime"], "runtime_context_changed_during_run")
    return gate


def _validate(evidence, now):
    return current.validate_source_evidence(evidence, expected_current_sha256=CURRENT_NORMALIZED_SHA256, now=_now(now))


def collect_evidence(root, *, environment=None, now=None, source_fetch=None):
    """Return only validated, minimal evidence and a separate sanitized report."""
    root = Path(root).resolve()
    environment = os.environ if environment is None else environment
    report = preflight(root, environment=environment, now=now)
    if not report["ready"]:
        return report, None
    stage = "local_gate"
    try:
        _recheck(root, environment, report, now)
        stage = "official_source"
        report["source_collection_attempted"] = True
        evidence = (source_fetch or collect_source_evidence)()
        proof = _validate(evidence, now)
        _recheck(root, environment, report, now)
        report.update(status="OFFICIAL_EVIDENCE_READY", stage=stage, reason="ready",
                      official_evidence_verified=True, evidence_sha256=proof["evidence_sha256"],
                      observed_at=proof["observed_at"], sources=proof["public_sources"])
        public_security_scan(report)
        public_security_scan(evidence)
        return report, evidence
    except Exception as error:
        return _failed(report, error, stage), None


class _AppendCheckedClient:
    def __init__(self, client, check):
        self.client, self.check = client, check
        self.spreadsheet_id = client.spreadsheet_id
        self.write_attempted = False
        self.gate_failure = None

    def read_snapshot(self):
        return self.client.read_snapshot()

    def read_verification_journal(self):
        return self.client.read_verification_journal()

    def append_verification(self, values):
        try:
            self.check()
        except Exception as error:
            self.gate_failure = error
            raise
        self.write_attempted = True
        return self.client.append_verification(values)


def record_verification(root, prepared_evidence, *, environment=None, now=None, source_fetch=None, client_factory=None):
    """Re-fetch official proof and append/read back one observation at most once."""
    root = Path(root).resolve()
    environment = os.environ if environment is None else environment
    report = preflight(root, environment=environment, now=now)
    # The workflow already ran WIF before entering this mode. Client creation
    # and Sheets requests below are reported separately from that auth step.
    report["workflow_authentication_precedes_record"] = True
    if not report["ready"]:
        return report
    wrapped, stage = None, "prepared_evidence"
    try:
        prepared = _validate(prepared_evidence, now)
        _recheck(root, environment, report, now)
        stage = "official_source"
        report["source_collection_attempted"] = True
        evidence = (source_fetch or collect_source_evidence)()
        fresh = _validate(evidence, now)
        require(fresh["evidence_sha256"] == prepared["evidence_sha256"], "official_evidence_changed_between_fetches")
        report.update(official_evidence_verified=True, evidence_sha256=fresh["evidence_sha256"])
        stage = "local_gate"
        gate = _recheck(root, environment, report, now)

        def final_check():
            _recheck(root, environment, report, now)
            try:
                verified = _validate(evidence, now)
            except Exception:
                raise CurrentValuePilotError("official_evidence_invalid_or_stale_before_append") from None
            require(verified["evidence_sha256"] == fresh["evidence_sha256"], "official_evidence_changed_between_fetches")

        final_check()
        stage = "authentication"
        report["service_client_creation_attempted"] = True
        factory = client_factory or current.CurrentValueSheetsClient.from_environment
        client = factory(gate["target_config"], gate["target"], mode="record",
                         expected_current_sha256=CURRENT_NORMALIZED_SHA256, environment=environment)
        report["service_client_created"] = True
        wrapped = _AppendCheckedClient(client, final_check)
        stage = "master_read"
        report["sheets_read_attempted"] = True
        master, journal = wrapped.read_snapshot(), wrapped.read_verification_journal()
        stage = "prepare_record"
        plan = current.prepare_verification(evidence, master, journal, expected_current_sha256=CURRENT_NORMALIZED_SHA256,
                                            reviewer=REVIEWER, reviewed_at=_stamp(_now(now)),
                                            run_id=report["github_runtime"]["run_id"], now=_now(now))
        final_check()
        stage = "record_readback"
        # Production uses the core's live clock at every read. A test clock is
        # also re-read by final_check immediately before the actual append.
        receipt = current.apply_verification(wrapped, plan, now=None if now is None else _now(now))
        require(wrapped.gate_failure is None, "record_readback_not_verified")
        # The core receipt is allowlisted; the plan and private row hashes stay
        # in memory. Defensive omission also covers older core implementations.
        receipt.pop("plan_hash", None)
        receipt.update(execution_origin="github_actions", github_runtime_verified=True,
                       github_runtime=report["github_runtime"], configuration_sha256=report["configuration_sha256"],
                       approved_on=APPROVED_ON, stage="completed", ready=True, reason="verified",
                       github_service_account_readback_verified=True, source_collection_attempted=True,
                       official_evidence_verified=True, workflow_authentication_precedes_record=True,
                       service_client_creation_attempted=True, service_client_created=True, sheets_read_attempted=True,
                       record_state="READBACK_VERIFIED")
        public_security_scan(receipt)
        return receipt
    except Exception as error:
        return _failed(report, error, stage, wrapped=wrapped)


def _github_output(root, path, report, environment):
    expected = environment.get("GITHUB_OUTPUT")
    require(isinstance(expected, str) and expected and Path(os.path.abspath(path)) == Path(os.path.abspath(expected)),
            "github_output_path_not_allowed")
    path = _runtime_path(root, path, json_only=False)
    try:
        descriptor = os.open(path, os.O_WRONLY | os.O_APPEND | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write("ready=" + str(report["ready"]).lower() + "\nreason=" + report["reason"] + "\n")
    except OSError:
        raise CurrentValuePilotError("artifact_write_failed") from None


def _status_line(report):
    return ("PLAYER_CURRENT_VALUE status=" + report["status"] + " stage=" + report["stage"]
            + " reason=" + report["reason"] + " write_attempted=" + str(report["write_attempted"]).lower()
            + " record_readback_verified=" + str(report["verification_record_readback_verified"]).lower())


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check-ready", action="store_true")
    mode.add_argument("--collect-evidence", action="store_true")
    mode.add_argument("--record", action="store_true")
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--github-output")
    parser.add_argument("--evidence")
    parser.add_argument("--output")
    args = parser.parse_args(argv)
    root, report_path, report = args.root.resolve(), None, None
    try:
        require((args.check_ready and args.github_output and not args.output and not args.evidence)
                or (args.collect_evidence and args.output and not args.github_output and not args.evidence)
                or (args.record and args.output and args.evidence and not args.github_output), "invalid_command_arguments")
        if args.check_ready:
            report = preflight(root)
            _github_output(root, args.github_output, report, os.environ)
        elif args.collect_evidence:
            evidence_path = _runtime_path(root, args.output)
            require(evidence_path.name == "evidence.json", "runtime_json_path_required")
            report_path = _runtime_path(root, evidence_path.parent / "report.json")
            # Never leave an old proof that could appear to be this run's output.
            if evidence_path.exists():
                evidence_path.unlink()
            report, evidence = collect_evidence(root)
            if evidence is not None:
                _write_json(root, evidence_path, evidence)
            _write_json(root, report_path, report)
        else:
            report_path = _runtime_path(root, args.output)
            require(report_path.name == "report.json", "runtime_json_path_required")
            evidence_path = _runtime_path(root, args.evidence)
            require(evidence_path != report_path, "input_path_not_allowed")
            report = preflight(root)
            report["workflow_authentication_precedes_record"] = True
            if report["ready"]:
                evidence = _read_json(evidence_path)
                report = record_verification(root, evidence)
            _write_json(root, report_path, report)
        print(_status_line(report))
        return 0 if args.check_ready or report["ready"] else 1
    except Exception as error:
        if report is None:
            report = _failed(_base_report(datetime.now(timezone.utc)), error, "local_gate")
            report["workflow_authentication_precedes_record"] = bool(args.record)
        else:
            # An artifact failure after a remote append must retain the actual
            # write/readback result instead of claiming that no write happened.
            report = copy.deepcopy(report)
            report.update(ready=False, result_before_artifact_error=report["status"],
                          status="ARTIFACT_OR_INPUT_FAILED", stage="artifact_or_input",
                          reason=_safe_reason(error, "artifact_or_input"))
        if report_path is not None:
            try:
                _write_json(root, report_path, report)
            except Exception:
                pass
        print(_status_line(report))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
