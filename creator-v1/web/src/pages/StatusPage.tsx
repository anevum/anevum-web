import {Link} from "react-router-dom";
import {readStatus} from "../lib/api";
import {canonicalMethods,type CanonicalMethods} from "../lib/canonical-beta";
import {memberHealth,type MemberHealth} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {ErrorState,LoadingState} from "../components/States";
import "./status-focus-v136.css";

/** V091 / Status is evidence from the current read-only public API plus
 * independent, live canonical capability checks. Do not advertise a sign-in
 * method, publishing ability or staff role without its own service saying so.
 * A failed capability probe is unknown, never "registration closed".
 */
type Signal = "available"|"restricted"|"unavailable";
type Capability = {name:string;state:string;signal:Signal;detail:string;to:string;action:string};
function memberAvailability(auth:CanonicalMethods|null):Capability {
  const base={name:"Member accounts",to:"/join",action:"CHECK ACCESS"};
  if(!auth)return {...base,state:"CHECK REQUIRED",signal:"unavailable",detail:"The account service could not confirm its current availability. Try the entry page for a fresh check."};
  if(auth.availability!=="ready")return {...base,state:auth.availability==="closed"?"REGISTRATION PAUSED":"SERVICE UNAVAILABLE",signal:"unavailable",detail:"Access is determined by the canonical member service. An outage does not mean membership was deliberately closed."};
  if(auth.registration==="open")return {...base,state:"REGISTRATION OPEN",signal:"available",detail:"The verified member service accepts registration. Available sign-in methods are checked again at entry; email verification and session security remain required."};
  if(auth.registration==="invite-only")return {...base,state:"INVITATION REQUIRED",signal:"restricted",detail:"Access is limited to eligible invitations. No public sign-up bypass is provided."};
  return {...base,state:"REGISTRATION PAUSED",signal:"restricted",detail:"New registration is paused by the member service; existing accounts and published work are separate."};
}
function studioAvailability(health:MemberHealth|null):Capability {
  const base={name:"Creator Studio",to:"/studio",action:"OPEN STUDIO"};
  if(!health||health.status!=="ready")return {...base,state:"CHECK REQUIRED",signal:"unavailable",detail:"Availability of the authenticated Studio cannot be inferred from the public catalogue. Sign in to see your current permissions."};
  // New services may expose additional capabilities; older health snapshots
  // cannot be assumed to support public releases or ZIP uploads.
  const extended=health as MemberHealth&{studioReady?:boolean;studioUploadsReady?:boolean};
  if(extended.studioReady===false)return {...base,state:"NOT READY",signal:"restricted",detail:"The member service has not enabled Studio. Private drafts and approved publication are independent."};
  return {...base,state:extended.studioUploadsReady===true?"STUDIO AVAILABLE":"UPLOAD ACCESS VARIES",signal:extended.studioUploadsReady===true?"available":"restricted",detail:"Signed-in members can check supported creation tools. Uploads, staff review and public publication have separate access and approval rules."};
}
function recognitionAvailability(health:MemberHealth|null):Capability {
  const base={name:"Evolution & recognition",to:"/levels",action:"HOW RECOGNITION WORKS"};
  const extended=health as (MemberHealth&{progressionReady?:boolean})|null;
  if(!extended||extended.status!=="ready"||extended.progressionReady!==true)
    return {...base,state:"VERIFY IN MEMBER SPACE",signal:"restricted",detail:"Earned levels, awards and public visibility are confirmed by the member service, not by this public status page."};
  return {...base,state:"SERVER VERIFIED",signal:"available",detail:"Real members earn recognition through approved activity. Private and unreached specimens remain protected; testing controls do not award XP."};
}
export function StatusPage(){
  const resource=useResource(async signal=>{
    const [catalogue,auth,health]=await Promise.all([
      readStatus(signal),
      canonicalMethods(signal).catch(()=>null),
      memberHealth(signal).catch(()=>null)
    ]);
    return {catalogue,auth,health};
  },[]);
  if(resource.state==="loading")return <LoadingState label="Checking current ANEVUM services"/>;
  if(resource.state==="error")return <ErrorState title="LIVE STATUS UNAVAILABLE" detail="The public catalogue cannot confirm current availability. No previous release state is presented as live."/>;
  const {catalogue,auth,health}=resource.data;
  const capabilities:Capability[]=[
    {name:"Discovery & search",state:"PUBLIC",signal:"available",detail:"Only approved projects and verified catalogue records appear. Real release counts come from the public API.",to:"/discover",action:"EXPLORE WORK"},
    memberAvailability(auth),
    studioAvailability(health),
    recognitionAvailability(health),
    {name:"Community & member worlds",state:"PUBLIC READ / ROLE-GATED WRITE",signal:"restricted",detail:"Approved posts and public member worlds may be read. Creating, reviewing and moderating content require verified accounts and permission checks.",to:"/community",action:"VISIT COMMUNITY"},
    {name:"Founder & moderator tools",state:"AUTHORIZED STAFF ONLY",signal:"restricted",detail:"Protected operations are reserved for explicitly granted staff accounts. A profile badge does not authorize access.",to:"/staff",action:"STAFF ENTRY"}
  ];
  return <div className="v091-status-page">
    <header className="v091-status-intro">
      <span className="kicker">ANEVUM / VERIFIED SERVICE STATUS</span>
      <h1>What's <em>actually live.</em></h1>
      <p>Current public availability is not the same as source-code completion. Each service below is described by its own verified capability or explicitly marked as restricted.</p>
      <div className="v091-status-metrics" aria-label="Verified public catalogue">
        <div><strong>{catalogue.counts.publishedProjects}</strong><span>APPROVED RELEASES</span></div>
        <div><strong>{catalogue.counts.publishedCreators}</strong><span>INDEXED CREATOR CHANNELS</span></div>
        <div><strong>{catalogue.version}</strong><span>PUBLIC CATALOGUE API</span></div>
        <div><strong>ACTIVE</strong><span>INDEPENDENT DEVELOPMENT</span></div>
      </div>
    </header>
    <section className="v091-status-services" aria-labelledby="v091-service-heading">
      <div className="v091-status-section-head"><span className="kicker">SERVICE CAPABILITIES / READ ONLY</span><h2 id="v091-service-heading">Connected, not assumed.</h2></div>
      <div className="v091-status-service-grid">{capabilities.map(item=>
        <article key={item.name} className="v091-status-service" data-signal={item.signal}>
          <div className="v091-status-service-top"><h3>{item.name}</h3><span className="v091-status-chip">{item.state}</span></div>
          <p>{item.detail}</p>
          {item.to==="/staff"
            ?<a href="/staff">{item.action} <span aria-hidden="true">↗</span></a>
            :<Link to={item.to}>{item.action} <span aria-hidden="true">↗</span></Link>}
        </article>)}</div>
    </section>
    <section id="development-focus" className="v136-public-focus" aria-labelledby="v136-public-focus-title">
      <header className="v136-public-focus-head">
        <div><span>ANEVUM / CURRENT DEVELOPMENT</span><h2 id="v136-public-focus-title">Building with a narrower focus.</h2>
          <p>These are development priorities, not release dates or promises of available features. The verified service capabilities above are the source of truth for what works today.</p></div>
      </header>
      <ol className="v136-public-focus-list">
        <li><span>01 / NOW</span><strong>Prove Severance multiplayer.</strong><p>The immediate goal is two real browser clients connecting to an authoritative game server, synchronizing a creature encounter, death, re-entry and survival history. This is not a public release.</p></li>
        <li><span>02 / NEXT</span><strong>Validate browser and mobile gameplay.</strong><p>Test controls, reconnect behavior, CPU and memory load on actual phones before scaling the map or player capacity. Existing Creator Studio workflows remain available only under their verified access rules.</p></li>
        <li><span>03 / EXPLORING</span><strong>Expand only after the proof works.</strong><p>Future persistent terrain, alliances, territory and world records depend on measurable infrastructure and testing. Open feature voting and a universal feedback inbox are not active capabilities.</p></li>
      </ol>
      <div className="v136-public-focus-foot"><Link to="/severance">Explore Severance design</Link><Link to="/community">Explore existing community activity</Link></div>
    </section>
    <p className="v091-status-note">Public counts are genuine, but do not include private drafts or unpublished projects. Account and Studio checks are read-only; this page neither opens access nor changes member records.</p>
  </div>;
}
