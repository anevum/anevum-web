#!/usr/bin/env python3
"""One-purpose, reversible Cloudflare Access path cutover for ANEVUM Command.

Run only in the separately scoped GitHub Action, with a Cloudflare Access
edit-capable token.  Never alters policies, Access identity, or RHEN runtime.
The public member page is /command; protected operator paths stay private.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

APP_ID = "ea5ecc36-b828-4030-aaf7-c2a7799f6085"
AUD = "3fabe3c703b4cc972136d2292fda39783c11903c3c6cf5ac0e42c4738f2ee800"
AUTH_DOMAIN = "wispy-tooth-095a.cloudflareaccess.com"
OWNER_EMAIL = "devon@anevum.com"
APP_NAME = "ANEVUM Command"
LEGACY = frozenset(("anevum.com/command*", "anevum.com/api/command*"))
SCOPED = frozenset(("anevum.com/command/rhen*", "anevum.com/api/command*"))


def destination_mode(uris):
    uris = frozenset(uris)
    if uris == LEGACY:
        return "legacy"
    if uris == SCOPED:
        return "member"
    raise ValueError("Unexpected Access destination scope; refusing modification.")


def safe_policy_check(app, policies, organization):
    if app.get("id") != APP_ID or app.get("aud") != AUD or app.get("name") != APP_NAME:
        raise ValueError("Identity of owner-only Command Access application changed.")
    if app.get("type") != "self_hosted":
        raise ValueError("Command Access application type changed.")
    if organization.get("auth_domain") != AUTH_DOMAIN:
        raise ValueError("Unexpected Cloudflare Access identity domain.")
    if not policies:
        raise ValueError("Access allow policy inventory is empty.")
    allow_count = 0
    for policy in policies:
        if policy.get("decision") not in ("allow", "deny"):
            raise ValueError("Command Access must not have bypass/service-auth policies.")
        if policy.get("decision") == "allow":
            allow_count += 1
            if policy.get("include") != [{"email": {"email": OWNER_EMAIL}}]:
                raise ValueError("Command Access allow policy is no longer owner-only.")
    if allow_count < 1:
        raise ValueError("No owner allow policy exists.")
    if any(x.get("overrides") for x in app.get("destinations", [])):
        raise ValueError("Path overrides could bypass Command Access.")
    return destination_mode(x.get("uri") for x in app.get("destinations", []))


# Writable self-hosted Access application properties accepted by the PUT API.
# GET also returns IDs, AUD, timestamps and deprecated self_hosted_domains:
# these are NOT sent back to Cloudflare. Policies are maintained separately.
APP_WRITE_FIELDS = frozenset((
    "type", "name", "allow_iframe", "allow_authenticate_via_warp",
    "allowed_idps", "app_launcher_visible", "auto_redirect_to_identity",
    "cors_headers", "custom_deny_message", "custom_deny_url",
    "custom_non_identity_deny_url", "custom_pages", "session_duration",
    "http_only_cookie_attribute", "same_site_cookie_attribute",
    "read_service_tokens_from_header", "service_auth_401_redirect",
    "skip_interstitial", "options_preflight_bypass", "path_cookie_attribute",
    "access_token_lifetime", "logo_url", "app_launcher_logo_url", "bg_color",
    "footer_links", "tags", "enable_binding_cookie", "enable_clientless_access",
    "http_only_cookie_attribute", "same_site_cookie_attribute",
))


def access_update_payload(original, mode):
    """Send only documented writable fields, retaining the old auth settings.

    All authorization, identity, session and cookie fields supplied by GET are
    copied through when present. The HTTP response must keep the other fields.
    """
    if mode not in ("legacy", "member"):
        raise ValueError("Refusing an unknown Access cutover mode.")
    if original.get("type") != "self_hosted" or original.get("name") != APP_NAME:
        raise ValueError("Refusing change to unexpected Access application.")
    result = {key: value for key, value in original.items()
              if key in APP_WRITE_FIELDS and value is not None}
    result["domain"] = "anevum.com/command/rhen*" if mode == "member" else original.get("domain", "anevum.com/command*")
    result["destinations"] = [
        {"type": "public", "uri": uri}
        for uri in sorted(SCOPED if mode == "member" else LEGACY)
    ]
    return result


def ensure_unchanged_auth_settings(before, after):
    # Any preexisting security setting that changes (including policies and AUD)
    # blocks the cutover and causes an attempt to restore the original scope.
    fields = APP_WRITE_FIELDS | frozenset(("id", "aud", "policies"))
    for field in fields:
        if before.get(field) != after.get(field):
            raise RuntimeError("Access application attribute unexpectedly changed: " + field)


def request_json(account, token, path, method="GET", body=None):
    url = "https://api.cloudflare.com/client/v4/accounts/" + account + path
    raw = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Authorization": "Bearer " + token, "Accept": "application/json"}
    if raw is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, method=method, headers=headers, data=raw)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("Cloudflare Access API HTTP " + str(exc.code)) from None
    if result.get("success") is not True:
        raise RuntimeError("Cloudflare Access API rejected the requested operation.")
    return result["result"]


def read_app(account, token):
    app = request_json(account, token, "/access/apps/" + APP_ID)
    policies = request_json(account, token, "/access/apps/" + APP_ID + "/policies")
    org = request_json(account, token, "/access/organizations")
    return app, policies, org


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def probe(path):
    req = urllib.request.Request("https://anevum.com" + path,
                                 headers={"Accept": "text/html,application/json", "User-Agent": "ANEVUM-Access-Cutover/1"})
    try:
        with OPENER.open(req, timeout=20) as response:
            return response.status, response.headers
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers


def verify_live(mode, max_wait=75):
    checks = (
        ("/command", (200,) if mode == "member" else (302, 303)),
        ("/command/operate", (308,) if mode == "member" else (302, 303)),
        ("/command/rhen", (302, 303)),
        ("/command/rhen/operate", (302, 303)),
        ("/api/command/session", (302, 303, 401, 403)),
        ("/api/command/trader/status", (302, 303, 401, 403)),
        ("/api/command/trader/orders/cancel", (302, 303, 401, 403)),
        ("/api/command/unknown", (302, 303, 401, 403)),
        ("/me", (200,)),
    )
    deadline = time.monotonic() + max_wait
    while True:
        failures = []
        for path, statuses in checks:
            try:
                status, headers = probe(path)
            except Exception:
                failures.append((path, "network"))
                continue
            if status not in statuses:
                failures.append((path, status))
                continue
            location = headers.get("Location", "")
            host = urllib.parse.urlparse(location).hostname
            if status in (302, 303) and host != AUTH_DOMAIN:
                failures.append((path, "invalid Access redirect"))
            if path == "/command/operate" and mode == "member" and status == 308:
                destination = urllib.parse.urlparse(location)
                if destination.hostname != "anevum.com" or destination.path != "/command/rhen/operate":
                    failures.append((path, "unexpected legacy redirect"))
            if path == "/command" and mode == "member" and status == 200:
                if "noindex" not in headers.get("X-Robots-Tag", "").lower():
                    failures.append((path, "member Command not noindex"))
                if "no-store" not in headers.get("Cache-Control", "").lower():
                    failures.append((path, "member Command not private"))
        if not failures:
            print("ACCESS_LIVE_PROBES=PASS mode=" + mode)
            return True
        if time.monotonic() >= deadline:
            print("ACCESS_LIVE_PROBES=FAIL mode=" + mode + " checks=" + str(failures))
            return False
        time.sleep(5)


def main():
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    token = os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN", "").strip()
    if not account or not token:
        raise ValueError("Missing Access-scoped GitHub Secrets.")
    app, policies, org = read_app(account, token)
    mode = safe_policy_check(app, policies, org)
    print("ACCESS_BEFORE=" + mode)
    if mode == "member":
        if not verify_live("member", 30):
            raise RuntimeError("Member Command Access routes are not live-verified.")
        return

    # The website must be upgraded first: /me works and /command still has Access.
    if not verify_live("legacy", 30):
        raise RuntimeError("Production Access baseline is not healthy; refusing cutover.")

    # PUT is the documented Access application update method. Preserve all GET
    # attributes to avoid resetting session/cookie/IdP/security settings.
    update = access_update_payload(app, "member")
    changed = False
    try:
        updated = request_json(account, token, "/access/apps/" + APP_ID, method="PUT", body=update)
        changed = True
        ensure_unchanged_auth_settings(app, updated)
        if destination_mode(x.get("uri") for x in updated.get("destinations", [])) != "member":
            raise RuntimeError("Cloudflare did not return the expected scoped destinations.")
        current, policies_now, org_now = read_app(account, token)
        if safe_policy_check(current, policies_now, org_now) != "member":
            raise RuntimeError("Owner-only Access invariants changed during cutover.")
        ensure_unchanged_auth_settings(app, current)
        if not verify_live("member"):
            raise RuntimeError("Scoped Access behavior is not live-verified.")
        print("COMMAND_ACCESS_CUTOVER=PASS owner-only RHEN protected, member Command reachable")
    except Exception:
        if changed:
            # Fail closed: recover the original route coverage before exiting.
            rollback = access_update_payload(app, "legacy")
            try:
                request_json(account, token, "/access/apps/" + APP_ID, method="PUT", body=rollback)
                restored, restored_policies, restored_org = read_app(account, token)
                if safe_policy_check(restored, restored_policies, restored_org) == "legacy":
                    verify_live("legacy", 30)
                    print("COMMAND_ACCESS_CUTOVER=ROLLED_BACK_TO_LEGACY")
                else:
                    print("COMMAND_ACCESS_ROLLBACK=NOT_VERIFIED")
            except Exception:
                print("COMMAND_ACCESS_ROLLBACK=FAILED_REQUIRES_IMMEDIATE_OPERATOR_REVIEW")
        raise


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # No secret values, raw Access tokens or application policy JSON in logs.
        print("COMMAND_ACCESS_CUTOVER=FAIL " + str(exc))
        sys.exit(1)
