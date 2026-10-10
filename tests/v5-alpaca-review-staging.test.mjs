import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyReviewerSource,verifyGeneratedReviewer} from "../scripts/verify-v5-alpaca-review-staging.mjs";
const load=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const stage=load("wrangler.member-staging.jsonc"),review=load("wrangler.alpaca-review-staging.jsonc"),prod=load("wrangler.jsonc");
test("reviewer worker is identical to ordinary staging except disabled-to-enabled OAuth flag",()=>{
 assert.equal(verifyReviewerSource(stage,review,prod).previewDb,"a537432e-d216-4b31-8b22-19662cc3a44a");
 for(const bad of [
   {...review,routes:[{pattern:"anevum.com/*"}]},
   {...review,d1_databases:prod.d1_databases},
   {...review,vars:{...review.vars,ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED:"true"}},
   {...review,vars:{...review.vars,ALPACA_CONNECT_CLIENT_SECRET:"fake"}},
   {...review,vars:{...review.vars,ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED:"false"}}
 ])assert.throws(()=>verifyReviewerSource(stage,bad,prod));
});
test("generated review config refuses production, live command, missing consent gate",()=>{
 verifyGeneratedReviewer(review,review);
 for(const bad of [
   {...review,name:"anevum-web-nextgen"},
   {...review,d1_databases:prod.d1_databases},
   {...review,vars:{...review.vars,COMMAND_LIVE_STREAM_ENABLED:"true"}},
   {...review,vars:{...review.vars,ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED:"false"}}
 ])assert.throws(()=>verifyGeneratedReviewer(bad,review));
});
test("manual workflow is isolated, fail-closed, and requires 0005 & encrypted secret names",()=>{
 const workflow=readFileSync(new URL("../.github/workflows/member-alpaca-review-staging.yml",import.meta.url),"utf8");
 assert.match(workflow,/workflow_dispatch:\s*\n\s+inputs:/);
 assert.doesNotMatch(workflow,/^\s+(?:push|pull_request|schedule):\s*$/m);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/inputs\.reviewed_head_sha == github\.sha/);
 for(const phrase of ["DEPLOY_ALPACA_PAPER_REVIEW_STAGING_ONLY","PAPER_CALLBACK_WHITELISTED",
 "OWNER_APPROVES_PAPER_ONLY","ALPACA_CONNECT_CLIENT_SECRET","ALPACA_CONNECT_TOKEN_KEY_BASE64",
 "0005_member_alpaca_review.sql","verify-v5-alpaca-review-staging.mjs --generated","npx wrangler deploy"])
   assert.ok(workflow.includes(phrase),phrase);
 assert.doesNotMatch(workflow,/migrations apply|paper-api\.alpaca\.markets\/v2\/orders/);
});
