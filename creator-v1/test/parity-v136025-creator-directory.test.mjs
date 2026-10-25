/** V136.025 / Public creator directory source contracts.
 * Playwright compiled acceptance covers real geometry, Back navigation and
 * the loopback-only approved creator fixtures. No generated live profiles.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('creator directory routes, data and search stay URL-owned and read-only',()=>{
  const page=read('web/src/pages/CreatorsPage.tsx');
  const nav=read('web/src/components/PageNav.tsx');
  assert.match(page,/data-parity-creators="v136\.017"/);
  assert.match(page,/data-directory-phase="v136\.025"/);
  assert.match(page,/const q=params\.get\("q"\)\|\|"",cursor=params\.get\("cursor"\)\|\|""/);
  assert.match(page,/const view=params\.get\("view"\)==="list"\?"list":"grid"/);
  assert.match(page,/const data=useResource\(signal=>readCreators\(\{q:q\|\|undefined,cursor:cursor\|\|undefined,limit:"24"\},signal\),\[q,cursor\]\)/);
  assert.match(page,/function submitSearch\(value:string\)/);
  assert.match(page,/const term=value\.trim\(\)\.slice\(0,80\)/);
  assert.match(page,/const next=new URLSearchParams\(\)/);
  assert.match(page,/if\(view==="list"\)next\.set\("view","list"\)/);
  assert.match(page,/function chooseView\(nextView:"grid"\|"list"\)/);
  assert.match(page,/const next=new URLSearchParams\(params\)/);
  assert.match(page,/setParams\(next\)/);
  assert.match(page,/<label htmlFor="p136-creator-query" className="visually-hidden">Search published creators<\/label>/);
  assert.match(page,/aria-pressed=\{view==="grid"\}/);
  assert.match(page,/aria-pressed=\{view==="list"\}/);
  assert.match(page,/data-layout=\{view\}/);
  assert.match(page,/<PageNav route="\/creators" search=\{params\} nextCursor=\{data\.data\.nextCursor\}/);
  assert.match(nav,/cursorRoute\(route,search,nextCursor\)/);
  assert.match(page,/to=\{clearHref\}/);
  assert.doesNotMatch(page,/fetch\(|localStorage|sessionStorage|Math\.random|XMLHttpRequest/);
});

test('visible channels and absence states are based on existing verified API only',()=>{
  const page=read('web/src/pages/CreatorsPage.tsx');
  assert.match(page,/data\.state==="loading"&&<LoadingState/);
  assert.match(page,/data\.state==="error"&&<ErrorState/);
  assert.match(page,/data\.state==="ready"&&<>/);
  assert.match(page,/data\.data\.items\.map\(\(c,i\)=>/);
  assert.match(page,/to=\{creatorChannelPath\(c\.handle,directoryReturn\)\}/);
  assert.match(page,/<CompactMemberIdentity interactive=\{false\} size="standard"/);
  assert.match(page,/source:'creator-channel'/);
  assert.match(page,/publishedProjects/);
  assert.match(page,/cursor\?"No further channels on this page\."/);
  assert.match(page,/q\?"No matching creators yet\."/);
  assert.match(page,/Private accounts and unpublished projects are not listed/);
  assert.match(page,/PUBLIC CHANNEL DIRECTORY \/ APPROVED WORK/);
  assert.match(page,/PUBLIC INDEX \/ CHANNELS WITH APPROVED WORK/);
  // Staff-approved published work does not confer verified human identity.
  assert.doesNotMatch(page,/PUBLIC CHANNEL DIRECTORY \/ VERIFIED|verified public creator channels/i);
  assert.doesNotMatch(page,/createdAt:\s*new Date|SYNTHETIC QA|fictional creator/i);
});

test('visual convergence is responsive, keyboard-visible, low-motion and native',()=>{
  const css=read('web/src/parity/sitewide-interface-v136.css');
  const main=read('web/src/main.tsx');
  assert.match(main,/await import\("\.\/parity\/sitewide-interface-v136\.css"\)/);
  assert.match(css,/V136\.025 \/ Public creator directory/);
  assert.match(css,/\.portal-creator-grid\[data-layout="list"\]/);
  assert.match(css,/\.p136-creators-search:focus-within/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:680px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
  assert.match(css,/\.p136-creators-empty/);
  assert.doesNotMatch(css,/url\(\s*['"]?https?:|@import\s+url|@font-face|data:image/i);
});
