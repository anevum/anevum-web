/** V131 manual, one-success-only inactive upload. Provider calls in this module are GET only. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const PIN=Object.freeze({
 repo:'anevum/anevum-web', head:'ad0d3aef473e12c124b003d2c3bb45b79bff520e',
 source:'d02f524305213ae785821d8b6d8bfce7948b1eb2', run:40011027824, artifact:12526930761,
 archive:'ff5173806d7195be845b9dfd2b787676a6eca450f3b035d523d5bf085a12fc8d',
 manifest:'38eb7581f6efd79f5b96e766164c3ec49b0f4608ed4d13ac0c3ddb64f4ab5e8d',
 gateway:'1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99',
 account:'2f7ee83107240152097efd956a4e8335', zone:'8abe27259b5436af5966d3b40d9a3760',
 apex:'anevum-apex-prelaunch-gateway',controller:'anevum-package-alpha-v003-control',entry:'anevum-v095-v096-acceptance-entry',
 public:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',private:'86dc4b9d-4020-432a-8a15-e65606f31316',
 message:'V131 ad0d3aef473e12c124b003d2c3bb45b79bff520e artifact 12526930761 INACTIVE ONLY',
 expires:'2026-10-24T20:30:00Z'
});
const json=p=>JSON.parse(readFileSync(p,'utf8'));
export const hash=b=>createHash('sha256').update(b).digest('hex');
export function canonical(v){
 if(Array.isArray(v)){const xs=v.map(canonical);if(xs.length&&xs.every(x=>x&&typeof x==='object'&&'name'in x))xs.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);return xs;}
 return v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,canonical(x)])):v;
}
export const digest=v=>hash(JSON.stringify(canonical(v)));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{mode:0o600});
const omitAnnotations=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='annotations'));
function inventory(root){const out=[];function visit(d,rel=''){for(const n of readdirSync(d)){const p=join(d,n),r=rel?rel+'/'+n:n,s=lstatSync(p);assert.ok(!s.isSymbolicLink());if(s.isDirectory())visit(p,r);else{assert.ok(s.isFile());const b=readFileSync(p);out.push({path:r,bytes:b.length,sha256:hash(b)});}}}visit(root);return out.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);}
export function verifyPackage(root){
 const m=json(join(root,'package-manifest.json')),f=json(join(root,'frontend-manifest.json'));
 assert.equal(hash(readFileSync(join(root,'package-manifest.json'))),PIN.manifest,'Unverified manifest');
 assert.equal(m.status,'OFFLINE_WORKER_BUNDLE_VERIFIED');assert.equal(m.sourceSha,PIN.source);assert.equal(m.packagingHead,PIN.head);
 assert.equal(f.sourceSha,PIN.source);assert.equal(f.packagingHead,PIN.head);assert.equal(m.assetCount,395);
 assert.equal(hash(readFileSync(join(root,'frontend-manifest.json'))),m.frontendManifestSha256);
 assert.equal(hash(readFileSync(join(root,'root-browser-acceptance.json'))),m.browserEvidenceSha256);
 assert.deepEqual(inventory(join(root,'compiled-web')),f.files.map(x=>({path:x.path,bytes:x.bytes,sha256:x.sha256})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0));
 assert.deepEqual(inventory(join(root,'worker-bundle')),[...m.workerBundleFiles].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0));
 assert.equal(hash(readFileSync(join(root,'worker-bundle/gateway.js'))),PIN.gateway);
 assert.equal(f.files.filter(x=>x.path.startsWith('evolution/assets/')).length,152);
 for(const k of ['workerUploaded','trafficChanged','controllerPinChanged','accessChanged','memberDatabaseChanged','schemaMigrationApplied','physicalSafariAcceptance','productionApproved'])assert.equal(m[k],false);
 return m;
}
export function verifyLock(s,lock){
 assert.deepEqual(Object.keys(s.components).sort(),Object.keys(lock.componentSha256).sort());
 for(const [k,v]of Object.entries(s.components))assert.equal(digest(v),lock.componentSha256[k],'Provider drift: '+k);
 for(const [k,v]of Object.entries(lock.versionIds))assert.deepEqual(s.versionIds[k],v,'Version inventory drift: '+k);
 const a=s.components[PIN.apex];assert.equal(a.settings.bindings.length,26);
 assert.deepEqual(a.deployment.versions,[{version_id:PIN.public,percentage:100},{version_id:PIN.private,percentage:0}]);
 assert.equal(s.components[PIN.controller].settings.bindings.length,13);assert.equal(s.components[PIN.entry].settings.bindings.length,5);
 assert.equal(s.components.routes.length,40);
 for(const w of [PIN.apex,PIN.controller,PIN.entry])for(const b of s.components[w].settings.bindings.filter(x=>x.type==='secret_text'))assert.deepEqual(Object.keys(b).sort(),['name','type']);
}
export function configuration(s,root){
 const settings=s.components[PIN.apex].settings,b=settings.bindings;
 return {name:PIN.apex,account_id:PIN.account,main:resolve(root,'worker-bundle/gateway.js'),no_bundle:true,
 compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags,
 workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
 assets:{directory:resolve(root,'compiled-web'),binding:'ASSETS',run_worker_first:true,not_found_handling:'single-page-application'},
 vars:Object.fromEntries(b.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text])),
 d1_databases:b.filter(x=>x.type==='d1').map(x=>({binding:x.name,database_id:x.database_id}))};
}
async function get(path,gh=false){
 const token=process.env[gh?'GH_TOKEN':'CLOUDFLARE_API_TOKEN'];assert.ok(token?.length>15,'Missing provider credential');
 const r=await fetch((gh?'https://api.github.com':'https://api.cloudflare.com/client/v4')+path,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
 assert.ok(r.ok,'Provider GET failed '+r.status+' '+path);const j=await r.json();if(gh)return j;assert.equal(j.success,true);return j.result;
}
async function snapshot(){
 const components={},versionIds={},versionMetadata={};
 for(const n of [PIN.apex,PIN.controller,PIN.entry]){
  const base='/accounts/'+PIN.account+'/workers/scripts/'+n;
  const [ds,settings,secrets,subdomain,versions]=await Promise.all(['deployments','settings','secrets','subdomain','versions?per_page=100'].map(p=>get(base+'/'+p)));
  assert.ok(versions.items.length<100,'Version pagination requires review');
  const deployment=ds.deployments[0],deployedVersions={};
  for(const v of deployment.versions)deployedVersions[v.version_id]=await get(base+'/versions/'+v.version_id);
  components[n]={deployment,settings:omitAnnotations(settings),secrets,subdomain,deployedVersions};
  versionIds[n]=versions.items.map(v=>v.id).sort();versionMetadata[n]=versions.items;
 }
 [components.routes,components.access,components.lateTransform]=await Promise.all([
  get('/zones/'+PIN.zone+'/workers/routes'),get('/accounts/'+PIN.account+'/access/apps/c5e5bef0-43b8-4a4b-bc04-cbf2e0973e8b'),
  get('/zones/'+PIN.zone+'/rulesets/7a8ccf2e80704acb90de7ad857a2728c')]);
 components.routes.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);return {components,versionIds,versionMetadata};
}
export function context(env=process.env,now=Date.now()){
 assert.equal(env.GITHUB_REPOSITORY,PIN.repo);assert.equal(env.GITHUB_EVENT_NAME,'workflow_dispatch');
 assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_ACTOR,'anevum');assert.equal(env.GITHUB_TRIGGERING_ACTOR,'anevum');
 assert.equal(env.GITHUB_RUN_ATTEMPT,'1','Reruns forbidden');assert.equal(env.CONFIRM_V131,PIN.archive);
 assert.equal(env.CLOUDFLARE_ACCOUNT_ID,PIN.account);assert.ok(now<Date.parse(PIN.expires),'One-use authorization expired');
}
async function provenance(){
 const [a,r,checks,review]=await Promise.all([
  get('/repos/'+PIN.repo+'/actions/artifacts/'+PIN.artifact,true),get('/repos/'+PIN.repo+'/actions/runs/'+PIN.run,true),
  get('/repos/'+PIN.repo+'/commits/'+PIN.head+'/check-runs?per_page=100',true),get('/repos/'+PIN.repo+'/commits/'+process.env.GITHUB_SHA+'/pulls',true)]);
 assert.equal(a.expired,false);assert.equal(a.workflow_run.head_sha,PIN.head);assert.equal(a.workflow_run.id,PIN.run);
 if(a.digest)assert.equal(a.digest,'sha256:'+PIN.archive);
 assert.equal(r.head_sha,PIN.head);assert.equal(r.status,'completed');assert.equal(r.conclusion,'success');
 for(const name of ['offline-package','verify','verified-source','emblem-and-reputation','source'])assert.ok(checks.check_runs.some(x=>x.name===name&&x.head_sha===PIN.head&&x.conclusion==='success'),'Missing exact CI '+name);
 const merged=review.filter(x=>x.merged_at&&x.base.ref==='main');assert.equal(merged.length,1,'Uploader must enter main through a reviewed PR');
 const reviews=await get('/repos/'+PIN.repo+'/pulls/'+merged[0].number+'/reviews',true);
 // GitHub owner-authored PRs cannot self-approve. A merged owner-authored PR is
 // the explicit repository review operation; external authored PRs require approval.
 assert.ok(merged[0].user.login==='anevum'||reviews.some(x=>x.state==='APPROVED'&&x.user.login==='anevum'));
 const changed=await get('/repos/'+PIN.repo+'/pulls/'+merged[0].number+'/files?per_page=100',true);
 assert.deepEqual(changed.map(x=>x.filename).sort(),['.github/workflows/v131-inactive-upload.yml','ops/v131/inactive-upload.mjs','ops/v131/inactive-upload.test.mjs','ops/v131/provider-lock.json']);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
}
export function verifyAfter(before,after,candidate){
 for(const [k,v]of Object.entries(before.components))assert.equal(digest(after.components[k]),digest(v),'Provider changed during upload: '+k);
 for(const n of [PIN.controller,PIN.entry])assert.deepEqual(after.versionIds[n],before.versionIds[n]);
 const added=after.versionIds[PIN.apex].filter(x=>!before.versionIds[PIN.apex].includes(x));
 assert.equal(added.length,1);assert.deepEqual(after.versionIds[PIN.apex],before.versionIds[PIN.apex].concat(added).sort());
 assert.equal(candidate.id,added[0]);assert.equal(candidate.annotations?.['workers/message'],PIN.message);
 assert.deepEqual(canonical(candidate.resources.bindings),canonical(before.components[PIN.apex].settings.bindings));
 const prior=before.components[PIN.apex].deployedVersions[PIN.private].resources;
 assert.deepEqual(candidate.resources.script_runtime,prior.script_runtime);assert.ok(candidate.resources.script?.etag);
 assert.ok(!after.components[PIN.apex].deployment.versions.some(v=>v.version_id===candidate.id),'Uploaded version must remain unselected');
 return {session:'ANEVUM.WEB.RELEASE.2026-10-23.002.V131-PROTECTED-PUBLICATION',status:'V131_INACTIVE_UPLOADED',versionId:candidate.id,
 source:PIN.source,packagingHead:PIN.head,artifact:PIN.artifact,archiveSha256:PIN.archive,workerSha256:PIN.gateway,
 publicVersion:PIN.public,publicPercent:100,candidatePercent:0,rollbackPreserved:true,providerDrift:false,
 protectedAcceptance:false,physicalSafariAcceptance:false,productionApproved:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,root,state,output]=process.argv.slice(2);
 if(command==='package'){verifyPackage(root);console.log('EXACT_V131_FILES=PASS');}
 else if(command==='before'){
  context();await provenance();verifyPackage(root);const s=await snapshot();verifyLock(s,json(new URL('./provider-lock.json',import.meta.url)));
  assert.ok(!s.versionMetadata[PIN.apex].some(v=>v.annotations?.['workers/message']===PIN.message),'V131 was already uploaded');
  save(state,{...s,capturedAt:Date.now()});save(output,configuration(s,root));console.log('V131_INACTIVE_PREFLIGHT=PASS');
 }else if(command==='after'){
  context();verifyPackage(root);const prior=json(state);assert.ok(Date.now()-prior.capturedAt<15*60*1000,'Preflight expired');
  const s=await snapshot(),added=s.versionIds[PIN.apex].filter(x=>!prior.versionIds[PIN.apex].includes(x));assert.equal(added.length,1);
  const candidate=await get('/accounts/'+PIN.account+'/workers/scripts/'+PIN.apex+'/versions/'+added[0]);
  const receipt=verifyAfter(prior,s,candidate);save(output,receipt);console.log(JSON.stringify(receipt));
 }else throw Error('Use package <root> | before <root> <state> <config> | after <root> <state> <receipt>');
}
