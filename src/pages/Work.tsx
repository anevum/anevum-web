import PageIntro from "../components/PageIntro";
import ProjectRow from "../components/ProjectRow";

export default function Work() {
  return (
    <>
      <PageIntro kicker="WORK" title="Things being built.">
        <p>
          This is the project index for ANEVUM. It is intentionally stateful: active work,
          maintenance work, paused work, and archived work are separated so the present does not
          get buried under everything that came before it.
        </p>
      </PageIntro>

      <section className="content-section">
        <div className="section-label"><span>01</span><p>ACTIVE</p></div>
        <div className="project-list">
          <ProjectRow
            index="01"
            status="PRIMARY BUILD"
            title="Automated Capital System"
            description="A live software system for observing markets, qualifying setups, enforcing account-level risk, executing through Alpaca, recording telemetry, and reviewing the results."
            meta={["REACT", "CLOUDFLARE", "RAILWAY", "ALPACA"]}
            to="/lab"
          />
          <ProjectRow
            index="02"
            status="INFRASTRUCTURE"
            title="ANEVUM"
            description="The personal operating surface behind this site: identity, archive, public record, private Command, project structure, and the systems that connect them."
            meta={["GITHUB", "CLOUDFLARE", "RAILWAY", "ACCESS"]}
            to="/wiki"
          />
        </div>
      </section>

      <section className="content-section">
        <div className="section-label"><span>02</span><p>MAINTAINED</p></div>
        <div className="work-detail-grid">
          <article><span>COMMAND</span><h3>Private operations</h3><p>Authenticated visibility into the live capital system, scanner, account state, orders, positions, and runtime telemetry.</p></article>
          <article><span>CLOUDFLARE ACCESS</span><h3>Identity layer</h3><p>Verified owner identity for private Command and its API.</p></article>
          <article><span>RECORD</span><h3>Evidence layer</h3><p>Public sanitized data and chronological project changes kept separate from private operational data.</p></article>
          <article><span>WIKI</span><h3>Knowledge layer</h3><p>The structured map for current systems, decisions, infrastructure, and archived work.</p></article>
        </div>
      </section>

      <section className="content-section muted-section">
        <div className="section-label"><span>03</span><p>ARCHIVED</p></div>
        <ProjectRow
          index="A1"
          status="PRESERVED"
          title="The Transcosmic"
          description="The earlier publishing-first ANEVUM era, including REPLY, worldbuilding, visual development, release planning, and related systems."
          meta={["CREATIVE ERA", "ARCHIVE"]}
          to="/wiki/archive/transcosmic"
        />
      </section>
    </>
  );
}
