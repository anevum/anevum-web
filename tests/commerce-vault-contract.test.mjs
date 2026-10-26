import test from "node:test";
import assert from "node:assert/strict";
import { COMMERCE_PRODUCTS,validatedProduct,checkoutEnabled,quotaBytes,safeFilename,safeVaultMediaType,allowedUploadBytes,verifySquareWebhook,providerPaymentMatches } from "../src/server/commerce-contract.mjs";

test("Owner-approved catalog is exact, one-time and disabled without configured prices",()=>{
  assert.throws(()=>validatedProduct("vault-10g-month",{}));
  assert.throws(()=>validatedProduct("vault-1tb",{"vault-1tb":999}));
  assert.throws(()=>validatedProduct("vault-10g-month",{"vault-10g-month":300}));
  assert.throws(()=>validatedProduct("vault-10g-month",{"vault-10g-month":800}));
  assert.throws(()=>validatedProduct("signal-support",{"signal-support":500}));
  assert.throws(()=>validatedProduct("vault-100g-month",{"vault-100g-month":1500}));
  const prices={
    "signal-support-5":500,"signal-support-10":1000,"signal-support-25":2500,
    "vault-10g-month":400,"vault-50g-month":900
  };
  for(const [code,cents] of Object.entries(prices)){
    const approved=validatedProduct(code,prices);
    assert.equal(approved.cents,cents);
    assert.equal(approved.currency,"USD");
    assert.equal(approved.recurring,false);
  }
  assert.equal(COMMERCE_PRODUCTS["vault-10g-month"].bytes,10*1024**3);
  assert.equal(COMMERCE_PRODUCTS["vault-50g-month"].durationDays,30);
  assert.equal(Object.keys(COMMERCE_PRODUCTS).length,5);
});
test("Square checkout stays off until explicit sandbox configuration",()=>{
  assert.equal(checkoutEnabled({}),false);
  assert.equal(checkoutEnabled({ANEVUM_COMMERCE_ENABLED:"true",ANEVUM_SQUARE_MODE:"production"}),false);
});
test("Quota considers active unrevoked passes only",()=>{
  const now=100000;
  const passes=[{starts_at_ms:100,ends_at_ms:200000,revoked_at_ms:null,added_bytes:20},{starts_at_ms:100,ends_at_ms:99999,revoked_at_ms:null,added_bytes:100},{starts_at_ms:100,ends_at_ms:200000,revoked_at_ms:999,added_bytes:100}];
  assert.equal(quotaBytes(10,passes,now),30);
});
test("Private filenames and media lengths reject traversal and hostile input",()=>{
  for(const name of ["../secret","..","a/b","a\\b","\u0000bad",".env"]) assert.throws(()=>safeFilename(name));
  assert.equal(safeFilename("project.zip"),"project.zip");
  assert.throws(()=>safeVaultMediaType("application/x-msdownload"));
  assert.throws(()=>allowedUploadBytes(0));
  assert.throws(()=>allowedUploadBytes(50*1024*1024+1));
});
test("Paid entitlement requires matching completed Square payment",()=>{
  const order={provider:"square",status:"pending",provider_order_id:"sq-1",amount_cents:500,currency:"USD"};
  const payment={status:"COMPLETED",order_id:"sq-1",amount_money:{amount:500,currency:"USD"}};
  assert.equal(providerPaymentMatches(order,payment),true);
  assert.equal(providerPaymentMatches(order,{...payment,amount_money:{amount:499,currency:"USD"}}),false);
  assert.equal(providerPaymentMatches(order,{...payment,status:"PENDING"}),false);
  assert.equal(providerPaymentMatches(order,{...payment,order_id:"other"}),false);
  assert.equal(providerPaymentMatches({...order,provider_order_id:undefined},{...payment,order_id:undefined}),false);
});
test("Webhook signature checks URL+raw body",async()=>{
  const raw='{"type":"payment.updated"}', url="https://anevum.example/webhooks/square",key="test-only-not-real-secret";
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=Buffer.from(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(url+raw))).toString("base64");
  assert.equal(await verifySquareWebhook(raw,signature,key,url),true);
  assert.equal(await verifySquareWebhook(raw+" ",signature,key,url),false);
  assert.equal(await verifySquareWebhook(raw,signature,key,url+"/changed"),false);
  assert.equal(await verifySquareWebhook(raw,"not-valid-base64$$",key,url),false);
});
