import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const config=JSON.parse(read("wrangler.a-canonical-invited-v024.jsonc"));
const join=read("web/src/pages/Phase1JoinPage.tsx");
const root=read("web/a-canonical-stage.review.mjs");

test("V024 stages only on existing a Worker with isolated D1s, no independent host or production route",()=>{
  assert.equal(config.name,"anevum-creator-v1-a-staging");
  assert.equal(config.main,"./web/a-canonical-stage.review.mjs");
  assert.deepEqual(config.routes,[]);
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.equal(config.assets.directory,"./dist/web");
  assert.equal(config.assets.run_worker_first,true);
  assert.deepEqual(config.d1_databases.map(db=>[db.binding,db.database_id]),[
    ["COMMUNITY_DB","fa96e36d-6257-4883-bf15-074947e11a13"],
    ["MEMBER_DB","e1d29049-c83b-4534-8355-dc1fa36ba6d8"]
  ]);
  assert.match(root,/canonicalIdentity\.fetch\(request,env,ctx\)/);
  assert.match(root,/publicStage\.fetch\(request,env,ctx\)/);
  assert.match(root,/https:\/\/a\.anevum\.com/);
});
test("V024 retains invite-only signup and all disabled social login methods",()=>{
  assert.equal(config.vars.ANEVUM_CANONICAL_STAGE_ENABLED,"true");
  assert.equal(config.vars.CANONICAL_SCHEMA_APPROVED,"true");
  assert.equal(config.vars.CANONICAL_EMAIL_ENABLED,"true");
  assert.equal(config.vars.CANONICAL_INVITED_SIGNUP_ENABLED,"true");
  assert.equal(config.vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,"false");
  for(const provider of ["APPLE","GITHUB","GOOGLE","MICROSOFT"])
    assert.equal(config.vars["CANONICAL_"+provider+"_ENABLED"],"false");
  assert.equal(Object.keys(config.vars).some(key=>/SECRET|API_KEY|EMAILS$/.test(key)),false);
});
test("V024's actual build source sends a new OTP when the user selects resend",()=>{
  const begin=join.indexOf("async function requestReplacementCode()");
  const end=join.indexOf("function resetCode()",begin);
  assert.ok(begin>0&&end>begin);
  const action=join.slice(begin,end);
  assert.match(action,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
  assert.match(action,/setOtp\(""/);
  assert.match(join,/onClick=\{\(\)=>void requestReplacementCode\(\)\}/);
  assert.doesNotMatch(join,/onClick=\{resetCode\}[^>]*>SEND A NEW CODE/);
});
