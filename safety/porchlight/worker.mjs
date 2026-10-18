/**
 * ANEVUM Porchlight V001 — isolated Halloween neighborhood pilot.
 * SOURCE-ONLY. No production route, member identity, GPS tracking, or seeded homes.
 * Nothing is publicly listed until a separate organizer activates a real event,
 * verifies a host out of band, and approves that host.
 */
const API = "/api/v1/porchlight";
const ADMIN = "/_private/porchlight";
const HOST_OPTIONS = ["candy", "non_food", "decorations", "step_free"];
const REPORT_REASONS = ["incorrect", "privacy", "unwanted", "accessibility", "other"];
const CONSENT_VERSION = "porchlight-v001.1";
const securityHeaders = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY"
};
const nowSecs = () => Math.floor(Date.now() / 1000);
const on = value => value === "true";
const safeText = (value, min, max) =>
  typeof value === "string" && value.trim().length >= min &&
  value.trim().length <= max && !/[\x00-\x08\x0e-\x1f]/.test(value)
    ? value.trim() : null;
const slugOK = value => /^[a-z][a-z0-9-]{2,47}$/.test(value || "");
const coord = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const hashHex = async value => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
};
const constantEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let delta = 0;
  for (let i = 0; i < a.length; i++) delta |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return delta === 0;
};
const fail = (code, status = 400) => response({ ok: false, code }, status);
function response(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: securityHeaders });
}
function assertOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
async function bodyJSON(request) {
  const type = request.headers.get("Content-Type")?.toLowerCase() || "";
  if (!/^application\/json(?:\s*;|$)/.test(type)) return { error: "JSON_REQUIRED" };
  const lengthHeader = request.headers.get("Content-Length");
  if (lengthHeader != null &&
      (!/^\d+$/.test(lengthHeader) || Number(lengthHeader) > 4096))
    return { error: "PAYLOAD_TOO_LARGE" };
  if (!request.body) return { error: "INVALID_JSON" };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 4096) {
        await reader.cancel().catch(() => {});
        return { error: "PAYLOAD_TOO_LARGE" };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "INVALID_BODY" };
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let raw;
  try { raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return { error: "INVALID_JSON" }; }
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      return { error: "INVALID_BODY" };
    return { value };
  } catch {
    return { error: "INVALID_JSON" };
  }
}
async function isOrganizer(request, env) {
  if (!on(env.PORCHLIGHT_ADMIN_ENABLED) ||
      !/^[0-9a-f]{64}$/i.test(env.PORCHLIGHT_ADMIN_SHA256 || "")) return false;
  const token = /^Bearer ([A-Za-z0-9_-]{32,128})$/.exec(request.headers.get("Authorization") || "")?.[1];
  return Boolean(token) && constantEqual(await hashHex(token), env.PORCHLIGHT_ADMIN_SHA256.toLowerCase());
}
async function applyRateLimit(request, env, scope, max, now) {
  const key = env.PORCHLIGHT_RATE_KEY;
  if (!key || key.length < 24) return false; // Fail closed without a stable secret.
  const ip = request.headers.get("CF-Connecting-IP") || "unidentified";
  const period = Math.floor(now / 3600);
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(scope + "|" + period + "|" + ip));
  const bucket = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  const count = await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO rate_buckets (bucket_key, used, expires_at) VALUES (?, 1, ?) " +
    "ON CONFLICT(bucket_key) DO UPDATE SET used=used+1 RETURNING used"
  ).bind(bucket, (period + 1) * 3600).first();
  return count && count.used <= max;
}
async function eventBySlug(db, slug) {
  return db.prepare("SELECT * FROM events WHERE slug=?").bind(slug).first();
}
function eventOpen(event, now) {
  return Boolean(event && event.status === "active" && Number(event.ends_at) > now);
}
function presentEvent(event) {
  return {
    slug: event.slug, title: event.title, neighborhood: event.neighborhood,
    startsAt: event.starts_at, endsAt: event.ends_at, center: {
      lat: event.center_lat, lng: event.center_lng
    },
    note: "Independent community directory. Listings are opt-in and not verified safe locations."
  };
}
function distanceMeters(aLat, aLng, bLat, bLng) {
  const rad = Math.PI / 180, dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
function safeOptions(raw) {
  return Array.isArray(raw) && raw.length <= HOST_OPTIONS.length &&
    raw.every(x => HOST_OPTIONS.includes(x)) ? [...new Set(raw)] : null;
}
async function createSubmission(request, env, slug, now) {
  if (!on(env.PORCHLIGHT_PUBLIC_ENABLED) || !on(env.PORCHLIGHT_HOST_SUBMISSIONS_ENABLED))
    return fail("HOST_APPLICATIONS_CLOSED", 503);
  const event = await eventBySlug(env.PORCHLIGHT_DB, slug);
  if (!eventOpen(event, now)) return fail("EVENT_NOT_OPEN", 404);
  const parsed = await bodyJSON(request);
  if (parsed.error) return fail(parsed.error);
  const b = parsed.value, consent = b.consent || {};
  const name = safeText(b.hostName, 2, 64);
  const address = safeText(b.privateAddress, 8, 160);
  const contact = typeof b.contactEmail === "string" ? b.contactEmail.trim().toLowerCase() : "";
  const emailOK = contact.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const options = safeOptions(b.options);
  const note = b.note === "" || b.note == null ? "" : safeText(b.note, 3, 240);
  const visibility = b.visibility;
  if (!name || !address || !emailOK || !options || note === null ||
      !["exact", "area"].includes(visibility) ||
      consent.isAdult !== true || consent.controlsHome !== true ||
      consent.publishApprovedInfo !== true ||
      (visibility === "exact" && consent.exactLocation !== true))
    return fail("HOST_CONSENT_OR_INPUT_INVALID", 422);
  const allowed = await applyRateLimit(request, env, "host", 4, now);
  if (!allowed) return fail("RATE_LIMITED_OR_UNCONFIGURED", 429);
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
  const receipt = Array.from(bytes, v => v.toString(16).padStart(2, "0")).join("");
  const id = crypto.randomUUID();
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO host_submissions " +
    "(id, event_id, host_name, private_address, contact_email, visibility, consent_exact, options_json, note, status, receipt_hash, submitted_at, consent_at, consent_version) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)"
  ).bind(id, event.id, name, address, contact, visibility, visibility === "exact" ? 1 : 0,
    JSON.stringify(options), note, await hashHex(receipt), now, now, CONSENT_VERSION).run();
  return response({
    ok: true, id, receipt, status: "pending",
    notice: "Pending independent organizer review. Not publicly listed. Copy the removal code now; it cannot be recovered."
  }, 201);
}
async function revokeSubmission(request, env, id, now) {
  const parsed = await bodyJSON(request);
  if (parsed.error) return fail(parsed.error);
  const receipt = parsed.value?.receipt;
  if (typeof receipt !== "string" || !/^[a-f0-9]{64}$/.test(receipt)) return fail("INVALID_REMOVAL_CODE", 422);
  const host = await env.PORCHLIGHT_DB.prepare(
    "SELECT receipt_hash, status, event_id FROM host_submissions WHERE id=?"
  ).bind(id).first();
  if (!host || !host.receipt_hash || !constantEqual(await hashHex(receipt), host.receipt_hash))
    return fail("REMOVAL_CODE_NOT_RECOGNIZED", 404);
  const removed = await env.PORCHLIGHT_DB.prepare(
    "UPDATE host_submissions SET status='withdrawn', withdrawn_at=?, " +
    "public_name=NULL, public_label=NULL, approved_lat=NULL, approved_lng=NULL, " +
    "contact_email=NULL, private_address=NULL, note=NULL, host_name='Withdrawn host', options_json='[]', receipt_hash=NULL " +
    "WHERE id=? AND status IN ('pending','published','rejected')"
  ).bind(now, id).run();
  if ((removed?.meta?.changes ?? removed?.changes ?? 0) !== 1)
    return fail("REMOVAL_ALREADY_APPLIED", 409);
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO audit_events (id, event_id, action, record_id, created_at) VALUES (?, ?, 'host_self_withdrawn', ?, ?)"
  ).bind(crypto.randomUUID(), host.event_id, id, now).run();
  return response({ ok: true, status: "withdrawn", notice: "Listing removed. Private contact and address cleared." });
}
async function submitReport(request, env, slug, now) {
  if (!on(env.PORCHLIGHT_PUBLIC_ENABLED)) return fail("EVENT_NOT_OPEN", 404);
  const event = await eventBySlug(env.PORCHLIGHT_DB, slug);
  if (!eventOpen(event, now)) return fail("EVENT_NOT_OPEN", 404);
  const parsed = await bodyJSON(request);
  if (parsed.error) return fail(parsed.error);
  const b = parsed.value, category = b.reason;
  const text = b.details === "" || b.details == null ? "" : safeText(b.details, 3, 300);
  if (!REPORT_REASONS.includes(category) || !text ||
      typeof b.hostId !== "string" || !/^[0-9a-f-]{36}$/i.test(b.hostId))
    return fail("INVALID_REPORT", 422);
  const host = await env.PORCHLIGHT_DB.prepare(
    "SELECT id FROM host_submissions WHERE id=? AND event_id=? AND status='published' AND reviewed_at IS NOT NULL"
  ).bind(b.hostId, event.id).first();
  if (!host) return fail("LISTING_NOT_FOUND", 404);
  const allowed = await applyRateLimit(request, env, "report", 8, now);
  if (!allowed) return fail("RATE_LIMITED_OR_UNCONFIGURED", 429);
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO reports (id, event_id, host_id, reason, details, created_at, status) " +
    "VALUES (?, ?, ?, ?, ?, ?, 'open')"
  ).bind(crypto.randomUUID(), event.id, host.id, category, text, now).run();
  return response({ ok: true, notice: "A private report was recorded for organizer review. For emergencies, call 911." }, 201);
}
async function publicHosts(db, event, now) {
  const data = await db.prepare(
    "SELECT id, public_name, public_label, visibility, approved_lat, approved_lng, options_json " +
    "FROM host_submissions WHERE event_id=? AND status='published' AND reviewed_at IS NOT NULL " +
    "AND consent_at IS NOT NULL AND withdrawn_at IS NULL ORDER BY public_name LIMIT 250"
  ).bind(event.id).all();
  if (Number(event.ends_at) <= now) return [];
  return (data.results || []).map(item => ({
    id: item.id, name: item.public_name, location: item.public_label,
    visibility: item.visibility,
    lat: item.visibility === "exact" ? item.approved_lat : null,
    lng: item.visibility === "exact" ? item.approved_lng : null,
    options: JSON.parse(item.options_json || "[]")
  }));
}
async function createEvent(request, env, now) {
  const p = await bodyJSON(request);
  if (p.error) return fail(p.error);
  const b = p.value || {};
  const title = safeText(b.title, 5, 120), neighborhood = safeText(b.neighborhood, 3, 90);
  const start = b.startsAt, end = b.endsAt;
  if (!slugOK(b.slug) || !title || !neighborhood ||
      !Number.isInteger(start) || !Number.isInteger(end) ||
      start < now - 86400 || end <= start || end > now + 90 * 86400 ||
      end - start > 72 * 3600 ||
      !coord(b.centerLat, -90, 90) || !coord(b.centerLng, -180, 180) ||
      !Number.isInteger(b.radiusMeters) || b.radiusMeters < 100 || b.radiusMeters > 5000)
    return fail("INVALID_EVENT", 422);
  const id = crypto.randomUUID();
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO events (id, slug, title, neighborhood, starts_at, ends_at, status, center_lat, center_lng, radius_m, created_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)"
  ).bind(id, b.slug, title, neighborhood, start, end, b.centerLat, b.centerLng,
    b.radiusMeters, now).run();
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO audit_events (id, event_id, action, record_id, created_at) VALUES (?, ?, 'event_drafted', ?, ?)"
  ).bind(crypto.randomUUID(), id, id, now).run();
  return response({ ok: true, slug: b.slug, status: "draft" }, 201);
}
async function decideHost(request, env, id, now) {
  const p = await bodyJSON(request);
  if (p.error) return fail(p.error);
  const b = p.value || {};
  if (!["approve", "reject", "withdraw"].includes(b.action)) return fail("INVALID_DECISION", 422);
  const host = await env.PORCHLIGHT_DB.prepare(
    "SELECT h.*, e.status AS event_status, e.ends_at, e.center_lat, e.center_lng, e.radius_m, e.neighborhood AS event_neighborhood " +
    "FROM host_submissions h JOIN events e ON e.id=h.event_id WHERE h.id=?"
  ).bind(id).first();
  if (!host) return fail("HOST_NOT_FOUND", 404);
  if (b.action === "withdraw") {
    await env.PORCHLIGHT_DB.prepare(
      "UPDATE host_submissions SET status='withdrawn', withdrawn_at=?, public_name=NULL, public_label=NULL, " +
      "approved_lat=NULL, approved_lng=NULL, private_address=NULL, contact_email=NULL, note=NULL, host_name='Withdrawn host', options_json='[]', receipt_hash=NULL WHERE id=?"
    ).bind(now, id).run();
  } else {
    if (host.status !== "pending") return fail("HOST_NOT_PENDING", 409);
    if (b.action === "approve") {
      const label = host.visibility === "area" ? host.event_neighborhood : safeText(b.publicLabel, 3, 120);
      const verified = b.verifiedOutOfBand === true &&
        ["in_person", "direct_contact"].includes(b.verificationMethod);
      const positionOK = host.visibility === "area"
        ? b.lat == null && b.lng == null
        : host.consent_exact === 1 && coord(b.lat, -90, 90) && coord(b.lng, -180, 180) &&
          distanceMeters(host.center_lat, host.center_lng, b.lat, b.lng) <= host.radius_m;
      if (!label || !verified || !positionOK || host.event_status !== "active" || host.ends_at <= now)
        return fail("APPROVAL_GATES_NOT_MET", 422);
      await env.PORCHLIGHT_DB.prepare(
        "UPDATE host_submissions SET status='published', public_name=?, public_label=?, " +
        "approved_lat=?, approved_lng=?, reviewed_at=?, verification_method=? WHERE id=? AND status='pending'"
      ).bind(host.host_name, label, host.visibility === "exact" ? b.lat : null,
        host.visibility === "exact" ? b.lng : null, now, b.verificationMethod, id).run();
    } else {
      await env.PORCHLIGHT_DB.prepare(
        "UPDATE host_submissions SET status='rejected', reviewed_at=?, verification_method='not_verified' " +
        "WHERE id=? AND status='pending'"
      ).bind(now, id).run();
    }
  }
  await env.PORCHLIGHT_DB.prepare(
    "INSERT INTO audit_events (id, event_id, action, record_id, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), host.event_id, "host_" + b.action, id, now).run();
  return response({ ok: true, status: b.action === "approve" ? "published" : b.action === "reject" ? "rejected" : "withdrawn" });
}
async function adminRoutes(request, env, path, now) {
  if (!await isOrganizer(request, env)) return fail("ORGANIZER_AUTH_REQUIRED", 401);
  if (request.method === "POST" && path === ADMIN + "/events") return createEvent(request, env, now);
  const toggle = new RegExp("^" + ADMIN + "/events/([a-z][a-z0-9-]{2,47})/(activate|close)$").exec(path);
  if (toggle && request.method === "POST") {
    const event = await eventBySlug(env.PORCHLIGHT_DB, toggle[1]);
    if (!event) return fail("EVENT_NOT_FOUND", 404);
    if (toggle[2] === "activate" && event.ends_at <= now) return fail("EVENT_EXPIRED", 409);
    if (toggle[2] === "activate" && event.status !== "draft") return fail("EVENT_ACTIVATION_NOT_PERMITTED", 409);
    const nextStatus = toggle[2] === "activate" ? "active" : "closed";
    await env.PORCHLIGHT_DB.prepare("UPDATE events SET status=? WHERE id=?")
      .bind(nextStatus, event.id).run();
    await env.PORCHLIGHT_DB.prepare(
      "INSERT INTO audit_events (id, event_id, action, record_id, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), event.id, "event_" + nextStatus, event.id, now).run();
    return response({ ok: true, status: nextStatus });
  }
  const pending = new RegExp("^" + ADMIN + "/events/([a-z][a-z0-9-]{2,47})/queue$").exec(path);
  if (pending && request.method === "GET") {
    const event = await eventBySlug(env.PORCHLIGHT_DB, pending[1]);
    if (!event) return fail("EVENT_NOT_FOUND", 404);
    const [submissions, reports] = await Promise.all([
      env.PORCHLIGHT_DB.prepare("SELECT id, host_name, private_address, contact_email, visibility, options_json, note, submitted_at FROM host_submissions WHERE event_id=? AND status='pending' ORDER BY submitted_at LIMIT 100").bind(event.id).all(),
      env.PORCHLIGHT_DB.prepare("SELECT id, host_id, reason, details, created_at FROM reports WHERE event_id=? AND status='open' ORDER BY created_at LIMIT 100").bind(event.id).all()
    ]);
    return response({ ok: true, submissions: submissions.results || [], reports: reports.results || [] });
  }
  const decision = new RegExp("^" + ADMIN + "/hosts/([a-f0-9-]{36})/decision$").exec(path);
  if (decision && request.method === "POST") return decideHost(request, env, decision[1], now);
  const resolution = new RegExp("^" + ADMIN + "/reports/([a-f0-9-]{36})/resolve$").exec(path);
  if (resolution && request.method === "POST") {
    const existing = await env.PORCHLIGHT_DB.prepare(
      "SELECT id, status, event_id FROM reports WHERE id=?"
    ).bind(resolution[1]).first();
    if (!existing) return fail("REPORT_NOT_FOUND", 404);
    if (existing.status !== "open") return fail("REPORT_ALREADY_RESOLVED", 409);
    await env.PORCHLIGHT_DB.prepare(
      "UPDATE reports SET status='resolved', resolved_at=? WHERE id=? AND status='open'"
    ).bind(now, existing.id).run();
    await env.PORCHLIGHT_DB.prepare(
      "INSERT INTO audit_events (id, event_id, action, record_id, created_at) VALUES (?, ?, 'report_resolved', ?, ?)"
    ).bind(crypto.randomUUID(), existing.event_id, existing.id, now).run();
    return response({ ok: true, status: "resolved" });
  }
  return fail("NOT_FOUND", 404);
}
async function purgeExpired(db, now) {
  // 7-day private data retention following event close. Daily Cron must be configured separately.
  const old = await db.prepare("SELECT id FROM events WHERE ends_at < ? LIMIT 100").bind(now - 7 * 86400).all();
  for (const row of old.results || []) {
    await db.prepare("DELETE FROM events WHERE id=?").bind(row.id).run(); // FK cascade removes private submissions/reports.
  }
  await db.prepare("DELETE FROM rate_buckets WHERE expires_at < ?").bind(now - 86400).run();
}
async function handleAPI(request, env, now) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (path === API + "/health" && request.method === "GET")
    return response({ ok: true, publicEnabled: on(env.PORCHLIGHT_PUBLIC_ENABLED), submissionsEnabled: on(env.PORCHLIGHT_HOST_SUBMISSIONS_ENABLED), mapConfigured: Boolean(env.PORCHLIGHT_MAP_STYLE_URL) });
  if (!env.PORCHLIGHT_DB) return fail("PILOT_DATABASE_NOT_CONFIGURED", 503);
  if (request.method !== "GET" && !assertOrigin(request)) return fail("CROSS_ORIGIN_WRITE_FORBIDDEN", 403);
  if (path.startsWith(ADMIN + "/")) return adminRoutes(request, env, path, now);
  if (path === API + "/events" && request.method === "GET") {
    if (!on(env.PORCHLIGHT_PUBLIC_ENABLED)) return response({ ok: true, events: [] });
    const data = await env.PORCHLIGHT_DB.prepare(
      "SELECT * FROM events WHERE status='active' AND ends_at>? ORDER BY starts_at LIMIT 20"
    ).bind(now).all();
    return response({ ok: true, events: (data.results || []).map(presentEvent),
      mapStyleUrl: typeof env.PORCHLIGHT_MAP_STYLE_URL === "string" && env.PORCHLIGHT_MAP_STYLE_URL.startsWith("https://") ? env.PORCHLIGHT_MAP_STYLE_URL : null });
  }
  const hostList = new RegExp("^" + API + "/events/([a-z][a-z0-9-]{2,47})/hosts$").exec(path);
  if (hostList) {
    const event = await eventBySlug(env.PORCHLIGHT_DB, hostList[1]);
    if (!on(env.PORCHLIGHT_PUBLIC_ENABLED) || !eventOpen(event, now)) return fail("EVENT_NOT_OPEN", 404);
    if (request.method === "GET") return response({ ok: true, hosts: await publicHosts(env.PORCHLIGHT_DB, event, now) });
    if (request.method === "POST") return createSubmission(request, env, hostList[1], now);
  }
  const revoke = new RegExp("^" + API + "/submissions/([a-f0-9-]{36})/revoke$").exec(path);
  if (revoke && request.method === "POST") return revokeSubmission(request, env, revoke[1], now);
  const report = new RegExp("^" + API + "/events/([a-z][a-z0-9-]{2,47})/reports$").exec(path);
  if (report && request.method === "POST") return submitReport(request, env, report[1], now);
  return fail("NOT_FOUND", 404);
}
const pageHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
};
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api/v1/porchlight" || path.startsWith(API + "/") || path.startsWith(ADMIN + "/")) {
      try { return await handleAPI(request, env, nowSecs()); }
      catch { return fail("SERVICE_UNAVAILABLE", 503); } // Never expose private D1/host details.
    }
    if (request.method !== "GET" && request.method !== "HEAD") return fail("METHOD_NOT_ALLOWED", 405);
    if (!env.ASSETS) return fail("ASSET_BINDING_NOT_CONFIGURED", 503);
    const r = await env.ASSETS.fetch(request);
    const h = new Headers(r.headers);
    for (const [key, value] of Object.entries(pageHeaders)) h.set(key, value);
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
  },
  async scheduled(controller, env) {
    if (env.PORCHLIGHT_DB) await purgeExpired(env.PORCHLIGHT_DB, nowSecs());
  }
};
export { handleAPI, purgeExpired, publicHosts, presentEvent };
