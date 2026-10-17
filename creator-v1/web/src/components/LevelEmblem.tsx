import {useEffect,useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {CelestialEmblem} from './CelestialEmblem';

// Presentation-only switch. Never changes XP, achievements, level eligibility or permissions.
// V037 contains all sixty approved transparent preview files; set the flag to false to rollback to vector emblems.
const V037_TRANSPARENT_ENABLED = import.meta.env.VITE_SERIES_ONE_V037_TRANSPARENT !== 'false';
export const LEVEL_ARTIFACTS=artifacts;
export function LevelEmblem({level,size=64}:{level:number;size?:number}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[level]);
 const item=Number.isSafeInteger(level)&&level>0?artifacts[level-1]:null;
 if(!item)return <span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Level '+level}><OrbitalMark/><small>{level}</small></span>;
 const fallback=import.meta.env.BASE_URL+item.icon.slice(1);
 const illustrated=V037_TRANSPARENT_ENABLED&&!failed;
 const src=illustrated?import.meta.env.BASE_URL+'assets/levels/series-one-v037/level-'+String(level).padStart(2,'0')+'.webp':fallback;
 return <img className={'level-emblem'+(illustrated?' is-illustrated':'')} src={src} width={size} height={size} alt={'Level '+level+' · '+item.name} loading={size>88?'lazy':'eager'} decoding="async" draggable={false} data-artwork={illustrated?'v037-transparent-preview':'vector-fallback'} onError={illustrated?()=>setFailed(true):undefined}/>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){return <CelestialEmblem motif={award==='world_shaper'?'trinity':'beacon'} size="small" state={earned?"earned":"locked"}/>}
