import {useEffect,useMemo,useState} from 'react';
import {LEVEL_ARTIFACTS,LevelEmblem} from './LevelEmblem';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import {BADGE_CATALOG,DISTINCTION_CATALOG,type PublicDistinctions} from '../lib/player-recognition';
import {readRecognition,type RecognitionSettings} from '../lib/player-recognition-api';
import {RewardInspector,type InspectedReward} from './RewardInspector';

/**
 * The vault is not a public catalog: ONLY previously earned levels and
 * server-attested grants exist in its DOM. Unknown/locked names, criteria,
 * images, thumbnails and model links are not rendered.
 *
 * owner inventory = member progression + private recognition ledger
 * public inventory = opted-in stats + explicitly published featured honors
 */
export function EarnedRewardVault({
 level,handle=null,badges=[],distinctions,fallbackBadges=[],title='Earned discoveries'
}:{
 level:number|null|undefined;
 handle?:string|null;
 badges?:readonly string[];
 distinctions?:PublicDistinctions;
 fallbackBadges?:readonly string[];
 title?:string;
}){
 const publicProfile=typeof handle==='string';
 const [ledger,setLedger]=useState<RecognitionSettings|null>(null);
 const [ledgerState,setLedgerState]=useState<'checking'|'ready'|'unavailable'>('checking');
 const [selected,setSelected]=useState<InspectedReward|null>(null);
 useEffect(()=>{
  if(publicProfile){setLedger(null);setLedgerState('ready');return;}
  const abort=new AbortController(),signal=abort.signal;
  setLedgerState('checking');
  readRecognition(signal).then(data=>{
   if(signal.aborted)return;setLedger(data);setLedgerState('ready');
  }).catch(()=>{
   if(signal.aborted)return;setLedger(null);setLedgerState('unavailable');
  });
  return()=>abort.abort();
 },[publicProfile]);
 const earnedLevel=Number.isSafeInteger(level)&&level!==null&&level!==undefined&&level>=1?
  Math.min(level,30):0;
 const numbers=useMemo(()=>Array.from({length:earnedLevel},(_,i)=>i+1),[earnedLevel]);
 const earnedIds=publicProfile?badges:(ledger?.earnedBadges.map(b=>b.id)??fallbackBadges);
 const validBadges=[...new Set(earnedIds)].filter(id=>Object.hasOwn(BADGE_CATALOG,id));
 const honors=publicProfile?[
  ...(distinctions?.medals??[]),...(distinctions?.ribbons??[])
 ]:[...(ledger?.earnedMedals.map(d=>d.id)??[]),...(ledger?.earnedRibbons.map(d=>d.id)??[])];
 const validHonors=[...new Set(honors)].filter(id=>Object.hasOwn(DISTINCTION_CATALOG,id));
 const hasReward=earnedLevel>0||validBadges.length>0||validHonors.length>0;
 return <section className="av75-earned-vault" aria-labelledby={publicProfile?'av75-public-vault-title':'av75-private-vault-title'}>
  <header className="av75-vault-intro">
   <div><span className="av75-vault-eyebrow">CONTINUANCE INSTITUTE / VERIFIED RECOGNITION</span>
    <h2 id={publicProfile?'av75-public-vault-title':'av75-private-vault-title'}>{title}</h2>
    <p>{publicProfile?
     'Only this member’s earned and publicly displayed rewards appear. Private or unreached discoveries remain hidden.':
     'Your record of earned discoveries. Future specimens stay unknown until you reach them.'}</p></div>
   {earnedLevel>0&&<span className="av75-vault-current">EVOLUTION / LEVEL {earnedLevel}</span>}
  </header>
  {!hasReward&&<div className="av75-vault-empty">
   <strong>{publicProfile?'No public rewards displayed.':'Your discovery begins with your verified account.'}</strong>
   <p>{publicProfile?'This member may have private rewards, or may not have opted in to public progression. Nothing is inferred.':
    'Only earned items will appear here. Progression and grants must be confirmed by ANEVUM.'}</p>
  </div>}
  {numbers.length>0&&<div className="av75-vault-section">
   <h3>Earned evolution</h3>
   <div className="av75-levels-earned">
    {numbers.map(n=>{
     const item=LEVEL_ARTIFACTS[n-1];
     return <button type="button" className={'av75-earned-level'+(n===earnedLevel?' is-current':'')}
      key={n} onClick={()=>setSelected({kind:'level',level:n,name:item.name,detail:item.subtitle+' · '+item.motion})}
      aria-label={'Inspect earned level '+n+' · '+item.name}>
      <LevelEmblem level={n} size={74} handle={handle}/>
      <span><small>LEVEL {String(n).padStart(2,'0')}{n===earnedLevel?' / CURRENT':''}</small>
       <strong>{item.name}</strong></span>
      <span className="av75-earned-cta">Inspect ↗</span>
     </button>;
    })}
   </div>
  </div>}
  {(validBadges.length>0||validHonors.length>0)&&<div className="av75-vault-section">
   <h3>Earned distinctions</h3>
   <div className="av75-honors-earned">
    {validBadges.map(id=>{
     const def=BADGE_CATALOG[id];return <button type="button" key={id} className="av75-earned-honor"
      onClick={()=>setSelected({kind:'badge',id,name:def.name,detail:def.description})}>
      <BadgeInsignia badge={id} size="small" state="earned"/>
      <span><small>EARNED BADGE</small><strong>{def.name}</strong></span><span className="av75-earned-cta">Inspect ↗</span>
     </button>;
    })}
    {validHonors.map(id=>{
     const def=DISTINCTION_CATALOG[id];return <button type="button" key={id} className="av75-earned-honor"
      onClick={()=>setSelected({kind:def.kind,id,name:def.name,detail:def.description})}>
      <HonorInsignia distinction={def} compact/>
      <span><small>EARNED {def.kind.toUpperCase()}</small><strong>{def.name}</strong></span><span className="av75-earned-cta">Inspect ↗</span>
     </button>;
    })}
   </div>
  </div>}
  {!publicProfile&&ledgerState==='unavailable'&&
   <p className="av75-vault-ledger-note" role="status">The full recognition ledger is unavailable. Founding milestones are shown only when recorded as earned; no future badges are previewed.</p>}
  <RewardInspector reward={selected} onClose={()=>setSelected(null)} handle={handle}/>
 </section>;
}
