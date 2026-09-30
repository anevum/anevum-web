import founder from "../data/founder.json";

export default function Resume() {
  return (
    <div className="resume-page">
      <div className="resume-toolbar">
        <div><span>DEVON AKINS / RÉSUMÉ</span><small>Web and PDF use the same canonical profile source.</small></div>
        <a className="company-button primary" href="/devon-akins-resume.pdf" download>Download PDF</a>
      </div>

      <article className="resume-sheet">
        <header className="resume-header">
          <div><span>ANEVUM</span><h1>{founder.name}</h1><h2>{founder.headline}</h2></div>
          <address><a href={"mailto:" + founder.email}>{founder.email}</a><a href="https://anevum.com">{founder.website}</a></address>
        </header>

        <section><h3>Professional Summary</h3><p>{founder.summary}</p></section>

        <section>
          <h3>Current Experience</h3>
          {founder.experience.map((experience) => (
            <div className="resume-experience" key={experience.organization}>
              <header><div><strong>{experience.organization}</strong><span>{experience.role}</span></div><time>{experience.period}</time></header>
              <ul>{experience.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </section>

        <section>
          <h3>Technical Skills</h3>
          <div className="resume-skill-grid">
            {founder.skills.map((group) => <div key={group.group}><strong>{group.group}</strong><p>{group.items.join(" · ")}</p></div>)}
          </div>
        </section>

        <section>
          <h3>Selected Systems</h3>
          <div className="resume-system-grid">
            {founder.systems.map((system) => <div key={system.name}><strong>{system.name}</strong><p>{system.description}</p></div>)}
          </div>
        </section>

        <section>
          <h3>Education</h3>
          <div className="resume-education">
            {founder.education.map((item) => <div key={item.school}><strong>{item.school}</strong><span>{item.study}</span><p>{item.detail}</p></div>)}
          </div>
        </section>
      </article>
    </div>
  );
}
