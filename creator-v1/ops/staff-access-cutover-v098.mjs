/**
 * ANEVUM.OPS.PATCH.2026-10-20.001.STAFF-ACCESS-SIMPLIFICATION
 * Read-only inventory of Cloudflare Access coverage.
 * Absolutely NO PUT/PATCH/POST/DELETE, policy bypass, role writes or deployments.
 *
 * This plan cannot authorize any removal by itself. The true sign-in authority
 * is ANEVUM's existing verified canonical session + nonrevoked staff grant.
 */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const ROUTES = Object.freeze([
  '/staff', '/staff/observatory', '/staff/projects',
  '/api/v1/member/staff-ops',
  '/__anevum_profile_staff_role_v001',
  '/join', '/member', '/studio/alpha'
]);
const MANIFEST='creator-v1/operations/staff-transport-v091.json';
const ORIGIN='https://anevum.com';
const LIMIT=7;
const fold = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const hash = id => createHash('sha256').update(String(id)).digest('hex').slice(0,12);

export function appPatterns(app){
  const list=[];
  if (typeof app?.domain==='string')list.push(app.domain);
  if (Array.isArray(app?.destinations))
    for (const entry of app.destinations)
      if(entry?.type==='public' && typeof entry.uri==='string')list.push(entry.uri);
  if(Array.isArray(app?.self_hosted_domains))
    for(const item of app.self_hosted_domains)if(typeof item==='string')list.push(item);
  return [...new Set(list.map(fold).filter(Boolean))];
}
export function covers(pattern,path){
  if(typeof pattern!=='string'||typeof path!=='string'||!path.startsWith('/'))return false;
  let candidate=pattern.trim().toLowerCase();
  candidate=candidate.replace(/^https?:\/\//,'');
  const hostAndPath='anevum.com'+path.toLowerCase();
  // Cloudflare Access self-hosted URI supports wildcard path patterns.
  // Only recognize exact origin; ambiguous wildcard host match blocks approval.
  if(candidate==='anevum.com'||candidate==='anevum.com/')return true;
  if(!candidate.startsWith('anevum.com/'))return false;
  const escaped=candidate.replace(/[.+?^$()|[\]{}\\]/g,'\\$&').replace(/\*/g,'.*');
  return new RegExp('^'+escaped+'$').test(hostAndPath);
}
export function summarizeApps(apps){
  assert.ok(Array.isArray(apps));
  const relevant=apps.filter(x=>x && (x.type==='self_hosted'||x.type==='self_hosted_zta'||!x.type) &&
    appPatterns(x).some(pattern=>ROUTES.some(route=>covers(pattern,route))));
  const routes=Object.fromEntries(ROUTES.map(path=>[path,relevant.filter(app=>
    appPatterns(app).some(pattern=>covers(pattern,path))).map(app=>hash(app.id||app.name||app.domain))]));
  const broad=relevant.some(x=>appPatterns(x).some(p=>
    ['/join','/member','/studio/alpha'].some(path=>covers(p,path))));
  const staffProtected=relevant.some(x=>appPatterns(x).some(p=>covers(p,'/staff/observatory')));
  return {
    routeCoverage:routes,matchingApplicationCount:relevant.length,
    matches:relevant.map(app=>({
      fingerprint:hash(app.id||app.name||app.domain),
      patterns:appPatterns(app).filter(x=>x.includes('anevum.com')),
      type:app.type||'unknown',auditScope:app.auditScope||'unknown'
    })),
    staffProtected,broadPublicProtection:broad,
    removalCandidateType:broad?'OVERLAPPING_BROAD_APP_REQUIRES_MANUAL_REVIEW':
      staffProtected?'STAFF_SCOPED_APP_REQUIRES_STAFF_ACCEPTANCE':
      'NO_VERIFIED_STAFF_APP_FOUND'
  };
}
export function assertStaffWorkerGuards(files){
  assert.ok(files?.entry && files?.observatory && files?.ops && files?.tests);
  const checks={
    canonicalSession:files.observatory.includes('get-session')&&files.entry.includes('get-session'),
    verifiedIdentity:files.observatory.includes('emailVerified !== true')&&files.entry.includes('emailVerified'),
    nonrevokedGrant:files.observatory.includes('revoked_at IS NULL')&&files.entry.includes('revoked_at IS NULL'),
    scopedRoles:files.observatory.includes("['owner', 'reviewer']")&&files.entry.includes('["owner","reviewer"]'),
    failClosed:files.observatory.includes('if (!staff) return error(401')&&files.entry.includes('if(access.status==="verified")'),
    nonstaffTests:files.tests.includes("getStaff(request('nonstaff')") &&
      files.tests.includes("resolveAccess(request('nonstaff')")
  };
  return {checks,allPassed:Object.values(checks).every(Boolean)};
}
function localGuards(){
  const manifest=JSON.parse(readFileSync(MANIFEST,'utf8'));
  assert.ok(Array.isArray(manifest.routes)&&manifest.routes.length===39,'Expected locked 39 Worker routes');
  assert.ok(manifest.routes.some(x=>x.pattern==='anevum.com/staff/observatory*'&&
    x.script==='anevum-iren-staff-observatory-v001'),'Observatory route drift');
  const prefix='creator-v1/operations/';
  const read=name=>readFileSync(prefix+name,'utf8');
  const guards=assertStaffWorkerGuards({
    entry:read('anevum-iren-staff-entry-v003.mjs'),
    observatory:read('anevum-iren-staff-observatory-v001.mjs'),
    ops:read('anevum-iren-apex-staff-v002.mjs'),
    tests:readFileSync('creator-v1/test/staff-session-transport-v091.test.mjs','utf8')
  });
  if(!guards.allPassed)throw Error('ANEVUM_STAFF_GUARD_SOURCE_FAILED');
  return {account:manifest.account_id,zone:manifest.zone_id,guards,routeCount:manifest.routes.length};
}
async function fetchJson(token,path){
  let result;
  try{result=await fetch('https://api.cloudflare.com/client/v4'+path,{
    method:'GET',headers:{authorization:'Bearer '+token,accept:'application/json'},
    redirect:'manual',signal:AbortSignal.timeout(9500)
  });}catch{throw Error('CLOUDFLARE_ACCESS_API_UNREACHABLE');}
  if(!result.ok)throw Error('CLOUDFLARE_ACCESS_API_HTTP_'+result.status);
  let json;
  try{json=await result.json();}catch{throw Error('CLOUDFLARE_ACCESS_API_INVALID_JSON');}
  if(!json?.success||!Array.isArray(json.result))throw Error('CLOUDFLARE_ACCESS_API_BAD_ENVELOPE');
  return json;
}
async function listAll(token,scope,id){
  if(!['accounts','zones'].includes(scope))throw Error('Unknown Cloudflare application scope');
  const all=[];
  for(let page=1;page<=LIMIT;page++){
    const response=await fetchJson(token,'/'+scope+'/'+id+'/access/apps?per_page=100&page='+page);
    all.push(...response.result);
    if(all.length>700)throw Error('CLOUDFLARE_ACCESS_AUDIT_TOO_MANY_APPS');
    const pages=response.result_info?.total_pages;
    if(response.result.length<100||(typeof pages==='number'&&page>=pages))return all;
  }
  throw Error('CLOUDFLARE_ACCESS_AUDIT_PAGINATION_UNRESOLVED');
}
async function checkLive(path){
  let res;
  try{res=await fetch(ORIGIN+path,{
    method:path.startsWith('/api/')?'GET':'HEAD',
    redirect:'manual',headers:{accept:path.startsWith('/api/')?'application/json':'text/html'},
    signal:AbortSignal.timeout(9000)
  });}catch{return {status:'network_unverified'};}
  const location=res.headers.get('location')||'';
  const access=location.includes('/cdn-cgi/access')||location.includes('cloudflareaccess.com');
  const cookies=res.headers.get('set-cookie')||'';
  return {status:res.status,redirectCategory:access?'cloudflare_access':
    res.status>=300&&res.status<400?'other_redirect':'none',
    cloudflareChallengeHeader:res.headers.has('cf-access-authenticated-user-email'),
    // No response bodies, cookies, accounts, IPs or redirect URLs are recorded.
    hasSetCookie:!!cookies};
}
export async function audit({token,account}){
  assert.ok(token&&typeof token==='string','No valid authorized Cloudflare token');
  const local=localGuards();
  assert.equal(account,local.account,'Cloudflare account not matching locked manifest');
  // Account and legacy zone-scoped Access applications are distinct.
  // Failing to query both can wrongly label a live Cloudflare challenge unprotected.
  const [accountApps,zoneApps]=await Promise.all([
    listAll(token,'accounts',account),
    listAll(token,'zones',local.zone)
  ]);
  const apps=[...accountApps.map(app=>({...app,auditScope:'account'})),
    ...zoneApps.map(app=>({...app,auditScope:'zone'}))];
  const coverage=summarizeApps(apps);
  const live=Object.fromEntries(await Promise.all(ROUTES.map(async path=>[path,await checkLive(path)])));
  const uncovered=ROUTES.filter(path=>live[path]?.redirectCategory==='cloudflare_access' &&
    !(coverage.routeCoverage[path]||[]).length);
  if(uncovered.length)throw Error('CLOUDFLARE_ACCESS_COVERAGE_UNRESOLVED_'+uncovered.join(',').replaceAll('/','_'));
  return {
    session:'ANEVUM.OPS.PATCH.2026-10-20.001.STAFF-ACCESS-SIMPLIFICATION',
    status:'READ_ONLY_AUDIT_COMPLETE',currentSource:'V095_V096_NOT_MODIFIED',
    localGuards:local.guards,routeCount:local.routeCount,
    coverage,live,
    inventoryCounts:{account:accountApps.length,zone:zoneApps.length},
    cloudflarePolicyMutation:false,cloudflareWorkerMutation:false,productionPromotion:false,
    requiresBeforeAccessRemoval:[
      'Inspect the exact matched Cloudflare Access policy and overlapping paths',
      'Real ordinary-member and logged-out denied status from native staff session/grant Worker',
      'Real founder and independent reviewer accepted on native session and nonrevoked grants',
      'Preserve distinct infrastructure-admin Access coverage and rollback copy',
      'Owner-approved, minimal policy scope change with immediate post-change denial verification'
    ]
  };
}
if(process.argv[1]&&process.argv[1].endsWith('staff-access-cutover-v098.mjs')){
  const mode=process.argv[2];
  if(mode!=='audit'||process.argv.length!==4)throw Error('Usage: audit <output.json>');
  const out=process.argv[3];
  const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
  try{
    const result=await audit({token,account});
    writeFileSync(out,JSON.stringify(result,null,2)+'\n',{mode:0o600});
    console.log('ANEVUM_STAFF_CLOUDFLARE_ACCESS_READ_ONLY_AUDIT='+JSON.stringify({
      state:result.status,scope:result.coverage.removalCandidateType,
      affected:result.coverage.routeCoverage,routeCount:result.routeCount,
      policyChanges:false,deployments:false
    }));
  }catch(e){throw Error(String(e.message||e).slice(0,150));}
}
