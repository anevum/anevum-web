/**
 * V013 canonical Better Auth candidate. No deploy, migration, route, token
 * bridge or account linking is activated by committing this module.
 *
 * This is the new host's identity boundary, NOT the existing Creator V1
 * email-code session and NOT the V5 member/RHEN authorization service.
 */
export const CANONICAL_ORIGIN="https://a.anevum.com";
export const CANONICAL_PREFIX="/api/v1/member";
export const CANONICAL_AUTH_PATH=CANONICAL_PREFIX+"/auth";
export const CANONICAL_ISSUER="anevum-better-auth-staging-v1";
export const CANONICAL_COOKIE_PREFIX="anevum_can_stage";
export const REQUIRED_CANONICAL_TABLES=Object.freeze(["user","session","account","verification","rateLimit"]);
export const AUTH_ALLOWLIST=Object.freeze({
  "GET":new Set([
    CANONICAL_AUTH_PATH+"/get-session",
    CANONICAL_AUTH_PATH+"/callback/google"
  ]),
  "POST":new Set([
    CANONICAL_AUTH_PATH+"/sign-in/social",
    CANONICAL_AUTH_PATH+"/email-otp/send-verification-otp",
    CANONICAL_AUTH_PATH+"/sign-in/email-otp",
    CANONICAL_AUTH_PATH+"/sign-out"
  ])
});
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}$/;
const isSecret=x=>typeof x==="string"&&x.length>=32;
const isProviderSecret=x=>typeof x==="string"&&x.length>=10;
const configured=x=>x&&typeof x.prepare==="function"&&typeof x.batch==="function";
const list=value=>new Set(
  typeof value==="string"?value.split(",").map(s=>s.trim().toLowerCase()).filter(x=>EMAIL.test(x)):[]
);

export function canonicalConfigState(env){
  const enabled=env?.ANEVUM_CANONICAL_STAGE_ENABLED==="true";
  const schemaApproved=env?.CANONICAL_SCHEMA_APPROVED==="true";
  const db=configured(env?.MEMBER_DB);
  const secret=isSecret(env?.CANONICAL_BETTER_AUTH_SECRET);
  const google=env?.CANONICAL_GOOGLE_ENABLED==="true" &&
    isProviderSecret(env?.CANONICAL_GOOGLE_CLIENT_ID) &&
    isProviderSecret(env?.CANONICAL_GOOGLE_CLIENT_SECRET);
  const restricted=list(env?.CANONICAL_PROTECTED_EMAILS);
  const invited=list(env?.CANONICAL_INVITE_EMAILS);
  const protectedConfigured=restricted.size>0;
  const email=env?.CANONICAL_EMAIL_ENABLED==="true" &&
    isSecret(env?.CANONICAL_RESEND_API_KEY);
  const operational=enabled&&schemaApproved&&db&&secret&&(google||email)&&protectedConfigured;
  const inviteMode=operational &&
    env?.CANONICAL_INVITED_SIGNUP_ENABLED==="true" && invited.size>=2;
  return {
    operational:Boolean(operational),
    invited:Boolean(inviteMode),
    email:Boolean(email),
    google:Boolean(google),
    // No account roles, provider grants or cross-origin linking.
    provider:operational?(email?"email":"google"):null,
    issuer:CANONICAL_ISSUER
  };
}

/** Invited member creation is decided only at the trusted database hook. */
export function permitCanonicalUserCreation(env,email){
  const status=canonicalConfigState(env);
  const normalized=typeof email==="string"?email.trim().toLowerCase():"";
  if(!status.invited||!EMAIL.test(normalized)||normalized.length>254)return false;
  if(list(env.CANONICAL_PROTECTED_EMAILS).has(normalized))return false;
  return list(env.CANONICAL_INVITE_EMAILS).has(normalized);
}

/** Must be independently verified against an isolated D1, not a source flag. */
export async function canonicalSchemaReady(env){
  if(!configured(env?.MEMBER_DB))return false;
  try{
    const x=await env.MEMBER_DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    if(x?.success===false||!Array.isArray(x?.results))return false;
    const tables=new Set(x.results.map(row=>row?.name).filter(x=>typeof x==="string"));
    if(!REQUIRED_CANONICAL_TABLES.every(name=>tables.has(name)) ||
      !tables.has("canonical_identity_manifest"))return false;
    // An existing V5 D1 can have ALL Better Auth tables; accepting it would
    // silently mix accounts. Require a deliberately provisioned issuer marker.
    const marker=await env.MEMBER_DB.prepare(
      "SELECT issuer,migration FROM canonical_identity_manifest WHERE id=1"
    ).all();
    return marker?.success!==false && Array.isArray(marker?.results) &&
      marker.results.length===1 && marker.results[0]?.issuer===CANONICAL_ISSUER &&
      marker.results[0]?.migration==="0001_canonical_better_auth_core";
  }catch{return false;}
}

export function isCanonicalOrigin(request){
  try{
    const url=new URL(request.url);
    return url.origin===CANONICAL_ORIGIN && url.protocol==="https:" &&
      url.username===""&&url.password==="";
  }catch{return false;}
}

/**
 * Never forward old V5/Creator tokens. OAuth state cookies use the Better Auth
 * cookie prefix with optional __Secure- or __Host- browser prefixes.
 */
export function withoutForeignCookies(request){
  const headers=new Headers(request.headers);
  const cookie=(headers.get("cookie")||"").split(";").map(s=>s.trim()).filter(Boolean)
    .filter(x=>/^(?:__Secure-|__Host-)?anevum_can_stage\.[A-Za-z0-9_.-]+=/i.test(x));
  if(cookie.length)headers.set("cookie",cookie.join("; "));
  else headers.delete("cookie");
  headers.delete("authorization");
  return new Request(request,{headers});
}
