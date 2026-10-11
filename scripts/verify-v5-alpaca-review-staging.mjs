// Verify exact member-staging scope before any reviewer-only release.
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve} from "node:path";
import assert from "node:assert/strict";
const load=path=>JSON.parse(readFileSync(path,"utf8"));
const PREVIEW="a537432e-d216-4b31-8b22-19662cc3a44a";
const PRODUCTION="7f0d4c0c-2e85-4900-8504-1347954e1df1";
const ORIGIN="https://anevum-member-staging.devonakins.workers.dev";
const sensitive=["ALPACA_CONNECT_CLIENT_ID","ALPACA_CONNECT_CLIENT_SECRET","ALPACA_CONNECT_TOKEN_KEY_BASE64","OWNER_PERSONAL_PAPER_API_KEY_ID","OWNER_PERSONAL_PAPER_API_SECRET_KEY"];
export function verifyReviewerSource(stage,review,prod){
  assert.equal(stage.name,"anevum-member-staging");
  assert.equal(stage.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.equal(review.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"true");
  assert.equal(stage.vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
  assert.equal(review.vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
  const normalized=JSON.parse(JSON.stringify(review));
  normalized.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED="false";
  assert.deepEqual(normalized,stage,"Reviewer config must differ by exactly one staging flag");
  assert.equal(review.workers_dev,true);
  assert.equal(review.preview_urls,false);
  assert.equal(review.vars.MEMBER_PREVIEW_ORIGIN,ORIGIN);
  assert.equal(review.vars.ANEVUM_MEMBER_PREVIEW_ENABLED,"true");
  assert.equal(review.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(review.vars.COMMAND_LIVE_STREAM_ENABLED,"false");
  assert.ok(!["routes","route","custom_domains","env"].some(x=>Object.hasOwn(review,x)));
  assert.equal(review.d1_databases.length,1);
  assert.equal(review.d1_databases[0].binding,"MEMBER_DB");
  assert.equal(review.d1_databases[0].database_name,"anevum-members-preview");
  assert.equal(review.d1_databases[0].database_id,PREVIEW);
  assert.equal(prod.d1_databases[0].database_id,PRODUCTION);
  assert.equal(prod.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.equal(prod.vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
  assert.equal(prod.vars.ANEVUM_MEMBER_PREVIEW_ENABLED,"false");
  for(const x of [stage,review,prod]){
    for(const name of sensitive)assert.ok(!Object.hasOwn(x.vars||{},name));
  }
  return {name:review.name,origin:ORIGIN,previewDb:PREVIEW};
}
export function verifyGeneratedReviewer(generated,source){
  assert.equal(generated.name,source.name);
  assert.equal(generated.workers_dev,true);
  assert.equal(generated.vars.MEMBER_PREVIEW_ORIGIN,source.vars.MEMBER_PREVIEW_ORIGIN);
  assert.equal(generated.vars.ANEVUM_MEMBER_PREVIEW_ENABLED,"true");
  assert.equal(generated.vars.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"true");
  assert.equal(generated.vars.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
  assert.equal(generated.vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(generated.vars.COMMAND_LIVE_STREAM_ENABLED,"false");
  assert.ok(!["routes","route","custom_domains"].some(x=>Object.hasOwn(generated,x)));
  assert.equal(generated.d1_databases.length,1);
  assert.equal(generated.d1_databases[0].binding,"MEMBER_DB");
  assert.equal(generated.d1_databases[0].database_id,PREVIEW);
  for(const name of sensitive)assert.ok(!Object.hasOwn(generated.vars||{},name));
}
if(process.argv[1]?.endsWith("verify-v5-alpaca-review-staging.mjs")){
  try{
    const source=load("wrangler.alpaca-review-staging.jsonc");
    const valid=verifyReviewerSource(load("wrangler.member-staging.jsonc"),source,load("wrangler.jsonc"));
    if(process.argv.includes("--generated")){
      const filename=resolve(".wrangler/deploy/config.json");
      assert.ok(existsSync(filename));
      const pointer=load(filename);
      assert.ok(pointer.configPath);
      const generatedPath=resolve(dirname(filename),pointer.configPath);
      assert.ok(existsSync(generatedPath));
      verifyGeneratedReviewer(load(generatedPath),source);
    }
    console.log("ANEVUM reviewer stage PASS: "+valid.name);
  }catch{
    console.error("ANEVUM reviewer stage BLOCKED: invalid config or generated deployment target");
    process.exitCode=1;
  }
}
