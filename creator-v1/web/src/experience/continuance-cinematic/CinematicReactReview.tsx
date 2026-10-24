import { useEffect, useMemo, useRef, useState } from 'react';
import { OrbitalMark } from '../../components/OrbitalMark';
import './cinematic-react-review.css';

type View = 'arrival' | 'discover';
type Category = 'all' | 'games' | 'tools' | 'creative' | 'libraries';
type CatalogueState = 'browse' | 'loading' | 'empty' | 'error';
type Room = { id: Exclude<Category, 'all'>; name: string; index: string; subtitle: string; description: string; artwork: 'games' | 'tools' | 'creative' | 'libraries' };
const rooms: readonly Room[] = [
  { id: 'games', name: 'Worlds & Games', index: '01 / PLAY', subtitle: 'Enter other possibilities', description: 'Experiences, interactive worlds and independent play.', artwork: 'games' },
  { id: 'tools', name: 'Apps & Tools', index: '02 / BUILD', subtitle: 'Things that do something', description: 'Practical software, useful interfaces and new ways to work.', artwork: 'tools' },
  { id: 'creative', name: 'Art & Experiences', index: '03 / CREATE', subtitle: 'Make what does not exist', description: 'Images, ideas, creative experiments and authored experiences.', artwork: 'creative' },
  { id: 'libraries', name: 'Open Source', index: '04 / SHARE', subtitle: 'Build on shared knowledge', description: 'Libraries, source and collaborative creative infrastructure.', artwork: 'libraries' }
];
const base = import.meta.env.BASE_URL;
function SceneArt({ scene, eager = false, label }: { scene: Room['artwork']; eager?: boolean; label?: string }) {
  const prefix = base + scene;
  return <span className={'cnr-art cnr-art--' + scene} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
    <picture>
      <source type="image/webp" srcSet={prefix + '-768.webp 768w, ' + prefix + '-1536.webp 1536w'} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 80vw, 58vw" />
      <img src={prefix + '-1536.webp'} alt="" aria-hidden="true" width={1536} height={1024} decoding="async" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} draggable={false} />
    </picture>
    <span className="cnr-art-scrim"/>
  </span>;
}
function VectorInstrument() {
  return <svg className="cnr-vector-instrument" viewBox="0 0 900 640" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cnr-orbit-metal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f3d8aa" stopOpacity=".8"/><stop offset=".46" stopColor="#72d7f3" stopOpacity=".22"/><stop offset="1" stopColor="#bba4ea" stopOpacity=".6"/></linearGradient>
      <radialGradient id="cnr-halo"><stop stopColor="#80d6f4" stopOpacity=".27"/><stop offset="1" stopColor="#80d6f4" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="495" cy="340" r="292" fill="url(#cnr-halo)"/>
    <ellipse cx="508" cy="332" rx="387" ry="138" transform="rotate(-26 508 332)" fill="none" stroke="url(#cnr-orbit-metal)" strokeWidth="1.8"/>
    <ellipse cx="508" cy="332" rx="322" ry="226" transform="rotate(29 508 332)" fill="none" stroke="#82bbdc" strokeOpacity=".18" strokeWidth="1.4" strokeDasharray="6 14"/>
    <circle cx="508" cy="332" r="254" fill="none" stroke="#bcaa87" strokeOpacity=".12" strokeWidth="1"/>
    <path d="M84 354H820M508 55V612" fill="none" stroke="#91d7ef" strokeOpacity=".08" strokeWidth="1"/>
    <circle cx="192" cy="292" r="5" fill="#f0d5a0"/><circle cx="739" cy="441" r="6" fill="#8de3fc"/>
    <path d="M164 292h-35m610 149h55" stroke="#a7d5e3" strokeOpacity=".5"/>
    <g stroke="#c7b28c" strokeOpacity=".38" fill="none"><path d="M40 40H110M40 40V105M860 40H790M860 40V105M40 600H110M40 600V535M860 600H790M860 600V535"/></g>
  </svg>;
}
function statusText(status: CatalogueState) {
  if (status === 'loading') return { title: 'Reading the public index', detail: 'A loading state must remain distinct from empty or unavailable content.' };
  if (status === 'error') return { title: 'The catalogue is temporarily unavailable', detail: 'A failed request must not be represented as zero projects. Filters and navigation remain accessible.' };
  return { title: 'No project records in this design review', detail: 'The category visuals below describe disciplines, not fictional published projects. Actual verified records will come from the existing public API.' };
}
function CategoryArtwork({ room, onPick }: { room: Room; onPick: (id: Category) => void }) {
  return <button type="button" className="cnr-room" onClick={() => onPick(room.id)} data-testid={'room-' + room.id}>
    <span className="cnr-room-cover"><SceneArt scene={room.artwork}/><span className="cnr-room-number">{room.index}</span><span className="cnr-room-open" aria-hidden="true">↗</span></span>
    <span className="cnr-room-copy"><small>{room.subtitle}</small><strong>{room.name}</strong><span>{room.description}</span><i aria-hidden="true">EXPLORE THIS FIELD <span>↗</span></i></span>
  </button>;
}
export function CinematicReactReview() {
  const [view, setView] = useState<View>('arrival');
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [catalogueState, setCatalogueState] = useState<CatalogueState>('browse');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [motionPaused, setMotionPaused] = useState(false);
  const [osReduced, setOsReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === 'visible');
    sync(); document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  useEffect(() => {
    if (previousView.current !== view) { previousView.current = view; heading.current?.focus({ preventScroll: true }); }
  }, [view]);
  const still = motionPaused || osReduced || !visible;
  const visibleRooms = useMemo(() => rooms.filter(r => (category === 'all' || r.id === category) && (r.name + ' ' + r.description + ' ' + r.subtitle).toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  const navigate = (next: View) => { setView(next); setHelpOpen(false); };
  const pick = (next: Category) => { setCategory(next); setCatalogueState('browse'); setView('discover'); };
  const state = statusText(catalogueState);
  return <div className="cnr-root" data-design="continuance-cinematic-react" data-still={still} data-view={view}>
    <a className="cnr-skip" href="#cnr-main">Skip to main content</a>
    <div className="cnr-statusline"><span><b className="cnr-status-dot"/> CONTINUANCE NEXT / THE INSTITUTE</span><span>INTERACTIVE REACT STUDY <b>· NOT DEPLOYED</b></span></div>
    <header className="cnr-header">
      <button type="button" className="cnr-logo" onClick={() => navigate('arrival')} aria-label="ANEVUM: open Arrival">
        <OrbitalMark className="cnr-brandmark"/><span><strong>ANEVUM</strong><small>THE CONTINUANCE INSTITUTE</small></span>
      </button>
      <nav className="cnr-nav" aria-label="Design review navigation">
        <button type="button" onClick={() => navigate('arrival')} aria-current={view === 'arrival' ? 'page' : undefined}>Home</button>
        <button type="button" onClick={() => navigate('discover')} aria-current={view === 'discover' ? 'page' : undefined}>Discover</button>
        <span>Community</span><span>Creators</span>
      </nav>
      <div className="cnr-header-actions">
        <button type="button" className="cnr-motion" aria-pressed={motionPaused} onClick={() => setMotionPaused(v => !v)}>{motionPaused ? 'Resume motion' : 'Pause motion'}</button>
        <button type="button" className="cnr-action cnr-action-quiet" onClick={() => navigate('discover')}>Explore <span aria-hidden="true">↗</span></button>
      </div>
    </header>
    <main id="cnr-main" tabIndex={-1}>
      {view === 'arrival' ? <>
        <section className="cnr-hero" aria-labelledby="cnr-heading">
          <SceneArt scene="games" eager/>
          <div className="cnr-hero-night" aria-hidden="true"/>
          <VectorInstrument/>
          <div className="cnr-hero-copy">
            <p className="cnr-overline"><span className="cnr-line"/> THE CONTINUANCE INSTITUTE <span className="cnr-blue">/</span> FIRST CONTACT 001</p>
            <p className="cnr-eyebrow">A creative universe / an open entry</p>
            <h1 id="cnr-heading" ref={heading} tabIndex={-1}>A UNIVERSE<br/><em>IN THE <span>MAKING.</span></em></h1>
            <p className="cnr-hero-lead">Explore independent worlds, games, applications and ideas. Discover the people behind them—or create something nobody has seen before.</p>
            <div className="cnr-hero-buttons"><button className="cnr-action cnr-action-primary" onClick={() => navigate('discover')}>Enter ANEVUM <span aria-hidden="true">↗</span></button><button className="cnr-action" onClick={() => { setView('discover'); setCategory('tools'); }}>Explore creative tools <span aria-hidden="true">↗</span></button></div>
            <p className="cnr-caption"><i aria-hidden="true"/> Explore without signing in. Studio publishing remains in testing.</p>
          </div>
          <aside className="cnr-iren-card" aria-label="Contextual guide design example">
            <div className="cnr-instrument-label"><span>INSTITUTE SIGNAL / 01</span><span className="cnr-blue">● ● ●</span></div>
            <div className="cnr-iren-orb"><OrbitalMark/></div>
            <p className="cnr-micro">YOUR GUIDE / IREN</p>
            <h2>Find your way<br/>through the network.</h2>
            <p>This visual panel demonstrates where the existing IREN companion will appear.</p>
            <button type="button" onClick={() => setHelpOpen(v => !v)} aria-expanded={helpOpen}>{helpOpen ? 'Close preview note' : 'About IREN'} <span aria-hidden="true">↗</span></button>
            {helpOpen && <p className="cnr-help-note" role="status">IREN is not connected in this isolated review. The production integration must reuse the existing single assistant.</p>}
          </aside>
          <div className="cnr-hero-footer"><span>ANEVUM / THE CREATIVE NETWORK</span><span>SIGNAL ESTABLISHED</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>
        <section className="cnr-wayfinder" aria-labelledby="cnr-wayfinder-title">
          <div className="cnr-section-head"><div><span className="cnr-micro">YOUR ENTRY POINTS / 02</span><h2 id="cnr-wayfinder-title">Find your <em>direction.</em></h2></div><p>One universe. Different ways to explore. Every entrance leads somewhere useful.</p></div>
          <div className="cnr-wayfinder-grid">
            {rooms.slice(0, 3).map(room => <CategoryArtwork key={room.id} room={room} onPick={pick}/>)}
          </div>
        </section>
        <section className="cnr-statement"><div><span className="cnr-micro">OUR PRINCIPLE / 03</span><h2>Not just a website.<br/><em>A place to create.</em></h2></div><div><p>ANEVUM brings discovery, creation, community and earned identity together without inventing activity or placing spectacle above control.</p><button type="button" onClick={() => navigate('discover')}>Explore the universe <span aria-hidden="true">↗</span></button></div></section>
      </> : <>
        <section className="cnr-discover-hero" aria-labelledby="cnr-heading">
          <SceneArt scene="creative" eager/><VectorInstrument/>
          <div><p className="cnr-overline"><span className="cnr-line"/> ANEVUM / THE DISCOVERY ATLAS</p><h1 ref={heading} tabIndex={-1} id="cnr-heading">FIND THE<br/><em>UNEXPECTED.</em></h1><p>Beautifully presented creative disciplines, useful filters and a direct route to genuine published work. No fabricated projects or popularity statistics.</p></div>
          <span className="cnr-discover-index">SIGNAL / 002</span>
        </section>
        <section className="cnr-discovery" aria-label="Discover design states">
          <div className="cnr-discovery-main">
            <div className="cnr-section-head"><div><p className="cnr-micro">THE PUBLIC CATALOGUE / VISUAL REVIEW</p><h2>Explore <em>the fields.</em></h2></div><p>Search and category behavior are local examples. Real project records remain the responsibility of the existing catalogue service.</p></div>
            <form className="cnr-search" role="search" onSubmit={e => e.preventDefault()}><label htmlFor="cnr-search-input">Search disciplines</label><div><span aria-hidden="true">⌕</span><input id="cnr-search-input" type="search" value={query} onChange={e => setQuery(e.target.value)} maxLength={80} placeholder="Games, tools, research..."/><button type="button" onClick={() => { setQuery(''); pick('all'); }} aria-label="Clear discovery filters">Clear</button></div></form>
            <div className="cnr-filter-row" aria-label="Filter disciplines">{([{id:'all',name:'All fields'},...rooms.map(r=>({id:r.id,name:r.name}))] as const).map(item=><button type="button" key={item.id} aria-pressed={category===item.id} onClick={()=>pick(item.id)}>{item.name}</button>)}</div>
            <div className="cnr-resultbar"><div><span className="cnr-micro">DISCIPLINE INDEX / DESIGN SPECIMEN</span><strong>{visibleRooms.length} {visibleRooms.length === 1 ? 'field' : 'fields'} in view</strong></div><div className="cnr-result-actions"><button type="button" aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}>Grid</button><button type="button" aria-pressed={layout==='list'} onClick={()=>setLayout('list')}>List</button></div></div>
            <div className={'cnr-rooms ' + (layout === 'list' ? 'cnr-rooms-list' : '')}>
              {visibleRooms.length > 0 ? visibleRooms.map(room=><CategoryArtwork key={room.id} room={room} onPick={pick}/>) : <div className="cnr-no-match" role="status"><h3>No matching disciplines</h3><p>Adjust your search or clear filters to return to the full index.</p><button className="cnr-action" onClick={()=>{setQuery('');pick('all');}}>Clear filters</button></div>}
            </div>
            <section className="cnr-state-panel" aria-label="Catalog response demonstrations">
              <header><span className="cnr-micro">PUBLIC DATA STATES</span><span>INTERACTIVE DEMONSTRATION / NO NETWORK</span></header>
              <div className="cnr-state-switch" role="group" aria-label="Preview response state">{(['browse','loading','empty','error'] as const).map(item=><button type="button" key={item} aria-pressed={catalogueState===item} onClick={()=>setCatalogueState(item)}>{item}</button>)}</div>
              <div className="cnr-state-inner" role="status" aria-live="polite"><span className="cnr-state-symbol">{catalogueState==='error'?'!':catalogueState==='loading'?'◌':'✳'}</span><div><h3>{state.title}</h3><p>{state.detail}</p></div></div>
            </section>
          </div>
          <aside className="cnr-discovery-aside"><div className="cnr-aside-inner"><p className="cnr-micro">INSTRUMENT PANEL / PROJECT PASSPORT</p><div className="cnr-aside-icon"><OrbitalMark/></div><h2>Know what<br/>you're opening.</h2><p>Project destinations will disclose the creator, compatibility, access and genuine publication state.</p><dl><dt>Destination</dt><dd>Game, app, source or demo</dd><dt>Ownership</dt><dd>Actual verified creator</dd><dt>Access</dt><dd>Device and account requirements</dd><dt>Rights</dt><dd>Clear provenance and limitations</dd></dl><span className="cnr-aside-foot">CONTEXT, NOT FABRICATED SIGNALS</span></div></aside>
        </section>
      </>}
    </main>
    <footer className="cnr-footer"><div><OrbitalMark/><span><strong>ANEVUM</strong><small>CONTINUANCE INSTITUTE / CREATIVE NETWORK</small></span></div><p>Design review only. All activity and catalogue content shown here is illustrative and disconnected from live services.</p></footer>
  </div>;
}
