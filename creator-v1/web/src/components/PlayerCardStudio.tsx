import {useEffect,useState} from 'react';
import type {CanonicalProfile,MemberSpace} from '../lib/canonical-beta';
import {BADGE_CATALOG,DISTINCTION_CATALOG,
 type BadgeDisplay,type PlayerAura} from '../lib/player-recognition';
import {readRecognition,saveRecognition,previewDistinctions,type RecognitionSettings} from '../lib/player-recognition-api';
import {CompactMemberIdentity} from './CompactMemberIdentity';
import {CelestialEmblem} from './CelestialEmblem';
import {HonorInsignia} from './HonorInsignia';
import './player-card-studio-v065.css';

const AURA_CHOICES:[
 PlayerAura,string,string
][]=[
 ['none','Unadorned','No animated atmosphere'],
 ['aurora','Aurora','Cold electric radiance'],
 ['eclipse','Eclipse','Violet shadow halo'],
 ['ember','Ember','Warm stellar edge light'],
 ['nebula','Nebula','Soft rose cosmic clouds'],
 ['transcosmic','Transcosmic','Continuance coral and violet']
];
const MODES:readonly {id:BadgeDisplay['mode'];label:string;help:string}[]=[
 {id:'automatic',label:'Latest three',help:'Updates as you earn new achievements'},
 {id:'curated',label:'My selection',help:'Pin up to three badges you choose'},
 {id:'hidden',label:'Keep private',help:'No badges on public player cards'}
];

export function PlayerCardStudio({profile,space}:{profile:CanonicalProfile;space:MemberSpace}){
 const [data,setData]=useState<RecognitionSettings|null>(null);
 const [notEnabled,setNotEnabled]=useState(false);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [badgeMode,setBadgeMode]=useState<BadgeDisplay['mode']>('automatic');
 const [badgeIds,setBadgeIds]=useState<string[]>([]);
 const [medalId,setMedalId]=useState<string|null>(null);
 const [ribbonIds,setRibbonIds]=useState<string[]>([]);
 const [aura,setAura]=useState<PlayerAura>('none');
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const apply=(next:RecognitionSettings)=>{
  setData(next);setBadgeMode(next.badgeMode);setBadgeIds(next.badgeIds);
  setMedalId(next.medalId);setRibbonIds(next.ribbonIds);setAura(next.aura);
 };
 useEffect(()=>{
  let active=true;const c=new AbortController();
  setLoading(true);setError('');setMessage('');setNotEnabled(false);
  readRecognition(c.signal).then(next=>{if(active)apply(next)}).catch(e=>{
   if(!active)return;
   if((e as {status?:number})?.status===404)setNotEnabled(true);
   else setError(e instanceof Error?e.message:'Recognition settings unavailable');
  }).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false;c.abort()};
 },[profile.handle]);
 async function save(){
  if(!data||saving)return;
  setSaving(true);setError('');setMessage('');
  try{
   const next=await saveRecognition({
    badgeMode,badgeIds,medalId,ribbonIds,aura,revision:data.revision
   });
   apply(next);setMessage('Your verified player card display is saved.');
  }catch(e){setError(e instanceof Error?e.message:'Could not save player card.')}
  finally{setSaving(false)}
 }
 function toggleBadge(id:string){
  setMessage('');setBadgeMode('curated');
  setBadgeIds(old=>old.includes(id)?old.filter(v=>v!==id):old.length<3?[...old,id]:old);
 }
 function toggleRibbon(id:string){
  setMessage('');
  setRibbonIds(old=>old.includes(id)?old.filter(x=>x!==id):old.length<2?[...old,id]:old);
 }
 const badges=data?.earnedBadges??[];
 const honor= data?previewDistinctions(data,medalId,ribbonIds):{medals:[],ribbons:[]};
 return <section className="av65-studio ms-card" aria-labelledby="av65-studio-heading">
  <header className="av65-studio-head"><div><span className="kicker">CONTINUANCE INSTITUTE / PLAYER REGISTRY</span>
   <h2 id="av65-studio-heading">Your public signature.</h2>
   <p>One identity on every forum, creation, conversation and member wall. Only server-earned marks can appear.</p></div>
   <span className="av65-studio-step">IDENTITY / 01</span></header>
  {loading&&<p role="status">Loading your earned recognition…</p>}
  {notEnabled&&<p className="av65-studio-note">The expanded recognition archive has not been activated. Your existing earned level and awards still appear in the member interface; no new medals or ribbons have been issued here.</p>}
  {error&&<p role="alert" className="av65-studio-error">{error}</p>}
  {data&&<>
   <div className="av65-studio-preview">
    <div><span className="kicker">LIVE OWNER PREVIEW</span><small>Exactly what you choose to publish, subject to your profile visibility.</small></div>
    <CompactMemberIdentity size="featured" href="/member" member={{
     handle:profile.handle,displayName:profile.displayName,
     avatar:Boolean(space.media.avatar),level:space.showStats&&space.stats?space.stats.level:null,
     featuredAwards:badgeIds,earnedBadges:badges,
     badgeDisplay:{mode:badgeMode,ids:badgeIds},
     distinctions:honor,aura,
     supporterAppearance:space.supporterAppearance
    }}/>
   </div>
   <div className="av65-studio-section"><div className="av65-studio-section-head">
    <div><span>01 / ACHIEVEMENT BADGES</span><h3>Three marks on your card.</h3></div>
    <small>{badges.length} earned · {badgeMode==='hidden'?0:badgeMode==='automatic'?Math.min(3,badges.length):badgeIds.length}/3 shown</small>
   </div>
   <div className="av65-mode-options" role="group" aria-label="Badge display mode">
    {MODES.map(mode=><button key={mode.id} type="button" aria-pressed={badgeMode===mode.id}
      onClick={()=>{setBadgeMode(mode.id);setMessage('')}}><strong>{mode.label}</strong><small>{mode.help}</small></button>)}
   </div>
   {badges.length?<div className="av65-earned-grid" aria-label="Earned badges">
     {badges.map(item=>{
      const def=BADGE_CATALOG[item.id];
      const checked=badgeMode==='curated'&&badgeIds.includes(item.id);
      return <button key={item.id} type="button" className={'av65-earned-tile'+(checked?' is-selected':'')}
       aria-pressed={checked} aria-label={(checked?'Remove ':'Feature ')+(def?.name||item.id)}
       title={(def?.description||'Verified earned badge')+' · Earned '+new Date(item.earnedAt*1000).toLocaleDateString()}
       disabled={saving||(!checked&&badgeMode==='curated'&&badgeIds.length>=3)}
       onClick={()=>toggleBadge(item.id)}>
       <CelestialEmblem motif={def?.motif||'beacon'} size="small" state="earned"/>
       <span><strong>{def?.name||item.id}</strong><small>{def?.family||'ACHIEVEMENT'}</small></span>
       <i aria-hidden="true">{checked?'PINNED':'+'}</i>
      </button>;
     })}
    </div>:<p className="av65-studio-note">No earned badges yet. This archive never displays example art as if it were earned.</p>}
   </div>
   <div className="av65-studio-section"><div className="av65-studio-section-head"><div>
    <span>02 / DISTINCTIONS</span><h3>Ribbons and medals.</h3></div>
    <small>Issued only through independently verified recognition</small></div>
    {!data.earnedMedals.length&&!data.earnedRibbons.length?
      <p className="av65-studio-note">No prestigious distinctions have been issued to this account. These are reserved for exceptional work and sustained service, not ordinary XP milestones.</p>:<>
     {data.earnedMedals.length>0&&<div className="av65-honor-grid" aria-label="Earned medals">
      {data.earnedMedals.map(item=>{const def=DISTINCTION_CATALOG[item.id];if(!def)return null;
       return <button type="button" key={item.id} aria-pressed={medalId===item.id}
        onClick={()=>setMedalId(old=>old===item.id?'':item.id)} disabled={saving}>
         <HonorInsignia distinction={def}/><span><strong>{def.name}</strong><small>{def.description}</small></span>
       </button>;
      })}
     </div>}
     {data.earnedRibbons.length>0&&<div className="av65-honor-grid" aria-label="Earned service ribbons">
      {data.earnedRibbons.map(item=>{const def=DISTINCTION_CATALOG[item.id];if(!def)return null;
       return <button type="button" key={item.id} aria-pressed={ribbonIds.includes(item.id)}
        disabled={saving||(!ribbonIds.includes(item.id)&&ribbonIds.length>=2)}
        onClick={()=>toggleRibbon(item.id)}>
         <HonorInsignia distinction={def}/><span><strong>{def.name}</strong><small>{def.description}</small></span>
       </button>;
      })}
     </div>}
    </>}
   </div>
   <div className="av65-studio-section"><div className="av65-studio-section-head">
    <div><span>03 / AURA</span><h3>Your card's atmosphere.</h3></div><small>Cosmetic only</small>
   </div>
    <div className="av65-aura-options">{AURA_CHOICES.map(([id,name,detail])=>
     <button type="button" key={id} aria-pressed={aura===id} disabled={saving}
      onClick={()=>setAura(id)} className={'av65-aura-option av65-aura-option--'+id}>
       <span className="av65-aura-swatch" aria-hidden="true"/><strong>{name}</strong><small>{detail}</small>
     </button>
    )}</div>
   </div>
   <div className="av65-studio-end"><div>
    <strong>Constellations are the next extension.</strong>
    <p>Verified group memberships and flags will appear here when the Constellation system exists. No self-assigned affiliations or ranks.</p>
   </div><button className="ms-primary" onClick={()=>void save()} disabled={saving}>
    {saving?'SAVING PLAYER CARD…':'SAVE PLAYER CARD'}
   </button></div>
   {message&&<p className="av65-studio-success" role="status">{message}</p>}
  </>}
 </section>;
}
