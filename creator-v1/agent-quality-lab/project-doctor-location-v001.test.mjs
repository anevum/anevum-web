import test from 'node:test';
import assert from 'node:assert/strict';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {locateProjectDoctorFinding} from './project-doctor-location-v001.mjs';

test('scene targets resolve to stable canonical block IDs rather than list indices',()=>{
 const doc=blocks.starter();
 const expected=doc.blocks[2].id;
 const source=blocks.encode(doc);
 assert.deepEqual(locateProjectDoctorFinding(source,'blocks/2'),{kind:'scene',blockId:expected});
 const reordered={...doc,blocks:[doc.blocks[0],doc.blocks[2],doc.blocks[1],...doc.blocks.slice(3)]};
 assert.deepEqual(locateProjectDoctorFinding(blocks.encode(reordered),'blocks/1'),{kind:'scene',blockId:expected});
});

test('UI page and component findings select only the matching current IDs',()=>{
 const doc=ui.starter();
 const pageId=doc.pages[0].id;
 const componentId=doc.pages[0].components[1].id;
 const source=ui.encode(doc);
 assert.deepEqual(locateProjectDoctorFinding(source,'pages/0'),{
  kind:'interface',pageId,componentId:null
 });
 assert.deepEqual(locateProjectDoctorFinding(source,'pages/0/components/1'),{
  kind:'interface',pageId,componentId
 });
});

test('invalid path, arbitrary file, malformed source and out-of-range indices fail closed',()=>{
 const story=blocks.encode(blocks.starter());
 const interfaceDoc=ui.encode(ui.starter());
 for(const path of ['blocks/-1','blocks/999','blocks/01','blocks/1/target',
  'blocks/1?evil','blocks/99999999999999999','blocks/1/components/0','blocks',
  'blocks/0/../../etc/passwd','document',null,'','A'.repeat(70)]) {
  assert.equal(locateProjectDoctorFinding(story,path),null,String(path));
 }
 for(const path of ['pages/-1','pages/999','pages/00','pages/0/components/999',
  'pages/0/components/00','pages/0/components/0/path','pages/1?x=1',
  'pages/0/components/0/../../foo','blocks/0']) {
  assert.equal(locateProjectDoctorFinding(interfaceDoc,path),null,path);
 }
 assert.equal(locateProjectDoctorFinding('arbitrary Javascript','blocks/0'),null);
 assert.equal(locateProjectDoctorFinding(blocks.PREFIX+'{bad','blocks/0'),null);
 assert.equal(locateProjectDoctorFinding(ui.PREFIX+'{bad','pages/0'),null);
 assert.equal(locateProjectDoctorFinding(123,'blocks/0'),null);
});

test('resolution does not mutate the source or touch external URLs or code',()=>{
 const doc=ui.starter();
 const suspicious='<script>fetch("https://example.invalid")</script>';
 doc.pages[0].components[0].text=suspicious;
 const source=ui.encode(doc);
 const original=source;
 const target=locateProjectDoctorFinding(source,'pages/0/components/0');
 assert.equal(target.componentId,doc.pages[0].components[0].id);
 assert.equal(source,original);
 assert.equal(globalThis.COMPROMISED,undefined);
 assert.ok(!JSON.stringify(target).includes(suspicious));
});
