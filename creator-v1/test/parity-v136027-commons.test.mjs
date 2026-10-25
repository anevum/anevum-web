/**
 * V136.027 Commons: URL-owned public browsing with no private member-data fork.
 * Source contracts are deliberately independent of synthetic browser fixtures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const hub=read('web/src/pages/CommunityPage.tsx');
const css=read('web/src/pages/community-hub-v007.css');

test('Community filters are URL-backed rather than competing component state',()=>{
 assert.match(hub,/const \[params, setSearchParams\] = useSearchParams\(\)/);
 assert.match(hub,/const view = asView\(params\.toString\(\)\)/);
 assert.match(hub,/const requestedCategory = params\.get\("category"\)/);
 assert.match(hub,/fields\.some\(field => field\.id === requestedCategory\)/);
 assert.match(hub,/const sort: CommunityPostSort = params\.get\("sort"\) === "hot" \? "hot" : "new"/);
 assert.match(hub,/const creatorQuery = view === "people" \? \(params\.get\("q"\) \|\| ""\)\.trim\(\)\.slice\(0, 72\) : ""/);
 assert.match(hub,/useEffect\(\(\) => \{ setCreatorInput\(creatorQuery\); \}, \[creatorQuery\]\)/);
 assert.doesNotMatch(hub,/\[view,\s*setView\]|\[category,\s*setCategory\]|\[sort,\s*setSort\]|\[creatorQuery,\s*setCreatorQuery\]/);
 assert.match(hub,/function chooseView\(next: View\)/);
 assert.match(hub,/updated\.delete\("category"\)/);
 assert.match(hub,/updated\.delete\("sort"\)/);
 assert.match(hub,/updated\.delete\("q"\)/);
 assert.match(hub,/function chooseCategory\(next: Category \| "all"\)/);
 assert.match(hub,/function chooseSort\(next: CommunityPostSort\)/);
 assert.match(hub,/function searchCreators\(event: FormEvent<HTMLFormElement>\)/);
 assert.match(hub,/if \(value\) updated\.set\("q", value\)/);
 assert.match(hub,/name="q" type="search"/);
 assert.match(hub,/onChange=\{event => chooseCategory\(/);
 assert.match(hub,/onClick=\{\(\) => chooseSort\("hot"\)\}/);
 assert.match(hub,/data-community-phase="v136\.027"/);
});

test('Public API and moderation source boundaries are unchanged',()=>{
 assert.match(hub,/readStatus\(signal\)/);
 assert.match(hub,/readProjects\(\{ sort: "new", limit: "24", category:/);
 assert.match(hub,/readCreators\(\{ limit: "12", q: creatorQuery \|\| undefined \}/);
 assert.match(hub,/communityPosts === true/);
 assert.match(hub,/if \(!enabled\) return \{ availability: "closed"/);
 assert.match(hub,/readCommunityPosts\(\{ sort: view === "conversations" \? sort : "new", limit: "24" \}/);
 assert.match(hub,/useResource\(/);
 assert.doesNotMatch(hub,/fetch\(|credentials\s*:|localStorage|sessionStorage|document\.cookie|dangerouslySetInnerHTML|Math\.random\(|grantXp\(/);
});

test('Invalid or missing creator links never become public /creators/null routes',()=>{
 assert.match(hub,/publicCreatorHandle\(item\.creatorHandle\)/);
 assert.match(hub,/publicCreatorHandle\(item\.authorHandle\)/);
 assert.match(hub,/publicCreatorHandle\(item\.handle\)/);
 assert.match(hub,/handle \? <Link to=\{creatorPath\(handle\)\}/);
 assert.match(hub,/Public creator channel not linked/);
 assert.match(hub,/Public author channel not linked/);
 assert.doesNotMatch(hub,/creatorPath\(item\.creatorHandle\)|creatorPath\(item\.authorHandle\)|creatorPath\(item\.handle\)/);
 assert.match(hub,/aria-label="Approved public community counts"/);
 assert.match(hub,/PUBLISHED WORK \/ APPROVED/);
});

test('Same responsive Commons presentation and accessible mobile creator search',()=>{
 assert.match(css,/V136\.027: user-generated text search/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/\.p136-community\[data-community-phase="v136\.027"\] \.ch7-search input\{\s*font-size:16px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/@import\s+url|url\(\s*['"]?https?:|@font-face/);
});
