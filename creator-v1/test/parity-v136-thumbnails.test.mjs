/** PARITY V136.019 - type-specific fallback covers, real creator artwork first.
 * Includes asset and source contracts for the privacy-preserving browser client.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {defaultProjectThumbnailUrl,projectThumbnailPreset} from '../web/src/lib/project-thumbnails.ts';

const svg=k=>readFileSync(new URL('../web/public/assets/default-thumbnails/'+k+'.svg',import.meta.url),'utf8');
const component=readFileSync(new URL('../web/src/components/ProjectThumbnail.tsx',import.meta.url),'utf8');
const valid=['games','tools','automation','research','creative','learning','libraries','other','simulation','story'];
test('ten predefined scalable ANEVUM images cover legacy and package creation types',()=>{
 const lookup={games:'games',game:'games',tools:'tools',app:'tools',automation:'automation',
  research:'research',creative:'creative',learning:'learning',libraries:'libraries',other:'other',
  simulation:'simulation',story:'story'};
 for(const [kind,expected] of Object.entries(lookup)){
  assert.equal(projectThumbnailPreset(kind).asset,expected);
  assert.equal(defaultProjectThumbnailUrl(kind),'/assets/default-thumbnails/'+expected+'.svg');
 }
 assert.equal(defaultProjectThumbnailUrl('app','/creator/'),'/creator/assets/default-thumbnails/tools.svg');
 for(const unsafe of [null,'../../private',{},'GAME','<script>']){
  assert.equal(projectThumbnailPreset(unsafe).asset,'other');
  assert.equal(defaultProjectThumbnailUrl(unsafe,'/creator/'),'/creator/assets/default-thumbnails/other.svg');
 }
 assert.equal(valid.length,10);
});
test('every local default is valid-looking first-party vector without external requests or faux user data',()=>{
 for(const kind of valid){
  const content=svg(kind),url=new URL('../web/public/assets/default-thumbnails/'+kind+'.svg',import.meta.url);
  assert.ok(statSync(fileURLToPath(url)).size>=1900);
  assert.match(content,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(content,/width="1600" height="900"/);
  assert.match(content,/<title id="title">ANEVUM default/);
  assert.doesNotMatch(content,/<text\b|ANEVUM DEFAULT PREVIEW|CREATOR MEDIA NOT PROVIDED/,
   'Image defaults are text-free; truthful category and creator data remain in real cards');
  assert.match(content,/<\/svg>\s*$/);
  assert.doesNotMatch(content,/(?:<script|<image\b|<foreignObject|onload\s*=|@import|https?:\/\/(?!www\.w3\.org\/2000\/svg)|&(?!(?:amp|lt|gt|quot|apos);))/i);
 }
});
test('uploaded cover wins only through verified first-party canonical path and failures use type default',()=>{
 assert.match(component,/safePackageCover\(uploadedUrl\)/);
 assert.match(component,/uploaded\?verified!:fallback/);
 assert.match(component,/onError=\{uploaded\?\(\)=>setFailedUrl\(verified\):undefined\}/);
 assert.match(component,/data-thumbnail-source=\{uploaded\?'creator':'default'\}/);
 assert.match(component,/alt=\{alt\}/);
 assert.match(component,/referrerPolicy="same-origin"/);
 assert.doesNotMatch(component,/dangerouslySetInnerHTML|fetch\(|localStorage|Math\.random|new URL\(/);
});
test('real public cards, saved works, community, and inspector use the same media contract',()=>{
 const paths=['components/CreatorPackageGallery.tsx','components/ProjectCard.tsx',
  'components/CommunityHomeFeed.tsx','pages/CommunityPage.tsx',
  'parity/ParityPortalV136.tsx','components/ProjectPlayerShell.tsx',
  'pages/CanonicalSavedWorksPage.tsx','components/CinematicDiscoverySections.tsx',
  'components/CinematicCatalogueSections.tsx','parity/ArtifactLensV136.tsx'];
 for(const path of paths){
  const source=readFileSync(new URL('../web/src/'+path,import.meta.url),'utf8');
  assert.match(source,/<ProjectThumbnail\b/,path);
 }
 const packageSource=readFileSync(new URL('../web/src/components/CreatorPackageGallery.tsx',import.meta.url),'utf8');
 assert.match(packageSource,/uploadedUrl=\{work\.coverUrl\}/);
 assert.doesNotMatch(packageSource,/<img\s+src=\{work\.coverUrl\}/);
 const legacy=readFileSync(new URL('../web/src/lib/api.ts',import.meta.url),'utf8');
 assert.doesNotMatch(legacy,/coverUrl\s*:/,'Legacy API does not yet expose an approved cover');
});


test('isolated browser fixture serves only the ten reviewed default SVGs, not arbitrary asset paths',()=>{
 const fixture=readFileSync(new URL('./portal-offline-preview.mjs',import.meta.url),'utf8');
 assert.ok(fixture.includes(String.raw`default-thumbnails\/(?:games|tools|automation|research|creative|learning|libraries|other|simulation|story)\.svg`),
  'The fixture may serve only the ten first-party type SVGs');
 assert.ok(fixture.includes('!existsSync(path)'), 'Requested static assets must exist');
 assert.ok(fixture.includes('return json(res,{error:"not-found"},404)'), 'Unknown asset paths must fail closed');
 assert.ok(!fixture.includes(String.raw`default-thumbnails\/[a-zA-Z0-9._-]+`),
  'A wildcard path would widen the test source allowlist');
});

test('V136 category art has one visual name and V136-only default disclosure remains in DOM metadata',()=>{
 const art=readFileSync(new URL('../web/src/components/CosmicArtwork.tsx',import.meta.url),'utf8');
 assert.match(art,/av136-index-field__number/);
 assert.match(art,/av136-index-field__name/);
 assert.doesNotMatch(art,/av136-index-field__top|av136-index-field__foot/);
 const ui=readFileSync(new URL('../web/src/parity/continuance-design-system.css',import.meta.url),'utf8');
 assert.ok(ui.includes('.p136-discovery .p136-discover-world'));
 assert.ok(ui.includes('.p136-discovery .p136-discover-search-form'));
 assert.ok(ui.includes('.p136-project-art-note,.p136-kind'));
});
