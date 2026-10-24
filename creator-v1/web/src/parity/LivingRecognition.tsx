import {useId} from 'react';
import type {BadgeFamily} from '../lib/player-recognition';
import './living-recognition-v136.css';

const familyTones:Record<BadgeFamily,{edge:string,core:string,metal:string}>={
  origin:{edge:'#8be9ff',core:'#2f648f',metal:'#c6f4ff'},
  community:{edge:'#8facff',core:'#344f98',metal:'#c5dcff'},
  creation:{edge:'#c19cff',core:'#62529f',metal:'#e2c5ff'},
  discovery:{edge:'#f0d28f',core:'#807046',metal:'#fff2c1'},
  collaboration:{edge:'#f4a7d9',core:'#8c427c',metal:'#f8d7ee'},
  craft:{edge:'#9bc9ff',core:'#3f6699',metal:'#d8edff'},
  stewardship:{edge:'#8ee9c8',core:'#357c72',metal:'#d2ffed'},
  continuance:{edge:'#e4b5f5',core:'#704d91',metal:'#f4dcff'}
};
function seedFor(value:string){
 let result=0x811c9dc5;
 for(const character of value)result=Math.imul(result^character.charCodeAt(0),16777619);
 return result>>>0;
}
function Geometry({seed,stroke,fill}:{seed:number;stroke:string;fill:string}){
 const order=5+seed%4,rotation=(seed%45)-22;
 return <g>
   <g transform={'rotate('+rotation+' 50 50)'} fill="none" stroke={stroke}>
     <circle cx="50" cy="50" r="34" strokeOpacity=".55" strokeWidth="1.8"/>
     <ellipse cx="50" cy="50" rx={27+seed%5} ry="12" strokeWidth="2" transform="rotate(-35 50 50)"/>
     <ellipse cx="50" cy="50" rx="28" ry="12" strokeOpacity=".7" strokeWidth="1.6" transform="rotate(50 50 50)"/>
   </g>
   <path d={Array.from({length:order*2},(_,i)=>{
      const a=(i*Math.PI/order-Math.PI/2),r=i%2===0?25:12;
      return (i?'L':'M')+(50+Math.cos(a)*r).toFixed(2)+' '+(50+Math.sin(a)*r).toFixed(2);
    }).join('')+'Z'} fill={fill} fillOpacity=".48" stroke={stroke} strokeWidth="2.2"/>
   <circle cx="50" cy="50" r="5" fill={stroke}/>
 </g>;
}

/** Display-only badge. Eligibility is unchanged: parent must supply an issued
 * badge from the canonical earned list. Locked/preview state stays explicit.
 */
export function LivingBadgeSigil({badge,displayName,family,size,state}:{
 badge:string;displayName:string;family:BadgeFamily;size:number;state:'earned'|'preview'|'locked'
}){
 const id=useId().replaceAll(':',''),seed=seedFor(badge),tone=familyTones[family];
 return <span className={'av66-badge-insignia p136-badge-sigil av66-badge-insignia--'+
     (size<=22?'tiny':size<=38?'small':size<=76?'medium':'large')+
     ' av66-badge-insignia--'+state}
    title={displayName} role="img" aria-label={displayName}
    data-badge-id={badge} data-entitlement={state} style={{width:size,height:size}}>
   <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
     <defs>
       <linearGradient id={id+'-rim'} x1="0" y1="0" x2="1" y2="1">
         <stop stopColor={tone.metal}/><stop offset=".27" stopColor={tone.edge}/>
         <stop offset=".55" stopColor="#283752"/><stop offset=".83" stopColor={tone.metal}/>
         <stop offset="1" stopColor={tone.edge}/>
       </linearGradient>
       <radialGradient id={id+'-face'} cx=".3" cy=".23" r=".9">
         <stop stopColor={tone.core}/><stop offset=".7" stopColor="#0b1a2b"/><stop offset="1" stopColor="#040b18"/>
       </radialGradient>
     </defs>
     <path d="M50 2 66 7 79 5 86 19 98 30 94 45 98 59 86 70 79 94 62 92 50 99 35 93 19 94 13 76 3 65 7 50 3 34 16 21 21 7 38 9Z"
       fill={'url(#'+id+'-rim)'} stroke={tone.metal} strokeWidth="1"/>
     <path d="M50 9 64 13 77 12 85 27 90 39 87 50 90 63 79 74 73 86 59 84 50 92 37 85 26 87 20 72 10 62 14 49 11 36 22 26 27 14 40 16Z"
       fill={'url(#'+id+'-face)'} stroke="#a1d8ff" strokeOpacity=".40" strokeWidth="1"/>
     <Geometry seed={seed} stroke={tone.edge} fill={tone.core}/>
     <path d="M21 50c0-16 12-28 27-29M80 50c0 16-11 28-27 29"
       fill="none" stroke="#ffffff" strokeOpacity=".42" strokeWidth="1.5" strokeLinecap="round"/>
     {state==='locked'&&<path d="M41 46v-6a9 9 0 0 1 18 0v6m-20 0h22v20H39Z"
       fill="#030b15" stroke={tone.metal} strokeWidth="3"/>}
   </svg>
 </span>;
}

/** Used only after the canonical member identity has verified and exposed
 * an actually earned level. This never changes the XP ledger or unlock gates.
 */
export function LivingLevelSigil({level,size}:{level:number;size:number}){
 const safe=Math.max(1,Math.min(30,Math.trunc(level)));
 const id=useId().replaceAll(':','');
 const tier=safe<=5?0:safe<=10?1:safe<=15?2:safe<=20?3:safe<=25?4:5;
 const edge=['#78e7ff','#a2b5ff','#bd9dff','#f0cf9d','#9afbe0','#f3d1ff'][tier];
 const core=['#245982','#4654a8','#67529e','#927443','#408979','#7b5caf'][tier];
 const spokes=Math.max(5,Math.min(11,5+Math.floor(safe/5)));
 return <span className="level-emblem p136-level-sigil" style={{width:size,height:size}}
   role="img" aria-label={'Earned Evolution level '+safe} title={'Earned Evolution Level '+safe}
   data-artwork="procedural-verified" data-level={safe}>
   <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
     <defs>
       <radialGradient id={id+'-face'} cx=".3" cy=".23" r=".9">
         <stop stopColor={edge}/><stop offset=".23" stopColor={core}/>
         <stop offset=".8" stopColor="#111d3e"/><stop offset="1" stopColor="#040b17"/>
       </radialGradient>
     </defs>
     <g fill="none" stroke={edge} strokeWidth="2">
       <circle cx="60" cy="60" r="56" opacity=".58"/>
       <circle cx="60" cy="60" r="50" opacity=".75" strokeWidth="4" strokeDasharray={tier>=3?'13 3':'4 2'}/>
       {Array.from({length:spokes},(_,i)=>{
         const rad=i*Math.PI*2/spokes-Math.PI/2;
         return <path key={i} d={'M'+(60+Math.cos(rad)*47)+' '+(60+Math.sin(rad)*47)+
             'L'+(60+Math.cos(rad)*57)+' '+(60+Math.sin(rad)*57)} strokeWidth="3"/>;
       })}
       <ellipse cx="60" cy="60" rx="36" ry="16" transform="rotate(-30 60 60)" opacity=".65"/>
     </g>
     <circle cx="60" cy="60" r="41" fill={'url(#'+id+'-face)'} stroke={edge} strokeWidth="2"/>
     <path d="M60 23 69 51 97 60 69 69 60 97 51 69 23 60 51 51Z"
       fill="none" stroke={edge} strokeOpacity=".32" strokeWidth="1.5"/>
     <text x="60" y="69" fill="#f8fbff" fontSize="31" textAnchor="middle"
       fontFamily="system-ui, sans-serif" fontWeight="800">{safe}</text>
   </svg>
 </span>;
}
