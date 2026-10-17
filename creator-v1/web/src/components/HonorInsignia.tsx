import {useId} from 'react';
import type {DistinctionDefinition} from '../lib/player-recognition';

/** A medal is a three-dimensional institutional seal, never a badge reskin.
 * Ribbons are woven horizontal service bars and must remain visually distinct.
 */
export function HonorInsignia({distinction,compact=false}:{
 distinction:DistinctionDefinition;compact?:boolean
}){
 const gradient=useId().replaceAll(':','');
 if(distinction.kind==='ribbon')return <span
  className={'av65-honor av65-ribbon av65-tone-'+distinction.accent+(compact?' is-compact':'')}
  role="img" aria-label={'Ribbon: '+distinction.name} title={distinction.name}>
   <span className="av65-ribbon-edge"/><span className="av65-ribbon-weave"/>
   <span className="av65-ribbon-core" aria-hidden="true">✦</span>
  </span>;
 return <span
  className={'av65-honor av65-medal av65-tone-'+distinction.accent+(compact?' is-compact':'')}
  role="img" aria-label={'Medal: '+distinction.name} title={distinction.name}>
  <svg viewBox="0 0 80 96" fill="none" aria-hidden="true" focusable="false">
   <defs>
    <linearGradient id={gradient+'-metal'} x1="10" y1="8" x2="72" y2="85" gradientUnits="userSpaceOnUse">
     <stop stopColor="#fff5d6"/><stop offset=".22" stopColor="#bd9f71"/><stop offset=".45" stopColor="#f7e1ae"/><stop offset=".67" stopColor="#604d60"/><stop offset=".88" stopColor="#d0ae81"/><stop offset="1" stopColor="#ffe7be"/>
    </linearGradient>
    <radialGradient id={gradient+'-enamel'} cx=".38" cy=".2" r=".9">
     <stop stopColor="#b5adff"/><stop offset=".46" stopColor="#49325f"/><stop offset="1" stopColor="#151024"/>
    </radialGradient>
   </defs>
   <path d="M25 5h30l-5 25-10 9-10-9L25 5Z" fill="#563d69" stroke={'url(#'+gradient+'-metal)'} strokeWidth="2"/>
   <path d="M28 6h7l5 22 5-22h7l-7 29-5 5-5-5Z" fill="#e8aac1" opacity=".9"/>
   <path d="M40 29 46 39 56 35 57 47 69 53 62 64 69 75 56 81 52 92 40 86 28 92 24 81 11 75 18 64 11 53 23 47 24 35 34 39Z" fill={'url(#'+gradient+'-metal)'} stroke="#f1dcc6" strokeWidth="1.3"/>
   <circle cx="40" cy="63" r="24" fill="#24192c" stroke="#fff1d3" strokeWidth="2"/>
   <circle cx="40" cy="63" r="20.5" fill={'url(#'+gradient+'-enamel)'} stroke="#b4a0dc" strokeWidth="1.6"/>
   <path d="M40 44 45 57 58 62 45 67 40 80 35 67 22 62 35 57Z" fill="#fbe9d8" stroke="#bd95de" strokeWidth=".9"/>
   <circle cx="40" cy="62" r="5" fill="#fffbe8"/>
   <path d="M24 63a16 16 0 0 1 16-16m16 16a16 16 0 0 1-16 16" stroke="#f8cc8b" strokeWidth="1.2" strokeLinecap="round" opacity=".68"/>
  </svg>
 </span>;
}
