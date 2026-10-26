/** V136.018: sitewide retirement of promotional art while retaining real media. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('public category renderers retain honest defaults; new environment is isolated to review',()=>{
 const artwork=read('../web/src/components/CosmicArtwork.tsx');
 const arrival=read('../web/src/parity/CinematicArrivalV136.tsx');
 const main=read('../web/src/main.tsx');
 const manifest=JSON.parse(read('../web/public/assets/cinematic-v136/arrival/manifest.json'));
 assert.match(artwork,/data-presentation="native-index"/);
 assert.doesNotMatch(artwork,/<img\b|\.webp|assets\/community-portals/);
 assert.match(arrival,/data-cinematic-v136="motion-first"/);
 assert.match(arrival,/ownerReview&&!posterFailed&&<picture/);
 assert.match(arrival,/import.meta.env.MODE==='staging-path'/);
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

test('compiled public asset input contains no retired generated promotional raster files',()=>{
 const root=new URL('../web/public/assets/',import.meta.url);
 for(const folder of ['cinematic','community-portals','parity-v136','cinematic-v2/atmosphere']){
   const entries=readdirSync(new URL(folder+'/',root),{recursive:true,withFileTypes:true});
   assert.deepEqual(entries.filter(entry=>entry.isFile()&&/\.(webp|png|jpe?g|avif)$/i.test(entry.name)),[],
     folder+' must not distribute retired generated promotional artwork');
 }
});
test('legacy visual kit does not mount deferred promotional images',()=>{
 const kit=read('../web/src/components/VisualKit.tsx');
 assert.match(kit,/Promise<boolean>\{return false;/);
 assert.doesNotMatch(kit,/fetch\(|new Image\(|assets\/anevum-kit/);
});

test('uploaded package cover has priority; no-cover and failed images have type-specific default vectors',()=>{
 const image=read('../web/src/components/ProjectThumbnail.tsx');
 const gallery=read('../web/src/components/CreatorPackageGallery.tsx');
 assert.match(image,/safePackageCover\(uploadedUrl\)/);
 assert.match(image,/setFailedUrl\(verified\)/);
 assert.match(gallery,/uploadedUrl=\{work\.coverUrl\}/);
});
