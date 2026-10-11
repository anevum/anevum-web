// Fail-closed target guard for the NEW independent non-trading V5 beta.
// Never treat the existing Alpaca reviewer/member staging Worker as a beta target.
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";

const read=p=>JSON.parse(readFileSync(p,"utf8"));
export const BETA_WORKER="anevum-v5-beta";
export const BETA_ORIGIN="https://anevum-v5-beta.devonakins.workers.dev";
export const BETA_DB="b2f9b4ad-4b97-483c-ae78-5dc7c8da76bf";
export const MEMBER_STAGING_DB="a537432e-d216-4b31-8b22-19662cc3a44a";
export const PRODUCTION_DB="7f0d4c0c-2e85-4900-8504-1347954e1df1";
const allowedNames=new Set([
  "COMMAND_AUTH_MODE","COMMAND_LIVE_STREAM_ENABLED","ANEVUM_MEMBERS_ENABLED",
  "ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED","ANEVUM_MEMBER_PREVIEW_ENABLED",
  "MEMBER_PREVIEW_ORIGIN","ANEVUM_V5_WORKSPACES_ENABLED",
  "ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED","ANEVUM_OWNER_PAPER_OBSERVER_ENABLED",
  "ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED"
]);
const mustFalse=["COMMAND_LIVE_STREAM_ENABLED","ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED",
  "ANEVUM_OWNER_PAPER_OBSERVER_ENABLED","ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED"];
const mustTrue=["ANEVUM_MEMBERS_ENABLED","ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED",
  "ANEVUM_MEMBER_PREVIEW_ENABLED","ANEVUM_V5_WORKSPACES_ENABLED"];
const sensitive=[
  "BETTER_AUTH_SECRET","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET",
  "OWNER_PERSONAL_PAPER_API_KEY_ID","OWNER_PERSONAL_PAPER_API_SECRET_KEY",
  "ALPACA_CONNECT_CLIENT_ID","ALPACA_CONNECT_CLIENT_SECRET","ALPACA_CONNECT_TOKEN_KEY_BASE64"
];
const assertTarget=(c,source)=>{
  assert.equal(c.name,BETA_WORKER,source+" must never target an existing service");
  assert.equal(c.workers_dev,true);
  assert.equal(c.preview_urls,false);
  assert.equal(c.main,"./worker.mjs");
  assert.ok(!["routes","route","custom_domains","env"].some(k=>Object.hasOwn(c,k)),
    source+" cannot bind any zone or production route");
  assert.deepEqual(Object.keys(c.vars||{}).sort(),[...allowedNames].sort());
  assert.equal(c.vars.COMMAND_AUTH_MODE,"cloudflare_access");
  assert.equal(c.vars.MEMBER_PREVIEW_ORIGIN,BETA_ORIGIN);
  for(const k of mustFalse)assert.equal(c.vars[k],"false",k+" must stay off");
  for(const k of mustTrue)assert.equal(c.vars[k],"true",k+" is an authenticated beta capability");
  for(const secret of sensitive)assert.ok(!Object.hasOwn(c.vars,secret),
    source+" leaked secret "+secret);
  assert.ok(!Object.hasOwn(c,"secrets"));
  assert.equal(c.assets?.binding,"ASSETS");
  assert.equal(c.assets?.run_worker_first,true);
  assert.equal(c.assets?.not_found_handling,"single-page-application");
  assert.equal(c.d1_databases?.length,1);
  const db=c.d1_databases[0];
  assert.equal(db.binding,"MEMBER_DB");
  assert.equal(db.database_name,"anevum-v5-beta-members");
  assert.equal(db.database_id,BETA_DB);
  assert.notEqual(db.database_id,PRODUCTION_DB);
  assert.notEqual(db.database_id,MEMBER_STAGING_DB);
  return c;
};
export function verifyV5BetaConfigs(beta,prod,stage,review,generated=false){
  assertTarget(beta,generated?"Generated beta":"Beta source");
  if(!generated)assert.equal(beta.d1_databases[0].migrations_dir,"migrations");
  assert.equal(prod.name,"anevum-web-nextgen");
  assert.equal(prod.d1_databases?.[0]?.database_id,PRODUCTION_DB);
  assert.equal(prod.previews?.d1_databases?.[0]?.database_id,MEMBER_STAGING_DB);
  assert.equal(stage.name,"anevum-member-staging");
  assert.equal(stage.d1_databases?.[0]?.database_id,MEMBER_STAGING_DB);
  assert.equal(review.name,"anevum-member-staging");
  assert.equal(review.d1_databases?.[0]?.database_id,MEMBER_STAGING_DB);
  assert.equal(review.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"true");
  assert.equal(stage.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  for(const c of [prod,stage,review])assert.notEqual(c.name,beta.name);
  const copy=structuredClone(review);
  copy.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED="false";
  assert.deepEqual(copy,stage,"Beta development must preserve reviewer/staging isolation");
  assert.ok(!Object.hasOwn(beta,"routes"));
  return {worker:beta.name,origin:BETA_ORIGIN,database:BETA_DB};
}
function main(){
  const beta=read("wrangler.v5-beta.jsonc");
  const prod=read("wrangler.jsonc");
  const stage=read("wrangler.member-staging.jsonc");
  const review=read("wrangler.alpaca-review-staging.jsonc");
  verifyV5BetaConfigs(beta,prod,stage,review);
  if(process.argv.includes("--generated")){
    const pointerFile=resolve(".wrangler/deploy/config.json");
    assert.ok(existsSync(pointerFile),"Cloudflare Vite generated deploy config pointer missing");
    const pointer=read(pointerFile);
    assert.equal(typeof pointer.configPath,"string");
    const file=resolve(dirname(pointerFile),pointer.configPath);
    assert.ok(existsSync(file),"Generated V5 beta deployment config missing");
    verifyV5BetaConfigs(read(file),prod,stage,review,true);
  }
  console.log("V5 BETA TARGET VERIFIED: isolated anevum-v5-beta Worker, fresh MEMBER_DB, no trading/reviewer/Commons write authority.");
}
if(process.argv[1]?.endsWith("verify-v5-beta-deploy.mjs")){
  try{main();}catch(e){
    console.error("V5 BETA DEPLOY BLOCKED: "+(e instanceof Error?e.message:"invalid scope"));
    process.exitCode=1;
  }
}
