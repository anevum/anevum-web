import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {PREFIX,SCHEMA,LIMITS,TYPES,encode,decode,visible,starter,block,remove,validate}
 from '../workbench-alpha/document.mjs';

const composer=readFileSync(new URL('../web/src/pages/StudioSceneComposerV112.tsx',import.meta.url),'utf8');
const editor=readFileSync(new URL('../web/src/pages/StudioFileWorkspaceV111.tsx',import.meta.url),'utf8');
test('V112 reuses existing Workbench ANEVUM_BLOCKS_V1 wire format with no schema fork',()=>{
 const doc=starter();
 assert.equal(doc.schema,SCHEMA);
 assert.equal(SCHEMA,'anevum.blocks.v1');
 const serialized=encode(doc);
 assert.ok(serialized.startsWith(PREFIX));
 assert.deepEqual(decode(serialized),doc);
 assert.equal(TYPES.includes('choice'),true);
 assert.equal(doc.blocks.filter(x=>x.type==='scene').length,2);
 assert.ok(serialized.length<LIMITS.description);
});
test('V112 branching scene preview follows explicit choice targets, never executes source',()=>{
 const doc=starter();
 const first=doc.blocks.find(b=>b.type==='scene');
 const forward=visible(doc,first.id).find(b=>b.type==='choice'&&b.target);
 assert.ok(forward,'Starter has linked choice');
 const destination=visible(doc,forward.target);
 assert.equal(destination[0].type,'scene');
 assert.equal(destination[0].id,forward.target);
 const removed=remove(doc,destination[0].id);
 assert.equal(removed.blocks.find(b=>b.id===forward.id).target,null,'Removing scene unlinks choices without dangling references');
 assert.ok(decode(encode(removed)));
});
test('V112 limits, untrusted text and malformed scene documents fail closed',()=>{
 const doc=starter();
 const sample=doc.blocks.find(b=>b.type==='paragraph');
 const escaped={...doc,blocks:doc.blocks.map(b=>b.id===sample.id?{...b,text:'<script>alert(1)</script>'}:b)};
 assert.ok(decode(encode(escaped)));
 assert.ok(visible(escaped,null).find(b=>b.id===sample.id).text.includes('<script>'));
 assert.equal(decode(PREFIX+'broken JSON'),null);
 assert.equal(decode('other text'),null);
 assert.throws(()=>validate({...doc,blocks:[...doc.blocks,block('paragraph','A'.repeat(LIMITS.text+1))]}),/Invalid block/);
 assert.throws(()=>validate({...doc,blocks:[...doc.blocks,block('choice','Extra')].map(b=>b.type==='choice'?{...b,target:'ffffffff-ffff-4fff-8fff-ffffffffffff'}:b)}),/missing scene/);
});
test('V112 is opt-in UI backed by canonical V111 source saves and existing Workbench codec',()=>{
 for(const file of [composer,editor])assert.ok(parse(file,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>4);
 assert.match(composer,/VITE_CREATOR_VISUAL_SCENE_V112==='true'/);
 assert.match(composer,/ANEVUM_BLOCKS_V1/);
 assert.match(composer,/encode\(starter\(\)\)/);
 assert.match(composer,/visible\(doc,currentScene\)/);
 assert.match(composer,/onChange\(result\)/);
 assert.match(editor,/studioVisualScenesEnabled/);
 assert.match(editor,/StudioSceneComposerV112/);
 assert.match(editor,/studioFileUpdate\(projectId,nodeId/);
 assert.match(editor,/Save revision/);
 assert.doesNotMatch(composer,/fetch\(|new WebSocket|EventSource|dangerouslySetInnerHTML|eval\(/);
});
