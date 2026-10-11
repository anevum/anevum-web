/** Non-authoritative member Command projection.
 * Real authorization and all D1 tenant keys are verified on the Worker.
 * This client parser must never treat entitlements as operator/broker rights.
 */
export type MemberCommandData = Readonly<{
  user: Readonly<{id:string}>;
  profile: Readonly<{displayName:string;theme:"system"|"light"|"dark"}>;
  savedApps:readonly string[];
  follows:readonly string[];
  entitlements:ReadonlyArray<Readonly<{app:string;capability:string;expiresAt:string|null}>>;
}>;

const object=(v:unknown):v is Record<string,unknown> =>
  v!==null&&typeof v==="object"&&!Array.isArray(v);
const slug=(v:unknown):v is string=>
  typeof v==="string"&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(v);
function invalid():never {throw new Error("The active member account could not be verified.");}
const validSlugs=(v:unknown):v is string[] =>
  Array.isArray(v)&&v.length<=100&&v.every(slug)&&new Set(v).size===v.length;

export function parseMemberCommandResponse(input:unknown,expectedMemberId:string):MemberCommandData {
  if(!expectedMemberId||expectedMemberId.length>128||!object(input)||
     !object(input.user)||input.user.id!==expectedMemberId||
     !object(input.profile)||typeof input.profile.displayName!=="string"||
     !input.profile.displayName.trim()||input.profile.displayName.length>128||
     !["system","light","dark"].includes(String(input.profile.theme))||
     !validSlugs(input.savedApps)||!validSlugs(input.follows)||
     !Array.isArray(input.entitlements)||input.entitlements.length>100)
    return invalid();
  const entitlements:MemberCommandData["entitlements"]=[];
  for(const e of input.entitlements){
    if(!object(e)||!slug(e.app)||typeof e.capability!=="string"||
       !/^[a-z][a-z0-9_:.-]{0,95}$/.test(e.capability)||
       (e.expiresAt!==null&&e.expiresAt!==undefined&&
        (typeof e.expiresAt!=="string"||e.expiresAt.length>48)))
      return invalid();
    (entitlements as Array<{app:string;capability:string;expiresAt:string|null}>).push(
      Object.freeze({app:e.app,capability:e.capability,expiresAt:e.expiresAt??null})
    );
  }
  return Object.freeze({
    user:Object.freeze({id:expectedMemberId}),
    profile:Object.freeze({
      displayName:input.profile.displayName,
      theme:input.profile.theme as "system"|"light"|"dark"
    }),
    savedApps:Object.freeze([...input.savedApps]),
    follows:Object.freeze([...input.follows]),
    entitlements:Object.freeze(entitlements)
  });
}

/** A 200 is not a success unless the server confirms the exact action.
 * No client-provided account selector is accepted by this projection.
 */
export function verifiedPreferenceAcknowledgement(value:unknown,expectedSlug:string,expectedSaved:boolean):boolean {
  return object(value)&&Object.keys(value).sort().join("|")==="saved|slug"&&
    value.saved===expectedSaved&&value.slug===expectedSlug&&slug(expectedSlug);
}
