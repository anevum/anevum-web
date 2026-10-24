import {useEffect,useMemo,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {progressionRequest,type MemberProgression} from '../lib/progression-api';
import {useResource} from '../lib/useResource';
import {useMemberProgression} from '../components/AnevumNotifications';
import {OrbitalMark} from '../components/OrbitalMark';
import {LevelEmblem} from '../components/LevelEmblem';
import {ACTIVITIES,TRACKS,EXPEDITIONS,selectActivities,summarizeProgress,type Activity} from '../lib/progression-next-model';
import './progression-next-review.css';

type View='earn'|'expeditions'|'chronicle';
const VIEWS:ReadonlyArray<{id:View;label:string}>=[{id:'earn',label:'Ways to contribute'},{id:'expeditions',label:'Expeditions'},{id:'chronicle',label:'Your chronicle'}];
const readProgress=(signal:AbortSignal)=>progressionRequest<{progression:MemberProgression}>('progression',undefined,signal);
const dateLabel=(value:number)=>Number.isFinite(value)&&value>0?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value*1000)):'Date unavailable';

function VerifiedMember({memberId,history=false}:{memberId:string;history?:boolean}){
 const [retry,setRetry]=useState(0);
 const data=useResource(readProgress,[memberId,retry]);
 const {recent}=useMemberProgression();
 const progress=data.state==='ready'?summarizeProgress(data.data.progression):null;
 if(data.state==='loading')return <div className="px-member-status" role="status"><span className="px-loading-orbit" aria-hidden="true"/><p>Checking your earned record...</p><small>No sample XP or unreached artwork is shown.</small></div>;
 if(data.state==='error'||!progress)return <div className="px-member-status"><h3>Progress could not be verified.</h3><p>Your account has not been changed.</p><button type="button" onClick={()=>setRetry(n=>n+1)}>Retry progress check</button></div>;
 const p=data.data.progression;
 const earned=Array.isArray(p.awards)?p.awards.filter(a=>Number.isFinite(a.earnedAt)&&Number(a.earnedAt)>0):[];
 if(history){
  const ids=new Set(earned.map(a=>a.id));
  const visible=recent.filter(n=>n.kind==='level'?Number.isInteger(n.level)&&Number(n.level)<=progress.level:n.award&&ids.has(n.award));
  return <section className="px-history" aria-labelledby="px-history-title"><span className="px-overline">PRIVATE / VERIFIED RECORD</span><h2 id="px-history-title">What you have made possible.</h2><p>Your earned milestones and recent eligible signals. This is not a complete XP ledger export.</p>
   {earned.length>0&&<div className="px-personal-atlas"><span className="px-overline">PERSONAL ATLAS / EARNED MILESTONES ONLY</span><svg viewBox="0 0 640 260" aria-hidden="true"><circle cx="320" cy="130" r="105"/><circle cx="320" cy="130" r="65"/><circle className="px-atlas-core" cx="320" cy="130" r="12"/>{earned.map((a,i)=>{const theta=(i/earned.length)*Math.PI*2-Math.PI/2,x=320+190*Math.cos(theta),y=130+85*Math.sin(theta);return <g key={a.id}><path d={`M320 130 L${x} ${y}`}/><circle className="px-atlas-node" cx={x} cy={y} r="7"/><text x={x+14} y={y+4}>{a.name}</text></g>})}</svg><p>The same earned milestones appear in the accessible timeline below. Positions are decorative, not ranks or verified social connections.</p></div>}
   {earned.length===0?<div className="px-empty"><h3>Your chronicle is still beginning.</h3><p>No earned milestones were returned by the server. Your next contribution does not have to be a large one.</p><Link to="/discover">Discover real work</Link></div>:<ol className="px-timeline">{earned.map(a=><li key={a.id}><span aria-hidden="true" className="px-timeline-dot"/><time>{dateLabel(Number(a.earnedAt))}</time><h3>{a.name}</h3><p>{a.detail}</p><small>{a.xp} XP / recorded milestone</small></li>)}</ol>}
   {visible.length>0&&<details className="px-signals"><summary>Recent eligible transmissions ({visible.length})</summary>{visible.map(n=><p key={n.id}>{n.title} <small>{dateLabel(n.createdAt)}</small></p>)}</details>}
   <Link to="/member?tab=awards">Open your earned awards and player card</Link>
  </section>;
 }
 return <div className="px-member-ready"><div className="px-current"><LevelEmblem level={progress.level} size={76}/><div><span className="px-overline">YOUR VERIFIED EVOLUTION</span><strong>Level {progress.level}</strong><small>{progress.xp.toLocaleString()} earned XP</small></div></div>
  <progress value={progress.percent} max={100} aria-label="Verified Evolution progress"/>
  <p>{progress.next===null?'Current Evolution series complete.':`${(progress.next-progress.xp).toLocaleString()} XP to your next undisclosed discovery.`}</p>
  <div className="px-member-links"><Link to="/levels">Earned specimens</Link><Link to="/recognition">Your recognition</Link></div>
 </div>;
}
function GuestRecord(){return <div className="px-guest"><span className="px-overline">YOUR CONTINUANCE / PRIVATE</span><h2>A record that belongs to you.</h2><p>Sign in to see your actual earned XP, milestones and discoveries. Nothing here assumes a level or invents an award.</p><Link className="px-primary" to="/join">Join or sign in <span aria-hidden="true">&#8599;</span></Link></div>}

export function ProgressionNextReviewPage(){
 const {data:session}=canonicalAuthClient.useSession();
 const memberId=session?.user?.emailVerified===true?session.user.id:null;
 const [params,setParams]=useSearchParams();
 const selected=params.get('view');
 const view:View=selected==='expeditions'||selected==='chronicle'?selected:'earn';
 const [track,setTrack]=useState('all'),[query,setQuery]=useState('');
 const [detail,setDetail]=useState<Activity|null>(null),[paused,setPaused]=useState(false);
 const [hidden,setHidden]=useState(false);
 const modal=useRef<HTMLDialogElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 const shown=useMemo(()=>selectActivities(track,query),[track,query]);
 const heading=useRef<HTMLHeadingElement>(null);
 const lastView=useRef(view);
 useEffect(()=>{
  const visibility=()=>setHidden(document.visibilityState!=='visible');visibility();
  document.addEventListener('visibilitychange',visibility);
  return()=>document.removeEventListener('visibilitychange',visibility);
 },[]);
 useEffect(()=>{if(lastView.current!==view){heading.current?.focus({preventScroll:true});lastView.current=view}},[view]);
 useEffect(()=>{if(detail&&!modal.current?.open)modal.current?.showModal();if(!detail&&modal.current?.open)modal.current.close()},[detail]);
 function inspect(a:Activity){returnFocus.current=document.activeElement as HTMLElement;setDetail(a)}
 function close(){setDetail(null);returnFocus.current?.focus({preventScroll:true})}
 function switchView(next:View){const p=new URLSearchParams(params);p.set('view',next);setParams(p)}
 return <section className={'px-root'+(paused||hidden?' px-paused':'')} aria-labelledby="px-title">
  <p className="px-review-note">DEVELOPMENT REVIEW / No XP is granted from this preview. Proposed rates are not live rewards.</p>
  <header className="px-hero"><div className="px-hero-copy"><span className="px-overline"><OrbitalMark className="px-brand"/> THE CONTINUANCE INSTITUTE</span><h1 id="px-title">Leave a signal.<br/><em>Become part of the story.</em></h1><p>Discover something worthwhile. Help it grow. Build a lasting record of what you contribute to ANEVUM.</p><div className="px-hero-actions"><button type="button" className="px-primary" onClick={()=>switchView('expeditions')}>Explore an expedition <span aria-hidden="true">&#8599;</span></button><Link to="/levels">Open my earned vault</Link></div></div>
   <div className="px-orbital" aria-hidden="true"><div className="px-orbit px-orbit-one"/><div className="px-orbit px-orbit-two"/><div className="px-orbit px-orbit-three"/><span className="px-orbital-core"><OrbitalMark/></span><span className="px-orbital-word">DISCOVER / CONTRIBUTE / CREATE</span></div>
   <button type="button" className="px-motion" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?'Resume ambient motion':'Pause ambient motion'}</button>
  </header>
  <div className="px-summary"><div className="px-summary-copy"><span className="px-overline">PROGRESS WITH A PURPOSE</span><h2>Not a daily obligation.<br/>A world worth returning to.</h2><p>Permanent discoveries. Useful contributions. No bought XP, streak penalties or rewards for staying online.</p></div><div className="px-record">{memberId?<VerifiedMember key={memberId} memberId={memberId}/>:<GuestRecord/>}</div></div>
  <nav className="px-nav" aria-label="Progression views">{VIEWS.map((v,i)=><button key={v.id} type="button" aria-current={view===v.id?'page':undefined} onClick={()=>switchView(v.id)}><small>0{i+1}</small>{v.label}</button>)}</nav>
  <div className="px-main"><header className="px-section-heading"><div><span className="px-overline">{view==='earn'?'01 / CONTRIBUTION PATHS':view==='expeditions'?'02 / CHOOSE YOUR DIRECTION':'03 / YOUR PRIVATE RECORD'}</span><h2 ref={heading} tabIndex={-1}>{view==='earn'?'Find your kind of contribution.':view==='expeditions'?'One meaningful thing at a time.':'Your continuance, recorded.'}</h2></div><span className="px-small-note">EARNED, NEVER PURCHASED</span></header>
   {view==='earn'&&<><div className="px-tools"><div className="px-track-picker" role="group" aria-label="Contribution tracks"><button type="button" aria-pressed={track==='all'} onClick={()=>setTrack('all')}>All paths</button>{TRACKS.map(t=><button type="button" key={t.id} aria-pressed={track===t.id} onClick={()=>setTrack(t.id)}>{t.name}</button>)}</div><label className="px-search"><span>Find a contribution</span><input type="search" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)} placeholder="Reviews, original work, accessibility..."/></label></div>
    <p className="px-result-count" role="status">{shown.length} contribution {shown.length===1?'path':'paths'} / proposed earning catalog</p>
    {shown.length===0?<div className="px-empty"><h3>No matching paths.</h3><p>Try another phrase or explore all four tracks.</p><button type="button" onClick={()=>{setTrack('all');setQuery('')}}>Clear filters</button></div>:<div className="px-activity-grid">{shown.map((a,i)=><article className={'px-activity px-track-'+a.track} key={a.id}><div className="px-card-meta"><span>{a.track.toUpperCase()}</span><small>{String(i+1).padStart(2,'0')}</small></div><h3>{a.title}</h3><p>{a.detail}</p><footer><div className="px-xp"><strong>{a.xp>0?`+${a.xp}`:'0'} <small>XP</small></strong><span>{a.stage==='staging-only'?'Existing staging rule':a.xp===0?'No XP proposed':'Proposed / inactive'}</span></div><button type="button" onClick={()=>inspect(a)} aria-haspopup="dialog" aria-label={'View criteria for '+a.title}>Criteria <span aria-hidden="true">&#8599;</span></button></footer></article>)}</div>}
   </>}
   {view==='expeditions'&&<><p className="px-intro">Choose a direction, not a checklist you must finish today. These are proposed guided paths; no enrollment, completion or award is recorded here.</p><div className="px-expeditions">{EXPEDITIONS.map((e,i)=>{const a=ACTIVITIES.find(a=>a.id===e.activity)!;return <article className="px-expedition" key={e.id}><div className={'px-expedition-art px-expedition-'+e.id} aria-hidden="true"><span>0{i+1}</span><i/><i/><i/></div><div className="px-expedition-body"><span className="px-overline">OPTIONAL EXPEDITION / PROPOSAL</span><h3>{e.title}</h3><p>{e.subtitle}</p><ol>{e.steps.map(s=><li key={s}>{s}</li>)}</ol><button type="button" onClick={()=>inspect(a)} aria-haspopup="dialog">Review the contribution criteria <span aria-hidden="true">&#8599;</span></button></div></article>})}</div><p className="px-footnote">No extra expedition bonus is active. A future completion reward must not duplicate the underlying contribution.</p></>}
   {view==='chronicle'&&(memberId?<VerifiedMember key={'history:'+memberId} memberId={memberId} history/>:<GuestRecord/>)}
  </div>
  <aside className="px-rewards"><div><span className="px-overline">YOUR REWARDS / NOT A PUBLIC PREVIEW GALLERY</span><h2>Discovery should still feel like discovery.</h2><p>Earned specimens, badges, ribbons and medals remain in your verified vault. Future artwork is not revealed here. New personal-atlas and cosmetic rewards are design proposals, not entitlements.</p></div><div className="px-reward-links"><Link to="/levels">Evolution vault <span aria-hidden="true">&#8599;</span></Link><Link to="/recognition">Earned recognition <span aria-hidden="true">&#8599;</span></Link><Link to="/member?tab=awards">Player card studio <span aria-hidden="true">&#8599;</span></Link><button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Ask IREN for guidance <span aria-hidden="true">&#8599;</span></button></div></aside>
  <footer className="px-principles">Useful participation, not time spent. XP does not grant staff authority, stronger votes, ranking priority or cash value.</footer>
  <dialog ref={modal} className="px-dialog" aria-labelledby="px-dialog-title" onClose={close} onCancel={close} onClick={e=>{if(e.target===modal.current)close()}}><div className="px-dialog-content">{detail&&<><header><span className="px-overline">CONTRIBUTION CRITERIA / REVIEW CANDIDATE</span><button type="button" onClick={close} aria-label="Close contribution criteria">Close</button></header><h2 id="px-dialog-title">{detail.title}</h2><p>{detail.detail}</p><dl><div><dt>Proposed reward</dt><dd>{detail.xp} XP / {detail.stage==='staging-only'?'Creator V1 staging only':'not active'}</dd></div><div><dt>Required evidence</dt><dd>{detail.evidence}</dd></div><div><dt>Earning limit</dt><dd>{detail.limit}</dd></div></dl><p className="px-dialog-warning">Opening a page, clicking a button or claiming completion does not award XP. A trusted server record and independent review are required.</p><Link className="px-primary" to={detail.href} onClick={close}>Open the existing destination <span aria-hidden="true">&#8599;</span></Link></>}</div></dialog>
 </section>;
}
