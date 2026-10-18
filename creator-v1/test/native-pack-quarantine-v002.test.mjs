// ANEVUM Native Packs V002 -- synthetic Better Auth + SQLite + private R2 acceptance.
// No real accounts, payments, Worker deployment, browser storage or public publishing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {createNativePack} from '../web/src/lib/anevum-native-pack.ts';
import {NATIVE_PACK_MIME,inspectNativePackForQuarantine} from '../canonical-auth/native-pack-quarantine.mjs';

const ORIGIN='https://a.anevum.com';
const ROOT='/api/v1/member/studio/projects';
const MIGRATION=readFileSync(new URL('../canonical-auth/migrations/0008_private_creator_studio.sql',import.meta.url),'utf8');
const REVIEW_MIGRATION=readFileSync(new URL('../canonical-auth/migrations/0009_private_review_snapshots.sql',import.meta.url),'utf8');
const alice={id:'native-pilot-alice',name:'Native Alice',email:'alice@fixture.invalid',emailVerified:true};
const bob={id:'native-pilot-bob',name:'Native Bob',email:'bob@fixture.invalid',emailVerified:true};
const wire=async response=>response.json();
const HEADER=(method,who)=>({
 accept:'application/json',
 ...(who?{cookie:'__Secure-anevum_can_stage.session_token=native-'+who}:{}),
 ...(['GET','HEAD'].includes(method)?{}:{origin:ORIGIN,'sec-fetch-site':'same-origin'})
});
function setup({native=false,uploads=true,allowed='native-pilot-alice'}={}){
 const f=fixture();
 f.db.exec(MIGRATION);f.db.exec(REVIEW_MIGRATION);
 for(const member of [alice,bob]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(member.id,member.name,member.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(member.id,member===alice?'native_alice':'native_bob',member.name,100,100);
 }
 const objects=new Map();
 const store={
  async get(key){const data=objects.get(key);return data?{size:data.byteLength,body:new Blob([data]).stream()}:null;},
  async put(key,data){objects.set(key,new Uint8Array(data));},
  async delete(key){objects.delete(key);}
 };
 const env={...f.env,MEMBER_DB:f.env.MEMBER_DB,CANONICAL_CREATOR_STUDIO_ENABLED:'true',
  CANONICAL_CREATOR_UPLOADS_ENABLED:uploads?'true':'false',
  CANONICAL_CREATOR_NATIVE_PACK_UPLOADS_ENABLED:native?'true':'false',
  CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS:allowed,
  CANONICAL_STUDIO_REVIEWER_IDS:bob.id,CREATOR_ASSETS:store
 };
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const key=headers.get('cookie')||'';
  const member=key.includes('native-alice')?alice:key.includes('native-bob')?bob:null;
  return member?{user:member,session:{id:'fixture'}}:null;
 }}})});
 async function call(path=ROOT,method='GET',who='alice',data){
  const headers=new Headers(HEADER(method,who));
  let body;
  if(data!==undefined){
   if(data instanceof Uint8Array){headers.set('content-type','application/octet-stream');body=data;}
   else {headers.set('content-type','application/json');body=JSON.stringify(data);}
  }
  return worker.fetch(new Request(ORIGIN+path,{method,headers,body}),env);
 }
 return {env,objects,call,close:()=>f.db.close(),db:f.db};
}
function project(category,tag){
 return {slug:'native-'+category+'-'+tag,title:'Native '+category+' '+tag,
  summary:'A portable original work for private native review',description:'Private creator draft',
  category,freeToUse:true,license:'CC BY 4.0',sourceUrl:null,demoUrl:null,
  aiDisclosure:'No AI contribution to this fixture',
  humanContribution:'Created by the isolated synthetic fixture author'};
}
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const wav=Uint8Array.from([82,73,70,70,8,0,0,0,87,65,86,69,102,109,116,32]);
const mp4=Uint8Array.from([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0]);
const game={schema:'anevum.game.v1',startScene:'start',scenes:[
 {id:'start',title:'Signal',text:'A faint light travels through the aperture.',choices:[]}
]};
const docs={
 games:{kind:'game',document:game,assets:{}},
 music:{kind:'album',document:{schema:'anevum.album.v1',cover:'assets/cover.png',tracks:[
  {id:'signal',title:'First signal',file:'assets/signal.wav'}]},
  assets:{'assets/cover.png':png,'assets/signal.wav':wav}},
 video:{kind:'series',document:{schema:'anevum.series.v1',poster:'assets/poster.png',episodes:[
  {id:'pilot',title:'Pilot',file:'assets/pilot.mp4'}]},
  assets:{'assets/poster.png':png,'assets/pilot.mp4':mp4}},
 art:{kind:'visual',document:{schema:'anevum.visual.v1',pages:[
  {image:'assets/art.png',caption:'An opening in the sky'}]},
  assets:{'assets/art.png':png}},
 writing:{kind:'project',document:{schema:'anevum.blocks.v1',blocks:[
  {id:'11111111-1111-4111-8111-111111111111',type:'paragraph',text:'A constellation continues.',target:null}
 ]},assets:{}}
};
const id=()=>crypto.randomUUID();
async function packFor(category,extraAssets={}){
 const value=docs[category];
 return createNativePack({kind:value.kind,title:'Native '+category,creator:'Synthetic Original',
  version:'0.1.0',document:value.document,assets:{...value.assets,...extraAssets}});
}
async function createProject(s,category,tag){
 const r=await s.call(ROOT,'POST','alice',{clientRequestId:id(),draft:project(category,tag)});
 assert.equal(r.status,201,await r.clone().text());
 return (await wire(r)).project;
}
async function upload(s,projectId,pkg){
 const root=ROOT+'/'+projectId+'/assets';
 const declared=await s.call(root,'POST','alice',{
  name:pkg.filename,contentType:NATIVE_PACK_MIME,sizeBytes:pkg.bytes.length});
 if(declared.status!==201)return {reserved:declared,status:declared.status};
 const assetId=(await wire(declared)).id;
 const stored=await s.call(root+'/'+assetId,'PUT','alice',pkg.bytes);
 return {status:stored.status,assetId,stored};
}
test('new native package flag is disabled by default, independently of private ZIP uploads',async()=>{
 const s=setup();
 try{
  const p=await createProject(s,'games','default-off');
  const root=ROOT+'/'+p.id+'/assets';
  const pkg=await packFor('games');
  const listing=await wire(await s.call(root));
  assert.equal(listing.uploadsReady,true);
  assert.equal(listing.nativePacksReady,false);
  const blocked=await upload(s,p.id,pkg);
  assert.equal(blocked.status,404);
  assert.equal(s.objects.size,0);
  // General-purpose legacy ZIP handling has its own existing upload rules.
  const zip=new Uint8Array([80,75,3,4,20,0,0,0]);
  const declaration=await s.call(root,'POST','alice',{name:'legacy-game.zip',contentType:'application/zip',sizeBytes:zip.length});
  assert.equal(declaration.status,201);
  const stored=await s.call(root+'/'+(await wire(declaration)).id,'PUT','alice',zip);
  assert.equal(stored.status,200);
  assert.equal(s.objects.size,1);
 }finally{s.close();}
});
test('native pilot requires both the original account allowlist and separate native flag',async()=>{
 const s=setup({native:true,allowed:'native-pilot-bob'});
 try{
  const p=await createProject(s,'games','allowlist');
  assert.equal((await wire(await s.call(ROOT+'/'+p.id+'/assets'))).nativePacksReady,false);
  assert.equal((await upload(s,p.id,await packFor('games'))).status,404);
  s.env.CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS='native-pilot-alice';
  assert.equal((await wire(await s.call(ROOT+'/'+p.id+'/assets'))).nativePacksReady,true);
  s.env.CANONICAL_CREATOR_UPLOADS_ENABLED='false';
  assert.equal((await upload(s,p.id,await packFor('games'))).status,404);
 }finally{s.close();}
});
test('each of five native formats can enter OWNER-ONLY quarantine and frozen private review',async()=>{
 for(const category of Object.keys(docs)){
  const s=setup({native:true});
  try{
   const p=await createProject(s,category,'roundtrip');
   const pkg=await packFor(category);
   const validation=await inspectNativePackForQuarantine(pkg.filename,pkg.bytes,category);
   assert.ok(validation.kind);
   const asset=await upload(s,p.id,pkg);
   assert.equal(asset.status,200,category+': '+(asset.stored?await asset.stored.clone().text():'reserve failed'));
   const listing=await wire(await s.call(ROOT+'/'+p.id+'/assets','GET','alice'));
   assert.equal(listing.assets.length,1);
   assert.equal(listing.assets[0].status,'quarantined');
   assert.equal(listing.assets[0].kind,'package');
   assert.equal(listing.assets[0].sha256.length,64);
   assert.equal((await s.call(ROOT+'/'+p.id+'/assets/'+asset.assetId+'/file','GET','bob')).status,404);
   assert.equal((await s.call(ROOT+'/'+p.id+'/assets/'+asset.assetId+'/file','GET',null)).status,401);
   const submitted=await s.call(ROOT+'/'+p.id+'/submit','POST','alice',{revision:p.revision});
   assert.equal(submitted.status,200,category+': '+await submitted.clone().text());
   const confirmation=await wire(submitted);
   assert.equal(confirmation.project.status,'pending_review');
   assert.match(confirmation.note,/no publication/);
   const receipt=await wire(await s.call(ROOT+'/'+p.id+'/submissions','GET','alice'));
   assert.equal(receipt.submissions.length,1);
   assert.equal(receipt.submissions[0].assets.length,1);
   assert.equal((await s.call('/api/v1/member/studio/review','GET','alice')).status,403);
   const reviewer=await wire(await s.call('/api/v1/member/studio/review/'+p.id+'/manifest','GET','bob'));
   assert.equal(reviewer.assets.length,1);
   assert.equal(reviewer.assets[0].sha256.length,64);
   assert.ok(reviewer.assets.every(x=>!Object.keys(x).some(key=>/storage|body|download|bytes|url/i.test(key))),
    'No quarantine object locator in reviewer metadata');
   assert.equal(s.objects.size,1);
  }finally{s.close();}
 }
});
test('invalid content and hidden extra assets are rejected before R2 write',async()=>{
 const s=setup({native:true});
 try{
  const p=await createProject(s,'games','malformed');
  const pkg=await packFor('games');
  const zipOnly=Uint8Array.from([80,75,3,4,20,0,0,0]);
  const malformed=await s.call(ROOT+'/'+p.id+'/assets','POST','alice',{
   name:pkg.filename,sizeBytes:zipOnly.length,contentType:NATIVE_PACK_MIME});
  assert.equal(malformed.status,201);
  const reservation=(await wire(malformed)).id;
  assert.equal((await s.call(ROOT+'/'+p.id+'/assets/'+reservation,'PUT','alice',zipOnly)).status,422);
  const after=(await wire(await s.call(ROOT+'/'+p.id+'/assets','GET','alice'))).assets;
  assert.equal(after[0].status,'reserved');
  assert.equal(s.objects.size,0);
  const unreferenced=await packFor('games',{'assets/hidden.png':png});
  assert.equal((await upload(s,p.id,unreferenced)).status,422);
  assert.equal(s.objects.size,0);
 }finally{s.close();}
});
test('category mismatch, privilege boundary and category changed after reservation fail closed',async()=>{
 const s=setup({native:true});
 try{
  const p=await createProject(s,'games','mismatch');
  const wrong=await packFor('music');
  assert.equal((await upload(s,p.id,wrong)).status,422);
  assert.equal(s.objects.size,0);
  const valid=await packFor('games');
  const root=ROOT+'/'+p.id+'/assets';
  const reserve=await s.call(root,'POST','alice',{name:valid.filename,contentType:NATIVE_PACK_MIME,sizeBytes:valid.bytes.length});
  assert.equal(reserve.status,201);
  const assetId=(await wire(reserve)).id;
  const changed=project('music','mismatch');
  const updated=await s.call(ROOT+'/'+p.id,'PATCH','alice',{revision:p.revision,draft:changed});
  assert.equal(updated.status,200);
  assert.equal((await s.call(root+'/'+assetId,'PUT','alice',valid.bytes)).status,409);
  assert.equal(s.objects.size,0);
  assert.equal((await s.call(root+'/'+assetId,'PUT','bob',valid.bytes)).status,404);
  assert.equal((await s.call(root+'/'+assetId,'PUT',null,valid.bytes)).status,401);
 }finally{s.close();}
});
test('type signatures are not publishing approval and verified package metadata is not a staff permission',async()=>{
 const s=setup({native:true});
 try{
  const p=await createProject(s,'games','staff');
  const item=await upload(s,p.id,await packFor('games'));
  assert.equal(item.status,200);
  const r=await wire(await s.call(ROOT+'/'+p.id+'/assets','GET','alice'));
  assert.equal(r.assets[0].status,'quarantined');
  const privateByte=await s.call(ROOT+'/'+p.id+'/assets/'+item.assetId+'/file','GET','alice');
  assert.equal(privateByte.status,200);
  assert.match(privateByte.headers.get('content-disposition'),/attachment/);
  assert.equal(privateByte.headers.get('content-type'),'application/octet-stream');
  assert.equal((await s.call('/api/v1/member/studio/review','GET','bob')).status,200);
  const report=await wire(await s.call('/api/v1/member/studio/review','GET','bob'));
  assert.equal(report.projects.length,0,'Reviewer queue requires explicit owner submission');
  assert.equal((await s.call(ROOT+'/'+p.id,'GET',null)).status,401);
 }finally{s.close();}
});
