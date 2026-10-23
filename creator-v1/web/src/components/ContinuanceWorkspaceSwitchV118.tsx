import {Link} from "react-router-dom";
import {Icon} from "./Icons";
import "../continuance-public-surfaces-v118.css";

/**
 * ANEVUM public workspace rail V118.
 * The switcher uses real public routes and the one existing IREN companion.
 * It never infers membership, enables creator permissions or fabricates activity.
 */
const workspaces=[
  {id:"discover",number:"01",title:"Discover",detail:"Published work",to:"/discover",icon:"explore"},
  {id:"community",number:"02",title:"Community",detail:"People & discussions",to:"/community",icon:"community"},
  {id:"studio",number:"03",title:"Creator Studio",detail:"Creation tools · testing",to:"/studio",icon:"create"}
] as const;

type PublicWorkspace="discover"|"community";

/** A compact public-workspace switcher, not a second primary menu or AI chatbot. */
export function ContinuanceWorkspaceSwitch({current}:{current:PublicWorkspace}){
  return <section className="av118-workspace-switch" aria-label="ANEVUM workspaces">
    <div className="av118-workspace-intro">
      <span className="av118-kicker"><i aria-hidden="true"/> THE CONTINUANCE / WORKSPACES</span>
      <p>{current==="discover"
        ?"Look through verified public work, meet its makers, or explore the tools for building."
        :"Continue from the people behind the work into discovery or the creator workspace."}</p>
    </div>
    <nav className="av118-workspace-links" aria-label="Switch public workspaces">
      {workspaces.map(item=><Link key={item.id} to={item.to}
        className={"av118-workspace-link"+(item.id===current?" is-current":"")}
        aria-current={item.id===current?"page":undefined}>
        <span className="av118-workspace-number" aria-hidden="true">{item.number}</span>
        <span className="av118-workspace-label"><strong>{item.title}</strong><small>{item.detail}</small></span>
        <span className="av118-workspace-icon" aria-hidden="true"><Icon name={item.icon} size={16}/></span>
      </Link>)}
    </nav>
    <button type="button" className="av118-workspace-iren"
      onClick={()=>window.dispatchEvent(new Event("anevum:iren-open"))}
      aria-label="Open the existing IREN companion for site guidance">
      <span>IREN / FIELD GUIDE</span>
      <strong>Need direction? <Icon name="arrow" size={15}/></strong>
    </button>
  </section>;
}
