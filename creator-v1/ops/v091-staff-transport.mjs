import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const manifest=JSON.parse(readFileSync(new URL('../operations/staff-transport-v091.json',import.meta.url),'utf8'));
export const digest=source=>createHash('sha256').update(source.trimEnd()+'\n').digest('hex');
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const routeLock=rows=>stable(rows.map(({pattern,script})=>({pattern,script})).sort((a,b)=>a.pattern.localeCompare(b.pattern)));
const settingsLock=s=>stable(Object.fromEntries(['bindings','compatibility_date','compatibility_flags','usage_model','tags','tail_consumers','logpush','placement','observability'].filter(k=>k in s).map(k=>[k,k==='bindings'?[...s[k]].sort((a,b)=>a.name.localeCompare(b.name)):s[k]])));
export function moduleSource(download){
 if(typeof download!=='string')throw Error('Worker source must be text');
 // A single-module download can be raw JavaScript or multipart, depending on
 // content negotiation. The caller must still match the exact pinned hash.
 if(!download.startsWith('--'))return download;
 const boundary=download.split(/\r?\n/,1)[0];
 const parts=download.split(boundary).slice(1).filter(p=>p.trim()&&p.trim()!=='--');
 if(parts.length!==1)throw Error('Unexpected Worker module count');
 const part=parts[0].replace(/^\r?\n/,''),separator=/\r?\n\r?\n/.exec(part);
 if(!separator||!part.slice(0,separator.index).includes('name="index.mjs"'))throw Error('Unexpected Worker module layout');
 return part.slice(separator.index+separator[0].length).replace(/\r?\n$/,'');
}
function currentVersion(value){
 const versions=value.deployments?.[0]?.versions;
 if(versions?.length!==1||versions[0].percentage!==100)throw Error('Worker is not at one stable deployment');
 return versions[0].version_id;
}

/** Default is read-only. Production writes require the existing approved release workflow. */
export async function repairStaffTransport(api,{apply=false,context=process.env,readSource=name=>readFileSync(new URL('../operations/'+name+'.mjs',import.meta.url),'utf8')}={}){
 const prefix='/accounts/'+manifest.account_id+'/workers/scripts/';
 const routesPath='/zones/'+manifest.zone_id+'/workers/routes';
 const routes=await api('GET',routesPath),routesBefore=routeLock(routes);
 if(routes.length!==36)throw Error('Live routes changed; review before repair');
 const plans=[];
 for(const worker of manifest.workers){
  const base=prefix+worker.name;
  const [settings,deployment,download]=await Promise.all([api('GET',base+'/settings'),api('GET',base+'/deployments'),api('GET',base)]);
  const version=currentVersion(deployment),live=digest(moduleSource(download)),candidate=readSource(worker.name);
  if(digest(candidate)!==worker.candidate_sha256)throw Error('Candidate source drift: '+worker.name);
  if(!settings.bindings?.some(b=>b.type==='service'&&['APEX_AUTH','AUTH'].includes(b.name)&&b.service==='anevum-apex-prelaunch-gateway')||
    !settings.bindings.some(b=>b.type==='d1'&&['MEMBER_DB','DB'].includes(b.name)&&(b.database_id||b.id)==='e1d29049-c83b-4534-8355-dc1fa36ba6d8')||
    settings.bindings.some(b=>!['service','d1','assets','plain_text'].includes(b.type)))throw Error('Unexpected staff bindings: '+worker.name);
  if(live===worker.candidate_sha256){plans.push({...worker,alreadyRepaired:true});continue;}
  if(version!==worker.baseline_version||live!==worker.baseline_sha256)throw Error('Live source/version drift: '+worker.name);
  const metadata={main_module:'index.mjs',keep_assets:true,bindings:settings.bindings.map(({id,...binding})=>binding)};
  for(const key of ['compatibility_date','compatibility_flags','usage_model','tags','tail_consumers','logpush','placement','observability'])
   if(key in settings)metadata[key]=settings[key];
  plans.push({...worker,base,settings,metadata,candidate,version});
 }
 if(!apply)return {status:'verified_read_only',workers:plans.map(({name,alreadyRepaired})=>({name,alreadyRepaired:Boolean(alreadyRepaired)}))};
 if(context.GITHUB_REPOSITORY!=='anevum/anevum-web'||context.GITHUB_REF!=='refs/heads/release/v084-continuance-approved-20261019'||context.GITHUB_WORKFLOW!=='ANEVUM V091 Guarded Continuance Experience Production')
  throw Error('Staff repair must use the existing guarded production workflow');
 // Every source, version, binding and route has been checked before the first write.
 const changed=[];
 try {
  for(const plan of plans.filter(p=>!p.alreadyRepaired)){
   if(currentVersion(await api('GET',plan.base+'/deployments'))!==plan.version||settingsLock(await api('GET',plan.base+'/settings'))!==settingsLock(plan.settings)||routeLock(await api('GET',routesPath))!==routesBefore)
    throw Error('Immediate production drift: '+plan.name);
   // Record before PUT: a transport failure can occur after the server applies it.
   changed.push(plan);
   await api('PUT',plan.base,{metadata:plan.metadata,source:plan.candidate});
   if(digest(moduleSource(await api('GET',plan.base)))!==plan.candidate_sha256||settingsLock(await api('GET',plan.base+'/settings'))!==settingsLock(plan.settings))
    throw Error('Post-repair source/settings mismatch: '+plan.name);
  }
  if(routeLock(await api('GET',routesPath))!==routesBefore)throw Error('Route drift after staff repair');
  return {status:'repaired',workers:plans.map(({name})=>name)};
 } catch(error){
  const failures=[];
  for(const plan of changed.reverse()){
   try{
    const active=currentVersion(await api('GET',plan.base+'/deployments'));
    if(active===plan.version)continue;
    if(digest(moduleSource(await api('GET',plan.base)))!==plan.candidate_sha256)
     throw Error('Concurrent source deployment; refusing to overwrite it');
    await api('POST',plan.base+'/deployments',{strategy:'percentage',versions:[{version_id:plan.version,percentage:100}]});
    if(currentVersion(await api('GET',plan.base+'/deployments'))!==plan.version)throw Error('Rollback verification failed');
   }catch{failures.push(plan.name);}
  }
  if(failures.length)throw new Error('Staff repair failed; rollback needs attention: '+failures.join(', '),{cause:error});
  throw new Error('Staff repair failed; recorded baseline deployments restored',{cause:error});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const token=process.env.CLOUDFLARE_API_TOKEN;
 if(!token||process.env.CLOUDFLARE_ACCOUNT_ID!==manifest.account_id)throw Error('Expected Cloudflare account credentials are required');
 const api=async(method,path,body)=>{
  const headers={authorization:'Bearer '+token};let payload;
  if(method==='PUT'){
   payload=new FormData();payload.append('metadata',new Blob([JSON.stringify(body.metadata)],{type:'application/json'}));
   payload.append('index.mjs',new Blob([body.source],{type:'application/javascript+module'}),'index.mjs');
  }else if(body){headers['content-type']='application/json';payload=JSON.stringify(body);}
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers,body:payload,signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Cloudflare request failed: '+method+' '+path+' HTTP '+response.status);
  if(method==='GET'&&!path.endsWith('/settings')&&!path.endsWith('/deployments')&&!path.endsWith('/routes'))return response.text();
  const data=await response.json();if(data.success!==true)throw Error('Cloudflare rejected request: '+method+' '+path);
  return data.result;
 };
 console.log(JSON.stringify(await repairStaffTransport(api,{apply:process.argv.includes('--apply')})));
}
