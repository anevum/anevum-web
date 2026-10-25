/** V136.017 authored compositional UI source safety, Node 22, no browser/network.
 * The full Chromium QA separately tests actual pixels, responsive layout and routes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const hero=source('../web/src/parity/ParityPortalV136.tsx');
const art=source('../web/src/parity/ContinuanceInstrumentV136017.tsx');
const studio=source('../web/src/parity/StudioSpatialWorkspaceV136.tsx');
const ide=source('../web/src/parity/ArtifactWorkbenchV136.tsx');
const glyph=source('../web/src/parity/FileGlyphV136017.tsx');
const css=source('../web/src/parity/concept-convergence-v136017.css');
const main=source('../web/src/main.tsx');
test('original Arrival optical instrument is non-interactive and independent of remote files',()=>{
 assert.match(art,/aria-hidden="true"/);
 assert.match(art,/data-art="continuance-original-optics"/);
 assert.match(art,/<svg viewBox="0 0 840 690"/);
 assert.match(art,/const ticks=Array\.from\(\{length:48\}/);
 assert.ok(!/<canvas\b|<iframe\b|onClick|onKeyDown|fetch\(|window\.|localStorage|navigator\.|import\(|http:/i.test(art),
  'Artwork cannot own a renderer, unsafe execution or real navigation');
 assert.match(hero,/import \{ContinuanceInstrumentV136017\}/);
 assert.match(hero,/<ContinuanceInstrumentV136017\/>/);
 assert.match(hero,/id="p136-hero-title"/);
 assert.match(hero,/THE CONTINUANCE INSTITUTE/);
});
test('homepage retains canonical public-data fields and real routes',()=>{
 for(const expected of [
  'projectDetailPath(project.id','to="/discover"','to="/community"',
  'to="/studio"',"signedIn?'/member':'/join'",
  "signal.source==='verified'","catalogueState==='error'",
  'DYNAMIC ANEVUM FIELD / NOT CREATOR COVER',"new Event('anevum:iren-open')"
 ])assert.ok(hero.includes(expected),'Missing public action/safety: '+expected);
 assert.ok(!/Date\.now|Math\.random|fakeProjects|sampleProjects|simulatedMembers/.test(hero),
  'No invented live catalogue or member data');
});
test('Studio navigation follows actual verified record state and preserves permissions',()=>{
 assert.match(studio,/data-studio-console="v136\.009"/);
 assert.match(studio,/className="p136017-studio-quicknav"/);
 assert.match(studio,/<NavLink to="\/studio\/records">/);
 assert.match(studio,/<NavLink to="\/studio\/packages">/);
 assert.match(studio,/current\?\.phase==='ready'\?projects\.length/);
 assert.match(studio,/PRIVATE RECORDS NOT YET LOADED/);
 assert.match(studio,/current\?\.data\?\.canReview===true/);
 assert.match(studio,/Protected by your verified session/);
 assert.ok(!/fetch\(|localStorage|window\.sessionStorage|publish\(/.test(studio.slice(studio.indexOf('return <div className="p136-studio-console"'))),
  'No new account/network operation inside pure visual shell');
});
test('Monaco retains local source/real packaging and no fake code execution',()=>{
 assert.match(ide,/data-artifact-workbench="v136\.011"/);
 assert.match(ide,/p136017-source-functionbar/);
 assert.match(ide,/p136017-source-ledge/);
 assert.match(ide,/LOCAL · NOT EXECUTED/);
 assert.match(ide,/sourceArchive\(files\)/);
 assert.match(ide,/onPackage\(archive\)/);
 assert.match(ide,/onDirty\(\)/);
 assert.match(ide,/private-upload controls still apply/);
 assert.match(ide,/JavaScript is edited as text\. This view does not compile, run, save to your account or publish source\./);
 assert.ok(!/iframe srcDoc|eval\(|new Function\(/.test(ide));
});
test('concept pass is scoped, responsive, and loaded after original V136 foundation',()=>{
 const old='await import("./parity/visual-foundation-v136.css");';
 const next='await import("./parity/concept-convergence-v136017.css");';
 assert.ok(main.indexOf(next)>main.indexOf(old)&&main.includes('VITE_PARITY_V136_FULL === "true"'));
 assert.match(css,/html\[data-av-parity="v136-full"\] \.p136-hero/);
 assert.match(css,/html\[data-av-parity="v136-full"\] \.p136-studio-console/);
 assert.match(css,/html\[data-av-parity="v136-full"\] \.p136-workbench/);
 assert.match(css,/@media\(max-width:820px\)/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.ok(!/url\(\s*['"]?https?:|@import\s+url|@font-face/.test(css),
  'No new remote font/textures or CSP dependencies');
});


test('original file-type glyphs decorate real Monaco tabs and explorer, not source content or filenames',()=>{
 assert.match(glyph,/export function FileGlyphV136017/);
 assert.match(glyph,/aria-hidden="true" focusable="false"/);
 for(const name of ['html','css','javascript','json','markdown','text']){
  assert.ok(glyph.includes("'"+name+"'"),'missing visual language: '+name);
 }
 assert.match(ide,/FileGlyphV136017 path=\{path\}/);
 assert.match(ide,/fileKind\(node\.path\)/);
 assert.ok(!/fetch\(|onClick|onSubmit|localStorage|sessionStorage|document\./.test(glyph),
  'file-type SVGs cannot own any editor or private project behavior');
});

test('real permitted local files form disclosure folders without creating synthetic projects',()=>{
 assert.match(ide,/function sourceExplorerTree\(paths:string\[\]\)/);
 assert.match(ide,/const parts=path\.split/);
 assert.match(ide,/sourceExplorerTree\(entries\.map/);
 assert.match(ide,/aria-label=\{'Folder '\+node\.name\}/);
 assert.match(ide,/aria-expanded=\{expanded\}/);
 assert.match(ide,/aria-label=\{node\.path\}/);
 assert.match(ide,/onClick=\{\(\)=>selectFile\(node\.path\)\}/);
 assert.match(glyph,/export function FolderGlyphV136017/);
 assert.match(css,/\.p136017-source-tree \.p136017-tree-folder/);
});

test('the real nested Studio workbench uses container-width geometry, not just viewport breakpoints',()=>{
 assert.match(css,/\.av095-upload-grid:has\(\.p136-workbench\)/);
 assert.match(css,/\.p136-studio-console-layout:has\(\.p136-workbench\)/);
 assert.match(css,/container-type:inline-size/);
 assert.match(css,/container-name:continuance-source/);
 assert.match(css,/@container continuance-source \(max-width:960px\)/);
 assert.match(css,/@container continuance-source \(max-width:620px\)/);
});

test('full backup preserves Markdown and playable archive uses canonical MIME contract',()=>{
 const archive=source('../web/src/parity/source-archive-v136.ts');
 assert.match(archive,/path\.endsWith\('\.md'\)/);
 assert.match(archive,/export function localOnlySourcePaths/);
 assert.match(archive,/export function playableSourceArchive/);
 assert.match(ide,/playableSourceArchive\(files\)/);
 assert.match(ide,/sourceArchive\(files\)/);
 assert.match(ide,/onClick=\{downloadSource\}/);
 assert.match(ide,/excluded from playable ZIPs/);
});

test('source tree offers real validated rename and confirmed removal, not cosmetic file commands',()=>{
 const operations=source('../web/src/parity/workbench-file-ops-v136.ts');
 const workbenchCss=source('../web/src/parity/artifact-workbench-v136.css');
 assert.match(operations,/isSafePath\(next\)/);
 assert.match(operations,/previous==='index\.html'/);
 assert.match(operations,/path==='index\.html'/);
 assert.match(operations,/path\.toLowerCase\(\)===next\.toLowerCase\(\)/);
 assert.match(ide,/renameLocalSource\(files,renamingFile,target,safePath\)/);
 assert.match(ide,/removeLocalSource\(files,deletingFile\)/);
 assert.match(ide,/onClick=\{beginRename\}/);
 assert.match(ide,/Confirm remove file/);
 assert.match(ide,/setDirty\(true\);onDirty\(\)/);
 assert.match(workbenchCss,/\.p136017-file-mutation/);
});

test('Creator Studio rename and removal show actual local link audit without rewritten imports',()=>{
 const helper=source('../web/src/parity/workbench-file-ops-v136.ts');
 const localCss=source('../web/src/parity/artifact-workbench-v136.css');
 assert.match(ide,/sourceReferencesToReview\(files,renamingFile\)/);
 assert.match(ide,/sourceReferencesToReview\(files,deletingFile\)/);
 assert.match(ide,/data-source-reference-audit="rename"/);
 assert.match(ide,/data-source-reference-audit="remove"/);
 assert.match(ide,/No direct local path references detected/);
 assert.match(localCss,/\.p136017-ref-audit/);
 assert.ok(!/fetch\(|eval\(|localStorage|sessionStorage/.test(helper),'Reference audit is pure local calculation');
});

test('dependency warnings navigate into a real source tab and cancel pending operations',()=>{
 const css=source('../web/src/parity/artifact-workbench-v136.css');
 assert.match(ide,/function inspectReference\(path:string,previous:string\)/);
 assert.match(ide,/onClick=\{\(\)=>inspectReference\(path,renamingFile\)\}/);
 assert.match(ide,/onClick=\{\(\)=>inspectReference\(path,deletingFile\)\}/);
 assert.match(ide,/The pending file operation was canceled/);
 assert.match(ide,/document\.getElementById\('p136-source-tab-'\+path\)/);
 assert.match(css,/\.p136017-ref-audit li button/);
});


test('inspector surfaces advisory missing static source links and real editor navigation',()=>{
 const ops=source('../web/src/parity/workbench-file-ops-v136.ts');
 const styles=source('../web/src/parity/artifact-workbench-v136.css');
 assert.match(ops,/export function unresolvedLocalSourceLinks/);
 assert.match(ops,/sourceReferencePath\(source,value\)/);
 assert.match(ide,/useMemo\(\(\)=>unresolvedLocalSourceLinks\(files,safePath\),\[files\]\)/);
 assert.match(ide,/data-source-link-diagnostics="local"/);
 assert.match(ide,/onClick=\{\(\)=>inspectUnresolvedLink\(link.source,link.target\)\}/);
 assert.match(ide,/Static HTML, CSS and JavaScript links only/);
 assert.match(styles,/\.p136017-source-link-diagnostics/);
 assert.ok(!/fetch\(|eval\(|localStorage|sessionStorage/.test(ops),
  'Diagnostic module cannot create new execution or network capabilities');
});


test('all V136 public discovery covers use authored type defaults or actual uploaded covers, never generated category art',()=>{
 const cover=source('../web/src/parity/CategoryCoverV136.tsx');
 const coverCss=source('../web/src/parity/category-cover-v136.css');
 const homepage=source('../web/src/parity/ParityPortalV136.tsx');
 const discover=source('../web/src/parity/ParityDiscoverV136.tsx');
 const detail=source('../web/src/parity/ArtifactLensV136.tsx');
 const publicCard=source('../web/src/components/ProjectCard.tsx');
 const packages=source('../web/src/components/CreatorPackageGallery.tsx');
 assert.match(cover,/data-cover-source=\{hasCover\?'creator':'default'\}/);
 assert.match(cover,/onError=\{\(\)=>setFailedUrl\(coverUrl\?\?null\)\}/);
 assert.match(cover,/role="img"/);
 for(const category of ['games','tools','automation','research','creative','learning','libraries','other','game','app','simulation','story']){
  assert.ok(cover.includes(category+':{label:'),'Every real category has a deterministic thumbnail: '+category);
 }
 assert.match(coverCss,/\.p136-category-cover--violet/);
 assert.match(coverCss,/\.p136-category-cover--cyan/);
 assert.match(coverCss,/\.p136-category-cover--mint/);
 assert.match(homepage,/<CategoryCoverV136 category=\{project\.category\}/);
 assert.match(homepage,/<CategoryCoverV136 category=\{item\.scene\}/);
 assert.match(discover,/<CategoryCoverV136 category=\{id\}/);
 assert.match(detail,/<CategoryCoverV136 category=\{item\.category\}/);
 assert.match(publicCard,/VITE_PARITY_V136_FULL==="true"\s*\?<CategoryCoverV136/);
 assert.match(packages,/VITE_PARITY_V136_FULL==='true'\s*\?<CategoryCoverV136/);
 for(const [name,code] of [['homepage',homepage],['discovery',discover],['details',detail]]){
  assert.ok(!code.includes('CosmicArtwork'),'V136 '+name+' must not create category illustrations');
 }
 assert.ok(!/fetch\(|localStorage|sessionStorage|eval\(/.test(cover),
  'Default covers are static first-party UI, with no telemetry or external art retrieval');
});
