import {useEffect,useRef,useState} from 'react';
import {validRuntimeURL} from '../lib/native-creator-v095';
import './project-player-shell.css';

/** Only the executable frame is cross-site. Navigation, identity, controls and
 * review stay inside the canonical ANEVUM React shell. Never add allow-same-origin. */
export function IsolatedProjectViewport({title,src,releaseId,preview,expiresAt,onReopen}:{
 title:string;src:string;releaseId:string;preview:boolean;expiresAt:number|null;onReopen:()=>void;
}){
 const stage=useRef<HTMLDivElement>(null),expandButton=useRef<HTMLButtonElement>(null);
 const [expanded,setExpanded]=useState(false),[full,setFull]=useState(false),[restart,setRestart]=useState(0);
 const [expired,setExpired]=useState(false);
 const valid=validRuntimeURL(src,releaseId,preview);
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
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};
  document.addEventListener('keydown',escape);
  return()=>{document.body.style.overflow=overflow;document.body.classList.remove('av095-expanded');document.removeEventListener('keydown',escape);expandButton.current?.focus();};
 },[expanded]);
 async function expand(){
  try{if(stage.current?.requestFullscreen){await stage.current.requestFullscreen();return;}}catch{/* iPhone fallback retains the same frame. */}
  setExpanded(true);
 }
 async function exit(){
  if(document.fullscreenElement===stage.current)await document.exitFullscreen().catch(()=>{});
  setExpanded(false);expandButton.current?.focus();
 }
 return <section className="av095-player-shell" aria-label="ANEVUM project player">
  <div className={'av095-player'+(expanded?' av095-player--expanded':'')} ref={stage}>
   {!valid?<p role="alert">The execution URL could not be verified. No creator code was loaded.</p>:
    expired?<div className="st-empty"><h2>Private playtest expired.</h2><p>Return to the saved build to create a fresh, authorized preview.</p><button type="button" className="st-action" onClick={onReopen}>Reopen private playtest</button></div>:
    <iframe key={src+':'+restart} title={title} src={src} sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad" referrerPolicy="no-referrer" loading="eager"/>}
   {(expanded||full)&&<button type="button" className="st-action av095-exit" onClick={()=>void exit()}>Exit player</button>}
  </div>
  <div className="av095-player-controls">
   <button type="button" className="st-action" disabled={!valid||expired} onClick={()=>setRestart(n=>n+1)}>Restart build</button>
   <button ref={expandButton} type="button" className="st-action" disabled={!valid||expired} onClick={()=>void expand()}>Expand player</button>
   <span className="st-muted">{preview?'Private, time-limited playtest':'Independently reviewed public release'}</span>
  </div>
 </section>;
}
