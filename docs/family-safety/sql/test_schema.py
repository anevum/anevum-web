"""Validate the REVIEW-ONLY family circle SQL schema using stdlib SQLite.

No network, no ANEVUM production DB, no real household or location data.
"""
import pathlib
import sqlite3
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SCHEMA = (HERE / "001_private_circle_permissions_REVIEW_ONLY.sql").read_text(encoding="utf-8")
T = 1_792_266_000_000


class PrivateCircleSchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript(SCHEMA)
        self.db.execute("INSERT INTO fs_private_circles VALUES (?,?,?,?)",
                        ("circle-1", "alice", "active", T))
        for sid in ("alice", "bob"):
            self.db.execute("INSERT INTO fs_memberships VALUES (?,?,?,?,?,?,?)",
                            ("circle-1", sid, "adult", "adult", 1, "active", T))
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def insert_session(self, sid="sess-1", subject="alice", start=T, end=T+300_000,
                       consent="explicit", state="active", circle="circle-1", revoked=None):
        self.db.execute("INSERT INTO fs_share_sessions VALUES (?,?,?,?,?,?,?,?)",
                        (sid, circle, subject, consent, state, start, end, revoked))

    def insert_grant(self, viewer="bob", session="sess-1", circle="circle-1",
                     subject="alice", consent="explicit", scope="presence:read",
                     issued=T+1000, expires=T+200_000):
        self.db.execute("INSERT INTO fs_viewer_grants VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                        ("grant-1",session,circle,subject,viewer,consent,scope,
                         "active",issued,expires,None))

    def test_only_permission_tables_without_gps_location_columns(self):
        tables = {
            row[0] for row in self.db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'fs_%'"
            )
        }
        self.assertEqual(tables, {
            "fs_private_circles","fs_memberships","fs_share_sessions",
            "fs_viewer_grants","fs_circle_invitations","fs_access_audit","fs_verified_adults"
        })
        all_names = []
        for table in tables:
            all_names.extend(row[1].lower() for row in self.db.execute(
                'PRAGMA table_info("' + table + '")'
            ))
        for banned in ("latitude","longitude","coordinates","gps","precise_position",
                       "home_address","school_address","location_history"):
            self.assertFalse(any(banned in name for name in all_names), banned)

    def test_verification_registry_never_stores_raw_access_email(self):
        self.db.execute(
            "INSERT INTO fs_verified_adults VALUES (?,?,?,?,?)",
            ("alice","a"*64,1,"active",T)
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "INSERT INTO fs_verified_adults VALUES (?,?,?,?,?)",
                ("bob","a"*64,1,"active",T)
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "INSERT INTO fs_verified_adults VALUES (?,?,?,?,?)",
                ("bob","b"*64,0,"active",T)
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "INSERT INTO fs_verified_adults VALUES (?,?,?,?,?)",
                ("bob","email:foo@example.org",1,"active",T)
            )
        fields=[row[1] for row in self.db.execute("PRAGMA table_info(fs_verified_adults)")]
        self.assertNotIn("email",fields)
        self.assertNotIn("location",fields)

    def test_one_active_session_and_viewer_grant_per_subject_and_viewer(self):
        self.insert_session()
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_session(sid="sess-2")
        self.insert_grant()
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "INSERT INTO fs_viewer_grants VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                ("grant-2","sess-1","circle-1","alice","bob",
                 "explicit","presence:read","active",T+2000,T+100000,None)
            )

    def test_member_must_be_unique_verified_adult_schema_only(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO fs_memberships VALUES (?,?,?,?,?,?,?)",
                            ("circle-1","bob","adult","adult",1,"active",T))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO fs_memberships VALUES (?,?,?,?,?,?,?)",
                            ("circle-1","child-1","child","minor",1,"active",T))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO fs_memberships VALUES (?,?,?,?,?,?,?)",
                            ("circle-1","outsider","adult","adult",1,"active",0))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO fs_memberships VALUES (?,?,?,?,?,?,?)",
                            ("another-circle","outsider","adult","adult",1,"active",T))

    def test_session_bounds_and_explicit_consent_required(self):
        for end in (T + 59_999,T + 3_600_001):
            with self.assertRaises(sqlite3.IntegrityError):
                self.insert_session(end=end)
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_session(consent="implicit")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_session(revoked=T-1)
        self.insert_session()
        row = self.db.execute("SELECT consent,expires_at_ms FROM fs_share_sessions").fetchone()
        self.assertEqual(row,("explicit",T+300_000))

    def test_grant_is_bound_to_exact_session_circle_and_member(self):
        self.insert_session()
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(viewer="unknown")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(viewer="alice")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(subject="bob")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(circle="other-circle")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(consent="implicit")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(scope="presence:write")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_grant(expires=T + 999)
        self.insert_grant()
        row = self.db.execute(
            "SELECT viewer_id,session_id,scope FROM fs_viewer_grants"
        ).fetchone()
        self.assertEqual(row,("bob","sess-1","presence:read"))

    def test_membership_removal_cascades_session_and_grant(self):
        self.insert_session()
        self.insert_grant()
        self.db.execute(
            "DELETE FROM fs_memberships WHERE circle_id=? AND subject_id=?",
            ("circle-1","alice")
        )
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM fs_share_sessions").fetchone()[0],0)
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM fs_viewer_grants").fetchone()[0],0)

    def test_single_use_private_adult_invitation_with_atomic_consumption(self):
        insert = (
            "INSERT INTO fs_circle_invitations "
            "VALUES (?,?,?,?,?,?,?,?,?,?)"
        )
        invite = ("invite-1","circle-1","alice","carol","a"*64,
                  "adult","pending",T,T+60000,None)
        self.db.execute(insert,invite)
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(insert,("invite-2","circle-1","alice","dave","a"*64,
                                    "adult","pending",T,T+60000,None))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(insert,("invite-3","circle-1","alice","dave","b"*64,
                                    "child","pending",T,T+60000,None))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(insert,("invite-4","circle-1","alice","dave","c"*64,
                                    "adult","pending",T,T+86400001,None))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(insert,("invite-5","circle-1","outsider","dave","d"*64,
                                    "adult","pending",T,T+60000,None))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM fs_memberships").fetchone()[0],2)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM fs_viewer_grants").fetchone()[0],0)
        query = (
            "UPDATE fs_circle_invitations SET state='accepted', accepted_at_ms=? "
            "WHERE invitation_id=? AND invitee_subject_id=? "
            "AND state='pending' AND issued_at_ms<=? AND expires_at_ms>?"
        )
        self.assertEqual(self.db.execute(query,(T+5000,"invite-1","wrong",T+5000,T+5000)).rowcount,0)
        self.assertEqual(self.db.execute(query,(T+5000,"invite-1","carol",T+5000,T+5000)).rowcount,1)
        self.assertEqual(self.db.execute(query,(T+6000,"invite-1","carol",T+6000,T+6000)).rowcount,0)
        # Accepting an invitation is NOT permission to locate a family member.
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM fs_viewer_grants").fetchone()[0],0)

    def test_audit_contains_no_precise_location_values(self):
        self.db.execute(
            "INSERT INTO fs_access_audit "
            "(circle_id,actor_subject_id,target_subject_id,action,occurred_at_ms,request_correlation_id)"
            " VALUES (?,?,?,?,?,?)",
            ("circle-1","bob","alice","location_read_denied",T,"correl-001")
        )
        columns = [row[1] for row in self.db.execute("PRAGMA table_info(fs_access_audit)")]
        self.assertFalse(any(x in columns for x in ("lat","lng","accuracy_m","coordinates")))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                "INSERT INTO fs_access_audit "
                "(circle_id,action,occurred_at_ms,request_correlation_id) VALUES (?,?,?,?)",
                ("circle-1","person_missing",T,"correl-002")
            )


if __name__ == "__main__":
    unittest.main()
