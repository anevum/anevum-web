import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  memberRhenWorkspaceSchemaReady, readMemberRhenWorkspace, createMemberRhenWorkspace
} from "../src/server/member-rhen-workspace.mjs";
import { parsePrivateFoundationWorkspace } from "../src/contracts/anevum-foundation.ts";
import { memberEndpoint, safeMutation, workspaceCreateHasClientPayload } from "../src/server/member.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

function memoryDb() {
  const rows = new Map();
  const calls = [];
  return {
    rows, calls,
    prepare(sql) {
      return {
        first: async () => {
          if (sql.includes("sqlite_master")) return { name: "member_rhen_workspaces" };
          throw new Error("Unexpected unbound SQL read");
        },
        bind(...args) {
          calls.push({ sql, args });
          return {
            run: async () => {
              if (!sql.includes("INSERT OR IGNORE")) throw new Error("Unexpected mutation");
              const [userId, workspaceId] = args;
              if (!rows.has(userId)) rows.set(userId, {
                workspaceId, createdAt: "2026-10-09T23:00:00.000Z"
              });
              return { success: true };
            },
            first: async () => {
              if (!sql.includes("WHERE user_id = ?")) throw new Error("Missing account boundary");
              return rows.get(args[0]) || null;
            }
          };
        }
      };
    }
  };
}

test("schema fails closed without preview D1 migration", async () => {
  assert.equal(await memberRhenWorkspaceSchemaReady(null), false);
  assert.equal(await memberRhenWorkspaceSchemaReady({ prepare: () => ({
    first: async () => { throw new Error("unavailable"); }
  }) }), false);
  assert.equal(await memberRhenWorkspaceSchemaReady(memoryDb()), true);
});

test("two authenticated users receive unique durable IDs and no authority", async () => {
  const db = memoryDb();
  assert.equal(await readMemberRhenWorkspace(db, "member-a"), null);
  const a = await createMemberRhenWorkspace(db, "member-a");
  const b = await createMemberRhenWorkspace(db, "member-b");
  const aAgain = await createMemberRhenWorkspace(db, "member-a");

  assert.match(a.workspace_id, /^wrk_[a-f0-9]{32}$/);
  assert.notEqual(a.workspace_id, b.workspace_id);
  assert.equal(a.workspace_id, aAgain.workspace_id);
  assert.equal(db.rows.size, 2);
  assert.equal(await readMemberRhenWorkspace(db, "not-a-member"), null);
  assert.equal(parsePrivateFoundationWorkspace(a, "member-a")?.workspace_id, a.workspace_id);
  assert.equal(parsePrivateFoundationWorkspace(b, "member-b")?.workspace_id, b.workspace_id);
  assert.equal(parsePrivateFoundationWorkspace(a, "member-b"), null);
  assert.equal(a.execution_permission, "NONE");
  assert.equal(a.broker_link_state, "NOT_LINKED");
  assert.equal(a.evidence_state, "NOT_CONFIGURED");
  assert.deepEqual(a.capabilities, ["VIEW"]);
  assert.equal("brokerToken" in a, false);
  assert.equal("admin" in a, false);

  for (const call of db.calls) {
    assert.equal(call.args.length, 1 + Number(call.sql.includes("INSERT OR IGNORE")));
    assert.match(call.sql, /user_id/);
    if (!call.sql.includes("INSERT OR IGNORE")) assert.match(call.sql, /WHERE user_id = \?/);
  }
});

test("tampered stored workspace identity fails closed", async () => {
  const db = memoryDb();
  db.rows.set("member-a", { workspaceId: "owner-terminal", createdAt: "2026-10-09T23:00:00.000Z" });
  await assert.rejects(readMemberRhenWorkspace(db, "member-a"), /invalid/);
  db.rows.set("member-a", { workspaceId: "wrk_" + "a".repeat(32), createdAt: "not-a-date" });
  await assert.rejects(readMemberRhenWorkspace(db, "member-a"), /invalid/);
  for (const bad of [null, "", 123]) {
    await assert.rejects(createMemberRhenWorkspace(db, bad), /Verified member ID/);
  }
});

test("allocation is feature-gated after Better Auth, disallows client-selected scope", async () => {
  const server = read("src/server/member.mjs");
  const route = server.indexOf('pathname === "/api/member/rhen/workspace"');
  assert.ok(route > server.indexOf("if (!user?.id)"));
  assert.match(server, /ANEVUM_V5_WORKSPACES_ENABLED !== "true"/);
  assert.match(server, /new URL\(request.url\).search/);
  assert.match(server, /await workspaceCreateHasClientPayload\(request\)/);
  assert.match(server, /createMemberRhenWorkspace\(db, user.id\)/);
  assert.match(server, /readMemberRhenWorkspace\(db, user.id\)/);
  assert.doesNotMatch(read("src/server/member-rhen-workspace.mjs"), /Alpaca|order.*submit|tradingEnabled/);
  const origin = "https://anevum.com";
  assert.equal(safeMutation(new Request(origin + "/api/member/rhen/workspace", {
    method: "POST", headers: { Origin: origin }
  }), origin), true);
  assert.equal(safeMutation(new Request(origin + "/api/member/rhen/workspace", {
    method: "POST", headers: { Origin: "https://attacker.example" }
  }), origin), false);
  const anonymous = await memberEndpoint(
    new Request(origin + "/api/member/rhen/workspace"),
    { ANEVUM_MEMBERS_ENABLED: "false", ANEVUM_V5_WORKSPACES_ENABLED: "true" },
    "/api/member/rhen/workspace"
  );
  assert.equal(anonymous.status, 503);
  assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
});

test("only preview enables member workspace allocation and schema remains broker-free", () => {
  const production = JSON.parse(read("wrangler.jsonc"));
  const preview = JSON.parse(read("wrangler.member-staging.jsonc"));
  assert.equal(production.vars.ANEVUM_V5_WORKSPACES_ENABLED, "false");
  assert.equal(preview.vars.ANEVUM_V5_WORKSPACES_ENABLED, "true");
  assert.notEqual(production.d1_databases[0].database_id, preview.d1_databases[0].database_id);
  const migration = read("migrations/0003_member_rhen_workspaces.sql");
  assert.match(migration, /REFERENCES "user"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /workspace_id TEXT NOT NULL UNIQUE/);
  assert.doesNotMatch(migration, /access_token|broker_account|trading_order/);
  const ui = read("src/pages/RhenApp.tsx");
  assert.match(ui, /parsePrivateFoundationWorkspace/);
  assert.match(ui, /Create private workspace/);
  assert.match(ui, /Research, paper execution, and brokerage linking are not activated/);
});


test("zero-byte browser and Worker stream POSTs are allowed without introducing client-selected scope", async () => {
  const origin = "https://anevum-member-staging.devonakins.workers.dev";
  const url = origin + "/api/member/rhen/workspace";
  const base = { method: "POST", headers: { Origin: origin } };
  const withBody = (body) => new Request(url, {
    ...base, body, ...(body instanceof ReadableStream ? { duplex: "half" } : {})
  });
  const stream = (...parts) => new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    }
  });
  const bytes = (value) => new TextEncoder().encode(value);

  assert.equal(await workspaceCreateHasClientPayload(new Request(url, base)), false);
  // Browser fetch may send an empty string body represented as a stream.
  const browserEmpty = withBody("");
  assert.notEqual(browserEmpty.body, null);
  assert.equal(await workspaceCreateHasClientPayload(browserEmpty), false);

  // Cloudflare can supply an empty body ReadableStream for Content-Length: 0.
  const edgeEmpty = withBody(stream());
  assert.notEqual(edgeEmpty.body, null);
  assert.equal(await workspaceCreateHasClientPayload(edgeEmpty), false);
  assert.equal(await workspaceCreateHasClientPayload(withBody(stream(new Uint8Array(0)))), false);
  assert.equal(await workspaceCreateHasClientPayload(
    withBody(stream(new Uint8Array(0), new Uint8Array(0)))
  ), false);

  // Any data, including whitespace and a forged client owner, must be denied.
  for (const value of ["{}", " ", "\n", '{"member_id":"another-account"}',
    '{"workspace_id":"wrk_forged"}', '{"broker_account":"invalid"}']) {
    assert.equal(await workspaceCreateHasClientPayload(withBody(value)), true);
  }
  assert.equal(await workspaceCreateHasClientPayload(
    withBody(stream(new Uint8Array(0), bytes('{"member_id":"another-account"}')))
  ), true);
});

test("workspace zero-byte body probe fails closed on malformed, unreadable or excessive streams", async () => {
  const origin = "https://anevum-member-staging.devonakins.workers.dev";
  const url = origin + "/api/member/rhen/workspace";
  const bodyRequest = (body) => new Request(url, { method: "POST", body, duplex: "half" });
  const errorStream = new ReadableStream({
    start(controller) { controller.error(new Error("PRIVATE_BODY_DETAIL")); }
  });
  assert.equal(await workspaceCreateHasClientPayload(bodyRequest(errorStream)), true);
  const tooManyEmptyChunks = new ReadableStream({
    start(controller) {
      for (let i = 0; i < 9; i++) controller.enqueue(new Uint8Array(0));
    }
  });
  assert.equal(await workspaceCreateHasClientPayload(bodyRequest(tooManyEmptyChunks)), true);
  // Reading a previously locked stream cannot accidentally provision a tenant.
  const locked = bodyRequest(new ReadableStream({ start(c) { c.close(); } }));
  const reader = locked.body.getReader();
  try { assert.equal(await workspaceCreateHasClientPayload(locked), true); }
  finally { reader.releaseLock(); }
});
