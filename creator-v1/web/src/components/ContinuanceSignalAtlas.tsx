/**
 * ANEVUM V125 / Continuance Signal Atlas
 *
 * Resolution-independent first-contact instrument. This is decorative
 * visualization, not simulated traffic, users, artificial signal counts or
 * a telemetry service. It does not read member state or send requests.
 */
const stars:ReadonlyArray<readonly [number,number,number]>=[
 [76,88,1.5],[128,261,1.2],[178,105,1.8],[201,520,1.5],
 [246,636,1.3],[284,172,1.1],[312,42,1.3],[356,602,1.4],
 [405,100,1.7],[455,652,1.2],[502,238,1.1],[535,82,1.8],
 [592,491,1.2],[645,182,1.5],[666,607,1.3],[688,334,1.1]
];
const ticks=Array.from({length:24},(_,index)=>index*15);

export function ContinuanceSignalAtlas(){
 return <svg className="av125-signal-atlas" viewBox="0 0 720 720"
   fill="none" aria-hidden="true" focusable="false">
   <defs>
     <radialGradient id="av125-atlas-core">
       <stop offset="0" stopColor="#d7edff" stopOpacity=".24"/>
       <stop offset=".22" stopColor="#b4b1f7" stopOpacity=".13"/>
       <stop offset=".68" stopColor="#6db5eb" stopOpacity=".035"/>
       <stop offset="1" stopColor="#6db5eb" stopOpacity="0"/>
     </radialGradient>
     <linearGradient id="av125-atlas-orbit" x1="0" y1="0" x2="720" y2="720" gradientUnits="userSpaceOnUse">
       <stop stopColor="#a8d4ee" stopOpacity=".15"/>
       <stop offset=".34" stopColor="#f0d6eb" stopOpacity=".74"/>
       <stop offset=".71" stopColor="#a0b7ff" stopOpacity=".3"/>
       <stop offset="1" stopColor="#d4f5ff" stopOpacity=".1"/>
     </linearGradient>
     <linearGradient id="av125-atlas-beam" x1="230" y1="440" x2="600" y2="170" gradientUnits="userSpaceOnUse">
       <stop stopColor="#7a9ddd" stopOpacity="0"/>
       <stop offset=".5" stopColor="#c5efff" stopOpacity=".65"/>
       <stop offset="1" stopColor="#cfa8f5" stopOpacity="0"/>
     </linearGradient>
   </defs>
   <circle cx="360" cy="360" r="326" fill="url(#av125-atlas-core)"/>
   <g className="av125-atlas-ticks" stroke="#b5d5f4" strokeWidth=".9">
     {ticks.map(angle=><path key={angle} d={angle%45===0?"M360 53V71":"M360 58V64"}
       transform={`rotate(${angle} 360 360)`} opacity={angle%45===0?".73":".37"}/>)}
   </g>
   <g stroke="url(#av125-atlas-orbit)">
     <circle cx="360" cy="360" r="309" strokeWidth=".9" opacity=".69" strokeDasharray="3 12"/>
     <circle cx="360" cy="360" r="278" strokeWidth=".9" opacity=".3"/>
     <circle cx="360" cy="360" r="230" strokeWidth="1.15" opacity=".36"/>
     <circle cx="360" cy="360" r="174" strokeWidth=".8" opacity=".3" strokeDasharray="5 12"/>
     <ellipse cx="360" cy="360" rx="323" ry="116" transform="rotate(-27 360 360)"
       strokeWidth="1.5" opacity=".66"/>
     <ellipse cx="360" cy="360" rx="276" ry="198" transform="rotate(34 360 360)"
       strokeWidth=".85" opacity=".5" strokeDasharray="1 8"/>
   </g>
   <g className="av125-atlas-radial" stroke="url(#av125-atlas-beam)" strokeWidth=".85" opacity=".65">
     <path d="M360 71V649M71 360H649"/>
     <path d="M140 140L580 580M580 140L140 580" strokeDasharray="3 12"/>
   </g>
   <g className="av125-atlas-azimuth" stroke="#d9ebff">
     <path d="M360 182V220M360 500V538M182 360H220M500 360H538"
       strokeWidth="1.2" opacity=".62"/>
     <path d="M304 304H334V274M386 446V416H416"
       strokeWidth="1" opacity=".48"/>
     <circle cx="360" cy="360" r="83" strokeWidth=".9" strokeDasharray="2 8" opacity=".5"/>
     <circle cx="360" cy="360" r="16" strokeWidth="1.25" opacity=".7"/>
     <circle cx="360" cy="360" r="3" fill="#d9f6ff" stroke="none" opacity=".84"/>
   </g>
   <g className="av125-atlas-beacon-sweep">
     <path d="M360 360L360 82A278 278 0 0 1 587 201Z" fill="#95bfe9" opacity=".04"/>
     <path d="M360 360L360 82" stroke="url(#av125-atlas-orbit)" strokeWidth="1.5" opacity=".6"/>
   </g>
   <g className="av125-atlas-stars" fill="#d3ecff">
     {stars.map(([x,y,r],index)=><circle key={index} cx={x} cy={y} r={r} opacity=".55"/>)}
   </g>
   <g className="av125-atlas-waypoints">
     <circle cx="136" cy="247" r="6" fill="#bfe6fa"/>
     <circle cx="136" cy="247" r="14" stroke="#bfe6fa" strokeWidth="1" opacity=".56"/>
     <circle cx="601" cy="301" r="5" fill="#e6c8f5"/>
     <circle cx="601" cy="301" r="13" stroke="#e6c8f5" strokeWidth="1" opacity=".58"/>
     <circle cx="423" cy="602" r="4.5" fill="#f8d5be"/>
     <circle cx="423" cy="602" r="12" stroke="#f8d5be" strokeWidth="1" opacity=".52"/>
     <path d="M150 247H208M601 288V252M423 614V652"
       stroke="#c8dcf4" strokeWidth="1" opacity=".54"/>
   </g>
 </svg>;
}
