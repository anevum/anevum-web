import {useEffect,useMemo,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {progressionRequest,type MemberProgression} from '../lib/progression-api';
import {useResource} from '../lib/useResource';
import {useMemberProgression} from '../components/AnevumNotifications';
import {OrbitalMark} from '../components/OrbitalMark';
import {LevelEmblem} from '../components/LevelEmblem';
import {ACTIVITIES,TRACKS,EXPEDITIONS,browseActivities,summarizeProgress,type Activity} from '../lib/progression-next-model';
import './progression-next-review.css';

type View='earn'|'expeditions'|'chronicle';
const VIEWS:ReadonlyArray<{id:View;label:string}>=[{id:'earn',label:'Explore'},{id:'expeditions',label:'Guided paths'},{id:'chronicle',label:'My history'}];
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
   {earned.length>0&&<details className="px-atlas-disclosure"><summary>View my milestone map</summary><div className="px-personal-atlas"><span className="px-overline">PERSONAL ATLAS / EARNED MILESTONES ONLY</span><svg viewBox="0 0 640 260" aria-hidden="true"><circle cx="320" cy="130" r="105"/><circle cx="320" cy="130" r="65"/><circle className="px-atlas-core" cx="320" cy="130" r="12"/>{earned.map((a,i)=>{const theta=(i/earned.length)*Math.PI*2-Math.PI/2,x=320+190*Math.cos(theta),y=130+85*Math.sin(theta);return <g key={a.id}><path d={`M320 130 L${x} ${y}`}/><circle className="px-atlas-node" cx={x} cy={y} r="7"/><text x={x+14} y={y+4}>{a.name}</text></g>})}</svg><p>The same earned milestones appear in the accessible timeline below. Positions are decorative, not ranks or verified social connections.</p></div></details>}
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
function GuestRecord(){return <div className="px-guest"><div><span className="px-overline">YOUR PRIVATE RECORD</span><h2>Your progress, when you are ready.</h2><p>Sign in to see verified XP and earned milestones.</p></div><Link className="px-primary" to="/join">Sign in <span aria-hidden="true">&#8599;</span></Link></div>}

export function ProgressionNextReviewPage(){
 const {data:session}=canonicalAuthClient.useSession();
 const memberId=session?.user?.emailVerified===true?session.user.id:null;
 const [params,setParams]=useSearchParams();
 const selected=params.get('view');
 const view:View=selected==='expeditions'||selected==='chronicle'?selected:'earn';
 const [track,setTrack]=useState('starter'),[query,setQuery]=useState('');
 const [expanded,setExpanded]=useState(false),[activeExpedition,setActiveExpedition]=useState(0);
 const [detail,setDetail]=useState<Activity|null>(null),[paused,setPaused]=useState(false);
 const [hidden,setHidden]=useState(false);
 const modal=useRef<HTMLDialogElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 const matches=useMemo(()=>browseActivities(track,query),[track,query]);
 const shown=expanded||query.trim()?matches:matches.slice(0,track==='starter'?4:track==='all'?6:5);
 const hiddenCount=matches.length-shown.length;
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
 function chooseTrack(next:string){setTrack(next);setQuery('');setExpanded(false)}
 return <section className={'px-root'+(paused||hidden?' px-paused':'')} aria-labelledby="px-title">
  <p className="px-review-note">DEVELOPMENT REVIEW / No XP is granted from this preview. Proposed rates are not live rewards.</p>
  <header className="px-hero"><div className="px-hero-copy"><span className="px-overline"><OrbitalMark className="px-brand"/> THE CONTINUANCE INSTITUTE</span><h1 id="px-title">Make your mark.<br/><em>Keep exploring.</em></h1><p>Find meaningful work, contribute to it and see your progress grow.</p><div className="px-hero-actions"><button type="button" className="px-primary" onClick={()=>switchView('expeditions')}>Explore an expedition <span aria-hidden="true">&#8599;</span></button><Link to="/levels">Open my earned vault</Link></div></div>
   <div className="px-orbital" aria-hidden="true"><div className="px-orbit px-orbit-one"/><div className="px-orbit px-orbit-two"/><div className="px-orbit px-orbit-three"/><span className="px-orbital-core"><OrbitalMark/></span><span className="px-orbital-word">DISCOVER / CONTRIBUTE / CREATE</span></div>
   <button type="button" className="px-motion" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?'Resume ambient motion':'Pause ambient motion'}</button>
  </header>
  <div className="px-summary"><div className="px-record">{memberId?<VerifiedMember key={memberId} memberId={memberId}/>:<GuestRecord/>}</div><p className="px-summary-note">No streaks or purchased XP. Progress reflects verified contributions, not time spent online.</p></div>
  <nav className="px-nav" aria-label="Progression views">{VIEWS.map((v,i)=><button key={v.id} type="button" aria-current={view===v.id?'page':undefined} onClick={()=>switchView(v.id)}><small>0{i+1}</small>{v.label}</button>)}</nav>
  <div className="px-main"><header className="px-section-heading"><div><span className="px-overline">{view==='earn'?'BROWSE / CREATE / CONNECT':view==='expeditions'?'GUIDED PATHS':'YOUR PRIVATE RECORD'}</span><h2 ref={heading} tabIndex={-1}>{view==='earn'?'Choose what interests you.':view==='expeditions'?'One meaningful path at a time.':'Your milestones, clearly recorded.'}</h2></div><span className="px-small-note">EARNED, NEVER PURCHASED</span></header>

   {view==='earn'&&<>
    <div className="px-browse-intro"><p>Start with a few ideas. Choose an area to see more, or search all 19 paths.</p><span>All reward amounts below are proposed, except the separately labelled staging rule.</span></div>
    <div className="px-track-picker" role="group" aria-label="Contribution tracks">
     <button type="button" aria-pressed={track==='starter'&&!query} onClick={()=>chooseTrack('starter')}>Start here</button>
     {TRACKS.map(t=><button type="button" key={t.id} aria-pressed={track===t.id&&!query} onClick={()=>chooseTrack(t.id)}>{t.name}</button>)}
     <button type="button" aria-pressed={track==='all'&&!query} onClick={()=>chooseTrack('all')}>All paths</button>
    </div>
    <label className="px-mobile-area-picker"><span>Browse by category</span><select aria-label="Contribution category" value={track} onChange={e=>chooseTrack(e.target.value)}><option value="starter">Start here</option>{TRACKS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}<option value="all">All paths</option></select></label>
    <section className="px-list-shell" aria-label="Contribution paths">
     <div className="px-list-toolbar">
      <div><span className="px-overline">CONTRIBUTION LIBRARY / REVIEW CANDIDATE</span><h3>{query.trim()?'Search results':track==='starter'?'A good place to begin':track==='all'?'All contribution paths':TRACKS.find(t=>t.id===track)?.verb||'Contribution paths'}</h3></div>
      <label className="px-search"><span>Search all paths</span><input type="search" value={query} maxLength={100} onChange={e=>{setQuery(e.target.value);setTrack('all');setExpanded(false)}} placeholder="Try reviews or collections"/></label>
     </div>
     <p className="px-result-count" role="status">{matches.length===0?'No matching paths':(query.trim()?'Found ':track==='starter'?'Selected ':'Showing ')+shown.length+' of '+(track==='starter'&&!query?'4 suggestions':matches.length+' paths')}</p>
     {matches.length===0?<div className="px-empty"><h3>No matching paths.</h3><p>Try a shorter phrase or return to the suggested paths.</p><button type="button" onClick={()=>chooseTrack('starter')}>Clear filters</button></div>:
      <ol id="px-path-list" className="px-activity-list">{shown.map(a=><li key={a.id}><article className={'px-activity px-track-'+a.track}>
       <div className="px-activity-copy"><span className="px-entry-track">{TRACKS.find(t=>t.id===a.track)?.name}</span><h4>{a.title}</h4><p>{a.detail}</p></div>
       <div className="px-activity-action"><span className="px-entry-value">{a.xp>0?'+'+a.xp+' XP':'No XP'}</span>{a.stage==='staging-only'&&<small>Staging only</small>}<button type="button" onClick={()=>inspect(a)} aria-haspopup="dialog" aria-label={'View criteria for '+a.title}>Details <span aria-hidden="true">&#8599;</span></button></div>
      </article></li>)}</ol>}
     {hiddenCount>0&&<button type="button" className="px-more" aria-controls="px-path-list" onClick={()=>setExpanded(true)}>Show {hiddenCount} more {track==='all'?'paths':track==='starter'?'suggestions':'in this area'} <span aria-hidden="true">&#8595;</span></button>}
     {expanded&&!query.trim()&&matches.length>6&&<button type="button" className="px-more px-less" aria-controls="px-path-list" onClick={()=>setExpanded(false)}>Show fewer <span aria-hidden="true">&#8593;</span></button>}
    </section>
    <div className="px-library-tip"><div><strong>Looking for your saved projects?</strong><p>Your library is separate from XP. Keep useful work together without tracking points.</p></div><Link to="/saved">Open my library <span aria-hidden="true">&#8599;</span></Link></div>
   </>}
   {view==='expeditions'&&<>
    <p className="px-intro">Choose one direction. You can leave and come back at any time. Nothing is enrolled, completed or awarded here.</p>
    <div className="px-journey-options" role="group" aria-label="Choose an expedition">{EXPEDITIONS.map((e,i)=><button type="button" className="px-expedition" aria-pressed={activeExpedition===i} key={e.id} onClick={()=>setActiveExpedition(i)}><span className="px-journey-index">0{i+1}</span><strong>{e.title}</strong><small>{e.subtitle}</small></button>)}</div>
    <section className="px-journey-detail" aria-labelledby="px-journey-heading"><div><span className="px-overline">A SIMPLE THREE-STEP GUIDE / PROPOSAL</span><h3 id="px-journey-heading">{EXPEDITIONS[activeExpedition].title}</h3><p>{EXPEDITIONS[activeExpedition].subtitle}</p></div><ol>{EXPEDITIONS[activeExpedition].steps.map(s=><li key={s}>{s}</li>)}</ol><button type="button" onClick={()=>inspect(ACTIVITIES.find(a=>a.id===EXPEDITIONS[activeExpedition].activity)!)} aria-haspopup="dialog">Read earning criteria <span aria-hidden="true">&#8599;</span></button></section>
    <p className="px-footnote">These paths are guides, not streaks or required checklists. No expedition bonus is active.</p>
   </>}
   {view==='chronicle'&&(memberId?<VerifiedMember key={'history:'+memberId} memberId={memberId} history/>:<GuestRecord/>)}
  </div>
  <aside className="px-rewards" aria-label="Continue exploring"><span className="px-overline">YOUR WORK AND REWARDS</span><nav className="px-reward-links" aria-label="Related destinations"><Link to="/saved">Saved work &#8599;</Link><Link to="/levels">Evolution vault &#8599;</Link><Link to="/recognition">Earned awards &#8599;</Link><Link to="/member?tab=awards">Player card &#8599;</Link><button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Ask IREN &#8599;</button></nav></aside>
  <footer className="px-principles">Useful participation, not time spent. XP does not grant staff authority, stronger votes, ranking priority or cash value.</footer>
  <dialog ref={modal} className="px-dialog" aria-labelledby="px-dialog-title" onClose={close} onCancel={close} onClick={e=>{if(e.target===modal.current)close()}}><div className="px-dialog-content">{detail&&<><header><span className="px-overline">CONTRIBUTION CRITERIA / REVIEW CANDIDATE</span><button type="button" onClick={close} aria-label="Close contribution criteria">Close</button></header><h2 id="px-dialog-title">{detail.title}</h2><p>{detail.detail}</p><dl><div><dt>Proposed reward</dt><dd>{detail.xp} XP / {detail.stage==='staging-only'?'Creator V1 staging only':'not active'}</dd></div><div><dt>Required evidence</dt><dd>{detail.evidence}</dd></div><div><dt>Earning limit</dt><dd>{detail.limit}</dd></div></dl><p className="px-dialog-warning">Opening a page, clicking a button or claiming completion does not award XP. A trusted server record and independent review are required.</p><Link className="px-primary" to={detail.href} onClick={close}>Open the existing destination <span aria-hidden="true">&#8599;</span></Link></>}</div></dialog>
 </section>;
}
