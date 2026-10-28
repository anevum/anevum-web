import {useEffect,useState,type FormEvent,type KeyboardEvent} from 'react';
import {Link} from 'react-router-dom';
import {CosmicArtwork} from '../components/CosmicArtwork';
import {Icon} from '../components/Icons';
import {ProjectCard} from '../components/ProjectCard';
import {WorkCard} from '../components/CreatorPackageGallery';
import {PageNav} from '../components/PageNav';
import {ErrorState,LoadingState} from '../components/States';
import type {Category,Project} from '../lib/api';
import type {CreatorPackageCard} from '../lib/creator-package-gallery-v010';
import type {CosmicScene} from '../components/CosmicIllustration';
import './parity-discover-v136.css';
import {ArtifactLensV136,type ArtifactSelection} from './ArtifactLensV136';

/**
 * PARITY V136.004 / Discover. The original DiscoverPage continues to own
 * URL params, public-only endpoints, cursor pagination, package visibility
 * and server-backed catalogue states. This is presentation, not a data fork.
 * Category interface panels never represent creator-uploaded covers.
 */
type Channel={id:Category;label:string;description:string;mark:string};
type ResourceState='loading'|'ready'|'error';
type Layout='covers'|'compact';
export type ParityDiscoverProps={
  channels:readonly Channel[];
  category:string;
  activeLabel:string|null;
  query:string;
  cursor:string;
  freeOnly:boolean;
  draft:string;
  onDraft:(next:string)=>void;
  onSearch:(event:FormEvent)=>void;
  onSearchValue:(submitted:string)=>void;
  onCategory:(next:string)=>void;
  onToggleFree:()=>void;
  view:Layout;
  onView:(next:Layout)=>void;
  resourceState:ResourceState;
  packageState:ResourceState;
  packagesInScope:boolean;
  packagesCount:number;
  packageProjects:readonly CreatorPackageCard[];
  legacyProjects:readonly Project[];
  shown:number;
  resultsReady:boolean;
  emptyVerified:boolean;
  current:string;
  params:URLSearchParams;
  nextCursor:string|null;
};

const scenes:Record<Category,CosmicScene>={
  games:'games',tools:'tools',creative:'creative',libraries:'libraries',
  research:'research',learning:'learning',automation:'automation',other:'other'
};
const featured:Category[]=['games','tools','creative','research'];

/** Directional focus follows the actual responsive card positions: the same
 * four gateways work with Tab, arrows and assistive technology without a
 * second, canvas-only focus tree. Arrow keys move only within this rail.
 */
function focusNearestWorld(event:KeyboardEvent<HTMLButtonElement>){
  const axis=event.key;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(axis))return;
  const current=event.currentTarget;
  const rail=current.closest('.p136-discover-featured');
  if(!rail)return;
  const rect=current.getBoundingClientRect();
  const sourceX=rect.left+rect.width/2,sourceY=rect.top+rect.height/2;
  const options=Array.from(rail.querySelectorAll<HTMLButtonElement>('.p136-discover-world'))
    .filter(button=>button!==current&&!button.disabled)
    .map(button=>{
      const box=button.getBoundingClientRect();
      const dx=box.left+box.width/2-sourceX,dy=box.top+box.height/2-sourceY;
      const primary=axis==='ArrowLeft'?-dx:axis==='ArrowRight'?dx:axis==='ArrowUp'?-dy:dy;
      const cross=axis==='ArrowLeft'||axis==='ArrowRight'?Math.abs(dy):Math.abs(dx);
      return {button,primary,cross,score:primary+cross*2};
    })
    .filter(item=>item.primary>12&&item.cross<=item.primary*2.2)
    .sort((a,b)=>a.score-b.score);
  if(!options.length)return;
  event.preventDefault();
  options[0].button.focus();
  options[0].button.scrollIntoView({block:'nearest',inline:'nearest'});
}


export function ParityDiscoverV136(props:ParityDiscoverProps){
  const {
    channels,category,activeLabel,query,cursor,freeOnly,draft,onDraft,onSearch,onSearchValue,
    onCategory,onToggleFree,view,onView,resourceState,packageState,packagesInScope,
    packagesCount,packageProjects,legacyProjects,shown,resultsReady,emptyVerified,
    current,params,nextCursor
  }=props;
  const [inspected,setInspected]=useState<ArtifactSelection|null>(null);
  // Route/filter changes invalidate the local inspection, never the data API.
  useEffect(()=>setInspected(null),[current]);
  const filtered=Boolean(query||category||cursor||freeOnly);
  const clearHref=view==='compact'?'/discover?view=list':'/discover';
  const countLabel=resourceState==='ready'?'APPROVED PROJECT CATALOGUE':packagesInScope&&packageState==='ready'?'AVAILABLE BROWSER RELEASES':'READING THE PUBLIC INDEX';
  return <div data-iren-anchor="discover" className="portal-discover av73-discover p136-discovery" data-parity-discover="v136.004" data-discovery-phase="v136.026">
    <section className="p136-discover-hero" aria-labelledby="p136-discover-title">
      <div className="p136-discover-hero-grid" aria-hidden="true"/>
      <div className="p136-discover-hero-copy">
        <p className="p136-discover-register"><span className="p136-discover-signal"/> ANEVUM <span className="p136-register-break">/</span> APPROVED PUBLIC WORK</p>
        <h1 id="p136-discover-title">{activeLabel?<>Discover <em>{activeLabel.toLowerCase()}.</em></>:<>Discover real <em>independent work.</em></>}</h1>
        <p>Games, software and creative work that have been approved for public release. Search the real catalogue; unpublished projects remain private.</p>
        <div className="p136-discover-hero-actions">
          <a className="p136-discover-action-primary" href="#p136-discover-search">Explore the index <Icon name="arrow" size={19}/></a>
          <Link className="p136-discover-action-quiet" to="/studio">Open Creator Studio <Icon name="create" size={17}/></Link>
        </div>
      </div>
      <aside className="p136-discover-readout" aria-label="Public discovery information">
        <header><span className="p136-discover-signal"/> <strong>ANEVUM / INDEX</strong><span>PUBLIC</span></header>
        <div className="p136-discover-readout-inner">
          <span>01 / INDEPENDENT CREATION</span>
          <strong>Real releases.<br/>No placeholders.</strong>
          <p>Browse freely. Creator publishing is still in testing; only approved releases appear in the public index.</p>
        </div>
        <div className="p136-discover-readout-foot"><span>EXPLORE / CONNECT / CONTINUE</span><Icon name="explore" size={18}/></div>
      </aside>
      <p className="p136-discover-art-note">REAL PUBLIC CATALOGUE / NO PAID PLACEMENT</p>
    </section>

    <div className="p136-discover-main">
      <section className="p136-discover-command" id="p136-discover-search" aria-label="Search and refine published projects">
        <div className="p136-discover-command-top">
          <div><span className="p136-discover-kicker">THE PUBLIC INDEX / 001</span><h2>Find your next discovery.</h2></div>
          <Link to="/guide" className="p136-discover-helper">How publishing works <Icon name="arrow" size={16}/></Link>
        </div>
        <form role="search" action="/discover" method="get" onSubmit={onSearch} className="p136-discover-search-form">
          <label htmlFor="p136-project-query" className="visually-hidden">Search published projects</label>
          <Icon name="search" size={22}/>
          <input id="p136-project-query" name="q" type="search" maxLength={100} value={draft}
            onChange={event=>onDraft(event.target.value)}
            onKeyDown={event=>{
              // Commit before the browser can perform a document-navigation GET
              // if the ViewTransition tree has an interrupted submit boundary.
              if(event.key==='Enter'&&!event.nativeEvent.isComposing){
                event.preventDefault();onSearchValue(event.currentTarget.value);
              }
            }}
            placeholder="Search projects..." />
          {view==='compact'&&<input type="hidden" name="view" value="list"/>}
          {category&&<input type="hidden" name="category" value={category}/>}
          {freeOnly&&<input type="hidden" name="free" value="1"/>}
          <button type="submit" aria-label="Search published projects" onClick={event=>{
            event.preventDefault();
            const field=event.currentTarget.form?.elements.namedItem("q") as HTMLInputElement|null;
            onSearchValue(field?.value??draft);
          }}>Search index <Icon name="arrow" size={17}/></button>
        </form>
        <div className="p136-discover-command-bottom">
          <div className="p136-discover-availability" role="group" aria-label="Filter by creator-declared free access">
            <span>ACCESS</span>
            <button type="button" onClick={onToggleFree} aria-pressed={freeOnly}
              aria-describedby="p136-free-disclosure" className={freeOnly?'is-selected':''}>Marked free <span aria-hidden="true">{freeOnly?'✓':'+'}</span></button>
            <small id="p136-free-disclosure">Creator-declared, not an independent price check.</small>
          </div>
          {filtered&&<Link to={clearHref} className="p136-discover-reset">Clear filters <Icon name="close" size={14}/></Link>}
        </div>
      </section>

      <section className="p136-discover-categories" aria-labelledby="p136-discover-categories-title">
        <header className="p136-discover-section-heading">
          <div><span className="p136-discover-kicker">WORLDS / BY DISCIPLINE</span><h2 id="p136-discover-categories-title">Choose a direction.</h2></div>
          <p>Each gateway filters actual published releases.</p>
        </header>
        <div className="p136-discover-featured">
          {featured.map((id,index)=>{
            const item=channels.find(ch=>ch.id===id);
            if(!item)return null;
            return <button type="button" key={id} className={'p136-discover-world p136-discover-world--'+id+(category===id?' is-active':'')}
              aria-pressed={category===id} aria-label={item.label+' '+item.description}
              onClick={()=>onCategory(id)} onKeyDown={focusNearestWorld}>
              <CosmicArtwork scene={scenes[id]}/>
              <span className="p136-discover-world-shade" aria-hidden="true"/>
              <span className="p136-discover-world-top">FIELD / 0{index+1}<Icon name="arrow" size={17}/></span>
              <span className="p136-discover-world-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="p136-discover-world-art-note">BROWSE / CATEGORY</span>
            </button>;
          })}
        </div>
        <nav className="p136-discover-category-nav" aria-label="Filter by project category">
          <button type="button" onClick={()=>onCategory('')} aria-pressed={!category} className={!category?'is-active':''}>All work</button>
          {channels.map(ch=><button type="button" key={ch.id} aria-pressed={category===ch.id}
            className={category===ch.id?'is-active':''} onClick={()=>onCategory(ch.id)}>{ch.label}</button>)}
        </nav>
      </section>

      <section className="p136-discover-catalogue" id="p136-index" aria-labelledby="p136-index-heading">
        <header className="p136-discover-result-head">
          <div><span className="p136-discover-kicker">{countLabel}{freeOnly?' / MARKED FREE':''}</span>
            <h2 id="p136-index-heading">{query?'Search results':activeLabel?activeLabel+' releases':'Published worlds & work'}</h2>
            {query&&<p className="p136-discover-query">Searching for “{query}”</p>}
            {resultsReady&&<p className="p136-discover-count" role="status">{shown} approved {shown===1?'release':'releases'} on this page</p>}
          </div>
          <div className="p136-discover-layout-switch" role="group" aria-label="Choose project layout">
            <button type="button" aria-pressed={view==='covers'} className={view==='covers'?'is-active':''} onClick={()=>onView('covers')}><Icon name="explore" size={15}/> Grid</button>
            <button type="button" aria-pressed={view==='compact'} className={view==='compact'?'is-active':''} onClick={()=>onView('compact')}>List</button>
          </div>
        </header>
        {resourceState==='loading'&&<LoadingState label="Reading the live project catalogue"/>}
        {resourceState==='error'&&<ErrorState title={packageProjects.length?'PART OF THE CATALOGUE COULD NOT LOAD':'THE PUBLIC CATALOGUE COULD NOT LOAD'}
          detail="Published project data is temporarily unavailable. No sample projects were substituted."/>}
        {packagesInScope&&packageState==='loading'&&<p className="p136-discover-status" role="status">Checking approved browser uploads…</p>}
        {packagesInScope&&packageState==='error'&&<p className="p136-discover-status" role="status">Uploaded browser releases are temporarily unavailable.</p>}
        {resultsReady&&shown>0&&<div data-layout={view==='compact'?'list':'grid'} className={'p136-discover-results'+(view==='compact'?' p136-discover-results--compact':'')}>
          {packageProjects.map(project=><WorkCard key={'package:'+project.id} work={project} mode="public" compact={view==='compact'} onInspect={work=>setInspected({kind:'package',work})}/>)}
          {legacyProjects.map(project=><ProjectCard key={'catalogue:'+project.id} project={project} returnTo={current} presentation={view==='compact'?'editorial':'visual'} onInspect={project=>setInspected({kind:'project',project})}/>)}
        </div>}
        {emptyVerified&&<div className="p136-discover-empty" role="status">
          <span className="p136-discover-empty-orbit" aria-hidden="true">◇</span>
          <div><span className="p136-discover-kicker">A REAL INDEX / NO FABRICATED RESULTS</span>
            <h3>{cursor?'No additional releases on this page.':filtered?'No matching projects yet.':'No approved projects yet.'}</h3>
            <p>Try a different search or category. Only approved public work is listed; private drafts stay private.</p>
            <div className="p136-discover-empty-actions"><Link to={clearHref}>Explore all work</Link><Link to="/guide">Read the field guide</Link></div>
          </div>
        </div>}
        {packagesInScope&&packagesCount===100&&<p className="p136-discover-status">Browser upload search covers the latest 100 approved releases.</p>}
        {resourceState==='ready'&&<PageNav route="/discover" search={params} nextCursor={nextCursor} label="Project catalogue"/>}
      </section>
      <footer className="p136-discover-footer"><span>ANEVUM / INDEPENDENT SOFTWARE STUDIO</span><Link to="/community">Continue into the community <Icon name="arrow" size={16}/></Link></footer>
    </div>
    {inspected&&<ArtifactLensV136 selection={inspected} returnTo={current} onClose={()=>setInspected(null)}/>}
  </div>;
}
