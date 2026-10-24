/**
 * PARITY V136.007 / Continuance Scene Director.
 *
 * Pure, deterministic presentation grammar for the shared WebGL environment.
 * Scene identity comes from the current public route, never member behavior.
 * Geometry weights morph between architectural families instead of merely
 * recoloring the same orbital illustration.
 */
export type SceneSector =
  | 'hero' | 'portal' | 'games' | 'tools' | 'creative' | 'libraries'
  | 'automation' | 'research' | 'learning' | 'other'
  | 'community' | 'creators' | 'studio';
export type SceneGeometry='atrium'|'archive'|'forge'|'relay';
export type Vec3=readonly [number,number,number];
export type Vec4=readonly [number,number,number,number];
export type SceneProfile={
  readonly sector:SceneSector;
  readonly geometry:SceneGeometry;
  readonly camera:Vec3;
  readonly tone:Vec3;
  readonly silhouette:Vec4;
  readonly signature:number;
};
export type SceneFrame={
  readonly camera:Vec3;
  readonly tone:Vec3;
  readonly silhouette:Vec4;
  readonly signature:number;
  readonly density:number;
};
const FORMS:Readonly<Record<SceneGeometry,Vec4>>={
  atrium:[1,0,0,0],
  archive:[0,1,0,0],
  forge:[0,0,1,0],
  relay:[0,0,0,1]
};
const define=(sector:SceneSector,geometry:SceneGeometry,camera:Vec3,tone:Vec3,signature:number):SceneProfile=>
  ({sector,geometry,camera,tone,silhouette:FORMS[geometry],signature});

/** Every site destination is a recognizable place within one institution.
 * The four families are silhouettes; route signatures create further variation.
 */
export const SCENE_PROFILES:Readonly<Record<SceneSector,SceneProfile>>={
  hero:define('hero','atrium',[1.58,1.70,4.60],[0.27,0.71,1.0],.12),
  portal:define('portal','archive',[1.18,1.72,4.80],[0.36,0.69,1.0],.27),
  games:define('games','forge',[1.65,1.52,4.22],[0.61,0.42,1.0],.41),
  tools:define('tools','relay',[1.92,1.38,4.80],[0.24,0.82,1.0],.52),
  creative:define('creative','forge',[0.84,2.00,4.42],[0.91,0.46,0.97],.64),
  libraries:define('libraries','archive',[1.78,1.32,4.92],[0.36,0.90,0.79],.72),
  automation:define('automation','relay',[1.84,1.55,4.45],[0.55,0.70,1.0],.81),
  research:define('research','atrium',[1.35,1.86,4.26],[0.40,0.68,1.0],.91),
  learning:define('learning','archive',[0.95,1.76,4.96],[0.78,0.63,1.0],.17),
  other:define('other','atrium',[1.42,1.76,4.70],[0.62,0.69,0.96],.36),
  community:define('community','relay',[0.90,1.66,4.72],[0.67,0.52,1.0],.58),
  creators:define('creators','archive',[1.75,1.95,4.55],[0.48,0.82,0.93],.75),
  studio:define('studio','forge',[1.40,1.28,4.30],[0.94,0.66,0.36],.99)
};
export function sceneProfile(sector:SceneSector):SceneProfile {return SCENE_PROFILES[sector]}

export function frameFor(profile:SceneProfile,density:number):SceneFrame{
  return {camera:profile.camera,tone:profile.tone,silhouette:profile.silhouette,
    signature:profile.signature,density:Math.min(1,Math.max(0,Number.isFinite(density)?density:0))};
}

const blend=(a:number,b:number,t:number)=>a+(b-a)*t;
const blend3=(a:Vec3,b:Vec3,t:number):Vec3=>
  [blend(a[0],b[0],t),blend(a[1],b[1],t),blend(a[2],b[2],t)];
const blend4=(a:Vec4,b:Vec4,t:number):Vec4=>
  [blend(a[0],b[0],t),blend(a[1],b[1],t),blend(a[2],b[2],t),blend(a[3],b[3],t)];

/** Framerate-independent easing. Reduced-motion/paused scenes settle instantly.
 * Max 100 ms per update prevents background-tab resume from jumping mid-transition.
 */
export function advanceSceneFrame(current:SceneFrame,target:SceneFrame,elapsedMs:number,animated:boolean):SceneFrame{
  if(!animated)return target;
  const dt=Number.isFinite(elapsedMs)?Math.min(100,Math.max(0,elapsedMs)):0;
  const alpha=1-Math.exp(-dt/210);
  return {camera:blend3(current.camera,target.camera,alpha),
    tone:blend3(current.tone,target.tone,alpha),
    silhouette:blend4(current.silhouette,target.silhouette,alpha),
    signature:blend(current.signature,target.signature,alpha),
    density:blend(current.density,target.density,alpha)};
}

/** CSS pixel dimensions and DPR are bounded independently of the physical
 * display. Never allocate a canvas larger than the chosen GPU pixel budget.
 */
export function sceneRenderSize(cssWidth:number,cssHeight:number,dpr:number){
  const width=Math.max(1,Math.floor(Number.isFinite(cssWidth)?cssWidth:1));
  const height=Math.max(1,Math.floor(Number.isFinite(cssHeight)?cssHeight:1));
  const mobile=width<=600;
  const limit=mobile?1_800_000:3_100_000;
  const requested=Math.min(Math.max(0.55,Number.isFinite(dpr)?dpr:1),mobile?2:1.75);
  const constrained=Math.min(requested,Math.sqrt(limit/(width*height)));
  // A huge viewport may require less than .55 DPR to stay within budget.
  const ratio=Math.max(0.01,constrained);
  const pixelWidth=Math.max(1,Math.floor(width*ratio));
  const pixelHeight=Math.max(1,Math.floor(height*ratio));
  return {width:pixelWidth,height:pixelHeight,ratio,
    frameIntervalMs:mobile?1000/24:1000/30,limit};
}
