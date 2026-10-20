import { useState } from "react";
import { Link } from "react-router-dom";
import { readCategories, readStatus, type Category } from "../lib/api";
import { useResource } from "../lib/useResource";
import { PortalHeading } from "../components/PortalHeading";
import { Icon } from "../components/Icons";
import { OrbitalMark } from "../components/OrbitalMark";
import { CosmicArtwork } from "../components/CosmicArtwork";

const journeys = [
  {
    id: "discover", number: "01", icon: "explore", label: "I WANT TO EXPLORE",
    eyebrow: "FOR THE CURIOUS",
    title: "FIND SOMETHING WORTH TRYING.",
    description: "Browse genuine games, apps, tools and experiments. The catalogue only contains approved public work, and browsing is free without an account.",
    primary: { to: "/discover", label: "OPEN DISCOVERY" },
    secondary: { to: "/creators", label: "MEET CREATORS" },
    note: "If the catalogue is empty, these routes still show the real state and available categories."
  },
  {
    id: "make", number: "02", icon: "create", label: "I MAKE THINGS",
    eyebrow: "FOR THE MAKERS",
    title: "GIVE YOUR WORK A HOME.",
    description: "ANEVUM is building creator channels and moderated project pages for independent games, software, research and experiments. Keep control of your own demo and source hosting.",
    primary: { to: "/create", label: "VIEW CREATOR WORKSPACE" },
    secondary: { to: "/status", label: "CHECK LAUNCH READINESS" },
    note: "Creator accounts and submissions are invitation-only during testing; public publishing is not open."
  },
  {
    id: "connect", number: "03", icon: "community", label: "I WANT TO TAKE PART",
    eyebrow: "FOR THE COMMUNITY",
    title: "BELONG WITHOUT HAVING TO BUILD.",
    description: "Future participation includes useful feedback, saved projects, discussions and recognition for genuine contributions. You do not have to be a developer to belong here.",
    primary: { to: "/community", label: "EXPLORE COMMUNITY PLANS" },
    secondary: { to: "/guide", label: "TRY THE FREE FIELD GUIDE" },
    note: "The public discussion board and open member registration are not live yet."
  }
] as const;

const portals: ReadonlyArray<{ category: Category; label: string; kicker: string; symbol: string; detail: string }> = [
  { category: "games", label: "GAMES & PLAY", kicker: "01 / PLAY", symbol: "✦", detail: "Games and interactive worlds" },
  { category: "tools", label: "APPS & TOOLS", kicker: "02 / USE", symbol: "⌘", detail: "Useful software and utilities" },
  { category: "creative", label: "CREATIVE & AI", kicker: "03 / EXPERIMENT", symbol: "✳", detail: "Creative work and disclosed AI projects" },
  { category: "libraries", label: "OPEN SOURCE", kicker: "04 / BUILD", symbol: "⟡", detail: "Libraries and shared code" },
  { category: "automation", label: "AUTOMATION", kicker: "05 / SIMPLIFY", symbol: "↗", detail: "Independent workflow tools" },
  { category: "research", label: "RESEARCH", kicker: "06 / INVESTIGATE", symbol: "⊕", detail: "Evidence and experiments" },
  { category: "learning", label: "LEARNING", kicker: "07 / GROW", symbol: "◇", detail: "Guides and educational work" },
  { category: "other", label: "OTHER WORLDS", kicker: "08 / DISCOVER", symbol: "+", detail: "Creations that defy a label" }
];

export function StartPage() {
  const [intent, setIntent] = useState<(typeof journeys)[number]["id"]>("discover");
  const data = useResource(async signal => {
    const [status, categories] = await Promise.all([readStatus(signal), readCategories(signal)]);
    return { status, categories };
  }, []);
  const selected = journeys.find(journey => journey.id === intent) ?? journeys[0];
  const counts = new Map((data.state === "ready" ? data.data.categories.categories : []).map(item => [item.category, item.count]));
  const ready = data.state === "ready";

  return <div className="start-page">
    <PortalHeading
      eyebrow="ANEVUM / YOUR FIRST VISIT"
      title="FIND YOUR"
      accent="WAY IN."
      description="A creator-driven home for things people make. You can explore the site right now without an account or a project submission."
      index="START / 000"
      action={{to: "/discover", label: "SKIP STRAIGHT TO DISCOVERY"}}
    />
    <section className="start-journey" aria-labelledby="start-journey-title">
      <div className="start-journey-intro">
        <span className="kicker">ENTRY POINT / CHOOSE YOUR PATH</span>
        <h2 id="start-journey-title">WHAT BRINGS YOU HERE?</h2>
        <p>Choose a path to see what you can explore now and what is still being built.</p>
      </div>
      <div className="start-choice-grid" role="group" aria-label="Choose your ANEVUM starting point">
        {journeys.map(journey =>
          <button key={journey.id} type="button" className={"start-choice" + (journey.id === intent ? " start-choice-active" : "")}
            aria-pressed={journey.id === intent} onClick={() => setIntent(journey.id)}>
            <span className="start-choice-top"><span>{journey.number} / PATH</span><Icon name={journey.icon} size={22}/></span>
            <strong>{journey.label}</strong>
            <span className="start-choice-footer">{journey.id === intent ? "SELECTED PATH" : "CHOOSE THIS PATH"} <span aria-hidden="true">↗</span></span>
          </button>
        )}
      </div>
      <article className="start-journey-detail" aria-live="polite">
        <span className="start-detail-mark" aria-hidden="true"><OrbitalMark/></span>
        <div className="start-detail-copy">
          <span className="kicker">{selected.eyebrow} / YOUR NEXT STEP</span>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <div className="start-detail-actions">
            <Link className="button primary" to={selected.primary.to}>{selected.primary.label} <span aria-hidden="true">↗</span></Link>
            <Link className="button secondary" to={selected.secondary.to}>{selected.secondary.label}</Link>
          </div>
          <small>{selected.note}</small>
        </div>
      </article>
    </section>

    <section className="start-portals" aria-labelledby="start-portals-title">
      <header className="start-section-heading">
        <div><span className="kicker">THE PORTAL MAP / ALL EIGHT CATEGORIES</span><h2 id="start-portals-title">CHOOSE A WORLD.</h2><p>Every door opens a genuine category filter. The counts come from the public catalogue, not mock projects.</p></div>
        <Link to="/discover" className="start-section-all">ALL PROJECTS <span aria-hidden="true">↗</span></Link>
      </header>
      <div className="start-portal-grid">
        {portals.map(portal => {
          const count = ready ? (counts.get(portal.category) ?? 0) : null;
          return <Link className={"start-portal start-portal-" + portal.category}
            key={portal.category} to={"/discover?category=" + encodeURIComponent(portal.category)}>
            <span className="cw-start-portal-art" aria-hidden="true"><CosmicArtwork scene={portal.category}/></span>
            <span className="start-portal-top"><span>{portal.kicker}</span><span className="start-portal-symbol" aria-hidden="true">{portal.symbol}</span></span>
            <strong>{portal.label}</strong>
            <span className="start-portal-description">{portal.detail}</span>
            <span className="start-portal-bottom">
              <small>{count === null ? data.state === "loading" ? "CHECKING LIVE CATALOGUE" : "COUNT UNAVAILABLE" :
                count === 0 ? "FIRST RELEASE PENDING" : count.toLocaleString() + " APPROVED " + (count === 1 ? "RELEASE" : "RELEASES")}</small>
              <span aria-hidden="true">↗</span>
            </span>
          </Link>;
        })}
      </div>
      <div className="start-catalogue-proof" role="status">
        <Icon name="status" size={19}/>
        {ready ?
          <p><strong>{data.data.status.counts.publishedProjects.toLocaleString()} published projects</strong> from <strong>{data.data.status.counts.publishedCreators.toLocaleString()} public creators</strong>. Counts reflect approved releases only.</p> :
          <p>{data.state === "loading" ? "Checking real catalogue totals…" : "Catalogue totals are temporarily unavailable. The navigation remains usable."}</p>}
      </div>
    </section>

    <section className="start-outro">
      <span className="kicker">MORE THAN A MARKETPLACE</span>
      <h2>YOU DON'T HAVE TO PUBLISH<br/>TO HAVE A PLACE HERE.</h2>
      <p>Explore freely today. As member access opens, save what matters, leave useful feedback and earn recognition through real contributions rather than spending money.</p>
      <div><Link className="button secondary" to="/guide">FREE FIELD GUIDE</Link><Link className="button secondary" to="/levels">HOW LEVELS WORK</Link><Link className="button secondary" to="/status">WHAT'S LIVE NOW</Link></div>
    </section>
  </div>;
}
