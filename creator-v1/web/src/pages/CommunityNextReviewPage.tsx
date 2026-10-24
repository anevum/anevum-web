/**
 * Living Commons: opt-in, read-only React review inside the existing Shell.
 * Canonical public APIs own visibility. No account writes or earned grants.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  readCategories, readCommunityPosts, readCreators, readProjects, readStatus,
  type Category, type CommunityPost, type CommunityPostSort,
  type Creator, type PageResult, type Project
} from '../lib/api';
import { useResource } from '../lib/useResource';
import { projectDetailPath } from '../lib/navigation';
import { OrbitalMark } from '../components/OrbitalMark';
import {
  COMMONS_DISTRICTS, decodeCommonsQuery, nextCommonsQuery, moderatedPostsEnabled,
  commonsDiscoverPath, commonsCreatorsPath, normalizeCommonsSearch, type CommonsPreviewView
} from '../lib/commons-next-model';
import { CosmicArtwork } from '../components/CosmicArtwork';
import { CommonsQuickNavigator } from './CommonsQuickNavigator';
import './community-next-review.css';
import './commons-quick-navigator.css';

type ResourceName = 'status' | 'projects' | 'discussions' | 'categories' | 'creators';
export const COMMONS_PREVIEW_CATEGORIES = COMMONS_DISTRICTS.map(item => item.id);
const presentDate = (raw: string | null | undefined) => {
  const parsed = Date.parse(raw || '');
  return Number.isFinite(parsed) ? new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  }).format(parsed) : 'Date not listed';
};
const creatorRoute = (handle: string) => '/creators/' + encodeURIComponent(handle);
const previewViews: ReadonlyArray<{id: CommonsPreviewView; label: string; description: string; code: string}> = [
  {id: 'signals', label: 'Signal Board', description: 'Work & conversations', code: '01'},
  {id: 'atlas', label: 'District Atlas', description: 'Explore by discipline', code: '02'},
  {id: 'people', label: 'People & Worlds', description: 'Meet the makers', code: '03'}
];

function ProjectSignal({item, returnTo}: {item: Project; returnTo: string}) {
  const location = projectDetailPath(item.id, returnTo);
  return <article className="lnx-project-card">
    <Link to={location} className="lnx-project-art" aria-label={'Open approved project ' + item.title}>
      <CosmicArtwork scene={item.category}/>
      <span className="lnx-art-label">{item.category.toUpperCase()} / PUBLISHED WORK</span>
      <span className="lnx-art-arrow" aria-hidden="true">↗</span>
    </Link>
    <div className="lnx-project-content">
      <p className="lnx-data-line"><span>ORIGINAL RELEASE</span><time dateTime={item.publishedAt || undefined}>{presentDate(item.publishedAt)}</time></p>
      <h3><Link to={location}>{item.title}</Link></h3>
      <p className="lnx-summary">{item.summary}</p>
      <div className="lnx-project-foot">
        <Link to={creatorRoute(item.creatorHandle)}>{item.creatorName || '@' + item.creatorHandle}</Link>
        {item.freeToUse && <span>FREE TO USE</span>}
      </div>
      <Link className="lnx-open" to={location}>Open project <span aria-hidden="true">↗</span></Link>
    </div>
  </article>;
}

function ThreadSignal({item, returnTo}: {item: CommunityPost; returnTo: string}) {
  const path = '/community/posts/' + encodeURIComponent(item.id);
  return <article className="lnx-thread-card">
    <div className="lnx-thread-meta"><span>{item.topic}</span><time dateTime={item.publishedAt}>{presentDate(item.publishedAt)}</time></div>
    <h3><Link to={path}>{item.title}</Link></h3>
    <p>{item.excerpt}</p>
    {item.project && <div className="lnx-thread-project">RELATED WORK <Link to={projectDetailPath(item.project.id, returnTo)}>{item.project.title}</Link></div>}
    <div className="lnx-thread-foot"><Link to={creatorRoute(item.authorHandle)}>{item.authorName || '@' + item.authorHandle}</Link><span>{item.replyCount} approved {item.replyCount === 1 ? 'reply' : 'replies'}</span></div>
  </article>;
}

function RealEmpty({title, detail, action, error = false}: {title: string; detail: string; action?: ReactNode; error?: boolean}) {
  return <div className={'lnx-empty' + (error ? ' lnx-empty--error' : '')} role="status">
    <span className="lnx-empty-mark" aria-hidden="true">{error ? '↻' : '✳'}</span>
    <h3>{title}</h3><p>{detail}</p>{action}
  </div>;
}

function LoadingSignals({label, kind = 'projects'}: {label: string; kind?: 'projects' | 'people' | 'threads'}) {
  return <div className="lnx-loading" role="status">
    <p>{label}</p>
    <div className={'lnx-skeleton-grid lnx-skeleton-grid--' + kind} aria-hidden="true">
      {[0, 1].map(item => <div className="lnx-skeleton-card" key={item}><span/><i/><i/><i/></div>)}
    </div>
  </div>;
}

function CategoryPicker({value, onPick}: {value: Category | ''; onPick: (id: Category | '') => void}) {
  return <div className="lnx-district-filter">
    <div className="lnx-rail-label">PROJECT FIELDS <span>08 / DISCIPLINES</span></div>
    <button type="button" className="lnx-filter-row" aria-pressed={!value} onClick={() => onPick('')}><span>All disciplines</span><span aria-hidden="true">◎</span></button>
    {COMMONS_DISTRICTS.map(d => <button key={d.id} type="button" className="lnx-filter-row" aria-pressed={value === d.id} onClick={() => onPick(d.id)}><small>{d.code}</small><span>{d.title}</span><span aria-hidden="true">↗</span></button>)}
  </div>;
}

export function CommunityNextReviewPage() {
  const [params, setParams] = useSearchParams();
  const {view, category, q, sort, atlas} = decodeCommonsQuery(params);
  const [draft, setDraft] = useState(q);
  const [compactAtlas, setCompactAtlas] = useState(() => window.matchMedia('(max-width: 530px)').matches);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [isVisible, setVisible] = useState(true);
  const [revision, setRevision] = useState<Record<ResourceName, number>>({status: 0, projects: 0, discussions: 0, categories: 0, creators: 0});
  const content = useRef<HTMLDivElement>(null);
  const queryString = params.toString();
  const previousQuery = useRef(queryString);
  const focusFrame = useRef<number | null>(null);
  const atlasMode = atlas || (compactAtlas ? 'list' : 'map');

  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const check = () => setVisible(document.visibilityState === 'visible');
    check(); document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 530px)');
    const check = () => setCompactAtlas(media.matches);
    check(); media.addEventListener('change', check);
    return () => media.removeEventListener('change', check);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => setReduceMotion(media.matches);
    check(); media.addEventListener('change', check);
    return () => media.removeEventListener('change', check);
  }, []);
  // Shell resets focus on URL changes. Finish local navigation at its content,
  // including Back/Forward, after that shared effect; do not change global routes.
  const focusContent = () => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      content.current?.focus({preventScroll: true});
      content.current?.scrollIntoView({block: 'start', behavior: 'instant'});
      focusFrame.current = null;
    });
  };
  useEffect(() => {
    if (previousQuery.current !== queryString) {
      // A presentation-only map/list change must not throw keyboard focus back
      // into the results or scroll away from the Atlas controls.
      const previousContent = new URLSearchParams(previousQuery.current);
      const nextContent = new URLSearchParams(queryString);
      previousContent.delete('atlas');
      nextContent.delete('atlas');
      previousQuery.current = queryString;
      if (previousContent.toString() !== nextContent.toString()) focusContent();
    }
  }, [queryString]);
  useEffect(() => () => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
  }, []);

  const retry = (name: ResourceName, focusTarget: ResourceName = name) => {
    // The error button is removed while loading. Keep keyboard focus in the
    // stable result region so the next Tab stays with the request being retried.
    document.getElementById('lnx-' + (focusTarget === 'status' ? 'counts' : focusTarget))?.focus({preventScroll: true});
    setRevision(current => ({...current, [name]: current[name] + 1}));
  };
  const status = useResource(signal => readStatus(signal), [revision.status]);
  const projectFeed = useResource(async signal => view === 'signals' ? readProjects({
    q: q || undefined, category: category || undefined, sort: 'new', limit: '24'
  }, signal) : {items: [], count: 0, nextCursor: null} as PageResult<Project>, [view === 'signals', q, category, revision.projects]);
  const discussionAvailable = status.state === 'ready' && moderatedPostsEnabled(status.data);
  const discussions = useResource(async signal => {
    if (view !== 'signals' || !discussionAvailable) return {availability: 'closed' as const, items: [] as CommunityPost[]};
    try {
      const page = await readCommunityPosts({sort, limit: '12'}, signal);
      return {availability: 'available' as const, items: page.items};
    } catch (error) {
      if ((error as {status?: number}).status === 404) return {availability: 'closed' as const, items: [] as CommunityPost[]};
      throw error;
    }
  }, [view === 'signals', discussionAvailable, sort, revision.discussions]);
  const districtCounts = useResource(async signal => view === 'atlas' ? readCategories(signal) : {categories: []}, [view === 'atlas', revision.categories]);
  const creators = useResource(async signal => view === 'people' ? readCreators({q: q || undefined, limit: '24'}, signal) : {
    items: [], count: 0, nextCursor: null
  } as PageResult<Creator>, [view === 'people', q, revision.creators]);
  const results = projectFeed.state === 'ready' ? projectFeed.data.items : [];
  const selected = COMMONS_DISTRICTS.find(d => d.id === category);
  const counts = useMemo(() => new Map(districtCounts.state === 'ready' ? districtCounts.data.categories.map(x => [x.category, x.count] as const) : []), [districtCounts]);
  const motionAllowed = !reduceMotion && !paused && isVisible;
  const discoverPath = commonsDiscoverPath({q, category});
  const creatorsPath = commonsCreatorsPath({q});
  const change = (next: Partial<{view: CommonsPreviewView; category: Category | ''; q: string; sort: CommunityPostSort}>) => {
    const updated = nextCommonsQuery(params, next);
    if (updated.toString() === queryString) focusContent();
    else setParams(updated, {replace: false});
  };
  const chooseDistrict = (id: Category | '') => change({category: id, view: 'signals'});
  const chooseAtlasPresentation = (choice: 'map' | 'list' | '') => {
    const updated = nextCommonsQuery(params, {atlas: choice});
    if (updated.toString() !== queryString) setParams(updated, {replace: false});
  };
  const clearProjects = () => {setDraft(''); change({q: '', category: ''});};
  function search(event: FormEvent<HTMLFormElement>) {event.preventDefault(); change({q: normalizeCommonsSearch(draft)});}
  const retryButton = (name: ResourceName, label: string, focusTarget: ResourceName = name) => <button type="button" className="lnx-retry" onClick={() => retry(name, focusTarget)}>{label} <span aria-hidden="true">↻</span></button>;
  const countLabel = (id: Category) => districtCounts.state === 'ready' ? (counts.get(id) ?? 0) + ' approved projects' : 'Count unavailable';
  const context = view === 'atlas' ? {
    title: 'Find a field of your own.', detail: 'Each district opens the same catalogue through a different creative discipline.',
    links: [{to: '/discover', label: 'Browse every discipline'}, {to: '/creators', label: 'Find the people behind it'}, {to: '/guide', label: 'Explore the Field Guide'}]
  } : view === 'people' ? {
    title: 'Start with their work.', detail: 'A creator channel brings published projects and their maker together.',
    links: [{to: creatorsPath, label: q ? 'Continue this creator search' : 'Open the full creator directory'}, {to: '/discover', label: 'Explore published projects'}, {to: '/community', label: 'Visit the community'}]
  } : {
    title: selected ? 'Further into this field.' : 'Follow what draws you in.', detail: selected ? selected.description + '. Continue exploring the published work in this field.' : 'Open a project, meet its maker, or pick up a conversation around the work.',
    links: [{to: discoverPath, label: q || category ? 'Continue with these project filters' : 'Browse complete Discover'}, {to: '/community', label: 'Visit the current community'}, {to: '/creators', label: 'Meet public creators'}]
  };

  return <section className="lnx-root" data-motion={motionAllowed ? 'on' : 'off'} data-iren-anchor="community" aria-labelledby="lnx-title">
    <a href="#lnx-main" className="lnx-skip">Skip to Community content</a>
    <div className="lnx-preview-warning"><span className="lnx-preview-dot" aria-hidden="true"/> LIVING COMMONS / DEVELOPMENT PREVIEW</div>
    <section className="lnx-intro" aria-labelledby="lnx-title">
      <div className="lnx-intro-shape" aria-hidden="true"><div className="lnx-ring lnx-ring-a"/><div className="lnx-ring lnx-ring-b"/><div className="lnx-orb"><OrbitalMark/></div></div>
      <motion.div className="lnx-intro-copy" initial={motionAllowed ? {opacity: 0, y: 18} : false} animate={{opacity: 1, y: 0}} transition={{duration: motionAllowed ? .4 : 0, ease: 'easeOut'}}>
        <div className="lnx-kicker">ANEVUM / THE CONTINUANCE INSTITUTE</div>
        <h1 id="lnx-title">Find your people.<br/><em>Build what comes next.</em></h1>
        <p>A meeting place for people making worlds, tools and discoveries. Find work that moves you, and the people behind it.</p>
        <div className="lnx-hero-actions"><button type="button" onClick={() => change({view: 'signals'})}>Enter the Signal Board <span aria-hidden="true">↗</span></button><button type="button" onClick={() => change({view: 'atlas'})}>Explore the Atlas <span aria-hidden="true">◎</span></button></div>
      </motion.div>
      <div className="lnx-verified-counts" id="lnx-counts" tabIndex={-1} role="region" aria-label="Approved public catalogue counts" aria-busy={status.state === 'loading'}>
        <span>THE PUBLIC COLLECTION</span>
        <div><strong>{status.state === 'ready' ? status.data.counts.publishedProjects.toLocaleString() : '—'}</strong><small>APPROVED PROJECTS</small></div>
        <div><strong>{status.state === 'ready' ? status.data.counts.publishedCreators.toLocaleString() : '—'}</strong><small>CREATOR CHANNELS</small></div>
        {status.state === 'error' && <><p>Public record counts are unavailable.</p>{retryButton('status', 'Retry counts')}</>}
      </div>
    </section>
    <nav className="lnx-mode-switch" aria-label="Living Commons review destinations">
      {previewViews.map(item => <button type="button" key={item.id} aria-current={view === item.id ? 'page' : undefined} onClick={() => change({view: item.id})}><span className="lnx-mode-code" aria-hidden="true">{item.code}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></button>)}
      <CommonsQuickNavigator view={view} category={category} discoverPath={discoverPath} creatorsPath={creatorsPath} onChoose={change}/>
      <button type="button" className="lnx-motion-switch" aria-pressed={paused || Boolean(reduceMotion)} disabled={Boolean(reduceMotion)} onClick={() => setPaused(value => !value)}>{reduceMotion ? 'Reduced motion is on' : paused ? 'Resume optional motion' : 'Pause optional motion'}</button>
    </nav>
    <div className="lnx-layout" id="lnx-main" tabIndex={-1} ref={content} aria-labelledby="lnx-section-title">
      <aside className="lnx-directory" aria-label="Community project fields"><CategoryPicker value={category} onPick={chooseDistrict}/><div className="lnx-directory-secondary"><span>THE PEOPLE BEHIND IT</span><p>Every public creator channel starts with published work.</p><Link to="/creators">Full creator directory <span aria-hidden="true">↗</span></Link></div></aside>
      <div className="lnx-main-column">
        {view === 'signals' && <>
          <header className="lnx-section-head"><div><span className="lnx-kicker">01 / THE SIGNAL BOARD</span><h2 id="lnx-section-title">{selected ? selected.title : 'What is taking shape.'}</h2><p>{selected ? selected.description : 'Original releases and thoughtful conversations. Find something worth following.'}</p></div><Link to="/community">Current Community ↗</Link></header>
          <form className="lnx-search" role="search" aria-label="Search approved projects" onSubmit={search}>
            <label htmlFor="lnx-search">Find approved projects</label>
            <div><input id="lnx-search" type="search" maxLength={72} placeholder="Search projects by title or idea" value={draft} onChange={e => setDraft(e.target.value)}/><button type="submit">Search <span aria-hidden="true">↗</span></button></div>
            {(q || category) && <div className="lnx-active-filters" role="group" aria-label="Active project filters">
              {category && <button type="button" className="lnx-filter-chip" aria-label={'Remove discipline filter: ' + (selected?.title || category)} onClick={() => change({category: ''})}><span>FIELD · {selected?.title || category}</span><span aria-hidden="true">×</span></button>}
              {q && <button type="button" className="lnx-filter-chip" aria-label={'Remove project search: ' + q} onClick={() => {setDraft(''); change({q: ''});}}><span>SEARCH · “{q}”</span><span aria-hidden="true">×</span></button>}
              <button type="button" className="lnx-clear-all" onClick={clearProjects}>Clear all filters <span aria-hidden="true">×</span></button>
            </div>}
          </form>
          <section className="lnx-resource-region" id="lnx-projects" tabIndex={-1} aria-label="Approved projects" aria-busy={projectFeed.state === 'loading'}>
          <div className="lnx-result-header"><h3>Original releases</h3><span aria-live="polite">{projectFeed.state === 'ready' ? projectFeed.data.items.length + ' approved on this page' : 'PUBLIC CATALOGUE'}</span></div>
          {projectFeed.state === 'loading' && <LoadingSignals label="Loading approved public projects…"/>}
          {projectFeed.state === 'error' && <RealEmpty error title="Public project catalogue unavailable" detail="We couldn’t load the collection. Try the connection again." action={retryButton('projects', 'Retry projects')}/>}
          {projectFeed.state === 'ready' && (results.length ? <div className="lnx-project-grid">{results.map(item => <ProjectSignal item={item} returnTo={discoverPath} key={item.id}/>)}</div> : <RealEmpty title="Nothing published in this view yet" detail={q || category ? 'Try another project search or clear your filters to explore the full collection.' : 'New work will appear here after it has been approved for publication.'} action={q || category ? <button type="button" className="lnx-retry" onClick={clearProjects}>Clear project filters ↗</button> : <Link className="lnx-retry" to="/creators">Meet public creators ↗</Link>}/>)}
          {projectFeed.state === 'ready' && projectFeed.data.nextCursor && <p className="lnx-more-note">There is more to explore. <Link to={discoverPath}>Continue in full Discover ↗</Link></p>}
          </section>
          <section className="lnx-resource-region" id="lnx-discussions" tabIndex={-1} aria-label="Public discussions" aria-busy={status.state === 'loading' || (status.state === 'ready' && discussions.state === 'loading')}>
          <div className="lnx-result-header lnx-discussion-head"><div><span className="lnx-kicker">ACROSS THE COMMONS</span><h3>Open conversations</h3><p>Recent discussions from every discipline. Project filters apply above.</p></div>{discussionAvailable && <div className="lnx-sort" role="group" aria-label="Sort public discussions"><button type="button" aria-pressed={sort === 'new'} onClick={() => change({sort: 'new'})}>Recent</button><button type="button" aria-pressed={sort === 'hot'} onClick={() => change({sort: 'hot'})}>Hot</button></div>}</div>
          {status.state === 'loading' && <p className="lnx-status" role="status">Checking moderated discussion availability…</p>}
          {status.state === 'error' && <RealEmpty error title="Discussion availability unknown" detail="We couldn’t check whether public discussions are open. Try again in a moment." action={retryButton('status', 'Retry availability', 'discussions')}/>}
          {status.state === 'ready' && discussions.state === 'loading' && <LoadingSignals label="Loading approved discussions…" kind="threads"/>}
          {status.state === 'ready' && discussions.state === 'error' && <RealEmpty error title="Discussions temporarily unavailable" detail="The conversation couldn’t be loaded. Your place in the collection is still here." action={retryButton('discussions', 'Retry discussions')}/>}
          {status.state === 'ready' && discussions.state === 'ready' && discussions.data.availability === 'closed' && <RealEmpty title="Public conversations not available yet" detail="You can keep exploring published projects and their creators while conversations are closed."/>}
          {status.state === 'ready' && discussions.state === 'ready' && discussions.data.availability === 'available' && (discussions.data.items.length ? <div className="lnx-thread-list">{discussions.data.items.map(item => <ThreadSignal key={item.id} item={item} returnTo={discoverPath}/>)}</div> : <RealEmpty title="No approved discussions yet" detail="The first reviewed conversations will appear here when they are published."/>)}
          </section>
        </>}
        {view === 'atlas' && <>
          <header className="lnx-section-head"><div><span className="lnx-kicker">02 / DISTRICT ATLAS</span><h2 id="lnx-section-title">Places to explore.</h2><p>Eight creative disciplines. Choose a field and find the work taking shape within it.</p></div><div className="lnx-atlas-controls" role="group" aria-label="Atlas presentation"><button type="button" aria-pressed={atlasMode === 'map'} onClick={() => chooseAtlasPresentation('map')}>Spatial map</button><button type="button" aria-pressed={atlasMode === 'list'} onClick={() => chooseAtlasPresentation('list')}>Accessible list</button>{atlas && <button type="button" className="lnx-atlas-auto" onClick={() => chooseAtlasPresentation('')}>Use device default</button>}</div></header>
          <section className="lnx-resource-region" id="lnx-categories" tabIndex={-1} aria-label="District catalogue" aria-busy={districtCounts.state === 'loading'}>
          {districtCounts.state === 'loading' && <p className="lnx-status" role="status">Loading public category totals…</p>}
          {districtCounts.state === 'error' && <div className="lnx-status" role="status"><p>Category totals are unavailable. You can still explore every district.</p>{retryButton('categories', 'Retry counts')}</div>}
          {atlasMode === 'map' && <div className="lnx-atlas-map" role="group" aria-label="Eight creative districts; an equivalent list follows"><div className="lnx-atlas-rings" aria-hidden="true"/><span className="lnx-atlas-center" aria-hidden="true"><OrbitalMark/><span>THE COMMONS</span></span>{COMMONS_DISTRICTS.map(item => <button key={item.id} type="button" className="lnx-atlas-point" style={{left: item.coordinates[0] + '%', top: item.coordinates[1] + '%'}} onClick={() => chooseDistrict(item.id)} aria-label={'Explore ' + item.title}><span>{item.code}</span><strong>{item.title}</strong><small>{countLabel(item.id)}</small></button>)}</div>}
          <div className="lnx-atlas-list" aria-label="Browse district catalogue">{COMMONS_DISTRICTS.map(item => <button key={item.id} type="button" onClick={() => chooseDistrict(item.id)} className="lnx-atlas-row"><small>{item.code} / FIELD</small><strong>{item.title}</strong><span>{item.description}</span><em>{countLabel(item.id)}</em><span className="lnx-district-arrow" aria-hidden="true">↗</span></button>)}</div>
          <p className="lnx-caption">A fixed category taxonomy, with the same published projects in the map and list.</p>
          </section>
        </>}
        {view === 'people' && <>
          <header className="lnx-section-head"><div><span className="lnx-kicker">03 / PEOPLE & WORLDS</span><h2 id="lnx-section-title">Meet the makers.</h2><p>Discover the people behind published work. Open a channel to explore what they make.</p></div><Link to={creatorsPath}>Full directory ↗</Link></header>
          <form className="lnx-search" role="search" aria-label="Search public creators" onSubmit={search}><label htmlFor="lnx-people-search">Search public creator channels</label><div><input id="lnx-people-search" type="search" maxLength={72} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Search creator names"/><button type="submit">Find people ↗</button></div>{q && <div className="lnx-active-filters"><span>Search: “{q}”</span><button type="button" onClick={() => change({q: ''})}>Clear search ×</button></div>}</form>
          <section className="lnx-resource-region" id="lnx-creators" tabIndex={-1} aria-label="Public creator results" aria-busy={creators.state === 'loading'}>
          {creators.state === 'loading' && <LoadingSignals label="Loading public creator channels…" kind="people"/>}
          {creators.state === 'error' && <RealEmpty error title="Public creators unavailable" detail="We couldn’t load the creator directory. Try again to reconnect." action={retryButton('creators', 'Retry directory')}/>}
          {creators.state === 'ready' && (creators.data.items.length ? <><p className="lnx-directory-count" role="status">{creators.data.items.length} public {creators.data.items.length === 1 ? 'channel' : 'channels'} on this page</p><div className="lnx-people-grid">{creators.data.items.map(creator => <article key={creator.handle} className="lnx-person"><div className="lnx-person-top"><span className="lnx-person-avatar" aria-hidden="true">{(creator.displayName || creator.handle).slice(0, 1).toUpperCase()}</span><span className="lnx-kicker">PUBLIC CREATOR<br/>CHANNEL</span></div><h3><Link to={creatorRoute(creator.handle)}>{creator.displayName || '@' + creator.handle}</Link></h3><small>@{creator.handle}</small><p>{creator.publishedProjects} approved {creator.publishedProjects === 1 ? 'release' : 'releases'}</p><Link className="lnx-open" to={creatorRoute(creator.handle)}>Visit channel <span aria-hidden="true">↗</span></Link></article>)}</div></> : <RealEmpty title="No public creators match" detail={q ? 'Try another name or clear your search to meet the published creators.' : 'Creator channels appear here when approved work is available.'} action={q ? <button type="button" className="lnx-retry" onClick={() => change({q: ''})}>Clear creator search ↗</button> : undefined}/>)}
          {creators.state === 'ready' && creators.data.nextCursor && <p className="lnx-more-note"><Link to={creatorsPath}>Continue in full Creator directory ↗</Link></p>}
          </section>
        </>}
      </div>
      <aside className="lnx-context" aria-label="Contextual Community navigation"><div className="lnx-context-card"><span className="lnx-kicker">CONTEXT LENS / {view === 'signals' ? 'THE WORK' : view === 'atlas' ? 'THE FIELDS' : 'THE PEOPLE'}</span><h2>{context.title}</h2><p>{context.detail}</p><div className="lnx-context-links">{context.links.map(link => <Link key={link.to} to={link.to}>{link.label} <span aria-hidden="true">↗</span></Link>)}{view === 'signals' && discussionAvailable && <Link to="/community/write">Submit a discussion for review ↗</Link>}</div><div className="lnx-context-rule"/><strong>Your place in the Commons.</strong><p>Keep building your world, and discover the recognition earned along the way.</p><div className="lnx-context-links lnx-context-personal"><Link to="/member">Your private space ↗</Link><Link to="/recognition">Recognition and levels ↗</Link></div></div></aside>
    </div>
    <details className="lnx-review-note"><summary>About this development preview</summary><p>This optional review reads approved public records through the existing services. Private member worlds remain opt-in. Only the canonical member inventory may display earned level art, badges, medals, ribbons or roles. This review awards nothing and changes no accounts.</p></details>
    <footer className="lnx-footer"><span>ANEVUM / THE CONTINUANCE INSTITUTE</span><span>LIVING COMMONS / DEVELOPMENT PREVIEW</span></footer>
  </section>;
}
