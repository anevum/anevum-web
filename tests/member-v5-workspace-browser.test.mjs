import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runWorkspaceStagingProof, WorkspaceStagingFailure, WORKSPACE_STAGING_ORIGIN } from "../src/member/workspace-staging-acceptance.ts";

const headers = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "content-type": "application/json"
};
const reply = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, { status, headers: { ...headers, ...extraHeaders } });
const name = "wrk_" + "a".repeat(32);
const workspace = (memberId, overrides = {}) => ({
  schema_version: "anevum.workspace-state.v1",
  workspace_id: name,
  member_id: memberId,
  workspace_kind: "MEMBER_PRIVATE",
  engine_source: "RHEN_NEXT",
  evidence_state: "NOT_CONFIGURED",
  execution_permission: "NONE",
  broker_link_state: "NOT_LINKED",
  capabilities: ["VIEW"],
  updated_at: "2026-10-10T04:00:00.000Z",
  ...overrides
});
function stage(memberId, options = {}) {
  let stored = options.initial ?? null;
  let creates = 0;
  const calls = [];
  const fetcher = async (path, init) => {
    calls.push({path,method:init.method,credentials:init.credentials,body:init.body});
    assert.equal(init.credentials, "same-origin");
    assert.equal(init.redirect, "manual");
    assert.equal(init.cache, "no-store");
    if (path === "/api/member/session")
      return reply({authenticated:true,user:{id:options.sessionId ?? memberId}});
    if (path === "/api/member/rhen/workspace?member_id=other")
      return reply({message:"Workspace selection is not supported"},options.acceptSelector?200:400);
    if (path === "/api/member/rhen/workspace") {
      if (init.method === "POST" && init.body !== undefined)
        return reply({message:"No client fields"},400);
      if (init.method === "POST") {
        creates++;
        if (!stored) stored=workspace(options.workspaceOwner ?? memberId, options.workspaceOverrides);
      }
      return reply({available:true,workspace:stored},200,options.cacheable?{"cache-control":"public,max-age=60"}:{});
    }
    if (path === "/api/member/export")
      return reply({identity:{id:options.exportOwner??memberId},rhenWorkspace:stored});
    throw new Error("Unexpected API route: " + path);
  };
  return {fetcher,calls,get creates(){return creates},get stored(){return stored}};
}

test("real browser proof uses only same-origin session, repeated POST, owner-bound export and local digest",async()=>{
  const env=stage("member-A");
  const result=await runWorkspaceStagingProof(env.fetcher,"member-A",WORKSPACE_STAGING_ORIGIN);
  assert.equal(result.passed,true);
  assert.equal(result.checks.length,7);
  assert.match(result.proofCode,/^[0-9a-f]{32}$/);
  assert.equal(env.creates,2);
  assert.ok(env.stored.workspace_id.startsWith("wrk_"));
  assert.deepEqual(env.calls.map(x=>x.path),[
    "/api/member/session","/api/member/rhen/workspace",
    "/api/member/rhen/workspace","/api/member/rhen/workspace",
    "/api/member/rhen/workspace?member_id=other",
    "/api/member/rhen/workspace","/api/member/rhen/workspace",
    "/api/member/export"
  ]);
  assert.equal(env.calls.every(x=>x.credentials==="same-origin"),true);
  assert.doesNotMatch(JSON.stringify(result),/member-A|wrk_|token|cookie/i);
});

test("existing workspace remains identical and yields the same non-secret comparison fingerprint",async()=>{
  const a=stage("member-A",{initial:workspace("member-A")});
  const b=stage("member-A",{initial:workspace("member-A")});
  const reportA=await runWorkspaceStagingProof(a.fetcher,"member-A",WORKSPACE_STAGING_ORIGIN);
  const reportB=await runWorkspaceStagingProof(b.fetcher,"member-A",WORKSPACE_STAGING_ORIGIN);
  assert.equal(reportA.proofCode,reportB.proofCode);
  assert.equal(a.stored.workspace_id,name);
});

test("two members with distinct workspace IDs yield different comparison codes",async()=>{
  const a=stage("member-A",{initial:workspace("member-A")});
  const b=stage("member-B",{initial:workspace("member-B",{workspace_id:"wrk_"+"b".repeat(32)})});
  const x=await runWorkspaceStagingProof(a.fetcher,"member-A",WORKSPACE_STAGING_ORIGIN);
  const y=await runWorkspaceStagingProof(b.fetcher,"member-B",WORKSPACE_STAGING_ORIGIN);
  assert.notEqual(x.proofCode,y.proofCode);
});

test("session mixup, another member's workspace or export, or elevated rights fail closed",async()=>{
  const fixtures=[
    stage("member-A",{sessionId:"member-B"}),
    stage("member-A",{workspaceOwner:"member-B"}),
    stage("member-A",{exportOwner:"member-B"}),
    stage("member-A",{workspaceOverrides:{execution_permission:"PAPER_ONLY",capabilities:["VIEW","PAPER"]}}),
    stage("member-A",{workspaceOverrides:{broker_link_state:"READ_ONLY"}}),
    stage("member-A",{workspaceOverrides:{workspace_kind:"FOUNDER_PRIVATE"}}),
    stage("member-A",{acceptSelector:true}),
    stage("member-A",{cacheable:true}),
  ];
  for (const x of fixtures) {
    await assert.rejects(
      runWorkspaceStagingProof(x.fetcher,"member-A",WORKSPACE_STAGING_ORIGIN)
    );
  }
});

test("staging origin and account identity are checked before any request",async()=>{
  let calls=0;
  const fetcher=async()=>{calls++;throw Error("unexpected request");};
  await assert.rejects(runWorkspaceStagingProof(fetcher,"member-A","https://anevum.com"),/staging-only/);
  await assert.rejects(runWorkspaceStagingProof(fetcher,"","https://anevum-member-staging.devonakins.workers.dev"),/authenticated/);
  assert.equal(calls,0);
});

test("verification UI exposes an explicitly consented write and keeps read-only probe separate",()=>{
  const page=readFileSync(new URL("../src/pages/MemberStagingVerify.tsx",import.meta.url),"utf8");
  assert.match(page,/window\.location\.origin !== STAGING_ORIGIN/);
  assert.match(page,/Run read-only checks/);
  assert.match(page,/Create and verify private RHEN workspace/);
  assert.match(page,/Comparison code \(not a login credential\)/);
  assert.match(page,/different Google test account/);
  assert.match(page,/This comparison alone does not prove complete cross-user access isolation/);
});


test("real API status failures report the exact stage without leaking response or identity", async () => {
  const cases = [
    { path: "/api/member/session", method: "GET", status: 401, step: "SESSION" },
    { path: "/api/member/rhen/workspace", method: "GET", status: 503, step: "INITIAL_READ" },
    { path: "/api/member/rhen/workspace", method: "POST", status: 403, step: "CREATE" },
    { path: "/api/member/rhen/workspace?member_id=other", method: "GET", status: 429, step: "DENY_QUERY" },
    { path: "/api/member/export", method: "GET", status: 500, step: "EXPORT" }
  ];
  for (const expected of cases) {
    const env = stage("member-A");
    const proxy = async (path, init) => {
      if (path === expected.path && init.method === expected.method) {
        return reply({ secretResponseBody: "DO_NOT_PRINT", member_id: "member-A" }, expected.status);
      }
      return env.fetcher(path, init);
    };
    await assert.rejects(
      runWorkspaceStagingProof(proxy, "member-A", WORKSPACE_STAGING_ORIGIN),
      error => {
        assert.ok(error instanceof WorkspaceStagingFailure);
        assert.equal(error.step, expected.step);
        assert.equal(error.reason, "HTTP_" + expected.status);
        assert.doesNotMatch(JSON.stringify({
          step: error.step, reason: error.reason, message: error.message
        }), /DO_NOT_PRINT|member-A|wrk_|cookie|secretResponseBody/i);
        return true;
      }
    );
  }
});

test("unknown network failures, invalid content and stale sessions produce bounded codes", async () => {
  const base = stage("member-A");
  await assert.rejects(
    runWorkspaceStagingProof(async (path, init) => {
      if (path === "/api/member/session") throw new Error("SESSION_COOKIE_PRIVATE_VALUE");
      return base.fetcher(path, init);
    }, "member-A", WORKSPACE_STAGING_ORIGIN),
    error => error instanceof WorkspaceStagingFailure &&
      error.step === "SESSION" &&
      error.reason === "NETWORK_ERROR" &&
      !JSON.stringify(error).includes("SESSION_COOKIE_PRIVATE_VALUE")
  );

  const other = stage("member-A", { sessionId: "member-B" });
  await assert.rejects(
    runWorkspaceStagingProof(other.fetcher, "member-A", WORKSPACE_STAGING_ORIGIN),
    error => error instanceof WorkspaceStagingFailure &&
      error.step === "SESSION" && error.reason === "SESSION_MISMATCH"
  );

  await assert.rejects(
    runWorkspaceStagingProof(async (path, init) => {
      if (path === "/api/member/session")
        return new Response("{private-malformed-json", {
          status: 200, headers: headers
        });
      return base.fetcher(path, init);
    }, "member-A", WORKSPACE_STAGING_ORIGIN),
    error => error instanceof WorkspaceStagingFailure &&
      error.step === "SESSION" && error.reason === "INVALID_JSON"
  );

  await assert.rejects(
    runWorkspaceStagingProof(async (path, init) => {
      if (path === "/api/member/session")
        return reply({ authenticated: true, user: { id: "member-A" } }, 200, {
          "cache-control": "public, max-age=60"
        });
      return base.fetcher(path, init);
    }, "member-A", WORKSPACE_STAGING_ORIGIN),
    error => error instanceof WorkspaceStagingFailure &&
      error.step === "SESSION" && error.reason === "PRIVATE_HEADERS"
  );
});

test("staging diagnostic UI displays only finite codes and never raw error payloads", () => {
  const src = readFileSync(new URL("../src/pages/MemberStagingVerify.tsx", import.meta.url), "utf8");
  assert.match(src, /failure instanceof WorkspaceStagingFailure/);
  assert.match(src, /failure.step \+ " \/ " \+ failure.reason/);
  assert.match(src, /No release approval was granted/);
  assert.doesNotMatch(src, /setWorkspaceError\([^)]*failure\.message/);
});
