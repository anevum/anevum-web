/**
 * ANEVUM V117 / Continuance Institute procedural environment geometry.
 * Fixed-seed, bounded mesh construction. Assets contain no network content,
 * executable project source, models from unknown creators, or GPU-side uploads.
 * Units are document meters; all geometry is edited via the owning WorldNode.
 */
type Vertex=[number,number,number];
export type GeometryPart={name:string;vertices:number[]};
const norm=(v:Vertex):Vertex=>{
 const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];
};
const sub=(a:Vertex,b:Vertex):Vertex=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:Vertex,b:Vertex):Vertex=>[
 a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]
];
function triangle(out:number[],a:Vertex,b:Vertex,c:Vertex){
 const n=norm(cross(sub(b,a),sub(c,a)));
 for(const v of [a,b,c])out.push(...v,...n);
}
function quad(out:number[],a:Vertex,b:Vertex,c:Vertex,d:Vertex){
 triangle(out,a,b,c);triangle(out,a,c,d);
}
const point=(i:number,count:number,y:number,rx:number,rz=rx,shift=0):Vertex=>{
 const t=i/count*Math.PI*2;
 const irregular=1+.07*Math.sin(t*5+1.1)+.045*Math.sin(t*9+.7)+.03*Math.cos(t*13+.4);
 return [Math.cos(t)*rx*irregular+shift,y+Math.sin(t*3.3)*.052,Math.sin(t)*rz*irregular];
};
function cliff(){
 const rock:number[]=[],cap:number[]=[];
 const count=20,levels=[
  {y:.12,rx:2.12,rz:1.7,shift:0},
  {y:-.27,rx:2.0,rz:1.63,shift:.13},
  {y:-.92,rx:1.67,rz:1.45,shift:.23},
  {y:-1.60,rx:1.17,rz:1.08,shift:.15},
  {y:-2.30,rx:.53,rz:.56,shift:-.12},
  {y:-2.75,rx:.035,rz:.055,shift:-.19}
 ];
 for(let k=0;k<levels.length-1;k++){
  const a=levels[k],b=levels[k+1];
  for(let i=0;i<count;i++){
   const j=(i+1)%count;
   const a0=point(i,count,a.y,a.rx,a.rz,a.shift),
    a1=point(j,count,a.y,a.rx,a.rz,a.shift),
    b0=point(i,count,b.y,b.rx,b.rz,b.shift),
    b1=point(j,count,b.y,b.rx,b.rz,b.shift);
   triangle(rock,a0,a1,b0);triangle(rock,a1,b1,b0);
  }
 }
 for(let i=0;i<count;i++)triangle(cap,[0,.22,0],
  point((i+1)%count,count,.17,2.12,1.7),point(i,count,.17,2.12,1.7));
 return {islandRock:rock,islandTop:cap};
}
function spire(){
 const shape:number[]=[],count=12;
 const rings=[[-.26,.81],[.16,.78],[1.28,.71],[2.40,.60],[3.30,.43],[3.85,.40],[4.58,.055]] as const;
 for(let k=0;k<rings.length-1;k++){
  const [y,r]=rings[k],[y2,r2]=rings[k+1];
  for(let i=0;i<count;i++){
   const j=(i+1)%count,ang=(id:number)=>id*2*Math.PI/count;
   const v=(id:number,h:number,width:number):Vertex=>[Math.cos(ang(id))*width,h,Math.sin(ang(id))*width];
   quad(shape,v(i,y,r),v(j,y,r),v(j,y2,r2),v(i,y2,r2));
  }
 }
 const collar:number[]=[];
 for(let i=0;i<count;i++){
  const t=i*2*Math.PI/count,u=(i+1)*2*Math.PI/count;
  const v=(a:number,y:number,r:number):Vertex=>[Math.cos(a)*r,y,Math.sin(a)*r];
  for(const [y,h,r] of [[.25,.18,.88],[2.52,.16,.70],[3.44,.14,.53]]){
   quad(collar,v(t,y,r),v(u,y,r),v(u,y+h,r),v(t,y+h,r));
   quad(collar,v(t,y+h,r),v(u,y+h,r),v(u,y+h,r-.13),v(t,y+h,r-.13));
  }
 }
 return {tower:shape,towerCollar:collar};
}
function foliage(){
 const leaves:number[]=[],count=11;
 const rings=[[-.48,.22],[-.28,.51],[.05,.72],[.34,.58],[.67,.16],[.79,.04]] as const;
 for(let k=0;k<rings.length-1;k++){
  const [y,r]=rings[k],[y2,r2]=rings[k+1];
  for(let i=0;i<count;i++){
   const t=i/count*2*Math.PI,u=(i+1)/count*2*Math.PI;
   const v=(a:number,h:number,width:number):Vertex=>[Math.cos(a)*width,h,Math.sin(a)*width];
   quad(leaves,v(t,y,r),v(u,y,r),v(u,y2,r2),v(t,y2,r2));
  }
 }
 return leaves;
}
function arc(){
 const arch:number[]=[],segments=24;
 const corner=(x:number,y:number,z:number):Vertex=>[x,y,z];
 const centers=(i:number)=>{
  const t=i/segments,x=-5+10*t;
  // Thin catenary-inspired underside supporting the flat editable roadway.
  const y=-.42-1.8*(1-Math.pow(Math.abs(t*2-1),1.95));
  return {x,y};
 };
 for(let i=0;i<segments;i++){
  const a=centers(i),b=centers(i+1);
  for(const z of [-.43,.43]){
   const s=z<0?-.08:.08;
   quad(arch,corner(a.x,a.y,z),corner(b.x,b.y,z),
    corner(b.x,b.y-.22,z+s),corner(a.x,a.y-.22,z+s));
  }
  quad(arch,corner(a.x,a.y-.22,-.51),corner(b.x,b.y-.22,-.51),
   corner(b.x,b.y-.22,.51),corner(a.x,a.y-.22,.51));
 }
 return arch;
}
function cascade(){
 const ribbon:number[]=[],segments=40;
 const at=(row:number,lane:number):Vertex=>{
  const t=row/segments,y=.24-6.5*t;
  const x=lane*.55+.12*Math.sin(t*11+lane*.8)*Math.sin(Math.PI*t);
  const z=.11*Math.sin(t*13+lane*2.0)+.28*Math.sin(t*Math.PI);
  return [x,y,z];
 };
 for(let i=0;i<segments;i++){
  for(let j=0;j<6;j++){
   const a=at(i,j/3-1),b=at(i,j/3-2/3);
   const c=at(i+1,j/3-2/3),d=at(i+1,j/3-1);
   quad(ribbon,a,b,c,d);
  }
 }
 return ribbon;
}
function flyingCraft(){
 const hull:number[]=[],fins:number[]=[];
 const rings=[
  {x:-2.3,y:.0,ry:.07,rz:.05},
  {x:-1.4,y:.06,ry:.30,rz:.32},
  {x:0,y:0,ry:.48,rz:.71},
  {x:1.30,y:0,ry:.28,rz:.44},
  {x:2.05,y:0,ry:.02,rz:.02}
 ];
 const count=8;
 const v=(r:typeof rings[number],i:number):Vertex=>{
  const a=i*2*Math.PI/count;return [r.x,r.y+Math.cos(a)*r.ry,Math.sin(a)*r.rz];
 };
 for(let k=0;k<rings.length-1;k++)for(let i=0;i<count;i++){
  const j=(i+1)%count;
  quad(hull,v(rings[k],i),v(rings[k],j),v(rings[k+1],j),v(rings[k+1],i));
 }
 for(const z of [-1,1]){
  triangle(fins,[-.85,0,z*.38],[.58,.09,z*2.15],[1.15,0,z*.42]);
  triangle(fins,[-1.4,0,z*.27],[-2.1,.46,z*.9],[-1.1,0,z*.30]);
 }
 return {craftHull:hull,craftFins:fins};
}
function gateway(){
 const arch:number[]=[],columns:number[]=[];
 const steps=20,rx=2.1,ry=2.85;
 const ring=(i:number,inner:boolean,z:number):Vertex=>{
  const t=i/steps*Math.PI;
  return [Math.cos(t)*(inner?rx-.16:rx),.7+Math.sin(t)*(inner?ry-.19:ry),z];
 };
 for(let i=0;i<steps;i++){
  for(const z of [-.21,.21])quad(arch,ring(i,false,z),ring(i+1,false,z),ring(i+1,true,z),ring(i,true,z));
  quad(arch,ring(i,false,-.21),ring(i+1,false,-.21),ring(i+1,false,.21),ring(i,false,.21));
  quad(arch,ring(i,true,-.21),ring(i+1,true,-.21),ring(i+1,true,.21),ring(i,true,.21));
 }
 // Tower-like portal pylons can be drawn with ordinary cube parts.
 return {gatewayArch:arch,gatewayColumn:columns};
}
export function buildCinematicMeshes():Record<string,number[]>{
 const island=cliff(),tower=spire(),craft=flyingCraft(),gate=gateway();
 return {...island,...tower,canopy:foliage(),bridgeArch:arc(),waterRibbon:cascade(),...craft,...gate};
}
export function geometryBudgets(){
 return Object.entries(buildCinematicMeshes()).map(([name,vertices])=>({
  name,triangles:vertices.length/18,bytes:vertices.length*4
 }));
}
