import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateRhenDraft, memberRhenDraftSchemaReady,
  readMemberRhenDraft, saveMemberRhenDraft, deleteMemberRhenDraft
} from "../src/server/member-rhen-draft.mjs";
import { memberEndpoint } from "../src/server/member.mjs";

const valid = {
  label: "Long-only research",
  maxOpenPositions: 2,
  maxTotalExposurePercent: 30,
  maxPositionPercent: 10
};

test("configuration drafts normalize labels and do not accept an execution mode", () => {
  assert.deepEqual(validateRhenDraft({ ...valid, label: "  Own research  " }), { ...valid, label: "Own research" });
  for (const value of [
    {}, { ...valid, userId: "other-account" }, { ...valid, executionEnabled: true },
    { ...valid, brokerToken: "private" }, { ...valid, direction: "short" },
    { ...valid, maxOpenPositions: 0 }, { ...valid, maxOpenPositions: 1.5 },
    { ...valid, maxOpenPositions: "2" }, { ...valid, maxOpenPositions: 11 },
    { ...valid, maxTotalExposurePercent: 0 }, { ...valid, maxTotalExposurePercent: 101 },
    { ...valid, maxPositionPercent: 101 }, { ...valid, maxPositionPercent: 31 },
    { ...valid, label: "" }, { ...valid, label: "a".repeat(49) },
    { ...valid, maxPositionPercent: Number.NaN }, null, []
  ]) assert.throws(() => validateRhenDraft(value));
});

test("schema readiness refuses missing and unavailable member draft table", async () => {
  assert.equal(await memberRhenDraftSchemaReady({}), false);
  assert.equal(await memberRhenDraftSchemaReady({
    prepare: () => ({ first: async () => ({ name: "member_rhen_drafts" }) })
  }), true);
  assert.equal(await memberRhenDraftSchemaReady({
    prepare: () => ({ first: async () => ({ name: "other" }) })
  }), false);
  assert.equal(await memberRhenDraftSchemaReady({
    prepare: () => ({ first: async () => { throw new Error("unavailable"); } })
  }), false);
});

test("every draft SQL read/write/delete is scoped to the authenticated user id", async () => {
  const calls = [];
  const db = { prepare(sql) {
    return { bind(...args) {
      calls.push({ sql, args });
      return { run: async () => ({ success: true }), first: async () => ({
        label: valid.label, maxOpenPositions: valid.maxOpenPositions,
        maxTotalExposurePercent: valid.maxTotalExposurePercent,
        maxPositionPercent: valid.maxPositionPercent
      }) };
    } };
  } };
  await saveMemberRhenDraft(db, "member-a", valid);
  await readMemberRhenDraft(db, "member-b");
  await deleteMemberRhenDraft(db, "member-a");
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map(call => call.args[0]), ["member-a", "member-a", "member-b", "member-a"]);
  assert.ok(calls.every(call => call.sql.includes("user_id")));
  assert.ok(calls[0].sql.includes("ON CONFLICT(user_id)"));
});

test("draft endpoint has no access before member activation", async () => {
  for (const method of ["GET", "PUT", "DELETE"]) {
    const req = new Request("https://anevum.com/api/member/rhen/draft", {
      method,
      headers: method === "PUT" ? { "content-type": "application/json" } : undefined,
      body: method === "PUT" ? JSON.stringify(valid) : undefined
    });
    const response = await memberEndpoint(req, { ANEVUM_MEMBERS_ENABLED: "false" }, "/api/member/rhen/draft");
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
});

test("member drafts cannot reach RHEN operator endpoint or browser secrets", () => {
  const members = readFileSync(new URL("../src/server/member.mjs", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../src/pages/RhenDraft.tsx", import.meta.url), "utf8");
  const prod = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const staging = JSON.parse(readFileSync(new URL("../wrangler.member-staging.jsonc", import.meta.url), "utf8"));
  assert.ok(members.indexOf("if (!user?.id)") < members.indexOf('pathname === "/api/member/rhen/draft"'));
  assert.match(members, /memberRhenDraftSchemaReady\(db\)/);
  assert.match(ui, /Configuration only/);
  assert.match(ui, /does not control the operator/);
  assert.doesNotMatch(ui, /api\/command|api\/trader|accessToken|alpacaKey/);
  assert.equal(prod.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "false");
  assert.equal(staging.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "true");
});
