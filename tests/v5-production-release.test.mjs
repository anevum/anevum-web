import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DATABASE,LEDGER,STUDIO_MIGRATION,releaseConfigValid,productionLineageValid,signedExportURLValid,
  requireRecoveryAuthorization,activateStudio} from "../scripts/production-v5-release.mjs";
import {probeV5LiveRelease} from "../scripts/probe-v5-live-release.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const config=()=>JSON.parse(read("wrangler.jsonc"));
test("website testing release enables members and owner Studio without trading or publishing",()=>{
  assert.equal(releaseConfigValid(config()),true);
  for(const key of ["ANEVUM_MEMBER_PREVIEW_ENABLED","ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED",
    "ANEVUM_V5_WORKSPACES_ENABLED","ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED",
    "ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED","ANEVUM_OWNER_PAPER_OBSERVER_ENABLED",
    "RHEN_OBSERVER_ENABLED","ANEVUM_STUDIO_PUBLISH_ENABLED"]){
    const c=config();c.vars[key]="true";assert.equal(releaseConfigValid(c),false,key);
  }
  for(const change of [c=>c.d1_databases[0].database_id="wrong-database",
    c=>c.vars.ANEVUM_STUDIO_ACCESS_AUD=c.vars.CF_ACCESS_AUD,
    c=>c.vars.ANEVUM_STUDIO_ACCESS_EMAILS+=" ,devon@anevum.com",
    c=>c.vars.ANEVUM_V5_OWNER_MEMBER_BINDING_REQUIRED="false"]){
    const c=config();change(c);assert.equal(releaseConfigValid(c),false);
  }
});
test("production lineage accepts only core plus the separately authorized Studio migration",()=>{
  const base=["0001_member_platform.sql","0002_member_rhen_drafts.sql"];
  assert.equal(productionLineageValid(base),true);
  assert.equal(productionLineageValid([...base,"0008_studio_editorial.sql"]),true);
  for(const unsafe of [[],[...base,"0003_member_billing.sql"],[...base,"0006_commons.sql"],base.toReversed()])
    assert.equal(productionLineageValid(unsafe),false);
});
test("private exports require explicit recovery authority and an exact R2 origin",()=>{
  const env={ANEVUM_PRIVATE_RECOVERY_AUTHORIZED:"true",CLOUDFLARE_ACCOUNT_ID:"a".repeat(32),
    CLOUDFLARE_D1_TOKEN:"synthetic-d1",CLOUDFLARE_API_TOKEN:"synthetic-worker"};
  assert.doesNotThrow(()=>requireRecoveryAuthorization(env));
  for(const value of [undefined,"false","approved"])
    assert.throws(()=>requireRecoveryAuthorization({...env,ANEVUM_PRIVATE_RECOVERY_AUTHORIZED:value}));
  assert.equal(signedExportURLValid("https://example.r2.cloudflarestorage.com/private.sql?synthetic=1"),true);
  for(const url of ["http://example.r2.cloudflarestorage.com/x","https://evil.example/x",
    "https://example.r2.cloudflarestorage.com.evil.example/x","https://user@example.r2.cloudflarestorage.com/x"])
    assert.equal(signedExportURLValid(url),false);
});
test("activation rejects a mismatched archived recovery before any provider request or write",async()=>{
  const temp=mkdtempSync(join(tmpdir(),"anevum-release-test-"));let requests=0;
  try{
    writeFileSync(join(temp,"verified-production-recovery.json"),JSON.stringify({
      status:"PRODUCTION_SQLITE_RECOVERY_AND_STUDIO_REHEARSAL_VERIFIED",sql_sha256:"wrong"}));
    await assert.rejects(activateStudio({ANEVUM_PRIVATE_RECOVERY_AUTHORIZED:"true",
      CLOUDFLARE_ACCOUNT_ID:"a".repeat(32),CLOUDFLARE_D1_TOKEN:"synthetic-d1",
      CLOUDFLARE_API_TOKEN:"synthetic-worker",RUNNER_TEMP:temp,EXPECTED_PRODUCTION_BACKUP_SHA:"expected"},
      async()=>{requests++;throw Error("Provider must not be contacted");}));
    assert.equal(requests,0);
  }finally{rmSync(temp,{recursive:true,force:true});}
});
test("Studio activation honors D1 REST multi-statement limits and binds only the verified owner",async()=>{
  for(const changedOwner of [false,true]){
    const temp=mkdtempSync(join(tmpdir(),"anevum-release-provider-test-"));
    const writes=[];let applied=false;
    try{
      writeFileSync(join(temp,"verified-production-recovery.json"),JSON.stringify({
        status:"PRODUCTION_SQLITE_RECOVERY_AND_STUDIO_REHEARSAL_VERIFIED",sql_sha256:"synthetic-digest"}));
      const env={ANEVUM_PRIVATE_RECOVERY_AUTHORIZED:"true",CLOUDFLARE_ACCOUNT_ID:"a".repeat(32),
        CLOUDFLARE_D1_TOKEN:"synthetic-d1",CLOUDFLARE_API_TOKEN:"synthetic-worker",
        RUNNER_TEMP:temp,EXPECTED_PRODUCTION_BACKUP_SHA:"synthetic-digest"};
      const provider=async(url,init)=>{
        const path=new URL(url).pathname,body=init.body?JSON.parse(init.body):null;
        let result;
        if(init.method==="GET")result={uuid:DATABASE,name:"anevum-members"};
        else if(path.endsWith("/query")){
          if(body.sql.includes("; SELECT")&&body.params)throw Error("D1 rejects multi-statement params");
          if(body.sql.startsWith("SELECT name FROM d1_migrations"))result=[
            {success:true,results:(applied?[...LEDGER,STUDIO_MIGRATION]:LEDGER).map(name=>({name}))},
            {success:true,results:[]}];
          else if(body.sql.startsWith('SELECT id FROM "user"'))result=[{success:true,results:[
            {id:applied&&changedOwner?"synthetic-changed-owner":"synthetic-verified-owner"}]}];
          else if(body.sql.includes("CREATE TABLE IF NOT EXISTS studio_entries")){
            assert.equal(body.params,undefined,"migration must not bind params across statements");
            assert.match(body.sql,/SELECT '0008_studio_editorial\.sql' WHERE NOT EXISTS/);
            writes.push("studio-schema");applied=true;result=[{success:true,results:[]}];
          }else if(body.sql.includes("name IN ('studio_entries','studio_entry_events')"))result=[
            {success:true,results:[{name:"studio_entries"},{name:"studio_entry_events"}]}];
          else throw Error("Unexpected provider query");
        }else if(path.endsWith("/secrets")&&init.method==="PUT"){
          assert.equal(body.name,"ANEVUM_STUDIO_OWNER_MEMBER_ID");
          assert.equal(body.text,"synthetic-verified-owner");
          writes.push("studio-binding");result={};
        }else throw Error("Unexpected provider operation");
        return Response.json({success:true,result});
      };
      if(changedOwner){await assert.rejects(activateStudio(env,provider));assert.deepEqual(writes,["studio-schema"]);}
      else{
        const receipt=await activateStudio(env,provider);
        assert.equal(receipt.status,"STUDIO_SCHEMA_AND_OWNER_BINDING_READY");
        assert.equal(receipt.publishingEnabled,false);
        assert.deepEqual(writes,["studio-schema","studio-binding"]);
      }
    }finally{rmSync(temp,{recursive:true,force:true});}
  }
});
test("only the manual pinned release may backup, migrate, bind and deploy in that order",()=>{
  const flow=read(".github/workflows/deploy-production.yml");
  assert.match(flow,/inputs\.private_recovery_authorized == 'AUTHORIZE_PRIVATE_PRODUCTION_D1_RECOVERY'/);
  assert.doesNotMatch(flow,/^\s+(push|pull_request|pull_request_target):/m);
  const names=["Export, restore-test and encrypt the authorized production backup",
    "Retain encrypted production recovery and rollback metadata",
    "Re-download the encrypted production recovery archive",
    "Verify archived backup before any production migration",
    "Apply only the Studio migration and privately bind the existing owner",
    "Verify production member release prerequisites before deployment","Deploy to Cloudflare Workers"];
  let previous=-1;for(const name of names){const index=flow.indexOf(name);assert.ok(index>previous,name);previous=index;}
  assert.match(flow,/cancel-in-progress: false/);
  assert.match(flow,/ANEVUM_STUDIO_OWNER_MEMBER_ID/);
  assert.doesNotMatch(flow,/wrangler d1 migrations apply/);
});
function mockLive(overrides={}){
  const calls=[];
  const fetcher=async(url,init)=>{
    calls.push({url,init});const path=new URL(url).pathname;
    if(overrides[path])return overrides[path]();
    if(path==="/studio"||path.startsWith("/api/member/studio/"))return new Response(null,{status:302,
      headers:{location:"https://wispy-tooth-095a.cloudflareaccess.com/login"}});
    if(path==="/api/public/studio/entries")return Response.json({schemaVersion:"anevum.studio.v1",available:true,entries:[]});
    if(path==="/api/public/trading/live")return Response.json({status:"SUSPENDED_FOR_REBUILD",execution_enabled:false},{status:503});
    return new Response('<div id="anevum-commons-v5-mount"></div>',{headers:{"Content-Type":"text/html"}});
  };return {calls,fetcher};
}
test("post-release probes are anonymous read-only and do not claim authenticated acceptance",async()=>{
  const {calls,fetcher}=mockLive();const report=await probeV5LiveRelease(fetcher);
  assert.equal(report.success,true);assert.equal(report.authenticatedOwnerAcceptance,"PENDING");
  assert.ok(calls.every(({url,init})=>url.startsWith("https://anevum.com/")&&init.method==="GET"&&
    init.redirect==="manual"&&!init.headers&&!init.body));
});
test("live acceptance rejects old homepage, missing Studio protection, public member IDs and enabled trading",async()=>{
  for(const overrides of [{"/":()=>new Response("old site",{headers:{"Content-Type":"text/html"}})},
    {"/api/member/studio/entries":()=>Response.json({entries:[]})},
    {"/api/public/studio/entries":()=>Response.json({schemaVersion:"anevum.studio.v1",available:true,entries:[{id:"private-id"}]})},
    {"/api/public/trading/live":()=>Response.json({status:"LIVE",execution_enabled:true})}])
    await assert.rejects(probeV5LiveRelease(mockLive(overrides).fetcher));
});
