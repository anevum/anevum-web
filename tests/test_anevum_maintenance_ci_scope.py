"""Offline boundary tests for maintenance-only UI preview classification."""
import importlib.util
from pathlib import Path
import unittest
target=Path(__file__).resolve().parents[1]/'scripts/ops/anevum-maintenance-ci-scope.py'
spec=importlib.util.spec_from_file_location('ci_scope',target)
scope=importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope)

class ScopeTests(unittest.TestCase):
    def test_reviewed_maintenance_paths_do_not_change_app_runtime(self):
        self.assertFalse(scope.app_preview_required(list(scope.MAINTENANCE_PATHS)))

    def test_repo_extraction_metadata_does_not_need_anevum_web_preview(self):
        approved = [
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
            "tests/repository-split.test.mjs"
        ]
        self.assertFalse(scope.app_preview_required(approved))

    def test_application_source_changes_still_require_preview(self):
        for path in ("apps/cristybreathe/src/worker.mjs",
                     "games/brandle/app.mjs",
                     "games/brandle/build-worker.mjs",
                     "src/App.tsx",
                     "worker.mjs"):
            with self.subTest(path=path):
                self.assertTrue(scope.app_preview_required([
                    "docs/REPOSITORY_ARCHITECTURE.md", path]))

    def test_any_unknown_runtime_or_build_input_requires_preview(self):
        for path in ('src/App.tsx','worker.mjs','wrangler.jsonc','package.json',
                     'creator-v1/web/src/App.tsx','scripts/build.mjs',
                     '.github/workflows/new-release.yml','tests/new-test.mjs',
                     'tests/../src/App.tsx',''):
            with self.subTest(path=path):
                self.assertTrue(scope.app_preview_required([
                    'scripts/ops/anevum-progression-reset-20261021.py',path]))

    def test_empty_input_cannot_skip_preview(self):
        self.assertTrue(scope.app_preview_required([]))

if __name__=='__main__':
    unittest.main()
