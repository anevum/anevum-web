import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODERATOR_LAB_CSS,MODERATOR_LAB_JS,renderLabModeratorConsole} from '../moderator-ops-v042.mjs';

test('V042 Lab moderator page renders a separate private planning workbench',()=>{
 const page=renderLabModeratorConsole();
 assert.match(page,/<title>ANEVUM \/ Backstage \/ Moderation Lab<\/title>/);
 assert.match(page,/Moderation <em>workstation\.<\/em>/);
 assert.match(page,/PRIVATE LAB/);
 assert.match(page,/LOCAL PLANNING/);
 assert.match(page,/No simulated community statistics/);
 assert.match(page,/data-screen="overview"/);
 assert.match(page,/data-screen="queue"/);
 assert.match(page,/data-screen="new"/);
 assert.match(page,/data-screen="protocol"/);
 assert.match(page,/data-screen="audit"/);
 assert.match(page,/No real user data imported/i);
 assert.doesNotMatch(page,/faker|Math\.random\(\)\*100|1000 members/i);
});
test('V042 Lab only links to canonical reviewer, never authenticates through a cross-origin proxy',()=>{
 const page=renderLabModeratorConsole();
 assert.match(page,/href="https:\/\/a\.anevum\.com\/community\/review"/);
 assert.match(page,/target="_blank" rel="noopener noreferrer"/);
 assert.match(page,/verified member session and server-side reviewer authorization/i);
 assert.match(page,/No account bans, review approvals, public posts, API tokens or cross-domain session transfers/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/fetch\(|XMLHttpRequest|navigator\.sendBeacon|document\.cookie|postMessage|Authorization/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/innerHTML|outerHTML|insertAdjacentHTML|eval\(/);
});
test('V042 Lab writes only legacy-compatible private Backstage local cases',()=>{
 assert.match(MODERATOR_LAB_JS,/anevum\.lab\.backstage\.cases\.v1/);
 assert.match(MODERATOR_LAB_JS,/backstage-local-v1/);
 assert.match(MODERATOR_LAB_JS,/LOCAL-\[0-9\]/);
 assert.match(MODERATOR_LAB_JS,/category:'moderation'/);
 assert.match(MODERATOR_LAB_JS,/cases.length>=200/);
 assert.match(MODERATOR_LAB_JS,/item\.events\.length>=60/);
 assert.match(MODERATOR_LAB_JS,/textarea/);
 assert.match(MODERATOR_LAB_JS,/textContent/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/sessionStorage|indexedDB|localStorage\.clear|localStorage\.removeItem/);
});
test('V042 Lab mobile layout and reduced-motion behavior do not force horizontal scrolling',()=>{
 assert.match(MODERATOR_LAB_CSS,/@media\(max-width:840px\)/);
 assert.match(MODERATOR_LAB_CSS,/@media\(max-width:560px\)/);
 assert.match(MODERATOR_LAB_CSS,/prefers-reduced-motion:reduce/);
 assert.match(MODERATOR_LAB_CSS,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(MODERATOR_LAB_CSS,/overflow-x:auto/);
 assert.match(MODERATOR_LAB_CSS,/focus-visible/);
});
test('existing Backstage and canonical forum boundaries remain documented in source',()=>{
 const doc=readFileSync(new URL('../../docs/creator-platform/ANEVUM.WEB.BUILD.2026-10-16.002.MODERATOR-CONSOLE.md',import.meta.url),'utf8');
 assert.match(doc,/canonical member system/i);
 assert.match(doc,/same-origin/i);
 assert.match(doc,/No account bans/i);
 assert.match(doc,/staging release/i);
 const reviewer=readFileSync(new URL('../../creator-v1/canonical-auth/forums.mjs',import.meta.url),'utf8');
 assert.match(reviewer,/CANONICAL_FORUM_REVIEWER_IDS/);
 assert.match(reviewer,/Independent review is required/);
});
