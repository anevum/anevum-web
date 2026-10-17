import {useId} from 'react';
import type {DistinctionDefinition} from '../lib/player-recognition';

/** A medal is a three-dimensional institutional seal, never a badge reskin.
 * Ribbons are woven horizontal service bars and must remain visually distinct.
 */
function MedalGlyph({id}:{id:string}){
 const lit='#fff2d4',edge='#e7add0';
 switch(id){
 case 'first_light':
  return <g><path d="m40 44 5.2 13.8L59 63l-13.8 5.2L40 82l-5.2-13.8L21 63l13.8-5.2Z" fill={lit} stroke={edge} strokeWidth="1.3"/>
   <path d="M40 49v28M26 63h28" stroke="#745c81" strokeWidth="1.4"/><circle cx="40" cy="63" r="4" fill="#fffdf0"/></g>;
 case 'constellation_laureate':
  return <g><path d="m25 55 14-7 14 15-16 14-12-22Z" stroke="#d5b4e9" strokeWidth="1.4" fill="none"/>
   {[[25,55,3.3],[39,48,3.7],[53,63,3],[37,77,4]].map(([x,y,r],i)=><g key={i}><circle cx={x} cy={y} r={r+2} fill={edge} opacity=".26"/><circle cx={x} cy={y} r={r} fill={lit}/></g>)}</g>;
 case 'continuance_medal':
  return <g><ellipse cx="40" cy="63" rx="17" ry="8" transform="rotate(-30 40 63)" stroke={lit} strokeWidth="2.6"/>
   <ellipse cx="40" cy="63" rx="17" ry="8" transform="rotate(56 40 63)" stroke={edge} strokeWidth="1.9"/>
   <circle cx="40" cy="63" r="7" fill="#f5b6aa" stroke={lit} strokeWidth="1.7"/>
   <circle cx="55" cy="54" r="3.4" fill={lit}/></g>;
 case 'atlas_medal':
  return <g><circle cx="40" cy="63" r="16" stroke={lit} strokeWidth="2.4" fill="none"/>
   <ellipse cx="40" cy="63" rx="6.6" ry="16" stroke={edge} strokeWidth="1.6"/>
   <path d="M24 63h32M27 55h26M27 71h26M40 47v32" stroke={lit} strokeWidth="1.4"/></g>;
 case 'worldbuilder_medal':
  return <g><path d="m40 45 15 9v18l-15 9-15-9V54Z" stroke={lit} strokeWidth="2.5" fill="#6e558f" fillOpacity=".45"/>
   <path d="m25 54 15 9 15-9m-15 9v18" stroke={edge} strokeWidth="2"/>
   <path d="m40 45 15 9-15 9-15-9Z" fill="#e6cade" fillOpacity=".5"/></g>;
 case 'lightkeeper_medal':
  return <g><path d="M40 45c-8 11-16 17-15 24 0 9 7 13 15 13s15-4 15-13c1-7-8-14-15-24Z" fill="#be7a87" stroke={lit} strokeWidth="2.2"/>
   <path d="M40 55c-4 7-8 10-8 15 0 5 3 8 8 8s8-3 8-8c0-5-5-9-8-15Z" fill={lit}/>
   <path d="M40 63v11" stroke="#d08aa0" strokeWidth="2.1" strokeLinecap="round"/></g>;
 default:return <g><path d="M40 44 45 57 58 62 45 67 40 80 35 67 22 62 35 57Z" fill={lit} stroke={edge}/><circle cx="40" cy="62" r="4" fill="#fffdf0"/></g>;
 }
}

export function HonorInsignia({distinction,compact=false}:{
 distinction:DistinctionDefinition;compact?:boolean
}){
 const gradient=useId().replaceAll(':','');
 if(distinction.kind==='ribbon')return <span
  className={'av65-honor av65-ribbon av65-tone-'+distinction.accent+' av65-ribbon--'+distinction.id+(compact?' is-compact':'')}
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
   <MedalGlyph id={distinction.id}/>
   <path d="M24 63a16 16 0 0 1 16-16m16 16a16 16 0 0 1-16 16" stroke="#f8cc8b" strokeWidth="1.2" strokeLinecap="round" opacity=".68"/>
  </svg>
 </span>;
}
