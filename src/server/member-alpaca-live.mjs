// Member-owned Alpaca Connect LIVE OAuth: guarded account-linking ONLY.
// Never exposes OAuth tokens or submits orders. Separate from owner RHEN/Command.
const ALPACA_AUTHORIZE = "https://app.alpaca.markets/oauth/authorize";
const ALPACA_TOKEN = "https://api.alpaca.markets/oauth/token";
const ALPACA_ACCOUNT = "https://api.alpaca.markets/v2/account";
const STATE_LIFETIME_SECONDS = 600;
const LIVE_DISCLOSURE_VERSION = "alpaca-live-v1";
const ACCOUNT_ID = /^[A-Za-z0-9_.:-]{8,128}$/;

function respond(value, status = 200) {
  return Response.json(value, { status, headers: {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer"
  } });
}

function encode64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function bytesFrom64(value) {
  if (typeof value !== "string" || !value) throw new Error("Missing encryption key");
  const raw = atob(value);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

export function liveConnectConfigured(env) {
  return Boolean(
    env?.ANEVUM_ALPACA_LIVE_CONNECT_ENABLED === "true" &&
    env?.ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED === "true" &&
    env?.ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED === "true" &&
    typeof env?.ALPACA_CONNECT_CLIENT_ID === "string" && env.ALPACA_CONNECT_CLIENT_ID.length >= 8 &&
    typeof env?.ALPACA_CONNECT_CLIENT_SECRET === "string" && env.ALPACA_CONNECT_CLIENT_SECRET.length >= 16 &&
    typeof env?.ALPACA_CONNECT_TOKEN_KEY_BASE64 === "string" &&
    env.ALPACA_CONNECT_TOKEN_KEY_BASE64.length >= 40 &&
    typeof env?.ANEVUM_OWNER_BROKER_ACCOUNT_ID === "string" &&
    env.ANEVUM_OWNER_BROKER_ACCOUNT_ID.length >= 8
  );
}

export async function liveConnectSchemaReady(db) {
  if (typeof db?.prepare !== "function") return false;
  try {
    const rows = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'member_alpaca_live_%'"
    ).all();
    const names = new Set((rows?.results || []).map(x => x.name));
    return names.has("member_alpaca_live_oauth_states") &&
      names.has("member_alpaca_live_connections") &&
      names.has("member_alpaca_live_consents");
  } catch {
    return false;
  }
}

export function buildLiveAuthorizationURL(clientId, exactCallbackUrl, state) {
  if (!clientId || !state || typeof exactCallbackUrl !== "string") {
    throw new Error("Alpaca Connect app, callback and state are required");
  }
  const callback = new URL(exactCallbackUrl);
  if (callback.protocol !== "https:" || callback.search || callback.hash ||
      callback.pathname !== "/api/member/alpaca/live/callback") {
    throw new Error("Invalid approved Connect callback");
  }
  const url = new URL(ALPACA_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", exactCallbackUrl);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "trading");
  url.searchParams.set("env", "live");
  return url.toString();
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function newState() {
  const buffer = crypto.getRandomValues(new Uint8Array(32));
  return encode64(buffer).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function encryptBearer(token, userId, connectionId, accountId, key64) {
  if (typeof token !== "string" || token.length < 16 || token.length > 4096) {
    throw new Error("Broker grant was not usable");
  }
  const material = bytesFrom64(key64);
  if (material.length !== 32) throw new Error("AES-256 key required");
  const key = await crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt"]);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const context = new TextEncoder().encode([userId, connectionId, accountId, "live"].join("|"));
  const ciphertext = await crypto.subtle.encrypt({
    name: "AES-GCM", iv: nonce, additionalData: context, tagLength: 128
  }, key, new TextEncoder().encode(token));
  return { encrypted: encode64(new Uint8Array(ciphertext)), iv: encode64(nonce) };
}

const statusPayload = (connected, enabled = false, readEnabled = false) => ({
  integration: "alpaca_connect",
  connectionAvailable: enabled,
  accountConnected: Boolean(connected),
  accountReadAvailable: Boolean(connected && readEnabled),
  paperTradingEnabled: false,
  liveTradingEnabled: false,
  brokerWriteEnabled: false,
  depositsEnabled: false,
  withdrawalsEnabled: false,
  account: connected
    ? { provider: "Alpaca", environment: "live", ending: String(connected.broker_account_id).slice(-4), connectedAt: connected.connected_at }
    : null,
});

export async function exportMemberLiveConnection(db, userId) {
  if (!await liveConnectSchemaReady(db)) return null;
  const row = await db.prepare(
    "SELECT connection_id,broker_account_id,environment,connected_at,revoked_at " +
    "FROM member_alpaca_live_connections WHERE user_id=?"
  ).bind(userId).first();
  return row ? {
    connectionId: row.connection_id,
    brokerAccountId: row.broker_account_id,
    environment: row.environment,
    connectedAt: row.connected_at,
    revokedAt: row.revoked_at
  } : null;
}

// Backend has already resolved exact Better Auth user and verified request Origin.
// This handler never accepts member_id, account_id, broker tokens or auth scopes from a body.
export async function memberAlpacaLiveEndpoint(
  request, env, verifiedUser, verifiedOrigin, pathname,
  fetcher = fetch
) {
  const statusRequest = pathname === "/api/member/brokerage";
  const db = env?.MEMBER_DB;
  if (!verifiedUser?.id || typeof verifiedOrigin !== "string" ||
      new URL(request.url).origin !== verifiedOrigin || !verifiedOrigin.startsWith("https://")) {
    return respond({ message: "Member identity or callback origin not authorized." }, 403);
  }
  const schemaReady = await liveConnectSchemaReady(db);
  const enabled = liveConnectConfigured(env) && schemaReady;
  const callback = verifiedOrigin + "/api/member/alpaca/live/callback";
  const now = Math.floor(Date.now() / 1000);

  // Status and removal remain available to the owner even when new grants are
  // suspended. Disabling onboarding must never trap a member's stored grant.
  if (statusRequest) {
    if (request.method !== "GET") return respond({ message: "Read-only capability." }, 405);
    if (!schemaReady) return respond(statusPayload(null));
    const row = await db.prepare(
      "SELECT broker_account_id,connected_at FROM member_alpaca_live_connections " +
      "WHERE user_id=? AND revoked_at IS NULL"
    ).bind(verifiedUser.id).first();
    return respond(statusPayload(row, enabled, enabled && env?.ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED === "true"));
  }
  if (pathname === "/api/member/alpaca/live/disconnect") {
    if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
    if (!schemaReady) return respond({ message: "Brokerage storage is unavailable." }, 503);
    await db.prepare("DELETE FROM member_alpaca_live_connections WHERE user_id=?")
      .bind(verifiedUser.id).run();
    return respond({
      disconnected: true, executionEnabled: false,
      message: "Access in ANEVUM is removed. Also revoke ANEVUM in your Alpaca authorized applications."
    });
  }
  if (!enabled) return respond({ message: "Live account linking has not been approved or activated." }, 503);

  if (pathname === "/api/member/alpaca/live/start") {
    if (request.method !== "POST") return respond({ message: "Method not allowed." }, 405);
    if (verifiedUser.emailVerified !== true) return respond({ message: "Verified account required." }, 403);
    // Broker access and potential trading authority must be explained and
    // explicitly acknowledged before an OAuth redirect can be issued.
    // No client-selected member, broker or permission fields are accepted.
    let acknowledgement;
    try {
      if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        throw new Error("JSON required");
      }
      const raw = await request.text();
      if (raw.length > 256) throw new Error("Invalid body size");
      acknowledgement = JSON.parse(raw);
    } catch {
      return respond({ message: "Review and acknowledge the brokerage trading disclosure first." }, 400);
    }
    if (!acknowledgement || Array.isArray(acknowledgement) ||
        Object.keys(acknowledgement).sort().join(",") !== "acknowledged,disclosureVersion" ||
        acknowledgement.acknowledged !== true ||
        acknowledgement.disclosureVersion !== LIVE_DISCLOSURE_VERSION) {
      return respond({ message: "Review and acknowledge the brokerage trading disclosure first." }, 400);
    }
    const existing = await db.prepare(
      "SELECT connection_id FROM member_alpaca_live_connections WHERE user_id=? AND revoked_at IS NULL"
    ).bind(verifiedUser.id).first();
    if (existing) return respond({ message: "Disconnect your existing live account before reconnecting." }, 409);
    // Server keeps a versioned, authenticated-member record of the acknowledgement.
    // This is not an Alpaca grant and never enables a trading strategy.
    await db.prepare(
      "INSERT INTO member_alpaca_live_consents(user_id,disclosure_version,accepted_at) VALUES(?,?,?) " +
      "ON CONFLICT(user_id,disclosure_version) DO UPDATE SET accepted_at=excluded.accepted_at"
    ).bind(verifiedUser.id, LIVE_DISCLOSURE_VERSION, now).run();
    const state = newState();
    const digest = await sha256Hex(state);
    const saved = await db.prepare(
      "INSERT INTO member_alpaca_live_oauth_states(state_hash,user_id,expires_at,created_at) " +
      "SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM member_alpaca_live_oauth_states " +
      "WHERE user_id=? AND created_at>=?) < 8"
    ).bind(digest, verifiedUser.id, now + STATE_LIFETIME_SECONDS, now,
      verifiedUser.id, now - 3600).run();
    if (saved.meta?.changes !== 1) return respond({ message: "Please wait before starting another connection." }, 429);
    return respond({
      authorizeUrl: buildLiveAuthorizationURL(env.ALPACA_CONNECT_CLIENT_ID, callback, state),
      accountConnected: false,
      executionEnabled: false
    });
  }

  if (pathname === "/api/member/alpaca/live/callback") {
    if (request.method !== "GET") return respond({ message: "Method not allowed." }, 405);
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    // The state is one-time and bound to the current verified member session.
    if (url.searchParams.getAll("state").length !== 1 || url.searchParams.getAll("code").length !== 1 ||
        !state || !/^[A-Za-z0-9_-]{40,128}$/.test(state)) {
      return respond({ message: "Invalid OAuth state." }, 400);
    }
    const digest = await sha256Hex(state);
    const claimed = await db.prepare(
      "UPDATE member_alpaca_live_oauth_states SET consumed_at=? " +
      "WHERE state_hash=? AND user_id=? AND consumed_at IS NULL AND expires_at>=?"
    ).bind(now, digest, verifiedUser.id, now).run();
    if (claimed.meta?.changes !== 1) return respond({ message: "OAuth session expired or already used." }, 403);
    if (!code || typeof code !== "string" || code.length > 1024 ||
        url.searchParams.has("error")) {
      return respond({ message: "Broker authorization was not completed." }, 400);
    }
    let grant;
    let account;
    try {
      const tokenResponse = await fetcher(ALPACA_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: new URLSearchParams({
          grant_type: "authorization_code", code,
          client_id: env.ALPACA_CONNECT_CLIENT_ID,
          client_secret: env.ALPACA_CONNECT_CLIENT_SECRET,
          redirect_uri: callback,
        }),
        redirect: "error",
      });
      if (!tokenResponse.ok) throw new Error("Token exchange rejected");
      grant = await tokenResponse.json();
      if (typeof grant.access_token !== "string" ||
          !String(grant.scope || "").split(/\s+/).includes("trading")) {
        throw new Error("Missing permission for trading");
      }
      const accountResponse = await fetcher(ALPACA_ACCOUNT, {
        headers: { "Authorization": "Bearer " + grant.access_token, "Accept": "application/json" },
        redirect: "error",
      });
      if (!accountResponse.ok) throw new Error("Live account verification unavailable");
      account = await accountResponse.json();
      if (!ACCOUNT_ID.test(account?.id || "") || account.status !== "ACTIVE" ||
          account.trading_blocked !== false || account.account_blocked !== false) {
        throw new Error("Invalid/blocked live broker account");
      }
      // Prevent the company's existing Alpaca account from being linked to
      // an unrelated member. Configuration is mandatory before activating linking.
      if (!env.ANEVUM_OWNER_BROKER_ACCOUNT_ID ||
          String(account.id) === String(env.ANEVUM_OWNER_BROKER_ACCOUNT_ID)) {
        throw new Error("Company account isolation not configured");
      }
      const connectionId = crypto.randomUUID();
      const crypt = await encryptBearer(
        grant.access_token, verifiedUser.id, connectionId, String(account.id),
        env.ALPACA_CONNECT_TOKEN_KEY_BASE64
      );
      await db.prepare(
        "INSERT INTO member_alpaca_live_connections " +
        "(user_id,connection_id,broker_account_id,encrypted_token,token_iv,granted_scopes,connected_at) " +
        "VALUES(?,?,?,?,?,?,?)"
      ).bind(
        verifiedUser.id, connectionId, String(account.id), crypt.encrypted,
        crypt.iv, "trading", now
      ).run();
    } catch {
      // Deliberately never reveal OAuth code, token, raw Alpaca body or account ID.
      return respond({ message: "Live brokerage verification was not completed; no account was linked." }, 409);
    }
    return new Response(null, { status: 303, headers: {
      "Location": verifiedOrigin + "/apps/rhen/account?alpaca=connected",
      "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    } });
  }

  return respond({ message: "Live brokerage endpoint not found." }, 404);
}
