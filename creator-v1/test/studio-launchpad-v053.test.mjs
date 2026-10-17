import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STUDIO_STARTERS,studioStarter,blankCanvasToDraft,ideaToDraft,starterToDraft,existingWorkToDraft}
 from '../web/src/lib/studio-launchpad.ts';
const idA='e9d27c5a-1111-4111-9111-111111111111';
const idB='e9d27c5a-2222-4222-9222-222222222222';
const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const slug=/^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/;
const keys=['slug','title','summary','description','category','freeToUse',
 'license','sourceUrl','demoUrl','aiDisclosure','humanContribution'];
function isPrivateBackendDraft(d){
 assert.deepEqual(Object.keys(d).sort(),keys.toSorted());
 assert.match(d.slug,slug);
 assert.ok(d.slug.length>=3&&d.slug.length<=90);
 assert.ok(d.title.trim().length>=3&&d.title.length<=100);
 assert.ok(d.summary.trim().length>=10&&d.summary.length<=280);
 assert.ok(d.description.length<=8000);
 assert.equal(d.freeToUse,false);
 assert.equal(d.license,'');
 assert.equal(d.sourceUrl,null);
 assert.equal(d.aiDisclosure,'');
 assert.equal(d.humanContribution,'');
}
test('the six outcome-based starters have unique stable IDs, real outlines and safe private drafts',()=>{
 assert.equal(STUDIO_STARTERS.length,6);
 assert.equal(new Set(STUDIO_STARTERS.map(s=>s.id)).size,6);
 assert.deepEqual(STUDIO_STARTERS.map(s=>s.id),['story','gallery','audio','choices','experience','import']);
 for(const starter of STUDIO_STARTERS){
  assert.equal(studioStarter(starter.id)?.title,starter.title);
  assert.ok(starter.outline.length>80);
  const draft=starterToDraft(starter.id,idA);
  isPrivateBackendDraft(draft);
  assert.equal(draft.category,starter.category);
  assert.match(draft.description,/\n/);
  assert.equal(draft.demoUrl,null);
  assert.equal(draft.slug.split('-').at(-1),idA.replaceAll('-','').slice(0,16));
 }
 assert.equal(studioStarter('nonsense'),undefined);
 assert.throws(()=>starterToDraft('nonsense',idA),/Choose an available starter/);
});
test('novice first thought becomes an actual valid private project record without rights gates',()=>{
 const draft=ideaToDraft('A mysterious signal becomes a choose-your-path story.',idA);
 isPrivateBackendDraft(draft);
 assert.equal(draft.title,'A mysterious signal becomes a choose-your-path story');
 assert.equal(draft.category,'creative');
 assert.equal(draft.description,'A mysterious signal becomes a choose-your-path story.');
 assert.match(draft.summary,/^Idea:/);
 assert.equal(draft.demoUrl,null);
});
test('a complex creative idea preserves its exact private notes, with bounded public-facing fields',()=>{
 const text='The game begins in a forgotten station.\nThen we solve 5 puzzles. '+('A different ending. '.repeat(84));
 const draft=ideaToDraft(text,idA,'games');
 isPrivateBackendDraft(draft);
 assert.equal(draft.description,text.trim()); // Same whitespace normalization as the canonical API.
 assert.equal(draft.category,'games');
 assert.ok(draft.summary.length<=280);
 assert.ok(draft.title.length<=90);
});
test('non-Latin ideas remain safely in their private description and receive valid URL identifiers',()=>{
 const draft=ideaToDraft('宇宙の物語 ✨ これは新しい作品です',idA,'writing');
 isPrivateBackendDraft(draft);
 assert.match(draft.description,/宇宙/);
 assert.equal(draft.slug,'new-creation-'+idA.replaceAll('-','').slice(0,16));
});
test('the same idea can be independently captured with distinct idempotency keys',()=>{
 const one=ideaToDraft('A short interactive story',idA);
 const two=ideaToDraft('A short interactive story',idB);
 assert.notEqual(one.slug,two.slug);
 assert.equal(one.title,two.title);
 assert.equal(one.description,two.description);
});
test('bad ideas and invalid idempotency identifiers fail before reaching the server',()=>{
 for(const idea of ['','   ','x',' bad\u0000idea','\u0007mistake','x'.repeat(2001)])
  assert.throws(()=>ideaToDraft(idea,idA));
 for(const id of ['','not-a-uuid',idA.toUpperCase(),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'])
  assert.throws(()=>ideaToDraft('A new creative project',id),/valid private draft request ID/);
});
test('a game starter is an editable text outline, not a fabricated executable game',()=>{
 const draft=starterToDraft('experience',idA);
 isPrivateBackendDraft(draft);
 assert.equal(draft.category,'games');
 assert.match(draft.description,/not create an executable game/);
});
test('existing work can start privately with no uploaded files or outside link',()=>{
 const draft=existingWorkToDraft('An Original Song','music',idA);
 isPrivateBackendDraft(draft);
 assert.equal(draft.title,'An Original Song');
 assert.equal(draft.demoUrl,null);
 assert.equal(draft.category,'music');
});
test('existing work accepts canonical public HTTPS URLs and rejects dangerous placeholders',()=>{
 const draft=existingWorkToDraft('Signal 001','games',idA,'https://example.com/play?source=anevum');
 isPrivateBackendDraft(draft);
 assert.equal(draft.demoUrl,'https://example.com/play?source=anevum');
 for(const bad of ['http://example.com','file:///etc/passwd','javascript:alert(1)',
  'data:text/html,123','https://localhost/app','https://127.0.0.1/',
  'https://myuser:mypass@example.com','https://[::1]/','https://0.0.0.0/','bad url']){
  assert.throws(()=>existingWorkToDraft('A valid title','tools',idA,bad));
 }
});
test('existing work requires a meaningful title and valid id',()=>{
 for(const bad of ['', '  ', 'xy','bad\u0000title','X'.repeat(101)])
  assert.throws(()=>existingWorkToDraft(bad,'video',idA));
 assert.throws(()=>existingWorkToDraft('My Film','video','not-valid'),/valid private draft request ID/);
});
test('a starter cannot invent published assets, approved status, contributor rights or revenue',()=>{
 const draft=starterToDraft('gallery',idA);
 assert.deepEqual(Object.keys(draft).sort(),keys.toSorted());
 assert.equal(draft.freeToUse,false);
 assert.equal(draft.license,'');
 assert.equal(draft.aiDisclosure,'');
 assert.equal(draft.humanContribution,'');
 for(const name of ['published','approved','assetId','xp','credits','public','ownershipVerified'])
  assert.ok(!(name in draft));
});
test('canonical /studio uses Launchpad without affecting legacy Studio and review routing',()=>{
 const app=source('web/src/App.tsx');
 const screen=source('web/src/pages/CanonicalStudioPage.tsx');
 const launch=source('web/src/pages/StudioLaunchpad.tsx');
 assert.match(app,/<Route path="studio" element=\{<CanonicalStudioPage\/>\}\/>/);
 assert.match(app,/<Route path="studio\/new" element=\{<CanonicalStudioPage mode="new"\/>\}\/>/);
 assert.match(app,/<Route path="studio\/review" element=\{<CanonicalStudioPage mode="review"\/>\}\/>/);
 assert.match(app,/<Route path="studio\/:projectId" element=\{<CanonicalStudioPage mode="edit"\/>\}\/>/);
 assert.match(screen,/StudioLaunchpad uploadsReady=\{uploads\}/);
 assert.match(screen,/setEditorView\('advanced'\)/);
 assert.match(screen,/studioReviewReceipts/);
 assert.match(launch,/studioCreate\(draft,id\)/);
 assert.match(launch,/navigate\('\/studio\/'\+result.project.id\)/);
 assert.doesNotMatch(launch,/dangerouslySetInnerHTML|innerHTML\s*=|document\.write/);
 assert.doesNotMatch(launch,/studioUpload\(|uploadFiles/);
});
test('private storage and release security remain gated in the staging configuration',()=>{
 const cfg=JSON.parse(source('wrangler.a-progression-v031.jsonc'));
 assert.equal(cfg.vars.CANONICAL_CREATOR_STUDIO_ENABLED,'true');
 assert.equal(cfg.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(cfg.vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,'true');
 assert.equal(cfg.r2_buckets,undefined);
 const page=source('web/src/pages/StudioLaunchpad.tsx');
 assert.match(page,/Only you can see your draft/);
 assert.match(page,/NOT YET ACTIVE/);
 assert.match(page,/no.*publish/i);
 const studio=source('canonical-auth/studio.mjs');
 assert.match(studio,/Verified member required/);
 assert.match(studio,/member_creator_profiles/);
});
test('the mobile/responsive Launchpad has visible focus styling and reduced motion',()=>{
 const css=source('web/src/pages/studio-launchpad.css');
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css, /focus-visible/);
 const screen=source('web/src/pages/StudioLaunchpad.tsx');
 assert.match(screen, /aria-expanded/);
 assert.match(screen, /aria-live="polite"/);
 assert.match(screen, /role="alert"/);
 assert.match(screen, /role="status"/);
});
