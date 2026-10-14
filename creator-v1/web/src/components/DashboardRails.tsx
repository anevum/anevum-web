import { Link, NavLink } from "react-router-dom";
import { Icon } from "./Icons";

export type DashboardPublicCounts = {
  publishedProjects: number;
  publishedCreators: number;
};

const exploreRoutes = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/discover", label: "Discover", icon: "explore" },
  { to: "/creators", label: "People", icon: "people" },
  { to: "/community", label: "Community", icon: "community" },
  { to: "/levels", label: "Levels", icon: "star" }
] as const;

const subjectRoutes = [
  { to: "/discover?category=games", label: "Games" },
  { to: "/discover?category=tools", label: "Apps & Tools" },
  { to: "/discover?category=creative", label: "Art & AI" },
  { to: "/discover?category=libraries", label: "Open Source" },
  { to: "/discover?category=learning", label: "Learning" }
] as const;

/** This is a homepage presentation rail, not a replacement auth or app shell. */
export function DashboardLeftRail() {
  return <aside className="av3-navrail" aria-label="Explore ANEVUM">
    <div className="av3-navrail__top">
      <span className="av3-eyebrow">YOUR UNIVERSE</span>
      <strong>Find your place.</strong>
      <p>Explore things people make, discover creators, and join the conversation.</p>
    </div>
    <nav className="av3-navrail__links" aria-label="Dashboard destinations">
      {exploreRoutes.map(item => <NavLink key={item.to} to={item.to} end={item.to === "/"}
        className={({isActive}) => "av3-navlink" + (isActive ? " av3-navlink--active" : "")}>
        <Icon name={item.icon} size={18}/><span>{item.label}</span>
        <Icon name="arrow" size={13}/>
      </NavLink>)}
    </nav>
    <div className="av3-navrail__separation"/>
    <span className="av3-eyebrow av3-navrail__group-label">EXPLORE BY TYPE</span>
    <nav className="av3-navrail__subjects" aria-label="Discover by category">
      {subjectRoutes.map(item => <Link key={item.to} to={item.to}>{item.label}<Icon name="arrow" size={13}/></Link>)}
    </nav>
    <div className="av3-navrail__foot">
      <span className="av3-eyebrow">YOUR SPACE</span>
      <Link to="/account"><Icon name="people" size={18}/><span>Member workspace</span><Icon name="arrow" size={14}/></Link>
      <small>Invited member testing. Everyone can explore.</small>
    </div>
  </aside>;
}

/**
 * Read-only public information, directly from the existing /api/v1/status
 * response. Never make up participation counts or treat guest as logged in.
 */
export function DashboardRightRail({counts, loading=false, error=false}: {
  counts?:DashboardPublicCounts; loading?:boolean; error?:boolean;
}) {
  const projects = loading ? "Loading" : error || !counts ? "Unavailable" : counts.publishedProjects.toLocaleString();
  const creators = loading ? "Loading" : error || !counts ? "Unavailable" : counts.publishedCreators.toLocaleString();
  return <aside className="av3-infobar" aria-label="Website information">
    <section className="av3-sidecard av3-sidecard--welcome">
      <span className="av3-eyebrow">WELCOME TO ANEVUM</span>
      <h2>A place for what you make.</h2>
      <p>Discover independent work, share ideas, learn, and build connections.</p>
      <Link className="av3-sidecard__cta" to="/start">Start here <Icon name="arrow" size={16}/></Link>
    </section>
    <section className="av3-sidecard av3-sidecard--stats" aria-label="Genuine public catalogue">
      <div className="av3-sidecard__heading"><span className="av3-eyebrow">LIVE CATALOGUE</span><Icon name="status" size={18}/></div>
      <dl>
        <div><dt>Published creations</dt><dd>{projects}</dd></div>
        <div><dt>Public creators</dt><dd>{creators}</dd></div>
      </dl>
      <p>Only approved work is counted. No artificial activity or sample creators.</p>
      <Link to="/status" className="av3-sidecard__minor">Platform status <Icon name="arrow" size={15}/></Link>
    </section>
    <section className="av3-sidecard av3-sidecard--studio">
      <span className="av3-eyebrow">CREATOR STUDIO</span>
      <h2>Your next creation starts here.</h2>
      <p>Projects and drafts are available only to authorized test accounts until launch checks finish.</p>
      <Link to="/create" className="av3-sidecard__cta">Open studio <Icon name="arrow" size={16}/></Link>
    </section>
    <section className="av3-sidecard av3-sidecard--guide">
      <div className="av3-sidecard__guide-icon"><Icon name="explore" size={22}/></div>
      <strong>Explore freely.</strong>
      <p>Meaningful access does not require a purchase or an account.</p>
      <Link className="av3-sidecard__minor" to="/guide">Read the field guide <Icon name="arrow" size={15}/></Link>
    </section>
  </aside>;
}
