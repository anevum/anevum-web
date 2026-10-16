import {Link} from "react-router-dom";
import {useRef,useState} from "react";
import {CosmicIllustration} from "./CosmicIllustration";
import {Icon} from "./Icons";

/** Visual destinations are artwork, not fake community records.
 * Every gateway links to a real filtered public catalogue.
 */
const gateways=[
  {number:"01",title:"Games & worlds",kind:"PLAY / INTERACTIVE",text:"Step into independent games, playful experiments and unexpected places.",scene:"games",to:"/discover?category=games"},
  {number:"02",title:"Apps & utilities",kind:"BUILD / PRACTICAL",text:"Meet useful software that started as someone's idea worth sharing.",scene:"tools",to:"/discover?category=tools"},
  {number:"03",title:"Creative frontiers",kind:"MAKE / EXPLORE",text:"Discover art, AI experiences and experiments that do not fit the usual categories.",scene:"creative",to:"/discover?category=creative"},
  {number:"04",title:"Open knowledge",kind:"SHARE / LEARN",text:"Find open-source tools, reusable ideas and work built for everyone.",scene:"libraries",to:"/discover?category=libraries"}
] as const;

/** Purpose-made full-frame originals, rather than enlarged concept-board crops. */
function PortalArtwork({scene}:{scene:typeof gateways[number]["scene"]}){
  const [failed,setFailed]=useState(false);
  const base=import.meta.env.BASE_URL+"assets/community-portals/"+scene;
  return failed?<CosmicIllustration scene={scene}/>:<img
    src={base+"-1536.webp"} srcSet={base+"-768.webp 768w, "+base+"-1536.webp 1536w"}
    sizes="(max-width: 540px) 84vw, (max-width: 900px) 48vw, 24vw"
    width="1536" height="1024" alt="" loading="lazy" decoding="async"
    onError={()=>setFailed(true)}/>;
}

export function WorldGatewayDeck(){
  const deck=useRef<HTMLDivElement>(null);
  const move=(direction:number)=>{
    const row=deck.current;
    if(!row)return;
    const card=row.querySelector<HTMLElement>(".av9-world-gateway");
    row.scrollBy({left:direction*((card?.getBoundingClientRect().width||row.clientWidth)+16),
      behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  };
  return <section id="world-gateways" className="av9-world-deck" aria-labelledby="av9-worlds-heading">
    <header className="av9-world-deck-head">
      <div><span className="av9-overline">CHAPTER 01 / COMMUNITY COLLECTIONS</span><h2 id="av9-worlds-heading">Find your <em>next world.</em></h2></div>
      <p>Made by independent people. Yours to discover, use, and build upon.</p>
    </header>
    <div className="av9-world-grid" ref={deck} id="community-portal-cards">
      {gateways.map(gate=><Link className="av9-world-gateway" key={gate.number} to={gate.to}
        aria-label={"Explore "+gate.title}>
        <span className="av9-world-gateway-art" aria-hidden="true"><PortalArtwork scene={gate.scene}/>
          <span className="av14-portal-number">{gate.number} / ANEVUM</span>
          <span className="av14-portal-orbit"><Icon name="arrow" size={22}/></span>
        </span>
        <span className="av9-world-gateway-content">
          <span className="av9-world-gateway-meta">{gate.kind}</span>
          <strong>{gate.title}</strong>
          <span className="av9-world-gateway-desc">{gate.text}</span>
          <span className="av9-world-gateway-entry">EXPLORE COLLECTION <Icon name="arrow" size={17}/></span>
        </span>
      </Link>)}
    </div>
    <div className="av14-collection-footer">
      <span>FOUR DOORWAYS. ONE CREATIVE COMMUNITY.</span>
      <div className="av14-deck-controls" role="group" aria-label="Browse collections">
        <button type="button" onClick={()=>move(-1)} aria-label="Previous collection" aria-controls="community-portal-cards">←</button>
        <button type="button" onClick={()=>move(1)} aria-label="Next collection" aria-controls="community-portal-cards">→</button>
      </div>
      <Link to="/discover">ALL FIELDS <Icon name="arrow" size={15}/></Link>
    </div>
    <nav className="av14-community-desk" aria-label="Take part in ANEVUM">
      <div><span className="av9-overline">THE COMMUNITY DESK</span><strong>Find something. <em>Make a connection.</em></strong></div>
      <a href="#community-index"><Icon name="explore" size={19}/><span>Latest creations</span><Icon name="arrow" size={15}/></a>
      <Link to="/community"><Icon name="community" size={19}/><span>Conversations</span><Icon name="arrow" size={15}/></Link>
      <Link to="/creators"><Icon name="people" size={19}/><span>Meet the makers</span><Icon name="arrow" size={15}/></Link>
    </nav>
  </section>;
}
