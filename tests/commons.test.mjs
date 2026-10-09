import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  commonsEndpoint, commonsSchemaReady, exportCommonsData,
  validateCommonsTopic, validateCommonsComment
} from "../src/server/commons.mjs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const valid = {
  kind: "question", subject: "algorithms",
  title: "Does this exit rule survive costs?",
  body: "Compare the candidate exits under realistic fees and market slippage."
};

test("research types are bounded and cannot smuggle identity, payment or broker authority", () => {
  assert.deepEqual(validateCommonsTopic({ ...valid, title: "  A valid research question  " }), {
    ...valid, title: "A valid research question"
  });
  for (const input of [
    { ...valid, userId: "someone-else" },
    { ...valid, role: "moderator" },
    { ...valid, brokerToken: "secret" },
    { ...valid, executionEnabled: true },
    { ...valid, subject: "signal_marketplace" },
    { ...valid, kind: "payment" },
    { ...valid, title: "short" },
    { ...valid, title: "long".repeat(50) },
    { ...valid, body: "too brief" },
    { ...valid, body: "x".repeat(3001) },
    { ...valid, title: "test\u0000control" },
    null, []
  ]) assert.throws(() => validateCommonsTopic(input));
  assert.deepEqual(validateCommonsComment({ body: " useful correction " }), { body: "useful correction" });
  for (const input of [
    { body: "ok" }, { body: "x".repeat(1501) }, { body: "fine", author_id: "other" }, [], null
  ]) assert.throws(() => validateCommonsComment(input));
});

test("Commons never opens for members when the feature flag is unset or false", async () => {
  for (const flag of [undefined, "false"]) {
    const env = { ANEVUM_COMMONS_ENABLED: flag };
    const get = await commonsEndpoint(new Request("https://anevum.com/api/member/commons"), env, { id: "a" }, "/api/member/commons");
    assert.equal(get.status, 200);
    assert.deepEqual(await get.json(), { available: false, status: "preparing", role: null, topics: [] });
    for (const method of ["POST", "PATCH"]) {
      const res = await commonsEndpoint(new Request("https://anevum.com/api/member/commons/topics", { method }), env, { id: "a" }, "/api/member/commons/topics");
      assert.equal(res.status, 503);
      assert.equal(res.headers.get("cache-control"), "private, no-store");
    }
  }
});

test("schema readiness requires all four Commons tables and rejects database outages", async () => {
  const tables = ["commons_members", "commons_topics", "commons_comments", "commons_moderation_events"];
  const fake = names => ({ prepare: () => ({ all: async () => ({ results: names.map(name => ({ name })) }) }) });
  assert.equal(await commonsSchemaReady(fake(tables)), true);
  assert.equal(await commonsSchemaReady(fake(tables.slice(0, 3))), false);
  assert.equal(await commonsSchemaReady({ prepare: () => ({ all: async () => { throw Error("down"); } }) }), false);
  assert.equal(await commonsSchemaReady(null), false);
});

function fakeDB({ member = null, topics = [] } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...params) {
          calls.push({ sql, params });
          return {
            all: async () => ({ results: sql.includes("sqlite_master")
              ? ["commons_members", "commons_topics", "commons_comments", "commons_moderation_events"].map(name => ({ name }))
              : sql.includes("FROM commons_topics t") ? topics : [] }),
            first: async () => sql.includes("FROM commons_members WHERE user_id") ? member : null,
            run: async () => ({ meta: { changes: 1 } })
          };
        },
        all: async () => {
          calls.push({ sql, params: [] });
          return { results: ["commons_members", "commons_topics", "commons_comments", "commons_moderation_events"].map(name => ({ name })) };
        }
      };
    }
  };
}

test("uninvited and suspended members cannot read or publish shared research", async () => {
  for (const member of [null, { role: "contributor", status: "suspended" }]) {
    const db = fakeDB({ member });
    const env = { ANEVUM_COMMONS_ENABLED: "true", MEMBER_DB: db };
    let response = await commonsEndpoint(new Request("https://anevum.com/api/member/commons"), env, { id: "member-a" }, "/api/member/commons");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "invite_only");
    response = await commonsEndpoint(new Request("https://anevum.com/api/member/commons/topics", { method: "POST" }), env, { id: "member-a" }, "/api/member/commons/topics");
    assert.equal(response.status, 403);
    assert.equal(db.calls.filter(call => call.sql.includes("INSERT INTO commons_topics")).length, 0);
    const membershipQueries = db.calls.filter(call => call.sql.includes("FROM commons_members WHERE user_id"));
    assert.ok(membershipQueries.every(call => call.params[0] === "member-a"));
  }
});

test("admitted member feed exposes only member-visible topics, with no query-selected tenant", async () => {
  const db = fakeDB({ member: { role: "contributor", status: "active" }, topics: [] });
  const url = "https://anevum.com/api/member/commons?user_id=other-account";
  const response = await commonsEndpoint(new Request(url), { ANEVUM_COMMONS_ENABLED: "true", MEMBER_DB: db }, { id: "member-a" }, "/api/member/commons");
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.available, true);
  assert.equal(payload.role, "contributor");
  assert.deepEqual(payload.topics, []);
  assert.ok(db.calls.some(call => call.sql.includes("t.visibility = 'members'")));
  assert.ok(db.calls.some(call => call.params[0] === "member-a" && call.sql.includes("FROM commons_members WHERE user_id")));
  assert.ok(db.calls.every(call => !call.params.includes("other-account")));
});

test("account export has a separate Commons record and fails safely before migration", async () => {
  assert.deepEqual(await exportCommonsData({}, "user-a"), {
    membership: null, topics: [], comments: []
  });
  const member = source("src/server/member.mjs");
  assert.ok(member.indexOf("if (!user?.id)") < member.indexOf('pathname === "/api/member/commons"'));
  assert.ok(member.indexOf("safeMutation(request, verifiedOrigin)") < member.indexOf('pathname === "/api/member/commons"'));
  assert.match(member, /exportCommonsData\(db, user\.id\)/);
  const sql = source("migrations/0003_commons_beta.sql");
  assert.match(sql, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.match(sql, /commons_moderation_events/);
  assert.doesNotMatch(sql, /broker_token|payout|financial_balance|execution_enabled/);
  const production = JSON.parse(source("wrangler.jsonc"));
  assert.notEqual(production.vars.ANEVUM_COMMONS_ENABLED, "true");
  assert.match(source("worker.mjs"), /pathname\.startsWith\("\/commons"\)/);
});

test("research moderation is role-gated and creates an audit event", () => {
  const service = source("src/server/commons.mjs");
  assert.match(service, /if \(request\.method === "PATCH" && moderator\)/);
  assert.match(service, /if \(commentModeration && moderator && request\.method === "PATCH"\)/);
  assert.match(service, /INSERT INTO commons_moderation_events/);
  assert.match(service, /COUNT\(\*\) FROM commons_topics WHERE author_id/);
  assert.match(service, /COUNT\(\*\) FROM commons_comments WHERE author_id/);
  assert.doesNotMatch(service, /TRADER_BASE|proxyTrader|COMMAND_ACCESS|alpacaKey|stripeSecret/);
});
