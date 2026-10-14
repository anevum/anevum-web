import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const hub = read("web/src/pages/CommunityPage.tsx");
const style = read("web/src/pages/community-hub-v007.css");
const api = read("web/src/lib/api.ts");
const routes = read("web/src/App.tsx");

test("V007 community hub is a parsable React component on both public routes", () => {
  assert.doesNotThrow(() => parse(hub, { sourceType: "module", plugins: ["typescript", "jsx"] }));
  assert.match(routes, /path="community" element={<CommunityPage\/>}/);
  assert.match(hub, /export function CommunityPage/);
  assert.match(hub, /community-hub-v007\.css/);
});

test("V007 activity and creator data come from authoritative public APIs", () => {
  for (const name of ["readStatus", "readProjects", "readCreators", "readCommunityPosts"])
    assert.ok(hub.includes(name), name);
  assert.match(hub, /communityPosts === true/);
  assert.match(hub, /status\.data\.counts\.publishedProjects/);
  assert.match(hub, /status\.data\.counts\.publishedCreators/);
  assert.match(hub, /projectDetailPath/);
  assert.match(hub, /creatorPath\(item\.authorHandle\)/);
  assert.match(api, /credentials:\s*"omit"/);
  assert.match(api, /cache:\s*"no-store"/);
  assert.doesNotMatch(hub, /localStorage|sessionStorage|document\.cookie|dangerouslySetInnerHTML|fakeUser|fakePost|sampleComments|Math\.random|grantXp\(/);
});

test("V007 provides meaningful filters, accessible identities and non-fabricated empty/error states", () => {
  for (const value of ['"all"', '"projects"', '"conversations"', '"people"'])
    assert.ok(hub.includes(value), value);
  for (const category of ['"games"', '"tools"', '"creative"', '"libraries"', '"research"', '"learning"', '"automation"', '"other"'])
    assert.ok(hub.includes(category), category);
  assert.match(hub, /aria-pressed=\{view === item\.id\}/);
  assert.match(hub, /aria-label="Community activity"/);
  assert.match(hub, /aria-label="Verified public community counts"/);
  assert.match(hub, /searchCreators\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hub, /role="status"/);
  assert.match(hub, /<LoadingState/);
  assert.match(hub, /<ErrorState/);
  assert.match(hub, /Public signup is not enabled/);
  assert.match(hub, /independently reviewed|independently approved/i);
  assert.match(hub, /readCommunityPosts\(\{ sort:/);
});

test("V007 keeps moderation and member privileges entirely on existing backend routes", () => {
  assert.match(hub, /enabled = status\.state === "ready"/);
  assert.match(hub, /Only independently approved public records/);
  assert.doesNotMatch(hub, /fetch\(|credentials\s*:|authorization|memberCreate|memberVote|memberReact|set-cookie/i);
  assert.match(routes, /<MemberGate\/>/);
  assert.match(routes, /path="community\/write" element={<CommunityPostEditorPage\/>}/);
});

test("V007 is full-width on phones with readable type and reduced-motion/accessibility support", () => {
  for (const selector of [".ch7-hero", ".ch7-portals", ".ch7-tabs", ".ch7-entry", ".ch7-sidebar", ".ch7-empty"])
    assert.ok(style.includes(selector), selector);
  for (const query of ["max-width:1200px", "max-width:900px", "max-width:640px", "max-width:359px",
    "prefers-reduced-motion:reduce", "prefers-reduced-transparency:reduce", "forced-colors:active", ":focus-visible"])
    assert.ok(style.includes(query), query);
  assert.doesNotMatch(style, /position:\s*fixed\s*;\s*bottom:\s*0|scrollbar-width:\s*none/);
});
