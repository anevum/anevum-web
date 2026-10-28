import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../web/",import.meta.url);
const page=readFileSync(new URL("index.html",root),"utf8");
const manifest=JSON.parse(readFileSync(new URL("public/anevum-severance-v141.webmanifest",root),"utf8"));
const render=readFileSync(new URL("../ops/generate-severance-brand-v141.py",import.meta.url),"utf8");
const image="https://anevum.com/anevum-severance-share-v141-1200x630.png";
test("V141: non-JS crawler receives exact versioned share image",()=>{
 for(const token of [
   '<meta property="og:image" content="'+image+'" />',
   '<meta property="og:image:secure_url" content="'+image+'" />',
   '<meta name="twitter:image" content="'+image+'" />',
   '<meta property="og:image:width" content="1200" />',
   '<meta property="og:image:height" content="630" />',
   '<meta property="og:image:type" content="image/png" />',
   '<meta property="og:title" content="TRANSCOSMIC: SEVERANCE — ANEVUM" />'
 ]) assert.ok(page.includes(token),"Missing social metadata "+token);
 assert.match(page,/property="og:image:alt" content="TRANSCOSMIC: SEVERANCE/);
 assert.match(page,/property="og:description" content="[^"]+in development[^"]+"/);
 assert.doesNotMatch(page,/og:image[^>]+social-share-v2|twitter:image[^>]+social-share-v2/);
 assert.doesNotMatch(page,/play now|live multiplayer|open beta|public playable/i);
});
test("V141: versioned Apple/Android icon references and ANEVUM install identity",()=>{
 for(const token of [
  '<link rel="apple-touch-icon" sizes="180x180" href="%BASE_URL%anevum-severance-apple-touch-v141-180.png" />',
  '<link rel="icon" type="image/png" sizes="64x64" href="%BASE_URL%anevum-severance-favicon-v141-64.png" />',
  '<link rel="manifest" href="%BASE_URL%anevum-severance-v141.webmanifest" />'
 ]) assert.ok(page.includes(token),"Missing versioned home screen metadata "+token);
 assert.equal(manifest.name,"ANEVUM");assert.equal(manifest.short_name,"ANEVUM");
 assert.equal(manifest.id,"/");assert.equal(manifest.start_url,"/");assert.equal(manifest.scope,"/");
 assert.equal(manifest.icons.length,3);
 for(const [src,dimensions,purpose] of [
  ["/anevum-severance-icon-v141-192.png","192x192","any"],
  ["/anevum-severance-icon-v141-512.png","512x512","any"],
  ["/anevum-severance-maskable-v141-512.png","512x512","maskable"]]){
  assert.ok(manifest.icons.some(i=>i.src===src&&i.sizes===dimensions&&i.purpose===purpose&&i.type==="image/png"),"Missing PWA variant "+src);
 }
});
test("V141 original orbit, flare, satellite preserved, and render is local",()=>{
 assert.ok(render.includes('rotate(-17 256 256)'));
 assert.ok(render.includes('M256 62 276 214 326 256 276 298 256 450 236 298 186 256 236 214Z'));
 assert.ok(render.includes('cx="391" cy="132" r="22"'));
 assert.ok(render.includes('cairosvg.svg2png'));
 for(const name of ["anevum-severance-apple-touch-v141-180.png","anevum-severance-icon-v141-192.png","anevum-severance-icon-v141-512.png","anevum-severance-maskable-v141-512.png","anevum-severance-share-v141-1200x630.png"])
  assert.ok(render.includes(name),"Art generator missing "+name);
 assert.doesNotMatch(render,/requests\.get|urllib\.request|urlopen\(|pexels|stockphoto/);
});
