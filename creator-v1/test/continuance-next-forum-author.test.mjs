import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const card=file('web/src/components/ForumAuthorCard.tsx');
const css=file('web/src/components/forum-author-dossier.css');
const forums=file('web/src/pages/CanonicalForums.tsx');
const highlights=file('web/src/components/MemberForumHighlights.tsx');
const transport=file('web/src/lib/member-forums.ts');
const server=file('canonical-auth/public-member-card.mjs');

test('forum author dossier uses only existing visibility-approved public fields',()=>{
 assert.match(card,/type \{ForumAuthor\}/);
 assert.match(card,/safeVerifiedRole\(author\.role\)/);
 assert.match(card,/safePublicReputation\(author\.reputation\)/);
 assert.match(card,/Number\.isSafeInteger\(author\.level\)/);
 assert.match(card,/selectedDistinctions\(author\.distinctions\)/);
 assert.match(card,/selectFeaturedBadges\(author\.featuredAwards/);
 assert.match(card,/safeConstellation\(author\.constellation\)/);
 assert.match(card,/CompactMemberIdentity/);
 assert.match(transport,/type ForumAuthor=/);
 assert.match(server,/visibility='public'|public visibility|public member/i);
 for(const denied of ['fetch(', 'memberRequest(', 'canonicalMe(', 'readMemberCommunity(', 'localStorage', 'sessionStorage', 'WebSocket', 'XMLHttpRequest', 'fakeFollower', 'grantBadge'])
  assert.ok(!card.includes(denied),'Unexpected author data fetch or grant: '+denied);
});
test('public card never invents counts, unearned ranks, badges or XP',()=>{
 assert.match(card,/reputation&&<details/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.discussions/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.replies/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.appreciations/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.badges/);
 assert.match(card,/Object\.hasOwn\(BADGE_CATALOG,id\)/);
 assert.match(card,/\.slice\(0,2\)/);
 assert.doesNotMatch(card,/\bsetXp\b|awardBadge\(|followersCount|Math\.random|Date\.now\(/);
});
test('public wall link cannot become arbitrary or private URL and never wraps another link',()=>{
 assert.match(card,/\^\[a-z\]\[a-z0-9_\]\{2,29\}\$/);
 assert.match(card,/'\/@'\+encodeURIComponent\(handle\)/);
 assert.match(card,/publicWall&&<Link/);
 assert.match(card,/interactive=\{false\}/);
 assert.match(card,/aria-label=\{'View public member wall of '/);
 assert.doesNotMatch(card,/window\.location|href=\{author\./);
});
test('native detail disclosure and variants are wired in every genuine forum placement',()=>{
 assert.match(card,/<details className="cf-author-dossier-details">/);
 assert.match(card,/<summary>CONTRIBUTION RECORD/);
 for(const variant of ['stream','detail','reply'])assert.ok(forums.includes('variant="'+variant+'"'),'Missing forum variant '+variant);
 assert.match(highlights,/variant="highlight"/);
 for(const variant of ['stream','detail','reply','highlight'])assert.ok(card.includes("'"+variant+"'"));
 assert.match(css,/\.cf-author-dossier-details>summary/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
});
test('component introduces no unscoped global styles or data-writing controls',()=>{
 assert.doesNotMatch(css,/^\s*(html|body|:root)\s*\{/m);
 // Match standalone HTTP verbs, not the substring PUT in REPUTATION.
 assert.doesNotMatch(card,/onSubmit|onClick|<button|\b(?:POST|PUT|DELETE|PATCH)\b/);
 assert.match(card,/Public profile of/);
 assert.match(card,/PUBLIC MEMBER/);
});
