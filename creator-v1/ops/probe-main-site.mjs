// Anonymous acceptance for the public main-site release. Never writes D1.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
const base="https://anevum.com";
async function get(path,expected=200) {
  const res=await fetch(base+path,{redirect:"manual",headers:{Accept:"*/*"},signal:AbortSignal.timeout(15000)});
  assert.equal(res.status,expected,path);
  assert.equal(res.headers.get("set-cookie"),null,path+" sets a cookie");
  return res;
}
const digest=data=>createHash("sha256").update(data).digest("hex");
const html=await get("/").then(r=>{assert.match(r.headers.get("content-security-policy"),/frame-ancestors 'none'/);return r.text();});
assert.match(html,/id="root"/);
const js=html.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
const css=html.match(/href="(\/assets\/[^" ]+\.css)"/)?.[1];
assert.ok(js&&css,"compiled entrypoints missing");
for(const path of [js,css]) {
  const bytes=Buffer.from(await (await get(path)).arrayBuffer());
  const local=readFileSync(new URL("../dist/web"+path,import.meta.url));
  assert.equal(digest(bytes),digest(local),path+" differs from reviewed build");
}
for(const route of ["/discover","/creators","/community","/start","/guide","/levels","/workspace","/account"])
  assert.match(await (await get(route)).text(),/id="root"/,route);
const manifest=JSON.parse(readFileSync(new URL("../web/public/assets/cinematic/manifest.json",import.meta.url),"utf8"));
assert.equal(manifest.assets.length,10);
for(const entry of manifest.assets) {
  const path="/assets/cinematic/"+entry.path;
  const res=await get(path);assert.match(res.headers.get("content-type"),/image\/webp/);
  assert.equal(digest(Buffer.from(await res.arrayBuffer())),entry.sha256,path);
}
const portfolio=await (await get("/portfolio/")).text();
assert.match(portfolio,/href="https:\/\/anevum.com\/portfolio\/"/);
assert.match(portfolio,/Devon Akins/);
for(const path of ["app.js","styles.css","assets/display.woff","assets/body.woff","assets/editorial.woff","assets/devon-akins.jpg","assets/fold-interface.webp","assets/rhen-interface.webp","assets/anevum-interface.webp"]){
  const bytes=Buffer.from(await (await get("/portfolio/"+path)).arrayBuffer());
  const local=readFileSync(new URL("../web/public/portfolio/"+path,import.meta.url));
  assert.equal(digest(bytes),digest(local),"portfolio "+path);
}
const status=await (await get("/api/v1/status")).json();
assert.ok(Number.isSafeInteger(status.counts.publishedProjects));
const projects=await (await get("/api/v1/projects?limit=2")).json();
assert.ok(Array.isArray(projects.items));
for(const path of ["/api/v1/member/me","/api/v1/staff/queue","/rhen","/lab","/command","/studio","/creator/api/v1/member/me"])
  await get(path,404);
const alias=await get("/creator/discover?category=games",308);
assert.equal(alias.headers.get("location"),"/discover?category=games");
const post=await fetch(base+"/api/v1/projects",{method:"POST",redirect:"manual",signal:AbortSignal.timeout(15000)});
assert.equal(post.status,405);
console.log(JSON.stringify({scope:"PUBLIC_MAIN_SITE_ONLY",result:"PASS",publicCounts:status.counts,artworkHashes:10,portfolioRelocation:"PASS",compiledEntrypointHashes:"PASS",privateEndpoints:"CLOSED",sourceSha:process.env.GITHUB_SHA||null}));
