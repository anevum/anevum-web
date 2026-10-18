import {Link,useParams} from 'react-router-dom';
import {CompactMemberIdentity} from '../components/CompactMemberIdentity';
import {useResource} from '../lib/useResource';
import {
 readPublicCreations,readPublicCreation,CreationsUnavailable,
 type PublicCreation
} from '../lib/creator-creations-api';
import './creation-institute-v071.css';

const date=(seconds:number)=>new Intl.DateTimeFormat('en-US',{
 year:'numeric',month:'short',day:'numeric',timeZone:'UTC'
}).format(new Date(seconds*1000));
function NotAvailable({detail=false}:{detail?:boolean}){
 return <section className="av71-unavailable" role="status">
  <span className="av71-eyebrow">CONTINUANCE INSTITUTE / PUBLIC RECORDS</span>
  <h1>{detail?'THIS CREATION IS NOT PUBLIC.':'THE PUBLIC CREATION ARCHIVE IS CLOSED.'}</h1>
  <p>{detail?'The record may not exist, may be private, or may have been withdrawn by its creator or moderators.':'ANEVUM has not activated independently reviewed publication records. Private Studio uploads remain private; no sample work is substituted.'}</p>
  <Link to="/discover">RETURN TO DISCOVERY ↗</Link>
 </section>;
}
function CreationCard({item}:{item:PublicCreation}){
 const link='/creations/'+item.id;
 return <article className="av71-card">
  <Link to={link} className="av71-card-art" aria-label={'Open verified public creation '+item.title}>
   <span className="av71-art-orb" aria-hidden="true"><i/><i/><i/></span>
   <span className="av71-card-category">{item.category.toUpperCase()}</span>
   <span className="av71-card-art-notice">ORIGINAL WORK / EXTERNAL LINK</span>
  </Link>
  <div className="av71-card-body">
   <span className="av71-card-serial">{date(item.publishedAt)} · INSTITUTIONAL RECORD</span>
   <h2><Link to={link}>{item.title}</Link></h2>
   <p>{item.summary}</p>
   <CompactMemberIdentity member={item.creator}
    href={'/@'+item.handle} size="compact" className="av71-creator-card"/>
   <div className="av71-card-meta">
    <span>{item.freeToUse?'LISTED FREE':'CHECK CREATOR TERMS'}</span>
    <Link to={link}>VIEW CREATION <span aria-hidden="true">↗</span></Link>
   </div>
  </div>
 </article>;
}
export function CanonicalCreationsPage(){
 const data=useResource(signal=>readPublicCreations(signal),[]);
 const closed=data.state==='error'&&data.error instanceof CreationsUnavailable&&data.error.status===404;
 if(closed)return <NotAvailable/>;
 return <main className="av71-archive" aria-labelledby="av71-archive-title">
  <header className="av71-archive-hero">
   <span className="av71-eyebrow">ANEVUM / CONTINUANCE INSTITUTE / PUBLIC CREATIONS</span>
   <h1 id="av71-archive-title">THE MAKERS’ <em>ATLAS.</em></h1>
   <p>An archive of independently reviewed works. The art belongs to its creators. Every listing leads to an external source or demonstration; private uploads never appear here.</p>
   <nav aria-label="Archive context">
    <Link to="/studio">SUBMIT A CREATION ↗</Link>
    <Link to="/recognition">RECOGNITION ARCHIVE ↗</Link>
   </nav>
   <span className="av71-orbit-sheen" aria-hidden="true"/>
  </header>
  {data.state==='loading'&&<p className="av71-progress" role="status">VERIFYING THE PUBLIC RELEASE LEDGER…</p>}
  {data.state==='error'&&<p className="av71-progress" role="alert">The verified creation ledger could not be retrieved. No substitute records are being displayed.</p>}
  {data.state==='ready'&&<section className="av71-archive-results" aria-label="Reviewed creations">
   <div className="av71-archive-bar"><span>01 / VERIFIED PUBLICATIONS</span><strong>{data.data.length} RELEASE{data.data.length===1?'':'S'} LISTED</strong></div>
   {data.data.length===0?<div className="av71-empty"><h2>THE FIRST WORK IS AHEAD.</h2><p>No works have completed independent public release. Be the first to submit original external work through Creator Studio.</p><Link to="/studio">OPEN CREATOR STUDIO ↗</Link></div>:
    <div className="av71-grid">{data.data.map(item=><CreationCard key={item.id} item={item}/>)}</div>}
  </section>}
  <footer className="av71-footnote">PUBLIC CATALOGUE / EXTERNAL METADATA ONLY · PRIVATE ASSETS NOT HOSTED OR EXECUTED</footer>
 </main>;
}
export function CanonicalCreationDetailPage(){
 const {creationId=''}=useParams<{creationId:string}>();
 const data=useResource(signal=>readPublicCreation(creationId,signal),[creationId]);
 if(data.state==='loading')return <section className="av71-unavailable" role="status">VERIFYING CREATION EVIDENCE…</section>;
 if(data.state==='error')return <NotAvailable detail/>;
 const x=data.data;
 return <main className="av71-archive av71-detail" aria-labelledby="av71-detail-heading">
  <nav className="av71-breadcrumb"><Link to="/creations">← PUBLIC ATLAS</Link><span> / {x.category.toUpperCase()} / VERIFIED WORK</span></nav>
  <header className="av71-detail-header">
   <span className="av71-eyebrow">PUBLIC CREATION / {x.category.toUpperCase()} / {date(x.publishedAt)}</span>
   <h1 id="av71-detail-heading">{x.title}</h1>
   <p>{x.summary}</p>
  </header>
  <div className="av71-detail-grid">
   <article className="av71-detail-work">
    <div className="av71-detail-art" aria-hidden="true"><span className="av71-art-orb"><i/><i/><i/></span><span>CONTINUANCE / {x.category.toUpperCase()}</span></div>
    <section className="av71-detail-panel">
     <span className="av71-eyebrow">ORIGINAL RECORD / EXTERNAL HOST</span>
     <h2>Explore the creator’s work.</h2>
     <p>ANEVUM records the independently reviewed publication and its authorship. The actual artwork or software is hosted outside ANEVUM. The external website is operated under its own terms.</p>
     <div className="av71-detail-actions">
      {x.demoUrl&&<a href={x.demoUrl} target="_blank" rel="noopener noreferrer nofollow">VISIT EXTERNAL DEMO ↗</a>}
      {x.sourceUrl&&<a href={x.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">EXPLORE ORIGINAL SOURCE ↗</a>}
     </div>
     <small>External sites are not sandboxed or endorsed as secure. Review their permissions and terms independently.</small>
    </section>
   </article>
   <aside className="av71-detail-aside">
    <section className="av71-detail-panel">
     <span className="av71-eyebrow">AUTHOR / VERIFIED PUBLIC IDENTITY</span>
     <CompactMemberIdentity member={x.creator}
      href={'/@'+x.handle} size="featured"/>
     <p>See this creator’s public world, selected earned badges, current Evolution level and personalized aura wherever disclosed.</p>
     <Link className="av71-aside-link" to={'/@'+x.handle}>ENTER CREATOR WORLD ↗</Link>
    </section>
    <section className="av71-detail-panel">
     <span className="av71-eyebrow">PUBLIC LICENSE / DISCLOSURE</span>
     <dl><dt>LICENSE</dt><dd>{x.license||'NOT PROVIDED'}</dd>
      <dt>ACCESS</dt><dd>{x.freeToUse?'CREATOR LISTED FREE':'CHECK EXTERNAL TERMS'}</dd>
      <dt>PUBLICATION</dt><dd>{date(x.publishedAt)}</dd>
      <dt>STORAGE</dt><dd>EXTERNAL LINKS ONLY</dd></dl>
    </section>
   </aside>
  </div>
 </main>;
}
