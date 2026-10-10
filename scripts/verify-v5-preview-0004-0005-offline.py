#!/usr/bin/env python3
"""Rehearse ANEVUM V5 preview 0004 then isolated paper-only 0005 OFFLINE.

All identities and broker references are synthetic. SQLite is exclusively
in-memory; this script performs no Cloudflare, HTTP, brokerage, or file writes.
An offline success is never authorization for remote migration.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    ("migrations/0001_member_platform.sql", "10009f595660fc61b247a640f159d9915f0b24c3"),
    ("migrations/0002_member_rhen_drafts.sql", "2686b5f780a0fffa34675129fd99510d3fde5a11"),
    ("migrations/0003_member_billing.sql", "54333fa22dfce87a58e16e3e85b2d27a59b33544"),
    ("migrations/0004_member_rhen_workspaces.sql", "58a6a352cf2ffd4d11f7e39ef07f2b66b08cd596"),
    ("migrations-review/0005_member_alpaca_review.sql", "40d4d282eeae1630fd89d7b08c975102cff8e341"),
)
ALLOWED = re.compile(r"(?is)^(?:PRAGMA\s+foreign_keys\s*=\s*ON|CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\b)")


def require(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError("PREVIEW_SCHEMA_BLOCKED: " + message)


def catalog() -> list[tuple[str, str]]:
    for directory in ("migrations", "migrations-review"):
        expected = {Path(name).name for name, _ in FILES if name.startswith(directory + "/")}
        actual = {p.name for p in (ROOT / directory).glob("*.sql")}
        require(expected == actual, "migration source inventory changed: " + directory)
    source = []
    for filename, expected_sha in FILES:
        raw = (ROOT / filename).read_bytes()
        sha = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
        require(sha == expected_sha, "reviewed migration blob changed: " + filename)
        sql = raw.decode("utf-8")
        without_comments = "\n".join(line.split("--")[0] for line in sql.splitlines())
        for stmt in without_comments.split(";"):
            if stmt.strip():
                require(ALLOWED.match(stmt.strip()) is not None, "DML or DDL outside allowed CREATE: " + filename)
        source.append((Path(filename).name, sql))
    require([name[:4] for name, _ in source] == ["0001", "0002", "0003", "0004", "0005"],
            "migration ordering changed")
    return source


def counts(db: sqlite3.Connection) -> tuple[int, int, int]:
    return (
        db.execute('SELECT count(*) FROM "user"').fetchone()[0],
        db.execute("SELECT count(*) FROM member_rhen_workspaces").fetchone()[0],
        db.execute("SELECT count(*) FROM member_rhen_drafts").fetchone()[0],
    )


def deny_integrity(db: sqlite3.Connection, sql: str, params: tuple) -> None:
    db.execute("SAVEPOINT expected_denial")
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        db.execute("ROLLBACK TO SAVEPOINT expected_denial")
        db.execute("RELEASE SAVEPOINT expected_denial")
        return
    db.execute("ROLLBACK TO SAVEPOINT expected_denial")
    db.execute("RELEASE SAVEPOINT expected_denial")
    raise AssertionError("PREVIEW_SCHEMA_BLOCKED: expected constraint was not enforced")


def rehearse() -> dict:
    source = catalog()
    db = sqlite3.connect(":memory:")
    try:
        db.execute("PRAGMA foreign_keys=ON")
        require(db.execute("PRAGMA foreign_keys").fetchone()[0] == 1,
                "foreign key constraints disabled")
        db.execute("CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)")
        for n, (name, sql) in enumerate(source[:3], 1):
            db.executescript(sql)
            db.execute("INSERT INTO d1_migrations(id,name) VALUES(?,?)", (n, name))
        for member in ("sample-alpha", "sample-bravo"):
            db.execute('INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) '
                       "VALUES(?,?,?,1,1,1)", (member, member, member+"@example.invalid"))
            db.execute("INSERT INTO member_rhen_drafts"
                       "(user_id,label,max_open_positions,max_total_exposure_percent,max_position_percent)"
                       "VALUES(?,?,?,?,?)", (member, "Synthetic paper research only", 2, 30, 10))
        # Matches the preview anomaly observed via read-only D1 inventory:
        # table already exists, two member rows are populated, ledger ends 0003.
        db.executescript(source[3][1])
        for member in ("sample-alpha", "sample-bravo"):
            db.execute("INSERT INTO member_rhen_workspaces(user_id,workspace_id)"
                       "VALUES(?,?)", (member, "wrk_" + member[-5:] * 6 + "ab"))
        # The above synthetic workspace ID must be 36 chars including 'wrk_'.
        require(all(len(row[0]) == 36 for row in
                    db.execute("SELECT workspace_id FROM member_rhen_workspaces")),
                "workspace fixture ID malformed")
        expected = (2, 2, 2)
        require(counts(db) == expected, "synthetic starting counts wrong")
        before_rows = db.execute(
            "SELECT user_id, workspace_id, created_at FROM member_rhen_workspaces ORDER BY user_id"
        ).fetchall()
        require([row[0] for row in db.execute("SELECT name FROM d1_migrations ORDER BY id")]
                == [x[0] for x in source[:3]], "preexisting unregistered table anomaly missing")
        db.executescript(source[3][1])
        require(counts(db) == expected and db.execute(
            "SELECT user_id, workspace_id, created_at FROM member_rhen_workspaces ORDER BY user_id"
        ).fetchall() == before_rows, "0004 recreated/changed a member workspace")
        db.execute("INSERT INTO d1_migrations(id,name) VALUES(4,?)", (source[3][0],))
        db.executescript(source[4][1])
        require(counts(db) == expected, "0005 changed existing user/workspace/draft counts")
        db.execute("INSERT INTO d1_migrations(id,name) VALUES(5,?)", (source[4][0],))
        actual_tables = {r[0] for r in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'member_alpaca_review_%'"
        )}
        require(actual_tables == {"member_alpaca_review_states", "member_alpaca_review_consent",
                "member_alpaca_review_connections"}, "review tables missing/extra")
        insert = ("INSERT INTO member_alpaca_review_connections"
                  "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at)"
                  " VALUES(?,?,?,?,?,?,?)")
        db.execute(insert, ("sample-alpha", "fake-connect-a", "fake-paper-a",
                   "SYNTHETIC-NOT-A-TOKEN", "SYNTHETIC-IV", "data", 1))
        deny_integrity(db, insert, ("sample-bravo", "fake-connect-b", "fake-paper-a",
                       "SYNTHETIC-NOT-A-TOKEN", "SYNTHETIC-IV", "data", 1))
        for forbidden in ("trading", "account:write"):
            deny_integrity(db, insert, ("sample-bravo", "fake-connect-b", "fake-paper-b",
                           "SYNTHETIC-NOT-A-TOKEN", "SYNTHETIC-IV", forbidden, 1))
        db.execute('DELETE FROM "user" WHERE id=?', ("sample-alpha",))
        require(counts(db) == (1, 1, 1), "scoped deletion removed another member's records")
        require(db.execute(
            "SELECT user_id FROM member_alpaca_review_connections").fetchall() == [],
            "deleted member broker token reference survived")
        require(db.execute(
            "SELECT user_id FROM member_rhen_workspaces").fetchall() == [("sample-bravo",)],
            "another member's workspace was changed")
        require(not db.execute("PRAGMA foreign_key_check").fetchall(),
                "schema has invalid foreign keys")
        require([row[0] for row in db.execute("SELECT name FROM d1_migrations ORDER BY id")]
                == [x[0] for x in source], "schema migration history altered")
        return {
            "result": "PASS_OFFLINE_ONLY",
            "source_blobs_pinned": 5,
            "two_member_unregistered_workspace_rehearsal": True,
            "existing_member_rows_preserved_through_migrations": True,
            "cross_member_paper_account_reuse_denied": True,
            "broker_write_scopes_denied": True,
            "member_deletion_isolated": True,
            "foreign_keys_clean": True,
            "cloudflare_writes": False,
            "authorized_to_migrate": False,
        }
    finally:
        db.close()


if __name__ == "__main__":
    print(json.dumps(rehearse(), sort_keys=True))
