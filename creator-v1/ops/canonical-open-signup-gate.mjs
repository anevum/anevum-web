/**
 * Canonical member-only open-registration acceptance assessor.
 *
 * Input is separately gathered provider/configuration evidence, NOT browser
 * data. This function never deploys, mutates D1, creates users, or grants
 * approval. A green result means only that an owner may review a candidate.
 *
 * Crucially, publishing/XP/Creator identity linking are NOT signup gates.
 */
export const OPEN_SIGNUP_TARGET=Object.freeze({
  origin:"https://a.anevum.com",
  stageRoute:"a.anevum.com/*",
  stageWorker:"anevum-creator-v1-a-staging",
  apexRoute:"anevum.com/*",
  apexWorker:"anevum-construction-terminal",
  legacyRoute:"next.anevum.com/api/v1/member/*",
  legacyWorker:"anevum-member-auth-staging",
  communityDb:"fa96e36d-6257-4883-bf15-074947e11a13",
  memberDb:"e1d29049-c83b-4534-8355-dc1fa36ba6d8",
  issuer:"anevum-better-auth-staging-v1"
});
export const OPEN_SIGNUP_MIGRATIONS=Object.freeze([
  "0001_canonical_better_auth_core",
  "0002_member_creator_profiles",
  "0003_member_world_personalization"
]);
export const OPEN_SIGNUP_PROOFS=Object.freeze([
  "real_d1_backup_and_restore",
  "age_privacy_terms_and_erasure_approved",
  "scoped_secrets_and_sender_verified",
  "two_real_independent_email_sessions",
  "wrong_expired_and_replayed_codes_rejected",
  "protected_owner_and_unauthorized_access_denied",
  "origin_csrf_cookie_and_rate_limits_verified",
  "private_default_public_opt_in_and_cross_account_denial",
  "account_export_and_deletion_fulfillment_verified",
  "recovery_and_signout_revocation_verified",
  "stage_release_and_rollback_rehearsed",
  "owner_visual_review"
]);

const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const evidenceRef=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._:/#-]{7,179}$/.test(x);
const hasEvidence=x=>isObject(x)&&x.result==="passed"&&evidenceRef(x.reference);
const exact=(a,b)=>a===b;
const commitSha=x=>typeof x==="string"&&/^[a-f0-9]{40}$/.test(x);
const hasBinding=(bindings,name,id)=>Array.isArray(bindings)&&
  bindings.some(b=>isObject(b)&&b.binding===name&&b.database_id===id);

/** Return blocker codes only; never interpret evidence references as proof. */
export function assessCanonicalOpenSignupCandidate(input){
  if(!isObject(input))return {
    status:"blocked",reasons:["CANDIDATE_INVENTORY_MISSING"],
    candidateForOwnerReview:false,ownerReleaseRequired:true,
    scope:"canonical-member-accounts-only"
  };
  const t=OPEN_SIGNUP_TARGET, live=isObject(input.live)?input.live:{},
    proposed=isObject(input.proposed)?input.proposed:{},
    flags=isObject(proposed.flags)?proposed.flags:{},
    resource=isObject(input.resources)?input.resources:{},
    proofs=isObject(input.evidence)?input.evidence:{};
  const reasons=[];
  if(!exact(live.apexRoute,t.apexRoute)||!exact(live.apexWorker,t.apexWorker))
    reasons.push("PUBLIC_COUNTDOWN_ISOLATION_UNVERIFIED");
  if(!exact(live.stageRoute,t.stageRoute)||!exact(live.stageWorker,t.stageWorker)||
    !exact(live.legacyRoute,t.legacyRoute)||!exact(live.legacyWorker,t.legacyWorker))
    reasons.push("STAGING_OR_LEGACY_ROUTES_UNVERIFIED");
  if(!exact(proposed.name,t.stageWorker)||!exact(proposed.origin,t.origin)||
    proposed.assetsRunWorkerFirst!==true||proposed.noPublicPreview!==true)
    reasons.push("SAME_ORIGIN_WORKER_NOT_PINNED");
  if(!hasBinding(proposed.d1,"COMMUNITY_DB",t.communityDb)||
    !hasBinding(proposed.d1,"MEMBER_DB",t.memberDb)||
    !Array.isArray(proposed.d1)||proposed.d1.length!==2)
    reasons.push("STAGING_D1_BINDINGS_NOT_ISOLATED");
  if(resource.databaseId!==t.memberDb||resource.issuer!==t.issuer||
    !Array.isArray(resource.migrations)||
    !OPEN_SIGNUP_MIGRATIONS.every(m=>resource.migrations.includes(m)))
    reasons.push("CANONICAL_SCHEMA_OR_ISSUER_UNVERIFIED");
  if(flags.ANEVUM_CANONICAL_STAGE_ENABLED!=="true"||
    flags.CANONICAL_SCHEMA_APPROVED!=="true"||
    flags.CANONICAL_EMAIL_ENABLED!=="true"||
    flags.CANONICAL_PUBLIC_SIGNUP_ENABLED!=="true"||
    flags.CANONICAL_INVITED_SIGNUP_ENABLED!=="false")
    reasons.push("OPEN_REGISTRATION_FLAGS_NOT_REVIEWED");
  if(proposed.protectedOwnerConfigured!==true || proposed.secretsBound!==true ||
    proposed.canonicalOnly!==true)
    reasons.push("OWNER_SECRETS_OR_ACCOUNT_BOUNDARY_UNVERIFIED");
  if(!commitSha(proposed.sourceCommit))reasons.push("CANDIDATE_SOURCE_UNPINNED");
  for(const key of OPEN_SIGNUP_PROOFS){
    if(!hasEvidence(proofs[key]))reasons.push("ACCEPTANCE_MISSING:"+key);
  }
  return {
    status:reasons.length?"blocked":"review_candidate",
    reasons,
    candidateForOwnerReview:reasons.length===0,
    ownerReleaseRequired:true,
    scope:"canonical-member-accounts-only"
  };
}
