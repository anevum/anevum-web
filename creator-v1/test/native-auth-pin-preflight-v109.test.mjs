import test from 'node:test';
import assert from 'node:assert/strict';
import {assessNativeAuthVersionRouting,AUTH_TARGET} from '../ops/native-auth-pin-preflight-v109.mjs';
const CONTROLLER_ID='11111111-1111-4111-8111-111111111111';
const PUBLIC_ID='22222222-2222-4222-8222-222222222222';
const CANDIDATE_ID='33333333-3333-4333-8333-333333333333';
const STALE_ID='44444444-4444-4444-8444-444444444444';
function inventory(pin=CANDIDATE_ID){
 return {
  controllerDeployment:{versions:[{version_id:CONTROLLER_ID,percentage:100}]},
  controllerVersion:{id:CONTROLLER_ID,resources:{bindings:[
   {name:'AUTH',type:'service',service:AUTH_TARGET},
   {name:'PACKAGE_CANONICAL_AUTH_VERSION',type:'plain_text',text:pin}
  ]}},
  apexDeployment:{versions:[{version_id:PUBLIC_ID,percentage:100},
   {version_id:CANDIDATE_ID,percentage:0}]}
 };
}
test('eligible 0%-traffic AUTH pin is only a protected-review candidate, never release approval',()=>{
 const result=assessNativeAuthVersionRouting(inventory());
 assert.equal(result.status,'protected_review_candidate');
 assert.deepEqual(result.reasons,[]);
 assert.equal(result.protectedReviewCandidate,true);
 assert.equal(result.productionReleaseAuthorized,false);
 assert.equal(result.signedInJourneyVerified,false);
 assert.equal(result.readOnly,true);
 assert.equal(result.requestedAuthTrafficPercent,0);
 assert.equal(result.requestedAuthVersionPrefix,'33333333');
});
test('historically uploaded but no longer deployed AUTH version is blocked',()=>{
 const result=assessNativeAuthVersionRouting(inventory(STALE_ID));
 assert.equal(result.status,'blocked');
 assert.ok(result.reasons.includes('AUTH_PIN_NOT_IN_CURRENT_APEX_DEPLOYMENT'));
 assert.equal(result.protectedReviewCandidate,false);
 assert.equal(result.requestedAuthTrafficPercent,null);
});
test('targeting the 100%-traffic public apex is not an isolated protected review',()=>{
 const result=assessNativeAuthVersionRouting(inventory(PUBLIC_ID));
 assert.ok(result.reasons.includes('AUTH_PIN_NOT_ISOLATED_AT_ZERO_PERCENT'));
 assert.equal(result.requestedAuthTrafficPercent,100);
});
test('missing, malformed or unexpected AUTH binding fails closed',()=>{
 const missing=inventory();missing.controllerVersion.resources.bindings.shift();
 assert.ok(assessNativeAuthVersionRouting(missing).reasons.includes('AUTH_SERVICE_BINDING_MISMATCH'));
 const wrong=inventory();wrong.controllerVersion.resources.bindings[0].service='other-worker';
 assert.ok(assessNativeAuthVersionRouting(wrong).reasons.includes('AUTH_SERVICE_BINDING_MISMATCH'));
 const invalid=inventory('not-a-version');
 assert.ok(assessNativeAuthVersionRouting(invalid).reasons.includes('AUTH_VERSION_PIN_INVALID_OR_MISSING'));
 const dup=inventory();
 dup.controllerVersion.resources.bindings.push({...dup.controllerVersion.resources.bindings[1]});
 assert.ok(assessNativeAuthVersionRouting(dup).reasons.includes('AUTH_VERSION_PIN_INVALID_OR_MISSING'));
});
test('an outdated controller version snapshot must never validate current bindings',()=>{
 const data=inventory();
 data.controllerVersion.id=STALE_ID;
 const result=assessNativeAuthVersionRouting(data);
 assert.ok(result.reasons.includes('CONTROLLER_VERSION_NOT_CURRENT'));
 assert.equal(result.protectedReviewCandidate,false);
});
test('nonexclusive or malformed controller deployment blocks evaluation',()=>{
 const data=inventory();
 data.controllerDeployment.versions=[
  {version_id:CONTROLLER_ID,percentage:90},{version_id:STALE_ID,percentage:10}];
 assert.ok(assessNativeAuthVersionRouting(data).reasons.includes('CONTROLLER_VERSION_NOT_EXCLUSIVE'));
 const bad=inventory();bad.controllerDeployment.versions[0].percentage=99;
 assert.ok(assessNativeAuthVersionRouting(bad).reasons.includes('CONTROLLER_DEPLOYMENT_UNVERIFIED'));
});
test('missing and conflicting apex deployments cannot establish isolation',()=>{
 assert.ok(assessNativeAuthVersionRouting({}).reasons.includes('APEX_DEPLOYMENT_UNVERIFIED'));
 const bad=inventory();bad.apexDeployment.versions.push({version_id:PUBLIC_ID,percentage:0});
 assert.ok(assessNativeAuthVersionRouting(bad).reasons.includes('APEX_DEPLOYMENT_UNVERIFIED'));
 const sum=inventory();sum.apexDeployment.versions[1].percentage=0.2;
 assert.ok(assessNativeAuthVersionRouting(sum).reasons.includes('APEX_DEPLOYMENT_UNVERIFIED'));
});
test('result redacts exact version UUIDs while recording useful prefix and percentage',()=>{
 const x=JSON.stringify(assessNativeAuthVersionRouting(inventory()));
 for(const id of [CONTROLLER_ID,PUBLIC_ID,CANDIDATE_ID])assert.doesNotMatch(x,new RegExp(id));
 assert.match(x,/"signedInJourneyVerified":false/);
});
