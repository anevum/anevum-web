// Owner authority is the intersection of verified Cloudflare Access and
// the exact Better Auth owner-member account, never an email or client field alone.
import { memberConfigured, makeMemberAuth } from "./member.mjs";
import { resolveMemberOrigin } from "./member-preflight.mjs";

export class OwnerMemberBindingError extends Error {
  constructor(status) {
    super(status === 503 ? "Owner-member binding unavailable." : "Owner-member access denied.");
    this.name = "OwnerMemberBindingError";
    this.status = status;
  }
}

export function assertOwnerMemberSession(env, accessIdentity, memberSession) {
  const ownerId = String(env?.RHEN_OWNER_MEMBER_ID || "").trim();
  const accessEmail = String(env?.RHEN_OWNER_EMAIL || "").trim().toLowerCase();
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(ownerId) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessEmail)) {
    throw new OwnerMemberBindingError(503);
  }
  if (String(accessIdentity?.email || "").trim().toLowerCase() !== accessEmail ||
      memberSession?.user?.id !== ownerId ||
      memberSession?.user?.emailVerified !== true) {
    throw new OwnerMemberBindingError(403);
  }
  return true;
}

export async function verifyOwnerMemberBinding(request, env, accessIdentity) {
  // The currently deployed legacy Worker remains Access-only because it runs
  // old code. A future V5 Worker must never silently downgrade to Access-only
  // if the required binding flag is missing, false or misconfigured.
  if (env?.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED !== "true")
    throw new OwnerMemberBindingError(503);
  const origin = resolveMemberOrigin(request, env);
  if (!origin || !memberConfigured(env)) throw new OwnerMemberBindingError(503);
  let session;
  try {
    session = await makeMemberAuth(env, origin).api.getSession({headers:request.headers});
  } catch {
    throw new OwnerMemberBindingError(503);
  }
  return assertOwnerMemberSession(env, accessIdentity, session);
}
