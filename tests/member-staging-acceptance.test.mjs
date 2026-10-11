import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runStagingAcceptance } from "../src/member/staging-acceptance.ts";

const path = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const privateHeaders = { "content-type": "application/json", "cache-control": "private, no-store", "x-robots-tag": "noindex,nofollow" };

function sampleData() {
  return {
    "/api/member/session": { authenticated: true, user: { id: "account-a", email: "never-log@example.test" } },
    "/api/member/me": { user: { id: "account-a" }, profile: { displayName: "Member A" } },
    "/api/member/export": { identity: { id: "account-a" }, rhenDraft: null },
    "/api/member/rhen/draft": { available: true, draft: null, executionEnabled: false, brokerageConnected: false },
    "/api/member/rewards": { program: "not_launched", earningEnabled: false, payoutEnabled: false, availableBalanceCents: null },
    "/api/member/brokerage": {
      integration: "unavailable", connectionAvailable: false, accountConnected: false,
      paperTradingEnabled: false, liveTradingEnabled: false,
      depositsEnabled: false, withdrawalsEnabled: false, account: null
    }
  };
}

function fakeFetcher(data, options = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (url === "/api/command/trader/status")
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: options.operatorStatus ?? 401, headers: privateHeaders });
    if (!Object.hasOwn(data, url)) return new Response("Missing", { status: 404 });
    const headers = options.publicCache && url === "/api/member/me" ? { "content-type": "application/json" } : privateHeaders;
    return new Response(JSON.stringify(data[url]), { status: 200, headers });
  };
  return { fetcher, calls };
}

test("live staging read-only checks succeed with a single consistent member identity", async () => {
  const f = fakeFetcher(sampleData());
  const status = await runStagingAcceptance(f.fetcher);
  assert.equal(status.passed, true);
  assert.equal(status.checks.length, 7);
  assert.ok(status.checks.every(check => check.passed));
  assert.equal(f.calls.length, 7);
  assert.ok(f.calls.every(({ url, init }) => url.startsWith("/") && init.method === "GET"
    && init.credentials === "same-origin" && init.cache === "no-store"));
  assert.doesNotMatch(JSON.stringify(status), /account-a|never-log@example.test|cookie|token/i);
});

test("isolation check rejects a profile or data export owned by another account", async () => {
  for (const route of ["/api/member/me", "/api/member/export"]) {
    const d = sampleData();
    if (route.endsWith("me")) d[route].user.id = "account-b";
    else d[route].identity.id = "account-b";
    const report = await runStagingAcceptance(fakeFetcher(d).fetcher);
    assert.equal(report.passed, false, route);
    assert.equal(report.checks.filter(x => !x.passed).length, 1, route);
  }
});

test("no read-only acceptance can pass with broker-write or payout authority enabled", async () => {
  for (const [route,field,value] of [
    ["/api/member/rewards","payoutEnabled",true],
    ["/api/member/brokerage","liveTradingEnabled",true],
    ["/api/member/rhen/draft","executionEnabled",true]
  ]) {
    const d=sampleData();
    d[route][field]=value;
    assert.equal((await runStagingAcceptance(fakeFetcher(d).fetcher)).passed, false);
  }
});

test("operator access or cacheable member responses cause explicit acceptance failure", async () => {
  const d=sampleData();
  assert.equal((await runStagingAcceptance(fakeFetcher(d, { operatorStatus: 200 }).fetcher)).passed, false);
  assert.equal((await runStagingAcceptance(fakeFetcher(d, { publicCache: true }).fetcher)).passed, false);
});

test("new staging acceptance UI cannot unlock production registration or alter data", () => {
  const page = path("src/pages/MemberStagingVerify.tsx");
  const app = path("src/App.tsx");
  const settings = path("src/pages/MemberSettings.tsx");
  const prod = JSON.parse(path("wrangler.jsonc"));
  assert.match(page, /ALLOWED_ACCEPTANCE_ORIGINS\.has\(window\.location\.origin\)/);
  assert.match(page, /https:\/\/anevum-v5-beta\.devonakins\.workers\.dev/);
  assert.match(page, /read-only checks/i);
  assert.match(page, /does not independently prove cross-user isolation/i);
  assert.match(app, /path="\/me\/verify"/);
  assert.match(settings, /to="\/me\/verify"/);
  assert.equal(prod.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(prod.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED, "false");
  assert.doesNotMatch(path("src/member/staging-acceptance.ts"), /method: "(?:PUT|POST|PATCH|DELETE)"|api\/auth\/sign-in|createOrder/);
});

test("current staging verification cannot accept a different signed-in identity",async()=>{
  const fixture=fakeFetcher(sampleData());
  const result=await runStagingAcceptance(fixture.fetcher,"account-b");
  assert.equal(result.passed,false);
  assert.equal(result.checks[0].passed,false);
  assert.equal(result.checks[1].passed,false);
  assert.equal(result.checks[2].passed,false);
  assert.doesNotMatch(JSON.stringify(result),/account-a|account-b|cookie|token/i);
});

test("stale/cancelled staging checks are never reported as passed",async()=>{
  const controller=new AbortController();
  controller.abort();
  const stage=fakeFetcher(sampleData());
  const report=await runStagingAcceptance(stage.fetcher,"account-a",controller.signal);
  assert.equal(report.passed,false);
  assert.equal(report.checks[0].passed,false);
  assert.equal(stage.calls.length,0);
  assert.doesNotMatch(JSON.stringify(report),/account-a|cookie|token/i);
});

test("staging verification state is keyed to a Google member and aborts old work",()=>{
  const ui=path("src/pages/MemberStagingVerify.tsx");
  assert.match(ui,/<StagingAccountAcceptance key=\{session\.user\.id\} memberId=\{session\.user\.id\}/);
  assert.match(ui,/for \(const controller of inFlight\.current\) controller\.abort\(\)/);
  assert.match(ui,/runStagingAcceptance\(fetch, memberId, controller\.signal\)/);
  assert.match(ui,/ALLOWED_ACCEPTANCE_ORIGINS\.has\(window\.location\.origin\)/);
  assert.match(ui,/runWorkspaceStagingProof\(\s*fetch, memberId, window\.location\.origin, undefined, controller\.signal/);
  assert.doesNotMatch(ui,/setReport\(await runStagingAcceptance\(fetch\)\)/);
});


test("late session response cannot convert a signed-out verification into a PASS",async()=>{
  const controller=new AbortController();
  const original=fakeFetcher(sampleData());
  let calls=0;
  const fetcher=async(url,init)=>{
    calls++;
    if(url==="/api/member/session"){
      const response=await original.fetcher(url,init);
      controller.abort();
      // Simulate a provider that returns a queued response despite cancellation.
      return response;
    }
    return original.fetcher(url,init);
  };
  const result=await runStagingAcceptance(fetcher,"account-a",controller.signal);
  assert.equal(result.passed,false);
  assert.equal(result.checks[0].passed,false);
  assert.ok(calls>=1);
  assert.doesNotMatch(JSON.stringify(result),/account-a|never-log|cookie|token/i);
});
