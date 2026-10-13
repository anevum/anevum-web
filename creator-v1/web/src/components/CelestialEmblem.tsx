import { useId } from "react";
import type { EmblemMotif } from "../lib/artifact-art";

/**
 * Original ANEVUM emblem master. Layered gradients, engraved geometry, enamel,
 * silver/copper/gold rim lighting and a separate micro treatment. No raster
 * downloads, third-party images, WebGL or external fonts.
 *
 * "preview" is illustrative only; "earned" must ONLY come from verified
 * member/creator API achievement state.
 */
type Props = {
  motif: EmblemMotif;
  size?: "nano" | "tiny" | "micro" | "compact" | "small" | "medium" | "large" | "hero";
  state?: "preview" | "earned" | "locked";
  className?: string;
  title?: string;
};
const ringTicks = Array.from({length:36},(_,i)=>i);
const starPoints = Array.from({length:8},(_,i)=>i);

function Motif({name,colors}:{name:EmblemMotif;colors:{light:string;warm:string;deep:string}}) {
  const common={fill:"none",stroke:"currentColor",strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  switch(name) {
    case "beacon": return <g {...common}>
      <path d="M128 52v22m0 108v22M52 128h22m108 0h22M74 74l15 15m78 78 15 15M182 74l-15 15m-78 78-15 15" strokeWidth="6" opacity=".8"/>
      <path d="M128 61 149 112 195 128 149 144 128 195 107 144 61 128 107 112Z" fill={colors.light} stroke={colors.warm} strokeWidth="5"/>
      <path d="m128 88 11 31 30 9-30 9-11 31-11-31-30-9 30-9Z" fill={colors.deep} strokeWidth="2"/>
      <circle cx="128" cy="128" r="12" fill="#fff3c4" strokeWidth="0"/>
    </g>;
    case "lens": return <g {...common}>
      <path d="M55 128C73 88 101 71 128 71s55 17 73 57c-18 40-46 57-73 57s-55-17-73-57Z" fill={colors.deep} strokeWidth="7"/>
      <circle cx="128" cy="128" r="47" fill={colors.light} fillOpacity=".2" strokeWidth="4"/>
      <circle cx="128" cy="128" r="33" fill={colors.light} stroke={colors.warm} strokeWidth="4"/>
      <circle cx="135" cy="132" r="17" fill={colors.deep} strokeWidth="0"/>
      <circle cx="141" cy="117" r="8" fill="#fffafa" strokeWidth="0"/>
      <path d="M90 80 73 63m93 130 17 17m0-147-18 18M73 193l17-17" strokeWidth="4" opacity=".85"/>
    </g>;
    case "compass": return <g {...common}>
      <circle cx="128" cy="128" r="72" strokeWidth="4" strokeDasharray="5 7" opacity=".7"/>
      <circle cx="128" cy="128" r="57" fill={colors.deep} strokeWidth="5"/>
      <path d="M128 47 145 112 209 128 145 144 128 209 111 144 47 128 111 112Z" fill={colors.light} stroke={colors.warm} strokeWidth="5"/>
      <path d="M128 74 135 121 182 128 135 135 128 182 121 135 74 128 121 121Z" fill={colors.deep} strokeWidth="3"/>
      <circle cx="128" cy="128" r="12" fill={colors.warm} strokeWidth="3"/>
      <path d="M128 42v13m0 146v13M42 128h13m146 0h13" strokeWidth="4"/>
    </g>;
    case "launch": return <g {...common}>
      <path d="M100 155C95 107 125 70 178 55c14 54-5 106-52 123Z" fill={colors.light} stroke={colors.warm} strokeWidth="6"/>
      <path d="m114 172-22 20-4-26-26-4 29-34 22 5" fill={colors.deep} strokeWidth="5"/>
      <path d="m141 172 10 30 31 3-1-42" strokeWidth="5"/>
      <circle cx="151" cy="95" r="17" fill={colors.deep} strokeWidth="5"/>
      <path d="m104 184-17 24m12-46-27 19m46 0-15 33" stroke={colors.warm} strokeWidth="5"/>
      <path d="M167 65c-2 22-16 42-39 55" strokeWidth="4" opacity=".7"/>
    </g>;
    case "trinity": return <g {...common}>
      <path d="M128 55 174 83v57l-46 28-46-28V83Z" fill={colors.deep} strokeWidth="5"/>
      <path d="m128 55 46 28-46 28-46-28Z" fill={colors.light} stroke={colors.warm} strokeWidth="5"/>
      <path d="m82 83 46 28v57l-46-28Zm92 0-46 28v57l46-28Z" fill={colors.warm} fillOpacity=".58" strokeWidth="3"/>
      <path d="m128 168-38 24 38 21 38-21Z" fill={colors.light} strokeWidth="4"/>
      <path d="M128 28v20m-80 47 26 6m134-6-26 6M64 185l17-19m111 19-17-19" strokeWidth="5" opacity=".75"/>
    </g>;
    case "chronometer": return <g {...common}>
      <circle cx="128" cy="130" r="68" fill={colors.deep} stroke={colors.warm} strokeWidth="7"/>
      <circle cx="128" cy="130" r="55" strokeWidth="3" strokeDasharray="3 6"/>
      <path d="M128 79v9m0 84v9M77 130h9m84 0h9" strokeWidth="5"/>
      <path d="M126 131 161 98m-35 33-22-23" strokeWidth="7"/>
      <circle cx="126" cy="131" r="11" fill={colors.light} stroke={colors.warm} strokeWidth="3"/>
      <path d="M107 44h42m-21-2v17m-47-9-15 15m110-15 15 15" strokeWidth="8"/>
      <path d="M102 203h52" strokeWidth="6" opacity=".78"/>
    </g>;
    case "spark": return <g {...common}>
      <path d="m128 46 18 60 60 22-60 18-18 60-21-60-57-18 57-22Z" fill={colors.light} stroke={colors.warm} strokeWidth="5"/>
      <path d="m128 76 8 42 43 10-43 8-8 41-10-41-40-8 40-10Z" fill={colors.deep} strokeWidth="3"/>
      <circle cx="128" cy="128" r="11" fill="#fff4cf" strokeWidth="0"/>
      <path d="M178 76v19m-9-10h19M67 164v19m-9-10h19" strokeWidth="5"/>
    </g>;
    case "key": return <g {...common}>
      <circle cx="100" cy="101" r="43" fill={colors.deep} stroke={colors.warm} strokeWidth="7"/>
      <circle cx="100" cy="101" r="22" fill={colors.light} fillOpacity=".38" strokeWidth="5"/>
      <path d="m131 132 72 72m-18-18-19 18m5-32-19 18" stroke={colors.warm} strokeWidth="15"/>
      <path d="m130 131 70 70" stroke={colors.light} strokeWidth="7"/>
      <path d="M68 79 82 67" strokeWidth="4"/>
    </g>;
    case "atlas": return <g {...common}>
      <ellipse cx="128" cy="128" rx="69" ry="28" transform="rotate(-26 128 128)" stroke={colors.warm} strokeWidth="5"/>
      <circle cx="128" cy="128" r="54" fill={colors.deep} strokeWidth="5"/>
      <ellipse cx="128" cy="128" rx="23" ry="54" strokeWidth="3"/>
      <path d="M74 128h108m-99-26h90m-90 52h90" strokeWidth="3" opacity=".75"/>
      <path d="M128 48v160M48 128h160" strokeWidth="2" opacity=".65"/>
      <circle cx="178" cy="101" r="10" fill={colors.light} stroke={colors.warm} strokeWidth="4"/>
    </g>;
    case "light": return <g {...common}>
      <path d="M128 41 149 95 205 72 172 123 215 155 157 149 147 210 119 161 65 192 87 138 41 105 98 108Z" fill={colors.light} stroke={colors.warm} strokeWidth="6"/>
      <path d="M128 79 142 115 179 103 157 130 179 153 143 145 129 181 116 145 82 161 102 130 79 112 115 116Z" fill={colors.deep} strokeWidth="4"/>
      <circle cx="129" cy="130" r="16" fill="#fffdf2" strokeWidth="0"/>
      <path d="M128 15v16m0 195v16M15 128h16m195 0h16" strokeWidth="5" opacity=".9"/>
    </g>;
    default: return <g {...common}>
      <ellipse cx="128" cy="128" rx="76" ry="30" transform="rotate(-24 128 128)" stroke={colors.warm} strokeWidth="8"/>
      <circle cx="128" cy="128" r="28" fill={colors.light} strokeWidth="4"/>
      <path d="M128 49 141 112 201 128 141 144 128 207 115 144 55 128 115 112Z" fill={colors.deep} strokeWidth="5"/>
      <circle cx="188" cy="68" r="12" fill="#fff0cb" stroke={colors.warm} strokeWidth="3"/>
    </g>;
  }
}

function MicroMotif({name}:{name:EmblemMotif}) {
  // Deliberately redrawn at small sizes, not a 256px etching scaled to 20px.
  if(name==="lens") return <><ellipse cx="16" cy="16" rx="10" ry="6.4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="16" cy="16" r="4.5" fill="#ebdbab"/><circle cx="17" cy="15" r="1.5" fill="#20345e"/></>;
  if(name==="compass"||name==="atlas") return <><path d="M16 5 19.4 12.6 27 16 19.4 19.4 16 27 12.6 19.4 5 16 12.6 12.6Z" fill="currentColor"/><circle cx="16" cy="16" r="3.2" fill="#273960"/></>;
  if(name==="launch")return <><path d="M12 22c-2-9 3-15 13-17 2 10-4 16-13 17Z" fill="currentColor"/><path d="m12 22-6 5m3-8-4 1" stroke="#eed39c" strokeWidth="2" strokeLinecap="round"/></>;
  if(name==="trinity")return <><path d="m16 4 9 5.4v12L16 27l-9-5.6v-12Z" stroke="#eee0b7" strokeWidth="1.8" fill="#487cb0"/><path d="m7 9.4 9 5.6 9-5.6M16 15v12" stroke="#e2f5ff" strokeWidth="1.6" fill="none"/></>;
  if(name==="chronometer")return <><circle cx="16" cy="17" r="10" fill="none" stroke="currentColor" strokeWidth="2.6"/><path d="M16 9v8l6-5M12 3h8" stroke="#f1dba8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>;
  if(name==="key")return <><circle cx="11" cy="11" r="5.7" fill="none" stroke="currentColor" strokeWidth="2.7"/><path d="m15 15 11 11m-5-5-3 3" stroke="#ecd39e" strokeWidth="3.5" strokeLinecap="round"/></>;
  if(name==="light"||name==="beacon"||name==="spark")return <><path d="m16 3 3.8 9.2L29 16l-9.2 3.8L16 29l-3.8-9.2L3 16l9.2-3.8Z" fill="currentColor"/><circle cx="16" cy="16" r="3.5" fill="#fff5c6"/></>;
  return <><ellipse cx="16" cy="16" rx="12" ry="5" transform="rotate(-24 16 16)" fill="none" stroke="currentColor" strokeWidth="2.4"/><circle cx="16" cy="16" r="4" fill="#ffe4ae"/></>;
}

export function CelestialEmblem({motif,size="medium",state="preview",className="",title}:Props) {
  const uid=useId().replace(/:/g,"");
  const metal=uid+"-metal",face=uid+"-face",enamel=uid+"-enamel",glass=uid+"-glass",glow=uid+"-glow",stars=uid+"-stars";
  const colors = { light:"#d5faff",warm:"#f6dba0",deep:"#243b64" };
  if(["nano","tiny","micro","compact"].includes(size)) return <span className={`celestial-emblem celestial-emblem--${size} celestial-emblem--${state} ${className}`} data-artifact-motif={motif}>
    <svg viewBox="0 0 32 32" role={title?"img":undefined} aria-hidden={title?undefined:true} aria-label={title||undefined} focusable="false">
      <defs>
        <radialGradient id={uid+"-tiny-enamel"}><stop stopColor="#4975aa"/><stop offset="100%" stopColor="#162747"/></radialGradient>
      </defs>
      <path d="M16 1.5 20 3.2 24 2.8 27.2 7 30 12l-.5 6.3-2.7 6.1-5.1 4.1-5.7 1.8-6-1.8-5-4L2 19l-.5-7L4 7l5-4.2L13 3Z" fill="#bdb4ac" stroke="#f4e3bd" strokeWidth=".8"/>
      <circle cx="16" cy="16" r="12.7" fill={`url(#${uid+"-tiny-enamel"})`} stroke="#e3ca96" strokeWidth="1.4"/>
      <g color="#c8f5f6" stroke="#c8f5f6"><MicroMotif name={motif}/></g>
      <path d="M7 10c3-5 12-7 18-2" fill="none" stroke="#fff" strokeOpacity=".38" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </span>;

  const labelled=Boolean(title);
  return <span className={`celestial-emblem celestial-emblem--${size} celestial-emblem--${state} ${className}`} data-artifact-motif={motif}>
    <svg viewBox="0 0 256 256" role={labelled?"img":undefined} aria-hidden={labelled?undefined:true} aria-label={labelled?title:undefined} focusable="false">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5edda"/><stop offset="17%" stopColor="#8b9ebf"/><stop offset="31%" stopColor="#f7d69f"/>
          <stop offset="47%" stopColor="#617393"/><stop offset="65%" stopColor="#e4e4ed"/><stop offset="79%" stopColor="#b58a61"/><stop offset="100%" stopColor="#283a60"/>
        </linearGradient>
        <radialGradient id={face} cx=".32" cy=".23" r=".82">
          <stop offset="0%" stopColor="#5879bb"/><stop offset="35%" stopColor="#243c72"/>
          <stop offset="73%" stopColor="#14244a"/><stop offset="100%" stopColor="#09132e"/>
        </radialGradient>
        <radialGradient id={enamel} cx=".35" cy=".23" r=".72">
          <stop offset="0%" stopColor="#b6fbf0" stopOpacity=".5"/><stop offset="44%" stopColor="#6f86e7" stopOpacity=".23"/><stop offset="100%" stopColor="#1b2755" stopOpacity=".03"/>
        </radialGradient>
        <linearGradient id={glass} x1=".12" y1="0" x2=".8" y2="1">
          <stop offset="0%" stopColor="#f9ffff" stopOpacity=".6"/><stop offset="45%" stopColor="#fff" stopOpacity=".08"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id={glow}><stop offset="0%" stopColor="#8eeadf" stopOpacity=".64"/><stop offset="55%" stopColor="#8a8bee" stopOpacity=".18"/><stop offset="100%" stopColor="#6162d0" stopOpacity="0"/></radialGradient>
        <radialGradient id={stars}><stop offset="0%" stopColor="#fff1ce"/><stop offset="100%" stopColor="#99c3f8"/></radialGradient>
      </defs>
      <circle cx="128" cy="127" r="121" fill={`url(#${glow})`} opacity=".63"/>
      <path d="M128 9 148 20 170 15 184 32 207 34 215 56 236 68 233 91 247 110 238 130 246 151 232 172 231 195 209 205 195 227 172 225 150 242 128 232 107 244 85 227 62 226 50 206 27 196 26 171 10 154 18 129 10 106 24 90 20 67 41 55 48 33 73 33 86 15 107 20Z"
        fill={`url(#${metal})`} stroke="#fff8e2" strokeWidth="1.8"/>
      <circle cx="128" cy="128" r="108" fill="#162342" stroke="#203453" strokeWidth="5"/>
      <circle cx="128" cy="128" r="103" fill="none" stroke={`url(#${metal})`} strokeWidth="11"/>
      <circle cx="128" cy="128" r="93" fill="none" stroke="#d1ecfb" strokeOpacity=".5" strokeWidth="1.5"/>
      <g stroke="#f5deaa" strokeWidth="2.2" strokeLinecap="round" opacity=".76">
        {ringTicks.map(i=><path key={i} d={i%3===0?"M128 30v12":"M128 33v6"} transform={`rotate(${i*10} 128 128)`}/>)}
      </g>
      <circle cx="128" cy="128" r="81" fill={`url(#${face})`} stroke="#e2c792" strokeWidth="3"/>
      <circle cx="128" cy="128" r="75" fill={`url(#${enamel})`}/>
      <g stroke="#aad2fa" strokeWidth="1" opacity=".31" fill="none">
        <circle cx="128" cy="128" r="62"/><circle cx="128" cy="128" r="48"/>
        <path d="M51 128h154M128 51v154M74 74l108 108M182 74 74 182"/>
      </g>
      <g fill={`url(#${stars})`} opacity=".86">
        {starPoints.map(i=><circle key={i} cx="128" cy="56" r={i%2?1.5:2.4} transform={`rotate(${i*45} 128 128)`}/>)}
      </g>
      <g className="celestial-emblem__motif" color="#c9faff" stroke="#c7eefd">
        <Motif name={motif} colors={colors}/>
      </g>
      <path d="M72 74C93 48 157 40 183 73" fill="none" stroke={`url(#${glass})`} strokeWidth="8" strokeLinecap="round" opacity=".68"/>
      <path d="M46 121c0-46 39-85 82-87" stroke="#f2fff9" strokeOpacity=".48" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <circle cx="128" cy="128" r="80" stroke="#e6f4ff" strokeOpacity=".28" strokeWidth="1" fill="none"/>
      <path d="M128 4v14m0 220v14M4 128h14m220 0h14" stroke="#f7e2b0" strokeWidth="2.2" opacity=".87"/>
      <circle cx="45" cy="45" r="3" fill="#d9fef8"/><circle cx="212" cy="212" r="2.8" fill="#ffe4a3"/>
    </svg>
  </span>;
}
