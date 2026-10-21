/** Read-only incident audit. Provider responses remain in process memory.
 * Output is booleans only, never configuration or credentials. */
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
const baseline=JSON.parse(readFileSync(new URL('../operations/v095-inactive-baseline-20261020.json',import.meta.url),'utf8'));
const transport=JSON.parse(readFileSync(new URL('../operations/staff-transport-v091.json',import.meta.url),'utf8'));
const ACCOUNT=baseline.account_id,ZONE=baseline.zone_id,APEX=baseline.script;
const CANDIDATE='3ba8602c-6616-49a4-af29-1efe60ad164a';
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const routeLock=routes=>stable(routes.map(({pattern,script,request_limit_fail_open})=>({pattern,script,request_limit_fail_open})).sort((a,b)=>a.pattern.localeCompare(b.pattern)));
const databases=bindings=>Object.fromEntries(bindings.filter(b=>b.type==='d1').map(b=>[b.name,b.database_id||b.id]));
export async function audit(read){
 const root='/accounts/'+ACCOUNT,expectedDatabases=baseline.database_ids;
 const routes=await read('/zones/'+ZONE+'/workers/routes');
 if(!Array.isArray(routes))throw Error('Incomplete route inventory');
 const sameRoute=(a,b)=>routeLock([a])===routeLock([b]);
 const unchanged=baseline.routes.every(b=>routes.some(r=>sameRoute(r,b)));
 const added=routes.filter(r=>!baseline.routes.some(b=>sameRoute(r,b)));
 const out={readOnly:true,productionChanged:false,routeInventoryMatchesPinned:routeLock(routes)===routeLock(baseline.routes),
  pinnedRoutesRetained:unchanged,
  onlyAddedAcceptanceRoute:unchanged&&added.length===1&&/^anevum\.com\/__enter\/v095-v096\*?$/.test(added[0].pattern),
  staffRoutesMatchPinned:routeLock(routes.filter(r=>r.pattern.startsWith('anevum.com/staff')))===routeLock(baseline.routes.filter(r=>r.pattern.startsWith('anevum.com/staff'))),
  activeApexMatchesRecorded:false,recordedCandidateExists:false,recordedCandidateHasZeroTraffic:false,
  activeDatabasesMatchPinned:false,candidateDatabasesMatchPinned:false,candidateUploadsRemainDisabled:false,
  staffBindingsPresent:true,staffDatabasesMatchPinned:true,staffRollbacksAvailable:true,
  apiAccessDestinationsPresent:false,staffUiAccessDestinationAbsent:false,accessInventoryComplete:false};
 const apex=root+'/workers/scripts/'+APEX;
 const [deployment,candidate]=await Promise.all([read(apex+'/deployments'),read(apex+'/versions/'+CANDIDATE)]);
 const current=deployment.deployments?.[0];
 if(!current?.id||!Array.isArray(current.versions))throw Error('Incomplete apex deployment');
 out.activeApexMatchesRecorded=current.versions.some(v=>v.version_id===baseline.live_version.id&&v.percentage===100);
 out.recordedCandidateExists=candidate.id===CANDIDATE;
 out.recordedCandidateHasZeroTraffic=!current.versions.some(v=>v.version_id===CANDIDATE&&v.percentage>0);
 const active=await read(apex+'/versions/'+baseline.live_version.id);
 out.activeDatabasesMatchPinned=stable(databases(active.resources?.bindings||[]))===stable(expectedDatabases);
 const cb=candidate.resources?.bindings||[];
 out.candidateDatabasesMatchPinned=stable(databases(cb))===stable(expectedDatabases);
 out.candidateUploadsRemainDisabled=cb.some(b=>b.name==='CANONICAL_CREATOR_UPLOADS_ENABLED'&&b.type==='plain_text'&&b.text==='false');
 for(const worker of transport.workers){
  const path=root+'/workers/scripts/'+worker.name;
  const [deployments,settings]=await Promise.all([read(path+'/deployments'),read(path+'/settings')]);
  const versions=deployments.deployments?.[0]?.versions;
  if(!Array.isArray(versions)||!versions.some(v=>v.percentage>0))throw Error('Incomplete staff deployment');
  const bindings=settings.bindings||[],authName=worker.name.includes('session-status')?'AUTH':'APEX_AUTH';
  out.staffBindingsPresent&&=bindings.some(b=>b.type==='service'&&b.name===authName);
  const db=databases(bindings);
  out.staffDatabasesMatchPinned&&=Object.values(db).length===1&&Object.values(db)[0]===expectedDatabases.MEMBER_DB;
  try{const previous=await read(path+'/versions/'+worker.baseline_version);out.staffRollbacksAvailable&&=previous.id===worker.baseline_version;}
  catch{out.staffRollbacksAvailable=false;}
 }
 let accessComplete=true;const destinations=[];
 for(const scope of [root,'/zones/'+ZONE]){
  try{
   const apps=await read(scope+'/access/apps',true);
   if(!Array.isArray(apps))throw Error('Incomplete Access inventory');
   for(const a of apps){if(a.domain)destinations.push(a.domain);for(const d of a.destinations||[])if(d.uri)destinations.push(d.uri);}
  }catch{accessComplete=false;}
 }
 out.accessInventoryComplete=accessComplete;
 out.apiAccessDestinationsPresent=['anevum.com/api/v1/member/staff-ops*','anevum.com/api/v1/member/forum-review*'].every(p=>destinations.includes(p));
 out.staffUiAccessDestinationAbsent=accessComplete&&!destinations.includes('anevum.com/staff*');
 return out;
}
export async function cloudflareRead(path,access=false){
 if(!path.startsWith('/accounts/'+ACCOUNT+'/')&&!path.startsWith('/zones/'+ZONE+'/'))throw Error('Unexpected scope');
 const token=access?(process.env.CLOUDFLARE_ACCESS_API_TOKEN||process.env.CLOUDFLARE_API_TOKEN):process.env.CLOUDFLARE_API_TOKEN;
 if(!token)throw Error('Required Cloudflare credential unavailable');
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',
  headers:{authorization:'Bearer '+token,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Cloudflare read HTTP '+response.status);
 const body=await response.json();if(body.success!==true)throw Error('Cloudflare read unsuccessful');
 return body.result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.GITHUB_REPOSITORY!=='anevum/anevum-web'||
  process.env.GITHUB_REF!=='refs/heads/fix/observatory-connecting-recovery-20261020-001'||
  process.env.GITHUB_EVENT_NAME!=='push'||process.env.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)
  throw Error('Unexpected read-only incident context');
 console.log(JSON.stringify(await audit(cloudflareRead)));
}
