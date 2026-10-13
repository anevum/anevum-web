import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("eight independent creative portals are original category-navigation artifacts",()=>{
 const rooms=read("web/src/components/PortalArcade.tsx");
 const icons=read("web/src/components/CategoryArtifact.tsx");
 const categories=["games","tools","creative","libraries","automation","research","learning","other"];
 for(const id of categories){
   assert.ok(rooms.includes('id:"'+id+'"'),"Missing arcade room "+id);
   assert.ok(icons.includes('category==="'+id+'"'),"Missing custom icon "+id);
 }
 assert.match(rooms,/PORTAL_ROOMS/);
 assert.match(rooms,/Link className=/);
 assert.match(rooms,/discover\?category=/);
 assert.match(rooms,/categories\.map/);
 assert.match(rooms,/count===0\?"FIRST RELEASE PENDING"/);
 assert.match(icons,/aria-hidden="true"/);
 for(const forbidden of ["Math.random","localStorage","setInterval","dangerouslySetInnerHTML","sampleVotes","fakeRating"]){
   assert.ok(!rooms.includes(forbidden),forbidden);
   assert.ok(!icons.includes(forbidden),forbidden);
 }
});
test("real staging published counts, accessible browse links and category artwork appear in public screens",()=>{
 const home=read("web/src/pages/HomePage.tsx");
 const discover=read("web/src/pages/DiscoverPage.tsx");
 const community=read("web/src/pages/CommunityPage.tsx");
 const css=read("web/src/portal-arcade.css");
 const main=read("web/src/main.tsx");
 assert.match(home,/PortalArcade categories=\{portal\.data\.categories\.categories\}/);
 assert.match(home,/No fake projects, ratings or activity/);
 assert.match(discover,/<CategoryArtifact category=\{x\.id\}/);
 assert.match(community,/<CategoryArtifact category=\{room\.category\}/);
 assert.match(main,/import "\.\/portal-arcade\.css"/);
 for(const selector of [".portal-arcade-grid",".portal-arcade-tile--games",".portal-arcade-tile--other",".portal-directory-mark .portal-artifact",".portal-room-top>span .portal-artifact"])
   assert.ok(css.includes(selector),selector);
 for(const query of ["@media(max-width:640px)","@media(max-width:820px)","@media(prefers-reduced-motion:reduce)","@media(hover:none),(pointer:coarse)"])
   assert.ok(css.includes(query),query);
 assert.doesNotMatch(css,/\.mobile-bottom-nav/);
});


test("approved brand stays on home while every project cover uses original category-specific fallbacks",()=>{
 const card=read("web/src/components/ProjectCard.tsx");
 const shelf=read("web/src/components/PortalShelf.tsx");
 const home=read("web/src/pages/HomePage.tsx");
 const css=read("web/src/portal-arcade.css");
 assert.match(card,/CategoryArtifact category=\{project.category\}/);
 assert.doesNotMatch(card,/OrbitalMini|sampleThumbnail/);
 assert.match(shelf,/CategoryArtifact category=\{category\}/);
 assert.match(home,/OrbitalStage variant="hero"/);
 assert.doesNotMatch(home,/CREATIVE<br\/>BEYOND<br\/>GROUND/);
 assert.match(css,/\.portal-welcome-emblem \.depth-stage-serial\{display:none\}/);
 for(const name of ["games","tools","creative","libraries","automation","research","learning","other"])
   assert.ok(css.includes(".project-art-layer .project-glyph-"+name),name);
});
