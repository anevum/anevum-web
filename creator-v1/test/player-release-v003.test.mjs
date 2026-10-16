import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("public project passport never asserts unverified origin, license or offsite cost",()=>{
 const page=read("web/src/pages/ProjectPage.tsx");
 assert.match(page,/PUBLIC PROJECT RECORD/);
 assert.match(page,/LISTED AS FREE/);
 assert.match(page,/LICENSE AS LISTED/);
 assert.match(page,/ANEVUM does not certify security, ownership, licensing or payment practices/);
 assert.doesNotMatch(page,/ORIGINAL WORK|OWNERSHIP VERIFIED|GUARANTEED FREE|FREE TO USE/);
 assert.match(page,/safeExternal\(p\.demoUrl\)/);
 assert.match(page,/safeExternal\(p\.sourceUrl\)/);
});

test("isolated A staging preserves canonical member auth and both staging-only D1 bindings",()=>{
 const cfg=JSON.parse(read("wrangler.a-progression-v031.jsonc"));
 assert.equal(cfg.name,"anevum-creator-v1-a-staging");
 assert.equal(cfg.main,"./web/a-canonical-stage.review.mjs");
 assert.equal(cfg.assets?.directory,"./dist/web");
 assert.deepEqual(cfg.routes,[]);
 assert.equal(cfg.workers_dev,false);
 assert.equal(cfg.preview_urls,false);
 assert.deepEqual(cfg.d1_databases?.map(x=>x.binding),["COMMUNITY_DB","MEMBER_DB"]);
 assert.equal(cfg.vars?.ANEVUM_CANONICAL_STAGE_ENABLED,"true");
 const worker=read("web/a-canonical-stage.review.mjs");
 assert.match(worker,/a\.anevum\.com/);
 assert.match(worker,/canonicalIdentity\.fetch/);
 assert.match(worker,/publicStage\.fetch/);
 const publicStage=read("web/a-staging-worker.mjs");
 assert.match(publicStage,/request\.method!=="GET"&&request\.method!=="HEAD"/);
 assert.match(publicStage,/headers\.delete\("set-cookie"\)/);
});

test("verified offline browser suite covers safe player variants and long creator text",()=>{
 const fixture=read("test/portal-offline-preview.mjs");
 const browser=read("test/capture-sitewide-v012.mjs");
 for(const scenario of ["external-game","source-only","unsafe-fallback","no-link","external-app","long-content"])
   assert.ok(browser.includes('["'+scenario+'"'),"Missing "+scenario);
 assert.match(browser,/PLAYER_V002_VISUAL_OR_OUTBOUND/);
 assert.match(browser,/PLAYER_V002_UNSAFE_URL_USED/);
 assert.match(browser,/PLAYER_V002_SHARE_URL/);
 assert.match(browser,/PLAYER_V002_PARTICIPATION_ANCHOR/);
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(fixture,/9005/);
 assert.match(fixture,/A deliberately lengthy project summary/);
 assert.doesNotMatch(read("web/src/main.tsx"),/portal-offline-preview|playerCases/);
});

test("player staging handoff refuses cross-environment deploy assumptions",()=>{
 const handoff=read("../docs/creator-platform/UNIFIED-PLAYER-SHELL-V002-2026-10-16.md");
 assert.match(handoff,/next\.anevum\.com\/creator/);
 assert.match(handoff,/anevum-construction-terminal/);
 assert.match(handoff,/separate draft member\/supporter work/);
 assert.match(handoff,/explicit owner staging authorization/);
});
