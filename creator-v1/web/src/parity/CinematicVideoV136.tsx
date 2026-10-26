import {useEffect,useRef,useState} from 'react';
import type {CinematicVideoSet,CinematicReviewVideo} from './CinematicMediaContractV136';

/** Optional reviewed CSP-dependent ambient video, not a replacement for frame-accurate scroll sequences.
 * Native video may load only after a build flag AND manifest approval AND same-origin media-src permission.
 */
export function CinematicVideoV136({video,canPlay,onFault}:{
 video:CinematicVideoSet|CinematicReviewVideo;canPlay:boolean;onFault:(reason?:string)=>void
}){
 const element=useRef<HTMLVideoElement|null>(null);
 const failedSources=useRef(new Set<string>());
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const node=element.current;
  if(!node)return;
  if(!canPlay){node.pause();return}
  let cancelled=false;
  const observer=new IntersectionObserver(entries=>{
    if(cancelled)return;
    if(entries[0]?.isIntersecting&&document.visibilityState==='visible'){
      void node.play().catch(error=>{
        // Unmount, tab hiding or an offscreen pause can abort an in-flight play.
        // That expected cancellation must not permanently poison the fallback.
        if(cancelled||(error instanceof Error&&error.name==='AbortError'))return;
        node.pause();onFault(error instanceof Error?error.name:'playback-denied');
      });
    }else node.pause();
  },{threshold:.05});
  observer.observe(node);
  const visibility=()=>{
    if(document.visibilityState==='hidden')node.pause();
    else if(node.getBoundingClientRect().bottom>0&&node.getBoundingClientRect().top<window.innerHeight){
      void node.play().catch(error=>{
        // Unmount, tab hiding or an offscreen pause can abort an in-flight play.
        // That expected cancellation must not permanently poison the fallback.
        if(cancelled||(error instanceof Error&&error.name==='AbortError'))return;
        node.pause();onFault(error instanceof Error?error.name:'playback-denied');
      });
    }
  };
  document.addEventListener('visibilitychange',visibility);
  return()=>{cancelled=true;observer.disconnect();document.removeEventListener('visibilitychange',visibility);node.pause()};
 },[canPlay,video,onFault]);
 const source=(path:string)=>import.meta.env.BASE_URL+path;
 return <video ref={element} className="p136-cinematic-video" aria-hidden="true"
  data-ready={ready} onLoadedData={()=>setReady(true)}
  muted playsInline loop preload="none" autoPlay={false} tabIndex={-1}
  onError={event=>{
    // Source errors bubble in React while the browser tries the next codec.
    // Only a terminal HTMLMediaElement error invalidates the whole player.
    const node=event.currentTarget,error=node.error;
    if(error){onFault('media-error-'+error.code);return;}
    if(event.target instanceof HTMLSourceElement){
      failedSources.current.add(event.target.src);
      const supported=[...node.querySelectorAll('source')].filter(source=>
        (!source.media||matchMedia(source.media).matches)&&node.canPlayType(source.type)!=='');
      if(supported.length&&supported.every(source=>failedSources.current.has(source.src)))
        onFault('sources-unavailable');
    }
  }} disablePictureInPicture disableRemotePlayback>
   {video.assets.webmMobile&&<source media="(max-width:720px)" type="video/webm" src={source(video.assets.webmMobile.path)}/>}
   {video.assets.mp4Mobile&&<source media="(max-width:720px)" type="video/mp4" src={source(video.assets.mp4Mobile.path)}/>}
   {video.assets.webm&&<source type="video/webm" src={source(video.assets.webm.path)}/>}
   {video.assets.mp4&&<source type="video/mp4" src={source(video.assets.mp4.path)}/>}
 </video>;
}
