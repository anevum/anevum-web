import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("V004 composition preserves V040 supporter, member auth and original route",()=>{
 const app=read("web/src/App.tsx");
 const page=read("web/src/pages/ProjectPage.tsx");
 const player=read("web/src/components/ProjectPlayerShell.tsx");
 const worker=read("web/a-canonical-stage.review.mjs");
 const canonical=read("canonical-auth/worker.mjs");
 assert.match(app,/<Route path="projects\/:id" element=\{<ProjectPage\/>\}\/>/);
 assert.match(app,/<Route path="support" element=\{<SupporterPage\/>\}\/>/);
 assert.match(page,/<ProjectPlayerShell project=\{p\} demo=\{demo\} source=\{source\}\/>/);
 assert.match(page,/MemberEngagementPanel/);
 assert.match(page,/ContextDiscussions/);
 assert.match(player,/avp-stage--long-title/);
 assert.match(worker,/reconcileSupporterSubscriptions/);
 assert.match(worker,/reconcileSupporterCheckouts/);
 assert.match(worker,/PUBLIC_METRICS/);
 assert.match(worker,/canonicalIdentity\.fetch/);
 assert.match(canonical,/supporterMember/);
 assert.match(canonical,/publicSupporterTelemetry/);
 assert.match(read("web/src/pages/SupporterPage.tsx"),/Supporter/);
});

test("V004 test list preserves all V040 suites and includes the unified player suite",()=>{
 const pkg=JSON.parse(read("package.json"));
 for(const name of [
  "test/supporter-v032.test.mjs","test/supporter-integration-v032.test.mjs",
  "test/supporter-rewards-v034.test.mjs","test/supporter-recovery-v035.test.mjs",
  "test/member-account-closure-v036.test.mjs","test/supporter-transparency-v037.test.mjs",
  "test/supporter-finance-v038.test.mjs","test/supporter-telemetry-v039.test.mjs",
  "test/supporter-privacy-v040.test.mjs","test/player-registry-v002.test.mjs",
  "test/player-release-v003.test.mjs","test/player-v004-integration.test.mjs"
 ])assert.ok(pkg.scripts.test.includes(name),"Missing test: "+name);
 const fixture=read("test/portal-offline-preview.mjs");
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.doesNotMatch(read("web/src/main.tsx"),/portal-offline-preview|playerCases/);
});

test("V004 isolated staging config keeps current provider cron, dual DB and no live routes",()=>{
 const config=JSON.parse(read("wrangler.a-progression-v031.jsonc"));
 assert.equal(config.name,"anevum-creator-v1-a-staging");
 assert.equal(config.main,"./web/a-canonical-stage.review.mjs");
 assert.deepEqual(config.routes,[]);
 assert.equal(config.workers_dev,false);
 assert.equal(config.preview_urls,false);
 assert.equal(config.vars?.CANONICAL_PUBLIC_SIGNUP_ENABLED,"false");
 assert.deepEqual(config.d1_databases.map(db=>db.binding),["COMMUNITY_DB","MEMBER_DB"]);
 assert.equal(config.triggers,undefined); // V041 live staging had no active billing cron; preserve it until separately enabled.
 const stage=read("web/a-staging-worker.mjs");
 assert.match(stage,/read-only/);
});

test("V004 integration remains review-only and acknowledges independent acceptance gates",()=>{
 const record=read("../docs/creator-platform/UNIFIED-PLAYER-V004-V040-INTEGRATION-2026-10-16.md");
 assert.match(record,/draft PR #443/);
 assert.match(record,/draft PR #447/);
 assert.match(record,/NOT DEPLOYED/);
 assert.match(record,/No automatic merge/);
 assert.match(record,/first rights-cleared/i);
});
