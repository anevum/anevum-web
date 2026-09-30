import founder from "../data/founder.json";

export default function Resume() {
  return (
    <div className="resume-page">
      <div className="resume-toolbar">
        <div><span>DEVON AKINS / RÉSUMÉ</span><small>Professional experience, education, skills, and credentials.</small></div>
        <a className="company-button primary" href="/devon-akins-resume.pdf" download>Download PDF</a>
      </div>

      <article className="resume-sheet">
        <header className="resume-header">
          <div><span>PROFESSIONAL RÉSUMÉ</span><h1>{founder.name}</h1><h2>{founder.headline}</h2></div>
          <address>
            <span>{founder.location}</span>
            <a href={"mailto:" + founder.email}>{founder.email}</a>
            <a href="https://anevum.com">{founder.website}</a>
          </address>
        </header>

        <section><h3>Professional Summary</h3><p>{founder.summary}</p></section>

        <section>
          <h3>Experience</h3>
          <div className="resume-experience-list">
            {founder.experience.map((experience) => (
              <div className="resume-experience" key={experience.organization + experience.role}>
                <header><div><strong>{experience.organization}</strong><span>{experience.role}</span></div><time>{experience.period}</time></header>
                <ul>{experience.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>Technical Skills</h3>
          <div className="resume-skill-grid">
            {founder.skills.map((group) => <div key={group.group}><strong>{group.group}</strong><p>{group.items.join(" · ")}</p></div>)}
          </div>
        </section>

        <section>
          <h3>Education</h3>
          <div className="resume-education">
            {founder.education.map((item) => <div key={item.school}><strong>{item.school}</strong><span>{item.study}</span><p>{item.detail}</p></div>)}
          </div>
        </section>

        <section>
          <h3>Certification</h3>
          <div className="resume-education">
            {founder.certifications.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.status}</span><p>{item.detail}</p></div>)}
          </div>
        </section>
      </article>
    </div>
  );
}
