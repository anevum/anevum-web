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

test("canonical public visibility remains server-authoritative in the member preview",()=>{
 const source=readFileSync(new URL("../web/src/pages/Phase1MemberPage.tsx",import.meta.url),"utf8");
 assert.match(source,/const storedVisibility=persisted\?\.visibility\?\?"private"/);
 assert.match(source,/const visibilityPending=claimed/);
 assert.match(source,/PUBLIC AFTER SAVE/);
 assert.match(source,/PRIVATE AFTER SAVE/);
 assert.match(source,/persisted\?\.visibility==="public"&&<Link/);
 assert.match(source,/last saved visibility setting/);
 assert.match(source,/checked\.profile\.revision!==result\.profile\.revision/);
});
test("stealth member surfaces preserve uploaded media and have high-contrast fallbacks",()=>{
 const source=readFileSync(new URL("../web/src/parity/continuance-design-system.css",import.meta.url),"utf8");
 assert.match(source,/V137 \/ canonical member tools/);
 assert.match(source,/\.ms-dashboard \.ms-wall/);
 assert.match(source,/\.av12-account \.av12-visibility/);
 assert.match(source,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(source.slice(source.indexOf("V137 / canonical member tools")),/\.ms-cover-art|\.ms-portrait img|\.ms-cover-shade|\.av92-presence-cover/);
});
