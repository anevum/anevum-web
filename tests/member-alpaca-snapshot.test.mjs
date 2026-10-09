import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  alpacaDollarsToCents, snapshotReadEnabled, memberAlpacaReadSnapshot
} from "../src/server/member-alpaca-snapshot.mjs";

const origin = "https://anevum.com";
const userA = { id: "user-a" }, userB = { id: "user-b" };
const token = "TEST_BEARER_ONLY_DO_NOT_USE_IN_PRODUCTION_ABCDEFGH";
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(31)));
const ownerAccount = "private-owner-alpaca-1234";
const memberAccount = "unique-member-broker-5678";
const envFlags = {
  ANEVUM_ALPACA_LIVE_CONNECT_ENABLED: "true",
  ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED: "true",
  ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED: "true",
  ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED: "true",
  ALPACA_CONNECT_CLIENT_ID: "valid-client",
  ALPACA_CONNECT_CLIENT_SECRET: "test-only-client-secret-not-real",
  ALPACA_CONNECT_TOKEN_KEY_BASE64: key,
  ANEVUM_OWNER_BROKER_ACCOUNT_ID: ownerAccount,
};
const req = (method = "GET", from = origin) =>
  new Request(from + "/api/member/alpaca/live/snapshot", { method });

async function connected(accountId = memberAccount, memberId = userA.id) {
  const iv = new Uint8Array(12).fill(23);
  const context = new TextEncoder().encode([memberId, "connection-a", accountId, "live"].join("|"));
  const crypt = await crypto.subtle.importKey("raw", new Uint8Array(32).fill(31), "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({
    name: "AES-GCM", iv, additionalData: context, tagLength: 128
  }, crypt, new TextEncoder().encode(token));
  return {
    connection_id: "connection-a", broker_account_id: accountId, environment: "live",
    token_iv: btoa(String.fromCharCode(...iv)),
    encrypted_token: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
}

function database(link, opts = {}) {
  const sql = [];
  return { sql, db: {
    prepare(query) {
      sql.push(query);
      return {
        bind(userId) { return { first: async () =>
          userId === userA.id ? link : null }; },
        all: async () => opts.missingSchema ? { results: [] } :
          { results: [
            { name: "member_alpaca_live_oauth_states" },
            { name: "member_alpaca_live_connections" },
            { name: "member_alpaca_live_consents" },
          ] }
      };
    }
  }};
}

function fakeBroker(accountId = memberAccount, opts = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.method, "GET");
    assert.equal(init.headers.Authorization, "Bearer " + token);
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    if (url.endsWith("/v2/account")) return Response.json({
      id: accountId, status: opts.status || "ACTIVE", account_blocked: false,
      equity: "102.105", cash: "45.01", last_equity: "100.00",
      buying_power: "48.20", currency: "USD"
    });
    if (url.endsWith("/v2/positions")) return Response.json([
      { symbol: "SPY", asset_class: "us_equity", qty: "2",
        market_value: "56.01", unrealized_pl: "-0.25" }
    ]);
    if (url.includes("/v2/orders?")) return Response.json([
      { symbol: "SPY", side: "buy", qty: "2", filled_qty: "2",
        type: "limit", status: "filled", submitted_at: "2026-10-09T14:00:00Z" }
    ]);
    if (url.endsWith("/v2/clock")) return Response.json({ is_open: false });
    throw Error("Unexpected Alpaca URL: " + url);
  };
  return { fetcher, calls };
}

test("Member brokerage polling is disabled by default and never accepts client permissions", async () => {
  const conn = await connected();
  const { db } = database(conn);
  const broker = fakeBroker();
  const env = { ...envFlags, MEMBER_DB: db };
  for (const flag of [
    "ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED",
    "ANEVUM_ALPACA_LIVE_CONNECT_ENABLED",
    "ANEVUM_ALPACA_PROVIDER_LIVE_APPROVED",
    "ANEVUM_ALPACA_COMMERCIAL_USE_APPROVED"
  ]) {
    assert.equal(snapshotReadEnabled({ ...env, [flag]: "false" }), false);
    const resp = await memberAlpacaReadSnapshot(req(), { ...env, [flag]: "false" }, userA, origin, broker.fetcher);
    assert.equal(resp.status, 503);
  }
  assert.equal(broker.calls.length, 0);
  const prod = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const stage = JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc", import.meta.url), "utf8"));
  for (const config of [prod, stage]) assert.equal(config.vars.ANEVUM_ALPACA_LIVE_SNAPSHOT_ENABLED, "false");
});

test("The only allowed read is verified member account/positions/orders/clock", async () => {
  const { db, sql } = database(await connected());
  const broker = fakeBroker();
  const response = await memberAlpacaReadSnapshot(
    req(), { ...envFlags, MEMBER_DB: db }, userA, origin, broker.fetcher
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.available, true);
  assert.equal(data.environment, "live");
  assert.equal(data.accountEnding, "5678");
  assert.equal(data.account.equityCents, 10211);
  assert.equal(data.account.cashCents, 4501);
  assert.equal(data.positions[0].unrealizedPlCents, -25);
  assert.equal(data.marketOpen, false);
  assert.equal(data.orders[0].status, "filled");
  assert.equal(data.executionEnabled, false);
  assert.equal(data.canSubmitOrders, false);
  assert.equal(data.canTransferFunds, false);
  assert.equal(data.streamConnected, false);
  assert.equal(data.dataMode, "polled_broker_snapshot");
  assert.equal(broker.calls.length, 4);
  assert.ok(broker.calls.every(c => !/\/v2\/orders$/.test(c.url)));
  assert.ok(broker.calls.every(c => !c.init.body));
  assert.ok(sql.some(q => q.includes("WHERE user_id=? AND revoked_at IS NULL")));
  assert.ok(!JSON.stringify(data).includes(token));
  assert.ok(!JSON.stringify(data).includes(memberAccount));
  assert.ok(!JSON.stringify(data).includes("encrypted_token"));
});

test("Wrong member, wrong account, missing grant, bad grant or blocked broker fails closed", async () => {
  const conn = await connected();
  const { db } = database(conn);
  const provider = fakeBroker();
  const env = { ...envFlags, MEMBER_DB: db };
  assert.equal((await memberAlpacaReadSnapshot(req(), env, userB, origin, provider.fetcher)).status, 409);
  assert.equal((await memberAlpacaReadSnapshot(req("POST"), env, userA, origin, provider.fetcher)).status, 405);
  assert.equal((await memberAlpacaReadSnapshot(req(), env, userA, "https://evil.example", provider.fetcher)).status, 403);
  assert.equal(provider.calls.length, 0);
  assert.equal((await memberAlpacaReadSnapshot(req(), env, userA, origin, fakeBroker("other-account").fetcher)).status, 409);
  assert.equal((await memberAlpacaReadSnapshot(req(), { ...env, MEMBER_DB: database(await connected(ownerAccount)).db }, userA, origin, provider.fetcher)).status, 403);
  const broken = database({ ...conn, encrypted_token: "corrupt" });
  assert.equal((await memberAlpacaReadSnapshot(req(), { ...env, MEMBER_DB: broken.db }, userA, origin, provider.fetcher)).status, 503);
  assert.equal((await memberAlpacaReadSnapshot(req(), env, userA, origin, fakeBroker(memberAccount, {status:"BLOCKED"}).fetcher)).status, 409);
});

test("Money parsing is integer-cent accurate and rejects malformed broker values", () => {
  assert.equal(alpacaDollarsToCents("102.105"), 10211);
  assert.equal(alpacaDollarsToCents("-0.25"), -25);
  assert.equal(alpacaDollarsToCents("1"), 100);
  assert.equal(alpacaDollarsToCents("0.001"), 0);
  for (const bad of ["NaN","Infinity","$3.00","1e6","",null,"9".repeat(17)])
    assert.equal(alpacaDollarsToCents(bad), null);
});

test("Personal terminal cannot access owner command, submit trades or synthesize balances", () => {
  const page=readFileSync(new URL("../src/pages/RhenMemberTerminal.tsx", import.meta.url), "utf8");
  const app=readFileSync(new URL("../src/pages/RhenApp.tsx", import.meta.url), "utf8");
  const member=readFileSync(new URL("../src/server/member.mjs", import.meta.url), "utf8");
  const api=readFileSync(new URL("../src/server/member-alpaca-snapshot.mjs", import.meta.url), "utf8");
  assert.match(app, /\/apps\/rhen\/my-terminal/);
  assert.match(app, /<RhenMemberTerminal key={session.user.id} \/>/);
  assert.match(page, /No verified brokerage positions to display/);
  assert.match(page, /polled_broker_snapshot/);
  assert.match(page, /Trading|trading/);
  assert.doesNotMatch(page, /api\/command|api\/trader|submit_order|placeOrder|mockPositions|demoBalance/);
  assert.ok(member.indexOf('if (!user?.id)') <
    member.indexOf('pathname === "/api/member/alpaca/live/snapshot"'));
  assert.ok(member.indexOf('pathname === "/api/member/alpaca/live/snapshot"') <
    member.indexOf('pathname === "/api/member/brokerage"'));
  assert.doesNotMatch(api, /method:\s*["']POST["']|api\/trader|api\/command|\/v2\/orders["']/);
});
