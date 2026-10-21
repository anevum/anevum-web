/** Read-only reconciliation of the version created by run 39587327363. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {downloadDigest,parseModules,patchUi,STAFF} from './v100-observatory-ui-candidate.mjs';
const ACCOUNT='2f7ee83107240152097efd956a4e8335',ZONE='8abe27259b5436af5966d3b40d9a3760';
const BASE='/accounts/'+ACCOUNT+'/workers/scripts/'+STAFF;
const PRIOR='03b731d4-be7f-480c-80ad-c50683a2dc8f';
const EXPECTED_DOWNLOAD='6776b686d7832f2146cd2d2a871d04d79826e44ae9a0f3bdc45e41b7d943c4a5';
const EXPECTED_UI='2d5cb865963310ff620be057763802891117ab108499275cd926400ccffb8795';
const HASH=s=>createHash('sha256').update(s).digest('hex');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const equal=(a,b)=>stable(a)===stable(b);
const sortBindings=b=>b.toSorted((a,b)=>a.name.localeCompare(b.name));
const bindings=b=>sortBindings(b.map(({id,...v})=>v.type==='d1'?{...v,database_id:v.database_id||id}:v));
const differences=(a,b,keys)=>keys.filter(k=>!equal(a[k],b[k]));
const annotationKeys=['workers/message','workers/tag','workers/triggered_by'];
export function decodeModules(version){
 assert.ok(Array.isArray(version.modules)&&version.modules.length>0&&version.modules.length<=4,'Unexpected module inventory');
 const modules=version.modules.map(m=>{
  assert.ok(typeof m.name==='string'&&/^[A-Za-z0-9_.-]+\.m?js$/.test(m.name)&&!m.name.includes('..'),'Unexpected module name');
  assert.ok(/^(?:application|text)\/(?:javascript|ecmascript)(?:\+module)?$/i.test(m.content_type),'Unexpected module type');
  assert.ok(typeof m.content_base64==='string'&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(m.content_base64),'Invalid module encoding');
  const bytes=Buffer.from(m.content_base64,'base64');
  const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  assert.ok(Buffer.from(source).equals(bytes),'Module is not exact UTF-8');
  return {name:m.name,source};
 });
 assert.ok(new Set(modules.map(m=>m.name)).size===modules.length,'Duplicate modules');
 return modules.toSorted((a,b)=>a.name.localeCompare(b.name));
}
export async function reconcile(read,candidate){
 assert.ok(HASH(candidate.trimEnd()+'\n')===EXPECTED_UI,'Reviewed UI source changed');
 const paths={deployment:BASE+'/deployments',settings:BASE+'/settings',source:BASE,
  routes:'/zones/'+ZONE+'/workers/routes',exposure:BASE+'/subdomain',versions:BASE+'/versions?per_page=100',
  apex:'/accounts/'+ACCOUNT+'/workers/scripts/anevum-apex-prelaunch-gateway/deployments',retained:BASE+'/versions/'+PRIOR,
  scriptSettings:BASE+'/script-settings'};
 const snapshot=async()=>Object.fromEntries(await Promise.all(Object.entries(paths).map(async([key,path])=>[key,await read(path,key!=='source')])));
 const before=await snapshot();
 const items=before.versions.items||[];
 const inWindow=items.filter(v=>{const time=Date.parse(v.metadata?.created_on);return time>=Date.parse('2026-10-21T10:50:40Z')&&time<Date.parse('2026-10-21T10:50:46Z');});
 const deployment=before.deployment.deployments?.[0];
 const apex=before.apex.deployments?.[0];
 const retained=before.retained.resources;
 const out={readOnly:true,upload_run_id:39587327363,source_sha:'28f163a0015631b1d8eb58922c03596ae8febd22',prior_version:PRIOR,
  historical_pre_upload_snapshot_available:false,settings_change_from_failed_upload_unresolved:true,
  candidate_count_in_upload_window:inWindow.length,candidate_ids:inWindow.map(v=>v.id),
  recent_versions:items.slice(0,5).map(v=>({id:v.id,created_on:v.metadata?.created_on})),
  staff_deployment:{id:deployment?.id,versions:deployment?.versions},
  staff_still_on_retained_version:equal(deployment?.versions,[{version_id:PRIOR,percentage:100}]),
  apex_deployment:{id:apex?.id,versions:apex?.versions},
  apex_matches_recorded_release:apex?.id==='d4476123-1819-4379-8c59-d035b2841c04'&&equal(apex?.versions,[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:'3ba8602c-6616-49a4-af29-1efe60ad164a',percentage:0}]),
  public_preview_disabled:before.exposure.enabled===false&&before.exposure.previews_enabled===false,
  script_download_matches_prior:downloadDigest(before.source)===EXPECTED_DOWNLOAD,
  script_download_digest:downloadDigest(before.source),
  settings_fields:Object.keys(before.settings).sort(),script_settings_fields:Object.keys(before.scriptSettings).sort(),
  settings_bindings_raw_equal_prior:equal(before.settings.bindings,retained.bindings),
  settings_bindings_orderless_equal_prior:equal(sortBindings(before.settings.bindings),sortBindings(retained.bindings)),
  settings_bindings_normalized_equal_prior:equal(bindings(before.settings.bindings),bindings(retained.bindings)),
  settings_runtime_changed_fields:differences(before.settings,retained.script_runtime,Object.keys(retained.script_runtime)),
  settings_shared_fields_differ_from_script_endpoint:differences(before.settings,before.scriptSettings,Object.keys(before.scriptSettings)),
  settings_annotations_differ_from_prior:differences(before.settings.annotations||{},before.retained.annotations||{},annotationKeys),
  routes_digest:HASH(stable(before.routes)),
  staff_route_matches_recorded_release:equal(before.routes.filter(r=>r.script===STAFF).map(r=>({pattern:r.pattern,script:r.script,request_limit_fail_open:r.request_limit_fail_open})),[{pattern:'anevum.com/staff/observatory*',script:STAFF,request_limit_fail_open:false}]),
  production_activated:false,physical_iphone_tested:false};
 if(inWindow.length===1){
  const id=inWindow[0].id;assert.match(id,/^[a-f0-9-]{36}$/);
  const uploaded=await read(BASE+'/versions/'+id);
  out.candidate_bindings_match_prior=equal(bindings(uploaded.resources.bindings),bindings(retained.bindings));
  out.candidate_runtime_matches_prior=equal(uploaded.resources.script_runtime,retained.script_runtime);
  out.candidate_annotations_changed_fields=differences(uploaded.annotations||{},before.retained.annotations||{},annotationKeys);
  out.settings_annotations_match_candidate=equal(before.settings.annotations||{},uploaded.annotations||{});
  try{
   const versionPath=id=>'/accounts/'+ACCOUNT+'/workers/workers/'+STAFF+'/versions/'+id+'?include=modules';
   const [oldVersion,newVersion]=await Promise.all([read(versionPath(PRIOR)),read(versionPath(id))]);
   assert.ok(oldVersion.id===PRIOR&&newVersion.id===id,'Version source identity mismatch');
   const oldModules=decodeModules(oldVersion),newModules=decodeModules(newVersion);
   const expected=(await patchUi(oldModules,candidate)).toSorted((a,b)=>a.name.localeCompare(b.name));
   out.version_source_readable=true;
   out.candidate_modules_exactly_match_ui_patch=equal(newModules,expected);
   out.main_module_preserved=oldVersion.main_module===newVersion.main_module;
   out.retained_module_digests=oldModules.map(m=>({name:m.name,sha256:HASH(m.source)}));
   out.retained_source_matches_recorded_release=oldModules.length===1&&HASH(oldModules[0].source.trimEnd()+'\n')==='856fe98d1fefc3be22b73732a7276402b2b6fd7600a6135251ede153e2690301';
   out.candidate_module_digests=newModules.map(m=>({name:m.name,sha256:HASH(m.source)}));
   out.download_matches_retained_modules=equal(parseModules(before.source).toSorted((a,b)=>a.name.localeCompare(b.name)),oldModules);
   out.download_matches_candidate_modules=equal(parseModules(before.source).toSorted((a,b)=>a.name.localeCompare(b.name)),newModules);
   const settingsKeys=Object.keys(before.settings).filter(k=>k!=='annotations'&&k!=='bindings'&&k in oldVersion);
   out.settings_version_fields_compared=settingsKeys;
   out.settings_version_fields_differ_from_prior=differences(before.settings,oldVersion,settingsKeys);
   const versionKeys=Object.keys(oldVersion).filter(k=>!['id','created_on','number','urls','annotations','author_email','author_id','source','startup_time_ms','modules'].includes(k));
   out.candidate_version_fields_differ_from_prior=differences(newVersion,oldVersion,versionKeys);
  }catch(error){
   out.version_source_readable=false;out.version_source_check_failed=true;
   if(Number.isInteger(error.status))out.version_source_http_status=error.status;
  }
 }
 const routeBaseline=JSON.parse(readFileSync(new URL('../operations/staff-transport-v091.json',import.meta.url),'utf8')).routes;
 const entryRoutes=before.routes.filter(r=>/^anevum\.com\/__enter\/v095-v096\*?$/.test(r.pattern));
 const routeLock=rows=>rows.map(r=>({pattern:r.pattern,script:r.script,request_limit_fail_open:r.request_limit_fail_open})).toSorted((a,b)=>a.pattern.localeCompare(b.pattern));
 out.routes_match_recorded_release_with_one_existing_entry=entryRoutes.length===1&&equal(routeLock(before.routes.filter(r=>!entryRoutes.includes(r))),routeLock(routeBaseline));
 const after=await snapshot();
 out.state_stable_during_reconciliation=Object.keys(paths).every(k=>k==='source'?downloadDigest(before[k])===downloadDigest(after[k]):equal(before[k],after[k]));
 out.status='READ_ONLY_RECONCILIATION';
 return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.GITHUB_REF,'refs/heads/ops/v100-candidate-acceptance-20261021-001');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);assert.ok(process.env.CLOUDFLARE_API_TOKEN);
 const read=async(path,json=true)=>{
  assert.ok(path.startsWith(BASE)||path==='/zones/'+ZONE+'/workers/routes'||path==='/accounts/'+ACCOUNT+'/workers/scripts/anevum-apex-prelaunch-gateway/deployments'||path.startsWith('/accounts/'+ACCOUNT+'/workers/workers/'+STAFF+'/versions/'),'Unexpected read target');
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok){const error=new Error('Read-only Cloudflare request failed');error.status=response.status;throw error;}
  if(!json)return response.text();
  const data=await response.json();assert.ok(data.success===true,'Cloudflare read unsuccessful');return data.result;
 };
 const out=await reconcile(read,readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8'));
 if(process.env.RECEIPT_FILE)writeFileSync(process.env.RECEIPT_FILE,JSON.stringify(out,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(out));
}
