#!/usr/bin/env python3
"""Review-only ANEVUM Commerce schema contract: no real DB/bank interaction."""
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "docs/commerce-vault/schema-v001.review-only.sql"


class CommerceSchemaRehearsal(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.execute('CREATE TABLE "user" ("id" TEXT PRIMARY KEY NOT NULL)')
        self.db.executemany('INSERT INTO "user"(id) VALUES (?)', (("member-A",), ("member-B",)))
        self.db.executescript(SCHEMA.read_text(encoding="utf8"))

    def tearDown(self):
        self.db.close()

    def draft(self):
        self.db.execute(
            "INSERT INTO commerce_orders(id,user_id,product_code,amount_cents,created_at_ms,updated_at_ms)"
            " VALUES('order1','member-A','vault-10g-month',400,1,1)"
        )

    def test_payment_blackout_rejects_insert_and_update(self):
        self.draft()
        with self.assertRaisesRegex(sqlite3.IntegrityError, "payments are disabled"):
            self.db.execute(
                "UPDATE commerce_orders SET status='paid',settlement_rail='bank',"
                "settlement_reference='foo',settled_at_ms=2 WHERE id='order1'"
            )
        with self.assertRaisesRegex(sqlite3.IntegrityError, "payments are disabled"):
            self.db.execute(
                "INSERT INTO commerce_orders(id,user_id,product_code,amount_cents,status,"
                "settlement_rail,settlement_reference,settled_at_ms,created_at_ms,updated_at_ms)"
                " VALUES('order2','member-A','signal-support-5',500,'paid',"
                "'bank','bar',2,1,1)"
            )
        self.assertEqual(
            self.db.execute("SELECT status FROM commerce_orders WHERE id='order1'").fetchone()[0],
            "draft",
        )

    def test_ledger_and_paid_pass_cannot_be_forged(self):
        self.draft()
        with self.assertRaisesRegex(sqlite3.IntegrityError, "ledger postings are disabled"):
            self.db.execute(
                "INSERT INTO commerce_ledger(entry_id,order_id,rail,settlement_reference,kind,"
                "amount_cents,recorded_at_ms) VALUES('entry1','order1','bank','bank1','payment',400,2)"
            )
        with self.assertRaisesRegex(sqlite3.IntegrityError, "paid storage issuance is disabled"):
            self.db.execute(
                "INSERT INTO commerce_vault_passes(order_id,user_id,added_bytes,starts_at_ms,ends_at_ms)"
                " VALUES('order1','member-A',1000,2,3)"
            )

    def test_bank_entry_duplicate_and_unverified_default(self):
        sql = ("INSERT INTO commerce_bank_credit_candidates"
               "(id,institution_id,merchant_account_alias,external_entry_id,amount_cents,received_at_ms)"
               " VALUES(?,?,?,?,?,?)")
        self.db.execute(sql, ("credit1","mock-bank","merchant-demo","tx1",400,1))
        status = self.db.execute(
            "SELECT posting_status FROM commerce_bank_credit_candidates WHERE id='credit1'"
        ).fetchone()[0]
        self.assertEqual(status, "unverified")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql, ("credit2","mock-bank","merchant-demo","tx1",400,1))

    def test_vault_projects_are_composite_tenant_scoped(self):
        self.db.execute(
            "INSERT INTO vault_projects(id,user_id,name,created_at_ms)"
            " VALUES('project-A','member-A','Prototype',1)"
        )
        self.db.execute(
            "INSERT INTO vault_usage(user_id,updated_at_ms) VALUES('member-B',1)"
        )
        sql = ("INSERT INTO vault_uploads"
               "(id,user_id,project_id,object_key,filename,content_type,expected_bytes,"
               "created_at_ms,expires_at_ms)"
               " VALUES('uploadB','member-B','project-A','member-B/x','a.png','image/png',100,1,2)")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql)

    def test_handmade_merch_never_outsources_and_cannot_oversell(self):
        self.db.execute(
            "INSERT INTO commerce_handmade_merch_variants"
            "(sku,item_name,variant,price_cents,in_stock_units,reserved_units)"
            " VALUES('C001','Handmade tee','charcoal M',2200,2,1)"
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "UPDATE commerce_handmade_merch_variants SET reserved_units=3 WHERE sku='C001'"
            )
        self.assertIn("commerce_handmade_fulfillment",
                      {row[0] for row in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")})


if __name__ == "__main__":
    unittest.main(verbosity=2)
