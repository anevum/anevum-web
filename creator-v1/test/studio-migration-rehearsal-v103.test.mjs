/** Disposable SQLite backup/restore rehearsal; never connects to live D1. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,readFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalStudio} from '../canonical-auth/studio.mjs';

test('0012 and 0013 preserve accounts/projects and restore from a pre-migration backup',async()=>{
 const f=fixture(),dir=mkdtempSync(join(tmpdir(),'anevum-schema-rehearsal-'));
 try{
  for(const name of ['0008_private_creator_studio.sql','0009_private_review_snapshots.sql'])
   f.db.exec(readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8'));
  for(const id of ['owner','creator','reviewer']){
   f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)').run(id,id,id+'@fixture.invalid');
   f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run(id,id,id,1,1);
  }
  const draft={slug:'preserved-work',title:'Preserved private work',summary:'A private project that must survive schema rollout.',description:'Private draft before migration',category:'writing',freeToUse:true,license:'',sourceUrl:null,demoUrl:null,aiDisclosure:'',humanContribution:''};
  const response=await canonicalStudio(new Request('https://a.anevum.com/api/v1/member/studio/projects',{
   method:'POST',headers:{origin:'https://a.anevum.com','content-type':'application/json'},
   body:JSON.stringify({clientRequestId:crypto.randomUUID(),draft})
  }),{...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true'},{id:'creator',emailVerified:true});
  assert.equal(response.status,201,await response.clone().text());
  const tables=['user','member_creator_profiles','member_studio_projects','member_studio_assets','member_studio_submissions'];
  const snapshot=db=>Object.fromEntries(tables.map(name=>[name,db.prepare('SELECT * FROM "'+name+'" ORDER BY rowid').all()]));
  const baseline=snapshot(f.db),backup=join(dir,'before.sqlite');
  f.db.prepare('VACUUM main INTO ?').run(backup);
  for(const [migration,ledger] of [['0012_verified_designations_v093.sql','member_role_grants'],['0013_workbench_alpha_access.sql','member_workbench_access']]){
   const path=join(dir,migration+'.sqlite');copyFileSync(backup,path);
   const staged=new DatabaseSync(path);staged.exec('PRAGMA foreign_keys=ON');
   try{
    const sql=readFileSync(new URL('../canonical-auth/migrations/'+migration,import.meta.url),'utf8');
    staged.exec(sql);staged.exec(sql); // retries are additive and idempotent
    assert.deepEqual(snapshot(staged),baseline,migration+' changed existing private data');
    assert.equal(staged.prepare('SELECT COUNT(*) AS n FROM '+ledger).get().n,0,'Migration must not issue access or marks');
    assert.deepEqual(staged.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.equal(staged.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    if(ledger==='member_workbench_access'){
     staged.prepare('INSERT INTO member_workbench_access VALUES(?,1,1,1000,?,1,?)').run('creator','owner','Disposable rehearsal grant');
     assert.equal(staged.prepare('SELECT COUNT(*) AS n FROM member_workbench_access_log').get().n,1);
     staged.exec('BEGIN');staged.exec("UPDATE member_workbench_access SET enabled=0,revision=2 WHERE member_id='creator'");staged.exec('ROLLBACK');
     assert.equal(staged.prepare('SELECT revision FROM member_workbench_access').get().revision,1);
     assert.equal(staged.prepare('SELECT COUNT(*) AS n FROM member_workbench_access_log').get().n,1,'Grant and audit rollback together');
    }
   }finally{staged.close();}
   const restored=join(dir,'restored-'+migration+'.sqlite');copyFileSync(backup,restored);
   const db=new DatabaseSync(restored);
   try{
    assert.deepEqual(snapshot(db),baseline);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name=?").get(ledger).n,0);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
   }finally{db.close();}
  }
 }finally{f.db.close();rmSync(dir,{recursive:true,force:true});}
});
