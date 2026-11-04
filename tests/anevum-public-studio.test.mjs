import test from "node:test";
import assert from "node:assert/strict";
import worker from "../apps/anevum-public-studio/worker.mjs";

const root="https://anevum.com/original-works";
const pages=["","/works","/reply","/transcosmic","/wiki","/journal","/about"];
const req=(path="",init={})=>worker.fetch(new Request(root+path,init));
const internalLinks=html=>[...html.matchAll(/href="(\/original-works(?:\/[a-z-]+)?)"/g)].map(m=>m[1]);

test("all seven V2 routes contain one accessible editorial page, correct links and security headers",async()=>{
 for(const path of pages){
  const response=await req(path);
  assert.equal(response.status,200,path);
  assert.equal(response.headers.get("Content-Type"),"text/html; charset=utf-8");
  assert.equal(response.headers.get("X-Anevum-Surface"),"anevum-original-works-public-v2");
  assert.match(response.headers.get("X-Robots-Tag"),/noindex.*noarchive/);
  assert.match(response.headers.get("Content-Security-Policy"),/default-src 'none'/);
  const body=await response.text();
  assert.match(body,/<html lang="en">/);
  assert.match(body,/<main id="main" tabindex="-1">/);
  assert.equal((body.match(/<h1\b/g)||[]).length,1,path);
  assert.match(body,/<nav class="nav navigation desktop-nav" aria-label="Primary navigation">/);
  assert.match(body,/<details class="mobile-menu"><summary>Menu<\/summary>/);
  assert.match(body,/href="\/original-works\/reply"/);
  assert.doesNotMatch(body,/<script\b|<iframe\b|<form\b|<input\b|\bonclick=|\bonload=/i);
  assert.doesNotMatch(body,/Ovara|Nali Solan|Merva|Skygate|staff\/command|api\/v1\/member/i);
  for(const href of internalLinks(body)){
   const route=href.slice("/original-works".length);
   assert.ok(pages.includes(route),path+" contains broken link "+href);
  }
 }
});

test("visual publication stays separated from reader canon and manuscript",async()=>{
 const wiki=await (await req("/wiki")).text();
 assert.match(wiki,/Canon articles remain under editorial review/);
 assert.match(wiki,/Articles not yet published/i);
 assert.doesNotMatch(wiki,/22 articles|408 entries|chronology|in-world written records/i);
 const reply=await (await req("/reply")).text();
 assert.match(reply,/Revision in progress|author revision/i);
 assert.doesNotMatch(reply,/purchase now|preorder now|buy now/i);
});

test("strict host, route, method isolation preserves current apex and APIs",async()=>{
 for(const p of ["/foo","-private","/api","/wiki/ovara","/../../staff"]){
  assert.equal((await req(p)).status,404,p);
 }
 for(const url of ["https://anevum.com/","https://anevum.com/staff","https://backstage.anevum.com/original-works","https://example.com/original-works","http://anevum.com/original-works"]){
  assert.equal((await worker.fetch(new Request(url))).status,404,url);
 }
 const post=await req("",{method:"POST",body:"test"});
 assert.equal(post.status,405);
 assert.equal(post.headers.get("Allow"),"GET, HEAD");
});

test("HEAD responses are bodyless and have the same headers as GET",async()=>{
 for(const path of pages){
  const head=await req(path,{method:"HEAD"});
  const get=await req(path);
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
  assert.deepEqual(Object.fromEntries(head.headers),Object.fromEntries(get.headers));
 }
});

test("no third party URLs, sessions, automatic scripts or indexing until editorial approval",async()=>{
 const body=await (await req()).text();
 assert.doesNotMatch(body,/<link[^>]+rel="canonical"|<script\b|https?:\/\/[^\s"'<>]+/i);
 assert.doesNotMatch(body,/\bauth\b|\bsecret\b|\btoken\b|\bcookie\b|purchase now|preorder now/i);
 assert.match(body,/Public design edition/);
 assert.match(body,/<meta name="robots" content="noindex,nofollow,noarchive"/);
});


test("the entire public experience has a real, accessible editorial reading path",async()=>{
 const slugs=["","/works","/reply","/transcosmic","/wiki","/journal","/about"];
 for(let index=0;index<slugs.length;index++){
  const html=await (await req(slugs[index])).text();
  const journey=html.match(/<nav class="journey" aria-label="Continue exploring">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(journey,"Missing reading-path landmark for "+slugs[index]);
  const next=journey.match(/<a class="journey-next" href="([^"]+)"/)?.[1];
  const expected=root.replace("https://anevum.com","")+(slugs[(index+1)%slugs.length]||"");
  assert.equal(next,expected,"The next destination must always be a real public page");
  const previous=journey.match(/<a class="journey-prev" href="([^"]+)"/)?.[1];
  if(index===0)assert.equal(previous,undefined,"First page should not invent a previous chapter");
  else assert.equal(previous,"/original-works"+slugs[index-1]);
  assert.match(journey,new RegExp('role="img" aria-label="Section '+(index+1)+' of 7"'));
  assert.equal((journey.match(/class="now"/g)||[]).length,1,"Exactly one current section marker");
  assert.equal((journey.match(/class="past"/g)||[]).length,index,"Earlier markers only");
  assert.equal((journey.match(/class="upcoming"/g)||[]).length,6-index,"Future markers only");
  for(const href of internalLinks(journey)){
   const route=href.slice("/original-works".length);
   assert.ok(slugs.includes(route),"The reading path links to an unavailable route: "+href);
  }
  assert.doesNotMatch(journey,/Ovara|Nali Solan|Skygate|manuscript|retailer available/i);
 }
});

test("the reading path preserves server-only rendering and noindex publishing boundaries",async()=>{
 const response=await req("/about");
 const html=await response.text();
 assert.match(html,/<nav class="journey" aria-label="Continue exploring">/);
 assert.match(html,/Back to the beginning/);
 assert.match(html,/href="\/original-works"/);
 assert.doesNotMatch(html,/<script\b|onkeydown=|onclick=|aria-live=/i);
 assert.equal(response.headers.get("X-Anevum-Surface"),"anevum-original-works-public-v2");
 assert.match(response.headers.get("X-Robots-Tag"),/noindex/);
});
