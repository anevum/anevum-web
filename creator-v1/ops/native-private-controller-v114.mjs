/** Existing controller only. Upload inactive; no deployment/routing/data writes. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const SOURCE='82fd84cc887be20c2244fe59f4cf72c48ea40f53';
export const ACCOUNT='2f7ee83107240152097efd956a4e8335';
export const WORKER='anevum-package-alpha-v003-control';
export const APEX='anevum-apex-prelaunch-gateway';
export const TARGET='86dc4b9d-4020-432a-8a15-e65606f31316';
export const PUBLIC='9851d9c5-6270-4c4e-a70e-1b82451b170d';
export const PRIOR='2720ea00-2030-43ff-84fc-8d6faf4d003b';
export const BRANCH='ops/private-controller-v114-upload-recovery-20261022-001';
export const MESSAGE='release(v114): upload private controller inactive only';
export const NOTE='V114 private controller only; canonical AUTH '+TARGET+'; executable publishing OFF; source '+SOURCE;
const ROOT='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const hash=x=>createHash('sha256').update(x).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{mode:0o600});
const vars=bs=>Object.fromEntries(bs.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
const normalized=bs=>bs.map(b=>b.type==='d1'?{type:b.type,name:b.name,database_id:b.database_id}:b).sort((a,b)=>a.name.localeCompare(b.name));
export function plannedBindings(bs){
 assert.equal(bs.length,13);assert.equal(new Set(bs.map(x=>x.name)).size,13);
 assert.equal(bs.find(x=>x.name==='AUTH')?.service,APEX);
 assert.equal(bs.find(x=>x.name==='PACKAGE_NATIVE_STUDIO_ENABLED')?.text,'true');
 assert.equal(bs.find(x=>x.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED')?.text,'true');
 assert.equal(bs.find(x=>x.name==='PACKAGE_CANONICAL_AUTH_VERSION')?.text,'3ba8602c-6616-49a4-af29-1efe60ad164a');
 assert.deepEqual(bs.filter(x=>x.type==='secret_text').map(x=>x.name),['PACKAGE_PREVIEW_KEY']);
 assert.ok(bs.every(x=>['plain_text','secret_text','service','d1','r2_bucket'].includes(x.type)));
 return bs.map(b=>b.name==='PACKAGE_CANONICAL_AUTH_VERSION'?{...b,text:TARGET}:b.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED'?{...b,text:'false'}:b);
}
export function configuration(bs,main){
 const b=plannedBindings(bs);
 return {name:WORKER,account_id:ACCOUNT,main,compatibility_date:'2026-10-18',workers_dev:true,preview_urls:false,routes:[],upload_source_maps:false,
  vars:vars(b),services:b.filter(x=>x.type==='service').map(x=>({binding:x.name,service:x.service,environment:x.environment})),
  d1_databases:b.filter(x=>x.type==='d1').map(x=>({binding:x.name,database_id:x.database_id})),
  r2_buckets:b.filter(x=>x.type==='r2_bucket').map(x=>({binding:x.name,bucket_name:x.bucket_name}))};
}
export function verifyBaseline(s){
 assert.equal(s.deployment.id,'6306bbbf-7954-4f91-850c-9b0edf89dca4');
 assert.deepEqual(s.deployment.versions,[{version_id:PUBLIC,percentage:100},{version_id:PRIOR,percentage:0}]);
 assert.equal(s.live.id,PUBLIC);assert.equal(s.prior.id,PRIOR);
 assert.equal(s.live.resources.script.etag,'1bc2d678522f7eac92a273648db5cb9e36afac88a7813be53cdeebb08d5139e4');
 assert.equal(s.prior.resources.script.etag,'dfae79f4474d1dc905b82d44c647725aabe52b7e8fe0b219bf1c777289ec9870');
 // Preserve the existing GET-only inspection hostname; it is not a login domain.
 assert.deepEqual(s.exposure,{enabled:true,previews_enabled:false});
 assert.equal(hash(stable(normalized(s.settings.bindings))),hash(stable(normalized(s.prior.resources.bindings))),'Latest binding baseline changed');
 assert.equal(s.settings.compatibility_date,'2026-10-18');
 assert.equal(s.routes.length,40);
 assert.equal(s.apexDeployment.id,'6372ee35-8c7d-468c-9486-536d9c4b0a0d');
 assert.deepEqual(s.apexDeployment.versions,[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:'6f26f0cc-6eee-483d-9f07-329e45bd5e76',percentage:0}]);
 assert.equal(s.apex.id,TARGET);assert.equal(s.apex.resources.script.etag,'bb20187a20e7174cfdf7451c24f4274a00bfa2c3e2570d29d9f9b3018682acc2');
 const av=vars(s.apex.resources.bindings);assert.equal(av.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');assert.equal(av.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(s.entryExpiry,'1792711995');assert.ok(Number(s.entryExpiry)<Date.now()/1000,'Test window must remain closed during inactive preparation');
 assert.equal(s.entryDeployment.id,'984dd104-3642-47f8-8983-0fde8a337ce9');
 assert.deepEqual(s.entryDeployment.versions,[{version_id:'406ef0ca-cfaa-411f-812d-1fb390b91ffc',percentage:100}]);
 plannedBindings(s.prior.resources.bindings);
 return true;
}
export function verifyUploaded(before,after,candidate,bundleHash){
 // Inactive uploads update latest settings vars, while deployed immutable versions stay fixed.
 const expected=plannedBindings(before.prior.resources.bindings);
 const expectedSettings={...before.settings,bindings:before.settings.bindings.map(b=>expected.find(x=>x.name===b.name))};
 const operational=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='annotations'));
 assert.equal(hash(stable(operational(after.settings))),hash(stable(operational(expectedSettings))),'Unplanned operational settings drift');
 assert.equal(hash(stable(after.deployment)),hash(stable(before.deployment)),'Serving controller deployment changed');
 assert.equal(hash(stable(after.live.resources)),hash(stable(before.live.resources)),'Serving controller resources changed');
 assert.equal(hash(stable(after.apexDeployment)),hash(stable(before.apexDeployment)),'Apex deployment changed');
 assert.equal(hash(stable(after.routes)),hash(stable(before.routes)),'Routes changed');
 assert.deepEqual(after.exposure,before.exposure);assert.equal(hash(stable(after.entryDeployment)),hash(stable(before.entryDeployment)));assert.equal(after.entryExpiry,before.entryExpiry);
 const added=after.versions.filter(x=>!before.versions.some(v=>v.id===x.id));assert.equal(added.length,1);assert.equal(candidate.id,added[0].id);
 assert.ok(!after.deployment.versions.some(x=>x.version_id===candidate.id));
 assert.equal(candidate.annotations?.['workers/message'],NOTE);
 assert.equal(hash(stable(normalized(candidate.resources.bindings))),hash(stable(normalized(expected))),'Private candidate bindings changed');
 assert.deepEqual(candidate.resources.script_runtime,before.prior.resources.script_runtime);
 return {status:'PRIVATE_CONTROLLER_UPLOADED_INACTIVE',versionId:candidate.id,sourceSha:SOURCE,bundleSha256:bundleHash,authTarget:TARGET,
  publicPublishingEnabled:false,nativeStudioEnabled:true,servingControllerUnchanged:true,apexDeploymentUnchanged:true,
  routesUnchanged:true,secretValuesRetrieved:false,roleAllowlistUnchanged:true,newVersionTrafficPercent:0,
  routingRulesetVerifiedByUploadJob:false,protectedRoutingActivated:false,authPinEligibleInCurrentApexDeployment:false,authenticatedAcceptance:false,productionReleaseApproved:false};
}
async function get(path,github=false){
 const r=await fetch((github?'https://api.github.com':'https://api.cloudflare.com/client/v4')+path,{method:'GET',headers:{authorization:'Bearer '+(github?process.env.GH_TOKEN:process.env.CLOUDFLARE_API_TOKEN),accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
 assert.equal(r.ok,true,'Read-only provider HTTP '+r.status);const j=await r.json();if(github)return j;assert.equal(j.success,true);return j.result;
}
async function snapshot(){
 const a='/accounts/'+ACCOUNT+'/workers/scripts/'+APEX;
 const [d,live,prior,settings,exposure,routes,v,ad,apex,entry,ed]=await Promise.all([get(ROOT+'/deployments'),get(ROOT+'/versions/'+PUBLIC),get(ROOT+'/versions/'+PRIOR),get(ROOT+'/settings'),get(ROOT+'/subdomain'),get('/zones/8abe27259b5436af5966d3b40d9a3760/workers/routes'),get(ROOT+'/versions?per_page=100'),get(a+'/deployments'),get(a+'/versions/'+TARGET),get('/accounts/'+ACCOUNT+'/workers/scripts/anevum-v095-v096-acceptance-entry/versions/406ef0ca-cfaa-411f-812d-1fb390b91ffc'),get('/accounts/'+ACCOUNT+'/workers/scripts/anevum-v095-v096-acceptance-entry/deployments')]);
 // The CI token has Worker permissions, not Rulesets Read. This inactive-only
 // operation does not select a version or renew routing. Live ruleset checks
 // remain mandatory in the separately authorized protected staging operation.
 return {deployment:d.deployments[0],live,prior,settings,exposure,routes,versions:v.items,apexDeployment:ad.deployments[0],apex,entryDeployment:ed.deployments[0],entryExpiry:entry.resources.bindings.find(x=>x.name==='QA_EXPIRES_AT')?.text};
}
async function guard(){
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');assert.equal(process.env.GITHUB_ACTOR,'anevum');assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH);assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15);assert.ok(process.env.GH_TOKEN?.length>15);
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
 assert.equal(git('log','-1','--format=%B'),MESSAGE);assert.equal(git('rev-parse','HEAD'),process.env.GITHUB_SHA);
 const path='.github/release-approvals/v114-private-controller.json';assert.equal(git('diff-tree','--no-commit-id','--name-only','-r','HEAD'),path);
 const m=load(path),ops=git('rev-parse','HEAD^');
 assert.deepEqual(m,{reviewed_operations_sha:ops,source:SOURCE,worker:WORKER,authTarget:TARGET,allowInactiveUpload:true,allowDeployment:false,allowRouting:false,allowDatabaseWrites:false,allowPublicPublishing:false});
 const allowed=new Set(['creator-v1/ops/native-private-controller-v114.mjs','creator-v1/test/native-private-controller-v114.test.mjs','creator-v1/ops/protected-routing-v114.mjs','creator-v1/test/protected-routing-v114.test.mjs','.github/workflows/v114-private-controller.yml','docs/production/v114-private-controller-20261022.md']);
 assert.ok(git('diff','--name-only',SOURCE,ops).split('\n').filter(Boolean).every(x=>allowed.has(x)));
 const [checks,release]=await Promise.all([get('/repos/anevum/anevum-web/commits/'+ops+'/check-runs?per_page=100',true),get('/repos/anevum/anevum-web/git/ref/heads/release/v084-continuance-approved-20261019',true)]);
 for(const name of ['verify-private','verify','verified-source','emblem-and-reputation','source']){const c=checks.check_runs.find(x=>x.name===name);assert.equal(c?.status,'completed');assert.equal(c.conclusion,'success');}
 execFileSync('git',['merge-base','--is-ancestor',ops,release.object.sha]);return ops;
}
async function before(config,state){
 const ops=await guard(),s=await snapshot();verifyBaseline(s);
 save(state,{snapshot:s,operationsSha:ops});save(config,configuration(s.prior.resources.bindings,resolve('site/alpha/v003/api.mjs')));
 console.log('PRIVATE_CONTROLLER_INACTIVE_PREFLIGHT=PASS; DEPLOYMENT=FORBIDDEN; WINDOW=CLOSED');
}
async function seal(config,bundle){
 const c=load(config),main=join(resolve(bundle),'api.js');assert.ok(readFileSync(main).length>10000);
 const h=hash(readFileSync(main));c.main=main;c.no_bundle=true;save(config,c);writeFileSync(join(resolve(bundle),'sha256.txt'),h+'\n');
 console.log(JSON.stringify({status:'PRIVATE_CONTROLLER_COMPILED',bundleSha256:h}));
}
async function after(state,bundle,receipt){
 const ops=await guard(),b=load(state);assert.equal(b.operationsSha,ops);const s=await snapshot();
 const added=s.versions.filter(x=>!b.snapshot.versions.some(v=>v.id===x.id));assert.equal(added.length,1);
 const candidate=await get(ROOT+'/versions/'+added[0].id),h=readFileSync(join(resolve(bundle),'sha256.txt'),'utf8').trim();
 assert.equal(hash(readFileSync(join(resolve(bundle),'api.js'))),h);
 const r=verifyUploaded(b.snapshot,s,candidate,h);save(receipt,r);console.log(JSON.stringify(r));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,...a]=process.argv.slice(2);
 if(cmd==='before'&&a.length===2)await before(...a);else if(cmd==='seal'&&a.length===2)await seal(...a);else if(cmd==='after'&&a.length===3)await after(...a);else throw Error('Use before <config> <state>, seal <config> <bundle>, after <state> <bundle> <receipt>');
}
