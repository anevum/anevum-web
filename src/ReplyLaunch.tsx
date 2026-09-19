import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { capturePurchaseOutbound } from "./analytics";
import { replyLaunchConfig } from "./launchConfig";

const {
  primaryPurchaseUrl,
  primaryPurchaseLabel,
  editions,
  sampleUrl,
  coverUrl,
  heroImageUrl,
} = replyLaunchConfig;

const REPLY_RELEASE_AT = "2026-11-17T00:00:00-05:00";

function destinationHost(href: string) {
  try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return "external"; }
}

function ExternalAction({ href, children, quiet = false, onClick }: { href: string; children: React.ReactNode; quiet?: boolean; onClick?: () => void }) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      className={`reply-launch-action${quiet ? " quiet" : ""}`}
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <span>{children}</span>
      {external ? <ExternalLink size={14} strokeWidth={1.5} /> : <ArrowRight size={15} strokeWidth={1.5} />}
    </a>
  );
}

function PurchaseAction({ href, edition, source, children }: { href: string; edition: string; source: string; children: React.ReactNode }) {
  return <ExternalAction href={href} onClick={() => capturePurchaseOutbound({ edition, destination: destinationHost(href), source })}>{children}</ExternalAction>;
}

function ReleaseCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, new Date(REPLY_RELEASE_AT).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const released = remaining === 0;

  return (
    <section className="reply-release-lockup" aria-label="REPLY publication countdown">
      <div>
        <p className="reply-launch-kicker">PUBLICATION 001</p>
        <h2>{released ? "REPLY is now available." : "November 17, 2026"}</h2>
        <p>{released ? "The first Transcosmic novel has entered the world." : "The first Transcosmic novel arrives this fall."}</p>
      </div>
      {released ? (
        <div className="reply-release-live">AVAILABLE NOW</div>
      ) : (
        <div className="reply-countdown">
          <div><strong>{String(days).padStart(2, "0")}</strong><span>DAYS</span></div>
          <div><strong>{String(hours).padStart(2, "0")}</strong><span>HOURS</span></div>
          <div><strong>{String(minutes).padStart(2, "0")}</strong><span>MINUTES</span></div>
          <div><strong>{String(seconds).padStart(2, "0")}</strong><span>SECONDS</span></div>
        </div>
      )}
    </section>
  );
}

function BookObject() {
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = event.currentTarget;
    const rect = stage.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    stage.style.setProperty("--reply-light-x", `${(px + 0.5) * 100}%`);
    stage.style.setProperty("--reply-light-y", `${(py + 0.5) * 100}%`);
    const book = stage.querySelector<HTMLElement>(".reply-book-object");
    if (book) book.style.transform = `rotateX(${py * -5}deg) rotateY(${-10 + px * 8}deg) rotateZ(-2deg)`;
  }

  function reset(event: ReactPointerEvent<HTMLDivElement>) {
    const stage = event.currentTarget;
    stage.style.setProperty("--reply-light-x", "72%");
    stage.style.setProperty("--reply-light-y", "18%");
    const book = stage.querySelector<HTMLElement>(".reply-book-object");
    if (book) book.style.transform = "";
  }

  return (
    <div className="reply-book-stage" aria-label="REPLY book presentation" onPointerMove={move} onPointerLeave={reset}>
      <div className="reply-book-shadow" aria-hidden="true" />
      <div className="reply-book-object" style={{ transition: "transform 380ms cubic-bezier(.16,1,.3,1)" }}>
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
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              opacity: 0.58,
              background: "radial-gradient(44% 32% at var(--reply-light-x,72%) var(--reply-light-y,18%),rgba(225,242,248,.22),transparent 72%)",
              mixBlendMode: "screen",
            }}
          />
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
    <div className="reply-launch-site reply-launch-mode">
      <a className="launch-skip-link" href="#main-content">SKIP TO CONTENT</a>
      <header className="reply-launch-header">
        <a className="reply-launch-brand" href="#top" aria-label="ANEVUM home">
          <strong>ANEVUM</strong>
          <small>A UNIVERSE IN STORY.</small>
        </a>
        <nav aria-label="REPLY launch navigation">
          <a href="/the-book">REPLY</a>
          <a href="/the-story">STORY</a>
          <a href="/wiki">WIKI</a>
          <a href="/store">STORE</a>
        </nav>
        {primaryPurchaseUrl ? (
          <PurchaseAction href={primaryPurchaseUrl} edition={primaryPurchaseLabel} source="home-header">BUY REPLY</PurchaseAction>
        ) : (
          <span className="reply-launch-header-date">NOV 17 · 2026</span>
        )}
      </header>

      <main id="main-content">
        <section className="reply-launch-hero" id="top" aria-labelledby="reply-title">
          <AtmosphericArt />
          <div className="reply-launch-hero-copy">
            <p className="reply-launch-kicker">THE TRANSCOSMIC / BOOK ONE</p>
            <h1 id="reply-title">REPLY</h1>
            <p className="reply-launch-authorline">A NOVEL BY DEVON AKINS</p>
            <p className="reply-launch-deck">On Ovara, a worker refuses to dismiss a measurement she cannot explain. The answer leads to a civilization already living across worlds.</p>
            <div className="reply-launch-actions">
              {primaryPurchaseUrl ? (
                <PurchaseAction href={primaryPurchaseUrl} edition={primaryPurchaseLabel} source="home-hero">BUY REPLY</PurchaseAction>
              ) : (
                <ExternalAction href="/the-book">ENTER REPLY</ExternalAction>
              )}
              <ExternalAction href="/the-story" quiet>THE STORY</ExternalAction>
              {sampleUrl ? <ExternalAction href={sampleUrl} quiet><BookOpen size={15} strokeWidth={1.5} /> READ AN EXCERPT</ExternalAction> : null}
            </div>
          </div>
          <BookObject />
          <a className="reply-launch-scroll" href="#release" aria-label="Continue to REPLY release"><span>CONTINUE</span><ArrowDown size={15} /></a>
        </section>

        <div id="release"><ReleaseCountdown /></div>

        <section className="reply-reciprocal" aria-labelledby="reciprocal-title">
          <div className="reply-reciprocal-field" aria-hidden="true">
            <div className="reply-signal reply-signal-left"><i /><span>ONE WORLD</span></div>
            <div className="reply-reciprocal-line"><b /><b /><b /></div>
            <div className="reply-signal reply-signal-right"><i /><span>ANOTHER ANSWERS</span></div>
          </div>
          <div className="reply-reciprocal-copy">
            <p className="reply-launch-kicker">THE REPLY</p>
            <h2 id="reciprocal-title">First contact is not the end of ordinary life.</h2>
            <p>It changes the scale of what ordinary can mean. Work, family, medicine, distance, intelligence, purpose and death remain personal even when civilization becomes larger than one world.</p>
            <div className="reply-launch-actions">
              <ExternalAction href="/the-story">ENTER THE STORY</ExternalAction>
              <ExternalAction href="/wiki" quiet>OPEN THE PUBLIC WIKI</ExternalAction>
            </div>
          </div>
        </section>

        <section className="reply-launch-object" id="book">
          <div className="reply-launch-object-copy">
            <p className="reply-launch-kicker">THE OBJECT</p>
            <h2>The book is the first doorway.</h2>
            <p>REPLY is the first Transcosmic novel and the first commercial publication from ANEVUM: a human-scale science-fiction story about contact, work, family, intelligence, possibility and belonging.</p>
            {primaryPurchaseUrl ? (
              <PurchaseAction href={primaryPurchaseUrl} edition={primaryPurchaseLabel} source="home-object">BUY REPLY</PurchaseAction>
            ) : (
              <div className="reply-launch-actions">
                <ExternalAction href="/the-book">BOOK DETAILS</ExternalAction>
                <ExternalAction href="/store" quiet>OPEN STORE</ExternalAction>
              </div>
            )}
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
                <a href={edition.href} target="_blank" rel="noreferrer" key={`${edition.label}-${edition.href}`} onClick={() => capturePurchaseOutbound({ edition: edition.label, destination: destinationHost(edition.href), source: "home-editions" })}>
                  <span>{edition.note}</span>
                  <strong>{edition.label}</strong>
                  <ArrowRight size={17} strokeWidth={1.35} />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="reply-launch-depth">
          <div>
            <p className="reply-launch-kicker">BEYOND THE BOOK</p>
            <h2>REPLY begins the Transcosmic. ANEVUM keeps the universe open.</h2>
          </div>
          <div className="reply-launch-depth-links">
            <a href="/wiki"><span>PUBLIC WIKI</span><strong>Follow the released record.</strong><ArrowRight size={17} /></a>
            <a href="/the-story"><span>STORY</span><strong>Enter without the lore dump.</strong><ArrowRight size={17} /></a>
            <a href="/store"><span>STORE</span><strong>The book first. Objects when they are ready.</strong><ArrowRight size={17} /></a>
          </div>
        </section>

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
        <span><a href="/about">ABOUT</a> · <a href="/wiki">WIKI</a> · <a href="/store">STORE</a> · <a href="/privacy">PRIVACY</a> · <a href="/terms">TERMS</a></span>
      </footer>
    </div>
  );
}
