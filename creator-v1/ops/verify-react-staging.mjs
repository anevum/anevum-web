// Exact-identity read-only preflight. No network, Cloudflare credentials, or mutations.
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const read=path=>readFileSync(resolve(root,path),"utf8");
const config=JSON.parse(read("wrangler.react-staging-path.jsonc"));

export function validateStagingConfig(){
  assert.equal(config.name,"anevum-creator-v1-react-staging");
  assert.equal(config.main,"./web/staging-path-worker.mjs");
  assert.equal(config.workers_dev,false);
  assert.equal(config.preview_urls,false);
  assert.deepEqual(config.routes,[{pattern:"next.anevum.com/creator/*",zone_name:"anevum.com"}]);
  assert.equal(config.assets?.directory,"./dist/react-staging");
  assert.equal(config.assets?.binding,"ASSETS");
  assert.equal(config.assets?.run_worker_first,true);
  assert.equal(config.assets?.not_found_handling,"single-page-application");
  assert.equal(config.d1_databases?.length,1);
  assert.deepEqual(config.d1_databases.map(x=>({binding:x.binding,id:x.database_id})),[
    {binding:"COMMUNITY_DB",id:"fa96e36d-6257-4883-bf15-074947e11a13"}
  ]);
  const raw=JSON.stringify(config);
  assert.doesNotMatch(raw,/anevum\.com\/\*"|anevum-creator-v1"|6c7b5f0c-33db-4b6a-9569-0a6af5e07534|RHEN|ALPACA|AUTH_PEPPER|RESEND_API_KEY|TURNSTILE_SECRET/i);
  const source=read("web/staging-path-worker.mjs");
  assert.match(source,/next\.anevum\.com/);
  assert.match(source,/Read-only staging preview/);
  assert.match(source,/publicApi\.fetch\(clean,env,ctx\)/);
  assert.match(source,/env\.ASSETS\.fetch\(clean\)/);
  assert.doesNotMatch(source,/set-cookie|AUTH_PEPPER|STAGING_INVITE_EMAILS/i);
}
export function validateGeneratedAssets(){
  const folder=resolve(root,"dist/react-staging");
  const htmlPath=resolve(folder,"index.html");
  assert.ok(existsSync(htmlPath),"Missing staging HTML; run the staging Vite build");
  const html=readFileSync(htmlPath,"utf8");
  const urls=[...html.matchAll(/(?:src|href)="(\/creator\/assets\/[^"]+\.(?:js|css))"/g)].map(x=>x[1]);
  assert.ok(urls.some(x=>x.endsWith(".js")),"Missing prefixed JavaScript");
  assert.ok(urls.some(x=>x.endsWith(".css")),"Missing prefixed CSS");
  for(const asset of urls){
    assert.match(asset,/^\/creator\/assets\/index-[A-Za-z0-9_-]+\.(js|css)$/);
    assert.ok(existsSync(resolve(folder,asset.replace(/^\/creator\//,""))),"Missing staged asset "+asset);
  }
  assert.doesNotMatch(html,/(?:src|href)="\/assets\//);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  validateStagingConfig();
  if(process.argv.includes("--generated"))validateGeneratedAssets();
  console.log("CREATOR_REACT_STAGING_CONFIG=PASS");
  if(process.argv.includes("--generated"))console.log("CREATOR_REACT_STAGING_ASSETS=PASS");
}
