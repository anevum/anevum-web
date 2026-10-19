import {useEffect,useState,type FormEvent} from 'react';
import {BADGE_CATALOG,DISTINCTION_CATALOG} from '../lib/player-recognition';
import './staff-owner-control-v086.css';

/** Real canonical D1 records; no synthetic members or client-admin shortcuts. */
type Member={id:string;name:string;handle:string;email:string;verified:boolean;joinedAt:string;
 visibility:string;staffRole:string|null;cosmeticAura:string};
type MemberResult={members:Member[];page:number;pageSize:number;hasMore:boolean;query:string;source:string};
type Reward={kind:string;id:string;earnedAt:number};
type Detail={grants:Reward[];milestones:Reward[];memberVerified:boolean;cosmeticAura:string;
 badgeDisplayMode:string;roleRegistryReady:boolean;roleDistinctions:{role:string;grantedAt:number}[];
 canIssue:false;canChangeXp:false};
type Release={id:string;name:string;status:'live'|'verified'|'synthetic';environment:string;
 summary:string;source:string;evidence:string};
type ReleaseLedger={stagingReady:boolean;stagingReason:string;releases:Release[]};
type Tab='members'|'rewards'|'builds';
const API='/api/v1/member/staff-ops';
async function invoke<T>(query:string,body?:unknown,signal?:AbortSignal):Promise<T>{
 const reply=await fetch(API+(query?'?'+query:''),{method:body===undefined?'GET':'POST',
  credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',signal,
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)});
 const data=await reply.json().catch(()=>({error:'Staff response unavailable'}));
 if(!reply.ok)throw Error(reply.status===403?'Owner authorization required':data.error||'Control room unavailable');
 return data as T;
}
const labels=(id:string)=>id.replaceAll('_',' ').replace(/\b\w/g,s=>s.toUpperCase());
const epoch=(time:number)=>Number.isFinite(time)&&time>0?new Date(time*1000).toLocaleDateString(): 'Unknown';
export function StaffOwnerControl({onPersonnel,onReview}:{onPersonnel:()=>void;onReview:()=>void}){
 const [tab,setTab]=useState<Tab>('members');
 const [search,setSearch]=useState(''),[submitted,setSubmitted]=useState('');
 const [page,setPage]=useState(0),[reload,setReload]=useState(0);
 const [directory,setDirectory]=useState<MemberResult|null>(null),[error,setError]=useState('');
 const [loading,setLoading]=useState(false),[selected,setSelected]=useState<Member|null>(null);
 const [detail,setDetail]=useState<Detail|null>(null),[detailLoading,setDetailLoading]=useState(false);
 const [detailError,setDetailError]=useState(''),[mutating,setMutating]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [builds,setBuilds]=useState<ReleaseLedger|null>(null),[buildError,setBuildError]=useState('');
 const [buildLoading,setBuildLoading]=useState(false);
 useEffect(()=>{
  if(tab!=='members')return;
  const controller=new AbortController();let active=true;
  setLoading(true);setError('');
  invoke<MemberResult>('lane=members&q='+encodeURIComponent(submitted)+'&page='+page,undefined,controller.signal)
   .then(d=>{if(active)setDirectory(d)})
   .catch(e=>{if(active&&e?.name!=='AbortError')setError(e instanceof Error?e.message:'Directory unavailable')})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false;controller.abort()};
 },[tab,page,submitted,reload]);
 useEffect(()=>{
  if(!selected)return;
  let active=true;const controller=new AbortController();
  setDetailLoading(true);setDetail(null);setDetailError('');
  invoke<Detail>('lane=member-rewards&member='+encodeURIComponent(selected.id),undefined,controller.signal)
   .then(d=>{if(active)setDetail(d)})
   .catch(e=>{if(active&&e?.name!=='AbortError')setDetailError(e instanceof Error?e.message:'Rewards unavailable')})
   .finally(()=>{if(active)setDetailLoading(false)});
  return()=>{active=false;controller.abort()};
 },[selected?.id,reload]);
 useEffect(()=>{
  if(tab!=='builds')return;
  let active=true;const controller=new AbortController();
  setBuildLoading(true);setBuildError('');
  invoke<ReleaseLedger>('lane=release-evidence',undefined,controller.signal)
   .then(d=>{if(active)setBuilds(d)})
   .catch(e=>{if(active&&e?.name!=='AbortError')setBuildError(e instanceof Error?e.message:'Build evidence unavailable')})
   .finally(()=>{if(active)setBuildLoading(false)});
  return()=>{active=false;controller.abort()};
 },[tab]);
 const submit=(event:FormEvent)=>{
  event.preventDefault();
  const q=search.trim();
  if(q.length===1){setError('Enter at least two search characters, or clear the field.');return}
  setError('');setSelected(null);setDetail(null);setPage(0);setSubmitted(q);
  if(q===submitted&&page===0)setReload(n=>n+1);
 };
 const changeRole=async(member:Member)=>{
  if(mutating||!member.verified||member.staffRole==='owner')return;
  const revoke=member.staffRole==='reviewer',verb=revoke?'REVOKE':'AUTHORIZE';
  if(!window.confirm(verb+' reviewer access for '+member.name+'? Staff privileges are verified server-side and every change is audited.'))return;
  setMutating(true);setFeedback('');setError('');
  try{
   await invoke('',{kind:revoke?'staff-revoke':'staff-grant',memberId:member.id});
   setFeedback('Verified reviewer '+(revoke?'revoked':'authorized')+' for '+member.name+'.');
   setSelected(null);setDetail(null);setReload(n=>n+1);
  }catch(e){setError(e instanceof Error?e.message:'Staff role change failed')}
  finally{setMutating(false)}
 };
 const switchTab=(next:Tab)=>{setTab(next);setFeedback('')};
 const catalogBadges=Object.values(BADGE_CATALOG);
 const catalogDistinctions=Object.values(DISTINCTION_CATALOG);
 return <section className="ir-owner-hub" aria-label="ANEVUM owner control room">
  <header className="ir-owner-title">
   <div><span className="ir-kicker">ANEVUM / CONTINUANCE INSTITUTE / OWNER AUTHORITY</span>
    <h2>Continuance <em>Control Room</em></h2>
    <p>Members, earned identities, reviewer access and tested releases. No simulated staff data.</p></div>
   <span className="ir-owner-seal" aria-label="Restricted to verified owner">OWNER ONLY</span>
  </header>
  <div className="ir-owner-tabs" role="tablist" aria-label="Owner controls">
   <button type="button" role="tab" aria-selected={tab==='members'} onClick={()=>switchTab('members')}>01 / Members</button>
   <button type="button" role="tab" aria-selected={tab==='rewards'} onClick={()=>switchTab('rewards')}>02 / Rewards</button>
   <button type="button" role="tab" aria-selected={tab==='builds'} onClick={()=>switchTab('builds')}>03 / Releases</button>
  </div>
  {tab==='members'&&<div className="ir-owner-section">
   <div className="ir-owner-row">
    <form className="ir-owner-search" onSubmit={submit}>
     <label htmlFor="ir-owner-search-field">MEMBER LOOKUP</label>
     <input id="ir-owner-search-field" value={search} maxLength={64}
      onChange={e=>setSearch(e.target.value)} placeholder="Name, email or @handle"/>
     <button type="submit" disabled={loading}>SEARCH</button>
    </form>
    <div className="ir-owner-actions">
     <button type="button" onClick={()=>setReload(x=>x+1)} disabled={loading}>REFRESH ↻</button>
     <button type="button" onClick={onPersonnel}>STAFF PERSONNEL →</button>
    </div>
   </div>
   {feedback&&<p role="status" className="ir-owner-success">{feedback}</p>}
   {error&&<p role="alert" className="ir-owner-warning">{error}</p>}
   {loading&&<p role="status">Retrieving verified member records…</p>}
   <div className="ir-owner-members">
    <div className="ir-owner-directory">
     <div className="ir-owner-column-title"><b>Member registry</b><span>{directory?.members.length??0} in this page</span></div>
     {directory&&!directory.members.length&&!loading&&<p className="ir-owner-empty">No matching members found.</p>}
     {directory?.members.map(m=><article className={'ir-owner-member'+(selected?.id===m.id?' is-selected':'')} key={m.id}>
      <span className="ir-owner-avatar" aria-hidden="true">{(m.name||'?').slice(0,1).toUpperCase()}</span>
      <div className="ir-owner-member-copy">
       <strong>{m.name||'Member'}</strong>
       <small>{m.handle?'@'+m.handle:m.email} · {m.verified?'VERIFIED':'UNVERIFIED'}</small>
       <small>{m.staffRole?m.staffRole.toUpperCase()+' STAFF':'MEMBER'} · {m.visibility.toUpperCase()} PROFILE</small>
      </div>
      <div className="ir-owner-member-actions">
       <button type="button" onClick={()=>{setSelected(m);setTab('members')}}>INSPECT</button>
       {m.verified&&m.staffRole!=='owner'&&
        <button type="button" disabled={mutating} className={m.staffRole==='reviewer'?'is-revoke':''}
         onClick={()=>void changeRole(m)}>{m.staffRole==='reviewer'?'REVOKE':'GRANT MOD'}</button>}
      </div>
     </article>)}
     <div className="ir-owner-pagination">
      <button type="button" onClick={()=>{setSelected(null);setPage(p=>Math.max(0,p-1))}} disabled={!page||loading}>← PREVIOUS</button>
      <span>PAGE {page+1}</span>
      <button type="button" onClick={()=>{setSelected(null);setPage(p=>p+1)}} disabled={!directory?.hasMore||loading}>NEXT →</button>
     </div>
    </div>
    <aside className="ir-owner-inspector">
     <div className="ir-owner-column-title"><b>Identity inspector</b><span>READ-ONLY REWARD LEDGER</span></div>
     {!selected?<p className="ir-owner-empty">Select a member to inspect verified recognition and cosmetic aura settings.</p>:<>
      <h3>{selected.name}</h3>
      <p>{selected.email} · {selected.verified?'Verified account':'Not verified'}</p>
      <div className="ir-owner-facts">
       <span>STAFF ROLE <b>{selected.staffRole||'none'}</b></span>
       <span>CHOSEN AURA <b>{detail?.cosmeticAura||selected.cosmeticAura||'none'}</b></span>
       <span>PUBLIC PROFILE <b>{selected.visibility}</b></span>
       <span>ROLE HALOS <b>{detail?.roleRegistryReady?'Evidence-backed':'Registry not activated'}</b></span>
      </div>
      {detailLoading&&<p role="status">Inspecting earned recognition…</p>}
      {detailError&&<p role="alert" className="ir-owner-warning">{detailError}</p>}
      {detail&&<div className="ir-owner-award-ledger">
       <h4>Earned records</h4>
       {[...detail.milestones.map(x=>({...x,kind:'milestone'})),...detail.grants].length===0?
        <p>No verified awards found.</p>:
        [...detail.milestones.map(x=>({...x,kind:'milestone'})),...detail.grants].map((x,i)=>
         <div key={x.kind+'-'+x.id+'-'+i}><strong>{labels(x.id)}</strong><small>{x.kind.toUpperCase()} · {epoch(x.earnedAt)}</small></div>)}
      </div>}
      <p className="ir-owner-footnote">Level XP and activity-derived reputation cannot be granted manually. Institutional halos require independent review and their database ledger.</p>
     </>}
    </aside>
   </div>
  </div>}
  {tab==='rewards'&&<div className="ir-owner-section">
   <div className="ir-owner-row"><div><h3>Recognition registry</h3>
    <p>Definitions are not grants. Earned levels remain locked until verified progression unlocks them.</p></div>
    <button type="button" onClick={()=>{setTab('members');onPersonnel()}}>OPEN PERSONNEL →</button></div>
   <div className="ir-owner-catalog-grid">
    <section><h4>Achievement badges <span>{catalogBadges.length}</span></h4>
     {catalogBadges.map(x=><article key={x.id}><strong>{x.name}</strong><small>{x.family.toUpperCase()} · {x.status.toUpperCase()}</small><p>{x.description}</p></article>)}</section>
    <section><h4>Honors &amp; distinctions <span>{catalogDistinctions.length}</span></h4>
     {catalogDistinctions.map(x=><article key={x.id}><strong>{x.name}</strong>
      <small>{x.kind.toUpperCase()}</small><p>{x.description}</p></article>)}
     <div className="ir-owner-footnote">An institutional medal or role halo must have independent evidence and approval. Owner review does not invent an earned award.</div></section>
   </div>
  </div>}
  {tab==='builds'&&<div className="ir-owner-section">
   <div className="ir-owner-row"><div><h3>Release staging &amp; evidence</h3>
    <p>Review genuine compiled releases and their test captures. Separate from the conceptual Lab simulator.</p></div>
    <button type="button" onClick={onReview}>MODERATOR REVIEW →</button></div>
   {buildLoading&&<p role="status">Fetching tested build records…</p>}
   {buildError&&<p role="alert" className="ir-owner-warning">{buildError}</p>}
   {builds&&!builds.stagingReady&&<p className="ir-owner-footnote">ISOLATED STAGING NOT YET ACTIVE · {builds.stagingReason}</p>}
   <div className="ir-owner-builds">
    {builds?.releases.map(x=><article key={x.id}>
     <div className="ir-owner-build-head"><span>{x.environment.toUpperCase()}</span><b className={'ir-owner-status-'+x.status}>{x.status.toUpperCase()}</b></div>
     <h4>{x.name}</h4><p>{x.summary}</p>
     <div><a href={x.evidence} target="_blank" rel="noreferrer">VIEW CAPTURES ↗</a>
      <a href={x.source} target="_blank" rel="noreferrer">SOURCE / TEST RUN ↗</a></div>
    </article>)}
   </div>
   <p className="ir-owner-footnote">Build approval and deployment remain separate. These captures are real CI artifacts; none provides access to another member's private account.</p>
  </div>}
 </section>;
}
