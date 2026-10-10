#!/usr/bin/env python3
"""Restore-test a Cloudflare D1 PREVIEW SQL export without exposing member data.

The ONLY accepted purpose is a two-member staging preview backup. The source
may be sensitive. No row values, identities, SQL text, token or signed URL are
printed, uploaded, or written to the repository. Restoration is in :memory:.

Modes:
  selftest
  verify-sql <private.sql>
  encrypt-sql <private.sql> <private.sql.fernet>
  verify-encrypted <private.sql.fernet>

Encrypted modes require ANEVUM_PREVIEW_BACKUP_FERNET_KEY, a random Fernet key
provided as a GitHub Actions encrypted secret, not a source-controlled value.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
from typing import Any

EXPECTED_LEDGER = [
    "0001_member_platform.sql",
    "0002_member_rhen_drafts.sql",
    "0003_member_billing.sql",
]
MAX_EXPORT_BYTES = 64 * 1024 * 1024


class BackupBlocked(RuntimeError):
    pass


def _require(ok: bool, reason: str) -> None:
    if not ok:
        raise BackupBlocked(reason)


def _deny_unsafe_sql(action: int, arg1: str | None, arg2: str | None,
                     _database: str | None, _origin: str | None) -> int:
    if action in {sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH}:
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_FUNCTION and str(arg2).lower() == "load_extension":
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_PRAGMA and str(arg1).lower() == "writable_schema" and str(arg2).lower() in ("on", "1"):
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK


def verify_restore(raw: bytes) -> dict[str, Any]:
    _require(0 < len(raw) <= MAX_EXPORT_BYTES, "export size outside safe bounds")
    try:
        sql = raw.decode("utf-8-sig", errors="strict")
    except UnicodeDecodeError as exc:
        raise BackupBlocked("export was not UTF-8 SQL") from exc
    db = sqlite3.connect(":memory:")
    try:
        db.set_authorizer(_deny_unsafe_sql)
        try:
            db.executescript(sql)
            db.execute("PRAGMA foreign_keys=ON")
        except sqlite3.Error as exc:
            raise BackupBlocked("independent SQLite restoration failed") from exc
        integrity = db.execute("PRAGMA integrity_check").fetchall()
        _require(integrity == [("ok",)], "restored database integrity failed")
        _require(db.execute("PRAGMA foreign_key_check").fetchall() == [],
                 "restored database foreign keys failed")
        tables = {row[0] for row in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )}
        expected = {"d1_migrations", "user", "member_rhen_workspaces", "member_rhen_drafts"}
        _require(expected <= tables, "required preview tables missing")
        _require(not any(name.startswith("member_alpaca_review_") or
                         name.startswith("commons_v5_") for name in tables),
                 "unexpected reviewer or social schema in preview backup")
        ledger = [row[0] for row in db.execute(
            "SELECT name FROM d1_migrations ORDER BY id"
        )]
        _require(ledger == EXPECTED_LEDGER, "preview migration lineage not exactly 0001-0003")
        members = db.execute('SELECT COUNT(*) FROM "user"').fetchone()[0]
        drafts = db.execute("SELECT COUNT(*) FROM member_rhen_drafts").fetchone()[0]
        workspaces = db.execute("SELECT COUNT(*) FROM member_rhen_workspaces").fetchone()[0]
        _require((members, workspaces, drafts) == (2, 2, 2),
                 "two-member preview counts drifted")
        independent = db.execute(
            'SELECT COUNT(DISTINCT w.user_id) FROM member_rhen_workspaces w '
            'JOIN "user" u ON u.id=w.user_id'
        ).fetchone()[0]
        _require(independent == 2, "two distinct workspace owners not preserved")
        return {
            "status": "RESTORED_AND_VERIFIED_SQLITE_PREVIEW_ONLY",
            "sql_sha256": hashlib.sha256(raw).hexdigest(),
            "sql_length_bytes": len(raw),
            "migration_ledger_count": len(ledger),
            "members": members, "workspaces": workspaces, "drafts": drafts,
            "fk_violations": 0,
            "production_or_provider_affected": False,
        }
    except sqlite3.Error as exc:
        raise BackupBlocked("restored query verification failed") from exc
    finally:
        db.close()


def _read_private(path: str) -> bytes:
    entry = Path(path)
    _require(entry.is_file() and not entry.is_symlink(), "backup path invalid")
    size = entry.stat().st_size
    _require(0 < size <= MAX_EXPORT_BYTES * 2, "backup is missing or oversized")
    return entry.read_bytes()


def _fernet():
    key = os.environ.get("ANEVUM_PREVIEW_BACKUP_FERNET_KEY", "")
    _require(len(key) == 44, "encrypted backup key not available")
    from cryptography.fernet import Fernet
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeError) as exc:
        raise BackupBlocked("encrypted backup key invalid") from exc


def _write_private(path: str, encrypted: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as out:
        out.write(encrypted)


def _fixture() -> bytes:
    # Synthetic IDs and email values only. No export from Cloudflare here.
    return ('''
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "user" (id TEXT PRIMARY KEY, email TEXT);
CREATE TABLE member_rhen_workspaces (
 user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 workspace_id TEXT UNIQUE NOT NULL);
CREATE TABLE member_rhen_drafts (
 id INTEGER PRIMARY KEY, user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE);
CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE);
INSERT INTO "user" VALUES('fixture-a','a@example.invalid');
INSERT INTO "user" VALUES('fixture-b','b@example.invalid');
INSERT INTO member_rhen_workspaces VALUES('fixture-a','wrk_fixture_a');
INSERT INTO member_rhen_workspaces VALUES('fixture-b','wrk_fixture_b');
INSERT INTO member_rhen_drafts(user_id) VALUES('fixture-a');
INSERT INTO member_rhen_drafts(user_id) VALUES('fixture-b');
INSERT INTO d1_migrations VALUES(1,'0001_member_platform.sql');
INSERT INTO d1_migrations VALUES(2,'0002_member_rhen_drafts.sql');
INSERT INTO d1_migrations VALUES(3,'0003_member_billing.sql');
COMMIT;
''').encode("utf-8")


def _selftest() -> None:
    good = _fixture()
    result = verify_restore(good)
    _require(result["members"] == 2, "valid fixture rejected")
    for tampered in [
        good.replace(b"0003_member_billing.sql", b"0004_member_rhen_workspaces.sql"),
        good.replace(b"VALUES('fixture-b','wrk_fixture_b')", b"VALUES('fixture-a','wrk_fixture_b')"),
        good.replace(b"INSERT INTO member_rhen_drafts(user_id) VALUES('fixture-b');", b""),
        good + b"ATTACH DATABASE '/tmp/never-create-file.sqlite' AS secondary;",
    ]:
        try:
            verify_restore(tampered)
        except BackupBlocked:
            continue
        raise BackupBlocked("negative selftest accepted invalid backup")
    print("PASS: synthetic preview SQL restore and negative safety cases")


def main(argv: list[str]) -> None:
    if argv == ["selftest"]:
        _selftest()
        return
    if len(argv) == 2 and argv[0] == "verify-sql":
        print(json.dumps(verify_restore(_read_private(argv[1])), sort_keys=True))
        return
    if len(argv) == 3 and argv[0] == "encrypt-sql":
        raw = _read_private(argv[1])
        report = verify_restore(raw)
        fernet = _fernet()
        sealed = fernet.encrypt(raw)
        _require(fernet.decrypt(sealed) == raw, "backup encryption round trip failed")
        _write_private(argv[2], sealed)
        print(json.dumps({"status": "ENCRYPTED_BACKUP_VERIFIED",
                          "sql_sha256": report["sql_sha256"],
                          "encrypted_length_bytes": len(sealed)}, sort_keys=True))
        return
    if len(argv) == 2 and argv[0] == "verify-encrypted":
        raw = _fernet().decrypt(_read_private(argv[1]))
        result = verify_restore(raw)
        result["status"] = "ENCRYPTED_ARCHIVE_RESTORED_AND_VERIFIED_SQLITE_PREVIEW_ONLY"
        print(json.dumps(result, sort_keys=True))
        return
    raise BackupBlocked("unsupported backup verification mode")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except Exception:
        # SQL, tokens and account content must never appear in CI tracebacks.
        print("PREVIEW_BACKUP_BLOCKED: backup validation or restore failed", file=sys.stderr)
        sys.exit(2)
