import { Link } from "react-router-dom";
import { PortalHeading } from "../components/PortalHeading";

export function WorkspacePage() {
  return <section className="workspace-page">
    <PortalHeading eyebrow="ANEVUM / YOUR WORKSPACE" title="A PLACE TO" accent="MAKE." description="Public creations and private work have their own doors. Start here to find yours." index="WORKSPACE"/>
    <div className="workspace-grid">
      <article><span className="kicker">CREATOR WORKSPACE / INVITED TESTING</span><h2>Your projects.</h2><p>Profiles, saved work and project submissions are being tested with invited members. Public account registration is still closed.</p><Link className="button primary" to="/account">MEMBER ACCESS</Link></article>
      <article><span className="kicker">PRIVATE LAB / OWNER ACCESS</span><h2>Behind the scenes.</h2><p>The private project workspace requires the owner's verified sign-in. Drafts and private systems stay behind that access check.</p><a className="button secondary" href="https://lab.anevum.com/" referrerPolicy="no-referrer">OPEN PRIVATE LAB <span aria-hidden="true">↗</span></a></article>
      <article><span className="kicker">DEVON AKINS / DESIGN & SOFTWARE</span><h2>Imagination, engineered.</h2><p>Explore Devon's portfolio, interfaces and independent software work, or get in touch about a collaboration.</p><a className="button secondary" href="/portfolio/">VIEW PORTFOLIO</a></article>
    </div>
  </section>;
}
