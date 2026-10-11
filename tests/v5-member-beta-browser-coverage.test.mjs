import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("private member beta browser acceptance uses real Chromium with synthetic accounts only",()=>{
  const qa=source("scripts/member-beta-browser-qa.mjs");
  const workflow=source(".github/workflows/anevum-verify.yml");
  assert.match(workflow,/node scripts\/member-beta-browser-qa\.mjs/);
  assert.match(workflow,/BASE_URL: \$\{\{ steps\.preview\.outputs\.preview_url \}\}/);
  assert.match(qa,/function installFixture\(scenario\)/);
  assert.match(qa,/Page\.addScriptToEvaluateOnNewDocument/);
  assert.match(qa,/member-beta-\W*\+scenario\+\W*-\W*\+width/);
  assert.match(qa,/for\(const width of \[390,1440\]\)/);
  assert.match(qa,/for\(const scenario of \["disabled","signed-out","member","second","crossed","owner"\]\)/);
});
test("browser acceptance protects private endpoints and owner-only PAPER account",()=>{
  const qa=source("scripts/member-beta-browser-qa.mjs");
  assert.match(qa,/if\(method!=="GET"\)throw Error/);
  assert.match(qa,/\/api\/member\/owner-paper\/status/);
  assert.match(qa,/scenario!=="owner"/);
  assert.match(qa,/Cross-member account response shown as verified/);
  assert.match(qa,/Signed-out user retrieved private member data/);
  assert.match(qa,/Owner PAPER details leaked to ordinary member/);
  assert.match(qa,/robots\.startsWith\("noindex"\)/);
  assert.doesNotMatch(qa,/\/v2\/orders|submitOrder|placeOrder/);
  assert.doesNotMatch(source("src/pages/MemberBeta.tsx"),/submitOrder|placeOrder/);
});
