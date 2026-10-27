import {useEffect,useRef,useState,type RefObject} from "react";
import {SeveranceWorldSceneV138} from "./SeveranceWorldSceneV138";

/**
 * Cinematic art is intentionally separate from real React headings, navigation,
 * authenticated content and links. The same first-party motion is reused on
 * Home and /severance, with reduced-motion/data-saver/visibility safeguards.
 *
 * The original hand-authored SVG remains a fully working fallback if media
 * cannot load or the device opts out. No fake captured gameplay is rendered.
 */
// Vite BASE_URL is / on the primary site, /creator/ in the isolated
// owner-review build. All film and poster traffic stays on our own origin.
export const SEVERANCE_ASSET_BASE_V139=import.meta.env.BASE_URL+"assets/severance/";
export const SEVERANCE_MEDIA_V139={
 poster:SEVERANCE_ASSET_BASE_V139+"hero-poster-v139.webp",
 desktop:SEVERANCE_ASSET_BASE_V139+"hero-motion-v139-1080p.mp4",
 mobile:SEVERANCE_ASSET_BASE_V139+"hero-motion-v139-720p.mp4"
} as const;

function canPlayMotion(){
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const net=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 const saver=Boolean(net?.saveData);
 const verySlow=net?.effectiveType==="slow-2g"||net?.effectiveType==="2g";
 return !reduced&&!saver&&!verySlow;
}

/** Deterministic, tiny depth changes around a single perspective origin.
 * One frame of work per pointer/scroll burst; never operates a WebGL renderer.
 */
export function useSeveranceDepth(ref:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const node=ref.current;
  if(!node||!window.matchMedia("(hover: hover) and (pointer: fine)").matches||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const target=node.parentElement??node;
  let raf=0;
  let x=0,y=0;
  const apply=()=>{
   raf=0;
   node.style.setProperty("--av139-x",(x*9).toFixed(2)+"px");
   node.style.setProperty("--av139-y",(y*7).toFixed(2)+"px");
   node.style.setProperty("--av139-tilt-x",(y*-.8).toFixed(3)+"deg");
   node.style.setProperty("--av139-tilt-y",(x*.8).toFixed(3)+"deg");
  };
  const pointer=(event:PointerEvent)=>{
   const rect=target.getBoundingClientRect();
   if(rect.width<=0||rect.height<=0)return;
   x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
   y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
   if(!raf)raf=requestAnimationFrame(apply);
  };
  const clear=()=>{
   x=0;y=0;
   if(!raf)raf=requestAnimationFrame(apply);
  };
  target.addEventListener("pointermove",pointer,{passive:true});
  target.addEventListener("pointerleave",clear,{passive:true});
  return ()=>{
   target.removeEventListener("pointermove",pointer);
   target.removeEventListener("pointerleave",clear);
   if(raf)cancelAnimationFrame(raf);
  };
 },[ref]);
}

export function SeveranceCinematicV139({className=""}:{className?:string}){
 const stageRef=useRef<HTMLDivElement>(null);
 const videoRef=useRef<HTMLVideoElement>(null);
 const [allowMotion,setAllowMotion]=useState(false);
 const [visible,setVisible]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [failed,setFailed]=useState(false);
 useSeveranceDepth(stageRef);

 useEffect(()=>{
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const network=(navigator as Navigator & {connection?:{addEventListener?:Function;removeEventListener?:Function}}).connection;
  const update=()=>setAllowMotion(canPlayMotion());
  update();
  reduced.addEventListener?.("change",update);
  network?.addEventListener?.("change",update);
  return ()=>{
   reduced.removeEventListener?.("change",update);
   network?.removeEventListener?.("change",update);
  };
 },[]);

 useEffect(()=>{
  const stage=stageRef.current;
  if(!stage)return;
  if(!("IntersectionObserver" in window)){setVisible(true);return}
  const observer=new IntersectionObserver(
   entries=>setVisible(entries.some(entry=>entry.isIntersecting)),
   {threshold:.01,rootMargin:"160px"}
  );
  observer.observe(stage);
  return ()=>observer.disconnect();
 },[]);

 useEffect(()=>{
  const video=videoRef.current;
  if(!video)return;
  let cancelled=false;
  const sync=()=>{
   if(!video)return;
   if(allowMotion&&visible&&!failed&&document.visibilityState==="visible"){
    video.muted=true;
    video.play().then(()=>{
      if(!cancelled)setPlaying(true);
    }).catch(()=>{if(!cancelled)setPlaying(false)});
   }else{video.pause();setPlaying(false)}
  };
  document.addEventListener("visibilitychange",sync);
  sync();
  return ()=>{
   cancelled=true;
   document.removeEventListener("visibilitychange",sync);
   video.pause();
  };
 },[allowMotion,visible,failed]);

 return <div ref={stageRef} className={"av139-cinematic "+className}
  aria-hidden="true" data-media-state={failed?"fallback":playing?"playing":allowMotion?"poster":"reduced-motion"}
  data-art-type="illustrative-cinematic-not-gameplay" data-motion-runtime="first-party-v139">
  <SeveranceWorldSceneV138/>
  <div className="av139-poster" style={{backgroundImage:`url("${SEVERANCE_MEDIA_V139.poster}")`}} aria-hidden="true"/>
  <video ref={videoRef} className="av139-film" muted playsInline loop
   preload={allowMotion&&visible?"metadata":"none"} disablePictureInPicture
   src={allowMotion&&!failed?(window.matchMedia("(max-width: 700px)").matches?SEVERANCE_MEDIA_V139.mobile:SEVERANCE_MEDIA_V139.desktop):undefined}
   poster={SEVERANCE_MEDIA_V139.poster}
   onError={()=>{setFailed(true);setPlaying(false)}}
   onPause={()=>setPlaying(false)}
   onPlaying={()=>setPlaying(true)}
   aria-hidden="true"
  />
  <span className="av139-dust" aria-hidden="true"/>
  <span className="av139-scanlines" aria-hidden="true"/>
  <span className="av139-bloodlight" aria-hidden="true"/>
 </div>;
}
