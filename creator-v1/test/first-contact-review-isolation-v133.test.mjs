import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const config=JSON.parse(load("wrangler.first-contact-review-v133.jsonc"));
const worker=load("web/first-contact-review-v133.mjs");
const expectedHost="anevum-first-contact-v133-review.devonakins.workers.dev";

test("V133 preview is an isolated no-binding Workers.dev site",()=>{
 assert.equal(config.name,"anevum-first-contact-v133-review");
 assert.equal(config.workers_dev,true);
 assert.equal(config.preview_urls,false);
 assert.equal(config.main,"./web/first-contact-review-v133.mjs");
 assert.equal(config.assets?.binding,"ASSETS");
 assert.equal(config.assets?.directory,"./dist/web");
 assert.equal(config.assets?.not_found_handling,"single-page-application");
 assert.equal(config.assets?.run_worker_first,true);
 const disallowed=[
  "routes","route","d1_databases","r2_buckets","kv_namespaces","vars",
  "services","unsafe","secrets","durable_objects","ai","vectorize","hyperdrive",
  "dispatch_namespaces","send_email","queues","pipelines","workflows","analytics_engine_datasets"
 ];
 for(const key of disallowed)assert.equal(Object.hasOwn(config,key),false,key);
});

test("V133 review accepts only verified workers.dev host and read-only requests",()=>{
 assert.match(worker,new RegExp(expectedHost.replaceAll(".","\\.")));
 assert.match(worker,/url\.protocol!=="https:"\|\|url\.hostname!==HOST/);
 assert.match(worker,/request\.method!=="GET"&&request\.method!=="HEAD"/);
 assert.match(worker,/405/);
 assert.match(worker,/if\(!PUBLIC\.test\(url\.pathname\)/);
 assert.match(worker,/url\.search\.length>1400/);
 assert.match(worker,/token\|password\|email\|secret\|key\|session/);
 assert.match(worker,/\/api\/v1\//);
 assert.match(worker,/community/);
 assert.match(worker,/status/);
 assert.match(worker,/categories/);
 assert.match(worker,/projects/);
 assert.match(worker,/creators/);
 assert.match(worker,/boards/);
 assert.match(worker,/showcases/);
 assert.doesNotMatch(worker,/fetch\(request\)|new Request\(request|request\.headers\.get\(["']cookie/);
 assert.match(worker,/headers:\{accept:"application\/json"\}/);
 assert.match(worker,/redirect:"manual"/);
 assert.match(worker,/headers\.delete\("set-cookie"\)/);
});

test("V133 preview has no registration, access, or production mutation permissions",()=>{
 assert.match(worker,/referrer-policy/);
 assert.match(worker,/x-robots-tag/);
 assert.match(worker,/noindex, nofollow/);
 assert.match(worker,/cache-control/);
 assert.match(worker,/no-store/);
 assert.match(worker,/default-src 'none'/);
 assert.match(worker,/form-action 'none'/);
 assert.match(worker,/permissions-policy/);
 assert.match(worker,/memberAccess:false/);
 assert.match(worker,/productionDeployment:false/);
 assert.match(worker,/database:false/);
 assert.match(worker,/x-anevum-preview/);
 assert.match(worker,/READ-ONLY PREVIEW/);
 assert.match(worker,/JOIN ON ANEVUM.COM/);
 assert.match(worker,/role="note"/);
 assert.match(worker,/outside the React root/);
 assert.doesNotMatch(worker,/wrangler|CLOUDFLARE_|api[_-]?key|Bearer |eval\(|new Function|document\.cookie|new WebSocket/);
});
