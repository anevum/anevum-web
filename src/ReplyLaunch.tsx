import { ArrowDown, ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { LaunchTerminal } from "./LaunchTerminal";

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

const firstPurchase = editions[0]?.href || "";

function ExternalAction({ href, children, quiet = false }: { href: string; children: React.ReactNode; quiet?: boolean }) {
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

function BookObject() {
  return (
    <div className="reply-book-stage" aria-label="REPLY book presentation">
      <div className="reply-book-shadow" aria-hidden="true" />
      <div className="reply-book-object">
        <div className="reply-book-spine" aria-hidden="true"><span>REPLY</span><small>DEVON AKINS</small></div>
        <div className="reply-book-cover">
          {coverUrl ? <img src={coverUrl} alt="REPLY by Devon Akins" /> : (
            <>
              <div className="reply-cover-field" aria-hidden="true"><i /><i /><i /><i /><b /></div>
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

function AtmosphericArt() {
  if (heroImageUrl) {
    return <div className="reply-atmosphere supplied"><img src={heroImageUrl} alt="" /></div>;
  }

  return (
    <div className="reply-atmosphere" aria-hidden="true">
      <div className="reply-atmosphere-glow" />
      <div className="reply-atmosphere-world world-one" />
      <div className="reply-atmosphere-world world-two" />
      <div className="reply-atmosphere-horizon" />
      <div className="reply-atmosphere-measure"><i /><i /><i /><i /><i /></div>
    </div>
  );
}

export default function ReplyLaunch() {
  return (
    <div className="reply-launch-site">
      <a className="launch-skip-link" href="#main-content">SKIP TO CONTENT</a>
      <header className="reply-launch-header">
        <a className="reply-launch-brand" href="#top" aria-label="ANEVUM home">
          <strong>ANEVUM</strong>
          <small>A UNIVERSE IN STORY.</small>
        </a>
        <nav aria-label="REPLY launch navigation">
          <a href="/the-book">THE BOOK</a>
          <a href="/the-story">THE STORY</a>
          <a href="/store">STORE</a>
          <a href="#author">AUTHOR</a>
          <a href="/rhenlink">RHENLINK</a>
        </nav>
        {firstPurchase ? <ExternalAction href={firstPurchase}>BUY REPLY</ExternalAction> : <a className="reply-launch-header-link" href="/the-book">REPLY</a>}
      </header>

      <LaunchTerminal />

      <main id="main-content">
        <section className="reply-launch-hero" id="top" aria-labelledby="reply-title">
          <AtmosphericArt />
          <div className="reply-launch-hero-copy">
            <p className="reply-launch-kicker">THE TRANSCOSMIC / BOOK ONE</p>
            <h1 id="reply-title">REPLY</h1>
            <p className="reply-launch-authorline">A NOVEL BY DEVON AKINS</p>
            <p className="reply-launch-deck">On Ovara, a worker refuses to dismiss a measurement she cannot explain. The answer leads to a civilization already living across worlds.</p>
            <div className="reply-launch-actions">
              {firstPurchase ? <ExternalAction href={firstPurchase}>BUY REPLY</ExternalAction> : <ExternalAction href="/the-book">DISCOVER REPLY</ExternalAction>}
              <ExternalAction href="/the-story" quiet>ENTER THE STORY</ExternalAction>
              {sampleUrl ? <ExternalAction href={sampleUrl} quiet><BookOpen size={15} strokeWidth={1.5} /> READ AN EXCERPT</ExternalAction> : null}
            </div>
          </div>
          <BookObject />
          <a className="reply-launch-scroll" href="#book" aria-label="Continue to book details"><span>CONTINUE</span><ArrowDown size={15} /></a>
        </section>

        <section className="reply-launch-statement" id="book">
          <p>ONE MEASUREMENT.</p>
          <h2>A larger universe begins with something small enough to ignore.</h2>
          <p>Contact opens possibilities that reach far beyond travel while leaving each person with a life, a family, and choices of their own.</p>
          <div className="reply-launch-actions"><ExternalAction href="/the-book">OPEN THE BOOK</ExternalAction></div>
        </section>

        <section className="reply-launch-story" id="world">
          <div className="reply-launch-story-art"><AtmosphericArt /><span>THE ANSWER CHANGES THE SCALE OF A LIFE.</span></div>
          <div className="reply-launch-story-copy">
            <p className="reply-launch-kicker">REPLY</p>
            <h2>The first door into ANEVUM.</h2>
            <p>Work can change. Families can imagine longer futures. An intelligence can become part of daily life. Yet a larger universe still leaves each person with a life to choose.</p>
            <div className="reply-launch-beats" aria-label="Story themes">
              <article><span>01</span><strong>THE MEASUREMENT</strong><p>A problem that should be ordinary refuses to become one.</p></article>
              <article><span>02</span><strong>THE ANSWER</strong><p>What follows is not empty distance, but people already living beyond a single world.</p></article>
              <article><span>03</span><strong>THE CHOICE</strong><p>Expanded possibility does not remove the intimate question of how to live.</p></article>
            </div>
            <div className="reply-launch-actions"><ExternalAction href="/the-story" quiet>OPEN THE STORY PAGE</ExternalAction></div>
          </div>
        </section>

        <section className="reply-launch-object">
          <div className="reply-launch-object-copy">
            <p className="reply-launch-kicker">THE BOOK</p>
            <h2>Built to be read. Made to be kept.</h2>
            <p>REPLY is the first Transcosmic novel: a human-scale science-fiction story about contact, work, family, intelligence, possibility and belonging.</p>
            {firstPurchase ? <ExternalAction href={firstPurchase}>CHOOSE AN EDITION</ExternalAction> : <p className="reply-launch-availability">AVAILABILITY DETAILS WILL APPEAR HERE WHEN ANNOUNCED.</p>}
            <div className="reply-launch-actions"><ExternalAction href="/store" quiet>OPEN THE STORE</ExternalAction></div>
          </div>
          <BookObject />
        </section>

        {editions.length ? (
          <section className="reply-launch-buy" id="buy" aria-labelledby="buy-reply-title">
            <div>
              <p className="reply-launch-kicker">READ REPLY</p>
              <h2 id="buy-reply-title">Choose your edition.</h2>
            </div>
            <div className="reply-launch-editions">
              {editions.map((edition) => (
                <a href={edition.href} target="_blank" rel="noreferrer" key={`${edition.label}-${edition.href}`}>
                  <span>{edition.note}</span>
                  <strong>{edition.label}</strong>
                  <ArrowRight size={17} strokeWidth={1.35} />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="reply-launch-author" id="author">
          <div className="reply-launch-author-mark" aria-hidden="true"><span>DA</span></div>
          <div>
            <p className="reply-launch-kicker">THE AUTHOR</p>
            <h2>Devon Akins</h2>
            <p>Devon Akins is the writer and founder of ANEVUM, an independent home for stories about life across an expanding universe. His work follows extraordinary changes in civilization through familiar questions of love, family, purpose and belonging.</p>
          </div>
        </section>
      </main>

      <footer className="reply-launch-footer">
        <a href="#top"><strong>ANEVUM</strong><small>A UNIVERSE IN STORY.</small></a>
        <p>REPLY / THE TRANSCOSMIC / BOOK ONE</p>
        <span><a href="/store">STORE</a> · <a href="/rhenlink">RHENLINK</a> · DEVON AKINS</span>
      </footer>
    </div>
  );
}
