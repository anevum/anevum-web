#!/usr/bin/env python3
"""Manual-only ANEVUM XP reset. No operations occur unless explicit mode is supplied.

Prepare: export canonical D1, restore-test in isolated SQLite, encrypt artifact.
Execute: compare a successful prepare archive with a fresh encrypted snapshot,
         then apply a one-time guarded D1 batch; fail closed on any drift.

Never log Cloudflare tokens, signed URLs, raw SQL exports, user IDs or PII.
Never call this on a PR event. A separate exact-SHA/manual GitHub workflow is
responsible for approval and backup artifact custody.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ACCOUNT = '2f7ee83107240152097efd956a4e8335'
CANONICAL_DB = 'e1d29049-c83b-4534-8355-dc1fa36ba6d8'
COMMUNITY_DB = 'fa96e36d-6257-4883-bf15-074947e11a13'
APEX = 'anevum-apex-prelaunch-gateway'
ACTIVE_APEX_VERSION = '93cc7f07-cf39-457e-af69-c9f6f4c02d25'
NAME = 'anevum-canonical-member-staging'
AUDIT_TABLE = 'ops_progression_reset_20261021_receipt'
POST_TABLE = 'ops_progression_reset_20261021_assertions'
TEST_TRIGGER = 'ops_xp_test_retired_20261021'
PREVIOUS_TABLES = [
    'ops_xp_reset_20261021_events',
    'ops_xp_reset_20261021_milestones',
    'ops_xp_reset_20261021_notifications',
    'ops_xp_reset_20261021_receipts',
]
MAX_EXPORT = 96 * 1024 * 1024
COUNT_QUERY = '''SELECT
  (SELECT COUNT(*) FROM "user") AS users,
  (SELECT COUNT(*) FROM member_xp_events) AS xp_events,
  (SELECT COALESCE(SUM(amount),0) FROM member_xp_events) AS test_xp,
  (SELECT COALESCE(MAX(id),0) FROM member_xp_events) AS max_event_id,
  (SELECT COUNT(*) FROM member_space_milestones) AS milestones,
  (SELECT COUNT(*) FROM member_reward_notifications) AS notifications,
  (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='level') AS level_notifications,
  (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference IN ('first_signal','world_shaper')) AS milestone_notifications,
  (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference NOT IN ('first_signal','world_shaper')) AS independent_notifications,
  (SELECT COUNT(*) FROM member_recognition_grants) AS recognitions,
  (SELECT COUNT(*) FROM member_notification_receipts) AS receipts'''
LEDGER_TABLES = ('member_xp_events', 'member_space_milestones', 'member_reward_notifications')

class Blocked(Exception):
    pass


def require(ok: bool, reason: str):
    if not ok:
        raise Blocked(reason)


def api(path: str, *, method='GET', data=None, key='d1'):
    require(path.startswith('/accounts/' + ACCOUNT + '/'), 'unexpected Cloudflare account')
    token_name = 'CLOUDFLARE_API_TOKEN' if key == 'worker' else 'CLOUDFLARE_D1_TOKEN'
    token = os.environ.get(token_name, '')
    require(len(token) > 20, 'scoped Cloudflare token unavailable')
    body = json.dumps(data, separators=(',', ':')).encode('utf-8') if data is not None else None
    req = Request('https://api.cloudflare.com/client/v4' + path, data=body, method=method,
                  headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read(8 * 1024 * 1024)
        parsed = json.loads(raw)
    except Exception as exc:
        raise Blocked('Cloudflare request failed or timed out') from None
    require(isinstance(parsed, dict) and parsed.get('success') is True and not parsed.get('errors'),
            'Cloudflare API did not confirm success')
    return parsed['result']


def d1_path(database=CANONICAL_DB):
    require(database in (CANONICAL_DB, COMMUNITY_DB), 'unexpected D1 identifier')
    return f'/accounts/{ACCOUNT}/d1/database/{database}'


def query(sql: str, database=CANONICAL_DB):
    result = api(d1_path(database) + '/query', method='POST', data={'sql': sql})
    require(isinstance(result, list) and result and all(x.get('success') is True for x in result),
            'D1 SQL query failed')
    return result[-1].get('results', [])


def check_worker_and_database(*, require_test_disabled=False):
    require(os.environ.get('GITHUB_REPOSITORY') == 'anevum/anevum-web' and
            os.environ.get('GITHUB_REF') == 'refs/heads/main' and
            os.environ.get('GITHUB_ACTOR') == 'anevum' and
            re.fullmatch('[a-f0-9]{40}', os.environ.get('GITHUB_SHA', '')) is not None,
            'manual verified GitHub context required')
    deployment = api(f'/accounts/{ACCOUNT}/workers/scripts/{APEX}/deployments', key='worker')
    deployed = deployment.get('deployments', [])
    require(bool(deployed), 'live Worker deployment missing')
    versions = deployed[0].get('versions', [])
    require(len([v for v in versions if v.get('percentage') == 100 and
                 v.get('version_id') == ACTIVE_APEX_VERSION]) == 1 and
            all(v.get('percentage') in (0,100) for v in versions),
            'public apex Worker version drifted; reset paused')
    # Settings describes the latest upload, which may be an inactive release.
    version = api(f'/accounts/{ACCOUNT}/workers/scripts/{APEX}/versions/{ACTIVE_APEX_VERSION}', key='worker')
    require(version.get('id') == ACTIVE_APEX_VERSION, 'unexpected live Worker identity')
    bindings = version.get('resources', {}).get('bindings', [])
    for name, identifier in [('MEMBER_DB', CANONICAL_DB), ('COMMUNITY_DB', COMMUNITY_DB)]:
        matches = [v for v in bindings if v.get('name') == name and v.get('type') == 'd1' and
                   (v.get('id') or v.get('database_id')) == identifier]
        require(len(matches) == 1, 'production database binding drifted')
    flag = [v for v in bindings if v.get('name') == 'CANONICAL_XP_TEST_ENABLED' and v.get('type') == 'plain_text']
    require(len(flag) == 1 and flag[0].get('text') in ('true', 'false'),
            'unrecognized XP test configuration')
    require(not require_test_disabled or flag[0]['text'] == 'false',
            'disable the live XP test endpoint before staging or executing reset')
    db = api(d1_path())
    require(db.get('uuid') == CANONICAL_DB and db.get('name') == NAME,
            'unexpected canonical database identity')
    community = api(d1_path(COMMUNITY_DB))
    require(community.get('uuid') == COMMUNITY_DB and community.get('name') == 'anevum-creator-v1-staging',
            'unexpected community database identity')
    require(int(query('SELECT COUNT(*) AS n FROM community_xp_events', COMMUNITY_DB)[0]['n']) == 0,
            'separate community XP ledger is not empty; reset must be redesigned')
    return {'canonical_database_verified': True, 'public_version_verified': True,
            'xp_test_config_enabled_before_reset': flag[0]['text'] == 'true'}


def authorizer(action, arg1, arg2, _dbname, _source):
    if action in (sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH):
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_FUNCTION and str(arg2).lower() == 'load_extension':
        return sqlite3.SQLITE_DENY
    if action == sqlite3.SQLITE_PRAGMA and str(arg1).lower() == 'writable_schema' and str(arg2).lower() in ('on','1'):
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK


def sqlite_restore(raw: bytes):
    require(0 < len(raw) <= MAX_EXPORT, 'export is missing or too large')
    try:
        source = raw.decode('utf-8-sig', errors='strict')
    except UnicodeError:
        raise Blocked('export is not UTF-8 SQL') from None
    db = sqlite3.connect(':memory:')
    db.row_factory = sqlite3.Row
    db.set_authorizer(authorizer)
    try:
        db.executescript(source)
        db.execute('PRAGMA foreign_keys=ON')
        require([tuple(x) for x in db.execute('PRAGMA integrity_check')] == [('ok',)],
                'restored SQLite integrity check failed')
        require(not db.execute('PRAGMA foreign_key_check').fetchall(),
                'restored foreign key check failed')
        tables = {x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        needed = set(LEDGER_TABLES) | {
            'user','member_recognition_grants','member_notification_receipts',*PREVIOUS_TABLES
        }
        require(needed <= tables, 'restore is missing required canonical or recovery tables')
        require('member_xp_totals' not in tables, 'materialized XP schema changed; review required')
        require(AUDIT_TABLE not in tables and POST_TABLE not in tables,
                'reset has already been attempted; never run it twice')
        require(not db.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?",(TEST_TRIGGER,)).fetchone(),
                'test blocker trigger already exists; investigate earlier reset')
        require(not db.execute("SELECT 1 FROM member_xp_events WHERE source!='test_button' OR amount!=5 LIMIT 1").fetchone(),
                'XP ledger includes non-test contributions')
        for current, backup in zip(
            ('member_xp_events','member_space_milestones','member_reward_notifications','member_notification_receipts'),
            PREVIOUS_TABLES,
        ):
            require(db.execute(f'SELECT COUNT(*) FROM {backup}').fetchone()[0] >=
                    db.execute(f'SELECT COUNT(*) FROM {current}').fetchone()[0] or current == 'member_reward_notifications',
                    'in-database backup count is lower than live ledger')
        return db
    except (sqlite3.Error, Blocked):
        db.close()
        raise Blocked('backup restoration or schema verification failed') from None


def snapshot(db):
    counts = dict(db.execute(COUNT_QUERY).fetchone())
    require(counts['users'] > 0, 'no member rows: unexpected database')
    h = hashlib.sha256()
    for table, order in (
        ('member_xp_events','id'),
        ('member_space_milestones','user_id,milestone'),
        ('member_reward_notifications','id'),
    ):
        h.update(table.encode())
        for row in db.execute(f'SELECT * FROM {table} ORDER BY {order}'):
            h.update(json.dumps(tuple(row),separators=(',',':'),ensure_ascii=False).encode('utf-8'))
    return counts | {'ledger_sha256': h.hexdigest()}


def remote_counts():
    rows = query(COUNT_QUERY)
    require(len(rows) == 1, 'canonical D1 counts could not be read')
    return {key: int(value) for key, value in rows[0].items()}


def download_export():
    path = d1_path() + '/export'
    progress = api(path, method='POST', data={'output_format':'polling'})
    for attempt in range(26):
        if progress.get('status') == 'complete':
            break
        require(progress.get('status') == 'active', 'D1 export stopped unexpectedly')
        bookmark = progress.get('at_bookmark')
        require(isinstance(bookmark, str) and len(bookmark) > 10, 'invalid D1 bookmark')
        time.sleep(2)
        progress = api(path,method='POST',data={'output_format':'polling','current_bookmark':bookmark})
    require(progress.get('status') == 'complete', 'D1 export not completed')
    signed_url = progress.get('result',{}).get('signed_url', '')
    u = urlsplit(signed_url)
    require(u.scheme=='https' and u.hostname is not None and
            (u.hostname.endswith('.r2.cloudflarestorage.com')) and
            u.username is None and u.password is None,
            'Cloudflare export URL is not a trusted R2 endpoint')
    req = Request(signed_url,headers={'Accept':'application/octet-stream'})
    try:
        with urlopen(req,timeout=60) as resp:
            raw = resp.read(MAX_EXPORT + 1)
    except Exception:
        raise Blocked('D1 export download failed') from None
    require(len(raw)<=MAX_EXPORT, 'D1 export exceeds download limit')
    return raw, progress.get('at_bookmark')


def encrypt(raw: bytes, filename: Path):
    key = os.environ.get('ANEVUM_XP_RESET_BACKUP_FERNET_KEY','')
    require(len(key) == 44, 'new reset backup Fernet secret missing')
    from cryptography.fernet import Fernet
    try:
        cipher = Fernet(key.encode('ascii'))
        sealed = cipher.encrypt(raw)
        require(cipher.decrypt(sealed) == raw, 'encryption round-trip failed')
    except Exception:
        raise Blocked('backup encryption failed') from None
    require(filename.parent.is_dir() and not filename.exists(), 'output backup location unavailable')
    fd=os.open(filename,os.O_CREAT|os.O_WRONLY|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as dest:
        dest.write(sealed)


def decrypt(filename: Path):
    require(filename.is_file() and not filename.is_symlink() and filename.stat().st_size <= MAX_EXPORT * 2,
            'encrypted archive missing or oversized')
    key=os.environ.get('ANEVUM_XP_RESET_BACKUP_FERNET_KEY','')
    require(len(key)==44,'reset backup key missing')
    from cryptography.fernet import Fernet
    try:
        return Fernet(key.encode('ascii')).decrypt(filename.read_bytes())
    except Exception:
        raise Blocked('encrypted archive cannot be recovered') from None


def write_report(path, report):
    p=Path(path)
    require(p.parent.is_dir() and not p.exists(),'audit output path unavailable')
    fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as out:
        json.dump(report,out,sort_keys=True,indent=2)
        out.write('\n')


def prepared(archive: Path, report_path: Path):
    worker=check_worker_and_database()
    raw, bookmark=download_export()
    db=sqlite_restore(raw)
    try:
        counts=snapshot(db)
    finally:
        db.close()
    assert_remote_matches(counts)
    encrypt(raw,archive)
    report={**worker,**counts,'status':'ENCRYPTED_PREPARE_SQLITE_RESTORE_VERIFIED',
            'backup_sha256':hashlib.sha256(raw).hexdigest(), 'd1_bookmark':bookmark,
            'reset_performed':False}
    write_report(report_path,report)
    return report


def assert_remote_matches(snapshot_values):
    actual=remote_counts()
    require(all(actual[k]==snapshot_values[k] for k in actual),
            'live progression changed during export; run preparation again')


def sql_batch(expected):
    """One guarded, one-time D1 batch. Values are integer snapshot counts only."""
    for k in ('users','xp_events','test_xp','max_event_id','milestones','notifications',
              'level_notifications','milestone_notifications','independent_notifications','recognitions','receipts'):
        require(type(expected.get(k)) is int and expected[k]>=0 and expected[k]<10**12,
                'invalid reviewed count')
    require(expected['xp_events']>0 and expected['milestones']>0,
            'expected pre-reset progression absent; do not execute a second time')
    specs = [
        ('users', '"user"'),('xp_events','member_xp_events'),
        ('milestones','member_space_milestones'),
        ('notifications','member_reward_notifications'),
        ('recognitions','member_recognition_grants'),
        ('receipts','member_notification_receipts')
    ]
    extras=[
        ('test_xp','SELECT COALESCE(SUM(amount),0) FROM member_xp_events'),
        ('max_event_id','SELECT COALESCE(MAX(id),0) FROM member_xp_events'),
        ('level_notifications',"SELECT COUNT(*) FROM member_reward_notifications WHERE kind='level'"),
        ('milestone_notifications',"SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference IN ('first_signal','world_shaper')"),
        ('independent_notifications',"SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference NOT IN ('first_signal','world_shaper')"),
    ]
    guards=[f'{k} INTEGER NOT NULL CHECK ({k}={expected[k]})' for k in expected if k != 'ledger_sha256']
    fields=', '.join(k for k in expected if k!='ledger_sha256')
    exprs=[]
    for k in expected:
        if k == 'ledger_sha256':continue
        tab=next((t for x,t in specs if x==k),None)
        s=next((query for x,query in extras if x==k),None)
        exprs.append(f'(SELECT COUNT(*) FROM {tab})' if tab else f'({s})')
    return [
        # If table already exists or any expected count drifted, fail before deletes.
        f'CREATE TABLE {AUDIT_TABLE} (id INTEGER PRIMARY KEY CHECK(id=1), {", ".join(guards)}, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
        f'INSERT INTO {AUDIT_TABLE} (id,{fields}) SELECT 1,{",".join(exprs)}',
        # Database-level write cutover blocks all old /xp-test routes, regardless
        # of the Worker feature flag. Future organic XP requires a reviewed migration.
        f"CREATE TRIGGER {TEST_TRIGGER} BEFORE INSERT ON member_xp_events BEGIN SELECT RAISE(ABORT,'XP test retired'); END",
        'DELETE FROM member_xp_events',
        'DELETE FROM member_space_milestones',
        "DELETE FROM member_reward_notifications WHERE kind='level' OR (kind='award' AND reference IN ('first_signal','world_shaper'))",
        f'''CREATE TABLE {POST_TABLE} (id INTEGER PRIMARY KEY CHECK(id=1),
             xp_events INTEGER NOT NULL CHECK(xp_events=0),
             milestones INTEGER NOT NULL CHECK(milestones=0),
             level_notifications INTEGER NOT NULL CHECK(level_notifications=0),
             milestone_notifications INTEGER NOT NULL CHECK(milestone_notifications=0),
             independent_notifications INTEGER NOT NULL CHECK(independent_notifications={expected['independent_notifications']}),
             recognitions INTEGER NOT NULL CHECK(recognitions={expected['recognitions']}),
             members INTEGER NOT NULL CHECK(members={expected['users']}))''',
        f'''INSERT INTO {POST_TABLE}(id,xp_events,milestones,level_notifications,milestone_notifications,independent_notifications,recognitions,members)
             SELECT 1,(SELECT COUNT(*) FROM member_xp_events),
             (SELECT COUNT(*) FROM member_space_milestones),
             (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='level'),
             (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference IN ('first_signal','world_shaper')),
             (SELECT COUNT(*) FROM member_reward_notifications WHERE kind='award' AND reference NOT IN ('first_signal','world_shaper')),
             (SELECT COUNT(*) FROM member_recognition_grants),
             (SELECT COUNT(*) FROM "user")''',
    ]


def simulate(db, counts):
    db.executescript('BEGIN IMMEDIATE;\n' + ';\n'.join(sql_batch(counts)) + ';\nCOMMIT;')
    values=dict(db.execute(COUNT_QUERY).fetchone())
    require(values['xp_events']==values['test_xp']==values['milestones']==0 and
            values['level_notifications']==values['milestone_notifications']==0 and
            values['users']==counts['users'] and
            values['recognitions']==counts['recognitions'] and
            values['independent_notifications']==counts['independent_notifications'],
            'isolated reset simulation produced unexpected data')
    try:
        db.execute("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES('fake','fake','test_button',5,0)")
    except sqlite3.DatabaseError as exc:
        require('XP test retired' in str(exc), 'old XP test was blocked for the wrong reason')
    else:
        raise Blocked('test XP insertion was not blocked in simulation')


def execute(previous_backup: Path, fresh_backup: Path, report_path: Path, expected_digest: str):
    require(re.fullmatch('[a-f0-9]{64}',expected_digest) is not None, 'invalid approved digest')
    worker=check_worker_and_database(require_test_disabled=True)
    old=sqlite_restore(decrypt(previous_backup))
    try:
        previous=snapshot(old)
    finally:
        old.close()
    require(previous['ledger_sha256']==expected_digest, 'prepared review digest mismatch')
    current_raw,bookmark=download_export()
    current=sqlite_restore(current_raw)
    try:
        fresh=snapshot(current)
        require(fresh==previous, 'XP ledger changed after approved backup; rerun preparation')
        assert_remote_matches(fresh)
        # Verify exact script and postconditions without touching a live database.
        simulate(current, fresh)
    finally:
        current.close()
    # Caller uploads this encrypted file and independently verifies the artifact
    # BEFORE invoking execute-live. This function never writes to D1.
    encrypt(current_raw,fresh_backup)
    report={**worker,**fresh,'status':'EXECUTION_SNAPSHOT_RESTORE_TESTED',
            'backup_sha256':hashlib.sha256(current_raw).hexdigest(),'d1_bookmark':bookmark,
            'reset_performed':False}
    write_report(report_path,report)
    return report


def execute_live(previous_backup: Path, fresh_backup: Path, expected_digest: str, report_path: Path):
    require(re.fullmatch('[a-f0-9]{64}',expected_digest) is not None, 'invalid approved digest')
    check_worker_and_database(require_test_disabled=True)
    old=sqlite_restore(decrypt(previous_backup))
    fresh_db=sqlite_restore(decrypt(fresh_backup))
    try:
        before=snapshot(old)
        fresh=snapshot(fresh_db)
    finally:
        old.close();fresh_db.close()
    require(fresh==before and before['ledger_sha256']==expected_digest,
            'backups no longer agree with reviewed XP baseline')
    assert_remote_matches(fresh)
    # Cloudflare HTTP D1 query accepts multi-statement SQL as one batch.
    # No custom BEGIN/COMMIT: D1 handles transactional batch execution.
    batch=sql_batch(fresh)
    result=api(d1_path()+'/query',method='POST',data={'batch':[{'sql':stmt} for stmt in batch]})
    require(isinstance(result,list) and len(result)==len(batch) and
            all(item.get('success') is True for item in result),
            'D1 reset response inconclusive; DO NOT RETRY; inspect audit receipt')
    actual=remote_counts()
    require(actual['users']==fresh['users'] and
            actual['xp_events']==actual['test_xp']==actual['milestones']==0 and
            actual['level_notifications']==actual['milestone_notifications']==0 and
            actual['independent_notifications']==fresh['independent_notifications'] and
            actual['recognitions']==fresh['recognitions'] and
            actual['receipts']==fresh['receipts'],
            'post-reset D1 verification failed; do not rerun')
    rows=query(f"SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name='{TEST_TRIGGER}'")
    require(int(rows[0]['n'])==1,'old test XP write path was not permanently blocked')
    rows=query(f'SELECT COUNT(*) AS n FROM {AUDIT_TABLE}')
    require(int(rows[0]['n'])==1,'audit receipt was not retained')
    report={**actual,'status':'CANONICAL_PROGRESSION_RESET_CONFIRMED',
            'reset_performed':True,'legacy_test_writes_blocked':True,
            'preserved_independent_recognition':True,
            'source_sha':os.environ['GITHUB_SHA']}
    write_report(report_path, report)
    return report


def main():
    parser=argparse.ArgumentParser(description='Guarded ANEVUM XP operations')
    parser.add_argument('mode', choices=('prepare','stage','execute','verify-archive'))
    parser.add_argument('--archive',type=Path)
    parser.add_argument('--previous-backup',type=Path)
    parser.add_argument('--report',type=Path)
    parser.add_argument('--expected-digest',default='')
    args=parser.parse_args()
    require(args.report is not None or args.mode=='verify-archive', 'report output required')
    if args.mode=='prepare':
        require(args.archive is not None,'encrypted export destination required')
        result=prepared(args.archive,args.report)
    elif args.mode=='stage':
        require(args.archive is not None and args.previous_backup is not None,'two backups required')
        result=execute(args.previous_backup,args.archive,args.report,args.expected_digest)
    elif args.mode=='execute':
        require(args.archive is not None and args.previous_backup is not None,'two backups required')
        result=execute_live(args.previous_backup,args.archive,args.expected_digest,args.report)
    else:
        db=sqlite_restore(decrypt(args.archive))
        try:
            result={'status':'ENCRYPTED_D1_ARCHIVE_RESTORED','counts':snapshot(db)}
        finally:
            db.close()
    print(json.dumps(result,sort_keys=True))


if __name__=='__main__':
    try:
        main()
    except Exception:
        # No traceback or raw SQL or sensitive Cloudflare exception in runner logs.
        print('XP_RESET_BLOCKED: operation failed a security or recovery gate',file=sys.stderr)
        sys.exit(2)
