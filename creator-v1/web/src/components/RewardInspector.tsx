import {useEffect,useRef,useState} from 'react';
import {LevelEmblem} from './LevelEmblem';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import {DISTINCTION_CATALOG} from '../lib/player-recognition';

/** The earned-only V081 insignia inspector uses a scalable 2D vector,
 * not WebGL. The remote reward service revalidates every level request.
 */
export type InspectedReward=
 |{kind:'level';level:number;name:string;detail:string}
 |{kind:'badge'|'medal'|'ribbon';id:string;name:string;detail:string};
export function RewardInspector({reward,onClose,handle}:{
 reward:InspectedReward|null;onClose:()=>void;handle?:string|null;
}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [zoom,setZoom]=useState(1);
 const [angle,setAngle]=useState(0);
 const [animate,setAnimate]=useState(true);
 useEffect(()=>{
  const target=dialog.current;if(!target)return;
  if(reward&&!target.open)target.showModal();
  if(!reward&&target.open)target.close();
 },[reward]);
 useEffect(()=>{setZoom(1);setAngle(0);setAnimate(true)},[reward]);
 if(!reward)return <dialog ref={dialog} className="av75-reward-dialog" aria-label="Reward inspection"
  onClose={onClose}/>;
 const emblem=reward.kind==='level';
 const level=emblem?reward.level:null;
 return <dialog ref={dialog} className="av75-reward-dialog"
  aria-label={reward.name+' · earned emblem inspection'}
  onCancel={onClose} onClose={onClose}
  onClick={event=>{if(event.target===dialog.current)onClose()}}>
  <div className={'av75-reward-inspector'+(emblem?' av81-reward-inspector--sigil':'')}>
   <header className="av75-reward-header">
    <div><span className="av75-reward-eyebrow">CONTINUANCE INSTITUTE / EARNED INSIGNIA</span>
     <h2>{reward.name}</h2>
     <p>{emblem?'EVOLUTION · LEVEL '+String(level).padStart(2,'0'):reward.kind.toUpperCase()+' · VERIFIED RECOGNITION'}</p></div>
    <button type="button" className="av75-reward-dismiss" onClick={onClose} aria-label="Close reward inspector">Close ×</button>
   </header>
   <div className="av75-reward-stage" aria-label={emblem?'High-definition earned evolution emblem':'Earned insignia'}>
    {emblem?<div className={'av81-sigil-stage'+(animate?' is-animated':' is-still')}>
     <div className="av81-sigil-rim" aria-hidden="true"/>
     <div className="av81-sigil-inspected" style={{transform:'scale('+zoom+') rotate('+angle+'deg)'}}>
      <LevelEmblem level={level!} artwork="card" size={320} handle={handle}/>
     </div>
     <span className="av81-sigil-caption">VECTOR MASTER · RESOLUTION INDEPENDENT</span>
    </div>:<div className="av75-insignia-stage">
      {reward.kind==='badge'?<BadgeInsignia badge={reward.id} size="large" state="earned"/>:
       DISTINCTION_CATALOG[reward.id]&&<HonorInsignia distinction={DISTINCTION_CATALOG[reward.id]}/>}
    </div>}
   </div>
   <p className="av75-reward-description">{reward.detail}</p>
   {emblem&&<div className="av81-reward-controls" aria-label="Emblem inspection controls">
    <button type="button" onClick={()=>setAngle(a=>a-15)} aria-label="Turn emblem left">↶ TURN</button>
    <label htmlFor="av81-sigil-zoom">ZOOM
     <input id="av81-sigil-zoom" type="range" min=".75" max="1.55" step=".05" value={zoom}
      onChange={e=>setZoom(Number(e.target.value))}/></label>
    <button type="button" onClick={()=>setAngle(a=>a+15)} aria-label="Turn emblem right">TURN ↷</button>
    <button type="button" onClick={()=>{setZoom(1);setAngle(0)}}>RESET</button>
    <button type="button" aria-pressed={animate} onClick={()=>setAnimate(v=>!v)}>{animate?'PAUSE AURA':'RESUME AURA'}</button>
   </div>}
   <footer className="av75-reward-footer">Emblems are earned through verified progression. Inspection never grants XP, badges, or staff permissions.</footer>
  </div>
 </dialog>;
}
