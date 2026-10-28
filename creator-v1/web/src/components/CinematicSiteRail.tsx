import { Link, useLocation } from "react-router-dom";
import { CosmicArtwork } from "./CosmicArtwork";
import { Icon } from "./Icons";

const publicLinks = [
  {label:"Home",to:"/",icon:"home"},
  {label:"Explore",to:"/discover",icon:"explore"},
  {label:"Create",to:"/studio",icon:"create"},
  {label:"Community",to:"/community",icon:"community"},
  {label:"Boards",to:"/boards",icon:"library"},
  {label:"Apps",to:"/discover?category=tools",icon:"explore"},
  {label:"Creators",to:"/creators",icon:"people"},
  {label:"Field Notes",to:"/guide",icon:"library"}
] as const;
const memberLinks = [
  {label:"Profile",to:"/member",icon:"people"},
  {label:"Library",to:"/library",icon:"library"},
  {label:"Rewards",to:"/levels",icon:"star"},
  {label:"Recognition",to:"/recognition",icon:"star"}
] as const;

/** A presentation-only navigation layer. Authentication, post review, and
 * data access remain in their existing Workers and MemberGate routes.
 * Field Notes currently leads to the actual Field Guide until native publishing exists.
 */
export function CinematicSiteRail(){
  const location=useLocation();
  const current=location.pathname+location.search;
  const selected=(to:string)=>to==="/" ? location.pathname==="/" :
    to==="/discover" ? current==="/discover" :
    current===to || (!to.includes("?") && location.pathname===to);
  return <aside className="cinema-rail av5-site-rail" aria-label="ANEVUM site navigation">
    <div className="av5-rail-label"><span className="av5-rail-orbit" aria-hidden="true">◉</span><strong>ANEVUM</strong><small>YOUR UNIVERSE</small></div>
    <nav aria-label="Explore ANEVUM">
      {publicLinks.map(item=><Link key={item.label} to={item.to}
        aria-current={selected(item.to)?"page":undefined}
        className={selected(item.to)?"cinema-rail-active":undefined}>
        <Icon name={item.icon} size={17}/><span>{item.label}</span>
      </Link>)}
    </nav>
    <div className="cinema-rail-rule"/>
    <div className="av5-rail-subtitle">YOUR SPACE</div>
    <nav aria-label="Member destinations">
      {memberLinks.map(item=><Link key={item.label} to={item.to}
        aria-current={selected(item.to)?"page":undefined}
        className={selected(item.to)?"cinema-rail-active":undefined}>
        <Icon name={item.icon} size={17}/><span>{item.label}</span>
      </Link>)}
    </nav>
    <div className="cinema-rail-world">
      <CosmicArtwork scene="research"/>
      <div><small>CREATE · EXPLORE</small><strong>A WORLD OF THINGS PEOPLE MAKE.</strong></div>
    </div>
  </aside>;
}
