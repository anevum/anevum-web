#!/usr/bin/env python3
"""Validate ANEVUM's isolated member schema before any Cloudflare D1 deployment."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
schemas = sorted((root / "migrations").glob("*.sql"))
assert [p.name for p in schemas] == ["0001_member_platform.sql", "0002_member_rhen_drafts.sql", "0003_member_billing.sql"]
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
    "member_rhen_drafts", "member_billing_customers",
    "member_billing_subscriptions", "member_billing_events",
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
    customer = "cus_test" + user_id.replace("-", "")
    db.execute(
        "INSERT INTO member_billing_customers (user_id,stripe_customer_id) VALUES (?,?)",
        (user_id, customer),
    )
    db.execute(
        "INSERT INTO member_billing_subscriptions "
        "(stripe_subscription_id,user_id,stripe_customer_id,stripe_price_id,plan_code,status,"
        "current_period_end) VALUES (?,?,?,?,?,?,?)",
        ("sub_test" + user_id.replace("-", ""), user_id, customer,
         "price_test", "founding", "active", 1999999999),
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

db.execute('DELETE FROM "user" WHERE id = ?', ("member-a",))
for table in ("member_saved_apps", "member_project_follows", "member_profiles",
              "member_rhen_drafts", "member_billing_customers", "member_billing_subscriptions"):
    assert db.execute(
        f"SELECT count(*) FROM {table} WHERE user_id = ?", ("member-a",)
    ).fetchone()[0] == 0, f"{table} did not cascade"
    assert db.execute(
        f"SELECT count(*) FROM {table} WHERE user_id = ?", ("member-b",)
    ).fetchone()[0] == 1, f"{table} deleted another account's data"

assert db.execute("PRAGMA foreign_key_check").fetchall() == [], "Foreign-key violations"
print("Member D1 schema: identities, RHEN drafts, billing isolation, constraints, and cascades passed.")
