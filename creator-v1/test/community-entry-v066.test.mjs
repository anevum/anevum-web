import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const app=readFileSync(new URL('../web/src/App.tsx',import.meta.url),'utf8');
const forums=readFileSync(new URL('../web/src/pages/CanonicalForums.tsx',import.meta.url),'utf8');
const worker=readFileSync(new URL('../canonical-auth/forums.mjs',import.meta.url),'utf8');
const routes=readFileSync(new URL('../apex-prelaunch/platform.mjs',import.meta.url),'utf8');

test('legacy community composer uses canonical moderated forum rather than stale member gate',()=>{
 assert.match(app, /path="community\/write" element=\{<Navigate to="\/community\?compose=1" replace\/>\}/);
 assert.doesNotMatch(app, /path="community\/write" element=\{<CommunityPostEditorPage/);
 assert.match(app, /path="library" element=\{<Navigate to="\/saved" replace\/>\}/);
 assert.doesNotMatch(app, /<MemberGate\/>|<MemberLibraryPage\/>/);
});

test('canonical discussion entry opens the existing form from a deep link',()=>{
 assert.match(forums, /useLocation\(\)/);
 assert.match(forums, /get\('compose'\)==='1'/);
 assert.match(forums, /useState\(composeRequested\)/);
 assert.match(forums, /if\(composeRequested\)setCompose\(true\)/);
 assert.match(forums, /threads\.state==='ready'/);
 assert.match(forums, /await request\('\/api\/v1\/community\/threads','POST'/);
});

test('forum-unavailable route never pretends that a thread was submitted',()=>{
 assert.match(forums, /threads\.error\.status===404/);
 assert.doesNotMatch(forums, /threads\.error\.status===404\)return null/);
 assert.match(forums, /The moderated forum is disabled on this site\./);
 assert.match(forums, /No thread has been submitted/);
});

test('public portal retains server-side forum enablement and independent moderation',()=>{
 assert.match(routes, /const COMMUNITY=/);
 assert.match(worker, /CANONICAL_FORUM_ENABLED/);
 assert.match(worker, /pending_review/);
 assert.match(worker, /self|author_id|reviewer_id/i);
});
