import { Link } from "react-router-dom";
import { useState } from "react";
import {
  memberHealth,memberMe,memberLibrary,memberRating,memberVote,memberSetSaved,
  MemberApiError,type MemberRating
} from "../lib/member-api";
import { useResource } from "../lib/useResource";

type Availability=
  | {kind:"closed"}
  | {kind:"guest";signupEnabled:boolean}
  | {kind:"member";rating:MemberRating;saved:boolean;libraryTruncated:boolean};

export function MemberEngagementPanel({projectId}:{projectId:string}){
  const available=useResource<Availability>(async signal=>{
    if(!/^[a-f0-9]{32}$/.test(projectId))return {kind:"closed"};
    let health;
    try{health=await memberHealth(signal);}catch{return {kind:"closed"};}
    if(health.status!=="ok")return {kind:"closed"};
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
  },[projectId]);

  if(available.state==="loading")return <section className="engagement-panel" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL</span><p role="status">Checking private member availability…</p></section>;
  if(available.state==="error")return <section className="engagement-panel" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL</span><p role="status">Member actions are temporarily unavailable. Public project information is still accessible.</p></section>;
  if(available.data.kind==="closed")return <section className="engagement-panel" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL / IN DEVELOPMENT</span><h2>PLAY NOW. PARTICIPATE LATER.</h2><p>Saving, rating and progression are undergoing invited member testing. Public voting is not open on this site.</p></section>;
  if(available.data.kind==="guest")return <section className="engagement-panel" aria-label="Member project participation"><span className="kicker">COMMUNITY SIGNAL / INVITED MEMBERS</span><h2>YOUR INPUT MATTERS.</h2><p>Invited members can rate and save published work. Public accounts and voting remain closed.</p>
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
  return <section className="engagement-panel" aria-label="Invited member project participation">
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
