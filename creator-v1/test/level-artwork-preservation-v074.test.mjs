import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const icons=read("web/src/components/LevelEmblem.tsx");
const renderer=read("web/src/lib/evolution-mini-renderer.ts");
const collection=read("web/src/components/LevelCollection.tsx");
const css=read("web/src/level-icon-preservation-v074.css");
const main=read("web/src/main.tsx");
const browser=read("test/capture-sitewide-v012.mjs");
const artifacts=JSON.parse(read("shared/level-artifacts.json"));

test("V074 retains the exact 30 original high-resolution optical level exports",()=>{
  assert.equal(artifacts.length,30);
  for(let i=0;i<30;i++){
    const item=artifacts[i],key=String(i+1).padStart(2,"0");
    assert.equal(item.level,i+1);
    assert.equal(item.icon,"/evolution/assets/level-"+key+"-compact-128.png");
    assert.equal(item.preview,"/evolution/assets/level-"+key+"-256.webp");
    assert.equal(item.poster,"/evolution/assets/level-"+key+"-1024.webp");
    for(const file of [item.icon,item.preview,item.poster])
      assert.ok(statSync(new URL("web/public"+file,new URL("../",import.meta.url))).size>300,
        "Missing original icon export "+file);
  }
  assert.match(collection,/LEVEL_ARTIFACTS/);
  assert.match(collection,/ENTER THE LIVING 3D ARCHIVE/);
  assert.match(collection,/\/evolution\/\?level=/);
});

test("V074 makes shared member and gallery icons optical only, never a moving mini WebGL overlay",()=>{
  assert.doesNotThrow(()=>parse(icons,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(icons,/data-artwork="v073-preserved-optical-icon"/);
  assert.match(icons,/av73-static-level-icon/);
  assert.match(icons,/av62-native-poster/);
  assert.match(icons,/size>104/);
  assert.match(icons,/item\.preview,item\.poster,item\.icon/);
  assert.match(icons,/item\.icon,item\.preview,item\.poster/);
  assert.match(icons,/role="img"/);
  assert.match(icons,/setAssetIndex\(i=>i\+1\)/);
  assert.doesNotMatch(icons,/registerAnimatedSpecimen|evolution-mini-renderer|<canvas|createElement\(['"]canvas['"]\)/);
  // Keep the independent native shader/mesh engine for the 3D archive and its
  // isolated historical runtime tests; it is no longer imported by LevelEmblem.
  assert.match(renderer,/class MiniStage/);
  assert.match(renderer,/canvas\.getContext\('webgl'/);
  assert.match(read("web/public/evolution/index.html"),/evolution\/app\.js/);
  assert.match(read("web/src/components/CompactMemberIdentity.tsx"),/LevelEmblem level=/);
  assert.match(read("web/src/components/LevelPanel.tsx"),/LevelEmblem level=/);
  assert.match(collection,/LevelEmblem level=/);
});

test("V074 contains all small specimens and preserves accessibility and phone layouts",()=>{
  assert.match(main,/level-icon-preservation-v074\.css/);
  assert.ok(main.indexOf("level-icon-preservation-v074.css")>main.indexOf("continuance-worldstage-v064.css"));
  for(const token of [
    ".av73-static-level-icon",
    ".av73-static-level-icon > .av62-native-poster",
    ".av61-specimen .av73-static-level-icon",
    ".an-series-v060 .an-artifact-card-v034 .an-artifact-visual",
    ".av73-static-level-icon[data-live=\"true\"]",
    "max-width:640px",
    "max-width:355px",
    "prefers-reduced-motion:reduce",
    "forced-colors:active",
    "object-fit:contain",
    "overflow:hidden"
  ])assert.ok(css.includes(token),"Missing icon protection: "+token);
  assert.doesNotMatch(css,/background-image:\s*url|image-rendering:\s*pixelated|animation:\s*[^;]*infinite/);
  assert.match(browser,/V074_LEVEL_ICON_ARTWORK/);
  assert.match(browser,/levels-icon-gallery/);
  assert.match(browser,/artwork\.cards!==30/);
  assert.match(browser,/artwork\.meshes!==0/);
});
