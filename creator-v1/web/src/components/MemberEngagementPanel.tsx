import { Link } from "react-router-dom";
import { useState } from "react";
import {
  memberHealth,memberMe,memberLibrary,memberRating,memberVote,memberSetSaved,
  MemberApiError,type MemberRating
} from "../lib/member-api";
import { useResource } from "../lib/useResource";
import {projectEngagementGateway} from "../lib/project-engagement";
import {CanonicalProjectSavePanel} from "./CanonicalProjectSavePanel";

type Availability=
  | {kind:"canonical-readonly";registration:"open"|"invite-only"|"closed"}
  | {kind:"canonical-saves";registration:"open"|"invite-only"|"closed"}
  | {kind:"closed"}
  | {kind:"unavailable"}
  | {kind:"guest";signupEnabled:boolean}
  | {kind:"member";rating:MemberRating;saved:boolean;libraryTruncated:boolean};

export function MemberEngagementPanel({projectId}:{projectId:string}){
  const [attempt,setAttempt]=useState(0);
  const available=useResource<Availability>(async signal=>{
    if(!/^[a-f0-9]{32}$/.test(projectId))return {kind:"closed"};
    let health;
    try{health=await memberHealth(signal);}catch{return {kind:"unavailable"};}
    const gateway=projectEngagementGateway(health);
    if(gateway.kind==="canonical-readonly"||gateway.kind==="canonical-saves")return gateway;
    if(gateway.kind!=="legacy")return {kind:"closed"};
    try{await memberMe(signal);}
    catch(e){
      if(e instanceof MemberApiError&&e.status===401)return {kind:"guest",signupEnabled:health.signupEnabled};
      throw e;
    }
    const [rating,library]=await Promise.all([memberRating(projectId,signal),memberLibrary(signal)]);
    return {
      kind:"member",rating:rating.rating,
      saved:library.items.some(x=>x.id===projectId),libraryTruncated:library.count>=100
    };
  },[projectId,attempt]);

  if(available.state==="loading")return <section className="engagement-panel" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL</span><p role="status">Checking private member availability…</p></section>;
  if(available.state==="error"||
    (available.state==="ready"&&available.data.kind==="unavailable"))
    return <section className="engagement-panel avp-participation-preview"
      data-avp-availability="unavailable" aria-label="Member project participation">
      <header className="avp-participation-heading"><span className="kicker">COMMUNITY SIGNAL / SERVICE STATUS</span>
        <span className="avp-participation-status">AVAILABILITY UNVERIFIED</span></header>
      <h2>PARTICIPATION TEMPORARILY UNAVAILABLE.</h2>
      <p role="status">The member service could not confirm which actions are active.
        No rating, saving, or XP action is available until the server responds.</p>
      <div className="avp-participation-actions">
        <button type="button" className="button secondary" onClick={()=>setAttempt(n=>n+1)}>
          RECHECK AVAILABILITY
        </button>
        <Link className="button secondary" to="/discover">EXPLORE PUBLISHED WORK →</Link>
      </div>
    </section>;
  if(available.data.kind==="canonical-saves")return <CanonicalProjectSavePanel key={projectId} projectId={projectId} registration={available.data.registration}/>;
  if(available.data.kind==="canonical-readonly")return <section className="engagement-panel avp-participation-preview" data-avp-availability="canonical-readonly" aria-label="Project participation availability">
    <header className="avp-participation-heading"><span className="kicker">COMMUNITY SIGNAL / MEMBER NETWORK</span><span className="avp-participation-status">RATINGS NOT ACTIVE</span></header>
    <h2>BE PART OF WHAT'S NEXT.</h2>
    <p>Project rating and saving are not connected to this member network yet. You can explore the community and share this creator's work now.</p>
    <div className="avp-participation-actions">
      <Link className="button secondary" to="/community">EXPLORE COMMUNITY →</Link>
      {available.data.registration!=="closed"&&<Link className="button secondary" to="/join">MEMBER ACCESS →</Link>}
    </div>
    <p className="member-caption">{available.data.registration==="invite-only"?"Member access is currently invite-only. ":available.data.registration==="closed"?"New member registration is currently unavailable. ":"Member registration is currently open. "}Signing in does not activate project rating, saving, or XP.</p>
  </section>;
  if(available.data.kind==="closed")return <section className="engagement-panel" data-avp-availability="closed" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL / IN DEVELOPMENT</span><h2>EXPLORE NOW. PARTICIPATE LATER.</h2><p>Rating, saving and related progression are not available for this project on this site. Public voting is not open.</p></section>;
  if(available.data.kind==="guest")return <section className="engagement-panel" data-avp-availability="legacy-guest" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL / INVITED MEMBERS</span><h2>YOUR INPUT MATTERS.</h2><p>Invited members can rate and save published work. Public accounts and voting remain closed.</p>
    {available.data.signupEnabled&&<a className="button secondary" href="/api/v1/member/join">INVITED MEMBER SIGN-IN</a>}
  </section>;
  return <Controls key={projectId} projectId={projectId} initialRating={available.data.rating} initialSaved={available.data.saved} truncated={available.data.libraryTruncated}/>;
}

function Controls({projectId,initialRating,initialSaved,truncated}:{
  projectId:string;initialRating:MemberRating;initialSaved:boolean;truncated:boolean
}){
  const [rating,setRating]=useState(initialRating);
  const [saved,setSaved]=useState(initialSaved);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState("");
  const [error,setError]=useState("");
  async function cast(score:number){
    if(busy)return;setBusy(true);setStatus("");setError("");
    try{
      const result=await memberVote(projectId,score,rating.myVote?.revision||0);
      setRating(result.rating);
      setStatus(result.changed?"Your rating was recorded by the staging service.":"Your rating is unchanged.");
    }catch(e){setError(e instanceof MemberApiError?e.message:"Unable to save rating.");}
    finally{setBusy(false);}
  }
  async function toggle(){
    if(busy)return;setBusy(true);setStatus("");setError("");
    try{
      const result=await memberSetSaved(projectId,!saved);
      setSaved(result.saved);setStatus(result.saved?"Saved to your private library.":"Removed from your private library.");
    }catch(e){setError(e instanceof MemberApiError?e.message:"Unable to update your library.");}
    finally{setBusy(false);}
  }
  return <section className="engagement-panel" data-avp-availability="legacy-member" aria-label="Invited member project participation">
    <div className="engagement-heading">
      <div><span className="kicker">COMMUNITY SIGNAL / INVITED MEMBERS</span><h2>RATE THE WORK. KEEP IT CLOSE.</h2></div>
      <p>{rating.votes+" VERIFIED RATINGS"+(rating.average===null?"":(" / "+rating.average.toFixed(2)+" AVERAGE"))}</p>
    </div>
    <div className="engagement-actions">
      <fieldset className="engagement-votes" disabled={busy}><legend>Your rating of this published project</legend>
        <div>{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={"Rate "+n+" out of 5"} aria-pressed={rating.myVote?.score===n} className={rating.myVote?.score===n?"selected":""} onClick={()=>cast(n)}>{n}</button>)}</div>
      </fieldset>
      <button className="button secondary" type="button" disabled={busy} onClick={toggle}>{saved?"REMOVE FROM LIBRARY":"SAVE TO LIBRARY"}</button>
    </div>
    {truncated&&<p className="member-caption">The staging library returns at most 100 visible saved projects; this indicator may be incomplete.</p>}
    {status&&<p role="status" className="engagement-success">{status}</p>}
    {error&&<p role="alert" className="member-error">{error}</p>}
    <p className="member-caption">Ratings, changes and any eligible XP are verified by the staging server. No client-generated awards.</p>
    <Link className="text-action" to="/library">OPEN PRIVATE LIBRARY →</Link>
  </section>;
}
