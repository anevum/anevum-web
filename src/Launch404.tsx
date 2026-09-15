import { ArrowLeft, ArrowRight } from "lucide-react";
import { LaunchTerminal } from "./LaunchTerminal";

export function Launch404() {
  return (
    <div className="launch-404-page">
      <a className="launch-skip-link" href="#main-content">SKIP TO CONTENT</a>
      <header className="reply-launch-header launch-404-header">
        <a className="reply-launch-brand" href="/" aria-label="ANEVUM home">
          <strong>ANEVUM</strong>
          <small>A UNIVERSE IN STORY.</small>
        </a>
        <nav aria-label="ANEVUM launch navigation">
          <a href="/the-book">THE BOOK</a>
          <a href="/the-story">THE STORY</a>
          <a href="/store">STORE</a>
          <a href="/rhenlink">RHENLINK</a>
        </nav>
        <a className="reply-launch-header-link" href="/">REPLY</a>
      </header>

      <LaunchTerminal />

      <main className="launch-404-main" id="main-content">
        <div className="launch-404-field" aria-hidden="true">
          <i /><i /><i /><i /><i />
          <span />
        </div>
        <div className="launch-404-copy">
          <p className="reply-launch-kicker">ANEVUM / SIGNAL LOST</p>
          <span className="launch-404-code">404</span>
          <h1>This route does not resolve.</h1>
          <p>The page may have moved, or it may belong to a part of ANEVUM that is not public yet.</p>
          <div className="reply-launch-actions">
            <a className="reply-launch-action" href="/"><ArrowLeft size={15} strokeWidth={1.5} /><span>RETURN TO REPLY</span></a>
            <a className="reply-launch-action quiet" href="/the-book"><span>OPEN THE BOOK</span><ArrowRight size={15} strokeWidth={1.5} /></a>
          </div>
        </div>
      </main>

      <footer className="reply-launch-footer launch-page-footer">
        <a href="/"><strong>ANEVUM</strong><small>A UNIVERSE IN STORY.</small></a>
        <p>REPLY / THE TRANSCOSMIC / BOOK ONE</p>
        <span><a href="/rhenlink">RHENLINK</a> · DEVON AKINS</span>
      </footer>
    </div>
  );
}
