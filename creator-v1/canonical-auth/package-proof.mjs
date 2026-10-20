/* ANEVUM canonical package attribution proof — source-only V010.
 * Only the canonical profile issuer may compute this HMAC. The browser does
 * not submit subject IDs or proofs. Separate secret, not the auth signing key.
 * Deliberately binds to the current handle to prevent cross-handle correlation.
 */
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
export async function canonicalPackageProof(env,userId,handle,createdAt){
 if(env?.CANONICAL_PACKAGE_PROOF_ENABLED!=="true")return null;
 const secret=env?.CANONICAL_PACKAGE_PROOF_KEY;
 if(typeof secret!=="string"||secret.length<40||secret.length>4096)
  throw Error("Canonical package proof secret unavailable");
 if(typeof userId!=="string"||userId.length<1||userId.length>128||
    typeof handle!=="string"||!HANDLE.test(handle)||
    !Number.isSafeInteger(Number(createdAt))||Number(createdAt)<=0)
  throw Error("Invalid canonical package proof subject");
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),
  {name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const data=new TextEncoder().encode([
  "anevum-canonical-package-owner-proof-v1",userId,handle,String(createdAt)
 ].join("\u0000"));
 const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,data));
 return Array.from(sig,byte=>byte.toString(16).padStart(2,"0")).join("");
}
