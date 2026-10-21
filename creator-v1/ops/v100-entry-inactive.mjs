/** Existing ANEVUM Access-protected V100 entry, inactive upload only. No traffic changes. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const ACCOUNT='2f7ee83107240152097efd956a4e8335';
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const WORKER='anevum-v095-v096-acceptance-entry';
const PRIOR='0c936727-e34b-43ae-8a0a-4522713f005f';
const APEX='d43ac90d-a3a0-49b9-8215-61581decb035';
const OLD='3ba8602c-6616-49a4-af29-1efe60ad164a';
const NEXT='8ed503b6-5df6-42a5-a536-63ccf928d25d';
const SOURCE='28f163a0015631b1d8eb58922c03596ae8febd22';
const BASE='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;
const sha=x=>createHash('sha256').update(x).digest('hex');
function match(value,find,change){
 assert.equal(value.split(find).length,2,'Expected exactly one literal occurrence');
 return value.replace(find,change);
}
export function patchSource(text){
 let result=match(text,'var QA_SOURCE = "d5af32fd8f04b05e0381f7ac12c59d06c0e836a2"','var QA_SOURCE = "'+SOURCE+'"');
 result=match(result,'var QA_CANDIDATE = "'+OLD+'"','var QA_CANDIDATE = "'+NEXT+'"');
 return match(result,'Test V095/V096 on this device','Test integrated V100 on this device');
}
export function parseSource(download){
 assert.ok(download.startsWith('--'),'Expected multipart Worker download');
 const boundary=download.split(/\r?\n/,1)[0];
 assert.match(boundary,/^--[a-zA-Z0-9_-]{8,}$/);
 const pieces=download.split(boundary).slice(1).filter(x=>x.trim()&&x.trim()!=='--');
 assert.equal(pieces.length,1,'Single module required');
 const chunk=pieces[0].replace(/^\r?\n/,'');
 const separator=/\r?\n\r?\n/.exec(chunk);
 assert.ok(separator,'Expected part headers');
 const head=chunk.slice(0,separator.index);
 assert.match(head,/^Content-Disposition: form-data; name="entry\.mjs"/);
 return chunk.slice(separator.index+separator[0].length).replace(/\r?\n$/,'');
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function deploymentVersions(a){return a?.deployments?.[0]?.versions;}
function verifyState(s){
 assert.equal(s.apex.deployments?.[0]?.id,APEX,'Apex deployment drift');
 assert.ok(same(deploymentVersions(s.apex),[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:NEXT,percentage:0}]),'Apex traffic drift');
 assert.deepEqual(deploymentVersions(s.entry),[{version_id:PRIOR,percentage:100}],'Entry deployment drift');
 assert.equal(s.versions.items?.[0]?.id,PRIOR,'Another entry version already uploaded');
 assert.equal(s.routes.length,40,'Worker route count drift');
 assert.equal(s.routes.filter(x=>x.pattern==='anevum.com/__enter/v095-v096*'&&x.script===WORKER).length,1,'Entry route drift');
 assert.equal(s.exposure.enabled,false,'Worker subdomain exposed');
 assert.equal(s.exposure.previews_enabled,false,'Worker preview exposed');
 assert.equal(s.settings.compatibility_date,'2026-10-17');
 assert.deepEqual(s.settings.compatibility_flags||[],[]);
 const b=s.settings.bindings;
 assert.deepEqual([...b.map(x=>x.name)].sort(),['ANEVUM_ACCESS_AUD','ANEVUM_PREVIEW_ALLOWED_EMAILS','QA_CANDIDATE','QA_EXPIRES_AT','QA_ROUTING_TOKEN'].sort());
 assert.equal(b.find(x=>x.name==='QA_CANDIDATE')?.text,OLD,'Expected original candidate binding');
 assert.deepEqual(b.filter(x=>x.type==='secret_text').map(x=>x.name).sort(),['ANEVUM_PREVIEW_ALLOWED_EMAILS','QA_ROUTING_TOKEN']);
 const expiry=Number(b.find(x=>x.name==='QA_EXPIRES_AT')?.text);
 assert.ok(Number.isSafeInteger(expiry)&&expiry>Date.now()/1000&&expiry-Date.now()/1000<86400,'QA expired or unbounded');
 const source=parseSource(s.code);
 assert.ok(source.includes('var QA_CANDIDATE = "'+OLD+'"'));
 assert.ok(source.includes('var QA_SOURCE = "d5af32fd8f04b05e0381f7ac12c59d06c0e836a2"'));
 return {source,patched:patchSource(source)};
}
export function plannedBindings(bindings){
 return bindings.map(x=>x.name==='QA_CANDIDATE'?{name:x.name,type:'plain_text',text:NEXT}:{name:x.name,type:'inherit'});
}
async function request(token,path,method='GET',body,contentType){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{authorization:'Bearer '+token,...(contentType?{'content-type':contentType}:{})},body,redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error('Cloudflare '+method+' failed (HTTP '+response.status+')');
 if(path===BASE&&method==='GET')return response.text();
 const j=await response.json();
 if(j.success!==true)throw Error('Cloudflare API returned unsuccessful response');
 return j.result;
}
async function snapshot(get){
 const [entry,apex,versions,routes,settings,exposure,code]=await Promise.all([
 get(BASE+'/deployments'),get('/accounts/'+ACCOUNT+'/workers/scripts/anevum-apex-prelaunch-gateway/deployments'),
 get(BASE+'/versions?per_page=5'),get('/zones/'+ZONE+'/workers/routes'),get(BASE+'/settings'),get(BASE+'/subdomain'),get(BASE)
 ]);
 return {entry,apex,versions,routes,settings,exposure,code};
}
export async function run({get,post,mode='check'}){
 const before=await snapshot(get);
 const {source,patched}=verifyState(before);
 const receipt={worker:WORKER,baseline_entry_version:PRIOR,apex_deployment:APEX,source_sha:SOURCE,candidate:NEXT,
   original_source_sha256:sha(source),proposed_source_sha256:sha(patched),
   routes:before.routes.length,secret_binding_names:['ANEVUM_PREVIEW_ALLOWED_EMAILS','QA_ROUTING_TOKEN'],
   production_changed:false};
 if(mode==='check')return {...receipt,read_only:true};
 assert.equal(mode,'upload-inactive');
 // No environment values or secrets are embedded in the uploaded module.
 const form=new FormData();
 const meta={main_module:'entry.mjs',compatibility_date:'2026-10-17',compatibility_flags:[],
   usage_model:'standard',bindings:plannedBindings(before.settings.bindings),
   annotations:{'workers/message':'ANEVUM V100 protected entry source pin, inactive for acceptance'}};
 form.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));
 form.append('entry.mjs',new Blob([patched],{type:'application/javascript+module'}),'entry.mjs');
 const uploaded=await post(BASE+'/versions?bindings_inherit=strict',form);
 const id=uploaded?.id;
 assert.match(id||'',/^[a-f\d-]{36}$/i);
 // Persist ID before subsequent checks, so any post-upload failure is recoverable.
 if(process.env.RECEIPT_FILE)writeFileSync(process.env.RECEIPT_FILE,JSON.stringify({...receipt,uploaded_version:id,verified:false})+'\n',{mode:0o600});
 const after=await snapshot(get);
 assert.deepEqual(deploymentVersions(after.entry),deploymentVersions(before.entry),'Entry traffic changed unexpectedly');
 assert.deepEqual(deploymentVersions(after.apex),deploymentVersions(before.apex),'Apex traffic changed unexpectedly');
 assert.equal(after.routes.length,before.routes.length,'Routes changed unexpectedly');
 assert.equal(after.exposure.enabled,false);
 assert.equal(after.exposure.previews_enabled,false);
 assert.equal(after.versions.items?.[0]?.id,id);
 const candidate=await get(BASE+'/versions/'+id);
 const binds=candidate.resources?.bindings||[];
 assert.deepEqual(binds.map(x=>[x.name,x.type]).sort((a,b)=>a[0].localeCompare(b[0])),
  before.settings.bindings.map(x=>[x.name,x.type]).sort((a,b)=>a[0].localeCompare(b[0])));
 assert.equal(binds.find(x=>x.name==='QA_CANDIDATE')?.text,NEXT);
 const done={...receipt,uploaded_version:id,verified:true};
 if(process.env.RECEIPT_FILE)writeFileSync(process.env.RECEIPT_FILE,JSON.stringify(done)+'\n',{mode:0o600});
 return done;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const mode=process.argv[2]||'check';
 assert.ok(['check','upload-inactive'].includes(mode));
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 const token=process.env.CLOUDFLARE_API_TOKEN;
 assert.ok(token,'Cloudflare token must be supplied in GitHub Actions');
 if(mode==='upload-inactive'){
  assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
  assert.equal(process.env.GITHUB_ACTOR,'anevum');
  assert.equal(process.env.GITHUB_REF,'refs/heads/release/v084-continuance-approved-20261019');
  assert.equal(process.env.GITHUB_HEAD_MESSAGE,'release(v100): upload protected entry inactive only');
 }
 const result=await run({mode,get:p=>request(token,p),post:(p,body)=>request(token,p,'POST',body)});
 console.log(JSON.stringify(result));
}
