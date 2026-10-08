import { Link } from "react-router-dom";
import Mark from "../components/Mark";
import { fieldNotes } from "../data/fieldNotes";
import { currentRhenRelease } from "../data/releases";

const principles = [
  ["01", "Give time back", "The point of automation is not more software to manage. It is fewer repetitive decisions competing for a person's attention."],
  ["02", "Make complexity legible", "Money, markets, data, and automation are complicated enough. The interface should make the underlying system easier to understand, not harder."],
  ["03", "Evidence over theatre", "Experiments, failures, limits, and measured results belong in the record. A polished interface is useful; pretending is not."],
  ["04", "Build small, then earn scale", "ANEVUM can make focused tools quickly, learn from real use, and let the useful ones grow instead of turning every idea into a platform."],
] as const;

export default function HomeCompany() {
  const release = currentRhenRelease();
  const latestNote = [...fieldNotes].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="studio-home">
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <div className="studio-eyebrow"><i /> INDEPENDENT SOFTWARE STUDIO</div>
          <h1>Software for the parts of life that shouldn&apos;t take over your life.</h1>
          <p className="studio-hero-lead">
            ANEVUM is an independent software studio run by Devon Akins. I build practical tools around
            money, investing, automation, and the repetitive work that gets in the way of living.
          </p>
          <div className="studio-actions">
            <Link className="studio-button primary" to="/products">Explore the work <span>→</span></Link>
            <Link className="studio-button" to="/research">Read Field Notes</Link>
          </div>
          <div className="studio-hero-footnote">
            <span>ONE FOUNDER</span><i />
            <span>BUILDING IN PUBLIC</span><i />
            <span>CENTRAL FLORIDA</span>
          </div>
        </div>

        <aside className="studio-now-card" aria-label="What ANEVUM is building now">
          <header>
            <span>NOW / 001</span>
            <Mark />
          </header>
          <div className="studio-now-main">
            <span>FLAGSHIP PROJECT</span>
            <h2>RHEN</h2>
            <p>
              A live trading and research system for testing whether market ideas can survive real evidence,
              real friction, and real operation.
            </p>
          </div>
          <dl>
            <div><dt>CURRENT RELEASE</dt><dd>{release.version}</dd></div>
            <div><dt>STATE</dt><dd>ACTIVE R&amp;D</dd></div>
            <div><dt>FOCUS</dt><dd>EQUITIES + ETFs</dd></div>
          </dl>
          <Link to="/products/rhen">Open RHEN <span>↗</span></Link>
        </aside>
      </section>

      <section className="studio-statement">
        <span>WHY ANEVUM</span>
        <div>
          <h2>Technology should carry some of the weight.</h2>
          <p>
            People have families, work, interests, and lives they actually want to be present for. Financial
            administration, research, repetitive decisions, and software busywork can consume far more attention
            than they deserve. ANEVUM starts there: find a burden, understand it, and build something that makes it lighter.
          </p>
          <p>
            Finance is the first major domain, not the permanent boundary. If a useful tool fits the same philosophy,
            it belongs here.
          </p>
        </div>
      </section>

      <section className="studio-section studio-work-section">
        <header className="studio-section-heading">
          <span>THE WORK</span>
          <div><h2>One serious system now. Room for many useful tools later.</h2></div>
        </header>

        <div className="studio-work-grid">
          <Link to="/products/rhen" className="studio-work-card flagship">
            <div className="studio-card-index">01</div>
            <div className="studio-card-status"><i /> ACTIVE</div>
            <h3>RHEN</h3>
            <p>Automated market observation, trading, research, replay, forecasting, and evidence.</p>
            <footer><span>FINANCE / INVESTING</span><b>EXPLORE ↗</b></footer>
          </Link>

          <article className="studio-work-card future">
            <div className="studio-card-index">02</div>
            <div className="studio-card-status">NEXT</div>
            <h3>Focused financial tools</h3>
            <p>Smaller products for individuals: planning, cash flow, decision support, investing, and automation.</p>
            <footer><span>PRODUCT LANE</span><b>IN DEVELOPMENT</b></footer>
          </article>

          <article className="studio-work-card future">
            <div className="studio-card-index">03+</div>
            <div className="studio-card-status">OPEN</div>
            <h3>Experiments</h3>
            <p>Small software can stay small. Useful experiments can graduate into products when they earn it.</p>
            <footer><span>LAB / UTILITIES</span><b>ROOM TO GROW</b></footer>
          </article>
        </div>
        <Link className="studio-inline-link" to="/products">See the product portfolio →</Link>
      </section>

      <section className="studio-section studio-principles-section">
        <header className="studio-section-heading">
          <span>HOW I BUILD</span>
          <div>
            <h2>Useful before impressive.</h2>
            <p>ANEVUM does not need to behave like a giant software company. The advantage of being small is that the work can stay close to the problem.</p>
          </div>
        </header>
        <div className="studio-principles-grid">
          {principles.map(([index, title, body]) => (
            <article key={index}><span>{index}</span><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      {latestNote ? (
        <section className="studio-section studio-notes-section">
          <header className="studio-section-heading">
            <span>FIELD NOTES</span>
            <div><h2>The build record stays public.</h2><p>What changed, what failed, what the evidence says, and what I am trying next.</p></div>
          </header>
          <Link className="studio-latest-note" to={`/research/${latestNote.slug}`}>
            <div><span>LATEST / {latestNote.date}</span><strong>{latestNote.type}</strong></div>
            <h3>{latestNote.title}</h3>
            <p>{latestNote.summary}</p>
            <footer><span>{latestNote.readMinutes} MIN READ</span><b>READ NOTE ↗</b></footer>
          </Link>
          <Link className="studio-inline-link" to="/research">Browse all Field Notes →</Link>
        </section>
      ) : null}

      <section className="studio-founder-band">
        <div className="studio-founder-image"><img src="/devon-akins-headshot.jpg" alt="Devon Akins" /></div>
        <div>
          <span>THE PERSON BEHIND IT</span>
          <h2>ANEVUM is one person right now.</h2>
          <p>
            I&apos;m Devon Akins. I design, build, test, deploy, document, and operate the software here. The site is meant
            to show that work clearly—not to make a one-person studio look like a hundred-person company.
          </p>
          <Link to="/about">About me and ANEVUM →</Link>
        </div>
      </section>
    </div>
  );
}
