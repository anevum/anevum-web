/** V136.026 — public Discover URL layout and truthful catalogue contracts.
 * This is a fast source gate; compiled Chromium acceptance is separate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('Discover layouts belong to URL, preserve catalogue filters and do not refetch for layout',()=>{
 const page=read('web/src/pages/DiscoverPage.tsx');
 assert.match(page,/const view=params\.get\("view"\)==="list"\?"compact":"covers"/);
 assert.doesNotMatch(page,/\[view,setView\]=useState/);
 assert.match(page,/function chooseView\(next:"covers"\|"compact"\)/);
 assert.match(page,/if\(next==="compact"\)nextParams\.set\("view","list"\)/);
 assert.match(page,/else nextParams\.delete\("view"\)/);
 assert.match(page,/Layout changes must not reset the real server query or its cursor/);
 assert.match(page,/view=\{view\} onView=\{chooseView\}/);
 assert.match(page,/q:q\|\|undefined,category:category\|\|undefined,cursor:cursor\|\|undefined,free:freeOnly\?"1":undefined,limit:"24"/);
 assert.match(page,/\},\[q,category,cursor,freeOnly\]\)/);
 assert.match(page,/next\.delete\("cursor"\)/);
 assert.match(page,/to=\{clearHref\}/);
 assert.match(page,/data-layout=\{view==="compact"\?"list":"grid"\}/);
 assert.match(page,/APPROVED PUBLISHED/);
 assert.doesNotMatch(page,/VERIFIED PUBLISHED|setView\("compact"\)|setView\("covers"\)/);
});

test('full-flag Discover uses the same URL state, approved real media and accessible controls',()=>{
 const page=read('web/src/parity/ParityDiscoverV136.tsx');
 const card=read('web/src/components/ProjectCard.tsx');
 const cover=read('web/src/components/ProjectThumbnail.tsx');
 const packages=read('web/src/components/CreatorPackageGallery.tsx');
 assert.match(page,/data-discovery-phase="v136\.026"/);
 assert.match(page,/const clearHref=view==='compact'\?'\/discover\?view=list':'\/discover'/);
 assert.match(page,/to=\{clearHref\}/);
 assert.match(page,/data-layout=\{view==='compact'\?'list':'grid'\}/);
 assert.match(page,/aria-pressed=\{view==='covers'\}/);
 assert.match(page,/aria-pressed=\{view==='compact'\}/);
 assert.match(page,/aria-label="Search published projects"/);
 assert.match(page,/placeholder="Search projects\.\.\."/);
 assert.match(page,/view==='compact'&&<input type="hidden" name="view" value="list"\/>/);
 assert.match(page,/onCategory\(ch\.id\)/);
 assert.match(page,/onToggleFree/);
 assert.match(page,/packageProjects\.map\(project=><WorkCard/);
 assert.match(page,/legacyProjects\.map\(project=><ProjectCard/);
 assert.match(card,/<ProjectThumbnail kind=\{project\.category\}/);
 assert.match(packages,/uploadedUrl=\{work\.coverUrl\}/);
 assert.match(cover,/safePackageCover\(uploadedUrl\)/);
 assert.doesNotMatch(page,/fabricated\s+users|Math\.random\(/);
});

test('Discover list is a single dense column at every width and mobile search avoids zoom',()=>{
 const css=read('web/src/parity/parity-discover-v136.css');
 assert.match(css,/\.p136-discover-results\.p136-discover-results--compact\{\s*grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.av010-work-card \.av010-work-cover\{display:none\}/);
 assert.match(css,/\.av73-project-card\{\s*min-width:0;min-height:0;display:flex/);
 assert.match(css,/@media \(max-width:600px\)\{/);
 assert.match(css,/\.p136-discover-search-form input\{font-size:16px\}/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/@import\s+url|url\(\s*['"]?https?:|@font-face/);
});