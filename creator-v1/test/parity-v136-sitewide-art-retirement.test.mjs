/** V136.018: sitewide retirement of promotional art while retaining real media. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('public category renderers cannot fetch generative covers',()=>{
 const artwork=read('../web/src/components/CosmicArtwork.tsx');
 const arrival=read('../web/src/parity/CinematicArrivalV136.tsx');
 const main=read('../web/src/main.tsx');
 const manifest=JSON.parse(read('../web/public/assets/cinematic-v136/arrival/manifest.json'));
 assert.match(artwork,/data-presentation="native-index"/);
 assert.doesNotMatch(artwork,/<img\b|\.webp|assets\/community-portals/);
 assert.match(arrival,/data-arrival-surface="native-interface"/);
 assert.doesNotMatch(arrival,/<img\b|<picture\b|manifest\.posters/);
 assert.equal(manifest.posters,undefined);
 assert.match(main,/sitewide-interface-v136\.css/);
});
test('retired site decoration never suppresses uploaded member banners or portraits',()=>{
 const space=read('../web/src/components/MemberSpaceDashboard.tsx');
 const publicSpace=read('../web/src/pages/Phase1PublicMemberPage.tsx');
 const cover=read('../web/src/member-space.css');
 const community=read('../web/src/pages/CommunityPage.tsx');
 assert.match(space,/src=\{banner\}/);
 assert.match(space,/MemberPortrait src=\{avatar\}/);
 assert.match(publicSpace,/space\.media\.banner/);
 assert.doesNotMatch(cover,/\/assets\/cinematic\/hero\//);
 assert.doesNotMatch(community,/<div className="ch7-hero-art"/);
});
