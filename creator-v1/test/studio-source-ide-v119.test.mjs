import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {
 editorLanguage,highlightSource,sourceCursor,editorIndent,editorEnter,
 findSource,replaceSourceAll,prettyJsonSource,SOURCE_LANGUAGES
} from '../source-ide/language-v119.mjs';
const read=path=>readFileSync(path,'utf8');
const component=read('creator-v1/web/src/pages/StudioCodeEditorV119.tsx');
const icons=read('creator-v1/web/src/pages/StudioFileIconV119.tsx');
const nav=read('creator-v1/web/src/pages/StudioNavigationV116.tsx');
const sample=read('creator-v1/web/src/pages/StudioOtherModesV116.tsx');
const privateFiles=read('creator-v1/web/src/pages/StudioFileWorkspaceV111.tsx');
const css=read('creator-v1/web/src/pages/studio-code-editor-v119.css');

test('V119 detects source languages without interpreting arbitrary file contents',()=>{
 assert.deepEqual(SOURCE_LANGUAGES,['typescript','javascript','css','json','markdown','html','world','text']);
 for(const [name,lang] of [
  ['logic.ts','typescript'],['view.tsx','typescript'],['logic.js','javascript'],
  ['scene.mjs','javascript'],['reset.css','css'],['theme.scss','css'],
  ['model.json','json'],['settings.ui.anevum','json'],['doc.md','markdown'],
  ['screen.html','html'],['logo.svg','html'],['Sky.world.anevum','world'],
  ['Main.scene.anevum','world'],['README','text']
 ])assert.equal(editorLanguage(name),lang,name);
});
test('V119 lexical colors support TS and CSS comments, strings, keywords and JSON properties',()=>{
 const ts=highlightSource('const answer: number = 42;\n// harmless\nexport function hello() { return "world"; }','index.ts');
 const classes=ts.lines.flat().map(t=>t.kind);
 assert.ok(classes.includes('keyword'));
 assert.ok(classes.includes('type'));
 assert.ok(classes.includes('number'));
 assert.ok(classes.includes('comment'));
 assert.ok(classes.includes('string'));
 assert.ok(classes.includes('function'));
 const css=highlightSource('.hero { color: #aabbee; display: grid; }\n/* comment\nnext line */','site.css');
 assert.ok(css.lines.flat().some(t=>t.kind==='number'));
 assert.ok(css.lines.flat().some(t=>t.kind==='property'));
 assert.ok(css.lines[1].some(t=>t.kind==='comment'));
 assert.ok(css.lines[2].some(t=>t.kind==='comment'));
 const json=highlightSource('{"name":"ANEVUM","enabled":true,"count":123}','scene.json');
 assert.ok(json.lines[0].some(t=>t.kind==='property'));
 assert.ok(json.lines[0].some(t=>t.kind==='literal'));
 assert.ok(json.lines[0].some(t=>t.kind==='number'));
});
test('V119 syntax output remains inert text, supports HTML, Markdown and bounded long files',()=>{
 const harmful='<img src=x onerror=alert(1)>\n<script>window.location="evil"</script>';
 const html=highlightSource(harmful,'index.html');
 assert.equal(html.lines.flat().map(t=>t.text).join('\n').replace(/\n+/g,''),harmful.replace(/\n/g,''),'Tokens preserve user text verbatim');
 assert.ok(html.lines.flat().some(t=>t.kind==='tag'));
 const md=highlightSource('# Heading\n**bold** [link](https://example.com)\n','readme.md');
 assert.ok(md.lines[0].some(t=>t.kind==='heading'));
 assert.ok(md.lines[1].some(t=>t.kind==='function'));
 const world=highlightSource('ANEVUM_WORLD_V1\n{"nodes":[]}','island.world.anevum');
 assert.ok(world.lines[0].some(t=>t.kind==='keyword'));
 const long=highlightSource('x\n'.repeat(5100),'notes.txt');
 assert.equal(long.lines.length,2500);
 assert.equal(long.truncated,true);
 assert.doesNotMatch(read('creator-v1/source-ide/language-v119.mjs'),/\beval\s*\(|new Function|dangerouslySetInnerHTML|\bfetch\s*\(/);
});
test('V119 indentation, bracket-aware newline, cursor metrics and literal searches',()=>{
 assert.deepEqual(sourceCursor('first\nsecond',8),{line:2,column:3,selection:0});
 assert.deepEqual(sourceCursor('hello',1,4),{line:1,column:2,selection:3});
 const tab=editorIndent('abcde',3,3,2,false);
 assert.deepEqual(tab,{text:'abc  de',start:5,end:5});
 const out=editorIndent('  const x=1',0,11,2,true);
 assert.equal(out.text,'const x=1');
 const newline=editorEnter('const a = {',11,11);
 assert.equal(newline.text,'const a = {\n  ');
 assert.deepEqual(findSource('Alpha alpha','alpha',0,false),{start:0,end:5});
 assert.deepEqual(findSource('Alpha alpha','alpha',6,false),{start:6,end:11});
 assert.deepEqual(findSource('Alpha alpha','alpha',0,true),{start:6,end:11});
 assert.deepEqual(findSource('Alpha alpha','alpha',11,false,true),{start:6,end:11});
 assert.deepEqual(replaceSourceAll('a.b a.b','a.b','z',true),{text:'z z',count:2});
 assert.deepEqual(replaceSourceAll('hello','', 'X'),{text:'hello',count:0});
 assert.equal(prettyJsonSource('{"b":2,"a":true}',2),'{\n  "b": 2,\n  "a": true\n}\n');
 assert.throws(()=>prettyJsonSource('{broken'),SyntaxError);
});
test('V119 editor, icons and both Studio entrypoints parse as typed JSX',()=>{
 for(const src of [component,icons,nav,sample,privateFiles])
  assert.ok(parse(src,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>4);
 assert.match(sample,/StudioCodeEditorV119/);
 assert.match(sample,/StudioFileIconV119/);
 assert.match(privateFiles,/StudioCodeEditorV119/);
 assert.match(privateFiles,/StudioFileIconV119/);
 assert.match(privateFiles,/studioFileUpdate\(projectId,nodeId/);
 assert.match(privateFiles,/saveDisabled=\{!base\|\|!dirty\|\|busy\|\|byteCount>32768\}/);
 assert.match(privateFiles,/maxLength=\{32768\}/);
 assert.match(component,/className=\{'csi-input '\+className\}/);
 assert.match(component,/aria-label=\{'Edit source '\+fileName\}/);
 assert.match(component,/aria-hidden="true"/);
 assert.match(component,/requestAnimationFrame/);
 assert.match(component,/onSave\(\)/);
 assert.match(component,/editorIndent/);
 assert.match(component,/editorEnter/);
 assert.match(component,/replaceSourceAll/);
 assert.match(component,/prettyJsonSource/);
 assert.match(component,/Editor preferences/);
 assert.match(component,/Find in file/);
 assert.match(component,/Line numbers/);
 assert.match(component,/Word wrap/);
 assert.match(component,/Source is never executed here/);
});
test('V119 real syntax overlays stay readable across mobile, reduced motion and forced colors',()=>{
 for(const marker of ['.csi-highlight','.csi-token-keyword','.csi-token-string','.csi-token-comment',
  '.csi-token-property','.csi-gutter','.csi-status','.csi-file-icon.is-typescript',
  '.csi-file-icon.is-css','.csi-file-icon.is-html','.csi-file-icon.is-world','.csi-settings',
  '.csn-code-content','.csf-editor .csi-editor'])
  assert.ok(css.includes(marker),marker);
 assert.match(css,/max-width:390px/);
 assert.match(css,/max-width:680px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/\.csi-editor.is-plain \.csi-input/);
 for(const src of [component,icons])assert.doesNotMatch(src,/dangerouslySetInnerHTML|\beval\s*\(|new Function|\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(/);
});
