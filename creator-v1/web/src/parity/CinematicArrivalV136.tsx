import {useEffect,useRef,useState} from 'react';
import {useLivingWorld} from './LivingWorldState';
import {cinematicMode,cinematicReveal,cinematicScrollProgress} from './cinematic-director-v136';
import manifest from '../../public/assets/cinematic-v136/arrival/manifest.json';
import './cinematic-arrival-v136.css';

/** An opt-in first-party poster-to-WebGL pilot, not a replacement canvas.
 * A motion sequence is not asserted until approved frame assets exist and pass verification.
 * The actual hero links, IREN controls and route state remain independent DOM elements.
 */
const enabled=import.meta.env.VITE_PARITY_V136_CINEMATIC==='true';
const asset=(path:string)=>import.meta.env.BASE_URL+path;
export function CinematicArrivalV136(){
  const stage=useRef<HTMLDivElement>(null);
  const {paused}=useLivingWorld();
  const [posterFailed,setPosterFailed]=useState(false);
  useEffect(()=>{
    if(!enabled||posterFailed)return;
    const element=stage.current;
    const hero=element?.closest<HTMLElement>('.p136-hero');
    if(!element||!hero)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const forced=window.matchMedia('(forced-colors: active)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean;addEventListener?:(name:string,cb:()=>void)=>void;removeEventListener?:(name:string,cb:()=>void)=>void}}).connection;
    let raf=0,visible=document.visibilityState==='visible';
    const paint=()=>{
      raf=0;
      const mode=cinematicMode({
        enabled,reducedMotion:reduced.matches,forcedColors:forced.matches,
        saveData:Boolean(connection?.saveData),paused,visible,
        hasApprovedSequence:false
      });
      element.dataset.mode=mode;
      const progress=cinematicScrollProgress(hero.getBoundingClientRect().top,hero.getBoundingClientRect().height);
      const opacity=mode==='off'?0:mode==='poster'&&(reduced.matches||paused||connection?.saveData)?1:
        cinematicReveal(progress,manifest.handoff.revealStart,manifest.handoff.revealEnd);
      element.style.setProperty('--cinema-opacity',String(opacity));
      const travel=mode==='poster'&&(reduced.matches||paused)?0:progress;
      element.style.setProperty('--cinema-offset',(-1.6*travel).toFixed(3)+'%');
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
  },[paused,posterFailed]);
  if(!enabled||posterFailed)return null;
  return <div ref={stage} className="p136-cinematic-arrival" aria-hidden="true" data-cinematic-v136="poster-pilot" data-mode="poster">
    <picture className="p136-cinematic-art">
      <source media="(max-width: 680px)" srcSet={asset(manifest.posters.mobile.path)}/>
      <img src={asset(manifest.posters.desktop.path)} width={manifest.posters.desktop.width}
        height={manifest.posters.desktop.height} decoding="async" fetchPriority="high"
        alt="" onError={()=>setPosterFailed(true)}/>
    </picture>
    <span className="p136-cinematic-luminance"/>
    <span className="p136-cinematic-vignette"/>
  </div>;
}
