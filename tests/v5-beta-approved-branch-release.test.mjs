import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const release=read(".github/workflows/v5-beta-approved-branch-release.yml");
const beta=JSON.parse(read("wrangler.v5-beta.jsonc"));
test("one-time beta trigger is bound to an exact branch, marker, actor and no production hook",()=>{
 const header=release.split("\npermissions:")[0];
 assert.match(header,/^\s*push:\s*$/m);
 assert.match(header,/branches:\s*\[build\/anevum-v5-isolated-beta-deployment-20261011\]/);
 assert.match(header,/docs\/ANEVUM_V5_BETA_RELEASE_AUTHORIZATION_2026-10-11\.json/);
 assert.doesNotMatch(header,/workflow_dispatch:|pull_request:|branches:\s*\[main\]|schedule:/);
 assert.match(release,/github\.actor == 'anevum'/);
 assert.match(release,/github\.ref == 'refs\/heads\/build\/anevum-v5-isolated-beta-deployment-20261011'/);
 assert.match(release,/github\.event\.head_commit\.message == 'release\(v5-beta\): deploy approved beta-only candidate'/);
 assert.match(release,/git diff-tree --no-commit-id --name-only -r HEAD/);
 assert.match(release,/REVIEWED_PARENT_SHA=\$parent/);
 assert.match(release,/\.reviewed_parent_sha == \$parent/);
 assert.match(release,/\.production_change_authorized == false/);
 assert.match(release,/\.reviewer_change_authorized == false/);
 assert.match(release,/\.external_invites_authorized == false/);
 assert.match(release,/\.broker_execution_authorized == false/);
});
test("beta release checks all four independent CI results before one beta deploy",()=>{
 for(const name of [
  "ANEVUM Verify","ANEVUM Member Staging OAuth",
  "ANEVUM V5 Isolated Beta Deployment","ANEVUM V5 Release Safety Bootstrap"
 ]) assert.ok(release.includes(name),name);
 assert.match(release,/head_sha=\$REVIEWED_PARENT_SHA/);
 assert.match(release,/\.event == "pull_request"/);
 assert.match(release,/test "\$ready" = 1/);
 assert.match(release,/npm run test:members/);
 assert.match(release,/npm run test:foundation/);
 assert.match(release,/npm run build/);
 assert.match(release,/node scripts\/verify-v5-beta-deploy\.mjs --generated/);
 assert.equal((release.match(/npx wrangler deploy\b/g)||[]).length,1);
 assert.match(release,/CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH: wrangler\.v5-beta\.jsonc/);
 assert.doesNotMatch(release,/wrangler d1 migrations apply|wrangler d1 execute.*--remote/);
 assert.doesNotMatch(release,/wrangler\.jsonc --config|wrangler\.alpaca-review-staging\.jsonc --config/);
 assert.equal(beta.name,"anevum-v5-beta");
 assert.equal(beta.d1_databases[0].database_id,"b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf");
 assert.equal(beta.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
 assert.equal(beta.vars.COMMAND_LIVE_STREAM_ENABLED,"false");
 assert.equal(beta.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
});
test("encrypted auth bindings and privacy verification are required both sides of isolated publish",()=>{
 for(const s of ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","BETTER_AUTH_SECRET"])
   assert.ok((release.match(new RegExp(s,"g"))||[]).length>=2,s);
 assert.match(release,/\.available == true and \.provider == "google"/);
 assert.match(release,/\/api\/command\/trader\/status/);
 assert.match(release,/\/api\/member\/rhen\/draft/);
 assert.match(release,/\/api\/member\/rhen\/workspace/);
 assert.match(release,/\/api\/member\/export/);
 assert.match(release,/for route in \/ \/beta \/sign-in \/me\/beta/);
 assert.match(release,/anevum-web-nextgen anevum-member-staging/);
 assert.match(release,/\.result == \$before\[0\]\.result/);
 assert.match(release,/Real two-account Google sign-in acceptance and external tester invitation/);
 assert.doesNotMatch(release,/ALPACA_CONNECT_CLIENT_SECRET.*secrets\.|OWNER_PERSONAL_PAPER_API_SECRET_KEY.*secrets\./);
});
