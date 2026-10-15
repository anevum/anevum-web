/**
 * Pure, offline, privacy-safe Creator V1 staging identity release assessor.
 * It NEVER authorizes a deploy or signs in/links members. Inputs are inventory
 * evidence gathered independently, not user-submitted HTTP/JS fields.
 *
 * Even a green assessment means only "candidate for owner review".
 */
export const IDENTITY_STAGE={
  host:"a.anevum.com",
  publicLaunch:"anevum.com/*",
  publicLaunchWorker:"anevum-construction-terminal",
  stageRoute:"a.anevum.com/*",
  stageWorker:"anevum-creator-v1-a-staging",
  legacyMemberRoute:"next.anevum.com/api/v1/member/*",
  legacyMemberWorker:"anevum-member-auth-staging",
  canonicalRoute:"a.anevum.com/api/v1/member/*",
  canonicalWorker:"anevum-canonical-member-staging",
  creatorStageDb:"fa96e36d-6257-4883-bf15-074947e11a13",
  productionDb:"6c7b5f0c-33db-4b6a-9569-0a6af5e07534",
  olderV5PreviewDb:"b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf",
  olderMemberPreviewDb:"a537432e-d216-4b31-8b22-19662cc3a44a",
  olderMemberMainDb:"7f0d4c0c-2e85-4900-8504-1347954e1df1",
  canonicalIssuer:"anevum-better-auth-staging-v1"
};
export const REQUIRED_CREATOR_MIGRATIONS=Object.freeze([
  "0003_member_identity_staging",
  "0004_member_project_workflow",
  "0005_voting_progression",
  "0006_account_privacy",
  "0007_community_post_stream",
  "0008_community_reply_reviews",
  "0013_community_post_projects",
  "0014_creator_featured_awards",
  "0015_creator_canonical_identity_links"
]);
export const REQUIRED_ACCEPTANCE=Object.freeze([
  "isolated_canonical_auth_database",
  "backup_and_restore",
  "dual_session_link_proof",
  "independent_member_a",
  "independent_member_b",
  "owner_role_isolation",
  "cross_account_denial",
  "signout_recovery_and_revocation",
  "origin_cookie_and_csrf",
  "member_export_and_deletion",
  "staff_moderation_flow",
  "owner_visual_review"
]);
const saneRef=value=>typeof value==="string"&&/^[A-Za-z0-9][A-Za-z0-9._:/#_-]{5,159}$/.test(value);
const objects=value=>Array.isArray(value)?value.filter(x=>x&&typeof x==="object"&&!Array.isArray(x)):[];
const route=(xs,pattern)=>xs.find(x=>x.pattern===pattern)?.script||null;
const binding=(xs,name,type)=>xs.find(x=>x.name===name&&x.type===type)?.database_id||null;

export function assessIdentityStageInventory(input){
  const reasons=[];
  if(!input||typeof input!=="object"||Array.isArray(input))
    return {status:"blocked",reasons:["INVENTORY_MISSING"],candidateForOwnerReview:false};
  const routes=objects(input.routes);
  const scripts=objects(input.workers);
  const byName=name=>scripts.find(x=>x.name===name);
  if(route(routes,IDENTITY_STAGE.publicLaunch)!==IDENTITY_STAGE.publicLaunchWorker)
    reasons.push("PUBLIC_LAUNCH_PAGE_NOT_ISOLATED");
  if(route(routes,IDENTITY_STAGE.stageRoute)!==IDENTITY_STAGE.stageWorker)
    reasons.push("DESIGN_STAGE_ROUTE_CHANGED");
  if(route(routes,IDENTITY_STAGE.legacyMemberRoute)!==IDENTITY_STAGE.legacyMemberWorker)
    reasons.push("LEGACY_AUTH_ROUTE_CHANGED");
  if(route(routes,IDENTITY_STAGE.canonicalRoute)!==IDENTITY_STAGE.canonicalWorker)
    reasons.push("CANONICAL_SAME_ORIGIN_ROUTE_MISSING");

  const stageDb=binding(objects(byName(IDENTITY_STAGE.stageWorker)?.bindings),"COMMUNITY_DB","d1");
  const legacyDb=binding(objects(byName(IDENTITY_STAGE.legacyMemberWorker)?.bindings),"COMMUNITY_DB","d1");
  const canonical=byName(IDENTITY_STAGE.canonicalWorker);
  const canonicalDb=binding(objects(canonical?.bindings),"MEMBER_DB","d1");
  const creatorBridgeDb=binding(objects(canonical?.bindings),"CREATOR_BRIDGE_DB","d1");
  // The canonical login D1 and Creator content D1 must be independent and
  // pin the same known Creator staging resource, never a similarly named D1.
  if(creatorBridgeDb!==IDENTITY_STAGE.creatorStageDb ||
     creatorBridgeDb===canonicalDb)
    reasons.push("CANONICAL_CREATOR_BRIDGE_D1_NOT_PINNED");
  if(stageDb!==IDENTITY_STAGE.creatorStageDb||legacyDb!==IDENTITY_STAGE.creatorStageDb)
    reasons.push("CREATOR_AND_LEGACY_D1_NOT_PINNED");
  if(!canonicalDb || [IDENTITY_STAGE.creatorStageDb,IDENTITY_STAGE.productionDb,
    IDENTITY_STAGE.olderV5PreviewDb,IDENTITY_STAGE.olderMemberPreviewDb,
    IDENTITY_STAGE.olderMemberMainDb].includes(canonicalDb))
    reasons.push("CANONICAL_AUTH_D1_NOT_ISOLATED");
  if(canonical?.issuer!==IDENTITY_STAGE.canonicalIssuer||canonical?.sessionOrigin!=="https://a.anevum.com")
    reasons.push("CANONICAL_ISSUER_AND_COOKIE_ORIGIN_UNVERIFIED");

  const applied=new Set(Array.isArray(input.creatorMigrationVersions)?input.creatorMigrationVersions:[]);
  const missing=REQUIRED_CREATOR_MIGRATIONS.filter(x=>!applied.has(x));
  if(missing.length)reasons.push("STAGING_MIGRATIONS_NOT_APPLIED:"+missing.join(","));
  const stats=input.counts&&typeof input.counts==="object"?input.counts:{};
  if(!Number.isSafeInteger(stats.creatorMembers)||stats.creatorMembers<2)
    reasons.push("INDEPENDENT_CREATOR_MEMBER_COUNT_INSUFFICIENT");

  // Written evidence identifiers are required for an independent reviewer.
  // This is NOT validation of the underlying evidence or a deploy switch.
  const attestations=input.acceptance&&typeof input.acceptance==="object"?input.acceptance:{};
  for(const label of REQUIRED_ACCEPTANCE){
    const entry=attestations[label];
    if(!entry||entry.result!=="passed"||!saneRef(entry.evidence))
      reasons.push("ACCEPTANCE_MISSING:"+label);
  }
  return {
    status:reasons.length?"blocked":"review_candidate",
    reasons,
    candidateForOwnerReview:reasons.length===0
  };
}
