import {Link} from "react-router-dom";
import {useRef,useState,type TouchEvent} from "react";
import type {Project} from "../lib/api";
import {projectDetailPath} from "../lib/navigation";
import {CosmicIllustration} from "./CosmicIllustration";
import {Icon} from "./Icons";

/**
 * ANEVUM.WEB.BUILD.2026-10-17.001.INTERACTIVE-FIRST-CONTACT
 *
 * This is the public front door, not a status dashboard or empty release ticker.
 * Every portal is a real one-tap route. Hover, focus, preview controls and
 * horizontal swipe reframe the cinematic scene without hijacking navigation.
 * Verified public work is optional; no fictional activity or profile records.
 */
type PortalScene="games"|"creative"|"libraries"|"tools";
type Portal={
  id:"play"|"discover"|"connect"|"create";
  number:string;
  label:string;
  small:string;
  world:string;
  lead:string;
  scene:PortalScene;
  destination:string;
  icon:"explore"|"community"|"create"|"arrow";
  category:string|null;
};
export const ENTRY_PORTALS:readonly Portal[]=[
  {
    id:"play",number:"01",label:"PLAY",small:"Games & worlds",
    world:"THE ARCADE",lead:"Games, interactive worlds, and things to get lost in.",
    scene:"games",destination:"/discover?category=games",icon:"explore",category:"games"
  },
  {
    id:"discover",number:"02",label:"DISCOVER",small:"Art, apps & ideas",
    world:"THE OPEN PORTALS",lead:"See what people have been making. Follow your curiosity.",
    scene:"creative",destination:"/discover",icon:"arrow",category:null
  },
  {
    id:"connect",number:"03",label:"CONNECT",small:"People & discussions",
    world:"THE COMMONS",lead:"Conversations, creators, and the people behind the work.",
    scene:"libraries",destination:"/community",icon:"community",category:null
  },
  {
    id:"create",number:"04",label:"CREATE",small:"Bring your own work",
    world:"THE WORKSHOP",lead:"Your next project has somewhere to begin.",
    scene:"tools",destination:"/studio",icon:"create",category:null
  }
];

function StageArtwork({scene,priority}:{scene:PortalScene;priority:boolean}){
  const [failed,setFailed]=useState(false);
  const base=import.meta.env.BASE_URL+"assets/community-portals/"+scene;
  return <div key={scene} className="av65-scene-image" aria-hidden="true">
    {failed?<CosmicIllustration scene={scene}/>:
      <img src={base+"-1536.webp"}
        srcSet={base+"-768.webp 768w, "+base+"-1536.webp 1536w"}
        sizes="(max-width: 700px) 100vw, 62vw"
        alt="" width="1536" height="1024" decoding="async"
        loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"}
        draggable={false} onError={()=>setFailed(true)}/>}
  </div>;
}

function DoorArtwork({scene}:{scene:PortalScene}){
  const [failed,setFailed]=useState(false);
  const base=import.meta.env.BASE_URL+"assets/community-portals/"+scene;
  return <span className="av65-door-image" aria-hidden="true">
    {failed?<CosmicIllustration scene={scene}/>:
      <img src={base+"-768.webp"} width="768" height="512" alt=""
        decoding="async" loading="lazy" draggable={false}
        onError={()=>setFailed(true)}/>}
  </span>;
}

export function ArrivalExperience({projects}:{projects:readonly Project[]}){
  const [current,setCurrent]=useState(0);
  const start=useRef<{x:number;y:number}|null>(null);
  const portal=ENTRY_PORTALS[current];
  const activeProject=portal.category
    ?projects.find(project=>project.category===portal.category)
    :portal.id==="discover"?projects[0]:null;

  function onStart(event:TouchEvent<HTMLElement>){
    const point=event.changedTouches[0];
    start.current=point?{x:point.clientX,y:point.clientY}:null;
  }
  function onEnd(event:TouchEvent<HTMLElement>){
    const first=start.current,point=event.changedTouches[0];
    start.current=null;
    if(!first||!point)return;
    const dx=point.clientX-first.x,dy=point.clientY-first.y;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.45){
      setCurrent(value=>(value+(dx<0?1:ENTRY_PORTALS.length-1))%ENTRY_PORTALS.length);
    }
  }
  const step=(dir:number)=>setCurrent(value=>(value+dir+ENTRY_PORTALS.length)%ENTRY_PORTALS.length);

  return <section className={"av65-arrival av65-arrival--"+portal.id}
      data-active-portal={portal.id} aria-labelledby="av65-title">
    <div className="av65-stage" onTouchStart={onStart} onTouchEnd={onEnd}>
      <div className="av65-stage-art" aria-hidden="true">
        <StageArtwork key={portal.scene} scene={portal.scene} priority={current===0}/>
        <span className="av65-stage-orbit"/>
        <span className="av65-stage-flare"/>
        <span className="av65-stage-shade"/>
      </div>
      <div className="av65-topline">
        <span>ANEVUM <b>/</b> AN OPEN CREATIVE UNIVERSE</span>
        <span className="av65-topline-number">{portal.number} <b>/</b> 04</span>
      </div>
      <div className="av65-opening-copy">
        <span className="av65-prelude">THE DOORS ARE OPEN</span>
        <h1 id="av65-title">Find your <em>way in.</em></h1>
        <p>Games, art, tools, people, ideas. Pick a direction and see where it takes you.</p>
      </div>
      <div className="av65-stage-foreground">
        <div className="av65-stage-identity">
          <span className="av65-stage-serial">{portal.number} <span aria-hidden="true">/</span> {portal.world}</span>
          <strong>{portal.label}<span aria-hidden="true">.</span></strong>
          <p>{portal.lead}</p>
        </div>
        <div className="av65-stage-actions">
          <Link to={portal.destination} className="av65-enter" aria-label={"Enter "+portal.label.toLowerCase()}>
            ENTER <span className="av65-enter-name">{portal.label}</span>
            <Icon name="arrow" size={19}/>
          </Link>
          <div className="av65-preview-controls" role="group" aria-label="Preview the next destination">
            <button type="button" onClick={()=>step(-1)} aria-label="Preview previous destination">
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={()=>step(1)} aria-label="Preview next destination">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        {activeProject&&<Link to={projectDetailPath(activeProject.id,"/")} className="av65-real-release">
          <span>FROM THE COMMUNITY</span>
          <strong>{activeProject.title}</strong>
          <span>BY {activeProject.creatorName||"@"+activeProject.creatorHandle} <Icon name="arrow" size={13}/></span>
        </Link>}
      </div>
    </div>
    <nav id="world-gateways" className="av65-doors" aria-label="Choose how to enter ANEVUM">
      {ENTRY_PORTALS.map((entry,index)=><Link key={entry.id} to={entry.destination}
        className={"av65-door av65-door--"+entry.id+(index===current?" av65-door--current":"")}
        aria-label={entry.label+": "+entry.small} aria-current={index===current?"true":undefined}
        onPointerEnter={event=>{if(event.pointerType==="mouse"||event.pointerType==="pen")setCurrent(index)}}
        onFocus={()=>setCurrent(index)}>
        <DoorArtwork scene={entry.scene}/>
        <span className="av65-door-content">
          <span className="av65-door-index">{entry.number} <span aria-hidden="true">/</span> ENTRY</span>
          <span className="av65-door-name">{entry.label}</span>
          <span className="av65-door-sub">{entry.small}</span>
        </span>
        <span className="av65-door-arrow" aria-hidden="true"><Icon name="arrow" size={18}/></span>
      </Link>)}
    </nav>
    <div className="av65-underline">
      <span>NOTHING TO INSTALL. EVERY DOOR IS OPEN TO EXPLORE.</span>
      <Link to="/join">BECOME PART OF ANEVUM <Icon name="arrow" size={15}/></Link>
    </div>
  </section>;
}
