import { Link } from "react-router-dom";
import founder from "../data/founder.json";

export default function Founder() {
  return (
    <div className="studio-page studio-about-page workshop-about">
      <header className="workshop-page-intro">
        <p className="workshop-kicker">About ANEVUM</p>
        <h1>ANEVUM is one person right now.</h1>
        <p>I'm Devon. I build software because I'm curious, I want useful things to exist, and I enjoy figuring out how systems work. ANEVUM is where I keep that work.</p>
      </header>

      <section className="workshop-about-intro" aria-label="Who is behind ANEVUM">
        <div>
          <h2>A workshop, not a product pitch.</h2>
          <p>RHEN started as my own experiment in markets and money. Other projects may have nothing to do with trading. I use mathematics, programming, research, and AI-assisted development to take ideas from something I'm wondering about to something I can actually use.</p>
          <p>Not everything works, and I don't pretend otherwise. I'd rather publish the results, make the useful parts available, and keep learning.</p>
          <p>I'd like the work to support my family and eventually help other people, too. That matters more to me than making the website look like a much larger company.</p>
          <div className="workshop-about-links">
            <Link to="/resume">View résumé →</Link>
            <a href="/devon-akins-resume.pdf" download>Download PDF</a>
            <a href={`mailto:${founder.email}`}>Get in touch</a>
          </div>
        </div>
        <figure className="workshop-about-photo">
          <img src="/devon-akins-headshot.jpg" alt="Portrait of Devon Akins, who builds ANEVUM" loading="lazy" />
          <figcaption>Devon Akins · Independent developer</figcaption>
        </figure>
      </section>

      <section className="workshop-section" aria-labelledby="about-background">
        <div className="workshop-section-heading">
          <div><p className="workshop-section-eyebrow">Experience</p><h2 id="about-background">The path so far</h2></div>
        </div>
        <div className="workshop-about-experience">
          {founder.experience.slice(0, 4).map((item) => (
            <article key={item.organization + "-" + item.role}>
              <time>{item.period}</time>
              <div><h3>{item.organization}</h3><strong>{item.role}</strong><p>{item.bullets[0]}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="workshop-section" aria-labelledby="about-tools">
        <div className="workshop-section-heading">
          <div><p className="workshop-section-eyebrow">Tools</p><h2 id="about-tools">What I work with</h2></div>
        </div>
        <div className="workshop-about-stack">
          {founder.stack.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="workshop-endnote">
        <p>ANEVUM is maintained independently. If there's something interesting you'd like to talk about, you can reach me directly.</p>
        <a href={`mailto:${founder.email}`}>{founder.email} →</a>
      </section>
    </div>
  );
}
