import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyV5BetaConfigs,BETA_WORKER,BETA_DB,BETA_ORIGIN} from "../scripts/verify-v5-beta-deploy.mjs";
import {runWorkspaceStagingProof,V5_BETA_ACCEPTANCE_ORIGIN} from "../src/member/workspace-staging-acceptance.ts";
import {stagingOrigin,V5_BETA_ORIGIN,STAGING_ORIGIN} from "../scripts/verify-member-staging.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const fixtures=()=>[
 json("wrangler.v5-beta.jsonc"),json("wrangler.jsonc"),
 json("wrangler.member-staging.jsonc"),json("wrangler.alpaca-review-staging.jsonc")
];

test("new beta Worker has independent D1, exact host and no external or financial authority",()=>{
 const [beta,prod,stage,review]=fixtures();
 assert.deepEqual(verifyV5BetaConfigs(beta,prod,stage,review),{
   worker:BETA_WORKER,origin:BETA_ORIGIN,database:BETA_DB
 });
 assert.equal(beta.vars.ANEVUM_MEMBERS_ENABLED,"true");
 assert.equal(beta.vars.ANEVUM_MEMBER_PREVIEW_ENABLED,"true");
 assert.equal(beta.vars.ANEVUM_V5_WORKSPACES_ENABLED,"true");
 assert.equal(beta.vars.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED,"true");
 for(const field of ["ANEVUM_OWNER_PAPER_OBSERVER_ENABLED","ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED",
   "ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED","COMMAND_LIVE_STREAM_ENABLED"]){
   assert.equal(beta.vars[field],"false");
 }
 assert.equal(beta.workers_dev,true);
 assert.equal(beta.preview_urls,false);
 assert.equal(beta.routes,undefined);
 assert.equal(beta.custom_domains,undefined);
 assert.notEqual(beta.d1_databases[0].database_id,prod.d1_databases[0].database_id);
 assert.notEqual(beta.d1_databases[0].database_id,stage.d1_databases[0].database_id);
 assert.notEqual(beta.name,review.name);
});

test("beta release guard rejects swapped targets, elevated scopes or inherited secrets",()=>{
 const [beta,prod,stage,review]=fixtures();
 const changes=[
   c=>{c.name="anevum-member-staging"},
   c=>{c.name="anevum-web-nextgen"},
   c=>{c.routes=[{pattern:"anevum.com/*"}]},
   c=>{c.d1_databases[0].database_id=stage.d1_databases[0].database_id},
   c=>{c.d1_databases[0].database_id=prod.d1_databases[0].database_id},
   c=>{c.d1_databases[0].database_name="anevum-members-preview"},
   c=>{c.vars.MEMBER_PREVIEW_ORIGIN="https://anevum-member-staging.devonakins.workers.dev"},
   c=>{c.vars.MEMBER_PREVIEW_ORIGIN="https://attacker.workers.dev"},
   c=>{c.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED="true"},
   c=>{c.vars.COMMAND_LIVE_STREAM_ENABLED="true"},
   c=>{c.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED="true"},
   c=>{c.vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED="true"},
   c=>{c.vars.CF_ACCESS_AUD="fake-aud"},
   c=>{c.vars.GOOGLE_CLIENT_SECRET="private"},
   c=>{c.preview_urls=true},
   c=>{c.secrets={BETTER_AUTH_SECRET:"accidental"}},
   c=>{c.d1_databases.push({...c.d1_databases[0]})}
 ];
 for(const change of changes){
   const changed=structuredClone(beta);change(changed);
   assert.throws(()=>verifyV5BetaConfigs(changed,prod,stage,review));
 }
});

test("only two exact nonproduction origins can open staging member tests",async()=>{
 assert.equal(stagingOrigin(STAGING_ORIGIN),STAGING_ORIGIN);
 assert.equal(stagingOrigin(V5_BETA_ORIGIN),V5_BETA_ORIGIN);
 assert.equal(V5_BETA_ORIGIN,V5_BETA_ACCEPTANCE_ORIGIN);
 for(const bad of ["https://anevum.com","https://attacker.workers.dev",
   "http://anevum-v5-beta.devonakins.workers.dev",
   "https://anevum-v5-beta.devonakins.workers.dev.evil.test",
   "https://anevum-v5-beta.devonakins.workers.dev/evil",
   "https://anevum-v5-beta.devonakins.workers.dev?token=x",
   "https://anevum-v5-beta.devonakins.workers.dev/"]){
   assert.throws(()=>stagingOrigin(bad));
 }
 let calls=0;
 const fetcher=()=>{calls++;return Response.json({unexpected:true})};
 assert.rejects(runWorkspaceStagingProof(fetcher,"member-a","https://anevum.com"),/staging-only/);
 assert.equal(calls,0);
 const page=read("src/pages/MemberStagingVerify.tsx");
 assert.match(page,/ALLOWED_ACCEPTANCE_ORIGINS/);
 assert.match(page,/https:\/\/anevum-v5-beta\.devonakins\.workers\.dev/);
});

test("manual beta deployment never targets production or reviewer and does not auto-publish",()=>{
 const yml=read(".github/workflows/v5-isolated-beta-deploy.yml");
 assert.match(yml,/name: ANEVUM V5 Isolated Beta Deployment/);
 assert.match(yml,/workflow_dispatch:/);
 assert.match(yml,/reviewed_head_sha == github\.sha/);
 assert.match(yml,/DEPLOY_ISOLATED_V5_BETA_ONLY/);
 assert.match(yml,/CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH: wrangler\.v5-beta\.jsonc/);
 assert.match(yml,/scripts\/verify-v5-beta-deploy\.mjs --generated/);
 assert.match(yml,/anevum-v5-beta/);
 assert.match(yml,/0004_member_rhen_workspaces\.sql/);
 assert.match(yml,/if: github\.event_name == 'workflow_dispatch'/);
 assert.doesNotMatch(yml,/wrangler d1 migrations apply|wrangler d1 execute.*--command.*(DROP|DELETE|INSERT|UPDATE)/i);
 assert.doesNotMatch(yml,/wrangler\.alpaca-review-staging\.jsonc.*deploy/);
});
