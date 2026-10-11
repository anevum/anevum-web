import { Link, useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import { fieldNotes, type FieldNote } from "../data/fieldNotes";
import { publicProducts, publishedSourceRecords } from "../data/products";
import { Releases, ReleaseDetail } from "./CommonsReleases";
import founder from "../data/founder.json";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import SignIn from "../pages/SignIn";
import CommonsPostsBeta from "./CommonsPostsBeta";
import CommonsModeration from "./CommonsModeration";
import StudioPublications from "./StudioPublications";
import {useMemberAvailability,refreshMemberAvailability} from "../member/useMemberAvailability";
import { memberAuthClient } from "../member/auth-client";

/**
 * V5 Stage 2 public routes. Only published first-party records are rendered.
 * Never derive brokerage permissions, live status, member counts or social
 * metrics from client state. Authenticated user/RHEN routes remain outside
 * this public shell until their separate isolation review.
 */
type Props = { pathname: string };
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
function NoteIndex() {
  const [params] = useSearchParams();
  const selected = params.get("category")?.toLowerCase() || "all";
  const category: Category = categories.includes(selected as Category) ? selected as Category : "all";
  const query = (params.get("q") || "").trim().toLowerCase();
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
        {product.source && <div className="c2-action-row"><a href={product.source.url} target="_blank" rel="noopener noreferrer" aria-label={`Inspect ${product.name} source on GitHub`}>Inspect public source ↗</a></div>}
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
    <section className="c2-section" aria-label="RHEN public source and collaboration">
      <h2>Inspect the public RHEN source</h2>
      <p>The RHEN code repository is publicly visible for inspection. It does not currently publish a repository-wide reuse license. Visibility alone does not grant permission to copy, redistribute or operate the trading system. This source also includes development work that has not been deployed or approved as a member product.</p>
      <p>Contributions should focus on public-safe documentation, accessibility and reproducible synthetic tests. Do not post credentials, brokerage records, protected strategies or personal account information in GitHub issues.</p>
      <div className="c2-action-row"><a href={publishedSourceRecords.rhen.url} target="_blank" rel="noopener noreferrer">View RHEN repository ↗</a><Link to="/products/rhen/architecture">Read architectural boundaries</Link></div>
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
    <p className="c2-truth">Commons discussions are for independent learning and research methods. Following a member or reading their work never grants brokerage access, copies their orders, mirrors a portfolio, or executes another person\'s trades. RHEN connections and settings remain individually controlled.</p>
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
function BetaLanding() {
  const availability=useMemberAvailability();
  const {data:session,isPending}=memberAuthClient.useSession();
  return <div className="c2-page" data-public-beta="true">
    <Intro kicker="ANEVUM / MEMBER BETA" title="Build alongside ANEVUM.">
      Try a real member account, follow development and use the features that are ready. Registration does not require a brokerage account, payment or trading authorization.
    </Intro>
    <section className="c2-card" aria-labelledby="beta-join-title">
      <span className="c2-kicker">START HERE</span>
      <h2 id="beta-join-title">Create your ANEVUM account</h2>
      <p>Sign in with Google to get your own Command, manage a private profile, save projects and follow published work.</p>
      {availability==="available"?
        isPending?<p role="status">Checking member session…</p>:
        session?.user?
          <div className="c2-action-row"><Link to="/me/beta" className="c2-text-link">Open your beta checklist →</Link><Link to="/command">My Command →</Link></div>:
          <div className="c2-action-row"><Link to="/sign-in?next=beta" className="c2-text-link">Continue with Google →</Link><Link to="/help">Account help →</Link></div>:
        availability==="checking"?<p role="status">Checking registration availability…</p>:
        <div role="status"><p>Registration is not currently available. Public work is still open to read.</p>
          <button type="button" className="c2-text-link" onClick={refreshMemberAvailability}>Recheck registration</button></div>}
    </section>
    <section className="c2-section" aria-labelledby="beta-test-title">
      <h2 id="beta-test-title">What you can test</h2>
      <div className="c2-grid">
        <article className="c2-card"><h2>Member Command</h2><p>Save projects, follow updates, change profile settings and check account export controls. Availability is verified per session.</p><Link className="c2-text-link" to="/command">My Command →</Link></article>
        <article className="c2-card"><h2>Personal RHEN research setup</h2><p>In authorized staging, a member can reserve an independent workspace and save a non-executing bot draft. No real trading or broker authorization is granted.</p><Link className="c2-text-link" to="/products/rhen">RHEN status →</Link></article>
        <article className="c2-card"><h2>Open research and learning</h2><p>Explore real Field Notes, historical release records and published development decisions without signing up.</p><Link className="c2-text-link" to="/field-notes">Read Field Notes →</Link></article>
        <article className="c2-card"><h2>Community participation</h2><p>Topics are available to explore. New discussions, replies and moderation are still in a restricted pilot and are not open to general members.</p><Link className="c2-text-link" to="/communities">Explore topics →</Link></article>
      </div>
    </section>
    <section className="c2-section" aria-labelledby="beta-limits-title">
      <h2 id="beta-limits-title">Important boundaries</h2>
      <p>Joining does not connect a brokerage account, start a bot, place orders, unlock financial rewards or permit access to another member's workspace. Broker integrations are reviewed separately. Testers can use account support without sharing credentials or private exports.</p>
      <div className="c2-action-row"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/help">Help</Link></div>
    </section>
  </div>;
}

function Help() {
  return <div className="c2-page c2-help" aria-labelledby="commons-help-title">
    <header className="c2-intro">
      <span className="c2-kicker">COMMONS / HELP</span>
      <h1 id="commons-help-title">Help and account support</h1>
      <p>Find current ANEVUM pages, manage your own account and understand which RHEN and Commons features are available. No account or brokerage connection is required to read the public work.</p>
    </header>
    <section className="c2-grid" aria-label="Frequently asked questions">
      <article className="c2-card"><h2>Do I need an account?</h2>
        <p>No. Public projects, Field Notes and learning pages can be read without registering. When member sign-in is available, a Google account lets you manage your own saved projects and profile.</p>
        <Link to="/sign-in" className="c2-text-link">Account sign-in →</Link>
      </article>
      <article className="c2-card"><h2>Where can I export or delete my data?</h2>
        <p>While signed in, open your account settings for an export and account deletion. The privacy notice explains backups, provider records and limits to deletion. Never share an account export or session cookie with support.</p>
        <Link to="/me/settings" className="c2-text-link">My account settings →</Link>
      </article>
      <article className="c2-card"><h2>Can RHEN place trades for me?</h2>
        <p>Not through the current general member experience. Legacy live RHEN was retired for the V5 rebuild. Member research workspaces and non-executing drafts do not grant broker access or paper/live trading authority.</p>
        <Link to="/products/rhen/evidence" className="c2-text-link">Current RHEN evidence →</Link>
      </article>
      <article className="c2-card"><h2>Can I connect a brokerage account?</h2>
        <p>Broker connections require separate provider approval and feature-specific authorization. If connecting is unavailable, registering with Commons does not unlock it. Do not send API keys, OAuth URLs, access tokens or screenshots containing secrets by email.</p>
        <Link to="/products/rhen" className="c2-text-link">RHEN product status →</Link>
      </article>
      <article className="c2-card"><h2>Can I post or message other members?</h2>
        <p>Commons posting, notifications and moderation are still under development. Public Field Notes and topic pages are real publications, not simulated user conversations. Signing in does not automatically enable posting.</p>
        <Link to="/communities" className="c2-text-link">Explore published topics →</Link>
      </article>
      <article className="c2-card"><h2>How do I report a problem?</h2>
        <p>Include the public page URL, what you expected, what happened and the general time of the issue. Do not include passwords, account exports, private workspace identifiers, broker balances or secret keys.</p>
        <a className="c2-text-link" href="mailto:devon@anevum.com?subject=ANEVUM%20support">Email ANEVUM support →</a>
      </article>
    </section>
    <section className="c2-section" aria-label="Policies and useful pages">
      <h2>Policies and other resources</h2>
      <p>For questions about what information is collected, retained or deleted, read the privacy notice. The terms explain limitations of experimental software and financial research. Public source links and contributions have separate permissions from private accounts.</p>
      <div className="c2-action-row"><Link to="/privacy">Privacy notice</Link><Link to="/terms">Terms of use</Link><Link to="/field-notes">Field Notes</Link><Link to="/about">About ANEVUM</Link></div>
    </section>
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
    <section className="c2-section" aria-label="Website source and contribution terms">
      <h2>Website source</h2>
      <p>The ANEVUM website repository is publicly available under the Apache 2.0 license. Code availability does not mean the RHEN application or every ANEVUM product has the same license. The RHEN repository is visible separately, without a published repository-wide reuse license.</p>
      <div className="c2-action-row"><a href={publishedSourceRecords.website.url} target="_blank" rel="noopener noreferrer">Website source on GitHub ↗</a><Link to="/products/rhen">RHEN project</Link></div>
    </section>
  </div>;
}
function Missing() {
  return <div className="c2-page c2-empty" data-page-state="not-found">
    <Intro kicker="COMMONS / NOT FOUND" title="Page not found">That page or record is not published at this address. It may have moved or never existed.</Intro>
    <div className="c2-action-row">
      <Link className="c2-text-link" to="/">Return to Commons →</Link>
      <Link className="c2-text-link" to="/products">Browse projects →</Link>
      <Link className="c2-text-link" to="/field-notes">Read Field Notes →</Link>
    </div>
  </div>;
}
export default function CommonsPublicPage({ pathname }: Props) {
  if (pathname === "/products") return <Projects/>;
  if (pathname === "/beta") return <BetaLanding/>;
  if (pathname === "/field-notes") return <NoteIndex/>;
  if (pathname === "/updates") return <StudioPublications/>;
  if (pathname.startsWith("/updates/")) return <StudioPublications slug={pathname.slice("/updates/".length)}/>;
  if (pathname.startsWith("/field-notes/")) return <NoteDetail slug={pathname.slice("/field-notes/".length)}/>;
  if (pathname === "/products/rhen") return <RhenOverview/>;
  if (pathname === "/products/rhen/evidence") return <RhenEvidence/>;
  if (pathname === "/products/rhen/architecture") return <RhenArchitecture/>;
  if (pathname === "/products/rhen/releases") return <Releases/>;
  if (pathname.startsWith("/products/rhen/releases/")) return <ReleaseDetail slug={pathname.slice("/products/rhen/releases/".length)} missing={<Missing/>}/>;
  if (pathname === "/communities/moderation") return <CommonsModeration/>;
  if (pathname === "/communities") return <Communities/>;
  if (pathname === "/learn") return <Learn/>;
  if (pathname === "/about") return <About/>;
  if (pathname === "/help") return <Help/>;
  if (pathname === "/resume") return <ResumePage/>;
  if (pathname === "/privacy") return <div className="c2-page c2-legal"><Privacy/></div>;
  if (pathname === "/terms") return <div className="c2-page c2-legal"><Terms/></div>;
  if (pathname === "/sign-in") return <div className="c2-page c2-legal"><SignIn/></div>;
  return <Missing/>;
}
