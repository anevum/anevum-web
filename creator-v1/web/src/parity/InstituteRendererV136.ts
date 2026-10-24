/** One Three.js renderer, one canvas/context, two composited render passes.
 * Only route profiles and sanitized aggregate counts cross this boundary.
 * No user identity, draft/file content, artwork URL, or member API is accepted. */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {cspMeshoptDecoder} from './CspMeshoptDecoderV136';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {fragmentSource,vertexSource} from './living-world-shaders';
import {frameFor,sceneProfile,advanceSceneFrame,type SceneFrame,type SceneSector,type SceneGeometry} from './SceneDirectorV136';
import {instituteAlloySurface,nativeAlloySurface} from './InstituteMaterialsV136';
import {instituteAsset,instituteBudget} from './InstituteAssetManifestV136';
import {fetchStageScene} from './CinematicStageGeometryV136';
import {convertBlenderCamera,type CinemaPose} from './CinematicCameraRegistrationV136';
export type InstituteInput={sector:SceneSector;density:number;verified:boolean;animated:boolean;saveData:boolean};
export type InstituteMetrics={tier:string;family:string;models:number;drawCalls:number;triangles:number;frameMs:number;renderMs:number;gpuMs:number|null;geometries:number;textures:number;scale:number;contextLosses:number};
type Family={root:T.Group;weight:number;lastUsed:number;geometries:Set<T.BufferGeometry>;materials:Set<T.Material>};
const stageEnabled=import.meta.env.VITE_PARITY_V136_SHARED_SCENE_QA==='true';
const families:SceneGeometry[]=['atrium','archive','forge','relay'];
const stripVersion=(s:string)=>s.replace(/^#version 300 es\n/,'');
export function createInstituteRenderer(canvas:HTMLCanvasElement,initial:InstituteInput,onState:(ready:boolean,metrics:InstituteMetrics)=>void){
 let disposed=false,input=initial,frame:SceneFrame=frameFor(sceneProfile(initial.sector),initial.density);
 let stageSamples:readonly CinemaPose[]|null=null;
 let animation=0,last=0,phase=0,drawnAt=0,frameSum=0,samples=0,slowSamples=0,scale=1,losses=0;
 let budget=instituteBudget(canvas.clientWidth,window.devicePixelRatio,initial.saveData);
 const renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.autoClear=false;
 const gl=renderer.getContext() as WebGL2RenderingContext;
 const timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 let gpuQuery:WebGLQuery|null=null,gpuMs:number|null=null,timerPoll=0;
 function pollGpu(){
  if(disposed||!gpuQuery||gl.isContextLost())return;
  if(gl.getQueryParameter(gpuQuery,gl.QUERY_RESULT_AVAILABLE)){
   if(!gl.getParameter(timer.GPU_DISJOINT_EXT))gpuMs=gl.getQueryParameter(gpuQuery,gl.QUERY_RESULT)/1e6;
   gl.deleteQuery(gpuQuery);gpuQuery=null;
  }else timerPoll=requestAnimationFrame(pollGpu);
 }

 const textureRequest=new AbortController();
 let alloySurface:T.Texture=instituteAlloySurface(budget.tier==='mobile',renderer.capabilities.getMaxAnisotropy());
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x071222,.026);
 const camera=new T.PerspectiveCamera(48,1,.1,95);camera.position.set(0,3.1,13);
 const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();
 const environment=pmrem.fromScene(room,.05);scene.environment=environment.texture;scene.environmentIntensity=.65;
 room.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight(0xa1d7ff,0x11101f,1.5));
 const key=new T.DirectionalLight(0xc3eaff,3.1);key.position.set(-3,8,7);scene.add(key);
 const rim=new T.DirectionalLight(0x9865ff,4);rim.position.set(7,4,-10);scene.add(rim);
 const beacon=new T.PointLight(0x55cdff,85,17,2);beacon.position.set(3,4,-3);scene.add(beacon);
 const anchorGeometry=new T.SphereGeometry(.035,8,6),anchorMaterial=new T.MeshBasicMaterial({color:0x9be8ff});
 const anchors=new T.InstancedMesh(anchorGeometry,anchorMaterial,15),anchorTransform=new T.Object3D();
 for(let i=0;i<15;i++){anchorTransform.position.set(6.1+Math.sin(i*.8)*.2,.2+i*.19,-4-i*.8);anchorTransform.updateMatrix();anchors.setMatrixAt(i,anchorTransform.matrix)}
 scene.add(anchors);
 const backdrop=new T.Scene(),backgroundCamera=new T.Camera();
 const uniforms={u_resolution:{value:new T.Vector2(1,1)},u_pointer:{value:new T.Vector2()},u_time:{value:0},u_modeled:{value:1},
  u_density:{value:0},u_verified:{value:0},u_tone:{value:new T.Vector3()},u_pulse:{value:0},
  u_center:{value:new T.Vector3()},u_architecture:{value:0},u_shape:{value:new T.Vector4()},u_signature:{value:0}};
 const backgroundMaterial=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:stripVersion(vertexSource),fragmentShader:stripVersion(fragmentSource),uniforms,depthTest:false,depthWrite:false});
 const backgroundGeometry=new T.BufferGeometry();backgroundGeometry.setAttribute('a_position',new T.Float32BufferAttribute([-1,-1,1,-1,-1,1,1,1],2));backgroundGeometry.setIndex([0,1,2,2,1,3]);
 const atmosphere=new T.Mesh(backgroundGeometry,backgroundMaterial);atmosphere.frustumCulled=false;backdrop.add(atmosphere);
 // Bloom is luminance selective: only photonic emissives cross the threshold.
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(backdrop,backgroundCamera));
 const architecturePass=new RenderPass(scene,camera);architecturePass.clear=false;architecturePass.clearDepth=true;composer.addPass(architecturePass);
 const bloom=budget.bloom?new UnrealBloomPass(new T.Vector2(1,1),.32,.38,1.35):null;if(bloom)composer.addPass(bloom);composer.addPass(new OutputPass());
 const meshopt=cspMeshoptDecoder();
 const loader=new GLTFLoader().setMeshoptDecoder(meshopt.decoder),cache=new Map<SceneGeometry,Family>(),pending=new Map<SceneGeometry,AbortController>();
 let report:InstituteMetrics={tier:budget.tier,family:sceneProfile(input.sector).geometry,models:0,drawCalls:0,triangles:0,frameMs:0,renderMs:0,gpuMs:null,geometries:0,textures:0,scale,contextLosses:0};
 function release(family:Family){scene.remove(family.root);family.root.traverse(node=>{if(node instanceof T.InstancedMesh)node.dispose()});family.geometries.forEach(g=>g.dispose());family.materials.forEach(m=>m.dispose())}
 function evict(){if(cache.size<=budget.maxCachedFamilies)return;const candidates=[...cache].filter(([name,f])=>name!==sceneProfile(input.sector).geometry&&f.weight<.01).sort((a,b)=>a[1].lastUsed-b[1].lastUsed);while(cache.size>budget.maxCachedFamilies&&candidates.length){const [name,f]=candidates.shift()!;release(f);cache.delete(name)}}
 async function load(family:SceneGeometry){
  if(cache.has(family)||pending.has(family)||disposed)return;
  const controller=new AbortController();pending.set(family,controller);
  try{
   // The alternate geometry path is strictly local, immutable-hash-verified and
   // available only in a deliberately flagged CI/staging build. Production still
   // resolves the exact same eight v136-011 source GLBs as before.
   let stage:Awaited<ReturnType<typeof fetchStageScene>>=null;
   if(stageEnabled&&family==='atrium'&&input.sector==='hero'&&!input.saveData){
    canvas.dataset.cinemaStage='loading';
    try{stage=await fetchStageScene(budget.tier,controller.signal)}
    catch{if(controller.signal.aborted)return;canvas.dataset.cinemaStage='fallback'}
   }
   const asset=instituteAsset(family,budget.tier);
   let gltf:Awaited<ReturnType<typeof loader.parseAsync>>|null=null;
   if(stage){
    try{gltf=await loader.parseAsync(stage.buffer,'')}
    catch{stage=null;canvas.dataset.cinemaStage='fallback'}
   }
   if(!stage){
    const response=await fetch(asset.url,{signal:controller.signal,credentials:'omit',cache:'force-cache'});
    if(!response.ok)throw Error('Environment model unavailable');
    const bytes=await response.arrayBuffer();if(bytes.byteLength!==asset.bytes)throw Error('Environment asset length mismatch');
    gltf=await loader.parseAsync(bytes,'');
   }
   if(!gltf)throw Error('Environment scene did not parse');
   if(stage){
    stageSamples=stage.manifest.cameraSamples.map(sample=>convertBlenderCamera(sample));
    canvas.dataset.cinemaStage='ready';
    canvas.dataset.cinemaRevision=stage.manifest.geometryRevision;
   }else if(stageEnabled&&family==='atrium')canvas.dataset.cinemaStage='fallback';
   const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
   const root=new T.Group();root.name=family;
   gltf.scene.updateMatrixWorld(true);
   const batches=new Map<string,{geometry:T.BufferGeometry;material:T.Material;matrices:T.Matrix4[]}>();
   gltf.scene.traverse(node=>{
    if(!(node instanceof T.Mesh)||Array.isArray(node.material))return;
    geometries.add(node.geometry);materials.add(node.material);
    const key=node.geometry.uuid+node.material.uuid;
    let batch=batches.get(key);if(!batch){batch={geometry:node.geometry,material:node.material,matrices:[]};batches.set(key,batch)}
    batch.matrices.push(node.matrixWorld.clone());
   });
   for(const b of batches.values()){
    const mesh=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);
    b.matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.computeBoundingSphere();root.add(mesh);
    const m=b.material as T.MeshStandardMaterial;if(m.metalness>.6){m.normalMap=alloySurface;m.normalScale.set(.35,.2);m.needsUpdate=true}m.userData.originalOpacity=m.opacity;m.userData.originalTransparent=m.transparent;m.userData.originalDepthWrite=m.depthWrite;
   }
   const f={root,weight:0,lastUsed:performance.now(),geometries,materials};
   if(disposed){release(f);return}
   cache.set(family,f);scene.add(root);evict();schedule();
  }catch(error){if(!disposed&&!(error instanceof DOMException&&error.name==='AbortError')){canvas.dataset.assetState='unavailable';schedule()}}
  finally{pending.delete(family)}
 }
 function resize(){
  budget=instituteBudget(canvas.clientWidth,window.devicePixelRatio,input.saveData);
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(budget.pixelRatio,Math.sqrt(budget.maxPixels/(w*h)))*scale;
  renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);composer.setPixelRatio(dpr);composer.setSize(w,h);
  camera.aspect=w/h;camera.fov=w<650?62:48;camera.updateProjectionMatrix();if(bloom)bloom.enabled=budget.bloom&&scale>.7;
  uniforms.u_resolution.value.set(canvas.width,canvas.height);
 }
 const pointer=new T.Vector2();
 const move=(event:PointerEvent)=>{if(input.animated)pointer.set((event.clientX/innerWidth-.5)*2,(.5-event.clientY/innerHeight)*2)};
 window.addEventListener('pointermove',move,{passive:true});
 const resizeObserver=new ResizeObserver(()=>{resize();schedule()});resizeObserver.observe(canvas);
 const lost=()=>{losses++;report.contextLosses=losses;onState(false,report);cancelAnimationFrame(animation)};
 canvas.addEventListener('webglcontextlost',lost);
 function draw(now:number){
  if(disposed||renderer.getContext().isContextLost())return;
  const dt=last?Math.min(100,now-last):budget.frameMs;last=now;
  const moving=input.animated&&document.visibilityState==='visible';if(moving)phase+=dt;
  frame=advanceSceneFrame(frame,frameFor(sceneProfile(input.sector),input.density),dt,moving);
  const family=sceneProfile(input.sector).geometry;void load(family);
  let transitioning=false;
  for(const [name,f] of cache){
   const target=name===family?1:0;f.weight=moving?T.MathUtils.damp(f.weight,target,5,dt/1000):target;
   f.root.visible=f.weight>.005;f.root.position.y=-1.5*(1-f.weight);
   if(target)f.lastUsed=now;if(Math.abs(f.weight-target)>.005)transitioning=true;
   f.materials.forEach(material=>{
    const m=material as T.MeshStandardMaterial;m.opacity=m.userData.originalOpacity*f.weight;
    m.transparent=m.userData.originalTransparent||f.weight<.995;m.depthWrite=m.userData.originalDepthWrite&&f.weight>.95;
   });
  }
  // QA-only genuine shared-source camera. It is NOT a claim of visual parity:
  // no cinematic frame sequence is approved and the live models remain unchanged.
  const samples=stageSamples;
  const qaCamera=Boolean(stageEnabled&&samples&&samples.length>=4&&
   input.sector==='hero'&&family==='atrium'&&input.animated);
  if(qaCamera&&samples){
   const layer=document.querySelector<HTMLElement>('[data-cinematic-v136]');
   const travel=Number(layer?.dataset.cameraProgress??0);
   const normalized=Number.isFinite(travel)?T.MathUtils.clamp(travel,0,1):0;
   const index=normalized*(samples.length-1),left=Math.floor(index),
    right=Math.min(samples.length-1,left+1),t=index-left;
   const a=samples[left],b=samples[right];
   const position=new T.Vector3(...a.position).lerp(new T.Vector3(...b.position),t);
   const forward=new T.Vector3(...a.forward).lerp(new T.Vector3(...b.forward),t).normalize();
   const up=new T.Vector3(...a.up).lerp(new T.Vector3(...b.up),t).normalize();
   camera.position.copy(position);
   camera.up.copy(up);
   camera.lookAt(position.clone().add(forward));
   const newFov=T.MathUtils.lerp(a.verticalFovDegrees,b.verticalFovDegrees,t);
   if(Math.abs(camera.fov-newFov)>.001){camera.fov=newFov;camera.updateProjectionMatrix()}
   canvas.dataset.cinemaCameraProgress=normalized.toFixed(3);
  }else{
   const originalFov=canvas.clientWidth<650?62:48;
   camera.up.set(0,1,0);
   camera.position.set((frame.camera[0]-1.5)*1.8+pointer.x*.16,2.8+(frame.camera[1]-1.5)*1.7+pointer.y*.12,13+(frame.camera[2]-4.5)*2);
   camera.lookAt(canvas.clientWidth<650?2.5:0,2,-5);
   if(Math.abs(camera.fov-originalFov)>.001){camera.fov=originalFov;camera.updateProjectionMatrix()}
  }
  key.color.setRGB(.7+frame.tone[0]*.3,.8+frame.tone[1]*.2,1);rim.color.setRGB(frame.tone[0],frame.tone[1]*.65,1);
  uniforms.u_pointer.value.lerp(pointer,.04);uniforms.u_time.value=phase/1000;uniforms.u_density.value=frame.density;uniforms.u_verified.value=input.verified?1:0;
  uniforms.u_tone.value.fromArray(frame.tone);uniforms.u_center.value.fromArray(frame.camera);uniforms.u_shape.value.fromArray(frame.silhouette);uniforms.u_signature.value=frame.signature;
  beacon.intensity=65+frame.density*35+(moving?Math.sin(phase/1800)*7:0);
  anchors.count=input.verified?Math.max(2,Math.min(15,Math.floor(2+frame.density*12))):3;
  const start=performance.now();renderer.info.autoReset=false;renderer.info.reset();
  const timed=timer&&!gpuQuery;
  if(timed){gpuQuery=gl.createQuery();if(gpuQuery)gl.beginQuery(timer.TIME_ELAPSED_EXT,gpuQuery)}
  composer.render();
  if(timed&&gpuQuery){gl.endQuery(timer.TIME_ELAPSED_EXT);cancelAnimationFrame(timerPoll);timerPoll=requestAnimationFrame(pollGpu)}
  const renderMs=performance.now()-start;
  if(moving&&drawnAt&&now-drawnAt<250){frameSum+=now-drawnAt;samples++;if(samples>120){frameSum/=2;samples=Math.round(samples/2)}}
  if(!moving){frameSum=0;samples=0}drawnAt=moving?now:0;
  // Hysteresis avoids quality oscillation. Lower resolution after sustained missed budgets.
  if(moving&&dt>budget.frameMs*1.9)slowSamples++;else slowSamples=Math.max(0,slowSamples-1);
  if(slowSamples>45&&scale>.55){scale=Math.max(.55,scale-.15);slowSamples=0;resize()}
  report={tier:budget.tier,family,models:cache.size,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frameMs:samples?frameSum/samples:0,renderMs,gpuMs,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,scale,contextLosses:losses};
  canvas.dataset.assetState=cache.has(family)?'ready':pending.has(family)?'loading':'unavailable';
  canvas.dataset.engine='three';canvas.dataset.quality=budget.tier;canvas.dataset.metrics=JSON.stringify(report);
  onState(true,report);evict();
  if(moving||transitioning)schedule();
 }
 function schedule(){if(disposed)return;cancelAnimationFrame(animation);animation=requestAnimationFrame(tick)}
 function tick(now:number){if(disposed)return;if(input.animated&&last&&now-last<budget.frameMs-1){animation=requestAnimationFrame(tick);return}draw(now)}
 const visibility=()=>{last=0;if(document.visibilityState==='visible')schedule();else cancelAnimationFrame(animation)};
 document.addEventListener('visibilitychange',visibility);
 canvas.dataset.textureState='loading';
 void nativeAlloySurface(gl,budget.tier==='mobile',textureRequest.signal,renderer.capabilities.getMaxAnisotropy()).then(result=>{
  if(disposed){result?.texture.dispose();return}
  canvas.dataset.textureState=result?'compressed':'procedural';
  if(result){
   alloySurface.dispose();alloySurface=result.texture;canvas.dataset.textureFormat=result.format;canvas.dataset.textureBytes=String(result.bytes);
   cache.forEach(f=>f.materials.forEach(material=>{const m=material as T.MeshStandardMaterial;if(m.metalness>.6){m.normalMap=alloySurface;m.needsUpdate=true}}));
  }
  schedule();
 }).catch(()=>{if(!disposed){canvas.dataset.textureState='procedural';schedule()}});
 resize();void load(sceneProfile(input.sector).geometry);schedule();
 return {
  update(next:InstituteInput){const resizeNeeded=next.saveData!==input.saveData;input=next;if(resizeNeeded)resize();if(!input.animated)pointer.set(0,0);schedule()},
  dispose(){disposed=true;textureRequest.abort();cancelAnimationFrame(animation);cancelAnimationFrame(timerPoll);if(gpuQuery)gl.deleteQuery(gpuQuery);pending.forEach(p=>p.abort());pending.clear();meshopt.dispose();resizeObserver.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);cache.forEach(release);cache.clear();environment.dispose();anchors.dispose();anchorGeometry.dispose();anchorMaterial.dispose();alloySurface.dispose();backgroundGeometry.dispose();backgroundMaterial.dispose();bloom?.dispose();composer.dispose();renderer.dispose()}
 };
}
