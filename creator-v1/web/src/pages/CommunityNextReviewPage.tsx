/**
 * Continuance NEXT / Living Commons React bridge. Draft, opt-in review ONLY.
 * Read-only public API adapter. No fabricated projects, no account writes, no
 * private-member reads, no new IREN, no collaboration/XP/recognition grants.
 * Routes and IREN are owned by the existing app Shell. This is a review surface.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  readCategories, readCommunityPosts, readCreators, readProjects, readStatus,
  type Category, type CommunityPost, type CommunityPostSort,
  type Creator, type PageResult, type Project
} from '../lib/api';
import { useResource } from '../lib/useResource';
import { projectDetailPath } from '../lib/navigation';
import { OrbitalMark } from '../components/OrbitalMark';
import { COMMONS_DISTRICTS, decodeCommonsQuery, nextCommonsQuery, moderatedPostsEnabled, type CommonsPreviewView } from '../lib/commons-next-model';
import { CosmicArtwork } from '../components/CosmicArtwork';
import './community-next-review.css';

type AtlasMode = 'map' | 'list';
export const COMMONS_PREVIEW_CATEGORIES = COMMONS_DISTRICTS.map(item=>item.id);
const presentDate=(raw:string|null|undefined)=>{
  const parsed=Date.parse(raw||'');
  return Number.isFinite(parsed)?new Intl.DateTimeFormat('en-US',{
    year:'numeric',month:'short',day:'numeric',timeZone:'UTC'
  }).format(parsed):'Date not listed';
};
const creatorRoute=(handle:string)=>'/creators/'+encodeURIComponent(handle);
const motionConfig={duration:.4,ease:'easeOut' as const};

function ProjectSignal({item}:{item:Project}){
  const location=projectDetailPath(item.id,'/community');
  return <article className="lnx-project-card">
    <Link to={location} className="lnx-project-art" aria-label={'Open approved project '+item.title}>
      <CosmicArtwork scene={item.category}/>
      <span>APPROVED PROJECT / {item.category.toUpperCase()}</span>
    </Link>
    <div className="lnx-project-content">
      <p className="lnx-data-line"><span>ORIGINAL RELEASE</span><time>{presentDate(item.publishedAt)}</time></p>
      <h3><Link to={location}>{item.title}</Link></h3>
      <p className="lnx-summary">{item.summary}</p>
      <div className="lnx-project-foot">
        <Link to={creatorRoute(item.creatorHandle)}>{item.creatorName||'@'+item.creatorHandle}</Link>
        {item.freeToUse&&<span>FREE TO USE</span>}
      </div>
      <Link className="lnx-open" to={location}>Open project <span aria-hidden="true">↗</span></Link>
    </div>
  </article>;
}
function ThreadSignal({item}:{item:CommunityPost}){
  const path='/community/posts/'+encodeURIComponent(item.id);
  return <article className="lnx-thread-card">
    <div className="lnx-thread-meta"><span>{item.topic}</span><time>{presentDate(item.publishedAt)}</time></div>
    <h3><Link to={path}>{item.title}</Link></h3>
    <p>{item.excerpt}</p>
    {item.project&&<div className="lnx-thread-project">RELATED WORK <Link to={projectDetailPath(item.project.id,'/community')}>{item.project.title}</Link></div>}
    <div className="lnx-thread-foot"><Link to={creatorRoute(item.authorHandle)}>{item.authorName||'@'+item.authorHandle}</Link><span>{item.replyCount} approved {item.replyCount===1?'reply':'replies'}</span></div>
  </article>;
}
function RealEmpty({title,detail}:{title:string;detail:string}){
  return <div className="lnx-empty"><span className="lnx-empty-mark" aria-hidden="true">✳</span><h3>{title}</h3><p>{detail}</p></div>;
}
function CategoryPicker({value,onPick}:{value:Category|'';onPick:(id:Category|'')=>void}){
  return <div className="lnx-district-filter">
    <div className="lnx-rail-label">FIELD DIRECTORY <span>08 / CATEGORIES</span></div>
    <button type="button" className="lnx-filter-row" aria-pressed={!value} onClick={()=>onPick('')}><span>All disciplines</span><span aria-hidden="true">◎</span></button>
    {COMMONS_DISTRICTS.map(d=><button key={d.id} type="button" className="lnx-filter-row" aria-pressed={value===d.id} onClick={()=>onPick(d.id)}><small>{d.code}</small><span>{d.title}</span><span aria-hidden="true">↗</span></button>)}
  </div>;
}

export function CommunityNextReviewPage(){
  const [params,setParams]=useSearchParams();
  const {view,category,q,sort}=decodeCommonsQuery(params);
  const [draft,setDraft]=useState(q);
  const [atlasMode,setAtlasMode]=useState<AtlasMode>('map');
  const [paused,setPaused]=useState(false);
  const reduceMotion=useReducedMotion();
  const [isVisible,setVisible]=useState(true);
  useEffect(()=>setDraft(q),[q]);
  useEffect(()=>{
    const check=()=>setVisible(document.visibilityState==='visible');
    check();document.addEventListener('visibilitychange',check);
    return ()=>document.removeEventListener('visibilitychange',check);
  },[]);
  const status=useResource(signal=>readStatus(signal),[]);
  const projectFeed=useResource(async signal=>view==='signals'?readProjects({q:q||undefined,category:category||undefined,sort:'new',limit:'24'},signal):{items:[],count:0,nextCursor:null} as PageResult<Project>,[view==='signals',q,category]);
  const discussionAvailable=status.state==='ready'&&moderatedPostsEnabled(status.data);
  const discussions=useResource(async signal=>{
    if(view!=='signals'||!discussionAvailable)return {availability:'closed' as const,items:[] as CommunityPost[]};
    try{const page=await readCommunityPosts({sort,limit:'12'},signal);
      return {availability:'available' as const,items:page.items};
    }catch(error){if((error as {status?:number}).status===404)
      return {availability:'closed' as const,items:[] as CommunityPost[]};
      throw error;
    }
  },[view==='signals',discussionAvailable,sort]);
  const districtCounts=useResource(async signal=>view==='atlas'?readCategories(signal):{categories:[]},[view==='atlas']);
  const creators=useResource(async signal=>view==='people'?readCreators({q:q||undefined,limit:'24'},signal):{
    items:[],count:0,nextCursor:null
  } as PageResult<Creator>,[view==='people',q]);
  const results=projectFeed.state==='ready'?projectFeed.data.items:[];
  const selected=COMMONS_DISTRICTS.find(d=>d.id===category);
  const counts=useMemo(()=>new Map(districtCounts.state==='ready'?districtCounts.data.categories.map(x=>[x.category,x.count] as const):[]),[districtCounts.state,districtCounts.state==='ready'?districtCounts.data:null]);
  const motionAllowed=!reduceMotion&&!paused&&isVisible;
  const change=(next:Partial<{view:CommonsPreviewView;category:Category|'';q:string;sort:CommunityPostSort}>)=>{
    setParams(nextCommonsQuery(params,next),{replace:false});
  };
  const chooseDistrict=(id:Category|'')=>change({category:id,view:'signals'});
  function search(event:FormEvent<HTMLFormElement>){event.preventDefault();change({q:draft.trim().slice(0,72)})}
  const previewViews:ReadonlyArray<{id:CommonsPreviewView;label:string;description:string}>= [
    {id:'signals',label:'Signal Board',description:'The everyday pulse'},
    {id:'atlas',label:'District Atlas',description:'Explore by discipline'},
    {id:'people',label:'People & Worlds',description:'Meet published creators'}
  ];
  return <section className="lnx-root" data-motion={motionAllowed?'on':'off'} data-iren-anchor="community" aria-labelledby="lnx-title">
    <a href="#lnx-main" className="lnx-skip">Skip to Community content</a>
    <div className="lnx-preview-warning">NEXT COMMUNITY / FEATURE-FLAGGED REVIEW / PUBLIC READS ONLY / NOT PUBLISHED</div>
    <section className="lnx-intro" aria-labelledby="lnx-title">
      <div className="lnx-intro-shape" aria-hidden="true"><div className="lnx-ring lnx-ring-a"/><div className="lnx-ring lnx-ring-b"/><div className="lnx-orb"><OrbitalMark/></div></div>
      <motion.div className="lnx-intro-copy" initial={motionAllowed?{opacity:0,y:18}:false} animate={{opacity:1,y:0}} transition={motionConfig}>
        <div className="lnx-kicker">ANEVUM / LIVING COMMONS / EXPERIENCES</div>
        <h1 id="lnx-title">Find your people.<br/><em>Build what comes next.</em></h1>
        <p>Follow genuine releases, explore disciplines, and join thoughtful conversations about things people make. The work leads; the community makes it better.</p>
        <div className="lnx-hero-actions"><button type="button" onClick={()=>change({view:'signals'})}>Enter the Signal Board <span aria-hidden="true">↗</span></button><button type="button" onClick={()=>change({view:'atlas'})}>Explore the Atlas <span aria-hidden="true">◎</span></button></div>
      </motion.div>
      <div className="lnx-verified-counts" aria-label="Approved public catalogue counts"><span>PUBLIC RECORDS / VERIFIED API</span>
        <div><strong>{status.state==='ready'?status.data.counts.publishedProjects.toLocaleString():'—'}</strong><small>APPROVED PROJECTS</small></div>
        <div><strong>{status.state==='ready'?status.data.counts.publishedCreators.toLocaleString():'—'}</strong><small>CREATOR CHANNELS</small></div>
        {status.state==='error'&&<p>Public record counts are unavailable.</p>}
      </div>
    </section>
    <nav className="lnx-mode-switch" aria-label="Living Commons review destinations">{previewViews.map(item=><button type="button" key={item.id} aria-current={view===item.id?'page':undefined} onClick={()=>change({view:item.id})}><strong>{item.label}</strong><small>{item.description}</small></button>)}<button type="button" className="lnx-motion-switch" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Resume optional motion':'Pause optional motion'}</button></nav>
    <div className="lnx-layout" id="lnx-main" tabIndex={-1}>
      <aside className="lnx-directory" aria-label="Community field filters"><CategoryPicker value={category} onPick={chooseDistrict}/><div className="lnx-directory-secondary"><span>THE PEOPLE BEHIND IT</span><p>Open a creator channel from a verified public listing. Private member worlds remain opt-in.</p><Link to="/creators">Full creator directory ↗</Link></div></aside>
      <div className="lnx-main-column">
        {view==='signals'&&<>
          <header className="lnx-section-head"><div><span className="lnx-kicker">01 / THE SIGNAL BOARD</span><h2>{selected?selected.title:'What is taking shape.'}</h2><p>{selected?selected.description:'Approved projects and moderated conversations, with distinct paths into the real work.'}</p></div><Link to="/community">Current Community ↗</Link></header>
          <form className="lnx-search" role="search" onSubmit={search}><label htmlFor="lnx-search">Find approved projects</label><div><input id="lnx-search" type="search" maxLength={72} placeholder="Search projects by title or idea" value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit">Search <span aria-hidden="true">↗</span></button>{(q||category)&&<button type="button" onClick={()=>{setDraft('');change({q:'',category:''})}}>Clear filters</button>}</div></form>
          <div className="lnx-result-header"><h3>Original releases</h3><span>{projectFeed.state==='ready'?projectFeed.data.items.length+' approved on this page':'PUBLIC CATALOGUE'}</span></div>
          {projectFeed.state==='loading'&&<p className="lnx-status" role="status">Loading approved public projects…</p>}
          {projectFeed.state==='error'&&<RealEmpty title="Public project catalogue unavailable" detail="The verified project service could not be reached. No substitute records will appear."/>}
          {projectFeed.state==='ready'&&(results.length?<div className="lnx-project-grid">{results.map(item=><ProjectSignal item={item} key={item.id}/>)}</div>:<RealEmpty title="Nothing published in this view yet" detail="Try a different category or project search. Private drafts are never listed."/>)}
          {projectFeed.state==='ready'&&projectFeed.data.nextCursor&&<p className="lnx-more-note">Showing the first public page. <Link to={'/discover'+(category?'?category='+category:'')}>Continue in full Discover ↗</Link></p>}
          <div className="lnx-result-header lnx-discussion-head"><h3>Open conversations</h3><div className="lnx-sort" role="group" aria-label="Sort public discussions"><button aria-pressed={sort==='new'} onClick={()=>change({sort:'new'})}>Recent</button><button aria-pressed={sort==='hot'} onClick={()=>change({sort:'hot'})}>Hot</button></div></div>
          {status.state==='loading'&&<p className="lnx-status" role="status">Checking moderated discussion availability…</p>}
          {status.state==='error'&&<RealEmpty title="Discussion availability unknown" detail="Public status could not be verified. Discussion publishing and availability remain closed in this preview."/>}
          {status.state==='ready'&&discussions.state==='loading'&&<p className="lnx-status" role="status">Loading approved discussions…</p>}
          {status.state==='ready'&&discussions.state==='error'&&<RealEmpty title="Discussions temporarily unavailable" detail="The moderated conversation service could not be loaded. No posts have been fabricated."/>}
          {status.state==='ready'&&discussions.state==='ready'&&discussions.data.availability==='closed'&&<RealEmpty title="Public conversations not available yet" detail="Community discussions appear here only when the authoritative service enables approved public posts."/>}
          {status.state==='ready'&&discussions.state==='ready'&&discussions.data.availability==='available'&&(
            discussions.data.items.length?<div className="lnx-thread-list">{discussions.data.items.map(item=><ThreadSignal key={item.id} item={item}/>)}</div>:<RealEmpty title="No approved discussions yet" detail="Public conversation records must be reviewed and published before appearing here."/>
          )}
        </>}
        {view==='atlas'&&<>
          <header className="lnx-section-head"><div><span className="lnx-kicker">02 / DISTRICT ATLAS</span><h2>Places to explore.</h2><p>An organized map of creative disciplines—not invented real-time activity or geographic locations.</p></div><div className="lnx-atlas-controls" role="group" aria-label="Atlas presentation"><button aria-pressed={atlasMode==='map'} onClick={()=>setAtlasMode('map')}>Spatial map</button><button aria-pressed={atlasMode==='list'} onClick={()=>setAtlasMode('list')}>Accessible list</button></div></header>
          {districtCounts.state==='error'&&<p className="lnx-status">Category totals are unavailable; district navigation still works.</p>}
          {atlasMode==='map'?<div className="lnx-atlas-map" role="group" aria-label="Eight creative districts; an equivalent list follows"><div className="lnx-atlas-rings" aria-hidden="true"/><span className="lnx-atlas-center" aria-hidden="true">ANEVUM / DISCIPLINES</span>{COMMONS_DISTRICTS.map(item=><button key={item.id} type="button" className="lnx-atlas-point" style={{left:item.coordinates[0]+'%',top:item.coordinates[1]+'%'}} onClick={()=>chooseDistrict(item.id)} aria-label={'Explore '+item.title}><span>{item.code}</span><strong>{item.title}</strong><small>{districtCounts.state==='ready'?(counts.get(item.id)??0)+' approved projects':'Projects unverified'}</small></button>)}</div>:null}
          <div className="lnx-atlas-list" aria-label="Browse district catalogue">{COMMONS_DISTRICTS.map(item=><button key={item.id} type="button" onClick={()=>chooseDistrict(item.id)} className="lnx-atlas-row"><small>{item.code} / FIELD</small><strong>{item.title}</strong><span>{item.description}</span><em>{districtCounts.state==='ready'?(counts.get(item.id)??0)+' approved projects':'Count unavailable'}</em><span aria-hidden="true">↗</span></button>)}</div>
          <p className="lnx-caption">The Atlas expresses a fixed category taxonomy. It has no location tracking, map telemetry, or inferred online presence. Every district links to the same real catalogue used by the Signal Board.</p>
        </>}
        {view==='people'&&<>
          <header className="lnx-section-head"><div><span className="lnx-kicker">03 / PEOPLE & WORLDS</span><h2>Meet the makers.</h2><p>Real public creator channels tied to approved work. Private member worlds do not appear here unless their owners publish them through the canonical system.</p></div><Link to="/creators">Full directory ↗</Link></header>
          <form className="lnx-search" role="search" onSubmit={search}><label htmlFor="lnx-people-search">Search public creator channels</label><div><input id="lnx-people-search" type="search" maxLength={72} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Search creator names"/><button type="submit">Find people ↗</button></div></form>
          {creators.state==='loading'&&<p className="lnx-status" role="status">Loading real published creator channels…</p>}
          {creators.state==='error'&&<RealEmpty title="Public creators unavailable" detail="The verified public creator directory did not respond."/>}
          {creators.state==='ready'&&(creators.data.items.length?<div className="lnx-people-grid">{creators.data.items.map(creator=><article key={creator.handle} className="lnx-person"><span className="lnx-person-avatar" aria-hidden="true">{(creator.displayName||creator.handle).slice(0,1).toUpperCase()}</span><span className="lnx-kicker">PUBLIC CREATOR CHANNEL</span><h3><Link to={creatorRoute(creator.handle)}>{creator.displayName}</Link></h3><small>@{creator.handle}</small><p>{creator.publishedProjects} approved {creator.publishedProjects===1?'release':'releases'}</p><Link className="lnx-open" to={creatorRoute(creator.handle)}>Visit channel ↗</Link></article>)}</div>:<RealEmpty title="No public creators match" detail="Creator channels are indexed only when approved work is available. Try another name."/>)}
          {creators.state==='ready'&&creators.data.nextCursor&&<p className="lnx-more-note"><Link to="/creators">Continue in full Creator directory ↗</Link></p>}
        </>}
      </div>
      <aside className="lnx-context" aria-label="Contextual Community navigation"><div className="lnx-context-card"><span className="lnx-kicker">CONTEXT LENS / FIXED PATHS</span><h2>Go deeper, intentionally.</h2><p>These destinations follow the section you opened. This is deterministic guidance, not an AI recommendation.</p><div className="lnx-context-links">
        <Link to="/discover">Browse complete Discover ↗</Link><Link to="/community">Current community hub ↗</Link><Link to="/creators">Meet public creators ↗</Link><Link to="/recognition">Recognition and levels ↗</Link><Link to="/member">Your private space ↗</Link>
        {discussionAvailable&&<Link to="/community/write">Submit a discussion for review ↗</Link>}
      </div><div className="lnx-context-rule"/><strong>Earned, never simulated.</strong><p>Only the canonical member inventory may display earned level art, badges, medals, ribbons or roles. This review awards nothing.</p></div></aside>
    </div>
    <footer className="lnx-footer"><span>CONTINUANCE NEXT / REVIEW</span><span>Signal Board first. Atlas optional. Server authority unchanged.</span></footer>
  </section>;
}