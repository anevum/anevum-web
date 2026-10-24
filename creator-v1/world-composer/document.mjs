/**
 * ANEVUM_WORLD_V1 — immutable, renderer-independent world document.
 * Not executable content. Deliberately stays under the existing V111
 * 32,768-byte source-file ceiling; only revisioned V111 writes persist.
 *
 * Pure ESM: imported by the Studio and directly by node:test.
 */
export const PREFIX='ANEVUM_WORLD_V1\n';
export const LIMITS=Object.freeze({bytes:32768,nodes:64,depth:6,name:80,id:40,dimension:40});
const ID=/^[a-z][a-z0-9_-]{0,39}$/;
const MATERIALS=Object.freeze(['stone','grass','gold','glass','cyan','slate','violet','water']);
const KINDS=Object.freeze(['island','spire','bridge','waterfall','cube','sphere','light']);
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const vect=(value,min,max)=>Array.isArray(value)&&value.length===3&&value.every(v=>finite(v,min,max));
const text=(value,max)=>typeof value==='string'&&value.trim().length>=1&&value.trim().length<=max&&value===value.trim();
const fail=message=>{throw new Error('ANEVUM_WORLD_V1: '+message);};
function boundedKeys(v,keys,label){
 if(!isRecord(v)||Object.keys(v).some(k=>!keys.includes(k)))fail('Invalid '+label+' fields');
}
function assertNode(v){
 boundedKeys(v,['id','name','kind','parentId','position','rotation','scale','material'],'node');
 if(typeof v.id!=='string'||!ID.test(v.id))fail('Invalid node id');
 if(!text(v.name,LIMITS.name))fail('Invalid node name');
 if(!KINDS.includes(v.kind)||!MATERIALS.includes(v.material))fail('Invalid node kind/material');
 if(v.parentId!==null&&(typeof v.parentId!=='string'||!ID.test(v.parentId)))fail('Invalid parent');
 if(!vect(v.position,-LIMITS.dimension,LIMITS.dimension))fail('Invalid node position');
 if(!vect(v.rotation,-6.284,6.284))fail('Invalid node rotation');
 if(!vect(v.scale,.1,6))fail('Invalid node scale');
 return {id:v.id,name:v.name,kind:v.kind,parentId:v.parentId,
  position:[...v.position],rotation:[...v.rotation],scale:[...v.scale],material:v.material};
}
export function validate(value){
 boundedKeys(value,['format','name','units','environment','camera','nodes'],'document');
 if(value.format!=='ANEVUM_WORLD_V1'||value.units!=='meters')fail('Unsupported document version/units');
 if(!text(value.name,LIMITS.name))fail('Invalid scene name');
 boundedKeys(value.environment,['sky','sunIntensity'],'environment');
 if(!['day','night'].includes(value.environment.sky)||!finite(value.environment.sunIntensity,0,2))
  fail('Invalid environment');
 boundedKeys(value.camera,['yaw','pitch','distance','target'],'camera');
 const c=value.camera;
 if(!finite(c.yaw,-50,50)||!finite(c.pitch,-1.36,1.36)||!finite(c.distance,4,80)
  ||!vect(c.target,-LIMITS.dimension,LIMITS.dimension))fail('Invalid camera');
 if(!Array.isArray(value.nodes)||value.nodes.length>LIMITS.nodes)fail('Too many scene nodes');
 const nodes=value.nodes.map(assertNode);
 const ids=new Set(nodes.map(n=>n.id));
 if(ids.size!==nodes.length)fail('Duplicate node identifiers');
 const lookup=new Map(nodes.map(n=>[n.id,n]));
 for(const node of nodes){
  const ancestors=new Set([node.id]);
  let parent=node.parentId,depth=0;
  while(parent!==null){
   if(!lookup.has(parent))fail('Dangling parent');
   if(ancestors.has(parent))fail('Cycle in scene hierarchy');
   ancestors.add(parent);depth+=1;
   if(depth>LIMITS.depth)fail('Scene hierarchy too deep');
   parent=lookup.get(parent).parentId;
  }
 }
 return {format:'ANEVUM_WORLD_V1',name:value.name,units:'meters',
  environment:{sky:value.environment.sky,sunIntensity:value.environment.sunIntensity},
  camera:{yaw:c.yaw,pitch:c.pitch,distance:c.distance,target:[...c.target]},
  nodes};
}
export function encode(document){
 const result=PREFIX+JSON.stringify(validate(document));
 if(new TextEncoder().encode(result).length>LIMITS.bytes)fail('Document exceeds existing 32 KiB source limit');
 return result;
}
export function decode(raw){
 if(typeof raw!=='string'||!raw.startsWith(PREFIX))return null;
 if(new TextEncoder().encode(raw).length>LIMITS.bytes)return null;
 try{return validate(JSON.parse(raw.slice(PREFIX.length)));}catch{return null;}
}
function node(id,name,kind,x,y,z,material='stone',scale=[1,1,1]){
 return {id,name,kind,parentId:null,position:[x,y,z],rotation:[0,0,0],scale,material};
}
export function starter(){
 return validate({
  format:'ANEVUM_WORLD_V1',name:'Sky Archipelago',units:'meters',
  environment:{sky:'day',sunIntensity:1},
  camera:{yaw:.7,pitch:.32,distance:31,target:[0,2,0]},
  nodes:[
   node('island-central','Astra Island','island',0,-3,0,'grass',[2.4,1.2,1.8]),
   node('island-west','West Terrace','island',-10,-4,1,'grass',[1.25,.85,1.2]),
   node('island-east','Cascade Point','island',10,-5,-2,'grass',[1.5,1,1.45]),
   node('spire','Astra Spire','spire',0,3,0,'gold',[1,2.4,1]),
   node('spire-west','West Lookout','spire',-10,1,1,'slate',[.75,1.3,.75]),
   node('spire-east','Cascade Tower','spire',10,0,-2,'gold',[.65,1.5,.65]),
   node('bridge-west','Transit Span','bridge',-5,0,1,'slate',[1,1,1]),
   node('bridge-east','Horizon Bridge','bridge',5,0,-1,'gold',[1,1,1]),
   node('falls','Cascade Falls','waterfall',12,-8,-2,'water',[.85,1.3,1]),
   node('light','Sol Light Rig','light',-8,12,2,'cyan',[1,1,1])
  ]
 });
}
export function primitive(id,kind='cube'){
 if(!ID.test(id))fail('Invalid new id');
 if(!['cube','sphere','spire','island','light'].includes(kind))fail('Unsupported primitive type');
 return assertNode(node(id,kind==='cube'?'Cube':kind==='sphere'?'Sphere':kind==='light'?'Point Light':kind==='island'?'Floating Island':'Spire',
  kind,0,0,0,kind==='light'?'cyan':kind==='island'?'grass':'stone'));
}
/** Each result is a new canonical document; callers own undo/redo and persistence. */
export function apply(document,command){
 const base=validate(document);
 if(!isRecord(command)||typeof command.type!=='string')fail('Invalid command');
 const nodes=base.nodes;
 const find=id=>{const n=nodes.find(n=>n.id===id);if(!n)fail('Unknown node');return n;};
 switch(command.type){
  case 'ADD_NODE':{
   if(nodes.length>=LIMITS.nodes)fail('Scene node limit reached');
   const added=assertNode(command.node);
   if(nodes.some(n=>n.id===added.id))fail('Duplicate node');
   nodes.push(added);break;
  }
  case 'DELETE_NODE':{
   find(command.id);
   const deleted=new Set([command.id]);
   let grown=true;
   while(grown){grown=false;for(const n of nodes)if(n.parentId!==null&&deleted.has(n.parentId)&&!deleted.has(n.id)){deleted.add(n.id);grown=true;}}
   base.nodes=nodes.filter(n=>!deleted.has(n.id));break;
  }
  case 'RENAME':{
   if(!text(command.name,LIMITS.name))fail('Invalid name');
   find(command.id).name=command.name;break;
  }
  case 'SET_TRANSFORM':{
   if(!['position','rotation','scale'].includes(command.field))fail('Invalid transform axis');
   const range=command.field==='scale'?[.1,6]:command.field==='rotation'?[-6.284,6.284]:[-LIMITS.dimension,LIMITS.dimension];
   if(!vect(command.value,...range))fail('Invalid transform');
   find(command.id)[command.field]=[...command.value];break;
  }
  case 'SET_MATERIAL':{
   if(!MATERIALS.includes(command.material))fail('Invalid material');
   find(command.id).material=command.material;break;
  }
  case 'SET_PARENT':{
   if(command.parentId!==null&&(typeof command.parentId!=='string'||!ID.test(command.parentId)))fail('Invalid parent id');
   find(command.id).parentId=command.parentId;break;
  }
  case 'SET_ENVIRONMENT':{
   if(!['day','night'].includes(command.sky)||!finite(command.sunIntensity,0,2))fail('Invalid lighting');
   base.environment={sky:command.sky,sunIntensity:command.sunIntensity};break;
  }
  case 'SET_CAMERA':{
   const c=command.camera;
   if(!isRecord(c)||!finite(c.yaw,-50,50)||!finite(c.pitch,-1.36,1.36)||!finite(c.distance,4,80)
   ||!vect(c.target,-LIMITS.dimension,LIMITS.dimension))fail('Invalid camera');
   base.camera={yaw:c.yaw,pitch:c.pitch,distance:c.distance,target:[...c.target]};break;
  }
  default:fail('Unsupported scene command');
 }
 const validated=validate(base);
 encode(validated);
 return validated;
}
