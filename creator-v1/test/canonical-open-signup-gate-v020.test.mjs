import test from "node:test";
import assert from "node:assert/strict";
import {assessCanonicalOpenSignupCandidate,OPEN_SIGNUP_TARGET,
  OPEN_SIGNUP_MIGRATIONS,OPEN_SIGNUP_PROOFS} from "../ops/canonical-open-signup-gate.mjs";

function reviewedCandidate(){
 const t=OPEN_SIGNUP_TARGET;
 return {
  live:{apexRoute:t.apexRoute,apexWorker:t.apexWorker,
   stageRoute:t.stageRoute,stageWorker:t.stageWorker,
   legacyRoute:t.legacyRoute,legacyWorker:t.legacyWorker},
  proposed:{name:t.stageWorker,origin:t.origin,assetsRunWorkerFirst:true,
   noPublicPreview:true,canonicalOnly:true,protectedOwnerConfigured:true,secretsBound:true,
   sourceCommit:"a".repeat(40),
   d1:[{binding:"COMMUNITY_DB",database_id:t.communityDb},
    {binding:"MEMBER_DB",database_id:t.memberDb}],
   flags:{ANEVUM_CANONICAL_STAGE_ENABLED:"true",CANONICAL_SCHEMA_APPROVED:"true",
    CANONICAL_EMAIL_ENABLED:"true",CANONICAL_PUBLIC_SIGNUP_ENABLED:"true",
    CANONICAL_INVITED_SIGNUP_ENABLED:"false"}},
  resources:{databaseId:t.memberDb,issuer:t.issuer,migrations:[...OPEN_SIGNUP_MIGRATIONS]},
  evidence:Object.fromEntries(OPEN_SIGNUP_PROOFS.map(key=>[key,
   {result:"passed",reference:"review-only/"+key}]))
 };
}
test("only a fully attested example is a candidate for owner review, never authorization",()=>{
 const result=assessCanonicalOpenSignupCandidate(reviewedCandidate());
 assert.deepEqual(result,{status:"review_candidate",reasons:[],
  candidateForOwnerReview:true,ownerReleaseRequired:true,
  scope:"canonical-member-accounts-only"});
 assert.equal(assessCanonicalOpenSignupCandidate(null).status,"blocked");
});
test("actual unreleased signup conditions are blocked without inventing provider evidence",()=>{
 const candidate=reviewedCandidate();
 candidate.proposed.flags.CANONICAL_PUBLIC_SIGNUP_ENABLED="false";
 candidate.proposed.d1=candidate.proposed.d1.filter(x=>x.binding!=="MEMBER_DB");
 candidate.resources.migrations.pop();
 candidate.evidence={};
 const report=assessCanonicalOpenSignupCandidate(candidate);
 assert.equal(report.status,"blocked");
 assert.ok(report.reasons.includes("OPEN_REGISTRATION_FLAGS_NOT_REVIEWED"));
 assert.ok(report.reasons.includes("STAGING_D1_BINDINGS_NOT_ISOLATED"));
 assert.ok(report.reasons.includes("CANONICAL_SCHEMA_OR_ISSUER_UNVERIFIED"));
 assert.equal(report.reasons.filter(x=>x.startsWith("ACCEPTANCE_MISSING:")).length,
  OPEN_SIGNUP_PROOFS.length);
});
test("every required independent acceptance gate is fail-closed",()=>{
 for(const key of OPEN_SIGNUP_PROOFS){
  const c=reviewedCandidate();delete c.evidence[key];
  assert.ok(assessCanonicalOpenSignupCandidate(c).reasons.includes("ACCEPTANCE_MISSING:"+key),key);
  c.evidence[key]={result:"passed",reference:"raw secret here !"};
  assert.ok(assessCanonicalOpenSignupCandidate(c).reasons.includes("ACCEPTANCE_MISSING:"+key),key);
 }
});
test("never repurpose the public countdown, older auth route, or creator database",()=>{
 const cases=[
  c=>{c.live.apexWorker="anevum-creator-v1-a-staging"},
  c=>{c.live.legacyWorker="anevum-creator-v1-a-staging"},
  c=>{c.proposed.name="anevum-creator-v1-main"},
  c=>{c.proposed.origin="https://anevum.com"},
  c=>{c.proposed.assetsRunWorkerFirst=false},
  c=>{c.proposed.noPublicPreview=false},
  c=>{c.proposed.d1[1].database_id=OPEN_SIGNUP_TARGET.communityDb},
  c=>{c.proposed.protectedOwnerConfigured=false},
  c=>{c.proposed.secretsBound=false},
  c=>{c.proposed.canonicalOnly=false},
  c=>{c.proposed.sourceCommit=""},
  c=>{c.resources.issuer="legacy-creator"}
 ];
 for(const mutation of cases){const c=reviewedCandidate();mutation(c);
  assert.equal(assessCanonicalOpenSignupCandidate(c).status,"blocked",mutation.toString());}
});
test("open signup does not silently become invite-only or grant Creator privileges",()=>{
 const invite=reviewedCandidate();invite.proposed.flags.CANONICAL_INVITED_SIGNUP_ENABLED="true";
 assert.ok(assessCanonicalOpenSignupCandidate(invite).reasons.includes("OPEN_REGISTRATION_FLAGS_NOT_REVIEWED"));
 const c=reviewedCandidate();
 assert.equal("creatorLink" in c.evidence,false);
 assert.equal(assessCanonicalOpenSignupCandidate(c).status,"review_candidate");
});
