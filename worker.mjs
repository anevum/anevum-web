import { canonProjectionRecords } from "./src/canonProjection.ts";

const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";

const ROOT_META_SHELLS = new Map([
  ["/stories", "/__meta/stories.html"],
  ["/stories/reply", "/__meta/stories-reply.html"],
  ["/explore", "/__meta/explore.html"],
  ["/archive", "/__meta/archive.html"],
  ["/transmissions", "/__meta/transmissions.html"],
  ["/search", "/__meta/search.html"],
  ["/the-book", "/__meta/the-book.html"],
  ["/the-story", "/__meta/the-story.html"],
  ["/store", "/__meta/store.html"],
  ["/rhenlink", "/__meta/rhenlink.html"],
  ["/about", "/__meta/about.html"],
  ["/privacy", "/__meta/privacy.html"],
  ["/terms", "/__meta/terms.html"],
  ["/contact", "/__meta/contact.html"],
]);

const ROOT_PUBLIC_PATHS = new Set(["/", ...ROOT_META_SHELLS.keys()]);
const WIKI_PRIVATE_PATHS = new Set(["/new", "/saved", "/admin"]);
const wikiBySlug = new Map(canonProjectionRecords.map((record) => [record.slug, record]));

const replyBookSchema = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "REPLY",
  url: "https://anevum.com/the-book",
  description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
  author: { "@type": "Person", name: "Devon Akins" },
  isPartOf: { "@type": "BookSeries", name: "The Transcosmic" },
};

const ROOT_ROUTE_META = new Map([
  ["/stories", { title: "Stories — ANEVUM", description: "Enter ANEVUM through its stories. REPLY is Publication 001 and the first Transcosmic novel by Devon Akins.", canonical: "https://anevum.com/stories", ogTitle: "Stories — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/stories/reply", { title: "REPLY — The Book | ANEVUM", description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.", canonical: "https://anevum.com/the-book", ogTitle: "REPLY — The Book", ogType: "book", robots: "index,follow,max-image-preview:large", structuredData: replyBookSchema }],
  ["/explore", { title: "Explore the Universe — ANEVUM", description: "Move through release-cleared ANEVUM people, places, institutions, technologies, events, and concepts by relationship.", canonical: "https://anevum.com/explore", ogTitle: "Explore — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/archive", { title: "Archive — ANEVUM", description: "Search and filter the publication-safe ANEVUM record.", canonical: "https://anevum.com/archive", ogTitle: "Archive — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/transmissions", { title: "Transmissions — ANEVUM", description: "Official ANEVUM publication updates, essays, production notes, and announcements.", canonical: "https://anevum.com/transmissions", ogTitle: "Transmissions — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/search", { title: "Search — ANEVUM", description: "Search the publication-safe ANEVUM Archive and public Wiki.", canonical: "https://anevum.com/search", ogTitle: "Search — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/the-book", { title: "REPLY — The Book | ANEVUM", description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.", canonical: "https://anevum.com/the-book", ogTitle: "REPLY — The Book", ogType: "book", robots: "index,follow,max-image-preview:large", structuredData: replyBookSchema }],
  ["/the-story", { title: "The Story of REPLY | ANEVUM", description: "Enter the spoiler-light public story doorway into REPLY, The Transcosmic Book One by Devon Akins.", canonical: "https://anevum.com/the-story", ogTitle: "The Story of REPLY", ogType: "article", robots: "index,follow,max-image-preview:large" }],
  ["/store", { title: "ANEVUM Store — REPLY", description: "Official availability and editions for REPLY, The Transcosmic Book One by Devon Akins.", canonical: "https://anevum.com/store", ogTitle: "ANEVUM Store — REPLY", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/rhenlink", { title: "RHENLINK — ANEVUM Identity", description: "RHENLINK is the persistent member identity for ANEVUM.", canonical: "https://anevum.com/rhenlink", ogTitle: "RHENLINK — ANEVUM", ogType: "website", robots: "noindex,follow,noarchive" }],
  ["/about", { title: "About ANEVUM — Stories First", description: "How ANEVUM connects REPLY, the canonical Wiki, Lattice and RHENLINK while keeping finished stories at the center.", canonical: "https://anevum.com/about", ogTitle: "About ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/privacy", { title: "Privacy — ANEVUM", description: "How the current ANEVUM website and RHENLINK member system use account, progress, release-preference, and optional analytics data.", canonical: "https://anevum.com/privacy", ogTitle: "Privacy — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/terms", { title: "Terms — ANEVUM", description: "Launch-era terms for the ANEVUM website, RHENLINK, Wiki, Lattice, progression systems, and external REPLY purchase links.", canonical: "https://anevum.com/terms", ogTitle: "Terms — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
  ["/contact", { title: "Contact — ANEVUM", description: "Current public contact and support status for ANEVUM, REPLY, and RHENLINK.", canonical: "https://anevum.com/contact", ogTitle: "Contact — ANEVUM", ogType: "website", robots: "index,follow,max-image-preview:large" }],
]);

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function isHtml(response) {
  return response.headers.get("content-type")?.includes("text/html") === true;
}

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url.toString(), request);
}

function withHeaders(response, additions = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(additions)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function content(value) {
  return { element(element) { element.setInnerContent(value); } };
}

function attribute(name, value) {
  return { element(element) { element.setAttribute(name, value); } };
}

function structuredData(value) {
  return {
    element(element) {
      if (!value) {
        element.remove();
        return;
      }
      const json = JSON.stringify(value).replaceAll("<", "\\u003c");
      element.setInnerContent(json, { html: true });
    },
  };
}

function rewriteHtml(response, meta) {
  if (!isHtml(response)) return response;

  const rewriter = new HTMLRewriter()
    .on("title", content(meta.title))
    .on('meta[name="description"]', attribute("content", meta.description))
    .on('meta[name="robots"]', attribute("content", meta.robots))
    .on('link[rel="canonical"]', attribute("href", meta.canonical))
    .on('meta[property="og:title"]', attribute("content", meta.ogTitle))
    .on('meta[property="og:description"]', attribute("content", meta.description))
    .on('meta[property="og:url"]', attribute("content", meta.canonical))
    .on('meta[property="og:type"]', attribute("content", meta.ogType))
    .on('meta[name="twitter:title"]', attribute("content", meta.ogTitle))
    .on('meta[name="twitter:description"]', attribute("content", meta.description))
    .on("script#anevum-structured-data", structuredData(meta.structuredData || null));

  return rewriter.transform(response);
}

function wikiMeta(pathname) {
  if (pathname === "/") {
    return {
      title: "ANEVUM Wiki",
      description: "The publication-safe surface of the live ANEVUM Wiki and its canonical lifecycle state.",
      canonical: "https://anevum.com/wiki",
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "index,follow,max-image-preview:large",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ANEVUM Wiki",
        url: "https://anevum.com/wiki",
      },
    };
  }

  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const privatePath = WIKI_PRIVATE_PATHS.has(pathname) || normalized.endsWith("/edit");
  if (privatePath) {
    return {
      title: "ANEVUM Wiki — Private Workspace",
      description: "Authenticated ANEVUM Wiki contribution and moderation workspace.",
      canonical: `https://anevum.com/wiki${pathname === "/" ? "" : pathname}`,
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "noindex,follow,noarchive",
      structuredData: null,
    };
  }

  const slug = safeDecode(normalized);
  const record = slug ? wikiBySlug.get(slug) : null;
  if (!record) {
    return {
      title: "Record Not Released — ANEVUM Wiki",
      description: "This ANEVUM Wiki record is not part of the current publication-safe release projection.",
      canonical: `https://anevum.com/wiki${pathname === "/" ? "" : pathname}`,
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "noindex,follow,noarchive",
      structuredData: null,
    };
  }

  const canonical = `https://anevum.com/wiki/${record.slug}`;
  return {
    title: `${record.title} — ANEVUM Wiki`,
    description: record.summary,
    canonical,
    ogTitle: `${record.title} — ANEVUM Wiki`,
    ogType: "article",
    robots: "index,follow,max-image-preview:large",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: record.title,
      description: record.summary,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "ANEVUM Wiki", url: "https://anevum.com/wiki" },
    },
  };
}

const LATTICE_META = {
  title: "Lattice — ANEVUM",
  description: "ANEVUM's member and relational discovery layer, connecting release-cleared records with RHENLINK identity.",
  canonical: "https://anevum.com/lattice",
  ogTitle: "Lattice — ANEVUM",
  ogType: "website",
  robots: "index,follow,max-image-preview:large",
  structuredData: null,
};

const COMMAND_META = {
  title: "ANEVUM COMMAND",
  description: "Private ANEVUM company cockpit for publishing, product, canon, identity, finance and infrastructure.",
  canonical: "https://anevum.com/command",
  ogTitle: "ANEVUM COMMAND",
  ogType: "website",
  robots: "noindex,nofollow,noarchive",
  structuredData: null,
};


const DEFAULT_SUPABASE_URL = "https://mfntzxheldzdvlokyntk.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const RELEASE_TOPIC = "reply_release";
const RELEASE_CONFIRMATION = "SEND REPLY RELEASE UPDATE";
const RESEND_BATCH_LIMIT = 100;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return "";
  return authorization.slice(7).trim();
}

function supabaseUrl(env) {
  return String(env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
}

function supabasePublishableKey(env) {
  return String(env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY);
}

async function memberUser(request, env) {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Resolve RHENLINK before using this endpoint.");

  const response = await fetch(`${supabaseUrl(env)}/auth/v1/user`, {
    headers: {
      apikey: supabasePublishableKey(env),
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(401, String(payload.message || payload.msg || "RHENLINK session is not valid."));
  return { token, user: payload };
}

function commandAdmin(user) {
  const metadata = user?.app_metadata || {};
  const role = String(metadata.role || "").trim().toLowerCase();
  const email = String(user?.email || "").trim().toLowerCase();
  return (email === "devon@anevum.com" && Boolean(user?.email_confirmed_at))
    || metadata.command_admin === true
    || metadata.wiki_admin === true
    || role === "owner"
    || role === "founder"
    || role === "admin"
    || role === "command_admin"
    || role === "wiki_admin";
}

async function requireCommandAdmin(request, env) {
  const resolved = await memberUser(request, env);
  if (!commandAdmin(resolved.user)) throw new ApiError(403, "COMMAND administrator authorization required.");
  return resolved;
}

function serviceKey(env) {
  return String(env.SUPABASE_SERVICE_ROLE_KEY || "");
}

async function serviceRequest(env, path, init = {}) {
  const key = serviceKey(env);
  if (!key) throw new ApiError(503, "Notification service persistence is not configured.");

  const response = await fetch(`${supabaseUrl(env)}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : null;
  if (!response.ok) {
    const message = payload?.message || payload?.msg || payload?.hint || payload?.details || `Notification persistence request failed (${response.status})`;
    throw new ApiError(response.status, String(message));
  }
  return { payload, headers: response.headers };
}

async function safeServiceRequest(env, path, init = {}) {
  try {
    return await serviceRequest(env, path, init);
  } catch {
    return null;
  }
}

async function updateOwnReleaseMetadata(env, token, user, enabled, source) {
  const metadata = {
    ...(user.user_metadata || {}),
    reply_release_updates: enabled,
    reply_release_updates_at: enabled ? new Date().toISOString() : null,
    reply_release_updates_source: enabled ? source : null,
  };
  const response = await fetch(`${supabaseUrl(env)}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: supabasePublishableKey(env),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ data: metadata }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, String(payload.message || payload.msg || "RHENLINK preference could not be updated."));
  return payload;
}

async function adminUserById(env, userId) {
  const result = await serviceRequest(env, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "GET" });
  return result.payload;
}

async function updateAdminReleaseMetadata(env, userId, enabled, source = "email-unsubscribe") {
  const user = await adminUserById(env, userId);
  const metadata = {
    ...(user.user_metadata || {}),
    reply_release_updates: enabled,
    reply_release_updates_at: enabled ? new Date().toISOString() : null,
    reply_release_updates_source: enabled ? source : null,
  };
  const result = await serviceRequest(env, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({ user_metadata: metadata }),
  });
  return result.payload;
}

function textEncoder() {
  return new TextEncoder();
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function unsubscribeKey(env) {
  const secret = String(env.NOTIFICATION_UNSUBSCRIBE_SECRET || "");
  if (!secret) throw new ApiError(503, "Notification unsubscribe signing is not configured.");
  return crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function makeUnsubscribeToken(userId, env) {
  const payload = textEncoder().encode(userId);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await unsubscribeKey(env), payload));
  return `${bytesToBase64Url(payload)}.${bytesToBase64Url(signature)}`;
}

async function verifyUnsubscribeToken(token, env) {
  const [payloadPart, signaturePart, extra] = String(token || "").split(".");
  if (!payloadPart || !signaturePart || extra) return null;
  try {
    const payload = base64UrlToBytes(payloadPart);
    const signature = base64UrlToBytes(signaturePart);
    const valid = await crypto.subtle.verify("HMAC", await unsubscribeKey(env), signature, payload);
    if (!valid) return null;
    const userId = new TextDecoder().decode(payload);
    return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(userId) ? userId : null;
  } catch {
    return null;
  }
}

function providerConfigured(env) {
  return Boolean(
    serviceKey(env)
    && env.RESEND_API_KEY
    && env.RESEND_FROM
    && env.NOTIFICATION_UNSUBSCRIBE_SECRET
    && env.NOTIFICATION_MAILING_ADDRESS
  );
}

async function listAuthUsers(env) {
  const key = serviceKey(env);
  if (!key) throw new ApiError(503, "Supabase administrative access is not configured.");
  const collected = [];
  const perPage = 1000;
  for (let page = 1; page <= 50; page += 1) {
    const response = await fetch(`${supabaseUrl(env)}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(response.status, String(payload.message || payload.msg || "RHENLINK member directory could not be read."));
    const users = Array.isArray(payload.users) ? payload.users : [];
    collected.push(...users);
    if (users.length < perPage) break;
  }
  return collected;
}

async function optedInReleaseUsers(env) {
  const users = await listAuthUsers(env);
  const seen = new Set();
  return users.filter((user) => {
    const email = String(user.email || "").trim().toLowerCase();
    const enabled = user.user_metadata?.reply_release_updates === true;
    if (!enabled || !email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

async function telemetryCampaigns(env) {
  const response = await safeServiceRequest(
    env,
    "/rest/v1/release_notification_campaigns?select=id,subject,title,status,subscriber_count,sent_count,failed_count,created_at,sent_at&order=created_at.desc&limit=8",
    { method: "GET" },
  );
  return response && Array.isArray(response.payload) ? response.payload : [];
}

async function telemetryAvailable(env) {
  const response = await safeServiceRequest(env, "/rest/v1/member_notifications?select=id&limit=1", { method: "GET" });
  return Boolean(response);
}

async function createCampaignTelemetry(env, adminUser, input, subscriberCount) {
  const response = await safeServiceRequest(env, "/rest/v1/release_notification_campaigns", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      topic: RELEASE_TOPIC,
      subject: input.subject,
      title: input.title,
      body: input.body,
      action_label: input.actionLabel || null,
      action_url: input.actionUrl || null,
      status: "sending",
      created_by: adminUser.id,
      subscriber_count: subscriberCount,
      provider: "resend",
    }),
  });
  const row = response?.payload?.[0];
  return row?.id ? { id: row.id, stored: true } : { id: crypto.randomUUID(), stored: false };
}

async function seedDeliveryTelemetry(env, campaign, users, input) {
  if (!campaign.stored || !users.length) return false;
  const deliveries = users.map((user) => ({
    campaign_id: campaign.id,
    user_id: user.id,
    email: user.email,
    status: "pending",
    provider: "resend",
  }));
  const notices = users.map((user) => ({
    user_id: user.id,
    campaign_id: campaign.id,
    topic: RELEASE_TOPIC,
    title: input.title,
    body: input.body,
    action_label: input.actionLabel || null,
    action_url: input.actionUrl || null,
  }));
  const deliveryResult = await safeServiceRequest(env, "/rest/v1/release_notification_deliveries", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(deliveries),
  });
  const noticeResult = await safeServiceRequest(env, "/rest/v1/member_notifications", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(notices),
  });
  return Boolean(deliveryResult && noticeResult);
}

async function updateDeliveryChunk(env, campaign, users, status, error = null) {
  if (!campaign.stored || !users.length) return;
  const ids = users.map((user) => user.id).join(",");
  await safeServiceRequest(
    env,
    `/rest/v1/release_notification_deliveries?campaign_id=eq.${campaign.id}&user_id=in.(${ids})`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status,
        error,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      }),
    },
  );
}

async function finalizeCampaignTelemetry(env, campaign, status, sentCount, failedCount) {
  if (!campaign.stored) return;
  await safeServiceRequest(env, `/rest/v1/release_notification_campaigns?id=eq.${campaign.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    }),
  });
}

function validateCampaignInput(value) {
  const input = value && typeof value === "object" ? value : {};
  const subject = String(input.subject || "").trim();
  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();
  const actionLabel = String(input.actionLabel || "").trim();
  const actionUrl = String(input.actionUrl || "").trim();

  if (!subject || subject.length > 160) throw new ApiError(400, "Email subject is required and must be 160 characters or fewer.");
  if (!title || title.length > 180) throw new ApiError(400, "Notice title is required and must be 180 characters or fewer.");
  if (!body || body.length > 4000) throw new ApiError(400, "Notice body is required and must be 4,000 characters or fewer.");
  if (actionLabel.length > 40) throw new ApiError(400, "CTA label must be 40 characters or fewer.");
  if (actionUrl) {
    let parsed;
    try { parsed = new URL(actionUrl); } catch { throw new ApiError(400, "Action URL must be a valid HTTPS URL."); }
    if (parsed.protocol !== "https:") throw new ApiError(400, "Action URL must use HTTPS.");
  }
  return { subject, title, body, actionLabel, actionUrl };
}

function releaseEmailHtml(input, unsubscribeUrl, env) {
  const action = input.actionUrl && input.actionLabel
    ? `<p style="margin:28px 0"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;border:1px solid #9fb4bc;padding:12px 18px;color:#e6edef;text-decoration:none;font:600 12px Arial,sans-serif;letter-spacing:1.4px">${escapeHtml(input.actionLabel)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#071014;color:#d8e1e4"><div style="max-width:640px;margin:0 auto;padding:48px 28px;font-family:Arial,sans-serif"><p style="margin:0 0 12px;color:#78919b;font-size:11px;letter-spacing:2px">ANEVUM / REPLY RELEASE UPDATE</p><h1 style="margin:0 0 24px;color:#edf2f3;font:400 36px/1.08 Georgia,serif">${escapeHtml(input.title)}</h1><div style="white-space:pre-wrap;color:#aebec4;font-size:16px;line-height:1.7">${escapeHtml(input.body)}</div>${action}<hr style="margin:36px 0 22px;border:0;border-top:1px solid #24383f"><p style="color:#6f858e;font-size:12px;line-height:1.6">Commercial release notice from ANEVUM. You asked to receive REPLY release updates through your RHENLINK. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9bb8c3">Remove REPLY release updates</a>.<br><br>${escapeHtml(String(env.NOTIFICATION_MAILING_ADDRESS || ""))}</p></div></body></html>`;
}

function releaseEmailText(input, unsubscribeUrl, env) {
  const action = input.actionUrl && input.actionLabel ? `\n\n${input.actionLabel}: ${input.actionUrl}` : "";
  return `${input.title}\n\n${input.body}${action}\n\nCommercial release notice from ANEVUM. You asked to receive REPLY release updates through your RHENLINK.\nRemove updates: ${unsubscribeUrl}\n\n${String(env.NOTIFICATION_MAILING_ADDRESS || "")}`;
}

async function sendResendBatch(env, campaignId, users, input, batchIndex) {
  const messages = await Promise.all(users.map(async (user) => {
    const token = await makeUnsubscribeToken(user.id, env);
    const unsubscribeUrl = `https://anevum.com/release-updates/unsubscribe?token=${encodeURIComponent(token)}`;
    return {
      from: String(env.RESEND_FROM),
      to: [String(user.email)],
      subject: input.subject,
      html: releaseEmailHtml(input, unsubscribeUrl, env),
      text: releaseEmailText(input, unsubscribeUrl, env),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "product", value: "reply" },
        { name: "category", value: "release_update" },
      ],
    };
  }));

  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(env.RESEND_API_KEY)}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `reply-release/${campaignId}/${batchIndex}`,
    },
    body: JSON.stringify(messages),
  });
  const raw = await response.text();
  if (!response.ok) {
    let message = raw;
    try {
      const payload = JSON.parse(raw);
      message = payload.message || payload.name || raw;
    } catch {}
    throw new Error(String(message || `Resend batch failed (${response.status})`));
  }
  return raw ? JSON.parse(raw) : {};
}

async function handleReleasePreference(request, env) {
  const { token, user } = await memberUser(request, env);
  const metadata = user.user_metadata || {};
  if (request.method === "GET") {
    return jsonResponse({
      enabled: metadata.reply_release_updates === true,
      email: String(user.email || ""),
      source: metadata.reply_release_updates_source || null,
      optedInAt: metadata.reply_release_updates_at || null,
      optedOutAt: metadata.reply_release_updates === false ? metadata.reply_release_updates_at || null : null,
      emailDeliveryConfigured: providerConfigured(env),
      inAppDeliveryConfigured: await telemetryAvailable(env),
    });
  }
  if (request.method !== "PUT") throw new ApiError(405, "Method not allowed.");

  const payload = await request.json().catch(() => ({}));
  const enabled = payload.enabled === true;
  const sourceRaw = String(payload.source || "rhenlink").trim().toLowerCase();
  const source = /^[a-z0-9-]{1,48}$/.test(sourceRaw) ? sourceRaw : "rhenlink";
  const updated = await updateOwnReleaseMetadata(env, token, user, enabled, source);
  return jsonResponse({
    enabled,
    email: String(updated.email || user.email || ""),
    source: enabled ? source : null,
    optedInAt: enabled ? updated.user_metadata?.reply_release_updates_at || new Date().toISOString() : null,
    optedOutAt: enabled ? null : new Date().toISOString(),
    emailDeliveryConfigured: providerConfigured(env),
    inAppDeliveryConfigured: await telemetryAvailable(env),
  });
}

async function handleMemberNotifications(request, env, pathname) {
  const { user } = await memberUser(request, env);
  if (request.method === "GET" && pathname === "/api/member/notifications") {
    const result = await safeServiceRequest(
      env,
      `/rest/v1/member_notifications?user_id=eq.${user.id}&select=id,topic,title,body,action_label,action_url,created_at,read_at&order=created_at.desc&limit=20`,
      { method: "GET" },
    );
    return jsonResponse({ notifications: Array.isArray(result?.payload) ? result.payload : [] });
  }

  const match = pathname.match(/^\/api\/member\/notifications\/([0-9a-f-]+)\/read$/i);
  if (request.method === "POST" && match) {
    const result = await serviceRequest(
      env,
      `/rest/v1/member_notifications?id=eq.${encodeURIComponent(match[1])}&user_id=eq.${user.id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ read_at: new Date().toISOString() }),
      },
    );
    const notification = result.payload?.[0];
    if (!notification) throw new ApiError(404, "RHENLINK notice was not found.");
    return jsonResponse({ notification });
  }
  throw new ApiError(405, "Method not allowed.");
}

async function handleCommandReleaseSummary(request, env) {
  await requireCommandAdmin(request, env);
  const configured = providerConfigured(env);
  let subscriberCount = 0;
  if (serviceKey(env)) {
    try { subscriberCount = (await optedInReleaseUsers(env)).length; } catch {}
  }
  return jsonResponse({
    providerConfigured: configured,
    inAppConfigured: await telemetryAvailable(env),
    subscriberCount,
    recentCampaigns: await telemetryCampaigns(env),
  });
}

async function handleCommandReleaseSend(request, env) {
  const { user: adminUser } = await requireCommandAdmin(request, env);
  if (!providerConfigured(env)) {
    throw new ApiError(503, "Email delivery requires SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM, NOTIFICATION_UNSUBSCRIBE_SECRET, and NOTIFICATION_MAILING_ADDRESS.");
  }
  const payload = await request.json().catch(() => ({}));
  if (payload.confirm !== RELEASE_CONFIRMATION) throw new ApiError(400, "Explicit release-send confirmation is required.");
  const input = validateCampaignInput(payload);
  const users = await optedInReleaseUsers(env);
  if (!users.length) throw new ApiError(409, "No RHENLINK identities are currently opted in to REPLY release updates.");

  const campaign = await createCampaignTelemetry(env, adminUser, input, users.length);
  await seedDeliveryTelemetry(env, campaign, users, input);

  let sentCount = 0;
  let failedCount = 0;
  for (let offset = 0, batchIndex = 0; offset < users.length; offset += RESEND_BATCH_LIMIT, batchIndex += 1) {
    const chunk = users.slice(offset, offset + RESEND_BATCH_LIMIT);
    try {
      await sendResendBatch(env, campaign.id, chunk, input, batchIndex);
      sentCount += chunk.length;
      await updateDeliveryChunk(env, campaign, chunk, "sent");
    } catch (error) {
      failedCount += chunk.length;
      await updateDeliveryChunk(env, campaign, chunk, "failed", error instanceof Error ? error.message.slice(0, 900) : "Resend batch failed.");
    }
  }

  const status = failedCount === 0 ? "sent" : sentCount > 0 ? "partial" : "failed";
  await finalizeCampaignTelemetry(env, campaign, status, sentCount, failedCount);
  return jsonResponse({
    id: campaign.id,
    status,
    subscriberCount: users.length,
    sentCount,
    failedCount,
  }, failedCount === users.length ? 502 : 200);
}

async function handleReleaseUnsubscribe(request, env, url) {
  if (request.method !== "GET" && request.method !== "POST") throw new ApiError(405, "Method not allowed.");
  const userId = await verifyUnsubscribeToken(url.searchParams.get("token"), env);
  if (!userId) throw new ApiError(400, "This unsubscribe link is invalid or incomplete.");
  await updateAdminReleaseMetadata(env, userId, false, "email-unsubscribe");

  if (request.method === "POST") return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  return htmlResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPLY release updates removed</title></head><body style="margin:0;background:#071014;color:#d7e1e4;font-family:Arial,sans-serif"><main style="max-width:650px;margin:0 auto;padding:72px 28px"><p style="color:#78919b;font-size:11px;letter-spacing:2px">ANEVUM / RHENLINK</p><h1 style="font:400 40px/1.08 Georgia,serif">REPLY release updates removed.</h1><p style="color:#9db0b7;line-height:1.7">This RHENLINK will no longer receive REPLY release-update email. The RHENLINK account itself remains unchanged.</p><p><a href="https://anevum.com/rhenlink" style="color:#a9c6d0">Return to RHENLINK →</a></p></main></body></html>`);
}

async function apiRoute(request, env, url, pathname) {
  if (pathname === "/api/member/release-updates") return handleReleasePreference(request, env);
  if (pathname === "/api/member/notifications" || /^\/api\/member\/notifications\/[0-9a-f-]+\/read$/i.test(pathname)) {
    return handleMemberNotifications(request, env, pathname);
  }
  if (pathname === "/api/command/release-updates" && request.method === "GET") return handleCommandReleaseSummary(request, env);
  if (pathname === "/api/command/release-updates/send" && request.method === "POST") return handleCommandReleaseSend(request, env);
  if (pathname === "/release-updates/unsubscribe") return handleReleaseUnsubscribe(request, env, url);
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const pathname = normalizePath(url.pathname);

    if (host === ROOT_HOST && (pathname.startsWith("/api/") || pathname === "/release-updates/unsubscribe")) {
      try {
        const apiResponse = await apiRoute(request, env, url, pathname);
        if (apiResponse) return apiResponse;
      } catch (error) {
        if (error instanceof ApiError) return jsonResponse({ message: error.message }, error.status);
        return jsonResponse({ message: error instanceof Error ? error.message : "Notification request failed." }, 500);
      }
    }

    // Legacy subdomains are aliases only. Redirect into the single ANEVUM
    // origin so RHENLINK local storage and authenticated state cannot fork.
    if (host === WIKI_HOST) {
      const targetPath = pathname === "/" ? "/wiki" : `/wiki${pathname}`;
      return Response.redirect(`https://${ROOT_HOST}${targetPath}${url.search}`, 308);
    }
    if (host === LATTICE_HOST) {
      const targetPath = pathname === "/" ? "/lattice" : `/lattice${pathname}`;
      return Response.redirect(`https://${ROOT_HOST}${targetPath}${url.search}`, 308);
    }
    if (host === COMMAND_HOST) {
      return Response.redirect(`https://${ROOT_HOST}/command${url.search}`, 308);
    }

    let response;

    if (host === ROOT_HOST && ROOT_ROUTE_META.has(pathname)) {
      response = await env.ASSETS.fetch(assetRequest(request, "/"));
    } else {
      response = await env.ASSETS.fetch(request);
    }

    if (host === WIKI_HOST) {
      const meta = wikiMeta(pathname);
      response = rewriteHtml(response, meta);
      if (meta.robots.startsWith("noindex") && isHtml(response)) {
        response = withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
      }
      return response;
    }

    if (host === LATTICE_HOST) {
      return rewriteHtml(response, LATTICE_META);
    }

    if (host === COMMAND_HOST) {
      const html = isHtml(response);
      response = rewriteHtml(response, COMMAND_META);
      if (!html) return response;
      return withHeaders(response, {
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "private, no-store",
      });
    }

    if (host === ROOT_HOST) {
      if (ROOT_ROUTE_META.has(pathname)) {
        const meta = ROOT_ROUTE_META.get(pathname);
        response = rewriteHtml(response, meta);
        if (meta.robots.startsWith("noindex") && isHtml(response)) {
          return withHeaders(response, { "X-Robots-Tag": "noindex, follow, noarchive" });
        }
        return response;
      }

      if (pathname === "/wiki" || pathname.startsWith("/wiki/")) {
        const wikiPath = pathname === "/wiki" ? "/" : pathname.slice(5) || "/";
        const meta = wikiMeta(wikiPath);
        response = rewriteHtml(response, meta);
        if (meta.robots.startsWith("noindex") && isHtml(response)) {
          return withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
        }
        return response;
      }

      if (pathname === "/lattice" || pathname.startsWith("/lattice/")) {
        return rewriteHtml(response, LATTICE_META);
      }

      if (pathname === "/command" || pathname.startsWith("/command/")) {
        const html = isHtml(response);
        response = rewriteHtml(response, COMMAND_META);
        if (!html) return response;
        return withHeaders(response, {
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Cache-Control": "private, no-store",
        });
      }

      if (pathname === "/rhenlink" || pathname === "/auth-bridge" || !ROOT_PUBLIC_PATHS.has(pathname)) {
        if (isHtml(response)) return withHeaders(response, { "X-Robots-Tag": "noindex, follow, noarchive" });
      }
      return response;
    }

    if (isHtml(response)) return withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
    return response;
  },
};
