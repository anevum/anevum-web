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
  assert.match(card,/CATEGORY INDEX/);
  assert.doesNotMatch(home,/Math\.random|sampleVotes|nova_demo|fakeMessage|example\.com|15000\s*XP/);
  assert.doesNotMatch(card,/Math\.random|sampleVotes|fakeMessage/);
});
test("native category panels cover all published categories without pretending to be creator covers",()=>{
  const svg=read("web/src/components/CosmicIllustration.tsx");
  const artwork=read("web/src/components/CosmicArtwork.tsx");
  const home=read("web/src/pages/HomePage.tsx");
  const card=read("web/src/components/ProjectCard.tsx");
  const presets=read("web/src/lib/project-thumbnails.ts");
  for(const category of ["games","tools","automation","research","creative","learning","libraries","other"]){
    assert.match(svg,new RegExp(category+":"));
    assert.ok(home.includes('id:"'+category+'"'),category);
    assert.ok(artwork.includes(category+':{'),category);
    assert.ok(presets.includes(category+':{'),category);
  }
  assert.match(card,/<ProjectThumbnail kind=\{project.category\}/);
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
  const projectPlayer=read("web/src/components/ProjectPlayerShell.tsx");
  const creators=read("web/src/pages/CreatorsPage.tsx");
  const community=read("web/src/pages/CommunityPage.tsx");
  const css=read("web/src/cinematic-subpages.css");
  // V091 creator headers now prioritize verified identity over category art.
  assert.match(heading,/CosmicArtwork/);
  assert.doesNotMatch(community,/CosmicArtwork|CategoryCoverV136/);
  assert.match(community,/ProjectThumbnail/);
  assert.match(community,/data-parity-community="v136\.017"/);
  assert.match(projectPlayer,/ProjectThumbnail/);
  assert.doesNotMatch(creators,/CosmicArtwork|cw-channel-scene/);
  assert.match(project,/safeExternal/);
  assert.match(project,/MemberEngagementPanel/);
  assert.match(project,/ProjectPlayerShell/);
  assert.match(projectPlayer,/ProjectThumbnail/);
  assert.match(projectPlayer,/kind=\{project.category\}/);
  assert.match(creators,/memberCreatorProfile/);
  assert.match(creators,/detailed\?\.achievements/);
  assert.match(community,/readProjects/);
  assert.match(community,/readCreators/);
  assert.match(community,/readCommunityPosts/);
  assert.match(community,/communityPosts === true/);
  assert.match(community,/to="\/boards"/);
  assert.match(community,/invitation-only|invited member testing|Member participation is currently invitation-only|Visit Join for the current account options/i);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test("mobile QA preserves both primary hero actions without overlap by secondary feature",()=>{
  const css=read("web/src/cinematic-mobile-review.css");
  assert.match(css,/max-width:600px/);
  assert.match(css,/\.cw-hero-feature\{display:none\}/);
  assert.match(css,/\.portal-navigation\{display:none\}/);
  assert.match(css,/\.signal-strip\{display:none\}/);
});

test("native index replaces promotional raster references with responsive, keyboard-visible panels",()=>{
 const art=read("web/src/components/CosmicArtwork.tsx");
 const main=read("web/src/main.tsx");
 const css=read("web/src/parity/sitewide-interface-v136.css");
 assert.match(art,/data-presentation="native-index"/);
 assert.doesNotMatch(art,/<img\b|<picture\b|\.webp|community-portals\/|assets\/cinematic\//);
 assert.match(main,/sitewide-interface-v136\.css/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
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
 assert.match(html,/icon.*%BASE_URL%assets\/site-v136-005\/favicon\.svg/);
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

test("V136.019 supplied thumbnails take priority over local vector defaults",()=>{
  const thumbnail=read("web/src/components/ProjectThumbnail.tsx");
  const mapping=read("web/src/lib/project-thumbnails.ts");
  assert.match(thumbnail,/safePackageCover\(uploadedUrl\)/);
  assert.match(thumbnail,/onError=\{uploaded\?/);
  assert.match(mapping,/assets\/default-thumbnails\//);
  assert.match(read("web/src/components/CreatorPackageGallery.tsx"),/uploadedUrl=\{work\.coverUrl\}/);
});
