import { useId } from "react";

/** Original ANEVUM scene art, independent of project/creator activity. */
export type CosmicScene = "hero" | "portal" | "games" | "tools" | "automation" | "research" | "creative" | "learning" | "libraries" | "other";
const palettes: Record<CosmicScene, {sky:string;mid:string;glow:string;ice:string;gold:string}> = {
  hero:       {sky:"#080d26",mid:"#282458",glow:"#ae6be1",ice:"#7be5fc",gold:"#ffcb83"},
  portal:     {sky:"#080d21",mid:"#32265d",glow:"#a376fe",ice:"#9bdcfe",gold:"#f7c784"},
  games:      {sky:"#091b3b",mid:"#28518a",glow:"#c38af7",ice:"#74dcff",gold:"#ffdf9a"},
  tools:      {sky:"#071530",mid:"#155074",glow:"#56c8d8",ice:"#9bf3e6",gold:"#ffc785"},
  automation: {sky:"#080f2f",mid:"#282e64",glow:"#6e78ff",ice:"#8be9ff",gold:"#ecb46b"},
  research:   {sky:"#090e25",mid:"#193768",glow:"#759fff",ice:"#bbd8ff",gold:"#ffd596"},
  creative:   {sky:"#170d32",mid:"#66236e",glow:"#ea7df4",ice:"#98deff",gold:"#e8b0ff"},
  learning:   {sky:"#10133b",mid:"#2e4579",glow:"#c39afa",ice:"#a3e6ff",gold:"#ffe3a0"},
  libraries:  {sky:"#071926",mid:"#164d60",glow:"#55c6bf",ice:"#b6ffed",gold:"#d9c38b"},
  other:      {sky:"#12112b",mid:"#3c2f6c",glow:"#a2a5ec",ice:"#9ad5ff",gold:"#e6c899"}
};
const stars = Array.from({length:104}, (_,i) => ({x:(i*109+41+(i%7)*83)%1600, y:(i*i*37+i*61+23)%580, r:i%11===0?2.8:i%5===0?1.65:.85}));
const spires=Array.from({length:21}, (_,i)=>({x:470+i*29,w:i%4===0?22:12,h:54+((i*37)%132)}));
const islands=Array.from({length:7},(_,i)=>({x:225+i*195+(i%2)*40,y:195+(i%3)*48,s:.56+(i%3)*.17}));
type Props = { scene?: CosmicScene; className?: string; title?: string; };
export function CosmicIllustration({scene="hero",className="",title}:Props){
  const c=palettes[scene],key=useId().replace(/:/g,"");
  const id=(s:string)=>key+"-"+s;
  const url=(s:string)=>"url(#"+id(s)+")";
  return <svg className={"cw-illustration "+className} viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" role={title?"img":undefined} aria-label={title||undefined} aria-hidden={title?undefined:true} focusable="false">
    <defs>
      <linearGradient id={id("sky")} x1="0" x2=".3" y1="0" y2="1"><stop stopColor={c.sky}/><stop offset=".52" stopColor={c.mid}/><stop offset="1" stopColor="#040918"/></linearGradient>
      <radialGradient id={id("nebula")}><stop stopColor={c.glow} stopOpacity=".75"/><stop offset=".28" stopColor={c.glow} stopOpacity=".24"/><stop offset="1" stopColor={c.glow} stopOpacity="0"/></radialGradient>
      <radialGradient id={id("sun")}><stop stopColor="#fff8e7"/><stop offset=".14" stopColor={c.gold}/><stop offset=".38" stopColor={c.glow} stopOpacity=".83"/><stop offset="1" stopColor={c.glow} stopOpacity="0"/></radialGradient>
      <linearGradient id={id("island")} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#5386aa"/><stop offset=".35" stopColor="#26355e"/><stop offset="1" stopColor="#0b132a"/></linearGradient>
      <linearGradient id={id("rings")} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4bc7ff" stopOpacity=".08"/><stop offset=".35" stopColor={c.ice} stopOpacity=".87"/><stop offset=".7" stopColor={c.gold}/><stop offset="1" stopColor="#a36ee1" stopOpacity=".3"/></linearGradient>
      <radialGradient id={id("atmos")} cx=".54" cy=".20"><stop stopColor="#b8f0ff" stopOpacity=".68"/><stop offset=".33" stopColor="#2884c7" stopOpacity=".28"/><stop offset="1" stopColor="#090e28" stopOpacity="0"/></radialGradient>
      <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="17"/></filter>
      <filter id={id("halo")} x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5"/></filter>
      <pattern id={id("grain")} width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".65" fill="#fff" opacity=".38"/><circle cx="29" cy="22" r=".75" fill="#fff" opacity=".2"/></pattern>
    </defs>
    <rect width="1600" height="700" fill={url("sky")}/>
    <rect width="1600" height="700" fill={url("grain")}/>
    <ellipse cx="930" cy="200" rx="910" ry="560" fill={url("nebula")}/>
    <ellipse cx="120" cy="150" rx="480" ry="240" fill={url("nebula")} opacity=".5"/>
    {stars.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i%9===0?c.gold:c.ice} opacity={i%4===0?".95":".55"}/>)}
    <circle cx="140" cy="106" r="116" fill="#081735" stroke={c.ice} strokeOpacity=".35" strokeWidth="3"/>
    <circle cx="104" cy="85" r="95" fill={url("atmos")} opacity=".7"/>
    <path d="M-100 470Q580 250 1720 585" fill="none" stroke={c.ice} strokeOpacity=".1" strokeWidth="3"/>
    <ellipse cx="800" cy="747" rx="1040" ry="440" fill={url("atmos")} opacity=".95"/>
    <path d="M0 660Q800 500 1600 665L1600 700H0Z" fill="#050c22" opacity=".6"/>
    <g className="cw-world-orbit">
      <ellipse cx="964" cy="286" rx="301" ry="121" transform="rotate(-20 964 286)" fill="none" stroke={url("rings")} strokeWidth="7" strokeOpacity=".75"/>
      <ellipse cx="964" cy="286" rx="275" ry="153" transform="rotate(37 964 286)" fill="none" stroke={c.ice} strokeWidth="2.5" strokeOpacity=".46"/>
      <ellipse cx="964" cy="286" rx="208" ry="205" fill="none" stroke={c.gold} strokeWidth="17" strokeOpacity=".16"/>
      <circle cx="964" cy="286" r="182" fill="#071129" stroke={url("rings")} strokeWidth="36"/>
      <circle cx="964" cy="286" r="144" fill="#0d1430" stroke={c.gold} strokeWidth="3" strokeOpacity=".9"/>
      <circle cx="964" cy="286" r="133" fill={url("nebula")}/>
      <circle cx="964" cy="286" r="140" fill="none" stroke={c.ice} strokeWidth="1.5" strokeDasharray="3 9" opacity=".7"/>
      <path d="M964 112V459M790 286h347" stroke={c.gold} strokeWidth="2" strokeOpacity=".5"/>
      <circle cx="964" cy="286" r="155" fill="none" stroke={c.gold} strokeWidth="2.5" strokeDasharray="28 28" opacity=".7"/>
      <circle cx="964" cy="286" r="117" fill={url("sun")}/>
      <circle cx="964" cy="286" r="12" fill="#fff6d3" filter={url("halo")}/>
      <circle cx="964" cy="286" r="12" fill="#fff7d2"/>
    </g>
    <g className="cw-world-islands">
      {islands.map((p,i)=><g key={i} transform={"translate("+p.x+" "+p.y+") scale("+p.s+")"} opacity={i===1?".79":"1"}>
        <path d="M-70 31 0 -3 88 29 48 47 0 50 -52 43Z" fill={url("island")} stroke="#89bed8" strokeOpacity=".5"/>
        <path d="M-52 42 0 126 52 40 0 53Z" fill="#142342"/>
        <path d="M-44 22 -44 -17 -25 -17 -25 -40 -8 -40 -8 -77 4 -94 15 -69 15 -26 37 -26 37 16Z" fill="#142341" stroke={c.ice} strokeWidth=".9" strokeOpacity=".6"/>
        <path d="M-49 19H49" stroke={c.gold} strokeWidth="3" opacity=".75"/>
        <circle cx="1" cy="-49" r="4" fill={c.gold}/>
      </g>)}
    </g>
    <path d="M276 577Q450 535 624 573T1024 573T1483 555" fill="none" stroke={c.gold} strokeWidth="4" opacity=".54"/>
    <path d="M388 613H1207L1288 693H290Z" fill="#091126" stroke="#6093a8" strokeOpacity=".4" strokeWidth="3"/>
    <g className="cw-world-city" fill="#101b38" stroke="#3a6c96" strokeOpacity=".45">
      {spires.map((s,i)=><g key={i}>
        <path d={"M"+s.x+" 584v-"+s.h+"h"+s.w+"v"+s.h+"Z"}/>
        <path d={"M"+(s.x+s.w/2)+" "+(584-s.h-32)+"L"+(s.x+s.w/2-5)+" "+(584-s.h)+"h10Z"}/>
        <path d={"M"+(s.x+3)+" "+(584-s.h+25)+"h"+Math.max(2,s.w-6)} stroke={c.gold} strokeWidth="1.1" strokeOpacity=".63"/>
      </g>)}
    </g>
    <path d="M0 700H1600V631Q1390 593 1260 645Q1060 588 835 648Q540 565 300 644Q150 602 0 657Z" fill="#040a1a"/>
    <ellipse cx="966" cy="592" rx="450" ry="18" fill={c.gold} opacity=".13" filter={url("soft")}/>
    <g transform="translate(1317 565)" fill="#050917" stroke={c.ice} strokeOpacity=".5" strokeWidth="1.5"><circle cy="-55" r="16"/><path d="M-17 -38-34 22 0 14 34 22 17 -38Z"/><path d="M-27 18-39 79h27L0 17 12 79h28L28 18Z"/></g>
    <g transform="translate(1430 595) scale(.8)" fill="#050917" stroke={c.gold} strokeOpacity=".44" strokeWidth="1.5"><circle cy="-55" r="16"/><path d="M-16 -39-27 21 0 11 29 19 16 -39Z"/><path d="M-24 20-34 80h25L0 16 12 80h22L23 20Z"/></g>
  </svg>;
}
