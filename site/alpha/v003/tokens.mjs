/* DB-backed 256-bit bearer capabilities. No shared signing secret is required.
 * Tokens are valid only for a single release for at most 15 minutes. Stored only
 * as SHA-256 hashes. Issue requires an authenticated and authorized owner/staff
 * caller; verification can be done in the isolated, read-only runtime.
 */
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TOKEN=/^[a-f0-9]{64}$/;
const encoder=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const hash=async token=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(token))));
export async function mintPreview(db,releaseId,issuedBy,now=Math.floor(Date.now()/1000)){
  if(!ID.test(releaseId)||typeof issuedBy!=="string"||!issuedBy||issuedBy.length>200)
    throw new Error("Invalid preview requester");
  const raw=new Uint8Array(32);crypto.getRandomValues(raw);
  const token=hex(raw);
  const digest=await hash(token);
  await db.prepare("DELETE FROM anevum_package_preview_tokens WHERE expires_at<=?").bind(now).run();
  await db.prepare(
    "INSERT INTO anevum_package_preview_tokens(token_hash,release_id,issued_by,created_at,expires_at) VALUES(?,?,?,?,?)"
  ).bind(digest,releaseId,issuedBy,now,now+15*60).run();
  return token;
}
export async function verifyPreview(db,releaseId,token,now=Math.floor(Date.now()/1000)){
  if(!ID.test(releaseId)||typeof token!=="string"||!TOKEN.test(token))return false;
  try{
    const found=await db.prepare(
      "SELECT token_hash FROM anevum_package_preview_tokens WHERE release_id=? AND token_hash=? AND expires_at>?"
    ).bind(releaseId,await hash(token),now).first();
    return !!found;
  }catch{return false;}
}
