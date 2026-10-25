import {useCallback,useEffect,useRef,useState} from 'react';
import {useLivingWorld} from './LivingWorldState';
import {cinematicMode,cinematicScrollProgress,cinematicRevealWhenReady,cinematicWorldReadiness,cinematicInspectionOpacity} from './cinematic-director-v136';
import {allowMotion,approvedCinematicSequence,approvedCinematicVideo} from './CinematicMediaContractV136';
import {CinematicFramesV136} from './CinematicFramesV136';
import {CinematicVideoV136} from './CinematicVideoV136';
import manifest from '../../public/assets/cinematic-v136/arrival/manifest.json';
import './cinematic-arrival-v136.css';

/** A native interface arrival on the one live Institute canvas.
 * No duplicate renderer, fake page state, forced intro or private signal.
 * No generated image poster is fetched. Future frame or video media remains approval-gated.
 */
const enabled=import.meta.env.VITE_PARITY_V136_CINEMATIC==='true';
const nativeVideoFlag=import.meta.env.VITE_PARITY_V136_NATIVE_VIDEO==='true';
const stageCamera=import.meta.env.VITE_PARITY_V136_SHARED_SCENE_QA==='true';
const approvedSequence=approvedCinematicSequence(manifest.sequence);
const videoCandidate=(manifest as unknown as {video?:unknown}).video;
const approvedVideo=approvedCinematicVideo(videoCandidate);
type ViewMode='off'|'poster'|'sequence'|'video';
export function CinematicArrivalV136(){
 const stage=useRef<HTMLDivElement>(null);
 const {paused}=useLivingWorld();
 const [frameFailed,setFrameFailed]=useState(false);
 const [videoFailed,setVideoFailed]=useState(false);
 const [mode,setMode]=useState<ViewMode>('poster');
 const [progress,setProgress]=useState(0);
 const [playAllowed,setPlayAllowed]=useState(false);
 // True opt-in to the existing modeled world. Never add another canvas,
 // run private code, or imply the artistic master has been approved.
 const [inspecting,setInspecting]=useState(false);
 const [sceneReadiness,setSceneReadiness]=useState<'hold'|'ready'|'fallback'>('hold');
 const onFrameFault=useCallback(()=>setFrameFailed(true),[]);
 const onVideoFault=useCallback(()=>setVideoFailed(true),[]);
 useEffect(()=>{
  if(!enabled)return;
  const element=stage.current;
  const hero=element?.closest<HTMLElement>('.p136-hero');
  if(!element||!hero)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const forced=window.matchMedia('(forced-colors: active)');
  const connection=(navigator as Navigator&{
   connection?:{saveData?:boolean;addEventListener?:(name:string,cb:()=>void)=>void;
    removeEventListener?:(name:string,cb:()=>void)=>void}
  }).connection;
  const world=document.querySelector<HTMLElement>('.p136-living-world[data-enabled="true"]');
  const worldCanvas=world?.querySelector<HTMLCanvasElement>('.p136-living-canvas');
  let raf=0,visible=document.visibilityState==='visible',handoffCommitted=false;
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
    !videoFailed&&!inspecting&&allowMotion(input);
   const nextMode:ViewMode=videoPlayable?'video':baseline;
   element.dataset.mode=nextMode;
   setMode(previous=>previous===nextMode?previous:nextMode);
   setPlayAllowed(previous=>previous===videoPlayable?previous:videoPlayable);
   const travel=cinematicScrollProgress(hero.getBoundingClientRect().top,hero.getBoundingClientRect().height);
   // The shared 3D renderer reads this strictly local normalized value only
   // when the isolated stage-geometry build flag is enabled.
   if(stageCamera)element.dataset.cameraProgress=travel.toFixed(4);
   const staticPreference=reduced.matches||paused||Boolean(connection?.saveData);
   const readiness=cinematicWorldReadiness(world?.dataset.renderer==='webgl'?'webgl':
    world?.dataset.renderer==='vector'?'vector':null,worldCanvas?.dataset.assetState??null);
   setSceneReadiness(previous=>previous===readiness?previous:readiness);
   if(readiness!=='ready')setInspecting(false);
   // A user who has already crossed into the live scene never sees the poster
   // flash back on a temporary renderer reset or GPU status change.
   if(travel<manifest.handoff.revealStart*.5)handoffCommitted=false;
   else if(readiness!=='hold'&&travel>=manifest.handoff.revealStart)handoffCommitted=true;
   const permitted=handoffCommitted?'ready':readiness;
   element.dataset.handoff=permitted;
   const scrollOpacity=nextMode==='off'?0:nextMode==='poster'&&staticPreference?1:
    cinematicRevealWhenReady(travel,permitted,manifest.handoff.revealStart,manifest.handoff.revealEnd);
   const opacity=cinematicInspectionOpacity(inspecting,readiness,scrollOpacity);
   element.dataset.inspection=inspecting&&readiness==='ready'?'live':'cinematic';
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
  const observe=world?new MutationObserver(schedule):null;
  if(world)observe?.observe(world,{attributes:true,attributeFilter:['data-renderer','data-enabled']});
  if(worldCanvas)observe?.observe(worldCanvas,{attributes:true,attributeFilter:['data-asset-state']});
  schedule();
  return()=>{
   window.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);
   document.removeEventListener('visibilitychange',onVisibility);
   reduced.removeEventListener('change',schedule);
   forced.removeEventListener('change',schedule);
   connection?.removeEventListener?.('change',schedule);
   observe?.disconnect();
   if(raf)window.cancelAnimationFrame(raf);
  };
 },[paused,frameFailed,videoFailed,inspecting]);
 if(!enabled)return null;
 return <><div ref={stage} className="p136-cinematic-arrival"
    aria-hidden="true" data-cinematic-v136="native-institute" data-mode={mode} data-handoff="fallback">
   <div className="p136-cinematic-art p136-native-institute" data-arrival-surface="native-interface" aria-hidden="true">
    <span className="p136-native-institute__grid"/>
    <span className="p136-native-institute__ring"/>
    <span className="p136-native-institute__aperture"/>
    <span className="p136-native-institute__scan"/>
   </div>
   {mode==='sequence'&&approvedSequence&&
    <CinematicFramesV136 sequence={approvedSequence} progress={progress} onFault={onFrameFault}/>}
   {mode==='video'&&approvedVideo&&nativeVideoFlag&&
    <CinematicVideoV136 video={approvedVideo} canPlay={playAllowed} onFault={onVideoFault}/>}
   <span className="p136-cinematic-luminance"/>
   <span className="p136-cinematic-vignette"/>
  </div>
  <div className="p136017-scene-inspection" data-cinematic-inspection="v136.017"
   data-scene-readiness={sceneReadiness}>
   <button type="button" aria-pressed={inspecting}
    aria-label={inspecting?'Return to cinematic arrival':'Inspect live 3D scene'}
    disabled={sceneReadiness!=='ready'&&!inspecting}
    onClick={()=>setInspecting(value=>!value)}>
    <span className="p136017-scene-inspection-emblem" aria-hidden="true">◇</span>
    <span>{inspecting?'Return to cinematic':'Inspect live 3D'}</span>
   </button>
   <span className="p136017-scene-inspection-status" aria-hidden="true">
    {sceneReadiness==='ready'?'REAL-TIME MODEL':sceneReadiness==='hold'?'MODEL LOADING':'VECTOR FALLBACK'}
   </span>
  </div></>;
}
