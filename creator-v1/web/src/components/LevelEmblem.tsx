import {useEffect,useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {CelestialEmblem} from './CelestialEmblem';

// Rendering flag only. Never a grant of XP, awards, permissions or level access.
// Do not enable in a deployed build until all illustrated assets are present.
export const SERIES_ONE_ILLUSTRATIONS_ENABLED = import.meta.env.VITE_SERIES_ONE_ILLUSTRATED_ART === 'true';
export const LEVEL_ARTIFACTS=artifacts;
const illustratedRoot=import.meta.env.BASE_URL+'assets/levels/illustrated/';

export function LevelEmblem({level,size=64,priority=false}:{level:number;size?:number;priority?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[level]);
 const item=Number.isSafeInteger(level)&&level>0?artifacts[level-1]:null;
 if(!item)return <span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Level '+level}><OrbitalMark/><small>{level}</small></span>;
 const illustration=SERIES_ONE_ILLUSTRATIONS_ENABLED&&!failed;
 const filename='level-'+String(level).padStart(2,'0')+'.webp';
 const fallback=import.meta.env.BASE_URL+item.icon.slice(1);
 return <img
  className={'level-emblem'+(illustration?' is-illustrated':'')}
  src={illustration?illustratedRoot+'512/'+filename:fallback}
  srcSet={illustration?[128,512,1254].map(w=>illustratedRoot+w+'/'+filename+' '+w+'w').join(', '):undefined}
  sizes={illustration?Math.max(1,Math.round(size))+'px':undefined}
  width={size} height={size}
  alt={'Level '+level+' · '+item.name}
  loading={priority?'eager':'lazy'} decoding="async" draggable={false}
  data-artwork={illustration?'illustrated':'vector-fallback'}
  onError={illustration?()=>setFailed(true):undefined}
 />;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){return <CelestialEmblem motif={award==='world_shaper'?'trinity':'beacon'} size="small" state={earned?"earned":"locked"}/>}
