import { Link, Navigate } from "react-router-dom";
import Mark from "../components/Mark";
import { memberAuthClient } from "../member/auth-client";
import { fieldNotes } from "../data/fieldNotes";
import { currentRhenRelease } from "../data/releases";

const path = [
  ["01", "Ask", "Turn a question or hypothesis into a clear problem."],
  ["02", "Investigate", "Discuss assumptions, measurements, and limitations."],
  ["03", "Test", "Connect the research to evidence as tools become available."],
  ["04", "Document", "Keep a useful record of what was learned."]
];

export default function HomeCompany() {
  const { data: session } = memberAuthClient.useSession();
  const latestNotes = [...fieldNotes].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);
  const release = currentRhenRelease();

  // The signed-in destination is Commons. Never redirect into an owner terminal.
  if (session?.user) return <Navigate to="/commons" replace />;

  return <div className="studio-home truth-home commons-welcome">
    <section className="commons-landing-hero">
      <div className="commons-landing-copy">
        <span className="commons-eyebrow">ANEVUM / COMMONS</span>
        <h1>Good questions.<br /><span>Real research.</span><br />Better software.</h1>
        <p>A place to investigate ideas, share what you've learned, and use practical tools. We're starting with algorithmic trading research, and building from there.</p>
        <div className="commons-landing-actions">
          <Link className="commons-action" to="/sign-in">Enter Commons →</Link>
          <Link className="commons-link" to="/products/rhen">Explore RHEN</Link>
        </div>
        <div className="commons-landing-footnote">Account sign-in is available. Commons research contributions are entering an invitation-only beta.</div>
      </div>
      <div className="commons-landing-preview" aria-label="How research in Commons is organized">
        <div className="commons-landing-window">
          <div className="commons-preview-bar"><div className="commons-preview-mark"><Mark /><strong>Commons</strong></div><span>Research workflow</span></div>
          <div className="commons-preview-intro"><span>HOW IT WORKS</span><h2>From a question to useful evidence.</h2><p>Thoughtful discussion becomes a record you can return to.</p></div>
          <div className="commons-preview-steps">
            {path.map(([num,title,detail]) => <div className="commons-preview-step" key={num}>
              <span className="commons-preview-num">{num}</span><div><strong>{title}</strong><p>{detail}</p></div>
            </div>)}
          </div>
          <div className="commons-preview-status"><span>INITIAL APPLICATION</span><strong>RHEN</strong><span>Research · Markets · v{release.version}</span></div>
        </div>
      </div>
    </section>
    <section className="commons-landing-features" aria-labelledby="commons-capabilities">
      <div className="commons-section-title"><span className="commons-eyebrow">ONE ACCOUNT</span><h2 id="commons-capabilities">Your place to learn, contribute, and build.</h2><p>ANEVUM connects a research community with the software being developed. Each area has a clear purpose.</p></div>
      <div className="commons-feature-grid">
        <article><span>01 / COMMUNITY</span><h3>Commons</h3><p>Ask specific questions, exchange research notes and preserve valuable findings. Participation begins with a small invite-only group.</p><Link to="/commons">Open Commons →</Link></article>
        <article><span>02 / APPLICATION</span><h3>RHEN</h3><p>Explore a working market research system, its public evidence and development record. Personal brokerage connections are not active yet.</p><Link to="/products/rhen">Meet RHEN →</Link></article>
        <article><span>03 / LEARNING</span><h3>Learn the method</h3><p>Understand strategy rules, backtests, trading costs, and the limits of historical results before risking money. The learning material is free.</p><Link to="/learn">Start learning →</Link></article>
        <article><span>04 / YOUR ACCOUNT</span><h3>Command</h3><p>One private home for your programs, preferences and account. The company's protected trading terminal is not shared with members.</p><Link to="/sign-in">Manage your account →</Link></article>
      </div>
    </section>
    <section className="commons-landing-record" aria-labelledby="commons-public">
      <div className="commons-record-heading"><div><span className="commons-eyebrow">PUBLISHED MATERIAL</span><h2 id="commons-public">Start with actual work.</h2></div><Link to="/field-notes">Browse the library →</Link></div>
      <div className="commons-public-list">
        {latestNotes.map(note => <Link key={note.slug} to={"/field-notes/" + note.slug}><time dateTime={note.date}>{note.date}</time><div><strong>{note.title}</strong><p>{note.summary}</p></div><span aria-hidden="true">→</span></Link>)}
      </div>
    </section>
    <section className="commons-landing-close">
      <div><span className="commons-eyebrow">JOIN ANEVUM</span><h2>Build on evidence, not promises.</h2><p>Start with a free account. Commons participation will open in controlled groups while we verify the experience.</p></div>
      <Link className="commons-action" to="/sign-in">Sign in or create account →</Link>
    </section>
  </div>;
}
