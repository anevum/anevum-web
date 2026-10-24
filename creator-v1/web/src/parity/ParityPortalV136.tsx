import {useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {OrbitalMark} from '../components/OrbitalMark';
import {CosmicArtwork} from '../components/CosmicArtwork';
import {projectDetailPath} from '../lib/navigation';
import type {Project, Category} from '../lib/api';
import type {CosmicScene} from '../components/CosmicIllustration';

/** PARITY V136.002: new homepage composition using real approved catalogue records.
 * All orbital imagery and generic category art are illustrative, never claimed
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
  {title:'Games & worlds',detail:'Explore independent games and experiments',to:'/discover?category=games',scene:'games' as CosmicScene,tone:'violet'},
  {title:'Tools & applications',detail:'Discover useful software people are making',to:'/discover?category=tools',scene:'tools' as CosmicScene,tone:'cyan'},
  {title:'Creative works',detail:'Explore art, experiences and experiments',to:'/discover?category=creative',scene:'creative' as CosmicScene,tone:'auric'},
  {title:'Open knowledge',detail:'Explore research, learning and open source',to:'/discover?category=research',scene:'research' as CosmicScene,tone:'mint'}
];
function PublicProjectCard({project}:{project:Project}){
  const meta=types[project.category];
  return <article className={'p136-project-card p136-tone-'+meta.tone}>
    <Link to={projectDetailPath(project.id,'/')} className="p136-project-media" aria-label={'View '+project.title}>
      <CosmicArtwork scene={meta.scene} seed={project.id}/><span className="p136-project-art-note">DYNAMIC ANEVUM FIELD / NOT CREATOR COVER</span><span className="p136-kind">{meta.label}</span>
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
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();navigate(search.trim()?'/discover?q='+encodeURIComponent(search.trim()):'/discover');}
  return <div className="p136-portal" data-parity-v136="full">
    <section className="p136-hero" aria-labelledby="p136-hero-title">
      <div className="p136-hero-shade" aria-hidden="true"/>
      <div className="p136-hero-content">
        <p className="p136-hero-register">THE CONTINUANCE INSTITUTE <span> / </span> FIRST CONTACT</p>
        <h1 id="p136-hero-title">Independent worlds.<em>Made to continue.</em></h1>
        <p className="p136-hero-intro">Discover independent games, useful software and creative experiments. Explore real work, meet the people behind it, and build what comes next.</p>
        <div className="p136-hero-actions">
          <Link to="/discover" className="p136-button p136-button--primary">Explore projects <Icon name="arrow" size={20}/></Link>
          <Link to={signedIn?'/member':'/join'} className="p136-button p136-button--signal">{signedIn?'My member space':'Join the community'} <Icon name="arrow" size={18}/></Link>
        </div>
        <p className="p136-hero-disclosure">Free to explore. No account required. Creator publishing remains in testing.</p>
      </div>
      <aside className="p136-iren-console" aria-label="IREN signal and navigation">
        <div className="p136-panel-top"><span className="p136-signal-dot"/><strong>IREN</strong><span>PUBLIC SIGNAL</span></div>
        <p className="p136-iren-sub">Your companion to the Continuance Institute</p>
        <svg className="p136-iren-wave" viewBox="0 0 240 80" role="img" aria-label="Decorative signal-wave illustration, not live telemetry">
          <path d="M0 48L18 43 30 49 41 30 53 41 61 40 69 55 82 21 94 46 111 40 125 57 138 34 154 42 165 26 176 50 192 31 208 44 221 20 240 36" stroke="#7ee3ff" strokeWidth="2.2" fill="none"/>
          <path d="M0 62L30 61 53 48 72 60 100 46 132 54 157 39 188 50 215 39 240 43" stroke="#ad80fe" opacity=".7" fill="none" strokeWidth="1.6"/>
        </svg>
        <nav className="p136-iren-links" aria-label="Explore with IREN">
          <Link to="/discover"><Icon name="explore" size={16}/> Explore published work</Link>
          <Link to="/community"><Icon name="community" size={16}/> Find community discussions</Link>
          <Link to="/studio"><Icon name="create" size={16}/> See creator tools</Link>
        </nav>
        <button type="button" className="p136-iren-cta" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Open IREN <Icon name="arrow" size={17}/></button>
      </aside>
      <nav className="p136-hero-rail" aria-label="ANEVUM destinations">
        <Link to="/creators"><Icon name="people" size={21}/><span><strong>Creators</strong><small>People shaping new work</small></span></Link>
        <Link to="/community"><Icon name="community" size={21}/><span><strong>Community</strong><small>Ideas and discussions</small></span></Link>
        <Link to="/studio"><Icon name="create" size={21}/><span><strong>Creator Studio</strong><small>Tools for building</small></span></Link>
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
          <CosmicArtwork scene={item.scene} seed={item.to}/><span className="p136-passage-shade"/>
          <span className="p136-passage-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow" size={18}/>
        </Link>)}
      </div>
    </section>
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