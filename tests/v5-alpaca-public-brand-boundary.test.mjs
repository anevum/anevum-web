import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("public Commons editorial and legal route code stays provider-neutral",()=>{
  for(const file of [
    "src/data/fieldNotes.ts","src/data/products.ts","src/commons/CommonsPages.tsx",
    "src/commons/CommonsV5.tsx","src/pages/Terms.tsx","src/pages/Privacy.tsx"
  ]){
    assert.doesNotMatch(read(file),/\balpaca\b/i,
      "Brokerage provider branding should appear on the integration UI, not in the public editorial page: "+file);
  }
});

test("brokerage integration alone retains required disclosure and acknowledge-first flow",()=>{
  const page=read("src/pages/RhenReviewConnect.tsx");
  const backend=read("src/server/member-alpaca-review.mjs");
  assert.match(page,/By allowing RHEN by ANEVUM to access your Alpaca account/);
  assert.match(page,/Alpaca does not warrant or guarantee/);
  assert.match(page,/checked=\{acknowledged\}/);
  assert.match(page,/!canAuthorize \|\| !acknowledged/);
  assert.match(page,/target\.searchParams\.has\("scope"\)/);
  assert.match(backend,/disclosureVersion!==DISCLOSURE_VERSION/);
  assert.match(backend,/env","paper"/);
  assert.match(backend,/\/v2\/account/);
  assert.doesNotMatch(backend,/\/v2\/orders|placeOrder|submitOrder/);
});

test("Commons social routes cannot invoke shared/copy/mirrored trades",()=>{
  const publicPage=read("src/commons/CommonsPages.tsx");
  assert.match(publicPage,/copies their orders, mirrors a portfolio/);
  const backend=read("src/server/commons-social.mjs");
  assert.doesNotMatch(backend,/submitOrder|placeOrder|\/v2\/orders/);
});
