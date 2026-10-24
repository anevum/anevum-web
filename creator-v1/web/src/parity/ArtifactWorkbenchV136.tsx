import {useEffect,useRef,useState,type ComponentType} from 'react';
import {strToU8} from 'fflate';
import {sourceArchive,safeSourcePath,SOURCE_LIMITS} from './source-archive-v136';
import {Icon} from '../components/Icons';
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
const fileMark=(name:string)=>name.endsWith('.html')?'<>':name.endsWith('.css')?'#':name.endsWith('.js')?'JS':name.endsWith('.json')?'{}':'T';
/** Original Studio V119 language grammar is reused from PR #709's source.
 * This bounded workbench composes a local archive for the existing uploader;
 * it does not activate V111 file APIs, execute code, persist source or publish. */
export function ArtifactWorkbenchV136({disabled,onPackage,onDirty}:{disabled:boolean;onPackage:(file:File)=>void;onDirty:()=>void}){
 const [files,setFiles]=useState<Record<string,string>>(()=>({...initialFiles})),[active,setActive]=useState('index.html');
 const [name,setName]=useState(''),[note,setNote]=useState(''),[dirty,setDirty]=useState(true),[plain,setPlain]=useState(()=>matchMedia('(max-width: 767px)').matches);
 const [Editor,setEditor]=useState<ComponentType<MonacoSourceProps>|null>(null),[editorError,setEditorError]=useState(false);
 const [inspector,setInspector]=useState(true),importVersion=useRef(0);
 useEffect(()=>{let alive=true;if(!plain)void import('./MonacoSourceV136').then(m=>{if(alive)setEditor(()=>m.default)}).catch(()=>{if(alive)setEditorError(true)});return()=>{alive=false}},[plain]);
 useEffect(()=>()=>{importVersion.current++},[]);
 const entries=Object.entries(files),total=entries.reduce((n,[,text])=>n+strToU8(text).length,0);
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
  setFiles(current=>({...current,[path]:''}));setActive(path);setName('');setDirty(true);onDirty();
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
   setFiles(next);setActive(incoming[0]?.[0]||active);setDirty(true);onDirty();setNote('Files read locally. Nothing was uploaded.');
  }catch(error){if(version===importVersion.current)setNote(error instanceof Error?error.message:'Files could not be opened.');}
 }
 function packageSource(download=false){
  if(disabled||!files['index.html']||total>MAX_TOTAL)return;
  try{const archive=sourceArchive(files);onPackage(archive);if(download){const url=URL.createObjectURL(archive),anchor=document.createElement('a');anchor.href=url;anchor.download=archive.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}setDirty(false);setNote('Archive prepared below. The existing compatibility checks, rights confirmation and private-upload controls still apply.')}
  catch(error){setNote(error instanceof Error?error.message:'Source archive could not be prepared.')}
 }
 return <section className="p136-workbench" aria-label="Artifact source workbench" data-artifact-workbench="v136.011">
  <header className="p136-workbench-head"><div><span>CONTINUANCE / ARTIFACT WORKBENCH</span><h2>Make the source.</h2></div><span className="p136-source-state">{dirty?'LOCAL CHANGES':'ARCHIVE PREPARED'}</span></header>
  <div className="p136-workbench-command">
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={()=>packageSource()}><Icon name="create" size={16}/> Prepare build archive</button>
   <button type="button" disabled={disabled||!files['index.html']||total>MAX_TOTAL} onClick={()=>packageSource(true)}>Download source archive</button>
   <label className="p136-source-import">Open text files<input disabled={disabled} type="file" multiple accept=".html,.css,.js,.json,.txt,.md" onChange={e=>void importFiles(e.target.files)}/></label>
   <button type="button" aria-pressed={plain} onClick={()=>setPlain(v=>!v)}>Accessible text editor</button>
   <button type="button" aria-expanded={inspector} onClick={()=>setInspector(v=>!v)}>Inspector</button>
  </div>
  <div className="p136-workbench-layout" data-inspector={inspector}>
   <aside className="p136-source-explorer" aria-label="Local source files"><strong>PROJECT FILES</strong>
    <div className="p136-source-add"><label className="visually-hidden" htmlFor="p136-source-new">New file path</label><input id="p136-source-new" placeholder="assets/data.json" value={name} onChange={e=>setName(e.target.value)} maxLength={120} disabled={disabled}/><button type="button" onClick={add} disabled={disabled} aria-label="Create source file">+</button></div>
    <nav aria-label="Source file explorer">{entries.map(([path])=><button key={path} type="button" aria-pressed={path===active} onClick={()=>setActive(path)}><span className={'p136-file-mark is-'+editorLanguage(path)} aria-hidden="true">{fileMark(path)}</span><span>{path}</span></button>)}</nav>
   </aside>
   <div className="p136-source-stage"><div className="p136-source-tabs" role="tablist" aria-label="Open source files">{entries.map(([path])=><button key={path} type="button" role="tab" id={'p136-source-tab-'+path} aria-selected={path===active} aria-controls="p136-source-panel" tabIndex={path===active?0:-1}
     onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=entries.findIndex(([p])=>p===active),next=e.key==='Home'?0:e.key==='End'?entries.length-1:(i+(e.key==='ArrowLeft'?-1:1)+entries.length)%entries.length;setActive(entries[next][0]);requestAnimationFrame(()=>document.getElementById('p136-source-tab-'+entries[next][0])?.focus())}}
     onClick={()=>setActive(path)}>{path}</button>)}</div>
    <div id="p136-source-panel" role="tabpanel" aria-labelledby={'p136-source-tab-'+active}>
     {!plain&&Editor&&!editorError?<Editor files={files} active={active} disabled={disabled} onChange={change}/>:<label className="p136-source-fallback"><span className="visually-hidden">Edit source {active}</span><textarea spellCheck={false} autoCapitalize="off" autoCorrect="off" value={files[active]} onChange={e=>change(active,e.target.value)} disabled={disabled}/></label>}
    </div>
    <footer className="p136-source-status"><span>{editorLanguage(active).toUpperCase()}</span><span>{files[active].split('\n').length} lines</span><span>{strToU8(files[active]).length.toLocaleString()} bytes</span><span>{plain||editorError?'TEXT EDITOR':Editor?'MONACO':'LOADING MONACO'}</span></footer>
   </div>
   {inspector&&<aside className="p136-source-inspector" aria-label="Source and build diagnostics"><strong>BUILD INSPECTOR</strong><dl><dt>Source files</dt><dd>{entries.length} / {MAX_FILES}</dd><dt>Expanded text</dt><dd>{(total/1024).toFixed(1)} KiB / 1024 KiB</dd><dt>Entrypoint</dt><dd>{files['index.html']?'index.html':'Missing'}</dd><dt>Publication</dt><dd>Private upload required</dd></dl><h3>Local findings</h3>{problems.length?<ul>{problems.map(p=><li key={p}>{p}</li>)}</ul>:<p>No issues found by the available text checks.</p>}<p>JavaScript is edited as text. This view does not compile, run, save to your account or publish source.</p><h3>Live preview</h3><p>Prepare the archive, then use the existing private playtest. Executable previews stay in ANEVUM’s isolated runtime.</p></aside>}
  </div>
  {note&&<p className="p136-source-notice" role="status">{note}</p>}
  <p className="p136-source-privacy">Source stays in this workspace’s memory until you prepare and explicitly upload an archive. Export before leaving; signing out or changing routes clears it.</p>
 </section>;
}
