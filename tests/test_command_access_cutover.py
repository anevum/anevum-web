"""Offline regression checks for the exact Cloudflare Access cutover boundaries."""
import importlib.util
import pathlib
import unittest

MODULE = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "command-access-cutover.py"
SPEC = importlib.util.spec_from_file_location("command_access_cutover", MODULE)
cutover = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cutover)


class CommandAccessCutoverTests(unittest.TestCase):
    def fixture(self, paths):
        app = {
            "id": cutover.APP_ID,
            "aud": cutover.AUD,
            "name": cutover.APP_NAME,
            "type": "self_hosted",
            "destinations": [{"type": "public", "uri": path} for path in paths]
        }
        policy = [{"decision": "allow", "include": [{"email": {"email": cutover.OWNER_EMAIL}}]}]
        org = {"auth_domain": cutover.AUTH_DOMAIN}
        return app, policy, org

    def test_legacy_and_member_scopes_are_both_explicit(self):
        self.assertEqual(cutover.destination_mode(cutover.LEGACY), "legacy")
        self.assertEqual(cutover.destination_mode(cutover.SCOPED), "member")
        self.assertIn("anevum.com/command/rhen*", cutover.SCOPED)
        self.assertIn("anevum.com/api/command*", cutover.SCOPED)
        self.assertNotIn("anevum.com/command*", cutover.SCOPED)
        for paths in (cutover.LEGACY, cutover.SCOPED):
            self.assertIn(cutover.safe_policy_check(*self.fixture(paths)), ("legacy", "member"))

    def test_put_preserves_all_existing_app_settings_except_destinations(self):
        app, policies, org = self.fixture(cutover.LEGACY)
        app["allowed_idps"] = ["identity-provider"]
        app["session_duration"] = "24h"
        app["http_only_cookie_attribute"] = True
        app["same_site_cookie_attribute"] = "strict"
        original = dict(app)
        update = cutover.access_update_payload(app, "member")
        self.assertEqual(app, original)
        self.assertEqual(cutover.destination_mode(d["uri"] for d in update["destinations"]), "member")
        self.assertEqual(update["domain"], "anevum.com/command/rhen")
        for key in ["id", "aud", "type", "name", "allowed_idps", "session_duration", "http_only_cookie_attribute", "same_site_cookie_attribute"]:
            self.assertEqual(update[key], original[key])
        cutover.ensure_unchanged_auth_settings(original, update)
        drifted = dict(update)
        drifted["session_duration"] = "10m"
        with self.assertRaises(RuntimeError):
            cutover.ensure_unchanged_auth_settings(original, drifted)

    def test_disallows_drifted_scope_and_lost_operator_api(self):
        for paths in (
            {"anevum.com/command"},
            {"anevum.com/api/command*"},
            {"anevum.com/command/rhen*"},
            {"anevum.com/command*", "anevum.com/command/rhen*"},
            {"anevum.com/*", "anevum.com/api/command*"}
        ):
            with self.assertRaises(ValueError):
                cutover.safe_policy_check(*self.fixture(paths))

    def test_requires_exact_owner_and_policy(self):
        app, policies, org = self.fixture(cutover.LEGACY)
        policies[0]["include"] = [{"email": {"email": "stranger@example.net"}}]
        with self.assertRaises(ValueError):
            cutover.safe_policy_check(app, policies, org)
        app, policies, org = self.fixture(cutover.SCOPED)
        policies.append({"decision": "bypass"})
        with self.assertRaises(ValueError):
            cutover.safe_policy_check(app, policies, org)
        app, policies, org = self.fixture(cutover.LEGACY)
        app["destinations"][0]["overrides"] = [{"behavior": "public", "path_pattern": "*"}]
        with self.assertRaises(ValueError):
            cutover.safe_policy_check(app, policies, org)

    def test_rejects_unexpected_access_application_identity(self):
        app, policies, org = self.fixture(cutover.LEGACY)
        app["aud"] = "incorrect"
        with self.assertRaises(ValueError):
            cutover.safe_policy_check(app, policies, org)


if __name__ == "__main__":
    unittest.main()
