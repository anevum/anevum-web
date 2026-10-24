import {useId} from 'react';
import {BADGE_CATALOG,type BadgeFamily} from '../lib/player-recognition';
import './badge-insignia-v066.css';
import {LivingBadgeSigil} from '../parity/LivingRecognition';

/** Original high-density badge engraving system.
 * A distinct silhouette, engraved central device, and lighting are generated
 * from the server-known badge definition. The SVG contains NO earned-state logic.
 * Earned state is solely a verified API property supplied by the caller.
 */
const MATERIALS:Record<BadgeFamily,{enamel:string;deep:string;light:string;edge:string}>={
 origin:{enamel:'#996e87',deep:'#2c2441',light:'#ffd9bb',edge:'#e9bb98'},
 community:{enamel:'#668baf',deep:'#152d4b',light:'#c6f2fa',edge:'#9bc9de'},
 creation:{enamel:'#916aab',deep:'#2b1c4d',light:'#f4d9ff',edge:'#c7a3f5'},
 discovery:{enamel:'#92866c',deep:'#343048',light:'#ffe6a8',edge:'#e6c991'},
 collaboration:{enamel:'#9b6c92',deep:'#2b2044',light:'#fdd2e8',edge:'#e6a5d2'},
 craft:{enamel:'#787caa',deep:'#222841',light:'#e1e8ff',edge:'#afbce9'},
 stewardship:{enamel:'#6c947b',deep:'#19383d',light:'#e0f3c7',edge:'#b3d6ba'},
 continuance:{enamel:'#9b777c',deep:'#27223d',light:'#ffe9d0',edge:'#e6bfbb'}
};
const COSMIC_METAL={bronze:'#e1b89e',shadow:'#31263b'};

function Device({id}:{id:string}){
 const common={fill:'none',stroke:'currentColor',strokeWidth:4.5,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 switch(id){
  case 'first_signal':return <g {...common}><path d="M50 23v18m0 18v18M23 50h18m18 0h18M31 31l11 11m16 16 11 11M69 31 58 42M42 58 31 69"/><path d="m50 35 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" fill="currentColor" strokeWidth="2"/></g>;
  case 'world_shaper':return <g {...common}><path d="m50 23 22 13v27L50 77 28 63V36Z"/><path d="m28 36 22 14 22-14M50 50v27"/><path d="m50 23-22 13 22 14 22-14Z" fill="currentColor" fillOpacity=".24"/></g>;
  case 'first_orbit':return <g {...common}><circle cx="50" cy="50" r="16" fill="currentColor" fillOpacity=".17"/><ellipse cx="50" cy="50" rx="35" ry="15" transform="rotate(-31 50 50)"/><circle cx="78" cy="32" r="5" fill="currentColor"/><circle cx="46" cy="46" r="5" strokeWidth="2"/></g>;
  case 'returning_signal':return <g {...common}><path d="M32 26h36m-30 0c0 15 25 17 25 24S38 59 38 74m30 0H32m30 0c0-15-24-17-24-24s24-9 24-24"/><path d="m45 51 5 7 5-7M38 65l12 6 12-6" strokeWidth="2.8"/></g>;
  case 'first_thread':return <g {...common}><path d="M24 28h52v36H47L32 76V64h-8Z"/><path d="M36 40h28M36 49h17"/></g>;
  case 'first_reply':return <g {...common}><path d="M28 30h35v26H42L29 68V56h-1Z"/><path d="M52 44h21v19H62L49 73V62" strokeWidth="3.2"/><path d="M38 42h16"/></g>;
  case 'conversationalist':return <g {...common}><circle cx="26" cy="51" r="7" fill="currentColor"/><circle cx="74" cy="37" r="7" fill="currentColor"/><circle cx="62" cy="74" r="7" fill="currentColor"/><path d="m31 48 37-10M30 56l26 16m15-29-8 24"/><path d="M42 25h11m-5-5v10" strokeWidth="2.8"/></g>;
  case 'signal_booster':return <g {...common}><path d="M50 72V46m-8 26h16M50 41V29"/><circle cx="50" cy="38" r="5" fill="currentColor"/><path d="M36 30c-12 8-12 26 0 35m28-35c12 8 12 26 0 35M25 24c-18 13-18 43 0 54m50-54c18 13 18 43 0 54" strokeWidth="3.2"/></g>;
  case 'first_creation':return <g {...common}><path d="m24 72 31-36 15 13-31 35-17 2Z"/><path d="m55 36 10-12 13 12-8 13M31 64l15 13" strokeWidth="3"/><path d="m75 19 4 7 8 3-8 4-4 7-4-7-8-4 8-3Z" strokeWidth="2"/></g>;
  case 'maker_five':return <g {...common}><path d="m50 21 25 18-10 30H35L25 39Z"/><path d="m50 33 8 15-8 18-8-18Z" fill="currentColor" fillOpacity=".5"/><circle cx="50" cy="22" r="3"/><circle cx="74" cy="39" r="3"/><circle cx="65" cy="68" r="3"/><circle cx="35" cy="68" r="3"/><circle cx="26" cy="39" r="3"/></g>;
  case 'maker_twenty':return <g {...common}><path d="M20 75h60M27 75V37L50 22l23 15v38M37 75V47l13-8 13 8v28"/><path d="M41 58h18M50 42v33"/><path d="M22 32h11m34 0h11M50 14v8" strokeWidth="2.3"/></g>;
  case 'revision_keeper':return <g {...common}><circle cx="50" cy="50" r="25"/><path d="M50 30v20l14 7M26 34l-7-2m0 0 1 10m-1-10c8-14 28-22 45-9" strokeWidth="4"/><path d="M77 66a29 29 0 0 1-48 11" strokeWidth="3"/></g>;
  case 'first_source':return <g {...common}><path d="M38 30 24 50l14 20m24-40 14 20-14 20"/><path d="m58 22-16 56" strokeWidth="4"/><circle cx="49" cy="50" r="4" fill="currentColor"/></g>;
  case 'sound_weaver':return <g {...common}><path d="M20 50h8c8 0 8-20 16-20s8 40 16 40 8-20 16-20h4"/><path d="M21 37h13m33 26h11" strokeWidth="2.5" opacity=".7"/></g>;
  case 'image_maker':return <g {...common}><rect x="23" y="25" width="54" height="50" rx="4"/><circle cx="38" cy="39" r="6"/><path d="M27 67 45 49l12 11 8-8 8 15Z" fill="currentColor" fillOpacity=".25"/><path d="m24 67 20-18 12 12 9-9 12 15"/></g>;
  case 'story_teller':return <g {...common}><path d="M50 32c-8-7-20-9-29-5v45c10-4 23-2 29 4 8-6 21-8 29-4V27c-9-4-21-2-29 5Z"/><path d="M50 32v44M30 41h12m-12 9h12m17-9h12m-12 9h12" strokeWidth="3"/></g>;
  case 'playwright':return <g {...common}><path d="M33 36h34c12 0 16 12 18 26 2 14-7 18-17 8l-9-9H41l-9 9c-10 10-19 6-17-8 2-14 6-26 18-26Z"/><path d="M34 44v16m-8-8h16"/><circle cx="64" cy="47" r="3" fill="currentColor"/><circle cx="71" cy="56" r="3" fill="currentColor"/></g>;
  case 'first_collection':return <g {...common}><rect x="26" y="30" width="35" height="37" rx="3"/><path d="m35 24 34 7v43H35M44 39v18"/><path d="m46 42 4 8 9 2-9 3-4 8-4-8-8-3 8-2Z" strokeWidth="2.5"/></g>;
  case 'thoughtful_review':return <g {...common}><path d="M17 49c10-15 21-21 33-21s23 6 33 21C72 65 61 71 50 71S28 65 17 49Z"/><circle cx="50" cy="49" r="13"/><circle cx="54" cy="44" r="5" fill="currentColor"/><path d="m68 70 8 8" strokeWidth="3"/></g>;
  case 'pathfinder':return <g {...common}><circle cx="50" cy="50" r="26"/><path d="m50 19 8 23 23 8-23 8-8 23-8-23-23-8 23-8Z" fill="currentColor" fillOpacity=".22"/><path d="m58 42-8 8-8 8 8-23Z" fill="currentColor"/><circle cx="50" cy="50" r="4" fill="currentColor"/></g>;
  case 'first_collab':return <g {...common}><circle cx="40" cy="50" r="19"/><circle cx="60" cy="50" r="19"/><path d="m39 30 11 20-11 20m22-40L50 50l11 20" strokeWidth="3"/><circle cx="50" cy="50" r="4" fill="currentColor"/></g>;
  case 'cross_discipline':return <g {...common}><path d="m26 67 24-41 24 41Z"/><path d="m26 67 24-16 24 16M50 26v25m-24 16 24 12 24-12" strokeWidth="3.3"/><circle cx="50" cy="51" r="4.5" fill="currentColor"/></g>;
  case 'good_neighbor':return <g {...common}><path d="M50 74 24 49c-15-16 7-31 26-10 19-21 41-6 26 10Z" fill="currentColor" fillOpacity=".26"/><path d="M23 61h17l10 8 10-8h17" strokeWidth="3.2"/><path d="m50 74-26-25c-15-16 7-31 26-10 19-21 41-6 26 10Z" strokeWidth="3"/></g>;
  case 'accessibility_builder':return <g {...common}><path d="M26 77V25h35v52H26Z"/><path d="M35 77V34h26l18-12v44L61 77" strokeWidth="3.5"/><path d="m53 55 8-5-8-5M62 62h11" strokeWidth="3"/><circle cx="45" cy="53" r="3.5" fill="currentColor"/></g>;
  case 'archive_keeper':return <g {...common}><path d="M23 27h54M23 50h54M23 74h54M26 28v46m48-46v46"/><path d="M34 32h15v14H34Zm20 0h14v14H54ZM34 56h21v14H34Zm26 0h9v14h-9Z" fill="currentColor" fillOpacity=".23"/><path d="M58 56v14" strokeWidth="3"/></g>;
  case 'annual_return':return <g {...common}><circle cx="50" cy="50" r="24" strokeWidth="7" strokeDasharray="32 6"/><path d="M42 28 50 19l9 9M60 72l-10 10-9-10" strokeWidth="3"/><circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity=".23"/><path d="M50 42v16M42 50h16" strokeWidth="3"/></g>;
  default:return <g {...common}><circle cx="50" cy="50" r="23"/><path d="m50 29 7 15 15 6-15 7-7 15-7-15-15-7 15-6Z"/></g>;
 }
}
function Shell({family}:{family:BadgeFamily}){
 switch(family){
  case 'creation':return <path d="M50 5 87 24 94 61 70 92 30 92 6 61 13 24Z"/>;
  case 'craft':return <path d="m50 4 15 6 17-1 6 17 9 15-7 17 3 17-17 9-9 12-17-4-17 4-9-12-17-9 3-17-7-17 9-15 6-17 17 1Z"/>;
  case 'stewardship':return <path d="M50 5 86 20v34c0 21-15 31-36 41C29 85 14 75 14 54V20Z"/>;
  case 'collaboration':return <path d="M50 7 77 17 93 45 86 72 65 91H35L14 72 7 45 23 17Z"/>;
  case 'discovery':return <path d="m50 4 12 13 18-2 3 20 13 15-13 15-3 20-18-2-12 13-12-13-18 2-3-20L4 50l13-15 3-20 18 2Z"/>;
  case 'continuance':return <path d="m50 4 9 9 13-6 6 12 14 3-2 14 8 14-8 14 2 14-14 3-6 12-13-6-9 9-9-9-13 6-6-12-14-3 2-14-8-14 8-14-2-14 14-3 6-12 13 6Z"/>;
  case 'community':return <path d="M28 12h44l22 38-22 38H28L6 50Z"/>;
  default:return <circle cx="50" cy="50" r="44"/>;
 }
}
export function BadgeInsignia({badge,size='small',state='earned',title}:{
 badge:string;size?:'tiny'|'small'|'medium'|'large';
 state?:'earned'|'preview'|'locked';title?:string
}){
 const entry=BADGE_CATALOG[badge];
 const uid=useId().replaceAll(':','');
 const palette=MATERIALS[entry?.family||'origin'];
 const px={tiny:22,small:38,medium:76,large:118}[size];
 const alt=title||entry?.name||'Achievement badge';
 const fg=palette.light;
 if(import.meta.env.VITE_PARITY_V136_FULL==='true'&&entry)
  return <LivingBadgeSigil badge={badge} displayName={alt} family={entry.family} size={px} state={state}/>;
 return <span className={'av66-badge-insignia av66-badge-insignia--'+size+' av66-badge-insignia--'+state}
  title={alt} role="img" aria-label={alt} style={{width:px,height:px}}>
  <svg viewBox="0 0 100 100" width={px} height={px} aria-hidden="true" focusable="false">
   <defs>
    <linearGradient id={uid+'-metal'} x1="0" y1="0" x2="1" y2="1">
     <stop stopColor="#fff2d6"/><stop offset=".16" stopColor={palette.edge}/>
     <stop offset=".31" stopColor="#483d53"/><stop offset=".52" stopColor="#f7dfc1"/>
     <stop offset=".76" stopColor={COSMIC_METAL.shadow}/><stop offset=".92" stopColor={COSMIC_METAL.bronze}/>
     <stop offset="1" stopColor="#fff9e2"/>
    </linearGradient>
    <radialGradient id={uid+'-face'} cx=".32" cy=".2" r=".85">
     <stop stopColor={palette.enamel}/><stop offset=".55" stopColor={palette.deep}/><stop offset="1" stopColor="#101625"/>
    </radialGradient>
    <linearGradient id={uid+'-glass'} x1="0" y1="0" x2=".85" y2="1">
     <stop stopColor="#ffffff" stopOpacity=".54"/><stop offset=".3" stopColor="#f3d4ea" stopOpacity=".09"/>
     <stop offset=".9" stopColor="#000000" stopOpacity=".32"/>
    </linearGradient>
   </defs>
   <g fill={'url(#'+uid+'-metal)'} stroke="#f9e6c7" strokeWidth="1.2"><Shell family={entry?.family||'origin'}/></g>
   <circle cx="50" cy="50" r="37" fill={'url(#'+uid+'-face)'} stroke="#f2d5bb" strokeWidth="2.1"/>
   <circle cx="50" cy="50" r="32" fill="none" stroke={palette.edge} strokeOpacity=".62" strokeWidth="1.8"/>
   {Array.from({length:24},(_,i)=><path key={i} d={i%3===0?'M50 16v5':'M50 16v2'} transform={'rotate('+i*15+' 50 50)'}
    stroke={palette.edge} strokeWidth={i%3===0?1.35:.9} strokeOpacity=".79"/>)}
   <g color={fg} stroke={fg} strokeLinecap="round" strokeLinejoin="round" transform="translate(12 12) scale(.76)">
    <Device id={badge}/>
   </g>
   <path d="M23 34C34 17 58 13 76 23" stroke={'url(#'+uid+'-glass)'} strokeWidth="7" strokeLinecap="round" opacity=".7" fill="none"/>
   <circle cx="50" cy="50" r="37" stroke="#fff4de" strokeOpacity=".14" fill="none" strokeWidth="1"/>
  </svg>
 </span>;
}
