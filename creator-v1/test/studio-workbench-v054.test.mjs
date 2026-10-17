import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 BLOCK_PREFIX,BLOCK_SCHEMA,BLOCK_TYPES,MAX_BLOCKS,MAX_DESCRIPTION,
 newStudioBlock,encodeStudioBlockDocument,decodeStudioBlockDocument,
 validateStudioBlockDocument,createStudioBlockDocumentFromNotes,
 createStudioStarterDocument,getVisibleWorkbenchBlocks,moveStudioBlock,removeStudioBlock,
 isStudioBlockDescription
} from '../web/src/lib/studio-blocks.ts';
import {starterToDraft} from '../web/src/lib/studio-launchpad.ts';
const uid='11e1f5b8-7649-443f-9c62-c123857689ab';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const useDoc=(id)=>({schema:BLOCK_SCHEMA,blocks:[
 newStudioBlock('heading','a9b5aef1-fb0a-4dfa-86ab-010203040506','First chapter'),
 newStudioBlock('paragraph','b9b5aef1-fb0a-4dfa-86ab-010203040506','An original beginning.')
]});
test('V054 block document stores an identical, versioned, reversible string inside private description',()=>{
 const doc=useDoc();
 const encoded=encodeStudioBlockDocument(doc);
 assert.ok(encoded.startsWith(BLOCK_PREFIX));
 assert.ok(encoded.length<=MAX_DESCRIPTION);
 assert.deepEqual(decodeStudioBlockDocument(encoded),doc);
 assert.deepEqual(validateStudioBlockDocument(doc),doc);
 assert.equal(isStudioBlockDescription(encoded),true);
 assert.equal(isStudioBlockDescription('A plain preexisting V053 note'),false);
 assert.equal(decodeStudioBlockDocument('A plain preexisting V053 note'),null);
});
test('three beginner starter types now create genuine movable safe block documents',()=>{
 for(const kind of ['story','gallery','choices']){
  const draft=starterToDraft(kind,uid);
  assert.ok(draft.description.startsWith(BLOCK_PREFIX));
  const data=decodeStudioBlockDocument(draft.description);
  assert.equal(data?.schema,BLOCK_SCHEMA);
  assert.ok(data?.blocks.length>=4);
  assert.ok(data?.blocks.every(b=>BLOCK_TYPES.includes(b.type)));
  assert.equal(draft.license,'');
  assert.equal(draft.demoUrl,null);
  assert.equal(draft.freeToUse,false);
 }
 assert.equal(decodeStudioBlockDocument(starterToDraft('audio',uid).description),null);
 assert.equal(decodeStudioBlockDocument(starterToDraft('experience',uid).description),null);
});
test('branching starter reader choices only navigate among declared scene IDs',()=>{
 const doc=createStudioStarterDocument('choices');
 const scenes=doc.blocks.filter(b=>b.type==='scene'),choice=doc.blocks.find(b=>b.type==='choice');
 assert.equal(scenes.length,2);
 assert.equal(choice?.target,scenes[1].id);
 const start=getVisibleWorkbenchBlocks(doc,null);
 assert.equal(start[0].id,scenes[0].id);
 assert.ok(start.some(b=>b.type==='choice'));
 assert.ok(!start.some(b=>b.id===scenes[1].id));
 const end=getVisibleWorkbenchBlocks(doc,choice.target);
 assert.equal(end[0].id,scenes[1].id);
 assert.ok(end.some(b=>b.type==='credits'));
 assert.equal(getVisibleWorkbenchBlocks(doc,'invalid')[0].id,scenes[0].id);
});
test('scene deletion invalidates choices safely instead of leaving dangling references',()=>{
 const doc=createStudioStarterDocument('choices');
 const scene=doc.blocks.findLast(b=>b.type==='scene');
 const before=doc.blocks.find(b=>b.type==='choice');
 assert.ok(before.target);
 const edited=removeStudioBlock(doc,scene.id);
 assert.equal(edited.blocks.find(b=>b.type==='choice').target,null);
 assert.equal(edited.blocks.some(b=>b.id===scene.id),false);
 const restored=decodeStudioBlockDocument(encodeStudioBlockDocument(edited));
 assert.equal(restored.blocks.find(b=>b.type==='choice').target,null);
});
test('workbench ordering is stable, keyboard accessible and bounds checked',()=>{
 const doc=useDoc();
 const start=doc.blocks.map(x=>x.id);
 assert.deepEqual(moveStudioBlock(doc,start[0],-1),doc);
 const moved=moveStudioBlock(doc,start[1],-1);
 assert.deepEqual(moved.blocks.map(x=>x.id),start.toReversed());
 assert.deepEqual(doc.blocks.map(x=>x.id),start);
 assert.deepEqual(moveStudioBlock(doc,'absent',1),doc);
});
test('existing V053 text can be converted without altering notes or inventing credits',()=>{
 const original='First scene:\nA strange signal appears.\nCredits later.';
 const doc=createStudioBlockDocumentFromNotes(original);
 assert.equal(doc.blocks.length,1);
 assert.equal(doc.blocks[0].text,original);
 assert.equal(doc.blocks[0].type,'paragraph');
 const parsed=decodeStudioBlockDocument(encodeStudioBlockDocument(doc));
 assert.equal(parsed.blocks[0].text,original);
 assert.ok(!JSON.stringify(parsed).includes('rightsCleared'));
});
test('empty V053 notes convert into editable placeholders instead of an empty screen',()=>{
 const doc=createStudioBlockDocumentFromNotes('');
 assert.equal(doc.blocks.length,2);
 assert.equal(doc.blocks[0].type,'heading');
 assert.equal(doc.blocks[1].type,'paragraph');
});
test('untrusted HTML/JS-like strings are retained as literal text, not executable markup',()=>{
 const unsafe='<script>document.cookie</script><img src=x onerror=alert(1)>';
 const doc=createStudioBlockDocumentFromNotes(unsafe);
 assert.equal(decodeStudioBlockDocument(encodeStudioBlockDocument(doc)).blocks[0].text,unsafe);
 const jsx=file('web/src/pages/StudioWorkbench.tsx');
 assert.doesNotMatch(jsx,/dangerouslySetInnerHTML|innerHTML\s*=|document\.write|new Function|eval\(/);
 assert.match(jsx,/<p>{block\.text/);
 assert.match(jsx,/<h3>{block\.text/);
 assert.match(jsx,/LOCAL PREVIEW \/ NOT PUBLISHED/);
});
test('every block rejects unknown fields, prototype data, IDs, types, controls and non-text values',()=>{
 const d=useDoc();
 const corrupt=[
  {...d,foreign:true},
  {schema:'wrong',blocks:d.blocks},
  {schema:BLOCK_SCHEMA,blocks:null},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],text:42}]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],type:'iframe'}]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],id:'javascript:alert(1)'}]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],text:'Oops\u0000bad'}]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],evil:'injected'}]},
  {schema:BLOCK_SCHEMA,blocks:[d.blocks[0],d.blocks[0]]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],target:d.blocks[1].id}]},
  {schema:BLOCK_SCHEMA,blocks:[{...d.blocks[0],text:'x'.repeat(2501)}]},
  {schema:BLOCK_SCHEMA,blocks:[...Array.from({length:MAX_BLOCKS+1},(_,i)=>
   newStudioBlock('paragraph',crypto.randomUUID(),'item '+i))]},
 ];
 for(const bad of corrupt)assert.throws(()=>validateStudioBlockDocument(bad));
});
test('choices cannot target nonexistent scenes or paragraphs',()=>{
 const d=useDoc(),choice=newStudioBlock('choice');
 choice.target=d.blocks[1].id;
 assert.throws(()=>encodeStudioBlockDocument({...d,blocks:[...d.blocks,choice]}),/scene/);
 choice.target=crypto.randomUUID();
 assert.throws(()=>encodeStudioBlockDocument({...d,blocks:[...d.blocks,choice]}),/scene/);
});
test('invalid or tampered versioned content remains inaccessible to the block editor, not silently overwritten',()=>{
 for(const raw of [BLOCK_PREFIX+'{}',BLOCK_PREFIX+'not json',
  BLOCK_PREFIX+JSON.stringify({schema:BLOCK_SCHEMA,blocks:[{type:'script'}]}),
  BLOCK_PREFIX+JSON.stringify({schema:BLOCK_SCHEMA,blocks:[]})+' ']){
  assert.equal(decodeStudioBlockDocument(raw),null);
  assert.equal(isStudioBlockDescription(raw),true);
 }
});
test('description byte cap and notes conversion limit prevent overflowing canonical project records',()=>{
 const tooLong='A'.repeat(2600);
 assert.throws(()=>createStudioBlockDocumentFromNotes(tooLong),/2,500/);
 const doc=useDoc();
 doc.blocks.push(newStudioBlock('paragraph',crypto.randomUUID(),'x'.repeat(2500)));
 doc.blocks.push(newStudioBlock('paragraph',crypto.randomUUID(),'y'.repeat(2500)));
 doc.blocks.push(newStudioBlock('paragraph',crypto.randomUUID(),'z'.repeat(2500)));
 assert.throws(()=>encodeStudioBlockDocument(doc),/too large/);
});
test('existing project editing preserves canonical optimistic revision and staff review',()=>{
 const page=file('web/src/pages/CanonicalStudioPage.tsx');
 assert.match(page,/<StudioWorkbench value=\{draft\.description\}/);
 assert.match(page,/onChange=\{value=>assign\('description',value\)\}/);
 assert.match(page,/studioUpdate\(project\.id,project\.revision,draft\)/);
 assert.match(page,/studioReviewReceipts/);
 assert.match(page,/studioSubmit\(project\.id,project\.revision\)/);
 const css=file('web/src/pages/studio-workbench.css');
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/focus-visible/);
 const config=JSON.parse(file('wrangler.a-progression-v031.jsonc'));
 assert.equal(config.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(config.r2_buckets,undefined);
});
