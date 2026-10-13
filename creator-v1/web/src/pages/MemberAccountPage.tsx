import { Link } from "react-router-dom";
import { useState } from "react";
import { useMemberContext } from "../components/MemberGate";
import { memberProgress,memberSignOut,memberCreatorProfile,MemberApiError } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { LoadingState } from "../components/States";

export function MemberAccountPage(){
  const {member}=useMemberContext();
  const progress=useResource(memberProgress,[]);
  const cabinet=useResource(async signal=>{
    if(!member.handle)return null;
    try{return await memberCreatorProfile(member.handle,signal);}
    catch{return null;}
  },[member.handle]);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState("");
  async function signOut(){
    if(busy)return;
    setBusy(true);
    try{await memberSignOut();window.location.replace(import.meta.env.BASE_URL);}
    catch(e){setFeedback(e instanceof MemberApiError?e.message:"Sign-out is unavailable; please retry.");setBusy(false);}
  }
  return <>
    <section className="member-title"><span className="kicker">YOUR SPACE / PRIVATE ACCOUNT</span><h1>{member.displayName||member.handle||"YOUR ACCOUNT"}</h1><p>Signed in as {member.email}. Your personal data is visible only in this authenticated staging session.</p></section>
    <div className="member-dashboard-grid">
      <section className="member-panel">
        <span className="kicker">CREATOR IDENTITY</span><h2>{member.handle?"@"+member.handle:"PROFILE NOT FINISHED"}</h2>
        <p>{member.bio||"Add a creator profile to participate in the private publishing tests."}</p>
        <div className="member-actions"><Link className="button secondary" to="/account/edit">EDIT CREATOR PROFILE</Link><Link className="button secondary" to="/account/interests">MY INTERESTS</Link><Link className="button secondary" to="/following">FOLLOWING</Link><Link className="button secondary" to="/create">MY PROJECTS</Link></div>
      </section>
      <section className="member-panel">
        <span className="kicker">EARNED RECOGNITION / STAGING</span>
        {progress.state==="loading"&&<LoadingState label="Loading progression"/>}
        {progress.state==="error"&&<p role="status">Progression is currently unavailable. No XP or achievements have been invented.</p>}
        {progress.state==="ready"&&<>
          <div className="member-level"><strong>LEVEL {progress.data.progression.level}</strong><span>{progress.data.progression.xp} XP</span></div>
          <p>{progress.data.progression.artifact||"FUTURE ARTIFACT SERIES / IN DEVELOPMENT"}</p>
          <div role="progressbar" aria-label="Level progression" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.data.progression.progressWithinLevel*100)} className="member-progress"><span style={{width:(progress.data.progression.progressWithinLevel*100)+"%"}}/></div>
          <p className="member-caption">No fixed level ceiling. The first 60 artifacts form one series; the XP curve is still under review. No staff powers, payouts or stronger votes come from levels.</p>
        </>}
      </section>
    </div>
    <section className="member-panel portal-account-cabinet">
      <div className="portal-box-header"><div><span className="kicker">EARNED, NOT BOUGHT / ACCOUNT MILESTONES</span><h2>MY ACHIEVEMENT CABINET</h2></div><Link to="/levels">ALL LEVELS →</Link></div>
      {cabinet.state==="loading"&&<p role="status">Loading verified achievement progress…</p>}
      {cabinet.state==="error"&&<p role="status">The achievement service is currently unavailable. No awards have been assumed.</p>}
      {cabinet.state==="ready"&&(!member.handle?<p>Complete your creator profile to open your achievement collection.</p>:!cabinet.data?<p>Your verified achievement collection is not currently available. Nothing has been awarded by this page.</p>:
        <div className="portal-account-achievements">{cabinet.data.achievements.map(a=>
          <article key={a.key} className={a.earned?"earned":"locked"}>
            <div className="portal-account-achievement-symbol" aria-hidden="true">{a.symbol}</div>
            <div><strong>{a.name}</strong><p>{a.description}</p>
              <span>{a.earned?"EARNED / VERIFIED":a.progress+" / "+a.target+" VERIFIED ACTIONS"}</span>
            </div>
          </article>)}</div>)}
      <p className="member-caption">Only achievements confirmed by the staging ledger appear as earned. Staff powers, votes and search ranking are independent of levels.</p>
    </section>
    <section className="member-panel member-account-controls">
      <span className="kicker">ACCOUNT CONTROLS</span><h2>PRIVACY + SESSION</h2>
      <p>Export, deletion requests and session-revocation controls remain in the existing authenticated staging service.</p>
      <div className="member-actions"><a className="button secondary" href="/api/v1/member/privacy/manage">PRIVACY CONTROLS</a><button className="button secondary" type="button" disabled={busy} onClick={signOut}>{busy?"SIGNING OUT…":"SIGN OUT"}</button></div>
      {feedback&&<p role="alert">{feedback}</p>}
    </section>
  </>;
}
