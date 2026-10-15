import {Link} from "react-router-dom";
import {CosmicArtwork} from "./CosmicArtwork";
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

export function WorldGatewayDeck(){
  return <section id="world-gateways" className="av9-world-deck" aria-labelledby="av9-worlds-heading">
    <header className="av9-world-deck-head">
      <div><span className="av9-overline">CHAPTER 01 / THE PORTALS</span><h2 id="av9-worlds-heading">Find your <em>next world.</em></h2></div>
      <p>Real projects, real creators. Find a place to play, make, learn or contribute.</p>
    </header>
    <div className="av9-world-grid">
      {gateways.map(gate=><Link className="av9-world-gateway" key={gate.number} to={gate.to}
        aria-label={"Explore "+gate.title}>
        <span className="av9-world-gateway-art" aria-hidden="true"><CosmicArtwork scene={gate.scene}/></span>
        <span className="av9-world-gateway-content">
          <span className="av9-world-gateway-meta">{gate.number} / {gate.kind}</span>
          <strong>{gate.title}</strong>
          <span className="av9-world-gateway-desc">{gate.text}</span>
          <span className="av9-world-gateway-entry">ENTER THE PORTAL <Icon name="arrow" size={17}/></span>
        </span>
      </Link>)}
    </div>
  </section>;
}
