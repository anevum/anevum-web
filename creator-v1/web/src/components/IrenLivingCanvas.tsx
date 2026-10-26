import {useEffect,useRef,useState,type ReactNode} from "react";
import type {IrenLivingRig,IrenMood} from "../lib/iren-living-rig-v088";

/**
 * One lazily mounted WebGL companion. Actual animated 3D is preferred when
 * available. The V087 vector art is retained solely for loading/fallback.
 * This renderer never shares assets or permissions with earned collectibles.
 */
export function IrenLivingCanvas({
 mood,expanded,paused,look=[0,0],fallback,vectorFirst=false
}:{
 mood:IrenMood;
 expanded:boolean;
 paused:boolean;
 look?:readonly [number,number];
 fallback:ReactNode;
 vectorFirst?:boolean;
}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const rig=useRef<IrenLivingRig|null>(null);
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);
 const initial=useRef({mood,expanded,paused,look});
 initial.current={mood,expanded,paused,look};
 useEffect(()=>{
  const el=canvas.current;
  if(vectorFirst||!el)return;
  let dead=false;
  const fail=()=>{rig.current?.dispose();rig.current=null;if(!dead){setReady(false);setFailed(true)}};
  const lost=(event:Event)=>{event.preventDefault();fail()};
  el.addEventListener("webglcontextlost",lost);
  const start=async()=>{
   try{
    const {IrenLivingRig}=await import("../lib/iren-living-rig-v088");
    if(dead)return;
    const instance=new IrenLivingRig(el,fail);
    if(dead){instance.dispose();return}
    rig.current=instance;
    const state=initial.current;
    instance.setMood(state.mood);
    instance.setExpanded(state.expanded);
    instance.setLook(state.look[0],state.look[1]);
    instance.setReducedMotion(state.paused||window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    instance.setVisible(document.visibilityState==="visible");
    instance.verifyVisibleFrame();
    instance.play();
    setReady(true);
   }catch{
    fail();
   }
  };
  void start();
  const resize=new ResizeObserver(()=>{
   try{rig.current?.render()}catch{fail()}
  });
  resize.observe(el);
  const visibility=()=>rig.current?.setVisible(document.visibilityState==="visible");
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const motion=()=>rig.current?.setReducedMotion(initial.current.paused||media.matches);
  document.addEventListener("visibilitychange",visibility);
  media.addEventListener("change",motion);
  return()=>{
   dead=true;
   resize.disconnect();
   el.removeEventListener("webglcontextlost",lost);
   document.removeEventListener("visibilitychange",visibility);
   media.removeEventListener("change",motion);
   rig.current?.dispose();rig.current=null;
  };
 },[vectorFirst]);
 useEffect(()=>{rig.current?.setMood(mood)},[mood]);
 useEffect(()=>{rig.current?.setExpanded(expanded)},[expanded]);
 useEffect(()=>{rig.current?.setLook(look[0],look[1])},[look[0],look[1]]);
 useEffect(()=>{rig.current?.setReducedMotion(paused||window.matchMedia("(prefers-reduced-motion: reduce)").matches)},[paused]);
 return <span className={"ir88-figure"+(vectorFirst?" ir137-vector-pet ir137-mood-"+mood:"")+(ready?" is-rendering":"")+(failed?" has-fallback":"")} aria-hidden="true">
  <span className="ir88-svg-fallback">{fallback}</span>
  {!vectorFirst&&!failed&&<canvas ref={canvas} className="ir88-3d-canvas" aria-hidden="true" tabIndex={-1}/>}
 </span>;
}
