import {useMemo,useState} from 'react';
import {Icon} from '../components/Icons';
import {buildProjectTree,projectTreeTemplate,searchTree,type StudioTreeNode} from '../../../studio-next/project-tree-v116.mjs';

export type StudioModeV116='Scene'|'Interface'|'Scripts'|'Assets'|'Playtest'|'Publish';
export type StudioFileChoice={role:string;name:string;path:string;id:string};
export const MODE_META:{name:StudioModeV116;icon:string;caption:string}[]=[
 {name:'Scene',icon:'explore',caption:'World Composer'},
 {name:'Interface',icon:'library',caption:'Interface Builder'},
 {name:'Scripts',icon:'create',caption:'Script Editor'},
 {name:'Assets',icon:'save',caption:'Asset Foundry'},
 {name:'Playtest',icon:'star',caption:'Playtest & Preview'},
 {name:'Publish',icon:'arrow',caption:'Publish & Deploy'}
];
export function StudioModeRailV116({mode,onChange}:{mode:StudioModeV116;onChange:(mode:StudioModeV116)=>void}){
 return <nav className="csn-mode-rail" aria-label="Creator Studio tools">
  <span className="csn-mode-rail-label">WORKSPACE</span>
  {MODE_META.map(item=><button type="button" key={item.name} className={mode===item.name?'is-current':''}
   onClick={()=>onChange(item.name)} aria-current={mode===item.name?'page':undefined} title={item.caption}>
   <Icon name={item.icon} size={19}/><span>{item.name}</span>
  </button>)}
  <div className="csn-rail-foot"><span>CREATE</span><span>EXPLORE</span><span>SHIP</span></div>
 </nav>;
}
export function StudioTopModesV116({mode,onChange}:{mode:StudioModeV116;onChange:(mode:StudioModeV116)=>void}){
 return <nav className="csn-workspace-tabs" aria-label="Editor mode tabs">
  {MODE_META.map(item=><button key={item.name} type="button" aria-current={mode===item.name?'page':undefined} onClick={()=>onChange(item.name)}>{item.name}</button>)}
 </nav>;
}
const fixture=projectTreeTemplate();
const tree=buildProjectTree(fixture.items,fixture.projectId);
function TreeNode({node,depth,expanded,onToggle,onChoose,selectedId}:{
 node:StudioTreeNode;depth:number;expanded:Set<string>;
 onToggle:(id:string)=>void;onChoose:(node:StudioTreeNode)=>void;selectedId:string|null;
}){
 const folder=node.kind==='folder';
 const open=expanded.has(node.id);
 return <>
  <button type="button" className={'csn-file-node'+(selectedId===node.id?' is-current':'')}
   aria-expanded={folder?open:undefined} aria-pressed={folder?undefined:selectedId===node.id}
   style={{paddingInlineStart:10+Math.min(depth,8)*14+'px'}} title={node.path}
   onClick={()=>folder?onToggle(node.id):onChoose(node)}>
   <span className={'csn-file-icon '+(folder?'is-folder':'is-'+node.role)} aria-hidden="true">{folder?(open?'▾':'▸'):'◇'}</span>
   <span className="csn-file-label">{node.name}</span>
   {!folder&&<span className="csn-file-type" aria-hidden="true">{node.role==='world'?'3D':node.role==='interface'?'UI':node.role==='script'?'TS':''}</span>}
  </button>
  {folder&&open&&node.children.map(c=><TreeNode key={c.id} node={c} depth={depth+1} expanded={expanded}
   onToggle={onToggle} onChoose={onChoose} selectedId={selectedId}/>)}
 </>;
}
export function StudioFileTreeV116({onOpen}:{
 onOpen:(file:StudioFileChoice)=>void
}){
 const [filter,setFilter]=useState('');
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set(tree.roots.filter(x=>x.name==='Scenes').map(x=>x.id)));
 const [selectedId,setSelectedId]=useState<string|null>(fixture.mainWorldId);
 const results=useMemo(()=>searchTree(tree.roots,filter),[filter]);
 const displayed=new Set(expanded);
 if(filter.trim()){
  function openParents(nodes:StudioTreeNode[]){
   for(const n of nodes){if(n.children.length){displayed.add(n.id);openParents(n.children);}}
  }
  openParents(results);
 }
 function toggle(id:string){
  setExpanded(old=>{const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next;});
 }
 function select(file:StudioTreeNode){
  setSelectedId(file.id);
  onOpen({id:file.id,name:file.name,path:file.path,role:file.role});
 }
 return <section className="csn-filetree" aria-label="Project file structure">
  <div className="csn-tree-heading"><span>PROJECT FILES</span><small>{tree.total} SAMPLE ITEMS</small></div>
  <label className="csn-file-search"><Icon name="search" size={14}/><input aria-label="Search sample project files" value={filter}
   onChange={e=>setFilter(e.target.value)} type="search" placeholder="Search project files…"/></label>
  <nav className="csn-file-list" aria-label="Synthetic project file tree">
   {results.map(n=><TreeNode key={n.id} node={n} depth={0} expanded={displayed} onToggle={toggle} onChoose={select} selectedId={selectedId}/>)}
   {!results.length&&<p className="csn-file-empty">No matching folders or files.</p>}
  </nav>
  <p className="csn-file-hint">Structure preview. Private files remain managed by the existing V111 revisioned service; these entries do not open real member data.</p>
 </section>;
}
