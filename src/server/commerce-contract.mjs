// ANEVUM Commerce V001 — Square is a replaceable *processor*, not our ledger.
// Fail closed until explicit commerce activation and configured catalog prices.
// Owner approved October 26, 2026. Catalog approval is not payment activation.
// The 100 GiB proposal is deferred until real usage, reserve and abuse review.
export const COMMERCE_PRODUCTS = Object.freeze({
  "signal-support-5": Object.freeze({ kind: "supporter", cents: 500, recurring: false }),
  "signal-support-10": Object.freeze({ kind: "supporter", cents: 1000, recurring: false }),
  "signal-support-25": Object.freeze({ kind: "supporter", cents: 2500, recurring: false }),
  "vault-10g-month": Object.freeze({ kind: "vault", cents: 400, bytes: 10 * 1024 ** 3, durationDays: 30, recurring: false }),
  "vault-50g-month": Object.freeze({ kind: "vault", cents: 900, bytes: 50 * 1024 ** 3, durationDays: 30, recurring: false })
});

// Even with an approved catalog, refuse checkout unless the server's configured
// price matches exactly. Callers cannot submit arbitrary amounts or upgrade IDs.
export function validatedProduct(code, priceConfig) {
  const product = COMMERCE_PRODUCTS[code];
  if (!product) throw new Error("Unknown catalog item");
  if (priceConfig?.[code] !== product.cents) {
    throw new Error("Product price not configured or mismatched");
  }
  return { code, ...product, currency: "USD" };
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
  let expected;
  try { expected = Uint8Array.from(atob(signature), x => x.charCodeAt(0)); }
  catch { return false; }
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i=0;i<actual.length;i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export function providerPaymentMatches(order, payment) {
  // Only a completed, exact-amount, exact-currency payment can fulfill entitlements.
  return order?.provider === "square" &&
    order?.status === "pending" &&
    typeof order?.provider_order_id === "string" && order.provider_order_id.length > 0 &&
    typeof payment?.order_id === "string" && payment.order_id.length > 0 &&
    payment?.status === "COMPLETED" &&
    payment.order_id === order.provider_order_id &&
    Number(payment?.amount_money?.amount) === Number(order.amount_cents) &&
    payment?.amount_money?.currency === order.currency;
}
