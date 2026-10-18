import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {BADGE_CATALOG,DISTINCTION_CATALOG,type BadgeDefinition,type BadgeFamily,type DistinctionDefinition} from '../lib/player-recognition';
import {readRecognition,readRecognitionCatalog,type RecognitionCatalog,type RecognitionSettings} from '../lib/player-recognition-api';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {BadgeInsignia} from '../components/BadgeInsignia';
import {HonorInsignia} from '../components/HonorInsignia';
import {OrbitalMark} from '../components/OrbitalMark';
import './recognition-registry-v066.css';

type Cabinet='badges'|'ribbons'|'medals';
const CABINETS:{id:Cabinet;name:string;shortName:string;description:string}[]=[
 {id:'badges',name:'Achievement badges',shortName:'Badges',description:'Milestones that mark what you make, explore and contribute.'},
 {id:'ribbons',name:'Service ribbons',shortName:'Ribbons',description:'A woven record of exceptional, sustained contribution.'},
 {id:'medals',name:'Prestige medals',shortName:'Medals',description:'The rarest recognitions: independent review and lasting significance.'}
];
const FAMILIES:({id:'all';label:string}|{id:BadgeFamily;label:string})[]=[
 {id:'all',label:'All disciplines'},{id:'origin',label:'Origins'},
 {id:'community',label:'Community'},{id:'creation',label:'Creation'},
 {id:'craft',label:'Craft'},{id:'discovery',label:'Discovery'},
 {id:'collaboration',label:'Collaboration'},{id:'stewardship',label:'Stewardship'},
 {id:'continuance',label:'Continuance'}
];
type Issuability='available'|'planned'|'checking'|'unavailable';
const badges=Object.values(BADGE_CATALOG);
const distinctions=Object.values(DISTINCTION_CATALOG);
const total=badges.length+distinctions.length;
function BadgeItem({entry,earnedAt,issuability}:{entry:BadgeDefinition;earnedAt?:number;issuability:Issuability}){
 const issued=typeof earnedAt==='number'&&earnedAt>0;
 const active=issuability==='available';
 return <article className={'av66-catalog-item av66-catalog-badge'+(issued?' is-earned':'')} tabIndex={0}>
  <div className="av66-visual-frame"><BadgeInsignia badge={entry.id} size="medium" state={issued?'earned':'preview'}/></div>
  <div className="av66-item-copy"><span className="av66-catalog-meta">{entry.family.toUpperCase()} / {active?'ISSUABLE':issuability==='planned'?'FUTURE':'STATUS UNVERIFIED'}</span>
   <h3>{entry.name}</h3><p>{entry.description}</p>
   <div className="av66-criterion"><strong>RECOGNITION CRITERION</strong><span>{entry.criterion}</span></div>
  </div>
  <span className={'av66-state'+(issued?' is-earned':'')}>{issued?'EARNED':active?'AVAILABLE':issuability==='planned'?'PLANNED':issuability==='checking'?'VERIFYING':'STATUS UNAVAILABLE'}</span>
 </article>;
}
function DistinctionItem({entry,earnedAt,issuability}:{entry:DistinctionDefinition;earnedAt?:number;issuability:Issuability}){
 const issued=typeof earnedAt==='number'&&earnedAt>0;
 return <article className={'av66-catalog-item av66-catalog-distinction'+(issued?' is-earned':'')} tabIndex={0}>
  <div className="av66-visual-frame"><HonorInsignia distinction={entry}/></div>
  <div className="av66-item-copy"><span className="av66-catalog-meta">CONTINUANCE INSTITUTE / {entry.kind.toUpperCase()}</span>
   <h3>{entry.name}</h3><p>{entry.description}</p>
   <div className="av66-criterion"><strong>AWARD STANDARD</strong><span>{entry.criterion}</span></div>
  </div>
  <span className={'av66-state'+(issued?' is-earned':'')}>{issued?'AWARDED':issuability==='available'?'NOMINATIONS OPEN':issuability==='planned'?'PLANNED':issuability==='checking'?'VERIFYING':'STATUS UNAVAILABLE'}</span>
 </article>;
}

export function RecognitionRegistryPage(){
 const {data:session}=canonicalAuthClient.useSession();
 const [cabinet,setCabinet]=useState<Cabinet>('badges'),[family,setFamily]=useState<BadgeFamily|'all'>('all');
 const [search,setSearch]=useState(''),[mine,setMine]=useState(false);
 const [ledger,setLedger]=useState<RecognitionSettings|null>(null);
 const [retrievable,setRetrievable]=useState(false);
 const [catalog,setCatalog]=useState<RecognitionCatalog|null>(null);
 const [catalogProblem,setCatalogProblem]=useState(false);
 useEffect(()=>{
  if(!session?.user?.id){setLedger(null);setRetrievable(false);return;}
  let alive=true;const c=new AbortController();
  readRecognition(c.signal).then(result=>{if(alive){setLedger(result);setRetrievable(true)}}).catch(()=>{
   if(alive){setLedger(null);setRetrievable(false);}
  });
  return ()=>{alive=false;c.abort()};
 },[session?.user?.id]);
 useEffect(()=>{
  let alive=true;const abort=new AbortController();
  readRecognitionCatalog(abort.signal).then(value=>{
   if(alive){setCatalog(value);setCatalogProblem(false);}
  }).catch(()=>{
   if(alive){setCatalog(null);setCatalogProblem(true);}
  });
  return()=>{alive=false;abort.abort();};
 },[]);
 const statusOf=(id:string,kind:'badge'|'ribbon'|'medal'):Issuability=>{
  if(!catalog)return catalogProblem?'unavailable':'checking';
  const field=kind==='badge'?'activeBadgeIds':kind==='ribbon'?'activeRibbonIds':'activeMedalIds';
  return catalog[field].includes(id)?'available':'planned';
 };
 const held=useMemo(()=>new Map(ledger?.earnedBadges.map(x=>[x.id,x.earnedAt] as const)||[]),[ledger]);
 const honors=useMemo(()=>new Map([...(ledger?.earnedRibbons||[]),...(ledger?.earnedMedals||[])].map(x=>[x.id,x.earnedAt] as const)),[ledger]);
 const items=useMemo(()=>{
  const term=search.toLocaleLowerCase().trim();
  return cabinet==='badges'?badges.filter(b=>
   (family==='all'||b.family===family)&&(!mine||held.has(b.id))&&
   (!term||(b.name+' '+b.description+' '+b.criterion+' '+b.family).toLocaleLowerCase().includes(term))):
   distinctions.filter(d=>d.kind===cabinet.slice(0,-1)&&(!mine||honors.has(d.id))&&
   (!term||(d.name+' '+d.description+' '+d.criterion).toLocaleLowerCase().includes(term)));
 },[cabinet,family,search,mine,held,honors]);
 return <section className="av66-registry" id="recognition-registry">
  <header className="av66-registry-header">
   <div className="av66-registry-eyebrow"><OrbitalMark className="av66-registry-mark"/><span>ANEVUM / THE CONTINUANCE INSTITUTE</span><span>RECOGNITION ARCHIVE / VOL. 01</span></div>
   <h1>THE MARKS<br/><em>WE LEAVE.</em></h1>
   <p>Explore the marks of what we make, who we help, and what endures. Every distinction in this archive has its own purpose and path to earning it.</p>
   <div className="av66-registry-nav"><Link to="/levels">EXPLORE 30 LEVELS ↗</Link><Link to="/member?tab=awards">EDIT MY PLAYER CARD ↗</Link></div>
   <div className="av66-registry-metrics"><div><b>30</b><span>LEVELS</span></div><div><b>{badges.length}</b><span>BADGES</span></div><div><b>{distinctions.filter(x=>x.kind==='ribbon').length}</b><span>RIBBONS</span></div><div><b>{distinctions.filter(x=>x.kind==='medal').length}</b><span>MEDALS</span></div></div>
  </header>
  <div className="av66-catalog-shell">
   <div className="av66-catalog-intro"><div><span>IDENTITY / RECOGNITION / HONORS</span><h2>The Archive of Deeds</h2></div>
    <p>A collectible catalog designed to expand with the community. Definitions labeled <strong>Planned</strong> are not yet earnable. Nothing here is a fabricated award.</p></div>
   {catalogProblem&&<p className="av69-status-note" role="status">Current award availability could not be verified. Earned badges still come from your secure account ledger; the catalog will not guess which future awards are active.</p>}
   <nav className="av66-catalog-tabs" aria-label="Recognition collections">{CABINETS.map(entry=>
    <button key={entry.id} type="button" aria-label={entry.name} aria-current={cabinet===entry.id?'page':undefined}
     onClick={()=>{setCabinet(entry.id);setMine(false)}}><strong className="av66-tab-full">{entry.name}</strong><strong className="av68-tab-short">{entry.shortName}</strong><small>{entry.description}</small></button>
   )}</nav>
   <div className="av66-toolbar"><label className="av66-search"><span>SEARCH THE ARCHIVE</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a mark or criterion…" maxLength={80}/></label>
    {retrievable&&<label className="av66-my-only"><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)}/><span>MY EARNED COLLECTION</span></label>}
    <span className="av66-count">{items.length} / {cabinet==='badges'?badges.length:distinctions.filter(d=>d.kind===cabinet.slice(0,-1)).length}</span>
   </div>
   {cabinet==='badges'&&<div className="av66-filters" role="group" aria-label="Badge disciplines">{FAMILIES.map(entry=>
    <button type="button" key={entry.id} aria-pressed={family===entry.id} onClick={()=>setFamily(entry.id)}>{entry.label}</button>)}
   </div>}
   <section className={'av66-catalog-grid av66-catalog-grid--'+cabinet} aria-label={CABINETS.find(x=>x.id===cabinet)?.name}>
    {cabinet==='badges'?(items as BadgeDefinition[]).map(entry=><BadgeItem key={entry.id} entry={entry} earnedAt={held.get(entry.id)} issuability={statusOf(entry.id,'badge')}/>):
     (items as DistinctionDefinition[]).map(entry=><DistinctionItem key={entry.id} entry={entry} earnedAt={honors.get(entry.id)} issuability={statusOf(entry.id,entry.kind)}/>)}
   </section>
   {!items.length&&<div className="av66-no-results"><strong>No matching marks.</strong><p>Try a different discipline, keyword or collection.</p><button type="button" onClick={()=>{setSearch('');setFamily('all');setMine(false)}}>RESET ARCHIVE FILTERS</button></div>}
   <footer className="av66-catalog-footer">
    <span>CONTINUANCE INSTITUTE / {String(total).padStart(3,'0')} DEFINED MARKS</span>
    <p>Levels and experience are not authority. Badges cannot be purchased. Ribbons and medals are independently reviewed, subject to evidence and appeal, and never confer moderation powers.</p>
   </footer>
  </div>
 </section>;
}
