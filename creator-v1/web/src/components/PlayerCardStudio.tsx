import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import type {CanonicalProfile,MemberSpace} from '../lib/canonical-beta';
import {BADGE_CATALOG,DISTINCTION_CATALOG,AURA_CATALOG,creditedContributionCount,
 type BadgeDisplay,type PlayerAura} from '../lib/player-recognition';
import {readRecognition,saveRecognition,previewDistinctions,type RecognitionSettings} from '../lib/player-recognition-api';
import {CompactMemberIdentity,type PublicIdentity} from './CompactMemberIdentity';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import './player-card-studio-v065.css';

const MODES:readonly {id:BadgeDisplay['mode'];label:string;help:string}[]=[
 {id:'automatic',label:'Latest three',help:'Updates as you earn new achievements'},
 {id:'curated',label:'My selection',help:'Pin up to three badges you choose'},
 {id:'hidden',label:'Keep private',help:'No badges on public player cards'}
];

export function PlayerCardStudio({profile,space,onAvailabilityChange}:{profile:CanonicalProfile;space:MemberSpace;onAvailabilityChange?:(enabled:boolean)=>void}){
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
  readRecognition(c.signal).then(next=>{if(active){apply(next);onAvailabilityChange?.(true)}}).catch(e=>{
   if(!active)return;
   onAvailabilityChange?.(false);
   if((e as {status?:number})?.status===404)setNotEnabled(true);
   else setError(e instanceof Error?e.message:'Recognition settings unavailable');
  }).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false;c.abort()};
 },[profile.handle,space.aura,onAvailabilityChange]);
 async function save(){
  if(!data||saving)return;
  setSaving(true);setError('');setMessage('');
  try{
   const next=await saveRecognition({
    badgeMode,badgeIds,medalId,ribbonIds,aura,revision:data.revision
   });
   apply(next);setMessage('Saved. Your aura and earned marks will appear on your public cards; other open tabs refresh when revisited.');
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
 const unsaved=Boolean(data)&&(
  aura!==data!.aura||badgeMode!==data!.badgeMode||
  medalId!==data!.medalId||
  JSON.stringify(badgeIds)!==JSON.stringify(data!.badgeIds)||
  JSON.stringify(ribbonIds)!==JSON.stringify(data!.ribbonIds)
 );
 const badges=data?.earnedBadges??[];
 const honor= data?previewDistinctions(data,medalId,ribbonIds):{medals:[],ribbons:[]};
 const previewMember:PublicIdentity={
  handle:profile.handle,displayName:profile.displayName,
  avatar:Boolean(space.media.avatar),
  avatarVersion:space.media.avatar,
  level:space.showStats&&space.stats?space.stats.level:null,
  featuredAwards:badgeIds,earnedBadges:badges,
  badgeDisplay:{mode:badgeMode,ids:badgeIds},
  distinctions:honor,aura,
  role:space.role,reputation:space.showStats?space.reputation:undefined,
  earnedAura:space.showStats?space.earnedAura:undefined,
  constellation:space.constellation,
  supporterAppearance:space.supporterAppearance,
  progress:space.showStats?space.stats:undefined
 };
 return <section className="av65-studio ms-card" aria-labelledby="av65-studio-heading">
  <header className="av65-studio-head"><div><span className="kicker">CONTINUANCE INSTITUTE / PLAYER REGISTRY</span>
   <h2 id="av65-studio-heading">Your public signature.</h2>
   <p>One identity on every forum, creation, conversation and member wall. Only server-earned marks can appear.</p>
   <Link to="/recognition" className="av65-studio-archive-link">INSPECT MY EARNED REWARDS ↗</Link></div>
   <span className="av65-studio-step">IDENTITY / 01</span></header>
  {loading&&<p role="status">Loading your earned recognition…</p>}
  {notEnabled&&<p className="av65-studio-note">The expanded recognition archive has not been activated. Your existing earned level and awards still appear in the member interface; no new medals or ribbons have been issued here.</p>}
  {error&&<p role="alert" className="av65-studio-error">{error}</p>}
  {data&&<>
   <div className="av65-studio-preview">
    <div><span className="kicker">LIVE OWNER PREVIEW</span><small role="status">{unsaved?
      'UNSAVED PREVIEW · Your public card changes only after Save Player Card.':
      'SAVED SIGNATURE · Your public profile uses these verified preferences.'}</small></div>
    <div className="av78-preview-variants" aria-label="Your player card in three contexts">
     <div className="av78-preview-featured"><span>PROFILE / FEATURED</span>
      <CompactMemberIdentity size="featured" interactive={false} href="/member" member={previewMember}/></div>
     <div className="av78-preview-row">
      <div><span>COMMUNITY / COMPACT</span>
       <CompactMemberIdentity size="compact" interactive={false} href="/member" member={previewMember}/></div>
      <div><span>THREAD / INLINE</span>
       <CompactMemberIdentity size="inline" interactive={false} href="/member" member={previewMember}/></div>
     </div>
    </div>
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
       <BadgeInsignia badge={item.id} size="small" state="earned"/>
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
    <div><span>03 / PERSONAL ATMOSPHERE</span><h3>Choose your ambient aura.</h3></div><small>Cosmetic; earned auras and verified roles are separate</small>
   </div>
    <p className="av65-aura-principle">Choose a personal affinity, not a rank or verified institutional affiliation. Every atmosphere is equal; your achievements and permissions remain independently verified.</p>
    <div className="av65-aura-options">{AURA_CATALOG.map(({id,name,discipline,motto,meaning,appearance})=>
     <button type="button" key={id} aria-pressed={aura===id} disabled={saving}
      onClick={()=>setAura(id)} className={'av65-aura-option av65-aura-option--'+id}>
       <span className="av65-aura-swatch" aria-hidden="true"/><strong>{name}</strong><span className="av65-aura-discipline">{discipline}</span><small>{meaning}</small><em>{motto}</em><span className="av65-aura-appearance">{appearance}</span>
     </button>
    )}</div>
    <Link className="av65-aura-codex-link" to="/auras">EXPLORE THE AURA CODEX ↗</Link>
   </div>
   <div className="av81-standing-panel" aria-label="Earned reputation and role status">
    <div className="av65-studio-section-head"><div><span>04 / CONTRIBUTION SIGNAL</span><h3>Your standing changes as you contribute.</h3></div>
     <small>Server-verified; never self-assigned</small></div>
    {space.showStats&&space.reputation?<div className="av81-standing-data">
     <strong>{space.reputation.score.toLocaleString()} REP</strong>
     <span>THREADS {creditedContributionCount(space.reputation.stats.discussions,'discussions')} · REPLIES {creditedContributionCount(space.reputation.stats.replies,'replies')} · PEERS {creditedContributionCount(space.reputation.stats.appreciations,'appreciations')} · MARKS {creditedContributionCount(space.reputation.stats.badges,'badges')}</span>
     <small>{space.reputation.nextAt===null?'Highest activity aura earned':(space.reputation.nextAt-space.reputation.score)+' REP until your next aura'}</small>
    </div>:<p className="av65-studio-note">Reputation appears when verified activity statistics are available and public stats visibility is enabled. No reputation is guessed from XP, account age, or test actions.</p>}
    {space.showStats&&space.reputation&&<div className="av81-signal-track" aria-label="Reputation aura milestones">
     {([['Signal',40],['Orbit',160],['Nova',420],['Zenith',900]] as const).map(([label,min])=>
      <span key={label} className={space.reputation!.score>=min?'is-earned':'is-locked'}>
       <strong>{label}</strong><small>{min} REP</small>
       <em>{space.reputation!.score>=min?'EARNED':'SEALED'}</em>
      </span>)}
    </div>}
    <p className="av81-standing-help">Published discussions, approved replies, distinct peer appreciation and verified badges contribute. Hidden content stops counting. Only the first 40 threads, 80 replies, 60 distinct peers and 20 badges contribute to the score. Your next contribution should be useful, not repetitive. Founder, moderator, administrator and curator marks require independently verified role grants; they cannot be selected here.</p>
    <Link className="av81-contribute-link" to="/community">CONTRIBUTE TO THE COMMUNITY ↗</Link>
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
