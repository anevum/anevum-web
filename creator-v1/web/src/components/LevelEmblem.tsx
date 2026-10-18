import {useEffect,useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {BadgeInsignia} from './BadgeInsignia';
import {BADGE_CATALOG} from '../lib/player-recognition';


// The member server owns earned XP and badge state. Keep the existing
// high-resolution V059/V064 level artwork at every inline size. The former
// shared WebGL miniature renderer is intentionally retired from member cards,
// forums, and level grids; its independent full-screen /evolution/ archive
// remains untouched. Inline icons never create a canvas or hide their poster.
export const LEVEL_ARTIFACTS=artifacts;
export function LevelEmblem({level,size=64}:{level:number;size?:number}){
 const [failed,setFailed]=useState(false);
 const safe=Number.isSafeInteger(level)&&level>0?Math.min(30,level):1;
 const item=artifacts[safe-1];
 useEffect(()=>setFailed(false),[safe,size]);

 if(!item||failed)return <span className="level-emblem level-emblem-beyond" style={{width:size,height:size}} aria-label={'Evolution level '+safe}><OrbitalMark/><small>{safe}</small></span>;
 const src=import.meta.env.BASE_URL+(size>104?item.preview:item.icon).slice(1);
 return <span className="level-emblem is-illustrated av62-native-host av73-static-level-icon"
  style={{width:size,height:size}} role="img" aria-label={'Level '+safe+' · '+item.name}
  data-artwork="v073-preserved-optical-icon" data-level={safe}>
  <img className="av62-native-poster" src={src} width={size} height={size}
   alt="" loading={size>=104?'lazy':'eager'} decoding="async" draggable={false}
   onError={()=>setFailed(true)}/>
 </span>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){
 return <BadgeInsignia badge={award||'first_signal'} size="small" state={earned?'earned':'locked'} title={award&&BADGE_CATALOG[award]?.name||'Recognition badge'}/>;
}
