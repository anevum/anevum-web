#!/usr/bin/env python3
"""Decide whether this maintenance-only PR changes application runtime inputs."""
import re
import subprocess
import sys

MAINTENANCE_PATHS = frozenset([
    # Repository overview text is not served or bundled into the web app.
    "README.md",
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

# Separate Access-protected reviewer files never deploy the legacy apex.
# They require their own independent build/browser gate rather than the
# old anevum-web-nextgen remote-preview Access configuration.
ISOLATED_ORIGINAL_WORKS_REVIEW_PATHS = frozenset([
    "scripts/ops/build-original-works-review.sh",
    "scripts/ops/local-original-works-review-server.mjs",
    "scripts/ops/original-works-review-worker.mjs",
    "scripts/ops/verify-original-works-review-browser.sh",
    "tests/original-works-review-worker.test.mjs",
    "wrangler.original-works-review.jsonc",
])

# The static public shell has no legacy V5 runtime or private publishing path.
# Its own browser/security gate is mandatory for these exact files only.
ISOLATED_PUBLIC_STUDIO_PATHS = frozenset([
    "apps/anevum-public-studio/worker.mjs",
    "tests/anevum-public-studio.test.mjs",
    "scripts/ops/anevum-public-studio-test-server.mjs",
    "scripts/ops/verify-anevum-public-studio-browser.mjs",
    "wrangler.anevum-public-studio.jsonc",
    "docs/design/ANEVUM.WEB.BUILD.2026-11-03.022.PUBLIC-ORIGINAL-WORKS-SHELL.md",
])

def public_studio_required(paths):
    return bool(paths) and any(path in ISOLATED_PUBLIC_STUDIO_PATHS for path in paths)

def isolated_review_required(paths):
    return bool(paths) and any(path in ISOLATED_ORIGINAL_WORKS_REVIEW_PATHS for path in paths)

def app_preview_required(paths):
    # Unknown or mixed application changes still require legacy preview safety.
    # Isolated review files use a separate mandatory review acceptance gate.
    return not paths or any(path not in MAINTENANCE_PATHS | ISOLATED_ORIGINAL_WORKS_REVIEW_PATHS | ISOLATED_PUBLIC_STUDIO_PATHS for path in paths)

def main():
    if len(sys.argv) != 3 or not all(re.fullmatch(r'[a-f0-9]{40}', s) for s in sys.argv[1:]):
        raise SystemExit('Two exact Git commit SHAs required')
    raw = subprocess.check_output(['git', 'diff', '--name-only', '-z', sys.argv[1]+'...'+sys.argv[2]])
    paths = [p.decode('utf-8', errors='strict') for p in raw.split(b'\0') if p]
    print('app_preview_required=' + str(app_preview_required(paths)).lower())
    print('isolated_review_required=' + str(isolated_review_required(paths)).lower())
    print('public_studio_required=' + str(public_studio_required(paths)).lower())

if __name__ == '__main__':
    main()
