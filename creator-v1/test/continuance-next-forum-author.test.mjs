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
 assert.match(card,/hasDetails&&<details/);
 assert.match(card,/reputation&&<>/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.discussions/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.replies/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.appreciations/);
 assert.match(card,/creditedContributionCount\(reputation\.stats\.badges/);
 assert.match(card,/Object\.hasOwn\(BADGE_CATALOG,id\)/);
 assert.match(card,/\.slice\(0,3\)/);
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
 assert.match(card,/<summary aria-label=\{'Public profile details for '/);
 for(const variant of ['stream','detail','reply'])assert.ok(forums.includes('variant="'+variant+'"'),'Missing forum variant '+variant);
 assert.match(highlights,/variant="highlight"/);
 for(const variant of ['stream','detail','reply','highlight'])assert.ok(card.includes("'"+variant+"'"));
 assert.match(css,/\.cf-author-dossier-details>summary/);
 assert.match(css,/\.cf-author-dossier-details:not\(\[open\]\)\{height:0\}/);
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
 assert.match(card,/PUBLIC IDENTITY/);
 assert.match(card,/data-aura=\{aura\}/);
 assert.match(card,/hasDetails&&<details/);
});

test('compact identity preserves member-chosen visuals instead of replacing them with generic tags',()=>{
 assert.match(card,/data-aura=\{aura\}/);
 assert.match(card,/safePlayerAura\(author\.aura\)/);
 assert.match(card,/CompactMemberIdentity member=\{author\} className="cf-author" size="compact" interactive=\{false\}/);
 assert.match(css,/\.cf-author-dossier\[data-aura="aurora"\]/);
 assert.match(css,/\.cf-author-dossier\[data-aura="nebula"\]/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av65-aura-field/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av61-photo \.ms-portrait/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av61-specimen \.level-emblem/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av65-badge-rack/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av61-supporter/);
 assert.match(card,/earned\.ribbons\.map/);
 assert.doesNotMatch(css,/\.cf-author-dossier \.cf-author \.av65-badge-rack\{display:none/);
});
test('collapsed author strip uses two accessible icon actions, not a full-width wall row',()=>{
 assert.match(card,/cf-author-dossier-visit/);
 assert.match(card,/cf-author-dossier-details/);
 assert.match(card,/View public member wall of/);
 assert.match(card,/Public profile details for/);
 assert.doesNotMatch(card,/Show public profile details for/,'Native disclosure name stays accurate both open and closed');
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) 44px 44px/);
 assert.match(css,/\.cf-author-dossier-details:not\(\[open\]\)\{height:0\}/);
 assert.doesNotMatch(card,/VIEW WALL|CONTRIBUTION RECORD|PUBLIC MEMBER/);
});

test('publicly chosen long names stay compact without hiding earned cosmetic artwork',()=>{
 assert.match(css,/\.cf-author-dossier \.cf-author \.av61-member-name\{/);
 assert.match(css,/-webkit-line-clamp:2/);
 assert.match(css,/overflow:hidden!important/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av65-badge-rack/);
 assert.match(css,/\.cf-author-dossier \.cf-author \.av61-specimen \.level-emblem/);
 assert.match(card,/aria-label=\{'Public profile of '\+displayName\}/);
});
