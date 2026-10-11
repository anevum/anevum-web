#!/usr/bin/env python3
"""Verify private production recovery without printing SQL or member identities.

Run only after explicit private-production-recovery authorization. Private SQL
is restored in memory, encrypted, and never uploaded as plaintext. selftest uses
synthetic accounts and does not contact a provider.
"""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
BASE = ["0001_member_platform.sql", "0002_member_rhen_drafts.sql"]
STUDIO = "0008_studio_editorial.sql"
MAX_BYTES = 64 * 1024 * 1024
REQUIRED = {"user", "session", "account", "verification", "rateLimit",
            "member_profiles", "member_saved_apps", "member_project_follows",
            "member_entitlements", "member_rhen_drafts", "d1_migrations"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def authorize_sql(action, arg1, arg2, _db, _source):
    forbidden = action in (sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH)
    forbidden |= action == sqlite3.SQLITE_FUNCTION and str(arg2).lower() == "load_extension"
    forbidden |= action == sqlite3.SQLITE_PRAGMA and str(arg1).lower() == "writable_schema"
    return sqlite3.SQLITE_DENY if forbidden else sqlite3.SQLITE_OK


def verify(raw):
    require(0 < len(raw) <= MAX_BYTES, "Invalid export size.")
    db = sqlite3.connect(":memory:")
    try:
        db.set_authorizer(authorize_sql)
        db.executescript(raw.decode("utf-8-sig"))
        db.execute("PRAGMA foreign_keys=ON")
        require(db.execute("PRAGMA integrity_check").fetchall() == [("ok",)], "Integrity failed.")
        require(db.execute("PRAGMA foreign_key_check").fetchall() == [], "Foreign keys failed.")
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        require(REQUIRED <= tables, "Core production schema missing.")
        ledger = [r[0] for r in db.execute("SELECT name FROM d1_migrations ORDER BY id")]
        require(ledger in (BASE, BASE + [STUDIO]), "Production lineage changed.")
        require(not any(n.startswith(("commons_v5_", "member_alpaca_review_")) or
                        n == "member_rhen_workspaces" for n in tables), "Unexpected pilot schema.")
        studio = {n for n in tables if n.startswith("studio_")}
        require(studio == ({"studio_entries", "studio_entry_events"} if STUDIO in ledger else set()),
                "Studio schema and ledger disagree.")
        owner = db.execute('SELECT id FROM "user" WHERE lower(email)=? AND emailVerified=1',
                           ("anevum.studio@gmail.com",)).fetchall()
        require(len(owner) == 1, "Verified Studio owner missing or ambiguous.")
        # Hash every existing row before/after rehearsal, including private auth
        # tokens. Hashes are compared in memory and are never logged or retained.
        def rows():
            return {table: sorted(repr(r) for r in db.execute('SELECT * FROM "' + table + '"'))
                    for table in REQUIRED}
        before = rows()
        db.executescript((ROOT / "migrations-studio" / STUDIO).read_text())
        require(before == rows(), "Migration changed existing member records.")
        require(db.execute("PRAGMA foreign_key_check").fetchall() == [], "Rehearsed foreign keys failed.")
        require(db.execute("PRAGMA integrity_check").fetchall() == [("ok",)], "Rehearsed integrity failed.")
        return {"status": "PRODUCTION_SQLITE_RECOVERY_AND_STUDIO_REHEARSAL_VERIFIED",
                "sql_sha256": hashlib.sha256(raw).hexdigest(), "export_bytes": len(raw),
                "migration_ledger": ledger, "foreign_key_violations": 0,
                "existing_records_preserved": True}
    finally:
        db.close()


def fernet():
    from cryptography.fernet import Fernet
    return Fernet(os.environ["ANEVUM_PRODUCTION_BACKUP_FERNET_KEY"].encode("ascii"))


def read_private(path):
    file = Path(path)
    require(file.is_file() and not file.is_symlink() and 0 < file.stat().st_size <= MAX_BYTES * 2,
            "Invalid private archive path.")
    return file.read_bytes()


def fixture():
    db = sqlite3.connect(":memory:")
    db.executescript((ROOT / "migrations/0001_member_platform.sql").read_text())
    db.executescript((ROOT / "migrations/0002_member_rhen_drafts.sql").read_text())
    db.executescript("CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY, name TEXT UNIQUE);")
    for index, name in enumerate(BASE, 1):
        db.execute("INSERT INTO d1_migrations VALUES(?,?)", (index, name))
    db.execute('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)',
               ("synthetic-owner-0001", "Synthetic owner", "anevum.studio@gmail.com", 1, 1, 1))
    db.commit()
    raw = "\n".join(db.iterdump()).encode()
    db.close()
    return raw


def selftest():
    raw = fixture()
    require(verify(raw)["existing_records_preserved"], "Synthetic restore failed.")
    for invalid in (raw.replace(b"0002_member_rhen_drafts.sql", b"unreviewed.sql"),
                    raw.replace(b"anevum.studio@gmail.com", b"someone@example.invalid"),
                    raw + b"\nATTACH DATABASE ':memory:' AS extra;",
                    raw + b"\nCREATE TABLE commons_v5_posts(id TEXT);",
                    raw + b"\nCREATE TABLE studio_entries(id TEXT);",
                    raw + b'\nUPDATE "user" SET emailVerified=0;',
                    raw + b'\nINSERT INTO member_profiles(user_id) VALUES(\'missing-user\');',
                    b"not valid SQL"):
        try:
            verify(invalid)
        except (ValueError, sqlite3.Error):
            continue
        raise ValueError("Unsafe synthetic export accepted.")
    db = sqlite3.connect(":memory:")
    db.executescript(raw.decode())
    db.executescript((ROOT / "migrations-studio" / STUDIO).read_text())
    db.execute("INSERT INTO d1_migrations(name) VALUES(?)", (STUDIO,))
    db.commit()
    require(verify("\n".join(db.iterdump()).encode())["migration_ledger"] == BASE + [STUDIO],
            "Retry after registered Studio migration failed.")
    db.close()
    # Exercise the actual archive CLI with synthetic data, including a changed
    # digest, wrong decryption key and missing authorization. No provider calls.
    from cryptography.fernet import Fernet
    with tempfile.TemporaryDirectory(prefix="anevum-synthetic-recovery-") as temp:
        sql_path = Path(temp) / "synthetic.sql"
        archive = Path(temp) / "synthetic.sql.fernet"
        sql_path.write_bytes(raw)
        env = {**os.environ, "ANEVUM_PRIVATE_RECOVERY_AUTHORIZED": "true",
               "ANEVUM_PRODUCTION_BACKUP_FERNET_KEY": Fernet.generate_key().decode(),
               "EXPECTED_PRODUCTION_BACKUP_SHA": hashlib.sha256(raw).hexdigest()}
        def run(mode, paths, overrides=None):
            return subprocess.run([sys.executable, __file__, mode, *map(str, paths)],
                                  env={**env, **(overrides or {})}, capture_output=True, text=True)
        result = run("encrypt-and-verify", [sql_path, archive])
        require(result.returncode == 0 and archive.is_file(), "Synthetic encryption failed.")
        require(b"synthetic-owner" not in archive.read_bytes(), "Plaintext archive detected.")
        require(run("verify-encrypted", [archive]).returncode == 0, "Synthetic archive restore failed.")
        for invalid_env in ({"EXPECTED_PRODUCTION_BACKUP_SHA": "bad"},
                            {"ANEVUM_PRODUCTION_BACKUP_FERNET_KEY": Fernet.generate_key().decode()},
                            {"ANEVUM_PRIVATE_RECOVERY_AUTHORIZED": "false"}):
            rejected = run("verify-encrypted", [archive], invalid_env)
            require(rejected.returncode != 0 and "synthetic-owner" not in rejected.stderr,
                    "Unsafe encrypted recovery accepted.")
    print("Production recovery selftest passed with synthetic accounts only.")


def main():
    mode = sys.argv[1]
    if mode == "selftest":
        selftest()
        return
    require(os.environ.get("ANEVUM_PRIVATE_RECOVERY_AUTHORIZED") == "true",
            "Explicit private production recovery authorization required.")
    if mode == "encrypt-and-verify":
        raw = read_private(sys.argv[2])
        report = verify(raw)
        encrypted = fernet().encrypt(raw)
        require(fernet().decrypt(encrypted) == raw, "Encrypted recovery mismatch.")
        fd = os.open(sys.argv[3], os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(encrypted)
    elif mode == "verify-encrypted":
        report = verify(fernet().decrypt(read_private(sys.argv[2])))
        require(report["sql_sha256"] == os.environ.get("EXPECTED_PRODUCTION_BACKUP_SHA"),
                "Archived production recovery digest mismatch.")
    else:
        raise ValueError("Unsupported recovery operation.")
    print(json.dumps(report))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Provider/SQLite exceptions may include private SQL or account fields.
        print("Production recovery blocked; no private details logged.", file=sys.stderr)
        sys.exit(1)
