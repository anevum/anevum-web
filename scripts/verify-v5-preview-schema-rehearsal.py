#!/usr/bin/env python3
"""Offline rehearsal of the isolated ANEVUM V5 preview schema sequence.

NEVER opens a Cloudflare connection. No credentials, live user data, production
schema, secrets, or filesystem writes. A synthetic two-member SQLite database
recreates the current preview's unusual state: 0003 registered, workspace 0004
table/rows already present, but 0004 NOT in the recorded migration ledger.

Run this BEFORE separately authorized real preview D1 backup and migrations.
A passing local rehearsal is not permission to perform a remote apply.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
STEPS = (
    ("migrations", "0001_member_platform.sql", "10009f595660fc61b247a640f159d9915f0b24c3"),
    ("migrations", "0002_member_rhen_drafts.sql", "2686b5f780a0fffa34675129fd99510d3fde5a11"),
    ("migrations", "0003_member_billing.sql", "54333fa22dfce87a58e16e3e85b2d27a59b33544"),
    ("migrations", "0004_member_rhen_workspaces.sql", "58a6a352cf2ffd4d11f7e39ef07f2b66b08cd596"),
    ("migrations-review", "0005_member_alpaca_review.sql", "40d4d282eeae1630fd89d7b08c975102cff8e341"),
    ("migrations-social", "0006_commons_v5_discussions.sql", "69df811aca79e812c3d976edb5e17b2c4c6d4fbd"),
)
ALLOWED_STATEMENT = re.compile(r"(?is)^(?:PRAGMA\s+foreign_keys\s*=\s*ON|CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\b)")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError("V5_PREVIEW_CHAIN_BLOCKED: " + message)


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def verify_catalog() -> list[tuple[str, str]]:
    for directory in ("migrations", "migrations-review", "migrations-social"):
        actual = {p.name for p in (ROOT / directory).glob("*.sql")}
        expected = {name for dirname, name, _ in STEPS if dirname == directory}
        require(actual == expected, f"{directory} SQL catalog changed; review exact lineage")
    contents = []
    for directory, name, sha in STEPS:
        data = (ROOT / directory / name).read_bytes()
        require(git_blob_sha(data) == sha, f"unreviewed SQL blob: {name}")
        text = data.decode("utf-8")
        statements = "\n".join(line.split("--")[0] for line in text.splitlines())
        for statement in statements.split(";"):
            stripped = statement.strip()
            if stripped:
                require(bool(ALLOWED_STATEMENT.match(stripped)),
                        f"non-schema operation found in {name}")
        require("PRAGMA foreign_keys = ON" in text, f"FK requirement missing in {name}")
        contents.append((name, text))
    require([int(name[:4]) for name, _ in contents] == [1, 2, 3, 4, 5, 6],
            "ambiguous or missing migration sequence")
    return contents


def snapshot(db: sqlite3.Connection) -> dict:
    return {
        "users": db.execute('SELECT COUNT(*) FROM "user"').fetchone()[0],
        "drafts": db.execute("SELECT COUNT(*) FROM member_rhen_drafts").fetchone()[0],
        "workspaces": db.execute("SELECT COUNT(*) FROM member_rhen_workspaces").fetchone()[0],
    }


def reject_integrity(db: sqlite3.Connection, sql: str, args: tuple, label: str) -> None:
    # A negative test may occur inside a pending migration-fixture transaction.
    # Roll back ONLY the attempted statement; never erase previously seeded
    # rows, migration registrations, or cross-member setup on error.
    db.execute("SAVEPOINT expected_violation")
    try:
        db.execute(sql, args)
    except sqlite3.IntegrityError:
        db.execute("ROLLBACK TO SAVEPOINT expected_violation")
        db.execute("RELEASE SAVEPOINT expected_violation")
        return
    db.execute("ROLLBACK TO SAVEPOINT expected_violation")
    db.execute("RELEASE SAVEPOINT expected_violation")
    raise AssertionError("V5_PREVIEW_CHAIN_BLOCKED: " + label + " was accepted")


def execute() -> dict:
    catalog = verify_catalog()
    db = sqlite3.connect(":memory:")
    try:
        db.execute("PRAGMA foreign_keys = ON")
        require(db.execute("PRAGMA foreign_keys").fetchone()[0] == 1, "FK enforcement disabled")
        db.execute("CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE)")
        # Current preview ledger: 0001, 0002, 0003. Synthetic, never a real D1 export.
        for index, (name, sql) in enumerate(catalog[:3], start=1):
            db.executescript(sql)
            db.execute("INSERT INTO d1_migrations(id,name) VALUES(?,?)", (index, name))
        for member, marker in (("member-alpha", "a"), ("member-bravo", "b")):
            db.execute(
                'INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) '
                "VALUES(?,?,?,1,1,1)",
                (member, member, marker + "@example.invalid"),
            )
            db.execute(
                "INSERT INTO member_rhen_drafts(user_id,label,max_open_positions,"
                "max_total_exposure_percent,max_position_percent) VALUES(?,?,?,?,?)",
                (member, "Synthetic staged draft", 2, 30, 10),
            )
        # Recreate the known manually constructed workspace table and two rows.
        # The source ledger still ends at 0003. Replaying 0004 must preserve rows.
        db.executescript(catalog[3][1])
        for member, marker in (("member-alpha", "a"), ("member-bravo", "b")):
            db.execute(
                "INSERT INTO member_rhen_workspaces(user_id,workspace_id) VALUES(?,?)",
                (member, "wrk_" + marker * 32),
            )
        require([r[0] for r in db.execute("SELECT name FROM d1_migrations ORDER BY id")]
                == [c[0] for c in catalog[:3]], "initial ledger does not match preview")
        before = snapshot(db)
        workspace_before = db.execute(
            "SELECT user_id,workspace_id,created_at FROM member_rhen_workspaces ORDER BY user_id"
        ).fetchall()
        # 0004 is idempotent against the already existing table and preserves data.
        db.executescript(catalog[3][1])
        db.execute("INSERT INTO d1_migrations(id,name) VALUES(4,?)", (catalog[3][0],))
        require(snapshot(db) == before and db.execute(
            "SELECT user_id,workspace_id,created_at FROM member_rhen_workspaces ORDER BY user_id"
        ).fetchall() == workspace_before, "0004 changed existing member data")
        db.executescript(catalog[4][1])
        db.execute("INSERT INTO d1_migrations(id,name) VALUES(5,?)", (catalog[4][0],))
        require(snapshot(db) == before, "0005 mutated existing member rows")
        oauth_tables = {x[0] for x in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'member_alpaca_review_%'"
        )}
        require(oauth_tables == {
            "member_alpaca_review_states", "member_alpaca_review_consent",
            "member_alpaca_review_connections"}, "OAuth table set is wrong")
        db.execute(
            "INSERT INTO member_alpaca_review_connections"
            "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes)"
            " VALUES(?,?,?,?,?,?)",
            ("member-alpha", "synthetic-connection-1", "paper-alpha",
             "NONREAL-ENCRYPTED-FIXTURE", "NONREAL-IV", ""),
        )
        reject_integrity(
            db, "INSERT INTO member_alpaca_review_connections"
                "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes)"
                " VALUES(?,?,?,?,?,?)",
            ("member-bravo", "synthetic-connection-2", "paper-alpha",
             "NONREAL-ENCRYPTED-FIXTURE", "NONREAL-IV", ""),
            "same broker assigned to two members",
        )
        for scope in ("trading", "account:write"):
            reject_integrity(
                db, "INSERT INTO member_alpaca_review_connections"
                    "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes)"
                    " VALUES(?,?,?,?,?,?)",
                ("member-bravo", "new-id-" + scope, "paper-bravo",
                 "NONREAL-ENCRYPTED-FIXTURE", "NONREAL-IV", scope),
                "unsafe OAuth scope " + scope,
            )
        db.executescript(catalog[5][1])
        db.execute("INSERT INTO d1_migrations(id,name) VALUES(6,?)", (catalog[5][0],))
        require(snapshot(db) == before, "0006 modified staged member data")
        social_tables = {x[0] for x in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'commons_v5_%'"
        )}
        require(social_tables == {"commons_v5_posts", "commons_v5_replies",
                "commons_v5_reports", "commons_v5_moderation_events"},
                "social moderation/report tables missing")
        db.execute(
            "INSERT INTO commons_v5_posts"
            "(id,author_user_id,topic,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
            ("post-one", "member-bravo", "research", "An evidence question",
             "Synthetic paper-only evidence record with no live trading activity.", 1, 1),
        )
        db.execute(
            "INSERT INTO commons_v5_replies(id,post_id,author_user_id,body,created_at)"
            "VALUES(?,?,?,?,?)",
            ("reply-one", "post-one", "member-alpha", "Evidence reviewed.", 2),
        )
        db.execute(
            "INSERT INTO commons_v5_reports"
            "(id,post_id,reporter_user_id,reason,created_at) VALUES(?,?,?,?,?)",
            ("report-one", "post-one", "member-alpha", "privacy", 3),
        )
        reject_integrity(
            db, "INSERT INTO commons_v5_reports"
                "(id,post_id,reporter_user_id,reason,created_at) VALUES(?,?,?,?,?)",
            ("report-two", "post-one", "member-alpha", "spam", 3),
            "duplicate report by the same member",
        )
        db.execute(
            "INSERT INTO commons_v5_moderation_events"
            "(id,actor_user_id,target_post_id,report_id,action,reason,occurred_at)"
            "VALUES(?,?,?,?,?,?,?)",
            ("audit-one", "member-alpha", "post-one", "report-one",
             "hide_post", "Synthetic moderation review", 4),
        )
        reject_integrity(
            db, "INSERT INTO commons_v5_moderation_events"
                "(id,actor_user_id,target_post_id,report_id,action,reason,occurred_at)"
                "VALUES(?,?,?,?,?,?,?)",
            ("audit-two", "member-alpha", "post-one", "report-one",
             "hide_post", "Duplicate moderation review", 4),
            "second moderation decision on same report",
        )
        # Deleting A may cascade A's reply/report/OAuth record, NEVER B's post
        # or workspace. Preserve nonidentifying moderation audit record.
        db.execute('DELETE FROM "user" WHERE id=?', ("member-alpha",))
        for table, column in (
            ("member_rhen_workspaces", "user_id"),
            ("member_rhen_drafts", "user_id"),
            ("member_alpaca_review_connections", "user_id"),
            ("commons_v5_replies", "author_user_id"),
            ("commons_v5_reports", "reporter_user_id"),
        ):
            require(db.execute(
                f"SELECT COUNT(*) FROM {table} WHERE {column}=?",
                ("member-alpha",)).fetchone()[0] == 0, f"deletion failed in {table}")
        require(db.execute("SELECT COUNT(*) FROM commons_v5_posts WHERE id='post-one'")
                .fetchone()[0] == 1, "another member's post was removed")
        require(db.execute(
            "SELECT user_id FROM member_rhen_workspaces"
        ).fetchall() == [("member-bravo",)], "remaining workspace was altered")
        require(db.execute(
            "SELECT actor_user_id,report_id,target_post_id,action "
            "FROM commons_v5_moderation_events WHERE id='audit-one'"
        ).fetchone() == (None, None, "post-one", "hide_post"),
                "audited action not retained when moderator/reporter deleted")
        require(db.execute("PRAGMA foreign_key_check").fetchall() == [],
                "foreign-key violations after all migrations and deletion")
        require([r[0] for r in db.execute("SELECT name FROM d1_migrations ORDER BY id")]
                == [c[0] for c in catalog], "migration registration order changed")
        return {
            "result": "PASS_OFFLINE_REHEARSAL_ONLY",
            "preview_fixture": "two synthetic members; 0004 table preexisting but unregistered",
            "migration_sequence": [name for name, _ in catalog],
            "sql_blobs_pinned": True,
            "existing_state_preserved_through_0006": True,
            "cross_member_broker_reuse_blocked": True,
            "write_scope_denials": True,
            "report_moderation_uniqueness": True,
            "member_deletion_and_audit_retention": True,
            "foreign_keys_clear": True,
            "remote_database_access": False,
            "permission_to_migrate": False,
        }
    finally:
        db.close()


if __name__ == "__main__":
    print(json.dumps(execute(), sort_keys=True))
