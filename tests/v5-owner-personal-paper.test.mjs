import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {observeOwnerPersonalPaper,personalPaperConfigured} from "../src/server/owner-personal-paper.mjs";
import {verifiedOwnerPaperStatus} from "../src/member/owner-paper-status.ts";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const env={
  ANEVUM_OWNER_PAPER_OBSERVER_ENABLED:"true",
  ANEVUM_MEMBER_PREVIEW_ENABLED:"true",
  ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED:"true",
  MEMBER_PREVIEW_ORIGIN:"https://anevum-member-staging.devonakins.workers.dev",
  OWNER_PERSONAL_PAPER_API_KEY_ID:"PAPER_TEST_KEY_ID",
  OWNER_PERSONAL_PAPER_API_SECRET_KEY:"PAPER_FAKE_TEST_SECRET"
};
test("developer paper observation is strictly staging-only and explicitly enabled",async()=>{
  assert.equal(personalPaperConfigured(env),true);
  for(const delta of [
    {ANEVUM_OWNER_PAPER_OBSERVER_ENABLED:"false"},
    {ANEVUM_MEMBER_PREVIEW_ENABLED:"false"},
    {ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED:"false"},
    {MEMBER_PREVIEW_ORIGIN:"https://anevum.com"},
    {MEMBER_PREVIEW_ORIGIN:"http://anevum-member-staging.devonakins.workers.dev"},
    {OWNER_PERSONAL_PAPER_API_KEY_ID:undefined},
    {OWNER_PERSONAL_PAPER_API_SECRET_KEY:undefined}
  ]) {
    let fetched=false;
    const result=await observeOwnerPersonalPaper({...env,...delta},async()=>{fetched=true;throw Error("No connection allowed");});
    assert.equal(result.status,503);
    assert.equal(fetched,false);
  }
  assert.equal(JSON.parse(source("wrangler.jsonc")).vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
  assert.equal(JSON.parse(source("wrangler.member-staging.jsonc")).vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
});
test("paper account transport has one fixed GET endpoint and never returns provider secrets",async()=>{
  let count=0;
  const answer=await observeOwnerPersonalPaper(env,async(url,opts)=>{
    count++;
    assert.equal(url,"https://paper-api.alpaca.markets/v2/account");
    assert.equal(opts.method,"GET");
    assert.equal(opts.redirect,"error");
    assert.equal(opts.cache,"no-store");
    assert.equal(opts.credentials,"omit");
    assert.equal(opts.headers["APCA-API-KEY-ID"],env.OWNER_PERSONAL_PAPER_API_KEY_ID);
    assert.equal(opts.headers["APCA-API-SECRET-KEY"],env.OWNER_PERSONAL_PAPER_API_SECRET_KEY);
    return Response.json({account_number:"ABC123456789",status:"ACTIVE",currency:"USD",
      id:"FULL_PRIVATE_BROKER_ID",equity:"123456.78",email:"test-private@example.test"});
  });
  assert.equal(count,1);
  assert.equal(answer.status,200);
  assert.equal(answer.headers.get("Cache-Control"),"private, no-store");
  assert.match(answer.headers.get("X-Robots-Tag"),/noindex/);
  const body=await answer.json();
  assert.deepEqual(body,{available:true,paper:true,executionEnabled:false,
    account:{ending:"6789",environment:"paper",status:"ACTIVE"}});
  for(const secret of [env.OWNER_PERSONAL_PAPER_API_SECRET_KEY,"FULL_PRIVATE_BROKER_ID","ABC123456789",
    "123456.78","test-private@example.test"])assert.doesNotMatch(JSON.stringify(body),new RegExp(secret.replaceAll(".","\\.")));
});
test("provider denial, unexpected authority and malformed upstream fail closed",async()=>{
  for(const upstream of [
    Response.json({message:"bad credentials",secret:"forbidden"},{status:403}),
    Response.json({account_number:"full_secret",status:"ACTIVE",currency:"USD"}),
    Response.json({account_number:"abc123",status:"OPENED",currency:"BTC"}),
    Response.json({account_number:"abc123",status:"ACTIVE",currency:"EUR"}),
    new Response("not-json",{status:200}),
    new Response("x".repeat(66000),{status:200})
  ]) {
    const response=await observeOwnerPersonalPaper(env,async()=>upstream.clone());
    assert.equal(response.status,503);
    const data=await response.json();
    assert.equal(data.available,false);
    assert.equal(data.executionEnabled,false);
    assert.doesNotMatch(JSON.stringify(data),/forbidden|secret|BTC|EUR|not-json/);
  }
});
test("worker route enforces exact verified Access/member before paper read",()=>{
  const worker=source("worker.mjs");
  const start=worker.indexOf('if (pathname === "/api/member/owner-paper/status")');
  const end=worker.indexOf('if (pathname.startsWith("/api/member/")',start);
  assert.ok(start>0&&end>start);
  const route=worker.slice(start,end);
  assert.match(route,/request\.method !== "GET"/);
  assert.match(route,/url\.search/);
  assert.match(route,/ANEVUM_OWNER_PAPER_OBSERVER_ENABLED/);
  assert.ok(route.indexOf("await commandCredential(request, env)")>=0);
  assert.ok(route.indexOf("await commandCredential(request, env)")<route.indexOf("observeOwnerPersonalPaper(env)"));
  assert.match(route,/credential\.ownerMemberBound/);
  const backend=source("src/server/owner-personal-paper.mjs");
  assert.doesNotMatch(backend,/\/v2\/orders|submitOrder|placeOrder|\/v2\/positions/);
  assert.doesNotMatch(source("src/commons/CommonsPages.tsx"),/\balpaca\b/i);
});

test("private beta accepts only masked PAPER status after owner/member authorization",()=>{
  assert.deepEqual(verifiedOwnerPaperStatus({
    available:true,paper:true,executionEnabled:false,
    account:{ending:"1234",environment:"paper",status:"ACTIVE"}
  }),{accountEnding:"1234",providerStatus:"ACTIVE"});
  for(const value of [
    {available:true,paper:true,executionEnabled:true,account:{ending:"1234",environment:"paper",status:"ACTIVE"}},
    {available:true,paper:true,executionEnabled:false,account:{ending:"FULL1234",environment:"paper",status:"ACTIVE"}},
    {available:true,paper:true,executionEnabled:false,account:{ending:"1234",environment:"live",status:"ACTIVE"}},
    {available:true,paper:true,executionEnabled:false,account:{ending:"1234",environment:"paper",status:"ACTIVE",account_number:"FULL1234"}},
    {available:true,paper:true,executionEnabled:false,account:{ending:"1234",environment:"paper",status:"ACTIVE"},providerToken:"secret"}
  ]) assert.throws(()=>verifiedOwnerPaperStatus(value));
  const page=source("src/pages/OwnerPersonalPaperReadiness.tsx");
  assert.match(page,/owner_member_bound!==true/);
  assert.match(page,/command_admin!==true/);
  assert.match(page,/auth_source!=="cloudflare_access"/);
  assert.ok(page.indexOf('fetch("/api/command/session"')<page.indexOf('fetch("/api/member/owner-paper/status"'));
  assert.match(page,/controller\.abort\(\)/);
  assert.doesNotMatch(page,/\bPOST\b|\bPUT\b|\bDELETE\b|API_SECRET/);
  assert.match(source("src/pages/MemberBeta.tsx"),/<OwnerPersonalPaperReadiness memberId=\{memberId\}/);
});
