import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CommonsPublicPage from "./CommonsPages";
import Mark from "../components/Mark";
import { fieldNotes, type FieldNote } from "../data/fieldNotes";
import { memberAuthClient } from "../member/auth-client";
import css from "../styles/commons-v5.css?inline";
import polishCss from "../styles/commons-v5-polish.css?inline";
import pagesCss from "../styles/commons-v5-pages.css?inline";
import accountCss from "../styles/commons-v5-accounts.css?inline";
import memberCommandCss from "../styles/member-command.css?inline";
import memberBaseCss from "../styles/members.css?inline";
import memberFinancialCss from "../styles/member-financial.css?inline";

/**
 * Project Commons Stage 1. V5 visual parity baseline in an isolated Shadow DOM.
 * Public, published Field Notes only. NO member posts, fake profiles, brokerage
 * state, voting totals, member D1 reads/writes, or payment interactions.
 * See docs/design/commons-stage-01-public-entrance.md.
 */
type Palette = "midnight" | "carbon" | "paper" | "plum";
type Layout = "social" | "focus";
type Surface = "cards" | "seamless";
type Density = "comfortable" | "compact";
type Radius = "soft" | "sharp";
type Filter = "all" | "systems" | "engineering" | "research" | "release";

type Preferences = {
  theme: Palette;
  layout: Layout;
  surface: Surface;
  density: Density;
  radius: Radius;
};
const defaults: Preferences = {
  theme: "midnight", layout: "social", surface: "cards",
  density: "comfortable", radius: "soft"
};
const choices = {
  theme: ["midnight", "carbon", "paper", "plum"],
  layout: ["social", "focus"],
  surface: ["cards", "seamless"],
  density: ["comfortable", "compact"],
  radius: ["soft", "sharp"]
} as const;

function loadPreferences(): Preferences {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem("anevum-commons-v5-design") || "{}");
    if (!parsed || typeof parsed !== "object") return defaults;
    const record = parsed as Record<string, unknown>;
    return {
      theme: choices.theme.includes(record.theme as Palette) ? record.theme as Palette : defaults.theme,
      layout: choices.layout.includes(record.layout as Layout) ? record.layout as Layout : defaults.layout,
      surface: choices.surface.includes(record.surface as Surface) ? record.surface as Surface : defaults.surface,
      density: choices.density.includes(record.density as Density) ? record.density as Density : defaults.density,
      radius: choices.radius.includes(record.radius as Radius) ? record.radius as Radius : defaults.radius
    };
  } catch {
    return defaults;
  }
}

function Icon({ name, className = "ico" }: { name: string; className?: string }) {
  return <svg className={className} aria-hidden="true"><use href={"/commons-v5-icons.svg#i-" + name} /></svg>;
}

function OfficialAvatar({ size = "avatar-md" }: { size?: string }) {
  return <span className={"avatar avatar-official " + size} aria-hidden="true">A</span>;
}

function Header({ onMenu, search, setSearch, onDesign, onNotice, inputRef, pathname, onSearchSubmit }:{
  onMenu: () => void; search: string; setSearch: (value: string) => void;
  onDesign: () => void; onNotice: () => void; inputRef: React.RefObject<HTMLInputElement | null>;
  pathname: string; onSearchSubmit: () => void;
}) {
  const { data: session } = memberAuthClient.useSession();
  return <header className="global-header">
    <div className="header-brand">
      <button type="button" className="icon-btn nav-toggle" aria-label="Toggle navigation" onClick={onMenu}><Icon name="menu"/></button>
      <Link className="brand" to="/" aria-label="ANEVUM Commons home">
        <span className="brand-mark"><Mark /></span>
        <span className="brand-text"><strong>ANEVUM</strong><small>the commons</small></span>
      </Link>
    </div>
    <div className="global-search" role="search">
      <Icon name="search"/>
      <input ref={inputRef} type="search" value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search ANEVUM publications..." aria-label="Search published ANEVUM work" onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();onSearchSubmit();}}} />
      <kbd>/</kbd>
    </div>
    <nav className="top-links" aria-label="Top navigation">
      <Link to="/" className={pathname==="/"||pathname==="/feed"?"active":""} aria-current={pathname==="/"||pathname==="/feed"?"page":undefined}>Commons</Link>
      <Link to="/products" className={pathname==="/products"?"active":""} aria-current={pathname==="/products"?"page":undefined}>Discover</Link>
      <Link to="/field-notes" className={pathname.startsWith("/field-notes")?"active":""} aria-current={pathname.startsWith("/field-notes")?"page":undefined}>Research</Link>
    </nav>
    <div className="global-actions">
      <button type="button" className="create-btn" onClick={onNotice}><Icon name="plus"/><span>Create</span></button>
      <button type="button" className="icon-btn header-bell" aria-label="Notifications" onClick={onNotice}><Icon name="bell"/></button>
      <button type="button" className="icon-btn design-launch" aria-label="Customize design" title="Customize design" onClick={onDesign}><Icon name="palette"/></button>
      <Link to={session?.user ? "/command" : "/sign-in"} className="user-chip" aria-label={session?.user ? "My Command" : "Sign in"}>
        <span className="avatar avatar-header user-avatar">{session?.user?.name?.charAt(0).toUpperCase() || "G"}</span>
        <Icon name="chevron"/>
      </Link>
    </div>
  </header>;
}

function Sidebar({ collapsed, onClose, onNotice, pathname }: {
  collapsed: boolean; onClose: () => void; onNotice: () => void; pathname: string;
}) {
  const { data: session } = memberAuthClient.useSession();
  const userName = session?.user?.name || "Browsing as guest";
  const userInitial = userName.charAt(0).toUpperCase();
  return <aside id="commons-primary-navigation" className="left-sidebar" aria-label="Main navigation"><div className="sidebar-scroll">
    <div className="sidebar-nav-group">
      <span className="side-heading">EXPLORE</span>
      <Link className={"side-link "+(pathname==="/"||pathname==="/feed"?"active":"")} to="/" aria-current={pathname==="/"||pathname==="/feed"?"page":undefined} title="Home feed" onClick={onClose}><Icon name="home"/><span>Home feed</span></Link>
      <Link className={"side-link "+(pathname==="/products"?"active":"")} to="/products" aria-current={pathname==="/products"?"page":undefined} title="Discover" onClick={onClose}><Icon name="compass"/><span>Discover</span></Link>
      <Link className={"side-link "+(pathname.startsWith("/field-notes")?"active":"")} to="/field-notes" aria-current={pathname.startsWith("/field-notes")?"page":undefined} title="Research" onClick={onClose}><Icon name="book"/><span>Research</span></Link>
      <Link className={"side-link "+(pathname==="/communities"?"active":"")} to="/communities" title="Explore topics" onClick={onClose}><Icon name="users"/><span>Topics</span></Link>
      <button type="button" className="side-link" title="Levels and awards" onClick={onNotice}><Icon name="award"/><span>Levels &amp; awards</span><span className="side-small-label">SOON</span></button>
    </div>
    <div className="side-divider"/>
    <div className="sidebar-nav-group community-nav">
      <div className="group-heading"><span className="side-heading">EXPLORE TOPICS</span><Link className="side-mini-btn" to="/communities" aria-label="Browse topics" onClick={onClose}><Icon name="plus"/></Link></div>
      <Link className="community-link" to="/field-notes" onClick={onClose}><span className="community-icon ci-blue">λ</span><span>Algorithms &amp; methods</span></Link>
      <Link className="community-link" to="/field-notes" onClick={onClose}><span className="community-icon ci-orange">⌘</span><span>Software &amp; builders</span></Link>
      <Link className="community-link" to="/field-notes" onClick={onClose}><span className="community-icon ci-purple">∑</span><span>Mathematics &amp; theory</span></Link>
      <Link className="community-link" to="/field-notes" onClick={onClose}><span className="community-icon ci-sky">✺</span><span>Research &amp; evidence</span></Link>
      <Link className="sidebar-small-link" to="/learn" onClick={onClose}>Learn with published research <Icon name="arrow-right"/></Link>
    </div>
    <div className="side-divider"/>
    <div className="sidebar-nav-group">
      <span className="side-heading">YOUR WORKSPACE</span>
      <Link to={session?.user ? "/command" : "/sign-in"} className="side-link" title="My profile"><Icon name="user"/><span>My profile</span></Link>
      <button type="button" className="side-link" onClick={onNotice}><Icon name="bookmark"/><span>Saved work</span></button>
      <Link to="/products/rhen" className="side-link" title="RHEN"><Icon name="chart"/><span>RHEN</span><span className="mini-app">APP</span></Link>
      <Link to={session?.user ? "/command" : "/sign-in"} className="side-link" title="My Command"><Icon name="command"/><span>My Command</span></Link>
    </div>
    <div className="side-bottom">
      <div className="side-divider"/>
      <Link className="sidebar-member-card" to={session?.user ? "/command" : "/sign-in"}>
        <span className="avatar avatar-md user-avatar">{userInitial}</span>
        <span className="sidebar-member-meta"><strong>{userName}</strong><small>{session?.user ? "Open your private account" : "Sign in to participate"}</small></span>
        <Icon name="chevron"/>
      </Link>
      <div className="side-foot-links"><Link to="/about">About</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
    </div>
  </div></aside>;
}

function GraphArtwork() {
  return <div className="post-art art-graph" aria-label="Abstract illustrative line chart, not trading data">
    <span className="eyebrow">SYSTEMS / EDITORIAL ART</span>
    <svg viewBox="0 0 240 130" aria-hidden="true">
      <path className="chart-grid" d="M0 33h240M0 65h240M0 97h240M30 0v130M90 0v130M150 0v130M210 0v130"/>
      <path className="chart-two" d="M0 98 22 89 39 94 58 74 81 82 102 64 119 76 141 60 162 71 185 57 203 64 229 35 240 43"/>
      <path className="chart-line" d="M0 113 26 109 43 85 64 95 86 74 103 78 124 53 149 70 173 44 197 46 217 24 240 16"/>
    </svg>
  </div>;
}
function prettyDate(date: string) {
  const parsed = new Date(date + "T12:00:00Z");
  return Number.isNaN(parsed.valueOf()) ? date :
    new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"}).format(parsed);
}
function NotePost({ note, feature, onNotice }:{
  note: FieldNote; feature: boolean; onNotice: () => void;
}) {
  const url = "/field-notes/" + note.slug;
  const tags = note.systems.slice(0,2);
  return <article className="post">
    <header className="post-header">
      <OfficialAvatar size=""/>
      <div className="post-identity">
        <Link className="post-author" to="/about">ANEVUM</Link>
        <span className="verified-icon" title="First-party ANEVUM publication">✓</span>
        <span className="post-meta-dot">·</span>
        <time className="post-meta" dateTime={note.date}>{prettyDate(note.date)}</time>
        <span className="post-meta-dot">·</span>
        <span className="post-community">Field Notes / {note.type.toLowerCase()}</span>
      </div>
      <button type="button" className="more-btn" aria-label="More publication options" title="More options" onClick={onNotice}><Icon name="more"/></button>
    </header>
    <div className={feature ? "post-preview-split" : ""}>
      <div className="post-main">
        <h2 className="post-title"><Link to={url}>{note.title}</Link></h2>
        <p className="post-excerpt">{note.summary}</p>
        <div className="post-tags">
          {tags.map(tag=><span className="post-tag" key={tag}>{tag}</span>)}
          <span className="real-badge">Published source</span>
        </div>
      </div>
      {feature ? <GraphArtwork/> : null}
    </div>
    <footer className="post-foot">
      <button type="button" className="action-pill vote-pill" title="Voting is not available yet" onClick={onNotice}><Icon name="arrow-up"/><strong>Vote</strong></button>
      <Link className="action-pill" to={url}><Icon name="comment"/>Read</Link>
      <button className="action-pill" type="button" onClick={onNotice}><Icon name="bookmark"/>Save</button>
      <button className="action-pill share-action" type="button" onClick={()=>{
        const href = new URL(url,window.location.origin).href;
        if (navigator.share) void navigator.share({title:note.title,url:href}).catch(()=>{});
        else if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(href).catch(()=>{});
        else onNotice();
      }}><Icon name="share"/>Share</button>
      <Link className="end-link" to={url}>Read source <Icon name="arrow-up-right"/></Link>
    </footer>
  </article>;
}

function Feed({ search, filter, setFilter, density, setDensity, onNotice }: {
  search: string; filter: Filter; setFilter: (filter: Filter)=>void;
  density: Density; setDensity: (value: Density)=>void; onNotice: ()=>void;
}) {
  const notes = useMemo(()=>[...fieldNotes].sort((a,b)=>b.date.localeCompare(a.date)),[]);
  const matching = notes.filter(note =>
    (filter === "all" || note.type.toLowerCase() === filter) &&
    [note.title,note.summary,note.type,...note.systems].join(" ").toLowerCase().includes(search.trim().toLowerCase())
  );
  const tabs: {id:Filter;label:string}[] = [
    {id:"all",label:"All posts"}, {id:"systems",label:"Systems"},
    {id:"engineering",label:"Engineering"}, {id:"research",label:"Research"},
    {id:"release",label:"Releases"}
  ];
  return <>
    <section className="feed-header">
      <div><h1>The Commons<span style={{color:"var(--accent)"}}>.</span></h1><p>Build something. Learn something. Share what you find.</p></div>
      <div className="feed-header-controls">
        <button type="button" className={"layout-btn "+(density==="comfortable"?"active":"")} onClick={()=>setDensity("comfortable")} aria-label="Comfortable feed" aria-pressed={density==="comfortable"}><Icon name="layout"/></button>
        <button type="button" className={"layout-btn "+(density==="compact"?"active":"")} onClick={()=>setDensity("compact")} aria-label="Compact feed" aria-pressed={density==="compact"}><Icon name="list"/></button>
      </div>
    </section>
    <div className="demo-strip"><span className="dot"/><span><strong>Public ANEVUM work</strong> — {notes.length} authentic publications; member discussions are in development.</span></div>
    <div className="feed-tabs" role="group" aria-label="Publication filters">
      {tabs.map(tab=><button type="button" key={tab.id} className={"tab "+(filter===tab.id?"active":"")}
        aria-pressed={filter===tab.id} onClick={()=>setFilter(tab.id)}>{tab.label}</button>)}
      <span className="feed-spacer"/>
      <span className="feed-sort"><Icon name="filter"/>Latest</span>
    </div>
    <button type="button" className="composer" onClick={onNotice}>
      <span className="avatar avatar-official">G</span>
      <span className="composer-text">Sign in to share your work or ask a question...</span>
      <span className="composer-tools"><span className="composer-tool"><Icon name="image"/></span><span className="composer-tool"><Icon name="plus"/></span></span>
    </button>
    <section className="post-list" aria-label="Published ANEVUM work">
      {matching.length ? matching.map((note,index)=><NotePost note={note} feature={index===0 && filter==="all" && !search.trim()} onNotice={onNotice} key={note.slug}/>) :
        <div className="c-v5-empty" role="status"><strong>No matching publications</strong>Try another search term or category.</div>}
    </section>
  </>;
}

function RightRail({ onNotice }:{onNotice:()=>void}) {
  const notes = [...fieldNotes].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  return <aside className="right-sidebar" aria-label="Discover">
    <section className="right-card rail-intro">
      <span className="tiny-overline">WELCOME TO THE COMMONS</span>
      <h2>Ideas are better when we can examine them.</h2>
      <p>Read real published ANEVUM work. Public member profiles and community participation are still being built.</p>
      <Link to="/sign-in" className="rail-link">Sign in to ANEVUM <Icon name="arrow-up-right"/></Link>
    </section>
    <section className="right-card">
      <div className="rail-title"><h3>Explore ANEVUM</h3></div>
      <div className="rail-list">
        <Link to="/products/rhen" className="rail-row">
          <span className="community-icon ci-blue">R</span><span><strong>RHEN</strong><small>Research application · Under evaluation</small></span><Icon name="arrow-up-right" className="right-arrow"/>
        </Link>
        <Link to="/field-notes" className="rail-row">
          <span className="community-icon ci-orange">✎</span><span><strong>Field Notes</strong><small>Published development records</small></span><Icon name="arrow-up-right" className="right-arrow"/>
        </Link>
        <Link to="/products" className="rail-row">
          <span className="community-icon ci-purple">⌘</span><span><strong>Explore projects</strong><small>Real ANEVUM software</small></span><Icon name="arrow-up-right" className="right-arrow"/>
        </Link>
      </div>
    </section>
    <section className="right-card">
      <div className="rail-title"><h3>Recent first-party work</h3><Link to="/field-notes">All notes</Link></div>
      {notes.map(note=><Link to={"/field-notes/"+note.slug} className="rail-file" key={note.slug}>
        <span>{prettyDate(note.date)} · {note.type}</span><strong>{note.title}</strong>
      </Link>)}
    </section>
    <p className="rail-footer">This feed contains published work only. Community metrics, endorsements, levels and trading returns are not simulated.</p>
    <button type="button" className="sidebar-small-link" onClick={onNotice}>About joining Commons <Icon name="arrow-right"/></button>
  </aside>;
}

function AppearancePanel({ prefs, onChange, onClose, onReset }: {
  prefs: Preferences; onChange: (next:Preferences)=>void;
  onClose: ()=>void; onReset: ()=>void;
}) {
  const groups: {key:keyof Preferences;title:string;options:{key:string;label:string}[]}[] = [
    {key:"layout",title:"LAYOUT",options:[{key:"social",label:"Three columns"},{key:"focus",label:"Wide feed"}]},
    {key:"surface",title:"POST SURFACES",options:[{key:"cards",label:"Soft cards"},{key:"seamless",label:"Seamless feed"}]},
    {key:"density",title:"POST DENSITY",options:[{key:"comfortable",label:"Comfortable"},{key:"compact",label:"Compact"}]},
    {key:"radius",title:"CORNER STYLE",options:[{key:"soft",label:"Soft"},{key:"sharp",label:"Crisp"}]}
  ];
  const themes: {key:Palette;label:string}[]=[
    {key:"midnight",label:"Midnight"},{key:"carbon",label:"Carbon"},
    {key:"paper",label:"Daylight"},{key:"plum",label:"Plum"}
  ];
  return <div className="design-panel" role="region" aria-label="Customize Commons appearance">
    <div className="design-panel-header"><div><span className="eyebrow">INTERFACE LAB</span><h3>Make it yours.</h3></div>
      <button type="button" className="icon-btn" aria-label="Close appearance settings" onClick={onClose}><Icon name="x"/></button>
    </div>
    <div className="design-section"><span className="design-label">COLOR DIRECTION</span>
      <div className="theme-swatches" role="group" aria-label="Color direction">
        {themes.map(t=><button key={t.key} type="button" className={"theme-option "+(prefs.theme===t.key?"selected":"")}
          aria-pressed={prefs.theme===t.key} onClick={()=>onChange({...prefs,theme:t.key})}>
          <span className={"swatch s-"+t.key}><i/><b/></span><strong>{t.label}</strong>
        </button>)}
      </div>
    </div>
    {groups.map(group=><div className="design-section" key={group.key}>
      <span className="design-label">{group.title}</span>
      <div className="segmented design-segment">{group.options.map(choice=><button
        type="button" key={choice.key} className={prefs[group.key]===choice.key?"selected":""}
        aria-pressed={prefs[group.key]===choice.key} onClick={()=>onChange({...prefs,[group.key]:choice.key})}>{choice.label}</button>)}</div>
    </div>)}
    <div className="design-section last"><span className="design-label">LIVE DATA POLICY</span>
      <p className="micro-note">Only verified first-party ANEVUM publications are displayed. No fictional accounts, engagement totals, or research results.</p>
    </div>
    <button type="button" className="reset-design" onClick={onReset}><Icon name="settings"/> Reset design choices</button>
  </div>;
}

function CommonsApp({prefs,setPrefs,content}: {prefs:Preferences;setPrefs:(next:Preferences)=>void;content?:ReactNode}) {
  const [filter,setFilter] = useState<Filter>("all");
  const [search,setSearch] = useState("");
  const [designOpen,setDesignOpen] = useState(false);
  const [drawerOpen,setDrawerOpen] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [noticeOpen,setNoticeOpen] = useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const { data: session } = memberAuthClient.useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isFeed = pathname === "/" || pathname === "/feed";

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const originalTarget=event.composedPath()[0] as HTMLElement | undefined;
      const tag=originalTarget?.tagName;
      const editing=tag==="INPUT" || tag==="TEXTAREA" || originalTarget?.isContentEditable;
      if(event.key==="/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey){
        event.preventDefault();searchRef.current?.focus();
      }
      if(event.key==="Escape"){setDesignOpen(false);setDrawerOpen(false);setNoticeOpen(false);}
    };
    document.addEventListener("keydown",onKey);
    return ()=>document.removeEventListener("keydown",onKey);
  },[]);

  return <div className={"app "+(content?"account-view ":"")+(collapsed?"nav-collapsed ":"")+(drawerOpen?"drawer-open":"")}>
    <Header search={search} setSearch={setSearch} inputRef={searchRef} pathname={pathname}
      onSearchSubmit={()=>navigate("/field-notes?q="+encodeURIComponent(search.trim()))}
      onMenu={()=>{if(window.matchMedia("(max-width: 900px)").matches) setDrawerOpen(x=>!x); else setCollapsed(x=>!x);}}
      onDesign={()=>setDesignOpen(x=>!x)} onNotice={()=>setNoticeOpen(true)}/>
    <div className="shell">
      <Sidebar collapsed={collapsed} pathname={pathname} onClose={()=>setDrawerOpen(false)} onNotice={()=>setNoticeOpen(true)}/>
      <main className="main" id="commons-main">
        {content ? <section className="c2-member" aria-label="Private member account presentation">{content}</section> : isFeed ? <Feed search={search} filter={filter} setFilter={setFilter} density={prefs.density}
          setDensity={next=>setPrefs({...prefs,density:next})} onNotice={()=>setNoticeOpen(true)}/> :
          <CommonsPublicPage pathname={pathname} search={search} />}
      </main>
      {content ? null : <RightRail onNotice={()=>setNoticeOpen(true)}/>}
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link to="/" className={isFeed?"active":""} aria-current={isFeed?"page":undefined}><Icon name="home"/><span>Home</span></Link>
      <Link to="/products" className={pathname==="/products"?"active":""}><Icon name="compass"/><span>Explore</span></Link>
      <button type="button" className="mobile-create" aria-label="Create a post" onClick={()=>setNoticeOpen(true)}><Icon name="plus"/></button>
      <Link to="/field-notes" className={pathname.startsWith("/field-notes")?"active":""}><Icon name="book"/><span>Research</span></Link>
      <Link to={session?.user ? "/command" : "/sign-in"}><Icon name="user"/><span>Account</span></Link>
    </nav>
    {drawerOpen ? <button type="button" className="drawer-scrim" aria-label="Close navigation" onClick={()=>setDrawerOpen(false)}/> : null}
    {designOpen ? <AppearancePanel prefs={prefs} onChange={setPrefs} onClose={()=>setDesignOpen(false)} onReset={()=>setPrefs(defaults)}/> : null}
    {noticeOpen ? <div className="c-v5-dialog-backdrop" onClick={()=>setNoticeOpen(false)}>
      <div className="c-v5-dialog" role="dialog" aria-modal="true" aria-labelledby="commons-notice-title" onClick={e=>e.stopPropagation()}>
        <h2 id="commons-notice-title">Commons is being built.</h2>
        <p>This first stage provides real public publications in the new interface. Member posts, voting, saving, badges and communities require separate releases and authorization.</p>
        <div className="dialog-buttons"><button type="button" className="btn-secondary" onClick={()=>setNoticeOpen(false)}>Continue browsing</button>
          <Link className="btn-primary" to="/sign-in">Sign in <Icon name="arrow-up-right"/></Link></div>
      </div>
    </div> : null}
  </div>;
}

export default function CommonsV5({content}: {content?:ReactNode}) {
  const mount = useRef<HTMLDivElement>(null);
  const [shadow,setShadow]=useState<ShadowRoot|null>(null);
  useEffect(()=>{
    if(mount.current){setShadow(mount.current.shadowRoot || mount.current.attachShadow({mode:"open"}));}
  },[]);
  const [prefs,setPrefs]=useState<Preferences>(loadPreferences);
  useEffect(()=>{
    try {window.localStorage.setItem("anevum-commons-v5-design",JSON.stringify(prefs));}
    catch { /* local preferences are optional */ }
  },[prefs]);
  // Scope both the baseline and refinements in the Shadow DOM; legacy pages are unaffected.
  return <div ref={mount} className="anevum-commons-v5-mount"
    data-theme={prefs.theme} data-layout={prefs.layout} data-density={prefs.density}
    data-radius={prefs.radius} data-surface={prefs.surface} style={{display:"block",minHeight:"100dvh"}}>
    {shadow ? createPortal(<><style>{css+"\n"+polishCss+"\n"+pagesCss+"\n"+memberCommandCss+"\n"+memberBaseCss+"\n"+memberFinancialCss+"\n"+accountCss}</style><CommonsApp prefs={prefs} setPrefs={setPrefs} content={content}/></>,shadow) : null}
  </div>;
}

