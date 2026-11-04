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

    def test_root_readme_only_does_not_require_preview(self):
        self.assertFalse(scope.app_preview_required(["README.md"]))

    def test_readme_plus_runtime_requires_preview(self):
        self.assertTrue(scope.app_preview_required(["README.md", "src/App.tsx"]))

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

    def test_isolated_reviewer_files_use_separate_review_gate(self):
        paths = list(scope.ISOLATED_ORIGINAL_WORKS_REVIEW_PATHS)
        self.assertEqual(len(paths), 6)
        self.assertFalse(scope.app_preview_required(paths))
        self.assertTrue(scope.isolated_review_required(paths))

    def test_review_files_with_maintenance_still_require_review(self):
        paths = ["README.md", "scripts/ops/anevum-maintenance-ci-scope.py",
                 "scripts/ops/original-works-review-worker.mjs"]
        self.assertFalse(scope.app_preview_required(paths))
        self.assertTrue(scope.isolated_review_required(paths))

    def test_any_real_application_change_keeps_legacy_preview_required(self):
        for application_path in ["src/App.tsx", "worker.mjs", "wrangler.jsonc",
                                 "src/data/transcosmic-wiki.ts", "scripts/new-build.mjs"]:
            paths = ["scripts/ops/original-works-review-worker.mjs", application_path]
            with self.subTest(path=application_path):
                self.assertTrue(scope.app_preview_required(paths))
                self.assertTrue(scope.isolated_review_required(paths))

    def test_unknown_reviewer_file_cannot_bypass_preview(self):
        paths = ["scripts/ops/original-works-review-worker.mjs",
                 "scripts/ops/new-review-worker.mjs"]
        self.assertTrue(scope.app_preview_required(paths))
        self.assertTrue(scope.isolated_review_required(paths))

    def test_unrelated_maintenance_does_not_trigger_reviewer_build(self):
        self.assertFalse(scope.isolated_review_required(["README.md"]))
        self.assertFalse(scope.isolated_review_required([]))

    def test_public_studio_has_separate_mandatory_no_deploy_review(self):
        paths = list(scope.ISOLATED_PUBLIC_STUDIO_PATHS)
        self.assertEqual(len(paths), 7)
        self.assertFalse(scope.app_preview_required(paths))
        self.assertTrue(scope.public_studio_required(paths))
        self.assertFalse(scope.isolated_review_required(paths))

    def test_exact_canonical_root_runbook_is_reviewed_but_unreviewed_docs_fail_closed(self):
        approved = "docs/design/ANEVUM.WEB.OPS.2026-11-03.027.CANONICAL-ORIGINAL-WORKS-LAUNCH.md"
        runtime = "apps/anevum-public-studio/worker.mjs"
        self.assertIn(approved, scope.ISOLATED_PUBLIC_STUDIO_PATHS)
        self.assertFalse(scope.app_preview_required([runtime, approved]))
        self.assertTrue(scope.public_studio_required([runtime, approved]))
        self.assertTrue(scope.app_preview_required([
            runtime, "docs/design/ANEVUM.WEB.OPS.2026-11-03.999.UNREVIEWED-RELEASE.md"
        ]))

    def test_unrelated_application_edits_still_require_legacy_preview(self):
        files = ["apps/anevum-public-studio/worker.mjs", "src/App.tsx"]
        self.assertTrue(scope.app_preview_required(files))
        self.assertTrue(scope.public_studio_required(files))

    def test_unknown_new_public_studio_file_cannot_bypass_preview(self):
        files = ["apps/anevum-public-studio/worker.mjs", "apps/anevum-public-studio/auth.mjs"]
        self.assertTrue(scope.app_preview_required(files))
        self.assertTrue(scope.public_studio_required(files))

    def test_maintenance_only_does_not_start_public_studio_build(self):
        self.assertFalse(scope.public_studio_required(["README.md"]))
        self.assertFalse(scope.public_studio_required([]))

    def test_empty_input_cannot_skip_preview(self):
        self.assertTrue(scope.app_preview_required([]))

if __name__=='__main__':
    unittest.main()
