import {useCallback,useEffect,useRef,useState} from 'react';
import {useLivingWorld} from './LivingWorldState';
import {allowMotion,approvedCinematicVideo,reviewCinematicVideo} from './CinematicMediaContractV136';
import {CinematicVideoV136} from './CinematicVideoV136';
import candidate from '../../public/assets/cinematic-v136/arrival/review-001/manifest.json';
import './cinematic-arrival-v136.css';

// Candidate art is isolated to staging-path review. Production approval is separate.
const ownerReview=import.meta.env.MODE==='staging-path'&&import.meta.env.VITE_ANEVUM_OWNER_REVIEW==='true';
const video=ownerReview?reviewCinematicVideo(candidate.video,true):approvedCinematicVideo(candidate.video);
const asset=(path:string)=>import.meta.env.BASE_URL+path;

/** Authored media over semantic DOM. No renderer, GPU-readiness or scroll handoff. */
export function CinematicArrivalV136(){
 const {paused}=useLivingWorld();
 const stage=useRef<HTMLDivElement>(null);
 const [canPlay,setCanPlay]=useState(false);
 const [failed,setFailed]=useState(false);
 const [posterFailed,setPosterFailed]=useState(false);
 const [faultReason,setFaultReason]=useState('');
 const onFault=useCallback((reason?:string)=>{setFailed(true);setFaultReason(reason||'video-unavailable')},[]);
 useEffect(()=>{
  const node=stage.current;if(!node)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string;addEventListener?:(name:string,fn:()=>void)=>void;removeEventListener?:(name:string,fn:()=>void)=>void}}).connection;
  let intersecting=false;
  // A separately approved production manifest may enable motion too; never
  // equate the owner-review flag with video authorization.
  const sync=()=>setCanPlay(Boolean(video)&&!failed&&allowMotion({enabled:Boolean(video),
   reducedMotion:reduced.matches,forcedColors:forced.matches,
   saveData:Boolean(connection?.saveData)||/^(slow-)?2g$/.test(connection?.effectiveType||''),
   paused,visible:intersecting&&document.visibilityState==='visible'}));
  const observer=new IntersectionObserver(entries=>{intersecting=Boolean(entries[0]?.isIntersecting);sync()},{threshold:.05});
  observer.observe(node);sync();
  reduced.addEventListener('change',sync);forced.addEventListener('change',sync);
  connection?.addEventListener?.('change',sync);document.addEventListener('visibilitychange',sync);
  return()=>{observer.disconnect();reduced.removeEventListener('change',sync);forced.removeEventListener('change',sync);
   connection?.removeEventListener?.('change',sync);document.removeEventListener('visibilitychange',sync)};
 },[paused,failed]);
 return <div ref={stage} className="p136-cinematic-arrival" aria-hidden="true"
  data-cinematic-v136="motion-first" data-mode={canPlay?'video':'poster'} data-media-fault={faultReason||undefined} data-art-status={ownerReview?'owner-review-pending':'native-fallback'}>
  {ownerReview&&!posterFailed&&<picture className="p136-cinematic-art">
   <source media="(max-width:720px)" srcSet={asset(candidate.poster.mobile.path)}/>
   <source media="(max-width:1100px)" srcSet={asset(candidate.poster.tablet.path)}/>
   <img src={asset(candidate.poster.desktop.path)} width={candidate.poster.desktop.width} height={candidate.poster.desktop.height}
    alt="" fetchPriority="high" decoding="async" onError={()=>setPosterFailed(true)}/>
  </picture>}
  {canPlay&&video&&<CinematicVideoV136 video={video} canPlay={canPlay} onFault={onFault}/>}
  <span className="p136-cinematic-luminance"/><span className="p136-cinematic-vignette"/>
 </div>;
}
