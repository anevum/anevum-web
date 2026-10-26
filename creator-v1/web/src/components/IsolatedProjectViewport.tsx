import {useEffect,useRef,useState} from 'react';
import {validRuntimeURL} from '../lib/native-creator-v095';
import './project-player-shell.css';
import './native-player-v102.css';

type PlayerFrameState='opening'|'frame-loaded'|'slow'|'error';
type PlayerViewport='fit'|'phone';

/** Only the executable frame is cross-site. Navigation, identity, controls and
 * review stay inside the canonical ANEVUM React shell. Never add allow-same-origin. */
export function IsolatedProjectViewport({title,src,releaseId,preview,expiresAt,onReopen}:{
 title:string;src:string;releaseId:string;preview:boolean;expiresAt:number|null;onReopen:()=>void;
}){
 const stage=useRef<HTMLDivElement>(null),expandButton=useRef<HTMLButtonElement>(null);
 const exitButton=useRef<HTMLButtonElement>(null);
 const gameFrame=useRef<HTMLIFrameElement>(null);
 const [expanded,setExpanded]=useState(false),[full,setFull]=useState(false),[restart,setRestart]=useState(0);
 const [frameState,setFrameState]=useState<PlayerFrameState>('opening');
 const [viewport,setViewport]=useState<PlayerViewport>('fit');
 const [expired,setExpired]=useState(false);
 // A manual popover elevates the same iframe into the browser's top layer on
 // iPhone Safari. Fixed positioning alone can be clipped by transformed shells.
 function closeImmersivePopover(){
  const node=stage.current;
  if(!node?.hasAttribute('popover'))return;
  try{if(node.matches(':popover-open'))node.hidePopover();}catch{/* The fallback must still be closable on older engines. */}
  node.removeAttribute('popover');
 }

 const valid=validRuntimeURL(src,releaseId,preview);
 // Cross-origin iframe load events cannot prove that an untrusted game is running.
 // Keep startup state explicitly informational, never a publication/health verdict.
 useEffect(()=>{
  setFrameState('opening');
  if(!valid||expired)return;
  const timer=window.setTimeout(()=>setFrameState(state=>state==='opening'?'slow':state),15000);
  return()=>window.clearTimeout(timer);
 },[src,restart,valid,expired]);
 useEffect(()=>{
  if(expanded||full)exitButton.current?.focus();
 },[expanded,full]);
 useEffect(()=>{
  setExpired(false);
  if(!preview||!expiresAt)return;
  const left=expiresAt*1000-Date.now();
  if(left<=0){setExpired(true);return;}
  const timer=setTimeout(()=>setExpired(true),Math.min(left,2147483647));
  return()=>clearTimeout(timer);
 },[src,preview,expiresAt]);
 useEffect(()=>{
  const changed=()=>setFull(document.fullscreenElement===stage.current);
  document.addEventListener('fullscreenchange',changed);
  return()=>document.removeEventListener('fullscreenchange',changed);
 },[]);
 useEffect(()=>{
  if(!expanded)return;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';document.body.classList.add('av095-expanded');
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setExpanded(false);}};
  document.addEventListener('keydown',escape);
  return()=>{closeImmersivePopover();document.body.style.overflow=overflow;document.body.classList.remove('av095-expanded');document.removeEventListener('keydown',escape);expandButton.current?.focus();};
 },[expanded]);
 async function expand(){
  try{if(stage.current?.requestFullscreen){await stage.current.requestFullscreen();return;}}catch{/* iPhone fallback retains the same frame. */}
  // Prefer the native top layer, preserving the loaded sandboxed iframe and
  // its in-memory game state. Never portal/remount creator execution here.
  const node=stage.current;
  if(node&&typeof node.showPopover==='function'){
   node.setAttribute('popover','manual');
   try{node.showPopover();}catch{node.removeAttribute('popover');}
  }
  setExpanded(true);
 }
 async function exit(){
  if(document.fullscreenElement===stage.current)await document.exitFullscreen().catch(()=>{});
  closeImmersivePopover();
  setExpanded(false);expandButton.current?.focus();
 }
 return <section className="av095-player-shell" aria-label="ANEVUM project player">
  <div className={'av095-player'+(expanded?' av095-player--expanded':'')} data-player-viewport={expanded||full?'fit':viewport} ref={stage}>
   {!valid?<p role="alert">The execution URL could not be verified. No creator code was loaded.</p>:
    expired?<div className="st-empty"><h2>Private playtest expired.</h2><p>Return to the saved build to create a fresh, authorized preview.</p><button type="button" className="st-action" onClick={onReopen}>Reopen private playtest</button></div>:
    <iframe ref={gameFrame} key={src+':'+restart} title={title} src={src} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad" referrerPolicy="no-referrer" loading="eager"
     onLoad={()=>setFrameState('frame-loaded')} onError={()=>setFrameState('error')}/>}
   {(expanded||full)&&<button ref={exitButton} type="button" className="st-action av095-exit" onClick={()=>void exit()}>Exit player</button>}
  </div>
  <div className="av095-player-controls">
   <button type="button" className="st-action" disabled={!valid||expired} onClick={()=>{setFrameState("opening");setRestart(n=>n+1);}}>Restart build</button>
   <button type="button" className="st-action" disabled={!valid||expired||frameState==='opening'} onClick={()=>gameFrame.current?.focus()}>Focus game input</button>
   <button ref={expandButton} type="button" className="st-action" disabled={!valid||expired} onClick={()=>void expand()}>Expand player</button>
   <button type="button" className="st-action av102-phone-toggle" disabled={!valid||expired} aria-pressed={viewport==='phone'} onClick={()=>setViewport(v=>v==='fit'?'phone':'fit')}>{viewport==='phone'?'Full width':'Phone width'}</button>
   <span className="st-muted">{preview?'Private, time-limited playtest':'Independently reviewed public release'}</span>
  </div>
  {valid&&!expired&&<p className="av102-player-status" role="status" aria-live="polite" data-player-frame-state={frameState}>
   {frameState==='opening'?'Opening the isolated player. The app may take a moment to start.':
    frameState==='slow'?'The frame is taking longer than expected. You can restart it without changing the saved build.':
    frameState==='error'?'The browser reported a frame-loading error. Restart the player or return to your project library.':
    'Player frame loaded. This does not independently confirm that the app started correctly.'}
  </p>}
  {valid&&!expired&&viewport==='phone'&&!expanded&&!full&&
   <p className="av102-player-note">Phone width is a viewport simulation, not physical Safari or Android compatibility approval.</p>}
  {valid&&!expired&&<p className="av102-player-note">Controls depend on the creator's actual browser export. Keyboard or gamepad input may require focusing the game. Touch, Safari and Xbox compatibility are not certified.</p>}
 </section>;
}
