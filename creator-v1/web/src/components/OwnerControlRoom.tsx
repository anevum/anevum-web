// ANEVUM.IREN.BUILD.2026-10-19.001.OWNER-CONTROL-ROOM
// Production-source member inspection and real QA evidence; never a fake staff fixture.
import {useEffect,useState} from 'react';
import './owner-control-v085.css';

type OwnerMember={
 id:string;name:string;displayName:string;email:string;verified:boolean;
 handle:string;visibility:string;joinedAt:string|null;
 staffRole:'owner'|'reviewer'|null;selectedAura:string
};
type Entry={kind?:string;role?:string;id?:string;earnedAt?:number;grantedAt?:number};
type Detail={
 member:OwnerMember;
 recognition:{grants:Entry[]|null;milestones:Entry[]|null;roleBadges:Entry[]|null;verifiedRoleRegistryReady:boolean};
 staffAudit:{action:string;createdAt:number}[];
 storage:{xpAggregateReady:boolean};
 controls:{moderatorAssignments:string;earnedLevels:string;roleHalos:string;cosmeticAura:string};
 source:string
};
type MemberPage={members:OwnerMember[];page:number;hasMore:boolean;pageSize:number;source:string;query:string};
type Release={
 id:string;name:string;status:string;kind:'production'|'evidence'|'simulation';
 summary:string;page:string;evidence:string;captures:string|null
};
type ReleasePage={releases:Release[];realIsolatedStaging:boolean;note:string};
const nice=(value:unknown)=>String(value||'').replaceAll('_',' ').replaceAll('-',' ');
const date=(value:string|number|null|undefined)=>{
 if(value===null||value===undefined||value==='')return 'UNKNOWN DATE';
 const d=new Date(typeof value==='number'?value*1000:value);
 return Number.isNaN(d.valueOf())?'UNKNOWN DATE':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
};
async function ownerRead<T>(lane:'owner-members'|'owner-member'|'owner-releases',parameters:Record<string,string>={},signal?:AbortSignal):Promise<T>{
 const query=new URLSearchParams({lane,...parameters});
 const result=await fetch('/api/v1/member/staff-ops?'+query,{
  method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
  referrerPolicy:'same-origin',headers:{accept:'application/json'},signal
 });
 const data=await result.json().catch(()=>({error:'Invalid owner service response'}));
 if(!result.ok)throw new Error(data.error||('Owner service returned '+result.status));
 return data as T;
}
function PrivacyMark({value}:{value:string}){
 return <span className={'ir85-privacy ir85-privacy--'+(value==='public'?'public':'private')}>{value==='public'?'PUBLIC':'PRIVATE'}</span>;
}
function RecognitionRecords({label,rows,notReady}:{label:string;rows:Entry[]|null;notReady:string}){
 return <section className="ir85-evidence-lane">
  <div className="ir85-section-title"><strong>{label}</strong><span>{rows===null?'NOT INSTALLED':rows.length+' EARNED'}</span></div>
  {rows===null?<p>{notReady}</p>:rows.length===0?<p>No verified records yet.</p>:
   <div className="ir85-ledger">{rows.map((record,index)=>
    <div key={String(record.id||record.role)+index}>
     <strong>{nice(record.id||record.role||record.kind).toUpperCase()}</strong>
     <small>{(record.kind?nice(record.kind).toUpperCase()+' · ':'')+date(record.earnedAt??record.grantedAt)}</small>
    </div>)}</div>}
 </section>;
}
export function OwnerControlRoom({onOpenPersonnel}:{onOpenPersonnel:()=>void}){
 const [input,setInput]=useState(''),[page,setPage]=useState(0);
 const [results,setResults]=useState<MemberPage|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [detail,setDetail]=useState<Detail|null>(null),[detailError,setDetailError]=useState(''),[detailLoading,setDetailLoading]=useState(false);
 const [refreshId,setRefreshId]=useState(0);
 const search=input.trim();
 useEffect(()=>{setPage(0)},[search]);
 useEffect(()=>{
  if(search.length===1){setError('Enter at least two characters to search.');setResults(null);setLoading(false);return;}
  const controller=new AbortController();let alive=true;
  setLoading(true);setError('');
  const timer=window.setTimeout(()=>{
   ownerRead<MemberPage>('owner-members',{q:search,page:String(page)},controller.signal)
    .then(data=>{if(alive)setResults(data)})
    .catch(e=>{if(alive&&!(e instanceof Error&&e.name==='AbortError')){setResults(null);setError(e instanceof Error?e.message:'Directory unavailable')}})
    .finally(()=>{if(alive)setLoading(false)});
  },search?350:0);
  return()=>{alive=false;controller.abort();window.clearTimeout(timer)};
 },[search,page,refreshId]);
 useEffect(()=>{
  if(!selectedId)return;
  let alive=true;const controller=new AbortController();setDetail(null);setDetailError('');setDetailLoading(true);
  ownerRead<Detail>('owner-member',{member:selectedId},controller.signal)
   .then(data=>{if(alive)setDetail(data)})
   .catch(e=>{if(alive&&!(e instanceof Error&&e.name==='AbortError'))setDetailError(e instanceof Error?e.message:'Member unavailable')})
   .finally(()=>{if(alive)setDetailLoading(false)});
  return()=>{alive=false;controller.abort()};
 },[selectedId,refreshId]);
 return <div className="ir85-root" aria-label="Owner Control Room member administration">
  <header className="ir85-hero">
   <div><span className="ir85-eyebrow">CONTINUANCE INSTITUTE / OWNER CLEARANCE</span>
    <h2>Member registry <em>—</em> private control</h2>
    <p>Inspect real member accounts, verified reward evidence, role grants and cosmetic settings without modifying earned history.</p>
   </div>
   <div className="ir85-hero-orbit" aria-hidden="true"><span/><i/><b/></div>
  </header>
  <div className="ir85-toolbar">
   <label className="ir85-search"><span>SEARCH VERIFIED DIRECTORY</span>
    <input type="search" value={input} onChange={e=>setInput(e.target.value)} maxLength={64} placeholder="Name, member handle, or email" aria-label="Search all ANEVUM members"/>
   </label>
   <button type="button" onClick={()=>setRefreshId(v=>v+1)} disabled={loading}>REFRESH</button>
   <button type="button" onClick={onOpenPersonnel}>MODERATOR ACCESS ↗</button>
  </div>
  <div className="ir85-stats">
   <div><span>SEARCH RESULTS</span><strong>{results?.members.length??'—'}</strong><small>{loading?'SYNCING':results?.hasMore?'MORE PAGES AVAILABLE':'CURRENT PAGE'}</small></div>
   <div><span>SECURITY DOMAIN</span><strong>OWNER</strong><small>SERVER-VERIFIED</small></div>
   <div><span>ENTITLEMENTS</span><strong>LEDGER</strong><small>NO UNVERIFIED AWARDS</small></div>
  </div>
  {error?<p className="ir85-error" role="alert">{error}</p>:null}
  {loading?<p className="ir85-state" role="status">Reading canonical account records…</p>:null}
  {!loading&&results?.members.length===0?<p className="ir85-state">No matching member accounts found.</p>:null}
  {results?.members.length?<div className="ir85-directory">
   {results.members.map(m=><button key={m.id} type="button" className={'ir85-member '+(selectedId===m.id?'is-active':'')} onClick={()=>setSelectedId(m.id)}>
    <span className="ir85-avatar" aria-hidden="true">{(m.displayName||m.name).slice(0,1).toUpperCase()}</span>
    <span className="ir85-member-copy"><strong>{m.displayName||m.name}</strong>
     <small>{m.handle?'@'+m.handle:'No public handle'} · {m.verified?'Verified email':'Pending verification'}</small></span>
    <PrivacyMark value={m.visibility}/><span className="ir85-role">{m.staffRole?m.staffRole.toUpperCase():'MEMBER'}</span>
    <span aria-hidden="true">→</span>
   </button>)}
   <div className="ir85-pager"><button type="button" onClick={()=>{setPage(x=>Math.max(0,x-1));setSelectedId(null)}} disabled={page===0||loading}>← PREVIOUS</button>
    <span>PAGE {page+1}</span><button type="button" disabled={!results.hasMore||loading} onClick={()=>{setPage(x=>x+1);setSelectedId(null)}}>NEXT →</button></div>
  </div>:null}
  {selectedId?<section className="ir85-inspection" aria-label="Member identity and recognition inspection">
   <div className="ir85-inspection-head"><div><span className="ir85-eyebrow">VERIFIED PRIVATE EVIDENCE</span><h3>{detail?.member.displayName||'Member inspection'}</h3></div>
    <button type="button" onClick={()=>{setSelectedId(null);setDetail(null)}}>CLOSE ×</button>
   </div>
   {detailLoading?<p role="status">Reading earned ledger and staff audit…</p>:null}
   {detailError?<p className="ir85-error" role="alert">{detailError}</p>:null}
   {detail?<><div className="ir85-profile-facts">
    <div><span>ACCOUNT</span><strong>{detail.member.email}</strong></div>
    <div><span>REGISTRATION</span><strong>{date(detail.member.joinedAt)}</strong></div>
    <div><span>STAFF PERMISSION</span><strong>{(detail.member.staffRole||'NONE').toUpperCase()}</strong></div>
    <div><span>CHOSEN COSMETIC AURA</span><strong>{nice(detail.member.selectedAura).toUpperCase()}</strong></div>
   </div>
   <div className="ir85-rewards">
    <RecognitionRecords label="EARNED BADGES · MEDALS · RIBBONS" rows={detail.recognition.grants} notReady="Recognition ledger is not installed."/>
    <RecognitionRecords label="MILESTONE AWARDS" rows={detail.recognition.milestones} notReady="Milestone ledger unavailable."/>
    <RecognitionRecords label="VERIFIED ROLE HALOS" rows={detail.recognition.roleBadges} notReady="Independent role-halo registry is not activated."/>
    <section className="ir85-evidence-lane"><div className="ir85-section-title"><strong>STAFF ASSIGNMENT AUDIT</strong><span>{detail.staffAudit.length} EVENTS</span></div>
     {detail.staffAudit.length?detail.staffAudit.map((a,i)=><p key={i}>{nice(a.action).toUpperCase()} · {date(a.createdAt)}</p>):<p>No recorded staff assignments.</p>}
     <button type="button" onClick={onOpenPersonnel}>OPEN PERSONNEL CONTROLS →</button>
    </section>
   </div>
   <p className="ir85-explanation">Levels and earned auras are derived from verified activity. Members select their own cosmetic aura. Institutional distinctions require independent approval; none of these visual elements provides staff access.</p>
   </>:null}
  </section>:null}
  <p className="ir85-bottom-note">Owner-only records. Server checks active grants on every request. No member accounts, XP, badges or staff permissions are modified from this screen.</p>
 </div>;
}
export function OwnerReleaseShelf(){
 const [releases,setReleases]=useState<ReleasePage|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [refreshId,setRefreshId]=useState(0);
 useEffect(()=>{
  let alive=true;const controller=new AbortController();setLoading(true);setError('');
  ownerRead<ReleasePage>('owner-releases',{},controller.signal).then(d=>{if(alive)setReleases(d)})
   .catch(e=>{if(alive)setError(e instanceof Error?e.message:'Release registry unavailable')})
   .finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false;controller.abort()};
 },[refreshId]);
 return <div className="ir85-root ir85-release-shelf" aria-label="Owner production and release review">
  <header className="ir85-hero"><div><span className="ir85-eyebrow">CONTINUANCE / REVIEW THE WORK</span>
   <h2>Release observatory <em>—</em> evidence first</h2>
   <p>Browse the real released build, genuine browser-test captures and clearly identified experimental simulations. No mockup is presented as live member staging.</p>
  </div><div className="ir85-hero-orbit" aria-hidden="true"><span/><i/><b/></div></header>
  <div className="ir85-toolbar"><span className="ir85-eyebrow">READ ONLY · NO PUBLISH CONTROLS</span>
   <button type="button" disabled={loading} onClick={()=>setRefreshId(x=>x+1)}>REFRESH INDEX</button></div>
  {loading?<p role="status" className="ir85-state">Inspecting release evidence…</p>:null}
  {error?<p role="alert" className="ir85-error">{error}</p>:null}
  <div className="ir85-release-grid">
   {releases?.releases.map(r=><article className="ir85-release" key={r.id}>
    <div className="ir85-release-top"><span className="ir85-eyebrow">{r.kind==='production'?'DEPLOYED SOURCE':r.kind==='evidence'?'REAL BUILD EVIDENCE':'ISOLATED DESIGN STUDY'}</span>
     <span className={'ir85-status ir85-status--'+r.kind}>{r.status}</span></div>
    <h3>{r.name}</h3><p>{r.summary}</p>
    <div className="ir85-release-actions">
     <a href={r.page} target="_blank" rel="noopener noreferrer">{r.kind==='simulation'?'OPEN PRIVATE LAB':'VIEW SOURCE'} ↗</a>
     <a href={r.evidence} target="_blank" rel="noopener noreferrer">REVIEW EVIDENCE ↗</a>
     {r.captures?<a href={r.captures} target="_blank" rel="noopener noreferrer">SCREENSHOTS ↗</a>:null}
    </div>
   </article>)}
  </div>
  <p className="ir85-bottom-note">{releases?.note||'Release checks are read-only.'} Future staging should run compiled application code with isolated nonproduction identities and databases.</p>
 </div>;
}
