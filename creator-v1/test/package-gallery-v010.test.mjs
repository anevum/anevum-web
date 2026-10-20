import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 safeCreatorHandle,safePackageCover,safePackagePlay,parsePackageGallery,readPackageGallery
} from '../web/src/lib/creator-package-gallery-v010.ts';

const ID='5764a892-0526-47b6-953b-4cf6a9053c0f';
const COVER='/upload/v3/api/v1/packages/covers/'+ID;
const PLAY='/upload/v3/play/'+ID;
const valid={id:ID,title:'Signal Drift',summary:'A real browser game from an independent creator.',
 category:'game',version:1,cover_url:COVER,play_url:PLAY,published_at:1760000000};
test('public works require a canonical handle and only accepted first-party release paths',()=>{
 assert.equal(safeCreatorHandle('cosmiccreator'),'cosmiccreator');
 for(const bad of ['','CosmicCreator','../../other','a','test.com','a'.repeat(31)])assert.equal(safeCreatorHandle(bad),null);
 assert.equal(safePackageCover(COVER),COVER);
 assert.equal(safePackagePlay(PLAY),PLAY);
 for(const bad of ['javascript:alert(1)','https://evil.invalid/game','//evil.invalid/game',
  '/upload/v3/play/not-a-uuid',PLAY+'?preview=1','/play/v3/'+ID,'/upload/v3/play/'+ID+'/../../staff']){
   assert.equal(safePackagePlay(bad),null,bad);
 }
 assert.equal(safePackageCover('https://evil.invalid/'+ID),null);
 assert.equal(safePackageCover(COVER+'?redirect=https://evil.invalid'),null);
});
test('public card parsing never trusts arbitrary external HTML or malformed data as an approved game',()=>{
 const data={handle:'cosmiccreator',projects:[valid,{...valid,id:'fake'},
  {...valid,id:'f'.repeat(36),play_url:'https://evil.invalid/game'},
  {...valid,id:'bad',title:'<img onerror=alert(1)>'}]};
 const parsed=parsePackageGallery(data,'public','cosmiccreator');
 assert.equal(parsed.handle,'cosmiccreator');
 assert.equal(parsed.projects.length,1);
 assert.equal(parsed.projects[0].playUrl,PLAY);
 assert.equal(parsed.projects[0].previewUrl,null);
 assert.equal(parsed.projects[0].coverUrl,COVER);
 assert.equal(parsed.projects[0].publishedAt,1760000000);
 assert.throws(()=>parsePackageGallery(data,'public','anothercreator'),/identity/);
 assert.throws(()=>parsePackageGallery([], 'public','cosmiccreator'),/gallery response/);
 assert.throws(()=>parsePackageGallery({projects:null},'owner'),/gallery response/);
});
test('owner cards expose only private preview for submitted/draft build, never public link without approved status',()=>{
 const make=(status,draftStatus,play)=>({
  ...valid,status,draft_status:draftStatus,play_url:play
 });
 const result=parsePackageGallery({projects:[
  make('draft','ready',PLAY),
  make('pending_review','pending_review',PLAY),
  make('published','ready',PLAY),
  make('published',null,PLAY),
  make('rejected','rejected',null)
 ]},'owner');
 assert.equal(result.projects.length,5);
 assert.equal(result.projects[0].playUrl,null);
 assert.equal(result.projects[0].previewUrl,PLAY+'?preview=1');
 assert.equal(result.projects[1].playUrl,null);
 assert.equal(result.projects[1].previewUrl,PLAY+'?preview=1');
 assert.equal(result.projects[2].playUrl,PLAY);
 assert.equal(result.projects[2].previewUrl,PLAY+'?preview=1');
 assert.equal(result.projects[3].playUrl,PLAY);
 assert.equal(result.projects[3].previewUrl,null);
 assert.equal(result.projects[4].playUrl,null);
 assert.equal(result.projects[4].previewUrl,null);
});
test('public reader omits member cookies, refuses redirects and recognizes disabled/private galleries',async()=>{
 const original=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{
   calls.push({url,init});
   return Response.json({handle:'cosmiccreator',projects:[valid]});
  };
  const result=await readPackageGallery('public','cosmiccreator');
  assert.equal(result.projects[0].id,ID);
  assert.equal(calls[0].url,'/upload/v3/api/v1/packages/creators/cosmiccreator/projects');
  assert.equal(calls[0].init.credentials,'omit');
  assert.equal(calls[0].init.redirect,'error');
  assert.equal(calls[0].init.cache,'no-store');
  assert.equal(await readPackageGallery('public','not allowed'),null);
  assert.equal(calls.length,1,'invalid handle never issues a request');
  globalThis.fetch=async()=>new Response('Not found',{status:404});
  assert.equal(await readPackageGallery('public','cosmiccreator'),null);
  globalThis.fetch=async()=>new Response('Unavailable',{status:503});
  await assert.rejects(readPackageGallery('public','cosmiccreator'),/temporarily unavailable/);
 }finally{globalThis.fetch=original;}
});
test('owner reader uses existing same-origin member session and does not auto-publish drafts',async()=>{
 const original=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{
   calls.push({url,init});
   return Response.json({projects:[{...valid,status:'draft',draft_status:'ready',play_url:null}]});
  };
  const result=await readPackageGallery('owner',null);
  assert.equal(calls[0].url,'/upload/v3/api/v1/packages/mine');
  assert.equal(calls[0].init.credentials,'same-origin');
  assert.equal(result.projects[0].playUrl,null);
  assert.equal(result.projects[0].previewUrl,PLAY+'?preview=1');
  globalThis.fetch=async()=>new Response('Unauthorized',{status:401});
  await assert.rejects(readPackageGallery('owner',null),/session/);
 }finally{globalThis.fetch=original;}
});
test('member UI is opt-in and uses canonical existing wall instead of creating a second profile',async()=>{
 const files=await Promise.all([
  new URL('../web/src/components/CreatorPackageGallery.tsx',import.meta.url),
  new URL('../web/src/components/MemberSpaceDashboard.tsx',import.meta.url),
  new URL('../web/src/pages/Phase1PublicMemberPage.tsx',import.meta.url)
 ].map(url=>readFile(url,'utf8')));
 assert.match(files[0],/VITE_PACKAGE_CREATOR_GALLERY_V010==='true'/);
 assert.match(files[1],/CreatorPackageGallery mode="owner"/);
 assert.match(files[1],/packageGalleryUIEnabled/);
 assert.match(files[2],/CreatorPackageGallery mode="public" handle={profile.handle}/);
 assert.doesNotMatch(files[0],/dangerouslySetInnerHTML|localStorage|eval\(/);
 assert.match(files[0],/<a href={work.playUrl}/,
   'Play link uses a real navigation to the Worker rather than an unregistered SPA route');
});
