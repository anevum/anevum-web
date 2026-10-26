import {useId} from 'react';
import type {BadgeFamily} from '../lib/player-recognition';
import './living-recognition-v136.css';

const familyTones:Record<BadgeFamily,{edge:string,core:string,metal:string}>={
  origin:{edge:'#a9c5ce',core:'#344a58',metal:'#d6e4e8'},
  community:{edge:'#8fb6c5',core:'#274858',metal:'#bed8e0'},
  creation:{edge:'#adb8c8',core:'#47566b',metal:'#d8dee7'},
  discovery:{edge:'#b9c8b8',core:'#52655a',metal:'#e3eae1'},
  collaboration:{edge:'#b4aabb',core:'#61556b',metal:'#e0d8e3'},
  craft:{edge:'#9abacc',core:'#42647a',metal:'#d7e8ef'},
  stewardship:{edge:'#96bdb3',core:'#42645f',metal:'#d0e8e0'},
  continuance:{edge:'#b4bec9',core:'#4a5c69',metal:'#e3e8ef'}
};
function seedFor(value:string){
 let result=0x811c9dc5;
 for(const character of value)result=Math.imul(result^character.charCodeAt(0),16777619);
 return result>>>0;
}
/** Distinct award-family silhouettes and instruments. Badge IDs still carry
 * an independent stable engraving, while the server owns issuance. */
const familyFrames:Record<BadgeFamily,string>={
 origin:'M50 2 65 9 82 8 90 25 98 40 91 57 94 77 76 88 60 98 43 92 24 95 13 77 3 60 9 43 6 24 25 14Z',
 community:'M29 5H71L95 29V71L71 95H29L5 71V29Z',
 creation:'M50 3 90 22 98 63 72 95H28L2 63 10 22Z',
 discovery:'M50 2 62 17 81 10 83 30 98 50 83 69 81 90 62 83 50 98 38 83 19 90 17 69 2 50 17 30 19 10 38 17Z',
 collaboration:'M50 3 74 13 96 35 96 65 74 88 50 97 26 88 4 65 4 35 26 13Z',
 craft:'M50 2 63 13 80 9 84 26 98 38 90 54 95 71 78 78 68 95 50 91 32 95 22 78 5 71 10 54 2 38 16 26 20 9 37 13Z',
 stewardship:'M50 3 92 20V53Q90 81 50 98Q10 81 8 53V20Z',
 continuance:'M50 2 62 13 79 7 86 23 98 35 91 51 96 69 80 80 67 96 50 90 33 96 20 80 4 69 9 51 2 35 14 23 21 7 38 13Z'
};
function FamilyDevice({family,seed,stroke,fill}:{family:BadgeFamily;seed:number;stroke:string;fill:string}){
 const offset=(seed%31)-15;
 const base={stroke,strokeWidth:3.8,fill:'none',strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 const shape=(()=>{
  switch(family){
   case 'origin':return <><path d="M50 25V75M25 50H75M32 32L68 68M68 32L32 68" {...base}/><path d="M50 34 58 50 50 66 42 50Z" fill={stroke}/></>;
   case 'community':return <><circle cx="31" cy="40" r="9" {...base}/><circle cx="69" cy="40" r="9" {...base}/><circle cx="50" cy="69" r="9" {...base}/><path d="M39 45 46 60M61 45 54 60M40 40H60" {...base}/></>;
   case 'creation':return <><path d="M50 22 75 36V65L50 80 25 65V36Z" {...base}/><path d="M25 36 50 51 75 36M50 51V80" {...base}/></>;
   case 'discovery':return <><circle cx="50" cy="50" r="26" {...base}/><path d="M50 22 58 44 79 50 58 56 50 78 42 56 21 50 42 44Z" fill={fill} stroke={stroke} strokeWidth="2"/></>;
   case 'collaboration':return <><circle cx="39" cy="50" r="18" {...base}/><circle cx="61" cy="50" r="18" {...base}/><path d="M43 34 57 66M57 34 43 66" {...base}/></>;
   case 'craft':return <><path d="M50 22 74 37V64L50 79 26 64V37Z" {...base}/><circle cx="50" cy="50" r="12" {...base}/><path d="M50 27V38M50 62V73M27 50H38M62 50H73" {...base}/></>;
   case 'stewardship':return <><path d="M50 21 72 32V51Q70 70 50 81Q30 70 28 51V32Z" {...base}/><path d="M39 51 47 60 63 41" {...base}/></>;
   case 'continuance':return <><path d="M20 51Q34 24 50 51Q66 78 80 51Q66 24 50 51Q34 78 20 51Z" {...base}/><circle cx="50" cy="51" r="5" fill={stroke}/></>;
  }
 })();
 return <g>
  <g>{shape}</g>
  <g transform={'rotate('+offset+' 50 50)'} opacity=".72" fill={stroke}>
   {Array.from({length:3+seed%5},(_,j)=><rect key={j} x={48+(j%2?1:-1)*(31+j%4)} y={49} width="2" height="3" rx=".7" transform={'rotate('+(j*360/(3+seed%5))+' 50 50)'}/>)}
  </g>
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
     <path d={familyFrames[family]}
       fill={'url(#'+id+'-rim)'} stroke={tone.metal} strokeWidth="1"/>
     <path d="M50 9 64 13 77 12 85 27 90 39 87 50 90 63 79 74 73 86 59 84 50 92 37 85 26 87 20 72 10 62 14 49 11 36 22 26 27 14 40 16Z"
       fill={'url(#'+id+'-face)'} stroke="#a1d8ff" strokeOpacity=".40" strokeWidth="1"/>
     <FamilyDevice family={family} seed={seed} stroke={tone.edge} fill={tone.core}/>
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
