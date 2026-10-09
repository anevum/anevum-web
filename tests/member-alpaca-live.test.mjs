import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  liveConnectConfigured, liveConnectSchemaReady,
  buildLiveAuthorizationURL, memberAlpacaLiveEndpoint, exportMemberLiveConnection
} from "../src/server/member-alpaca-live.mjs";

const origin = "https://anevum-member-staging.devonakins.workers.dev";
const callback = origin + "/api/member/alpaca/live/callback";
const userA = { id: "member-a", emailVerified: true };
const userB = { id: "member-b", emailVerified: true };
const token = "fake-alpaca-member-oauth-token-only-for-tests";
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(29)));
const baseFlags = {
  ANEVUM_ALPACA_LIVE_CONNECT_ENABLED: "true",
  ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED: "true",
  ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED: "true",
  ALPACA_CONNECT_CLIENT_ID: "test-connect-client-id",
  ALPACA_CONNECT_CLIENT_SECRET: "test-connect-client-secret",
  ALPACA_CONNECT_TOKEN_KEY_BASE64: key,
  ANEVUM_OWNER_BROKER_ACCOUNT_ID: "owner-private-alpaca-account",
};
const req = (route, method = "GET", data = {}) => new Request(origin + route, {
  method,
  headers: method === "POST" ? { Origin: origin, "Content-Type": "application/json" } : {},
  body: method === "POST" ? JSON.stringify(data) : undefined,
});

function mockDB() {
  const states = new Map();
  const connections = new Map();
  const consents = new Map();
  const calls = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            first: async () => {
              if (sql.includes("FROM member_alpaca_live_connections")) {
                const row = connections.get(args[0]);
                return row && row.revoked_at == null ? row : null;
              }
              return null;
            },
            run: async () => {
              if (sql.includes("INSERT INTO member_alpaca_live_consents")) {
                const [memberId, disclosureVersion, acceptedAt] = args;
                consents.set(memberId, { disclosureVersion, acceptedAt });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO member_alpaca_live_oauth_states")) {
                const [hash, user, expiry, created, boundedUser, windowStart] = args;
                if (states.has(hash)) throw Error("State exists");
                if (boundedUser !== user) throw Error("OAuth state scope mismatch");
                if ([...states.values()].filter(s => s.user_id === user && s.created_at >= windowStart).length >= 8)
                  return { meta: { changes: 0 } };
                states.set(hash, { user_id: user, expires_at: expiry, created_at: created, consumed_at: null });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("UPDATE member_alpaca_live_oauth_states")) {
                const [now, hash, user, at] = args;
                const record = states.get(hash);
                if (!record || record.user_id !== user || record.consumed_at !== null || record.expires_at < at)
                  return { meta: { changes: 0 } };
                record.consumed_at = now;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("INSERT INTO member_alpaca_live_connections")) {
                const [user, connection_id, broker_account_id, encrypted_token, token_iv, granted_scopes, connected_at] = args;
                if (connections.has(user) ||
                    [...connections.values()].some(item => item.broker_account_id === broker_account_id))
                  throw Error("Duplicate brokerage account");
                connections.set(user, { user_id: user, connection_id, broker_account_id, encrypted_token,
                  token_iv, granted_scopes, connected_at, environment: "live", revoked_at: null });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("DELETE FROM member_alpaca_live_connections")) {
                const deleted = connections.delete(args[0]);
                return { meta: { changes: deleted ? 1 : 0 } };
              }
              throw Error("Unmocked SQL write");
            },
            all: async () => ({ results: [] }),
          };
        },
        all: async () => sql.includes("sqlite_master") ?
          { results: [
            { name: "member_alpaca_live_oauth_states" },
            { name: "member_alpaca_live_connections" },
            { name: "member_alpaca_live_consents" }
          ] } : { results: [] }
      };
    }
  };
  return { db, states, connections, consents, calls };
}
const configured = (db) => ({ ...baseFlags, MEMBER_DB: db });
function brokerFetch(accountId = "member-a-live-account", opts = {}) {
  const calls = [];
  const fetcher = async (url, request) => {
    calls.push({ url, request });
    if (url === "https://api.alpaca.markets/oauth/token") return Response.json({
      access_token: token, scope: opts.scope ?? "trading", token_type: "bearer"
    });
    if (url === "https://api.alpaca.markets/v2/account") return Response.json({
      id: accountId, status: opts.status ?? "ACTIVE",
      trading_blocked: false, account_blocked: false
    });
    throw Error("Disallowed provider URL");
  };
  return { fetcher, calls };
}
async function start(db, user = userA, flags = {}) {
  const env = { ...configured(db), ...flags };
  const response = await memberAlpacaLiveEndpoint(
    req("/api/member/alpaca/live/start", "POST", { acknowledged: true, disclosureVersion: "alpaca-live-v1" }), env, user, origin,
    "/api/member/alpaca/live/start"
  );
  const value = await response.json();
  return { response, value, env, state: value.authorizeUrl && new URL(value.authorizeUrl).searchParams.get("state") };
}
async function callbackRequest(env, user, state, fetcher, code = "test-authorization-code") {
  const path = "/api/member/alpaca/live/callback";
  return memberAlpacaLiveEndpoint(
    req(path + "?state=" + encodeURIComponent(state) + "&code=" + code),
    env, user, origin, path, fetcher
  );
}

test("Live Connect is OFF unless provider/commercial/key approval is explicitly configured", async () => {
  for (const key of [
    "ANEVUM_ALPACA_LIVE_CONNECT_ENABLED", "ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED",
    "ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED", "ALPACA_CONNECT_CLIENT_ID",
    "ALPACA_CONNECT_CLIENT_SECRET", "ALPACA_CONNECT_TOKEN_KEY_BASE64"
  ]) {
    const { db } = mockDB();
    assert.equal(liveConnectConfigured({ ...configured(db), [key]: "" }), false);
  }
  const noDb = { prepare: () => { throw Error("No tables available"); } };
  assert.equal(await liveConnectSchemaReady(noDb), false);
  const { db } = mockDB();
  const unavailable = await memberAlpacaLiveEndpoint(
    req("/api/member/brokerage"), { MEMBER_DB: db }, userA, origin, "/api/member/brokerage"
  );
  const status = await unavailable.json();
  assert.equal(status.connectionAvailable, false);
  assert.equal(status.liveTradingEnabled, false);
  assert.equal(status.brokerWriteEnabled, false);
});

test("OAuth URL asks only for live trading and fixes exact HTTPS callback", () => {
  const url = new URL(buildLiveAuthorizationURL("client-123", callback, "unguessable-state"));
  assert.equal(url.origin, "https://app.alpaca.markets");
  assert.equal(url.pathname, "/oauth/authorize");
  assert.equal(url.searchParams.get("redirect_uri"), callback);
  assert.equal(url.searchParams.get("scope"), "trading");
  assert.equal(url.searchParams.get("env"), "live");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.throws(() => buildLiveAuthorizationURL("client", "http://evil.example/api/member/alpaca/live/callback", "state"));
  assert.throws(() => buildLiveAuthorizationURL("client", origin + "/api/member/alpaca/live/callback?x=1", "state"));
});

test("Live connection uses one-time user-bound state and AES-GCM encrypted token, never browser secrets", async () => {
  const { db, connections, states } = mockDB();
  const { response, value, env, state } = await start(db);
  assert.equal(response.status, 200);
  assert.equal(value.executionEnabled, false);
  assert.ok(typeof state === "string" && state.length >= 40);
  assert.equal(states.size, 1);
  assert.ok(![...states.keys()][0].includes(state));
  const { fetcher, calls } = brokerFetch();
  const wrongUser = await callbackRequest(env, userB, state, fetcher);
  assert.equal(wrongUser.status, 403);
  assert.equal(calls.length, 0);
  const accepted = await callbackRequest(env, userA, state, fetcher);
  assert.equal(accepted.status, 303);
  assert.equal(accepted.headers.get("location"), origin + "/apps/rhen/account?alpaca=connected");
  assert.equal(accepted.headers.get("referrer-policy"), "no-referrer");
  assert.equal(calls.length, 2);
  assert.equal(connections.size, 1);
  const saved = connections.get(userA.id);
  assert.equal(saved.broker_account_id, "member-a-live-account");
  assert.equal(saved.granted_scopes, "trading");
  assert.equal(saved.environment, "live");
  assert.notEqual(saved.encrypted_token, token);
  assert.ok(!JSON.stringify(saved).includes(token));
  assert.equal(await exportMemberLiveConnection(db, userA.id).then(x => x.brokerAccountId), "member-a-live-account");
  const again = await callbackRequest(env, userA, state, fetcher);
  assert.equal(again.status, 403);
  assert.equal(calls.length, 2);

  const status = await memberAlpacaLiveEndpoint(req("/api/member/brokerage"), env, userA, origin, "/api/member/brokerage");
  const data = await status.json();
  assert.equal(data.accountConnected, true);
  assert.equal(data.liveTradingEnabled, false);
  assert.equal(data.brokerWriteEnabled, false);
  assert.equal(data.account.ending, "ount");
  assert.equal(JSON.stringify(data).includes(token), false);
  assert.equal(JSON.stringify(data).includes("member-a-live-account"), false);
});

test("Provider errors, missing trading scope, owner broker ID and duplicate brokerage accounts fail closed", async () => {
  for (const scenario of [
    { id: "owner-private-alpaca-account" },
    { id: "member-live-account", options: { scope: "data" } },
    { id: "member-live-account", options: { status: "BLOCKED" } }
  ]) {
    const { db, connections } = mockDB();
    const { env, state } = await start(db);
    const { fetcher } = brokerFetch(scenario.id, scenario.options || {});
    const result = await callbackRequest(env, userA, state, fetcher);
    assert.equal(result.status, 409);
    assert.equal(connections.size, 0);
  }
  const { db, connections } = mockDB();
  const a = await start(db, userA);
  assert.equal((await callbackRequest(a.env, userA, a.state, brokerFetch("shared-broker-live").fetcher)).status, 303);
  const b = await start(db, userB);
  assert.equal((await callbackRequest(b.env, userB, b.state, brokerFetch("shared-broker-live").fetcher)).status, 409);
  assert.equal(connections.size, 1);
});

test("Member disconnect removes only own token and exports never include encrypted credentials", async () => {
  const { db, connections } = mockDB();
  const a = await start(db, userA);
  const b = await start(db, userB);
  assert.equal((await callbackRequest(a.env, userA, a.state, brokerFetch("broker-a-live").fetcher)).status, 303);
  assert.equal((await callbackRequest(b.env, userB, b.state, brokerFetch("broker-b-live").fetcher)).status, 303);
  const existingB = connections.get(userB.id);
  const disconnect = await memberAlpacaLiveEndpoint(
    req("/api/member/alpaca/live/disconnect", "POST"), a.env, userA,
    origin, "/api/member/alpaca/live/disconnect"
  );
  assert.equal(disconnect.status, 200);
  assert.equal(connections.has(userA.id), false);
  assert.equal(connections.get(userB.id), existingB);
  assert.equal(await exportMemberLiveConnection(db, userA.id), null);
  const exported = await exportMemberLiveConnection(db, userB.id);
  assert.equal(exported.brokerAccountId, "broker-b-live");
  assert.equal(Object.hasOwn(exported, "encrypted_token"), false);
  assert.equal(Object.hasOwn(exported, "token_iv"), false);
});

test("The only member browser paths are authenticated account linking and read-only status", () => {
  const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const member = read("src/server/member.mjs");
  const api = read("src/server/member-alpaca-live.mjs");
  const prod = JSON.parse(read("wrangler.jsonc"));
  const preview = JSON.parse(read("wrangler.member-staging.jsonc"));
  for (const c of [prod, preview]) {
    assert.equal(c.vars.ANEVUM_ALPACA_LIVE_CONNECT_ENABLED, "false");
    assert.equal(c.vars.ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED, "false");
    assert.equal(c.vars.ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED, "false");
  }
  assert.ok(member.indexOf("if (!user?.id)") < member.indexOf('pathname === "/api/member/brokerage"'));
  assert.ok(member.indexOf("safeMutation(request, verifiedOrigin)") < member.indexOf('pathname === "/api/member/brokerage"'));
  assert.match(member, /exportMemberLiveConnection\(db, user\.id\)/);
  assert.match(api, /encrypted_token/);
  assert.doesNotMatch(api, /\/v2\/orders|TRADER_BASE|proxyTrader|ALPACA_API_SECRET|executeOrder/);
  assert.equal(read("migrations/0006_member_alpaca_live_connect.sql").includes("ON DELETE CASCADE"), true);
});


test("OAuth start is bounded per member and disconnection works after all approval flags are disabled", async () => {
  const { db, connections } = mockDB();
  for (let i = 0; i < 8; i++) {
    const result = await start(db, userA);
    assert.equal(result.response.status, 200);
  }
  const blocked = await start(db, userA);
  assert.equal(blocked.response.status, 429);

  const { db: linkedDb, connections: linked } = mockDB();
  const initial = await start(linkedDb, userA);
  assert.equal((await callbackRequest(initial.env, userA, initial.state,
    brokerFetch("live-account-a").fetcher)).status, 303);
  assert.equal(linked.size, 1);
  const disabled = { ...initial.env, ANEVUM_ALPACA_LIVE_CONNECT_ENABLED: "false" };
  const status = await memberAlpacaLiveEndpoint(
    req("/api/member/brokerage"), disabled, userA, origin, "/api/member/brokerage"
  );
  const current = await status.json();
  assert.equal(current.accountConnected, true);
  assert.equal(current.connectionAvailable, false);
  const disconnect = await memberAlpacaLiveEndpoint(
    req("/api/member/alpaca/live/disconnect", "POST"), disabled, userA,
    origin, "/api/member/alpaca/live/disconnect"
  );
  assert.equal(disconnect.status, 200);
  assert.equal(linked.size, 0);
  assert.equal(connections.size, 0);
});
