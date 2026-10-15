import { Link, useLocation } from "react-router-dom";
import { CosmicArtwork } from "./CosmicArtwork";
import { Icon } from "./Icons";
import { PRIMARY_NAV, MEMBER_NAV, DISCOVERY_NAV, isSiteLinkSelected } from "../lib/site-navigation";

/** Lightweight contextual shortcuts. The one global pop-out drawer owns the full site map.
 * Routes, identities, public data and the approved cinematic artwork remain unchanged.
 */
export function CinematicSiteRail(){
  const location=useLocation();
  const selected=(to:string)=>isSiteLinkSelected(location.pathname,to);
  const secondary=DISCOVERY_NAV.filter(item=>item.key==="creators"||item.key==="levels");
  const yourSpace=MEMBER_NAV.filter(item=>item.key==="studio"||item.key==="library");
  return <aside className="cinema-rail av5-site-rail" aria-label="ANEVUM section shortcuts">
    <div className="av5-rail-label"><span className="av5-rail-orbit" aria-hidden="true">◉</span><strong>ANEVUM</strong><small>YOUR UNIVERSE</small></div>
    <nav aria-label="Main destinations">
      {PRIMARY_NAV.map(item=><Link key={item.key} to={item.to}
        aria-current={selected(item.to)?"page":undefined}
        className={selected(item.to)?"cinema-rail-active":undefined}>
        <Icon name={item.icon} size={17}/><span>{item.label}</span>
      </Link>)}
    </nav>
    <div className="cinema-rail-rule"/>
    <div className="av5-rail-subtitle">DISCOVER</div>
    <nav aria-label="Community discovery">
      {secondary.map(item=><Link key={item.key} to={item.to}
        aria-current={selected(item.to)?"page":undefined}
        className={selected(item.to)?"cinema-rail-active":undefined}>
        <Icon name={item.icon} size={17}/><span>{item.label}</span>
      </Link>)}
    </nav>
    <div className="cinema-rail-rule"/>
    <div className="av5-rail-subtitle">YOUR SPACE</div>
    <nav aria-label="Member destinations">
      {yourSpace.map(item=><Link key={item.key} to={item.to}
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
