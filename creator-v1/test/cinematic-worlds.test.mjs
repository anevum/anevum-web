import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
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
  const artwork=read("web/src/components/CosmicArtwork.tsx");
  const home=read("web/src/pages/HomePage.tsx");
  const card=read("web/src/components/ProjectCard.tsx");
  for(const category of ["games","tools","automation","research","creative","learning","libraries","other"]){
    assert.match(svg,new RegExp(category+":"));
    assert.ok(home.includes('id:"'+category+'"'),category);
    assert.ok(artwork.includes(category+':"'),category);
    assert.ok(card.includes(category+':"'+category+'"'),category);
  }
  assert.match(svg,/viewBox="0 0 1600 700"/);
  assert.match(artwork,/aria-hidden=\{title\?undefined:true\}/);
  assert.match(svg,/useId\(\)/);
  assert.doesNotMatch(svg,/<image|<foreignObject|Math\.random|setInterval/);
});
test("home preserves linked discovery, real creator channels and existing member services",()=>{
  const home=read("web/src/pages/HomePage.tsx");
  const shell=read("web/src/components/Shell.tsx");
  for(const link of ['/discover','/start','/community','/levels','/creators','/guide','/create'])
    assert.ok(home.includes(link)||shell.includes(link),link);
  for(const route of ["/library","/member","/join","/status"])assert.ok(shell.includes(route),route);
   assert.match(read("web/src/App.tsx"),/path="account" element={<Navigate to="\/member" replace\/>}/);
  assert.match(home,/CelestialEmblem/);
  assert.match(home,/LevelPanel/);
  assert.match(home,/CosmicArtwork/);
  assert.doesNotMatch(shell,/mobile-bottom-nav/);
});
test("interactive art supports mobile, focus-visible and reduced motion",()=>{
  const css=read("web/src/cinematic-worlds.css")+read("web/src/cinematic-polish.css");
  for(const query of ["max-width:1380px","max-width:1100px","max-width:820px","max-width:600px","max-width:360px","prefers-reduced-motion:reduce","forced-colors:active","focus-visible"])
    assert.ok(css.includes(query),query);
  assert.doesNotMatch(css,/position:fixed\s*;\s*bottom:0|scrollbar-width:\s*none/);
});

test("secondary pages share the same world art while preserving genuine content and staff/member boundaries",()=>{
  const heading=read("web/src/components/PortalHeading.tsx");
  const project=read("web/src/pages/ProjectPage.tsx");
  const creators=read("web/src/pages/CreatorsPage.tsx");
  const community=read("web/src/pages/CommunityPage.tsx");
  const css=read("web/src/cinematic-subpages.css");
  for(const section of [heading,project,creators,community])
    assert.match(section,/CosmicArtwork/);
  assert.match(project,/safeExternal/);
  assert.match(project,/MemberEngagementPanel/);
  assert.match(project,/CATEGORY ILLUSTRATION/);
  assert.match(creators,/memberCreatorProfile/);
  assert.match(creators,/detailed\?\.achievements/);
  assert.match(community,/readProjects/);
  assert.match(community,/readCreators/);
  assert.match(community,/readCommunityPosts/);
  assert.match(community,/communityPosts === true/);
  assert.match(community,/to="\/boards"/);
  assert.match(community,/invitation-only|invited member testing|Member participation is currently invitation-only/i);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test("mobile QA preserves both primary hero actions without overlap by secondary feature",()=>{
  const css=read("web/src/cinematic-mobile-review.css");
  assert.match(css,/max-width:600px/);
  assert.match(css,/\.cw-hero-feature\{display:none\}/);
  assert.match(css,/\.portal-navigation\{display:none\}/);
  assert.match(css,/\.signal-strip\{display:none\}/);
});

test("real responsive WebP originals are part of the app, with SVG fallback and real Vite base paths",()=>{
 const art=read("web/src/components/CosmicArtwork.tsx");
 const main=read("web/src/main.tsx");
 const css=read("web/src/cinematic-raster-art.css");
 const start=read("web/src/pages/StartPage.tsx");
 for(const filename of ["hero/portal-world.webp","hero/skyward-city.webp","categories/apps.webp","categories/games.webp","categories/creative.webp","categories/learning.webp","categories/libraries.webp","categories/automation.webp","categories/research.webp","categories/other.webp"]){
   assert.ok(existsSync(new URL("../web/public/assets/cinematic/"+filename,import.meta.url)),filename);
 }
 assert.match(art,/import.meta.env.BASE_URL/);
 assert.match(art,/onError=\{\(\)=>setFailed\(true\)\}/);
 assert.match(art,/CosmicIllustration scene=\{scene\}/);
 assert.match(art,/loading=\{priority\?"eager":"lazy"\}/);
 assert.match(main,/cinematic-raster-art.css/);
 assert.match(start,/cw-start-portal-art/);
 assert.match(css,/prefers-reduced-motion/);
});

test("the isolated offline browser fixture serves nested cinematic WebP without traversal or public API impersonation",()=>{
 const f=read("test/portal-offline-preview.mjs");
 assert.match(f,/cinematic\\\//);
 assert.match(f,/hero\|categories/);
 assert.match(f,/\.webp/);
 assert.match(f,/".webp":"image\/webp"/);
 assert.match(f,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(f,/127\.0\.0\.1/);
});

test("unified V009 keeps one navigation plane across homepage and inner pages",()=>{
 const shell=read("web/src/components/Shell.tsx");
 const css=read("web/src/cinematic-final-polish.css");
 const html=read("web/index.html");
 assert.match(shell,/site-shell--home/);
 const unified=read("web/src/site-experience-v009.css");
 assert.match(shell,/av9-header/);
 assert.match(shell,/av9-menu-trigger/);
 assert.match(shell,/<dialog ref=\{menuDialog\}/);
 assert.doesNotMatch(shell,/<CinematicSiteRail\/>/);
 assert.match(unified,/\.av9-shell \.portal-navigation,\.av9-shell \.signal-strip\{display:none!important\}/);
 assert.match(css,/\.site-shell--home \.cw-hero\{height:clamp/);
 assert.match(css,/\.portal-page-heading-stamp>span\{/);
 assert.match(html,/og:site_name/);
 assert.match(html,/og:title/);
 assert.match(html,/icon.*%BASE_URL%favicon\.svg/);
 assert.match(read("web/src/pages/DiscoverPage.tsx"),/accent={world\?\.accent\|\|"UNIVERSE\."}/);
  assert.match(read("web/src/pages/DiscoverPage.tsx"),/world=immersive\?immersiveWorlds/);
  assert.match(read("web/src/App.tsx"),/path="discover" element={<DiscoverPage\/>}/);
 assert.ok(existsSync(new URL("../web/public/favicon.svg",import.meta.url)));
});

test("the in-viewport feature illustration loads eagerly with the hero rather than remaining empty during initial paint",()=>{
  const s=read("web/src/pages/HomePage.tsx");
  assert.match(s,/<CosmicArtwork scene="hero" priority\/>/);
  assert.match(s,/<CosmicArtwork scene="portal" priority\/>/);
});
