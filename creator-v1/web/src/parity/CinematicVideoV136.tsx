import {useEffect,useRef} from 'react';
import type {CinematicVideoSet} from './CinematicMediaContractV136';

/** Optional reviewed CSP-dependent ambient video, not a replacement for frame-accurate scroll sequences.
 * Native video may load only after a build flag AND manifest approval AND same-origin media-src permission.
 */
export function CinematicVideoV136({video,canPlay,onFault}:{
 video:CinematicVideoSet;canPlay:boolean;onFault:()=>void
}){
 const element=useRef<HTMLVideoElement|null>(null);
 useEffect(()=>{
  const node=element.current;
  if(!node)return;
  if(!canPlay){node.pause();return}
  let cancelled=false;
  const observer=new IntersectionObserver(entries=>{
    if(cancelled)return;
    if(entries[0]?.isIntersecting&&document.visibilityState==='visible'){
      void node.play().catch(()=>{node.pause()});
    }else node.pause();
  },{threshold:.05});
  observer.observe(node);
  const visibility=()=>{
    if(document.visibilityState==='hidden')node.pause();
    else if(node.getBoundingClientRect().bottom>0&&node.getBoundingClientRect().top<window.innerHeight){
      void node.play().catch(()=>{node.pause()});
    }
  };
  document.addEventListener('visibilitychange',visibility);
  return()=>{cancelled=true;observer.disconnect();document.removeEventListener('visibilitychange',visibility);node.pause()};
 },[canPlay,video]);
 const source=(path:string)=>import.meta.env.BASE_URL+path;
 return <video ref={element} className="p136-cinematic-video" aria-hidden="true"
  muted playsInline loop preload="none" autoPlay={false} tabIndex={-1}
  onError={onFault} disablePictureInPicture disableRemotePlayback>
   {video.assets.webm&&<source type="video/webm" src={source(video.assets.webm.path)}/>}
   {video.assets.mp4&&<source type="video/mp4" src={source(video.assets.mp4.path)}/>}
 </video>;
}
