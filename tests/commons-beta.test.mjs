import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateCommonsTopic, validateCommonsComment, commonsSchemaReady,
  commonsEndpoint, exportCommonsData
} from "../src/server/commons.mjs";
import { memberEndpoint, safeMutation } from "../src/server/member.mjs";

const base = new URL("../", import.meta.url);
const read = name => readFileSync(new URL(name, base), "utf8");
const sample = {
  kind: "question", subject: "algorithms", title: "Can this rule survive costs?",
  body: "This hypothesis needs an out-of-sample comparison including trading costs."
};
const user = { id: "verified-member-123" };
const tables = ["commons_members", "commons_topics", "commons_comments", "commons_moderation_events", "commons_reports"];

function mockDB({ role = "contributor", active = true, rows = [], topic = null, comments = [] } = {}) {
  const calls = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          const prepared = {
            first: async () => {
              if (sql.includes("SELECT role, status FROM commons_members")) {
                return role === null ? null : { role, status: active ? "active" : "suspended" };
              }
              if (sql.includes("FROM commons_topics t")) return topic;
              if (sql.includes("SELECT id FROM commons_topics")) return topic && { id: topic.id };
              if (sql.includes("SELECT id FROM commons_comments")) return null;
              if (sql.includes("SELECT role, status, joined_at")) return role ? { role, status: "active" } : null;
              return null;
            },
            all: async () => {
              if (sql.includes("sqlite_master")) return { results: tables.map(name => ({ name })) };
              if (sql.includes("FROM commons_topics t")) return { results: rows };
              if (sql.includes("FROM commons_comments c")) return { results: comments };
              return { results: [] };
            },
            run: async () => ({ meta: { changes: 1 } })
          };
          return prepared;
        },
        all: async () => sql.includes("sqlite_master") ?
          { results: tables.map(name => ({ name })) } :
          sql.includes("FROM commons_topics t") ? { results: rows } :
          sql.includes("FROM commons_comments c") ? { results: comments } : { results: [] },
        first: async () => null
      };
    },
    batch: async () => [{ success: true }]
  };
  return { db, calls };
}
const request = (route, method = "GET", body) => new Request("https://anevum.com" + route, {
  method,
  headers: body ? { "content-type": "application/json", Origin: "https://anevum.com" } : undefined,
  body: body ? JSON.stringify(body) : undefined
});

test("Commons accepts only bounded, typed contributions, never user-selected roles or brokers", () => {
  assert.deepEqual(validateCommonsTopic({ ...sample, title: "  Can this rule survive costs?  " }), sample);
  assert.deepEqual(validateCommonsComment({ body: "  Reproduce on holdout data.  " }), { body: "Reproduce on holdout data." });
  for (const bad of [
    null, {}, [], { ...sample, authorId: "owner" },
    { ...sample, role: "moderator" }, { ...sample, brokerageAccountId: "other" },
    { ...sample, title: "Short" }, { ...sample, body: "Too short" },
    { ...sample, subject: "private-trades" }, { ...sample, kind: "signal" },
    { ...sample, title: "a".repeat(121) }, { ...sample, body: "b".repeat(3001) }
  ]) assert.throws(() => validateCommonsTopic(bad));
  for (const bad of [{}, { body: "" }, { body: "a".repeat(1501) }, { body: "Fine", userId: "other" }]) {
    assert.throws(() => validateCommonsComment(bad));
  }
});

test("Commons refuses unavailable or partially migrated D1", async () => {
  assert.equal(await commonsSchemaReady({}), false);
  assert.equal(await commonsSchemaReady({ prepare: () => ({ all: async () => ({ results: [{ name: "commons_topics" }] }) }) }), false);
  assert.equal(await commonsSchemaReady(mockDB().db), true);
  assert.equal(await commonsSchemaReady({ prepare: () => ({ all: async () => { throw new Error("offline"); } }) }), false);
});

test("Commons never opens accidentally with a missing feature flag", async () => {
  const spy = { prepare() { throw new Error("DB must not be accessed"); } };
  const overview = await commonsEndpoint(request("/api/member/commons"), { MEMBER_DB: spy }, user, "/api/member/commons");
  assert.equal(overview.status, 200);
  assert.deepEqual(await overview.json(), { available: false, status: "preparing", role: null, topics: [] });
  const submission = await commonsEndpoint(request("/api/member/commons/topics", "POST", sample),
    { MEMBER_DB: spy }, user, "/api/member/commons/topics");
  assert.equal(submission.status, 503);
  assert.equal(submission.headers.get("cache-control"), "private, no-store");
});

test("Uninvited or suspended signed-in users cannot view or publish member research", async () => {
  for (const options of [{ role: null }, { role: "contributor", active: false }]) {
    const { db, calls } = mockDB(options);
    const env = { MEMBER_DB: db, ANEVUM_COMMONS_ENABLED: "true" };
    const overview = await commonsEndpoint(request("/api/member/commons"), env, user, "/api/member/commons");
    assert.deepEqual(await overview.json(), { available: false, status: "invite_only", role: null, topics: [] });
    const post = await commonsEndpoint(request("/api/member/commons/topics", "POST", sample), env, user, "/api/member/commons/topics");
    assert.equal(post.status, 403);
    assert.ok(calls.every(({ sql }) => !sql.includes("INSERT INTO commons_topics")));
  }
});

test("Admitted member reads member-only research without exposing author identity IDs", async () => {
  const { db, calls } = mockDB({
    rows: [{ id: "a", title: "A clear test", kind: "question", subject: "algorithms", body: "Body",
      author: "Researcher", visibility: "members", commentCount: 0 }]
  });
  const response = await commonsEndpoint(request("/api/member/commons"),
    { MEMBER_DB: db, ANEVUM_COMMONS_ENABLED: "true" }, user, "/api/member/commons");
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.available, true);
  assert.equal(json.topics[0].author, "Researcher");
  assert.equal(Object.hasOwn(json.topics[0], "visibility"), false);
  assert.equal(Object.hasOwn(json.topics[0], "author_id"), false);
  assert.ok(calls.some(({ sql, args }) => sql.includes("FROM commons_members WHERE user_id = ?") && args[0] === user.id));
});

test("Topic writes are bound to verified server user and bounded per day", async () => {
  const { db, calls } = mockDB();
  const env = { MEMBER_DB: db, ANEVUM_COMMONS_ENABLED: "true" };
  const response = await commonsEndpoint(request("/api/member/commons/topics", "POST", sample), env, user, "/api/member/commons/topics");
  assert.equal(response.status, 201);
  const write = calls.find(({ sql }) => sql.includes("INSERT INTO commons_topics"));
  assert.ok(write);
  assert.equal(write.args[1], user.id);
  assert.equal(write.args[6], user.id);
  assert.match(write.sql, /created_at >= datetime\('now','-1 day'\)/);
  assert.match(write.sql, /COUNT\(\*\).*commons_topics/);
  const forged = await commonsEndpoint(request("/api/member/commons/topics", "POST", { ...sample, authorId: "owner" }), env, user, "/api/member/commons/topics");
  assert.equal(forged.status, 400);
});

test("Contributor cannot hide another member's research", async () => {
  const id = "22222222-2222-4222-8222-222222222222";
  const { db, calls } = mockDB({ topic: { id } });
  const response = await commonsEndpoint(request("/api/member/commons/topics/" + id, "PATCH", { hidden: true }),
    { MEMBER_DB: db, ANEVUM_COMMONS_ENABLED: "true" }, user, "/api/member/commons/topics/" + id);
  assert.equal(response.status, 405);
  assert.ok(calls.every(({ sql }) => !sql.startsWith("UPDATE commons")));
});

test("Account export is user-scoped and empty when Commons schema is unavailable", async () => {
  const absent = await exportCommonsData({}, user.id);
  assert.deepEqual(absent, { membership: null, topics: [], comments: [], reports: [] });
  const { db, calls } = mockDB();
  const exported = await exportCommonsData(db, user.id);
  assert.deepEqual(exported.topics, []);
  assert.ok(calls.filter(({ sql }) => sql.includes("FROM commons_")).every(({ args }) => args[0] === user.id));
});

test("New routes preserve production-off staging-on gating and cannot enter operator APIs", async () => {
  const production = JSON.parse(read("wrangler.jsonc"));
  const staging = JSON.parse(read("wrangler.member-staging.jsonc"));
  const app = read("src/App.tsx");
  const worker = read("worker.mjs");
  const member = read("src/server/member.mjs");
  const home = read("src/pages/HomeCompany.tsx");
  assert.equal(production.vars.ANEVUM_COMMONS_ENABLED, "false");
  assert.equal(staging.vars.ANEVUM_COMMONS_ENABLED, "true");
  assert.equal(production.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.match(app, /path="\/commons"/);
  assert.match(app, /path="\/commons\/topic\/:id"/);
  assert.match(worker, /privateOrArchived = pathname.startsWith\("\/commons"\)/);
  assert.match(member, /if \(pathname === "\/api\/member\/commons"/);
  assert.ok(member.indexOf("if (!user?.id)") < member.indexOf('pathname === "/api/member/commons"'));
  assert.doesNotMatch(read("src/server/commons.mjs"), /proxyTrader|TRADER_BASE|ALPACA_API_SECRET|brokerToken|executeOrder/);
  assert.match(home, /<Navigate to="\/commons" replace/);
  const response = await memberEndpoint(request("/api/member/commons"), { ANEVUM_MEMBERS_ENABLED: "false" }, "/api/member/commons");
  assert.equal(response.status, 503);
  assert.equal(safeMutation(request("/api/member/commons/topics", "POST", sample), "https://anevum.com"), true);
  const forged = new Request("https://anevum.com/api/member/commons/topics", { method: "POST", headers: { Origin: "https://external.example" } });
  assert.equal(safeMutation(forged, "https://anevum.com"), false);
});
