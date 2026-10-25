/** V136.017 — original vector engraving for the Arrival scene.
 * A presentational optical instrument, never a second renderer, link or data
 * visualization. Source geometry is deterministic and first-party authored.
 */
const ticks=Array.from({length:48},(_,index)=>{
 const angle=index*Math.PI/24-Math.PI/2;
 const outer=185,inner=index%4===0?168:177;
 return {id:index,x1:420+inner*Math.cos(angle),y1:344+inner*Math.sin(angle),
  x2:420+outer*Math.cos(angle),y2:344+outer*Math.sin(angle)};
});
const nodes=[
 [253,258],[312,181],[523,201],[590,286],[560,460],[350,505],[232,420]
] as const;
export function ContinuanceInstrumentV136017(){
 return <div className="p136017-celestial-instrument" aria-hidden="true" data-art="continuance-original-optics">
  <svg viewBox="0 0 840 690" preserveAspectRatio="xMidYMid meet" focusable="false">
   <defs>
    <linearGradient id="p136017-engraved-alloy" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0" stopColor="#effbff" stopOpacity=".83"/>
     <stop offset=".4" stopColor="#63cde9" stopOpacity=".26"/>
     <stop offset=".7" stopColor="#9990e5" stopOpacity=".54"/>
     <stop offset="1" stopColor="#95e2ff" stopOpacity=".08"/>
    </linearGradient>
    <radialGradient id="p136017-field">
     <stop offset="0" stopColor="#70d5e9" stopOpacity=".1"/>
     <stop offset=".67" stopColor="#449ccb" stopOpacity=".07"/>
     <stop offset="1" stopColor="#243b78" stopOpacity="0"/>
    </radialGradient>
   </defs>
   <circle cx="420" cy="344" r="232" fill="url(#p136017-field)"/>
   <circle cx="420" cy="344" r="196" stroke="url(#p136017-engraved-alloy)" strokeWidth="1" fill="none" opacity=".66"/>
   <circle cx="420" cy="344" r="162" stroke="#92dced" strokeWidth=".65" fill="none" strokeDasharray="3 11" opacity=".68"/>
   <circle cx="420" cy="344" r="119" stroke="#c5e7ff" strokeWidth="1.1" fill="none" opacity=".44"/>
   <circle cx="420" cy="344" r="111" stroke="#8e79d7" strokeWidth=".8" fill="none" opacity=".42"/>
   <ellipse cx="420" cy="344" rx="219" ry="66" fill="none" stroke="#8fe4ff" strokeWidth="1.1" opacity=".62" transform="rotate(-31 420 344)"/>
   <ellipse cx="420" cy="344" rx="214" ry="92" fill="none" stroke="#a892ee" strokeWidth=".8" opacity=".44" transform="rotate(41 420 344)"/>
   <path d="M420 110 L420 168 M420 520 L420 578 M188 344 H245 M595 344 H653" stroke="#a4ddf1" strokeWidth=".95" opacity=".64"/>
   <path d="M420 96 L427 111 L420 126 L413 111 Z M420 561 L427 576 L420 591 L413 576 Z" fill="#a8e0f5" opacity=".65"/>
   {ticks.map(item=><line key={item.id} x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke="#a6e9ff" strokeWidth={item.id%4===0?1.4:.6} opacity={item.id%4===0?.73:.38}/>)}
   <path d="M267 240 L267 223 L292 223 M559 468 L559 491 L535 491 M275 459 L256 459 L256 439 M568 245 L590 245 L590 265"
    stroke="#9ee5ff" fill="none" opacity=".58"/>
   <path d="M420 283 L437 328 L420 392 L403 328 Z" fill="#0b2439" stroke="#9ee6ff" strokeWidth="1.6" opacity=".82"/>
   <path d="M420 296 L432 328 L420 371 L409 328 Z" fill="#74cce8" opacity=".18"/>
   <path d="M420 268 V310 M420 377 V420" stroke="#d9f6ff" strokeWidth=".8" opacity=".7"/>
   {nodes.map(([x,y],i)=><g key={i}>
    <circle cx={x} cy={y} r="4.2" stroke="#bcf5ff" fill="#143956" strokeWidth="1"/>
    <circle cx={x} cy={y} r="1.2" fill="#c5eeff"/>
   </g>)}
   <path d="M204 590 H330 M510 590 H633 M204 590 v-8 M633 590 v-8" stroke="#9bc8e8" opacity=".4"/>
   <text x="204" y="613" fill="#a4daf0" fontFamily="monospace" fontSize="10" letterSpacing="3">CONTINUANCE / ATLAS</text>
   <text x="633" y="613" textAnchor="end" fill="#a4daf0" fontFamily="monospace" fontSize="10" letterSpacing="3">ANEVUM • ORIGIN</text>
  </svg>
 </div>;
}
