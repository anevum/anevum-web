import {useEffect,useRef,useState,type DragEvent} from 'react';
import {Link} from 'react-router-dom';
import {MAX_PACK_BYTES,openNativePack,type PackManifest} from '../lib/anevum-native-pack';
import {NativePackExperience,type PackDocument} from './NativePackLab';
import './native-player-page.css';

type LocalPack={
 manifest:PackManifest;document:PackDocument;urls:Record<string,string>;filename:string;
};
const ACCEPT='.anvg,.anva,.anvs,.anvw,.anvp';
const FORMAT_LABELS:{extension:string;description:string}[]=[
 {extension:'.anvg',description:'Interactive games'},
 {extension:'.anva',description:'Music and albums'},
 {extension:'.anvs',description:'Episodes and series'},
 {extension:'.anvw',description:'Art and galleries'},
 {extension:'.anvp',description:'Studio projects'}
];
const friendlyError=(error:unknown)=>
 error instanceof Error?error.message:'The file could not be opened.';
export function NativeFilePlayerPage(){
 const [current,setCurrent]=useState<LocalPack|null>(null);
 const [error,setError]=useState('');
 const [status,setStatus]=useState<'idle'|'reading'>('idle');
 const [dragging,setDragging]=useState(false);
 const generation=useRef(0);
 const objects=useRef<string[]>([]);
 const input=useRef<HTMLInputElement|null>(null);
 useEffect(()=>()=>{generation.current++;
  objects.current.forEach(url=>URL.revokeObjectURL(url));objects.current=[];
 },[]);
 function clear(){
  generation.current++;
  objects.current.forEach(url=>URL.revokeObjectURL(url));objects.current=[];
  setCurrent(null);setStatus('idle');setError('');setDragging(false);
  if(input.current)input.current.value='';
 }
 async function openFile(file:File|undefined){
  if(!file)return;
  const epoch=++generation.current;
  setStatus('reading');setError('');
  try{
   if(!file.size||file.size>MAX_PACK_BYTES)
    throw Error('Choose a native ANEVUM file smaller than 20 MiB.');
   const pack=await openNativePack(file.name,new Uint8Array(await file.arrayBuffer()));
   if(epoch!==generation.current)return;
   const urls:Record<string,string>={};
   try{
    for(const [path,bytes] of pack.assets){
     const mime=pack.manifest.files.find(entry=>entry.path===path)?.mime;
     if(!mime)throw Error('Unrecognized file inside this package.');
     urls[path]=URL.createObjectURL(new Blob([Uint8Array.from(bytes)],{type:mime}));
    }
    if(epoch!==generation.current){
     Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
     return;
    }
    objects.current.forEach(url=>URL.revokeObjectURL(url));
    objects.current=Object.values(urls);
    setCurrent({manifest:pack.manifest,document:pack.document as PackDocument,urls,filename:file.name});
   }catch(error){
    Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
    throw error;
   }
  }catch(error){
   if(epoch===generation.current)setError(friendlyError(error));
  }finally{
   if(epoch===generation.current)setStatus('idle');
  }
 }
 function dropped(event:DragEvent<HTMLDivElement>){
  event.preventDefault();setDragging(false);
  if(event.dataTransfer.files.length!==1){
   setError('Select a single native ANEVUM file.');return;
  }
  void openFile(event.dataTransfer.files[0]);
 }
 return <main className="np-page" aria-label="ANEVUM local native file player">
  <div className="np-page-atmosphere" aria-hidden="true">
   <div className="np-page-orbit np-page-orbit-a"/>
   <div className="np-page-orbit np-page-orbit-b"/>
   <div className="np-page-core"/>
  </div>
  <nav className="np-page-crumb" aria-label="Native player breadcrumb">
   <Link to="/">← ANEVUM</Link><span>/</span><Link to="/studio">CREATOR STUDIO</Link>
   <span>/</span><span>LOCAL PLAYER</span>
  </nav>
  <header className="np-page-header">
   <div>
    <span className="np-page-kicker">ANEVUM / NATIVE CREATION SYSTEM / LOCAL PLAYER V001</span>
    <h1>OPEN A WORLD.</h1>
    <p>Games, albums, animated episodes and visual collections share one native player.
     Open an ANEVUM file from your device to experience it here.</p>
   </div>
   <div className="np-page-stamp" aria-label="Local-only preview">
    <span>01 / ORBIT</span><strong>LOCAL</strong><small>NO CLOUD UPLOAD</small>
   </div>
  </header>
  <div className="np-page-layout">
   <section className="np-page-panel" aria-label="Select a native creation">
    <span className="np-page-kicker">01 / FILE INTAKE</span>
    <h2>CHOOSE A CREATION.</h2>
    <div className={'np-page-drop'+(dragging?' is-dragging':'')}
     onDragOver={event=>{event.preventDefault();setDragging(true);}}
     onDragLeave={()=>setDragging(false)}
     onDrop={dropped} role="group" aria-label="Drop or select one native ANEVUM file">
     <div className="np-page-drop-mark" aria-hidden="true">◇</div>
     <label htmlFor="np-local-package">SELECT ANEVUM FILE</label>
     <input ref={input} id="np-local-package" type="file" accept={ACCEPT}
      disabled={status==='reading'}
      onChange={event=>{void openFile(event.currentTarget.files?.[0]);
       event.currentTarget.value='';}}/>
     <p>Or drag one package here. It is validated and opened entirely on this device.</p>
    </div>
    <div className="np-page-formats" aria-label="Supported native formats">
     {FORMAT_LABELS.map(entry=><div key={entry.extension}>
      <code>{entry.extension}</code><span>{entry.description}</span>
     </div>)}
    </div>
    {current&&<button className="np-page-clear" type="button" onClick={clear}>CLOSE LOCAL FILE ×</button>}
    {status==='reading'&&<p role="status" className="np-page-message">CHECKING FILE INTEGRITY…</p>}
    {error&&<p role="alert" className="np-page-error">{error}</p>}
    <p className="np-page-privacy">No upload, account permission, review approval or XP is created by
     opening a file. Only declarative content and supported local media are rendered. This is an
     early local player, not a browser executable-game sandbox or a malware scanner.</p>
   </section>
   <section className="np-page-panel np-page-player" aria-label="Creation playback stage">
    <div className="np-page-player-header">
     <span className="np-page-kicker">02 / PLAYER STAGE</span>
     <span>{current?current.manifest.kind.toUpperCase()+' / '+current.manifest.version:'AWAITING FILE'}</span>
    </div>
    {current?<div className="np-page-loaded">
     <span className="np-page-kicker">VERIFIED PACKAGE STRUCTURE / LOCAL</span>
     <h2>{current.manifest.title}</h2>
     <p className="np-page-credit">BY {current.manifest.creator} · {current.filename}</p>
     <NativePackExperience key={current.filename+current.manifest.version}
      kind={current.manifest.kind} document={current.document} urls={current.urls}/>
    </div>:<div className="np-page-empty">
     <div className="np-page-ring" aria-hidden="true"><span>◌</span></div>
     <strong>NOTHING IS LOADED.</strong>
     <p>Select a native ANEVUM file to activate its player. No external site or executable code is opened.</p>
    </div>}
   </section>
  </div>
  <footer className="np-page-footer">
   <span>ANEVUM / CONTINUANCE INSTITUTE</span>
   <span>V001 · PRIVATE-FILE PREVIEW · NO PUBLISHING OR EXECUTABLE CONTENT</span>
  </footer>
 </main>;
}
