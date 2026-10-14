import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const desk=read("web/src/components/CommunityMemberDesk.tsx");
const hub=read("web/src/pages/CommunityPage.tsx");
const css=read("web/src/components/community-member-desk-v008.css");
const api=read("web/src/lib/member-api.ts");
const routes=read("web/src/App.tsx");

test("V008 member desk is syntactically valid and embedded in the real community",()=>{
  assert.doesNotThrow(()=>parse(desk,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(desk,/export function CommunityMemberDesk/);
  assert.match(desk,/community-member-desk-v008\.css/);
  assert.match(hub,/import \{ CommunityMemberDesk \}/);
  assert.match(hub,/<CommunityMemberDesk\/>/);
  assert.doesNotMatch(hub,/ch7-take-part/);
});
test("invitation entry requires verified same-origin member service and a real session",()=>{
  assert.match(desk,/memberHealth\(signal\)/);
  assert.match(desk,/memberMe\(signal\)/);
  assert.match(desk,/health\.service !== STAGING_MEMBER_SERVICE \|\| health\.status !== "ok"/);
  assert.match(desk,/error instanceof MemberApiError && error\.status === 401/);
  assert.match(desk,/health\.signupEnabled === true/);
  assert.match(desk,/guestAccess\.invitationEnabled/);
  assert.match(desk,/href="\/api\/v1\/member\/join"/);
  assert.match(desk,/to="\/community\/write"/);
  assert.match(desk,/to="\/account\/edit"/);
  assert.match(api,/mode:"same-origin"/);
  assert.match(api,/credentials: options\.publicHealth\?"omit":"same-origin"/);
  assert.match(routes,/<MemberGate\/>/);
  assert.match(routes,/path="community\/write" element={<CommunityPostEditorPage\/>}/);
  assert.doesNotMatch(desk,/BetterAuth|localStorage|sessionStorage|document\.cookie|fetch\(|grantXp\(|window\.open/);
});
test("member-specific moderation status never shows another account's cached data",()=>{
  assert.match(desk,/memberMyDiscussions\(signal\)/);
  assert.match(desk,/if \(!member\?\.id \|\| !member\.handle\) return \{ ownerId: null, items: \[\] \}/);
  assert.match(desk,/privateHistory\.data\.ownerId === member\.id/);
  assert.match(desk,/privateHistory\.state === "error"/);
  assert.match(desk,/item\.status === "pending_review"/);
  assert.match(desk,/item\.status === "published"/);
  assert.match(desk,/Only approved public|Posts are never automatically published/);
  assert.doesNotMatch(desk,/Math\.random|fakeUser|fakeMessage|fakeXP|dangerouslySetInnerHTML|setInterval/);
});
test("member card is tactile, full-width on mobile, and accessible",()=>{
  for(const name of [".ch8-member-desk",".ch8-member-actions",".ch8-private-history",".ch8-private-entry",".ch8-action"])
    assert.ok(css.includes(name),name);
  for(const media of ["max-width:900px","max-width:640px","prefers-reduced-motion:reduce","forced-colors:active","prefers-reduced-transparency:reduce",":focus-visible"])
    assert.ok(css.includes(media),media);
  assert.match(desk,/aria-labelledby="ch8-desk-heading"/);
  assert.match(desk,/aria-label="Your private discussion review status"/);
  assert.match(desk,/role="status"/);
  assert.doesNotMatch(css,/position:\s*fixed\s*;\s*bottom:\s*0|scrollbar-width:\s*none/);
});
