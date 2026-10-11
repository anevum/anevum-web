/**
 * Optional stale-tab comparison for member save/follow mutations.
 * The browser-supplied header is NEVER a user selector. Authorization and
 * the D1 row key always derive from the verified Better Auth session user.id.
 * Older clients that omit the header keep backwards compatibility.
 */
export function preferenceExpectedMemberMatches(request, verifiedMemberId) {
  if (typeof verifiedMemberId !== "string" || !verifiedMemberId || verifiedMemberId.length > 128) return false;
  return !request.headers.has("X-ANEVUM-EXPECTED-MEMBER-ID") ||
    request.headers.get("X-ANEVUM-EXPECTED-MEMBER-ID") === verifiedMemberId;
}
