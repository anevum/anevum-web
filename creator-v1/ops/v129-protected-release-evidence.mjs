/**
 * V129: source-only V125 protected release-evidence gate.
 * Evaluates user-supplied attestations; cannot authenticate provider facts,
 * perform deployment, access member data, or approve a public release.
 * No network client, credentials, storage, or provider mutation.
 */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

export const PINS=Object.freeze({
  source:'6aff161a60d2e86310acf25df4265a8bab326f7d',
  packaging:'1bc20950c71b5b2e0a2f6a3b9fe13f2cb849fd69',
  rehearsal:'39aceb7d6e7d8246df85e93128afd9a9e3b5697e',
  offlineArtifact:12521290324,
  offlineSha256:'2ca669eca2bd337f282e7007baeac0ed955e14c91e0b635f4fa184f147e6607f',
  compiledWorkerSha256:'1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99',
  oldPublic:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',
  oldInactive:'86dc4b9d-4020-432a-8a15-e65606f31316',
  oldControllerPublic:'9851d9c5-6270-4c4e-a70e-1b82451b170d',
  oldControllerPrivate:'b957257c-d265-4656-bd97-db6b5da81b71'
});
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(x);
const digits=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x:{};
const yes=x=>x===true;
const identical=(a,b)=>a===b;
const roles=['founder','reviewer','ordinary_member','guest'];
const forbiddenClaims=['publicTrafficChanged','d1Migration0014Applied','creatorStudio658Activated','discoverCommunity667Activated','memberXPReset','accessPolicyBypassed'];

/** An evidence envelope is data for assessment, not authority to carry out actions. */
export function assessReleaseEvidence(input={},at=Date.now()){
 assert.ok(Number.isSafeInteger(at)&&at>0,'Assessment time must be a positive integer');
 assert.ok(input&&typeof input==='object'&&!Array.isArray(input),'Expected an evidence object');
 const o=object(input),ci=object(o.ci),artifact=object(o.artifact),apex=object(o.apex),ctrl=object(o.controller),
  protectedReview=object(o.protectedReview),accountReview=object(o.accountReview),deviceReview=object(o.deviceReview),
  rollback=object(o.rollback),decision=object(o.decision),scope=object(o.scope);
 const gates=[];
 const gate=(name,condition,reason)=>gates.push({name,pass:Boolean(condition),reason});
 const unsafe=forbiddenClaims.filter(x=>scope[x]===true);
 gate('original_released_versions_preserved',
  apex.publicVersion===PINS.oldPublic&&apex.publicPercent===100&&
  ctrl.publicVersion===PINS.oldControllerPublic&&ctrl.publicPercent===100,
  'Serving apex/controller versions must remain at exact original 100% rollback versions');
 gate('exact_verified_source',
  ci.sourceSha===PINS.source&&ci.packagingHead===PINS.packaging&&ci.rehearsalHead===PINS.rehearsal&&
  ci.sourceChecks===11&&ci.packagingChecks===5&&ci.rehearsalChecks===5&&ci.reviewerReadback===true,
  '11/5/5 checked, immutable source lineage and separate reviewer evidence required');
 gate('exact_offline_artifact',
  artifact.id===PINS.offlineArtifact&&artifact.zipSha256===PINS.offlineSha256&&
  artifact.workerSha256===PINS.compiledWorkerSha256&&artifact.files===395&&artifact.earnedAssets===152,
  'Only the reviewed complete offline artifact qualifies');
 const version=apex.newVersion;
 gate('inactive_upload_receipt',
  uuid(version)&&version!==PINS.oldPublic&&version!==PINS.oldInactive&&
  apex.uploadReceiptVerified===true&&apex.newVersionPercent===0&&
  apex.previousInactiveVersion===PINS.oldInactive&&apex.previousInactivePercent===0&&
  digits(apex.readbackFingerprint)&&apex.localToProviderByteEqualityClaim!==true,
  'Requires a real new 0%-unselected immutable version; etag alone is not byte equality');
 gate('inactive_controller_and_auth_pin',
  uuid(ctrl.newVersion)&&ctrl.newVersion!==PINS.oldControllerPublic&&ctrl.newVersion!==PINS.oldControllerPrivate&&
  ctrl.newVersionPercent===0&&ctrl.previousInactiveVersion===PINS.oldControllerPrivate&&ctrl.previousInactivePercent===0&&
  ctrl.authPin===version&&ctrl.publishEnabled===false&&ctrl.bindingCount===13&&ctrl.receiptVerified===true,
  'New private controller must point to exact inactive V125 and retain disabled publishing');
 gate('protected_access_closed',
  protectedReview.realAccessSessionVerified===true&&protectedReview.csrfVerified===true&&
  protectedReview.routeOwnershipVerified===true&&protectedReview.bindingIdentityVerified===true&&
  protectedReview.rulesetIntegrityVerified===true&&protectedReview.closedAfterReview===true&&
  Number.isSafeInteger(protectedReview.windowOpenedAtMs)&&
  Number.isSafeInteger(protectedReview.windowClosedAtMs)&&
  protectedReview.windowOpenedAtMs<protectedReview.windowClosedAtMs&&
  protectedReview.windowClosedAtMs-protectedReview.windowOpenedAtMs<=4*3600*1000&&
  protectedReview.windowClosedAtMs<=at,
  'Access-protected signed-in acceptance must be bounded, verified, and closed');
 const outcomes=object(accountReview.outcomes);
 gate('genuine_role_boundaries',
  accountReview.synthetic===false&&accountReview.productionMemberDatabaseWrites===false&&
  roles.every(name=>{
   const r=object(outcomes[name]);return r.genuineAccountOrGuest===true&&r.privateBoundaryVerified===true&&
    r.roleVerified===true&&r.sessionIsolationVerified===true;
  })&&accountReview.signupEmailCodeVerified===true&&accountReview.resendAndRecoveryVerified===true&&
  accountReview.singleIrenVerified===true&&accountReview.privateCreatorPlaybackVerified===true,
  'Four real roles, OTP, IREN, session privacy and playback must be checked independently of synthetic CI');
 gate('physical_mobile_safari',
  deviceReview.physicalDeviceAttested===true&&deviceReview.browser==='Mobile Safari'&&
  deviceReview.os==='iOS'&&deviceReview.keyboardInteractionVerified===true&&
  deviceReview.viewport320Or390Verified===true&&deviceReview.reducedMotionVerified===true&&
  deviceReview.reviewerAttested===true&&deviceReview.synthetic===false,
  'Actual iPhone Safari human attestation required; Chromium and emulation never qualify');
 gate('rollback_rehearsal',
  rollback.originalVersion===PINS.oldPublic&&rollback.controllerVersion===PINS.oldControllerPublic&&
  rollback.documented===true&&rollback.recoveryTestRecorded===true&&rollback.assetsReviewed===true,
  'Old immutable rollback pair and tested recovery instructions must be retained');
 gate('owner_go_no_go_documented',
  decision.ownerReviewed===true&&decision.result==='GO'&&decision.independentReview===true&&
  typeof decision.reviewReference==='string'&&decision.reviewReference.length>=8,
  'Owner must issue a separate recorded go/no-go; this tool cannot authorize promotion');
 gate('excluded_workstreams_still_disabled',
  forbiddenClaims.every(x=>scope[x]===false),
  'No migration 0014, XP reset, unsafe Access bypass, Studio #658, Community #667 or public traffic change');
 const blocking=gates.filter(x=>!x.pass).map(x=>x.name);
 return {
  session:'ANEVUM.WEB.AUDIT.2026-10-23.001.V125-PROTECTED-RELEASE-EVIDENCE',
  status:unsafe.length?'HALT_UNSAFE_STATE':blocking.length?'BLOCKED_AWAITING_PROTECTED_ACCEPTANCE':'ELIGIBLE_FOR_SEPARATE_PROMOTION_REVIEW',
  evidenceIsSelfReported:true,providerDataIndependentlyAuthenticated:false,
  productionDeploymentAuthorized:false,anyProviderMutationPerformed:false,
  checks:gates.length,passed:gates.length-blocking.length,missing:blocking,
  forbiddenObserved:unsafe,gates
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 assert.equal(process.argv.length,2,'No file, credential, URL, or mutation arguments accepted');
 console.log(JSON.stringify(assessReleaseEvidence({}),null,2));
}
