import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const app=read("web/src/App.tsx");
const gate=read("web/src/components/MemberGate.tsx");
const account=read("web/src/pages/MemberAccountPage.tsx");
const page=read("web/src/pages/MemberInterestsPage.tsx");
const memberApi=read("web/src/lib/member-api.ts");
const worker=read("auth/worker.mjs");
const preferences=read("auth/interests.mjs");
const privacy=read("auth/privacy.mjs");
const fixture=read("test/portal-offline-preview.mjs");
const css=read("web/src/member-interests.css");

test("personal discovery interests remain behind the existing account gate",()=>{
 assert.match(app,/<Route element={<MemberGate\/>}>[\s\S]*path="account\/interests" element={<MemberInterestsPage\/>}/);
 assert.match(gate,/to="\/account\/interests">MY INTERESTS/);
 assert.match(account,/to="\/account\/interests">MY INTERESTS/);
 assert.doesNotMatch(read("web/src/components/Shell.tsx"),/\/account\/interests/);
 assert.match(worker,/if\(path==='\/interests'\)\{/);
 assert.match(worker,/req.method==='POST'&&!checkWrite\(req\)/);
 assert.match(worker,/return interestsRoutes\(req,db,member,limit,clock\(\)\)/);
});

test("the page never invents saves, XP or public membership",()=>{
 assert.match(page,/memberInterests/);
 assert.match(page,/memberSaveInterests/);
 assert.match(page,/reply.saved!==true/);
 assert.match(page,/setConfirmed\(saved\)/);
 assert.match(page,/role={isError\?"alert":"status"}/);
 assert.match(page,/!dirty\|\|busy/);
 assert.match(page,/readCategories/);
 for(const word of ["localStorage","sessionStorage","awardXp","memberVote","memberCreateProject","fakeCreator","sampleUser"])
  assert.ok(!page.includes(word),word);
});

test("existing strict same-origin JSON API is reused, not a new token or authentication system",()=>{
 assert.match(memberApi,/requestMember<MemberInterests>\("\/interests",\{signal\}\)/);
 assert.match(memberApi,/requestMember<MemberInterests>\("\/interests",\{method:"POST",body:\{categories\}\}\)/);
 assert.match(memberApi,/credentials: options.publicHealth\?"omit":"same-origin"/);
 assert.match(memberApi,/mode:"same-origin"/);
 assert.match(preferences,/INSERT INTO member_discovery_preferences/);
 assert.match(preferences,/WHERE id=\? AND status='active'/);
 assert.match(preferences,/const ROUTE='\/api\/v1\/member\/interests'/);
 assert.match(preferences,/if\(!member\)/);
 assert.match(preferences,/member.id/);
 assert.doesNotMatch(preferences,/req.headers.get\('authorization'\)|thirdParty|PUBLIC_API_ROOT|COMMUNITY_XP/);
});

test("private data is exportable, not a creator public profile or staff permission",()=>{
 assert.match(privacy,/interests:\{key:'memberId'/);
 assert.match(preferences,/private, no-store/);
 assert.match(preferences,/noindex, nofollow/);
 assert.doesNotMatch(read("auth/social.mjs"),/member_discovery_preferences|categories_json/);
 assert.doesNotMatch(read("api/worker.mjs"),/member_discovery_preferences|categories_json/);
});

test("responsive active toggles and offline QA are accessible and explicitly nonproduction",()=>{
 assert.match(page,/aria-pressed={active}/);
 assert.match(page,/aria-label="Select private discovery interests"/);
 assert.match(page,/disabled={busy}/);
 assert.match(page,/member-interests-feedback/);
 assert.match(css,/@media\(max-width:690px\)/);
 assert.match(css,/@media\(max-width:350px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(fixture,/url.pathname==="\/api\/v1\/member\/interests"&&req.method==="GET"/);
 assert.doesNotMatch(fixture,/url.pathname==="\/api\/v1\/member\/interests"&&req.method==="POST"/);
});
