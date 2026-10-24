/**
 * V116 project navigator: a PURE, read-only adapter for V111 folder/text nodes.
 * Current preview consumes a deterministic synthetic fixture. In production,
 * pass studioFileList(projectId) only after the existing V111 member/role and
 * migration gates are independently approved. Never infer access from a path.
 */
export const PROJECT_STRUCTURE_VERSION='ANEVUM_STUDIO_TREE_V1';
export const MAX_ENTRIES=100;
export const MAX_FOLDER_DEPTH=12;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SAFE_NAME=/^[^/\\\u0000-\u001f\u007f]+$/;
const MAX_NAME=80;
const UNKNOWN_FILE='document';
export const FILE_KINDS=Object.freeze({
 '.world.anevum':'world',
 '.ui.anevum':'interface',
 '.script.anevum':'script',
 '.asset.anevum':'asset',
 '.playtest.anevum':'playtest',
 '.json':'config',
 '.ts':'script',
 '.tsx':'script',
 '.js':'script',
 '.css':'script',
 '.md':'document'
});
export const SECTIONS=Object.freeze(['Scenes','Interfaces','Scripts','Assets','Audio','Playtests','Config']);
export function classifyFile(name){
 if(typeof name!=='string')return UNKNOWN_FILE;
 const lowercase=name.toLowerCase();
 return Object.entries(FILE_KINDS).find(([ext])=>lowercase.endsWith(ext))?.[1]||UNKNOWN_FILE;
}
const fail=(reason)=>{throw new Error('ANEVUM_STUDIO_TREE_V1: '+reason);};
const validName=(name)=>
 typeof name==='string'&&name===name.trim()&&name.length>0&&name.length<=MAX_NAME&&
 SAFE_NAME.test(name)&&name!=='.'&&name!=='..';
export function validateProjectNodes(items,projectId){
 if(!Array.isArray(items)||items.length>MAX_ENTRIES)fail('Too many nodes');
 if(typeof projectId!=='string'||!UUID.test(projectId))fail('Invalid owner-scoped project identifier');
 const lookup=new Map();
 for(const raw of items){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('Malformed entry');
  const {id,parentId,name,kind,projectId:owner,deletedAt}=raw;
  if(typeof id!=='string'||!UUID.test(id)||lookup.has(id))fail('Duplicate or invalid node identifier');
  if(owner!==projectId)fail('Cross-project node in file listing');
  if(!validName(name))fail('Invalid filename');
  if(kind!=='folder'&&kind!=='text')fail('Unsupported V111 file kind');
  if(parentId!==null&&(typeof parentId!=='string'||!UUID.test(parentId)))fail('Invalid parent identifier');
  if(deletedAt!==null)fail('Deleted node present in active project listing');
  lookup.set(id,{id,parentId,name,kind,projectId:owner,deletedAt:null});
 }
 const siblings=new Set();
 for(const node of lookup.values()){
  if(node.parentId!==null){
   const parent=lookup.get(node.parentId);
   if(!parent||parent.kind!=='folder')fail('Dangling/nonfolder parent');
  }
  const key=(node.parentId||'root')+'\u0000'+node.name.toLocaleLowerCase('en');
  if(siblings.has(key))fail('Duplicate sibling filename');
  siblings.add(key);
  const seen=new Set([node.id]);let parent=node.parentId,depth=0;
  while(parent!==null){
   if(seen.has(parent))fail('Cycle in project file structure');
   seen.add(parent);depth++;
   if(depth>MAX_FOLDER_DEPTH)fail('Folder nesting exceeds cap');
   parent=lookup.get(parent)?.parentId??null;
  }
 }
 return [...lookup.values()];
}
const sortNodes=(a,b)=>{
 if(a.kind!==b.kind)return a.kind==='folder'?-1:1;
 const ai=SECTIONS.indexOf(a.name),bi=SECTIONS.indexOf(b.name);
 if(a.parentId===null&&b.parentId===null&&ai>=0&&bi>=0)return ai-bi;
 return a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:true});
};
export function buildProjectTree(items,projectId){
 const normalized=validateProjectNodes(items,projectId);
 const byParent=new Map();
 for(const node of normalized){
  const key=node.parentId||'root';
  const list=byParent.get(key)||[];
  list.push(node);byParent.set(key,list);
 }
 function children(parentId,path='',depth=0){
  const list=[...(byParent.get(parentId||'root')||[])].sort(sortNodes);
  return list.map(n=>{
   const relativePath=path?path+'/'+n.name:n.name;
   return {...n,role:n.kind==='folder'?'folder':classifyFile(n.name),
    path:relativePath,depth,children:n.kind==='folder'?children(n.id,relativePath,depth+1):[]};
  });
 }
 const roots=children(null);
 return {version:PROJECT_STRUCTURE_VERSION,projectId,total:normalized.length,roots};
}
export function flattenTree(roots){
 const result=[];
 function visit(items){
  for(const node of items){result.push(node);visit(node.children||[]);}
 }
 visit(roots);return result;
}
export function searchTree(roots,term){
 const q=typeof term==='string'?term.trim().toLocaleLowerCase('en'):'';
 if(!q)return roots;
 function filtered(nodes){
  const out=[];
  for(const node of nodes){
   const sub=filtered(node.children||[]);
   if(node.name.toLocaleLowerCase('en').includes(q)||node.path.toLocaleLowerCase('en').includes(q)||sub.length)
    out.push({...node,children:sub});
  }
  return out;
 }
 return filtered(roots);
}
export function projectTreeTemplate(){
 const projectId='10000000-0000-4000-8000-000000000001';
 let i=0;const entries=[];
 const id=()=> '20000000-0000-4000-8000-'+String(++i).padStart(12,'0');
 const item=(name,kind,parentId=null)=>{
  const entry={id:id(),projectId,parentId,name,kind,deletedAt:null};
  entries.push(entry);return entry.id;
 };
 const scenes=item('Scenes','folder');
 item('Main World.world.anevum','text',scenes);
 item('City District.world.anevum','text',scenes);
 item('Space Station.world.anevum','text',scenes);
 const interfaces=item('Interfaces','folder');
 item('Main HUD.ui.anevum','text',interfaces);
 item('Creator Menu.ui.anevum','text',interfaces);
 const scripts=item('Scripts','folder');
 item('Interaction Logic.ts','text',scripts);
 item('World Events.ts','text',scripts);
 const assets=item('Assets','folder');
 const environments=item('Environments','folder',assets);
 item('Floating Islands.asset.anevum','text',environments);
 item('Sky Atmosphere.asset.anevum','text',environments);
 const vehicles=item('Vehicles','folder',assets);
 item('Starcraft.asset.anevum','text',vehicles);
 const props=item('Props','folder',assets);
 item('Energy Core.asset.anevum','text',props);
 const audio=item('Audio','folder');
 item('Atmosphere.asset.anevum','text',audio);
 const playtests=item('Playtests','folder');
 item('Local Test.playtest.anevum','text',playtests);
 const config=item('Config','folder');
 item('World Settings.json','text',config);
 return {projectId,items:entries,mainWorldId:entries.find(x=>x.name==='Main World.world.anevum').id};
}
