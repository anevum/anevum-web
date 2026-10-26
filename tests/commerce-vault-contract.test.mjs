import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_ACCEPTANCE, COMMERCE_PRODUCTS, validatedProduct, unpaidCatalogQuote,
  checkoutEnabled, canFulfillPaidOrder, quotaBytes, safeFilename,
  safeVaultMediaType, allowedUploadBytes
} from "../src/server/commerce-contract.mjs";

const prices={
  "signal-support-5":500,"signal-support-10":1000,"signal-support-25":2500,
  "vault-10g-month":400,"vault-50g-month":900
};

test("Owner-approved prices cannot be overridden or expanded",()=>{
  assert.throws(()=>validatedProduct("vault-10g-month",{}));
  assert.throws(()=>validatedProduct("vault-1tb",{"vault-1tb":999}));
  assert.throws(()=>validatedProduct("vault-10g-month",{"vault-10g-month":300}));
  assert.throws(()=>validatedProduct("vault-10g-month",{"vault-10g-month":800}));
  assert.throws(()=>validatedProduct("signal-support",{"signal-support":500}));
  assert.throws(()=>validatedProduct("vault-100g-month",{"vault-100g-month":1500}));
  for(const [code,cents] of Object.entries(prices)){
    const approved=validatedProduct(code,prices);
    assert.equal(approved.cents,cents);
    assert.equal(approved.currency,"USD");
    assert.equal(approved.recurring,false);
  }
  assert.equal(Object.keys(COMMERCE_PRODUCTS).length,5);
  assert.equal(COMMERCE_PRODUCTS["vault-10g-month"].bytes,10*1024**3);
  assert.equal(COMMERCE_PRODUCTS["vault-50g-month"].durationDays,30);
});

test("No amount, flag, old payment credential or environment enables checkout",()=>{
  assert.equal(PAYMENT_ACCEPTANCE.enabled,false);
  assert.equal(PAYMENT_ACCEPTANCE.rail,null);
  const attemptedOverrides=[
    {}, {ANEVUM_COMMERCE_ENABLED:"true"}, {ANEVUM_PAYMENTS_ENABLED:"true",ANEVUM_PAYMENT_RAIL:"internal"},
    {ANEVUM_COMMERCE_ENABLED:"true",ANEVUM_SQUARE_MODE:"sandbox",
      SQUARE_ACCESS_TOKEN:"ignored-revoked-example",SQUARE_WEBHOOK_SIGNATURE_KEY:"old",SQUARE_WEBHOOK_URL:"https://example.test"},
    {ANEVUM_PAYMENTS_ENABLED:"true",ANEVUM_PAYMENT_RAIL:"bank",PAYMENT_READY:"true"}
  ];
  for(const env of attemptedOverrides) assert.equal(checkoutEnabled(env),false);
  const quote=unpaidCatalogQuote("vault-10g-month",prices);
  assert.equal(quote.cents,400);
  assert.equal(quote.checkoutAvailable,false);
  assert.equal(quote.paid,false);
});

test("No fabricated payment event can activate paid entitlements",()=>{
  const order={id:"order-test",status:"pending",amount_cents:400,currency:"USD"};
  const claims=[
    {status:"COMPLETED",amount_money:{amount:400,currency:"USD"}},
    {status:"settled",amount_cents:400,verified:true},
    {status:"paid",payment_id:"anything"},
    {bankTransferScreenshot:"present"},null
  ];
  for(const evidence of claims) assert.equal(canFulfillPaidOrder(order,evidence),false);
});

test("Quota considers only active valid time-bound passes",()=>{
  const now=100000;
  const passes=[
    {starts_at_ms:100,ends_at_ms:200000,revoked_at_ms:null,added_bytes:20},
    {starts_at_ms:100,ends_at_ms:99999,revoked_at_ms:null,added_bytes:100},
    {starts_at_ms:100,ends_at_ms:200000,revoked_at_ms:999,added_bytes:100}
  ];
  assert.equal(quotaBytes(10,passes,now),30);
  assert.throws(()=>quotaBytes(-1,passes,now));
  assert.throws(()=>quotaBytes(10,[{starts_at_ms:0,ends_at_ms:200000,revoked_at_ms:null,added_bytes:-10}],now));
});

test("Private filenames and media lengths reject unsafe input",()=>{
  for(const name of ["../secret","..","a/b","a\\b","\u0000bad",".env"]) assert.throws(()=>safeFilename(name));
  assert.equal(safeFilename("project.zip"),"project.zip");
  assert.throws(()=>safeVaultMediaType("application/x-msdownload"));
  assert.throws(()=>allowedUploadBytes(0));
  assert.throws(()=>allowedUploadBytes(50*1024*1024+1));
});
