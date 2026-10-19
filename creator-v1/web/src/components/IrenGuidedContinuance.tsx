import {useCallback,useEffect,useRef,useState,type CSSProperties} from "react";
import {Link,useLocation,useNavigate} from "react-router-dom";
import {OrbitalMark} from "./OrbitalMark";
import {Icon} from "./Icons";
import {useIrenSignals} from "./AnevumNotifications";
import {LevelEmblem,AwardEmblem} from "./LevelEmblem";

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

/** Tiny orbital helper, rendered as vectors rather than another floating pill. */
function IrenScout(){
 return <svg className="ir87-scout-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id="ir87-hull" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#5879a2"/><stop offset=".48" stopColor="#283c63"/><stop offset="1" stopColor="#161c35"/>
   </linearGradient>
   <radialGradient id="ir87-visor" cx=".5" cy=".2" r=".95">
    <stop offset="0" stopColor="#243f65"/><stop offset="1" stopColor="#0b142b"/>
   </radialGradient>
  </defs>
  <ellipse className="ir87-orbit" cx="32" cy="34" rx="28" ry="8" transform="rotate(-17 32 34)"
   fill="none" stroke="#d8bad9" strokeWidth="2.1" opacity=".8"/>
  <path className="ir87-thruster" d="M26 49L30 59L33 52L37 59L40 49Z" fill="#78c8f0" opacity=".65"/>
  <path d="M31 14V9" stroke="#d9c2e3" strokeWidth="2" strokeLinecap="round"/>
  <circle className="ir87-antenna" cx="31" cy="7" r="2.8" fill="#ffe5ba"/>
  <path d="M12 31Q12 15 28 14H36Q52 15 52 31V39Q51 52 35 53H29Q13 52 12 39Z"
   fill="url(#ir87-hull)" stroke="#b6bfdc" strokeWidth="1.8"/>
  <path d="M17 29Q18 21 29 20H35Q46 21 47 29V38Q46 46 35 47H29Q18 46 17 38Z"
   fill="url(#ir87-visor)" stroke="#6e92b9" strokeWidth="1.2"/>
  <ellipse className="ir87-eye" cx="25" cy="33" rx="3.6" ry="4.2" fill="#f7e5c7"/>
  <ellipse className="ir87-eye" cx="39" cy="33" rx="3.6" ry="4.2" fill="#f7e5c7"/>
  <path d="M28 41Q32 43.5 36 41" stroke="#a9cfea" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  <circle cx="14" cy="40" r="2.7" fill="#a4daed" opacity=".9"/>
  <circle cx="50" cy="40" r="2.7" fill="#a4daed" opacity=".9"/>
 </svg>;
}

export function IrenGuidedContinuance({memberId}:{memberId:string|null}){
  const {pathname,search}=useLocation();
  const navigate=useNavigate();
  const {recent,unreadCount,markSignalsSeen}=useIrenSignals();
  const storageKey=storagePrefix+(memberId||"visitor");
  const steps=memberId?memberSteps:visitorSteps;
  const [tourIndex,setTourIndex]=useState<number|null>(null);
  const [panelOpen,setPanelOpen]=useState(false);
  const [activeView,setActiveView]=useState<"help"|"updates">("help");
  const [activeTopic,setActiveTopic]=useState("discover");
  const [hidden,setHidden]=useState(()=>hiddenInStorage(storageKey));
  const [spotlight,setSpotlight]=useState<Spotlight|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null);
  const dockRef=useRef<HTMLButtonElement>(null);
  const companionRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    setTourIndex(null);
    setPanelOpen(false);
    setActiveView("help");
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
      setActiveView("help");
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

  // One anchored panel on all routes, not a second notification dock.
  useEffect(()=>{
    if(!panelOpen)return;
    const onOutside=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!companionRef.current?.contains(event.target))setPanelOpen(false);
    };
    const onEscape=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){setPanelOpen(false);dockRef.current?.focus({preventScroll:true});}
    };
    document.addEventListener("pointerdown",onOutside);
    document.addEventListener("keydown",onEscape);
    return()=>{
      document.removeEventListener("pointerdown",onOutside);
      document.removeEventListener("keydown",onEscape);
    };
  },[panelOpen]);

  useEffect(()=>{
    if(panelOpen&&activeView==="updates"&&memberId)markSignalsSeen();
    // Refresh of server history is intentional: notice indicators clear while
    // the member is actually viewing Signals rather than on transient toast ACK.
  },[panelOpen,activeView,memberId,recent]);

  const step=tourIndex===null?null:steps[tourIndex]||null;
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
  },[step?.id,step?.route,pathname,search]);

  useEffect(()=>{
    if(tourIndex!==null)dialogRef.current?.querySelector<HTMLButtonElement>("[data-iren-next]")?.focus({preventScroll:true});
  },[tourIndex]);

  useEffect(()=>{
    if(tourIndex===null)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();pause();}
      if(event.key==="Tab"){
        // The spotlight is a modal teaching moment, but highlighted page
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

  return <>
    {tourIndex===null&&!hidden&&<div ref={companionRef} className="ir80-companion ir87-companion">
      {panelOpen&&<section id="ir87-panel" className="ir80-help ir87-panel" aria-label="IREN companion">
        <header className="ir80-help-head">
          <span className="ir80-code">IREN / CONTINUANCE COMPANION</span>
          <button type="button" className="ir80-icon-button" aria-label="Close IREN" onClick={()=>setPanelOpen(false)}><Icon name="close" size={17}/></button>
        </header>
        <div className="ir87-tabs" role="tablist" aria-label="IREN tools">
          <button id="ir87-help-tab" type="button" role="tab" aria-selected={activeView==="help"}
            aria-controls="ir87-help-body" onClick={()=>setActiveView("help")}>Guidance</button>
          <button id="ir87-updates-tab" type="button" role="tab" aria-selected={activeView==="updates"}
            aria-controls="ir87-updates-body" onClick={()=>setActiveView("updates")}>
            Signals{unreadCount>0&&<span className="ir87-tab-count">{unreadCount>9?"9+":unreadCount}</span>}
          </button>
        </div>
        {activeView==="help"?<div id="ir87-help-body" role="tabpanel" aria-labelledby="ir87-help-tab">
          <h2>Where to next?</h2>
          <p className="ir80-subtitle">Explore ANEVUM or take a guided site tour.</p>
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
            <button type="button" className="ir80-tour-launch" onClick={()=>start()}>
              {readProgress(storageKey).status==="paused"?"RESUME SITE TOUR":"TAKE THE SITE TOUR"} <Icon name="arrow" size={15}/>
            </button>
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
          <button type="button" className="ir87-back-help" onClick={()=>setActiveView("help")}>Back to guidance</button>
        </div>}
      </section>}
      <button type="button" ref={dockRef} className="ir80-dock ir87-scout" aria-label={panelOpen?"Close IREN companion":"Open IREN companion"+(unreadCount>0?", "+unreadCount+" new signals":"")}
        aria-controls="ir87-panel" aria-expanded={panelOpen} title="IREN companion"
        onClick={()=>{setPanelOpen(open=>!open);}}>
        <IrenScout/>
        {unreadCount>0&&<span className="ir87-unread" aria-hidden="true">{unreadCount>9?"9+":unreadCount}</span>}
      </button>
    </div>}
    {step&&<div className="ir80-guide-layer" aria-label="IREN guided website tour">
      {spotlight?<><div className="ir80-shade" style={{left:0,top:0,width:"100%",height:spotlight.top}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top+spotlight.height,width:"100%",bottom:0}}/>
        <div className="ir80-shade" style={{left:0,top:spotlight.top,width:spotlight.left,height:spotlight.height}}/>
        <div className="ir80-shade" style={{left:spotlight.left+spotlight.width,top:spotlight.top,right:0,height:spotlight.height}}/>
        <div className="ir80-spotlight" style={spotlight} aria-hidden="true"/></>:
        <div className="ir80-shade ir80-shade-full"/>}
      <div ref={dialogRef} className="ir80-guide-card" style={panelStyle} role="dialog" aria-modal="true"
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
