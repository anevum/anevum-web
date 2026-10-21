/** Read-only setup audit. Never publish source, cookies, bindings or Access metadata. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {moduleSource} from './v091-staff-transport.mjs';
const ACCOUNT='2f7ee83107240152097efd956a4e8335',ZONE='8abe27259b5436af5966d3b40d9a3760';
const OLD='3ba8602c-6616-49a4-af29-1efe60ad164a',NEXT='8ed503b6-5df6-42a5-a536-63ccf928d25d';
// Uploaded feature-ON candidate: not yet in the current deployment or protected route.
const FEATURE_ON='71a305df-a769-4fb1-9a20-527e0f7f1664';
const COOKIE='__Host-anevum-v095-v096-qa';
/** Read-only readiness of the existing opt-in entry, not permission to deploy. */
export function featureOnRoutingReady(s){
 return Boolean(
  s.featureOnCandidateUploaded && s.featureOnAtZeroPercentInCurrentDeployment &&
  s.entryCandidateMatchesFeatureOn && s.entryHasRoutingSecret && s.entryHasOnlyPlainOrSecretBindings &&
  s.entryExpiryValid && s.entry?.hasFeatureOnCandidate && s.entry?.hasRoutingCookie &&
  s.entry?.hasTimedGate && s.entry?.hasAccessIdentity &&
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
 out.featureOnCandidateUploaded=(await read(root+'anevum-apex-prelaunch-gateway/versions/'+FEATURE_ON)).id===FEATURE_ON;
 out.featureOnAtZeroPercentInCurrentDeployment=(out.apexDeployment.versions||[]).some(x=>x.version_id===FEATURE_ON&&x.percentage===0);
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
 for(const phase of ['http_request_late_transform','http_request_transform']){
  try{
   const ruleset=await read(zone+'/rulesets/phases/'+phase+'/entrypoint');
   out[phase]={exists:true,hasRoutingCookie:JSON.stringify(ruleset).includes(COOKIE),hasOldCandidate:JSON.stringify(ruleset).includes(OLD),hasFeatureOnCandidate:JSON.stringify(ruleset).includes(FEATURE_ON),hasVersionOverride:JSON.stringify(ruleset).toLowerCase().includes('cloudflare-workers-version-overrides')};
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
 out.featureOnAuthenticatedAcceptance=false;
 out.featureOnPhysicalDeviceAcceptance=false;
 out.featureOnProductionApproved=false;
 return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.GITHUB_REF,'refs/heads/ops/v100-candidate-acceptance-20261021-001');
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
