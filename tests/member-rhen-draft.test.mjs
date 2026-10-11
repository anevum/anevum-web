import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateRhenDraft, memberRhenDraftSchemaReady,
  readMemberRhenDraft, saveMemberRhenDraft, deleteMemberRhenDraft
} from "../src/server/member-rhen-draft.mjs";
import { memberEndpoint } from "../src/server/member.mjs";
import { parsePrivateDraftResponse } from "../src/member/private-rhen-draft-contract.ts";

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


test("RHEN member draft presentation accepts only exact non-executing, long-only fields",()=>{
  const safe={
    available:true,executionEnabled:false,brokerageConnected:false,
    draft:{
      label:"Own long-only research",marketScope:"us_equities_etfs",direction:"long_only",
      maxOpenPositions:2,maxTotalExposurePercent:30,maxPositionPercent:10,
      updatedAt:"2026-10-11 10:12:22"
    }
  };
  const result=parsePrivateDraftResponse(safe,true);
  assert.equal(result.draft.label,safe.draft.label);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.draft),true);
  assert.equal(parsePrivateDraftResponse({...safe,draft:null}).draft,null);
  assert.throws(()=>parsePrivateDraftResponse({...safe,draft:null},true));
  const bad=[
    {...safe,executionEnabled:true},
    {...safe,brokerageConnected:true},
    {...safe,brokerage:{token:"private"}},
    {...safe,draft:{...safe.draft,secret:"broker-private"}},
    {...safe,draft:{...safe.draft,direction:"short"}},
    {...safe,draft:{...safe.draft,marketScope:"crypto"}},
    {...safe,draft:{...safe.draft,label:""}},
    {...safe,draft:{...safe.draft,maxPositionPercent:40}},
    {...safe,draft:{...safe.draft,maxOpenPositions:100}},
    {...safe,draft:{...safe.draft,updatedAt:"javascript:alert(1)"}}
  ];
  for(const value of bad)assert.throws(()=>parsePrivateDraftResponse(value));
});

test("RHEN draft editor is member-keyed, abortable and server-rechecked before any write",()=>{
  const app=readFileSync(new URL("../src/pages/RhenApp.tsx",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../src/pages/RhenDraft.tsx",import.meta.url),"utf8");
  const server=readFileSync(new URL("../src/server/member.mjs",import.meta.url),"utf8");
  assert.match(app,/<RhenMemberWorkspace key=\{session\.user\.id\} memberId=\{session\.user\.id\}/);
  assert.match(app,/<RhenDraft key=\{memberId\} expectedMemberId=\{memberId\}/);
  assert.match(ui,/controller\.abort\(\)/);
  assert.match(ui,/scope\.current === controller/);
  assert.match(ui,/method: "GET", credentials: "same-origin"/);
  assert.match(ui,/method: "PUT", credentials: "same-origin"/);
  assert.match(ui,/method: "DELETE", credentials: "same-origin"/);
  assert.match(ui,/signal: controller\.signal/);
  assert.match(ui,/parsePrivateDraftResponse\(await response\.json\(\), true\)/);
  assert.match(ui,/X-ANEVUM-EXPECTED-MEMBER-ID/);
  assert.match(server,/request\.headers\.get\("X-ANEVUM-EXPECTED-MEMBER-ID"\) !== user\.id/);
  assert.match(server,/return reply\(\{ message: "Authenticated member changed\. Reload your draft\." \}, 409\)/);
  assert.match(server,/saveMemberRhenDraft\(db, user\.id, draft\)/);
  assert.match(server,/deleteMemberRhenDraft\(db, user\.id\)/);
  assert.doesNotMatch(ui,/\/v2\/orders|\/api\/command|accessToken|alpacaKey|executeOrder/);
});
