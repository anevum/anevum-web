import {OrbitalMark} from './OrbitalMark';
import type {SupporterAppearance} from '../lib/canonical-beta';

export function MemberPortrait({src,name,supporterFrame}:{
  src?:string;name:string;supporterFrame?:SupporterAppearance['frame']
}){
 return <div className={'ms-portrait'+(supporterFrame?' av34-frame av34-frame-'+supporterFrame:'')}>
  {src?<img src={src} alt={name+"’s profile picture"}/>:<OrbitalMark/>}
 </div>;
}
