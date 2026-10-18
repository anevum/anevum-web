import {useEffect,useState} from 'react';
import {LevelEmblem} from './LevelEmblem';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import {BADGE_CATALOG,DISTINCTION_CATALOG,type PublicDistinctions} from '../lib/player-recognition';
import {readRecognition,type RecognitionSettings} from '../lib/player-recognition-api';
import {RewardInspector,type InspectedReward} from './RewardInspector';

export type EarnedLevelRecord={level:number;name:string;subtitle:string;motion:string};
type Inventory={currentLevel:number;levels:EarnedLevelRecord[]};
function validInventory(value:unknown):value is Inventory{
 if(!value||typeof value!=='object')return false;
 const data=value as Partial<Inventory>;
 return Number.isSafeInteger(data.currentLevel)&&data.currentLevel!>=1&&
  data.currentLevel!<=30&&Array.isArray(data.levels)&&
  data.levels.length===data.currentLevel&&data.levels.every((item,index)=>
   item&&item.level===index+1&&
   typeof item.name==='string'&&item.name.length>0&&item.name.length<100&&
   typeof item.subtitle==='string'&&item.subtitle.length<=250&&
   typeof item.motion==='string'&&item.motion.length<=450);
}

/** UI-only list of server-verified inventory; no unreached level names,
 * thumbnails, scene URLs or badge definitions are enumerated in the DOM.
 * Full model/thumbnail requests are independently reauthorized server-side.
 */
export function EarnedRewardVault({
 level,handle=null,badges=[],distinctions,fallbackBadges=[],
 title='Earned discoveries',showLevels=true
}:{
 level:number|null|undefined;
 handle?:string|null;
 badges?:readonly string[];
 distinctions?:PublicDistinctions;
 fallbackBadges?:readonly string[];
 title?:string;showLevels?:boolean;
}){
 const publicProfile=typeof handle==='string';
 const [ledger,setLedger]=useState<RecognitionSettings|null>(null);
 const [ledgerState,setLedgerState]=useState<'checking'|'ready'|'unavailable'>('checking');
 const [inventory,setInventory]=useState<Inventory|null>(null);
 const [inventoryState,setInventoryState]=useState<'checking'|'ready'|'unavailable'>('checking');
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
 useEffect(()=>{
  const abort=new AbortController(),signal=abort.signal;
  setInventory(null);
  if(!showLevels){setInventoryState('ready');return()=>abort.abort()}
  setInventoryState('checking');
  const url=publicProfile?
   '/api/v1/members/'+encodeURIComponent(handle!)+'/rewards/inventory':
   '/api/v1/member/rewards/inventory';
  void fetch(url,{method:'GET',credentials:publicProfile?'omit':'same-origin',
   mode:'same-origin',cache:'no-store',redirect:'error',
   referrerPolicy:'same-origin',headers:{Accept:'application/json'},signal})
   .then(async res=>{
    if(!res.ok||!res.headers.get('content-type')?.includes('application/json'))
     throw Error('Earned inventory unavailable');
    const result:unknown=await res.json();
    if(!validInventory(result))throw Error('Invalid reward inventory');
    return result;
   }).then(result=>{
    if(signal.aborted)return;
    setInventory(result);setInventoryState('ready');
   }).catch(()=>{
    if(signal.aborted)return;
    setInventory(null);setInventoryState('unavailable');
   });
  return()=>abort.abort();
 },[handle,publicProfile,showLevels]);
 // Level is from canonical member/public profile state. The complete list
 // comes from an independent canonical inventory read, not this prop.
 const verifiedLevel=inventory?.currentLevel??0;
 const records=inventory?.levels??[];
 const earnedIds=publicProfile?badges:(ledger?.earnedBadges.map(b=>b.id)??fallbackBadges);
 const validBadges=[...new Set(earnedIds)].filter(id=>Object.hasOwn(BADGE_CATALOG,id));
 const honors=publicProfile?[
  ...(distinctions?.medals??[]),...(distinctions?.ribbons??[])
 ]:[...(ledger?.earnedMedals.map(d=>d.id)??[]),...(ledger?.earnedRibbons.map(d=>d.id)??[])];
 const validHonors=[...new Set(honors)].filter(id=>Object.hasOwn(DISTINCTION_CATALOG,id));
 const hasReward=records.length>0||validBadges.length>0||validHonors.length>0;
 const ownerCurrent=typeof level==='number'&&Number.isSafeInteger(level)?level:null;
 return <section className="av75-earned-vault" aria-labelledby={publicProfile?'av75-public-vault-title':'av75-private-vault-title'}>
  <header className="av75-vault-intro">
   <div><span className="av75-vault-eyebrow">CONTINUANCE INSTITUTE / VERIFIED RECOGNITION</span>
    <h2 id={publicProfile?'av75-public-vault-title':'av75-private-vault-title'}>{title}</h2>
    <p>{publicProfile?
     'Only this member’s earned and publicly displayed rewards appear. Private or unreached discoveries remain hidden.':
     'Your record of earned discoveries. Future specimens stay unknown until you reach them.'}</p></div>
   {showLevels&&verifiedLevel>0&&<span className="av75-vault-current">EVOLUTION / LEVEL {verifiedLevel}</span>}
  </header>
  {showLevels&&inventoryState==='checking'&&
   <p className="av75-vault-ledger-note" role="status">Verifying earned specimens…</p>}
  {!hasReward&&inventoryState!=='checking'&&<div className="av75-vault-empty">
   <strong>{publicProfile?'No public rewards displayed.':'Your verified rewards are not yet available.'}</strong>
   <p>{publicProfile?'This member may have private rewards, or may not have opted in to public progression. Nothing is inferred.':
    'Only earned items appear here. Progression and grants must be confirmed by ANEVUM.'}</p>
  </div>}
  {showLevels&&records.length>0&&<div className="av75-vault-section">
   <h3>Earned evolution</h3>
   <div className="av75-levels-earned">
    {records.map(item=><button type="button" className={'av75-earned-level'+
     (item.level===verifiedLevel?' is-current':'')}
      key={item.level}
      onClick={()=>setSelected({kind:'level',level:item.level,name:item.name,detail:item.subtitle+' · '+item.motion})}
      aria-label={'Inspect earned level '+item.level+' · '+item.name}>
      <LevelEmblem level={item.level} size={74} handle={handle}/>
      <span><small>LEVEL {String(item.level).padStart(2,'0')}{item.level===verifiedLevel?' / CURRENT':''}</small>
       <strong>{item.name}</strong></span>
      <span className="av75-earned-cta">Inspect ↗</span>
     </button>)}
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
   <p className="av75-vault-ledger-note" role="status">The full recognition ledger is unavailable. Founding milestones appear only when recorded as earned; no future badges are previewed.</p>}
  {showLevels&&inventoryState==='unavailable'&&
   <p className="av75-vault-ledger-note" role="status">The earned model inventory could not be verified. No specimen identities or files have been disclosed.</p>}
  {ownerCurrent!==null&&verifiedLevel>ownerCurrent&&<p className="av75-vault-ledger-note" role="status">
   Displaying the latest verified progression from the member service.</p>}
  <RewardInspector reward={selected} onClose={()=>setSelected(null)} handle={handle}/>
 </section>;
}
