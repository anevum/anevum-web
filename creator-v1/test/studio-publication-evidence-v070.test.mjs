import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
 studioPublicationReady,canonicalStudioPublicationConsent,
 publishReviewedExternalStudioMetadata,canonicalPublicStudioCreations
} from '../canonical-auth/studio-publications.mjs';
import {canonicalStudioReview} from '../canonical-auth/studio.mjs';
import {memberRecognitionState} from '../canonical-auth/recognition.mjs';
import {canonicalRecognitionCatalog} from '../canonical-auth/recognition-catalog.mjs';

const uid=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
const now=1780000000,base='https://anevum.com';
const content=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function database(){
 const raw=new DatabaseSync(':memory:');
 raw.exec([
  'PRAGMA foreign_keys=ON;',
  'CREATE TABLE "user"(id TEXT PRIMARY KEY,emailVerified INTEGER NOT NULL DEFAULT 1);',
  'CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY REFERENCES "user"(id),handle TEXT NOT NULL,display_name TEXT NOT NULL,visibility TEXT NOT NULL);',
  "CREATE TABLE member_space_settings(user_id TEXT PRIMARY KEY,featured_json TEXT DEFAULT '[]',show_stats INTEGER NOT NULL DEFAULT 1);",
  'CREATE TABLE member_space_media(user_id TEXT NOT NULL,slot TEXT NOT NULL,data BLOB,PRIMARY KEY(user_id,slot));',
  'CREATE TABLE member_space_milestones(user_id TEXT,milestone TEXT,earned_at INTEGER,PRIMARY KEY(user_id,milestone));',
  'CREATE TABLE member_xp_events(id TEXT PRIMARY KEY,user_id TEXT,amount INTEGER);',
  'CREATE TABLE member_reward_notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL,kind TEXT NOT NULL,reference TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(user_id,kind,reference));',
  'CREATE TABLE member_notification_receipts(user_id TEXT PRIMARY KEY,through_id INTEGER);',
  'CREATE TABLE member_creator_edit_limits(user_id TEXT PRIMARY KEY,window_start INTEGER,requests INTEGER);',
  "INSERT INTO \"user\"(id,emailVerified) VALUES ('owner',1),('reviewer',1),('safety',1),('other',1),('private',1);",
  "INSERT INTO member_creator_profiles(user_id,handle,display_name,visibility) VALUES ('owner','owner_sample','Owner Sample','public'),('reviewer','reviewer_sample','Reviewer Sample','public'),('safety','safety_sample','Safety Sample','public'),('other','other_sample','Other Sample','public'),('private','private_sample','Private Sample','private');",
  "INSERT INTO member_space_settings(user_id) VALUES ('owner'),('reviewer'),('safety'),('other'),('private');"
 ].join('\n'));
 for(const file of [
  'canonical-auth/migrations/0008_private_creator_studio.sql',
  'canonical-auth/migrations/0009_private_review_snapshots.sql',
  'canonical-auth/migrations/0010_player_recognition.sql',
  'canonical-auth/migrations/0011_studio_publication_evidence.sql',
  'canonical-auth/migrations/0012_studio_publication_takedowns.sql'
 ])raw.exec(content(file));
 const db={
  raw,
  prepare(sql){
   const stmt=raw.prepare(sql);
   const api={args:[],bind(...args){api.args=args;return api},
    async first(){return stmt.get(...api.args)??null},
    async all(){return {success:true,results:stmt.all(...api.args)}},
    async run(){
     if(/\bRETURNING\b/i.test(sql)){
      const records=stmt.all(...api.args);
      return {success:true,meta:{changes:records.length},results:records};
     }
     const result=stmt.run(...api.args);
     return {success:true,meta:{changes:result.changes},results:[]};
    }};
   return api;
  },
  async batch(statements){
   raw.exec('BEGIN IMMEDIATE');
   try{
    const results=[];
    for(const stmt of statements)results.push(await stmt.run());
    raw.exec('COMMIT');
    return results;
   }catch(error){raw.exec('ROLLBACK');throw error;}
  }
 };
 return db;
}
const env=db=>({
 MEMBER_DB:db,CANONICAL_CREATOR_STUDIO_ENABLED:'true',
 CANONICAL_STUDIO_PUBLICATION_ENABLED:'true',
 CANONICAL_STUDIO_SAFETY_ENABLED:'true',
 CANONICAL_STUDIO_SAFETY_REVIEWER_IDS:'safety',
 CANONICAL_RECOGNITION_ENABLED:'true',
 CANONICAL_STUDIO_REVIEWER_IDS:'reviewer'
});
const owner=id=>({id,emailVerified:true});
const api=(id,method='GET',body=null)=>new Request(base+'/api/v1/member/studio/projects/'+id+'/publication',{
 method,headers:body?{'content-type':'application/json'}:{},
 body:body?JSON.stringify(body):undefined
});
const reviewBody=(projectId,revision=2)=>({
 projectId,revision,action:'publish_external_metadata',
 reason:'Verified author consent and rights; checked public HTTPS work link and descriptive metadata.',
 rightsChecked:true,contentChecked:true,externalLinkChecked:true
});
function project(db,index=1,{
 user='owner',link='https://creator.example.com/projects/'+index,profile='public'
}={}){
 const id=uid(1000+index),submissionId=uid(2000+index);
 const slug='external-work-'+index;
 const args=[id,user,uid(3000+index),slug,'Original creation '+index,
  'Original reviewed creative work '+index,'Longer content and project description',
  'art',1,'CC BY 4.0',link,null,
  'The author disclosed all AI use as appropriate.','Original authored human contribution; all rights declared.',
  'pending_review',2,now-1000,now-700,now-700];
 db.raw.prepare([
  'INSERT INTO member_studio_projects(',
  'id,user_id,client_request_id,slug,title,summary,description,category,free_to_use,license_name,source_url,demo_url,',
  'ai_disclosure,human_contribution,status,revision,created_at,updated_at,submitted_at)',
  'VALUES('+Array(19).fill('?').join(',')+')'
 ].join('')).run(...args);
 db.raw.prepare([
  'INSERT INTO member_studio_submissions(',
  'id,project_id,user_id,project_revision,slug,title,summary,description,category,free_to_use,',
  'license_name,source_url,demo_url,ai_disclosure,human_contribution,status,submitted_at)',
  'VALUES('+Array(17).fill('?').join(',')+')'
 ].join('')).run(submissionId,id,user,2,slug,'Original creation '+index,
  'Original reviewed creative work '+index,'Longer content and project description',
  'art',1,'CC BY 4.0',link,null,
  'The author disclosed all AI use as appropriate.','Original authored human contribution; all rights declared.',
  'pending_review',now-700);
 return {id,submissionId,revision:2,user};
}
async function consent(db,p,at=now-100){
 return canonicalStudioPublicationConsent(api(p.id,'POST',{
  submissionId:p.submissionId,revision:2,scope:'external_metadata_only',accepted:true
 }),env(db),owner(p.user),p.id,at);
}
async function publish(db,p,at=now){
 return publishReviewedExternalStudioMetadata(db,{
  projectId:p.id,revision:2,reviewerId:'reviewer',reason:reviewBody(p.id).reason,
  rightsChecked:true,contentChecked:true,externalLinkChecked:true,now:at,enabled:true
 });
}
const scalar=(db,q,...a)=>db.raw.prepare(q).get(...a);
test('V070 additive DDL preserves old XP and forbids public file storage',t=>{
 const db=database();t.after(()=>db.raw.close());
 assert.equal(db.raw.prepare("SELECT COUNT(*) c FROM member_xp_events").get().c,0);
 const s=content('canonical-auth/migrations/0011_studio_publication_evidence.sql');
 assert.doesNotMatch(s,/DELETE FROM member_xp_events|DROP TABLE|INSERT INTO member_recognition_grants/);
 for(const name of ['member_studio_publication_consents','member_studio_publication_reviews','member_studio_publications','member_studio_publication_links'])
  assert.ok(s.includes('CREATE TABLE IF NOT EXISTS '+name));
 assert.doesNotMatch(s,/\bstorage_key\b|\br2_key\b|\bexecutable_url\b/);
});
test('metadata publication is closed by default and before consent',async t=>{
 const db=database();t.after(()=>db.raw.close());
 assert.equal(await studioPublicationReady(db),true);
 const p=project(db);
 const closed=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),
  {...env(db),CANONICAL_STUDIO_PUBLICATION_ENABLED:'false'});
 assert.equal(closed.status,404);
 const missing=await publish(db,p);
 assert.equal(missing.ok,false);
 assert.deepEqual((await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),env(db))).json?await (await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),env(db))).json():null,{creations:[],nextCursor:null});
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,0);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_reviews').c,0);
});
test('author consent requires matching, frozen, public, independently reviewable snapshot',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db);
 const wrong=await canonicalStudioPublicationConsent(api(p.id,'POST',{
  submissionId:p.submissionId,revision:3,scope:'external_metadata_only',accepted:true
 }),env(db),owner('owner'),p.id);
 assert.equal(wrong.status,409);
 assert.equal((await consent(db,p)).status,200);
 const view=await canonicalStudioPublicationConsent(api(p.id),env(db),owner('owner'),p.id);
 assert.equal((await view.json()).consented,true);
 assert.equal((await canonicalStudioPublicationConsent(api(p.id),env(db),owner('other'),p.id)).status,404);
 const privateP=project(db,2,{user:'private'});
 assert.equal((await consent(db,privateP)).status,409);
 const fileP=project(db,3);
 db.raw.prepare('INSERT INTO member_studio_submission_assets(submission_id,asset_id,filename,kind,content_type,size_bytes,sha256) VALUES(?,?,?,?,?,?,?)')
 .run(fileP.submissionId,'a'.repeat(32),'uploaded.zip','package','application/zip',1024,'f'.repeat(64));
 assert.equal((await consent(db,fileP)).status,409,'any private attached file blocks metadata-only release');
});
test('published release requires consent, independent evidence, verified profile and reviewer approval',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db);
 assert.equal((await consent(db,p)).status,200);
 const self=await publishReviewedExternalStudioMetadata(db,{
  ...reviewBody(p.id),reviewerId:'owner',now,enabled:true
 });
 assert.equal(self.ok,false);
 const misAttested=await publishReviewedExternalStudioMetadata(db,{
  ...reviewBody(p.id),reviewerId:'reviewer',now,enabled:true,rightsChecked:false
 });
 assert.equal(misAttested.ok,false);
 const reviewed=await canonicalStudioReview(new Request(base+'/api/v1/member/studio/review',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(reviewBody(p.id))
 }),env(db),owner('reviewer'),now);
 assert.equal(reviewed.status,200,await reviewed.clone().text());
 assert.deepEqual(await reviewed.json(),{ok:true,status:'published',delivery:'external-link-only'});
 const awards=await memberRecognitionState(db,'owner');
 assert.deepEqual(awards.earnedBadges.map(b=>b.id),['first_creation']);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE reference='first_creation'").c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_reviews').c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publications').c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_links').c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_xp_events').c,0,'publication badges never mint XP');
 const out=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),env(db));
 assert.equal(out.status,200);
 const data=await out.json();
 assert.equal(data.creations.length,1);
 assert.equal(data.creations[0].handle,'owner_sample');
 assert.equal(data.creations[0].delivery,'external-link-only');
 assert.equal(JSON.stringify(data).includes('reviewer'),false);
 assert.equal(JSON.stringify(data).includes('owner_id'),false);
 assert.equal(JSON.stringify(data).includes('storage_key'),false);
 const detail=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations/'+p.id),env(db));
 assert.equal((await detail.json()).creation.title,'Original creation 1');
 const repeat=await publish(db,p,now+1);
 assert.equal(repeat.ok,false,'review cannot mint duplicate publication or award');
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,1);
});
test('private reviewer, uploads and unpublished work cannot issue creation awards',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db),q=project(db,2),r=project(db,3,{user:'private'});
 for(const x of [p,q,r]){if(x.user!=='private')assert.equal((await consent(db,x)).status,200);}
 const unprivileged=await canonicalStudioReview(new Request(base+'/api/v1/member/studio/review',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(reviewBody(p.id))
 }),env(db),owner('other'),now);
 assert.equal(unprivileged.status,403);
 db.raw.prepare('INSERT INTO member_studio_submission_assets(submission_id,asset_id,filename,kind,content_type,size_bytes,sha256) VALUES(?,?,?,?,?,?,?)')
 .run(q.submissionId,'b'.repeat(32),'locked.webp','image','image/webp',1200,'c'.repeat(64));
 const withAsset=await publish(db,q);
 assert.equal(withAsset.ok,false);
 const hidden=await publish(db,r);
 assert.equal(hidden.ok,false);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publications').c,0);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,0);
});
test('creator withdrawal removes public metadata atomically but preserves an audit of a historical earned mark',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db);
 assert.equal((await consent(db,p)).status,200);
 assert.equal((await publish(db,p)).ok,true);
 const unpub=await canonicalStudioPublicationConsent(api(p.id,'DELETE',{
  submissionId:p.submissionId,revision:2,scope:'external_metadata_only',accepted:true
 }),env(db),owner('owner'),p.id,now+10);
 assert.equal(unpub.status,200,await unpub.clone().text());
 assert.equal((await unpub.json()).publicationStatus,'withdrawn');
 const list=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),env(db));
 assert.deepEqual((await list.json()).creations,[]);
 const detail=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations/'+p.id),env(db));
 assert.equal(detail.status,404);
 assert.ok(scalar(db,'SELECT revoked_at FROM member_studio_publication_consents WHERE submission_id=?',p.submissionId).revoked_at);
 assert.equal(scalar(db,'SELECT status FROM member_studio_publications WHERE project_id=?',p.id).status,'withdrawn');
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,1);
 assert.equal((await publish(db,p,now+50)).ok,false);
});
test('same underlying external release cannot be counted twice through query strings or alternate slugs',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db,1,{link:'https://creator.example.com/work/atlas?v=1'});
 const q=project(db,2,{link:'https://creator.example.com/work/atlas?v=2'});
 assert.equal((await consent(db,p)).status,200);
 assert.equal((await consent(db,q)).status,200);
 assert.equal((await publish(db,p)).ok,true);
 const duplicate=await publish(db,q,now+1);
 assert.equal(duplicate.ok,false);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publications').c,1);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,1);
});
test('catalog creation badges require a live reviewed publication feature and real schema',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const catalog=await canonicalRecognitionCatalog(new Request(base+'/api/v1/public/recognition/catalog'),env(db));
 const response=await catalog.json();
 assert.ok(response.activeBadgeIds.includes('first_creation'));
 assert.ok(response.activeBadgeIds.includes('maker_five'));
 assert.ok(response.activeBadgeIds.includes('maker_twenty'));
 const off=await canonicalRecognitionCatalog(new Request(base+'/api/v1/public/recognition/catalog'),
  {...env(db),CANONICAL_STUDIO_PUBLICATION_ENABLED:'false'});
 assert.ok(!(await off.json()).activeBadgeIds.includes('first_creation'));
});

test('Five Worlds and Architect of Worlds require five and twenty unique reviewed public works',async t=>{
 const db=database();t.after(()=>db.raw.close());
 for(let i=1;i<=20;i++){
  const p=project(db,i,{link:'https://artist.example.com/art/'+i});
  const c=await consent(db,p,now-100+i);
  assert.equal(c.status,200,'submission '+i+' consent');
  const release=await publish(db,p,now+i);
  assert.equal(release.ok,true,'submission '+i+' publication');
  const earned=(await memberRecognitionState(db,'owner')).earnedBadges.map(item=>item.id);
  assert.equal(earned.includes('first_creation'),true,'first published creation persists');
  assert.equal(earned.includes('maker_five'),i>=5,'five distinct reviewed creations required');
  assert.equal(earned.includes('maker_twenty'),i>=20,'twenty distinct reviewed creations required');
 }
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_recognition_grants WHERE user_id='owner' AND granted_by='canonical-studio-publication'").c,3);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_reward_notifications WHERE user_id='owner' AND kind='award'").c,3);
 assert.equal(scalar(db,"SELECT COUNT(*) c FROM member_xp_events").c,0);
 const list=await canonicalPublicStudioCreations(new Request(base+'/api/v1/creations'),env(db));
 assert.equal((await list.json()).creations.length,20);
});
test('Studio staff cannot bypass disabled publication gate or issue release evidence using unreviewed assets',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db);
 assert.equal((await consent(db,p)).status,200);
 const review=reviewBody(p.id);
 const req=()=>new Request(base+'/api/v1/member/studio/review',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(review)
 });
 const disabled=await canonicalStudioReview(req(),{
  ...env(db),CANONICAL_STUDIO_PUBLICATION_ENABLED:'false'
 },owner('reviewer'),now);
 assert.equal(disabled.status,404);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publications').c,0);
 assert.equal((await publishReviewedExternalStudioMetadata(db,{
  ...review,reviewerId:'reviewer',now,enabled:false
 })).ok,false);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,0);
});

test('publication cannot list private IP or reserved-domain destinations',async t=>{
 const db=database();t.after(()=>db.raw.close());
 for(const [i,link] of [
  [1,'https://192.168.1.1/private'],
  [2,'https://127.0.0.1/work'],
  [3,'https://localhost/internal'],
  [4,'https://media.local/file'],
  [5,'https://private.example/demo']
 ]){
  const p=project(db,i,{link});
  const consented=await consent(db,p,now+i);
  assert.equal(consented.status,409,'internal/non-public URL must not be approved: '+link);
 }
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_studio_publication_consents').c,0);
});
test('public metadata permission mutations are rate limited independently of grant issuance',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db,1);
 for(let i=0;i<30;i++){
  const response=await consent(db,p,now+i);
  assert.equal(response.status,200,'first 30 scoped permissions are allowed');
 }
 const blocked=await consent(db,p,now+31);
 assert.equal(blocked.status,429,'31st consent mutation is throttled');
 assert.equal(scalar(db,'SELECT requests FROM member_studio_rate_limits WHERE user_id=? AND action=?','owner','project').requests,30);
 assert.equal(scalar(db,'SELECT COUNT(*) c FROM member_recognition_grants').c,0);
});

test('reviewer queue exposes only scoped consent and excludes published decisions',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const p=project(db,1);
 const q=project(db,2);
 assert.equal((await consent(db,p)).status,200);
 const queue=await canonicalStudioReview(new Request(base+'/api/v1/member/studio/review'),env(db),owner('reviewer'));
 assert.equal(queue.status,200,await queue.clone().text());
 const before=(await queue.json()).projects;
 assert.equal(before.length,2);
 assert.equal(Number(before.find(row=>row.id===p.id)?.metadata_consent),1);
 assert.equal(Number(before.find(row=>row.id===q.id)?.metadata_consent),0);
 assert.equal((await publish(db,p)).ok,true);
 const after=await canonicalStudioReview(new Request(base+'/api/v1/member/studio/review'),env(db),owner('reviewer'));
 assert.equal(after.status,200);
 assert.deepEqual((await after.json()).projects.map(row=>row.id),[q.id]);
 const stale=await canonicalStudioReview(new Request(base+'/api/v1/member/studio/review/'+p.id+'/manifest'),env(db),owner('reviewer'));
 assert.equal(stale.status,409);
});
