import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import reviewWorker from "../web/a-canonical-stage.review.mjs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const origin="https://a.anevum.com";

test("canonical member worker review is isolated, unrouted and disabled by default",async()=>{
 const review=JSON.parse(source("wrangler.a-canonical-stage.review.jsonc").replace(/^\s*\/\/.*$/gm,""));
 const live=JSON.parse(source("wrangler.a-staging.jsonc"));
 assert.deepEqual(review.routes,[]);
 assert.equal(review.workers_dev,false);
 assert.equal(review.preview_urls,false);
 assert.deepEqual(Object.entries(review.vars).filter(([,v])=>v==="true"),[]);
 assert.equal(review.d1_databases.length,2);
 assert.equal(review.d1_databases.find(x=>x.binding==="MEMBER_DB")?.database_id,
   "e1d29049-c83b-4534-8355-dc1fa36ba6d8");
 assert.equal(live.main,"./web/a-staging-worker.mjs");
 assert.equal(live.d1_databases.length,1);
 assert.equal(live.d1_databases[0].binding,"COMMUNITY_DB");

 const env={ASSETS:{fetch:async()=>new Response("<!doctype html><title>ANEVUM</title>",{
  headers:{"content-type":"text/html"}
 })}};
 const methods=await reviewWorker.fetch(new Request(origin+"/api/v1/member/auth-methods"),env);
 assert.equal(methods.status,200);
 const capability=await methods.json();
 assert.equal(capability.registration,"closed");
 assert.equal(capability.methods.email.available,false);
 assert.equal(capability.methods.google.available,false);
 assert.equal((await reviewWorker.fetch(new Request(origin+"/api/v1/member/creator-profile"),env)).status,503);
 assert.equal((await reviewWorker.fetch(new Request(origin+"/api/v1/member/auth/get-session"),env)).status,503);
 assert.equal((await reviewWorker.fetch(new Request(origin+"/api/v1/member/me"),env)).status,404);
 assert.equal((await reviewWorker.fetch(new Request("https://anevum.com/api/v1/member/auth-methods"),env)).status,404);
 const home=await reviewWorker.fetch(new Request(origin+"/"),env);
 assert.equal(home.status,200);
 assert.equal(home.headers.get("set-cookie"),null);
});

test("user entry points resolve to canonical membership without assigning Creator rights",()=>{
 const shell=source("web/src/components/Shell.tsx");
 const rail=source("web/src/components/CinematicSiteRail.tsx");
 const portal=source("web/src/lib/portal-destinations.ts");
 const member=source("web/src/pages/Phase1MemberPage.tsx");
 const overview=source("web/src/components/MemberExperienceMap.tsx");
 assert.match(shell,/canonicalAuthClient\.useSession\(\)/);
 assert.match(shell,/canonicalMember\?"\/member":"\/join"/);
 assert.match(shell,/label:"My profile",detail:/);
 assert.match(rail,/label:"Profile",to:"\/member"/);
 assert.match(portal,/path:"\/join",category:"Account"/);
 assert.match(portal,/path:"\/member",category:"Account"/);
 assert.match(member,/MemberExperienceMap profile=\{persisted\}/);
 assert.match(overview,/profile\?\.visibility==="public"/);
 assert.match(overview,/Joining now does not grant legacy Creator Studio or staff access/);
 assert.doesNotMatch(overview,/localStorage|sessionStorage|Math\.random\(/);
});
