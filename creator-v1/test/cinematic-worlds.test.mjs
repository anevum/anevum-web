import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("cinematic visual layer is additive to the existing React/Cloudflare application",()=>{
  const main=read("web/src/main.tsx");
  assert.match(main,/import "\.\/cosmic-observatory\.css"/);
  assert.match(main,/import "\.\/celestial-artifacts\.css"/);
  assert.match(main,/import "\.\/cinematic-worlds\.css"/);
  assert.match(main,/import "\.\/cinematic-polish\.css"/);
  assert.doesNotMatch(main,/offline-preview|synthetic-fixture/);
});
test("homepage never invents projects, accounts, levels, prices or usage metrics",()=>{
  const home=read("web/src/pages/HomePage.tsx");
  const card=read("web/src/components/ProjectCard.tsx");
  for(const phrase of ["readStatus","readProjects","readCreators","readCategories","No fake projects, ratings or activity","publishedProjects","publishedCreators"])assert.ok(home.includes(phrase),phrase);
  assert.match(home,/projects\.slice\(0,5\)\.map/);
  assert.match(home,/creators\.map/);
  assert.match(home,/portal\.state==="ready"/);
  assert.match(home,/CATEGORY/);
  assert.match(card,/CATEGORY ILLUSTRATION/);
  assert.doesNotMatch(home,/Math\.random|sampleVotes|nova_demo|fakeMessage|example\.com|15000\s*XP/);
  assert.doesNotMatch(card,/Math\.random|sampleVotes|fakeMessage/);
});
test("original deterministic illustration supports all published content categories",()=>{
  const svg=read("web/src/components/CosmicIllustration.tsx");
  const home=read("web/src/pages/HomePage.tsx");
  const card=read("web/src/components/ProjectCard.tsx");
  for(const category of ["games","tools","automation","research","creative","learning","libraries","other"]){
    assert.match(svg,new RegExp(category+":"));
    assert.ok(home.includes('id:"'+category+'"'),category);
    assert.ok(card.includes(category+':"'+category+'"'),category);
  }
  assert.match(svg,/viewBox="0 0 1600 700"/);
  assert.match(svg,/aria-hidden=\{title\?undefined:true\}/);
  assert.match(svg,/useId\(\)/);
  assert.doesNotMatch(svg,/<image|<foreignObject|Math\.random|setInterval/);
});
test("home preserves linked discovery, real creator channels and existing member services",()=>{
  const home=read("web/src/pages/HomePage.tsx");
  const shell=read("web/src/components/Shell.tsx");
  for(const link of ['/discover','/start','/community','/levels','/creators','/guide','/create'])
    assert.ok(home.includes(link)||shell.includes(link),link);
  for(const route of ["/library","/account","/status"])assert.ok(shell.includes(route),route);
  assert.match(home,/CelestialEmblem/);
  assert.match(home,/LevelPanel/);
  assert.match(home,/CosmicIllustration/);
  assert.doesNotMatch(shell,/mobile-bottom-nav/);
});
test("interactive art supports mobile, focus-visible and reduced motion",()=>{
  const css=read("web/src/cinematic-worlds.css")+read("web/src/cinematic-polish.css");
  for(const query of ["max-width:1380px","max-width:1100px","max-width:820px","max-width:600px","max-width:360px","prefers-reduced-motion:reduce","forced-colors:active","focus-visible"])
    assert.ok(css.includes(query),query);
  assert.doesNotMatch(css,/position:fixed\s*;\s*bottom:0|scrollbar-width:\s*none/);
});
