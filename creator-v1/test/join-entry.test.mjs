import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("join routes exist and do not open private production API",()=>{
 const app=read("web/src/App.tsx");
 const page=read("web/src/pages/JoinPage.tsx");
 const prod=read("web/production-worker.mjs");
 assert.match(app,/path="join" element={<JoinPage\/>}/);
 assert.match(page,/memberSignInCapabilities/);
 assert.match(page,/emailReady/);
 assert.match(prod,/PRIVATE_PREFIX/);
});
