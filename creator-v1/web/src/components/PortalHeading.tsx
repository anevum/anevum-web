import { Link } from "react-router-dom";
import { OrbitalStage } from "./OrbitalStage";
import { CosmicHorizon } from "./CosmicHorizon";

export function PortalHeading({
  eyebrow, title, accent, description, index="ANEVUM / 001",
  action
}:{
  eyebrow:string; title:string; accent:string; description:string;index?:string;
  action?:{to:string;label:string};
}){
  return <section className="portal-page-heading">
    <CosmicHorizon/>
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
