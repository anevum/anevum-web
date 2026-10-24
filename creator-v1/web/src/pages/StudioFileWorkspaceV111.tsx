import {useEffect,useMemo,useRef,useState,type ReactNode,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {PREFIX} from '../../../workbench-alpha/document.mjs';
import {classifyFile,SECTIONS} from '../../../studio-next/project-tree-v116.mjs';
import {StudioCodeEditorV119} from './StudioCodeEditorV119';
import {StudioCommandPaletteV120} from './StudioCommandPaletteV120';
import {studioFileItems,studioCommandItems,type StudioPaletteItem} from '../../../source-ide/commands-v120.mjs';
import {StudioFileIconV119} from './StudioFileIconV119';
import {StudioSceneComposerV112,studioVisualScenesEnabled} from './StudioSceneComposerV112';
import {PREFIX as UI_PREFIX} from '../../../interface-builder/document.mjs';
import {PREFIX as WORLD_PREFIX} from '../../../world-composer/document.mjs';
import {StudioInterfaceBuilderV113,studioInterfaceBuilderEnabled} from './StudioInterfaceBuilderV113';
import {
 studioFileTreeEnabled,studioFileList,studioFileGet,studioFileCreate,
 studioFileUpdate,studioFileVersions,studioFileTrash,studioFileRestore,type StudioFileNode,type StudioFileVersion,
 type StudioNodeKind
} from '../lib/studio-files-v111';
import './studio-file-workspace-v111.css';
import './studio-file-workspace-v116.css';
import './studio-layout-v121.css';

const MAX_OPEN=8;
type Props={
 projectId:string;projectTitle:string;status:string;visible:boolean;
 onDirtyChange:(dirty:boolean)=>void
};
const presentError=(e:unknown)=>e instanceof Error?e.message:'File operation was not confirmed. No changes were applied locally.';
const alphabetic=(a:StudioFileNode,b:StudioFileNode)=>{
 if(a.kind!==b.kind)return a.kind==='folder'?-1:1;
 if(a.kind==='folder'&&a.parentId===null&&b.parentId===null){
  const ai=SECTIONS.indexOf(a.name),bi=SECTIONS.indexOf(b.name);
  if(ai>=0&&bi>=0)return ai-bi;
  if(ai>=0)return -1;
  if(bi>=0)return 1;
 }
 return a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:true});
};
function pathLabel(node:StudioFileNode,nodes:StudioFileNode[]):string{
 const names=[node.name],seen=new Set([node.id]);
 let parent=node.parentId;
 for(let i=0;i<25&&parent;i++){
  if(seen.has(parent))break;
  seen.add(parent);
  const next=nodes.find(candidate=>candidate.id===parent);
  if(!next)break;
  names.unshift(next.name);parent=next.parentId;
 }
 return names.join(' / ');
}
function editable(status:string){return status==='draft'||status==='changes_requested';}
function isWorldSource(name:string,content:string){
 return name.toLowerCase().endsWith('.world.anevum')||content.startsWith(WORLD_PREFIX);
}

export function StudioFileWorkspaceV111({projectId,projectTitle,status,visible,onDirtyChange}:Props){
 const [nodes,setNodes]=useState<StudioFileNode[]>([]);
 const [fileQuery,setFileQuery]=useState('');
 const [paletteMode,setPaletteMode]=useState<'files'|'commands'|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [attempt,setAttempt]=useState(0);
 const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
 const [selectedFolder,setSelectedFolder]=useState<string|null>(null);
 const [openIds,setOpenIds]=useState<string[]>([]);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [splitId,setSplitId]=useState<string|null>(null);
 const [dirtyIds,setDirtyIds]=useState<Set<string>>(()=>new Set());
 const [createKind,setCreateKind]=useState<StudioNodeKind|null>(null);
 const [createName,setCreateName]=useState('');
 const [createBusy,setCreateBusy]=useState(false);
 const [pendingCreate,setPendingCreate]=useState<{
  id:string;kind:StudioNodeKind;name:string;parentId:string|null
 }|null>(null);
 const [message,setMessage]=useState('');
 const [trashOpen,setTrashOpen]=useState(false);
 const [trashNodes,setTrashNodes]=useState<StudioFileNode[]>([]);
 const [trashLoading,setTrashLoading]=useState(false);
 const [trashError,setTrashError]=useState('');
 const [trashAttempt,setTrashAttempt]=useState(0);
 const [restoringId,setRestoringId]=useState<string|null>(null);
 const canEdit=editable(status);
 const latestDirty=useRef(dirtyIds);
 latestDirty.current=dirtyIds;
 const dirtyCallback=useRef(onDirtyChange);
 dirtyCallback.current=onDirtyChange;

 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError('');
  studioFileList(projectId,controller.signal)
   .then(result=>{if(!controller.signal.aborted){setNodes(result);setExpanded(new Set(result.filter(x=>x.kind==='folder').map(x=>x.id)));}})
   .catch(e=>{if(!controller.signal.aborted)setError(presentError(e));})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[projectId,attempt]);
 useEffect(()=>{
  if(!trashOpen)return;
  const controller=new AbortController();
  setTrashLoading(true);setTrashError('');
  studioFileTrash(projectId,controller.signal)
   .then(result=>{if(!controller.signal.aborted)setTrashNodes(result);})
   .catch(e=>{if(!controller.signal.aborted)setTrashError(presentError(e));})
   .finally(()=>{if(!controller.signal.aborted)setTrashLoading(false);});
  return()=>controller.abort();
 },[projectId,trashOpen,trashAttempt]);
 useEffect(()=>{dirtyCallback.current(dirtyIds.size>0);},[dirtyIds]);
 useEffect(()=>()=>{dirtyCallback.current(false);},[]);
 useEffect(()=>{
  const handler=(event:BeforeUnloadEvent)=>{
   if(!latestDirty.current.size)return;
   event.preventDefault();event.returnValue='';
  };
  window.addEventListener('beforeunload',handler);
  return()=>window.removeEventListener('beforeunload',handler);
 },[]);

 const folderOptions=useMemo(()=>nodes.filter(n=>n.kind==='folder').sort((a,b)=>pathLabel(a,nodes).localeCompare(pathLabel(b,nodes))),[nodes]);
 const visibleIds=useMemo(()=>{
  const q=fileQuery.trim().toLocaleLowerCase();
  if(!q)return null;
  const ids=new Set<string>();
  for(const item of nodes){
   if(!(item.name+' '+pathLabel(item,nodes)).toLocaleLowerCase().includes(q))continue;
   let cursor:StudioFileNode|undefined=item;const seen=new Set<string>();
   while(cursor&&!seen.has(cursor.id)){
    ids.add(cursor.id);seen.add(cursor.id);
    cursor=cursor.parentId?nodes.find(n=>n.id===cursor?.parentId):undefined;
   }
  }
  return ids;
 },[nodes,fileQuery]);
 const paletteItems=useMemo(()=>{
  const paths=nodes.map(node=>({id:node.id,path:pathLabel(node,nodes)}));
  const commands=['expand-folders','collapse-folders','toggle-trash'];
  if(!loading&&!error&&dirtyIds.size===0)commands.push('refresh-tree','close-tabs');
  if(canEdit&&!loading&&!error&&!pendingCreate)commands.push('new-file','new-folder');
  return [...studioFileItems(nodes,paths,openIds),...studioCommandItems(commands)];
 },[nodes,openIds,dirtyIds.size,canEdit,loading,error,pendingCreate]);
 useEffect(()=>{
  if(!visible)return;
  const handler=(event:globalThis.KeyboardEvent)=>{
   if(!(event.ctrlKey||event.metaKey)||event.altKey||event.key.toLowerCase()!=='p')return;
   event.preventDefault();
   setPaletteMode(event.shiftKey?'commands':'files');
  };
  window.addEventListener('keydown',handler);
  return()=>window.removeEventListener('keydown',handler);
 },[visible]);
 function choosePalette(item:StudioPaletteItem){
  setPaletteMode(null);
  if(item.kind==='file'){
   const node=nodes.find(n=>n.id===item.fileId&&n.kind==='text'&&n.deletedAt===null);
   if(node)openFile(node);
   return;
  }
  switch(item.id){
   case 'new-file':
    if(canEdit&&!loading&&!error&&!pendingCreate){setCreateKind('text');setCreateName('');setMessage('');}
    break;
   case 'new-folder':
    if(canEdit&&!loading&&!error&&!pendingCreate){setCreateKind('folder');setCreateName('');setMessage('');}
    break;
   case 'refresh-tree':
    if(dirtyIds.size===0&&!loading){setAttempt(x=>x+1);}
    break;
   case 'expand-folders':setExpanded(new Set(nodes.filter(n=>n.kind==='folder').map(n=>n.id)));break;
   case 'collapse-folders':setExpanded(new Set());break;
   case 'toggle-trash':setTrashOpen(x=>!x);break;
   case 'close-tabs':if(dirtyIds.size===0)closeAllFiles();break;
   default:break;
  }
 }
  const selectedFolderNode=nodes.find(n=>n.id===selectedFolder)||null;
 const secondaryId=activeId&&splitId&&splitId!==activeId&&openIds.includes(splitId)?splitId:null;
 function activateTab(id:string){
  if(!confirmLeavingFolder())return;
  if(id===splitId&&activeId&&activeId!==id)setSplitId(activeId);
  setActiveId(id);
 }
 function toggleSplit(){
  if(secondaryId){setSplitId(null);return;}
  if(!activeId||openIds.length<2)return;
  setSplitId(openIds.find(id=>id!==activeId)||null);
 }
 function confirmLeavingFolder(){
  return !selectedFolder||!dirtyIds.has('folder:'+selectedFolder)||
   window.confirm('Discard unsaved folder property changes before navigating away?');
 }
 function upsert(node:StudioFileNode){
  setNodes(old=>[...old.filter(n=>n.id!==node.id),node].filter(n=>n.deletedAt===null));
 }
 function markedDeleted(node:StudioFileNode){
  setNodes(old=>old.filter(n=>n.id!==node.id));
  if(node.kind==='folder')setSelectedFolder(null);
  else{
   const next=openIds.filter(id=>id!==node.id);
   setOpenIds(next);
   if(activeId===node.id)setActiveId(next.at(-1)||null);
   if(splitId===node.id)setSplitId(null);
  }
  setTrashNodes(old=>[node,...old.filter(n=>n.id!==node.id)]);
  setTrashAttempt(n=>n+1);
  setMessage('Moved '+node.name+' to private Trash. You can restore it while the project remains editable.');
 }
 async function restore(item:StudioFileNode){
  if(!canEdit||restoringId!==null)return;
  setRestoringId(item.id);setTrashError('');
  try{
   const restored=await studioFileRestore(projectId,item.id,item.revision);
   upsert(restored);
   setTrashNodes(old=>old.filter(n=>n.id!==item.id));
   if(restored.parentId)setExpanded(old=>new Set([...old,restored.parentId!]));
   setMessage('Restored '+restored.name+' as private revision '+restored.revision+'.');
  }catch(e){
   setTrashError(presentError(e)+' Check whether its parent folder, original name or storage allowance is still available. Refresh Trash before retrying.');
  }finally{setRestoringId(null);}
 }
 function setDirty(id:string,dirty:boolean){
  setDirtyIds(old=>{
   if(old.has(id)===dirty)return old;
   const next=new Set(old);dirty?next.add(id):next.delete(id);return next;
  });
 }
 function openFile(node:StudioFileNode){
  if(!confirmLeavingFolder())return;
  setMessage('');
  setSelectedFolder(node.parentId);
  if(openIds.includes(node.id)){
   if(node.id===splitId&&activeId&&activeId!==node.id)setSplitId(activeId);
   setActiveId(node.id);return;
  }
  if(openIds.length>=MAX_OPEN){setMessage('Close a source tab before opening another (8-file limit).');return;}
  setOpenIds(old=>[...old,node.id]);setActiveId(node.id);
 }
 function closeFile(id:string){
  if(dirtyIds.has(id)&&!window.confirm('Discard unsaved changes in this source tab?'))return;
  const next=openIds.filter(openId=>openId!==id);
  setOpenIds(next);
  setDirtyIds(old=>{if(!old.has(id))return old;const nextDirty=new Set(old);nextDirty.delete(id);return nextDirty;});
  if(activeId===id)setActiveId(next.at(-1)||null);
  if(splitId===id)setSplitId(null);
  else if(splitId&&splitId===next.at(-1)&&activeId===id)
   setSplitId(next.find(other=>other!==splitId)||null);
 }
 function closeAllFiles(){
  if(!confirmLeavingFolder())return;
  if(openIds.some(id=>dirtyIds.has(id))&&!window.confirm('Discard unsaved source edits in all open file tabs?'))return;
  setOpenIds([]);setActiveId(null);setSplitId(null);
  setDirtyIds(old=>new Set([...old].filter(id=>id.startsWith('folder:'))));
 }
 function selectFolder(node:StudioFileNode){
  if(selectedFolder!==node.id&&!confirmLeavingFolder())return;
  setSelectedFolder(node.id);setActiveId(null);
  setExpanded(old=>{
   const next=new Set(old);next.has(node.id)?next.delete(node.id):next.add(node.id);return next;
  });
 }
 function renderTree(parentId:string|null,depth=0,ancestry=new Set<string>()):ReactNode[]{
  if(depth>20)return [];
  return nodes.filter(n=>n.parentId===parentId&&(!visibleIds||visibleIds.has(n.id))).sort(alphabetic).flatMap(node=>{
   if(ancestry.has(node.id))return [];
   const folder=node.kind==='folder',isOpen=!!visibleIds||expanded.has(node.id);
   const row=<button key={node.id} type="button"
    className={'csf-tree-row'+((folder?selectedFolder===node.id:activeId===node.id)?' is-active':'')}
    style={{paddingInlineStart:(12+depth*16)+'px'}} title={pathLabel(node,nodes)}
    aria-expanded={folder?isOpen:undefined}
    onClick={()=>folder?selectFolder(node):openFile(node)}>
    <span aria-hidden="true" className={'csf-node-icon'+(folder?' is-folder':' is-'+classifyFile(node.name))}>{folder&&<span className="csf-disclosure">{isOpen?'▾':'▸'}</span>}<StudioFileIconV119 name={node.name} folder={folder}/></span>
    <span className="csf-node-name">{node.name}</span>
     {!folder&&<span className="csf-file-kind" aria-hidden="true">{classifyFile(node.name)==='world'?'3D':classifyFile(node.name)==='interface'?'UI':classifyFile(node.name)==='script'?'CODE':''}</span>}
    {(dirtyIds.has(node.id)||dirtyIds.has('folder:'+node.id))&&<span className="csf-unsaved-marker" aria-label="Unsaved edits">●</span>}
   </button>;
   if(!folder||!isOpen)return[row];
   const childTrail=new Set(ancestry);childTrail.add(node.id);
   return[row,...renderTree(node.id,depth+1,childTrail)];
  });
 }
 async function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(createBusy||!canEdit||!createKind||!createName.trim())return;
  if(selectedFolder&&dirtyIds.has('folder:'+selectedFolder)){
   setMessage('Save or discard folder property changes before creating a new item.');return;
  }
  const command=pendingCreate||{id:crypto.randomUUID(),kind:createKind,name:createName.trim(),parentId:selectedFolder};
  setPendingCreate(command);setCreateBusy(true);setMessage('');
  try{
   const {node}=await studioFileCreate(projectId,command.kind,command.name,command.parentId,command.id);
   upsert(node);
   if(node.kind==='folder'){setSelectedFolder(node.id);setExpanded(old=>new Set([...old,node.id]));}
   else openFile(node);
   setCreateKind(null);setCreateName('');setPendingCreate(null);
   setMessage('Private '+node.kind+' created. No publication or executable build was generated.');
  }catch(e){setMessage(presentError(e)+' Check your tree before retrying the same request.');}
  finally{setCreateBusy(false);}
 }
 function cancelCreate(){if(createBusy)return;setPendingCreate(null);setCreateKind(null);setCreateName('');setMessage('');}
 return <section className={'csf-root'+(secondaryId?' is-split':'')} aria-label={'Private files for '+projectTitle} data-studio-file-tree="v111">
  <header className="csf-header">
   <div><p className="csw-eyebrow">PRIVATE SOURCE / FILE SYSTEM V111</p>
    <h2>{projectTitle}</h2>
    <p className="csf-subtitle">Text source files and folders · Stored privately · Never executed or published automatically</p>
   </div>
   <div className="csf-header-actions">
    <button className="csw-action csw-subtle csf-quick-open" type="button" aria-label="Quick open private project files"
     onClick={()=>setPaletteMode('files')}>Quick Open <span>⌘P</span></button>
    <button className="csw-action csw-subtle csf-quick-command" type="button" aria-label="Show project commands"
     onClick={()=>setPaletteMode('commands')}>Commands</button>
    <Link to={'/studio/'+projectId} className="csw-action csw-subtle">Project details ↗</Link>
    <button className="csw-action csw-subtle" type="button" disabled={loading||dirtyIds.size>0}
     onClick={()=>setAttempt(i=>i+1)}>Refresh tree</button>
   </div>
  </header>
  {status!=='draft'&&status!=='changes_requested'&&
   <div className="csf-lock" role="status">Project status: {status.replaceAll('_',' ')}. The file tree is read-only until the existing review flow permits editing.</div>}
  {error&&<div className="csf-error" role="alert">
   <strong>Private source files unavailable.</strong>
   <p>{error}</p>
   <button type="button" className="csw-action" onClick={()=>setAttempt(i=>i+1)}>Retry file service</button>
  </div>}
  {message&&<p role="status" className="csf-message">{message}</p>}
  <div className="csf-shell">
   <aside className="csf-tree" aria-label="Project source Explorer">
    <div className="csf-tree-top">
     <h3>Source Explorer</h3>
     <div className="csf-tree-actions">
      <button type="button" title="Create folder" aria-label="Create folder" disabled={!canEdit||loading||!!error||!!pendingCreate}
       onClick={()=>{setCreateKind('folder');setCreateName('');setMessage('');}}>+ Folder</button>
      <button type="button" title="Create text source file" aria-label="Create text source file" disabled={!canEdit||loading||!!error||!!pendingCreate}
       onClick={()=>{setCreateKind('text');setCreateName('');setMessage('');}}>+ File</button>
      {studioVisualScenesEnabled&&<button type="button" title="Create branching scene" aria-label="Create branching scene"
       disabled={!canEdit||loading||!!error||!!pendingCreate}
       onClick={()=>{setCreateKind('text');setCreateName('scene.anevum');setMessage('');}}>+ Scene</button>}
      {studioInterfaceBuilderEnabled&&<button type="button" title="Create visual interface" aria-label="Create visual interface"
       disabled={!canEdit||loading||!!error||!!pendingCreate}
       onClick={()=>{setCreateKind('text');setCreateName('interface.ui.anevum');setMessage('');}}>+ Interface</button>}
      <button type="button" title="Expand all folders" aria-label="Expand all folders" disabled={loading} onClick={()=>setExpanded(new Set(nodes.filter(n=>n.kind==='folder').map(n=>n.id)))}>Expand</button>
      <button type="button" title="Collapse all folders" aria-label="Collapse all folders" disabled={loading} onClick={()=>setExpanded(new Set())}>Collapse</button>
     </div>
    </div>
    <label className="csf-tree-search"><span aria-hidden="true">⌕</span>
     <input type="search" value={fileQuery} onChange={event=>setFileQuery(event.target.value)}
      placeholder="Search files and folders…" aria-label="Search private project files"/>
    </label>
    <div className="csf-tree-body">
     <button type="button" className={'csf-tree-row csf-tree-root'+(selectedFolder===null&&!activeId?' is-active':'')}
      onClick={()=>{
       if(!confirmLeavingFolder())return;
       setSelectedFolder(null);setActiveId(null);
      }}> 
      <span aria-hidden="true">⌂</span><span className="csf-node-name">{projectTitle} / root</span></button>
     {loading&&<p role="status" className="csf-muted">Loading your private file tree…</p>}
     {!loading&&!error&&nodes.length===0&&<p className="csf-muted">No files yet. Create a folder or text file to begin.</p>}
     {!loading&&!error&&!!visibleIds&&!visibleIds.size&&<p className="csf-muted">No matching source files or folders.</p>}
     {!loading&&!error&&renderTree(null)}
    </div>
    <div className="csf-tree-footer">
     {nodes.length} / 100 entries
     {selectedFolderNode&&<p>Selected folder: {pathLabel(selectedFolderNode,nodes)}</p>}
     {!selectedFolderNode&&<p>Selected location: project root</p>}
     <button type="button" className="csf-trash-toggle" aria-expanded={trashOpen}
      onClick={()=>setTrashOpen(open=>!open)}>{trashOpen?'Hide Trash':'View Trash'}</button>
    </div>
    {trashOpen&&<section className="csf-trash-list" aria-label="Private project Trash">
     <div className="csf-trash-heading">
      <h4>Private Trash</h4>
      <button type="button" onClick={()=>setTrashAttempt(i=>i+1)} disabled={trashLoading||restoringId!==null}>Refresh</button>
     </div>
     <p className="csf-muted">Deleted items retain their last saved source and revisions. Restore them to their original folder; no permanent-delete action is available.</p>
     {trashLoading&&<p className="csf-muted" role="status">Loading deleted project items…</p>}
     {trashError&&<p className="csf-error" role="alert">{trashError}</p>}
     {!trashLoading&&!trashError&&trashNodes.length===0&&<p className="csf-muted">Trash is empty.</p>}
     {!trashLoading&&trashNodes.map(node=><div className="csf-trash-item" key={node.id}>
      <div><strong>{node.name}</strong>
       <span>{node.kind==='folder'?'Folder':'Text file'} · Revision {node.revision}</span>
      </div>
      <button type="button" disabled={!canEdit||restoringId!==null}
       aria-label={'Restore '+node.name} onClick={()=>void restore(node)}>
       {restoringId===node.id?'Restoring…':'Restore'}
      </button>
     </div>)}
    </section>}
    {createKind&&<form className="csf-create" onSubmit={e=>void create(e)}>
     <label htmlFor={'csf-name-'+projectId}>New {createKind==='folder'?'folder':'text file'} in {selectedFolderNode?.name||'project root'}</label>
     <input id={'csf-name-'+projectId} autoFocus required maxLength={80} value={createName}
      disabled={createBusy||!!pendingCreate} placeholder={createKind==='folder'?'Scenes':'intro.md'}
      onChange={e=>setCreateName(e.target.value)}/>
     {pendingCreate&&<p className="csf-muted">The previous creation result is unconfirmed. Retry using the same request identifier or inspect the file list first.</p>}
     <div className="csf-create-buttons">
      <button className="csw-action csw-strong" type="submit" disabled={createBusy||!createName.trim()}>
       {createBusy?'Creating…':pendingCreate?'Retry same request':'Create'}
      </button>
      <button className="csw-action csw-subtle" type="button" disabled={createBusy} onClick={cancelCreate}>Cancel</button>
     </div>
    </form>}
   </aside>
   <main className="csf-work-area">
    <nav className="csf-tabs" aria-label="Open source file tabs">
     {openIds.map(id=>{
      const node=nodes.find(n=>n.id===id);
      return <div className={'csf-tab'+(id===activeId?' is-active':'')} key={id}>
       <button type="button" aria-current={id===activeId?'page':undefined} onClick={()=>activateTab(id)}>
        <StudioFileIconV119 name={node?.name||'Unavailable file'}/>{node?.name||'Unavailable file'}{dirtyIds.has(id)?' ●':''}</button>
       <button className="csf-tab-close" type="button" aria-label={'Close '+(node?.name||'source file')}
        onClick={()=>closeFile(id)}>×</button>
      </div>;
     })}
     {!!openIds.length&&<button className="csf-close-all" type="button" onClick={closeAllFiles}>Close all</button>}
     {activeId&&<button type="button" className="csf-split-toggle" aria-label={secondaryId?'Return to single editor':'Split open source editors'}
      aria-pressed={!!secondaryId} disabled={!secondaryId&&openIds.length<2}
      title={secondaryId?'Return to single editor':'Show two already-open source files'}
      onClick={toggleSplit}><Icon name="columns" size={15}/>{secondaryId?'Single view':'Split view'}</button>}
     {secondaryId&&<label className="csf-split-picker">Right pane
      <select aria-label="Secondary editor file" value={secondaryId} onChange={event=>setSplitId(event.target.value)}>
       {openIds.filter(id=>id!==activeId).map(id=>{
        const name=nodes.find(n=>n.id===id)?.name||'Unavailable file';
        return <option key={id} value={id}>{name}</option>;
       })}
      </select></label>}
    </nav>
    {secondaryId&&<p className="csf-split-focus-note" role="status">
     <Icon name="columns" size={14}/> Split focus · Explorer hidden. Use Quick Open for files or Single view to return. Each file saves independently.
    </p>}
    {!activeId&&selectedFolderNode&&<FolderInspectorV111 key={selectedFolderNode.id}
     projectId={projectId} folder={selectedFolderNode} nodes={nodes} editable={canEdit}
     onUpdated={upsert} onMessage={setMessage} onDeleted={markedDeleted} onDirty={dirty=>setDirty('folder:'+selectedFolderNode.id,dirty)}/>}
    {!activeId&&!selectedFolderNode&&<div className="csf-welcome">
     <span className="csf-orbit" aria-hidden="true">◇</span>
     <h3>Project source workspace</h3>
     <p>Open a text file from Explorer, create a folder, or start a new file. All edits are saved manually to a private revision.</p>
     <p className="csf-muted">This is private text storage, not an executable app runtime. The existing Studio editor, uploader, and moderation path remain separate.</p>
    </div>}
    <div className={'csf-editor-decks'+(secondaryId?' is-split':'')} hidden={!activeId} aria-label="Source editor panes">
     {openIds.map(id=><div key={id} className={'csf-editor-mount'+(id===activeId?' is-primary':id===secondaryId?' is-secondary':'')}
      hidden={id!==activeId&&id!==secondaryId}>
      {secondaryId&&<div className="csf-pane-heading"><Icon name="file-code" size={14}/>
       <strong>{nodes.find(node=>node.id===id)?.name||'Source file'}</strong>
       <span>{id===activeId?'PRIMARY':'SECONDARY'} · independent draft</span></div>}
      <SourceEditorV111 projectId={projectId} nodeId={id} nodes={nodes} editable={canEdit}
       onDirty={dirty=>setDirty(id,dirty)} onUpdated={upsert} onDeleted={markedDeleted}/>
     </div>)}
    </div>

   </main>
  </div>
  <footer className="csf-status">PRIVATE DRAFT · {dirtyIds.size} UNSAVED CHANGE{dirtyIds.size===1?'':'S'} · NO AUTO-PUBLISH · FILE TREE {studioFileTreeEnabled?'ENABLED':'INACTIVE'}{!visible?' · BACKGROUND TAB':''}</footer>
  {paletteMode&&<StudioCommandPaletteV120 title={'Quick Open · '+projectTitle}
   initialMode={paletteMode} items={paletteItems} onChoose={choosePalette}
   onClose={()=>setPaletteMode(null)}/>}
 </section>;
}

function FolderInspectorV111({projectId,folder,nodes,editable:canEdit,onUpdated,onMessage,onDirty,onDeleted}:{
 projectId:string;folder:StudioFileNode;nodes:StudioFileNode[];editable:boolean;
 onUpdated:(node:StudioFileNode)=>void;onMessage:(text:string)=>void;
 onDirty:(dirty:boolean)=>void;onDeleted:(node:StudioFileNode)=>void
}){
 const [name,setName]=useState(folder.name);
 const [parentId,setParentId]=useState<string|null>(folder.parentId);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const dirty=name!==folder.name||parentId!==folder.parentId;
 const dirtyCallback=useRef(onDirty);dirtyCallback.current=onDirty;
 useEffect(()=>{dirtyCallback.current(dirty);},[dirty]);
 useEffect(()=>()=>{dirtyCallback.current(false);},[]);
 const children=nodes.filter(n=>n.parentId===folder.id);
 const descendants=new Set([folder.id]);
 for(let i=0;i<100;i++){
  const prior=descendants.size;for(const n of nodes)if(n.parentId&&descendants.has(n.parentId))descendants.add(n.id);
  if(descendants.size===prior)break;
 }
 const parentOptions=nodes.filter(n=>n.kind==='folder'&&!descendants.has(n.id));
 async function moveToTrash(){
  if(!canEdit||busy||dirty||children.length>0)return;
  if(!window.confirm('Move empty folder '+folder.name+' to private Trash? It can be restored later.'))return;
  setBusy(true);setError('');
  try{
   const deleted=await studioFileUpdate(projectId,folder.id,{revision:folder.revision,name:folder.name,parentId:folder.parentId,content:'',deleted:true});
   onDeleted(deleted);
  }catch(e){setError(presentError(e)+' The folder remains visible until deletion is confirmed.');}
  finally{setBusy(false);}
 }
 async function save(){
  if(!canEdit||busy)return;setBusy(true);setError('');
  try{
   const updated=await studioFileUpdate(projectId,folder.id,{revision:folder.revision,name:name.trim(),parentId,content:'',deleted:false});
   onUpdated(updated);onMessage('Folder details saved as revision '+updated.revision+'.');
  }catch(e){setError(presentError(e));}
  finally{setBusy(false);}
 }
 return <section className="csf-folder-inspector" aria-label={'Folder '+folder.name}>
  <p className="csw-eyebrow">FOLDER INSPECTOR</p><h3>{folder.name}</h3>
  <p className="csf-muted">{children.length} direct children · Revision {folder.revision}</p>
  <label>Folder name<input type="text" value={name} maxLength={80} disabled={!canEdit||busy} onChange={e=>setName(e.target.value)}/></label>
  <label>Parent folder
   <select disabled={!canEdit||busy} value={parentId||''} onChange={e=>setParentId(e.target.value||null)}>
    <option value="">Project root</option>
    {parentOptions.map(n=><option key={n.id} value={n.id}>{pathLabel(n,nodes)}</option>)}
   </select>
  </label>
  {error&&<p className="csf-error" role="alert">{error}</p>}
  <div className="csf-toolbar">
   <button type="button" className="csw-action csw-strong" disabled={!canEdit||busy||name.trim().length===0||!dirty}
    onClick={()=>void save()}>Save folder changes</button>
   <button type="button" className="csw-action csw-subtle" disabled={busy} onClick={()=>{setName(folder.name);setParentId(folder.parentId);setError('');}}>Discard changes</button>
   <button type="button" className="csw-action csw-danger" disabled={!canEdit||busy||dirty||children.length>0}
    onClick={()=>void moveToTrash()}>Move empty folder to Trash</button>
  </div>
  <p className="csf-muted">Only empty folders can move to Trash. Restore them before restoring their deleted children. Moving a folder into itself or its children is prohibited.</p>
 </section>;
}

function SourceEditorV111({projectId,nodeId,nodes,editable:canEdit,onDirty,onUpdated,onDeleted}:{
 projectId:string;nodeId:string;nodes:StudioFileNode[];editable:boolean;
 onDirty:(dirty:boolean)=>void;onUpdated:(node:StudioFileNode)=>void;onDeleted:(node:StudioFileNode)=>void
}){
 const [base,setBase]=useState<StudioFileNode|null>(null);
 const [content,setContent]=useState('');
 const [presentation,setPresentation]=useState<'text'|'visual'|'interface'>('text');
 const [name,setName]=useState('');
 const [parentId,setParentId]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [versions,setVersions]=useState<StudioFileVersion[]|null>(null);
 const [historyError,setHistoryError]=useState('');
 const [historyLoading,setHistoryLoading]=useState(false);
 const dirty=!!base&&(content!==(base.content||'')||name!==base.name||parentId!==base.parentId);
 const activeDirty=useRef(dirty);
 activeDirty.current=dirty;
 const dirtyCallback=useRef(onDirty);
 dirtyCallback.current=onDirty;
 useEffect(()=>{dirtyCallback.current(dirty);},[dirty]);
 useEffect(()=>()=>{dirtyCallback.current(false);},[]);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');
  studioFileGet(projectId,nodeId,controller.signal)
   .then(node=>{
    if(controller.signal.aborted)return;
    if(node.kind!=='text'||node.deletedAt!==null)throw Error('This file is no longer editable.');
    setBase(node);setContent(node.content||'');setName(node.name);setParentId(node.parentId);
    setPresentation(studioInterfaceBuilderEnabled&&
     (node.name.toLowerCase().endsWith('.ui.anevum')||(node.content||'').startsWith(UI_PREFIX))?'interface':
     studioVisualScenesEnabled&&!isWorldSource(node.name,node.content||'')&&
      (node.name.toLowerCase().endsWith('.anevum')||(node.content||'').startsWith(PREFIX))?'visual':'text');
   })
   .catch(e=>{if(!controller.signal.aborted)setError(presentError(e));})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[projectId,nodeId]);
 const byteCount=new TextEncoder().encode(content).length;
 const canInterface=studioInterfaceBuilderEnabled&&
  (name.toLowerCase().endsWith('.ui.anevum')||content.startsWith(UI_PREFIX));
 const canVisual=studioVisualScenesEnabled&&
  !canInterface&&!isWorldSource(name,content)&&(name.toLowerCase().endsWith('.anevum')||content.startsWith(PREFIX));
 async function save(){
  if(!base||!canEdit||!dirty||busy||byteCount>32768)return;
  setBusy(true);setError('');setMessage('');
  try{
   const node=await studioFileUpdate(projectId,nodeId,{revision:base.revision,name:name.trim(),parentId,content,deleted:false});
   setBase(node);setName(node.name);setContent(node.content||'');setParentId(node.parentId);
   onUpdated(node);setMessage('Saved private revision '+node.revision+'.');setVersions(null);
  }catch(e){setError(presentError(e)+' Unsaved edits remain in this tab. Inspect the latest version before retrying.');}
  finally{setBusy(false);}
 }
 async function moveToTrash(){
  if(!base||!canEdit||dirty||busy)return;
  if(!window.confirm('Move '+base.name+' to private Trash? You can restore the last saved source later.'))return;
  setBusy(true);setError('');
  try{
   const deleted=await studioFileUpdate(projectId,nodeId,{revision:base.revision,name:base.name,parentId:base.parentId,content:base.content||'',deleted:true});
   onDeleted(deleted);
  }catch(e){setError(presentError(e)+' The file remains open until the server confirms deletion.');}
  finally{setBusy(false);}
 }
 async function refresh(){
  if(!window.confirm(dirty?'Discard unsaved source and reload the latest server version?':'Reload the latest saved source?'))return;
  setLoading(true);setError('');setMessage('');
  try{
   const node=await studioFileGet(projectId,nodeId);
   setBase(node);setContent(node.content||'');setName(node.name);setParentId(node.parentId);
   onUpdated(node);setVersions(null);
  }catch(e){setError(presentError(e));}
  finally{setLoading(false);}
 }
 async function loadVersions(){
  if(!base)return;setHistoryLoading(true);setHistoryError('');
  try{setVersions(await studioFileVersions(projectId,nodeId));}
  catch(e){setHistoryError(presentError(e));}
  finally{setHistoryLoading(false);}
 }
 function stageVersion(version:StudioFileVersion){
  if(activeDirty.current&&!window.confirm('Replace the current unsaved source with revision '+version.revision+'?'))return;
  setContent(version.content);setMessage('Loaded revision '+version.revision+' into an unsaved draft. Save to create a new revision.');
 }
 const siblingFolders=nodes.filter(n=>n.kind==='folder');
 return <section className="csf-editor" aria-label="Private source text editor">
  <div className="csf-editor-title">
   <div><p className="csw-eyebrow">SOURCE FILE / PRIVATE DRAFT</p>
    <h3>{base?.name||'Opening file…'}{dirty?' · Unsaved':''}</h3>
    {base&&<p className="csf-muted">{pathLabel(base,nodes)} · Revision {base.revision}</p>}
   </div>
   <div className="csf-toolbar">
    <button type="button" className="csw-action csw-strong" disabled={!canEdit||loading||busy||!dirty||byteCount>32768}
     onClick={()=>void save()}>{busy?'Saving…':'Save revision'}</button>
    <button type="button" className="csw-action csw-subtle" disabled={!base||busy} onClick={()=>void refresh()}>Reload</button>
    <button type="button" className="csw-action csw-subtle" disabled={!base||historyLoading} onClick={()=>void loadVersions()}>History</button>
    <button type="button" className="csw-action csw-danger" disabled={!base||!canEdit||loading||busy||dirty}
     onClick={()=>void moveToTrash()}>Move to Trash</button>
   </div>
  </div>
  {loading&&<p role="status" className="csf-muted">Retrieving this file from your private Studio…</p>}
  {error&&<p role="alert" className="csf-error">{error}</p>}
  {message&&<p role="status" className="csf-message">{message}</p>}
  {base&&!loading&&<>
   <div className="csf-metadata">
    <label>File name<input maxLength={80} value={name} disabled={!canEdit||busy} onChange={e=>setName(e.target.value)}/></label>
    <label>Folder
     <select value={parentId||''} disabled={!canEdit||busy} onChange={e=>setParentId(e.target.value||null)}>
      <option value="">Project root</option>{siblingFolders.map(folder=><option key={folder.id} value={folder.id}>{pathLabel(folder,nodes)}</option>)}
     </select>
    </label>
   </div>
   {(canVisual||canInterface)&&<div className="csf-presentation-switch" role="group" aria-label="Source editor presentation">
    {canVisual&&<button type="button" aria-pressed={presentation==='visual'} onClick={()=>setPresentation('visual')}>Visual scene</button>}
    {canInterface&&<button type="button" aria-pressed={presentation==='interface'} onClick={()=>setPresentation('interface')}>Interface builder</button>}
    <button type="button" aria-pressed={presentation==='text'} onClick={()=>setPresentation('text')}>Source text</button>
   </div>}
   {canInterface&&presentation==='interface'?
    <StudioInterfaceBuilderV113 raw={content} fileName={name} resetToken={nodeId+':'+base.revision}
     readOnly={!canEdit||busy} onChange={setContent}/>:
    canVisual&&presentation==='visual'?
    <StudioSceneComposerV112 raw={content} fileName={name} resetToken={nodeId+':'+base.revision}
     readOnly={!canEdit||busy} onChange={setContent}/>:
    <>
   <label className="csf-source-label" htmlFor={'source-'+nodeId}>Text source</label>
   <StudioCodeEditorV119 id={'source-'+nodeId} className="csf-source" fileName={name}
    value={content} disabled={!canEdit||busy} onChange={setContent}
    onSave={()=>void save()} saveDisabled={!base||!dirty||busy||byteCount>32768}
    maxLength={32768} ariaDescribedBy={'source-status-'+nodeId}
    status={dirty?'Unsaved private draft':'Confirmed revision '+base.revision}/>
    </>}
   <div className="csf-editor-foot" id={'source-status-'+nodeId}>
    <span>{byteCount.toLocaleString()} / 32,768 UTF-8 bytes</span>
    <span>{dirty?'Unsaved local draft':'Matches last confirmed saved revision'}</span>
   </div>
   {byteCount>32768&&<p className="csf-error" role="alert">The source exceeds the server file limit. Shorten it before saving.</p>}
   {historyError&&<p className="csf-error" role="alert">{historyError}</p>}
   {versions&&<section className="csf-history" aria-label="Previous source versions">
    <h4>Confirmed source history</h4>
    {versions.map(version=><div key={version.revision}>
     <span>Revision {version.revision} · {new Date(version.changed_at*1000).toLocaleString()}</span>
     <button type="button" disabled={!canEdit||busy} onClick={()=>stageVersion(version)}>Load as draft</button>
    </div>)}
    <p className="csf-muted">Loading a previous version never changes the server until you explicitly save the draft.</p>
   </section>}
  </>}
 </section>;
}
