import { Link } from "react-router-dom";
import founder from "../data/founder.json";

export default function Founder() {
  return (
    <div className="studio-page studio-about-page">
      <section className="studio-about-hero">
        <div className="studio-about-portrait"><img src="/devon-akins-headshot.jpg" alt="Devon Akins" /></div>
        <div>
          <span>ABOUT / DEVON AKINS</span>
          <h1>ANEVUM is one person right now.</h1>
          <p className="studio-about-lead">
            I&apos;m Devon Akins. I founded ANEVUM in 2026 and currently design, build, test, deploy, document,
            and operate the software myself.
          </p>
          <p>
            I am not trying to make a one-person studio look like a large software firm. The point is to make useful things,
            show the work clearly, and let the company become larger only when the work actually calls for it.
          </p>
          <div className="studio-actions">
            <Link className="studio-button primary" to="/resume">View résumé <span>→</span></Link>
            <a className="studio-button" href="/devon-akins-resume.pdf" download>Download PDF</a>
          </div>
        </div>
      </section>

      <section className="studio-statement compact">
        <span>WHY I STARTED IT</span>
        <div>
          <h2>Build software that gives people some attention back.</h2>
          <p>
            Money, investing, administration, and repetitive decisions can sit in the background of everyday life and keep taking mental space.
            I want ANEVUM to build tools that handle more of that work for people while still making the underlying system understandable.
          </p>
          <p>That starts with finance because it is where I am doing the deepest work now. It does not end there.</p>
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>BACKGROUND</span><div><h2>Software, mathematics, research, and teaching.</h2><p>Those threads show up in how I approach products: model the problem, make the assumptions visible, test what can be tested, and explain the result.</p></div></header>
        <div className="studio-background-grid">
          {founder.experience.slice(0,4).map((item) => (
            <article key={`${item.organization}-${item.role}`}><span>{item.period}</span><h3>{item.organization}</h3><strong>{item.role}</strong><p>{item.bullets[0]}</p></article>
          ))}
        </div>
      </section>

      <section className="studio-section">
        <header className="studio-section-heading"><span>WORKING STACK</span><div><h2>I build across the whole path from idea to running software.</h2></div></header>
        <div className="studio-stack">{founder.stack.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="studio-contact-band">
        <div><span>CONTACT</span><h2>Devon Akins</h2><p>Founder, ANEVUM · {founder.location}</p></div>
        <div><a href={`mailto:${founder.email}`}>{founder.email}</a><Link to="/products">Products</Link><Link to="/research">Field Notes</Link></div>
      </section>
    </div>
  );
}
