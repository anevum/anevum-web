/** V136.021: public member worlds are actual navigable spaces, with original
 * uploaded profile media and safe first-party visual defaults.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../web/src/'+path,import.meta.url),'utf8');

test('private member portrait and banner retain first-party media, with clean broken-image fallback',()=>{
 const portrait=read('components/MemberPortrait.tsx');
 const dashboard=read('components/MemberSpaceDashboard.tsx');
 const publicSpace=read('pages/Phase1PublicMemberPage.tsx');
 assert.match(portrait,/useState<string\|null>\(null\)/);
 assert.match(portrait,/onError=\{\(\)=>setFailedSrc\(src\?\?null\)\}/);
 assert.match(portrait,/onError=\{\(\)=>setFailedSrc\(src\)\}/);
 assert.match(portrait,/<OrbitalMark\/>/);
 assert.match(dashboard,/<MemberCoverMedia src=\{banner\}/);
 assert.match(publicSpace,/space\.media\.banner&&<MemberCoverMedia src=/);
 assert.match(dashboard,/<MemberPortrait src=\{avatar\}/);
 assert.doesNotMatch(portrait,/fetch\(|localStorage|onLoad=|dangerouslySetInnerHTML/);
});
test('public profile index only navigates to real member sections',()=>{
 const source=read('pages/Phase1PublicMemberPage.tsx');
 const anchors=['member-world-wall','member-world-about','member-world-recognition','member-world-creations'];
 for(const id of anchors){
  assert.match(source,new RegExp('href="#'+id+'"'),id+' link');
  assert.match(source,new RegExp('id="'+id+'"'),id+' landmark');
 }
 assert.match(source,/packageGalleryUIEnabled&&<a href="#member-world-creations"/);
 assert.match(source,/packageGalleryUIEnabled&&<div id="member-world-creations"/);
 assert.match(source,/wallResource\.state==='error'/);
 assert.match(source,/profile\.visibility|PUBLIC WORLD/);
 assert.doesNotMatch(source,/Math\.random|fakeFollowers|suggestedLikes|placeholderProfile/);
});
test('identity design preserves genuine uploaded content, mobile and accessibility',()=>{
 const css=read('parity/sitewide-interface-v136.css');
 assert.match(css,/\.ms-public-index\{/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/\.ms-cover-shade/);
 assert.match(css,/scroll-margin-top:100px/);
});
