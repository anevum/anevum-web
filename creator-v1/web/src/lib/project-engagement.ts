/**
 * Only an explicitly recognized server-owned member health contract can open
 * the matching project engagement surface. Never bridge canonical accounts to
 * the older Creator member identity, or infer server actions from client state.
 */
export type ProjectEngagementGateway=
  | {kind:"canonical-readonly";registration:"invite-only"|"open"|"closed"}
  | {kind:"legacy"}
  | {kind:"closed"};

export function projectEngagementGateway(health:unknown):ProjectEngagementGateway {
  if(!health||typeof health!=="object"||Array.isArray(health))return {kind:"closed"};
  const value=health as Record<string,unknown>;
  if(value.service==="anevum-canonical-auth-staging"){
    const registration=value.status==="ready"&&
      (value.registration==="open"||value.registration==="invite-only")
        ?value.registration:"closed";
    return {kind:"canonical-readonly",registration};
  }
  if(value.status==="ok"&&typeof value.signupEnabled==="boolean")return {kind:"legacy"};
  return {kind:"closed"};
}
