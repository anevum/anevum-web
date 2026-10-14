/**
 * Canonical identity transition: internal, READ-ONLY staging lookup.
 * This is not an auth provider, linking ceremony or HTTP endpoint.
 * The legacy identity must come from the existing verified server session.
 *
 * Never resolve this table by email, handle or browser-selected user ID.
 * No migration is applied and no caller is wired until independent acceptance.
 */
export const CANONICAL_ISSUER="anevum-better-auth-staging-v1";
const MEMBER_ID=/^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;

/**
 * Returns only linked/unlinked status; no canonical subject or evidence digest
 * is exposed to clients. Missing schema is CLOSED, not automatically linked.
 * authenticatedLegacyMember MUST be the output of the staging Worker's
 * authenticated() from a verified host-scoped session cookie.
 */
export async function linkedIdentityStatus(db,authenticatedLegacyMember) {
  const id=authenticatedLegacyMember?.id;
  if(!db||typeof db.prepare!=="function"||typeof id!=="string"||!MEMBER_ID.test(id))
    return {linked:false,available:false};
  try {
    const statement=db.prepare(
      "SELECT 1 AS linked FROM creator_canonical_identity_links l "+
      "JOIN member_accounts a ON a.id=l.legacy_member_id "+
      "WHERE l.legacy_member_id=? AND a.status='active' "+
      "AND l.status='verified' AND l.revoked_at IS NULL "+
      "AND l.canonical_issuer=? LIMIT 1"
    ).bind(id,CANONICAL_ISSUER);
    const result=await statement.all();
    if(result?.success===false||!Array.isArray(result?.results))
      return {linked:false,available:false};
    return {linked:result.results.length===1&&result.results[0]?.linked===1,available:true};
  }catch{
    // The V012 migration is intentionally absent from actual staging today.
    return {linked:false,available:false};
  }
}
