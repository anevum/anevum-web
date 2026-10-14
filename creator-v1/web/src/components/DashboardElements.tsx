import { Link, NavLink } from "react-router-dom";
import { Icon } from "./Icons";
import { OrbitalMark } from "./OrbitalMark";
import { CosmicArtwork } from "./CosmicArtwork";

const mainLinks = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/discover", label: "Explore", icon: "explore" },
  { to: "/community", label: "Community", icon: "community" },
  { to: "/creators", label: "Creators", icon: "people" },
  { to: "/levels", label: "Levels", icon: "star" },
] as const;
const browseLinks = [
  { to: "/discover?category=games", label: "Games" },
  { to: "/discover?category=tools", label: "Apps & Tools" },
  { to: "/discover?category=creative", label: "Art & Media" },
  { to: "/discover?category=libraries", label: "Open Source" },
  { to: "/discover?category=learning", label: "Learning" },
] as const;
const personalLinks = [
  { to: "/create", label: "Creator Studio", icon: "create" },
  { to: "/library", label: "Saved Library", icon: "library" },
  { to: "/account", label: "My Profile", icon: "people" },
] as const;

/** Public navigation only. Member-only destinations retain their existing server-side gates. */
export function DashboardRail() {
  return <aside className="avd-rail" aria-label="Explore ANEVUM">
    <div className="avd-rail-head">
      <OrbitalMark className="avd-rail-head-mark"/>
      <span>YOUR UNIVERSE</span>
    </div>
    <nav className="avd-rail-nav" aria-label="Dashboard primary navigation">
      {mainLinks.map(link=><NavLink key={link.to} end={"end" in link ? link.end : false} to={link.to}
        className={({isActive})=>"avd-rail-link"+(isActive?" is-active":"")}>
        <Icon name={link.icon} size={20}/><span>{link.label}</span>
      </NavLink>)}
    </nav>
    <div className="avd-rail-rule"/>
    <span className="avd-rail-label">DISCOVER</span>
    <nav className="avd-rail-categories" aria-label="Discover creation categories">
      {browseLinks.map(link=><Link to={link.to} key={link.to}><span className="avd-category-spark" aria-hidden="true"/> {link.label}</Link>)}
    </nav>
    <div className="avd-rail-rule"/>
    <span className="avd-rail-label">YOUR SPACE</span>
    <nav className="avd-rail-nav" aria-label="Personal workspace">
      {personalLinks.map(link=><NavLink key={link.to} to={link.to} className={({isActive})=>"avd-rail-link"+(isActive?" is-active":"")}>
        <Icon name={link.icon} size={19}/><span>{link.label}</span>
      </NavLink>)}
    </nav>
    <div className="avd-rail-bottom">
      <Link to="/start" className="avd-rail-art" aria-label="Find your place in ANEVUM">
        <CosmicArtwork scene="portal"/>
        <span>EXPLORE BEYOND<br/>THE EXPECTED.</span>
      </Link>
      <p>Explore freely. Member participation remains in invited testing.</p>
      <Link to="/status" className="avd-rail-status">VIEW BUILD STATUS <Icon name="arrow" size={13}/></Link>
    </div>
  </aside>;
}

/** Reusable call-to-action row for the public home; no synthetic engagement or account state. */
export function DashboardQuickDock() {
  const actions = [
    {label:"Create",detail:"Make something new",icon:"create",to:"/create",tone:"violet"},
    {label:"Explore",detail:"Discover real work",icon:"explore",to:"/discover",tone:"cyan"},
    {label:"Connect",detail:"Find your community",icon:"community",to:"/community",tone:"coral"},
    {label:"People",detail:"Meet independent makers",icon:"people",to:"/creators",tone:"gold"}
  ] as const;
  return <nav className="avd-quick-dock" aria-label="Quick actions">
    {actions.map(action=><Link className={"avd-action avd-action--"+action.tone} to={action.to} key={action.label}>
      <span className="avd-action-icon"><Icon name={action.icon} size={23}/></span>
      <span className="avd-action-copy"><strong>{action.label}</strong><small>{action.detail}</small></span>
      <Icon name="arrow" size={16}/>
    </Link>)}
  </nav>;
}

type DashboardSurfaceProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: {label:string;to:string};
};
/** Base surface for future authenticated and public dashboard widgets. */
export function DashboardSurface({eyebrow,title,children,className="",action}:DashboardSurfaceProps) {
  return <section className={"avd-surface "+className}>
    <header className="avd-surface-head"><div>{eyebrow&&<span className="avd-surface-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
      {action&&<Link to={action.to} className="avd-surface-action">{action.label}<Icon name="arrow" size={15}/></Link>}
    </header>
    <div className="avd-surface-body">{children}</div>
  </section>;
}

export function DashboardEmpty({title,description,action}:{
  title:string;description:string;action?:{label:string;to:string};
}) {
  return <div className="avd-empty"><span className="avd-empty-icon"><Icon name="explore" size={25}/></span>
    <strong>{title}</strong><p>{description}</p>
    {action&&<Link to={action.to}>{action.label}<Icon name="arrow" size={14}/></Link>}
  </div>;
}
