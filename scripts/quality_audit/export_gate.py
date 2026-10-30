"""Fail-closed PR gate for changed public JSON, with explicit reviewed hash evidence."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


def validate_changed(root, paths, manifest):
    failures = []
    for rel in paths:
        if not (rel == 'players.json' or rel.startswith('data/')) or not rel.endswith('.json'):
            continue
        file = (Path(root) / rel).resolve()
        if not file.is_relative_to(Path(root).resolve()) or not file.exists():
            failures.append(rel); continue
        entry = manifest.get(rel, {})
        if (entry.get('access_level') != 'PUBLIC' or entry.get('record_status') != 'VERIFIED'
                or not entry.get('source_ids') or not entry.get('verified_at')
                or entry.get('sha256') != hashlib.sha256(file.read_bytes()).hexdigest()):
            failures.append(rel)
            continue
        # A file-level assertion cannot override an explicitly private/draft nested record.
        from .checks import security
        if security(root, [rel])[0]['outcome'] == 'FAIL':
            failures.append(rel)
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='.'); parser.add_argument('--base', required=True)
    parser.add_argument('--manifest', default='scripts/quality_audit/public-review-manifest.json')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-f0-9]{40}', args.base):
        parser.error('base must be an exact commit SHA')
    root = Path(args.root).resolve()
    # Three-dot diff covers the PR, not unrelated commits landing on main.
    proc = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=ACMR', args.base + '...HEAD'],
                          cwd=root, text=True, capture_output=True, check=True)
    manifest = json.loads((root / args.manifest).read_text())['files']
    failures = validate_changed(root, proc.stdout.splitlines(), manifest)
    # No data values or paths from potentially confidential new exports are logged.
    print(json.dumps({'check': 'PUBLIC_VERIFIED_CHANGED_EXPORT', 'status': 'FAIL' if failures else 'PASS',
                      'unverified_file_count': len(failures)}))
    return int(bool(failures))


if __name__ == '__main__':
    raise SystemExit(main())
