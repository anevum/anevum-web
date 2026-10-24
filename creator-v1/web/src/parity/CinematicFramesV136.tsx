import {useEffect,useMemo,useRef,useState} from 'react';
import {CINEMATIC_DECODE_CACHE_LIMIT,type CinematicSequence} from './CinematicMediaContractV136';
import {cinematicFrameIndex} from './cinematic-director-v136';

/** Bounded DOM image player. Never creates a canvas or controls application focus.
 * Only APPROVED same-origin, manifest-checked assets reach this component.
 */
export function CinematicFramesV136({sequence,progress,onFault}:{
  sequence:CinematicSequence;progress:number;onFault:()=>void
}){
 const [tier,setTier]=useState<'desktop'|'mobile'>(()=>
   window.matchMedia('(max-width:680px)').matches?'mobile':'desktop');
 const [visible,setVisible]=useState<string|null>(null);
 const cache=useRef<Map<string,HTMLImageElement>>(new Map());
 const index=cinematicFrameIndex(progress,sequence.count);
 const frame=sequence[tier].frames[index];
 const path=frame.path;
 const url=useMemo(()=>import.meta.env.BASE_URL+path,[path]);
 useEffect(()=>{
   const media=window.matchMedia('(max-width:680px)');
   const changed=()=>setTier(media.matches?'mobile':'desktop');
   media.addEventListener('change',changed);
   return()=>media.removeEventListener('change',changed);
 },[]);
 useEffect(()=>{
   cache.current.clear();setVisible(null);
 },[tier,sequence]);
 useEffect(()=>{
   const stored=cache.current.get(url);
   if(stored?.complete&&stored.naturalWidth>0){setVisible(url);return}
   let cancelled=false;
   const image=new Image();
   image.decoding='async';
   const ready=()=>{
     if(cancelled||!image.naturalWidth)return;
     const entries=cache.current;
     entries.delete(url);entries.set(url,image);
     while(entries.size>CINEMATIC_DECODE_CACHE_LIMIT){
       const oldest=entries.keys().next().value;
       if(oldest===undefined)break;
       entries.delete(oldest);
     }
     setVisible(url);
   };
   image.onload=ready;
   image.onerror=()=>{if(!cancelled)onFault()};
   image.src=url;
   // decode() can finish before or after onload; both paths are idempotent.
   if(typeof image.decode==='function')void image.decode().then(ready,()=>{});
   return()=>{cancelled=true;image.onload=null;image.onerror=null;
     if(!image.complete)image.src='data:,';};
 },[url,onFault]);
 return <div aria-hidden="true" className="p136-cinematic-frames" data-cinematic-frames="approved"
   data-frame-index={index} data-tier={tier}>
   {visible&&<img src={visible} alt="" decoding="async" draggable={false}/>}
 </div>;
}
