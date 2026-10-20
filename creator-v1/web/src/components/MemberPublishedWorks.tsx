import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {requestPackageWorks,validCreatorHandle,type PackageWork,type PackageWorks} from '../lib/package-gallery';
import './member-published-works.css';

/* Creator projects follow the same public/private canonical member identity.
 * The server checks identity and public visibility on EVERY request.
 * A missing API/disabled feature renders nothing: it never fabricates releases.
 */
function WorkCard({item,owner}:{item:PackageWork;owner:boolean}){
  const [coverReady,setCoverReady]=useState(true);
  const href=item.playUrl||'/upload/v3';
  return <article className="av10-work" aria-label={item.title}>
    <div className={'av10-work-art'+(item.coverUrl&&coverReady?' av10-work-art--uploaded':'')}>
      <span className="av10-art-record" aria-hidden="true">
        <svg viewBox="0 0 100 100" role="presentation" focusable="false">
          <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".55"/>
          <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".62"/>
          <ellipse cx="50" cy="50" rx="44" ry="17" transform="rotate(-28 50 50)"
            fill="none" stroke="currentColor" strokeWidth=".9"/>
          <circle cx="50" cy="50" r="3" fill="currentColor"/>
          <path d="M50 11v78M11 50h78" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".34"/>
        </svg>
      </span>
      {item.coverUrl&&coverReady&&<img src={item.coverUrl} alt={'Creator-supplied cover for '+item.title}
        loading="lazy" decoding="async" onError={()=>setCoverReady(false)}/>}
      <span className="av10-work-plate">ANEVUM / {item.category.toUpperCase()}</span>
    </div>
    <div className="av10-work-content">
      <span className="av10-work-build">{owner?item.status==='published'?'PUBLIC RELEASE':'PRIVATE WORK':"APPROVED RELEASE"} / V{item.version}</span>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      {owner&&item.pending&&<span className="av10-work-pending">An update is awaiting your next step.</span>}
      <Link to={href} className="av10-work-action">
        {item.playUrl?'OPEN EXPERIENCE':'MANAGE PRIVATE BUILD'} <span aria-hidden="true">↗</span>
      </Link>
    </div>
  </article>;
}
export function MemberPublishedWorks({handle,owner=false}:{handle:string;owner?:boolean}){
  const [data,setData]=useState<PackageWorks|null>(null);
  useEffect(()=>{
    setData(null);
    if(!validCreatorHandle(handle))return;
    const controller=new AbortController();
    void requestPackageWorks(handle,owner,controller.signal).then(result=>{
      if(!controller.signal.aborted)setData(result);
    });
    return()=>controller.abort();
  },[handle,owner]);
  if(!data)return null;
  const list=data.projects.slice(0,12);
  return <section className="av10-work-gallery" aria-label={owner?'Your creator projects':'Approved creator releases'}>
    <header className="av10-work-heading">
      <div><span className="kicker">ANEVUM / CREATOR ARCHIVE</span>
        <h2>{owner?'Your creations.':'Made by this member.'}</h2>
        <p>{owner?'Your finished browser builds and review states share this space with your profile.':
          'Only independently reviewed published creations appear in this member’s world.'}</p></div>
      {owner&&<Link to="/upload/v3" className="av10-work-open">OPEN CREATOR UPLINK ↗</Link>}
    </header>
    {list.length>0?
      <div className="av10-work-grid">{list.map(item=><WorkCard key={item.id} item={item} owner={owner}/>)}</div>:
      <div className="av10-work-empty">
        <span aria-hidden="true">○</span>
        <p>{owner?'Your first finished browser creation will appear here. Nothing has been submitted through this uploader yet.':
          'No approved playable creations are attached to this public world yet.'}</p>
        {owner&&<Link to="/upload/v3">UPLOAD A FINISHED GAME OR APP ↗</Link>}
      </div>}
    {data.projects.length>list.length&&<Link className="av10-work-viewmore" to={owner?'/upload/v3':'/upload/v3/library'}>
      VIEW {owner?'YOUR PROJECT LIBRARY':'ALL APPROVED RELEASES'} ↗</Link>}
  </section>;
}
