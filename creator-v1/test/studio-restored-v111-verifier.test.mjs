// Source-only fixture: never feed protected Cloudflare member data to CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,copyFileSync,rmSync,linkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fixture} from './helpers/canonical-fixture.mjs';
import {verifyOfflineStudioSnapshotPair} from '../ops/verify-studio-v111-restored-snapshot.mjs';

const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const people=[
 {id:'restore-member-a',email:'restore-a@example.invalid',handle:'restore-a'},
 {id:'restore-member-b',email:'restore-b@example.invalid',handle:'restore-b'}
];
const projectIds=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'];
function seed(){
 const f=fixture();
 f.db.exec(migration('0008_private_creator_studio.sql'));
 f.db.exec(migration('0009_private_review_snapshots.sql'));
 for(let i=0;i<people.length;i++){
  const p=people[i];
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(p.id,'Synthetic '+i,p.email);
  f.db.prepare('INSERT INTO "session"(id,expiresAt,token,createdAt,updatedAt,userId) VALUES(?,?,?,?,?,?)')
   .run('session-'+i,999999,'synthetic-token-'+i,100,100,p.id);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(p.id,p.handle,'Synthetic member '+i,100,100);
  f.db.prepare('INSERT INTO member_space_settings(user_id,featured_json) VALUES(?,?)').run(p.id,'[]');
  f.db.prepare('INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,?,?)')
   .run(p.id,'first_signal',100);
  f.db.prepare('INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,?,?,?)')
   .run(p.id,'synthetic-request-'+i,'test_button',5,101);
  f.db.prepare('INSERT INTO member_reward_notifications(user_id,kind,reference,created_at) VALUES(?,?,?,?)')
   .run(p.id,'award','first_signal',101);
  f.db.prepare('INSERT INTO member_notification_receipts(user_id,through_id) VALUES(?,?)')
   .run(p.id,1);
  f.db.prepare("INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .run(projectIds[i],p.id,crypto.randomUUID(),'private-'+i,'Private '+i,
    'Synthetic private project for independent recovery.','','games',100,100);
 }
 f.db.prepare('INSERT INTO member_progression_reset_epoch(epoch,cutoff_event_id,cutoff_at) VALUES(1,2,102)').run();
 f.db.prepare('INSERT INTO member_progression_epoch_milestones(epoch,user_id,milestone,earned_at) VALUES(?,?,?,?)')
  .run(1,people[0].id,'first_signal',102);
 return f;
}
function paths(){
 const dir=mkdtempSync(join(tmpdir(),'anevum-studio-restore-v111-'));
 return {dir,before:join(dir,'before.sqlite'),restored:join(dir,'restored.sqlite'),
  dispose:()=>rmSync(dir,{recursive:true,force:true,maxRetries:4,retryDelay:100})};
}

test('V111 offline snapshot verifier compares synthetic members, sessions, XP, rewards, milestones, profiles and projects',()=>{
 const p=paths(),f=seed();
 let restored;
 try{
  f.db.exec("VACUUM main INTO '"+p.before.replaceAll("'","''")+"'");
  copyFileSync(p.before,p.restored);
  const proof=verifyOfflineStudioSnapshotPair(p.before,p.restored);
  assert.deepEqual(proof,{status:'PASS',distinctLocalFiles:true,readOnly:true,preMigration:true,privateRowsDisclosed:false});
  assert.throws(()=>verifyOfflineStudioSnapshotPair(p.before,p.before),/SAME_FILE_DISALLOWED/);
  const linked=join(p.dir,'same-inode.sqlite');linkSync(p.before,linked);
  assert.throws(()=>verifyOfflineStudioSnapshotPair(p.before,linked),/SAME_FILE_DISALLOWED/);
  f.db.exec(migration('0014_private_studio_file_tree.sql'));
  f.db.prepare('INSERT INTO member_studio_file_nodes(id,project_id,user_id,parent_id,parent_key,name,name_key,kind,content,client_request_id,created_at,updated_at) VALUES(?,?,?,NULL,?,?,?,?,?,?,?,?)')
   .run('cccccccc-cccc-4ccc-8ccc-cccccccccccc',projectIds[0],people[0].id,'','scene.md','scene.md','text','Generated later',crypto.randomUUID(),102,102);
  assert.equal(verifyOfflineStudioSnapshotPair(p.before,p.restored).status,'PASS',
   'Migration of disposable source must not mutate the prior snapshot or restored copy');
  restored=new DatabaseSync(p.restored);
  assert.equal(restored.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('member_studio_file_nodes','member_studio_file_versions')").get().n,0);
  restored.prepare('UPDATE member_studio_projects SET title=? WHERE id=?').run('Unexpected modification',projectIds[1]);
  restored.close();restored=null;
  assert.throws(()=>verifyOfflineStudioSnapshotPair(p.before,p.restored),/DATA_PRESERVATION_MISMATCH/);
 }finally{restored?.close();f.db.close();p.dispose();}
});

test('V111 offline verifier rejects broken foreign keys and post-migration snapshots',()=>{
 const p=paths(),f=seed();
 let other;
 try{
  f.db.exec("VACUUM main INTO '"+p.before.replaceAll("'","''")+"'");
  copyFileSync(p.before,p.restored);
  other=new DatabaseSync(p.restored);
  other.exec('PRAGMA foreign_keys=OFF');
  other.prepare('INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,?,?,?)')
   .run('nonexistent-user','broken-reference','test_button',5,103);
  other.close();other=null;
  assert.throws(()=>verifyOfflineStudioSnapshotPair(p.before,p.restored),/FOREIGN_KEY_CHECK_FAILED/);
  copyFileSync(p.before,p.restored);
  other=new DatabaseSync(p.restored);
  other.exec(migration('0014_private_studio_file_tree.sql'));
  other.close();other=null;
  assert.throws(()=>verifyOfflineStudioSnapshotPair(p.before,p.restored),/V111_MIGRATION_ALREADY_PRESENT/);
 }finally{other?.close();f.db.close();p.dispose();}
});
