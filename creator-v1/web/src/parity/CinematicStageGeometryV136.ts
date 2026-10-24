/** PARITY V136.016 — QA-only, same-origin authored geometry.
 * The checked-in public site never gets approval from this manifest.
 * No authentication, creator data, payment state or script execution.
 */
export type StageTier='desktop'|'mobile';
export type StageSample={frame:number;position:readonly [number,number,number];
 forward:readonly [number,number,number];up:readonly [number,number,number];
 verticalFovRadians:number};
export type StageAsset={path:string;bytes:number;sha256:string;
 triangles:number;drawPrimitiveCount:number;sourceObjectCount:number;
 sourceMeshCount:number;withinBudget:true;compressed:true};
export type StageSceneCandidate={
 schema:'anevum.cinematic.scene-candidate.v1';status:'UNREVIEWED_QA_ONLY';
 stageOnly:true;approvedForProduction:false;visualQAPassed:false;
 oldLiveAtriumEquivalent:false;
 sourceWorldRevision:string;cameraId:string;geometryRevision:string;
 sourceReviewGeometrySha256:string;
 landmarks:{id:string;blender:readonly [number,number,number];three:readonly [number,number,number]}[];
 cameraSamples:StageSample[];
 variants:{desktop:StageAsset;mobile:StageAsset};
};
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const vec=(v:unknown):v is [number,number,number]=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const integer=(n:unknown,max:number):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0&&n<=max;
const unit=(v:number)=>Math.abs(Math.hypot(...[v])||0);
function validSample(input:unknown,i:number):input is StageSample{
 if(!record(input)||input.frame!==i+1||!vec(input.position)||!vec(input.forward)||!vec(input.up)||
 typeof input.verticalFovRadians!=='number'||!Number.isFinite(input.verticalFovRadians)||
 input.verticalFovRadians<=.1||input.verticalFovRadians>=2.4)return false;
 const f=input.forward,u=input.up;
 const lf=Math.hypot(f[0],f[1],f[2]),lu=Math.hypot(u[0],u[1],u[2]);
 return Math.abs(lf-1)<.003&&Math.abs(lu-1)<.003&&
 Math.abs(f[0]*u[0]+f[1]*u[1]+f[2]*u[2])<.003;
}
export function validateStageSceneCandidate(value:unknown):StageSceneCandidate|null{
 if(!record(value)||value.schema!=='anevum.cinematic.scene-candidate.v1'||
 value.status!=='UNREVIEWED_QA_ONLY'||value.stageOnly!==true||
 value.approvedForProduction!==false||value.oldLiveAtriumEquivalent!==false||
 value.visualQAPassed!==false||!hash(value.sourceReviewGeometrySha256)||
 value.sourceWorldRevision!=='continuance-atrium-source-v136015-001'||
 value.cameraId!=='atrium-cinema-014-source-v1'||
 value.geometryRevision!=='continuance-stage-v136016-001')return null;
 if(!Array.isArray(value.cameraSamples)||value.cameraSamples.length<4||
 value.cameraSamples.length>180||!value.cameraSamples.every((s,i)=>validSample(s,i)))return null;
 if(!Array.isArray(value.landmarks)||value.landmarks.length<4||value.landmarks.length>24)return null;
 const ids=new Set<string>();
 for(const item of value.landmarks){
  if(!record(item)||typeof item.id!=='string'||!/^[a-z][a-z0-9-]{1,60}$/.test(item.id)||
   ids.has(item.id)||!vec(item.blender)||!vec(item.three))return null;
  ids.add(item.id);
  const expected=[item.blender[0],item.blender[2],-item.blender[1]];
  if(item.three.some((n,i)=>Math.abs(n-expected[i])>1e-5))return null;
 }
 if(!record(value.variants))return null;
 for(const [tier,limit,triangleLimit,draws] of [
  ['mobile',900_000,100_000,22],['desktop',1_700_000,175_000,36]
 ] as const){
  const asset=value.variants[tier];
  if(!record(asset)||asset.compressed!==true||asset.withinBudget!==true||
   asset.path!=='assets/cinematic-v136/stage/atrium-'+tier+'.glb'||
   !integer(asset.bytes,limit)||!hash(asset.sha256)||
   !integer(asset.triangles,triangleLimit)||!integer(asset.drawPrimitiveCount,draws)||
   !integer(asset.sourceObjectCount,800)||!integer(asset.sourceMeshCount,draws))return null;
 }
 return value as unknown as StageSceneCandidate;
}
/** Preview-only loader. Requires a dedicated, opt-in QA build and local generated
 * artifacts installed in the QA build directory. Production always skips it.
 */
export async function fetchStageScene(tier:StageTier,signal:AbortSignal):Promise<{
 manifest:StageSceneCandidate;buffer:ArrayBuffer
}|null>{
 if(typeof crypto==='undefined'||!crypto.subtle)return null;
 const base=import.meta.env.BASE_URL;
 const response=await fetch(base+'assets/cinematic-v136/stage/manifest.json',
  {signal,cache:'no-store',credentials:'omit'});
 if(!response.ok)return null;
 const data=validateStageSceneCandidate(await response.json());
 if(!data)return null;
 const asset=data.variants[tier];
 const resource=await fetch(base+asset.path,{signal,cache:'force-cache',credentials:'omit'});
 if(!resource.ok)return null;
 const buffer=await resource.arrayBuffer();
 if(buffer.byteLength!==asset.bytes||buffer.byteLength<32)return null;
 const bytes=new Uint8Array(buffer);
 if(String.fromCharCode(...bytes.slice(0,4))!=='glTF')return null;
 const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),
  x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==asset.sha256)return null;
 return {manifest:data,buffer};
}
