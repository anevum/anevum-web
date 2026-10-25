import {useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {OrbitalMark} from '../components/OrbitalMark';
import {ProjectThumbnail} from '../components/ProjectThumbnail';
import {useLivingWorld} from './LivingWorldState';
import {CinematicArrivalV136} from './CinematicArrivalV136';
import {ContinuanceInstrumentV136017} from './ContinuanceInstrumentV136017';
import {FirstVisitClarityV136} from './FirstVisitClarityV136';
import {projectDetailPath} from '../lib/navigation';
import type {Project, Category} from '../lib/api';
import type {CosmicScene} from '../components/CosmicIllustration';

/** PARITY V136.002: new homepage composition using real approved catalogue records.
 * All spatial category instruments are native interface elements, never claimed
 * as a creator's own work or a live signal.
 */
type Props={projects:readonly Project[];catalogueState:'loading'|'ready'|'error';signedIn:boolean;verifiedCount:number|null};
const types:Record<Category,{label:string;scene:CosmicScene;tone:string}>={
  games:{label:'Games',scene:'games',tone:'violet'},
  tools:{label:'Apps & tools',scene:'tools',tone:'cyan'},
  automation:{label:'Automation',scene:'automation',tone:'cyan'},
  research:{label:'Research',scene:'research',tone:'mint'},
  creative:{label:'Creative',scene:'creative',tone:'auric'},
  learning:{label:'Learning',scene:'learning',tone:'mint'},
  libraries:{label:'Open source',scene:'libraries',tone:'cyan'},
  other:{label:'Independent work',scene:'other',tone:'violet'}
};
const passages=[
  {title:'Games & worlds',detail:'Explore independent games and experiments',to:'/discover?category=games',tone:'violet'},
  {title:'Tools & applications',detail:'Discover useful software people are making',to:'/discover?category=tools',tone:'cyan'},
  {title:'Creative works',detail:'Explore art, experiences and experiments',to:'/discover?category=creative',tone:'auric'},
  {title:'Open knowledge',detail:'Explore research, learning and open source',to:'/discover?category=research',tone:'mint'}
];
/** A reproducible ambient wave derived from public content volume, not
 * a synthetic activity graph or fabricated IREN usage signal.
 */
function publicWorldWave(count:number|null,phase=0){
 const weight=count===null?2:Math.min(19,Math.log2(1+Math.max(0,count))*2.3+2);
 return Array.from({length:45},(_,i)=>{
   const x=i*240/44;
   const carrier=Math.sin(i*0.55+phase)*weight;
   const overtone=Math.sin(i*1.37+phase*1.73)*weight*0.22;
   const y=42+carrier+overtone;
   return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);
 }).join(' ');
}
function PublicProjectCard({project}:{project:Project}){
  const meta=types[project.category];
  return <article className={'p136-project-card p136-tone-'+meta.tone}>
    <Link to={projectDetailPath(project.id,'/')} className="p136-project-media" aria-label={'View '+project.title}>
      <ProjectThumbnail kind={project.category} title={project.title} decorative/><span className="p136-project-art-note">CATEGORY INDEX / NOT CREATOR COVER</span><span className="p136-kind">{meta.label}</span>
    </Link>
    <div className="p136-project-body">
      <span className="p136-project-meta">{project.freeToUse?'FREE TO USE':'PROJECT DIRECTORY'} <span> / </span> APPROVED PUBLIC WORK</span>
      <h3><Link to={projectDetailPath(project.id,'/')}>{project.title}</Link></h3><p>{project.summary}</p>
      <div className="p136-project-foot">
        <span className="p136-project-credit">By {project.creatorName||'ANEVUM member'}</span>
        <Link to={projectDetailPath(project.id,'/')} aria-label={'Explore '+project.title}><Icon name="arrow" size={19}/></Link>
      </div>
    </div>
  </article>;
}
export function ParityPortalV136({projects,catalogueState,signedIn,verifiedCount}:Props){
  const navigate=useNavigate(),[search,setSearch]=useState('');
  const {signal}=useLivingWorld();
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();navigate(search.trim()?'/discover?q='+encodeURIComponent(search.trim()):'/discover');}
  return <div className="p136-portal" data-parity-v136="full">
    <section className="p136-hero" aria-labelledby="p136-hero-title">
      <CinematicArrivalV136/>
      <ContinuanceInstrumentV136017/>
      <div className="p136-hero-shade" aria-hidden="true"/>
      <div className="p136017-hero-upperline" aria-hidden="true">
        <span>ANEVUM / ARRIVAL</span><span>CONTINUANCE INSTITUTE</span><span>EST. 2026</span>
      </div>
      <div className="p136017-hero-worldmark" aria-hidden="true">
        <span className="p136017-worldmark-index">INSTITUTE / 001</span>
        <span className="p136017-worldmark-rule"/>
        <span>EXPLORE WHAT IS BEING MADE</span>
      </div>
      <div className="p136-hero-content">
        <p className="p136-hero-register"><span className="p136017-register-emblem" aria-hidden="true">✧</span> THE CONTINUANCE INSTITUTE <span> / </span> FIRST CONTACT</p>
        <h1 id="p136-hero-title"><span>A creative universe.</span><em>Without limits.</em></h1>
        <p className="p136-hero-intro"><strong>Build. Share. Play. Learn. Belong.</strong> Browse approved independent games, useful apps, art and experiments. Meet their makers, explore public conversations and join when ready. Publishing requires separate access and review.</p>
        <div className="p136-hero-actions" data-arrival-commands="primary">
          <Link to="/discover" className="p136-button p136-button--primary">Explore projects <Icon name="arrow" size={20}/></Link>
          <Link to={signedIn?'/member':'/join'} className="p136-button p136-button--signal">{signedIn?'My member space':'Join the community'} <Icon name="arrow" size={18}/></Link>
        </div>
        <p className="p136-hero-disclosure">Free to explore. No account required. Creator publishing remains in testing.</p>
      </div>
      <aside className="p136-iren-console" aria-label="IREN signal and navigation">
        <div className="p136017-iren-housing" aria-hidden="true"><span>IREN / COMMUNICATIONS</span><span>◉</span></div>
        <div className="p136-panel-top"><span className="p136-signal-dot"/><strong>IREN</strong><span>{signal.source==='verified'?'PUBLIC INDEX':'AMBIENT FIELD'}</span></div>
        <p className="p136-iren-sub">Your companion to the Continuance Institute</p>
        <svg className="p136-iren-wave" viewBox="0 0 240 80" role="img"
          aria-label={signal.publishedProjects===null?'Generated idle environment wave; not live telemetry':
            'Generated wave based on '+signal.publishedProjects+' approved public projects; not user telemetry'}>
          <path d={publicWorldWave(signal.publishedProjects)} stroke="#7ee3ff" strokeWidth="2.2" fill="none"/>
          <path d={publicWorldWave(signal.publishedProjects,1.6)} stroke="#ad80fe" opacity=".7" fill="none" strokeWidth="1.6"/>
        </svg>
        <nav className="p136-iren-links" aria-label="Explore with IREN">
          <Link to="/discover"><Icon name="explore" size={16}/> Explore published work</Link>
          <Link to="/community"><Icon name="community" size={16}/> Find community discussions</Link>
          <Link to="/studio"><Icon name="create" size={16}/> See creator tools</Link>
        </nav>
        <button type="button" className="p136-iren-cta" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Open IREN <Icon name="arrow" size={17}/></button>
      </aside>
      <nav className="p136-hero-rail" aria-label="ANEVUM destinations">
        <span className="p136017-rail-overline" aria-hidden="true">EXPLORE YOUR UNIVERSE <span> / </span> REAL DESTINATIONS</span>
        <Link to="/studio"><Icon name="create" size={21}/><span><strong>Create</strong><small>Build with Studio tools</small></span></Link>
        <Link to="/discover?category=games"><Icon name="games" size={21}/><span><strong>Play</strong><small>Find playable worlds</small></span></Link>
        <Link to="/discover?category=tools"><Icon name="library" size={21}/><span><strong>Build</strong><small>Explore apps and tools</small></span></Link>
        <Link to="/community"><Icon name="community" size={21}/><span><strong>Connect</strong><small>Join discussions</small></span></Link>
        <Link to="/creators"><Icon name="people" size={21}/><span><strong>Belong</strong><small>Meet real creators</small></span></Link>
      </nav>
    </section>
    <section className="p136-discover" aria-labelledby="p136-discover-title">
      <div className="p136-section-heading">
        <div><p className="p136-kicker">THE PUBLIC INDEX / DISCOVERY</p><h2 id="p136-discover-title">Discover what is being made.</h2><p>Games, tools and experiments from the verified public catalogue.</p></div>
        <Link to="/discover" className="p136-text-link">View all projects <Icon name="arrow" size={19}/></Link>
      </div>
      <div className="p136-discover-toolbar">
        <form onSubmit={submit} role="search" className="p136-index-search"><Icon name="search" size={18}/>
          <input type="search" aria-label="Search approved ANEVUM projects" placeholder="Find projects, games, tools..." value={search} onChange={event=>setSearch(event.target.value)} maxLength={100}/>
          <button type="submit">Search <Icon name="arrow" size={16}/></button></form>
        <nav aria-label="Browse by category" className="p136-category-nav">
          <Link to="/discover">All</Link><Link to="/discover?category=games">Games</Link><Link to="/discover?category=tools">Tools</Link><Link to="/discover?category=creative">Creative</Link>
        </nav>
      </div>
      {projects.length>0?<div className="p136-project-grid">{projects.slice(0,4).map(project=><PublicProjectCard key={project.id} project={project}/>)}</div>:
        <div className="p136-empty-index" role="status">
          <span className="p136-signal-dot"/>
          <div><strong>{catalogueState==='loading'?'Checking approved work':catalogueState==='error'?'The public index is temporarily unavailable':'The public network is growing'}</strong>
            <p>{catalogueState==='error'?'We could not retrieve the catalogue. Discover has the current listing.':'Explore the categories below. Approved projects appear here as creators publish them.'}</p></div>
          <Link to="/discover" className="p136-text-link">Open Discover <Icon name="arrow" size={17}/></Link>
        </div>}
      <div className="p136-passages">
        {passages.map(item=><Link key={item.title} to={item.to} className={'p136-passage p136-tone-'+item.tone}>
          <span className="p136035-category-surface" aria-hidden="true"/>
          <span className="p136-passage-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow" size={18}/>
        </Link>)}
      </div>
    </section>
    {/* Discovery stays above orientation on small screens: real work before explanations. */}
    <FirstVisitClarityV136 signedIn={signedIn}/>
    <section className="p136-next" aria-label="Continue into ANEVUM">
      <div className="p136-next-inscription"><OrbitalMark/><p>THE CONTINUANCE INSTITUTE <span> / </span> 2026</p><h2>A place for the work that comes next.</h2></div>
      <div className="p136-next-actions">
        <Link to="/studio"><Icon name="create" size={21}/><span><strong>Creator Studio</strong><small>Build and experiment with developing tools</small></span><Icon name="arrow" size={18}/></Link>
        <Link to="/community"><Icon name="community" size={21}/><span><strong>Living Community</strong><small>Find the people and conversations behind the work</small></span><Icon name="arrow" size={18}/></Link>
        <Link to={signedIn?'/member':'/join'}><Icon name="people" size={21}/><span><strong>{signedIn?'My Member Space':'Your Place in ANEVUM'}</strong><small>{signedIn?'Return to your verified member identity':'Create a free identity when you are ready'}</small></span><Icon name="arrow" size={18}/></Link>
      </div>
    </section>
    <div className="p136-index-end"><span>{verifiedCount!==null?verifiedCount+' verified public release'+(verifiedCount===1?'':'s'):'ANEVUM / PUBLIC DISCOVERY'}</span><span>CREATE / EXPLORE / CONNECT / CONTINUE</span></div>
  </div>;
}