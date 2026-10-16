import {boundedText} from "./request-body.mjs";
import {isProtectedCanonicalEmail} from "./policy.mjs";

/**
 * V025: fail-closed, canonical-member-only deletion intent.
 * This is a guard for Better Auth's native delete-user operation, not a new
 * account deletion implementation or a way to delete Creator/V5/RHEN data.
 *
 * The operation remains unreachable until the explicit staging erasure flag
 * is approved and enabled. No ID, provider, staff privilege or session token
 * may be supplied by the browser to select whose account is removed.
 */
export const CANONICAL_ERASURE_CONFIRMATION="DELETE MY ANEVUM ACCOUNT";
export const CANONICAL_ERASURE_FRESH_MS=10*60*1000;

function sessionStartMillis(raw){
  if(raw instanceof Date)return raw.getTime();
  if(typeof raw==="string")return Date.parse(raw);
  if(typeof raw==="number"&&Number.isFinite(raw))
    return raw<1e12?raw*1000:raw;
  return Number.NaN;
}

function rejected(status,error){return {ok:false,status,error};}

export async function assessCanonicalErasureIntent(request,verifiedSession,env,now=Date.now()){
  if(env?.CANONICAL_ACCOUNT_ERASURE_ENABLED!=="true")
    return rejected(404,"Account removal route unavailable");
  if(request.method!=="POST")return rejected(404,"Account removal route unavailable");
  if(!verifiedSession?.user?.id||verifiedSession.user.emailVerified!==true)
    return rejected(401,"Sign in with a verified account");
  const email=verifiedSession.user.email;
  if(typeof email!=="string"||!email.includes("@"))
    return rejected(403,"Verified account required");
  if(isProtectedCanonicalEmail(env,email))
    return rejected(403,"This account cannot be removed through community settings");
  const started=sessionStartMillis(verifiedSession.session?.createdAt);
  if(!Number.isFinite(started)||started>now+1000||
     now-started<0||now-started>CANONICAL_ERASURE_FRESH_MS)
    return rejected(403,"Sign out and sign in again before requesting deletion");
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")||""))
    return rejected(400,"Invalid account removal request");
  const raw=await boundedText(request,256);
  if(raw===null)return rejected(400,"Invalid account removal request");
  let data;
  try{data=JSON.parse(raw);}catch{return rejected(400,"Invalid account removal request");}
  if(!data||typeof data!=="object"||Array.isArray(data)||
     Object.keys(data).sort().join(",")!=="confirmation,email"||
     data.confirmation!==CANONICAL_ERASURE_CONFIRMATION||
     typeof data.email!=="string"||data.email!==email)
    return rejected(400,"Email address and confirmation phrase must match the current account");
  return {ok:true};
}
