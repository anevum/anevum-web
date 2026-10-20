import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../web/src/pages/Phase1MemberPage.tsx",import.meta.url),"utf8");
const api=readFileSync(new URL("../web/src/lib/canonical-beta.ts",import.meta.url),"utf8");
test("profile save surfaces authorized API failure rather than blaming connection",()=>{
 assert.match(page,/catch\(cause\)/);
 assert.match(page,/cause instanceof CanonicalBetaError\?cause\.message/);
 assert.doesNotMatch(page,/Check your connection and try saving again/);
});
test("profile API remains cookie-only and same-origin with no extra identity authority",()=>{
 assert.match(api,/credentials:publicRead\?"omit":"same-origin"/);
 assert.match(api,/redirect:"error",cache:"no-store"/);
 assert.match(api,/status===401\?"Sign in/);
 assert.match(api,/status===403\?"This invitation/);
 assert.match(api,/status===409\?"This handle/);
 assert.match(api,/status===429\?"Too many changes/);
});
