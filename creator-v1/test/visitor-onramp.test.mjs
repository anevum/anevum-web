import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const start = read("web/src/pages/StartPage.tsx");
const app = read("web/src/App.tsx");
const shell = read("web/src/components/Shell.tsx");
const home = read("web/src/pages/HomePage.tsx");
const discover = read("web/src/pages/DiscoverPage.tsx");
const css = read("web/src/start-page.css");
const api = read("api/worker.mjs");

test("visitor onramp is reachable from homepage, desktop and mobile, independently of submission", () => {
  assert.match(app, /path="start" element={<StartPage\/>}/);
  assert.match(shell, /to="\/start">Start Here<\/Link>/);
  assert.match(home, /to="\/start"[^>]*>FIND YOUR PLACE/);
  assert.doesNotMatch(start, /memberCreateProject|memberSubmitProject|memberSetSaved/);
  assert.match(start, /You do not have to be a developer/);
  assert.match(start, /invitation-only during testing/);
});

test("eight category portals target real catalogue filters and never fabricate listings", () => {
  for (const category of ["games", "tools", "creative", "libraries", "automation", "research", "learning", "other"]) {
    assert.match(start, new RegExp('category: "' + category + '"'));
  }
  assert.match(start, /readCategories\(signal\)/);
  assert.match(start, /readStatus\(signal\)/);
  assert.match(start, /encodeURIComponent\(portal.category\)/);
  assert.match(start, /count === 0 \? "FIRST RELEASE PENDING"/);
  assert.match(start, /data.state === "loading"/);
  assert.doesNotMatch(start, /fakeCount|demoCreator|sampleProjects|Math.random|localStorage/);
});

test("wayfinding works on narrow screens and honors reduced motion", () => {
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(max-width:350px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(start, /aria-pressed={journey.id === intent}/);
  assert.match(start, /aria-live="polite"/);
  assert.match(start, /role="status"/);
});

test("free-to-use discovery filter is server-backed and URL-driven", () => {
  assert.match(api, /new Set\(\['category', 'q', 'cursor', 'limit', 'creator', 'free', 'sort'\]\)/);
  assert.match(api, /free !== null && free !== '1'/);
  assert.match(api, /if \(filter.freeOnly\) sql \+= ' AND p.free_to_use=1'/);
  assert.match(discover, /free:freeOnly\?"1":undefined/);
  assert.match(discover, /next.delete\("cursor"\)/);
  assert.match(discover, /aria-pressed={freeOnly}/);
  assert.match(discover, /not independently verified cost information/);
});
