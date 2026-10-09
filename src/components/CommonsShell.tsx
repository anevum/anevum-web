import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Mark from "./Mark";
import { currentRhenRelease } from "../data/releases";
import { fieldNotes } from "../data/fieldNotes";

export default function CommonsShell({ children, identity, role }: {
  children: ReactNode;
  identity?: string | null;
  role?: string | null;
}) {
  const { pathname } = useLocation();
  const release = currentRhenRelease();
  const latestNote = [...fieldNotes].sort((a,b) => b.date.localeCompare(a.date))[0];
  return (
    <div className="commons-app">
      <a className="commons-skip" href="#commons-main">Skip to content</a>
      <header className="commons-topbar">
        <Link className="commons-brand" to="/commons" aria-label="ANEVUM Commons home">
          <Mark />
          <span>ANEVUM <strong>Commons</strong></span>
        </Link>
        <nav aria-label="App navigation" className="commons-topnav">
          <Link to="/commons">Commons</Link>
          <Link to="/apps/rhen">RHEN</Link>
          <Link to="/command">Command</Link>
        </nav>
        <Link className="commons-account-link" to={identity ? "/me/settings" : "/sign-in"}>
          {identity ? "My account" : "Sign in"}
        </Link>
      </header>
      <div className="commons-frame">
        <aside className="commons-sidebar" aria-label="Commons navigation">
          <div className="commons-sidebar-section">
            <span className="commons-eyebrow">Commons</span>
            <nav>
              <Link className={pathname === "/commons" ? "active" : ""} to="/commons">Research feed</Link>
              <Link to="/commons?kind=question">Questions</Link>
              <Link to="/commons?kind=research_note">Research notes</Link>
              <Link to="/learn">Learning / rule sets</Link>
              <Link to="/me/research">Private research notebook</Link>
              <Link to="/field-notes">Published guides</Link>
            </nav>
          </div>
          <div className="commons-sidebar-section">
            <span className="commons-eyebrow">My workspace</span>
            <nav>
              <Link to="/command">Command home</Link>
              <Link to="/apps/rhen/my-terminal">My RHEN terminal</Link>
              <Link to="/apps/rhen">RHEN research</Link>
              <Link to="/me/settings">Account settings</Link>
            </nav>
          </div>
          <div className="commons-sidebar-person">
            <span className="commons-eyebrow">Your session</span>
            <strong>{identity || "Guest"}</strong>
            <span>{role === "moderator" ? "Commons moderator" : role === "contributor" ? "Commons contributor" : identity ? "Member account" : "Sign in to participate"}</span>
          </div>
        </aside>
        <main className="commons-main" id="commons-main">{children}</main>
        <aside className="commons-aside" aria-label="Related research">
          <div className="commons-aside-block">
            <span className="commons-eyebrow">Research standard</span>
            <h2>Evidence before claims.</h2>
            <p>Questions and observations should be distinct from independently reproduced findings. Published posts are not verified strategies.</p>
          </div>
          <div className="commons-aside-block">
            <span className="commons-eyebrow">RHEN</span>
            <h2>Release {release.version}</h2>
            <p>Research and live execution have separate authorization. Results remain under evaluation.</p>
            <Link to="/products/rhen/evidence">View public evidence →</Link>
          </div>
          {latestNote && <div className="commons-aside-block">
            <span className="commons-eyebrow">Latest Field Note</span>
            <h2>{latestNote.title}</h2>
            <Link to={"/field-notes/" + latestNote.slug}>Read published note →</Link>
          </div>}
        </aside>
      </div>
      <footer className="commons-bottom">ANEVUM Commons · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/about">About</Link></footer>
    </div>
  );
}
