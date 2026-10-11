import {useEffect,useState} from "react";
import {Link} from "react-router-dom";

type State="loading"|"ready"|"denied"|"unavailable";
type Overview={
 checkedAt:number;
 members:{registered:number};
 publications:{drafts:number;published:number;archived:number};
 audit:{events:number};
 moderation:{state:"PILOT_DISABLED"|"PILOT_READY"|"STORAGE_UNAVAILABLE";pendingReports:number|null};
};
function validCount(value:unknown){return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0;}
function verify(value:unknown,id:string):value is Overview {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 if(v.schemaVersion!=="anevum.studio.overview.v1"||v.viewerMemberId!==id||
    !validCount(v.checkedAt))return false;
 const members=v.members as Record<string,unknown>|null;
 const pubs=v.publications as Record<string,unknown>|null;
 const audit=v.audit as Record<string,unknown>|null;
 const moderation=v.moderation as Record<string,unknown>|null;
 if(!members||!pubs||!audit||!moderation)return false;
 if(!validCount(members.registered)||!validCount(pubs.drafts)||
    !validCount(pubs.published)||!validCount(pubs.archived)||!validCount(audit.events))return false;
 const modes=["PILOT_DISABLED","PILOT_READY","STORAGE_UNAVAILABLE"];
 if(!modes.includes(String(moderation.state)))return false;
 return moderation.state==="PILOT_READY"?
   validCount(moderation.pendingReports):moderation.pendingReports===null;
}
function format(value:number){return new Intl.NumberFormat().format(value);}
export default function StudioOperations({memberId}:{memberId:string}){
 const [state,setState]=useState<State>("loading");
 const [overview,setOverview]=useState<Overview|null>(null);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setState("loading");setOverview(null);
  void fetch("/api/member/studio/overview",{
   method:"GET",credentials:"same-origin",cache:"no-store",
   redirect:"manual",signal:controller.signal
  }).then(async result=>{
   if(controller.signal.aborted)return;
   if([401,403].includes(result.status)){setState("denied");return;}
   if(!result.ok)throw Error("Studio operation data unavailable");
   const raw:unknown=await result.json();
   if(!verify(raw,memberId))throw Error("Studio overview identity or schema mismatch");
   if(controller.signal.aborted)return;
   setOverview(raw);setState("ready");
  }).catch(()=>{if(!controller.signal.aborted){setState("unavailable");setOverview(null);}});
  return ()=>controller.abort();
 },[memberId,revision]);
 return <section className="studio-operations studio-panel" aria-label="Studio operations">
  <div className="studio-bar">
   <h2>Operations overview</h2>
   <button type="button" onClick={()=>setRevision(x=>x+1)}
    disabled={state==="loading"}>Refresh</button>
  </div>
  {state==="loading"&&<p role="status">Verifying operational counts…</p>}
  {state==="denied"&&<p role="alert">Studio authorization is no longer available. Sign in again before managing content.</p>}
  {state==="unavailable"&&<p role="status">Operational counts could not be verified. No totals are being inferred.</p>}
  {state==="ready"&&overview&&<>
   <div className="studio-ops-metrics" role="group" aria-label="Verified operational totals">
    <div><span>Registered accounts</span><strong>{format(overview.members.registered)}</strong></div>
    <div><span>Drafts</span><strong>{format(overview.publications.drafts)}</strong></div>
    <div><span>Published</span><strong>{format(overview.publications.published)}</strong></div>
    <div><span>Archived</span><strong>{format(overview.publications.archived)}</strong></div>
    <div><span>Editorial audit events</span><strong>{format(overview.audit.events)}</strong></div>
   </div>
   <div className="studio-ops-moderation">
    <h3>Commons moderation</h3>
    {overview.moderation.state==="PILOT_READY"?<>
      <p>{format(overview.moderation.pendingReports!)} pending reports in the isolated pilot.</p>
      <Link to="/communities/moderation">Open moderation queue</Link>
    </>:<p>{overview.moderation.state==="PILOT_DISABLED"?
      "Community moderation pilot is not enabled in this environment.":
      "Community moderation storage is not ready; no report count is available."}</p>}
   </div>
   <p className="studio-ops-stamp">Checked {new Date(overview.checkedAt*1000).toLocaleString()} · Server-verified aggregates, not broker activity</p>
  </>}
 </section>;
}
