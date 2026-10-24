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
function OrbitEnvironment(){
  const stars=Array.from({length:80},(_,i)=>({x:(i*157+31)%740,y:(i*229+47)%640,r:i%9===0?1.9:i%4===0?1.1:.65,a:i%7===0?.9:.45}));
  return <div className="p136-orbital-field" aria-hidden="true">
    <CosmicArtwork scene="hero" priority className="p136-orbital-art"/>
    <svg className="p136-orbital-svg" viewBox="0 0 740 640" focusable="false" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="p136-world-shade" cx="72%" cy="26%" r="77%">
          <stop offset="0%" stopColor="#c5eaff"/><stop offset="17%" stopColor="#3c84b4"/>
          <stop offset="42%" stopColor="#17446d"/><stop offset="74%" stopColor="#071930"/><stop offset="100%" stopColor="#030914"/>
        </radialGradient>
        <radialGradient id="p136-world-halo"><stop offset="50%" stopColor="#68caff" stopOpacity=".18"/><stop offset="84%" stopColor="#4a84d8" stopOpacity=".09"/><stop offset="100%" stopColor="#4f7cf8" stopOpacity="0"/></radialGradient>
        <linearGradient id="p136-orbit-stroke"><stop stopColor="#86e2ff" stopOpacity=".05"/><stop offset=".4" stopColor="#a4e9ff" stopOpacity=".9"/><stop offset=".66" stopColor="#f7c48b" stopOpacity=".72"/><stop offset="1" stopColor="#a187ff" stopOpacity=".10"/></linearGradient>
        <clipPath id="p136-world-clip"><circle cx="373" cy="298" r="204"/></clipPath>
        <filter id="p136-world-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
      </defs>
      <g>{stars.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#c0e9ff" opacity={s.a}/>)}</g>
      <circle cx="373" cy="300" r="294" fill="url(#p136-world-halo)"/>
      <circle cx="373" cy="298" r="211" fill="none" stroke="#8dd9ff" strokeWidth="8" opacity=".4" filter="url(#p136-world-glow)"/>
      <circle cx="373" cy="298" r="204" fill="url(#p136-world-shade)" stroke="#a3dafa" strokeWidth="1.8"/>
      <g clipPath="url(#p136-world-clip)">
        <path d="M212 157q50 18 73 10l28 24 30-17 19 22-14 31 43 18 29-10 10 26-23 27-34 4-12 42-26 5-16 44-35-12-20-44-49-10-16-45-35-14-6-44z" fill="#6e9eae" opacity=".38"/>
        <path d="M410 110q54 12 81 47l34 4 33 42-12 34-49-11-24 21-37-8-32-33-30-8z" fill="#c1dde2" opacity=".35"/>
        <path d="M471 318l58 15 10 27-26 18-9 43-44 31-21-38 10-45-21-21z" fill="#83c3b7" opacity=".28"/>
        <path d="M214 341l46-3 23 34-19 28 19 33-30 12-53-62z" fill="#91cbb4" opacity=".31"/>
        {Array.from({length:9},(_,i)=><ellipse key={i} cx="373" cy="298" rx={204-i*19} ry={62+i*10} fill="none" stroke="#b7eaff" opacity={.05+i*.007}/>)}
        {Array.from({length:17},(_,i)=><path key={i} d={'M'+(208+i*21)+' 95v410'} fill="none" stroke="#bcdeff" opacity=".04"/>)}
        <ellipse cx="422" cy="225" rx="126" ry="82" fill="#cbe9ff" opacity=".055" filter="url(#p136-world-glow)"/>
      </g>
      <ellipse cx="373" cy="298" rx="303" ry="95" transform="rotate(-19 373 298)" fill="none" stroke="url(#p136-orbit-stroke)" strokeWidth="2" className="p136-orbit-line"/>
      <ellipse cx="373" cy="298" rx="265" ry="139" transform="rotate(24 373 298)" fill="none" stroke="url(#p136-orbit-stroke)" strokeWidth="1.4" opacity=".6"/>
      <path d="M74 410q298-201 598-45" fill="none" stroke="#8fcfff" strokeWidth="1" opacity=".27"/>
      <circle cx="568" cy="194" r="6" fill="#f5c78f"/><circle cx="568" cy="194" r="14" fill="none" stroke="#f5c78f" opacity=".75"/>
      <circle cx="183" cy="419" r="5" fill="#90dffd"/><circle cx="183" cy="419" r="12" fill="none" stroke="#90dffd" opacity=".55"/>
      <path d="M373 56v39 M373 501v35 M120 298h44 M578 298h41" stroke="#8ed8ff" opacity=".35"/>
    </svg>
    <span className="p136-orbital-coordinate p136-coordinate--one">CONTINUANCE / 01</span>
    <span className="p136-orbital-coordinate p136-coordinate--two">ORBITAL SIGNAL / ANEVUM</span>
  </div>;
}
function PublicProjectCard({project}:{project:Project}){
  const meta=types[project.category];
  return <article className={'p136-project-card p136-tone-'+meta.tone}>
    <Link to={projectDetailPath(project.id,'/')} className="p136-project-media" aria-label={'View '+project.title}>
      <CosmicArtwork scene={meta.scene}/><span className="p136-project-art-note">ANEVUM CATEGORY ILLUSTRATION</span><span className="p136-kind">{meta.label}</span>
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
      <OrbitEnvironment/><div className="p136-hero-shade" aria-hidden="true"/>
      <div className="p136-hero-content">
        <p className="p136-hero-register">THE CONTINUANCE INSTITUTE <span> / </span> FIRST CONTACT</p>
        <h1 id="p136-hero-title">Independent worlds.<em>Made to continue.</em></h1>
        <p className="p136-hero-intro">Discover independent games, useful software and creative experiments. Explore real work, meet the people behind it, and build what comes next.</p>
        <div className="p136-hero-actions">
          <Link to="/discover" className="p136-button p136-button--auric">Explore projects <Icon name="arrow" size={20}/></Link>
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
      <span className="p136-hero-watermark">PARITY V136 / FOUNDATION 002</span>
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
          <CosmicArtwork scene={item.scene}/><span className="p136-passage-shade"/>
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