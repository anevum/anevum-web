import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {parse} from "@babel/parser";

const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const kit=get("web/src/components/VisualKit.tsx");
const shell=get("web/src/components/Shell.tsx");
const hero=get("web/src/components/LiveSignalHero.tsx");
const main=get("web/src/main.tsx");
const css=get("web/src/visual-kit-v010.css");
const importer=get("tools/import_visual_kit_v010.py");

test("V010 layer is valid TSX and degrades to the V009 shell without optional art",()=>{
 assert.doesNotThrow(()=>parse(kit,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(kit,/if\(!ready\|\|!room\)return null/);
 assert.match(kit,/status!=="MOUNTED"/);
 assert.match(kit,/manifest\.version!=="V010"/);
 assert.match(kit,/image\.naturalWidth>=1920/);
 assert.match(kit,/credentials:"omit"/);
 assert.match(kit,/return null; \/\/ account/);
 assert.match(shell,/<VisualKitAtmosphere room=\{publicVisualRoom\(location\.pathname\)\}/);
 assert.match(hero,/<VisualKitAtmosphere room="home" placement="hero"\/>/);
 assert.match(main,/visual-kit-v010\.css/);
});
test("V010 preserves original master images, brand, and data access",()=>{
 const original=get("web/src/components/CosmicArtwork.tsx");
 assert.match(original,/assets\/cinematic\//);
 assert.match(shell,/OrbitalMark/);
 assert.doesNotMatch(kit+css,/https?:\/\/|RHEN TERMINAL|brokerage|setMemberXp|unlockAward|localStorage|sessionStorage/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/\.av9-shell/);
 assert.doesNotMatch(css,/body\s*\{/);
 assert.match(css,/\.av9-shell \.av10-atmosphere--hero/);
});
test("V010 installer locks V004 provenance and never bulk-promotes optional art",()=>{
 assert.match(importer,/EXPECTED_ZIP_SHA256/);
 assert.match(importer,/key="assets-optional\/"\+relative/);
 assert.match(importer,/checksums\.get\(key\)/);
 assert.match(importer,/source_kind/);
 assert.doesNotMatch(importer,/production\/creator-v1|anevum\.com|wrangler deploy/);
 assert.doesNotMatch(importer,/SELECTED\s*=\s*\([\s\S]*"brand\/anevum-current-orbital-mark\.svg"/);
});
test("optional pack is mounted only after manifest and media verification",()=>{
 const manifest=new URL("../web/public/assets/anevum-kit/manifest.json",import.meta.url);
 if(existsSync(manifest)){
   const data=JSON.parse(readFileSync(manifest,"utf8"));
   assert.equal(data.version,"V010");
   assert.equal(data.status,"MOUNTED");
   assert.equal(data.primary_cinematic_masters_replaced,false);
   assert.equal(data.synthetic_community_content,false);
   assert.equal(data.assets.length,28);
 }else{
   assert.match(kit,/if\(!response\.ok/);
 }
});
