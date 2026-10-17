import {useEffect,useRef,useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {BadgeInsignia} from './BadgeInsignia';
import {BADGE_CATALOG} from '../lib/player-recognition';
import {registerAnimatedSpecimen} from '../lib/evolution-mini-renderer';

// The member server owns earned level/XP; this shared presentation consumes
// the actual V059 mesh, materials and specimen-specific GLSL motion.
// A high-resolution transparent image remains behind every native render
// when WebGL is unavailable, suspended or outside the animation budget.
export const LEVEL_ARTIFACTS=artifacts;
export function LevelEmblem({level,size=64}:{level:number;size?:number}){
 const [failed,setFailed]=useState(false);
 const target=useRef<HTMLSpanElement|null>(null);
 const safe=Number.isSafeInteger(level)&&level>0?Math.min(30,level):1;
 const item=artifacts[safe-1];
 useEffect(()=>setFailed(false),[safe,size]);
 useEffect(()=>{
  if(failed||!item||!target.current)return;
  return registerAnimatedSpecimen(target.current,safe);
 },[safe,size,item,failed]);
 if(!item||failed)return <span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Evolution level '+safe}><OrbitalMark/><small>{safe}</small></span>;
 const src=import.meta.env.BASE_URL+(size>104?item.preview:item.icon).slice(1);
 return <span ref={target} className="level-emblem is-illustrated av62-native-host"
  style={{width:size,height:size}} role="img" aria-label={'Level '+safe+' · '+item.name}
  data-artwork="v062-native-mesh" data-level={safe}>
  <img className="av62-native-poster" src={src} width={size} height={size}
   alt="" loading={size>=104?'lazy':'eager'} decoding="async" draggable={false}
   onError={()=>setFailed(true)}/>
 </span>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){
 return <BadgeInsignia badge={award||'first_signal'} size="small" state={earned?'earned':'locked'} title={award&&BADGE_CATALOG[award]?.name||'Recognition badge'}/>;
}
