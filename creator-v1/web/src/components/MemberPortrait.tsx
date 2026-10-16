import {OrbitalMark} from './OrbitalMark';
export function MemberPortrait({src,name}:{src?:string;name:string}){
 return <div className="ms-portrait">{src?<img src={src} alt={name+"’s profile picture"}/>:<OrbitalMark/>}</div>;
}
