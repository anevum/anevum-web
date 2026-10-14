import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../web");
const folder=path.join(root,"public/assets/cinematic-v2/atmosphere");
const manifest=JSON.parse(readFileSync(path.join(folder,"manifest.json"),"utf8"));

test("cinematic media manifest declares original decorative assets only",()=>{
  assert.equal(manifest.assets.length,4);
  assert.match(manifest.status,/REVIEW_ART_PASS/);
  assert.match(manifest.authoring,/No screenshot crops/);
});

for (const asset of manifest.assets){
  test(asset.path+" has verified dimensions, transparency and SHA-256",()=>{
    assert.match(asset.path,/^orbital-(haze|dust)-(desktop|mobile)\.webp$/);
    const file=path.join(folder,asset.path);
    assert.equal(statSync(file).size,asset.size_bytes);
    const bytes=readFileSync(file);
    assert.equal(bytes.toString("ascii",0,4),"RIFF");
    assert.equal(bytes.toString("ascii",8,12),"WEBP");
    assert.equal(bytes.toString("ascii",12,16),"VP8X");
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
    assert.notEqual(bytes[20]&0x10,0,"image must retain transparent alpha");
    assert.equal(bytes.readUIntLE(24,3)+1,asset.width);
    assert.equal(bytes.readUIntLE(27,3)+1,asset.height);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256);
    assert.equal(asset.alpha,true);
  });
}

test("cinematic media budget and responsive loading contract",()=>{
  const desktop=manifest.assets.filter(x=>x.path.endsWith("-desktop.webp"));
  const mobile=manifest.assets.filter(x=>x.path.endsWith("-mobile.webp"));
  assert.equal(desktop.length,2);
  assert.equal(mobile.length,2);
  assert(desktop.every(x=>x.width>=3840&&x.height>=1600));
  assert(mobile.every(x=>x.width>=1440&&x.height>=2560));
  assert(desktop.reduce((n,x)=>n+x.size_bytes,0)<650_000);
  assert(mobile.reduce((n,x)=>n+x.size_bytes,0)<350_000);
  const component=readFileSync(path.join(root,"src/components/CinematicAtmosphere.tsx"),"utf8");
  const page=readFileSync(path.join(root,"src/pages/CinematicLandingPage.tsx"),"utf8");
  for(const asset of manifest.assets)assert(component.includes(asset.path),"component references "+asset.path);
  assert(component.includes("max-width:640px"),"mobile source explicitly selected");
  assert(page.includes("<CinematicAtmosphere/>"),"scene uses responsive atmosphere");
  assert(page.includes("<CinematicPortalFX/>"),"scene preserves rendered portal lighting");
  assert(page.includes("<CinematicDiscoverySections"),"real public discovery is present");
});

test("offline preview explicitly allows only cinematic alpha image paths",()=>{
  const fixture=readFileSync(path.join(root,"../test/portal-offline-preview.mjs"),"utf8").replaceAll("\\/","/");
  assert(fixture.includes("cinematic-v2/atmosphere/orbital-(?:haze|dust)-(?:desktop|mobile)"));
  assert(fixture.includes("if(!/^assets"),"public asset allowlist remains restricted");
});
