/** QA-only deterministic local geometry tests; run after npm dependencies. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createInstituteCitadels} from '../web/src/parity/InstituteCitadelsV136017.ts';
for(const tier of ['desktop','mobile']){
 test('instanced original floating citadels stay bounded and disposable: '+tier,()=>{
  const c=createInstituteCitadels(tier);
  assert.equal(c.drawCalls,6,'Original architecture stays batched, not hundreds of draw calls');
  assert.equal(c.root.children.length,c.drawCalls);
  assert.ok(c.instanceCount>=45);
  assert.ok(c.triangles>=500&&c.triangles<7500,
   'Bounded detailed architecture rather than empty decorative scaffolding');
  let actualTriangles=0,actualInstances=0;
  c.root.traverse(node=>{
   if(!(node instanceof T.InstancedMesh))return;
   assert.ok(node.geometry.index,'Each mesh has indexed triangles');
   const tri=node.geometry.index.count/3*node.count;
   assert.ok(tri>0&&node.count>0);
   actualTriangles+=tri;actualInstances+=node.count;
   assert.ok(node.boundingSphere?.radius>0,'Instance culling bounds generated');
  });
  assert.equal(c.triangles,actualTriangles);
  assert.equal(c.instanceCount,actualInstances);
  const snapshot=c.root.rotation.y;
  c.update(100,true);assert.notEqual(c.root.rotation.y,snapshot);
  c.update(100,false);assert.equal(c.root.rotation.y,0);
  c.dispose();
  assert.equal(c.root.children.length,0,'Own all geometry/materials and free instances on navigation');
 });
}
