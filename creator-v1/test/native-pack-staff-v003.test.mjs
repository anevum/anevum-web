// ANEVUM Native Pack V003 -- synthetic, isolated staff text-inspection acceptance.
// No deployed Worker, real sessions, production D1, storage changes, public URLs or XP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {createNativePack} from '../web/src/lib/anevum-native-pack.ts';
import {NATIVE_PACK_MIME} from '../canonical-auth/native-pack-quarantine.mjs';
import {summarizeNativeDocument} from '../canonical-auth/native-pack-review.mjs';

const BASE='https://a.anevum.com',ROOT='/api/v1/member/studio/projects';
const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const migrations=[
 migration('0008_private_creator_studio.sql'),
 migration('0009_private_review_snapshots.sql'),
 migration('0010_native_inspection_audit.sql')
];
const ALICE={id:'private-inspect-alice',name:'Inspector Alice',email:'a@fixture.invalid',emailVerified:true};
const BOB={id:'private-inspect-bob',name:'Inspector Bob',email:'b@fixture.invalid',emailVerified:true};
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const wav=new Uint8Array([82,73,70,70,8,0,0,0,87,65,86,69,102,109,116,32]);
const mp4=new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0]);
const DOCS={
 games:{kind:'game',document:{schema:'anevum.game.v1',startScene:'start',scenes:[
  {id:'start',title:'The Observatory',text:'A luminous transmission appears.',
   choices:[{label:'Follow',to:'return'}]},
  {id:'return',title:'The Return',text:'Another world beckons.',choices:[]}
 ]},assets:{}},
 music:{kind:'album',document:{schema:'anevum.album.v1',cover:'assets/cover.png',
  tracks:[{id:'one',title:'The First Signal',file:'assets/song.wav'}]},
  assets:{'assets/song.wav':wav,'assets/cover.png':png}},
 video:{kind:'series',document:{schema:'anevum.series.v1',poster:'assets/poster.png',
  episodes:[{id:'pilot',title:'The Arrival',file:'assets/pilot.mp4'}]},
  assets:{'assets/pilot.mp4':mp4,'assets/poster.png':png}},
 art:{kind:'visual',document:{schema:'anevum.visual.v1',
  pages:[{image:'assets/frame.png',caption:'Opening aperture'}]},
  assets:{'assets/frame.png':png}},
 writing:{kind:'project',document:{schema:'anevum.blocks.v1',blocks:[
  {id:'11111111-1111-4111-8111-111111111111',type:'paragraph',
   text:'A new continuance emerges.',target:null}
 ]},assets:{}}
};
function setup({enabled=false,withAudit=true,storage=true}={}){
 const f=fixture();
 f.db.exec(migrations[0]);f.db.exec(migrations[1]);
 if(withAudit)f.db.exec(migrations[2]);
 for(const m of [ALICE,BOB]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(m.id,m.name,m.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(m.id,m===ALICE?'private_alice':'private_bob',m.name,100,100);
 }
 const objects=new Map();
 const store={
  async get(key){const data=objects.get(key);return data?{size:data.byteLength,body:new Blob([data]).stream()}:null;},
  async put(key,bytes){objects.set(key,new Uint8Array(bytes));},
  async delete(key){objects.delete(key);}
 };
 const env={...f.env,MEMBER_DB:f.env.MEMBER_DB,
  CANONICAL_CREATOR_STUDIO_ENABLED:'true',CANONICAL_CREATOR_UPLOADS_ENABLED:'true',
  CANONICAL_CREATOR_NATIVE_PACK_UPLOADS_ENABLED:'true',
  CANONICAL_CREATOR_NATIVE_INSPECTION_ENABLED:enabled?'true':'false',
  CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS:ALICE.id,
  CANONICAL_STUDIO_REVIEWER_IDS:BOB.id,CREATOR_ASSETS:storage?store:undefined
 };
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{
  getSession:async({headers})=>{
   const cookie=headers.get('cookie')||'';
   const user=cookie.includes('native-alice')?ALICE:cookie.includes('native-bob')?BOB:null;
   return user?{user,session:{id:'mock-session'}}:null;
  }
 }})});
 async function call(route=ROOT,method='GET',who='alice',data){
  const headers=new Headers({accept:'application/json',
   ...(who?{cookie:'__Secure-anevum_can_stage.session_token=native-'+who}:{}),
   ...(['GET','HEAD'].includes(method)?{}:{origin:BASE,'sec-fetch-site':'same-origin'})
  });
  let body;
  if(data!==undefined){
   if(data instanceof Uint8Array){headers.set('content-type','application/octet-stream');body=data;}
   else{headers.set('content-type','application/json');body=JSON.stringify(data);}
  }
  return worker.fetch(new Request(BASE+route,{method,headers,body}),env);
 }
 return {f,env,objects,store,call,close:()=>f.db.close()};
}
const read=async response=>response.json();
let count=0;
async function submitted(s,category){
 count++;
 const value={slug:'inspection-'+category+'-'+count,title:'Original '+category,
  summary:'Original native submission for independent inspection',description:'',
  category,freeToUse:true,license:'CC BY 4.0',sourceUrl:null,demoUrl:null,
  aiDisclosure:'Synthetic work; no AI in included media',
  humanContribution:'All rights belong to the synthetic fixture owner'};
 const created=await s.call(ROOT,'POST','alice',{clientRequestId:crypto.randomUUID(),draft:value});
 assert.equal(created.status,201,await created.clone().text());
 const project=(await read(created)).project;
 const doc=DOCS[category];
 const pkg=await createNativePack({kind:doc.kind,title:'The '+category+' Continuance',
  creator:'Original Owner',version:'0.1.0',document:doc.document,assets:doc.assets});
 const base=ROOT+'/'+project.id+'/assets';
 const reserved=await s.call(base,'POST','alice',{name:pkg.filename,
  sizeBytes:pkg.bytes.length,contentType:NATIVE_PACK_MIME});
 assert.equal(reserved.status,201,await reserved.clone().text());
 const assetId=(await read(reserved)).id;
 const uploaded=await s.call(base+'/'+assetId,'PUT','alice',pkg.bytes);
 assert.equal(uploaded.status,200,await uploaded.clone().text());
 const submitted=await s.call(ROOT+'/'+project.id+'/submit','POST','alice',{revision:project.revision});
 assert.equal(submitted.status,200,await submitted.clone().text());
 return {project,assetId,pkg,url:'/api/v1/member/studio/review/'+project.id+'/native/'+assetId+'/summary'};
}
function logs(s){return s.f.db.prepare('SELECT submission_id,project_id,reviewer_id,asset_id,sha256,action,created_at FROM member_studio_native_inspections').all();}
test('native staff text summary remains disabled separately, even when private upload works',async()=>{
 const s=setup();
 try{
  const work=await submitted(s,'games');
  const receipt=await read(await s.call('/api/v1/member/studio/review/'+work.project.id+'/manifest','GET','bob'));
  assert.equal(receipt.nativeTextInspectionReady,false);
  assert.equal((await s.call(work.url,'GET','bob')).status,404);
  assert.equal(logs(s).length,0);
  assert.equal(s.objects.size,1);
 }finally{s.close();}
});
test('flag alone is insufficient: missing audit migration and missing R2 fail closed',async()=>{
 const s=setup({enabled:true,withAudit:false});
 try{
  const work=await submitted(s,'games');
  const receipt=await read(await s.call('/api/v1/member/studio/review/'+work.project.id+'/manifest','GET','bob'));
  assert.equal(receipt.nativeTextInspectionReady,false);
  assert.equal((await s.call(work.url,'GET','bob')).status,503);
  s.f.db.exec(migrations[2]);
  s.env.CREATOR_ASSETS=undefined;
  const fresh=await read(await s.call('/api/v1/member/studio/review/'+work.project.id+'/manifest','GET','bob'));
  assert.equal(fresh.nativeTextInspectionReady,false);
  assert.equal((await s.call(work.url,'GET','bob')).status,503);
 }finally{s.close();}
});
test('all five formats yield bounded text summaries and one successful audit each',async()=>{
 for(const category of Object.keys(DOCS)){
  const s=setup({enabled:true});
  try{
   const w=await submitted(s,category);
   const manifest=await read(await s.call('/api/v1/member/studio/review/'+w.project.id+'/manifest','GET','bob'));
   assert.equal(manifest.nativeTextInspectionReady,true);
   const res=await s.call(w.url,'GET','bob');
   assert.equal(res.status,200,category+': '+await res.clone().text());
   const data=await read(res);
   assert.equal(data.projectId,w.project.id);
   assert.equal(data.assetId,w.assetId);
   assert.equal(data.summary.creditedCreator,'Original Owner');
   assert.equal(data.summary.itemCount,DOCS[category].document[
     {games:'scenes',music:'tracks',video:'episodes',art:'pages',writing:'blocks'}[category]
   ].length);
   assert.ok(data.summary.items.every(item=>typeof item.label==='string'&&item.label.length<=120));
   const raw=JSON.stringify(data);
   for(const forbidden of ['private-quarantine','storage_key','assets/cover.png','assets/pilot.mp4','application/octet-stream'])
    assert.equal(raw.includes(forbidden),false,'No private binary path leaks');
   assert.equal('assets' in data.summary,false);
   assert.equal(logs(s).length,1);
   assert.equal(logs(s)[0].reviewer_id,BOB.id);
   assert.equal(logs(s)[0].asset_id,w.assetId);
   assert.equal(logs(s)[0].action,'view_text_summary');
   assert.equal(logs(s)[0].sha256.length,64);
   assert.equal(s.objects.size,1,'Read does not publish or duplicate the asset');
  }finally{s.close();}
 }
});
test('independent reviewer role, self-review and unsupported methods never audit',async()=>{
 const s=setup({enabled:true});
 try{
  const w=await submitted(s,'games');
  assert.equal((await s.call(w.url,'GET',null)).status,401);
  assert.equal((await s.call(w.url,'GET','alice')).status,403);
  assert.equal((await s.call(w.url,'POST','bob',{})).status,405);
  s.env.CANONICAL_FORUM_REVIEWER_IDS=ALICE.id;
  assert.equal((await s.call(w.url,'GET','alice')).status,403);
  s.env.CANONICAL_STUDIO_REVIEWER_IDS=ALICE.id+','+BOB.id;
  assert.equal((await s.call(w.url,'GET','alice')).status,404,'Staff author cannot self-inspect');
  assert.equal((await s.call(w.url.replace(w.assetId,'0'.repeat(32)),'GET','bob')).status,404);
  assert.equal(logs(s).length,0);
 }finally{s.close();}
});
test('checksum tampering and deletion prevent inspection and leave no success audit',async()=>{
 const s=setup({enabled:true});
 try{
  const w=await submitted(s,'music');
  const key=[...s.objects.keys()][0];
  const bad=new Uint8Array(s.objects.get(key));bad[bad.length-1]^=1;
  s.objects.set(key,bad);
  assert.equal((await s.call(w.url,'GET','bob')).status,409);
  assert.equal(logs(s).length,1,'Failed checksum still leaves an audited attempt');
  assert.equal(logs(s)[0].action,'attempt_text_summary');
  s.objects.set(key,new Uint8Array(w.pkg.bytes));
  const good=await s.call(w.url,'GET','bob');
  assert.equal(good.status,200);
  assert.equal(logs(s).length,2);
  assert.equal(logs(s).filter(x=>x.action==='view_text_summary').length,1);
  const removed=await s.call(ROOT+'/'+w.project.id+'/assets/'+w.assetId,'DELETE','alice');
  assert.equal(removed.status,200);
  assert.equal((await s.call(w.url,'GET','bob')).status,404);
  assert.equal(logs(s).length,2);
 }finally{s.close();}
});
test('at most 30 successful private summaries per reviewer per hour',async()=>{
 const s=setup({enabled:true});
 try{
  const w=await submitted(s,'writing');
  for(let i=0;i<30;i++){
   const x=await s.call(w.url,'GET','bob');
   assert.equal(x.status,200,'visit '+i);
  }
  assert.equal(logs(s).length,30);
  assert.equal((await s.call(w.url,'GET','bob')).status,429);
  assert.equal(logs(s).length,30);
 }finally{s.close();}
});
test('repeated failed checksum requests count toward reviewer read quota',async()=>{
 const s=setup({enabled:true});
 try{
  const w=await submitted(s,'art');
  const key=[...s.objects.keys()][0];
  const changed=new Uint8Array(s.objects.get(key));changed[changed.length-1]^=1;
  s.objects.set(key,changed);
  for(let i=0;i<30;i++){
   const response=await s.call(w.url,'GET','bob');
   assert.equal(response.status,409,'Attempt '+i+' should fail checksum');
  }
  assert.equal(logs(s).length,30);
  assert.ok(logs(s).every(x=>x.action==='attempt_text_summary'));
  assert.equal((await s.call(w.url,'GET','bob')).status,429);
  assert.equal(logs(s).length,30);
 }finally{s.close();}
});
test('untrusted text is projected to bounded fields and never injected as HTML',()=>{
 const summary=summarizeNativeDocument(
  {kind:'game',title:'Untrusted',creator:'Declared',version:'0.1.0'},
  {scenes:[{title:'<script>alert(1)</script>',
   text:'a'.repeat(900),background:'assets/hide.png',
   choices:[{label:'Continue',to:'start'}]}]},1);
 assert.equal(summary.items[0].label,'<script>alert(1)</script>');
 assert.equal(summary.items[0].detail.length,180);
 assert.equal(summary.items[0].hasImage,true);
 assert.equal('background' in summary.items[0],false);
 const source=readFileSync(new URL('../web/src/pages/CanonicalStudioPage.tsx',import.meta.url),'utf8');
 assert.match(source,/studioReviewNativeText/);
 assert.doesNotMatch(source,/dangerouslySetInnerHTML|innerHTML\s*=|eval\s*\(/);
});
