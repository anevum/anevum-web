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


test("REPLY editorial page presents approved work context, genuine on-page navigation and labelled concept art",async()=>{
 const response=await req("/reply");
 const html=await response.text();
 assert.equal(response.status,200);
 assert.match(html,/<section class="page active reply-page" data-page="reply" aria-label="REPLY novel">/);
 assert.match(html,/<h1 class="display">A signal\.<br><em>A human answer\.<\/em><\/h1>/);
 const nav=html.match(/<nav class="reply-quick-nav" aria-label="Explore REPLY on this page">([\s\S]*?)<\/nav>/)?.[1];
 assert.ok(nav,"REPLY must offer a useful page-local reading index");
 const destinations=[...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(destinations,["reply-work","reply-edition","reply-universe"]);
 for(const id of destinations){
  assert.match(html,new RegExp('id="'+id+'"'),"Missing on-page anchor "+id);
 }
 assert.match(html,/<figure class="reply-art">/);
 assert.match(html,/class="book-3d reply-book" role="img" aria-label="REPLY typographic book cover concept\. This is not an approved final publication cover\."/);
 assert.match(html,/<figcaption>Art direction study[\s\S]*?Not a final approved cover<\/figcaption>/);
 assert.match(html,/<dl class="reply-facts" aria-label="About the novel">/);
 assert.match(html,/<dt>Author<\/dt><dd>Devon Akins<\/dd>/);
 assert.match(html,/<dt>Universe<\/dt><dd>The Transcosmic<\/dd>/);
 assert.match(html,/<dt>Placement<\/dt><dd>Book one<\/dd>/);
 assert.match(html,/<section class="reply-edition-panel" id="reply-edition" aria-labelledby="reply-edition-heading">/);
 assert.match(html,/A revised-edition release date and purchasing details have not been confirmed/);
 assert.match(html,/<section class="reply-universe" id="reply-universe" aria-labelledby="reply-universe-heading">/);
 assert.doesNotMatch(html,/preorder|buy now|available to purchase|ISBN|retailer/i);
 assert.doesNotMatch(html,/Ovara|Nali Solan|Skygate|Merva|staff\/command|api\/v1\/member/i);
 assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b|<input\b|onload=|onclick=/i);
});

test("REPLY edition/illustration update leaves all other pages and publication security boundaries intact",async()=>{
 const home=await (await req("")).text();
 assert.doesNotMatch(home,/<nav class="reply-quick-nav"|class="reply-edition-panel"|class="reply-art-stage"/);
 for(const slug of ["","/works","/reply","/transcosmic","/wiki","/journal","/about"]){
  const response=await req(slug);
  const html=await response.text();
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/aria-label="Continue exploring"/);
  assert.match(response.headers.get("X-Robots-Tag"),/noindex/);
  assert.match(response.headers.get("Content-Security-Policy"),/default-src 'none'/);
  for(const href of internalLinks(html)){
   const relative=href.slice("/original-works".length);
   assert.ok(pages.includes(relative),"Broken public page route: "+href);
  }
 }
});
