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
    "tests/v5-production-release.test.mjs",
    # Reviewed repository-extraction tooling and standalone project metadata.
    # These do not alter the ANEVUM web runtime, build or deployments.
    ".github/workflows/deploy-brandle.yml",
    ".github/workflows/export-brandle-source.yml",
    ".github/workflows/repository-split-verify.yml",
    "apps/cristybreathe/.github/workflows/ci.yml",
    "apps/cristybreathe/LICENSE",
    "docs/REPOSITORY_ARCHITECTURE.md",
    "games/brandle/.github/workflows/ci.yml",
    "games/brandle/.gitignore",
    "games/brandle/LICENSE",
    "games/brandle/README.md",
    "scripts/ops/repo-catalog.json",
    "scripts/ops/split-project.mjs",
    "tests/repository-split.test.mjs",
])

def app_preview_required(paths):
    # Empty/unknown input fails closed. Only this reviewed maintenance allowlist
    # can avoid legacy UI preview creation; all offline checks still run.
    return not paths or any(path not in MAINTENANCE_PATHS for path in paths)

def main():
    if len(sys.argv) != 3 or not all(re.fullmatch(r'[a-f0-9]{40}', s) for s in sys.argv[1:]):
        raise SystemExit('Two exact Git commit SHAs required')
    raw = subprocess.check_output(['git', 'diff', '--name-only', '-z', sys.argv[1]+'...'+sys.argv[2]])
    paths = [p.decode('utf-8', errors='strict') for p in raw.split(b'\0') if p]
    print('app_preview_required=' + str(app_preview_required(paths)).lower())

if __name__ == '__main__':
    main()
