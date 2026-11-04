import test from "node:test";
import assert from "node:assert/strict";
import worker from "../apps/anevum-public-studio/worker.mjs";
const root = "https://anevum.com/original-works";
const paths = ["","/works","/reply","/transcosmic","/wiki","/journal","/about"];
const request = (path="", init={}) => worker.fetch(new Request(root+path,init));
test("every public page is functional, self-contained, and not indexed during visual iteration",async()=>{
 for(const path of paths){
  const r=await request(path);
  assert.equal(r.status,200,path);
  assert.equal(r.headers.get("Content-Type"),"text/html; charset=utf-8");
  assert.equal(r.headers.get("X-Anevum-Surface"),"anevum-original-works-public-v1");
  assert.match(r.headers.get("X-Robots-Tag"),/noindex/);
  assert.match(r.headers.get("Content-Security-Policy"),/default-src 'none'/);
  const body=await r.text();
  assert.match(body,/<html lang="en">/);
  assert.match(body,/<main id="main"/);
  assert.match(body,/<nav class="nav"/);
  assert.match(body,/Anevum/);
  assert.match(body,/original-works\/works/);
  assert.match(body,/original-works\/about/);
  assert.doesNotMatch(body,/<script|<iframe|<form|<input/i);
  assert.doesNotMatch(body,/Ovara|Nali Solan|Merva|Skygate|staff\/command|api\/v1\/member/i);
 }
});
test("static preview does not make unpublished editorial claims",async()=>{
 const r=await request("/wiki");
 const t=await r.text();
 assert.match(t,/Canon articles remain under editorial review/);
 assert.match(t,/Articles not yet published/);
 assert.doesNotMatch(t,/22 articles|408 entries|chronology|in-world written records/i);
});
test("public route does not accept writes, unknown paths, or alternate hosts",async()=>{
 for(const p of ["/foo","-private","/api","/wiki/ovara","/../../staff"]){
  const r=await request(p);
  assert.equal(r.status,404,p);
 }
 for(const host of ["https://backstage.anevum.com/original-works","https://example.com/original-works","http://anevum.com/original-works"]){
  const r=await worker.fetch(new Request(host));
  assert.equal(r.status,404,host);
 }
 const r=await request("",{method:"POST",body:"data"});
 assert.equal(r.status,405);
 assert.equal(r.headers.get("Allow"),"GET, HEAD");
});
test("HEAD is header-identical, bodyless, and bypasses application APIs",async()=>{
 const h=await request("/reply",{method:"HEAD"});
 const g=await request("/reply");
 assert.equal(h.status,200);
 assert.equal(await h.text(),"");
 assert.equal(h.headers.get("X-Anevum-Surface"),g.headers.get("X-Anevum-Surface"));
 assert.equal(h.headers.get("Content-Security-Policy"),g.headers.get("Content-Security-Policy"));
});
test("preview pages do not include canonical, session identity, remote assets, or API requests",async()=>{
 const r=await request();
 const body=await r.text();
 assert.doesNotMatch(body,/<link[^>]+rel="canonical"|<script|https?:\/\/[^\s"'<>]+/);
 assert.doesNotMatch(body,/auth|secret|token|cookie|purchase now|preorder now/i);
 assert.match(body,/Public design edition/);
});
