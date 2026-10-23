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

test("V079 home presents direct routes and approved public work without duplicated feeds",()=>{
 const home=source("web/src/pages/CinematicLandingPage.tsx");
 const signal=source("web/src/components/LiveSignalHero.tsx");
 const deck=source("web/src/components/WorldGatewayDeck.tsx");
 assert.match(home,/<nav className="av79-gateways"/);
 assert.match(home,/const featured=projects\[0\]\|\|null/);
 assert.match(home,/sort\(byPublication\)/);
 assert.doesNotMatch(home,/const featured=games\[0\]/);
 assert.match(home,/av79-feature/);
 assert.match(home,/projectDetailPath/);
 assert.match(home,/useOwnPlayerCard/);
 assert.match(home,/CompactMemberIdentity/);
 assert.doesNotMatch(home,/<LiveSignalHero |<WorldGatewayDeck |<LiveSignalModules|<CommunityHomeFeed/);
 // Original component remains available to deep links without occupying the first viewport.
 assert.match(signal,/export function LiveSignalModules/);
 assert.match(signal,/readCommunityPosts/);
 assert.match(deck,/id="world-gateways"/);
 assert.match(css,/\.av11-live-index-heading/);
 assert.match(css,/max-width:700px/);
 assert.doesNotMatch(home,/fakeMember|fakeProject|Math\.random/);
});

test("V011 world gateways maintain legible text over bright image regions",()=>{
  const overlay=source("web/src/cinematic-depth-v011.css");
  assert.match(overlay,/\.av9-shell \.av9-world-gateway-art:after/);
  assert.match(overlay,/text-shadow:0 3px 22px/);
  assert.match(overlay,/\.av9-world-gateway-desc/);
  assert.match(overlay,/\.av9-world-gateway-entry/);
  assert.match(overlay,/forced-colors:active/);
  assert.doesNotMatch(overlay,/backdrop-filter:blur\([1-9][0-9]+px\)/);
});
