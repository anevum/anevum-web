// RHEN Cloud billing. Stripe grants a subscription record ONLY, never trading
// authority. All broker/order operations remain outside the member Worker.
export const RHEN_CLOUD_PLANS = Object.freeze({
  founding: Object.freeze({ code: "founding", amountCents: 999, currency: "usd", interval: "month" }),
  standard: Object.freeze({ code: "standard", amountCents: 1999, currency: "usd", interval: "month" })
});
const BILLING_TABLES = ["member_billing_customers", "member_billing_subscriptions", "member_billing_events", "member_billing_checkout_locks"];
const STRIPE_API = "https://api.stripe.com/v1";
const ACTIVE_STATUSES = new Set(["active"]); // No trial periods are offered.
const OPEN_STATUSES = new Set(["incomplete", "trialing", "active", "past_due", "unpaid", "paused"]);
const encoder = new TextEncoder();

export class BillingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function billingReply(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

export async function billingSchemaReady(db) {
  if (!db || typeof db.prepare !== "function") return false;
  try {
    const response = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_billing_customers','member_billing_subscriptions','member_billing_events','member_billing_checkout_locks')"
    ).all();
    const found = new Set((response.results || []).map(row => row.name));
    return BILLING_TABLES.every(name => found.has(name));
  } catch { return false; }
}

function validStripeSettings(env, origin) {
  const mode = env?.ANEVUM_STRIPE_MODE;
  const key = String(env?.STRIPE_SECRET_KEY || "");
  const hook = String(env?.STRIPE_WEBHOOK_SECRET || "");
  const price1 = String(env?.STRIPE_FOUNDING_PRICE_ID || "");
  const price2 = String(env?.STRIPE_STANDARD_PRICE_ID || "");
  if (!["test", "live"].includes(mode) ||
      !key.startsWith(mode === "test" ? "sk_test_" : "sk_live_") ||
      !hook.startsWith("whsec_") ||
      !/^price_[A-Za-z0-9]+$/.test(price1) ||
      !/^price_[A-Za-z0-9]+$/.test(price2) ||
      price1 === price2) return false;
  if (origin === "https://anevum.com") {
    return mode === "live" && env?.ANEVUM_RHEN_BILLING_LIVE_APPROVED === "true";
  }
  return mode === "test" && origin === env?.MEMBER_PREVIEW_ORIGIN &&
    env?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true";
}

export function billingConfigured(env, origin) {
  return env?.ANEVUM_RHEN_BILLING_ENABLED === "true" && validStripeSettings(env, origin);
}

export function planFromPrice(env, priceId) {
  if (priceId && priceId === env?.STRIPE_FOUNDING_PRICE_ID) return "founding";
  if (priceId && priceId === env?.STRIPE_STANDARD_PRICE_ID) return "standard";
  return "unknown";
}

export function paidAccess(row, now = Math.floor(Date.now() / 1000)) {
  return Boolean(row && ACTIVE_STATUSES.has(row.status) &&
    row.plan_code !== "unknown" && Number(row.current_period_end) > now);
}

export async function readBillingStatus(db, userId, env, origin) {
  const schemaReady = await billingSchemaReady(db);
  const enabled = schemaReady && billingConfigured(env, origin);
  if (!schemaReady) return {
    available: false, checkoutEnabled: false, foundingEnabled: false, manageEnabled: false,
    plans: RHEN_CLOUD_PLANS, subscription: null, paidAccess: false,
    paperExecutionEnabled: false, liveExecutionEnabled: false
  };
  const row = await db.prepare(
    "SELECT plan_code, status, current_period_end, cancel_at_period_end " +
    "FROM member_billing_subscriptions WHERE user_id=? " +
    "ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END, current_period_end DESC LIMIT 1"
  ).bind(userId).first();
  const customer = await db.prepare(
    "SELECT stripe_customer_id FROM member_billing_customers WHERE user_id=?"
  ).bind(userId).first();
  const subscription = row ? {
    plan: row.plan_code, status: row.status,
    currentPeriodEnd: Number(row.current_period_end) || null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end)
  } : null;
  return {
    available: enabled,
    checkoutEnabled: enabled && env?.ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED === "true",
    foundingEnabled: enabled && env?.ANEVUM_RHEN_FOUNDING_ENABLED === "true",
    manageEnabled: Boolean(customer && env?.STRIPE_SECRET_KEY),
    plans: RHEN_CLOUD_PLANS,
    subscription,
    paidAccess: paidAccess(row),
    paperExecutionEnabled: false,
    liveExecutionEnabled: false
  };
}

async function stripeRequest(env, method, path, fields, idempotencyKey) {
  const target = new URL(STRIPE_API + path);
  const resources = [
    "/v1/customers", "/v1/checkout/sessions",
    "/v1/billing_portal/sessions", "/v1/subscriptions", "/v1/prices"
  ];
  if (target.origin !== "https://api.stripe.com" ||
      !resources.some(prefix => target.pathname === prefix || target.pathname.startsWith(prefix + "/"))) {
    throw new BillingError(500, "Stripe operation not allowed.");
  }
  const headers = {
    Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
    Accept: "application/json"
  };
  if (fields) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  let response;
  try {
    response = await fetch(STRIPE_API + path, {
      method,
      headers,
      body: fields ? new URLSearchParams(fields).toString() : undefined,
      signal: AbortSignal.timeout(12000)
    });
  } catch { throw new BillingError(502, "Billing provider is unavailable."); }
  if (!response.ok) throw new BillingError(502, "Billing provider rejected the request.");
  try { return await response.json(); }
  catch { throw new BillingError(502, "Invalid billing provider response."); }
}

async function customerIdempotencyKey(userId) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(userId));
  const token = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return "anevum-rhen-customer-v1-" + token;
}

async function ensureCustomer(db, env, user) {
  const existing = await db.prepare(
    "SELECT stripe_customer_id FROM member_billing_customers WHERE user_id=?"
  ).bind(user.id).first();
  if (existing) return existing.stripe_customer_id;
  const customer = await stripeRequest(env, "POST", "/customers", {
    email: user.email,
    "metadata[anevum_member_id]": user.id,
    "metadata[anevum_product]": "rhen_cloud"
  }, await customerIdempotencyKey(user.id));
  if (!/^cus_[A-Za-z0-9]+$/.test(String(customer.id || ""))) {
    throw new BillingError(502, "Billing customer could not be created.");
  }
  await db.prepare(
    "INSERT OR IGNORE INTO member_billing_customers (user_id, stripe_customer_id) VALUES (?,?)"
  ).bind(user.id, customer.id).run();
  const mapped = await db.prepare(
    "SELECT stripe_customer_id FROM member_billing_customers WHERE user_id=?"
  ).bind(user.id).first();
  if (!mapped || mapped.stripe_customer_id !== customer.id) {
    throw new BillingError(409, "Billing customer mapping conflict.");
  }
  return customer.id;
}

async function acquireCheckoutLock(db, userId) {
  const token = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  try {
    const result = await db.prepare(
      "INSERT INTO member_billing_checkout_locks (user_id,lock_token,expires_at) VALUES (?,?,?) " +
      "ON CONFLICT(user_id) DO UPDATE SET lock_token=excluded.lock_token, expires_at=excluded.expires_at " +
      "WHERE member_billing_checkout_locks.expires_at < ?"
    ).bind(userId, token, now + 180, now).run();
    if (result?.success !== true) throw new BillingError(503, "Checkout lock is unavailable.");
    if (Number(result?.meta?.changes) !== 1) {
      throw new BillingError(409, "Checkout is already being prepared.");
    }
  } catch (error) {
    if (error instanceof BillingError) throw error;
    throw new BillingError(503, "Checkout lock is unavailable.");
  }
  return token;
}

async function releaseCheckoutLock(db, userId, token) {
  // Compare token, not user alone: a crashed/expired request must not unlock a
  // newer request that already acquired the same member's execution slot.
  try {
    await db.prepare(
      "DELETE FROM member_billing_checkout_locks WHERE user_id=? AND lock_token=?"
    ).bind(userId, token).run();
  } catch { /* The lease expires; provider checks still prevent repeat checkout. */ }
}

async function checkNoOpenStripeBilling(env, customerId) {
  // Local state can lag Stripe because webhooks are asynchronous; always consult
  // the provider before creating another subscription for this user.
  const query = encodeURIComponent(customerId);
  const [sessions, subscriptions] = await Promise.all([
    stripeRequest(env, "GET", "/checkout/sessions?customer=" + query + "&status=open&limit=100"),
    stripeRequest(env, "GET", "/subscriptions?customer=" + query + "&status=all&limit=100")
  ]);
  if (sessions?.has_more || subscriptions?.has_more ||
      !Array.isArray(sessions?.data) || !Array.isArray(subscriptions?.data)) {
    throw new BillingError(503, "Existing billing state cannot be verified.");
  }
  if (sessions.data.some(s => s.status === "open" && s.mode === "subscription") ||
      subscriptions.data.some(s => OPEN_STATUSES.has(s.status))) {
    throw new BillingError(409, "There is already a subscription or unfinished checkout to manage.");
  }
}

export async function memberBillingEndpoint(request, env, user, origin, pathname) {
  if (!["GET", "POST"].includes(request.method)) return billingReply({ message: "Method not allowed." }, 405);
  const db = env.MEMBER_DB;
  if (pathname === "/api/member/billing" && request.method === "GET") {
    return billingReply(await readBillingStatus(db, user.id, env, origin));
  }
  if (pathname !== "/api/member/billing/checkout" && pathname !== "/api/member/billing/portal") {
    return billingReply({ message: "Billing endpoint not found." }, 404);
  }
  if (request.method !== "POST") return billingReply({ message: "Method not allowed." }, 405);
  if (!await billingSchemaReady(db) || !validStripeSettings(env, origin)) {
    return billingReply({ message: "Billing configuration is unavailable." }, 503);
  }
  if (pathname === "/api/member/billing/checkout") {
    if (!billingConfigured(env, origin) || env?.ANEVUM_RHEN_BILLING_CHECKOUT_ENABLED !== "true") {
      return billingReply({ message: "RHEN Cloud checkout is not open." }, 503);
    }
    if (user.emailVerified !== true) return billingReply({ message: "Verified account required." }, 403);
    let body;
    try {
      if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
        throw new Error("Expected JSON.");
      }
      const raw = await request.text();
      if (raw.length > 256) throw new Error("Invalid request.");
      body = JSON.parse(raw);
      if (!body || typeof body !== "object" || Array.isArray(body) ||
          Object.keys(body).length !== 1 || !["founding","standard"].includes(body.plan)) {
        throw new Error("Invalid selected plan.");
      }
    } catch { return billingReply({ message: "Invalid checkout selection." }, 400); }
    if (body.plan === "founding" && env?.ANEVUM_RHEN_FOUNDING_ENABLED !== "true") {
      return billingReply({ message: "Founding subscriptions are not open." }, 403);
    }
    const active = await db.prepare(
      "SELECT status FROM member_billing_subscriptions WHERE user_id=? " +
      "AND status IN ('active','trialing','past_due','unpaid','incomplete','paused') LIMIT 1"
    ).bind(user.id).first();
    if (active) return billingReply({ message: "Manage the existing subscription instead." }, 409);
    let checkoutLock = null;
    try {
      checkoutLock = await acquireCheckoutLock(db, user.id);
      const priceId = body.plan === "founding" ? env.STRIPE_FOUNDING_PRICE_ID : env.STRIPE_STANDARD_PRICE_ID;
      // Validate the actual Stripe price; never charge a different amount than advertised.
      const price = await stripeRequest(env, "GET", "/prices/" + priceId);
      if (price?.id !== priceId || price?.active !== true ||
          price?.currency !== "usd" || price?.type !== "recurring" ||
          price?.recurring?.interval !== "month" || price?.recurring?.interval_count !== 1 ||
          price?.unit_amount !== RHEN_CLOUD_PLANS[body.plan].amountCents) {
        throw new BillingError(503, "Configured price does not match the advertised subscription.");
      }
      const customerId = await ensureCustomer(db, env, user);
      await checkNoOpenStripeBilling(env, customerId);
      const checkout = await stripeRequest(env, "POST", "/checkout/sessions", {
        mode: "subscription",
        customer: customerId,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        client_reference_id: user.id,
        "subscription_data[metadata][anevum_product]": "rhen_cloud",
        "subscription_data[metadata][anevum_member_id]": user.id,
        success_url: origin + "/me/billing?checkout=success",
        cancel_url: origin + "/me/billing?checkout=cancelled"
      });
      if (checkout?.url && new URL(checkout.url).origin === "https://checkout.stripe.com") {
        return billingReply({ url: checkout.url });
      }
      throw new BillingError(502, "Billing checkout was not returned.");
    } catch (error) {
      return billingReply({ message: error instanceof BillingError ? error.message : "Billing unavailable." },
        error instanceof BillingError ? error.status : 502);
    } finally {
      if (checkoutLock) await releaseCheckoutLock(db, user.id, checkoutLock);
    }
  }
  try {
    const customer = await db.prepare(
      "SELECT stripe_customer_id FROM member_billing_customers WHERE user_id=?"
    ).bind(user.id).first();
    if (!customer) return billingReply({ message: "No billing customer to manage." }, 404);
    const portal = await stripeRequest(env, "POST", "/billing_portal/sessions", {
      customer: customer.stripe_customer_id,
      return_url: origin + "/me/billing"
    });
    if (portal?.url && new URL(portal.url).origin === "https://billing.stripe.com") {
      return billingReply({ url: portal.url });
    }
    throw new BillingError(502, "Billing portal was not returned.");
  } catch (error) {
    return billingReply({ message: error instanceof BillingError ? error.message : "Billing unavailable." },
      error instanceof BillingError ? error.status : 502);
  }
}

function parseSignature(header) {
  const parts = String(header || "").split(",").map(x => x.trim().split("="));
  const t = parts.find(x => x[0] === "t")?.[1];
  const signatures = parts.filter(x => x[0] === "v1").map(x => x[1]);
  return { timestamp: Number(t), signatures };
}

function equalHexDigest(actual, expected) {
  if (!/^[0-9a-f]{64}$/i.test(actual) || !/^[0-9a-f]{64}$/i.test(expected)) return false;
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature(payload, signatureHeader, secret, now = Math.floor(Date.now() / 1000)) {
  const { timestamp, signatures } = parseSignature(signatureHeader);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300 ||
      signatures.length < 1 || !String(secret || "").startsWith("whsec_")) return false;
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + payload));
  const digest = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,"0")).join("");
  return signatures.some(v => equalHexDigest(v, digest));
}

function periodEnd(subscription) {
  const entries = subscription?.items?.data || [];
  const periods = [
    Number(subscription?.current_period_end) || 0,
    ...entries.map(x => Number(x.current_period_end) || 0)
  ];
  return Math.max(...periods);
}

export function normalizeStripeSubscription(subscription, env) {
  if (!/^sub_[A-Za-z0-9]+$/.test(String(subscription?.id || "")) ||
      !/^cus_[A-Za-z0-9]+$/.test(String(subscription?.customer || ""))) {
    throw new BillingError(400, "Invalid subscription identifier.");
  }
  const items = subscription?.items?.data;
  const priceId = Array.isArray(items) && items.length === 1 ? String(items[0]?.price?.id || "") : "";
  const plan = planFromPrice(env, priceId);
  return {
    id: subscription.id, customerId: subscription.customer,
    priceId: priceId || "unrecognized", plan,
    status: typeof subscription.status === "string" ? subscription.status : "unknown",
    periodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0
  };
}

export async function stripeWebhookEndpoint(request, env) {
  if (request.method !== "POST") return billingReply({ message: "Method not allowed." }, 405);
  const origin = new URL(request.url).origin;
  if (env?.ANEVUM_RHEN_BILLING_WEBHOOKS_ENABLED !== "true" ||
      !billingConfigured(env, origin) || !await billingSchemaReady(env.MEMBER_DB)) {
    return billingReply({ message: "Billing webhooks are not configured." }, 503);
  }
  if ((Number(request.headers.get("content-length")) || 0) > 262144) {
    return billingReply({ message: "Webhook too large." }, 413);
  }
  const raw = await request.text();
  if (raw.length > 262144) return billingReply({ message: "Webhook too large." }, 413);
  if (!await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) {
    return billingReply({ message: "Invalid Stripe signature." }, 400);
  }
  let event;
  try { event = JSON.parse(raw); }
  catch { return billingReply({ message: "Invalid Stripe payload." }, 400); }
  if (!/^evt_[A-Za-z0-9]+$/.test(String(event?.id || "")) ||
      !Number.isSafeInteger(event?.created) ||
      Boolean(event?.livemode) !== (env.ANEVUM_STRIPE_MODE === "live")) {
    return billingReply({ message: "Invalid Stripe event environment." }, 400);
  }
  const accepted = new Set([
    "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"
  ]);
  if (!accepted.has(event.type)) return billingReply({ received: true, handled: false });
  const incomingId = event?.data?.object?.id;
  if (!/^sub_[A-Za-z0-9]+$/.test(String(incomingId || ""))) {
    return billingReply({ message: "Invalid subscription event." }, 400);
  }
  const db = env.MEMBER_DB;
  const processed = await db.prepare(
    "SELECT stripe_event_id FROM member_billing_events WHERE stripe_event_id=?"
  ).bind(event.id).first();
  if (processed) return billingReply({ received: true, duplicate: true });
  try {
    // Always retrieve Stripe's CURRENT canonical subscription. Delayed, duplicate,
    // and out-of-order events therefore cannot revive a canceled subscription.
    const latest = await stripeRequest(env, "GET", "/subscriptions/" + incomingId);
    if (Boolean(latest.livemode) !== (env.ANEVUM_STRIPE_MODE === "live")) {
      throw new BillingError(400, "Subscription belongs to another Stripe mode.");
    }
    const subscription = normalizeStripeSubscription(latest, env);
    const customer = await db.prepare(
      "SELECT user_id FROM member_billing_customers WHERE stripe_customer_id=?"
    ).bind(subscription.customerId).first();
    if (!customer) return billingReply({ received: true, handled: false });
    if (latest?.metadata?.anevum_product !== "rhen_cloud") {
      throw new BillingError(409, "Subscription is not a RHEN Cloud purchase.");
    }
    if (latest?.metadata?.anevum_member_id !== customer.user_id) {
      throw new BillingError(409, "Subscription ownership mismatch.");
    }
    await db.batch([
      db.prepare(
        "INSERT OR IGNORE INTO member_billing_events (stripe_event_id,event_type,created_at) VALUES (?,?,?)"
      ).bind(event.id,event.type,event.created),
      db.prepare(
        "INSERT INTO member_billing_subscriptions " +
        "(stripe_subscription_id,user_id,stripe_customer_id,stripe_price_id,plan_code,status," +
        "current_period_end,cancel_at_period_end,last_event_created) " +
        "VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET " +
        "stripe_price_id=excluded.stripe_price_id, plan_code=excluded.plan_code, " +
        "status=excluded.status,current_period_end=excluded.current_period_end, " +
        "cancel_at_period_end=excluded.cancel_at_period_end, " +
        "last_event_created=excluded.last_event_created,updated_at=datetime('now') " +
        "WHERE member_billing_subscriptions.user_id=excluded.user_id " +
        "AND member_billing_subscriptions.stripe_customer_id=excluded.stripe_customer_id"
      ).bind(
        subscription.id,customer.user_id,subscription.customerId,subscription.priceId,
        subscription.plan,subscription.status,subscription.periodEnd,
        subscription.cancelAtPeriodEnd,event.created
      )
    ]);
    return billingReply({ received: true, handled: true });
  } catch (error) {
    return billingReply({ message: error instanceof BillingError ? error.message : "Billing synchronization failed." },
      error instanceof BillingError ? error.status : 503);
  }
}

export async function cancelBillingBeforeAccountDeletion(env, userId) {
  // Cancel first, delete identity second. A pending Checkout session cannot be
  // allowed to complete after its owner has deleted the ANEVUM account.
  const ready = await billingSchemaReady(env.MEMBER_DB);
  if (!ready) {
    if (env?.ANEVUM_RHEN_BILLING_ENABLED === "true" || env?.STRIPE_SECRET_KEY) {
      throw new BillingError(503, "Billing state unavailable; cannot safely delete account.");
    }
    return;
  }
  const customer = await env.MEMBER_DB.prepare(
    "SELECT stripe_customer_id FROM member_billing_customers WHERE user_id=?"
  ).bind(userId).first();
  if (!customer) return;
  if (!env?.STRIPE_SECRET_KEY) throw new BillingError(503, "Billing cancellation unavailable.");
  const id = customer.stripe_customer_id;
  if (!/^cus_[A-Za-z0-9]+$/.test(id)) throw new BillingError(503, "Invalid billing mapping.");
  const sessions = await stripeRequest(
    env, "GET", "/checkout/sessions?customer=" + encodeURIComponent(id) + "&status=open&limit=100"
  );
  if (sessions.has_more || !Array.isArray(sessions.data)) {
    throw new BillingError(503, "Pending checkouts could not be enumerated safely.");
  }
  for (const session of sessions.data) {
    if (session.status !== "open") continue;
    if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(String(session.id || ""))) {
      throw new BillingError(503, "Unexpected checkout session.");
    }
    try {
      const expired = await stripeRequest(env, "POST", "/checkout/sessions/" + session.id + "/expire");
      if (expired.status !== "expired") {
        throw new BillingError(503, "Could not expire pending checkout.");
      }
    } catch {
      // Checkout may have completed during cancellation. The following
      // subscription enumeration must include and cancel its subscription.
      const current = await stripeRequest(env, "GET", "/checkout/sessions/" + session.id);
      if (current.status !== "complete" && current.status !== "expired") {
        throw new BillingError(503, "Pending checkout could not be closed.");
      }
    }
  }
  const list = await stripeRequest(
    env, "GET", "/subscriptions?customer=" + encodeURIComponent(id) + "&status=all&limit=100"
  );
  if (list.has_more || !Array.isArray(list.data)) {
    throw new BillingError(503, "Subscriptions could not be enumerated safely.");
  }
  for (const subscription of list.data) {
    if (!OPEN_STATUSES.has(subscription.status)) continue;
    if (!/^sub_[A-Za-z0-9]+$/.test(String(subscription.id || ""))) {
      throw new BillingError(503, "Unexpected subscription.");
    }
    const canceled = await stripeRequest(env, "DELETE", "/subscriptions/" + subscription.id);
    if (canceled?.status !== "canceled") {
      throw new BillingError(503, "Billing cancellation not confirmed.");
    }
  }
  // A provider/network error prevents identity deletion and loss of the
  // customer->member reconciliation mapping. No new charges are left running.
}
