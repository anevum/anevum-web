import {useCallback,useEffect,useState} from 'react';
import type {SupporterAppearance} from '../lib/canonical-beta';
import {MemberPortrait} from './MemberPortrait';
import {SupporterIdentity,SupporterSeal} from './SupporterSeal';

type Group='seal'|'frame'|'aura';
type Item={id:string;name:string;afterDays:number;detail?:string};
type Unlocked={days:number;seals:string[];frames:string[];auras:string[];tier:string|null};
type Rewards={
  available:boolean;supporter:boolean;publicInsignia:boolean;revision:number;
  catalog:{seals:Item[];frames:Item[];auras:Item[]};
  unlocks:Unlocked;selected:SupporterAppearance|null;
};
const EMPTY:SupporterAppearance={seal:'signal',frame:'orbital',aura:'aurora'};
const FALLBACK:Rewards['catalog']={
 seals:[{id:'signal',name:'First Signal',afterDays:0,detail:'Your first founding mark'},
  {id:'orbit',name:'Established Orbit',afterDays:90,detail:'90 days of membership'},
  {id:'constellation',name:'Constellation',afterDays:180,detail:'180 days of membership'},
  {id:'continuance',name:'Continuance',afterDays:365,detail:'365 days of membership'}],
 frames:[{id:'orbital',name:'Orbital Alloy',afterDays:0},{id:'rose',name:'Roseglass',afterDays:0},
  {id:'lumen',name:'Lumen',afterDays:0},{id:'stellar',name:'Stellar Crown',afterDays:90},
  {id:'continuance',name:'Continuance Halo',afterDays:365}],
 auras:[{id:'aurora',name:'Aurora',afterDays:0},{id:'eclipse',name:'Eclipse',afterDays:0},
  {id:'ember',name:'Ember',afterDays:0},{id:'nebula',name:'Nebula',afterDays:180},
  {id:'transcosmic',name:'Transcosmic',afterDays:365}]
};
function validPayload(value:unknown):value is Rewards{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const x=value as Partial<Rewards>;
 return typeof x.supporter==='boolean'&&typeof x.available==='boolean'&&
  typeof x.revision==='number'&&Boolean(x.catalog&&Array.isArray(x.catalog.seals)&&
  Array.isArray(x.catalog.frames)&&Array.isArray(x.catalog.auras))&&
  Boolean(x.unlocks&&Array.isArray(x.unlocks.seals)&&Array.isArray(x.unlocks.frames)&&Array.isArray(x.unlocks.auras));
}
const groups=[
 {key:'seal' as const,items:'seals' as const,title:'Supporter seals',
  description:'Distinctive collector marks that evolve with your subscription age.'},
 {key:'frame' as const,items:'frames' as const,title:'Portrait frames',
  description:'Tactile ornamentation for your profile picture.'},
 {key:'aura' as const,items:'auras' as const,title:'Wall atmospheres',
  description:'An animated, reduced-motion-aware layer for your wall banner.'}
];
export function SupporterRewardsStudio({memberId}:{memberId:string|null|undefined}){
 const [data,setData]=useState<Rewards|null>(null);
 const [choice,setChoice]=useState<SupporterAppearance>(EMPTY);
 const [loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const load=useCallback(async(signal?:AbortSignal)=>{
  if(!memberId)return;
  setLoading(true);
  try{
   const response=await fetch('/api/v1/member/supporter/rewards',{
    method:'GET',credentials:'same-origin',mode:'same-origin',cache:'no-store',
    referrerPolicy:'same-origin',redirect:'error',signal,headers:{accept:'application/json'}
   });
   if(!response.ok)throw Error('Your supporter studio cannot be opened.');
   const body:unknown=await response.json();
   if(!validPayload(body))throw Error('Invalid reward catalog response.');
   if(signal?.aborted)return;
   setData(body);setChoice(body.selected??EMPTY);
   setError('');
  }catch(e){if(!signal?.aborted){setData(null);setError(e instanceof Error?e.message:'Rewards unavailable.');}}
  finally{if(!signal?.aborted)setLoading(false);}
 },[memberId]);
 useEffect(()=>{
  const controller=new AbortController();
  setChoice(EMPTY);setData(null);setError('');setNotice('');
  if(memberId)void load(controller.signal);
  return()=>controller.abort();
 },[load,memberId]);
 const subscribed=Boolean(data?.available&&data?.supporter);
 const catalog=data?.catalog??FALLBACK;
 const unlocked=data?.unlocks;
 const dirty=Boolean(data?.selected&&groups.some(x=>choice[x.key]!==data?.selected?.[x.key]));
 async function save(){
  if(!subscribed||!data||saving||loading||!dirty)return;
  setSaving(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/v1/member/supporter/rewards',{
    method:'PATCH',mode:'same-origin',credentials:'same-origin',redirect:'error',
    referrerPolicy:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({...choice,revision:data.revision})
   });
   if(!response.ok)throw Error(response.status===409
    ?'Your membership or rewards changed. Recheck your eligibility.'
    :'The selection could not be saved.');
   const result=await response.json() as {selected:SupporterAppearance;revision:number};
   if(!result?.selected||!Number.isSafeInteger(result.revision))
    throw Error('The server did not confirm your selection.');
   setData(old=>old?{...old,selected:result.selected,revision:result.revision}:old);
   setChoice(result.selected);
   setNotice('Supporter cosmetics saved. Your wall will reflect this selection when your public badge is enabled.');
  }catch(e){setError(e instanceof Error?e.message:'Could not save.');}
  finally{setSaving(false);}
 }
 return <section className="av34-studio" aria-labelledby="av34-title">
  <div className="av34-intro"><span className="av32-index">03 / THE COLLECTOR'S STUDIO</span>
   <h2 id="av34-title">Marks of <em>continuance.</em></h2>
   <p>Support ANEVUM and build a visual identity around the orbit. These are cosmetic subscription rewards, never earned XP, levels, merit awards, or preferential community access.</p>
  </div>
  <div className="av34-grid">
   <div className="av34-collection" aria-label="Supporter cosmetic collection">
    {groups.map(group=><section className="av34-shelf" key={group.key} aria-labelledby={'av34-group-'+group.key}>
     <div className="av34-shelf-head"><div><h3 id={'av34-group-'+group.key}>{group.title}</h3><p>{group.description}</p></div>
      <span>{catalog[group.items].length} STYLES</span></div>
     <div className="av34-options">
      {catalog[group.items].map(item=>{
       const open=subscribed&&Boolean(unlocked?.[group.items].includes(item.id));
       const selected=choice[group.key]===item.id;
       return <button className={'av34-choice'+(selected?' is-selected':'')+(open?' is-unlocked':' is-locked')}
         key={item.id} type="button" aria-pressed={selected}
         aria-label={item.name+(open?' unlocked':item.afterDays?' locked, '+item.afterDays+' days of membership':' available after supporting')}
         disabled={!open||saving||loading}
         onClick={()=>setChoice(prev=>({...prev,[group.key]:item.id}))}>
        <span className={'av34-choice-art av34-choice-'+group.key+'-'+item.id} aria-hidden="true">
         {group.key==='seal'?<SupporterSeal seal={item.id as SupporterAppearance['seal']} compact/>:<span className="av34-choice-core">✦</span>}
        </span>
        <strong>{item.name}</strong>
        <small>{open?'UNLOCKED':item.afterDays?item.afterDays+' DAYS':'SUPPORTER'}</small>
       </button>;
      })}
     </div>
    </section>)}
   </div>
   <aside className="av34-preview-panel" aria-label="Current supporter cosmetic preview">
    <div className="av34-preview-top"><span className="av32-index">PREVIEW / YOUR WORLD</span><span>LIVE PREVIEW</span></div>
    <div className={'av34-preview-world av34-aura av34-aura-'+choice.aura}>
     <div className="av34-preview-shimmer" aria-hidden="true"/>
     <MemberPortrait name="Supporter preview" supporterFrame={choice.frame}/>
     <SupporterIdentity appearance={choice} compact/>
     <span className="av34-preview-id">YOU / ANEVUM COMMUNITY</span>
    </div>
    <div className="av34-preview-copy">
     <h3>Personalize the signal.</h3>
     <p>{subscribed?'Choose unlocked designs, then save them. To share these visuals publicly, enable the profile insignia above and publish your wall.':'Preview the collection. Your rewards unlock when an eligible subscription is verified. No rewards are sold separately.'}</p>
     {subscribed&&<p className="av34-tenure">{unlocked?.days??0} COMPLETED DAYS IN CURRENT SUBSCRIPTION</p>}
     <button className="av32-primary" type="button" disabled={!subscribed||!dirty||saving||loading} onClick={()=>void save()}>
      {saving?'SAVING…':subscribed?(dirty?'SAVE COSMETIC CHOICES':'REWARDS UP TO DATE'):'JOIN TO UNLOCK'}
     </button>
     {memberId&&<button type="button" className="av32-refresh" disabled={saving||loading} onClick={()=>{setNotice('');void load();}}>REFRESH REWARDS</button>}
     {error&&<p role="alert" className="av32-error">{error}</p>}
     {notice&&<p role="status">{notice}</p>}
     {memberId&&loading&&<p role="status">Verifying your collection…</p>}
     <small>The higher seals mark completed time in a verified current subscription. Cancelling or losing paid access temporarily disables paid cosmetics; your earned achievement cabinet stays unchanged.</small>
    </div>
   </aside>
  </div>
 </section>;
}
