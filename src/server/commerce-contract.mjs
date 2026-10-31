// ANEVUM-owned commerce policy. No real-money rail has been approved.
// Founder direction 2026-10-26: build and integrate ANEVUM's own system first;
// accept ZERO payments until an independently verified, explicitly approved release.
// This is a pure draft contract: no checkout, external SDK, card or bank collection.
export const PAYMENT_ACCEPTANCE = Object.freeze({
  enabled: false,
  rail: null,
  reason: "ANEVUM payment acceptance is not available until the entire system and lawful settlement rail are approved."
});

export const COMMERCE_PRODUCTS = Object.freeze({
  "signal-support-5": Object.freeze({ kind: "supporter", cents: 500, recurring: false }),
  "signal-support-10": Object.freeze({ kind: "supporter", cents: 1000, recurring: false }),
  "signal-support-25": Object.freeze({ kind: "supporter", cents: 2500, recurring: false }),
  "vault-10g-month": Object.freeze({ kind: "vault", cents: 400, bytes: 10 * 1024 ** 3, durationDays: 30, recurring: false }),
  "vault-50g-month": Object.freeze({ kind: "vault", cents: 900, bytes: 50 * 1024 ** 3, durationDays: 30, recurring: false })
});

// Business approval of proposed prices is not customer billing approval.
// The 100 GiB option is deferred; no arbitrary amounts or identifiers.
export function validatedProduct(code, approvedPrices) {
  if (typeof code !== "string" || !Object.hasOwn(COMMERCE_PRODUCTS, code)) {
    throw new Error("Unknown catalog item");
  }
  const product = COMMERCE_PRODUCTS[code];
  if (approvedPrices?.[code] !== product.cents) {
    throw new Error("Product price not configured or mismatched");
  }
  return { code, ...product, currency: "USD" };
}

// Intentional hard gate, independent of deployment flags or old provider secrets.
// Remove only in a distinct, reviewed implementation after legal/payment-rail,
// real-world settlement, fraud, refund and reconciliation acceptance.
export function checkoutEnabled(_env) {
  return false;
}

// An arbitrary client statement, webhook body, bank screenshot, synthetic event,
// or database flag never proves cleared funds. No paid entitlements can be granted.
export function canFulfillPaidOrder(_order, _paymentEvidence) {
  return false;
}

export function unpaidCatalogQuote(code, approvedPrices) {
  const product = validatedProduct(code, approvedPrices);
  return { ...product, checkoutAvailable: false, paid: false };
}

export function quotaBytes(included, passes, now = Date.now()) {
  if (!Number.isSafeInteger(included) || included < 0 || !Number.isFinite(now)) {
    throw new Error("Invalid quota inputs");
  }
  if (!Array.isArray(passes)) throw new Error("Invalid capacity passes");
  return passes.reduce((total, x) => {
    if (!x || !Number.isSafeInteger(x.added_bytes) || x.added_bytes < 0) {
      throw new Error("Invalid capacity pass");
    }
    return x.starts_at_ms <= now && x.ends_at_ms > now && x.revoked_at_ms == null
      ? total + x.added_bytes
      : total;
  }, included);
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
