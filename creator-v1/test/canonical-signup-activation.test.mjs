import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {boundedText} from "../canonical-auth/request-body.mjs";

test("staging signup release reuses the routed Worker and isolates member and community databases",()=>{
  const config=JSON.parse(readFileSync(new URL("../wrangler.a-signup-staging.jsonc",import.meta.url),"utf8"));
  assert.equal(config.name,"anevum-creator-v1-a-staging");
  assert.equal(config.account_id,"2f7ee83107240152097efd956a4e8335");
  assert.equal(config.main,"./web/a-canonical-stage.review.mjs");
  assert.deepEqual(config.routes,[]);
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.equal(config.assets.run_worker_first,true);
  assert.deepEqual(config.d1_databases.map(x=>[x.binding,x.database_id]),[
    ["COMMUNITY_DB","fa96e36d-6257-4883-bf15-074947e11a13"],
    ["MEMBER_DB","e1d29049-c83b-4534-8355-dc1fa36ba6d8"]
  ]);
  assert.equal(config.vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,"false");
  assert.equal(config.vars.CANONICAL_INVITED_SIGNUP_ENABLED,"false");
  assert.equal(Object.keys(config.vars).some(x=>/SECRET|API_KEY|EMAILS$/.test(x)),false);
});

test("streamed bodies stop at the byte limit without trusting Content-Length",async()=>{
  let cancelled=false;
  const stream=new ReadableStream({
    start(controller){controller.enqueue(new Uint8Array(513));},
    cancel(){cancelled=true;}
  });
  const request=new Request("https://a.anevum.com/api/v1/member/auth/sign-in/email-otp",{
    method:"POST",body:stream,duplex:"half"
  });
  assert.equal(await boundedText(request,512),null);
  assert.equal(cancelled,true);
  assert.equal(await boundedText(new Request("https://a.anevum.com",{
    method:"POST",body:"é".repeat(257)
  }),512),null);
  assert.equal(await boundedText(new Request("https://a.anevum.com",{
    method:"POST",body:"valid"
  }),512),"valid");
  assert.equal(await boundedText(new Request("https://a.anevum.com",{
    method:"POST",body:new Uint8Array([0xc3,0x28])
  }),512),null);
});
