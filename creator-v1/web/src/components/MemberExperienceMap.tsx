import {Link} from "react-router-dom";
import type {CanonicalProfile} from "../lib/canonical-beta";

/** Member-owned facts only. Never fabricate progress, awards, projects or
 * privileges: canonical identity is separate from legacy Creator V1 sessions. */
export function MemberExperienceMap({profile}:{profile:CanonicalProfile|null}){
 const claimed=Boolean(profile?.handle);
 const publicPage=claimed&&profile?.visibility==="public";
 const setup=[
  {id:"verified",label:"Identity verified",detail:"You are signed in to ANEVUM's canonical member service.",complete:true,optional:false},
  {id:"handle",label:"Claim a unique handle",detail:claimed?"Your personal address is @"+profile!.handle+".":"Choose your permanent member handle using the editor below.",complete:claimed,optional:false},
  {id:"public",label:"Open your world",detail:publicPage?"Your profile is visible to the community.":"Optional. Keep your page private until you choose to share it.",complete:publicPage,optional:true}
 ];
 return <section className="av17-member-overview" aria-labelledby="av17-overview-title">
  <div className="av17-overview-head">
   <div><span className="kicker">MEMBER SPACE / ACCOUNT OVERVIEW</span>
    <h2 id="av17-overview-title">{claimed?"Your place in the network.":"Your world starts here."}</h2>
    <p>{claimed?"Your saved identity, not a simulated player profile.":"Start with a handle. You decide whether anyone else can see your page."}</p></div>
   <div className="av17-account-state" aria-label="Account status"><span aria-hidden="true"/>VERIFIED MEMBER</div>
  </div>
  <ol className="av17-setup-steps" aria-label="Your verified profile setup">
   {setup.map((step,index)=><li key={step.id} className={step.complete?"av17-step av17-step-done":"av17-step"}>
    <span className="av17-step-number">{String(index+1).padStart(2,"0")}</span>
    <div><strong>{step.label}</strong><p>{step.detail}</p></div>
    <span className="av17-step-status">{step.complete?"COMPLETE":step.optional?"OPTIONAL":"NEXT"}</span>
   </li>)}
  </ol>
  <div className="av17-member-actions">
   <Link to="/community">EXPLORE COMMUNITY <span aria-hidden="true">↗</span></Link>
   {publicPage?<Link to={"/@"+profile!.handle}>OPEN PUBLIC PROFILE <span aria-hidden="true">↗</span></Link>:
    <a href="#av12-editor-heading">{claimed?"EDIT VISIBILITY":"CLAIM YOUR HANDLE"} <span aria-hidden="true">↘</span></a>}
  </div>
  <p className="av17-membership-boundary">Publishing, playable uploads, XP and achievements are separate features under development. Joining now does not grant legacy Creator Studio or staff access.</p>
 </section>;
}
