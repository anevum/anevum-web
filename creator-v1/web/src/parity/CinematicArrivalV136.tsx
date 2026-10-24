import {useCallback,useEffect,useRef,useState} from 'react';
import {useLivingWorld} from './LivingWorldState';
import {cinematicMode,cinematicReveal,cinematicScrollProgress} from './cinematic-director-v136';
import {allowMotion,approvedCinematicSequence,approvedCinematicVideo} from './CinematicMediaContractV136';
import {CinematicFramesV136} from './CinematicFramesV136';
import {CinematicVideoV136} from './CinematicVideoV136';
import manifest from '../../public/assets/cinematic-v136/arrival/manifest.json';
import './cinematic-arrival-v136.css';

/** An art-directed layer on the one live Institute canvas.
 * No duplicate renderer, fake page state, forced intro or private signal.
 * Frame and video are inaccessible until a reviewed manifest explicitly approves them.
 */
const enabled=import.meta.env.VITE_PARITY_V136_CINEMATIC==='true';
const nativeVideoFlag=import.meta.env.VITE_PARITY_V136_NATIVE_VIDEO==='true';
const approvedSequence=approvedCinematicSequence(manifest.sequence);
const videoCandidate=(manifest as unknown as {video?:unknown}).video;
const approvedVideo=approvedCinematicVideo(videoCandidate);
const asset=(path:string)=>import.meta.env.BASE_URL+path;
type ViewMode='off'|'poster'|'sequence'|'video';
export function CinematicArrivalV136(){
 const stage=useRef<HTMLDivElement>(null);
 const {paused}=useLivingWorld();
 const [posterFailed,setPosterFailed]=useState(false);
 const [frameFailed,setFrameFailed]=useState(false);
 const [videoFailed,setVideoFailed]=useState(false);
 const [mode,setMode]=useState<ViewMode>('poster');
 const [progress,setProgress]=useState(0);
 const [playAllowed,setPlayAllowed]=useState(false);
 const onFrameFault=useCallback(()=>setFrameFailed(true),[]);
 const onVideoFault=useCallback(()=>setVideoFailed(true),[]);
 useEffect(()=>{
  if(!enabled||posterFailed)return;
  const element=stage.current;
  const hero=element?.closest<HTMLElement>('.p136-hero');
  if(!element||!hero)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const forced=window.matchMedia('(forced-colors: active)');
  const connection=(navigator as Navigator&{
   connection?:{saveData?:boolean;addEventListener?:(name:string,cb:()=>void)=>void;
    removeEventListener?:(name:string,cb:()=>void)=>void}
  }).connection;
  let raf=0,visible=document.visibilityState==='visible';
  const paint=()=>{
   raf=0;
   const input={
    enabled,reducedMotion:reduced.matches,forcedColors:forced.matches,
    saveData:Boolean(connection?.saveData),paused,visible
   };
   const baseline=cinematicMode({...input,hasApprovedSequence:Boolean(approvedSequence&&!frameFailed)});
   // Native video is ambient only, not frame-accurate scroll. It also requires a
   // separate CSP review and explicit build flag, both absent in production today.
   const videoPlayable=baseline==='poster'&&Boolean(approvedVideo)&&nativeVideoFlag&&
    !videoFailed&&allowMotion(input);
   const nextMode:ViewMode=videoPlayable?'video':baseline;
   element.dataset.mode=nextMode;
   setMode(previous=>previous===nextMode?previous:nextMode);
   setPlayAllowed(previous=>previous===videoPlayable?previous:videoPlayable);
   const travel=cinematicScrollProgress(hero.getBoundingClientRect().top,hero.getBoundingClientRect().height);
   const staticPreference=reduced.matches||paused||Boolean(connection?.saveData);
   const opacity=nextMode==='off'?0:nextMode==='poster'&&staticPreference?1:
    cinematicReveal(travel,manifest.handoff.revealStart,manifest.handoff.revealEnd);
   element.style.setProperty('--cinema-opacity',String(opacity));
   element.style.setProperty('--cinema-offset',(-1.6*(staticPreference?0:travel)).toFixed(3)+'%');
   if(nextMode==='sequence')setProgress(value=>Math.abs(value-travel)>.002?travel:value);
  };
  const schedule=()=>{if(!raf)raf=window.requestAnimationFrame(paint)};
  const onVisibility=()=>{visible=document.visibilityState==='visible';schedule()};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  reduced.addEventListener('change',schedule);
  forced.addEventListener('change',schedule);
  connection?.addEventListener?.('change',schedule);
  schedule();
  return()=>{
   window.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);
   document.removeEventListener('visibilitychange',onVisibility);
   reduced.removeEventListener('change',schedule);
   forced.removeEventListener('change',schedule);
   connection?.removeEventListener?.('change',schedule);
   if(raf)window.cancelAnimationFrame(raf);
  };
 },[paused,posterFailed,frameFailed,videoFailed]);
 if(!enabled||posterFailed)return null;
 return <div ref={stage} className="p136-cinematic-arrival"
    aria-hidden="true" data-cinematic-v136="poster-pilot" data-mode={mode}>
   <picture className="p136-cinematic-art">
    <source media="(max-width: 680px)" srcSet={asset(manifest.posters.mobile.path)}/>
    <img src={asset(manifest.posters.desktop.path)} width={manifest.posters.desktop.width}
     height={manifest.posters.desktop.height} decoding="async" fetchPriority="high"
     alt="" onError={()=>setPosterFailed(true)} draggable={false}/>
   </picture>
   {mode==='sequence'&&approvedSequence&&
    <CinematicFramesV136 sequence={approvedSequence} progress={progress} onFault={onFrameFault}/>}
   {mode==='video'&&approvedVideo&&nativeVideoFlag&&
    <CinematicVideoV136 video={approvedVideo} canPlay={playAllowed} onFault={onVideoFault}/>}
   <span className="p136-cinematic-luminance"/>
   <span className="p136-cinematic-vignette"/>
  </div>;
}
