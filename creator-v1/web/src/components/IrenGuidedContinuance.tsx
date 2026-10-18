import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import {Link,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "./OrbitalMark";
import {Icon} from "./Icons";

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
  {id:"studio",route:"/member",anchor:'[data-iren-anchor="studio"]',
   eyebrow:"04 / MAKE SOMETHING",title:"There is room to create.",
   description:"Creator Studio is where work is prepared and submitted. Creator publishing has its own verification and review rules; membership alone does not grant publishing or staff access.",
   hint:"You can explore the Studio separately at any time."},
  {id:"discover",route:"/discover",anchor:'[data-iren-anchor="discover"]',
   eyebrow:"05 / DISCOVERY",title:"Follow what interests you.",
   description:"Filter genuine published projects by games, apps, art, learning and more. Open a project to see the creator's work and available experience.",
   hint:"Try a category when the tour ends. Empty results are real, not filler."},
  {id:"community",route:"/community",anchor:'[data-iren-anchor="community"]',
   eyebrow:"06 / THE COMMONS",title:"Find your people.",
   description:"The community connects members, creators and discussions. Posts and projects have moderation and publication boundaries, so activity you see is not fabricated.",
   hint:"Explore discussions, projects, and public member identities."},
  {id:"wayfinder",route:"/community",anchor:'[data-iren-anchor="navigation"]',
   eyebrow:"07 / THE WAYFINDER",title:"The whole network, one menu.",
   description:"Open the Wayfinder to move between worlds. Search finds real projects and creators, and your player card brings you back home.",
   hint:"IREN can always be reopened from the small help companion."}
];
const visitorSteps:readonly GuideStep[]=[
  memberSteps[4],
  memberSteps[5],
  memberSteps[6]
];
const topics:readonly Topic[]=[
  {id:"profile",label:"My identity",detail:"Your member space contains your wall, images, privacy controls, earned levels and player card. A verified member profile is separate from creator publishing permissions.",href:"/member",action:"Open member space"},
  {id:"discover",label:"Find something",detail:"Discover lists approved published projects. Filter by type or search for a specific project. ANEVUM does not create imaginary releases to fill empty listings.",href:"/discover",action:"Explore projects"},
  {id:"community",label:"Meet people",detail:"Community is where approved conversations, creator channels and public member spaces can be explored. Moderation and public visibility still apply.",href:"/community",action:"Visit community"},
  {id:"create",label:"Make & publish",detail:"Creator Studio prepares project submissions. Publishing and review are separate from ordinary member registration; do not assume access has been granted.",href:"/studio",action:"Explore Studio"},
  {id:"recognition",label:"XP & artifacts",detail:"XP, medals, badges, and the 30 Evolution of Everything specimens are earned through verified systems. Locked specimens are never disclosed by this guide.",href:"/levels",action:"Understand levels"},
  {id:"safety",label:"Privacy & safety",detail:"Your wall is private until you publish it. Protect personal information, use account visibility controls and review the community rules before sharing.",href:"/guide",action:"Read the field guide"}
];
const storagePrefix="anevum.iren.guided-continuance.v080.";
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

export function IrenGuidedContinuance({memberId}:{memberId:string|null}){
  const {pathname}=useLocation();
  const navigate=useNavigate();
  const storageKey=storagePrefix+(memberId||"visitor");
  const steps=memberId?memberSteps:visitorSteps;
  const [tourIndex,setTourIndex]=useState<number|null>(null);
  const [panelOpen,setPanelOpen]=useState(false);
  const [activeTopic,setActiveTopic]=useState("discover");
  const [hidden,setHidden]=useState(()=>hiddenInStorage(storageKey));
  const [spotlight,setSpotlight]=useState<Spotlight|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const dockRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    setTourIndex(null);
    setPanelOpen(false);
    setSpotlight(null);
    setHidden(hiddenInStorage(storageKey));
  },[storageKey]);

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
    setTourIndex(fresh?0:resume);
  },[storageKey,steps.length]);

  useEffect(()=>{
    const onCreated=(event:Event)=>{
      const detail=(event as CustomEvent<{memberId:string}>).detail;
      if(!memberId||detail?.memberId!==memberId||readProgress(storageKey).status)return;
      start(true);
    };
    const onOpen=()=>{
      setStoredHidden(storageKey,false);
      setHidden(false);
      setTourIndex(null);
      setPanelOpen(true);
    };
    const onStart=()=>start();
    window.addEventListener("anevum:member-created",onCreated);
    window.addEventListener("anevum:iren-open",onOpen);
    window.addEventListener("anevum:iren-tour",onStart);
    return()=>{
      window.removeEventListener("anevum:member-created",onCreated);
      window.removeEventListener("anevum:iren-open",onOpen);
      window.removeEventListener("anevum:iren-tour",onStart);
    };
  },[memberId,storageKey,start]);

  const step=tourIndex===null?null:steps[tourIndex]||null;
  useEffect(()=>{
    if(step&&pathname!==step.route)navigate(step.route);
  },[navigate,pathname,step?.id,step?.route]);

  useEffect(()=>{
    if(!step||pathname!==step.route){setSpotlight(null);return;}
    let frame=0,scrolled=false;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const findTarget=()=>document.querySelector<HTMLElement>(step.anchor)
      ||(step.fallback?document.querySelector<HTMLElement>(step.fallback):null);
    const measure=()=>{
      const target=findTarget();
      if(!target){setSpotlight(null);return;}
      const rect=target.getBoundingClientRect();
      if(!scrolled){
        scrolled=true;
        if(rect.top<78||rect.bottom>window.innerHeight-160)
          target.scrollIntoView({behavior:reduced?"instant":"smooth",block:"center",inline:"nearest"});
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
  },[step?.id,step?.route,pathname]);

  useEffect(()=>{
    if(tourIndex!==null)dialogRef.current?.querySelector<HTMLButtonElement>("[data-iren-next]")?.focus({preventScroll:true});
  },[tourIndex]);

  useEffect(()=>{
    if(tourIndex===null)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();pause();}
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
    setStoredHidden(storageKey,true);
    setHidden(true);
  };
  const currentTopic=topics.find(topic=>topic.id===activeTopic)||topics[0];
  const isMobile=typeof window!=="undefined"&&window.innerWidth<=650;
  const panelStyle:CSSProperties={};
  if(step&&!isMobile){
    const width=Math.min(400,window.innerWidth-32);
    const center=spotlight?spotlight.left+spotlight.width/2:window.innerWidth/2;
    panelStyle.left=clamp(center-width/2,16,window.innerWidth-width-16);
    const panelHeight=304;
    panelStyle.top=spotlight
      ?spotlight.top>panelHeight+30?spotlight.top-panelHeight-14:clamp(spotlight.top+spotlight.height+14,16,window.innerHeight-panelHeight-12)
      :Math.max(16,(window.innerHeight-panelHeight)/2);
  }

  return <>
    {tourIndex===null&&!hidden&&<div className="ir80-companion">
      {panelOpen&&<section className="ir80-help" aria-label="IREN field assistance">
        <header className="ir80-help-head">
          <span className="ir80-code">IREN / FIELD ASSISTANT</span>
          <button type="button" className="ir80-icon-button" aria-label="Close IREN help" onClick={()=>setPanelOpen(false)}><Icon name="close" size={17}/></button>
        </header>
        <h2>Where would you like to go?</h2>
        <p className="ir80-subtitle">A guide to the parts of ANEVUM you can use today.</p>
        <div className="ir80-topic-grid" role="group" aria-label="Help topics">
          {topics.map(topic=><button key={topic.id} type="button" aria-pressed={topic.id===activeTopic}
            onClick={()=>setActiveTopic(topic.id)}>{topic.label}</button>)}
        </div>
        <div className="ir80-topic-detail" aria-live="polite">
          <strong>{currentTopic.label}</strong><p>{currentTopic.detail}</p>
          <Link to={currentTopic.id==="profile"&&!memberId?"/join":currentTopic.href} onClick={()=>setPanelOpen(false)}>
            {currentTopic.id==="profile"&&!memberId?"Join or sign in":currentTopic.action} <Icon name="arrow" size={15}/>
          </Link>
        </div>
        <footer className="ir80-help-foot">
          <button type="button" className="ir80-tour-launch" onClick={()=>start()}> {readProgress(storageKey).status==="paused"?"RESUME SITE TOUR":"TAKE THE SITE TOUR"} <Icon name="arrow" size={15}/></button>
          <button type="button" className="ir80-hide" onClick={hide}>Hide IREN</button>
        </footer>
      </section>}
      <button type="button" ref={dockRef} className="ir80-dock" aria-label={panelOpen?"Close IREN help":"Open IREN help"}
        aria-expanded={panelOpen} onClick={()=>setPanelOpen(open=>!open)}>
        <span className="ir80-orb" aria-hidden="true"><OrbitalMark/></span>
        <span><strong>IREN</strong><small>{panelOpen?"CLOSE HELP":"HERE TO HELP"}</small></span>
      </button>
    </div>}
    {step&&<div className="ir80-guide-layer" aria-label="IREN guided website tour">
      {spotlight?<><div className="ir80-shade" style={{left:0,top:0,width:"100%",height:spotlight.top}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top+spotlight.height,width:"100%",bottom:0}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top,width:spotlight.left,height:spotlight.height}}/>
        <div className="ir80-shade" style={{left:spotlight.left+spotlight.width,top:spotlight.top,right:0,height:spotlight.height}}/>
        <div className="ir80-spotlight" style={spotlight} aria-hidden="true"/></>:
        <div className="ir80-shade ir80-shade-full"/>}
      <div ref={dialogRef} className="ir80-guide-card" style={panelStyle} role="dialog"
        aria-labelledby="ir80-guide-title" aria-describedby="ir80-guide-description">
        <div className="ir80-guide-top">
          <span className="ir80-guide-avatar" aria-hidden="true"><OrbitalMark/></span>
          <div><strong>IREN</strong><span>CONTINUANCE FIELD GUIDE</span></div>
          <button type="button" className="ir80-icon-button" aria-label="Close and resume tour later" onClick={()=>pause()}>
            <Icon name="close" size={18}/>
          </button>
        </div>
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
    </div>}
  </>;
}
