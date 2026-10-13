import {Link} from "react-router-dom";
import type {Category,CategoryCount} from "../lib/api";
import {CategoryArtifact} from "./CategoryArtifact";

type PortalRoom={id:Category;title:string;tag:string;intro:string};
export const PORTAL_ROOMS:ReadonlyArray<PortalRoom>=[
  {id:"games",title:"THE ARCADE",tag:"GAMES & PLAY",intro:"Indie games and playable experiments"},
  {id:"tools",title:"THE TOOLSHED",tag:"APPS & TOOLS",intro:"Useful things people build"},
  {id:"creative",title:"THE GALLERY",tag:"ART & AI",intro:"Original work and disclosed experiments"},
  {id:"libraries",title:"OPEN CODE",tag:"OPEN SOURCE",intro:"Libraries and collaborative tools"},
  {id:"automation",title:"THE ENGINE",tag:"AUTOMATION",intro:"Make the repetitive disappear"},
  {id:"research",title:"THE OBSERVATORY",tag:"RESEARCH",intro:"Explore evidence and new ideas"},
  {id:"learning",title:"THE LIBRARY",tag:"LEARNING",intro:"Make knowledge more accessible"},
  {id:"other",title:"BEYOND",tag:"DISCOVER MORE",intro:"Everything outside the boxes"}
] as const;

export function PortalArcade({categories}:{categories:ReadonlyArray<CategoryCount>}){
  const counts=new Map(categories.map(({category,count})=>[category,count]));
  return <section className="portal-arcade" aria-labelledby="portal-arcade-title">
    <header className="portal-arcade-heading">
      <div><span className="kicker">CHOOSE YOUR WORLD / EIGHT PUBLIC PORTALS</span>
        <h2 id="portal-arcade-title">PICK A PORTAL. <em>FIND SOMETHING.</em></h2>
      </div>
      <Link className="portal-arcade-all" to="/discover">BROWSE EVERYTHING <span aria-hidden="true">↗</span></Link>
    </header>
    <nav className="portal-arcade-grid" aria-label="Browse independent work by type">
      {PORTAL_ROOMS.map((room,i)=>{
        const count=counts.get(room.id)||0;
        return <Link className={"portal-arcade-tile portal-arcade-tile--"+room.id}
          to={"/discover?category="+encodeURIComponent(room.id)} key={room.id}>
          <span className="portal-arcade-topline"><span>PORTAL {String(i+1).padStart(2,"0")}</span><span>{room.tag}</span></span>
          <span className="portal-arcade-sculpture" aria-hidden="true"><span className="portal-arcade-plinth"/><span className="portal-arcade-symbol"><CategoryArtifact category={room.id}/></span></span>
          <span className="portal-arcade-caption"><strong>{room.title}</strong><small>{room.intro}</small></span>
          <span className="portal-arcade-foot"><span>{count===0?"FIRST RELEASE PENDING":count+" PUBLISHED "+(count===1?"RELEASE":"RELEASES")}</span><span className="portal-arcade-arrow" aria-hidden="true">↗</span></span>
        </Link>;
      })}
    </nav>
    <p className="portal-arcade-honesty">These illustrations identify ANEVUM categories, not individual creator submissions. The release counts come from the live published catalogue.</p>
  </section>;
}
