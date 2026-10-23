/** V120: pure, read-only protected V116 staging gate; NO provider writes. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const APEX='anevum-apex-prelaunch-gateway';
export const CONTROLLER='anevum-package-alpha-v003-control';
export const ENTRY='anevum-v095-v096-acceptance-entry';
export const V116='76b8140f-5461-4e79-8523-78bf4054958f';
export const PUBLIC_APEX='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
export const PRIVATE_APEX='86dc4b9d-4020-432a-8a15-e65606f31316';
export const PUBLIC_CTRL='9851d9c5-6270-4c4e-a70e-1b82451b170d';
export const PRIVATE_CTRL='b957257c-d265-4656-bd97-db6b5da81b71';
export const PUBLIC_ENTRY='81ec7236-dc66-45cd-84e1-c812706c2b31';
export const DEPLOYMENT='549f57c4-3d29-4b8b-856f-9554cab437e2';
export const CONTROLLER_DEPLOYMENT='4ab43569-392c-40a0-838f-1745873e0918';
export const ENTRY_DEPLOYMENT='8ecc6c54-829a-4e62-974d-fb3f548a5ebc';
export const RULESET='7a8ccf2e80704acb90de7ad857a2728c';
export const RULE_VERSION='13';
export const WINDOW_END=1792733407;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const pair=(a,b)=>[{version_id:a,percentage:100},{version_id:b,percentage:0}];
const varOf=(v,name)=>v.resources.bindings.filter(x=>x.name===name);
const requireVar=(v,name,value)=>{const x=varOf(v,name);assert.equal(x.length,1,name);assert.equal(x[0].type,'plain_text',name);assert.equal(x[0].text,value,name);};
function assertSameNames(a,b){const names=x=>x.resources.bindings.map(z=>z.name+':'+z.type).sort();assert.deepEqual(names(a),names(b));}
export function inspect(s,now=Math.floor(Date.now()/1000)){
 assert.ok(Number.isSafeInteger(now)&&now>WINDOW_END,'Old protected window must remain closed');
 assert.deepEqual(s.apexDeployment.versions,pair(PUBLIC_APEX,PRIVATE_APEX));
 assert.equal(s.apexDeployment.id,DEPLOYMENT);
 assert.deepEqual(s.controllerDeployment.versions,pair(PUBLIC_CTRL,PRIVATE_CTRL));
 assert.equal(s.controllerDeployment.id,CONTROLLER_DEPLOYMENT);
 assert.deepEqual(s.entryDeployment.versions,[{version_id:PUBLIC_ENTRY,percentage:100}]);
 assert.equal(s.entryDeployment.id,ENTRY_DEPLOYMENT);
 assert.ok(s.apexVersions.some(x=>x.id===V116),'Exact V116 immutable version must exist');
 assert.ok(!s.apexDeployment.versions.some(x=>x.version_id===V116),'Never confuse upload with deployment');
 assert.equal(s.controllerPublic.id,PUBLIC_CTRL);
 assert.equal(s.controllerPrivate.id,PRIVATE_CTRL);
 assert.equal(s.entryPublic.id,PUBLIC_ENTRY);
 assert.equal(s.apexCandidate.id,V116);
 assert.equal(s.apexCandidate.resources.bindings.length,26);
 requireVar(s.apexCandidate,'CANONICAL_CREATOR_UPLOADS_ENABLED','false');
 requireVar(s.apexCandidate,'CANONICAL_XP_TEST_ENABLED','false');
 assert.equal(s.controllerPrivate.resources.bindings.length,13);
 assertSameNames(s.controllerPublic,s.controllerPrivate);
 assert.equal(varOf(s.controllerPrivate,'AUTH')[0]?.service,APEX);
 requireVar(s.controllerPrivate,'PACKAGE_CANONICAL_AUTH_VERSION',PRIVATE_APEX);
 requireVar(s.controllerPrivate,'PACKAGE_PUBLIC_PUBLISH_ENABLED','false');
 requireVar(s.controllerPrivate,'PACKAGE_NATIVE_STUDIO_ENABLED','true');
 assert.equal(s.controllerPrivate.resources.bindings.filter(x=>x.type==='secret_text').map(x=>x.name).join(','),'PACKAGE_PREVIEW_KEY');
 assert.equal(s.controllerPrivate.resources.bindings.filter(x=>x.type==='d1')[0]?.database_id,'fe6a2c20-ccde-451e-ab5f-3610b38d97ff');
 assert.equal(s.entryPublic.resources.bindings.length,5);
 requireVar(s.entryPublic,'QA_CANDIDATE',PRIVATE_APEX);
 requireVar(s.entryPublic,'QA_EXPIRES_AT',String(WINDOW_END));
 assert.equal(s.ruleset.id,RULESET);
 assert.equal(String(s.ruleset.version),RULE_VERSION);
 const normal=s.ruleset.rules.find(x=>x.id==='1279cf299bef404e883c7832c49d42a3');
 const protectedRule=s.ruleset.rules.find(x=>x.id==='d2b00ef8a7de4278bf98e66a45d2afcc');
 assert.equal(normal.enabled,true);assert.equal(protectedRule.enabled,true);
 assert.match(protectedRule.expression,/timestamp.sec lt 1792733407/);
 assert.match(protectedRule.expression,/__Host-anevum-v095-v096-qa/);
 const override=protectedRule.action_parameters?.headers?.['cloudflare-workers-version-overrides'];
 assert.equal(override.operation,'set');
 assert.ok(override.value.includes(APEX+'="'+PRIVATE_APEX+'"'));
 assert.ok(override.value.includes(CONTROLLER+'="'+PRIVATE_CTRL+'"'));
 assert.equal(s.routes.length,40);
 assert.equal(s.routes.find(x=>x.pattern==='anevum.com/*')?.script,'anevum-native-frame-policy-v001');
 assert.deepEqual(s.apexExposure,{enabled:false,previews_enabled:false});
 return {
  status:'V116_PROTECTED_REVIEW_BLOCKED_AWAITING_STAGING',
  sourceVersion:V116,privateControllerTarget:V116,
  currentPublicVersion:PUBLIC_APEX,publicTrafficPercent:100,
  currentPrivateVersion:PRIVATE_APEX,privateTrafficPercent:0,
  proposedControllerBindings:s.controllerPrivate.resources.bindings.map(b=>b.name==='PACKAGE_CANONICAL_AUTH_VERSION'?{...b,text:V116}:({...b})),
  requiredLaterSteps:['UPLOAD_V116_PINNED_CONTROLLER_AS_INACTIVE_VERSION',
    'ADD_V116_TO_0_PERCENT_APEX_DEPLOYMENT_WITH_ROLLBACK_PRESERVED',
    'ADD_NEW_CONTROLLER_TO_0_PERCENT_CONTROLLER_DEPLOYMENT',
    'RENEW_FOUNDER_ONLY_ACCEPTANCE_ENTRY_AND_BOUND_SELECTOR',
    'CHECK_ACCESS_IDENTITY_AND_PIN_CONSISTENCY',
    'RUN_REAL_FOUNDER_MEMBER_GUEST_AND_IPHONE_SAFARI_ACCEPTANCE',
    'APPROVE_ROLLBACK_AWARE_PUBLIC_RELEASE'],
  routingWritesPerformed:false,cloudflareWritesPerformed:false,
  authVerified:false,physicalSafariAcceptance:false,productionReleaseApproved:false
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 assert.equal(process.argv.length,3,'Usage: node v120-protected-acceptance.mjs <provider-snapshot.json>');
 const snapshot=JSON.parse(readFileSync(process.argv[2],'utf8'));
 const plan=inspect(snapshot);
 console.log(JSON.stringify({...plan,proposedControllerBindings:plan.proposedControllerBindings.map(x=>({name:x.name,type:x.type,targetPin:x.name==='PACKAGE_CANONICAL_AUTH_VERSION'?V116:undefined}))},null,2));
}
