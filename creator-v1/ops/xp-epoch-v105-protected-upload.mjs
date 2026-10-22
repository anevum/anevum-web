import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ACCOUNT,WORKER,LIVE,INACTIVE,LIVE_ETAG} from './xp-epoch-v105-live-cutover.mjs';
const API='https://api.cloudflare.com/client/v4',BASE='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;
const originalAssets=resolve('creator-v1/dist/web'),temp=process.env.RUNNER_TEMP;
const token=process.env.CLOUDFLARE_API_TOKEN;
const LOCK=()=>temp+'/v105-lock.json',CONFIG=()=>temp+'/v105-config.json',RECEIPT=()=>temp+'/v105-receipt.json';
function need(cond,message){assert.ok(cond,message)}
async function get(path){
 need(typeof token==='string'&&token.length>30,'Missing production token');
 const r=await fetch(API+path,{headers:{Authorization:'Bearer '+token}});
 const j=await r.json();need(r.ok&&j.success,'Cloudflare read failed: '+path);return j.result;
}
const countFiles=dir=>readdirSync(dir,{withFileTypes:true}).reduce((n,x)=>n+(x.isDirectory()?countFiles(join(dir,x.name)):x.isFile()?1:0),0);
async function inventory(){
 const [deploy,settings,live,versions,routes,exposure]=await Promise.all([
  get(BASE+'/deployments?per_page=1'),get(BASE+'/settings'),get(BASE+'/versions/'+LIVE),
  get(BASE+'/versions?per_page=4'),get('/zones/8abe27259b5436af5966d3b40d9a3760/workers/routes'),
  get(BASE+'/subdomain')
 ]);
 return {deployment:deploy.deployments?.[0],settings,live,versions:versions.items||[],routes,exposure};
}
const shape=a=>a.map(({pattern,script})=>({pattern,script}));
function beforeGuard(s){
 assert.deepEqual(s.deployment?.versions,[{version_id:LIVE,percentage:100},{version_id:INACTIVE,percentage:0}],'Production deployment drift');
 assert.equal(s.live.resources?.script?.etag,LIVE_ETAG,'Production Worker source drift');
 assert.equal(s.versions[0]?.id,INACTIVE,'Latest inactive version changed');
 const b=s.settings.bindings,find=n=>b.find(x=>x.name===n);
 assert.equal(find('ANEVUM_PRELAUNCH_MODE')?.text,'public');
 assert.equal(find('ANEVUM_LAUNCH_APPROVED')?.text,'true');
 assert.equal(find('CANONICAL_XP_TEST_ENABLED')?.text,'true');
 assert.equal(find('MEMBER_DB')?.database_id||find('MEMBER_DB')?.id,'e1d29049-c83b-4534-8355-dc1fa36ba6d8');
 assert.equal(find('COMMUNITY_DB')?.database_id||find('COMMUNITY_DB')?.id,'fa96e36d-6257-4883-bf15-074947e11a13');
 need(b.some(x=>x.name==='ASSETS'&&x.type==='assets'),'Assets binding changed');
 need(b.filter(x=>x.type==='secret_text').length>=4,'Expected encrypted secrets missing');
 need(Array.isArray(s.routes)&&s.routes.length>=38,'Production route inventory changed');
 need(s.live.resources.script_runtime.compatibility_date==='2026-10-17','Runtime drift');
}
export async function run(mode){
 need(temp&&mode&&['prepare','verify'].includes(mode),'Invalid release operation');
 if(mode==='prepare'){
  need(statSync(process.env.REVIEW_CANDIDATE_FILE).size>2000000,'Patched Worker bundle unavailable');
  assert.equal(countFiles(originalAssets),407,'Original complete public asset inventory changed');
  const state=await inventory();beforeGuard(state);
  const config=JSON.parse(readFileSync('creator-v1/wrangler.apex-prelaunch.jsonc','utf8'));
  assert.equal(config.name,WORKER);
  assert.deepEqual(config.routes,[]);
  assert.equal(config.preview_urls,false);
  config.$schema=resolve('node_modules/wrangler/config-schema.json');
  config.main=process.env.REVIEW_CANDIDATE_FILE;
  config.assets.directory=originalAssets;
  config.vars=Object.fromEntries(state.settings.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
  config.vars.CANONICAL_XP_TEST_ENABLED='false';
  assert.equal(config.vars.ANEVUM_PRELAUNCH_MODE,'public');
  assert.equal(config.vars.ANEVUM_LAUNCH_APPROVED,'true');
  const lock={deployment_id:state.deployment.id,versions:state.deployment.versions,
   existing:state.versions.map(x=>x.id),routes:shape(state.routes),
   names:state.settings.bindings.map(x=>({name:x.name,type:x.type})),
   old_version:LIVE,assets_count:407};
  writeFileSync(CONFIG(),JSON.stringify(config,null,2),{mode:0o600});
  writeFileSync(LOCK(),JSON.stringify(lock,null,2),{mode:0o600});
  return {status:'READY_TO_UPLOAD_INACTIVE',asset_files:407,original_version:LIVE};
 }
 const lock=JSON.parse(readFileSync(LOCK(),'utf8'));
 const state=await inventory();
 assert.equal(state.deployment?.id,lock.deployment_id,'Deployment ID drift after inactive upload');
 assert.deepEqual(state.deployment?.versions,lock.versions,'Public traffic changed');
 assert.deepEqual(shape(state.routes),lock.routes,'Routes changed');
 need(!lock.existing.includes(state.versions[0]?.id),'No new candidate version uploaded');
 const id=state.versions[0].id;
 need(/^[0-9a-f-]{36}$/.test(id),'Invalid candidate version');
 const candidate=await get(BASE+'/versions/'+id);
 const bindings=candidate.resources?.bindings||[],find=n=>bindings.find(b=>b.name===n);
 assert.equal(find('CANONICAL_XP_TEST_ENABLED')?.text,'false');
 assert.equal(find('ANEVUM_PRELAUNCH_MODE')?.text,'public');
 assert.equal(find('ANEVUM_LAUNCH_APPROVED')?.text,'true');
 assert.equal(find('MEMBER_DB')?.database_id||find('MEMBER_DB')?.id,'e1d29049-c83b-4534-8355-dc1fa36ba6d8');
 assert.equal(find('COMMUNITY_DB')?.database_id||find('COMMUNITY_DB')?.id,'fa96e36d-6257-4883-bf15-074947e11a13');
 need(bindings.filter(x=>x.type==='secret_text').length>=4,'Encrypted bindings missing');
 assert.deepEqual(candidate.resources?.script_runtime?.assets,state.live.resources?.script_runtime?.assets,'Asset routing changed');
 assert.equal(candidate.resources?.script_runtime?.compatibility_date,'2026-10-17');
 need(state.routes.length>=38,'Route count changed');
 const receipt={status:'UPLOADED_INACTIVE_ONLY',candidate_version:id,live_version:LIVE,asset_files:407,old_active_percent:100,new_percent:0,reset_activated:false,source_pr:620};
 writeFileSync(RECEIPT(),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 run(process.argv[2]).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1});
