import { Link } from "react-router-dom";
import founder from "../data/founder.json";
import SystemIcon from "../components/company/SystemIcon";

const flagshipSystems = new Set(["IREN","RHEN","NOSTRA","GRAEN","VELUM"] as const);

type FlagshipSystem = "IREN" | "RHEN" | "NOSTRA" | "GRAEN" | "VELUM";

export default function Founder() {
  return (
    <div className="company-page founder-page">
      <section className="founder-hero">
        <div className="founder-id">
          <div className="founder-portrait">
            <img src="/devon-akins-headshot.jpg" alt="Devon Akins" />
            <span className="founder-portrait-frame" aria-hidden="true" />
            <small>FOUNDER / ANEVUM</small>
          </div>
          <div>
            <span>FOUNDER / SOFTWARE BUILDER / INDEPENDENT RESEARCHER</span>
            <h1>{founder.name}</h1>
            <h2>{founder.profileHeadline}</h2>
            <p>{founder.summary}</p>
            <div className="founder-actions">
              <Link className="company-button primary" to="/resume">View résumé <span>→</span></Link>
              <a className="company-button" href="/devon-akins-resume.pdf" download>Download PDF</a>
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
            <div><dt>BASE</dt><dd>{founder.location}</dd></div>
            <div><dt>WEB</dt><dd>{founder.website}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="founder-profile-strip">
        <div><span>PRIMARY WORK</span><strong>ANEVUM</strong><p>Designing and operating the company&apos;s software, research, telemetry, deployment, forecasting, replay, and market-system architecture.</p></div>
        <div><span>RESEARCH</span><strong>Mathematics + systems</strong><p>Validation, forecasting, evidence quality, simulation, and adaptive-system methodology.</p></div>
        <div><span>BUILD STYLE</span><strong>End-to-end</strong><p>Product surface through backend services, data models, deployment, observability, and operating controls.</p></div>
      </section>

      <section className="company-section founder-about">
        <header className="company-section-head"><span>ABOUT</span><h2>Building software, research, and the evidence around both.</h2></header>
        <div className="founder-about-grid">
          <p>{founder.summary}</p>
          <p>My background also includes mathematics tutoring, undergraduate biophysics research, and student-organization leadership. ANEVUM is the current company and technical portfolio—not a substitute for the rest of my professional history.</p>
        </div>
      </section>

      <section className="company-section">
        <header className="company-section-head"><span>CURRENT WORK</span><h2>Selected ANEVUM systems.</h2></header>
        <div className="selected-work-grid">
          {founder.systems.map((system) => {
            const route = ["IREN","RHEN","NOSTRA","GRAEN","VELUM"].includes(system.name) ? "/products/" + system.name.toLowerCase() : "/";
            return (
              <Link key={system.name} to={route}>
                <div className="founder-system-mark">
                  {flagshipSystems.has(system.name as FlagshipSystem)
                    ? <SystemIcon system={system.name as FlagshipSystem} size="md" />
                    : null}
                </div>
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
        <header className="company-section-head"><span>SKILLS</span><h2>Professional competencies.</h2><p>Software engineering, mathematics, research, teaching, and technical operations.</p></header>
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
        <div><span>CONTACT</span><h2>Devon Akins</h2><p>Founder, ANEVUM · {founder.location}</p></div>
        <div><a href={"mailto:" + founder.email}>{founder.email}</a><a href="https://anevum.com">anevum.com</a><a href="/devon-akins-resume.pdf" download>Download résumé PDF ↗</a></div>
      </section>
    </div>
  );
}
