import {useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import {SEVERANCE_MEDIA_V139} from "./SeveranceCinematicV139";

const FRAMES=48;
const frameSource=(frame:number,mobile:boolean)=>
 "/assets/severance/frames-"+(mobile?"mobile":"desktop")+"/frame-"+String(frame+1).padStart(4,"0")+".webp";
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/**
 * A real native-canvas scroll frame sequence inspired by the pre-rendered
 * cinematic/scroll-scrubbing technique; NOT a WebGL scene or application fork.
 *
 * This is a progressive visual enhancement only: captions, links, section
 * headings and browsing remain accessible before any pixels are decoded.
 * Frame cache is capped at six objects. Reduced-motion/data-saver users get
 * one static poster and do not download the sequence.
 */
export function SeveranceScrollSequenceV139(){
 const root=useRef<HTMLElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const progress=useRef(0);
 const cache=useRef<Map<number,HTMLImageElement>>(new Map());
 const raf=useRef(0);
 const [enabled,setEnabled]=useState(false);
 const [mobile,setMobile]=useState(false);
 const [assetFailed,setAssetFailed]=useState(false);

 useEffect(()=>{
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const slow=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  const update=()=>{
   setMobile(window.matchMedia("(max-width: 760px)").matches);
   setEnabled(!motion.matches&&!slow?.saveData&&!["2g","slow-2g"].includes(slow?.effectiveType||""));
  };
  update();
  motion.addEventListener?.("change",update);
  window.addEventListener("resize",update,{passive:true});
  return ()=>{
   motion.removeEventListener?.("change",update);
   window.removeEventListener("resize",update);
  };
 },[]);

 useEffect(()=>{
  if(!enabled||assetFailed||!canvas.current||!root.current)return;
  const section=root.current,element=canvas.current;
  let active=false,alive=true;
  let current=-1;
  const mobileSnapshot=mobile;
  const cacheRef=cache.current;
  cacheRef.clear();
  const draw=(bitmap:HTMLImageElement,index:number)=>{
   if(!alive||current!==index||!element)return;
   const ctx=element.getContext("2d",{alpha:false});
   if(!ctx)return;
   const box=element.getBoundingClientRect();
   const scale=Math.min(window.devicePixelRatio||1,1.5);
   const width=Math.max(1,Math.min(1920,Math.round(box.width*scale)));
   const height=Math.max(1,Math.min(1080,Math.round(box.height*scale)));
   if(width!==element.width||height!==element.height){
    element.width=width;element.height=height;
   }
   const ratio=Math.max(width/bitmap.naturalWidth,height/bitmap.naturalHeight);
   const dw=bitmap.naturalWidth*ratio,dh=bitmap.naturalHeight*ratio;
   ctx.fillStyle="#06090b";
   ctx.fillRect(0,0,width,height);
   ctx.drawImage(bitmap,(width-dw)/2,(height-dh)/2,dw,dh);
   section.dataset.frameStatus="loaded";
  };
  const request=(index:number)=>{
   const prior=cacheRef.get(index);
   if(prior?.complete&&prior.naturalWidth>0){draw(prior,index);return}
   if(prior)return;
   const img=new Image();
   cacheRef.set(index,img);
   img.decoding="async";
   img.onload=()=>draw(img,index);
   img.onerror=()=>{if(alive&&index===current)setAssetFailed(true)};
   img.src=frameSource(index,mobileSnapshot);
   // Capped decoded-frame budget for modest-memory phones.
   if(cacheRef.size>6){
    for(const key of cacheRef.keys()){
     if(key!==index&&Math.abs(key-index)>2){cacheRef.delete(key);break}
    }
    if(cacheRef.size>6){
     for(const key of cacheRef.keys()){
      if(key!==index){cacheRef.delete(key);break}
     }
    }
   }
  };
  const paint=()=>{
   raf.current=0;
   if(!active||!alive)return;
   const rect=section.getBoundingClientRect();
   const extent=Math.max(1,rect.height-window.innerHeight);
   progress.current=clamp(-rect.top/extent);
   section.style.setProperty("--av139-sequence-progress",String(progress.current));
   const index=Math.min(FRAMES-1,Math.round(progress.current*(FRAMES-1)));
   if(index!==current){current=index;request(index)}
   else {
    const cached=cacheRef.get(index);
    if(cached?.complete&&cached.naturalWidth>0)draw(cached,index);
   }
  };
  const onScroll=()=>{if(active&&!raf.current)raf.current=requestAnimationFrame(paint)};
  const observer=new IntersectionObserver(entries=>{
   active=entries.some(e=>e.isIntersecting);
   if(active)onScroll();
  },{rootMargin:"200px",threshold:0});
  observer.observe(section);
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll,{passive:true});
  return ()=>{
   alive=false;active=false;observer.disconnect();
   window.removeEventListener("scroll",onScroll);
   window.removeEventListener("resize",onScroll);
   if(raf.current)cancelAnimationFrame(raf.current);
   cacheRef.clear();
  };
 },[enabled,mobile,assetFailed]);

 return <section ref={root} className="av139-sequence" data-av139-scroll-sequence="cinematic"
  data-frame-status={assetFailed?"fallback":enabled?"pending":"poster"}
  aria-labelledby="av139-sequence-title"
  style={{"--av139-sequence-progress":0} as CSSProperties}>
  <div className="av139-sequence-sticky">
   <div className="av139-sequence-scene" aria-hidden="true">
    <canvas ref={canvas} className="av139-sequence-canvas"/>
    <div className="av139-sequence-still" style={{backgroundImage:`url("${SEVERANCE_MEDIA_V139.poster}")`}}/>
    <div className="av139-sequence-vignette"/>
   </div>
   <div className="av139-sequence-screen">
    <div className="av139-sequence-topline"><span>TRANSCOSMIC / FIELD TRANSMISSION</span><span>DESIGN CONCEPT · NOT GAMEPLAY</span></div>
    <div className="av139-sequence-story">
     <span className="av139-sequence-index">RECOVERED SIGNAL / 001</span>
     <h2 id="av139-sequence-title">EVERY END<br/><em>LEAVES A TRACE.</em></h2>
     <p>A world that keeps changing. A history that survives its players. A signal that never truly goes quiet.</p>
     <Link to="/severance">ENTER THE FIELD REPORT <Icon name="arrow" size={16}/></Link>
    </div>
    <div className="av139-sequence-footer" aria-hidden="true"><span>01 / THE EXPERIMENT</span><div><span className="av139-sequence-progress"/></div><span>CONTINUANCE RECORD</span></div>
   </div>
  </div>
 </section>;
}
