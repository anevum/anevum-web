/** Prepare a UI-only inactive version; preserve every live server byte and module. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const ACCOUNT='2f7ee83107240152097efd956a4e8335',ZONE='8abe27259b5436af5966d3b40d9a3760';
export const STAFF='anevum-iren-staff-observatory-v001';
const BASE='/accounts/'+ACCOUNT+'/workers/scripts/'+STAFF;
const PRIOR='03b731d4-be7f-480c-80ad-c50683a2dc8f';
const EXPECTED_DOWNLOAD='6776b686d7832f2146cd2d2a871d04d79826e44ae9a0f3bdc45e41b7d943c4a5';
const EXPECTED_UI_SOURCE='2d5cb865963310ff620be057763802891117ab108499275cd926400ccffb8795';
const names=['PAGE','STYLES','CLIENT'];
const hash=s=>createHash('sha256').update(s).digest('hex');
export const downloadDigest=s=>hash(s.startsWith('--')?s.split(s.split(/\r?\n/,1)[0]).join('--BOUNDARY'):s);
export function parseModules(download){
 if(!download.startsWith('--'))return [{name:'index.mjs',source:download}];
 const boundary=download.split(/\r?\n/,1)[0];
 assert.match(boundary,/^--[A-Za-z0-9_-]{4,}$/);
 const modules=download.split(boundary).slice(1).filter(s=>s.trim()&&s.trim()!=='--').map(part=>{
  part=part.replace(/^\r?\n/,'');
  const separator=/\r?\n\r?\n/.exec(part);assert.ok(separator,'Missing module headers');
  const headers=part.slice(0,separator.index);
  const name=/^content-disposition:[^\r\n]*\bname="([A-Za-z0-9_.-]+\.m?js)"/im.exec(headers)?.[1];
  assert.ok(name&&!name.includes('..'),'Unexpected module name');
  // Cloudflare's retained module download may omit this optional header.
  // Names remain restricted to JS and patchUi parses every module as JS.
  const types=[...headers.matchAll(/^content-type:([^\r\n]*)/gim)].map(match=>match[1].trim());
  assert.ok(types.length<=1,'Duplicate module content type');
  if(types.length)assert.ok(/^(?:application|text)\/(?:javascript|ecmascript)(?:\+module)?(?:\s*;[^\r\n]*)?$/i.test(types[0]),'Unexpected module content type');
  return {name,source:part.slice(separator.index+separator[0].length).replace(/\r?\n$/,'')};
 });
 assert.ok(modules.length>0&&modules.length<=4,'Unexpected module inventory');
 assert.equal(new Set(modules.map(m=>m.name)).size,modules.length,'Duplicate modules');
 return modules;
}
async function uiLiterals(source){
 const {parse}=await import('@babel/parser');
 const ast=parse(source,{sourceType:'module'}),found=[];
 for(let statement of ast.program.body){
  if(statement.type==='ExportNamedDeclaration')statement=statement.declaration;
  if(statement?.type!=='VariableDeclaration')continue;
  for(const declaration of statement.declarations){
   if(declaration.id.type!=='Identifier'||!names.includes(declaration.id.name))continue;
   assert.equal(declaration.init?.type,'StringLiteral','UI initializer must be a literal');
   found.push({name:declaration.id.name,start:declaration.init.start,end:declaration.init.end,value:declaration.init.value});
  }
 }
 return found;
}
export async function patchUi(modules,candidate){
 const approved=await uiLiterals(candidate);
 assert.deepEqual(approved.map(x=>x.name).sort(),[...names].sort(),'Candidate UI literals incomplete');
 const replacements=Object.fromEntries(approved.map(x=>[x.name,x.value]));
 const all=[];
 for(const module of modules)all.push({module,fields:await uiLiterals(module.source)});
 assert.deepEqual(all.flatMap(x=>x.fields.map(f=>f.name)).sort(),[...names].sort(),'Live UI literals incomplete or duplicated');
 const result=all.map(({module,fields})=>{
  let source=module.source;
  for(const field of fields.sort((a,b)=>b.start-a.start))source=source.slice(0,field.start)+JSON.stringify(replacements[field.name])+source.slice(field.end);
  return {...module,source};
 });
 // Compare all non-UI bytes, including imports, authorization and every SQL statement.
 const erase=async source=>{
  const fields=await uiLiterals(source);
  for(const field of fields.sort((a,b)=>b.start-a.start))source=source.slice(0,field.start)+'"UI_'+field.name+'"'+source.slice(field.end);
  return source;
 };
 for(let i=0;i<modules.length;i++)assert.ok(await erase(result[i].source)===await erase(modules[i].source),'Non-UI byte changed');
 return result;
}
export async function uploadMetadata(settings,modules,runtime={}){
 const {parse}=await import('@babel/parser');
 const entrypoints=modules.filter(module=>parse(module.source,{sourceType:'module'}).program.body.some(statement=>
  statement.type==='ExportDefaultDeclaration'||statement.type==='ExportNamedDeclaration'&&(statement.specifiers||[]).some(specifier=>
   specifier.exported?.name==='default'||specifier.exported?.value==='default')));
 assert.equal(entrypoints.length,1,'Expected exactly one module entrypoint');
 const bindings=settings.bindings.map(({id,...binding})=>{
  if(binding.type!=='d1')return binding;
  const database_id=binding.database_id||id;
  assert.ok(typeof database_id==='string'&&database_id.length>0,'Missing database binding identifier');
  return {...binding,database_id};
 });
 const metadata={main_module:entrypoints[0].name,bindings};
 const runtimeKeys=['compatibility_date','compatibility_flags','usage_model'];
 assert.ok(Object.keys(runtime).every(key=>runtimeKeys.includes(key)||runtime[key]==null),'Retained runtime needs an unsupported upload setting');
 // Version uploads do not accept nonversioned script settings. The snapshot
 // comparison verifies that those settings are preserved without rewriting them.
 for(const key of runtimeKeys){
  if(key in runtime&&key in settings)assert.ok(stable(runtime[key])===stable(settings[key]),'Retained runtime disagrees with live settings');
  if(key in runtime)metadata[key]=runtime[key];
  else if(key in settings)metadata[key]=settings[key];
 }
 return metadata;
}
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const bindingLock=bindings=>stable(bindings.map(({id,...b})=>b.type==='d1'?{name:b.name,type:b.type,database_id:b.database_id||id}:b).sort((a,b)=>a.name.localeCompare(b.name)));
export async function prepareInactive(api,{candidate,apply=false}={}){
 assert.equal(hash(candidate.trimEnd()+'\n'),EXPECTED_UI_SOURCE,'Reviewed UI source changed');
 const snapshot=async()=>{
  const [deployment,settings,source,routes,exposure,versions,apex,retained]=await Promise.all([
   api('GET',BASE+'/deployments'),api('GET',BASE+'/settings'),api('GET',BASE,false),
   api('GET','/zones/'+ZONE+'/workers/routes'),api('GET',BASE+'/subdomain'),api('GET',BASE+'/versions?per_page=100'),
   api('GET','/accounts/'+ACCOUNT+'/workers/scripts/anevum-apex-prelaunch-gateway/deployments'),api('GET',BASE+'/versions/'+PRIOR)]);
  return {deployment,settings,source,routes,exposure,versions,apex,retained};
 };
 const before=await snapshot();
 assert.deepEqual(before.deployment.deployments?.[0]?.versions,[{version_id:PRIOR,percentage:100}],'Live staff version changed');
 assert.equal(downloadDigest(before.source),EXPECTED_DOWNLOAD,'Retained live source changed');
 assert.equal(before.exposure.enabled,false);assert.equal(before.exposure.previews_enabled,false);
 const b=before.settings.bindings;
 assert.ok(Array.isArray(b)&&b.every(x=>['service','d1','plain_text'].includes(x.type)),'Unexpected staff bindings');
 assert.ok(b.some(x=>x.type==='service'&&x.name==='APEX_AUTH'&&x.service==='anevum-apex-prelaunch-gateway'));
 assert.ok(b.some(x=>x.type==='d1'&&x.name==='MEMBER_DB'&&(x.database_id||x.id)==='e1d29049-c83b-4534-8355-dc1fa36ba6d8'));
 const modules=await patchUi(parseModules(before.source),candidate);
 assert.equal(before.retained.id,PRIOR,'Retained version identity changed');
 assert.ok(before.retained.resources?.script_runtime,'Missing retained runtime');
 const metadata=await uploadMetadata(before.settings,modules,before.retained.resources.script_runtime);
 const receipt={readOnly:!apply,source_sha:'28f163a0015631b1d8eb58922c03596ae8febd22',prior_version:PRIOR,
  ui_source_sha256:EXPECTED_UI_SOURCE,server_bytes_preserved:true,ui_literals_replaced:3,production_activated:false,physical_iphone_tested:false};
 if(!apply)return receipt;
 const immediate=await snapshot();
 const lock=s=>stable({...s,source:downloadDigest(s.source)});
 assert.ok(lock(immediate)===lock(before),'Live configuration changed before upload');
 const version=await api('POST',BASE+'/versions',{metadata,modules});
 assert.match(version.id||'',/^[a-f0-9-]{36}$/);
 const uploaded=await api('GET',BASE+'/versions/'+version.id);
 assert.ok(bindingLock(uploaded.resources.bindings)===bindingLock(b),'Uploaded binding drift');
 assert.ok(stable(uploaded.resources.script_runtime)===stable(before.retained.resources.script_runtime),'Uploaded runtime drift');
 const after=await snapshot();
 for(const key of ['deployment','settings','source','routes','exposure','apex']){
  if(key==='source')assert.equal(downloadDigest(after.source),downloadDigest(before.source));
  else assert.ok(stable(after[key])===stable(before[key]),'Inactive upload changed '+key);
 }
 const added=(after.versions.items||[]).filter(x=>!(before.versions.items||[]).some(y=>x.id===y.id));
 assert.deepEqual(added.map(x=>x.id),[version.id],'Expected exactly one inactive version');
 return {...receipt,status:'UPLOADED_INACTIVE_ONLY',version_id:version.id,active_traffic_percent:100,candidate_traffic_percent:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 const args=process.argv.slice(2);assert.ok(args.length===1&&['--check','--upload-inactive'].includes(args[0]));
 const apply=args[0]==='--upload-inactive';
 if(apply){
  assert.equal(process.env.GITHUB_REF,'refs/heads/release/v084-continuance-approved-20261019');
  assert.equal(process.env.GITHUB_HEAD_MESSAGE,'release(v100): upload inactive Observatory UI only');
  const marker=JSON.parse(readFileSync('.github/release-approvals/v100-observatory-inactive-upload.json','utf8'));
  assert.deepEqual(marker,{source_sha:'28f163a0015631b1d8eb58922c03596ae8febd22',ui_source_sha256:EXPECTED_UI_SOURCE,
   baseline_version:PRIOR,allow_inactive_version_upload:true,allow_traffic_promotion:false,allow_route_changes:false,confirmed_by:'anevum'});
 }else assert.equal(process.env.GITHUB_REF,'refs/heads/ops/v100-candidate-acceptance-20261021-001');
 const token=process.env.CLOUDFLARE_API_TOKEN;assert.ok(token);
 const api=async(method,path,data)=>{
  assert.ok(method==='GET'||method==='POST'&&apply&&path===BASE+'/versions','Unexpected provider mutation');
  let body;
  if(method==='POST'){
   body=new FormData();body.append('metadata',new Blob([JSON.stringify(data.metadata)],{type:'application/json'}));
   for(const module of data.modules)body.append(module.name,new Blob([module.source],{type:'application/javascript+module'}),module.name);
  }
  const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,body,headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});
  assert.ok(r.ok,'Cloudflare request failed');if(data===false)return r.text();
  const result=await r.json();assert.equal(result.success,true);return result.result;
 };
 const receipt=await prepareInactive(api,{candidate:readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8'),apply});
 if(process.env.RECEIPT_FILE)writeFileSync(process.env.RECEIPT_FILE,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(receipt));
}
