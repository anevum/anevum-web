import Mark from "../components/Mark";
import PageIntro from "../components/PageIntro";

export default function About() {
  return (
    <>
      <PageIntro kicker="ABOUT" title="A place for work that changes.">
        <p>
          ANEVUM is Devon Akins's personal umbrella project and home online. It is not meant to
          force writing, software, research, markets, or future projects into one company-shaped
          identity. It is the place where the work can accumulate without losing its history.
        </p>
      </PageIntro>

      <section className="content-section about-layout">
        <div className="about-mark"><Mark /><span>ANEVUM</span></div>
        <div className="about-copy">
          <p className="large-copy">
            Devon is a father, writer, builder, and independent researcher. ANEVUM exists because
            those interests do not stay in one lane.
          </p>
          <p>
            The site is organized around finished work, active experiments, and a usable record.
            New interests do not require a new identity. Old interests do not need to be deleted.
          </p>
          <p>
            The current primary engineering project is RHEN, an automated market research and execution system. Earlier work
            includes the Transcosmic fiction universe and publishing development. Future projects
            can take entirely different forms without forcing another structural reset.
          </p>
        </div>
      </section>

      <section className="principles-grid">
        <article><span>01</span><strong>Finish things.</strong><p>Planning matters only when it improves the probability of useful output.</p></article>
        <article><span>02</span><strong>Keep evidence.</strong><p>Results, failures, revisions, and decisions are more useful when they remain traceable.</p></article>
        <article><span>03</span><strong>Let the work change.</strong><p>The structure should survive shifts in subject without pretending every project is one business.</p></article>
        <article><span>04</span><strong>Protect the important parts.</strong><p>Family, health, and a sustainable life remain constraints on what gets built and how.</p></article>
      </section>
    </>
  );
}
