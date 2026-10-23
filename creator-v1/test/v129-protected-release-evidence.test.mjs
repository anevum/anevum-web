import test from 'node:test';
import assert from 'node:assert/strict';
import {assessReleaseEvidence,PINS} from '../ops/v129-protected-release-evidence.mjs';
const T=1_800_000_000_000;
const N='12345678-1234-4234-8234-123456789abc';
const C='87654321-4321-4234-8234-abcdefabcdef';
const R='a'.repeat(64);
const clone=x=>structuredClone(x);
function complete(){
 const role=()=>({genuineAccountOrGuest:true,privateBoundaryVerified:true,roleVerified:true,sessionIsolationVerified:true});
 return {
  ci:{sourceSha:PINS.source,packagingHead:PINS.packaging,rehearsalHead:PINS.rehearsal,
   sourceChecks:11,packagingChecks:5,rehearsalChecks:5,reviewerReadback:true},
  artifact:{id:PINS.offlineArtifact,zipSha256:PINS.offlineSha256,workerSha256:PINS.compiledWorkerSha256,files:395,earnedAssets:152},
  apex:{publicVersion:PINS.oldPublic,publicPercent:100,newVersion:N,newVersionPercent:0,
   previousInactiveVersion:PINS.oldInactive,previousInactivePercent:0,uploadReceiptVerified:true,
   readbackFingerprint:R,localToProviderByteEqualityClaim:false},
  controller:{publicVersion:PINS.oldControllerPublic,publicPercent:100,newVersion:C,newVersionPercent:0,
   previousInactiveVersion:PINS.oldControllerPrivate,previousInactivePercent:0,authPin:N,
   publishEnabled:false,bindingCount:13,receiptVerified:true},
  protectedReview:{realAccessSessionVerified:true,csrfVerified:true,routeOwnershipVerified:true,bindingIdentityVerified:true,
   rulesetIntegrityVerified:true,closedAfterReview:true,windowOpenedAtMs:T-7200000,windowClosedAtMs:T-3600000},
  accountReview:{synthetic:false,productionMemberDatabaseWrites:false,outcomes:{founder:role(),reviewer:role(),ordinary_member:role(),guest:role()},
   signupEmailCodeVerified:true,resendAndRecoveryVerified:true,singleIrenVerified:true,privateCreatorPlaybackVerified:true},
  deviceReview:{physicalDeviceAttested:true,browser:'Mobile Safari',os:'iOS',keyboardInteractionVerified:true,
   viewport320Or390Verified:true,reducedMotionVerified:true,reviewerAttested:true,synthetic:false},
  rollback:{originalVersion:PINS.oldPublic,controllerVersion:PINS.oldControllerPublic,
   documented:true,recoveryTestRecorded:true,assetsReviewed:true},
  decision:{ownerReviewed:true,result:'GO',independentReview:true,reviewReference:'synthetic-reference'},
  scope:{publicTrafficChanged:false,d1Migration0014Applied:false,creatorStudio658Activated:false,
   discoverCommunity667Activated:false,memberXPReset:false,accessPolicyBypassed:false}
 };
}
test('current V125 source-only evidence is BLOCKED, never a deploy authorization',()=>{
 const report=assessReleaseEvidence({ci:complete().ci,artifact:complete().artifact},T);
 assert.equal(report.status,'BLOCKED_AWAITING_PROTECTED_ACCEPTANCE');
 assert.ok(report.missing.includes('inactive_upload_receipt'));
 assert.ok(report.missing.includes('physical_mobile_safari'));
 assert.equal(report.productionDeploymentAuthorized,false);
});
test('fully attested fixture only allows separate promotion review, never deploy',()=>{
 const report=assessReleaseEvidence(complete(),T);
 assert.equal(report.status,'ELIGIBLE_FOR_SEPARATE_PROMOTION_REVIEW');
 assert.equal(report.passed,report.checks);
 assert.equal(report.productionDeploymentAuthorized,false);
 assert.equal(report.providerDataIndependentlyAuthenticated,false);
});
test('all independent safety and acceptance dimensions fail closed on drift',()=>{
 const edits=[
  s=>s.apex.publicPercent=99,
  s=>s.controller.publicVersion=PINS.oldControllerPrivate,
  s=>s.ci.sourceSha='different',
  s=>s.ci.rehearsalChecks=4,
  s=>s.artifact.zipSha256='different',
  s=>s.artifact.earnedAssets=151,
  s=>s.apex.newVersion=PINS.oldInactive,
  s=>s.apex.newVersionPercent=1,
  s=>s.apex.localToProviderByteEqualityClaim=true,
  s=>s.apex.readbackFingerprint=null,
  s=>s.controller.authPin=PINS.oldInactive,
  s=>s.controller.publishEnabled=true,
  s=>s.controller.receiptVerified=false,
  s=>s.protectedReview.realAccessSessionVerified=false,
  s=>s.protectedReview.windowClosedAtMs=T+1000,
  s=>s.protectedReview.windowOpenedAtMs=T-24*3600000,
  s=>s.accountReview.synthetic=true,
  s=>s.accountReview.outcomes.guest.privateBoundaryVerified=false,
  s=>s.accountReview.outcomes.ordinary_member.sessionIsolationVerified=false,
  s=>s.accountReview.signupEmailCodeVerified=false,
  s=>s.deviceReview.physicalDeviceAttested=false,
  s=>s.deviceReview.browser='Chromium',
  s=>s.deviceReview.synthetic=true,
  s=>s.rollback.originalVersion='wrong',
  s=>s.rollback.recoveryTestRecorded=false,
  s=>s.decision.ownerReviewed=false,
  s=>s.decision.reviewReference='x',
  s=>s.scope.creatorStudio658Activated=true,
  s=>s.scope.publicTrafficChanged=true,
  s=>s.scope.d1Migration0014Applied=true,
  s=>s.scope.accessPolicyBypassed=true
 ];
 for(const edit of edits){const x=complete();edit(x);const result=assessReleaseEvidence(x,T);
  assert.notEqual(result.status,'ELIGIBLE_FOR_SEPARATE_PROMOTION_REVIEW');
  assert.equal(result.productionDeploymentAuthorized,false);
 }
});
test('unsafe production changes HALT even when otherwise marked complete',()=>{
 const x=complete();x.scope.memberXPReset=true;
 const out=assessReleaseEvidence(x,T);
 assert.equal(out.status,'HALT_UNSAFE_STATE');
 assert.deepEqual(out.forbiddenObserved,['memberXPReset']);
});
test('missing, partial, unexpected input stays blocked rather than assuming success',()=>{
 for(const x of [{},{apex:{newVersion:N}},{ci:complete().ci},Object.create(null)]){
  const r=assessReleaseEvidence(x,T);assert.equal(r.status,'BLOCKED_AWAITING_PROTECTED_ACCEPTANCE');
  assert.equal(r.productionDeploymentAuthorized,false);
 }
 assert.throws(()=>assessReleaseEvidence(null,T));
 assert.throws(()=>assessReleaseEvidence([],T));
 assert.throws(()=>assessReleaseEvidence({},0));
});
test('evidence scorer cannot be promoted into authority through extra fields',()=>{
 const x=complete();x.productionDeploymentAuthorized=true;x.claimedStatus='LIVE';
 const o=assessReleaseEvidence(x,T);
 assert.equal(o.productionDeploymentAuthorized,false);
 assert.equal(o.status,'ELIGIBLE_FOR_SEPARATE_PROMOTION_REVIEW');
});
