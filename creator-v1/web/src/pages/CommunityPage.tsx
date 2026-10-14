import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  readCommunityPosts, readCreators, readProjects, readStatus,
  type Category, type CommunityPost, type CommunityPostSort,
  type Creator, type Project
} from "../lib/api";
import { useResource } from "../lib/useResource";
import { projectDetailPath } from "../lib/navigation";
import { CosmicArtwork } from "../components/CosmicArtwork";
import { Icon } from "../components/Icons";
import { CommunityMemberDesk } from "../components/CommunityMemberDesk";
import { LoadingState, ErrorState } from "../components/States";
import "./community-hub-v007.css";

/**
 * Creator V1 / Community V007.
 * The public hub only reads approved records from the existing API. No fake
 * accounts, client-awarded XP, unmoderated writes, or invented popularity.
 */
type View = "all" | "projects" | "conversations" | "people";
type Entry =
  | { kind: "project"; id: string; at: number; value: Project }
  | { kind: "conversation"; id: string; at: number; value: CommunityPost };

const views: readonly { id: View; label: string; hint: string }[] = [
  { id: "all", label: "LATEST", hint: "Approved projects and conversations" },
  { id: "projects", label: "PROJECTS", hint: "Things the community has made" },
  { id: "conversations", label: "DISCUSSIONS", hint: "Moderated public conversations" },
  { id: "people", label: "PEOPLE", hint: "Public creator channels" }
];
const fields: readonly { id: Category; label: string }[] = [
  { id: "games", label: "Games & Play" },
  { id: "tools", label: "Apps & Tools" },
  { id: "creative", label: "Creative & AI" },
  { id: "libraries", label: "Open Source" },
  { id: "research", label: "Research" },
  { id: "learning", label: "Learning" },
  { id: "automation", label: "Automation" },
  { id: "other", label: "Other Worlds" }
];
const asView = (query: string): View => {
  const requested = new URLSearchParams(query).get("view");
  return views.some(item => item.id === requested) ? requested as View : "all";
};
const asTime = (value: string | null | undefined) => {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
};
const asDate = (value: string | null | undefined) => {
  const time = asTime(value);
  return time ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(time) : "DATE UNLISTED";
};
const creatorPath = (handle: string) => "/creators/" + encodeURIComponent(handle);

function ProjectEntry({ item }: { item: Project }) {
  const destination = projectDetailPath(item.id, "/community");
  const field = fields.find(field => field.id === item.category);
  return <article className="ch7-entry ch7-project">
    <Link className="ch7-entry-art" to={destination} aria-label={"Explore " + item.title}>
      <CosmicArtwork scene={item.category}/>
      <span>{field?.label || "Project"} / APPROVED RELEASE</span>
    </Link>
    <div className="ch7-entry-copy">
      <div className="ch7-meta"><span>PROJECT / {item.category.toUpperCase()}</span><time dateTime={item.publishedAt || undefined}>{asDate(item.publishedAt)}</time></div>
      <h3><Link to={destination}>{item.title}</Link></h3>
      <p>{item.summary}</p>
      <div className="ch7-byline"><span className="ch7-avatar" aria-hidden="true">{(item.creatorName || item.creatorHandle).charAt(0).toUpperCase()}</span>
        <span>BY <Link to={creatorPath(item.creatorHandle)}>{item.creatorName || "@" + item.creatorHandle}</Link></span>
        {item.freeToUse && <span className="ch7-pill">FREE TO EXPLORE</span>}
      </div>
      <div className="ch7-entry-actions"><Link className="ch7-button ch7-button-primary" to={destination}>OPEN PROJECT <Icon name="arrow" size={14}/></Link>
        <Link className="ch7-inline" to={"/discover?category=" + item.category}>MORE IN THIS FIELD</Link></div>
    </div>
  </article>;
}

function ConversationEntry({ item }: { item: CommunityPost }) {
  const destination = "/community/posts/" + encodeURIComponent(item.id);
  return <article className="ch7-entry ch7-conversation">
    <div className="ch7-conversation-art" aria-hidden="true"><Icon name="community" size={32}/><span>PUBLIC CONVERSATION</span></div>
    <div className="ch7-entry-copy">
      <div className="ch7-meta"><span>DISCUSSION / {item.topic.toUpperCase()}</span><time dateTime={item.publishedAt}>{asDate(item.publishedAt)}</time></div>
      <h3><Link to={destination}>{item.title}</Link></h3>
      <p>{item.excerpt}</p>
      {item.project && <div className="ch7-project-context">ABOUT <Link to={projectDetailPath(item.project.id, "/community")}>{item.project.title}</Link></div>}
      <div className="ch7-byline"><span className="ch7-avatar" aria-hidden="true">{(item.authorName || item.authorHandle).charAt(0).toUpperCase()}</span>
        <span>BY <Link to={creatorPath(item.authorHandle)}>{item.authorName || "@" + item.authorHandle}</Link></span>
        <span className="ch7-reactions">{item.replyCount} {item.replyCount === 1 ? "REPLY" : "REPLIES"} · {item.score} REACTIONS</span></div>
      <div className="ch7-entry-actions"><Link className="ch7-button ch7-button-primary" to={destination}>READ DISCUSSION <Icon name="arrow" size={14}/></Link></div>
    </div>
  </article>;
}

function CreatorEntry({ item }: { item: Creator }) {
  return <article className="ch7-person">
    <div className="ch7-person-avatar" aria-hidden="true">{(item.displayName || item.handle).charAt(0).toUpperCase()}</div>
    <div className="ch7-person-copy"><span className="ch7-kicker">PUBLIC CREATOR CHANNEL</span>
      <h3><Link to={creatorPath(item.handle)}>{item.displayName}</Link></h3>
      <span>@{item.handle}</span><p>{item.publishedProjects} APPROVED {item.publishedProjects === 1 ? "RELEASE" : "RELEASES"}</p></div>
    <Link className="ch7-button" to={creatorPath(item.handle)} aria-label={"Visit " + item.displayName + "'s public channel"}>VIEW CHANNEL <Icon name="arrow" size={14}/></Link>
  </article>;
}

export function CommunityPage() {
  const location = useLocation();
  const [view, setView] = useState<View>(() => asView(location.search));
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<CommunityPostSort>("new");
  const [creatorInput, setCreatorInput] = useState("");
  const [creatorQuery, setCreatorQuery] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => { setView(asView(location.search)); }, [location.search]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") setRevision(current => current + 1); };
    const interval = window.setInterval(refresh, 150000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const status = useResource(signal => readStatus(signal), [revision]);
  const projects = useResource(
    signal => readProjects({ sort: "new", limit: "24", category: view === "projects" && category !== "all" ? category : undefined }, signal),
    [revision, category, view === "projects"]
  );
  const creators = useResource(signal => readCreators({ limit: "12", q: creatorQuery || undefined }, signal), [revision, creatorQuery]);
  const enabled = status.state === "ready" && status.data.features?.communityPosts === true;
  const conversations = useResource(async signal => {
    if (!enabled) return { availability: "closed" as const, items: [] as CommunityPost[] };
    try {
      const result = await readCommunityPosts({ sort: view === "conversations" ? sort : "new", limit: "24" }, signal);
      return { availability: "available" as const, items: result.items };
    } catch (error) {
      if ((error as { status?: number }).status === 404) return { availability: "closed" as const, items: [] as CommunityPost[] };
      throw error;
    }
  }, [revision, enabled, sort, view === "conversations"]);
  const projectItems = projects.state === "ready" ? projects.data.items : [];
  const creatorItems = creators.state === "ready" ? creators.data.items : [];
  const postItems = conversations.state === "ready" && conversations.data.availability === "available" ? conversations.data.items : [];
  const combined: Entry[] = [
    ...projectItems.map(value => ({ kind: "project" as const, id: "project:" + value.id, at: asTime(value.publishedAt), value })),
    ...postItems.map(value => ({ kind: "conversation" as const, id: "discussion:" + value.id, at: asTime(value.publishedAt), value }))
  ].sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
  const entries: Entry[] = view === "all" ? combined.slice(0, 18)
    : view === "projects" ? projectItems.map(value => ({ kind: "project" as const, id: value.id, at: asTime(value.publishedAt), value }))
    : view === "conversations" ? postItems.map(value => ({ kind: "conversation" as const, id: value.id, at: asTime(value.publishedAt), value })) : [];
  const loading = view === "people" ? creators.state === "loading"
    : view === "projects" ? projects.state === "loading"
    : view === "conversations" ? status.state === "loading" || (enabled && conversations.state === "loading")
    : projects.state === "loading" || (enabled && conversations.state === "loading");
  const failed = view === "people" ? creators.state === "error"
    : view === "projects" ? projects.state === "error"
    : view === "conversations" ? status.state === "error" || (enabled && conversations.state === "error")
    : projects.state === "error" || (enabled && conversations.state === "error");
  function searchCreators(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatorQuery(creatorInput.trim().slice(0, 72));
  }
  return <div className="ch7-hub">
    <section className="ch7-hero" aria-labelledby="ch7-hero-title">
      <div className="ch7-hero-art" aria-hidden="true"><CosmicArtwork scene="creative"/></div>
      <div className="ch7-hero-copy"><span className="ch7-kicker">ANEVUM / COMMUNITY / THE COMMONS</span>
        <h1 id="ch7-hero-title">Made by people.<br/><em>Better together.</em></h1>
        <p>A gathering place for independent games, art, useful software, ideas and the people who make them. Discover something worth exploring. Help something new take shape.</p>
        <div className="ch7-hero-actions"><Link className="ch7-button ch7-button-primary" to="/discover">EXPLORE THE WORK <Icon name="arrow" size={15}/></Link>
          <a className="ch7-button" href="#ch7-stream" onClick={() => setView("conversations")}>READ DISCUSSIONS <Icon name="community" size={15}/></a></div>
      </div>
      <aside className="ch7-status" aria-label="Verified public community counts"><span className="ch7-kicker">PUBLIC RECORD / VERIFIED</span>
        <div className="ch7-count-grid">
          <div><strong>{status.state === "ready" ? status.data.counts.publishedProjects : "—"}</strong><span>APPROVED PROJECTS</span></div>
          <div><strong>{status.state === "ready" ? status.data.counts.publishedCreators : "—"}</strong><span>PUBLIC CREATORS</span></div>
        </div>
        <p>{status.state === "error" ? "Public counts are temporarily unavailable." : "Only independently approved public records. No fabricated activity."}</p>
      </aside>
    </section>

    <nav className="ch7-portals" aria-label="Community destinations">
      <Link to="/discover"><Icon name="explore" size={19}/><span><strong>DISCOVER</strong><small>Explore new creations</small></span><Icon name="arrow" size={15}/></Link>
      <Link to="/boards"><Icon name="library" size={19}/><span><strong>THE BOARDS</strong><small>Releases & first looks</small></span><Icon name="arrow" size={15}/></Link>
      <Link to="/create"><Icon name="create" size={19}/><span><strong>MAKE & SHARE</strong><small>Invited member testing</small></span><Icon name="arrow" size={15}/></Link>
      <Link to="/levels"><Icon name="star" size={19}/><span><strong>RECOGNITION</strong><small>Progress earned fairly</small></span><Icon name="arrow" size={15}/></Link>
    </nav>

    <header className="ch7-section-header"><div><span className="ch7-kicker">ANEVUM / OPEN PUBLIC INDEX</span><h2>Inside the <em>commons.</em></h2></div>
      <p>Real approved projects, genuine creators and independently moderated discussion. Anything private or still awaiting review stays private.</p>
    </header>

    <div className="ch7-columns">
      <section className="ch7-main" id="ch7-stream" aria-label="Community activity">
        <div className="ch7-tabs-row"><div className="ch7-tabs" role="group" aria-label="Choose a community view">
          {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id}
            title={item.hint} onClick={() => setView(item.id)}>{item.label}</button>)}</div>
          <button className="ch7-refresh" type="button" disabled={loading} onClick={() => setRevision(current => current + 1)}>↻ REFRESH</button>
        </div>
        <div className="ch7-toolbar">
          <div><span className="ch7-kicker">{view === "people" ? "CREATOR DIRECTORY" : view === "conversations" ? "MODERATED CONVERSATIONS" : "THE LATEST VERIFIED WORK"}</span>
            <p>{view === "all" ? "A recent excerpt, newest first. Never a simulated social feed." :
              view === "projects" ? "New approved creations. Choose a field to narrow the list." :
              view === "conversations" ? "Only community discussions cleared for public viewing." :
              "Find people who have published genuine work."}</p></div>
          {view === "projects" && <label className="ch7-field-filter">FIELD <select value={category}
            onChange={event => setCategory(event.target.value as Category | "all")}>
            <option value="all">All fields</option>{fields.map(field => <option value={field.id} key={field.id}>{field.label}</option>)}
          </select></label>}
          {view === "conversations" && <div className="ch7-sort" role="group" aria-label="Order public conversations">
            <button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}>NEWEST</button>
            <button type="button" aria-pressed={sort === "hot"} onClick={() => setSort("hot")}>HOT</button>
          </div>}
        </div>
        {view === "people" && <form className="ch7-search" onSubmit={searchCreators} role="search">
          <label htmlFor="ch7-search-creator">SEARCH CREATORS</label>
          <div><input id="ch7-search-creator" placeholder="Name or @handle" value={creatorInput}
            onChange={event => setCreatorInput(event.target.value)} maxLength={72} autoComplete="off"/>
            <button type="submit">SEARCH <Icon name="search" size={14}/></button></div>
        </form>}
        {loading && <LoadingState label="Reading verified public community records"/>}
        {failed && <ErrorState title="COMMUNITY RECORDS UNAVAILABLE" detail="The live public data could not be reached. No fictional members or projects are substituted."/>}
        {!loading && !failed && (view === "people" ? <div className="ch7-people">
          {creatorItems.map(item => <CreatorEntry item={item} key={item.handle}/>)}
        </div> : <div className="ch7-stream" aria-live="polite">
          {entries.map(entry => entry.kind === "project" ? <ProjectEntry key={entry.id} item={entry.value}/> :
            <ConversationEntry key={entry.id} item={entry.value}/>)}
        </div>)}
        {!loading && !failed && (view === "people" ? creatorItems.length === 0 : entries.length === 0) && <div className="ch7-empty" role="status">
          <span className="ch7-kicker">THE COMMONS / PUBLIC RECORD</span>
          <h3>{view === "conversations" && !enabled ? "Conversations are in private testing." :
            view === "people" && creatorQuery ? "No public creators match that search." : "The first chapter is still being written."}</h3>
          <p>{view === "conversations" && !enabled
            ? "Moderation, privacy and independently verified member journeys must pass before discussions can open publicly."
            : view === "people" && creatorQuery ? "Try another name or explore the full creator directory."
            : "There are no approved records for this view yet. ANEVUM does not fill empty spaces with fake people, posts, rankings or scores."}</p>
          <Link className="ch7-button ch7-button-primary" to={view === "conversations" ? "/boards" : view === "people" ? "/creators" : "/discover"}>
            {view === "conversations" ? "BROWSE VERIFIED BOARDS" : view === "people" ? "ALL CREATORS" : "BROWSE PROJECTS"} <Icon name="arrow" size={14}/>
          </Link>
        </div>}
        {view === "all" && status.state === "error" && <p className="ch7-soft-warning" role="status">Conversation availability could not be verified; project discovery remains available separately.</p>}
        <CommunityMemberDesk/>
        <footer className="ch7-index-foot"><span className="ch7-kicker">APPROVED PUBLIC RECORDS ONLY</span>
          <p>This view is a bounded sample, not a site-wide count or quality ranking. Community replies and reactions only appear after independent approval.</p>
          <Link to={view === "people" ? "/creators" : "/discover"}>{view === "people" ? "FULL CREATOR DIRECTORY" : "FULL PROJECT DISCOVERY"} <Icon name="arrow" size={14}/></Link>
        </footer>
      </section>
      <aside className="ch7-sidebar" aria-label="Community guide">
        <section className="ch7-panel"><span className="ch7-kicker">01 / FIND YOUR FIELD</span><h3>Every idea has <em>a place.</em></h3>
          <div className="ch7-categories">{fields.map(field => <Link key={field.id} to={"/discover?category=" + field.id}>
            <span className="ch7-field-art" aria-hidden="true"><CosmicArtwork scene={field.id}/></span><span>{field.label}</span><Icon name="arrow" size={14}/>
          </Link>)}</div>
        </section>
        <section className="ch7-panel"><span className="ch7-kicker">02 / MEET THE MAKERS</span><h3>Behind the <em>work.</em></h3>
          {creators.state === "loading" && <p>Loading public creator channels…</p>}
          {creators.state === "error" && <p>Creator directory is temporarily unavailable.</p>}
          {creators.state === "ready" && creatorItems.length === 0 && <p>Channels appear here when real, independently reviewed projects are published.</p>}
          {creators.state === "ready" && creatorItems.length > 0 && <div className="ch7-featured-people">
            {creatorItems.slice(0, 5).map(item => <Link key={item.handle} to={creatorPath(item.handle)}>
              <span className="ch7-avatar" aria-hidden="true">{item.displayName.charAt(0).toUpperCase()}</span>
              <span><strong>{item.displayName}</strong><small>@{item.handle}</small></span>
              <Icon name="arrow" size={14}/>
            </Link>)}</div>}
          <Link className="ch7-panel-link" to="/creators">BROWSE ALL CREATORS <Icon name="arrow" size={14}/></Link>
        </section>
        <section className="ch7-values"><span className="ch7-kicker">A NOTE FROM THE COMMONS</span>
          <h3>Make the next thing better.</h3>
          <p>Give useful feedback. Credit the people behind the work. Keep participation accessible. Earn recognition through genuine contribution, never payment.</p>
        </section>
      </aside>
    </div>
  </div>;
}
