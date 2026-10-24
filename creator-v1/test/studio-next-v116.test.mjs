import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {
 PROJECT_STRUCTURE_VERSION,SECTIONS,projectTreeTemplate,validateProjectNodes,
 buildProjectTree,flattenTree,searchTree,classifyFile
} from '../studio-next/project-tree-v116.mjs';
const read=f=>readFileSync(f,'utf8');
const page=read('creator-v1/web/src/pages/WorldComposerReviewV115.tsx');
const nav=read('creator-v1/web/src/pages/StudioNavigationV116.tsx');
const assets=read('creator-v1/web/src/pages/StudioAssetShelfV116.tsx');
const modes=read('creator-v1/web/src/pages/StudioOtherModesV116.tsx');
const css=read('creator-v1/web/src/pages/studio-next-v116.css');

test('project tree is a normalized V111-compatible namespace with clear folders',()=>{
 const fixture=projectTreeTemplate(),t=buildProjectTree(fixture.items,fixture.projectId);
 assert.equal(t.version,PROJECT_STRUCTURE_VERSION);
 assert.equal(t.total,fixture.items.length);
 assert.deepEqual(t.roots.map(n=>n.name),[...SECTIONS]);
 assert.ok(t.roots.every(n=>n.kind==='folder'&&n.path===n.name));
 assert.ok(t.roots.find(n=>n.name==='Scenes').children.some(n=>n.name==='Main World.world.anevum'));
 assert.equal(flattenTree(t.roots).length,fixture.items.length);
 assert.equal(classifyFile('Main World.world.anevum'),'world');
 assert.equal(classifyFile('Screen.ui.anevum'),'interface');
 assert.equal(classifyFile('Interaction Logic.ts'),'script');
 assert.equal(classifyFile('model.asset.anevum'),'asset');
 assert.equal(classifyFile('notes'), 'document');
 assert.equal(searchTree(t.roots,'bridge').length,0);
 const sky=searchTree(t.roots,'Main World');
 assert.equal(sky.length,1);
 assert.equal(sky[0].name,'Scenes');
 assert.equal(sky[0].children.length,1);
});
test('project tree rejects cross-project leaks, cycles, duplicates and malformed paths',()=>{
 const base=projectTreeTemplate();
 const build=x=>validateProjectNodes(x,base.projectId);
 const copy=()=>JSON.parse(JSON.stringify(base.items));
 let nodes=copy();nodes[0].projectId='a0000000-0000-4000-8000-000000000000';
 assert.throws(()=>build(nodes),/Cross-project/);
 nodes=copy();nodes[0].name='../Private';
 assert.throws(()=>build(nodes),/Invalid filename/);
 nodes=copy();nodes.push({...nodes[0]});
 assert.throws(()=>build(nodes),/Duplicate/);
 nodes=copy();nodes[0].parentId=nodes[1].id;nodes[1].parentId=nodes[0].id;
 assert.throws(()=>build(nodes),/Dangling|Cycle|nonfolder/i);
 nodes=copy();nodes[1].parentId=nodes[1].id;
 assert.throws(()=>build(nodes),/Cycle/);
 nodes=copy();nodes[1].parentId='20000000-0000-4000-8000-000000000999';
 assert.throws(()=>build(nodes),/Dangling/);
 nodes=copy();nodes[1].kind='program';
 assert.throws(()=>build(nodes),/Unsupported/);
 nodes=copy();nodes[1].name='Scenes';nodes[1].parentId=null;
 assert.throws(()=>build(nodes),/Duplicate sibling/);
 assert.throws(()=>validateProjectNodes([...copy(),...copy(),...copy(),...copy(),...copy()],base.projectId),/Too many/);
});
test('all V116 React pieces compile as typed JSX and use the original site identity',()=>{
 for(const source of [page,nav,assets,modes]){
  const ast=parse(source,{sourceType:'module',plugins:['typescript','jsx']});
  assert.ok(ast.program.body.length>=5);
 }
 assert.match(page,/import \{OrbitalMark\} from/);
 assert.match(nav,/PROJECT FILES/);
 assert.match(nav,/SEARCH|Search sample project files/);
 assert.match(page,/StudioModeRailV116/);
 assert.match(page,/StudioTopModesV116/);
 assert.match(page,/StudioFileTreeV116/);
 assert.match(page,/StudioAssetShelfV116/);
 assert.match(page,/StudioOtherModesV116/);
 assert.match(page,/WorldCanvasV115/);
 assert.match(page,/ANEVUM <b>\/ CREATOR STUDIO<\/b>/);
 assert.match(page,/IREN \/ CREATIVE COPILOT/);
});
test('new navigation and asset shelves have functioning states, not inert buttons',()=>{
 assert.match(nav,/name:'Scene'/);
 assert.match(nav,/name:'Interface'/);
 assert.match(nav,/name:'Scripts'/);
 assert.match(nav,/name:'Assets'/);
 assert.match(nav,/name:'Playtest'/);
 assert.match(nav,/name:'Publish'/);
 assert.match(nav,/onChange\(item.name\)/);
 assert.match(nav,/onOpen\(\{id:file.id/);
 assert.match(assets,/setCategory\(c\)/);
 assert.match(assets,/setQuery\(e.target.value\)/);
 assert.match(assets,/onAdd\(a\)/);
 assert.match(page,/function addAsset\(asset:StudioAsset\)/);
 assert.match(page,/command\(\{type:'ADD_NODE',node:added\}\)/);
 assert.match(assets,/Preview only/);
 assert.match(modes,/Local button state updated/);
 assert.match(modes,/setInterfaceTheme/);
 assert.match(modes,/setCode\(v=>/);
 assert.match(modes,/Existing native package workflow|Existing native package workflow remains/);
});
test('separate source and security boundaries stay explicit',()=>{
 for(const source of [nav,assets,modes]){
  assert.doesNotMatch(source,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|\beval\s*\(|new Function|dangerouslySetInnerHTML/);
 }
 assert.match(page,/Save revision/);
 assert.match(page,/disabled className="cvs-primary"/);
 assert.match(nav,/V111 member\/role/);
 assert.match(modes,/Text is local to this preview/);
 assert.match(page,/PRIVATE · UNSAVED/);
});
test('concept UI has desktop workspace depth and specific mobile overflow safeguards',()=>{
 for(const token of ['csn-site-nav','csn-mode-rail','csn-workspace-tabs','csn-filetree','csn-asset-track','csn-scene-light','csn-inspector-tabs','csn-interface-preview','csn-code-shell','csn-publish-grid']){
  assert.ok(css.includes('.'+token),token);
 }
 for(const breakpoint of ['1320px','1040px','920px','680px','360px'])
  assert.ok(css.includes('max-width:'+breakpoint),'breakpoint '+breakpoint);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/\.cvw-root \.cvw-grid\{display:block/);
});
