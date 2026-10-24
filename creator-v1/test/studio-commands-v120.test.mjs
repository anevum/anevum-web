import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {studioCommandItems,studioFileItems,rankStudioItems,PALETTE_MODES} from '../source-ide/commands-v120.mjs';
import {diagnoseSource,sourceOffsetForLine} from '../source-ide/diagnostics-v120.mjs';
import {encode,starter} from '../world-composer/document.mjs';
const read=path=>readFileSync(path,'utf8');
const component=read('creator-v1/web/src/pages/StudioCommandPaletteV120.tsx');
const privateFiles=read('creator-v1/web/src/pages/StudioFileWorkspaceV111.tsx');
const sample=read('creator-v1/web/src/pages/StudioOtherModesV116.tsx');
const code=read('creator-v1/web/src/pages/StudioCodeEditorV119.tsx');
const css=read('creator-v1/web/src/pages/studio-command-palette-v120.css');
const sourceCSS=read('creator-v1/web/src/pages/studio-code-editor-v119.css');
test('V120 file Quick Open indexes only supplied current-tree file metadata and ranks by path and name',()=>{
 const nodes=[
  {id:'root',name:'Scenes',kind:'folder'},
  {id:'a',name:'scene.ts',kind:'text'},
  {id:'b',name:'styles.css',kind:'text'},
  {id:'c',name:'Sky.world.anevum',kind:'text'}
 ];
 const items=studioFileItems(nodes,[
  {id:'a',path:'Scripts / scene.ts'},{id:'b',path:'Interfaces / styles.css'},
  {id:'c',path:'Scenes / Sky.world.anevum'}],['c']);
 assert.equal(items.length,3);
 assert.ok(!items.some(x=>x.fileId==='root'));
 assert.equal(items[0].kind,'file');
 assert.equal(rankStudioItems(items,'styles')[0].fileId,'b');
 assert.equal(rankStudioItems(items,'scenes')[0].fileId,'c');
 assert.equal(rankStudioItems(items,'scene.ts')[0].fileId,'a');
 assert.equal(rankStudioItems(items,'world')[0].fileId,'c');
 assert.deepEqual(rankStudioItems(items,'nonexistent') ,[]);
 assert.deepEqual(PALETTE_MODES,['files','commands']);
 assert.equal(rankStudioItems(items,'',2).length,2);
});
test('V120 command palette is allowlisted; read-only workspaces never offer write commands',()=>{
 const commands=studioCommandItems(['new-file','collapse-folders','unexpected-command','toggle-trash']);
 assert.deepEqual(commands.map(x=>x.id),['new-file','collapse-folders','toggle-trash']);
 assert.ok(commands.every(x=>x.kind==='command'&&!x.disabled));
 assert.equal(studioCommandItems(['close-tabs'])[0].label,'Editor: Close all tabs');
 assert.equal(studioCommandItems([]).length,0);
 assert.ok(rankStudioItems(commands,'collapse')[0].id==='collapse-folders');
});
test('V120 JSON, world and CSS diagnostics return exact local syntax problems with line coordinates',()=>{
 const goodJSON=diagnoseSource('{"name":"ANEVUM","ok":true}','prefs.json');
 assert.equal(goodJSON.diagnostics.length,0);
 const badJSON=diagnoseSource('{\n  "broken":,\n}','prefs.json');
 assert.equal(badJSON.diagnostics[0].severity,'error');
 assert.equal(badJSON.diagnostics[0].code,'json-syntax');
 assert.ok(badJSON.diagnostics[0].line>=1);
 const world=diagnoseSource(encode(starter()),'Main.world.anevum');
 assert.deepEqual(world.diagnostics,[]);
 const malformed=diagnoseSource('ANEVUM_WORLD_V1\n{"nodes":[]}','Main.world.anevum');
 assert.equal(malformed.diagnostics[0].code,'world-schema');
 const noHeader=diagnoseSource('{"nodes":[]}','Main.world.anevum');
 assert.equal(noHeader.diagnostics[0].code,'world-header');
 const invalidCSS=diagnoseSource('.hero {\n  color: cyan;','site.css');
 assert.ok(invalidCSS.diagnostics.some(x=>x.code==='css-unclosed-block'&&x.line===1));
 const validCSS=diagnoseSource('.hero { content:"}"; /* { */ color:cyan; }','site.css');
 assert.equal(validCSS.diagnostics.some(x=>x.severity==='error'),false);
 const todo=diagnoseSource('// TODO build later\nconst a = 1;','logic.ts');
 assert.equal(todo.checked,false);
 assert.equal(todo.diagnostics[0].severity,'info');
 assert.match(todo.note,/no TypeScript compiler/);
 assert.equal(sourceOffsetForLine('one\ntwo\nthree',2,2),5);
 assert.equal(sourceOffsetForLine('one\ntwo\nthree',99,1),13);
});
test('V120 file palette, private V111, sample Studio and source problems panel are typed JSX with real callbacks',()=>{
 for(const src of [component,privateFiles,sample,code])
  assert.ok(parse(src,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>3);
 assert.match(component,/role="dialog" aria-modal="true"/);
 assert.match(component,/role="listbox"/);
 assert.match(component,/aria-activedescendant/);
 assert.match(component,/onKeyDown=\{handleKey\}/);
 assert.match(component,/event.key==='ArrowDown'/);
 assert.match(component,/onChoose\(item\)/);
 assert.match(privateFiles,/StudioCommandPaletteV120/);
 assert.match(privateFiles,/studioFileItems\(nodes,paths,openIds\)/);
 assert.match(privateFiles,/const node=nodes.find\(n=>n.id===item.fileId/);
 assert.match(privateFiles,/if\(node\)openFile\(node\)/);
 assert.match(privateFiles,/event.key.toLowerCase\(\)!=='p'/);
 assert.match(privateFiles,/closeAllFiles\(\)/);
 assert.match(privateFiles,/studioFileUpdate\(projectId,nodeId/);
 assert.match(sample,/StudioCommandPaletteV120/);
 assert.match(sample,/setTab\(item.fileId\)/);
 assert.match(code,/diagnoseSource\(value,fileName\)/);
 assert.match(code,/sourceOffsetForLine\(value,line,column\)/);
 assert.match(code,/aria-label="Source diagnostics"/);
 assert.match(code,/aria-label="Go to line"/);
 assert.match(code,/Source problems and diagnostics/);
 assert.match(code,/No language-specific validator attached|problems.note/);
 assert.match(css,/\.csp-backdrop/);
 assert.match(css,/forced-colors:active/);
 assert.match(sourceCSS,/\.csi-problems/);
 assert.match(sourceCSS,/\.csi-goto/);
});
test('V120 never executes source, sends it to the network or directly mutates the backend',()=>{
 for(const name of ['creator-v1/source-ide/commands-v120.mjs','creator-v1/source-ide/diagnostics-v120.mjs',
  'creator-v1/web/src/pages/StudioCommandPaletteV120.tsx'])
  assert.doesNotMatch(read(name),/\bfetch\s*\(|\beval\s*\(|new Function|dangerouslySetInnerHTML|localStorage|sessionStorage|XMLHttpRequest/);
});
