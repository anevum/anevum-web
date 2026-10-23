// Disposable rehearsal only. Not a production backup, restore or D1 migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fixture} from './helpers/canonical-fixture.mjs';

const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const member='w111-recovery-fixture';
const projectId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const fileId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

test('W111 disposable pre-migration snapshot restores canonical private projects independently',()=>{
 const dir=mkdtempSync(join(tmpdir(),'anevum-w111-migration-dry-run-'));
 const beforePath=join(dir,'before-migration.sqlite');
 const restoredPath=join(dir,'independent-restore.sqlite');
 const f=fixture();
 let restored;
 try{
  f.db.exec(migration('0008_private_creator_studio.sql'));
  f.db.exec(migration('0009_private_review_snapshots.sql'));
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(member,'Recovery Fixture','recovery@example.invalid');
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(member,'recovery-fixture','Recovery Fixture',100,100);
  f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .run(projectId,member,'dddddddd-dddd-4ddd-8ddd-dddddddddddd','recovery-test-project','Recovery Project',
    'Independent SQLite restore rehearsal, not live member data.','','games',100,100);
  const before=f.db.prepare('SELECT id,user_id,slug,title,revision,status FROM member_studio_projects WHERE id=?').get(projectId);
  assert.equal(before.status,'draft');

  // SQLite writes an actual, isolated file snapshot BEFORE schema mutation.
  // The path is generated locally and never refers to ANEVUM D1 resources.
  f.db.exec("VACUUM main INTO '"+beforePath.replaceAll("'","''")+"'");
  copyFileSync(beforePath,restoredPath);

  f.db.exec(migration('0014_private_studio_file_tree.sql'));
  const folderId='cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
  const create=f.db.prepare('INSERT INTO member_studio_file_nodes(id,project_id,user_id,parent_id,parent_key,name,name_key,kind,content,client_request_id,created_at,updated_at) VALUES(?,?,?,NULL,\'\',?,?,?,?,?,?,?)');
  create.run(folderId,projectId,member,'Scenes','scenes','folder','','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',101,101);
  f.db.prepare('INSERT INTO member_studio_file_nodes(id,project_id,user_id,parent_id,parent_key,name,name_key,kind,content,client_request_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
   .run(fileId,projectId,member,folderId,folderId,'intro.md','intro.md','text','First saved scene',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',101,101);
  const updated=f.db.prepare('UPDATE member_studio_file_nodes SET content=?,revision=revision+1,updated_at=? WHERE id=?');
  for(let i=0;i<14;i++)updated.run('Revision '+i,102+i,fileId);
  assert.equal(f.db.prepare('SELECT count(*) as count FROM member_studio_file_versions WHERE node_id=?').get(fileId).count,12);
  assert.equal(f.db.prepare('SELECT count(*) as count FROM member_studio_file_nodes').get().count,2);
  assert.equal(f.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');

  // A brand-new SQLite handle opens a separate copied artifact, proving the
  // original canonical project survives an isolated pre-migration restore.
  restored=new DatabaseSync(restoredPath);
  assert.deepEqual(restored.prepare('SELECT id,user_id,slug,title,revision,status FROM member_studio_projects WHERE id=?').get(projectId),before);
  assert.equal(restored.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('member_studio_file_nodes','member_studio_file_versions')").get().count,0);
  assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{
  restored?.close();
  f.db.close();
  rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
});
