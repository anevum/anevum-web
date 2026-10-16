import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {CelestialEmblem} from './CelestialEmblem';
export const LEVEL_ARTIFACTS=artifacts;
export function LevelEmblem({level,size=64}:{level:number;size?:number}){
 const item=Number.isSafeInteger(level)&&level>0?artifacts[level-1]:null;
 return item?<img className="level-emblem" src={import.meta.env.BASE_URL+item.icon.slice(1)} width={size} height={size} alt={'Level '+level+' · '+item.name} loading="lazy"/>:<span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Level '+level}><OrbitalMark/><small>{level}</small></span>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){return <CelestialEmblem motif={award==='world_shaper'?'trinity':'beacon'} size="small" state={earned?"earned":"locked"}/>}
