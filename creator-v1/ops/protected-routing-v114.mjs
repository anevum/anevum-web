/** Pure planning/checking for the existing bounded private route. No API calls. */
import assert from 'node:assert/strict';
export const APEX='anevum-apex-prelaunch-gateway';
export const CONTROLLER='anevum-package-alpha-v003-control';
export const TARGET='86dc4b9d-4020-432a-8a15-e65606f31316';
export const OLD_APEX='6f26f0cc-6eee-483d-9f07-329e45bd5e76';
export const OLD_CONTROLLER='2720ea00-2030-43ff-84fc-8d6faf4d003b';
export const PUBLIC_APEX='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
export const PUBLIC_CONTROLLER='9851d9c5-6270-4c4e-a70e-1b82451b170d';
export const COOKIE='__Host-anevum-v095-v096-qa';
export const OLD_EXPIRY=1792711995;
export const FRONTEND_SOURCE='bb5893b6890d5a6d3f64412730053b6ca0816b02';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const pair=(publicId,privateId)=>[{version_id:publicId,percentage:100},{version_id:privateId,percentage:0}];
const vars=v=>Object.fromEntries(v.resources.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
export function parseOverrides(value){
 const rows=String(value).split(', ').map(x=>/^([a-z0-9-]+)="([a-f0-9-]{36})"$/.exec(x));
 assert.equal(rows.length,6);assert.ok(rows.every(x=>x&&UUID.test(x[2])));
 const names=rows.map(x=>x[1]);assert.equal(new Set(names).size,6);
 assert.deepEqual([...names].sort(),[APEX,CONTROLLER,'anevum-iren-staff-observatory-v001','anevum-iren-legacy-command-entry-v001','anevum-unified-creation-routes-v002','anevum-native-frame-policy-v001'].sort());
 return Object.fromEntries(rows.map(x=>[x[1],x[2]]));
}
export function assertExpression(expression,expiry){
 // Mask the existing routing token before comparisons/errors. No secret output.
 const tokens=String(expression).match(/[a-f0-9]{64}/g)||[];
 assert.equal(tokens.length,2);assert.equal(tokens[0]===tokens[1],true,'Routing cookie selections differ');
 const redacted=expression.replace(/[a-f0-9]{64}/g,'[ROUTING_SECRET]');
 assert.equal(redacted,`(http.host eq "anevum.com" and ssl and http.request.timestamp.sec lt ${expiry} and (concat(";", http.cookie, ";") contains ";${COOKIE}=[ROUTING_SECRET];" or concat(";", http.cookie, ";") contains "; ${COOKIE}=[ROUTING_SECRET];"))`,'Protected selector scope changed');
}
export function renewExpression(expression,expiry,now){
 assertExpression(expression,OLD_EXPIRY);assert.ok(now>OLD_EXPIRY);
 assert.equal(expiry,now+4*3600,'Exactly the existing four-hour duration is required');
 return expression.replace('timestamp.sec lt '+OLD_EXPIRY,'timestamp.sec lt '+expiry);
}
export function patchEntry(source){
 const change=(text,old,next)=>{assert.equal(text.split(old).length,2,'Entry source differs from reviewed recovery module');return text.replace(old,next);};
 let text=change(source,'var QA_CANDIDATE = "'+OLD_APEX+'"','var QA_CANDIDATE = "'+TARGET+'"');
 text=change(text,'var QA_SOURCE = "7630a8b2fef77571862a51417499021d4c162bd2"','var QA_SOURCE = "'+FRONTEND_SOURCE+'"');
 return change(text,'Review platform recovery on this device','Review integrated V112 on this device');
}
export function planClosedStaging({apexDeployment,controllerDeployment,overrideValue,allDeployments,controllerVersion,now}){
 assert.ok(now>OLD_EXPIRY);assert.deepEqual(apexDeployment.versions,pair(PUBLIC_APEX,OLD_APEX));assert.deepEqual(controllerDeployment.versions,pair(PUBLIC_CONTROLLER,OLD_CONTROLLER));
 assert.ok(UUID.test(controllerVersion.id));assert.ok(![PUBLIC_CONTROLLER,OLD_CONTROLLER].includes(controllerVersion.id));
 const b=vars(controllerVersion);assert.equal(b.PACKAGE_CANONICAL_AUTH_VERSION,TARGET);assert.equal(b.PACKAGE_NATIVE_STUDIO_ENABLED,'true');assert.equal(b.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');
 assert.equal(controllerVersion.resources.bindings.filter(x=>x.name==='AUTH'&&x.type==='service'&&x.service===APEX).length,1);
 const pins=parseOverrides(overrideValue);assert.equal(pins[APEX],OLD_APEX);assert.equal(pins[CONTROLLER],OLD_CONTROLLER);
 for(const [name,pin] of Object.entries(pins))assert.equal(allDeployments[name]?.versions?.some(x=>x.version_id===pin),true,'Prior override absent from '+name);
 const next={...pins,[APEX]:TARGET,[CONTROLLER]:controllerVersion.id};
 return {apexVersions:pair(PUBLIC_APEX,TARGET),controllerVersions:pair(PUBLIC_CONTROLLER,controllerVersion.id),
  overrideValue:Object.entries(next).map(([name,id])=>name+'="'+id+'"').join(', '),
  expressionExpiry:OLD_EXPIRY,windowMustRemainClosed:true,publicPercent:100,publicReleaseApproved:false};
}
export function verifyProtectedSelection({apexDeployment,controllerDeployment,controllerVersion,overrideValue,allDeployments,entryCandidate,entryExpiry,ruleExpiry,now}){
 assert.ok(UUID.test(controllerVersion.id));assert.ok(![PUBLIC_CONTROLLER,OLD_CONTROLLER].includes(controllerVersion.id));
 assert.deepEqual(apexDeployment.versions,pair(PUBLIC_APEX,TARGET));assert.deepEqual(controllerDeployment.versions,pair(PUBLIC_CONTROLLER,controllerVersion.id));
 const pins=parseOverrides(overrideValue);assert.equal(pins[APEX],TARGET);assert.equal(pins[CONTROLLER],controllerVersion.id);
 for(const [name,pin] of Object.entries(pins))assert.equal(allDeployments[name]?.versions?.some(x=>x.version_id===pin),true,'Selected override absent from '+name);
 const b=vars(controllerVersion);assert.equal(b.PACKAGE_CANONICAL_AUTH_VERSION,TARGET);assert.equal(b.PACKAGE_NATIVE_STUDIO_ENABLED,'true');assert.equal(b.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');
 assert.equal(controllerVersion.resources.bindings.filter(x=>x.name==='AUTH'&&x.type==='service'&&x.service===APEX).length,1);
 assert.equal(entryCandidate,TARGET);assert.equal(entryExpiry,ruleExpiry);assert.ok(entryExpiry>now&&entryExpiry-now<=4*3600);
 return {status:'PROTECTED_SELECTION_ELIGIBLE',publicPercent:100,apexPrivatePercent:0,controllerPrivatePercent:0,authPinMatchesSelectedApex:true,publicPublishingEnabled:false,signedInJourneyVerified:false,physicalDeviceAcceptance:false,productionReleaseApproved:false};
}
