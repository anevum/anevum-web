/** PARITY frontend-only release. Original V131 Worker bytes and V132 systems retained.
 * This helper performs provider GETs only. Wrangler uploads an inactive version;
 * traffic activation is a separate, observable Cloudflare operation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,cpSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const BASE='baa92c0cbdcce71bd0ae5862e574c90ac53d84a9';
export const WORKER='anevum-apex-prelaunch-gateway';
export const ACCOUNT='2f7ee83107240152097efd956a4e8335';
export const V131='44f5971b-4cc9-4e7e-ab6a-1adb6fc5c12e',V132='de673bf1-ef05-4276-af16-2ee8713d965c';
export const GATEWAY='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
const ROOT=`/accounts/${ACCOUNT}/workers/scripts/${WORKER}`;
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const allowed=new Set([
 '.github/workflows/parity-v136-release.yml','creator-v1/ops/parity-v136-release.mjs',
 'creator-v1/test/parity-v136-discover-browser.mjs',
 'creator-v1/web/src/pages/DiscoverPage.tsx',
 'creator-v1/web/src/parity/ParityDiscoverV136.tsx',
 'creator-v1/web/src/parity/parity-discover-v136.css',
 'creator-v1/test/parity-v136-full-browser.mjs','docs/production/parity-v136-release-20261024.md',
 'creator-v1/web/src/main.tsx','creator-v1/web/vite.config.ts',
 'creator-v1/web/src/components/Shell.tsx','creator-v1/web/src/pages/CinematicLandingPage.tsx',
 ...['ParityHeaderV136.tsx','ParityPortalV136.tsx','ParityScene.tsx','visual-foundation-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 ...['institute-768.webp','institute-1536.webp','institute-1672.webp','manifest.json'].map(x=>'creator-v1/web/public/assets/parity-v136/'+x)
]);
export function source(){
 git('merge-base','--is-ancestor',BASE,'HEAD');
 const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
 assert.ok(changed.length);for(const p of changed)assert.ok(allowed.has(p),'Unreviewed release change '+p);
 assert.equal(git('diff','--name-only','--','creator-v1/web/src','creator-v1/apex-prelaunch','creator-v1/canonical-auth'),'','Uncommitted application edits');
 return {head:git('rev-parse','HEAD'),base:BASE,changed};
}
function walk(dir,root=dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name),root):[{path:join(dir,e.name).slice(root.length+1),sha256:hash(readFileSync(join(dir,e.name)))}]).sort((a,b)=>a.path.localeCompare(b.path));}
export function pack(oldRoot,freshRoot,out){
 const identity=source();mkdirSync(out,{recursive:true});
 assert.equal(hash(readFileSync(join(oldRoot,'worker-bundle/gateway.js'))),GATEWAY);
 const media=walk(join(oldRoot,'compiled-web')).filter(x=>x.path.startsWith('evolution/assets/'));
 assert.equal(media.length,152);
 cpSync(join(oldRoot,'compiled-web'),join(out,'compiled-web'),{recursive:true});
 cpSync(freshRoot,join(out,'compiled-web'),{recursive:true});
 cpSync(join(oldRoot,'worker-bundle'),join(out,'worker-bundle'),{recursive:true});
 assert.deepEqual(walk(join(out,'compiled-web')).filter(x=>x.path.startsWith('evolution/assets/')),media);
 const inventory=walk(join(out,'compiled-web'));assert.equal(inventory.some(x=>x.path.endsWith('.map')),false);
 const report={session:'ANEVUM.WEB.BUILD.2026-10-24.001.PARITY-V136',source:identity,worker:WORKER,gatewaySha256:GATEWAY,
  assetCount:inventory.length,assetsSha256:hash(stable(inventory)),earnedMediaCount:media.length,
  originalBackendUnchanged:true,uploaded:false,activated:false,authenticatedAcceptance:false,physicalSafariAcceptance:false};
 save(join(out,'manifest.json'),report);save(join(out,'assets.json'),inventory);return report;
}
async function get(path){
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15,'Cloudflare token required');
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000),redirect:'error'});
 const j=await response.json();assert.ok(response.ok&&j.success,'Provider GET failed '+path+' '+response.status);return j.result;
}
const signatures=b=>b.map(x=>({name:x.name,type:x.type,...(x.type==='plain_text'?{text:x.text}:{}),...(x.type==='d1'?{database_id:x.database_id}:{})})).sort((a,b)=>a.name.localeCompare(b.name));
async function snapshot(){
 const [deploy,settings,original,controller,routes,versions]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/settings'),get(ROOT+'/versions/'+V131),
  get(`/accounts/${ACCOUNT}/workers/scripts/anevum-package-alpha-v003-control/deployments`),
  get(`/zones/${ZONE}/workers/routes`),get(ROOT+'/versions?per_page=100')]);
 return {deployment:deploy.deployments[0],settings,original,controller:controller.deployments[0],routes,versions:versions.items};
}
function verifyBefore(s){
 assert.equal(s.deployment.id,'a17c98bb-e59e-4384-bdc6-1b397169d94a','Production changed; inspect before retry');
 assert.deepEqual(s.deployment.versions,[{version_id:V131,percentage:99},{version_id:V132,percentage:1}]);
 assert.equal(s.settings.bindings.length,26);assert.deepEqual(signatures(s.settings.bindings),signatures(s.original.resources.bindings));
 assert.equal(s.controller.id,'4c832ec7-ce67-4864-832c-9b0b470af92d','Controller changed; inspect');
 assert.equal(s.routes.length,40,'Route inventory changed; inspect');
 const vars=Object.fromEntries(s.settings.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
 assert.equal(vars.CANONICAL_XP_TEST_ENABLED,'false');assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(vars.ANEVUM_PRELAUNCH_MODE,'public');assert.equal(vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,'true');
}
async function before(out){
 const p=load(join(out,'manifest.json'));assert.equal(p.source.head,git('rev-parse','HEAD'));assert.equal(p.gatewaySha256,GATEWAY);
 assert.equal(hash(stable(walk(join(out,'compiled-web')))),p.assetsSha256);assert.equal(hash(readFileSync(join(out,'worker-bundle/gateway.js'))),GATEWAY);
 const s=await snapshot();verifyBefore(s);save(join(out,'provider-before.json'),s);
 const runtime=s.original.resources.script_runtime;
 const config={name:WORKER,account_id:ACCOUNT,main:resolve(out,'worker-bundle/gateway.js'),no_bundle:true,
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:resolve(out,'compiled-web'),binding:'ASSETS',run_worker_first:true,not_found_handling:'single-page-application'},
  vars:Object.fromEntries(s.settings.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text])),
  d1_databases:s.settings.bindings.filter(x=>x.type==='d1').map(x=>({binding:x.name,database_id:x.database_id}))};
 save(join(out,'upload.json'),config);return {status:'INACTIVE_UPLOAD_PREFLIGHT_PASS',source:p.source.head,bindings:26,secretNamesOnly:true};
}
async function after(out){
 const original=load(join(out,'provider-before.json'));const now=await snapshot();verifyBefore(now);
 assert.equal(stable(now.deployment),stable(original.deployment));assert.equal(stable(now.controller),stable(original.controller));assert.equal(stable(now.routes),stable(original.routes));
 assert.deepEqual(signatures(now.settings.bindings),signatures(original.settings.bindings));
 const added=now.versions.filter(x=>!original.versions.some(y=>y.id===x.id));assert.equal(added.length,1);
 const v=await get(ROOT+'/versions/'+added[0].id);
 assert.deepEqual(signatures(v.resources.bindings),signatures(original.original.resources.bindings));
 assert.deepEqual(v.resources.script_runtime,original.original.resources.script_runtime);
 assert.equal(v.annotations?.['workers/message'],'PARITY V136 frontend '+git('rev-parse','HEAD')+'; V131 gateway unchanged; INACTIVE');
 const result={status:'VERIFIED_INACTIVE_PARITY_VERSION',version:v.id,number:v.number,source:git('rev-parse','HEAD'),gatewaySha256:GATEWAY,rollback:[V131,V132],trafficChanged:false,controllerChanged:false,bindingsPreserved:true,routesPreserved:true,memberDataChanged:false};
 save(join(out,'inactive-receipt.json'),result);return result;
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='source')console.log(JSON.stringify(source()));
else if(cmd==='package')console.log(JSON.stringify(pack(...args)));
else if(cmd==='before')console.log(JSON.stringify(await before(...args)));
else if(cmd==='after')console.log(JSON.stringify(await after(...args)));
