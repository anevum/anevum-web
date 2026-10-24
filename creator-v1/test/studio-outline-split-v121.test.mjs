import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {sourceOutline} from '../source-ide/outline-v121.mjs';
import {starter,encode} from '../world-composer/document.mjs';
const read=p=>readFileSync(p,'utf8');
test('V121 bounded TS and JS structural outline lists functions, types, variables with true line coordinates',()=>{
 const src=[
  '// function notARealSymbol()',
  'export interface OrbitalProject {',
  '  name: string;',
  '}',
  'export const start = 1;',
  'export async function startEngine() { return start; }',
  'class ShipEngine {}',
 ].join('\n');
 const result=sourceOutline(src,'project.ts');
 assert.deepEqual(result.symbols.map(x=>x.name),['OrbitalProject','start','startEngine','ShipEngine']);
 assert.deepEqual(result.symbols.map(x=>x.line),[2,5,6,7]);
 assert.equal(result.approximate,true);
 assert.match(result.note,/language server is not attached/);
 assert.equal(sourceOutline('const hello = 42;','x.js').symbols[0].name,'hello');
});
test('V121 Markdown, CSS, HTML, JSON and World outlines derive from local text without running it',()=>{
 const md=sourceOutline('# Title\n## Details\n'+String.fromCharCode(96).repeat(3)+'md\n# Ignored\n'+String.fromCharCode(96).repeat(3)+'\n### Finale','notes.md');
 assert.deepEqual(md.symbols.map(x=>x.name),['Title','Details','Finale']);
 assert.deepEqual(md.symbols.map(x=>x.depth),[0,1,2]);
 const css=sourceOutline('@media (min-width: 640px) {\n.hero {\n color:#123;\n}\n}\n#landing { color:blue; }','main.css');
 assert.ok(css.symbols.some(x=>x.kind==='selector'&&x.name==='.hero'));
 assert.ok(css.symbols.some(x=>x.kind==='rule'&&x.name.startsWith('@media')));
 assert.ok(css.symbols.some(x=>x.kind==='selector'&&x.name==='#landing'));
 const html=sourceOutline('<h1>ANEVUM</h1>\n<h2>Creator Studio</h2>','index.html');
 assert.deepEqual(html.symbols.map(x=>x.name),['ANEVUM','Creator Studio']);
 const json=sourceOutline('{\n "enabled":true,\n "settings":{"theme":"navy"}\n}','prefs.json');
 assert.deepEqual(json.symbols.map(x=>x.name),['enabled','settings']);
 assert.deepEqual(json.symbols.map(x=>x.line),[2,3]);
 const world=sourceOutline(encode(starter()),'Main.world.anevum');
 assert.equal(world.symbols.length,1+starter().nodes.length);
 assert.equal(world.symbols[0].kind,'world');
 assert.ok(world.symbols.slice(1).every(x=>x.kind==='node'&&x.line>=2));
 assert.ok(world.symbols.every(x=>x.column>=1));
 assert.equal(sourceOutline('invalid','Main.world.anevum').symbols.length,0);
});
test('V121 outline is bounded, inert and does not mistake code comments for declarations',()=>{
 const lines=Array.from({length:3200},(_,i)=>'# Heading '+i).join('\n');
 const many=sourceOutline(lines,'long.md');
 assert.equal(many.symbols.length,100);
 assert.equal(many.truncated,true);
 assert.deepEqual(sourceOutline('/*\nconst hidden = 1\n*/\nconst visible=2','x.ts').symbols.map(x=>x.name),['visible']);
 const payload='<img onerror="fetch(1)" />\n<script>eval("unsafe")</script>';
 assert.equal(sourceOutline(payload,'index.html').symbols.length,0);
 assert.equal(sourceOutline('text with no symbols','notes.txt').symbols.length,0);
 assert.doesNotMatch(read('creator-v1/source-ide/outline-v121.mjs'),/\beval\s*\(|new Function|dangerouslySetInnerHTML|\bfetch\s*\(/);
});
test('V121 code editor and private split workspace parse and preserve owner/revision service',()=>{
 const code=read('creator-v1/web/src/pages/StudioCodeEditorV119.tsx');
 const workspace=read('creator-v1/web/src/pages/StudioFileWorkspaceV111.tsx');
 for(const src of [code,workspace])assert.ok(parse(src,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>5);
 assert.match(code,/sourceOutline\(value,fileName\)/);
 assert.match(code,/aria-label="Document outline"/);
 assert.match(code,/aria-label="Filter document symbols"/);
 assert.match(code,/onClick=\{\(\)=>focusLine\(item.line,item.column\)\}/);
 assert.match(code,/sourceOffsetForLine\(value,line,column\)/);
 assert.match(code,/Ctrl\/Cmd\+Shift\+O/);
 assert.match(workspace,/const \[splitId,setSplitId\]=useState<string\|null>\(null\)/);
 assert.match(workspace,/const secondaryId=activeId&&splitId/);
 assert.match(workspace,/className=\{'csf-editor-decks'/);
 assert.match(workspace,/aria-label="Secondary editor file"/);
 assert.match(workspace,/SourceEditorV111 projectId=\{projectId\} nodeId=\{id\}/);
 assert.match(workspace,/studioFileUpdate\(projectId,nodeId/);
 assert.match(workspace,/onDirty=\{dirty=>setDirty\(id,dirty\)\}/);
 assert.match(workspace,/hidden=\{id!==activeId&&id!==secondaryId\}/);
 assert.match(workspace,/setSplitId\(null\)/);
 assert.match(read('creator-v1/web/src/pages/studio-layout-v121.css'),/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(read('creator-v1/web/src/pages/studio-layout-v121.css'),/max-width:1100px/);
 assert.match(read('creator-v1/web/src/pages/studio-layout-v121.css'),/\.csf-root\.is-split \.csf-tree\{display:none!important\}/);
 assert.match(read('creator-v1/web/src/pages/studio-layout-v121.css'),/\.csf-root\.is-split \.csf-work-area\{container-type:inline-size\}/);
 assert.match(workspace,/csf-split-focus-note/);
 assert.match(read('creator-v1/web/src/pages/studio-code-editor-v119.css'),/\.csi-outline-list/);
 assert.doesNotMatch(code,/dangerouslySetInnerHTML|new Function|\beval\s*\(/);
});
