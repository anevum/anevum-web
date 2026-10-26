import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PORTAL_DESTINATIONS, findPortalDestinations, publishedSearchPath, isEditableTarget } from "../web/src/lib/portal-destinations.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const shell = read("web/src/components/Shell.tsx");
const component = read("web/src/components/PortalLauncher.tsx");
const css = read("web/src/portal-launcher.css");
const main = read("web/src/main.tsx");

test("portal launcher uses fixed same-origin routes with no fabricated creator records",()=>{
 assert.ok(PORTAL_DESTINATIONS.some(x=>x.id==="boards"&&x.path==="/boards"));
 assert.ok(!PORTAL_DESTINATIONS.some(x=>["workspace","atlas"].includes(x.id)));
 assert.equal(new Set(PORTAL_DESTINATIONS.map(x=>x.id)).size,PORTAL_DESTINATIONS.length);
 for(const item of PORTAL_DESTINATIONS){
  assert.match(item.path,/^\/(?:[a-z0-9?=&_-]*)$/);
  // Only the existing gated Creator Workspace may point at /studio.
  // It must never become a public publish/upload shortcut.
  if(item.id==="create"){
    assert.equal(item.path,"/studio");
    assert.equal(item.gated,true);
  }else assert.doesNotMatch(item.path,/^\/\/|\/api\/|https?:|\/command|\/studio/);
  assert.ok(["Explore","Community","Account"].includes(item.category));
 }
 const gated=PORTAL_DESTINATIONS.filter(x=>x.gated).map(x=>x.id);
 assert.deepEqual(gated,["account","library","create"]);
 assert.ok(!component.includes("member-api"));
 assert.ok(!component.includes("memberMe"));
 assert.ok(!component.includes("localStorage"));
 assert.ok(!component.includes("sessionStorage"));
 assert.ok(!component.includes("fetch("));
 assert.ok(!component.includes("dummyProjects"));
});

test("keyword search is local, predictable, insensitive to case and bounded",()=>{
 assert.ok(findPortalDestinations("").some(x=>x.id==="guide"));
 assert.ok(findPortalDestinations("").some(x=>x.id==="discover"));
 assert.equal(findPortalDestinations("GUIDE")[0].id,"guide");
 assert.equal(findPortalDestinations("play")[0].id,"games");
 assert.equal(findPortalDestinations("automation")[0].id,"automation");
 assert.equal(findPortalDestinations("RESEARCH")[0].id,"research");
 assert.equal(findPortalDestinations("open source")[0].id,"libraries");
 assert.equal(findPortalDestinations("  staged    impossible   entry ").length,0);
 assert.equal(findPortalDestinations("profile").some(x=>x.id==="account"),true);
 assert.equal(findPortalDestinations("aaaaaaaaa".repeat(100)).length,0);
 assert.ok(findPortalDestinations("").length<=9);
});

test("fallback public catalogue query is safe and has a strict 100-character limit",()=>{
 assert.equal(publishedSearchPath(""),null);
 assert.equal(publishedSearchPath("  "),null);
 assert.equal(publishedSearchPath("a".repeat(101)),null);
 assert.equal(publishedSearchPath("a\nb"),null);
 assert.equal(publishedSearchPath(" space "),"/discover?q=space");
 assert.equal(publishedSearchPath("game & art"),"/discover?q=game+%26+art");
 assert.ok(publishedSearchPath("https://unsafe.test")?.startsWith("/discover?q="));
});

test("slash shortcuts never hijack normal typing fields",()=>{
 assert.equal(isEditableTarget(null),false);
 assert.equal(isEditableTarget({}),false);
 for(const selector of ["input","textarea","select","[contenteditable='true']","[role='textbox']"])
  assert.equal(isEditableTarget({closest(q){return q.includes(selector)?{}:null}}),true,selector);
 assert.equal(isEditableTarget({closest(){return null}}),false);
 assert.match(shell,/event\.key === "\/"/);
 assert.match(shell,/!isEditableTarget\(event\.target\)/);
 assert.match(shell,/event\.metaKey \|\| event\.ctrlKey/);
 assert.match(shell,/window\.removeEventListener\("keydown", onShortcut\)/);
});

test("native modal traps focus, supports escape and keyboard choice, and works on mobile",()=>{
 assert.match(shell,/<PortalLauncher open={launcherOpen} onClose=/);
 assert.match(shell,/aria-label="Open quick navigation"/);
 assert.match(component,/<dialog ref={dialog} onClose={leave}/);
 assert.match(component,/element\.showModal\(\)/);
 assert.match(component,/searchField\.current\?\.focus\(\)/);
 assert.match(component,/event\.key === "ArrowDown"/);
 assert.match(component,/event\.key === "ArrowUp"/);
 assert.match(component,/event\.key === "Enter"/);
 assert.match(component,/event\.nativeEvent\.isComposing/);
 assert.match(component,/navigate\(entries\[selected\]\.path\)/);
 assert.match(component,/aria-label="Quick ANEVUM destinations"/);
 assert.match(component,/INVITED ONLY/);
 assert.match(component,/LIVE CATALOGUE/);
 assert.match(main,/import "\.\/portal-launcher\.css"/);
 for(const part of ["max-width:640px","prefers-reduced-motion:reduce","portal-launcher::backdrop","portal-launcher:not([open])"])
  assert.ok(css.includes(part),part);
});
