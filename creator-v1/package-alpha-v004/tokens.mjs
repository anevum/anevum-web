/* Capability URLs authorize a single immutable private build for at most 15 minutes.
 * The runtime has no canonical auth/cookie access and requires this HMAC proof.
 */
const enc = new TextEncoder();
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
async function key(secret, purpose) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("PACKAGE_PREVIEW_KEY must be a 32+ character secret");
  return crypto.subtle.importKey("raw", enc.encode(secret + ":" + purpose), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function mintPreview(secret, releaseId, now = Math.floor(Date.now() / 1000)) {
  if (!/^[a-f0-9-]{36}$/.test(releaseId)) throw new Error("Invalid release ID");
  const until = now + 15 * 60;
  const mac = await crypto.subtle.sign("HMAC", await key(secret, "anevum-package-preview-v003"), enc.encode(releaseId + ":" + until));
  return until + "." + hex(new Uint8Array(mac));
}
export async function verifyPreview(secret, releaseId, token, now = Math.floor(Date.now() / 1000)) {
  if (typeof token !== "string" || !/^[0-9]{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [stamp, signature] = token.split(".");
  const until = Number(stamp);
  if (!Number.isSafeInteger(until) || until < now || until > now + 15 * 60) return false;
  const raw = Uint8Array.from(signature.match(/../g).map(n => parseInt(n, 16)));
  return crypto.subtle.verify("HMAC", await key(secret, "anevum-package-preview-v003"), raw, enc.encode(releaseId + ":" + until));
}
