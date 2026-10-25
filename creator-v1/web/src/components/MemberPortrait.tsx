import {useState} from 'react';
import {OrbitalMark} from './OrbitalMark';
import type {SupporterAppearance} from '../lib/canonical-beta';

/** User-provided portrait first. Missing or unreadable media never leave a
 * broken image icon in the member's identity. New version URLs retry normally.
 */
export function MemberPortrait({src,name,supporterFrame}:{
  src?:string;name:string;supporterFrame?:SupporterAppearance['frame']
}){
 const [failedSrc,setFailedSrc]=useState<string|null>(null);
 const visible=Boolean(src&&src!==failedSrc);
 return <div className={'ms-portrait'+(supporterFrame?' av34-frame av34-frame-'+supporterFrame:'')}>
  {visible?<img src={src} alt={name+"’s profile picture"} decoding="async"
   referrerPolicy="same-origin" onError={()=>setFailedSrc(src??null)}/>:<OrbitalMark/>}
 </div>;
}

/** The member-uploaded banner is never replaced with promotional imagery.
 * If the canonical media endpoint fails, the underlying native cover remains.
 */
export function MemberCoverMedia({src,alt}:{src?:string;alt:string}){
 const [failedSrc,setFailedSrc]=useState<string|null>(null);
 if(!src||src===failedSrc)return null;
 return <img className="ms-cover-art" src={src} alt={alt} decoding="async"
   referrerPolicy="same-origin" onError={()=>setFailedSrc(src)}/>;
}
