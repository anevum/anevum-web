#!/usr/bin/env python3
"""Manual, disposable Cloudflare D1 restore proof for encrypted PREVIEW backup.

No production/preview writes. No Worker binding. Never print SQL, IDs, emails,
API responses, signed upload URL or secrets. Restored private data lives only
in a fresh, unbound D1 database until verified deletion.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PRODUCTION = "7f0d4c0c-2e85-4900-8504-1347954e1df1"
PREVIEW = "a537432e-d216-4b31-8b22-19662cc3a44a"
EXPECTED_LEDGER = [
    "0001_member_platform.sql", "0002_member_rhen_drafts.sql",
    "0003_member_billing.sql", "0004_member_rhen_workspaces.sql",
    "0005_member_alpaca_review.sql",
]
RUN_RE = re.compile(r"^[0-9]{9,12}$")
UUID_RE = re.compile(r"^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$")
ACCOUNT_RE = re.compile(r"^[a-f0-9]{32}$")
SOURCE_DIR = Path(__file__).resolve().parent
API_BASE = "https://api.cloudflare.com/client/v4"
MAX_SQL_BYTES = 64 * 1024 * 1024


class RestoreBlocked(RuntimeError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RestoreBlocked(message)


def target_name(run_id: str) -> str:
    require(bool(RUN_RE.fullmatch(run_id)), "Invalid GitHub run identity.")
    return "anevum-v5-restore-" + run_id


def verify_target(name: str, db_uuid: str, run_id: str) -> None:
    require(name == target_name(run_id), "Disposable database name mismatched.")
    require(bool(UUID_RE.fullmatch(db_uuid)), "Disposable database UUID malformed.")
    require(db_uuid not in (PRODUCTION, PREVIEW),
            "Protected member database cannot be a restore target.")


def verified_upload_url(value: str) -> str:
    try:
        parsed = urllib.parse.urlsplit(value)
    except (TypeError, ValueError):
        raise RestoreBlocked("Import signed URL invalid.") from None
    host = (parsed.hostname or "").lower()
    require(parsed.scheme == "https" and host.endswith(".r2.cloudflarestorage.com")
            and not parsed.username and not parsed.password and not parsed.fragment
            and not parsed.port and bool(parsed.path) and len(value) <= 4096,
            "Import URL is not a verified private R2 upload destination.")
    return value


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        return None


def open_request(req: urllib.request.Request):
    return urllib.request.build_opener(NoRedirect()).open(req, timeout=30)


def api(method: str, account: str, token: str, resource: str,
        payload: dict | None = None, *, missing_ok: bool = False):
    require(bool(ACCOUNT_RE.fullmatch(account)), "Cloudflare account scope invalid.")
    require(resource.startswith("/d1/database") and not any(
        item in resource for item in ["..", "?", "#", "//"]),
        "API resource must be an exact D1 path.")
    endpoint = API_BASE + "/accounts/" + account + resource
    data = None if payload is None else json.dumps(payload, separators=(",", ":")).encode()
    req = urllib.request.Request(endpoint, method=method, data=data,
                                 headers={"Authorization": "Bearer " + token,
                                          "Accept": "application/json",
                                          "Content-Type": "application/json"})
    try:
        with open_request(req) as result:
            require(result.status in (200, 201, 202, 204), "D1 operation rejected.")
            body = result.read(1_000_000)
    except urllib.error.HTTPError as exc:
        if missing_ok and exc.code == 404:
            return None
        raise RestoreBlocked("D1 API rejected scoped operation (HTTP " + str(exc.code) + ").") from None
    except (urllib.error.URLError, TimeoutError):
        raise RestoreBlocked("D1 provider request unavailable.") from None
    if not body:
        require(method == "DELETE", "D1 API returned an empty response.")
        return {"success": True, "result": {}}
    try:
        obj = json.loads(body)
    except (ValueError, UnicodeError):
        raise RestoreBlocked("D1 API response invalid.") from None
    require(isinstance(obj, dict) and obj.get("success") is True,
            "D1 API did not confirm success.")
    return obj


def database_resource(db_uuid: str) -> str:
    require(bool(UUID_RE.fullmatch(db_uuid)), "Invalid database UUID.")
    require(db_uuid not in (PRODUCTION, PREVIEW), "Protected member database denied.")
    return "/d1/database/" + db_uuid


def marker_path() -> Path:
    directory = Path(os.environ.get("RUNNER_TEMP", ""))
    require(directory.is_absolute() and directory.is_dir(),
            "Disposable restore marker requires an isolated runner directory.")
    return directory / "v5-disposable-restore-target.json"


def create_marker(path: Path, *, db_name: str, db_uuid: str, run_id: str) -> None:
    verify_target(db_name, db_uuid, run_id)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as output:
        json.dump({"database_name": db_name, "database_uuid": db_uuid,
                   "run_id": run_id}, output)


def read_marker(path: Path, run_id: str) -> tuple[str, str]:
    require(path.is_file() and not path.is_symlink(), "No owned restore marker found.")
    stat = path.stat()
    require(stat.st_size <= 1024, "Restore marker oversized.")
    try:
        row = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, UnicodeError):
        raise RestoreBlocked("Restore marker invalid.") from None
    require(isinstance(row, dict) and set(row) ==
            {"database_name", "database_uuid", "run_id"} and row["run_id"] == run_id,
            "Restore marker is not bound to this run.")
    name, db_uuid = row["database_name"], row["database_uuid"]
    require(isinstance(name, str) and isinstance(db_uuid, str),
            "Restore marker fields invalid.")
    verify_target(name, db_uuid, run_id)
    return name, db_uuid


def account_env() -> tuple[str, str]:
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").lower()
    token = os.environ.get("CLOUDFLARE_D1_TOKEN", "")
    require(bool(ACCOUNT_RE.fullmatch(account)) and len(token) >= 20,
            "Scoped D1 credentials unavailable.")
    return account, token


def ensure_dispatch(run_id: str) -> None:
    require(os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch" and
            os.environ.get("GITHUB_REF") == "refs/heads/main" and
            bool(re.fullmatch(r"[a-f0-9]{40}", os.environ.get("GITHUB_SHA", ""))) and
            os.environ.get("RESTORE_REVIEWED_SHA") == os.environ.get("GITHUB_SHA") and
            os.environ.get("RESTORE_CONFIRMATION") == "RESTORE_DISPOSABLE_D1_ONLY" and
            os.environ.get("RESTORE_DATA_APPROVAL") ==
            "I_AUTHORIZE_PREVIEW_DATA_IN_DISPOSABLE_D1" and
            os.environ.get("RESTORE_CLEANUP_APPROVAL") ==
            "DELETE_ONLY_CREATED_DISPOSABLE",
            "Manual restore release authorization unavailable.")
    target_name(run_id)


def decrypted_sql(archive: Path) -> tuple[bytes, dict]:
    require(archive.is_file() and not archive.is_symlink(), "Encrypted backup missing.")
    require(0 < archive.stat().st_size < 2 * MAX_SQL_BYTES,
            "Encrypted backup size outside review limits.")
    from cryptography.fernet import Fernet, InvalidToken
    key = os.environ.get("ANEVUM_PREVIEW_BACKUP_FERNET_KEY", "")
    require(len(key) == 44, "Encrypted recovery key unavailable.")
    try:
        raw = Fernet(key.encode("ascii")).decrypt(archive.read_bytes())
    except (InvalidToken, ValueError, UnicodeError):
        raise RestoreBlocked("Encrypted backup could not be verified.") from None
    require(0 < len(raw) <= MAX_SQL_BYTES, "Decoded backup outside size bound.")
    source = SOURCE_DIR / "verify-v5-preview-export-backup.py"
    spec = importlib.util.spec_from_file_location("v5_preview_backup_verifier", source)
    require(spec is not None and spec.loader is not None, "Preview verifier missing.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    try:
        report = module.verify_restore(raw)
    except Exception:
        raise RestoreBlocked("Private backup did not pass independent SQLite restore.") from None
    require(report.get("migration_ledger_count") == 5 and
            report.get("members") == 2 and report.get("workspaces") == 2 and
            report.get("drafts") == 2 and report.get("fk_violations") == 0 and
            report.get("sql_sha256") == hashlib.sha256(raw).hexdigest(),
            "Backup is not the reviewed two-member 0005 preview checkpoint.")
    return raw, report


def upload_sql(signed_url: str, sql: bytes, expected_etag: str) -> None:
    url = verified_upload_url(signed_url)
    req = urllib.request.Request(url, data=sql, method="PUT")
    try:
        with open_request(req) as r:
            require(r.status in (200, 201, 204), "R2 temporary import upload failed.")
            etag = (r.headers.get("ETag") or "").strip('"')
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        raise RestoreBlocked("R2 temporary import upload unavailable.") from None
    require(etag.lower() == expected_etag, "R2 upload checksum did not match SQL.")


def import_sql(account: str, token: str, db_uuid: str, sql: bytes) -> None:
    path = database_resource(db_uuid) + "/import"
    etag = hashlib.md5(sql, usedforsecurity=False).hexdigest()
    init = api("POST", account, token, path, {"action": "init", "etag": etag})
    result = init.get("result")
    require(isinstance(result, dict), "D1 import initialization incomplete.")
    filename = result.get("filename")
    require(isinstance(filename, str) and len(filename) <= 128 and
            bool(re.fullmatch(r"[a-zA-Z0-9._-]+\.sql", filename)) and
            filename != "." and ".." not in filename,
            "D1 import filename not trusted.")
    upload_url = result.get("upload_url")
    require(isinstance(upload_url, str), "D1 import did not supply private upload URL.")
    upload_sql(upload_url, sql, etag)
    ingest = api("POST", account, token, path,
                 {"action": "ingest", "etag": etag, "filename": filename})
    current = ingest.get("result")
    require(isinstance(current, dict), "D1 import ingest acknowledgment invalid.")
    for _ in range(40):
        state = current.get("status")
        if state == "complete":
            return
        require(state == "active", "D1 import did not finish successfully.")
        bookmark = current.get("at_bookmark")
        require(isinstance(bookmark, str) and 0 < len(bookmark) < 256,
                "D1 import progress bookmark missing.")
        time.sleep(2)
        polled = api("POST", account, token, path,
                     {"action": "poll", "current_bookmark": bookmark})
        current = polled.get("result")
        require(isinstance(current, dict), "D1 import progress response invalid.")
    raise RestoreBlocked("D1 disposable restore exceeded the bounded polling window.")


def query(account: str, token: str, db_uuid: str, sql: str) -> list[dict]:
    packet = api("POST", account, token, database_resource(db_uuid) + "/query",
                 {"sql": sql})
    result = packet.get("result")
    require(isinstance(result, list) and len(result) == 1 and
            isinstance(result[0], dict) and result[0].get("success") is True and
            isinstance(result[0].get("results"), list),
            "D1 verification query failed.")
    rows = result[0]["results"]
    require(len(rows) <= 50 and all(isinstance(row, dict) for row in rows),
            "D1 verification returned unexpected row shape.")
    return rows


def verify_remote(perform_query) -> None:
    counters = [
        ('SELECT COUNT(*) AS n FROM "user"', 2),
        ("SELECT COUNT(*) AS n FROM member_rhen_workspaces", 2),
        ("SELECT COUNT(*) AS n FROM member_rhen_drafts", 2),
        ("SELECT COUNT(DISTINCT user_id) AS n FROM member_rhen_workspaces", 2),
    ]
    for statement, expected in counters:
        rows = perform_query(statement)
        require(isinstance(rows, list) and len(rows) == 1 and
                rows[0].get("n") == expected,
                "Remote restored member/workspace counts did not match encrypted backup.")
    ledger = perform_query("SELECT name FROM d1_migrations ORDER BY id")
    require(isinstance(ledger, list) and
            [row.get("name") for row in ledger] == EXPECTED_LEDGER,
            "Remote D1 migration lineage mismatch.")
    require(perform_query("PRAGMA foreign_key_check") == [],
            "Remote D1 foreign keys failed.")
    require(perform_query("PRAGMA integrity_check") == [{"integrity_check": "ok"}],
            "Remote D1 integrity check failed.")


def cleanup(account: str, token: str, run_id: str, marker: Path) -> None:
    if not marker.exists():
        return
    name, db_uuid = read_marker(marker, run_id)
    resource = database_resource(db_uuid)
    current = api("GET", account, token, resource, missing_ok=True)
    if current is not None:
        record = current.get("result")
        require(isinstance(record, dict) and record.get("uuid") == db_uuid and
                record.get("name") == name,
                "Cleanup denied: database does not match fresh disposable marker.")
        api("DELETE", account, token, resource)
    require(api("GET", account, token, resource, missing_ok=True) is None,
            "Cloudflare has not confirmed disposable deletion.")
    marker.unlink()


def restore(archive_path: str) -> None:
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    ensure_dispatch(run_id)
    account, token = account_env()
    marker = marker_path()
    require(not marker.exists(), "A disposable restore target already exists for this run.")
    sql, expected = decrypted_sql(Path(archive_path))
    name = target_name(run_id)
    failure: Exception | None = None
    cleanup_failed = False
    try:
        created = api("POST", account, token, "/d1/database", {"name": name})
        record = created.get("result")
        require(isinstance(record, dict), "New D1 database creation was not confirmed.")
        db_uuid = record.get("uuid")
        require(isinstance(db_uuid, str) and record.get("name") == name,
                "New D1 did not return the exact disposable name.")
        verify_target(name, db_uuid, run_id)
        create_marker(marker, db_name=name, db_uuid=db_uuid, run_id=run_id)
        import_sql(account, token, db_uuid, sql)
        verify_remote(lambda statement: query(account, token, db_uuid, statement))
        require(expected["members"] == 2 and expected["workspaces"] == 2 and
                expected["drafts"] == 2,
                "Expected archived member counts changed.")
    except Exception as exc:
        failure = exc
    finally:
        try:
            cleanup(account, token, run_id, marker)
        except Exception:
            cleanup_failed = True
    if cleanup_failed:
        raise RestoreBlocked(
            "DISPOSABLE CLEANUP NOT VERIFIED. Inspect exact restore run in Cloudflare and "
            "perform supervised cleanup; active member databases were not targets."
        )
    if failure is not None:
        raise RestoreBlocked("Disposable cloud D1 restore or verification failed.") from None
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as out:
            out.write(
                "\n## ANEVUM V5: disposable Cloudflare D1 restoration\n\n"
                "PASS: encrypted preview archive independently verified and privately imported "
                "into a newly created, unbound Cloudflare D1 target.\n"
                "PASS: separate two-member counts, ownership, schema lineage, integrity and "
                "foreign keys verified remotely.\n"
                "PASS: disposable D1 target deleted and absence verified.\n"
                "Production and preview databases unchanged. No plaintext SQL artifact "
                "or credential data published.\n"
            )
    print("PASS: private archive restored and verified in fresh Cloudflare D1; "
          "disposable target deleted and absence verified.")


def cleanup_only() -> None:
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    target_name(run_id)
    account, token = account_env()
    cleanup(account, token, run_id, marker_path())
    print("PASS: no disposable D1 target remains for this run.")


def selftest() -> None:
    run_id = "38144710001"
    name = target_name(run_id)
    good = "f2a13f26-09b9-4a47-9405-22c3dd4faee1"
    verify_target(name, good, run_id)
    for invalid in (PRODUCTION, PREVIEW, "not-a-uuid"):
        try:
            verify_target(name, invalid, run_id)
        except RestoreBlocked:
            pass
        else:
            raise RestoreBlocked("Protected or malformed target accepted.")
    for wrong in ("https://anevum.com/backup.sql",
                  "http://a.r2.cloudflarestorage.com/signed",
                  "https://attacker.r2.cloudflarestorage.com.evil.test/signed"):
        try:
            verified_upload_url(wrong)
        except RestoreBlocked:
            pass
        else:
            raise RestoreBlocked("Unsafe import URL accepted.")
    verified_upload_url("https://example.r2.cloudflarestorage.com/test.sql?key=private")
    rows = {
        'SELECT COUNT(*) AS n FROM "user"': [{"n": 2}],
        "SELECT COUNT(*) AS n FROM member_rhen_workspaces": [{"n": 2}],
        "SELECT COUNT(*) AS n FROM member_rhen_drafts": [{"n": 2}],
        "SELECT COUNT(DISTINCT user_id) AS n FROM member_rhen_workspaces": [{"n": 2}],
        "SELECT name FROM d1_migrations ORDER BY id":
            [{"name": name} for name in EXPECTED_LEDGER],
        "PRAGMA foreign_key_check": [],
        "PRAGMA integrity_check": [{"integrity_check": "ok"}],
    }
    verify_remote(lambda statement: rows[statement])
    for name, replacement in [
        ('SELECT COUNT(*) AS n FROM "user"', [{"n": 1}]),
        ("PRAGMA foreign_key_check", [{"table": "user"}]),
        ("SELECT name FROM d1_migrations ORDER BY id",
         [{"name": "0006_unapproved.sql"}]),
    ]:
        changed = {**rows, name: replacement}
        try:
            verify_remote(lambda statement: changed[statement])
        except RestoreBlocked:
            pass
        else:
            raise RestoreBlocked("Invalid remote restore evidence accepted.")
    print("PASS: disposable-only target validation, import URL and negative recovery checks.")


def main(args: list[str]) -> None:
    if args == ["selftest"]:
        selftest()
    elif len(args) == 2 and args[0] == "restore":
        restore(args[1])
    elif args == ["cleanup"]:
        cleanup_only()
    else:
        raise RestoreBlocked("Unsupported disposable D1 operation.")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except Exception:
        # Never echo provider messages, signed URLs, query data or personal data.
        print("DISPOSABLE_D1_RESTORE_BLOCKED: review run authorization, "
              "Cloudflare scope, and cleanup status.", file=sys.stderr)
        sys.exit(2)
