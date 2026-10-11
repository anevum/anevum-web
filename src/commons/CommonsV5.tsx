import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CommonsPublicPage from "./CommonsPages";
import Mark from "../components/Mark";
import { fieldNotes, type FieldNote } from "../data/fieldNotes";
import { memberAuthClient } from "../member/auth-client";
import { primaryNavigation, accountNavigation, mobileNavigation, isSiteNavigationActive, safeAccountDestination } from "./site-navigation";
import liveCss from "../styles/commons-v5-live-system.css?inline";
import memberVerifierCss from "../styles/member-staging-qa.css?inline";
import css from "../styles/commons-v5.css?inline";
import polishCss from "../styles/commons-v5-polish.css?inline";
import pagesCss from "../styles/commons-v5-pages.css?inline";
import accountCss from "../styles/commons-v5-accounts.css?inline";
import brokerReviewCss from "../styles/commons-v5-broker-review.css?inline";
import memberCommandCss from "../styles/member-command.css?inline";
import memberBaseCss from "../styles/members.css?inline";
import memberDraftCss from "../styles/member-rhen-draft.css?inline";
import privateRhenCss from "../styles/commons-v5-private-rhen.css?inline";
import discussionsCss from "../styles/commons-v5-discussions.css?inline";
import betaCss from "../styles/commons-v5-beta.css?inline";
import memberFinancialCss from "../styles/member-financial.css?inline";

/**
 * Project Commons Stage 1. V5 visual parity baseline in an isolated Shadow DOM.
 * Public, published Field Notes only. NO member posts, fake profiles, brokerage
 * state, voting totals, member D1 reads/writes, or payment interactions.
 * See docs/design/commons-stage-01-public-entrance.md.
 */
type Palette = "forest" | "midnight" | "carbon" | "paper" | "plum";
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
  theme: "forest", layout: "social", surface: "cards",
  density: "comfortable", radius: "soft"
};
const choices = {
  theme: ["forest", "midnight", "carbon", "paper", "plum"],
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

function Header({ onMenu, search, setSearch, onDesign, inputRef, pathname, onSearchSubmit }:{
  onMenu: () => void; search: string; setSearch: (value: string) => void;
  onDesign: () => void; inputRef: React.RefObject<HTMLInputElement | null>;
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
      {primaryNavigation.filter(item=>["/","/products","/communities","/field-notes"].includes(item.path)).map(item=>
        <Link key={item.path} to={item.path} className={isSiteNavigationActive(pathname,item.path)?"active":""}
          aria-current={isSiteNavigationActive(pathname,item.path)?"page":undefined}>{item.label}</Link>)}
    </nav>
    <div className="global-actions">
      <Link className="create-btn" to={session?.user?"/apps/rhen":"/beta"}>
        <Icon name={session?.user?"chart":"arrow-up-right"}/><span>{session?.user?"My RHEN":"Get started"}</span>
      </Link>
      <button type="button" className="icon-btn design-launch" aria-label="Customize design" title="Customize design" onClick={onDesign}><Icon name="palette"/></button>
      <Link to={session?.user ? "/command" : "/sign-in"} className="user-chip" aria-label={session?.user ? "My Command" : "Sign in"}>
        <span className="avatar avatar-header user-avatar">{session?.user?.name?.charAt(0).toUpperCase() || "G"}</span>
        <Icon name="chevron"/>
      </Link>
    </div>
  </header>;
}

function Sidebar({ collapsed, onClose, pathname }: {
  collapsed: boolean; onClose: () => void; pathname: string;
}) {
  const { data: session } = memberAuthClient.useSession();
  const userName = session?.user?.name || "Browsing as guest";
  const userInitial = userName.charAt(0).toUpperCase();
  return <aside id="commons-primary-navigation" className="left-sidebar" aria-label="Main navigation"><div className="sidebar-scroll">
    <div className="sidebar-nav-group">
      <span className="side-heading">EXPLORE</span>
      {primaryNavigation.map(item=><Link key={item.path} to={item.path} onClick={onClose}
        className={"side-link "+(isSiteNavigationActive(pathname,item.path)?"active":"")}
        aria-current={isSiteNavigationActive(pathname,item.path)?"page":undefined}
        title={item.description}><Icon name={item.icon}/><span>{item.label}</span></Link>)}
    </div>
    <div className="side-divider"/>
    <div className="sidebar-nav-group community-nav">
      <div className="group-heading"><span className="side-heading">EXPLORE TOPICS</span><Link className="side-mini-btn" to="/communities" aria-label="Browse topics" onClick={onClose}><Icon name="plus"/></Link></div>
      <Link className="community-link" to="/field-notes?category=systems" onClick={onClose}><span className="community-icon ci-blue">λ</span><span>Systems &amp; architecture</span></Link>
      <Link className="community-link" to="/field-notes?category=engineering" onClick={onClose}><span className="community-icon ci-orange">⌘</span><span>Engineering &amp; software</span></Link>
      <Link className="community-link" to="/field-notes?category=research" onClick={onClose}><span className="community-icon ci-purple">∑</span><span>Research &amp; methods</span></Link>
      <Link className="community-link" to="/field-notes?category=release" onClick={onClose}><span className="community-icon ci-sky">✺</span><span>Releases &amp; changes</span></Link>
      <Link className="sidebar-small-link" to="/learn" onClick={onClose}>Learn with published research <Icon name="arrow-right"/></Link>
    </div>
    <div className="side-divider"/>
    <div className="sidebar-nav-group">
      <span className="side-heading">YOUR WORKSPACE</span>
      {accountNavigation.map(item=><Link key={item.path} to={session?.user?item.path:"/sign-in"} onClick={onClose}
        className={"side-link "+(isSiteNavigationActive(pathname,item.path)?"active":"")}
        aria-current={isSiteNavigationActive(pathname,item.path)?"page":undefined}
        title={item.description}><Icon name={item.icon}/><span>{item.label}</span></Link>)}
    </div>
    <div className="side-bottom">
      <div className="side-divider"/>
      <Link className="sidebar-member-card" to={session?.user ? "/command" : "/sign-in"}>
        <span className="avatar avatar-md user-avatar">{userInitial}</span>
        <span className="sidebar-member-meta"><strong>{userName}</strong><small>{session?.user ? "Open your private account" : "Sign in to participate"}</small></span>
        <Icon name="chevron"/>
      </Link>
      <div className="side-foot-links"><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
    </div>
  </div></aside>;
}

function PublishedActivity() {
  // Only first-party publication dates determine the values. No fake traffic,
  // orders, users, trade P&L or implied chronological continuity.
  const months = [...new Set(fieldNotes.map(note=>note.date.slice(0,7)))].sort().slice(-6);
  const points = months.map(month=>({
    month,count:fieldNotes.filter(note=>note.date.startsWith(month)).length
  }));
  const largest = Math.max(1,...points.map(point=>point.count));
  const description = points.map(point=>point.month+": "+point.count+" publications").join("; ");
  return <div className="post-art v5-activity-art" role="img"
    aria-label={"Published ANEVUM Field Notes by month: "+description}>
    <span className="v5-activity-title">PUBLISHED RECORDS / FIELD NOTES</span>
    <div className="v5-activity-bars">
      {points.map(point=><div className="v5-activity-month" key={point.month}>
        <span className="v5-activity-track">
          <span style={{height:(point.count/largest*100)+"%"}}/>
        </span>
        <small>{point.month.slice(5)}</small>
      </div>)}
    </div>
    <span className="v5-activity-note">Recorded publications · not trading data</span>
  </div>;
}
function prettyDate(date: string) {
  const parsed = new Date(date + "T12:00:00Z");
  return Number.isNaN(parsed.valueOf()) ? date :
    new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", year:"numeric", timeZone:"UTC"}).format(parsed);
}
function NotePost({ note, feature }: {
  note: FieldNote; feature: boolean;
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
      {feature ? <PublishedActivity/> : null}
    </div>
    <footer className="post-foot">
      <Link className="action-pill" to={url}><Icon name="book"/>Read note</Link>
      <Link className="action-pill" to="/field-notes"><Icon name="compass"/>More research</Link>
      <button className="action-pill share-action" type="button" onClick={()=>{
        const href = new URL(url,window.location.origin).href;
        if (navigator.share) void navigator.share({title:note.title,url:href}).catch(()=>{});
        else if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(href).catch(()=>{});
        else window.location.assign(href);
      }}><Icon name="share"/>Share</button>
      <Link className="end-link" to={url}>Read source <Icon name="arrow-up-right"/></Link>
    </footer>
  </article>;
}

function Feed({ search, filter, setFilter, density, setDensity }: {
  search: string; filter: Filter; setFilter: (filter: Filter)=>void;
  density: Density; setDensity: (value: Density)=>void;
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
    <section aria-label="Explore ANEVUM">
      <div className="v5-site-pathway-title"><h2>Find your way around</h2><span>Real software, documented work</span></div>
      <nav className="v5-site-pathway" aria-label="Find your next step">
        {[
          {index:"01",title:"Projects",detail:"Applications and their current status",path:"/products"},
          {index:"02",title:"Field Notes",detail:"Decisions, experiments and results",path:"/field-notes"},
          {index:"03",title:"Learning",detail:"Understand the research methods",path:"/learn"},
          {index:"04",title:"Your workspace",detail:"Free member access and available tools",path:"/beta"}
        ].map(item=><Link key={item.path} to={item.path}>
          <span className="v5-path-ordinal">{item.index} / ANEVUM</span>
          <strong>{item.title}</strong><small>{item.detail}</small>
        </Link>)}
      </nav>
    </section>
    <div className="feed-tabs" role="group" aria-label="Publication filters">
      {tabs.map(tab=><button type="button" key={tab.id} className={"tab "+(filter===tab.id?"active":"")}
        aria-pressed={filter===tab.id} onClick={()=>setFilter(tab.id)}>{tab.label}</button>)}
      <span className="feed-spacer"/>
      <span className="feed-sort"><Icon name="filter"/>Latest</span>
    </div>
    <div className="composer v5-discover-cta" role="note">
      <p>Community posting is still in development. Open research and member accounts are available separately.</p>
      <Link to="/beta">Explore member access <Icon name="arrow-up-right"/></Link>
    </div>
    <section className="post-list" aria-label="Published ANEVUM work">
      {matching.length ? matching.map((note,index)=><NotePost note={note} feature={index===0 && filter==="all" && !search.trim()} key={note.slug}/>) :
        <div className="c-v5-empty" role="status"><strong>No matching publications</strong>Try another search term or category.</div>}
    </section>
  </>;
}

function RightRail() {
  const { data: session } = memberAuthClient.useSession();
  const notes = [...fieldNotes].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  // Derived from real first-party publications, not social activity or broker data.
  const categories = ([
    ["SYSTEMS","Systems"],["ENGINEERING","Engineering"],
    ["RESEARCH","Research"],["RELEASE","Releases"]
  ] as const).map(([type,label])=>({
    type,label,count:fieldNotes.filter(note=>note.type===type).length
  }));
  const largest = Math.max(1,...categories.map(category=>category.count));
  return <aside className="right-sidebar" aria-label="Discover">
    <section className="right-card rail-intro">
      <span className="tiny-overline">WELCOME TO THE COMMONS</span>
      <h2>Ideas are better when we can examine them.</h2>
      <p>Read real published ANEVUM work. Public member profiles and community participation are still being built.</p>
      <Link to={session?.user ? "/command" : "/sign-in"} className="rail-link">{session?.user ? "Open your Command" : "Sign in to ANEVUM"} <Icon name="arrow-up-right"/></Link>
      <Link to={session?.user ? "/me/beta" : "/beta"} className="rail-link">{session?.user ? "Check your beta access" : "Explore member beta"} <Icon name="arrow-up-right"/></Link>
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
    <section className="right-card v5-source-chart" aria-labelledby="v5-publication-chart">
      <h3 id="v5-publication-chart">Published Field Notes</h3>
      {categories.map(category=><div className="v5-chart-row" key={category.type}>
        <span>{category.label}</span>
        <div className="v5-chart-track" role="img" aria-label={category.label+": "+category.count+" published notes"}>
          <span className="v5-chart-fill" style={{width:(category.count/largest*100)+"%"}}/>
        </div>
        <strong className="v5-chart-count">{category.count}</strong>
      </div>)}
      <p className="v5-chart-caption">Counts come from the published ANEVUM Field Notes registry. They are not votes, users or trading results.</p>
      <Link className="c2-text-link" to="/field-notes">Browse the records →</Link>
    </section>
    <p className="rail-footer">This feed contains published work only. Community metrics, endorsements, levels and trading returns are not simulated.</p>
    <Link className="sidebar-small-link" to="/beta">About joining ANEVUM <Icon name="arrow-right"/></Link>
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
    {key:"forest",label:"Forest"},{key:"midnight",label:"Midnight"},{key:"carbon",label:"Carbon"},
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
  const searchRef=useRef<HTMLInputElement>(null);
  const { data: session } = memberAuthClient.useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isFeed = pathname === "/" || pathname === "/feed";
  useEffect(()=>{setDrawerOpen(false);setDesignOpen(false);},[location.pathname]);

  // Published-note search results belong to the URL, not to a stale search
  // input carried over from another page. Deep links and topic filters remain
  // reproducible across refresh, history navigation and sidebar visits.
  useEffect(() => {
    setSearch(pathname === "/field-notes"
      ? new URLSearchParams(location.search).get("q") || ""
      : "");
  }, [pathname, location.search]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const originalTarget=event.composedPath()[0] as HTMLElement | undefined;
      const tag=originalTarget?.tagName;
      const editing=tag==="INPUT" || tag==="TEXTAREA" || originalTarget?.isContentEditable;
      if(event.key==="/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey){
        event.preventDefault();searchRef.current?.focus();
      }
      if(event.key==="Escape"){setDesignOpen(false);setDrawerOpen(false);}
    };
    document.addEventListener("keydown",onKey);
    return ()=>document.removeEventListener("keydown",onKey);
  },[]);

  return <div className={"app "+(content?"account-view ":"")+(collapsed?"nav-collapsed ":"")+(drawerOpen?"drawer-open":"")}>
    <Header search={search} setSearch={setSearch} inputRef={searchRef} pathname={pathname}
      onSearchSubmit={() => {
        const term = search.trim();
        navigate(term ? "/field-notes?q=" + encodeURIComponent(term) : "/field-notes");
      }}
      onMenu={()=>{if(window.matchMedia("(max-width: 900px)").matches) setDrawerOpen(x=>!x); else setCollapsed(x=>!x);}}
      onDesign={()=>setDesignOpen(x=>!x)}/>
    <div className="shell">
      <Sidebar collapsed={collapsed} pathname={pathname} onClose={()=>setDrawerOpen(false)}/>
      <main className="main" id="commons-main">
        {content ? <section className="c2-member" aria-label="Private member account presentation">{content}</section> : isFeed ? <Feed search={search} filter={filter} setFilter={setFilter} density={prefs.density}
          setDensity={next=>setPrefs({...prefs,density:next})}/> :
          <CommonsPublicPage pathname={pathname} />}
      </main>
      {content ? null : <RightRail/>}
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobileNavigation.map(item=><Link key={item.path}
        to={item.path==="/command"?safeAccountDestination(Boolean(session?.user)):item.path}
        className={isSiteNavigationActive(pathname,item.path)?"active":""}
        aria-current={isSiteNavigationActive(pathname,item.path)?"page":undefined}
        aria-label={item.path==="/command"&&!session?.user?"Sign in":item.label}
        onClick={()=>setDrawerOpen(false)}>
          <Icon name={item.path==="/command"&&!session?.user?"user":item.icon}/>
          <span>{item.path==="/command"?"Account":item.label}</span>
        </Link>)}
    </nav>
    {drawerOpen ? <button type="button" className="drawer-scrim" aria-label="Close navigation" onClick={()=>setDrawerOpen(false)}/> : null}
    {designOpen ? <AppearancePanel prefs={prefs} onChange={setPrefs} onClose={()=>setDesignOpen(false)} onReset={()=>setPrefs(defaults)}/> : null}
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
    {shadow ? createPortal(<><style>{css+"\n"+polishCss+"\n"+pagesCss+"\n"+memberCommandCss+"\n"+memberBaseCss+"\n"+memberFinancialCss+"\n"+memberDraftCss+"\n"+accountCss+"\n"+privateRhenCss+"\n"+brokerReviewCss+"\n"+discussionsCss+"\n"+betaCss+"\n"+memberVerifierCss+"\n"+liveCss}</style><CommonsApp prefs={prefs} setPrefs={setPrefs} content={content}/></>,shadow) : null}
  </div>;
}

