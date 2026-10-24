/** PARITY V136.015 — Pure authored camera-coordinate mathematics.
 * Blender uses Z-up; glTF/Three uses Y-up: [x,y,z] => [x,z,-y].
 * These transforms are independent of React, navigation, private data and GPU state.
 */
export type CinemaVec3=readonly [number,number,number];
export type CinemaPose={
  readonly position:CinemaVec3;
  readonly forward:CinemaVec3;
  readonly up:CinemaVec3;
  readonly verticalFovDegrees:number;
};
export type AuthoredCameraSample={
  readonly frame:number;
  readonly position:CinemaVec3;
  readonly forward:CinemaVec3;
  readonly up:CinemaVec3;
  readonly verticalFovRadians:number;
};
export type CameraLandmark={readonly id:string;readonly blender:CinemaVec3;readonly three:CinemaVec3};
export type LandmarkRegistration={
  readonly sourceOrigin:CinemaVec3;
  readonly targetOrigin:CinemaVec3;
  readonly sourceBasis:readonly [CinemaVec3,CinemaVec3,CinemaVec3];
  readonly targetBasis:readonly [CinemaVec3,CinemaVec3,CinemaVec3];
  readonly scale:number;
  readonly maximumError:number;
  readonly rmsError:number;
  readonly landmarkCount:number;
  readonly geometryAligned:boolean;
};

const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const validVec=(v:unknown):v is CinemaVec3=>Array.isArray(v)&&v.length===3&&v.every(finite);
const add=(a:CinemaVec3,b:CinemaVec3):CinemaVec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:CinemaVec3,b:CinemaVec3):CinemaVec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:CinemaVec3,scalar:number):CinemaVec3=>[a[0]*scalar,a[1]*scalar,a[2]*scalar];
const dot=(a:CinemaVec3,b:CinemaVec3):number=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:CinemaVec3,b:CinemaVec3):CinemaVec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=(v:CinemaVec3)=>Math.hypot(v[0],v[1],v[2]);
const normalize=(v:CinemaVec3):CinemaVec3|null=>{const d=length(v);return finite(d)&&d>1e-8?mul(v,1/d):null};
const distance=(a:CinemaVec3,b:CinemaVec3)=>length(sub(a,b));
const composed=(basis:readonly [CinemaVec3,CinemaVec3,CinemaVec3],components:CinemaVec3)=>
 add(add(mul(basis[0],components[0]),mul(basis[1],components[1])),mul(basis[2],components[2]));

export function blenderToThreePosition(value:CinemaVec3):CinemaVec3{
 return [value[0],value[2],-value[1]];
}
export function normalizedCameraSample(value:unknown):AuthoredCameraSample|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(!Number.isInteger(v.frame)||(v.frame as number)<1||(v.frame as number)>180||
 !validVec(v.position)||!validVec(v.forward)||!validVec(v.up)||
 !finite(v.verticalFovRadians)||v.verticalFovRadians<=.1||v.verticalFovRadians>=2.4)return null;
 const forward=normalize(v.forward),up=normalize(v.up);
 if(!forward||!up||Math.abs(dot(forward,up))>.002)return null;
 if(Math.abs(length(v.forward)-1)>.002||Math.abs(length(v.up)-1)>.002)return null;
 return {frame:v.frame as number,position:v.position,forward:v.forward,up:v.up,
  verticalFovRadians:v.verticalFovRadians};
}
/** Coordinate conversion, NOT shared-geometry registration. */
export function convertBlenderCamera(value:AuthoredCameraSample):CinemaPose{
 const forward=normalize(blenderToThreePosition(value.forward))!;
 const up=normalize(blenderToThreePosition(value.up))!;
 return {position:blenderToThreePosition(value.position),forward,up,
  verticalFovDegrees:value.verticalFovRadians*180/Math.PI};
}
function basis(a:CinemaVec3,b:CinemaVec3,c:CinemaVec3):readonly [CinemaVec3,CinemaVec3,CinemaVec3]|null{
 const x=normalize(sub(b,a));if(!x)return null;
 const z=normalize(cross(x,sub(c,a)));if(!z)return null;
 const y=normalize(cross(z,x));if(!y)return null;
 return [x,y,z];
}
export function registrationFromLandmarks(items:readonly CameraLandmark[],tolerance=.03):LandmarkRegistration|null{
 if(items.length<3||items.length>24||!finite(tolerance)||tolerance<=0||tolerance>.25)return null;
 const ids=new Set<string>();
 for(const item of items){
  if(!/^[a-z][a-z0-9-]{1,60}$/.test(item.id)||ids.has(item.id)||
   !validVec(item.blender)||!validVec(item.three))return null;
  ids.add(item.id);
 }
 // A geometry-matched export uses the *same source landmarks* in both spaces.
 // Scale+rotation+translation are solved from three non-collinear landmarks,
 // and every additional point is checked for registration residual.
 const source=items.map(p=>blenderToThreePosition(p.blender));
 const target=items.map(p=>p.three);
 const baseFrom=basis(source[0],source[1],source[2]),baseTo=basis(target[0],target[1],target[2]);
 if(!baseFrom||!baseTo)return null;
 const ds=distance(source[0],source[1]),dt=distance(target[0],target[1]);
 if(ds<1e-6||dt<1e-6)return null;
 const scale=dt/ds;
 if(!finite(scale)||scale<.02||scale>50)return null;
 const registration={
  sourceOrigin:source[0],targetOrigin:target[0],sourceBasis:baseFrom,targetBasis:baseTo,scale
 };
 const errors=items.map((_,i)=>distance(applyRegistration(source[i],registration),target[i]));
 const maximumError=Math.max(...errors),rmsError=Math.sqrt(errors.reduce((sum,v)=>sum+v*v,0)/errors.length);
 return {...registration,maximumError,rmsError,landmarkCount:items.length,
  geometryAligned:maximumError<=tolerance&&rmsError<=tolerance*.65};
}
type RegistrationTransform=Pick<LandmarkRegistration,
 'sourceOrigin'|'targetOrigin'|'sourceBasis'|'targetBasis'|'scale'>;
export function applyRegistration(value:CinemaVec3,registration:RegistrationTransform):CinemaVec3{
 const relative=sub(value,registration.sourceOrigin);
 const components=registration.sourceBasis.map(axis=>dot(relative,axis)) as unknown as CinemaVec3;
 return add(registration.targetOrigin,mul(composed(registration.targetBasis,components),registration.scale));
}
export function registeredCameraPose(value:AuthoredCameraSample,registration:LandmarkRegistration):CinemaPose|null{
 if(!registration.geometryAligned)return null;
 const converted=convertBlenderCamera(value);
 // Use two extra point transforms for orientation; translation cancels.
 const mappedPosition=applyRegistration(converted.position,registration);
 const mappedForward=normalize(sub(applyRegistration(add(converted.position,converted.forward),registration),mappedPosition));
 const mappedUp=normalize(sub(applyRegistration(add(converted.position,converted.up),registration),mappedPosition));
 if(!mappedForward||!mappedUp||Math.abs(dot(mappedForward,mappedUp))>.002)return null;
 return {...converted,position:mappedPosition,forward:mappedForward,up:mappedUp};
}
/** A world-aligned pose does not imply pixel-perfect visual parity. An identical
 * authored geometry revision, camera registration and screenshot gate are all required.
 */
export function cameraHandoffEligible(input:{
 readonly geometryAligned:boolean;readonly approvedSequence:boolean;
 readonly sharedWorldRevision:boolean;readonly visualQA:boolean;
 readonly gamepadSafe:boolean;
}):boolean{
 return Object.values(input).every(Boolean);
}
