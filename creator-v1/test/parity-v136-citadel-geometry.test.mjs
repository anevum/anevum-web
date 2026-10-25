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
  assert.ok(c.triangles>=500&&c.triangles<13000,
   'More architecture, without growing the fixed total environment budget');
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
  const geology=c.root.getObjectByName('Suspension geology');
  assert.equal(geology.count,tier==='desktop'?12:6,'Main islands plus actual hanging rock shards');
  const positions=geology.geometry.attributes.position;
  let lowerRadius=0,upperRadius=0;
  for(let i=0;i<positions.count;i++){
   const radius=Math.hypot(positions.getX(i),positions.getZ(i));
   if(positions.getY(i)<-.8)lowerRadius=Math.max(lowerRadius,radius);
   if(positions.getY(i)>.5)upperRadius=Math.max(upperRadius,radius);
  }
  assert.ok(upperRadius>lowerRadius*3,'Geology tapers downward, not toward the deck');
  const towers=c.root.getObjectByName('Cathedral finial towers');
  const crowns=c.root.getObjectByName('Auric crown spires');
  assert.ok(towers.geometry.parameters.points.length>=18,
   'Machined shaft, cornice and upper crown have genuine modeled facets');
  assert.ok(crowns.geometry.parameters.points.length>=9,
   'Auric spire is a modeled stepped object rather than a painted triangle');
  const windows=c.root.getObjectByName('Photonic window inlays');
  assert.ok(windows.instanceColor,'Real instanced light fixtures carry authored colors');
  const released=new Set();
  c.root.traverse(mesh=>{if(mesh instanceof T.InstancedMesh){
   mesh.geometry.addEventListener('dispose',()=>released.add(mesh.geometry));
   mesh.material.addEventListener('dispose',()=>released.add(mesh.material));
  }});
  const snapshot=c.root.rotation.y;
  c.update(100,true);assert.notEqual(c.root.rotation.y,snapshot);
  c.update(100,false);assert.equal(c.root.rotation.y,0);
  c.dispose();
  assert.equal(c.root.children.length,0,'Own all geometry/materials and free instances on navigation');
  assert.equal(released.size,10,'Six geometry and four shared material resources are released');
 });
}

test('two responsive 3D planetary tiers include actual instanced geometry and own their resources',()=>{
 const planetCounts=[];
 for(const tier of ['desktop','mobile']){
  const scene=createInstituteHorizon(tier,createInstituteCitadels);
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

test('real composed QA scene keeps floating outposts in both actual camera frusta',async()=>{
 const {frameFor,sceneProfile}=await import('../web/src/parity/SceneDirectorV136.ts');
 const frame=frameFor(sceneProfile('hero'),.2);
 for(const [tier,width,height] of [['desktop',1536,956],['desktop',1440,892],['mobile',390,782],['mobile',320,782]]){
  // Create the ENTIRE actual scene graph, including the translated planet.
  // The previous test passed the isolated citadel root while runtime
  // accidentally inherited the planet offset. This makes that impossible.
  const environment=createInstituteHorizon(tier,createInstituteCitadels);
  environment.root.updateMatrixWorld(true);
  const body=environment.root.getObjectByName('Original gas giant / no texture or telemetry');
  assert.ok(body instanceof T.Mesh);
  const planetCenter=body.getWorldPosition(new T.Vector3());
  assert.ok(planetCenter.y>10&&planetCenter.z<-30,
   'Planet remains physically distant behind original architecture');
  const camera=new T.PerspectiveCamera(width<650?62:48,width/height,.1,95);
  camera.position.set((frame.camera[0]-1.5)*1.8,2.8+(frame.camera[1]-1.5)*1.7,
   13+(frame.camera[2]-4.5)*2);
  camera.lookAt(width<650?2.5:0,2,-5);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const deck=environment.root.getObjectByName('Floating deck strata');
  assert.ok(deck instanceof T.InstancedMesh,
   'Frustum contract reads the actual nested instanced geometry');
  let inView=0,right=0;
  const normalized=[];
  for(let i=0;i<deck.count;i++){
   const local=new T.Matrix4();
   deck.getMatrixAt(i,local);
   const world=new T.Matrix4().multiplyMatrices(deck.matrixWorld,local);
   const position=new T.Vector3().setFromMatrixPosition(world);
   const ndc=position.project(camera);
   const visible=Math.abs(ndc.x)<.92&&Math.abs(ndc.y)<.92&&ndc.z>=-1&&ndc.z<=1;
   if(visible){inView++;if(ndc.x>0)right++;normalized.push([ndc.x,ndc.y,ndc.z]);}
  }
  // Beyond frustum inclusion: the actual inspected screenshots showed the
  // desktop stronghold too low and the mobile planet swallowing architecture.
  // Lock useful hero-space anchors and optical scale for both art directions.
  const mainWorld=new T.Matrix4();
  deck.getMatrixAt(0,mainWorld);
  const mainNdc=new T.Vector3().setFromMatrixPosition(
   new T.Matrix4().multiplyMatrices(deck.matrixWorld,mainWorld)).project(camera);
  assert.ok(mainNdc.x>.10&&mainNdc.x<.75,
   'Primary '+tier+' platform must occupy the right-hand art field');
  assert.ok(mainNdc.y>(tier==='mobile'?.19:-.02)&&mainNdc.y<.40,
   'Primary '+tier+' platform must rise above the CTA/navigation foot');
  if(tier==='mobile'){
   // The actual 390px visual review revealed that the secondary platform
   // intersected the headline despite the PRIMARY island passing tests.
   // Inspect its real world-space matrix, not just the center frustum count.
   const secondaryMatrix=new T.Matrix4();deck.getMatrixAt(1,secondaryMatrix);
   const secondaryNdc=new T.Vector3().setFromMatrixPosition(
    new T.Matrix4().multiplyMatrices(deck.matrixWorld,secondaryMatrix)).project(camera);
   assert.ok(secondaryNdc.x<-.22&&secondaryNdc.x>-.75,
    'Mobile secondary outpost must sit in the opposite visual column: '+JSON.stringify(secondaryNdc.toArray()));
   assert.ok(secondaryNdc.y>.25&&secondaryNdc.y<.60,
    'Mobile secondary outpost must clear the opening headline: '+JSON.stringify(secondaryNdc.toArray()));
  }
  const opticalRadius=body.geometry.parameters.radius/
   (planetCenter.distanceTo(camera.position)*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
  assert.ok(opticalRadius<(tier==='mobile'?.26:.38),
   'Distant gas giant must frame rather than dominate the entire arrival');
  assert.ok(inView>=2,'Composed '+tier+' scene needs two real onscreen platforms: '+JSON.stringify(normalized));
  assert.ok(right>=1,'Composed '+tier+' scene needs an art-side island');
  const atmosphere=environment.root.getObjectByName('Atmospheric limb');
  assert.ok(atmosphere instanceof T.Mesh);
  const atmosphericEdge=atmosphere.geometry.parameters.radius;
  const skyline=environment.root.getObjectByName('Auric crown spires');
  assert.ok(skyline instanceof T.InstancedMesh,'Check final tower crowns, not only island centers');
  for(const [name,mesh,clearance] of [['platform',deck,1.5],['tower crown',skyline,.5]]){
   for(let i=0;i<mesh.count;i++){
    const local=new T.Matrix4();mesh.getMatrixAt(i,local);
    const position=new T.Vector3().setFromMatrixPosition(
     new T.Matrix4().multiplyMatrices(mesh.matrixWorld,local));
    const distance=position.distanceTo(planetCenter);
    assert.ok(distance>atmosphericEdge+clearance,
     'Actual '+tier+' '+name+' cannot be occluded by the authored gas giant: '+
      JSON.stringify({index:i,distance,atmosphericEdge,position:position.toArray()}));
   }
  }
  environment.dispose();
  assert.equal(environment.root.children.length,0,'Composed environment disposes all owned meshes');
 }
});
