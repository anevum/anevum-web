import { Link } from "react-router-dom";
import { OrbitalStage } from "./OrbitalStage";
import { CosmicHorizon } from "./CosmicHorizon";
import { CosmicArtwork } from "./CosmicArtwork";
import type { CosmicScene } from "./CosmicIllustration";

export function PortalHeading({
  eyebrow, title, accent, description, index="ANEVUM / 001",
  action, scene="portal"
}:{
  eyebrow:string; title:string; accent:string; description:string;index?:string;
  action?:{to:string;label:string};scene?:CosmicScene;
}){
  return <section className={"portal-page-heading portal-page-heading--"+scene}>
    <CosmicHorizon/><div className="cw-heading-cosmos" aria-hidden="true"><CosmicArtwork scene={scene}/></div>
    <div className="portal-page-heading-copy">
      <span className="kicker">{eyebrow}</span>
      <h1>{title}<br/><em>{accent}</em></h1>
      <p>{description}</p>
      {action&&<Link className="portal-heading-action" to={action.to}>{action.label} <span aria-hidden="true">↗</span></Link>}
    </div>
    <div className="portal-page-heading-stamp" aria-hidden="true">
      <OrbitalStage variant="heading"/><span>{index}</span>
    </div>
  </section>;
}
