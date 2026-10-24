/**
 * ANEVUM V118 / real local World Composer placement.
 * Deterministic, finite and pure: places authored primitives in empty space
 * instead of spawning every new model inside the central existing tower.
 * No backend/filesystem/AI dependencies. Output is validated by the ordinary
 * ANEVUM_WORLD_V1 typed ADD_NODE reducer before becoming an undoable edit.
 */
const LIMIT=40;
const PROFILES=Object.freeze({
 island:{half:[4.6,2.8,3.6],y:-4,spawn:[[-9,-4,-9],[9,-4,9],[-19,-4,2],[17,-5,-11]]},
 spire:{half:[1.3,5.4,1.3],y:0,spawn:[[-8,1,-8],[8,1,8],[-18,0,-4],[18,0,7]]},
 bridge:{half:[5.4,1.3,1],y:0,spawn:[[-5,0,-10],[6,0,10],[-15,0,-12],[16,0,12]]},
 waterfall:{half:[1.1,4.5,1.1],y:-7,spawn:[[-10,-7,7],[12,-8,5],[-20,-7,6],[18,-8,-7]]},
 cube:{half:[.65,.65,.65],y:1,spawn:[[-4,3,5],[4,2,5],[-6,3,-6],[7,2,-6]]},
 sphere:{half:[1,1,1],y:5,spawn:[[-5,6,5],[5,5,5],[-2,8,-6],[9,7,-7]]},
 light:{half:[.6,.6,.6],y:11,spawn:[[5,11,4],[-3,11,6],[6,11,-6],[-7,11,-7]]},
 starship:{half:[2.6,1.1,2.3],y:8,spawn:[[-5,8,6],[5,8,6],[-4,9,-7],[8,9,-8],[-12,7,9]]}
});
function validatePoint(p){
 return Array.isArray(p)&&p.length===3&&p.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=LIMIT);
}
function envelope(node){
 const p=PROFILES[node.kind]||PROFILES.cube;
 const scale=Array.isArray(node.scale)&&node.scale.length===3?node.scale:[1,1,1];
 return p.half.map((v,i)=>v*Math.min(6,Math.max(.1,scale[i])));
}
function collides(position,half,other){
 const otherHalf=envelope(other);
 // AABBs are conservative, with small tolerance for interlocking bridge and
 // cliff trim. Every dimension must overlap for there to be a collision.
 return [0,1,2].every(i=>Math.abs(position[i]-other.position[i]) <
  (half[i]+otherHalf[i])*.91);
}
function canUse(point,kind,nodes){
 if(!validatePoint(point))return false;
 const half=PROFILES[kind].half;
 return nodes.every(n=>!collides(point,half,n));
}
export function getWorldSpawnPosition(document,kind){
 if(!document||!Array.isArray(document.nodes))throw Error('Invalid scene placement context');
 const profile=PROFILES[kind];
 if(!profile)throw Error('Unsupported kind for placement');
 if(document.nodes.length>=64)throw Error('The world has reached its 64-object limit');
 for(const point of profile.spawn)if(canUse(point,kind,document.nodes))return [...point];
 // Search concentric grid positions. Bounded to valid document dimensions.
 // Stable candidate order makes the same scene produce the same placement.
 for(let radius=0;radius<=4;radius++){
  for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){
   if(Math.max(Math.abs(x),Math.abs(z))!==radius)continue;
   if(x===0&&z===0)continue;
   const candidate=[x*8,profile.y,z*8];
   if(canUse(candidate,kind,document.nodes))return candidate;
  }
 }
 throw Error('No collision-free location found; remove or reposition an object before adding');
}
export function getWorldSpawnTarget(kind,position){
 if(!PROFILES[kind]||!validatePoint(position))throw Error('Invalid world framing request');
 return [...position];
}
