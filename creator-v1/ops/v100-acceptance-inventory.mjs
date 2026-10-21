/** Read-only setup audit. Never publish source, cookies, bindings or Access metadata. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const ACCOUNT='2f7ee83107240152097efd956a4e8335',ZONE='8abe27259b5436af5966d3b40d9a3760';
const OLD='3ba8602c-6616-49a4-af29-1efe60ad164a',NEXT='8ed503b6-5df6-42a5-a536-63ccf928d25d';
const COOKIE='__Host-anevum-v095-v096-qa';
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
 const es=await read(root+entry[0].script+'/settings');
 const vars=Object.fromEntries((es.bindings||[]).filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 out.entryHasOnlyPlainOrSecretBindings=(es.bindings||[]).every(b=>['plain_text','secret_text'].includes(b.type));
 out.entryCandidateMatchesOld=vars.QA_CANDIDATE===OLD;
 out.entryTokenWellFormed=/^[a-f0-9]{64}$/.test(vars.QA_ROUTING_TOKEN||'');
 out.entryExpiryValid=Number(vars.QA_EXPIRES_AT)>Date.now()/1000&&Number(vars.QA_EXPIRES_AT)<Date.now()/1000+86400;
 for(const [label,name] of [['entry',entry[0].script],['frame','anevum-native-frame-policy-v001'],['profile','anevum-profile-staff-access-v001'],['assets','anevum-native-project-community-v002'],['unified','anevum-unified-creation-routes-v002'],['observatory','anevum-iren-staff-observatory-v001']]){
  const source=await read(root+name,false);
  const d=await read(root+name+'/deployments');
  out[label]={deployment:{id:d.deployments?.[0]?.id,versions:d.deployments?.[0]?.versions},
   sourceDigest:createHash('sha256').update(source.startsWith('--')?source.split(source.split(/\r?\n/,1)[0]).join('--BOUNDARY'):source).digest('hex'),
   hasRoutingCookie:source.includes(COOKIE),hasOldCandidate:source.includes(OLD),hasNextCandidate:source.includes(NEXT),
   hasVersionOverride:source.toLowerCase().includes('cloudflare-workers-version-overrides'),
   hasTimedGate:source.includes('QA_EXPIRES_AT'),hasAccessIdentity:source.includes('ANEVUM_PREVIEW_ALLOWED_EMAILS'),
   oldCandidateOccurrences:source.split(OLD).length-1,
   hasRecoveryTimeout:source.includes('12000')&&source.includes('AbortController')};
 }
 for(const phase of ['http_request_late_transform','http_request_transform']){
  try{
   const ruleset=await read(zone+'/rulesets/phases/'+phase+'/entrypoint');
   out[phase]={exists:true,hasRoutingCookie:JSON.stringify(ruleset).includes(COOKIE),hasOldCandidate:JSON.stringify(ruleset).includes(OLD),hasVersionOverride:JSON.stringify(ruleset).toLowerCase().includes('cloudflare-workers-version-overrides')};
  }catch{out[phase]={exists:false};}
 }
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
  const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
  assert.ok(r.ok,'Cloudflare read failed');
  if(!json)return r.text();
  const data=await r.json();assert.equal(data.success,true);return data.result;
 };
 console.log(JSON.stringify(await inventory(read)));
}
