/** QA-only deterministic local geometry tests; run after npm dependencies. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createInstituteCitadels} from '../web/src/parity/InstituteCitadelsV136017.ts';
import {createInstituteHorizon,HORIZON_QA_BUDGET} from '../web/src/parity/InstituteHorizonV136017.ts';
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

test('two responsive 3D planetary tiers include actual instanced geometry and own their resources',()=>{
 const planetCounts=[];
 for(const tier of ['desktop','mobile']){
  const scene=createInstituteHorizon(tier);
  assert.equal(scene.tier,tier);
  assert.ok(scene.triangles>=4000&&scene.triangles<=HORIZON_QA_BUDGET[tier].triangles,
   'Combined sphere, atmosphere, rings and instances fit device budget');
  assert.equal(scene.drawCalls,10,'No additional context and no unbatched towers');
  let exact=0,actualDraws=0;
  scene.root.traverse(child=>{
   if(!(child instanceof T.Mesh))return;
   actualDraws++;
   exact+=(child.geometry.index?.count??child.geometry.attributes.position.count)/3*
    (child instanceof T.InstancedMesh?child.count:1);
  });
  assert.equal(scene.triangles,exact,'Report real InstancedMesh-count-adjusted GPU triangles');
  assert.equal(scene.drawCalls,actualDraws);
  scene.update(.5,100,true);
  scene.update(.5,100,false);
  scene.dispose();
  assert.equal(scene.root.children.length,0,'Dispose every owned candidate mesh');
  planetCounts.push(scene.triangles);
 }
 assert.ok(planetCounts[1]<planetCounts[0]/2,
  'The mobile asset must materially reduce geometry, not just CSS scale');
});
