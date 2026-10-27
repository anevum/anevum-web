import {useEffect} from "react";

/**
 * ANEVUM V140 — one progressive, public-only depth director.
 *
 * - Event delegation: no per-card React handlers, observers or input clones.
 * - Only public, anonymous-safe surfaces; never private Studio/auth/staff UI.
 * - CSS still renders all content when JS is unavailable or motion is disabled.
 * - No telemetry, storage, network, WebGL or non-functional visual controls.
 */
const PUBLIC_ROUTES=new Set([
 "/","/severance","/about","/status","/discover","/community","/creators","/boards"
]);
const SURFACES=[
 ".av138-plate",".av138-sev-mechanic",".av138-public-grid article",
 ".av138-sev-roadmap-grid li",".av138-gates li",".av138-studio-access nav > a",
 ".p136-discover-world",".p136-discover-results .p136-project-card",
 ".p136-creators .portal-box",".ch7-panel",".ch7-portals > a",
 ".v091-status-service",".av137-about-grid article"
].join(",");
const REVEALS=[
 ".av138-section-bar",".av138-plate",".av138-sev-mechanic",
 ".av138-gates li",".av138-sev-roadmap-grid li",".av138-studio-access",
 ".av138-approved",".av138-sev-archive",".av138-sev-statement",
 ".p136-discover-world",".p136-creators-hero",".ch7-panel",
 ".v091-status-service",".av137-about-grid article"
].join(",");

function isPublic(pathname:string){
 return PUBLIC_ROUTES.has(pathname)||/^\/creators\/[a-z0-9_-]+$/i.test(pathname);
}
function motionAllowed(){
 const device=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !window.matchMedia("(forced-colors: active)").matches &&
  !device?.saveData &&
  !["2g","slow-2g"].includes(device?.effectiveType||"");
}
export function PublicDepthDirectorV140({pathname,paused}:{pathname:string;paused:boolean}){
 useEffect(()=>{
  const enabled=isPublic(pathname);
  document.documentElement.dataset.av140Public=enabled?"true":"false";
  if(!enabled)return;
  const root=document.getElementById("main");
  if(!root)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const hover=window.matchMedia("(hover: hover) and (pointer: fine)");
  const forced=window.matchMedia("(forced-colors: active)");
  let alive=true;
  let active:HTMLElement|null=null;
  let raf=0;
  let latestX=0,latestY=0;
  let observer:IntersectionObserver|null=null;
  const registered=new Set<HTMLElement>();
  const reset=()=>{
   if(raf)cancelAnimationFrame(raf);
   raf=0;
   if(active){
    active.classList.remove("av140-tilt-active");
    active.style.removeProperty("--av140-tilt-x");
    active.style.removeProperty("--av140-tilt-y");
    active.style.removeProperty("--av140-light-x");
    active.style.removeProperty("--av140-light-y");
   }
   active=null;
  };
  const permitted=()=>alive&&!paused&&motionAllowed();
  const flush=()=>{
   raf=0;
   const node=active;
   if(!node||!permitted())return;
   const rect=node.getBoundingClientRect();
   if(rect.width<1||rect.height<1)return;
   const u=Math.max(0,Math.min(1,(latestX-rect.left)/rect.width));
   const v=Math.max(0,Math.min(1,(latestY-rect.top)/rect.height));
   node.style.setProperty("--av140-tilt-x",((.5-v)*4).toFixed(2)+"deg");
   node.style.setProperty("--av140-tilt-y",((u-.5)*4).toFixed(2)+"deg");
   node.style.setProperty("--av140-light-x",(u*100).toFixed(1)+"%");
   node.style.setProperty("--av140-light-y",(v*100).toFixed(1)+"%");
  };
  const pointer=(event:PointerEvent)=>{
   if(!permitted()){reset();return}
   const target=event.target;
   const candidate=target instanceof Element?target.closest<HTMLElement>(SURFACES):null;
   const next=candidate&&root.contains(candidate)?candidate:null;
   if(next!==active){
    reset();
    active=next;
    active?.classList.add("av140-tilt-active");
   }
   if(!active)return;
   latestX=event.clientX;latestY=event.clientY;
   if(!raf)raf=requestAnimationFrame(flush);
  };
  const leave=()=>reset();
  if("IntersectionObserver" in window&&!reduce.matches&&!forced.matches&&!paused){
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(entry.isIntersecting){
      const node=entry.target as HTMLElement;
      node.classList.remove("av140-reveal-pending");
      node.classList.add("av140-revealed");
      observer?.unobserve(node);
     }
    }
   },{threshold:.04,rootMargin:"0px 0px 24px 0px"});
  }
  const register=()=>{
   if(!observer)return;
   for(const element of Array.from(root.querySelectorAll<HTMLElement>(REVEALS))){
    if(registered.has(element))continue;
    registered.add(element);
    const rect=element.getBoundingClientRect();
    if(rect.top>window.innerHeight+25){
     element.classList.add("av140-reveal-pending");
     observer.observe(element);
    }
   }
  };
  register();
  let queued=0;
  const mutations=new MutationObserver(()=>{
   if(!queued)queued=requestAnimationFrame(()=>{queued=0;if(alive)register()});
  });
  mutations.observe(root,{childList:true,subtree:true});
  root.addEventListener("pointermove",pointer,{passive:true});
  root.addEventListener("pointerleave",leave,{passive:true});
  const onPreference=()=>{if(!permitted())reset()};
  reduce.addEventListener?.("change",onPreference);
  hover.addEventListener?.("change",onPreference);
  forced.addEventListener?.("change",onPreference);
  return ()=>{
   alive=false;
   mutations.disconnect();
   root.removeEventListener("pointermove",pointer);
   root.removeEventListener("pointerleave",leave);
   reduce.removeEventListener?.("change",onPreference);
   hover.removeEventListener?.("change",onPreference);
   forced.removeEventListener?.("change",onPreference);
   if(queued)cancelAnimationFrame(queued);
   observer?.disconnect();
   for(const element of registered){
    element.classList.remove("av140-reveal-pending","av140-revealed");
   }
   reset();
   delete document.documentElement.dataset.av140Public;
  };
 },[pathname,paused]);
 return null;
}
