import { Link } from "react-router-dom";
import { useResource } from "../lib/useResource";
import { memberHealth, memberMe, memberProgress, MemberApiError, type Progression } from "../lib/member-api";
import { CelestialEmblem } from "./CelestialEmblem";
import { seriesOneMotif } from "../lib/artifact-art";

type LevelState={kind:"member"; progression:Progression}|{kind:"guest"}|{kind:"closed"};

export function LevelPanel({compact=false}:{compact?:boolean}){
  const state=useResource<LevelState>(async signal=>{
    let health;
    try {health=await memberHealth(signal);} catch {return {kind:"closed"};}
    if(health.status!=="ok")return {kind:"closed"};
    try {await memberMe(signal);}
    catch(e){
      if(e instanceof MemberApiError&&e.status===401)return {kind:"guest"};
      throw e;
    }
    const {progression}=await memberProgress(signal);
    return {kind:"member",progression};
  },[]);
  const p=state.state==="ready"&&state.data.kind==="member" ? state.data.progression : null;
  const progress=p?Math.max(0,Math.min(100,Math.round(p.progressWithinLevel*100))):0;
  return <section className={"portal-level-box"+(compact?" portal-level-compact":"")} aria-label="ANEVUM levels and earned progression">
    <header className="portal-level-top"><span className="kicker">YOUR PLACE IN ORBIT</span><span className="portal-level-kicker">XP / LEVELS / ARTIFACTS</span></header>
    <div className="portal-level-main">
      <div className="portal-level-mark"><CelestialEmblem motif={p?seriesOneMotif(p.level,p.artifact):"orbital"} size="small" state={p?.artifactEarned?"earned":"preview"}/></div>
      <div className="portal-level-copy">
        <span className="portal-level-overline">{p?"YOUR VERIFIED STAGING LEVEL":"THE ANEVUM LEVEL SYSTEM"}</span>
        <strong>{p?"LEVEL "+p.level:"NO LEVEL CAP"}</strong>
        <small>{p?(p.artifact||"NEW ARTIFACT SERIES TO COME"):"Recognition is earned, not bought."}</small>
      </div>
    </div>
    {p?
      <>
        <div role="progressbar" aria-label="Progress to the next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="portal-level-progress"><span style={{width:progress+"%"}}/></div>
        <div className="portal-level-meta"><span>{p.xp.toLocaleString()} XP</span><span>{p.nextLevelXp===null?"LEVEL THRESHOLD PENDING":"NEXT: "+p.nextLevelXp.toLocaleString()+" XP"}</span></div>
      </>:
      <p className="portal-level-info">{state.state==="loading"?"Checking current staging member progress…":state.state==="ready"&&state.data.kind==="guest"?"Sign in with an invitation to view earned XP and artifacts.":"Genuine contribution unlocks XP and achievements. Accounts remain invite-only."}</p>}
    <Link to="/levels" className="portal-level-link">EXPLORE THE LEVEL SYSTEM <span aria-hidden="true">↗</span></Link>
  </section>;
}
