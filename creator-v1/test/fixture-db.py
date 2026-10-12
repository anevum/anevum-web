"""Isolated synthetic SQLite fixtures; never reads a Cloudflare database."""
import json, sqlite3, sys
path, operation = sys.argv[1:3]
db = sqlite3.connect(path)
db.row_factory = sqlite3.Row
if operation == 'init':
    db.executescript('''
    CREATE TABLE creator_profiles (member_id TEXT PRIMARY KEY, handle TEXT, display_name TEXT, status TEXT, is_staff INTEGER);
    CREATE TABLE projects (id TEXT PRIMARY KEY, owner_member_id TEXT, slug TEXT, title TEXT, summary TEXT, description TEXT,
        category TEXT, status TEXT, source_url TEXT, demo_url TEXT, free_to_use INTEGER, license_name TEXT,
        published_at TEXT, ai_disclosure TEXT, human_contribution TEXT);
    INSERT INTO creator_profiles VALUES ('member-private-1','fixture','Fixture Creator','active',1),('member-private-2','suspended','Suspended','suspended',0);
    ''')
    records = [
        ('a','member-private-1','Plain tool','tools','published','2026-01-01'),
        ('b','member-private-1','Private draft','games','draft','2026-01-01'),
        ('c','member-private-2','Suspended owner','research','published','2026-01-01'),
        ('d','member-private-1','Future release','creative','published','2999-01-01'),
        ('e','member-private-1','Missing timestamp','learning','published',None),
        ('f','member-private-1','Archived release','research','archived','2026-01-01'),
        ('g','member-private-1','100% Tool','tools','published','2026-01-01'),
        ('h','member-private-1','under_score','games','published','2026-01-01'),
        ('i','member-private-1','<img src=x onerror=alert(1)>','tools','published','2026-01-01'),
    ]
    for ident, owner, title, category, status, published in records:
        db.execute('INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (ident,owner,ident,title,'A synthetic test record.','Plain text <script>alert(1)</script>.',category,status,'https://github.com/fixture/project','javascript:alert(1)',1,'MIT',published,'Disclosed test AI use.','Fixture contribution.'))
    db.commit()
    print(json.dumps({'status':'created'}))
else:
    payload = json.load(sys.stdin)
    rows = db.execute(payload['sql'], payload.get('params',[])).fetchall()
    print(json.dumps({'success':True,'results':[dict(x) for x in rows]}))
db.close()
