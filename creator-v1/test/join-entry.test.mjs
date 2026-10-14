import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const app=read("web/src/App.tsx");
const join=read("web/src/pages/JoinPage.tsx");
const atlas=read("web/src/pages/AtlasMorphPage.tsx");
const portal=read("web/src/lib/portal-destinations.ts");
const api=read("web/src/lib/member-api.ts");
const publicWorker=read("web/production-worker.mjs");

test("join is reachable through standard, Atlas and quick-navigation routes",()=>{
 assert.match(app,/path="join" element={<JoinPage\/>}/);
 assert.match(app,/path="sign-in" element={<Navigate to="\/join" replace\/>}/);
 assert.match(app,/path="sign-in" element={<Navigate to="\/atlas\/join" replace\/>}/);
 assert.match(atlas,/pathname.startsWith\("\/atlas\/join"\)/);
 assert.match(atlas,/"workspace","status","start","guide","join"/);
 assert.match(portal,/id:"join".*path:"\/join"/);
});
test("member signin resumes exact verified member and first-time profile",()=>{
 assert.match(join,/memberMe\(signal\)/);
 assert.match(join,/member\.handle\?\(inAtlas\?"\/atlas\/account"/);
 assert.match(join,/inAtlas\?"\/atlas\/discover":"\/discover"/);
 assert.match(join,/PROFILE SETUP PENDING/);
 assert.match(join,/memberSignInCapabilities\(signal\)/);
});
test("unverified signup options are not actionable and public Worker keeps member routes closed",()=>{
 assert.match(join,/method\.id==="email" && emailReady/);
 assert.match(join,/capabilities\.methods\.email\.path==="\/api\/v1\/member\/join"/);
 assert.match(join,/join-method-unavailable/);
 assert.doesNotMatch(join,/signIn\.social|linkSocial|window\.location\.replace|oauth.*callback/);
 assert.match(api,/credentials: options\.publicHealth\?"omit":"same-origin"/);
 assert.ok(publicWorker.includes('if(PRIVATE_PREFIX.test(path) || (JOIN_PREFIX.test(path) && path !== "/join"))return reject(404);'));
});
