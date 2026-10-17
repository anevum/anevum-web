import {useEffect,useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {CelestialEmblem} from './CelestialEmblem';
// Visual only; the server owns XP, level thresholds, and earned awards.
export const LEVEL_ARTIFACTS=artifacts;
export function LevelEmblem({level,size=64}:{level:number;size?:number}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[level,size]);
 const safe=Number.isSafeInteger(level)&&level>0?Math.min(30,level):1;
 const item=artifacts[safe-1];
 if(!item||failed)return <span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Evolution level '+safe}><OrbitalMark/><small>{safe}</small></span>;
 const src=import.meta.env.BASE_URL+(size>104?item.preview:item.icon).slice(1);
 return <img className="level-emblem is-illustrated" src={src} width={size} height={size} alt={'Level '+safe+' · '+item.name} loading={size>=104?'lazy':'eager'} decoding="async" draggable={false} data-artwork="v060-evolution" onError={()=>setFailed(true)}/>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){return <CelestialEmblem motif={award==='world_shaper'?'trinity':'beacon'} size="small" state={earned?"earned":"locked"}/>}
