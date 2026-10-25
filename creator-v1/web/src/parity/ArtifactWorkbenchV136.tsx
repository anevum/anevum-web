import {useEffect,useMemo,useRef,useState,type ComponentType,type ReactNode} from 'react';
import {strToU8} from 'fflate';
import {sourceArchive,playableSourceArchive,localOnlySourcePaths,safeSourcePath,SOURCE_LIMITS} from './source-archive-v136';
import {renameLocalSource,removeLocalSource,sourceReferencesToReview,unresolvedLocalSourceLinks,sourcePreviewDocument} from './workbench-file-ops-v136';
import {Icon} from '../components/Icons';
import {FileGlyphV136017,FolderGlyphV136017,fileKind} from './FileGlyphV136017';
import {editorLanguage} from '../../../source-ide/language-v119.mjs';
import type {MonacoSourceProps} from './MonacoSourceV136';
import {SourcePreviewV136,type SourcePreviewDevice} from './SourcePreviewV136';
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
 const [previewDevice,setPreviewDevice]=useState<SourcePreviewDevice>(()=>matchMedia('(max-width: 767px)').matches?'phone':'desktop');
 const [previewFocused,setPreviewFocused]=useState(false);
 const [diagnosticsOpen,setDiagnosticsOpen]=useState(()=>matchMedia('(min-width: 768px)').matches);
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
  setActive(path);setRenamingFile(null);setDeletingFile(null);setPreviewFocused(false);
 }
 function returnToEditor(){
  setPreviewFocused(false);
  requestAnimationFrame(()=>document.getElementById('p136-source-tab-'+active)?.focus());
 }
 function choosePath(path:string){
  selectFile(path);
  setCollapsedFolders(previous=>new Set([...previous].filter(folder=>!path.startsWith(folder+'/'))));
  closeQuickOpen();
 }
 /** Dependency links inspect actual source rather than changing any code.
  * Opening a reference explicitly cancels the pending rename/removal.
  * Focus moves to the existing real file tab for keyboard continuity. */
 function inspectReference(path:string,previous:string){
  if(!Object.hasOwn(files,path))return;
  selectFile(path);
  setCollapsedFolders(previousFolders=>new Set([...previousFolders].filter(folder=>!path.startsWith(folder+'/'))));
  setNote('Inspect '+path+' for local references to '+previous+'. The pending file operation was canceled; no source was rewritten.');
  requestAnimationFrame(()=>document.getElementById('p136-source-tab-'+path)?.focus());
 }
 const localOnlyPaths=localOnlySourcePaths(files);
 const unresolvedLinks=useMemo(()=>unresolvedLocalSourceLinks(files,safePath),[files]);
 const previewHtml=useMemo(()=>sourcePreviewDocument(files),[files]);
 const renameReferences=renamingFile?sourceReferencesToReview(files,renamingFile):[];
 const removalReferences=deletingFile?sourceReferencesToReview(files,deletingFile):[];
 function inspectUnresolvedLink(path:string,target:string){
  if(!Object.hasOwn(files,path))return;
  selectFile(path);
  setCollapsedFolders(folders=>new Set([...folders].filter(folder=>!path.startsWith(folder+'/'))));
  setNote('Review missing local reference '+target+' in '+path+'. No source was rewritten or uploaded.');
  requestAnimationFrame(()=>document.getElementById('p136-source-tab-'+path)?.focus());
 }
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
   const references=sourceReferencesToReview(files,renamingFile);
   const target=renameDraft.trim(),updated=renameLocalSource(files,renamingFile,target,safePath);
   setRenamingFile(null);
   if(updated===files)return;
   importVersion.current++;
   setFiles(updated);selectFile(target);
   setCollapsedFolders(previous=>new Set([...previous].filter(folder=>!target.startsWith(folder+'/'))));
   setDirty(true);onDirty();
   setNote('Local source renamed. '+(references.length?
    'References may need repair in: '+references.join(', ')+'. No linked source was rewritten. ':
    'No direct static references were detected; check dynamic imports manually. ')+
    'Any previously prepared archive is invalid.');
  }catch(error){setNote(error instanceof Error?error.message:'Could not rename this local source.')}
 }
 function commitRemoval(){
  if(disabled||!deletingFile)return;
  try{
   const references=sourceReferencesToReview(files,deletingFile);
   const updated=removeLocalSource(files,deletingFile);
   importVersion.current++;
   setFiles(updated);selectFile('index.html');
   setDirty(true);onDirty();
   setNote('Local source removed from this session. '+(references.length?
    'References to the removed file still exist in: '+references.join(', ')+'. ':
    'No direct static references were detected. ')+
    'Any previously prepared archive is invalid.');
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
    e.preventDefault();setPreviewFocused(false);setFileQuery('');setFileChoice(0);setQuickOpen(true);
   }else if(e.key==='Escape'&&previewFocused&&!quickOpen){e.preventDefault();returnToEditor()}}}>
  <header className="p136-workbench-head"><div><span>ANEVUM / CREATOR STUDIO</span><h2>Code workspace</h2></div><span className="p136-source-state">{dirty?'LOCAL CHANGES':'ARCHIVE PREPARED'}</span></header>
  <div className="p136017-source-functionbar" aria-hidden="true">
   <span className="p136017-functionmark">SOURCE / LOCAL</span>
   <span>FILES · VALIDATION · ARCHIVE</span>
   <span>01 / WORKBENCH</span>
  </div>
  <div className="p136-workbench-command">
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={()=>packageSource()}><Icon name="create" size={16}/> Prepare build archive</button>
   <button type="button" className="p136034-preview-command" aria-pressed={previewFocused}
    aria-label={previewFocused?'Return to source editor from layout preview':'Open focused HTML/CSS layout preview'}
    onClick={()=>{if(previewFocused)returnToEditor();else{setInspector(true);setPreviewFocused(true)}}}>
    {previewFocused?'Return to code':'Preview HTML/CSS'}
   </button>
   <button type="button" className="p136034-diagnostics-command"
    aria-label={'Open local build checks: '+(problems.length+unresolvedLinks.length)+' findings'}
    onClick={()=>{
     setInspector(true);setPreviewFocused(false);setDiagnosticsOpen(true);
     requestAnimationFrame(()=>{
      const summary=document.querySelector<HTMLElement>('.p136030-build-details > summary');
      summary?.scrollIntoView({block:'nearest'});
      summary?.focus({preventScroll:true});
     });
    }}>Build checks · {problems.length+unresolvedLinks.length}</button>
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={downloadSource}>Download complete source</button>
   <label className="p136-source-import">Open text files<input disabled={disabled} type="file" multiple accept=".html,.css,.js,.json,.txt,.md" onChange={e=>void importFiles(e.target.files)}/></label>
   <button type="button" aria-pressed={plain} onClick={()=>setPlain(v=>!v)}>Accessible text editor</button>
   <button type="button" aria-expanded={inspector} onClick={()=>{setInspector(v=>!v);setPreviewFocused(false)}}>Inspector</button>
   <button ref={quickButton} type="button" aria-expanded={quickOpen} aria-controls="p136-quick-open" aria-keyshortcuts="Control+p Meta+p"
    onClick={()=>{setPreviewFocused(false);setFileQuery('');setFileChoice(0);setQuickOpen(v=>!v)}}>Open file…</button>
  </div>
  {previewFocused&&<p className="p136034-preview-mode" role="status">
   Focused HTML/CSS layout only. Scripts, external resources and publishing remain disabled. Choose a real CSS viewport below; press Escape or Return to code to resume the mounted editor.
  </p>}
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
   <div className="p136-workbench-layout" data-inspector={inspector} data-preview-focused={previewFocused}>
   <aside className="p136-source-explorer" aria-label="Local source files"><strong>PROJECT EXPLORER</strong>
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
     <div className="p136017-ref-audit" role="status" aria-live="polite" data-source-reference-audit="rename">
      <strong>LINK AUDIT / {renameReferences.length} STATIC REFERENCE {renameReferences.length===1?'SOURCE':'SOURCES'}</strong>
      {renameReferences.length?
       <><p>These authored files reference {renamingFile}. A rename can break their links; no code will be rewritten automatically.</p>
        <ul>{renameReferences.map(path=><li key={path}><button type="button"
         onClick={()=>inspectReference(path,renamingFile)}>Inspect {path}</button></li>)}</ul></>:
       <p>No direct local path references detected. Dynamic paths are not inspected.</p>}
     </div>
     <input id="p136017-file-rename" autoFocus autoComplete="off" spellCheck={false} maxLength={120}
      value={renameDraft} onChange={event=>setRenameDraft(event.target.value)}
      onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setRenamingFile(null)}}}/>
     <button type="submit" disabled={disabled}>Save file path</button>
     <button type="button" onClick={()=>setRenamingFile(null)}>Cancel rename</button>
    </form>}
    {deletingFile&&<div className="p136017-file-mutation" role="group" aria-label="Confirm local file removal">
     <p>Remove {deletingFile} from this in-memory workspace? This action has no undo. Export source first if needed.</p>
     <div className="p136017-ref-audit" role="status" aria-live="polite" data-source-reference-audit="remove">
      <strong>LINK AUDIT / {removalReferences.length} STATIC REFERENCE {removalReferences.length===1?'SOURCE':'SOURCES'}</strong>
      {removalReferences.length?
       <><p>The following authored files may still refer to {deletingFile} after removal. No source code is modified.</p>
        <ul>{removalReferences.map(path=><li key={path}><button type="button"
         onClick={()=>inspectReference(path,deletingFile)}>Inspect {path}</button></li>)}</ul></>:
       <p>No direct local path references detected. Dynamic paths are not inspected.</p>}
     </div>
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
   {inspector&&<aside className="p136-source-inspector" aria-label="Source and build diagnostics">
    <SourcePreviewV136 html={previewHtml} device={previewDevice} onDevice={setPreviewDevice}
     focused={previewFocused} onFocused={focused=>{if(focused)setPreviewFocused(true);else returnToEditor()}}/>
    <details className="p136030-build-details" open={diagnosticsOpen} onToggle={event=>setDiagnosticsOpen(event.currentTarget.open)}>
    <summary>Build checks <span>{problems.length+unresolvedLinks.length?`${problems.length+unresolvedLinks.length} findings`:'Source details'}</span></summary>
    <strong>BUILD INSPECTOR</strong><span className="p136017-inspector-disclosure">VALIDATION / LOCAL SOURCE</span><dl><dt>Source files</dt><dd>{entries.length} / {MAX_FILES}</dd><dt>Expanded text</dt><dd>{(total/1024).toFixed(1)} KiB / 1024 KiB</dd><dt>Entrypoint</dt><dd>{files['index.html']?'index.html':'Missing'}</dd><dt>Publication</dt><dd>Private upload required</dd><dt>Local-only source notes</dt><dd>{localOnlyPaths.length}</dd></dl><h3>Local findings</h3>{problems.length?<ul>{problems.map(p=><li key={p}>{p}</li>)}</ul>:<p>No issues found by the available text checks.</p>}
    <div className="p136017-source-link-diagnostics" data-source-link-diagnostics="local" aria-label="Local link diagnostics">
     <h3>Source links / {unresolvedLinks.length} missing</h3>
     {unresolvedLinks.length?
      <ul>{unresolvedLinks.map(link=><li key={link.source+'|'+link.target}>
       <button type="button" onClick={()=>inspectUnresolvedLink(link.source,link.target)}
        aria-label={'Inspect '+link.source+' missing reference '+link.target}>Inspect {link.source}</button>
       <span>Missing: {link.target}</span>
      </li>)}</ul>:
      <p>No missing static local references detected.</p>}
     <p>Static HTML, CSS and JavaScript links only. Dynamic paths and remote resources are not inspected; packaging still uses the existing compatibility checks.</p>
    </div><p>JavaScript is edited as text. This view does not compile, run, save to your account or publish source.</p><h3>Interactive playtest</h3><p>Prepare the archive, then use the existing private playtest form below. Your layout preview does not upload or publish the build.</p></details></aside>}
  </div>
  {note&&<p className="p136-source-notice" role="status">{note}</p>}
  <p className="p136-source-privacy">Source stays in this workspace’s memory until you prepare and explicitly upload an archive. Export before leaving; signing out or changing routes clears it.</p>
 </section>;
}
