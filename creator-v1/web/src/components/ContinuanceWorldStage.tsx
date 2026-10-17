import {useEffect,useRef} from "react";

/**
 * ANEVUM.WEB.UPDATE.2026-10-17.002.CONTINUANCE-WORLD-STAGES
 * Procedural observatory ambience, not fictional activity or replacement key art.
 * A bounded high-DPI 2D compositor adapts to each site room. Real controls,
 * published artwork and all account actions remain separate DOM.
 * Save-Data and reduced-motion users receive a stationary composition.
 * No network, WebGL, telemetry, user data or storage.
 */
export type ContinuanceRoom =
  | "home" | "discover" | "community" | "creators"
  | "levels" | "support" | "studio" | "member" | "field";

export function roomForContinuancePath(path:string):ContinuanceRoom {
  if(path==="/") return "home";
  if(path.startsWith("/discover")||path.startsWith("/projects/")||path==="/boards") return "discover";
  if(path.startsWith("/community")) return "community";
  if(path.startsWith("/creators")||path.startsWith("/@")) return "creators";
  if(path==="/levels"||path==="/thebutton") return "levels";
  if(path.startsWith("/support")) return "support";
  if(path.startsWith("/studio")||path.startsWith("/create")) return "studio";
  if(path.startsWith("/member")||path.startsWith("/account")||path==="/library"||path==="/saved") return "member";
  return "field";
}

type Light = readonly [number,number,number];
type Star={x:number;y:number;size:number;phase:number;depth:number;warm:number};
const colors:Record<ContinuanceRoom,readonly [Light,Light]> = {
  home:[[222,165,244],[255,182,153]],
  discover:[[156,215,255],[208,179,255]],
  community:[[250,179,192],[175,176,255]],
  creators:[[213,183,255],[147,225,241]],
  levels:[[245,211,153],[164,228,242]],
  support:[[255,179,188],[221,185,255]],
  studio:[[186,233,236],[245,169,189]],
  member:[[232,198,231],[151,206,249]],
  field:[[174,214,242],[237,190,213]]
};
const clamp=(value:number,low:number,high:number)=>Math.min(high,Math.max(low,value));
const TAU=Math.PI*2;
function seeded(room:ContinuanceRoom){
  let state=2166136261;
  for(let i=0;i<room.length;i++)state=Math.imul(state^room.charCodeAt(i),16777619)>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function buildStars(room:ContinuanceRoom):Star[]{
  const random=seeded(room);
  return Array.from({length:112},()=>({
    x:random(),y:random(),size:.35+Math.pow(random(),4)*1.8,
    phase:random()*TAU,depth:.22+random()*.78,warm:random()
  }));
}
const rgb=(c:Light,a:number)=>
  "rgba("+c[0]+","+c[1]+","+c[2]+","+clamp(a,0,1).toFixed(3)+")";

export function ContinuanceWorldStage({path}:{path:string}){
  const room=roomForContinuancePath(path);
  const ref=useRef<HTMLCanvasElement|null>(null);
  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas)return;
    const context=canvas.getContext("2d",{alpha:true});
    if(!context)return;
    const ctx=context;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
    const lowMemory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory;
    const quiet=Boolean(connection?.saveData||(typeof lowMemory==="number"&&lowMemory<=2));
    const palette=colors[room],stars=buildStars(room);
    let width=1,height=1,dpr=1,last=0,raf=0,disposed=false;
    let visible=document.visibilityState==="visible";
    const canAnimate=()=>!motion.matches&&!quiet&&visible&&!disposed;

    function paint(time:number){
      const seconds=time/1000;
      ctx.clearRect(0,0,width,height);
      const mobile=width<720;
      const primary=palette[0],secondary=palette[1];
      const centerX=width*(room==="community" ? .78 : room==="studio" ? .79 : .82);
      const centerY=height*(room==="home" ? .23 : room==="levels" ? .32 : .28);
      const radius=Math.min(width*(mobile ? .43 : .23),height*.32);
      ctx.save();
      ctx.globalCompositeOperation="screen";
      // Segmented orbital strata; the original paintings stay primary.
      for(let orbit=0;orbit<3;orbit++){
        const r=radius*(.8+orbit*.3);
        const ry=r*(.56+orbit*.095);
        const rotation=-.46+orbit*.31+Math.sin(seconds*.04+orbit)*.018;
        const color=orbit===1?secondary:primary;
        const segments=orbit===0?7:5;
        for(let segment=0;segment<segments;segment++){
          const offset=segment*TAU/segments+seconds*(orbit===1?-.012:.009);
          const length=(orbit===0?.18:.12)+Math.sin(segment*4.1+orbit)*.035;
          ctx.beginPath();
          ctx.ellipse(centerX,centerY,r,ry,rotation,offset,offset+length);
          ctx.strokeStyle=rgb(color,(mobile ? .055 : .095)*(1-orbit*.13));
          ctx.lineWidth=orbit===0?1.35:.85;
          ctx.stroke();
        }
      }
      // High-DPI spectral points with deterministic spatial depth.
      const count=mobile?58:112;
      for(let i=0;i<count;i++){
        const star=stars[i];
        const x=star.x*width+(mobile?0:Math.sin(seconds*.025+star.phase)*star.depth*3);
        const y=star.y*height+(mobile?0:Math.cos(seconds*.019+star.phase)*star.depth*2);
        const pulse=(motion.matches||quiet) ? .8 : .58+.42*Math.sin(seconds*(.28+star.depth*.45)+star.phase);
        const opacity=(.10+star.depth*.29)*pulse*(room==="home" ? .65 : 1);
        const c=star.warm>.68?secondary:primary;
        const size=star.size*(mobile ? .78 : 1);
        ctx.fillStyle=rgb(c,opacity);
        ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
        if(i%31===0&&!mobile){
          ctx.strokeStyle=rgb(c,opacity*.48);ctx.lineWidth=.65;
          ctx.beginPath();
          ctx.moveTo(x-size*5,y);ctx.lineTo(x+size*5,y);
          ctx.moveTo(x,y-size*5);ctx.lineTo(x,y+size*5);
          ctx.stroke();
        }
      }
      // Fine survey intersections are decorative, never user or server telemetry.
      ctx.lineWidth=.55;
      for(let j=0;j<(mobile?3:7);j++){
        const a=stars[j*9+3],b=stars[j*9+7];
        ctx.strokeStyle=rgb(j%2?primary:secondary,.055);
        ctx.beginPath();ctx.moveTo(a.x*width,a.y*height);
        ctx.lineTo(b.x*width,b.y*height);ctx.stroke();
      }
      ctx.restore();
    }
    function drawFrame(now:number){
      raf=0;
      if(!canAnimate())return;
      if(now-last>=50){paint(now);last=now;}
      raf=window.requestAnimationFrame(drawFrame);
    }
    function pause(){if(raf){window.cancelAnimationFrame(raf);raf=0;}}
    function wake(){
      pause();paint(0);
      if(canAnimate())raf=window.requestAnimationFrame(drawFrame);
    }
    function resize(){
      const bounds=canvas!.getBoundingClientRect();
      width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);
      const maxScale=Math.sqrt(2400000/(width*height));
      dpr=clamp(Math.min(window.devicePixelRatio||1,maxScale),.5,1.8);
      canvas!.width=Math.max(1,Math.round(width*dpr));
      canvas!.height=Math.max(1,Math.round(height*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      wake();
    }
    const onVisibility=()=>{visible=document.visibilityState==="visible";if(visible)wake();else pause();};
    const onMotion=()=>wake();
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    if(observer)observer.observe(canvas);
    else window.addEventListener("resize",resize,{passive:true});
    document.addEventListener("visibilitychange",onVisibility);
    motion.addEventListener("change",onMotion);
    resize();
    return()=>{
      disposed=true;pause();observer?.disconnect();
      window.removeEventListener("resize",resize);
      document.removeEventListener("visibilitychange",onVisibility);
      motion.removeEventListener("change",onMotion);
    };
  },[room]);
  return <div className={"av64-worldstage av64-worldstage--"+room}
    aria-hidden="true" data-continuance-scene={room}>
    <span className="av64-worldstage-nebula"/>
    <span className="av64-worldstage-crown"/>
    <canvas className="av64-worldstage-field" ref={ref} aria-hidden="true"/>
    <span className="av64-worldstage-vignette"/>
  </div>;
}
