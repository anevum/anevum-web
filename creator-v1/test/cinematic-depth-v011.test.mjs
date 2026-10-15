import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {parse} from "@babel/parser";
const source=relative=>readFileSync(new URL("../"+relative,import.meta.url),"utf8");
const layers=source("web/src/components/CinematicDepthLayers.tsx");
const portal=source("web/src/components/CinematicPortalFX.tsx");
const atmosphere=source("web/src/components/CinematicAtmosphere.tsx");
const hero=source("web/src/components/LiveSignalHero.tsx");
const main=source("web/src/main.tsx");
const css=source("web/src/cinematic-depth-v011.css");

test("V011 layers are integrated inside original React hero without flattening UI",()=>{
  assert.doesNotThrow(()=>parse(layers,{sourceType:"module",plugins:["typescript","jsx"]}));
  assert.match(layers,/CinematicAtmosphere/);
  assert.match(layers,/CinematicPortalFX/);
  assert.match(layers,/av11-depth-foreground/);
  assert.match(hero,/<CosmicArtwork scene="hero" priority\/><CinematicDepthLayers\/>/);
  assert.match(main,/cinematic-depth-v011\.css/);
  assert.match(hero,/readCommunityPosts/);
  assert.match(hero,/SOURCE: APPROVED PUBLIC API/);
  assert.doesNotMatch(layers,/dangerouslySetInnerHTML|fakeProject|fakeUser|Math\.random|localStorage|fetch\(/);
  assert.doesNotMatch(layers,/className="av9-hero-actions"|onClick|onPointerMove/);
});
test("V011 desktop/mobile alpha assets are real independently exported 3840/1440 passes",()=>{
  const root=new URL("../web/public/assets/cinematic-v2/atmosphere/",import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL("manifest.json",root),"utf8"));
  assert.equal(manifest.assets.length,4);
  const expected=new Map([
    ["orbital-haze-desktop.webp",[3840,1600]],
    ["orbital-dust-desktop.webp",[3840,1600]],
    ["orbital-haze-mobile.webp",[1440,2560]],
    ["orbital-dust-mobile.webp",[1440,2560]]
  ]);
  let bytes=0;
  for(const item of manifest.assets){
    assert.deepEqual([item.width,item.height],expected.get(item.path));
    assert.equal(item.alpha,true);
    const filename=new URL(item.path,root);
    const buffer=readFileSync(filename);
    bytes+=buffer.byteLength;
    assert.equal(statSync(filename).size,item.size_bytes);
    assert.equal(createHash("sha256").update(buffer).digest("hex"),item.sha256);
  }
  assert.ok(bytes<=1_000_000,"original alpha passes should be <=1MB combined");
  assert.match(atmosphere,/max-width:640px/);
  assert.match(atmosphere,/orbital-haze-mobile\.webp/);
  assert.match(atmosphere,/orbital-dust-mobile\.webp/);
  assert.match(atmosphere,/orbital-haze-desktop\.webp/);
  assert.match(atmosphere,/orbital-dust-desktop\.webp/);
});
test("V011 emissive motion sleeps when hidden, and has static accessible fallback",()=>{
  assert.match(portal,/IntersectionObserver/);
  assert.match(portal,/visibilitychange/);
  assert.match(portal,/prefers-reduced-motion: reduce/);
  assert.match(portal,/window\.cancelAnimationFrame/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/pointer-events:none/);
  assert.match(css,/max-width:700px/);
  assert.match(css,/\.av11-depth-emissive \.cinema-portal-fx/);
  assert.match(css,/av11-depth-foreground/);
  assert.doesNotMatch(css,/overflow-x:hidden|animation:.*infinite.*glare/i);
});

test("V011 homepage prioritizes cinematic worlds ahead of public status cards",()=>{
  const home=source("web/src/pages/CinematicLandingPage.tsx");
  const signal=source("web/src/components/LiveSignalHero.tsx");
  const deck=source("web/src/components/WorldGatewayDeck.tsx");
  const entry=home.indexOf("<LiveSignalHero ");
  const worlds=home.indexOf("<WorldGatewayDeck/>");
  const index=home.indexOf("<LiveSignalModules");
  const feed=home.indexOf("<CommunityHomeFeed");
  assert.ok(entry>=0&&entry<worlds&&worlds<index&&index<feed,
    "homepage must introduce discovery before dashboard status modules");
  assert.match(signal,/export function LiveSignalModules/);
  assert.match(signal,/readCommunityPosts/);
  assert.match(signal,/LatestReleases projects=/);
  assert.match(signal,/RecentConversations enabled=/);
  assert.match(signal,/MakerChannels creators=/);
  assert.match(signal,/IndexPulse status=/);
  assert.match(deck,/id="world-gateways"/);
  assert.match(signal,/href="#world-gateways"/);
  assert.match(css,/\.av11-live-index-heading/);
  assert.match(css,/max-width:700px/);
  assert.doesNotMatch(home,/fakeMember|fakeProject|Math\.random/);
});
