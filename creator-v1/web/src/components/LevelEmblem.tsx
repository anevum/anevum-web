import {useEffect,useState} from 'react';
import {BadgeInsignia} from './BadgeInsignia';
import {BADGE_CATALOG} from '../lib/player-recognition';


// The member server owns earned XP and badge state. Keep the existing
// high-resolution V059/V064 level artwork at every inline size. The former
// shared WebGL miniature renderer is intentionally retired from member cards,
// forums, and level grids; its independent full-screen /evolution/ archive
// remains untouched. Inline icons never create a canvas or hide their poster.
export function LevelEmblem({level,size=64,handle=null,artwork='original'}:{level:number;size?:number;handle?:string|null;artwork?:'original'|'card'}){
 const [assetIndex,setAssetIndex]=useState(0);
 const safe=Number.isSafeInteger(level)&&level>0?Math.min(30,level):1;

 useEffect(()=>setAssetIndex(0),[safe,size,handle,artwork]);

 // Originals stay unchanged. The owner/public route checks XP and public
 // consent on every request before exposing even a compact specimen image.
 const kinds=artwork==='card'?['card']:size>=68?['preview','poster','icon']:['icon','preview','poster'];
 if(assetIndex>=kinds.length)return <span className="level-emblem level-emblem-beyond av73-static-level-fallback av76-asset-error" style={{width:size,height:size}} role="img" aria-label={'Evolution of Everything artwork temporarily unavailable for earned level '+safe}><small>LVL {String(safe).padStart(2,'0')}<span className="av76-artwork-unavailable">ARTWORK UNAVAILABLE</span></small></span>;
 const validHandle=handle&&/^[a-z][a-z0-9_]{2,29}$/.test(handle)?handle:null;
 const base=validHandle?'/api/v1/members/'+validHandle+'/rewards/levels/'+safe:
   '/api/v1/member/rewards/levels/'+safe;
 const src=base+'/'+kinds[assetIndex];
 return <span className="level-emblem is-illustrated av62-native-host av73-static-level-icon"
  style={{width:size,height:size}} role="img" aria-label={'Earned Evolution level '+safe}
  data-artwork="v073-preserved-optical-icon" data-presentation={artwork==='card'?'v077-front-facing-illustration':'original-optical'} data-level={safe}>
  <img className="av62-native-poster" src={src} width={size} height={size}
   alt="" loading={size>=104?'lazy':'eager'} decoding="async" draggable={false}
   onError={()=>setAssetIndex(i=>i+1)}/>
 </span>;
}
export function AwardEmblem({award,earned=true}:{award?:string;earned?:boolean}){
 return <BadgeInsignia badge={award||'first_signal'} size="small" state={earned?'earned':'locked'} title={award&&BADGE_CATALOG[award]?.name||'Recognition badge'}/>;
}
