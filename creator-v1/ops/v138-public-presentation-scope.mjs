/**
 * ANEVUM V138 / narrowly reviewed public presentation scope check.
 * READ ONLY — source comparison and a human-readable receipt, never deploy.
 * This is a new candidate preflight, NOT a replacement for the sealed V136
 * production-release gate.
 */
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {dirname} from "node:path";

export const EXPECTED_BASE="f8e1bd8f8761efd09898fc67ada108a41d1e1531";
export const REVIEWED_PATHS=Object.freeze([
  ".github/workflows/v137-stage-focused-website.yml",
  "creator-v1/ops/v138-public-presentation-scope.mjs",
  "creator-v1/test/community-structure.test.mjs",
  "creator-v1/test/home-navigation-v079.test.mjs",
  "creator-v1/test/parity-v136-full-browser.mjs",
  "creator-v1/test/parity-v136026-first-visit-browser.mjs",
  "creator-v1/test/portal-overhaul-contract.test.mjs",
  "creator-v1/test/react-shell-contract.test.mjs",
  "creator-v1/test/severance-cinematic-v138.test.mjs",
  "creator-v1/test/sitewide-experience-v009.test.mjs",
  "creator-v1/test/sitewide-route-consolidation.test.mjs",
  "creator-v1/test/stage-focused-severance-v137.test.mjs",
  "creator-v1/test/stage-focused-v137-browser.mjs",
  "creator-v1/test/visitor-onramp.test.mjs",
  "creator-v1/test/wayfinder-v137-browser.mjs",
  "creator-v1/web/AGENTS.md",
  "creator-v1/web/index.html",
  "creator-v1/web/src/App.tsx",
  "creator-v1/web/src/components/Shell.tsx",
  "creator-v1/web/src/lib/public-page-metadata.ts",
  "creator-v1/web/src/lib/site-navigation.ts",
  "creator-v1/web/src/main.tsx",
  "creator-v1/web/src/pages/AboutStudioPage.tsx",
  "creator-v1/web/src/pages/CinematicLandingPage.tsx",
  "creator-v1/web/src/pages/CreatorsPage.tsx",
  "creator-v1/web/src/pages/SeverancePage.tsx",
  "creator-v1/web/src/pages/StatusPage.tsx",
  "creator-v1/web/src/parity/ConsoleWayfinderV136.tsx",
  "creator-v1/web/src/parity/ParityDiscoverV136.tsx",
  "creator-v1/web/src/parity/ParityHeaderV136.tsx",
  "creator-v1/web/src/parity/SeveranceWorldSceneV138.tsx",
  "creator-v1/web/src/parity/StageFocusedHomeV137.tsx",
  "creator-v1/web/src/severance-cinematic-v138.css",
  "creator-v1/web/src/stage-focus-v137.css",
  "creator-v1/web/vite.config.ts",
  "docs/production/ANEVUM.WEB.UPDATE.2026-10-27.001.STAGE-FOCUSED-SEVERANCE-SITE.md"
]);
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const head=git("rev-parse","HEAD");
if(process.env.ANEVUM_SOURCE_SHA)assert.equal(head,process.env.ANEVUM_SOURCE_SHA,"CI must check exact PR head");
assert.equal(git("cat-file","-t",EXPECTED_BASE),"commit","Expected approved parent not fetched");
const changed=git("diff","--name-only","--diff-filter=ACDMRT",EXPECTED_BASE,head).split("\n").filter(Boolean);
assert.ok(changed.length>0,"No candidate change list");
const unexpected=changed.filter(path=>!REVIEWED_PATHS.includes(path));
assert.deepEqual(unexpected,[],"Unexpected changed paths outside approved presentation/test/documentation scope");
for(const key of [
  "creator-v1/web/src/parity/StageFocusedHomeV137.tsx",
  "creator-v1/web/src/parity/SeveranceWorldSceneV138.tsx",
  "creator-v1/web/src/pages/SeverancePage.tsx",
  "creator-v1/web/src/severance-cinematic-v138.css",
  "creator-v1/test/stage-focused-v137-browser.mjs"
])assert.ok(changed.includes(key),"Required audited V138 path unchanged: "+key);
for(const path of changed){
  assert.ok(!/(^|\/)(?:\.env|node_modules|secrets|wrangler\.toml)(?:\/|$)/i.test(path),
    "Protected configuration unexpectedly modified: "+path);
  assert.ok(!path.startsWith("creator-v1/api/")&&!path.startsWith("creator-v1/auth/")&&!path.startsWith("migrations/")&&
    !path.startsWith("creator-v1/web/public/")&&!path.startsWith("public/"),
    "Do not ship backend, static executable assets or database changes under a presentation release: "+path);
}
const app=readFileSync("creator-v1/web/src/App.tsx","utf8");
for(const route of ['path="severance"','path="about"','path="studio"','path="member"'])
  assert.ok(app.includes(route),"Protected or current-stage route missing: "+route);
const shell=readFileSync("creator-v1/web/src/components/Shell.tsx","utf8");
assert.ok(shell.includes("VerifiedStaffShortcut"),"Staff access shortcut must remain permissioned at source");
const source=readFileSync("creator-v1/web/src/pages/SeverancePage.tsx","utf8");
assert.ok(source.includes('data-public-playable="false"'),"Game page must not be offered as playable");
const receipt={contract:"anevum-v138-reviewed-presentation-only",status:"PASS",
  sourceSha:head,baseSha:EXPECTED_BASE,changedCount:changed.length,
  reviewedPathCount:REVIEWED_PATHS.length,changedPaths:changed,
  excluded:["database changes","Cloudflare writes","new payment and authentication services","private media",
    "game server deployment","unreviewed public file assets"],
  productionReleased:false};
const output="evidence/stage-focused-v137/source-scope.json";
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(receipt,null,2)+"\n");
console.log("V138 read-only scope PASS: "+changed.length+" reviewed source files at "+head);
