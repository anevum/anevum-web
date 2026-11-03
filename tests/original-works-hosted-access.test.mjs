import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkAccessPreviewGate, readRemotePreviewGate } from "../scripts/verify-original-works-hosted-access.mjs";

const appId = "17346277-606e-42dd-a65b-a031a122c006";
const workerId = "6df22e2260974268aef86c6988a152c5";
const accountId = "2f7ee83107240152097efd956a4e8335";
const token = "test-fake-token-not-a-credential";
const ownerPolicy = {
  decision:"allow",
  include:[{email:{email:"devon@anevum.com"}}],
  exclude:[],
  require:[]
};
const valid = () => ({
  pinnedAppId:appId, pinnedWorkerUuid:workerId, actualWorkerUuid:workerId,
  subdomain:{enabled:false,previews_enabled:true},
  app:{id:appId,type:"self_hosted",destinations:[{type:"preview_worker",worker_id:workerId}]},
  policies:[structuredClone(ownerPolicy)]
});

test("only exact Anevum website preview worker and owner-only Access policy pass", () => {
  assert.deepEqual(checkAccessPreviewGate(valid()),[]);
});

test("missing pinning or disabled remote previews always refuse hosted deployment", () => {
  for(const change of [
    input=>{input.pinnedAppId="";},
    input=>{input.pinnedWorkerUuid="";},
    input=>{input.pinnedWorkerUuid="6df22e22-6097-4268-aef8-6c6988a152c5";},
    input=>{input.actualWorkerUuid="6df22e22-6097-4268-aef8-6c6988a152c5";},
    input=>{input.subdomain.previews_enabled=false;},
    input=>{input.subdomain.previews_enabled=undefined;},
    input=>{input.actualWorkerUuid="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";}
  ]) {
    const input=valid();change(input);
    assert.ok(checkAccessPreviewGate(input).length>0);
  }
});

test("Cloudflare Worker tags must be compact hex, unlike Access app UUIDs", () => {
  assert.deepEqual(checkAccessPreviewGate(valid()),[]);
  const malformed=valid();
  malformed.pinnedWorkerUuid="6df22e22-6097-4268-aef8-6c6988a152c5";
  assert.deepEqual(checkAccessPreviewGate(malformed),["MISSING_PINNED_ACCESS_APPLICATION_OR_WORKER_ID"]);
  const invalidApp=valid();
  invalidApp.pinnedAppId=workerId;
  assert.deepEqual(checkAccessPreviewGate(invalidApp),["MISSING_PINNED_ACCESS_APPLICATION_OR_WORKER_ID"]);
});

test("preview Access must not protect a production worker or unrelated Worker ID", () => {
  for(const change of [
    input=>{input.app.id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";},
    input=>{input.app.type="public";},
    input=>{input.app.destinations[0].type="worker";},
    input=>{input.app.destinations[0].worker_id="6df22e22-6097-4268-aef8-6c6988a152c5";},
    input=>{input.app.destinations[0].worker_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";},
    input=>{input.app.destinations.push({type:"public",uri:"anevum.com"});}
  ]) {
    const input=valid();change(input);
    assert.ok(checkAccessPreviewGate(input).length>0);
  }
});

test("broad, missing and bypass Access policies fail closed", () => {
  for(const change of [
    input=>{input.policies=[];},
    input=>{input.policies=[{...ownerPolicy,decision:"bypass"}];},
    input=>{input.policies[0].include=[{everyone:{}}];},
    input=>{input.policies[0].include=[{email_domain:{domain:"anevum.com"}}];},
    input=>{input.policies[0].include.push({email:{email:"someone-else@example.com"}});},
    input=>{input.policies.push({...ownerPolicy});},
    input=>{input.policies[0].include=[{email:{email:"other@example.com"}}];},
    input=>{input.policies[0].require=null;},
    input=>{input.policies[0].exclude=null;}
  ]) {
    const input=valid();change(input);
    assert.ok(checkAccessPreviewGate(input).length>0);
  }
});

test("remote preflight uses read-only GET and never sends tokens as URL or payload", async () => {
  const seen=[];
  const fakeFetch=async (url,init) => {
    seen.push({url,method:init.method,redirect:init.redirect,authorization:init.headers.Authorization});
    let result;
    if(url.endsWith("/subdomain"))result={enabled:false,previews_enabled:true};
    else if(url.endsWith("/access/apps/"+appId))result=valid().app;
    else if(url.endsWith("/access/apps/"+appId+"/policies"))result=valid().policies;
    else if(url.includes("/workers/scripts?"))result=[{id:"anevum-web-nextgen",tag:workerId}];
    else throw Error("unexpected mocked route");
    return {ok:true,json:async()=>({success:true,result})};
  };
  const remote=await readRemotePreviewGate({token,accountId,accessAppId:appId,fetchImpl:fakeFetch});
  assert.equal(remote.actualWorkerUuid,workerId);
  assert.equal(seen.length,4);
  for(const hit of seen){
    assert.equal(hit.method,"GET");
    assert.equal(hit.redirect,"error");
    assert.ok(hit.url.startsWith("https://api.cloudflare.com/client/v4/accounts/"+accountId+"/"));
    assert.ok(!hit.url.includes(token));
    assert.equal(hit.authorization,"Bearer "+token);
  }
});

test("remote script lookup must fail when the target worker is not found", async () => {
  const fakeFetch=async (url) => ({
    ok:true, json:async()=>({success:true,result:url.includes("/workers/scripts?")?[]:{}})
  });
  await assert.rejects(()=>readRemotePreviewGate({token,accountId,accessAppId:appId,fetchImpl:fakeFetch}),/CLOUDFLARE_TARGET_WORKER_NOT_FOUND/);
});

test("Cloudflare account tags are 32-hex and invalid IDs never start HTTP reads", async () => {
  for (const invalid of [
    "2f7ee831-0724-0152-097e-fd956a4e8335",
    "f".repeat(31),
    "f".repeat(33),
    "z".repeat(32),
    "../bad"
  ]) {
    let requests=0;
    await assert.rejects(
      () => readRemotePreviewGate({
        token,accountId:invalid,accessAppId:appId,
        fetchImpl:async () => {requests++;throw Error("Unexpected fetch");}
      }),
      /INVALID_CLOUDFLARE_ACCOUNT_ID/
    );
    assert.equal(requests,0,"no HTTP requests on malformed account identifier");
  }
  await assert.rejects(
    () => readRemotePreviewGate({token,accountId,accessAppId:workerId}),
    /MISSING_REQUIRED_PREVIEW_CREDENTIAL_OR_ID/
  );
});

test("the hosted-preview preflight must be executed before any wrangler preview call", () => {
  const pipeline=readFileSync(new URL("../.github/workflows/anevum-verify.yml",import.meta.url),"utf8");
  const gate=pipeline.indexOf("Verify owner-only Access before hosted Cloudflare Preview");
  const preview=pipeline.indexOf("Create or update Cloudflare Preview");
  assert.ok(gate>=0 && preview>gate, "preflight must precede wrangler preview");
  assert.match(pipeline,/node scripts\/verify-original-works-hosted-access\.mjs/);
  assert.match(pipeline,/ANEVUM_WEB_PREVIEW_ACCESS_APP_ID:/);
  assert.match(pipeline,/ANEVUM_WEB_PREVIEW_WORKER_UUID:/);
  assert.doesNotMatch(pipeline.slice(gate,preview),/wrangler (?:deploy|preview)|curl.*(POST|PUT|PATCH|DELETE)/);
});
