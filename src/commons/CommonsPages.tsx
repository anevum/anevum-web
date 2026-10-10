import { Link, useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import { fieldNotes, type FieldNote } from "../data/fieldNotes";
import { publicProducts } from "../data/products";
import { rhenReleases, rhenReleaseBySlug } from "../data/releases";
import founder from "../data/founder.json";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import SignIn from "../pages/SignIn";
import CommonsPostsBeta from "./CommonsPostsBeta";

/**
 * V5 Stage 2 public routes. Only published first-party records are rendered.
 * Never derive brokerage permissions, live status, member counts or social
 * metrics from client state. Authenticated user/RHEN routes remain outside
 * this public shell until their separate isolation review.
 */
type Props = { pathname: string; search: string };
const orderedNotes = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date));
const categories = ["all", "systems", "engineering", "research", "release"] as const;
type Category = (typeof categories)[number];

function dateLabel(value: string) {
  const parsed = new Date(value + "T12:00:00Z");
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC"
  }).format(parsed);
}
function Intro({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <header className="c2-intro"><span className="c2-kicker">{kicker}</span><h1>{title}</h1><p>{children}</p></header>;
}
function NoteCard({ note }: { note: FieldNote }) {
  return <article className="c2-card c2-note">
    <div className="c2-card-meta"><span>{note.type}</span><time dateTime={note.date}>{dateLabel(note.date)}</time><span>{note.readMinutes} min read</span></div>
    <h2><Link to={"/field-notes/" + note.slug}>{note.title}</Link></h2>
    <p>{note.summary}</p>
    <div className="c2-tag-row">{note.systems.slice(0, 3).map(s => <span className="c2-tag" key={s}>{s}</span>)}<span className="c2-tag">Published record</span></div>
    <Link className="c2-text-link" to={"/field-notes/" + note.slug}>Read publication <span aria-hidden="true">→</span></Link>
  </article>;
}
function NoteIndex({ search }: { search: string }) {
  const [params] = useSearchParams();
  const selected = params.get("category")?.toLowerCase() || "all";
  const category: Category = categories.includes(selected as Category) ? selected as Category : "all";
  const query = (search || params.get("q") || "").trim().toLowerCase();
  const filtered = orderedNotes.filter(n => (category === "all" || n.type.toLowerCase() === category) &&
    [n.title, n.summary, n.type, ...n.systems].join(" ").toLowerCase().includes(query));
  return <div className="c2-page">
    <Intro kicker="COMMONS / FIELD NOTES" title="Research and Field Notes">
      Published investigations, engineering decisions, experiments and failures. These are dated records, not claims of a currently running trading service.
    </Intro>
    <nav className="c2-tabs" aria-label="Filter published work">{categories.map(c =>
      <Link key={c} className={category === c ? "selected" : ""} to={c === "all" ? "/field-notes" : "/field-notes?category=" + c} aria-current={category === c ? "page" : undefined}>{c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}</Link>)}</nav>
    <p className="c2-result" role="status">{filtered.length} published {filtered.length === 1 ? "record" : "records"}{query ? " matching your search" : ""}</p>
    <section className="c2-stack" aria-label="Publications">{filtered.length ? filtered.map(note => <NoteCard key={note.slug} note={note}/>) :
      <div className="c2-empty"><h2>No matching publications</h2><p>Try another search or category. No content has been invented to fill the directory.</p><Link to="/field-notes">Clear filters</Link></div>}</section>
  </div>;
}
function NoteDetail({ slug }: { slug: string }) {
  const note = fieldNotes.find(n => n.slug === slug);
  if (!note) return <Missing/>;
  return <article className="c2-page c2-article">
    <Link to="/field-notes" className="c2-text-link">← All Field Notes</Link>
    <Intro kicker={note.type + " / " + dateLabel(note.date)} title={note.title}>{note.summary}</Intro>
    <div className="c2-truth">Historical publication, dated {dateLabel(note.date)}. Descriptions of runtime or deployed systems are statements from that date, not current availability.</div>
    <div className="c2-tag-row">{note.systems.map(s => <span key={s} className="c2-tag">{s}</span>)}<span className="c2-tag">{note.status}</span></div>
    {note.sections.map(section => <section className="c2-article-section" key={section.heading}>
      <h2>{section.heading}</h2>{section.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
    </section>)}
    <section className="c2-article-section c2-method">
      <h2>Research method and limitations</h2>
      <p><strong>Question:</strong> {note.reproduce.question}</p>
      {([
        ["Inputs", note.reproduce.inputs],
        ["Method", note.reproduce.method],
        ["Checks", note.reproduce.checks],
        ["Limits", note.reproduce.limits]
      ] as const).map(([label, items]) => <div key={label}><h3>{label}</h3><ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>)}
      <p><strong>Expected outcome:</strong> {note.reproduce.expected}</p>
    </section>
    <Link className="c2-text-link" to="/field-notes">More published work →</Link>
  </article>;
}
function Projects() {
  const products = publicProducts();
  return <div className="c2-page">
    <Intro kicker="COMMONS / DISCOVER" title="Projects and applications">
      ANEVUM is an independent software workshop. RHEN is its first major application, not the entire purpose of the community.
    </Intro>
    <div className="c2-truth">Only registered ANEVUM projects appear here. An app's public information does not imply active broker execution, user enrollment or paid access.</div>
    <section className="c2-grid" aria-label="Registered projects">{products.map(product =>
      <article className="c2-card c2-project" key={product.slug}>
        <div className="c2-project-icon" aria-hidden="true">{product.name.charAt(0)}</div>
        <span className="c2-kicker">{product.category}</span>
        <h2>{product.name}</h2><p>{product.oneLine}</p>
        <div className="c2-tag-row"><span className="c2-tag">{product.slug === "rhen" ? "V5 rebuilding" : product.lifecycle}</span><span className="c2-tag">Public project</span></div>
        <Link className="c2-text-link" to={product.routes.home}>Explore project →</Link>
      </article>)}</section>
    <section className="c2-section">
      <h2>Explore the work behind the software</h2><p>Research notes and release records document decisions and verified work. Published data is never a substitute for your own investigation.</p>
      <div className="c2-action-row"><Link to="/field-notes">Read Field Notes</Link><Link to="/learn">Learn the method</Link></div>
    </section>
  </div>;
}
function RhenOverview() {
  return <div className="c2-page">
    <Link to="/products" className="c2-text-link">← All projects</Link>
    <Intro kicker="ANEVUM / APPLICATION" title="RHEN">
      A research-driven markets application being rebuilt around private member workspaces, measured evidence and explicit authorization boundaries.
    </Intro>
    <div className="c2-truth"><strong>V5 foundation:</strong> Legacy live trading is suspended during reconstruction. Member brokerage linking, paper execution and live orders have not been released.</div>
    <div className="c2-grid">
      {[
        ["My workspace", "Personal RHEN research and saved non-executing setup drafts. Each workspace belongs to its authenticated member.", "/apps/rhen"],
        ["Research & Field Notes", "Published investigations and methodology, with failure and uncertainty recorded rather than hidden.", "/field-notes"],
        ["Release history", "Historical versions and changes, clearly separated from current runtime availability.", "/products/rhen/releases"],
        ["Architecture", "How evidence, replay, research and execution permissions are kept apart.", "/products/rhen/architecture"]
      ].map(([title, body, href]) => <article className="c2-card" key={title}><h2>{title}</h2><p>{body}</p><Link to={href} className="c2-text-link">Explore →</Link></article>)}
    </div>
    <section className="c2-section"><h2>One application, multiple capabilities</h2>
      <p>Research, replay and optional forecasting are modules of RHEN—not independent paid apps or always-running branded services. Research cannot enable execution. Paper and live permissions must be approved separately, and a Commons account alone grants neither.</p>
      <div className="c2-action-row"><Link to="/products/rhen/evidence">Public evidence status</Link><Link to="/apps/rhen">Open my RHEN workspace</Link></div>
    </section>
  </div>;
}
function RhenEvidence() {
  const records = orderedNotes.filter(note => note.systems.includes("RHEN")).slice(0, 4);
  return <div className="c2-page c2-evidence" data-evidence-state="SUSPENDED_FOR_REBUILD">
    <Link to="/products/rhen" className="c2-text-link">← RHEN overview</Link>
    <Intro kicker="RHEN / PUBLIC EVIDENCE" title="Evidence, with its limits visible">
      RHEN's V5 successor is still being developed. Current execution and public performance telemetry are not available. Historical publications remain accessible with their original dates and limitations.
    </Intro>
    <div className="c2-truth" role="status">
      <strong>SUSPENDED_FOR_REBUILD</strong> — The retired trading runtime does not supply current broker orders, positions, account curves or returns. An empty chart must not be represented as zero performance or live activity.
    </div>
    <section className="c2-grid" aria-label="Evidence availability">
      <article className="c2-card"><span className="c2-kicker">EXECUTION</span><h2>No active trading runtime</h2><p>The former RHEN live system was retired. No current trading outcomes or live orders are reported on this public page.</p></article>
      <article className="c2-card"><span className="c2-kicker">RESEARCH</span><h2>Research: development</h2><p>Evidence collection, source provenance, candidate rejection and repeatable tests are being rebuilt within RHEN. No strategy promotion is implied.</p></article>
      <article className="c2-card"><span className="c2-kicker">REPLAY</span><h2>Replay: not released</h2><p>Historical replay and paper experiments require independent test evidence before any results can be described as validated.</p></article>
      <article className="c2-card"><span className="c2-kicker">ACCOUNT PRIVACY</span><h2>Member and broker data are private</h2><p>Account balances, brokerage authorizations, private strategies, and member workspace details are never published here.</p></article>
    </section>
    <section className="c2-section">
      <h2>Historical RHEN records</h2>
      <p>These are dated source documents, not a current market feed or a claim of profitability. Read each record's test method and limits before interpreting its results.</p>
      <div className="c2-stack">{records.length ? records.map(note => <NoteCard key={note.slug} note={note}/>) :
        <div className="c2-empty"><h3>No historical evidence available</h3><p>Source-backed publications will appear only when verified.</p></div>}</div>
    </section>
    <section className="c2-section"><h2>Audit trail and design</h2>
      <p>See historical releases for prior verified changes, and the V5 architecture for the separation between research, replay, execution and ownership.</p>
      <div className="c2-action-row"><Link to="/products/rhen/releases">Historical releases</Link><Link to="/products/rhen/architecture">V5 architecture</Link><Link to="/field-notes">Field Notes</Link></div>
    </section>
  </div>;
}
function RhenArchitecture() {
  const sections = [
    ["Identity and privacy", "Accounts and RHEN workspaces are member-specific. The server derives ownership from the authenticated session; one member cannot select another member's workspace."],
    ["Research", "Reproducible evidence, candidate evaluation and experiments remain distinct from brokerage execution authority."],
    ["Replay", "Historical evaluation and test runs must preserve source provenance, assumptions and boundaries before conclusions can be drawn."],
    ["Forecast", "Optional forecasting is part of RHEN research, not a required separate always-running NOSTRA service."],
    ["Operations and evidence", "Safety, source integrity, job scheduling and alerts are native RHEN responsibilities. IREN is deferred in V5."],
    ["Execution gates", "New brokerage linking, paper execution and member live orders remain disabled until provider, security, privacy and individual release checks are passed."]
  ];
  return <div className="c2-page">
    <Intro kicker="RHEN / DESIGN" title="Architecture and authority">One application with isolated research, evidence and operational boundaries. This describes the V5 target, not a currently deployed trading runtime.</Intro>
    <div className="c2-grid">{sections.map(([name, body]) => <section className="c2-card" key={name}><h2>{name}</h2><p>{body}</p></section>)}</div>
    <div className="c2-truth">The founder's historical operator terminal is separately protected. A member does not gain owner access by authenticating with Google or using Commons.</div>
    <Link className="c2-text-link" to="/products/rhen">← RHEN overview</Link>
  </div>;
}
function Releases() {
  const items = [...rhenReleases].sort((a, b) => b.date.localeCompare(a.date));
  return <div className="c2-page">
    <Intro kicker="RHEN / HISTORICAL RECORDS" title="Release history">Past version notes are retained as dated publications. They must not be mistaken for a currently deployed RHEN runtime.</Intro>
    <div className="c2-truth">Legacy execution was retired for V5 reconstruction. Release labels, older capabilities and old performance descriptions are historical.</div>
    <div className="c2-stack">{items.map(item => <article className="c2-card" key={item.slug}>
      <div className="c2-card-meta"><span>Version {item.version}</span><time dateTime={item.date}>{dateLabel(item.date)}</time></div>
      <h2><Link to={"/products/rhen/releases/" + item.slug}>{item.codename}</Link></h2><p>{item.headline}</p>
      <Link className="c2-text-link" to={"/products/rhen/releases/" + item.slug}>Read historical record →</Link>
    </article>)}</div>
  </div>;
}
function ReleaseDetail({ slug }: { slug: string }) {
  const release = rhenReleaseBySlug(slug);
  if (!release) return <Missing/>;
  return <article className="c2-page c2-article">
    <Link className="c2-text-link" to="/products/rhen/releases">← RHEN releases</Link>
    <Intro kicker={"RHEN " + release.version + " / " + dateLabel(release.date)} title={release.codename}>{release.headline}</Intro>
    <div className="c2-truth">Archived version record. Historical execution, paper, performance or deployment references do not imply current availability.</div>
    <section className="c2-article-section"><h2>Overview</h2><p>{release.abstract}</p><p>{release.thesis}</p></section>
    <section className="c2-article-section"><h2>Verification and limitations</h2>
      {release.verification.map((x, i) => <div key={i}><h3>{x.label}</h3><p>{x.body}</p></div>)}
      {release.limitations.map((x, i) => <div key={i}><h3>{x.title}</h3><p>{x.body}</p></div>)}
    </section>
    <Link className="c2-text-link" to="/products/rhen">Current RHEN rebuild status →</Link>
  </article>;
}
function Communities() {
  const types = [
    ["Systems", "Architecture and reliable operations", "systems"],
    ["Engineering", "Software and building useful tools", "engineering"],
    ["Research", "Questions, hypotheses and evidence", "research"],
    ["Releases", "What was changed and verified", "release"]
  ];
  return <div className="c2-page">
    <Intro kicker="COMMONS / TOPICS" title="Explore the subjects">Browse authentic published research. Member discussion is separate and only opens after the invite-only pilot passes its moderation and privacy checks.</Intro>
    <div className="c2-grid">{types.map(([title, detail, slug]) => <article className="c2-card" key={slug}><h2>{title}</h2><p>{detail}</p><Link className="c2-text-link" to={"/field-notes?category=" + slug}>Read publications →</Link></article>)}</div>
    <div className="c2-truth">No fictional communities, membership counts, rankings, votes or endorsements are displayed.</div>
    <CommonsPostsBeta/>
  </div>;
}
function Learn() {
  const notes = orderedNotes.filter(n => n.type === "RESEARCH" || n.type === "ENGINEERING").slice(0, 6);
  return <div className="c2-page">
    <Intro kicker="COMMONS / LEARNING" title="Learn by examining real work">A reading path through methods and software experiments—not a claim that a course, trading result or personalized instruction is ready.</Intro>
    <section className="c2-section"><h2>A practical research loop</h2>
      <ol className="c2-steps"><li>Frame one testable question.</li><li>Record data sources, assumptions and failure conditions.</li><li>Test against evidence without changing live authority.</li><li>Publish what worked, what failed and what remains uncertain.</li></ol>
    </section>
    <h2 className="c2-list-title">Related publications</h2><div className="c2-stack">{notes.map(n => <NoteCard note={n} key={n.slug}/>)}</div>
    <Link className="c2-text-link" to="/field-notes">All Field Notes →</Link>
  </div>;
}
function ResumePage() {
  return <div className="c2-page c2-resume">
    <Intro kicker="ANEVUM / BACKGROUND" title="Experience and background">{founder.headline}. A factual record of past roles, education and skills.</Intro>
    <div className="c2-action-row"><a href="/devon-akins-resume.pdf" download>Download résumé PDF</a><a href={"mailto:" + founder.email}>Contact</a></div>
    <section className="c2-section"><h2>Profile</h2><p>{founder.summary}</p></section>
    <section className="c2-section"><h2>Experience</h2><div className="c2-stack">{founder.experience.map(role =>
      <article className="c2-card" key={role.organization + role.role}><div className="c2-card-meta"><span>{role.organization}</span><span>{role.period}</span></div>
        <h2>{role.role}</h2><ul>{role.bullets.map((line, i) => <li key={i}>{line}</li>)}</ul></article>)}</div></section>
    <section className="c2-section"><h2>Technical skills</h2><div className="c2-grid">{founder.skills.map(group =>
      <article className="c2-card" key={group.group}><h2>{group.group}</h2><p>{group.items.join(" · ")}</p></article>)}</div></section>
    <section className="c2-section"><h2>Education</h2><div className="c2-stack">{founder.education.map(item =>
      <article className="c2-card" key={item.school}><h2>{item.school}</h2><p>{item.study}. {item.detail}</p></article>)}</div></section>
    <section className="c2-section"><h2>Credentials</h2><div className="c2-stack">{founder.certifications.map(item =>
      <article className="c2-card" key={item.name}><h2>{item.name}</h2><p>{item.status}. {item.detail}</p></article>)}</div></section>
  </div>;
}
function About() {
  return <div className="c2-page">
    <Intro kicker="ANEVUM / ABOUT" title="Independent work, shared openly.">
      ANEVUM is an independent workshop for building practical software, exploring ideas and documenting what the evidence actually shows.
    </Intro>
    <div className="c2-card c2-about"><img src="/devon-akins-headshot.jpg" alt="Portrait of Devon Akins" loading="lazy"/>
      <div><span className="c2-kicker">FOUNDER</span><h2>{founder.name}</h2><p>I'm building ANEVUM to make useful tools, investigate ideas, and share work that others can question, learn from and improve. It is intentionally broader than trading.</p>
        <p>I'm most interested in real outcomes and honest documentation, including experiments that fail. This is a small independent project, not a claim to be a large company.</p>
        <div className="c2-action-row"><Link to="/resume">Background and résumé</Link><a href={"mailto:" + founder.email}>Contact</a></div></div></div>
    <section className="c2-section"><h2>Read the work</h2><p>Start with actual published notes and registered projects rather than invented testimonials or product promises.</p><div className="c2-action-row"><Link to="/field-notes">Field Notes</Link><Link to="/products">Projects</Link></div></section>
  </div>;
}
function Missing() {
  return <div className="c2-page c2-empty"><Intro kicker="COMMONS / NOT FOUND" title="That record was not found.">The address may be old or the record may not be published.</Intro><Link className="c2-text-link" to="/">Return to Commons →</Link></div>;
}
export default function CommonsPublicPage({ pathname, search }: Props) {
  if (pathname === "/products") return <Projects/>;
  if (pathname === "/field-notes") return <NoteIndex search={search}/>;
  if (pathname.startsWith("/field-notes/")) return <NoteDetail slug={pathname.slice("/field-notes/".length)}/>;
  if (pathname === "/products/rhen") return <RhenOverview/>;
  if (pathname === "/products/rhen/evidence") return <RhenEvidence/>;
  if (pathname === "/products/rhen/architecture") return <RhenArchitecture/>;
  if (pathname === "/products/rhen/releases") return <Releases/>;
  if (pathname.startsWith("/products/rhen/releases/")) return <ReleaseDetail slug={pathname.slice("/products/rhen/releases/".length)}/>;
  if (pathname === "/communities") return <Communities/>;
  if (pathname === "/learn") return <Learn/>;
  if (pathname === "/about") return <About/>;
  if (pathname === "/resume") return <ResumePage/>;
  if (pathname === "/privacy") return <div className="c2-page c2-legal"><Privacy/></div>;
  if (pathname === "/terms") return <div className="c2-page c2-legal"><Terms/></div>;
  if (pathname === "/sign-in") return <div className="c2-page c2-legal"><SignIn/></div>;
  return <Missing/>;
}
