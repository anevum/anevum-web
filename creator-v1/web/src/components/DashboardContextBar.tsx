import { Link } from "react-router-dom";
import { Icon } from "./Icons";

type DashboardSection = "discover" | "creators" | "creator" | "community" | "levels" | "member";

/**
 * Distinguishes presentation routes only; authentication remains owned by
 * MemberGate and its existing Member Worker.
 */
export function dashboardSectionForPath(pathname:string):DashboardSection|null {
  if(pathname==="/discover")return "discover";
  if(pathname==="/creators")return "creators";
  if(pathname.startsWith("/creators/"))return "creator";
  if(pathname==="/community")return "community";
  if(pathname==="/levels")return "levels";
  if(pathname==="/account" || pathname.startsWith("/account/") ||
     pathname==="/create" || pathname.startsWith("/create/") ||
     pathname==="/library" || pathname.startsWith("/library/"))return "member";
  return null;
}
const pageContext:Record<DashboardSection,{
  eyebrow:string;title:string;description:string;
  links:ReadonlyArray<{to:string;label:string}>;
}>={
  discover:{
    eyebrow:"THE UNIVERSE / DISCOVER",title:"Explore the archive",
    description:"Independent creations. Real published releases only.",
    links:[{to:"/creators",label:"People"},{to:"/community",label:"Community"},{to:"/start",label:"Start here"}]
  },
  creators:{
    eyebrow:"THE UNIVERSE / PEOPLE",title:"Meet the makers",
    description:"Public channels appear only after approved releases.",
    links:[{to:"/creators",label:"All creators"},{to:"/discover",label:"Browse work"},{to:"/guide",label:"Field guide"}]
  },
  creator:{
    eyebrow:"THE UNIVERSE / CREATOR CHANNEL",title:"A maker's space",
    description:"Published work and earned recognition—not fabricated activity.",
    links:[{to:"/creators",label:"Creator directory"},{to:"/discover",label:"Discover work"},{to:"/levels",label:"Achievements"}]
  },
  community:{
    eyebrow:"THE UNIVERSE / COMMONS",title:"Build together",
    description:"Planned discussion rooms are labelled until launch acceptance.",
    links:[{to:"/creators",label:"People"},{to:"/discover",label:"Explore work"},{to:"/guide",label:"Field guide"}]
  },
  levels:{
    eyebrow:"THE UNIVERSE / PROGRESSION",title:"Earn your orbit",
    description:"Recognition is earned through verified participation, never purchased.",
    links:[{to:"/account",label:"My achievements"},{to:"/community",label:"Community"},{to:"/guide",label:"How it works"}]
  },
  member:{
    eyebrow:"YOUR SPACE / PROTECTED",title:"Creator workspace",
    description:"Private projects, identity, and library stay behind existing member access.",
    links:[{to:"/discover",label:"Explore work"},{to:"/guide",label:"Field guide"},{to:"/status",label:"Build status"}]
  }
};

/** Read-only section affordance. All target pages and access gates already exist. */
export function DashboardContextBar({section}:{section:DashboardSection}) {
  const page=pageContext[section];
  return <div className="av4-contextbar">
    <div className="av4-contextbar__copy">
      <span className="av3-eyebrow">{page.eyebrow}</span>
      <strong>{page.title}</strong>
      <small>{page.description}</small>
    </div>
    <nav className="av4-contextbar__links" aria-label="Section shortcuts">
      {page.links.map(item=><Link key={item.to} to={item.to}>
        {item.label}<Icon name="arrow" size={13}/>
      </Link>)}
    </nav>
  </div>;
}
