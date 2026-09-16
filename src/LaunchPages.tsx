import { ArrowRight, BookOpen, ExternalLink, Orbit, Store } from "lucide-react";
import { LaunchTerminal } from "./LaunchTerminal";

type LaunchSection = "book" | "story" | "store";

type Edition = {
  label: string;
  note: string;
  href: string;
};

const buyUrl = import.meta.env.VITE_REPLY_BUY_URL || "";
const hardcoverUrl = import.meta.env.VITE_REPLY_HARDCOVER_URL || buyUrl;
const paperbackUrl = import.meta.env.VITE_REPLY_PAPERBACK_URL || buyUrl;
const ebookUrl = import.meta.env.VITE_REPLY_EBOOK_URL || buyUrl;
const sampleUrl = import.meta.env.VITE_REPLY_SAMPLE_URL || "";
const coverUrl = import.meta.env.VITE_REPLY_COVER_URL || "";
const heroImageUrl = import.meta.env.VITE_REPLY_HERO_IMAGE_URL || "";

const editions: Edition[] = [
  { label: "Hardcover", note: "Print edition", href: hardcoverUrl },
  { label: "Paperback", note: "Print edition", href: paperbackUrl },
  { label: "eBook", note: "Digital edition", href: ebookUrl },
].filter((edition) => Boolean(edition.href));

function Action({ href, children, quiet = false }: { href: string; children: React.ReactNode; quiet?: boolean }) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      className={`reply-launch-action${quiet ? " quiet" : ""}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span>{children}</span>
      {external ? <ExternalLink size={14} strokeWidth={1.5} /> : <ArrowRight size={15} strokeWidth={1.5} />}
    </a>
  );
}

function LaunchHeader({ active }: { active: LaunchSection }) {
  return (
    <header className="reply-launch-header launch-page-header">
      <a className="reply-launch-brand" href="/" aria-label="ANEVUM home">
        <strong>ANEVUM</strong>
        <small>A UNIVERSE IN STORY.</small>
      </a>
      <nav aria-label="ANEVUM launch navigation">
        <a aria-current={active === "book" ? "page" : undefined} className={active === "book" ? "active" : ""} href="/the-book">THE BOOK</a>
        <a aria-current={active === "story" ? "page" : undefined} className={active === "story" ? "active" : ""} href="/the-story">THE STORY</a>
        <a href="/rhenlink">RHENLINK</a>
      </nav>
      <a className="reply-launch-header-link" href="/">REPLY</a>
    </header>
  );
}

function LaunchFooter() {
  return (
    <footer className="reply-launch-footer launch-page-footer">
      <a href="/"><strong>ANEVUM</strong><small>A UNIVERSE IN STORY.</small></a>
      <p>REPLY / THE TRANSCOSMIC / BOOK ONE</p>
      <span><a href="/rhenlink">RHENLINK</a> · DEVON AKINS</span>
    </footer>
  );
}

function AtmosphericField({ compact = false }: { compact?: boolean }) {
  if (heroImageUrl) {
    return <div className={`launch-page-atmosphere supplied${compact ? " compact" : ""}`}><img src={heroImageUrl} alt="" /></div>;
  }

  return (
    <div className={`launch-page-atmosphere${compact ? " compact" : ""}`} aria-hidden="true">
      <i className="launch-page-star star-a" />
      <i className="launch-page-star star-b" />
      <i className="launch-page-star star-c" />
      <div className="launch-page-orbit orbit-a" />
      <div className="launch-page-orbit orbit-b" />
      <div className="launch-page-world" />
      <div className="launch-page-horizon" />
      <div className="launch-page-signal"><i /><i /><i /><i /><i /><i /></div>
    </div>
  );
}

function BookObject({ large = false }: { large?: boolean }) {
  return (
    <div className={`launch-page-book-stage${large ? " large" : ""}`} aria-label="REPLY book presentation">
      <div className="launch-page-book-shadow" aria-hidden="true" />
      <div className="launch-page-book">
        <div className="launch-page-book-spine" aria-hidden="true"><span>REPLY</span><small>DEVON AKINS</small></div>
        <div className="launch-page-book-cover">
          {coverUrl ? <img src={coverUrl} alt="REPLY by Devon Akins" /> : (
            <>
              <div className="launch-page-cover-field" aria-hidden="true"><i /><i /><i /><i /><b /></div>
              <span>THE TRANSCOSMIC / BOOK ONE</span>
              <strong>REPLY</strong>
              <small>DEVON AKINS</small>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PageShell({ active, children }: { active: LaunchSection; children: React.ReactNode }) {
  return (
    <div className={`launch-page launch-page-${active}`}>
      <a className="launch-skip-link" href="#main-content">SKIP TO CONTENT</a>
      <LaunchHeader active={active} />
      <LaunchTerminal />
      <main id="main-content">{children}</main>
      <LaunchFooter />
    </div>
  );
}

export function BookPage() {
  const firstPurchase = editions[0]?.href || "";

  return (
    <PageShell active="book">
      <section className="launch-page-hero launch-page-book-hero" aria-labelledby="book-page-title">
        <AtmosphericField />
        <div className="launch-page-hero-copy">
          <p className="reply-launch-kicker">THE TRANSCOSMIC / BOOK ONE</p>
          <h1 id="book-page-title">REPLY</h1>
          <p className="launch-page-byline">A NOVEL BY DEVON AKINS</p>
          <p className="launch-page-deck">A worker follows a measurement she cannot explain into a civilization already living across worlds.</p>
          <div className="reply-launch-actions">
            {firstPurchase ? <Action href={firstPurchase}>BUY REPLY</Action> : <Action href="/the-story">ENTER THE STORY</Action>}
            {sampleUrl ? <Action href={sampleUrl} quiet><BookOpen size={15} strokeWidth={1.5} /> READ AN EXCERPT</Action> : null}
          </div>
        </div>
        <BookObject large />
      </section>

      <section className="launch-page-grid-section launch-page-book-details">
        <div className="launch-page-section-copy">
          <p className="reply-launch-kicker">THE BOOK</p>
          <h2>Science fiction at the scale of a life.</h2>
          <p>REPLY is the first Transcosmic novel: a human-scale story about contact, work, family, intelligence, possibility, and belonging.</p>
        </div>
        <dl className="launch-page-metadata" aria-label="REPLY publication details">
          <div><dt>AUTHOR</dt><dd>Devon Akins</dd></div>
          <div><dt>SERIES</dt><dd>The Transcosmic</dd></div>
          <div><dt>SEQUENCE</dt><dd>Book One</dd></div>
          <div><dt>AVAILABILITY</dt><dd>{editions.length ? "Available editions listed below" : "Not yet announced"}</dd></div>
        </dl>
      </section>

      <section className="launch-page-signal-section">
        <div className="launch-page-signal-copy">
          <span>01 / THE MEASUREMENT</span>
          <h2>Something ordinary refuses to become ordinary.</h2>
          <p>The beginning of REPLY is deliberately small: work, observation, and a result that should make sense but does not.</p>
        </div>
        <AtmosphericField compact />
      </section>

      {editions.length ? (
        <section className="launch-page-editions" aria-labelledby="book-editions-title">
          <div>
            <p className="reply-launch-kicker">READ REPLY</p>
            <h2 id="book-editions-title">Choose your edition.</h2>
          </div>
          <div className="launch-page-edition-list">
            {editions.map((edition) => (
              <a href={edition.href} target="_blank" rel="noreferrer" key={`${edition.label}-${edition.href}`}>
                <span>{edition.note}</span><strong>{edition.label}</strong><ArrowRight size={17} strokeWidth={1.35} />
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section className="launch-page-availability" aria-labelledby="book-availability-title">
          <p className="reply-launch-kicker">PUBLICATION STATUS</p>
          <h2 id="book-availability-title">REPLY is approaching publication.</h2>
          <p>Edition, retailer, pricing, and release details will appear here when they are formally announced.</p>
          <Action href="/rhenlink" quiet>OPEN RHENLINK</Action>
        </section>
      )}
    </PageShell>
  );
}

export function StoryPage() {
  return (
    <PageShell active="story">
      <section className="launch-page-hero launch-page-story-hero" aria-labelledby="story-page-title">
        <AtmosphericField />
        <div className="launch-page-hero-copy">
          <p className="reply-launch-kicker">THE STORY / SPOILER-LIGHT ENTRY</p>
          <h1 id="story-page-title">THE FIRST DOOR.</h1>
          <p className="launch-page-deck">On Ovara, a worker refuses to dismiss a measurement she cannot explain. The answer changes the scale of what a life can contain.</p>
          <div className="reply-launch-actions"><Action href="/the-book">OPEN THE BOOK</Action></div>
        </div>
        <div className="launch-page-story-mark" aria-hidden="true"><Orbit size={70} strokeWidth={0.8} /><span>REPLY</span></div>
      </section>

      <section className="launch-page-story-sequence" aria-label="REPLY story progression">
        <article>
          <span>01</span>
          <div><small>THE MEASUREMENT</small><h2>A problem that should be ordinary refuses to become one.</h2><p>The story begins with attention: noticing what would be easier to dismiss.</p></div>
        </article>
        <article>
          <span>02</span>
          <div><small>THE ANSWER</small><h2>The distance is not empty.</h2><p>What follows is not merely a discovery of place, but contact with people already living beyond a single world.</p></div>
        </article>
        <article>
          <span>03</span>
          <div><small>THE CHOICE</small><h2>Possibility does not choose a life for you.</h2><p>Work can change. Intelligence can become part of daily life. Families can imagine longer futures. The intimate question of how to live remains.</p></div>
        </article>
      </section>

      <section className="launch-page-grid-section launch-page-story-context">
        <div className="launch-page-section-copy">
          <p className="reply-launch-kicker">THE TRANSCOSMIC</p>
          <h2>A larger universe, entered through ordinary lives.</h2>
          <p>REPLY is the first published doorway into ANEVUM. The public site will expand with the books instead of revealing the universe ahead of the stories.</p>
        </div>
        <div className="launch-page-context-card">
          <span>PUBLIC CANON STATE</span>
          <strong>BOOK ONE</strong>
          <p>This page stays intentionally spoiler-light. Deeper records will unlock as material is published.</p>
          <Action href="/rhenlink" quiet>OPEN RHENLINK</Action>
        </div>
      </section>
    </PageShell>
  );
}

export function StorePage() {
  return (
    <PageShell active="store">
      <section className="launch-page-hero launch-page-store-hero" aria-labelledby="store-page-title">
        <AtmosphericField />
        <div className="launch-page-hero-copy">
          <p className="reply-launch-kicker">ANEVUM / STORE</p>
          <h1 id="store-page-title">THE FIRST OBJECT.</h1>
          <p className="launch-page-deck">REPLY is the first ANEVUM publication. This store will remain intentionally quiet until real editions are available.</p>
          <div className="reply-launch-actions"><Action href="/the-book">VIEW REPLY</Action></div>
        </div>
        <div className="launch-page-store-mark" aria-hidden="true"><Store size={56} strokeWidth={0.8} /><span>PUBLICATION 001</span></div>
      </section>

      <section className="launch-page-store-feature">
        <BookObject />
        <div className="launch-page-store-copy">
          <p className="reply-launch-kicker">PUBLICATION 001</p>
          <h2>REPLY</h2>
          <p className="launch-page-byline">THE TRANSCOSMIC / BOOK ONE · DEVON AKINS</p>
          <p>A human-scale science-fiction novel about contact, work, family, intelligence, possibility, and belonging.</p>
          {editions.length ? (
            <div className="launch-page-store-links">
              {editions.map((edition) => <Action href={edition.href} key={`${edition.label}-${edition.href}`}>{edition.label.toUpperCase()}</Action>)}
            </div>
          ) : (
            <div className="launch-page-store-status">
              <span>STATUS / PRE-RELEASE</span>
              <strong>Availability has not yet been announced.</strong>
              <p>Edition, price, and purchase links will appear here only when they are live.</p>
            </div>
          )}
        </div>
      </section>

      <section className="launch-page-availability launch-page-store-note">
        <p className="reply-launch-kicker">STORE PRINCIPLE</p>
        <h2>No placeholders pretending to be products.</h2>
        <p>The ANEVUM store grows with released work. Until REPLY can actually be ordered, this page presents the book and its publication state without fake pricing or checkout.</p>
        <Action href="/rhenlink" quiet>OPEN RHENLINK</Action>
      </section>
    </PageShell>
  );
}
