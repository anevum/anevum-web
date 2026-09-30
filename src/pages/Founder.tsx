import { Link } from "react-router-dom";
import founder from "../data/founder.json";
import { dispatches } from "../data/dispatches";
import { useLiveTrading } from "../hooks/useLiveTrading";

export default function Founder() {
  const { data } = useLiveTrading(10000);
  const latest = dispatches.slice(0, 3);

  return (
    <div className="company-page founder-page">
      <section className="founder-hero founder-hero-v2">
        <div className="founder-photo-panel">
          <img src="/devon-akins-headshot.jpg" alt="Devon Akins" />
          <div className="founder-photo-overlay">
            <span>FOUNDER / ANEVUM</span>
            <strong>{data?.state || "PUBLIC SYSTEM"}</strong>
          </div>
        </div>

        <div className="founder-id founder-id-v2">
          <div>
            <span>FOUNDER / ANEVUM</span>
            <h1>{founder.name}</h1>
            <h2>{founder.profileHeadline}</h2>
            <p>{founder.summary}</p>
            <div className="founder-actions">
              <Link className="company-button primary" to="/resume">View résumé <span>→</span></Link>
              <a className="company-button" href="/devon-akins-resume.pdf" download>Download PDF</a>
              <Link className="company-button" to="/dispatches">Read Dispatches</Link>
              <a className="company-text-link" href={"mailto:" + founder.email}>{founder.email}</a>
            </div>
          </div>
        </div>

        <aside className="founder-snapshot">
          <span>CURRENT FOCUS</span>
          <strong>ANEVUM</strong>
          <p>Software systems · research infrastructure · market systems · forecasting · mathematical validation · replay</p>
          <dl>
            <div><dt>ROLE</dt><dd>Founder</dd></div>
            <div><dt>BUILD</dt><dd>2026–Present</dd></div>
            <div><dt>PUBLIC STATE</dt><dd>{data?.state || "UNAVAILABLE"}</dd></div>
            <div><dt>RESEARCH</dt><dd>{data?.research?.current_status || "UNAVAILABLE"}</dd></div>
            <div><dt>WEB</dt><dd>{founder.website}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="company-section founder-about">
        <header className="company-section-head"><span>ABOUT</span><h2>Building the system and the evidence around it.</h2></header>
        <div className="founder-about-grid">
          <p>{founder.summary}</p>
          <p>Current work is deliberately cross-disciplinary: frontend product surfaces, Python services, deployment infrastructure, telemetry and evidence systems, market execution controls, mathematical research, forecasting, simulation, and reliability boundaries. The work is presented by what exists in the repositories and production system, not by inflated titles.</p>
        </div>
      </section>

      <section className="company-section founder-dispatches">
        <header className="company-section-head"><span>WORKING RECORD</span><h2>Recent Dispatches.</h2><p>Public progress notes make the build history inspectable instead of reducing it to a finished portfolio.</p></header>
        <div className="founder-dispatch-grid">
          {latest.map((entry) => (
            <Link key={entry.slug} to={"/dispatches/" + entry.slug}>
              <span>{entry.kind} · {entry.system}</span>
              <strong>{entry.title}</strong>
              <p>{entry.dek}</p>
              <i>{entry.status} →</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>CURRENT WORK</span><h2>Selected systems.</h2></header>
        <div className="selected-work-grid">
          {founder.systems.map((system) => {
            const route = ["IREN","RHEN","NOSTRA","GRAEN","VELUM"].includes(system.name) ? "/products/" + system.name.toLowerCase() : "/";
            return (
              <Link key={system.name} to={route}>
                <span>ANEVUM SYSTEM</span>
                <strong>{system.name}</strong>
                <p>{system.description}</p>
                <i>OPEN ↗</i>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>SKILLS</span><h2>Technical competencies.</h2><p>Grouped by demonstrated work and study rather than self-rated proficiency scores.</p></header>
        <div className="founder-skill-grid">
          {founder.skills.map((group) => (
            <article key={group.group}><span>{group.group}</span><div>{group.items.map((item) => <b key={item}>{item}</b>)}</div></article>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>ENGINEERING TIMELINE</span><h2>2026 build record.</h2></header>
        <div className="founder-timeline">
          {founder.timeline.map((item, index) => (
            <article key={item.title}><span>{item.date}</span><i aria-hidden="true" /><div><small>{String(index + 1).padStart(2,"0")}</small><strong>{item.title}</strong><p>{item.detail}</p></div></article>
          ))}
        </div>
      </section>

      <section className="company-section founder-education">
        <header className="company-section-head"><span>EDUCATION</span><h2>Academic study.</h2></header>
        <div className="education-grid">
          {founder.education.map((item) => (
            <article key={item.school}><span>{item.school}</span><strong>{item.study}</strong><p>{item.detail}</p></article>
          ))}
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>TECHNOLOGY STACK</span><h2>Current working stack.</h2></header>
        <div className="technology-marquee">{founder.stack.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="founder-contact">
        <div><span>CONTACT</span><h2>Devon Akins</h2><p>Founder, ANEVUM</p></div>
        <div><a href={"mailto:" + founder.email}>{founder.email}</a><a href="https://anevum.com">anevum.com</a><a href="/devon-akins-resume.pdf" download>Download résumé PDF ↗</a></div>
      </section>
    </div>
  );
}
