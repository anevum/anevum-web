// Read-only member-owned Alpaca data. NEVER forwards orders or exposes OAuth grants.
// Feature-gated separately from the OAuth connection and RHEN execution service.
import { liveConnectConfigured, liveConnectSchemaReady } from "./member-alpaca-live.mjs";

const ALPACA_BASE = "https://api.alpaca.markets";
const READ_PATHS = Object.freeze([
  "/v2/account",
  "/v2/positions",
  "/v2/orders?status=all&limit=50&direction=desc",
  "/v2/clock"
]);
const SYMBOL = /^[A-Z0-9.^-]{1,18}$/;

function reply(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export function snapshotReadEnabled(env) {
  return env?.ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED === "true" &&
    liveConnectConfigured(env);
}

function base64Bytes(value) {
  if (typeof value !== "string" || !value || value.length > 8192) {
    throw new Error("Unavailable encrypted member grant");
  }
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function decryptMemberGrant(connected, env, userId) {
  const raw = base64Bytes(env.ALPACA_CONNECT_TOKEN_KEY_BASE64);
  const iv = base64Bytes(connected.token_iv);
  if (raw.length !== 32 || iv.length !== 12) {
    throw new Error("Unavailable member encryption key");
  }
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const binding = new TextEncoder().encode([
    userId, connected.connection_id, connected.broker_account_id, "live",
  ].join("|"));
  const plain = await crypto.subtle.decrypt({
    name: "AES-GCM", iv, additionalData: binding, tagLength: 128
  }, key, base64Bytes(connected.encrypted_token));
  const token = new TextDecoder("utf-8", { fatal: true }).decode(plain);
  if (!token || token.length < 16 || token.length > 4096 || /\s/.test(token)) {
    throw new Error("Broker grant is not usable");
  }
  return token;
}

// Decimal strings from the broker are converted in integer cents, never floats.
// Limit precision/size and conservatively round fractions of a cent.
export function alpacaDollarsToCents(value) {
  const s = String(value);
  const match = /^(-?)(\d{1,12})(?:\.(\d{1,4}))?$/.exec(s);
  if (!match) return null;
  const cents = BigInt(match[2]) * 100n +
    BigInt(((match[3] || "") + "000").slice(0, 2)) +
    (Number(((match[3] || "") + "000").slice(2, 3)) >= 5 ? 1n : 0n);
  const result = match[1] ? -cents : cents;
  return result <= BigInt(Number.MAX_SAFE_INTEGER) &&
    result >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(result) : null;
}

function safeQuantity(value) {
  const s = String(value);
  return /^-?\d{1,12}(?:\.\d{1,8})?$/.test(s) ? s : null;
}

function safeSymbol(value) {
  return typeof value === "string" && SYMBOL.test(value) ? value : "UNKNOWN";
}

function accountFromBroker(account) {
  return {
    currency: account.currency === "USD" ? "USD" : null,
    equityCents: alpacaDollarsToCents(account.equity),
    cashCents: alpacaDollarsToCents(account.cash),
    buyingPowerCents: alpacaDollarsToCents(account.buying_power),
    lastEquityCents: alpacaDollarsToCents(account.last_equity),
    status: account.status === "ACTIVE" ? "active" : "unavailable",
  };
}

async function readAlpaca(fetcher, path, token) {
  if (!READ_PATHS.includes(path)) throw new Error("Unapproved broker read endpoint");
  const response = await fetcher(ALPACA_BASE + path, {
    method: "GET",
    headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(6500),
  });
  if (!response?.ok) throw new Error("Broker read unavailable");
  const contentLength = Number(response.headers?.get("content-length") || "0");
  if (!Number.isFinite(contentLength) || contentLength > 262144) {
    throw new Error("Broker response too large");
  }
  const raw = await response.text();
  if (raw.length > 262144) throw new Error("Broker response too large");
  return JSON.parse(raw);
}

export async function memberAlpacaReadSnapshot(
  request, env, verifiedUser, verifiedOrigin, fetcher = fetch
) {
  if (request.method !== "GET") return reply({ message: "Read-only endpoint." }, 405);
  if (!verifiedUser?.id || new URL(request.url).origin !== verifiedOrigin ||
      typeof verifiedOrigin !== "string" || !verifiedOrigin.startsWith("https://")) {
    return reply({ message: "Authenticated member required." }, 403);
  }
  const db = env?.MEMBER_DB;
  if (!snapshotReadEnabled(env) || !await liveConnectSchemaReady(db)) {
    return reply({ available: false, message: "Member brokerage read access is not active." }, 503);
  }

  let connected;
  try {
    connected = await db.prepare(
      "SELECT connection_id,broker_account_id,environment,encrypted_token,token_iv " +
      "FROM member_alpaca_live_connections " +
      "WHERE user_id=? AND revoked_at IS NULL AND environment='live'"
    ).bind(verifiedUser.id).first();
  } catch {
    return reply({ available: false, message: "Member connection is temporarily unavailable." }, 503);
  }
  if (!connected) return reply({ available: false, message: "Connect your own brokerage first." }, 409);
  if (!connected.broker_account_id ||
      connected.broker_account_id === env.ANEVUM_OWNER_BROKER_ACCOUNT_ID) {
    return reply({ available: false, message: "Brokerage account is not eligible for RHEN Cloud." }, 403);
  }

  try {
    const token = await decryptMemberGrant(connected, env, verifiedUser.id);
    const [account, positions, orders, clock] = await Promise.all(
      READ_PATHS.map(path => readAlpaca(fetcher, path, token))
    );
    // Fail closed on provider/broker account identity drift, even for reads.
    if (!account || String(account.id) !== String(connected.broker_account_id) ||
        account.status !== "ACTIVE" || account.account_blocked !== false) {
      return reply({ available: false, message: "Alpaca account verification failed." }, 409);
    }
    if (!Array.isArray(positions) || !Array.isArray(orders) || !clock ||
        typeof clock.is_open !== "boolean") {
      throw new Error("Unexpected brokerage state");
    }
    const holdings = positions.slice(0, 50).map(pos => ({
      symbol: safeSymbol(pos.symbol),
      assetClass: pos.asset_class === "us_equity" ? "us_equity" : "other",
      qty: safeQuantity(pos.qty),
      marketValueCents: alpacaDollarsToCents(pos.market_value),
      unrealizedPlCents: alpacaDollarsToCents(pos.unrealized_pl),
    }));
    const recentOrders = orders.slice(0, 20).map(order => ({
      symbol: safeSymbol(order.symbol),
      side: ["buy", "sell"].includes(order.side) ? order.side : "unknown",
      qty: safeQuantity(order.qty ?? "0"),
      filledQty: safeQuantity(order.filled_qty ?? "0"),
      type: ["limit", "market", "stop", "stop_limit", "trailing_stop"].includes(order.type)
        ? order.type : "other",
      status: typeof order.status === "string" &&
        /^[a-z_]{2,32}$/.test(order.status) ? order.status : "unknown",
      submittedAt: typeof order.submitted_at === "string" &&
        /^\d{4}-\d\d-\d\dT/.test(order.submitted_at) ?
        order.submitted_at.slice(0, 32) : null
    }));
    return reply({
      available: true,
      broker: "Alpaca",
      environment: "live",
      accountEnding: String(connected.broker_account_id).slice(-4),
      account: accountFromBroker(account),
      marketOpen: clock.is_open,
      observedAt: new Date().toISOString(),
      positions: holdings,
      positionsTruncated: positions.length > holdings.length,
      orders: recentOrders,
      ordersTruncated: orders.length > recentOrders.length,
      executionEnabled: false,
      canSubmitOrders: false,
      canTransferFunds: false,
      streamConnected: false,
      dataMode: "polled_broker_snapshot"
    });
  } catch {
    // Avoid reflecting tokens, broker HTTP bodies, account IDs or queries.
    return reply({ available: false, message: "Live Alpaca account data could not be verified." }, 503);
  }
}
