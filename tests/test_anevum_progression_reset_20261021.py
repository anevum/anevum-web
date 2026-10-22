"""Offline, synthetic safety tests. Never contacts GitHub or Cloudflare."""
import importlib.util
from pathlib import Path
import sqlite3
import unittest
from unittest.mock import patch

TARGET = Path(__file__).resolve().parents[1] / 'scripts/ops/anevum-progression-reset-20261021.py'
spec = importlib.util.spec_from_file_location('xp_reset', TARGET)
ops = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ops)


def fixture(xp=3, milestones=2):
    d=sqlite3.connect(':memory:')
    d.row_factory=sqlite3.Row
    d.executescript('''
       PRAGMA foreign_keys=ON;
       CREATE TABLE "user"(id TEXT PRIMARY KEY, name TEXT);
       CREATE TABLE member_xp_events(
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         user_id TEXT NOT NULL REFERENCES "user"(id),
         request_id TEXT UNIQUE, source TEXT NOT NULL, amount INTEGER NOT NULL, created_at INTEGER);
       CREATE TABLE member_space_milestones(
         user_id TEXT REFERENCES "user"(id),milestone TEXT,earned_at INTEGER,
         PRIMARY KEY(user_id,milestone));
       CREATE TABLE member_reward_notifications(
         id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT REFERENCES "user"(id),
         kind TEXT, reference TEXT,level INTEGER,created_at INTEGER);
       CREATE TABLE member_recognition_grants(user_id TEXT REFERENCES "user"(id),kind TEXT,recognition_id TEXT,earned_at INTEGER);
       CREATE TABLE member_notification_receipts(user_id TEXT PRIMARY KEY,through_id INTEGER);
       CREATE TABLE member_entitlements(user_id TEXT PRIMARY KEY, entitlement TEXT);
       INSERT INTO "user" VALUES('fixture-member','Synthetic profile');
       INSERT INTO member_reward_notifications(user_id,kind,reference) VALUES('fixture-member','award','first_orbit');
       INSERT INTO member_reward_notifications(user_id,kind,reference) VALUES('fixture-member','award','first_signal');
       INSERT INTO member_reward_notifications(user_id,kind,reference) VALUES('fixture-member','level','evo60-2');
       INSERT INTO member_recognition_grants VALUES('fixture-member','badge','first_orbit',10);
       INSERT INTO member_notification_receipts VALUES('fixture-member',20);
       INSERT INTO member_entitlements VALUES('fixture-member','paid-preserved');
    ''')
    for idx in range(xp):
        d.execute("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,?,?,?)",('fixture-member','synthetic-'+str(idx),'test_button',5,idx))
    for name in ('first_signal','world_shaper')[:milestones]:
        d.execute('INSERT INTO member_space_milestones VALUES(?,?,?)',('fixture-member',name,30))
    for current, backup in zip(
        ('member_xp_events','member_space_milestones','member_reward_notifications','member_notification_receipts'),
        ops.PREVIOUS_TABLES):
        d.execute(f'CREATE TABLE {backup} AS SELECT * FROM {current}')
    d.commit()
    return d


def sql_export(d):
    return ('\n'.join(d.iterdump())+'\n').encode()


class ResetTests(unittest.TestCase):
    def worker_fixture(self, flag='false'):
        return {
            '/deployments': {'deployments':[{'versions':[{'version_id':ops.ACTIVE_APEX_VERSION,'percentage':100}]}]},
            '/versions/'+ops.ACTIVE_APEX_VERSION: {'id':ops.ACTIVE_APEX_VERSION,'resources':{'bindings':[
                {'name':'MEMBER_DB','type':'d1','id':ops.CANONICAL_DB},
                {'name':'COMMUNITY_DB','type':'d1','id':ops.COMMUNITY_DB},
                {'name':'CANONICAL_XP_TEST_ENABLED','type':'plain_text','text':flag}]}},
            '/database/'+ops.CANONICAL_DB: {'uuid':ops.CANONICAL_DB,'name':ops.NAME},
            '/database/'+ops.COMMUNITY_DB: {'uuid':ops.COMMUNITY_DB,'name':'anevum-creator-v1-staging'},
        }

    def check_worker(self, responses, **kwargs):
        def fake_api(path, **_):
            for suffix, value in responses.items():
                if path.endswith(suffix):
                    return value
            self.fail('unexpected endpoint: '+path)
        context={'GITHUB_REPOSITORY':'anevum/anevum-web','GITHUB_REF':'refs/heads/main',
                 'GITHUB_ACTOR':'anevum','GITHUB_SHA':'a'*40}
        with patch.dict(ops.os.environ,context), patch.object(ops,'api',side_effect=fake_api), \
             patch.object(ops,'query',return_value=[{'n':0}]):
            return ops.check_worker_and_database(**kwargs)

    def test_checks_live_version_bindings_without_latest_settings(self):
        self.assertTrue(self.check_worker(self.worker_fixture())['public_version_verified'])

    def test_active_binding_drift_blocks_even_if_other_settings_are_valid(self):
        responses=self.worker_fixture()
        responses['/versions/'+ops.ACTIVE_APEX_VERSION]['resources']['bindings'][0]['id']='wrong-database'
        with self.assertRaises(ops.Blocked):
            self.check_worker(responses)

    def test_prepare_can_inventory_enabled_test_but_execution_requires_disabled(self):
        self.assertTrue(self.check_worker(self.worker_fixture('true'))['xp_test_config_enabled_before_reset'])
        with self.assertRaisesRegex(ops.Blocked,'disable the live XP test endpoint'):
            self.check_worker(self.worker_fixture('true'),require_test_disabled=True)
        self.assertFalse(self.check_worker(self.worker_fixture(),require_test_disabled=True)['xp_test_config_enabled_before_reset'])

    def test_restore_snapshot_and_simulated_reset_preserve_recognition_and_entitlements(self):
        d=fixture()
        raw=sql_export(d)
        restored=ops.sqlite_restore(raw)
        before=ops.snapshot(restored)
        self.assertEqual(before['test_xp'],15)
        self.assertEqual(before['milestones'],2)
        self.assertEqual(before['independent_notifications'],1)
        ops.simulate(restored,before)
        result=ops.snapshot(restored)
        for key in ('xp_events','test_xp','milestones','level_notifications','milestone_notifications'):
            self.assertEqual(result[key],0)
        self.assertEqual(result['independent_notifications'],1)
        self.assertEqual(result['recognitions'],1)
        self.assertEqual(result['receipts'],1)
        self.assertEqual(restored.execute('SELECT entitlement FROM member_entitlements').fetchone()[0],'paid-preserved')
        self.assertEqual(restored.execute(f'SELECT COUNT(*) FROM {ops.AUDIT_TABLE}').fetchone()[0],1)
        self.assertEqual(restored.execute(f'SELECT COUNT(*) FROM {ops.POST_TABLE}').fetchone()[0],1)
        restored.close();d.close()

    def test_reviewed_count_guard_rolls_back_if_event_added(self):
        d=fixture()
        earlier=ops.snapshot(d)
        d.execute("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES('fixture-member','extra','test_button',5,40)")
        d.commit()
        with self.assertRaises(sqlite3.IntegrityError):
            d.executescript('BEGIN IMMEDIATE;\n'+';\n'.join(ops.sql_batch(earlier))+';\nCOMMIT;')
        # At minimum no destructive deletes occurred; SQLite executescript needs explicit rollback.
        self.assertEqual(d.execute('SELECT COUNT(*) FROM member_xp_events').fetchone()[0],4)
        d.rollback();d.close()

    def test_second_reset_refused(self):
        d=fixture()
        ops.simulate(d,ops.snapshot(d))
        with self.assertRaises(sqlite3.OperationalError):
            d.executescript(';\n'.join(ops.sql_batch({'users':1,'xp_events':3,'test_xp':15,'max_event_id':3,'milestones':2,'notifications':3,'level_notifications':1,'milestone_notifications':1,'independent_notifications':1,'recognitions':1,'receipts':1,'ledger_sha256':'a'*64}))+';')
        d.close()

    def test_backup_must_not_have_non_test_xp(self):
        d=fixture()
        d.execute("UPDATE member_xp_events SET source='organic' WHERE id=1")
        d.commit()
        with self.assertRaises(ops.Blocked):
            ops.sqlite_restore(sql_export(d))
        d.close()

    def test_backup_requires_shadow_tables(self):
        d=fixture()
        d.execute(f'DROP TABLE {ops.PREVIOUS_TABLES[0]}')
        d.commit()
        with self.assertRaises(ops.Blocked):
            ops.sqlite_restore(sql_export(d))
        d.close()

    def test_backup_rejects_materialized_xp_table(self):
        d=fixture()
        d.execute('CREATE TABLE member_xp_totals(user_id TEXT PRIMARY KEY,xp INTEGER)')
        d.commit()
        with self.assertRaises(ops.Blocked):
            ops.sqlite_restore(sql_export(d))
        d.close()

    def test_prior_reset_receipt_rejected(self):
        d=fixture()
        d.execute(f'CREATE TABLE {ops.AUDIT_TABLE}(id INTEGER)')
        d.commit()
        with self.assertRaises(ops.Blocked):
            ops.sqlite_restore(sql_export(d))
        d.close()

    def test_no_empty_or_malformed_authorization_counts(self):
        good=ops.snapshot(fixture())
        with self.assertRaises(ops.Blocked):
            ops.sql_batch({**good,'xp_events':-1})
        with self.assertRaises(ops.Blocked):
            ops.sql_batch({**good,'xp_events':0})
        with self.assertRaises(ops.Blocked):
            ops.sql_batch({**good,'users':'1'})

    def test_backup_refuses_privileged_attach(self):
        d=fixture()
        bad=sql_export(d)+b"ATTACH DATABASE ':memory:' AS extra;\n"
        with self.assertRaises(ops.Blocked):
            ops.sqlite_restore(bad)
        d.close()


if __name__ == '__main__':
    unittest.main()
