import {useEffect,useRef,useState,type ComponentType,type ReactNode} from 'react';
import {strToU8} from 'fflate';
import {sourceArchive,playableSourceArchive,localOnlySourcePaths,safeSourcePath,SOURCE_LIMITS} from './source-archive-v136';
import {renameLocalSource,removeLocalSource} from './workbench-file-ops-v136';
import {Icon} from '../components/Icons';
import {FileGlyphV136017,FolderGlyphV136017,fileKind} from './FileGlyphV136017';
import {editorLanguage} from '../../../source-ide/language-v119.mjs';
import type {MonacoSourceProps} from './MonacoSourceV136';
import './artifact-workbench-v136.css';
const MAX_FILE=SOURCE_LIMITS.file,MAX_TOTAL=SOURCE_LIMITS.total,MAX_FILES=SOURCE_LIMITS.count;
const safePath=safeSourcePath;
const initialFiles:Record<string,string>={
 'index.html':'<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Untitled creation</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <main><h1>Your next creation.</h1><p>Make something worth continuing.</p></main>\n  <script src="main.js"></script>\n</body>\n</html>\n',
 'styles.css':':root { color-scheme: dark; font-family: system-ui, sans-serif; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #06101d; color: #e9f7ff; }\nmain { max-width: 40rem; padding: 2rem; }\nh1 { color: #8bdfff; }\n',
 'main.js':'"use strict";\n// Write browser code here. Run only through the private playtest sandbox.\n'
};

/** Folder rows come only from real, safe, local source names; ZIP bytes and
 * publishing ownership remain with the existing source archive and uploader. */
type ExplorerNode={path:string;name:string;folder:boolean;children:ExplorerNode[]};
function sourceExplorerTree(paths:string[]):ExplorerNode[]{
 const root:ExplorerNode={path:'',name:'',folder:true,children:[]};
 for(const path of paths){
  const parts=path.split('/');let parent=root;
  for(let index=0;index<parts.length;index++){
   const subpath=parts.slice(0,index+1).join('/');
   let node=parent.children.find(entry=>entry.path===subpath);
   if(!node){node={path:subpath,name:parts[index],folder:index<parts.length-1,children:[]};parent.children.push(node);}
   parent=node;
  }
 }
 const sort=(children:ExplorerNode[])=>{
  children.sort((a,b)=>(Number(b.folder)-Number(a.folder))||a.name.localeCompare(b.name));
  children.forEach(child=>sort(child.children));
 };
 sort(root.children);return root.children;
}
/** Original Studio V119 language grammar is reused from PR #709's source.
 * This bounded workbench composes a local archive for the existing uploader;
 * it does not activate V111 file APIs, execute code, persist source or publish. */
export function ArtifactWorkbenchV136({disabled,onPackage,onDirty}:{disabled:boolean;onPackage:(file:File)=>void;onDirty:()=>void}){
 const [files,setFiles]=useState<Record<string,string>>(()=>({...initialFiles})),[active,setActive]=useState('index.html');
 const [name,setName]=useState(''),[note,setNote]=useState(''),[dirty,setDirty]=useState(true),[plain,setPlain]=useState(()=>matchMedia('(max-width: 767px)').matches);
 const [Editor,setEditor]=useState<ComponentType<MonacoSourceProps>|null>(null),[editorError,setEditorError]=useState(false);
 const [inspector,setInspector]=useState(true),importVersion=useRef(0);
 const [quickOpen,setQuickOpen]=useState(false),[fileQuery,setFileQuery]=useState(''),[fileChoice,setFileChoice]=useState(0);
 const [cursor,setCursor]=useState({line:1,column:1});
 const [renamingFile,setRenamingFile]=useState<string|null>(null),[renameDraft,setRenameDraft]=useState('');
 const [deletingFile,setDeletingFile]=useState<string|null>(null);
 const quickInput=useRef<HTMLInputElement>(null),quickButton=useRef<HTMLButtonElement>(null);
  const [collapsedFolders,setCollapsedFolders]=useState<Set<string>>(()=>new Set());
 useEffect(()=>{let alive=true;if(!plain)void import('./MonacoSourceV136').then(m=>{if(alive)setEditor(()=>m.default)}).catch(()=>{if(alive)setEditorError(true)});return()=>{alive=false}},[plain]);
 useEffect(()=>()=>{importVersion.current++},[]);
 const entries=Object.entries(files),total=entries.reduce((n,[,text])=>n+strToU8(text).length,0);
  const explorerTree=sourceExplorerTree(entries.map(([path])=>path));
 const matchingPaths=entries.map(([path])=>path).filter(path=>path.toLowerCase().includes(fileQuery.trim().toLowerCase()));
 useEffect(()=>{if(quickOpen)quickInput.current?.focus()},[quickOpen]);
 function closeQuickOpen(){setQuickOpen(false);requestAnimationFrame(()=>quickButton.current?.focus())}
 function selectFile(path:string){
  setActive(path);setRenamingFile(null);setDeletingFile(null);
 }
 function choosePath(path:string){
  selectFile(path);
  setCollapsedFolders(previous=>new Set([...previous].filter(folder=>!path.startsWith(folder+'/'))));
  closeQuickOpen();
 }
 const localOnlyPaths=localOnlySourcePaths(files);
 const problems:string[]=[];
 if(!('index.html' in files))problems.push('A root index.html entrypoint is required.');
 for(const [path,text] of entries){
  if(path.endsWith('.json'))try{JSON.parse(text)}catch{problems.push(path+': invalid JSON.')}
  if(/(?:https?:\/\/|(?:src|href)\s*=\s*['"]\/\/)/i.test(text))problems.push(path+': review external URL references; releases must be self-contained.');
 }
 function change(path:string,value:string){
  if(disabled)return;importVersion.current++;
  if(strToU8(value).length>MAX_FILE){setNote('Each source file is limited to 128 KiB in this workbench.');return;}
  setFiles(current=>({...current,[path]:value}));setDirty(true);setNote('');onDirty();
 }
 function add(){if(disabled)return;const path=name.trim();
  if(!safePath(path)){setNote('Use a relative HTML, CSS, JS, JSON, Markdown or text path, such as assets/data.json.');return;}
  if(path in files){setActive(path);setNote('That file already exists.');return;}
  if(entries.length>=MAX_FILES){setNote('This local workbench supports up to 24 source files.');return;}
  setFiles(current=>({...current,[path]:''}));selectFile(path);setName('');setDirty(true);onDirty();
 }
 async function importFiles(selected:FileList|null){
  if(disabled||!selected)return;const version=++importVersion.current;
  try{
   const chosen=Array.from(selected);
   if(chosen.length>MAX_FILES||chosen.some(f=>!safePath(f.name)||f.size>MAX_FILE))throw Error('Select up to 24 supported text files, each at most 128 KiB.');
   const incoming=await Promise.all(chosen.map(async f=>[f.name,await f.text()] as const));
   if(version!==importVersion.current)return;
   const next={...files,...Object.fromEntries(incoming)};
   if(Object.keys(next).length>MAX_FILES||Object.values(next).reduce((n,t)=>n+strToU8(t).length,0)>MAX_TOTAL)throw Error('The local source workspace is limited to 1 MiB and 24 files.');
   setFiles(next);selectFile(incoming[0]?.[0]||active);setDirty(true);onDirty();setNote('Files read locally. Nothing was uploaded.');
  }catch(error){if(version===importVersion.current)setNote(error instanceof Error?error.message:'Files could not be opened.');}
 }
 function packageSource(){
  if(disabled||!files['index.html']||total>MAX_TOTAL)return;
  try{
   const {archive,skipped}=playableSourceArchive(files);
   onPackage(archive);setDirty(false);
   setNote((skipped.length?'Playable ZIP excludes local-only notes: '+skipped.join(', ')+'. Download complete source separately. ':'')+
    'The existing compatibility checks, rights confirmation and private-upload controls still apply.');
  }catch(error){setNote(error instanceof Error?error.message:'Playable source archive could not be prepared.')}
 }
 function downloadSource(){
  if(disabled)return;
  try{
   const archive=sourceArchive(files),url=URL.createObjectURL(archive),anchor=document.createElement('a');
   anchor.href=url;anchor.download='continuance-complete-source.zip';anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNote('Complete source downloaded, including local-only notes. This did not upload or prepare a playable build.');
  }catch(error){setNote(error instanceof Error?error.message:'Full source could not be downloaded.')}
 }
 function beginRename(){
  if(disabled||active==='index.html')return;
  setDeletingFile(null);setRenamingFile(active);setRenameDraft(active);setNote('');
 }
 function commitRename(){
  if(disabled||!renamingFile)return;
  try{
   const target=renameDraft.trim(),updated=renameLocalSource(files,renamingFile,target,safePath);
   setRenamingFile(null);
   if(updated===files)return;
   importVersion.current++;
   setFiles(updated);selectFile(target);
   setCollapsedFolders(previous=>new Set([...previous].filter(folder=>!target.startsWith(folder+'/'))));
   setDirty(true);onDirty();
   setNote('Local source renamed. Review relative imports or links; any previously prepared archive is invalid.');
  }catch(error){setNote(error instanceof Error?error.message:'Could not rename this local source.')}
 }
 function commitRemoval(){
  if(disabled||!deletingFile)return;
  try{
   const updated=removeLocalSource(files,deletingFile);
   importVersion.current++;
   setFiles(updated);selectFile('index.html');
   setDirty(true);onDirty();
   setNote('Local source removed from this session. Any previously prepared archive is invalid.');
  }catch(error){setNote(error instanceof Error?error.message:'Could not remove this local source.')}
 }
 function toggleFolder(path:string){
   setCollapsedFolders(previous=>{
    const next=new Set(previous);
    if(next.has(path))next.delete(path);else next.add(path);
    return next;
   });
  }
  function explorerRow(node:ExplorerNode,depth:number):ReactNode{
   if(node.folder){
    const expanded=!collapsedFolders.has(node.path);
    return <div className="p136017-tree-group" key={node.path}>
     <button type="button" className="p136017-tree-folder" aria-expanded={expanded}
      aria-label={'Folder '+node.name} onClick={()=>toggleFolder(node.path)}
      style={{paddingLeft:8+Math.min(depth,5)*13}}>
      <span className="p136017-tree-chevron" aria-hidden="true"/>
      <FolderGlyphV136017 open={expanded}/>
      <span className="p136017-tree-name">{node.name}</span>
     </button>
     {expanded&&node.children.map(child=>explorerRow(child,depth+1))}
    </div>;
   }
   return <button key={node.path} type="button" className="p136017-tree-file"
    aria-label={node.path} title={node.path} aria-pressed={node.path===active}
    onClick={()=>selectFile(node.path)}
    style={{paddingLeft:8+Math.min(depth,5)*13}}>
    <span className={'p136-file-mark is-'+fileKind(node.path)} aria-hidden="true"><FileGlyphV136017 path={node.path}/></span>
    <span className="p136017-tree-name">{node.name}</span>
   </button>;
  }
  return <section className="p136-workbench" aria-label="Artifact source workbench" data-artifact-workbench="v136.011"
   onKeyDownCapture={e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='p'){
    e.preventDefault();setFileQuery('');setFileChoice(0);setQuickOpen(true);
   }}}>
  <header className="p136-workbench-head"><div><span>CONTINUANCE / ARTIFACT WORKBENCH</span><h2>Make the source.</h2></div><span className="p136-source-state">{dirty?'LOCAL CHANGES':'ARCHIVE PREPARED'}</span></header>
  <div className="p136017-source-functionbar" aria-hidden="true">
   <span className="p136017-functionmark">SOURCE / LOCAL</span>
   <span>FILES · VALIDATION · ARCHIVE</span>
   <span>01 / WORKBENCH</span>
  </div>
  <div className="p136-workbench-command">
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={()=>packageSource()}><Icon name="create" size={16}/> Prepare build archive</button>
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={downloadSource}>Download complete source</button>
   <label className="p136-source-import">Open text files<input disabled={disabled} type="file" multiple accept=".html,.css,.js,.json,.txt,.md" onChange={e=>void importFiles(e.target.files)}/></label>
   <button type="button" aria-pressed={plain} onClick={()=>setPlain(v=>!v)}>Accessible text editor</button>
   <button type="button" aria-expanded={inspector} onClick={()=>setInspector(v=>!v)}>Inspector</button>
   <button ref={quickButton} type="button" aria-expanded={quickOpen} aria-controls="p136-quick-open" aria-keyshortcuts="Control+p Meta+p"
    onClick={()=>{setFileQuery('');setFileChoice(0);setQuickOpen(v=>!v)}}>Open file…</button>
  </div>
  {quickOpen&&<div className="p136-source-quick-open" id="p136-quick-open">
   <label htmlFor="p136-file-query">Find a local source file <span>↑ ↓ to choose · Enter to open · Esc to close</span></label>
   <input ref={quickInput} id="p136-file-query" type="search" value={fileQuery} autoComplete="off"
    role="combobox" aria-expanded="true" aria-controls="p136-file-matches" aria-autocomplete="list"
    aria-activedescendant={matchingPaths.length?'p136-file-choice-'+fileChoice:undefined}
    onChange={e=>{setFileQuery(e.target.value);setFileChoice(0)}}
    onKeyDown={e=>{
     if(e.key==='Escape'){e.preventDefault();closeQuickOpen()}
     else if(e.key==='Enter'&&matchingPaths[fileChoice]){e.preventDefault();choosePath(matchingPaths[fileChoice])}
     else if(['ArrowDown','ArrowUp'].includes(e.key)&&matchingPaths.length){e.preventDefault();setFileChoice(i=>(i+(e.key==='ArrowDown'?1:-1)+matchingPaths.length)%matchingPaths.length)}
    }}/>
   <div id="p136-file-matches" role="listbox" aria-label="Matching local source files">
    {matchingPaths.map((path,index)=><button key={path} type="button" role="option" tabIndex={-1}
     id={'p136-file-choice-'+index} aria-selected={index===fileChoice} onClick={()=>choosePath(path)}>
     <FileGlyphV136017 path={path}/><span>{path}</span><small>{editorLanguage(path)}</small></button>)}
   </div>
   {matchingPaths.length===0&&<p role="status">No matching local source files.</p>}
   <button type="button" onClick={closeQuickOpen}>Close file search</button>
  </div>}
  {localOnlyPaths.length>0&&<p className="p136017-local-only-note" role="status">
    LOCAL NOTES / {localOnlyPaths.join(', ')} — kept in complete source downloads, excluded from playable ZIPs.
   </p>}
   <div className="p136-workbench-layout" data-inspector={inspector}>
   <aside className="p136-source-explorer" aria-label="Local source files"><strong>PROJECT FILES</strong>
    <div className="p136-source-add"><label className="visually-hidden" htmlFor="p136-source-new">New file path</label><input id="p136-source-new" placeholder="assets/data.json" value={name} onChange={e=>setName(e.target.value)} maxLength={120} disabled={disabled}/><button type="button" onClick={add} disabled={disabled} aria-label="Create source file">+</button></div>
    <nav aria-label="Source file explorer" className="p136017-source-tree">{explorerTree.map(node=>explorerRow(node,0))}</nav>
   </aside>
   <div className="p136-source-stage">
    <div className="p136017-source-ledge">
     <span>EDITOR / {active}</span>
     <div className="p136017-file-operations" role="group" aria-label="Selected local source actions">
      <button type="button" disabled={disabled||active==='index.html'} onClick={beginRename}>Rename file</button>
      <button type="button" disabled={disabled||active==='index.html'}
       onClick={()=>{setRenamingFile(null);setDeletingFile(active);setNote('')}}>Remove file</button>
     </div><span>LOCAL · NOT EXECUTED</span>
    </div>
    {renamingFile&&<form className="p136017-file-mutation" onSubmit={event=>{event.preventDefault();commitRename()}}>
     <label htmlFor="p136017-file-rename">Rename local source: {renamingFile}</label>
     <input id="p136017-file-rename" autoFocus autoComplete="off" spellCheck={false} maxLength={120}
      value={renameDraft} onChange={event=>setRenameDraft(event.target.value)}
      onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setRenamingFile(null)}}}/>
     <button type="submit" disabled={disabled}>Save file path</button>
     <button type="button" onClick={()=>setRenamingFile(null)}>Cancel rename</button>
    </form>}
    {deletingFile&&<div className="p136017-file-mutation" role="group" aria-label="Confirm local file removal">
     <p>Remove {deletingFile} from this in-memory workspace? This action has no undo. Export source first if needed.</p>
     <button type="button" disabled={disabled} onClick={commitRemoval}>Confirm remove file</button>
     <button type="button" onClick={()=>setDeletingFile(null)}>Keep file</button>
    </div>}
    <div className="p136-source-tabs" role="tablist" aria-label="Open source files">{entries.map(([path])=><button key={path} type="button" role="tab" id={'p136-source-tab-'+path} aria-selected={path===active} aria-controls="p136-source-panel" tabIndex={path===active?0:-1}
     onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=entries.findIndex(([p])=>p===active),next=e.key==='Home'?0:e.key==='End'?entries.length-1:(i+(e.key==='ArrowLeft'?-1:1)+entries.length)%entries.length;selectFile(entries[next][0]);requestAnimationFrame(()=>document.getElementById('p136-source-tab-'+entries[next][0])?.focus())}}
     onClick={()=>selectFile(path)}><FileGlyphV136017 path={path}/><span>{path}</span></button>)}</div>
    <div id="p136-source-panel" role="tabpanel" aria-labelledby={'p136-source-tab-'+active}>
     {!plain&&Editor&&!editorError?<Editor files={files} active={active} disabled={disabled} onChange={change} onCursor={(line,column)=>setCursor({line,column})}/>:<label className="p136-source-fallback"><span className="visually-hidden">Edit source {active}</span><textarea spellCheck={false} autoCapitalize="off" autoCorrect="off" value={files[active]} onChange={e=>change(active,e.target.value)} disabled={disabled}/></label>}
    </div>
    <footer className="p136-source-status">{!plain&&Editor&&!editorError&&<span data-source-cursor>Ln {cursor.line}, Col {cursor.column}</span>}<span>{editorLanguage(active).toUpperCase()}</span><span>{files[active].split('\n').length} lines</span><span>{strToU8(files[active]).length.toLocaleString()} bytes</span><span>{plain||editorError?'TEXT EDITOR':Editor?'MONACO':'LOADING MONACO'}</span></footer>
   </div>
   {inspector&&<aside className="p136-source-inspector" aria-label="Source and build diagnostics"><strong>BUILD INSPECTOR</strong><span className="p136017-inspector-disclosure">VALIDATION / LOCAL SOURCE</span><dl><dt>Source files</dt><dd>{entries.length} / {MAX_FILES}</dd><dt>Expanded text</dt><dd>{(total/1024).toFixed(1)} KiB / 1024 KiB</dd><dt>Entrypoint</dt><dd>{files['index.html']?'index.html':'Missing'}</dd><dt>Publication</dt><dd>Private upload required</dd><dt>Local-only source notes</dt><dd>{localOnlyPaths.length}</dd></dl><h3>Local findings</h3>{problems.length?<ul>{problems.map(p=><li key={p}>{p}</li>)}</ul>:<p>No issues found by the available text checks.</p>}<p>JavaScript is edited as text. This view does not compile, run, save to your account or publish source.</p><h3>Live preview</h3><p>Prepare the archive, then use the existing private playtest. Executable previews stay in ANEVUM’s isolated runtime.</p></aside>}
  </div>
  {note&&<p className="p136-source-notice" role="status">{note}</p>}
  <p className="p136-source-privacy">Source stays in this workspace’s memory until you prepare and explicitly upload an archive. Export before leaving; signing out or changing routes clears it.</p>
 </section>;
}
