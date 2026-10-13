import { Link } from "react-router-dom";
import { useState } from "react";
import { useMemberContext } from "../components/MemberGate";
import { memberProgress,memberSignOut,MemberApiError } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { LoadingState } from "../components/States";

export function MemberAccountPage(){
  const {member}=useMemberContext();
  const progress=useResource(memberProgress,[]);
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
        <div className="member-actions"><a className="button secondary" href="/api/v1/member/join">MANAGE PROFILE</a><Link className="button secondary" to="/create">MY PROJECTS</Link></div>
      </section>
      <section className="member-panel">
        <span className="kicker">EARNED RECOGNITION / STAGING</span>
        {progress.state==="loading"&&<LoadingState label="Loading progression"/>}
        {progress.state==="error"&&<p role="status">Progression is currently unavailable. No XP or achievements have been invented.</p>}
        {progress.state==="ready"&&<>
          <div className="member-level"><strong>LEVEL {progress.data.progression.level}</strong><span>{progress.data.progression.xp} XP</span></div>
          <p>{progress.data.progression.artifact}</p>
          <div role="progressbar" aria-label="Level progression" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.data.progression.progressWithinLevel*100)} className="member-progress"><span style={{width:(progress.data.progression.progressWithinLevel*100)+"%"}}/></div>
          <p className="member-caption">Staging progression is provisional and does not grant staff permissions, payouts or rating power.</p>
        </>}
      </section>
    </div>
    <section className="member-panel member-account-controls">
      <span className="kicker">ACCOUNT CONTROLS</span><h2>PRIVACY + SESSION</h2>
      <p>Export, deletion requests and session-revocation controls remain in the existing authenticated staging service.</p>
      <div className="member-actions"><a className="button secondary" href="/api/v1/member/privacy/manage">PRIVACY CONTROLS</a><button className="button secondary" type="button" disabled={busy} onClick={signOut}>{busy?"SIGNING OUT…":"SIGN OUT"}</button></div>
      {feedback&&<p role="alert">{feedback}</p>}
    </section>
  </>;
}
