import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from "react";
import {IrenLivingCanvas} from "./IrenLivingCanvas";
import {placeIrenSpatialGuide,type IrenPlacement,type IrenRect} from "../lib/iren-spatial-placement-v097";

export type IrenSpatialLesson={
  id:string;eyebrow:string;title:string;description:string;hint:string;
};
type Props={
  step:IrenSpatialLesson;index:number;total:number;
  target:IrenRect|null;
  travelling:boolean;paused:boolean;
  fallback:ReactNode;
  onBack:()=>void;onNext:()=>void;onSkip:()=>void;onPause:()=>void;
};
const shortLines:Record<string,string>={
  identity:"Your ANEVUM identity and profile begin here.",
  progress:"Your levels and awards come from real activity.",
  privacy:"Your wall starts private. You choose what others see.",
  studio:"Create privately here. Publishing requires review.",
  discover:"Find approved games, apps, art and more.",
  community:"Meet the makers and explore conversations.",
  wayfinder:"The Wayfinder takes you around ANEVUM."
};
function viewportRect():IrenRect{
  const v=window.visualViewport;
  return v?{left:v.offsetLeft,top:v.offsetTop,width:v.width,height:v.height}:
    {left:0,top:0,width:window.innerWidth,height:window.innerHeight};
}
function area(rect:DOMRect):IrenRect{
  return {left:rect.left,top:rect.top,width:rect.width,height:rect.height};
}
const initial: IrenPlacement={
  botLeft:16,botTop:200,bubbleLeft:90,bubbleTop:200,bubbleWidth:225,
  side:"right",compact:false,targetVisible:false,score:0
};

export function IrenSpatialTour({
  step,index,total,target,travelling,paused,fallback,onBack,onNext,onSkip,onPause
}:Props){
  const bubbleRef=useRef<HTMLElement>(null);
  const spriteRef=useRef<HTMLDivElement>(null);
  const [more,setMore]=useState(false);
  const [placement,setPlacement]=useState<IrenPlacement>(initial);
  const [reduced,setReduced]=useState(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visibleRect,setVisibleRect]=useState<IrenRect>(()=>viewportRect());
  const mobile=visibleRect.width<=650;
  const botWidth=mobile?76:90,botHeight=mobile?94:105;
  useEffect(()=>setMore(false),[step.id]);
  useEffect(()=>{
    const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(mq.matches);
    update();mq.addEventListener("change",update);
    return()=>mq.removeEventListener("change",update);
  },[]);
  useEffect(()=>{
    let frame=0;
    const recalc=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const v=viewportRect();
        const bubbleBounds=bubbleRef.current?.getBoundingClientRect();
        const header=document.querySelector<HTMLElement>(".av9-brand");
        const headerBox=header?.getBoundingClientRect();
        const topBlock=headerBox&&headerBox.bottom>v.top&&headerBox.top<v.top+130
          ?headerBox.bottom+9:0;
        const width=Math.min(mobile?245:296,Math.max(170,v.width-88));
        const height=bubbleBounds?.height||138;
        // Read positions only. Never inspect the content of form fields or
        // private account data. This avoids hiding real Search/CTA controls.
        const obstacles:IrenRect[]=[];
        const interactive=document.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[role="button"],[role="searchbox"]');
        for(const element of Array.from(interactive).slice(0,200)){
          if(element.closest(".ir97-guide-layer"))continue;
          if(!element.getClientRects().length)continue;
          const rect=element.getBoundingClientRect();
          if(rect.width<18||rect.height<18||rect.right<v.left||
             rect.left>v.left+v.width||rect.bottom<v.top||
             rect.top>v.top+v.height)continue;
          obstacles.push(area(rect));
        }
        const result=placeIrenSpatialGuide(v,target,{width,height},{width:botWidth,height:botHeight},{
          headerBottom:topBlock,
          safeSides:12,
          safeBottom:mobile?12:8,
          obstacles
        });
        setVisibleRect(prev=>prev.left===v.left&&prev.top===v.top&&prev.width===v.width&&prev.height===v.height?prev:v);
        setPlacement(prev=>{
          if(Object.keys(result).every(key=>{
            const k=key as keyof IrenPlacement;
            return result[k]===prev[k];
          }))return prev;
          return result;
        });
      });
    };
    // Do not observe the bubble itself. Its "compact" placement can change
    // its measured height, which otherwise re-triggers placement and causes
    // two-position oscillation (and an unclickable Next button). Changing
    // a lesson or expanding details already re-runs this effect.
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(recalc):null;
    if(spriteRef.current)observer?.observe(spriteRef.current);
    const visual=window.visualViewport;
    recalc();
    visual?.addEventListener("resize",recalc);
    visual?.addEventListener("scroll",recalc);
    window.addEventListener("resize",recalc);
    window.addEventListener("scroll",recalc,true);
    return()=>{
      cancelAnimationFrame(frame);
      observer?.disconnect();
      visual?.removeEventListener("resize",recalc);
      visual?.removeEventListener("scroll",recalc);
      window.removeEventListener("resize",recalc);
      window.removeEventListener("scroll",recalc,true);
    };
  },[target?.left,target?.top,target?.width,target?.height,mobile,more,step.id,botWidth,botHeight]);
  const targetCenterX=target?target.left+target.width/2:placement.botLeft+40;
  const targetCenterY=target?target.top+target.height/2:placement.botTop+40;
  const botCenterX=placement.botLeft+botWidth/2;
  const botCenterY=placement.botTop+botHeight/2;
  const dx=targetCenterX-botCenterX,dy=targetCenterY-botCenterY;
  const distance=Math.hypot(dx,dy);
  const look:readonly [number,number]=[
    Math.max(-1,Math.min(1,dx/Math.max(130,visibleRect.width*.32))),
    Math.max(-1,Math.min(1,dy/Math.max(120,visibleRect.height*.28)))
  ];
  const lineLength=target?Math.max(0,Math.min(78,distance-35)):0;
  const lineStyle:CSSProperties={
    left:botCenterX,top:botCenterY,width:lineLength,
    transform:"rotate("+Math.atan2(dy,dx)+"rad)"
  };
  const botStyle:CSSProperties={left:placement.botLeft,top:placement.botTop,
    width:botWidth,height:botHeight};
  const bubbleStyle:CSSProperties={left:placement.bubbleLeft,top:placement.bubbleTop,width:placement.bubbleWidth};
  const copy=shortLines[step.id]||step.description;
  return <div className="ir97-guide-layer" data-iren-spatial="true" aria-label="IREN spatial guide">
    {target&&<div className="ir97-target-halo" style={{
      left:target.left,top:target.top,width:target.width,height:target.height
    }} aria-hidden="true"/>}
    {lineLength>8&&<span className="ir97-tether" style={lineStyle} aria-hidden="true"/>}
    <div ref={spriteRef} className={"ir97-floating-bot"+(travelling?" is-travelling":"")}
      style={botStyle} aria-hidden="true">
      <IrenLivingCanvas mood={travelling?"travel":"guide"} expanded paused={paused||reduced}
        look={look} fallback={fallback}/>
    </div>
    <section ref={bubbleRef} className={"ir97-speech-bubble"+(placement.compact?" is-compact":"")+(more?" is-expanded":"")}
      style={bubbleStyle} role="region" aria-label={"IREN guide, step "+(index+1)+" of "+total}>
      <header className="ir97-bubble-heading">
        <span><strong>IREN</strong> <span aria-hidden="true">/</span> {index+1} OF {total}</span>
        <button type="button" onClick={onPause} aria-label="Pause IREN tour" title="Pause tour">×</button>
      </header>
      <p key={step.id} className="ir97-bubble-line" aria-live="polite" aria-atomic="true">
        {target?copy:"I can't highlight this area yet. We can move on."}
      </p>
      {more&&<div className="ir97-bubble-details">
        <strong>{step.title}</strong>
        <p>{step.description}</p>
        <small>{step.hint}</small>
      </div>}
      <div className="ir97-bubble-actions">
        <button type="button" onClick={onSkip} className="ir97-subtle">Skip</button>
        {index>0&&<button type="button" onClick={onBack}>Back</button>}
        <button type="button" className="ir97-more" aria-expanded={more} onClick={()=>setMore(value=>!value)}>{more?"Less":"More"}</button>
        <button type="button" className="ir97-forward" data-iren-next onClick={onNext}>{index===total-1?"Finish":"Next"} <span aria-hidden="true">→</span></button>
      </div>
    </section>
  </div>;
}
