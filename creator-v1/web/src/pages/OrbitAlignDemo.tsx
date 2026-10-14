import {useEffect,useReducer,useRef,useState,type KeyboardEvent} from "react";
import {initialOrbitState,orbitReducer} from "../lib/orbit-align-logic";
const RINGS=["OUTER","MIDDLE","INNER"] as const;
const RADII=[158,116,75] as const;
const COLORS=["#e9b98b","#9bc5e8","#cab5f7"] as const;

/** Original first-party UI mechanics demo. This is NOT a hosted creator submission.
 *  No purchases, server XP, accounts or persistent high scores.
 */
export function OrbitAlignDemo({onExit,returnToProject=false}:{onExit:()=>void;returnToProject?:boolean}){
  const [game,dispatch]=useReducer(orbitReducer,undefined,initialOrbitState);
  const {phase,slots,moves}=game;
  const [seconds,setSeconds]=useState(0);
  const stage=useRef<HTMLDivElement>(null);
  useEffect(()=>{stage.current?.focus({preventScroll:true});},[]);
  useEffect(()=>{
    if(phase!=="playing")return;
    const timer=window.setInterval(()=>setSeconds(n=>n+1),1000);
    return()=>window.clearInterval(timer);
  },[phase]);
  function rotate(index:number){dispatch({type:"rotate",ring:index});}
  function restart(){dispatch({type:"reset"});setSeconds(0);}
  function onKeyboard(event:KeyboardEvent<HTMLDivElement>){
    const target=event.target;
    if(target instanceof HTMLElement&&target.matches("input,textarea,select,[contenteditable=true]"))return;
    if(["1","2","3"].includes(event.key)){
      event.preventDefault();event.stopPropagation();
      rotate(Number(event.key)-1);
    }else if(event.key.toLowerCase()==="p"||event.key==="Escape"){
      event.preventDefault();event.stopPropagation();
      if(phase==="playing")dispatch({type:"pause"});
      else if(phase==="paused")dispatch({type:"resume"});
    }else if((event.key===" "||event.key==="Enter")&&event.target===stage.current){
      event.preventDefault();event.stopPropagation();
      if(phase==="ready")dispatch({type:"start"});
    }
  }
  const aligned=slots.filter(slot=>slot===0).length;
  return <div ref={stage} tabIndex={-1} onKeyDownCapture={onKeyboard}
    className={"fx-game fx-game--"+phase} aria-label="Orbit Align, interactive first-party puzzle prototype">
    <header className="fx-game-header">
      <div><span>ANEVUM / PLAYER LAB</span><strong>ORBIT ALIGN<span>.</span></strong></div>
      <button type="button" className="fx-game-exit" onClick={onExit}>EXIT EXPERIENCE <span aria-hidden="true">×</span></button>
    </header>
    <div className="fx-game-layout">
      <section className="fx-game-display" aria-label="Game field">
        <div className="fx-game-ambient" aria-hidden="true"/>
        <div className="fx-game-field">
          <svg className="fx-game-orbit" viewBox="-205 -205 410 410" role="img"
            aria-label={"Three orbital signals. "+aligned+" of 3 aligned to the upper north beacon."}>
            <defs>
              <radialGradient id="fx-center-light"><stop offset="0" stopColor="#b2daee" stopOpacity=".52"/><stop offset="1" stopColor="#b2daee" stopOpacity="0"/></radialGradient>
              <filter id="fx-beacon-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4"/>
              </filter>
            </defs>
            <circle r="195" fill="none" stroke="#92b5d3" strokeOpacity=".15" strokeDasharray="2 8"/>
            <circle r="170" fill="none" stroke="#d5bc90" strokeOpacity=".16"/>
            <circle r="45" fill="url(#fx-center-light)" opacity=".7"/>
            {RADII.map((radius,i)=><g key={radius} className={"fx-game-track fx-game-track--"+i}>
              <circle r={radius} fill="none" stroke={COLORS[i]} strokeOpacity=".18" strokeWidth="16"/>
              <circle r={radius} fill="none" stroke={COLORS[i]} strokeOpacity=".62" strokeWidth="3"
                strokeDasharray="5 13" />
              <circle r={radius} fill="none" stroke="#a3b7cc" strokeWidth="29" strokeOpacity=".035"
                className="fx-game-ring-hit" onClick={()=>rotate(i)} aria-hidden="true"/>
              <g className="fx-game-marker-group" style={{transform:"rotate("+(slots[i]*45)+"deg)"}}>
                <circle cx="0" cy={-radius} r="18" fill={COLORS[i]} opacity=".52" filter="url(#fx-beacon-glow)"/>
                <circle cx="0" cy={-radius} r="8" fill={COLORS[i]} stroke="#fff1d9" strokeWidth="1.7"/>
                <circle cx="0" cy={-radius} r="3" fill="#ffffff"/>
              </g>
            </g>)}
            <path d="M0,-203 L-9,-184 L9,-184Z" fill="#f1d19d"/>
            <line x1="0" y1="-183" x2="0" y2="-53" stroke="#ecd2a6" strokeWidth="1.4" strokeDasharray="4 8" opacity=".7"/>
            <circle cx="0" cy="0" r="40" fill="#0b1628" stroke="#c9b69c" strokeOpacity=".76" strokeWidth="1.3"/>
            <circle cx="0" cy="0" r="30" fill="#192d45" stroke="#b7e0f6" strokeOpacity=".5"/>
            <path d="M-11 0 L0 -15 L11 0 L0 15Z" fill="#d6c08b"/>
            <circle cx="0" cy="0" r="5" fill="#f9e6bb"/>
          </svg>
          <div className="fx-game-compass" aria-hidden="true">NORTH / 000°</div>
        </div>
        <div className="fx-game-field-caption"><span>01 / ALIGNMENT FIELD</span><span>THREE RINGS · EIGHT POSITIONS</span></div>
      </section>
      <aside className="fx-game-panel">
        <div className="fx-game-status">
          <span className="fx-eyebrow">THE OBJECTIVE</span>
          <h2>BRING EVERY<br/><em>SIGNAL HOME.</em></h2>
          <p>Rotate all three signals to the gold north beacon. Each action advances one ring by 45°. Align all three to complete the sequence.</p>
        </div>
        <div className="fx-game-hud" aria-live="off">
          <div><span>ALIGNED</span><strong>{aligned}<small> / 3</small></strong></div>
          <div><span>MOVES</span><strong>{moves}</strong></div>
          <div><span>SESSION</span><strong>{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</strong></div>
        </div>
        <div className="fx-game-controls" aria-label="Rotate signals">
          {RINGS.map((name,i)=><button key={name} type="button" disabled={phase!=="playing"}
            onClick={()=>rotate(i)} className={slots[i]===0?"fx-game-ring-ready":""}>
            <span className="fx-game-control-num">{String(i+1).padStart(2,"0")}</span>
            <span><strong>{name} ORBIT</strong><small>{slots[i]===0?"ALIGNED WITH NORTH":"ROTATE 45° CLOCKWISE"}</small></span>
            <span aria-hidden="true">↻</span>
          </button>)}
        </div>
        <div className="fx-game-foot-controls"><span>KEYBOARD: 1 · 2 · 3 / P TO PAUSE</span>
          {phase==="playing"&&<button type="button" onClick={()=>dispatch({type:"pause"})}>PAUSE Ⅱ</button>}
          {phase!=="playing"&&<button type="button" onClick={restart}>RESET ↺</button>}
        </div>
      </aside>
    </div>
    {phase!=="playing"&&<div className="fx-game-overlay" role="status" aria-live="polite">
      <div className="fx-game-overlay-card">
        <span className="fx-eyebrow">{phase==="complete"?"SESSION COMPLETE":phase==="paused"?"EXPERIENCE PAUSED":"ANEVUM / INTERACTIVE PROTOTYPE"}</span>
        <h2>{phase==="complete"?<>ORBIT<br/><em>RESTORED.</em></>:
             phase==="paused"?<>HOLD YOUR<br/><em>POSITION.</em></>:
             <>ENTER THE<br/><em>ALIGNMENT.</em></>}</h2>
        <p>{phase==="complete"?"All three orbital signals are aligned. This result is local to your session; no account XP or public score has been awarded.":
             phase==="paused"?"Your current moves and ring positions are preserved until you resume or reset.":
             "An original first-party puzzle demonstrating ANEVUM's in-platform game transitions. This is not a published creator submission."}</p>
        {phase==="ready"&&<button className="fx-game-overlay-start" type="button" onClick={()=>{dispatch({type:"start"});stage.current?.focus({preventScroll:true});}}>START EXPERIENCE <span aria-hidden="true">→</span></button>}
        {phase==="paused"&&<button className="fx-game-overlay-start" type="button" onClick={()=>{dispatch({type:"resume"});stage.current?.focus({preventScroll:true});}}>RESUME <span aria-hidden="true">▶</span></button>}
        {phase==="complete"&&<button className="fx-game-overlay-start" type="button" onClick={restart}>PLAY AGAIN <span aria-hidden="true">↻</span></button>}
        <button type="button" className="fx-game-overlay-exit" onClick={onExit}>{returnToProject?"BACK TO FEATURED PROJECT":"RETURN TO NETWORK"}</button>
      </div>
    </div>}
  </div>;
}
