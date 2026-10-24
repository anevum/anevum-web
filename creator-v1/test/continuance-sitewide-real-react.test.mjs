import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parse} from '@babel/parser';

const read = file => readFileSync(new URL('../'+file, import.meta.url), 'utf8');
const main=read('web/src/main.tsx');
const home=read('web/src/pages/CinematicLandingPage.tsx');
const discover=read('web/src/pages/DiscoverPage.tsx');
const art=read('web/src/components/CosmicArtwork.tsx');
const css=read('web/src/sitewide-cinematic-next.css');
const app=read('web/src/App.tsx');
const shell=read('web/src/components/Shell.tsx');
const community=read('web/src/pages/CommunityPage.tsx');
const publicWorld=read('web/src/pages/Phase1PublicMemberPage.tsx');

test('real existing pages retain exact canonical route and data contracts',()=>{
  for(const source of [main,home,discover,art,app,shell])assert.doesNotThrow(()=>parse(source,{sourceType:'module',plugins:['typescript','jsx']}));
  assert.match(app,/<Route index element={<CinematicLandingPage\/>}/);
  assert.match(app,/<Route path="discover" element={<DiscoverPage\/>}/);
  assert.match(home,/readProjects\(\{limit:"32"\}/);
  assert.match(home,/readCreators\(\{limit:"8"\}/);
  assert.match(home,/readStatus\(signal\)/);
  assert.match(discover,/readProjects\(\{q:q\|\|undefined/);
  assert.match(discover,/readCategories\(signal\)/);
  assert.match(discover,/PageNav route="\/discover"/);
  assert.match(discover,/legacyProjects\.map\(p=><ProjectCard/);
  assert.equal((shell.match(/<IrenGuidedContinuance memberId=/g)||[]).length,1);
  assert.equal((home.match(/MEET IREN/g)||[]).length,1);
});
test('cinematic styling is off by default and only requested by explicit build-time opt-in',()=>{
  assert.match(main,/if\(import\.meta\.env\.VITE_CONTINUANCE_CINEMATIC_SITEWIDE==="true"\)/);
  assert.match(main,/void import\("\.\/sitewide-cinematic-next\.css"\)/);
  assert.equal((home.match(/VITE_CONTINUANCE_CINEMATIC_SITEWIDE/g)||[]).length,1);
  assert.equal((discover.match(/VITE_CONTINUANCE_CINEMATIC_SITEWIDE/g)||[]).length,1);
  assert.doesNotMatch(app,/continuance-cinematic|av-next-cinema|sitewide-cinematic/);
  assert.doesNotMatch(shell,/continuance-cinematic|av-next-cinema|sitewide-cinematic/);
  assert.match(shell,/VITE_CONTINUANCE_CINEMATIC_SITEWIDE/);
  assert.match(shell,/av-next-site-shell/);
  assert.match(css,/\.av9-shell\.av-next-site-shell \.site-header\.av9-header/);
});
test('actual current art masters are responsive and are full-width on retina screens',()=>{
  assert.match(home,/cinematicNextEnabled&&<CosmicArtwork scene="games" priority sizes="100vw" className="av-next-arrival-art"\/>/);
  assert.match(discover,/cinematicNextEnabled&&<div className="av-next-discover-scene"/);
  assert.match(discover,/<CosmicArtwork scene="creative" priority sizes="100vw" className="av-next-discover-art"\/>/);
  assert.match(art,/srcSet=\{originals\[scene\]/);
  assert.match(art,/sizes=\{sizes\?\?/);
  assert.match(art,/community-portals/);
  assert.doesNotMatch(art,/https?:\/\/|cdn\./i);
  assert.doesNotMatch(css,/image-rendering:\s*pixelated/);
});
test('manual pause controls are completely removed from homepage and new specimen',()=>{
  const review=read('web/src/experience/continuance-cinematic/CinematicReactReview.tsx');
  for(const value of [home,review]) assert.doesNotMatch(value,/Pause motion|Resume motion|PAUSE MOTION|RESUME MOTION|scenePaused|setScenePaused|motionPaused|setMotionPaused|av125-motion-toggle|cnr-motion/);
  assert.match(review,/const still = osReduced \|\| !visible/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css,/motion-toggle|PAUSE MOTION|RESUME MOTION/);
});
test('readability, responsive mobile breakpoints, forced colors and provenance remain intact',()=>{
  for(const token of ['.av-next-arrival-art','.av-next-discover-scene','.av115-iren-console','.portal-channel-filters','max-width:820px','max-width:650px','max-width:390px','prefers-reduced-motion:reduce','forced-colors:active',':focus-visible','object-fit:cover'])assert.ok(css.includes(token),'missing '+token);
  assert.doesNotMatch(css,/@import|url\(\s*["']?https?:/);
  assert.doesNotMatch(home,/fakeProject|dummyUsers|mockXP|syntheticViews|fakeStats/);
  assert.doesNotMatch(discover,/fakeProject|dummyUsers|mockXP|syntheticViews|fakeStats/);
  assert.match(discover,/NO APPROVED PROJECTS YET/);
  assert.match(discover,/The portal could not load|THE PORTAL COULD NOT LOAD/);
});
test('exact production CSS gate and opt-in CSS gate', {skip: !process.env.CN_SITEWIDE_CHECK_DIST},()=>{
  const out=fileURLToPath(new URL('../dist/web',import.meta.url));
  assert.ok(existsSync(out),'run the product build first');
  let cssBlobs=[];
  const visit=dir=>{for(const item of readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,item.name);
    if(item.isDirectory())visit(p);
    else if(item.name.endsWith('.css'))cssBlobs.push(readFileSync(p,'utf8'));
  }};
  visit(out);
  const hasReviewCSS=cssBlobs.some(text=>text.includes('.av-next-discover-scene')&&text.includes('.av-next-arrival-art'));
  assert.equal(hasReviewCSS,process.env.CN_SITEWIDE_CHECK_DIST==='enabled','sitewide CSS must be absent in normal bundle and present only in opt-in build');
});


test('Commons cinematic markup preserves true published feeds, moderation, and single IREN',()=>{
  assert.doesNotThrow(()=>parse(community,{sourceType:'module',plugins:['typescript','jsx']}));
  assert.match(community,/VITE_CONTINUANCE_CINEMATIC_SITEWIDE==="true"/);
  assert.match(community,/ch7-hub.*av-next-commons/);
  assert.match(community,/scene="creative" priority=\{cinematicNextEnabled\} sizes=/);
  assert.match(community,/<ContinuanceSignalAtlas\/>/);
  assert.match(community,/readCommunityPosts/);
  assert.match(community,/readCreators/);
  assert.match(community,/readStatus/);
  assert.match(community,/CommunityForums\/>/);
  assert.match(community,/PublicMemberDirectory\/>/);
  assert.match(community,/PublicMemberActivity revision=\{revision\}/);
  assert.match(community,/COMMUNITY RECORDS UNAVAILABLE/);
  assert.match(community,/No fictional members or projects are substituted/);
  assert.doesNotMatch(community,/Math\.random|fakeUser|fakeProject|testXP|syntheticViewers|dangerouslySetInnerHTML/);
  assert.match(css,/\.ch7-hub\.av-next-commons/);
  assert.match(css,/\.ch7-hero-art \.av125-signal-atlas/);
});
test('Real public member worlds retain private 404 ambiguity and original identity media',()=>{
  assert.doesNotThrow(()=>parse(publicWorld,{sourceType:'module',plugins:['typescript','jsx']}));
  assert.match(publicWorld,/VITE_CONTINUANCE_CINEMATIC_SITEWIDE==="true"/);
  assert.match(publicWorld,/av-next-private-boundary/);
  assert.match(publicWorld,/<OrbitalMark\/>/);
  assert.match(publicWorld,/ANEVUM \/ MEMBER WORLDS/);
  assert.match(css,/\.av-next-private-sigil/);
  assert.match(css,/\.av12-public-world\.av-next-private-boundary::before/);
  assert.match(publicWorld,/av-next-member-world/);
  assert.match(publicWorld,/canonicalPublic\(handle,signal\)/);
  assert.match(publicWorld,/spaceRequest<MemberSpace>\(base\+'\/space','GET'/);
  assert.match(publicWorld,/spaceRequest<\{posts:WallEntry\[\]\}>\(base\+'\/wall','GET'/);
  assert.match(publicWorld,/This profile is not published, does not exist, or cannot be viewed right now/);
  assert.match(publicWorld,/space\.media\.banner&&<img/);
  assert.match(publicWorld,/profile\.worldTheme/);
  assert.match(publicWorld,/space\.earnedBadges/);
  assert.match(publicWorld,/safeVerifiedRole\(space\.role\)/);
  assert.match(css,/\.ms-public\.av-next-member-world/);
  assert.match(css,/\.av12-public-world\.av-next-private-boundary/);
  assert.doesNotMatch(publicWorld,/fakeProfile|fakeBadge|Math\.random|localStorage|testXP/);
});
