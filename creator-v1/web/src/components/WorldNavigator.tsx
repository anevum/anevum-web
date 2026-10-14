import {useRef,useState,type KeyboardEvent,type PointerEvent,type TouchEvent} from "react";
import {Link} from "react-router-dom";
import {CosmicArtwork} from "./CosmicArtwork";
import {Icon} from "./Icons";
import type {CosmicScene} from "./CosmicIllustration";

export type AtlasWorld = {
  id:string;
  name:string;
  scene:CosmicScene;
  description:string;
};

export function WorldNavigator({worlds,counts,ready}:{worlds:readonly AtlasWorld[];counts:ReadonlyMap<string,number>;ready:boolean}){
  const [active,setActive]=useState(0);
  const startX=useRef<number|null>(null);
  const world=worlds[active]||worlds[0];
  if(!world)return null;

  const route=(id:string)=>"/discover?category="+encodeURIComponent(id);
  const change=(difference:number)=>setActive(current=>(current+difference+worlds.length)%worlds.length);
  function move(event:PointerEvent<HTMLDivElement>){
    if(event.pointerType!=="mouse"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const bounds=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-bounds.left)/bounds.width-.5;
    const y=(event.clientY-bounds.top)/bounds.height-.5;
    event.currentTarget.style.setProperty("--cw-orbit-ry",(x*7).toFixed(2)+"deg");
    event.currentTarget.style.setProperty("--cw-orbit-rx",(-y*6).toFixed(2)+"deg");
  }
  function reset(event:PointerEvent<HTMLDivElement>){
    event.currentTarget.style.setProperty("--cw-orbit-ry","0deg");
    event.currentTarget.style.setProperty("--cw-orbit-rx","0deg");
  }
  function keys(event:KeyboardEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget)return;
    if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();change(1);}
    if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();change(-1);}
    if(event.key==="Enter"){event.preventDefault();event.currentTarget.querySelector<HTMLAnchorElement>(".cw-atlas-enter")?.click();}
  }
  function touchStart(event:TouchEvent<HTMLDivElement>){
    if(event.target instanceof Element && event.target.closest("a,button"))return;
    startX.current=event.touches[0]?.clientX??null;
  }
  function touchEnd(event:TouchEvent<HTMLDivElement>){
    const end=event.changedTouches[0]?.clientX;
    if(startX.current===null||end===undefined)return;
    const distance=end-startX.current;
    startX.current=null;
    if(Math.abs(distance)>=55)change(distance<0?1:-1);
  }

  return <div className="cw-atlas" aria-label="Explore the ANEVUM worlds">
    <div className="cw-atlas-topline"><span><span className="cw-atlas-live-dot" aria-hidden="true"/> WORLD NAVIGATOR</span><span>SELECT / DISCOVER / ENTER</span></div>
    <div className="cw-atlas-stage" tabIndex={0} role="group"
      aria-label="Choose a world. Arrow keys change worlds; Enter opens the selected category. On touch screens swipe or tap a world."
      onPointerMove={move} onPointerLeave={reset} onKeyDown={keys} onTouchStart={touchStart} onTouchEnd={touchEnd}>
      <div className="cw-atlas-surface" aria-hidden="true">
        <span className="cw-atlas-ring cw-atlas-ring--one"/>
        <span className="cw-atlas-ring cw-atlas-ring--two"/>
        <span className="cw-atlas-ring cw-atlas-ring--three"/>
        <span className="cw-atlas-axis cw-atlas-axis--horizontal"/>
        <span className="cw-atlas-axis cw-atlas-axis--vertical"/>
      </div>
      <div className="cw-atlas-core" key={world.id}>
        <div className="cw-atlas-core-image" aria-hidden="true"><CosmicArtwork scene={world.scene}/></div>
        <span className="cw-atlas-core-eyebrow">WORLD {String(active+1).padStart(2,"0")} / {String(worlds.length).padStart(2,"0")}</span>
        <h2>{world.name}</h2>
        <p>{world.description}</p>
        <Link className="cw-atlas-enter" to={route(world.id)} aria-label={"Explore "+world.name}>
          ENTER WORLD <Icon name="arrow" size={16}/>
        </Link>
      </div>
      <div className="cw-atlas-node-field" role="group" aria-label="Available worlds">
        {worlds.map((item,index)=>{
          const angle=((index/worlds.length)*Math.PI*2)-Math.PI/2;
          const left=50+Math.cos(angle)*43;
          const top=50+Math.sin(angle)*43;
          return <button type="button" key={item.id}
            className={"cw-atlas-node"+(index===active?" is-selected":"")}
            style={{left:left+"%",top:top+"%"}}
            onClick={()=>setActive(index)}
            aria-pressed={index===active}
            aria-label={"Select "+item.name+(index===active?", selected":"")}>
            <span className="cw-atlas-node-index">{String(index+1).padStart(2,"0")}</span>
            <span className="cw-atlas-node-name">{item.name}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="cw-atlas-controls">
      <div className="cw-atlas-status" aria-live="polite" aria-atomic="true">
        <strong>{world.name}</strong>
        <span>{ready?(counts.get(world.id)||0)>0?(counts.get(world.id)||0)+" PUBLISHED":"FIRST RELEASE PENDING":"EXPLORE THE CATEGORY"}</span>
      </div>
      <div className="cw-atlas-steppers">
        <button type="button" onClick={()=>change(-1)} aria-label="Previous world"><Icon name="arrow" size={17}/></button>
        <span>{String(active+1).padStart(2,"0")} <span aria-hidden="true">/</span> {String(worlds.length).padStart(2,"0")}</span>
        <button type="button" onClick={()=>change(1)} aria-label="Next world"><Icon name="arrow" size={17}/></button>
      </div>
    </div>
  </div>;
}
