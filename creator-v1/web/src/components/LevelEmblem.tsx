import {useState} from 'react';
import artifacts from '../../../shared/level-artifacts.json';
import {OrbitalMark} from './OrbitalMark';
import {CelestialEmblem} from './CelestialEmblem';

export const LEVEL_ARTIFACTS=artifacts;

// Deliberately default-off. Illustrated source art has not yet received
// final visual and rights approval and must not grant any earned state.
const useIllustrations=import.meta.env.VITE_ANEVUM_ILLUSTRATED_LEVELS==='true';
type Artifact=(typeof artifacts)[number];
type EmblemProps={level:number;size?:number;priority?:boolean};

function SvgArtwork({item,size,priority}:{item:Artifact;size:number;priority:boolean}){
 return <img className="level-emblem" data-art-source="svg-fallback"
   src={import.meta.env.BASE_URL+item.icon.slice(1)}
   width={size} height={size} alt={'Level '+item.level+' · '+item.name}
   loading={priority?'eager':'lazy'} decoding="async"/>;
}

function HdArtwork({item,size,priority}:{item:Artifact;size:number;priority:boolean}){
 const [failed,setFailed]=useState(false);
 if(failed)return <SvgArtwork item={item} size={size} priority={priority}/>;
 const id=String(item.level).padStart(2,'0');
 const src=(px:number)=>import.meta.env.BASE_URL+'assets/levels/illustrated/'+px+'/level-'+id+'.webp';
 return <img className="level-emblem level-emblem-illustrated" data-art-source="illustrated"
   src={src(512)}
   srcSet={src(128)+' 128w, '+src(512)+' 512w, '+src(1254)+' 1254w'}
   sizes={size+'px'} width={size} height={size}
   alt={'Level '+item.level+' · '+item.name}
   loading={priority?'eager':'lazy'} decoding="async"
   onError={()=>setFailed(true)}/>;
}

export function LevelEmblem({level,size=64,priority=false}:EmblemProps){
 const item=Number.isSafeInteger(level)&&level>0?artifacts[level-1]:null;
 const measuredSize=Number.isFinite(size)&&size>0?size:64;
 if(!item)return <span className="level-emblem level-emblem-beyond"
   style={{width:measuredSize,height:measuredSize}} aria-label={'Level '+level}>
    <OrbitalMark/><small>{level}</small></span>;
 return useIllustrations
   ?<HdArtwork key={level} item={item} size={measuredSize} priority={priority}/>
   :<SvgArtwork item={item} size={measuredSize} priority={priority}/>;
}

export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){
 return <CelestialEmblem motif={award==='world_shaper'?'trinity':'beacon'} size="small" state={earned?"earned":"locked"}/>;
}
