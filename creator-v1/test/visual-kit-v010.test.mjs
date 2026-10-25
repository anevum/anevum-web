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

test("V136.018 retires optional raster kit without touching site navigation",()=>{
 assert.doesNotThrow(()=>parse(kit,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(kit,/export async function checkVisualKit/);
 assert.match(kit,/Promise<boolean>\{return false;/);
 assert.match(kit,/export function VisualKitAtmosphere/);
 assert.match(kit,/return null/);
 assert.match(kit,/export function publicVisualRoom/);
 assert.doesNotMatch(kit,/new Image\(|fetch\(|\.webp|assets\/anevum-kit/);
 assert.match(shell,/<VisualKitAtmosphere room=\{publicVisualRoom\(location\.pathname\)\}/);
 assert.match(hero,/<VisualKitAtmosphere room="home" placement="hero"\/>/);
 assert.match(main,/visual-kit-v010\.css/);
});
test("V010 retirement keeps original brand and protected account boundary",()=>{
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
test("optional pack cannot mount even when a historical manifest exists",()=>{
 const manifest=new URL("../web/public/assets/anevum-kit/manifest.json",import.meta.url);
 assert.match(kit,/return false/);
 assert.doesNotMatch(kit,/fetch\(|new Image\(|backgrounds\/|textures\//);
 if(existsSync(manifest))assert.ok(readFileSync(manifest).length>0,'Historical asset provenance remains readable');
});
