import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const primitives=read('web/src/components/NextVisualPrimitivesV135.tsx');
const css=read('web/src/next-visual-primitives-v135.css');
const main=read('web/src/main.tsx');
const lab=read('web/src/pages/NextVisualLabV134.tsx');
const portal=read('web/src/components/PortalHeading.tsx');
const projects=read('web/src/components/ProjectCard.tsx');
const discover=read('web/src/pages/DiscoverPage.tsx');
const community=read('web/src/pages/CommunityPage.tsx');
const creators=read('web/src/pages/CreatorsPage.tsx');

test('V135 shared CSS is lazy-loaded only inside existing NEXT preview gate',()=>{
  assert.match(main,/if \(import\.meta\.env\.VITE_NEXT_VISUAL_SYSTEM === "true"\)/);
  assert.match(main,/void import\("\.\/next-visual-primitives-v135\.css"\)/);
  assert.match(primitives,/if\(import\.meta\.env\.VITE_NEXT_VISUAL_SYSTEM!=="true"\)return null/);
  assert.match(css,/html\[data-av-next-visual="v134"\]/);
  assert.doesNotMatch(css,/^\s*(?:html|body|:root)\s*\{/m);
  assert.doesNotMatch(css,/:has\(/);
});
test('actual reusable vector glyphs use deterministic extension colors, not brand replacement',()=>{
  for(const ext of ['html','htm','css','scss','ts','tsx','mts','js','jsx','mjs','json','jsonc','md','mdx','svg','png','jpg','jpeg','webp','gif','avif'])
    assert.ok(primitives.includes('"'+ext+'"'),'Missing extension: '+ext);
  assert.match(primitives,/export function fileVisualKind\(/);
  assert.match(primitives,/export function VisualFileGlyph\(/);
  assert.match(primitives,/viewBox="0 0 32 38"/);
  assert.match(primitives,/aria-hidden="true"/);
  assert.match(lab,/import \{VisualFileGlyph\} from "\.\.\/components\/NextVisualPrimitivesV135"/);
  assert.match(lab,/<VisualFileGlyph name=\{item\.id\}\/>/);
  assert.match(lab,/import \{OrbitalMark\}/,'Original mark is retained in lab');
});
test('edge is decorative and cannot intercept navigation or access',()=>{
  assert.match(primitives,/export function VisualEdge\(/);
  assert.match(primitives,/aria-hidden="true"/);
  assert.match(css,/pointer-events:none/);
  for(const tone of ['cyan','violet','copper','mint'])
    assert.ok(primitives.includes('"'+tone+'"'), 'Missing shared tone '+tone);
  for(const forbidden of ['fetch(','localStorage','sessionStorage','document.cookie','canonicalAuthClient','memberCreate','awardXp','new WebSocket'])
    assert.ok(!primitives.includes(forbidden),'Unexpected effect in visual primitive: '+forbidden);
});
test('source integration uses shared primitives in genuine published and creator surfaces',()=>{
  for(const [source,name] of [[portal,'portal heading'],[projects,'ProjectCard'],[discover,'Discover'],[community,'Community'],[creators,'Creators']]){
    assert.match(source,/NextVisualPrimitivesV135/,name+' imports reusable design primitive');
    assert.match(source,/<VisualEdge tone=/,name+' mounts an actual edge');
  }
  assert.match(portal,/<VisualEdge tone="violet"\/>/);
  assert.match(discover,/<VisualEdge tone="cyan"\/>/);
  assert.match(community,/VisualEdge tone="violet"/);
  assert.match(creators,/VisualEdge tone="violet"/);
  assert.match(projects,/VisualEdge tone=\{project\.category/,'Real category determines only surface tone');
  assert.match(projects,/projectDetailPath\(project\.id,returnTo\)/,'Real published destinations remain canonical');
});
test('integrations preserve original public data source and role boundaries',()=>{
  for(const dataSource of ['readProjects','useResource','ProjectCard']) assert.ok(discover.includes(dataSource),dataSource);
  assert.match(creators,/readCreators/);
  assert.match(community,/readCommunityPosts/);
  assert.doesNotMatch(primitives,/canonicalMe|canonicalEdit|studioUpload|memberId|publishedProjects\s*=/);
  assert.doesNotMatch(css,/url\(\s*['"]?https?:/);
});
test('edge/text treatment remains responsive and keyboard/high-contrast safe',()=>{
  for(const snippet of ['@media(max-width:760px)','@media(max-width:430px)','@media(prefers-reduced-motion:reduce)','@media(forced-colors:active)','-webkit-mask-composite:xor','pointer-events:none','shape-rendering:geometricPrecision'])
    assert.ok(css.includes(snippet),'Missing progressive style: '+snippet);
  assert.match(css,/\.av135-file-glyph--html/);
  assert.match(css,/\.av135-file-glyph--css/);
  assert.match(css,/\.av135-file-glyph--typescript/);
  assert.match(css,/\.portal-page-heading h1 em/);
  assert.match(css,/\.av73-project-card h3/);
});
