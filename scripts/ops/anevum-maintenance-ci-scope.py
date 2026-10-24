#!/usr/bin/env python3
"""Decide whether this maintenance-only PR changes application runtime inputs."""
import re
import subprocess
import sys

MAINTENANCE_PATHS = frozenset([
    ".github/workflows/anevum-ops-progression-reset-20261021.yml",
    ".github/workflows/anevum-verify.yml",
    "docs/ANEVUM.OPS.MAINT.2026-10-21.002.MANUAL-RESET-RUNBOOK.md",
    "scripts/ops/anevum-progression-reset-20261021.py",
    "scripts/ops/anevum-maintenance-ci-scope.py",
    "tests/test_anevum_progression_reset_20261021.py",
    "tests/test_anevum_maintenance_ci_scope.py",
    "tests/helpers/retired-production-contract.mjs",
    "tests/single-production-deploy.test.mjs",
    "tests/v5-verify-deploy-safety.test.mjs",
    "tests/command-trading.test.mjs",
    "tests/v5-owner-member-binding.test.mjs",
    "tests/v5-preview-encrypted-backup.test.mjs",
    "tests/v5-production-manual-deploy.test.mjs",
    "tests/v5-production-release.test.mjs"
])

def isolated_house_path(path):
    # This additive, independently authenticated Node app is not imported into
    # Vite/Worker production builds. Root/runtime input changes still force a
    # public website preview. Exact workflow name and path segment boundaries
    # prevent accidental broad exemptions.
    if path == ".github/workflows/continuance-house-v001.yml":
        return True
    return (path.startswith("apps/continuance-house/")
            and path != "apps/continuance-house/"
            and ".." not in path.split("/"))


def app_preview_required(paths):
    # Unknown or production application inputs fail closed. Standalone V001
    # house source runs its own isolated security/behavior CI instead.
    return not paths or any(
        path not in MAINTENANCE_PATHS and not isolated_house_path(path)
        for path in paths
    )

def main():
    if len(sys.argv) != 3 or not all(re.fullmatch(r'[a-f0-9]{40}', s) for s in sys.argv[1:]):
        raise SystemExit('Two exact Git commit SHAs required')
    raw = subprocess.check_output(['git', 'diff', '--name-only', '-z', sys.argv[1]+'...'+sys.argv[2]])
    paths = [p.decode('utf-8', errors='strict') for p in raw.split(b'\0') if p]
    print('app_preview_required=' + str(app_preview_required(paths)).lower())

if __name__ == '__main__':
    main()
