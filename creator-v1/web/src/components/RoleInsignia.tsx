import {useId} from 'react';
import type {VerifiedRole} from '../lib/player-recognition';

/** Audited institutional role insignias. These are presentation glyphs,
 * not authorization checks, and require a verified server-supplied role.
 * Vector engraving remains sharp on inline cards and retina displays.
 */
export function RoleInsignia({role,size=17}:{role:VerifiedRole;size?:number}){
 const id=useId().replaceAll(':','');
 return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={id+'-metal'} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#fff9e8"/><stop offset=".33" stopColor="currentColor"/>
    <stop offset=".65" stopColor="#53617d"/><stop offset="1" stopColor="currentColor"/>
   </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="21.5" fill="#121d30" stroke={'url(#'+id+'-metal)'} strokeWidth="2"/>
  <circle cx="24" cy="24" r="18.5" fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth=".7"/>
  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
   {role==='founder'?<>
    <path d="m24 6 5 12 13 6-13 6-5 12-5-12-13-6 13-6Z" fill="currentColor" fillOpacity=".27" strokeWidth="1.9"/>
    <circle cx="24" cy="24" r="5.7" fill="#fff2cc" strokeWidth="1.6"/>
    <path d="M14 14 11 11m23 23 3 3M34 14l3-3M14 34l-3 3" strokeWidth="1.6"/>
   </>:role==='administrator'?<>
    <path d="m24 8 4.5 10.8L40 24l-11.5 5.2L24 40l-4.5-10.8L8 24l11.5-5.2Z" strokeWidth="2" fill="currentColor" fillOpacity=".19"/>
    <path d="M24 14v20M14 24h20M17 17l14 14m0-14L17 31" strokeWidth="1.4"/>
    <circle cx="24" cy="24" r="3.6" fill="#f6e9ff"/>
   </>:role==='moderator'?<>
    <path d="M24 7 38 13v12c0 8-5.7 13.3-14 17-8.3-3.7-14-9-14-17V13Z"
     fill="currentColor" fillOpacity=".22" strokeWidth="2"/>
    <path d="m17 25 5 5 10-12" strokeWidth="3.5"/>
    <path d="M24 11v5M13 21v4M35 21v4" strokeWidth="1.1" opacity=".8"/>
   </>:<>
    <path d="M24 14C18 11 13 11 9 13v23c5-2 11-1 15 2 4-3 10-4 15-2V13c-4-2-9-2-15 1Z"
     fill="currentColor" fillOpacity=".18" strokeWidth="2"/>
    <path d="M24 14v24M14 21h6m-6 5h6m8-5h6m-6 5h6" strokeWidth="1.4"/>
    <path d="m24 6 1.6 4.3L30 12l-4.4 1.7L24 18l-1.6-4.3L18 12l4.4-1.7Z" fill="#f3ffde" strokeWidth=".7"/>
   </>}
  </g>
 </svg>;
}
