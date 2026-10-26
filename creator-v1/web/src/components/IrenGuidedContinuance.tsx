import {useCallback,useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {Link,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "./OrbitalMark";
import {Icon} from "./Icons";
import {useIrenSignals} from "./AnevumNotifications";
import {LevelEmblem,AwardEmblem} from "./LevelEmblem";
import {IrenLivingCanvas} from "./IrenLivingCanvas";
import {IrenSpatialTour} from "./IrenSpatialTour";
import type {IrenMood} from "../lib/iren-living-rig-v088";
import "../iren-transmissions-v111.css";
import {irenStationForPath} from "../lib/iren-companion-context-v089";

/**
 * IREN Guided Continuance V080
 * Contextual, opt-in website education. This is a scripted guide, not an AI
 * chat service. It reads no private account data or unpublished content.
 */
type GuideStep={
  id:string;
  route:string;
  anchor:string;
  fallback?:string;
  eyebrow:string;
  title:string;
  description:string;
  hint:string;
};
type Spotlight={left:number;top:number;width:number;height:number};
type Progress={status?:"paused"|"completed"|"skipped";index?:number};
type Topic={id:string;label:string;detail:string;href:string;action:string};

const memberSteps:readonly GuideStep[]=[
  {id:"identity",route:"/member",anchor:'[data-iren-anchor="identity"]',
   eyebrow:"01 / PERSONAL CONTINUANCE",title:"This is your place.",
   description:"Your profile and member identity travel with you across ANEVUM. Your picture, handle and introduction are yours to shape.",
   hint:"Tap the highlighted identity area to edit your appearance, or continue the tour."},
  {id:"progress",route:"/member",anchor:'[data-iren-anchor="progress"]',fallback:'[data-iren-anchor="awards"]',
   eyebrow:"02 / EARNED RECOGNITION",title:"Discoveries are earned.",
   description:"Your Continuance level, XP and awards come from verified activity. The original Evolution of Everything artifacts are revealed only as you earn them.",
   hint:"Use Awards & stats to inspect what you have earned. This guide never grants XP."},
  {id:"privacy",route:"/member",anchor:'[data-iren-anchor="privacy"]',
   eyebrow:"03 / YOUR BOUNDARIES",title:"Visibility is your choice.",
   description:"Member spaces begin private. You decide whether to publish your wall, and whether your level and statistics appear publicly.",
   hint:"Open visibility settings to make a deliberate change; IREN will wait."},
  {id:"studio",route:"/member",anchor:'[data-iren-anchor="studio"]',fallback:'[data-iren-anchor="studio-tools"]',
   eyebrow:"04 / MAKE SOMETHING",title:"There is room to create.",
   description:"Creator Studio is where work is prepared and submitted. Creator publishing has its own verification and review rules; membership alone does not grant publishing or staff access.",
   hint:"Choose Creator Studio from the highlighted link, or open Profile & tools first if actions are grouped there."},
  {id:"discover",route:"/discover",anchor:'[data-iren-anchor="discover"]',
   eyebrow:"05 / DISCOVERY",title:"Follow what interests you.",
   description:"Filter genuine published projects by games, apps, art, learning and more. Open a project to see the creator's work and available experience.",
   hint:"Try a category when the tour ends. Empty results are real, not filler."},
  {id:"community",route:"/community",anchor:'[data-iren-anchor="community"]',
   eyebrow:"06 / THE COMMONS",title:"Find your people.",
   description:"The community connects members, creators and discussions. Posts and projects have moderation and publication boundaries, so activity you see is not fabricated.",
   hint:"Explore discussions, projects, and public member identities."},
  {id:"wayfinder",route:"/community",anchor:'[data-iren-anchor="navigation"]',fallback:'[data-iren-anchor="navigation-desktop"]',
   eyebrow:"07 / THE WAYFINDER",title:"The whole network, one menu.",
   description:"Use site navigation to move between worlds. Wayfinder is the menu on smaller screens; desktop links offer the same real destinations. Search finds projects and creators.",
   hint:"Use the highlighted Menu button on phones or the primary navigation on desktop. IREN remains available from its help companion."}
];
const visitorSteps:readonly GuideStep[]=[
  {id:"arrival",route:"/",anchor:'[data-iren-anchor="arrival"]',
   eyebrow:"01 / FIRST CONTACT",title:"You've reached ANEVUM.",
   description:"This is a creative network taking shape: a place to discover original work, meet people, and create. There is no required path and you can look around without signing up.",
   hint:"The entrance gives you direct access to discovery. The wayfinder below opens the other parts of the network."},
  {id:"wayfinder-home",route:"/",anchor:'[data-iren-anchor="arrival-paths"]',
   eyebrow:"02 / THE WAYFINDER",title:"Choose your direction.",
   description:"Discover real public work, enter Creator Studio while publishing is in testing, connect with the community, or join when you want your own member identity.",
   hint:"Each direction is an actual part of ANEVUM, not a simulated mission or a temporary test-game showcase."},
  memberSteps[4],
  memberSteps[5],
  memberSteps[6]
];
const topics:readonly Topic[]=[
  {id:"joining",label:"Join & verify",detail:"Choose a sign-in method currently enabled by ANEVUM. An eight-digit code from your inbox belongs only in the official sign-in form. IREN cannot see, request or retrieve it. After verification, choose a permanent handle. Your member space begins private.",href:"/join",action:"Open member access"},
  {id:"profile",label:"My identity",detail:"Your member space contains your wall, images, privacy controls, earned levels and player card. A verified member profile is separate from creator publishing permissions.",href:"/member",action:"Open member space"},
  {id:"discover",label:"Find something",detail:"Discover lists approved published projects. Filter by type or search for a specific project. ANEVUM does not create imaginary releases to fill empty listings.",href:"/discover",action:"Explore projects"},
  {id:"community",label:"Meet people",detail:"Community is where approved conversations, creator channels and public member spaces can be explored. Moderation and public visibility still apply.",href:"/community",action:"Visit community"},
  {id:"create",label:"Make & publish",detail:"Creator Studio prepares project submissions. Publishing and review are separate from ordinary member registration; do not assume access has been granted.",href:"/studio",action:"Explore Studio"},
  {id:"recognition",label:"XP & artifacts",detail:"XP, medals, badges, and the 30 Evolution of Everything specimens are earned through verified systems. Locked specimens are never disclosed by this guide.",href:"/levels",action:"Understand levels"},
  {id:"safety",label:"Privacy & safety",detail:"Your wall is private until you publish it. Protect personal information, use account visibility controls and review the community rules before sharing.",href:"/guide",action:"Read the field guide"}
];
const storagePrefix="anevum.iren.guided-continuance.v080.";
// Opt-in only on an independently reviewed build. Legacy release unchanged.
const spatialTourEnabled=import.meta.env.VITE_IREN_SPATIAL_GUIDE==="true";
// First contact is a presentation preference, not a member/account flag.
// A module fallback suppresses repeats when persistent browser storage is unavailable.
const firstContactStorageKey="anevum.iren.first-contact.v092";
let firstContactShownInMemory=false;
function firstContactSeen(){
  if(firstContactShownInMemory)return true;
  try{return window.localStorage.getItem(firstContactStorageKey)==="seen";}catch{return false;}
}
function rememberFirstContact(){
  firstContactShownInMemory=true;
  try{window.localStorage.setItem(firstContactStorageKey,"seen");}catch{/* Optional preference. */}
}
function readProgress(key:string):Progress{
  try{
    const data=JSON.parse(window.localStorage.getItem(key)||"{}") as Progress;
    if(data&&["paused","completed","skipped"].includes(data.status||""))return data;
  }catch{/* Privacy mode or disabled browser storage must not block the guide. */}
  return {};
}
function writeProgress(key:string,progress:Progress){
  try{window.localStorage.setItem(key,JSON.stringify(progress));}catch{/* Nonpersistent fallback. */}
}
function hiddenInStorage(key:string){
  try{return window.localStorage.getItem(key+".hidden")==="yes";}catch{return false;}
}
function setStoredHidden(key:string,hidden:boolean){
  try{if(hidden)window.localStorage.setItem(key+".hidden","yes");else window.localStorage.removeItem(key+".hidden");}catch{/* Optional preference. */}
}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
const motionPrefix="anevum.iren.living.motion.v088.";
const positionPrefix="anevum.iren.living.position.v088.";
type DockPosition={right:number;bottom:number};
function readPaused(key:string){
 try{return window.localStorage.getItem(motionPrefix+key)==="paused"}catch{return false}
}
function readPosition(key:string):DockPosition|null{
 try{
  const raw=window.localStorage.getItem(positionPrefix+key);if(!raw)return null;
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=="object")return null;
  const p=value as Record<string,unknown>;
  if(typeof p.right!=="number"||typeof p.bottom!=="number"||
     !Number.isFinite(p.right)||!Number.isFinite(p.bottom)||
     p.right<0||p.bottom<0||p.right>7000||p.bottom>7000)return null;
  return {right:p.right,bottom:p.bottom};
 }catch{return null}
}
function writePosition(key:string,position:DockPosition){
 try{window.localStorage.setItem(positionPrefix+key,JSON.stringify(position))}catch{/* Optional browser preference. */}
}


/** Tiny orbital helper, rendered as vectors rather than another floating pill. */
function IrenScout(){
 const uid=useId().replaceAll(':','');
 const shell=uid+'-shell',face=uid+'-face',glass=uid+'-glass';
 return <svg className="ir87-scout-art ir137-pet-art" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={shell} x1="0" y1="0" x2=".95" y2="1">
    <stop stopColor="#5b7588"/><stop offset=".13" stopColor="#273946"/>
    <stop offset=".58" stopColor="#141e27"/><stop offset="1" stopColor="#060b10"/>
   </linearGradient>
   <linearGradient id={face} x1="0" y1="0" x2=".15" y2="1">
    <stop stopColor="#132632"/><stop offset=".55" stopColor="#0a161e"/>
    <stop offset="1" stopColor="#04090e"/>
   </linearGradient>
   <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#e6f6ff" stopOpacity=".35"/>
    <stop offset=".38" stopColor="#a7d6e6" stopOpacity=".07"/>
    <stop offset="1" stopColor="#000000" stopOpacity=".3"/>
   </linearGradient>
  </defs>
  <path d="M33 15H92L109 31V94L93 112H34L17 95V33Z"
    fill={'url(#'+shell+')'} stroke="#91afbc" strokeWidth="2"/>
  <path d="M33 22H89L101 34V91L90 103H36L25 91V36Z"
    fill="#0b131b" stroke="#526e7d" strokeWidth="1.4"/>
  <path d="M30 28H96V91H30Z" fill={'url(#'+face+')'} stroke="#2d4f5d" strokeWidth="1.5"/>
  <path d="M36 33H90L95 39V81L89 87H37L33 82V39Z"
    fill="#07131c" stroke="#597b8a" strokeWidth=".8"/>
  <path d="M37 35H89L93 40V62Q65 73 34 48V40Z" fill={'url(#'+glass+')'}/>
  <g className="ir137-pet-eyes" fill="#bcecf4">
   <rect className="ir137-pet-eye" x="45" y="51" width="10" height="17" rx="3"/>
   <rect className="ir137-pet-eye" x="72" y="51" width="10" height="17" rx="3"/>
  </g>
  <path className="ir137-pet-mouth" d="M55 77Q63 82 72 77" fill="none" stroke="#82c4d6" strokeWidth="2.7" strokeLinecap="round"/>
  <path d="M44 96H83" stroke="#567581" strokeWidth="1.5" strokeLinecap="round"/>
  <rect x="58" y="94" width="11" height="4" rx="2" fill="#86c3d3"/>
  <path d="M24 42H17M24 86H17M104 42H111M104 86H111"
    stroke="#728f9e" strokeWidth="2" strokeLinecap="round"/>
  <path d="M34 15L31 10M91 15L97 10" stroke="#6f93a0" strokeWidth="2" strokeLinecap="round"/>
  <path d="M37 107H91" stroke="#a8c7d2" strokeOpacity=".45"/>
  <path d="M33 15H92L109 31V94L93 112H34L17 95V33Z"
    fill="none" stroke="#c7e3eb" strokeOpacity=".14" strokeWidth="1"/>
 </svg>;
}

export function IrenGuidedContinuance({memberId}:{memberId:string|null}){
  const {pathname,search}=useLocation();
  const navigate=useNavigate();
  const {recent,unreadCount,markSignalsSeen,activeTransmission,transmissionPhase,dismissTransmission}=useIrenSignals();
  const storageKey=storagePrefix+(memberId||"visitor");
  const steps=memberId?memberSteps:visitorSteps;
  const station=irenStationForPath(pathname,Boolean(memberId));
  const [tourIndex,setTourIndex]=useState<number|null>(null);
  const [panelOpen,setPanelOpen]=useState(false);
  const [welcomeOpen,setWelcomeOpen]=useState(false);
  const [welcomeExpanded,setWelcomeExpanded]=useState(false);
  const [activeView,setActiveView]=useState<"help"|"updates">("help");
  const [activeTopic,setActiveTopic]=useState("discover");
  const [hidden,setHidden]=useState(()=>hiddenInStorage(storageKey));
  const [spotlight,setSpotlight]=useState<Spotlight|null>(null);
  const [mood,setMood]=useState<IrenMood>("idle");
  const [guideTravelling,setGuideTravelling]=useState(false);
  const [motionPaused,setMotionPaused]=useState(()=>readPaused(storageKey));
  const [dockPosition,setDockPosition]=useState<DockPosition|null>(()=>readPosition(storageKey));
  const [look,setLook]=useState<[number,number]>([0,0]);
  const [wakeCycle,setWakeCycle]=useState(0);
  const [viewport,setViewport]=useState(()=>({width:window.innerWidth,height:window.innerHeight}));
  // The existing IREN rig presents the queue. No second floating companion mounts.
  const broadcast=Boolean(activeTransmission&&!hidden&&!panelOpen&&tourIndex===null);
  const dragRef=useRef<{id:number;x:number;y:number;right:number;bottom:number;moved:boolean}|null>(null);
  const suppressClick=useRef(false);
  const pointerStamp=useRef(0);
  const lastSignalId=useRef<number|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const dockRef=useRef<HTMLButtonElement>(null);
  const companionRef=useRef<HTMLDivElement>(null);
  const closePanelRef=useRef<HTMLButtonElement>(null);
  const panelInvokerRef=useRef<HTMLElement|null>(null);
  const restorePanelFocus=useCallback(()=>{
    const invoker=panelInvokerRef.current;
    if(invoker?.isConnected)invoker.focus({preventScroll:true});
    else dockRef.current?.focus({preventScroll:true});
  },[]);
  // Only explicit user actions move keyboard focus into the panel.
  // The unsolicited first visit must never steal focus from page content.
  const focusRequested=useRef(false);

  useEffect(()=>{
    setTourIndex(null);
    setPanelOpen(false);
    setWelcomeOpen(false);
    setWelcomeExpanded(false);
    setActiveView("help");
    setMood("idle");
    setMotionPaused(readPaused(storageKey));
    setDockPosition(readPosition(storageKey));
    setLook([0,0]);
    lastSignalId.current=null;
    setSpotlight(null);
    setHidden(hiddenInStorage(storageKey));
  },[storageKey]);

  // Tour cards mask the main IREN transmission; pause automatic dismissal
  // until the visitor exits. The existing queue observes body-class changes.
  useEffect(()=>{
    document.body.classList.toggle("ir80-tour-active",tourIndex!==null);
    return()=>document.body.classList.remove("ir80-tour-active");
  },[tourIndex]);

  // Page-specific assistance chooses a relevant topic without reading private
  // route payloads or guessing privileges. First contact is handled separately.
  useEffect(()=>{
    setActiveTopic(pathname==="/join"?"joining":irenStationForPath(pathname,Boolean(memberId)).topic);
    if(panelOpen&&tourIndex===null)setMood("curious");
  },[pathname,memberId]);

  // V115: the visible home wayfinder and IREN console offer first contact
  // without an unsolicited timed overlay. The one genuine companion in Shell
  // opens orientation only after a visitor explicitly chooses it. This also
  // avoids duplicate first-visit surfaces and never steals initial focus.
  useEffect(()=>{
    if(panelOpen&&focusRequested.current){
      focusRequested.current=false;
      closePanelRef.current?.focus({preventScroll:true});
    }
  },[panelOpen]);

  useEffect(()=>{
    if(welcomeOpen&&pathname!=="/"&&!(spatialTourEnabled&&memberId&&pathname==="/member")){
      setWelcomeOpen(false);
      setPanelOpen(false);
    }
  },[pathname,welcomeOpen,memberId]);

  const pause=useCallback((restoreFocus=true)=>{
    setTourIndex(index=>{
      if(index!==null)writeProgress(storageKey,{status:"paused",index});
      return null;
    });
    setSpotlight(null);
    if(restoreFocus)window.requestAnimationFrame(()=>dockRef.current?.focus({preventScroll:true}));
  },[storageKey]);

  const finish=useCallback((status:"completed"|"skipped")=>{
    writeProgress(storageKey,{status,index:steps.length});
    setTourIndex(null);
    setSpotlight(null);
    window.requestAnimationFrame(()=>dockRef.current?.focus({preventScroll:true}));
  },[storageKey,steps.length]);

  const start=useCallback((fresh=false)=>{
    const stored=readProgress(storageKey);
    const resume=stored.status==="paused"&&typeof stored.index==="number"
      ?clamp(Math.floor(stored.index),0,steps.length-1):0;
    setStoredHidden(storageKey,false);
    setHidden(false);
    setPanelOpen(false);
    setWelcomeOpen(false);
    setWelcomeExpanded(false);
    rememberFirstContact();
    setTourIndex(fresh?0:resume);
  },[storageKey,steps.length]);

  useEffect(()=>{
    const onCreated=(event:Event)=>{
      const detail=(event as CustomEvent<{memberId:string}>).detail;
      if(!memberId||detail?.memberId!==memberId||readProgress(storageKey).status)return;
      rememberFirstContact();
      if(spatialTourEnabled){
        setWelcomeOpen(true);setWelcomeExpanded(false);setActiveView("help");
        setMood("greet");setPanelOpen(true);
      }else start(true);
    };
    const onOpen=()=>{
      const active=document.activeElement;
      if(active instanceof HTMLElement&&active.matches("button,a,input")&&!companionRef.current?.contains(active))
        panelInvokerRef.current=active;
      rememberFirstContact();
      setWelcomeOpen(false);
      setWelcomeExpanded(false);
      setStoredHidden(storageKey,false);
      setHidden(false);
      setTourIndex(null);
      setActiveView("help");
      setMood("greet");
      focusRequested.current=true;
      setPanelOpen(true);
      // Repeated help requests should focus the existing open panel too.
      window.requestAnimationFrame(()=>{
        closePanelRef.current?.focus({preventScroll:true});
        focusRequested.current=false;
      });
    };
    const onStart=()=>start();
    const onIntro=()=>{
      const active=document.activeElement;
      if(active instanceof HTMLElement&&active.matches("button,a,input")&&!companionRef.current?.contains(active))
        panelInvokerRef.current=active;
      // Explicit first-contact action from the arrival scene. Reuse this
      // companion's existing verified welcome, not a second IREN instance.
      rememberFirstContact();
      setStoredHidden(storageKey,false);
      setHidden(false);
      setTourIndex(null);
      setWelcomeOpen(true);
      setWelcomeExpanded(true);
      setPanelOpen(true);
      setActiveView("help");
      setMood("greet");
      focusRequested.current=true;
    };
    window.addEventListener("anevum:member-created",onCreated);
    window.addEventListener("anevum:iren-open",onOpen);
    window.addEventListener("anevum:iren-tour",onStart);
    window.addEventListener("anevum:iren-intro",onIntro);
    return()=>{
      window.removeEventListener("anevum:member-created",onCreated);
      window.removeEventListener("anevum:iren-open",onOpen);
      window.removeEventListener("anevum:iren-tour",onStart);
      window.removeEventListener("anevum:iren-intro",onIntro);
    };
  },[memberId,storageKey,start]);

  // One anchored panel on all routes, not a second notification dock.
  useEffect(()=>{
    if(!panelOpen)return;
    const onOutside=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!companionRef.current?.contains(event.target)){
        setPanelOpen(false);
        setWelcomeOpen(false);
      }
    };
    const onEscape=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        setPanelOpen(false);
        setWelcomeOpen(false);
        restorePanelFocus();
      }
    };
    document.addEventListener("pointerdown",onOutside);
    document.addEventListener("keydown",onEscape);
    return()=>{
      document.removeEventListener("pointerdown",onOutside);
      document.removeEventListener("keydown",onEscape);
    };
  },[panelOpen,restorePanelFocus]);

  useEffect(()=>{
    if(panelOpen&&activeView==="updates"&&memberId)markSignalsSeen();
    // Refresh of server history is intentional: notice indicators clear while
    // the member is actually viewing Signals rather than on transient toast ACK.
  },[panelOpen,activeView,memberId,recent]);

  // Motion state is visual only; notifications and earned rewards remain
  // server-authoritative, and historic signals never trigger fake celebrations.
  useEffect(()=>{
    const latest=recent.reduce((max,item)=>Math.max(max,item.id),0);
    if(lastSignalId.current===null){lastSignalId.current=latest;return;}
    if(latest<=lastSignalId.current)return;
    const arriving=recent.find(item=>item.id>lastSignalId.current!);
    lastSignalId.current=latest;
    if(!memberId||unreadCount<1||!arriving)return;
    setMood(arriving.kind==="level"?"celebrate":"notify");
  },[recent,memberId,unreadCount]);

  useEffect(()=>{
    if(!activeTransmission||hidden||tourIndex!==null){
      // Release the transient pointing pose when the signal is dismissed;
      // ordinary IREN moods, member tours and earned recognition stay intact.
      setMood(previous=>previous==="guide"?"idle":previous);
      return;
    }
    setMood(activeTransmission.kind==="level"||activeTransmission.kind==="award"?"celebrate":"guide");
  },[activeTransmission?.key,hidden,tourIndex]);

  useEffect(()=>{
    const measure=()=>setViewport({width:window.innerWidth,height:window.innerHeight});
    window.addEventListener("resize",measure);
    window.addEventListener("orientationchange",measure);
    return()=>{window.removeEventListener("resize",measure);window.removeEventListener("orientationchange",measure)};
  },[]);

  // Expressiveness settles naturally; IREN is never forced into a permanent
  // thinking, greeting or celebration pose after a one-time interaction.
  useEffect(()=>{
    const durations:Partial<Record<IrenMood,number>>={
      greet:1900,think:2200,notify:2500,celebrate:3200,curious:4200
    };
    const wait=durations[mood];
    if(!wait)return;
    const timer=window.setTimeout(()=>setMood(prev=>
      prev===mood?"idle":prev),wait);
    return()=>window.clearTimeout(timer);
  },[mood,panelOpen]);

  // Long-quiet characters settle into a low-energy pose to preserve mobile
  // battery and let the user's content take priority.
  useEffect(()=>{
    if(panelOpen||hidden||tourIndex!==null)return;
    const timer=window.setTimeout(()=>setMood(previous=>previous==="idle"?"rest":previous),32000);
    return()=>window.clearTimeout(timer);
  },[panelOpen,hidden,tourIndex,pathname,wakeCycle]);
  const step=tourIndex===null?null:steps[tourIndex]||null;
  useEffect(()=>{
    if(!step){setGuideTravelling(false);return;}
    setGuideTravelling(true);
    const timer=window.setTimeout(()=>setGuideTravelling(false),720);
    return()=>window.clearTimeout(timer);
  },[step?.id]);

  useEffect(()=>{
    if(!step)return;
    // Member steps always need overview controls in view, even if a previous
    // visit left a wall/profile/appearance tab in the URL.
    const wrongTab=step.route==="/member"&&new URLSearchParams(search).get("tab")!=="overview";
    if(pathname!==step.route||wrongTab)
      navigate(step.route+(step.route==="/member"?"?tab=overview":""),{replace:true});
  },[navigate,pathname,search,step?.id,step?.route]);

  useEffect(()=>{
    if(!step||pathname!==step.route||
       (step.route==="/member"&&new URLSearchParams(search).get("tab")!=="overview")){
      setSpotlight(null);return;
    }
    let frame=0,scrolled=false;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Existing anchors may be present inside closed <details> or hidden at a
    // responsive breakpoint. Prefer a painted, measurable control instead.
    const isVisible=(target:HTMLElement|null):target is HTMLElement=>{
      if(!target||!target.isConnected||!target.getClientRects().length)return false;
      // An author stylesheet may give descendants of closed <details> a
      // nonzero DOMRect, although they are not interactable. Respect every
      // closed disclosure ancestor; only its direct summary is eligible.
      for(let ancestor=target.parentElement;ancestor;ancestor=ancestor.parentElement){
        if(ancestor.matches('details:not([open])')){
          const summary=ancestor.querySelector(':scope > summary');
          if(!summary?.contains(target))return false;
        }
      }
      const style=window.getComputedStyle(target);
      const rect=target.getBoundingClientRect();
      return style.display!=="none"&&style.visibility!=="hidden"&&
        rect.width>0&&rect.height>0;
    };
    const findTarget=()=>{
      const primary=document.querySelector<HTMLElement>(step.anchor);
      if(isVisible(primary))return primary;
      const fallback=step.fallback?document.querySelector<HTMLElement>(step.fallback):null;
      return isVisible(fallback)?fallback:null;
    };
    const measure=()=>{
      const container=findTarget();
      if(!container){setSpotlight(null);return;}
      // Spatial guidance highlights the meaningful control/heading rather than
      // treating an entire scrolled page section as a phone-sized spotlight.
      const outer=container.getBoundingClientRect();
      const large=spatialTourEnabled&&(outer.height>window.innerHeight*.42||
        outer.width>window.innerWidth*.86);
      const target=large
        ?container.querySelector<HTMLElement>('h1,h2,h3,[role="heading"]')||container
        :container;
      let rect=target.getBoundingClientRect();
      if(!scrolled){
        scrolled=true;
        if(rect.top<78||rect.bottom>window.innerHeight-160||rect.left<8||rect.right>window.innerWidth-8){
          target.scrollIntoView({behavior:reduced?"instant":"smooth",block:"center",inline:"nearest"});
          // Layout and nested scroll offsets can change synchronously (and
          // may continue changing during smooth motion). Never spotlight
          // the stale pre-scroll rectangle; scroll events update it again.
          rect=target.getBoundingClientRect();
        }
      }
      const left=clamp(rect.left-7,8,window.innerWidth-8);
      const right=clamp(rect.right+7,8,window.innerWidth-8);
      const top=clamp(rect.top-7,8,window.innerHeight-8);
      const bottom=clamp(rect.bottom+7,8,window.innerHeight-8);
      setSpotlight(right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null);
    };
    const schedule=()=>{
      window.cancelAnimationFrame(frame);
      frame=window.requestAnimationFrame(measure);
    };
    const observer=new MutationObserver(schedule);
    observer.observe(document.getElementById("main")||document.body,{childList:true,subtree:true});
    schedule();
    window.addEventListener("resize",schedule);
    window.addEventListener("scroll",schedule,true);
    return()=>{
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize",schedule);
      window.removeEventListener("scroll",schedule,true);
    };
  },[step?.id,step?.route,pathname,search]);

  useEffect(()=>{
    if(spatialTourEnabled)return; // No autofocus after spatial tour transitions.
    if(tourIndex!==null)dialogRef.current?.querySelector<HTMLButtonElement>("[data-iren-next]")?.focus({preventScroll:true});
  },[tourIndex]);

  useEffect(()=>{
    if(tourIndex===null)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();pause();}
      if(event.key==="Tab"&&!spatialTourEnabled){
        // Only the legacy modal traps focus, not the non-modal guide., but highlighted page
        // controls remain available via an explicit pointer click to pause.
        const buttons=[...(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])")||[])];
        const first=buttons[0],last=buttons[buttons.length-1];
        if(!first||!last)return;
        if(event.shiftKey&&(document.activeElement===first||!dialogRef.current?.contains(document.activeElement))){
          event.preventDefault();last.focus();
        }else if(!event.shiftKey&&(document.activeElement===last||!dialogRef.current?.contains(document.activeElement))){
          event.preventDefault();first.focus();
        }
      }
      if(event.key==="ArrowRight"&&event.altKey){event.preventDefault();setTourIndex(index=>index===null?null:Math.min(index+1,steps.length-1));}
      if(event.key==="ArrowLeft"&&event.altKey){event.preventDefault();setTourIndex(index=>index===null?null:Math.max(0,index-1));}
    };
    const onTargetClick=(event:MouseEvent)=>{
      const current=steps[tourIndex];
      const target=document.querySelector(current.anchor)||(
        current.fallback?document.querySelector(current.fallback):null);
      if(target&&event.target instanceof Node&&target.contains(event.target))pause(false);
    };
    document.addEventListener("keydown",onKey,true);
    document.addEventListener("click",onTargetClick,true);
    return()=>{
      document.removeEventListener("keydown",onKey,true);
      document.removeEventListener("click",onTargetClick,true);
    };
  },[tourIndex,steps, pause]);

  const next=()=>{
    if(tourIndex===null)return;
    if(tourIndex===steps.length-1){finish("completed");return;}
    const following=tourIndex+1;
    writeProgress(storageKey,{status:"paused",index:following});
    setSpotlight(null);
    setTourIndex(following);
  };
  const hide=()=>{
    setPanelOpen(false);
    setWelcomeOpen(false);
    setStoredHidden(storageKey,true);
    setHidden(true);
  };
  const closeWelcome=()=>{
    setWelcomeOpen(false);
    setWelcomeExpanded(false);
    setPanelOpen(false);
  };
  const closePanel=()=>{
    closeWelcome();
    restorePanelFocus();
  };
  const currentTopic=topics.find(topic=>topic.id===activeTopic)||topics[0];
  const isMobile=viewport.width<=650;
  const floatingInvite=spatialTourEnabled&&panelOpen&&welcomeOpen&&!welcomeExpanded;
  const spriteSize=broadcast?(isMobile?100:140):floatingInvite?82:panelOpen?(isMobile?130:164):54;
  // Keep IREN clear of fixed Wayfinder/header controls even if dragged
  // directly against the top of the viewport or restored from old storage.
  const topClearance=isMobile?74:88;
  const bottomLimit=Math.max(10,viewport.height-spriteSize-topClearance);
  const safePosition=dockPosition?{
    right:clamp(dockPosition.right,10,Math.max(10,viewport.width-spriteSize-10)),
    bottom:clamp(dockPosition.bottom,10,bottomLimit)
  }:null;
  // On the text-led Aura Codex, park the compact helper against the left
  // viewport edge by default: the card meanings occupy the right side.
  // Never override a member's draggable, persisted dock position.
  // CSS fixed-position right offsets use the layout viewport, excluding a
  // desktop scrollbar. window.innerWidth may include that scrollbar, so use
  // clientWidth here or the helper can be clipped at the left edge.
  const layoutWidth=document.documentElement.clientWidth||viewport.width;
  const codexCornerRight=!dockPosition&&pathname==="/auras"
    ?Math.max(10,layoutWidth-spriteSize-(isMobile?10:16)):null;
  const companionStyle:CSSProperties=broadcast?{}:safePosition
    ?{right:safePosition.right,bottom:safePosition.bottom}
    :codexCornerRight!==null?{right:codexCornerRight}:{};
  const panelWidth=Math.min(isMobile?326:338,layoutWidth-(isMobile?22:24));
  const panelRight=safePosition?.right??codexCornerRight??(isMobile?10:16);
  const panelShift=Math.max(0,panelRight-(layoutWidth-panelWidth-10));
  // A dragged character may sit near the top of a phone. Flip the help panel
  // below it when necessary, rather than hiding its close/action controls
  // above the viewport. All bounds are computed from actual available space.
  const dockBottom=safePosition?.bottom??(isMobile?12:20);
  const roomAbove=viewport.height-dockBottom-spriteSize-12;
  const roomBelow=dockBottom-12;
  const helpBelow=Boolean(panelOpen&&safePosition&&roomAbove<220&&roomBelow>roomAbove);
  const helpStyle:CSSProperties=panelShift?{right:-panelShift}:{};
  if(helpBelow){
    helpStyle.top=spriteSize+10;
    helpStyle.bottom="auto";
    helpStyle.maxHeight=Math.max(90,Math.min(roomBelow-12,viewport.height*.70));
  }else if(panelOpen&&safePosition){
    helpStyle.maxHeight=Math.max(90,Math.min(roomAbove-12,viewport.height*.70));
  }
  const panelStyle:CSSProperties={};
  if(step&&!isMobile){
    const width=Math.min(400,window.innerWidth-32);
    const center=spotlight?spotlight.left+spotlight.width/2:window.innerWidth/2;
    panelStyle.left=clamp(center-width/2,16,window.innerWidth-width-16);
    // The guide is not a fixed 304px card: copy length and font scaling can
    // increase its height. Use the actual scroll height and constrain the
    // available area below the selected top so controls never leave the screen.
    const viewportHeight=window.innerHeight;
    const panelHeight=Math.min(
      Math.max(dialogRef.current?.scrollHeight||360,304),
      Math.max(120,viewportHeight-24)
    );
    const maxTop=Math.max(12,viewportHeight-panelHeight-12);
    const desiredTop=spotlight
      ?spotlight.top>panelHeight+30
        ?spotlight.top-panelHeight-14
        :spotlight.top+spotlight.height+14
      :(viewportHeight-panelHeight)/2;
    const top=clamp(desiredTop,12,maxTop);
    panelStyle.top=top;
    panelStyle.maxHeight=Math.max(100,viewportHeight-top-12);
  }

  // The guide scout is a real second presentation of the *same* companion:
  // compact mode is unmounted throughout the tour, never double-mounted.
  // Coordinates are bounded to the visible area and animate between anchors.
  const botWidth=isMobile?90:118,botHeight=isMobile?106:139;
  // For tall or full-width targets there is no safe adjacent space. Dock the
  // expressive 3D companion into the guide header instead of covering content.
  const embeddedGuideBot=isMobile||!spotlight||
    spotlight.width>viewport.width*.58||
    spotlight.height>viewport.height*.48;
  const preferRight=spotlight
    ?spotlight.left+spotlight.width+botWidth+20<viewport.width
    :true;
  // Large full-width highlights have no free side. Park beside the guide
  // card rather than covering search fields and headings inside the target.
  const wideSpotlight=Boolean(spotlight&&spotlight.width>viewport.width*.76);
  const nearCardX=typeof panelStyle.left==="number"?panelStyle.left+410:viewport.width-botWidth-24;
  const anchorX=wideSpotlight?nearCardX:spotlight?
    (preferRight?spotlight.left+spotlight.width+10:spotlight.left-botWidth-10)
    :viewport.width-botWidth-24;
  const anchorY=wideSpotlight&&spotlight?spotlight.top+spotlight.height+15:
    spotlight?spotlight.top+Math.min(spotlight.height*.45,70)-botHeight*.5:84;
  const guideBotStyle:CSSProperties={
    width:botWidth,height:botHeight,
    left:clamp(anchorX,8,Math.max(8,viewport.width-botWidth-8)),
    top:clamp(anchorY,60,Math.max(60,(isMobile?viewport.height*.44:viewport.height)-botHeight-15))
  };
  // IREN's optical rig and active pointing arm aim at the actual highlighted
  // site element, not a fixed decorative pose. No hidden DOM data is read.
  const guideEyeX=spotlight?spotlight.left+spotlight.width*.5:viewport.width*.5;
  const guideEyeY=spotlight?spotlight.top+spotlight.height*.5:viewport.height*.5;
  const guideBotX=typeof guideBotStyle.left==="number"?guideBotStyle.left+botWidth*.5:viewport.width*.5;
  const guideBotY=typeof guideBotStyle.top==="number"?guideBotStyle.top+botHeight*.5:viewport.height*.5;
  const guideLook:readonly [number,number]=[
    clamp((guideEyeX-guideBotX)/Math.max(135,viewport.width*.28),-1,1),
    clamp((guideEyeY-guideBotY)/Math.max(125,viewport.height*.32),-1,1)
  ];
  const beginDrag=(event:React.PointerEvent<HTMLButtonElement>)=>{
    if(event.pointerType==="mouse"&&event.button!==0)return;
    const bounds=event.currentTarget.getBoundingClientRect();
    const box=companionRef.current?.getBoundingClientRect();
    dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY,
      right:viewport.width-(box?.right??bounds.right),
      bottom:viewport.height-(box?.bottom??bounds.bottom),moved:false};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag=(event:React.PointerEvent<HTMLButtonElement>)=>{
    const drag=dragRef.current;
    if(drag?.id===event.pointerId){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved&&Math.hypot(dx,dy)>7)drag.moved=true;
      if(drag.moved){
        const next={right:clamp(drag.right-dx,10,Math.max(10,viewport.width-spriteSize-10)),
          bottom:clamp(drag.bottom-dy,10,bottomLimit)};
        setDockPosition(next);suppressClick.current=true;return;
      }
    }
    const now=performance.now();
    if(now-pointerStamp.current<75)return;
    pointerStamp.current=now;
    const rect=event.currentTarget.getBoundingClientRect();
    setLook([clamp((event.clientX-(rect.left+rect.width/2))/(rect.width*.5),-1,1),
      clamp((event.clientY-(rect.top+rect.height/2))/(rect.height*.5),-1,1)]);
  };
  const finishDrag=(event:React.PointerEvent<HTMLButtonElement>)=>{
    const drag=dragRef.current;
    if(!drag||drag.id!==event.pointerId)return;
    if(drag.moved){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      const next={right:clamp(drag.right-dx,10,Math.max(10,viewport.width-spriteSize-10)),
        bottom:clamp(drag.bottom-dy,10,bottomLimit)};
      setDockPosition(next);writePosition(storageKey,next);
    }
    dragRef.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const changeMotion=()=>{
    const paused=!motionPaused;
    setMotionPaused(paused);
    try{window.localStorage.setItem(motionPrefix+storageKey,paused?"paused":"active")}catch{/* Optional preference. */}
  };
  const attendPointer=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!panelOpen||dragRef.current)return;
    const now=performance.now();
    if(now-pointerStamp.current<75)return;
    pointerStamp.current=now;
    const bot=dockRef.current?.getBoundingClientRect();
    if(!bot)return;
    setLook([clamp((event.clientX-bot.left-bot.width*.5)/(bot.width*.75),-1,1),
      clamp((event.clientY-bot.top-bot.height*.5)/(bot.height*.75),-1,1)]);
  };
  const attendFocus=(event:React.FocusEvent<HTMLDivElement>)=>{
    if(!panelOpen||!(event.target instanceof HTMLElement))return;
    const target=event.target.getBoundingClientRect(),bot=dockRef.current?.getBoundingClientRect();
    if(!bot)return;
    setLook([clamp((target.left+target.width*.5-bot.left-bot.width*.5)/(bot.width*1.2),-1,1),
      clamp((target.top+target.height*.5-bot.top-bot.height*.5)/(bot.height*1.2),-1,1)]);
  };
  const restoreDock=()=>{
    setDockPosition(null);
    try{window.localStorage.removeItem(positionPrefix+storageKey)}catch{/* Optional preference. */}
  };

  return <>
    {tourIndex===null&&!hidden&&<div ref={companionRef}
      className={"ir80-companion ir87-companion ir88-companion"+(panelOpen&&!floatingInvite?" ir88-companion-expanded":"")+(floatingInvite?" ir97-invite-active":"")+(broadcast?" ir111-transmitting ir111-phase-"+transmissionPhase:"")+(motionPaused?" ir111-motion-paused":"")}
      style={companionStyle}
      onPointerMove={attendPointer} onFocusCapture={attendFocus}
      onPointerLeave={()=>setLook([0,0])}>
      {panelOpen&&(floatingInvite?<section id="ir87-panel" className="ir97-invite" style={helpStyle} aria-label="IREN first visit">
        <span className="ir97-invite-label">IREN / FIELD COMPANION</span>
        <p className="ir97-invite-voice" role="status" aria-live="polite">I'm IREN. Want to explore the Continuance?</p>
        <div className="ir97-invite-actions">
          <button type="button" onClick={()=>start(true)}>Show me</button>
          <button type="button" onClick={closePanel}>Not now</button>
          <button type="button" onClick={()=>setWelcomeExpanded(true)}>More choices</button>
        </div>
      </section>:<section id="ir87-panel" className="ir80-help ir87-panel" style={helpStyle} aria-label="IREN companion">
        <header className="ir80-help-head">
          <span className="ir80-code">IREN / CONTINUANCE COMPANION
            <small className="ir88-station">{station.code}</small></span>
          <button type="button" ref={closePanelRef} className="ir80-icon-button" aria-label="Close IREN" onClick={closePanel}><Icon name="close" size={17}/></button>
        </header>
        {activeTransmission&&<aside className="ir111-inline" aria-label="Current IREN transmission">
          <span>IREN / INCOMING SIGNAL</span>
          <strong>{activeTransmission.title}</strong>
          {activeTransmission.detail&&<p>{activeTransmission.detail}</p>}
          {activeTransmission.preview&&<small>Visual preview only. Nothing was awarded.</small>}
          <button type="button" onClick={()=>dismissTransmission(activeTransmission)}>Dismiss signal</button>
        </aside>}
        {welcomeOpen?<div className="ir92-first-contact" aria-label="First visit guidance">
          <p className="ir92-voice" role="status" aria-live="polite">Signal established. I'm IREN, your Continuance Institute field guide.</p>
          <h2>Welcome to the Continuance.</h2>
          <p className="ir92-intro">ANEVUM is a growing creative network. Discover original work, meet people, or begin building. You don't need an account just to explore.</p>
          <div className="ir92-intent-grid" aria-label="Choose your first destination">
            <Link to="/discover" onClick={closeWelcome}><span>01 / DISCOVER</span><strong>Explore the network</strong></Link>
            <Link to="/studio" onClick={closeWelcome}><span>02 / CREATE</span><strong>Visit Creator Studio</strong></Link>
            <Link to="/community" onClick={closeWelcome}><span>03 / COMMONS</span><strong>Meet the community</strong></Link>
            <button type="button" onClick={()=>start(true)}><span>04 / ORIENTATION</span><strong>Guide me through</strong></button>
          </div>
          <button type="button" className="ir92-not-now" onClick={closePanel}>Not now</button>
        </div>:<>
        <div className="ir87-tabs" role="tablist" aria-label="IREN tools">
          <button id="ir87-help-tab" type="button" role="tab" aria-selected={activeView==="help"}
            aria-controls="ir87-help-body" onClick={()=>{setActiveView("help");setMood("curious")}}>Guidance</button>
          <button id="ir87-updates-tab" type="button" role="tab" aria-selected={activeView==="updates"}
            aria-controls="ir87-updates-body" onClick={()=>{setActiveView("updates");setMood(unreadCount>0?"notify":"curious")}}>
            Signals{unreadCount>0&&<span className="ir87-tab-count">{unreadCount>9?"9+":unreadCount}</span>}
          </button>
        </div>
        {activeView==="help"?<div id="ir87-help-body" role="tabpanel" aria-labelledby="ir87-help-tab">
          <p className="ir88-voice-line" aria-live="off">{mood==="greet"
            ?"Welcome, explorer. I'm IREN. Shall we find our way?"
            :mood==="think"?"Let me check the field notes. Here's what I know."
            :station.line}</p>
          <h2>{pathname==="/join"?"Your first signal.":"Where to next?"}</h2>
          <p className="ir80-subtitle">{pathname==="/join"
            ?"Choose an available method, verify your identity, then create a private member space."
            :"Explore ANEVUM or take a guided site tour."}</p>
          {pathname==="/join"&&<p className="ir123-code-boundary">Keep your sign-in code in the official form. IREN does not inspect it or grant access.</p>}
          <div className="ir80-topic-grid" role="group" aria-label="Help topics">
            {topics.map(topic=><button key={topic.id} type="button" aria-pressed={topic.id===activeTopic}
              onClick={()=>{setActiveTopic(topic.id);setMood("think")}}>{topic.label}</button>)}
          </div>
          <div className="ir80-topic-detail" aria-live="polite">
            <strong>{currentTopic.label}</strong><p>{currentTopic.detail}</p>
            <Link to={currentTopic.id==="profile"&&!memberId?"/join":currentTopic.href} onClick={()=>setPanelOpen(false)}>
              {currentTopic.id==="profile"&&!memberId?"Join or sign in":currentTopic.action} <Icon name="arrow" size={15}/>
            </Link>
          </div>
          <footer className="ir80-help-foot">
            <button type="button" className="ir80-tour-launch" onClick={()=>start()}>
              {readProgress(storageKey).status==="paused"?"RESUME SITE TOUR":"TAKE THE SITE TOUR"} <Icon name="arrow" size={15}/>
            </button>
            <button type="button" className="ir88-motion-toggle" onClick={changeMotion}
              aria-pressed={motionPaused}>{motionPaused?"Enable animation":"Pause animation"}</button>
            {dockPosition&&<button type="button" className="ir88-motion-toggle"
              onClick={restoreDock}>Return to corner</button>}
            <button type="button" className="ir80-hide" onClick={hide}>Hide helper</button>
          </footer>
        </div>:<div id="ir87-updates-body" role="tabpanel" aria-labelledby="ir87-updates-tab">
          <h2>Your signals.</h2>
          {!memberId?<p className="ir87-empty">Sign in to see your earned levels, badges, and recognition updates.</p>:
           recent.length?<ul className="ir87-signal-list">
             {recent.slice(0,8).map(item=><li key={item.id}>
               <span className="ir87-signal-symbol">{item.kind==="level"
                 ?<LevelEmblem level={item.level!} size={38}/>
                 :<AwardEmblem award={item.award}/>}</span>
               <span><strong>{item.title}</strong><small>{item.detail}</small></span>
             </li>)}
           </ul>:<p className="ir87-empty">No earned recognition yet. New awards and levels will appear here when verified.</p>}
          <Link className="ir87-signals-link" to={memberId?"/member?tab=awards":"/join"} onClick={()=>setPanelOpen(false)}>
            {memberId?"OPEN AWARDS & STATS":"JOIN OR SIGN IN"} <Icon name="arrow" size={15}/>
          </Link>
          <div className="ir111-status-link">
            <span>PLATFORM UPDATES</span>
            <p>Published system availability is tracked separately from earned personal signals. Unreleased changes are not announcements.</p>
            <Link to="/status" onClick={()=>setPanelOpen(false)}>VIEW LIVE STATUS <Icon name="arrow" size={15}/></Link>
          </div>
          <button type="button" className="ir87-back-help" onClick={()=>{setActiveView("help");setMood("curious")}}>Back to guidance</button>
        </div>}
        </>}
      </section>)}
      {broadcast&&activeTransmission&&<section key={activeTransmission.key}
        className={"ir111-transmission ir111-kind-"+activeTransmission.kind}
        aria-label="IREN transmission">
        <div className="ir111-header">
          <span>IREN / CONTINUANCE TRANSMISSION</span>
          <span>{activeTransmission.preview?"VISUAL PREVIEW":activeTransmission.kind==="level"?"LEVEL ATTAINED":
            activeTransmission.kind==="award"?"RECOGNITION VERIFIED":
            activeTransmission.kind==="xp"?"PROGRESSION RECORDED":
            activeTransmission.kind==="error"?"ATTENTION REQUIRED":
            activeTransmission.kind==="success"?"ACTION CONFIRMED":
            activeTransmission.kind==="update"?"PLATFORM UPDATE":"INFORMATION SIGNAL"}</span>
        </div>
        <div className="ir111-transmission-content">
          {activeTransmission.kind==="level"&&typeof activeTransmission.level==="number"
            ?<span className="ir111-reward" aria-hidden="true"><LevelEmblem level={activeTransmission.level} size={68}/></span>:
           activeTransmission.kind==="award"&&activeTransmission.award
            ?<span className="ir111-reward" aria-hidden="true"><AwardEmblem award={activeTransmission.award}/></span>:
            <span className="ir111-symbol" aria-hidden="true">{activeTransmission.kind==="error"?"!":"✦"}</span>}
          <div className="ir111-message">
            <strong>{activeTransmission.title}</strong>
            {activeTransmission.detail&&<p>{activeTransmission.detail}</p>}
            {activeTransmission.preview&&<small>Presentation preview only; no XP or award was granted.</small>}
          </div>
        </div>
        <div className="ir111-footer">
          <span>TRANSMITTED BY IREN · ANEVUM</span>
          <button type="button" onClick={()=>dismissTransmission(activeTransmission)}
            aria-label="Dismiss IREN transmission"><Icon name="close" size={17}/> DISMISS</button>
        </div>
      </section>}
      <button type="button" ref={dockRef} className="ir80-dock ir87-scout" aria-label={panelOpen?"Close IREN companion":"Open IREN companion"+(unreadCount>0?", "+unreadCount+" new signals":"")}
        aria-controls="ir87-panel" aria-expanded={panelOpen} title="IREN companion"
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerEnter={()=>{setWakeCycle(c=>c+1);if(mood==="idle"||mood==="rest")setMood("curious")}}
        onPointerLeave={()=>{setLook([0,0]);if(mood==="curious")setMood("idle")}}
        onClick={()=>{
          if(suppressClick.current){suppressClick.current=false;return}
          rememberFirstContact();
          setWelcomeOpen(false);
          setWakeCycle(c=>c+1);
          setMood(panelOpen?"idle":"greet");
          if(!panelOpen){panelInvokerRef.current=dockRef.current;focusRequested.current=true;}
          setPanelOpen(open=>!open);
        }}>
        <IrenLivingCanvas vectorFirst mood={mood} expanded={(panelOpen&&!floatingInvite)||broadcast} paused={motionPaused}
          look={broadcast?[-0.85,-0.18]:look} fallback={<IrenScout/>}/>
        {unreadCount>0&&<span className="ir87-unread" aria-hidden="true">{unreadCount>9?"9+":unreadCount}</span>}
      </button>
    </div>}
    {hidden&&activeTransmission&&<aside className="ir111-quiet" aria-label="Notification with IREN hidden">
      <strong>{activeTransmission.title}</strong>
      {activeTransmission.detail&&<span>{activeTransmission.detail}</span>}
      <button type="button" onClick={()=>dismissTransmission(activeTransmission)} aria-label="Dismiss notification"><Icon name="close" size={16}/></button>
    </aside>}
    {step&&(spatialTourEnabled?<IrenSpatialTour step={step} index={tourIndex!} total={steps.length}
      target={spotlight} travelling={guideTravelling} paused={motionPaused}
      fallback={<IrenScout/>} onPause={()=>pause()} onSkip={()=>finish("skipped")}
      onNext={next} onBack={()=>{
        const previous=Math.max(0,tourIndex!-1);
        writeProgress(storageKey,{status:"paused",index:previous});
        setTourIndex(previous);
      }}/>:<div className="ir80-guide-layer" aria-label="IREN guided website tour">
      {!embeddedGuideBot&&<div className="ir88-guide-bot" style={guideBotStyle} aria-hidden="true">
        <IrenLivingCanvas vectorFirst mood={guideTravelling?"travel":"guide"} expanded paused={motionPaused}
          look={guideLook} fallback={<IrenScout/>}/>
      </div>}
      {spotlight?<><div className="ir80-shade" style={{left:0,top:0,width:"100%",height:spotlight.top}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top+spotlight.height,width:"100%",bottom:0}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top,width:spotlight.left,height:spotlight.height}}/>
        <div className="ir80-shade" style={{left:spotlight.left+spotlight.width,top:spotlight.top,right:0,height:spotlight.height}}/>
        <div className="ir80-spotlight" style={spotlight} aria-hidden="true"/></>:
        <div className="ir80-shade ir80-shade-full"/>}
      <div ref={dialogRef} className="ir80-guide-card" style={panelStyle} role="dialog" aria-modal="true"
        aria-labelledby="ir80-guide-title" aria-describedby="ir80-guide-description">
        <div className="ir80-guide-top">
          <span className={"ir80-guide-avatar"+(embeddedGuideBot?" ir88-guide-avatar":"")} aria-hidden="true">
            {embeddedGuideBot?<IrenLivingCanvas vectorFirst mood={guideTravelling?"travel":"guide"} expanded paused={motionPaused}
              look={guideLook} fallback={<IrenScout/>}/>:<OrbitalMark/>}
          </span>
          <div><strong>IREN</strong><span>CONTINUANCE FIELD GUIDE</span></div>
          <button type="button" className="ir80-icon-button" aria-label="Close and resume tour later" onClick={()=>pause()}>
            <Icon name="close" size={18}/>
          </button>
        </div>
        {activeTransmission&&<aside className="ir111-inline" aria-label="Current IREN transmission">
          <span>IREN / INCOMING SIGNAL</span><strong>{activeTransmission.title}</strong>
          {activeTransmission.detail&&<p>{activeTransmission.detail}</p>}
          {activeTransmission.preview&&<small>Visual preview only; no award was granted.</small>}
          <button type="button" onClick={()=>dismissTransmission(activeTransmission)}>Dismiss signal</button>
        </aside>}
        <div className="ir80-guide-body" key={step.id}>
          <span className="ir80-code">{step.eyebrow}</span>
          <h2 id="ir80-guide-title">{step.title}</h2>
          <p id="ir80-guide-description">{step.description}</p>
          <small>{step.hint}</small>
        </div>
        <div className="ir80-guide-steps" aria-label={"Step "+(tourIndex!+1)+" of "+steps.length}>
          {steps.map((item,index)=><button type="button" key={item.id}
            className={index===tourIndex?"is-active":index<tourIndex!?"is-past":""}
            aria-label={"Go to "+item.eyebrow} aria-current={index===tourIndex?"step":undefined}
            onClick={()=>{writeProgress(storageKey,{status:"paused",index});setTourIndex(index);}}/>)}
        </div>
        <footer className="ir80-guide-actions">
          <button type="button" className="ir80-skip" onClick={()=>finish("skipped")}>SKIP TOUR</button>
          <span className="ir80-step-count">{tourIndex!+1} / {steps.length}</span>
          {tourIndex!>0&&<button type="button" className="ir80-back" onClick={()=>{
            const previous=tourIndex!-1;
            writeProgress(storageKey,{status:"paused",index:previous});
            setTourIndex(previous);
          }}>BACK</button>}
          <button type="button" data-iren-next className="ir80-next" onClick={next}>
            {tourIndex===steps.length-1?"FINISH":"CONTINUE"} <Icon name="arrow" size={16}/>
          </button>
        </footer>
      </div>
    </div>)}
  </>;
}
