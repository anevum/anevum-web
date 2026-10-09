#!/usr/bin/env python3
"""Validate ANEVUM's isolated member schema before any Cloudflare D1 deployment."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
schemas = sorted((root / "migrations").glob("*.sql"))
names = [p.name for p in schemas]
base = ["0001_member_platform.sql", "0002_member_rhen_drafts.sql"]
assert names in (base + ["0004_commons_beta.sql", "0005_commons_reports.sql", "0006_member_alpaca_live_connect.sql"], base + ["0003_member_billing.sql", "0004_commons_beta.sql", "0005_commons_reports.sql", "0006_member_alpaca_live_connect.sql"]), (
    "Expected canonical member migration order (billing 0003 precedes Commons 0004 when present): " + str(names)
)

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
for migration in schemas:
    db.executescript(migration.read_text(encoding="utf-8"))

tables = {
    row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
}
required = {
    "user", "session", "account", "verification", "rateLimit", "member_profiles",
    "member_saved_apps", "member_project_follows", "member_entitlements",
    "member_rhen_drafts", "commons_members", "commons_topics",
    "commons_comments", "commons_moderation_events", "commons_reports",
    "member_alpaca_live_oauth_states", "member_alpaca_live_connections",
}
assert required <= tables, f"Missing tables: {required - tables}"

for user_id, email in (("member-a", "a@example.test"), ("member-b", "b@example.test")):
    db.execute(
        'INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, 1, 1)',
        (user_id, user_id, email),
    )
    db.execute(
        "INSERT INTO member_profiles (user_id, display_name) VALUES (?, ?)",
        (user_id, user_id),
    )
    db.execute(
        "INSERT INTO member_saved_apps (user_id, app_slug) VALUES (?, ?)",
        (user_id, "rhen"),
    )
    db.execute(
        "INSERT INTO member_project_follows (user_id, project_slug) VALUES (?, ?)",
        (user_id, "rhen"),
    )
    db.execute(
        "INSERT INTO member_rhen_drafts (user_id, label, max_open_positions, "
        "max_total_exposure_percent, max_position_percent) VALUES (?, ?, ?, ?, ?)",
        (user_id, "Sample configuration", 2, 30, 10),
    )

assert db.execute(
    "SELECT count(*) FROM member_saved_apps WHERE user_id = ?", ("member-a",)
).fetchone()[0] == 1
assert db.execute(
    "SELECT count(*) FROM member_saved_apps WHERE user_id = ?", ("member-b",)
).fetchone()[0] == 1

# An application cannot create orphan preferences or impersonate other user IDs
# through the foreign-key relationship.
try:
    db.execute("INSERT INTO member_saved_apps (user_id, app_slug) VALUES (?, ?)", ("unknown", "rhen"))
    raise AssertionError("Orphan member preference unexpectedly allowed")
except sqlite3.IntegrityError:
    pass

for invalid in [(0, 30, 10), (2, 101, 10), (2, 30, 31)]:
    try:
        db.execute(
            "UPDATE member_rhen_drafts SET max_open_positions=?, "
            "max_total_exposure_percent=?, max_position_percent=? WHERE user_id=?",
            (*invalid, "member-a"),
        )
        raise AssertionError("Invalid draft limits unexpectedly accepted")
    except sqlite3.IntegrityError:
        pass


# Commons membership and discussions must remain independently user-owned.
db.execute(
    "INSERT INTO commons_members (user_id, role, invited_by) VALUES (?, ?, ?)",
    ("member-a", "moderator", "preview-owner-approval")
)
db.execute(
    "INSERT INTO commons_members (user_id, role, invited_by) VALUES (?, ?, ?)",
    ("member-b", "contributor", "preview-owner-approval")
)
db.execute(
    "INSERT INTO commons_topics (id, author_id, kind, subject, title, body) VALUES (?, ?, ?, ?, ?, ?)",
    ("topic-a", "member-a", "question", "algorithms", "Can this rule be validated?", "A bounded research question with enough detail to investigate.")
)
db.execute(
    "INSERT INTO commons_comments (id, topic_id, author_id, body) VALUES (?, ?, ?, ?)",
    ("comment-b", "topic-a", "member-b", "We should test across different regimes.")
)
assert db.execute("SELECT COUNT(*) FROM commons_topics WHERE author_id = 'member-a'").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM commons_comments WHERE author_id = 'member-b'").fetchone()[0] == 1
for bad in (
    ("bad-owner", "unknown", "question", "algorithms", "Can this rule be validated?", "A bounded research question with enough detail to investigate."),
    ("bad-title", "member-b", "question", "algorithms", "tiny", "A bounded research question with enough detail to investigate."),
    ("bad-kind", "member-b", "prediction", "algorithms", "Can this rule be validated?", "A bounded research question with enough detail to investigate."),
):
    try:
        db.execute(
            "INSERT INTO commons_topics (id, author_id, kind, subject, title, body) VALUES (?, ?, ?, ?, ?, ?)",
            bad
        )
        raise AssertionError("Commons unexpectedly allowed invalid research input")
    except sqlite3.IntegrityError:
        pass


# Reports cannot impersonate reporters or bypass duplicate constraints.
db.execute(
    "INSERT INTO commons_reports(id, reporter_id, topic_id, reason) VALUES(?,?,?,?)",
    ("report-b", "member-b", "topic-a", "misleading_claims")
)
db.execute(
    "INSERT INTO commons_reports(id, reporter_id, comment_id, reason) VALUES(?,?,?,?)",
    ("report-a", "member-a", "comment-b", "spam")
)
for bad in (
    ("duplicate", "member-b", "topic-a", "privacy"),
    ("unknown", "unknown", "topic-a", "other"),
):
    try:
        db.execute(
            "INSERT INTO commons_reports(id, reporter_id, topic_id, reason) VALUES(?,?,?,?)",
            bad
        )
        raise AssertionError("Commons report constraints were bypassed")
    except sqlite3.IntegrityError:
        pass
assert db.execute("SELECT COUNT(*) FROM commons_reports").fetchone()[0] == 2


# Account credentials are encrypted per member, unique across members, and
# cleaned up by member identity deletion; no company RHEN state is referenced.
for member, account in (("member-a", "broker-a"), ("member-b", "broker-b")):
    db.execute(
        "INSERT INTO member_alpaca_live_connections "
        "(user_id, connection_id, broker_account_id, encrypted_token, token_iv, granted_scopes, connected_at) "
        "VALUES(?,?,?,?,?,?,?)",
        (member, "connection-" + member, account, "encrypted-test-only", "iv-test-only", "trading", 1800000000),
    )
db.execute(
    "INSERT INTO member_alpaca_live_oauth_states "
    "(state_hash, user_id, expires_at, created_at) VALUES(?,?,?,?)",
    ("a" * 64, "member-a", 1800000100, 1800000000)
)
for bad in (
    ("other-user", "new-connection", "broker-a"),
    ("member-b", "connection-different", "broker-c"),
):
    try:
        db.execute(
            "INSERT INTO member_alpaca_live_connections "
            "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at) "
            "VALUES(?,?,?,?,?,?,?)",
            (*bad, "encrypted", "iv", "trading", 1800000000),
        )
        raise AssertionError("Alpaca live identity/account uniqueness bypassed")
    except sqlite3.IntegrityError:
        pass

db.execute('DELETE FROM "user" WHERE id = ?', ("member-a",))
for table in ("member_saved_apps", "member_project_follows", "member_profiles", "member_rhen_drafts", "commons_members"):
    assert db.execute(
        f"SELECT count(*) FROM {table} WHERE user_id = ?", ("member-a",)
    ).fetchone()[0] == 0, f"{table} did not cascade"
    assert db.execute(
        f"SELECT count(*) FROM {table} WHERE user_id = ?", ("member-b",)
    ).fetchone()[0] == 1, f"{table} deleted another account's data"

assert db.execute("SELECT COUNT(*) FROM commons_topics WHERE id = 'topic-a'").fetchone()[0] == 0, "Deleted user left authored topic"
assert db.execute("SELECT COUNT(*) FROM commons_comments WHERE id = 'comment-b'").fetchone()[0] == 0, "Deleted topic left comments"
assert db.execute("SELECT COUNT(*) FROM commons_reports").fetchone()[0] == 0, "Deleted user/topic left reports"
assert db.execute("SELECT COUNT(*) FROM member_alpaca_live_connections WHERE user_id='member-a'").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM member_alpaca_live_connections WHERE user_id='member-b'").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM member_alpaca_live_oauth_states WHERE user_id='member-a'").fetchone()[0] == 0
assert db.execute("PRAGMA foreign_key_check").fetchall() == [], "Foreign-key violations"
print("Member D1 schema: core, drafts, Commons tables, tenant keys, constraints, and cascades passed.")
