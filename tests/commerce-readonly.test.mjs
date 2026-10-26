import test from "node:test";
import assert from "node:assert/strict";
import { commerceReadOnlyEndpoint } from "../src/server/commerce-readonly.mjs";

const req=(method="GET",pathname="/api/member/commerce/catalog") =>
  new Request("https://anevum.example"+pathname,{method});

test("Catalog is disabled by default and cannot accept money",async()=>{
  const user={id:"verified-A"};
  const denied=commerceReadOnlyEndpoint(req(),{},user,"/api/member/commerce/catalog");
  assert.equal(denied.status,503);
  const allowed=commerceReadOnlyEndpoint(req(),{ANEVUM_COMMERCE_PREVIEW_ENABLED:"true"},user,"/api/member/commerce/catalog");
  assert.equal(allowed.status,200);
  const value=await allowed.json();
  assert.equal(value.available,false);
  assert.equal(value.previewOnly,true);
  assert.equal(value.paymentAcceptance,false);
  assert.equal(value.rail,null);
  assert.equal(value.freeVault.includedBytes,2*1024**3);
  assert.equal(value.products.length,5);
  assert(value.products.every(x=>x.purchasable===false));
  assert.equal(allowed.headers.get("Cache-Control"),"private, no-store");
});
test("Member identity and every write are rejected, regardless of flags",async()=>{
  const env={ANEVUM_COMMERCE_PREVIEW_ENABLED:"true",ANEVUM_COMMERCE_ENABLED:"true"};
  assert.equal(commerceReadOnlyEndpoint(req(),env,{}, "/api/member/commerce/catalog").status,401);
  assert.equal(commerceReadOnlyEndpoint(req("POST"),env,{id:"verified-A"},"/api/member/commerce/catalog").status,503);
  assert.equal(commerceReadOnlyEndpoint(req("GET","/api/member/commerce/pay"),env,{id:"verified-A"},"/api/member/commerce/pay").status,503);
  const selected=new Request("https://anevum.example/api/member/commerce/catalog?memberId=member-B");
  assert.equal(commerceReadOnlyEndpoint(selected,env,{id:"verified-A"},"/api/member/commerce/catalog").status,400);
});
