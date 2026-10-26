// ANEVUM Commerce V001 — Square is a replaceable *processor*, not our ledger.
// Fail closed until explicit commerce activation and configured catalog prices.
export const COMMERCE_PRODUCTS = Object.freeze({
  "signal-support": { kind: "supporter", minCents: 100, maxCents: 100000 },
  "vault-10g-month": { kind: "vault", bytes: 10 * 1024 ** 3, durationDays: 30 },
  "vault-50g-month": { kind: "vault", bytes: 50 * 1024 ** 3, durationDays: 30 }
});

export function validatedProduct(code, priceConfig) {
  const product = COMMERCE_PRODUCTS[code];
  if (!product) throw new Error("Unknown catalog item");
  const cents = Number(priceConfig?.[code]);
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 100000) {
    throw new Error("Product has no approved price");
  }
  return { code, ...product, cents, currency: "USD" };
}

export function checkoutEnabled(env) {
  return env?.ANEVUM_COMMERCE_ENABLED === "true" &&
    env?.ANEVUM_SQUARE_MODE === "sandbox" &&
    typeof env?.SQUARE_ACCESS_TOKEN === "string" &&
    env.SQUARE_ACCESS_TOKEN.length > 10 &&
    typeof env?.SQUARE_WEBHOOK_SIGNATURE_KEY === "string" &&
    env.SQUARE_WEBHOOK_SIGNATURE_KEY.length > 10 &&
    typeof env?.SQUARE_WEBHOOK_URL === "string";
}

export function quotaBytes(included, passes, now = Date.now()) {
  const active = passes.filter(x => x.starts_at_ms <= now && x.ends_at_ms > now && x.revoked_at_ms == null);
  return Number(included) + active.reduce((sum, x) => sum + Number(x.added_bytes), 0);
}

export function safeFilename(name) {
  if (typeof name !== "string" || !name.trim() || name.length > 180 ||
      /[\/\\\x00-\x1f\x7f]/.test(name) || name === "." || name === ".." ||
      name.trim().startsWith(".")) throw new Error("Invalid filename");
  return name.trim();
}

export function safeVaultMediaType(type) {
  const allowed = new Set(["application/zip","application/pdf","text/plain",
    "image/png","image/jpeg","image/webp","audio/mpeg","audio/wav",
    "video/mp4","application/json","text/html"]);
  if (!allowed.has(type)) throw new Error("Unsupported file type");
  return type;
}

export function allowedUploadBytes(value, max = 50 * 1024 * 1024) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0 || n > max) throw new Error("Invalid upload length");
  return n;
}

export async function verifySquareWebhook(raw, signature, signatureKey, url) {
  if (!raw || !signature || !signatureKey || !url) return false;
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", bytes.encode(signatureKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const actual = new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes.encode(url + raw)));
  const expected = Uint8Array.from(atob(signature), x => x.charCodeAt(0));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i=0;i<actual.length;i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export function providerPaymentMatches(order, payment) {
  // Only a completed, exact-amount, exact-currency payment can fulfill entitlements.
  return order?.provider === "square" &&
    order?.status === "pending" &&
    payment?.status === "COMPLETED" &&
    payment?.order_id === order.provider_order_id &&
    Number(payment?.amount_money?.amount) === Number(order.amount_cents) &&
    payment?.amount_money?.currency === order.currency;
}
