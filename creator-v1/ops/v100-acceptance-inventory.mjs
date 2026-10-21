/** Read-only setup audit. Never publish source, cookies, bindings or Access metadata. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {moduleSource} from './v091-staff-transport.mjs';
const ACCOUNT='2f7ee83107240152097efd956a4e8335',ZONE='8abe27259b5436af5966d3b40d9a3760';
const OLD='3ba8602c-6616-49a4-af29-1efe60ad164a',NEXT='8ed503b6-5df6-42a5-a536-63ccf928d25d';
// The original feature-ON candidate failed physical iPhone Safari due to /creator/ assets.
// Only the root-tested replacement may satisfy the protected acceptance readiness audit.
const FAILED_FEATURE_ON='71a305df-a769-4fb1-9a20-527e0f7f1664';
const PUBLIC='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
const FEATURE_ON='94446397-e87d-4e5b-943b-b70a8a1a8fd2';
const COOKIE='__Host-anevum-v095-v096-qa';
/** Read-only readiness of the existing opt-in entry, not permission to deploy. */
export function featureOnRoutingReady(s){
 return Boolean(
  s.featureOnCandidateUploaded && s.featureOnAtZeroPercentInCurrentDeployment &&
  s.publicVersion100AndExactTwoVersions && s.failedFeatureOnNotSelected &&
  s.featureOnRootAssetBase && s.featureOnCreatorUploadsDisabled &&
  s.entryCandidateMatchesFeatureOn && s.entryDeployedCandidateMatchesFeatureOn &&
  s.entryHasRoutingSecret && s.entryHasOnlyPlainOrSecretBindings &&
  s.entryExpiryValid && s.entry?.hasFeatureOnCandidate && s.entry?.hasRoutingCookie &&
  s.entry?.hasTimedGate && s.entry?.hasAccessIdentity &&
  s.http_request_late_transform?.qaRuleCount===1 &&
  s.http_request_late_transform?.hasFeatureOnCandidate &&
  s.http_request_late_transform?.hasRoutingCookie &&
  s.http_request_late_transform?.hasVersionOverride
 );
}
export async function inventory(read){
 const root='/accounts/'+ACCOUNT+'/workers/scripts/',zone='/zones/'+ZONE;
 const routes=await read(zone+'/workers/routes');
 const entry=routes.filter(r=>/^anevum\.com\/__enter\/v095-v096\*?$/.test(r.pattern));
 assert.equal(entry.length,1,'Expected exactly the existing acceptance route');
 const out={readOnly:true,oneExistingEntryRoute:true};
 const deployment=await read(root+'anevum-apex-prelaunch-gateway/deployments');
 out.apexDeployment=deployment.deployments?.[0];
 // Only deployment IDs and percentages leave this audit; discard provider annotations.
 out.apexDeployment={id:out.apexDeployment?.id,versions:out.apexDeployment?.versions};
 out.newCandidateExists=(await read(root+'anevum-apex-prelaunch-gateway/versions/'+NEXT)).id===NEXT;
 const featureOn=await read(root+'anevum-apex-prelaunch-gateway/versions/'+FEATURE_ON);
 out.featureOnCandidateUploaded=featureOn.id===FEATURE_ON;
 out.featureOnRootAssetBase=featureOn.resources?.script_runtime?.assets?.base_path==='/';
 out.featureOnCreatorUploadsDisabled=(featureOn.resources?.bindings||[]).some(b=>b.name==='CANONICAL_CREATOR_UPLOADS_ENABLED'&&b.type==='plain_text'&&b.text==='false');
 const selected=out.apexDeployment.versions||[];
 out.publicVersion100AndExactTwoVersions=selected.length===2&&selected.some(x=>x.version_id===PUBLIC&&x.percentage===100);
 out.failedFeatureOnNotSelected=!selected.some(x=>x.version_id===FAILED_FEATURE_ON);
 out.featureOnAtZeroPercentInCurrentDeployment=selected.some(x=>x.version_id===FEATURE_ON&&x.percentage===0);
 const es=await read(root+entry[0].script+'/settings');
 const vars=Object.fromEntries((es.bindings||[]).filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 out.entryHasOnlyPlainOrSecretBindings=(es.bindings||[]).every(b=>['plain_text','secret_text'].includes(b.type));
 out.entryCandidateMatchesOld=vars.QA_CANDIDATE===OLD;
 out.entryCandidateMatchesFeatureOn=vars.QA_CANDIDATE===FEATURE_ON;
 out.entryTokenWellFormed=/^[a-f0-9]{64}$/.test(vars.QA_ROUTING_TOKEN||'');
 out.entryHasRoutingSecret=(es.bindings||[]).some(b=>b.type==='secret_text'&&b.name==='QA_ROUTING_TOKEN');
 out.entryExpiryValid=Number(vars.QA_EXPIRES_AT)>Date.now()/1000&&Number(vars.QA_EXPIRES_AT)<Date.now()/1000+86400;
 for(const [label,name] of [['entry',entry[0].script],['frame','anevum-native-frame-policy-v001'],['profile','anevum-profile-staff-access-v001'],['assets','anevum-native-project-community-v002'],['unified','anevum-unified-creation-routes-v002'],['observatory','anevum-iren-staff-observatory-v001']]){
  const source=await read(root+name,false);
  const d=await read(root+name+'/deployments');
  out[label]={deployment:{id:d.deployments?.[0]?.id,versions:d.deployments?.[0]?.versions},
   sourceDigest:createHash('sha256').update(source.startsWith('--')?source.split(source.split(/\r?\n/,1)[0]).join('--BOUNDARY'):source).digest('hex'),
   hasRoutingCookie:source.includes(COOKIE),hasOldCandidate:source.includes(OLD),hasNextCandidate:source.includes(NEXT),hasFeatureOnCandidate:source.includes(FEATURE_ON),
   hasVersionOverride:source.toLowerCase().includes('cloudflare-workers-version-overrides'),
   hasTimedGate:source.includes('QA_EXPIRES_AT'),hasAccessIdentity:source.includes('ANEVUM_PREVIEW_ALLOWED_EMAILS'),
   oldCandidateOccurrences:source.split(OLD).length-1,
   hasRecoveryTimeout:source.includes('12000')&&source.includes('AbortController')};
  if(label==='observatory'){
   try{
    const live=moduleSource(source,source.match(/name="(index\.mjs|worker\.js)"/)?.[1]||'index.mjs').source;
    const candidate=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8');
    const suffix=s=>s.slice(s.indexOf('const ORIGIN =')).trim();
    out.observatory.backendSuffixMatchesCandidate=live.includes('const ORIGIN =')&&suffix(live)===suffix(candidate);
   }catch{out.observatory.backendSuffixMatchesCandidate=false;}
   out.observatory.hasConstOrigin=source.includes('const ORIGIN =');
   out.observatory.hasVarOrigin=/var ORIGIN\s*=/.test(source);
   out.observatory.hasUiDeclarations=['PAGE','STYLES','CLIENT'].every(name=>new RegExp('(?:const|var|let) '+name+'\\s*=').test(source));
  }
 }
 // Cloudflare's script code/settings endpoint can describe the latest uploaded
 // version, not necessarily the version actually serving requests. Verify the
 // selected deployed entry version independently before reporting QA readiness.
 const liveEntryVersions=out.entry?.deployment?.versions||[];
 const liveEntry=liveEntryVersions.length===1?liveEntryVersions[0]:null;
 out.entryDeployedCandidateMatchesFeatureOn=false;
 if(liveEntry?.percentage===100&&/^[a-f0-9-]{36}$/i.test(liveEntry.version_id||'')){
  try{
   const liveVersion=await read(root+entry[0].script+'/versions/'+liveEntry.version_id);
   out.entryDeployedCandidateMatchesFeatureOn=liveVersion.id===liveEntry.version_id&&
    (liveVersion.resources?.bindings||[]).some(b=>b.name==='QA_CANDIDATE'&&b.type==='plain_text'&&b.text===FEATURE_ON)&&
    (liveVersion.resources?.bindings||[]).some(b=>b.name==='QA_ROUTING_TOKEN'&&b.type==='secret_text');
  }catch{out.entryDeployedCandidateMatchesFeatureOn=false;}
 }
 for(const phase of ['http_request_late_transform','http_request_transform']){
  try{
   const ruleset=await read(zone+'/rulesets/phases/'+phase+'/entrypoint');
   // A disabled/unrelated rule does not constitute an active QA route.
   const qaRules=(ruleset.rules||[]).filter(rule=>rule.enabled!==false&&JSON.stringify(rule).includes(COOKIE));
   const rule=qaRules.length===1?qaRules[0]:null;
   const override=rule?.action_parameters?.headers?.['cloudflare-workers-version-overrides'];
   out[phase]={exists:true,qaRuleCount:qaRules.length,
    hasRoutingCookie:!!rule&&JSON.stringify(rule.expression||'').includes(COOKIE),
    hasOldCandidate:JSON.stringify(qaRules).includes(OLD),
    hasFeatureOnCandidate:override?.operation==='set'&&String(override.value||'').includes('anevum-apex-prelaunch-gateway="'+FEATURE_ON+'"'),
    hasVersionOverride:override?.operation==='set'};
  }catch(e){out[phase]={readable:false,notFound:e.status===404,authorizationDenied:[401,403].includes(e.status)};}
 }
 try{
  const rules=await read(zone+'/snippets/snippet_rules');
  out.snippetsReadable=true;out.routingSnippets=[];
  for(const rule of rules){
   if(!rule.enabled)continue;
   const source=await read(zone+'/snippets/'+rule.snippet_name+'/content',false);
   if(!source.includes(COOKIE)&&!source.includes(OLD))continue;
   out.routingSnippets.push({sourceDigest:createHash('sha256').update(source.startsWith('--')?source.split(source.split(/\r?\n/,1)[0]).join('--BOUNDARY'):source).digest('hex'),
    hasRoutingCookie:source.includes(COOKIE),hasOldCandidate:source.includes(OLD),oldCandidateOccurrences:source.split(OLD).length-1,
    hasVersionOverride:source.toLowerCase().includes('cloudflare-workers-version-overrides'),
    hasEntryExpiry:source.includes(String(vars.QA_EXPIRES_AT)),hashesToken:source.includes('SHA-256'),
    hasTokenLiteral:/[a-f0-9]{64}/.test(source)});
  }
 }catch(e){out.snippetsReadable=false;out.snippetsNotFound=e.status===404;out.snippetsAuthorizationDenied=[401,403].includes(e.status);}
 // This is routing readiness only, NOT human, device, data-write or production acceptance.
 out.featureOnProtectedRoutingReady=featureOnRoutingReady(out);
 // A GitHub token may read Worker versions but lack zone Rulesets access.
 // Never conflate a successful read-only workflow with full rule verification.
 out.featureOnRoutingAuditStatus=out.featureOnProtectedRoutingReady?'READ_ONLY_READY':
  out.http_request_late_transform?.authorizationDenied===true?'ZONE_RULES_READ_PERMISSION_REQUIRED':'NOT_READY';
 out.featureOnAuthenticatedAcceptance=false;
 out.featureOnPhysicalDeviceAcceptance=false;
 out.featureOnProductionApproved=false;
 return out;
}
/** No-cookie hosted staff perimeter. GET only; never follows redirects or logs response bodies.
 * Checks the real public production staff routes (not the 0% feature-on app).
 * A PASS is only anonymous denial/redaction, never authenticated role acceptance.
 */
export async function signedOutHostedPerimeter(request=fetch){
 const base='https://anevum.com';
 const report={status:'PASS_ANONYMOUS_ONLY',origin:base,checks:[],authenticatedFounder:false,
  authenticatedReviewer:false,authenticatedOrdinaryMember:false,creatorPublishingApproved:false,
  productionReleaseApproved:false,mutations:0};
 const read=async path=>{
  const url=new URL(path,base);
  assert.equal(url.origin,base,'Only first-party hosted GETs permitted');
  const response=await request(url.toString(),{method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',
   headers:{accept:'application/json','cache-control':'no-store'},
   signal:AbortSignal.timeout(12000)});
  assert.ok(response&&Number.isInteger(response.status),'Missing HTTP response for '+path);
  return response;
 };
 const secured=[
  '/staff','/staff/observatory','/staff/observatory/api/overview',
  '/staff/observatory/app.js','/staff/observatory/styles.css',
  '/__anevum_profile_staff_role_v001'
 ];
 for(const path of secured){
  const response=await read(path);
  assert.ok([401,403].includes(response.status),
   'Signed-out native staff route must deny access: '+path+' HTTP '+response.status);
  await response.body?.cancel().catch(()=>{});
  report.checks.push({path,status:response.status,denied:true});
 }
 for(const path of ['/api/v1/member/staff-ops','/api/v1/member/forum-review']){
  const response=await read(path);
  assert.ok([302,303,307,308,401,403].includes(response.status),
   'Sensitive staff API must be Access-protected or deny anonymous GET: '+path+' HTTP '+response.status);
  if([302,303,307,308].includes(response.status)){
   const location=response.headers.get('location');
   assert.ok(location,'Access denial redirect without location: '+path);
   const next=new URL(location,base);
   assert.equal(next.protocol,'https:','Access denial redirect must use HTTPS: '+path);
   assert.ok((next.hostname==='anevum.com'&&next.pathname.startsWith('/cdn-cgi/access/'))||
    (next.hostname.endsWith('.cloudflareaccess.com')&&next.pathname.startsWith('/cdn-cgi/access/')),
    'Access denial redirect must target Cloudflare Access login: '+path);
  }
  await response.body?.cancel().catch(()=>{});
  report.checks.push({path,status:response.status,denied:true});
 }
 const json=async path=>{
  const response=await read(path);
  assert.equal(response.status,200,'Redacted diagnostic status: '+path);
  assert.match(response.headers.get('content-type')||'',/application\/json/i,'Diagnostic JSON required: '+path);
  const size=Number(response.headers.get('content-length')||0);
  assert.ok(size<2048,'Oversized diagnostic: '+path);
  const raw=await response.text();
  assert.ok(raw.length<2048,'Diagnostic body too large: '+path);
  return JSON.parse(raw);
 };
 const gate=await json('/staff?diagnose=1');
 assert.deepEqual(Object.keys(gate).sort(),['access','expectedCookiePresent','expiryType','reason','role'].sort());
 assert.equal(gate.access,'signed_out');
 assert.equal(gate.expectedCookiePresent,false);
 assert.equal(gate.role,null);
 report.checks.push({path:'/staff?diagnose=1',status:200,redacted:true});
 const session=await json('/__anevum_iren_staff_session_status_v001');
 assert.deepEqual(Object.keys(session).sort(),['apexCookiePresent','canonicalSession','endpoint','staffApi','staffGrant'].sort());
 assert.equal(session.apexCookiePresent,false);
 assert.equal(session.canonicalSession,'not_signed_in');
 assert.equal(session.staffGrant,'not_checked');
 assert.equal(session.staffApi,'not_checked');
 report.checks.push({path:'/__anevum_iren_staff_session_status_v001',status:200,redacted:true});
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--signed-out-live')){
  assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
  assert.equal(process.env.GITHUB_REF,'refs/heads/ops/v100-anonymous-perimeter-20261021-001');
  assert.equal(process.env.GITHUB_EVENT_NAME,'push');
  assert.equal(process.env.GITHUB_ACTOR,'anevum');
  console.log(JSON.stringify(await signedOutHostedPerimeter()));
 } else {
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.ok(['refs/heads/ops/v100-candidate-acceptance-20261021-001','refs/heads/ops/v100-corrected-acceptance-20261021-001'].includes(process.env.GITHUB_REF),'Unreviewed QA audit branch');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
 assert.ok(process.env.CLOUDFLARE_API_TOKEN);
 const read=async(path,json=true)=>{
  const request=token=>fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});
  let r=await request(process.env.CLOUDFLARE_API_TOKEN);
  if([401,403].includes(r.status)&&path.includes('/zones/')&&process.env.CLOUDFLARE_ACCESS_API_TOKEN)r=await request(process.env.CLOUDFLARE_ACCESS_API_TOKEN);
  if(!r.ok){const error=new Error('Cloudflare read failed');error.status=r.status;throw error;}
  if(!json)return r.text();
  const data=await r.json();assert.equal(data.success,true);return data.result;
 };
 console.log(JSON.stringify(await inventory(read)));
 }
}
