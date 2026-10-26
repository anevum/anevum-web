// Offline canonical Studio V136 large-file acceptance. No real R2, user
// accounts, publication, database migrations or production mutations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {canonicalStudioExport} from '../canonical-auth/studio.mjs';
import {studioLargeSchemaReady,cleanupCanonicalStudioLargeAssets} from '../canonical-auth/studio-large-assets.mjs';
const ROOT='/api/v1/member/studio/projects',ORIGIN='https://a.anevum.com',MiB=1048576,PART=8*MiB;
const read=n=>readFileSync(new URL('../canonical-auth/migrations/'+n,import.meta.url),'utf8');
const alice={id:'large-alice',name:'Alice',email:'alice@fixture.invalid',emailVerified:true};
const bob={id:'large-bob',name:'Bob',email:'bob@fixture.invalid',emailVerified:true};
const draft={slug:'signal-game-v1',title:'Continuance Signal',
 summary:'A complete original Godot Web export for private staged review',
 description:'A playable navigation experiment',category:'games',freeToUse:true,
 license:'MIT',sourceUrl:null,demoUrl:null,
 aiDisclosure:'No generative assets in this version',
 humanContribution:'All gameplay source and art authored by the creator'};
const status=async r=>({status:r.status,body:await r.json()});
function r2(){
 const uploads=new Map(),objects=new Map();let counter=0;
 function session(key,id){
  const u=uploads.get(id);
  if(!u||u.key!==key)throw Error('Missing or mismatched R2 upload');
  return {
   async uploadPart(partNumber,value){
    const payload=new Uint8Array(value);
    const etag='private-'+partNumber+'-'+payload.byteLength;
    u.parts.set(partNumber,{etag,bytes:payload});
    return {partNumber,etag};
   },
   async complete(parts){
    const chunks=parts.map(({partNumber,etag})=>{
     const p=u.parts.get(partNumber);
     if(!p||p.etag!==etag)throw Error('R2 part receipt mismatch');
     return p.bytes;
    });
    const size=chunks.reduce((n,c)=>n+c.byteLength,0),bytes=new Uint8Array(size);
    let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
    objects.set(key,bytes);uploads.delete(id);
    return {size};
   },
   async abort(){uploads.delete(id);}
  };
 }
 return {objects,uploads,
  async createMultipartUpload(key){
   const uploadId='test-multipart-'+(++counter);
   uploads.set(uploadId,{key,parts:new Map()});
   return {uploadId,...session(key,uploadId)};
  },
  resumeMultipartUpload:session,
  async put(key,b){objects.set(key,new Uint8Array(b));},
  async get(key){const b=objects.get(key);return b?{size:b.length,body:new Blob([b]).stream()}:null;},
  async delete(key){objects.delete(key);}
 };
}
function setup({large=true,migrate=true,access='verified',store=true}={}){
 const f=fixture();
 f.db.exec(read('0008_private_creator_studio.sql'));
 f.db.exec(read('0009_private_review_snapshots.sql'));
 if(migrate)f.db.exec(read('0014_member_creator_large_assets.sql'));
 for(const p of [alice,bob]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
   .run(p.id,p.name,p.email);
  f.db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(p.id,p.id==='large-alice'?'large_alice':'large_bob',p.name,100,100);
 }
 const bucket=r2();
 const env={...f.env,CANONICAL_CREATOR_STUDIO_ENABLED:'true',
  CANONICAL_CREATOR_UPLOADS_ENABLED:'false',
  CANONICAL_CREATOR_LARGE_UPLOADS_ENABLED:large?'true':'false',
  CANONICAL_CREATOR_LARGE_ACCESS:access,
  CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS:access==='pilot'?alice.id:'',
  CANONICAL_STUDIO_REVIEWER_IDS:bob.id,
  ...(store?{CREATOR_LARGE_ASSETS:bucket}:{})};
 const worker=createCanonicalStageWorker({authFactory:()=>({api:{getSession:async({headers})=>{
  const cookie=headers.get('cookie')||'';
  const who=cookie.includes('large-alice')?alice:cookie.includes('large-bob')?bob:null;
  return who?{user:who,session:{id:'test-only'}}:null;
 }}})});
 async function call(path=ROOT,method='GET',who='alice',payload){
  const headers=new Headers({accept:'application/json',
   ...(method==='GET'||method==='HEAD'?{}:{origin:ORIGIN,'sec-fetch-site':'same-origin'}),
   ...(who?{cookie:'__Secure-anevum_can_stage.session_token=large-'+who}:{})});
  let body;
  if(payload instanceof Uint8Array){headers.set('content-type','application/octet-stream');body=payload;}
  else if(payload!==undefined){headers.set('content-type','application/json');body=JSON.stringify(payload);}
  return worker.fetch(new Request(ORIGIN+path,{method,headers,...(body?{body}:{})}),env);
 }
 return {f,env,bucket,call,close(){f.db.close();}};
}
const makeFile=(length,alter=false)=>{
 const b=new Uint8Array(length);b[0]=80;b[1]=75;b[2]=3;b[3]=4;
 if(alter)b[1024]=1;
 return b;
};
const request=()=>({clientRequestId:crypto.randomUUID(),draft});

test('large upload is additive, separate from old pilot and strictly gated',async()=>{
 const f=setup({large:false});
 try{
  assert.equal(await studioLargeSchemaReady(f.env),true);
  const p=(await status(await f.call(ROOT,'POST','alice',request()))).body.project;
  const route=ROOT+'/'+p.id+'/assets-large';
  const deny=await f.call(route,'POST','alice',{name:'game.zip',sizeBytes:21*MiB,contentType:'application/zip'});
  assert.equal(deny.status,404);
  const old=await status(await f.call(ROOT+'/'+p.id+'/assets'));
  assert.equal(old.status,200);assert.equal(old.body.uploadsReady,false);
 }finally{f.close();}
 const noSchema=setup({migrate:false});
 try{
  assert.equal(await studioLargeSchemaReady(noSchema.env),false);
  const p=(await status(await noSchema.call(ROOT,'POST','alice',request()))).body.project;
  assert.equal((await noSchema.call(ROOT+'/'+p.id+'/assets-large')).status,503);
 }finally{noSchema.close();}
 const noStore=setup({store:false});
 try{
  const p=(await status(await noStore.call(ROOT,'POST','alice',request()))).body.project;
  const info=await status(await noStore.call(ROOT+'/'+p.id+'/assets-large'));
  assert.equal(info.status,200);assert.equal(info.body.uploadsReady,false);
 }finally{noStore.close();}
});

test('authenticated multipart upload resumes, validates bytes, freezes review and deletes privately',async()=>{
 const f=setup();
 try{
  const project=(await status(await f.call(ROOT,'POST','alice',request()))).body.project;
  const path=ROOT+'/'+project.id+'/assets-large',length=21*MiB;
  const files=await status(await f.call(path));
  assert.equal(files.status,200);assert.equal(files.body.maxFileBytes,1024*MiB);
  assert.equal(files.body.memberCapacityBytes,5*1024*MiB);
  assert.equal(files.body.uploadsReady,true);
  assert.equal((await f.call(path,'POST','alice',{name:'virus.exe',sizeBytes:length,contentType:'application/octet-stream'})).status,422);
  assert.equal((await f.call(path,'POST','alice',{name:'godot.zip',sizeBytes:length,contentType:'video/mp4'})).status,422);
  const reservation=await status(await f.call(path,'POST','alice',{
   name:'godot-export.zip',sizeBytes:length,contentType:'application/zip'
  }));
  assert.equal(reservation.status,201);
  const asset=path+'/'+reservation.body.id;
  assert.equal(reservation.body.partSize,PART);
  assert.equal(reservation.body.partCount,3);
  assert.equal((await f.call(asset+'/parts/1','PUT','alice',makeFile(PART))).status,409);
  assert.equal((await f.call(asset+'/start','POST','bob',{})).status,404);
  assert.equal((await f.call(asset+'/start','POST','alice',{})).status,200);
  assert.equal((await f.call(asset+'/complete','POST','alice',{})).status,409);
  const first=makeFile(PART);
  assert.equal((await f.call(asset+'/parts/1','PUT','alice',makeFile(PART,true))).status,200);
  assert.equal((await f.call(asset+'/parts/1','PUT','alice',first)).status,409,'no changed-part replay');
  assert.equal((await f.call(asset+'/parts/1','PUT','alice',makeFile(PART,true))).status,200,'identical part is replay-safe');
  let receipt=await status(await f.call(asset+'/parts','GET','alice'));
  assert.equal(receipt.body.completedParts.length,1);
  assert.equal((await f.call(asset+'/start','POST','alice',{})).status,200,'resume keeps same upload');
  assert.equal((await f.call(asset+'/parts/2','PUT','alice',new Uint8Array(PART))).status,200);
  assert.equal((await f.call(asset+'/parts/3','PUT','alice',new Uint8Array(5*MiB))).status,200);
  const done=await status(await f.call(asset+'/complete','POST','alice',{}));
  assert.equal(done.status,200,JSON.stringify(done.body));
  assert.equal(done.body.status,'quarantined');
  assert.match(done.body.manifestSha256,/^[a-f0-9]{64}$/);
  assert.equal((await f.call(asset+'/complete','POST','alice',{})).status,200);
  const exported=await canonicalStudioExport(f.env,alice.id);
  assert.equal(exported.largeAssets.length,1);
  assert.equal(exported.largeAssets[0].manifestSha256,done.body.manifestSha256);
  assert.equal(JSON.stringify(exported.largeAssets).includes('storage_key'),false);
  const dl=await f.call(asset+'/file','HEAD','alice');
  assert.equal(dl.status,200);assert.equal(Number(dl.headers.get('content-length')),length);
  assert.equal(dl.headers.get('content-type'),'application/octet-stream');
  assert.match(dl.headers.get('content-disposition'),/attachment/);
  assert.equal((await f.call(asset+'/file','GET','bob')).status,404);
  assert.equal((await f.call(asset+'/file','GET',null)).status,401);
  const ready=await status(await f.call(ROOT+'/'+project.id+'/submit','POST','alice',{revision:1}));
  assert.equal(ready.status,200,JSON.stringify(ready.body));
  assert.equal(ready.body.attachmentCount,1);
  const review=await status(await f.call('/api/v1/member/studio/review/'+project.id+'/manifest','GET','bob'));
  assert.equal(review.status,200);
  assert.equal(review.body.assets.length,1);
  assert.equal(review.body.assets[0].digestType,'part-manifest');
  assert.equal(review.body.assets[0].sha256,done.body.manifestSha256);
  assert.equal(JSON.stringify(review.body).includes('storage_key'),false);
  assert.equal((await f.call(asset+'/parts','GET','bob')).status,404);
  const del=await status(await f.call(asset,'DELETE','alice'));
  assert.equal(del.status,200);assert.equal(del.body.withdrawnFromReview,true);
  assert.equal(f.bucket.objects.size,0);assert.equal(f.bucket.uploads.size,0);
  assert.equal((await status(await f.call(ROOT+'/'+project.id+'/assets-large'))).body.assets.length,0);
  assert.equal((await status(await f.call('/api/v1/member/studio/review','GET','bob'))).body.projects.length,0);
 }finally{f.close();}
});

test('expiration cleanup removes abandoned multipart reservations without publication',async()=>{
 const f=setup();
 try{
  const p=(await status(await f.call(ROOT,'POST','alice',request()))).body.project;
  const path=ROOT+'/'+p.id+'/assets-large';
  const r=await status(await f.call(path,'POST','alice',{
   name:'abandoned.zip',sizeBytes:23*MiB,contentType:'application/zip'
  }));
  const id=r.body.id;
  await f.call(path+'/'+id+'/start','POST','alice',{});
  assert.equal(f.bucket.uploads.size,1);
  const now=Math.floor(Date.now()/1000)+86430;
  const result=await cleanupCanonicalStudioLargeAssets(f.env,now);
  assert.equal(result.cleaned,1);
  assert.equal(f.bucket.uploads.size,0);
  assert.equal((await status(await f.call(path))).body.assets.length,0);
 }finally{f.close();}
});

test('five 1 GiB reservations hit the member hard cap, removal releases it',async()=>{
 const f=setup();
 try{
  const project=(await status(await f.call(ROOT,'POST','alice',request()))).body.project;
  const path=ROOT+'/'+project.id+'/assets-large',saved=[];
  for(let n=1;n<=5;n++){
   const reserved=await status(await f.call(path,'POST','alice',{
    name:'creator-export-'+n+'.zip',sizeBytes:1024*MiB,contentType:'application/zip'
   }));
   assert.equal(reserved.status,201);
   saved.push(reserved.body.id);
  }
  const above=await status(await f.call(path,'POST','alice',{
   name:'creator-export-6.zip',sizeBytes:1024*MiB,contentType:'application/zip'
  }));
  assert.equal(above.status,409,'storage guard must reject even without binary requests');
  assert.equal((await status(await f.call(path))).body.memberUsedBytes,5*1024*MiB);
  assert.equal((await f.call(ROOT+'/'+project.id,'DELETE','alice',{revision:1})).status,409,
   'parent project must not delete private R2 records');
  const del=await status(await f.call(path+'/'+saved[0],'DELETE','alice'));
  assert.equal(del.status,200);
  const allowed=await status(await f.call(path,'POST','alice',{
   name:'creator-export-6.zip',sizeBytes:1024*MiB,contentType:'application/zip'
  }));
  assert.equal(allowed.status,201,'deletion must release only its own reservation');
  const out=await status(await f.call(path));
  assert.equal(out.body.memberUsedBytes,5*1024*MiB);
  assert.equal(out.body.assets.length,5);
 }finally{f.close();}
});
