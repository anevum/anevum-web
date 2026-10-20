#!/usr/bin/env python3
"""Minimal D1-like SQLite bridge for isolated ANEVUM package tests only."""
import json, sys, sqlite3
from pathlib import Path
db_file=sys.argv[1]
mode=sys.argv[2]
migration=Path(__file__).parents[1] / "migrations" / "0002_resource_protection.sql"
base="""
PRAGMA foreign_keys=ON;
CREATE TABLE anevum_package_projects(
 id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,title TEXT NOT NULL,summary TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('game','app','simulation','story')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','published','rejected','suspended','deleted')),
 live_release_id TEXT,draft_release_id TEXT,review_reason TEXT,
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,published_at INTEGER
);
CREATE TABLE anevum_package_releases(
 id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES anevum_package_projects(id),
 version INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('preparing','ready','pending_review','published','rejected','failed','revoked')),
 source_name TEXT NOT NULL,proposed_title TEXT NOT NULL,proposed_summary TEXT NOT NULL,
 proposed_category TEXT NOT NULL,archive_sha256 TEXT,archive_bytes INTEGER NOT NULL,
 expanded_bytes INTEGER NOT NULL,file_count INTEGER NOT NULL,source_key TEXT,
 review_reason TEXT,reviewed_by TEXT,reviewed_at INTEGER,submitted_at INTEGER,created_at INTEGER NOT NULL,
 UNIQUE(project_id,version)
);
CREATE TABLE anevum_package_files(
 release_id TEXT NOT NULL REFERENCES anevum_package_releases(id),
 path TEXT NOT NULL,object_key TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,sha256 TEXT NOT NULL,
 PRIMARY KEY(release_id,path)
);
CREATE TABLE anevum_package_upload_limits(
 owner_id TEXT PRIMARY KEY,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE anevum_package_preview_tokens(
 token_hash TEXT PRIMARY KEY,release_id TEXT NOT NULL REFERENCES anevum_package_releases(id),
 issued_by TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL
);
"""
con=sqlite3.connect(db_file)
con.row_factory=sqlite3.Row
con.execute("PRAGMA foreign_keys=ON")
try:
 if mode=="init":
  con.executescript(base)
  con.executescript(migration.read_text())
  con.executescript((migration.parent / "0003_creator_review_attestations.sql").read_text())
  con.commit()
  print(json.dumps({"ok":True}))
 else:
  req=json.loads(sys.stdin.read())
  commands=req.get("commands",[])
  if mode=="batch":con.execute("BEGIN IMMEDIATE")
  out=[]
  for item in commands:
   cur=con.execute(item["sql"],item.get("params",[]))
   result={"meta":{"changes":max(0,cur.rowcount)}}
   if cur.description:
    rows=[dict(r) for r in cur.fetchall()]
    result.update({"results":rows,"first":rows[0] if rows else None})
   out.append(result)
  con.commit()
  print(json.dumps({"results":out}))
except Exception as e:
 con.rollback()
 print(json.dumps({"error":str(e)}))
 sys.exit(1)
finally:
 con.close()
