import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';
import {EmailUpdatesOptIn} from '../components/EmailUpdatesOptIn';
import {readReleaseFeed,type ReleaseBulletin} from '../lib/release-bulletins';
import {markPublicReleaseSeen} from '../lib/public-release-read-state';
import {readWeeklyPublicCreations,type WeeklyPublicCreations} from '../lib/weekly-public-creations';
import '../release-updates-v026.css';
type State='loading'|'ready'|'error';
const labels:Record<ReleaseBulletin['kind'],string>={release:'Release',patch:'Patch notes',notice:'Announcement',maintenance:'Maintenance'};
export function ReleaseUpdatesPage(){
 const [state,setState]=useState<State>('loading');
 const [entries,setEntries]=useState<ReleaseBulletin[]>([]);
 const [weekly,setWeekly]=useState<WeeklyPublicCreations|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  readReleaseFeed(controller.signal).then(data=>{setEntries(data.entries);setState('ready');if(data.entries[0])markPublicReleaseSeen(data.entries[0].id)}).catch(()=>{if(!controller.signal.aborted)setState('error')});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  readWeeklyPublicCreations(controller.signal).then(setWeekly).catch(()=>{});
  return()=>controller.abort();
 },[]);
 return <div className="au26-page">
  <header className="au26-masthead"><OrbitalMark/><div><span className="au26-kicker">CONTINUANCE INSTITUTE / PUBLIC DISPATCHES</span>
   <h1>What’s new in <em>ANEVUM.</em></h1>
   <p>Verified releases, fixes, and platform changes. Published notes are public. Features still in development are never presented as shipped.</p>
   <Link to="/discover">Return to Discover</Link></div></header>
  <section className="au26-updates" aria-labelledby="au26-archive-title">
   <div className="au26-section-heading"><span className="au26-kicker">THE RELEASE ARCHIVE</span><h2 id="au26-archive-title">Latest transmissions</h2></div>
   {state==='loading'?<p role="status">Reading approved release records…</p>:state==='error'?<div role="alert"><p>The release archive is temporarily unavailable. No unpublished changes are being shown.</p><button type="button" onClick={()=>window.location.reload()}>Retry</button></div>:entries.length===0?<p>No public release records have been published yet.</p>:
   <div className="au26-entry-list">{entries.map(entry=><article key={entry.id} id={entry.id} className="au26-entry">
    <div className="au26-entry-meta"><span>{labels[entry.kind]}</span><time dateTime={entry.publishedAt}>{entry.publishedAt}</time>{entry.version&&<span>{entry.version}</span>}</div>
    <h3>{entry.title}</h3><p>{entry.summary}</p><ul>{entry.changes.map(change=><li key={change}>{change}</li>)}</ul>
    {entry.audience==='testers'&&<small>Tester-facing public update. This page does not grant tester permissions.</small>}
   </article>)}</div>}
  </section>
  {weekly&&weekly.items.length>0&&<section className="au26-weekly" aria-labelledby="au26-weekly-title">
   <div className="au26-section-heading"><span className="au26-kicker">PUBLISHED / LAST SEVEN DAYS</span>
    <h2 id="au26-weekly-title">New from the network</h2>
    <p>Recently approved public projects, not popularity rankings or promoted placements.</p></div>
   <div className="au26-weekly-grid">{weekly.items.map(item=><article key={item.id} className="au26-weekly-card">
    <span className="au26-kicker">VERIFIED PUBLIC RELEASE / {item.publishedAt.slice(0,10)}</span>
    <h3><Link to={item.url}>{item.title}</Link></h3>
    <p>{item.summary||'A new public creation from the ANEVUM network.'}</p>
    <span className="au26-weekly-author">By {item.creatorName} · @{item.creatorHandle}</span>
   </article>)}</div>
  </section>}
  <EmailUpdatesOptIn/>
 </div>;
}
