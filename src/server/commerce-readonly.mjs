// Read-only member commerce preview. NO live orders, bank data or payment acceptance.
// Executed only after verified Better Auth session and trusted origin in member.mjs.
import { COMMERCE_PRODUCTS, PAYMENT_ACCEPTANCE } from "./commerce-contract.mjs";

function json(payload, status = 200) {
  return Response.json(payload, { status, headers: {
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}

export function commerceReadOnlyEndpoint(request, env, user, pathname) {
  if (typeof user?.id !== "string" || !user.id) {
    return json({message:"Sign in required"},401);
  }
  if (env?.ANEVUM_COMMERCE_PREVIEW_ENABLED !== "true") {
    return json({message:"ANEVUM Commerce is not available"},503);
  }
  if (new URL(request.url).search !== "") {
    return json({message:"Commerce preview does not allow account or order selection"},400);
  }
  if (request.method !== "GET") {
    return json({message:"ANEVUM is not accepting payments or orders"},503);
  }
  if (pathname !== "/api/member/commerce/catalog") {
    return json({message:"Commerce actions are not available"},503);
  }
  return json({
    available: false,
    previewOnly: true,
    paymentAcceptance: PAYMENT_ACCEPTANCE.enabled,
    rail: PAYMENT_ACCEPTANCE.rail,
    freeVault: { includedBytes: 2 * 1024 ** 3 },
    products: Object.entries(COMMERCE_PRODUCTS).map(([code,item]) => ({
      code, kind: item.kind, priceCents: item.cents, currency:"USD",
      recurring: false, durationDays: item.durationDays ?? null,
      addedBytes: item.bytes ?? null, purchasable: false
    }))
  });
}
