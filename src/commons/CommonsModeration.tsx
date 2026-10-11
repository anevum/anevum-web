import {useCallback,useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";

import {parseReviewQueue,reviewedDecision,validReviewReason,type Report,type Decision} from "./moderation-contract";

export default function CommonsModeration(){
  const {data:session,isPending}=memberAuthClient.useSession();
  const availability=useMemberAvailability();
  const memberId=availability==="available"&&!isPending?session?.user?.id:undefined;
  return <ModeratorReview key={memberId||"no-member"} memberId={memberId}
    checking={isPending||availability==="checking"}/>;
}
function ModeratorReview({memberId,checking}:{memberId?:string;checking:boolean}){
  const [state,setState]=useState<"checking"|"denied"|"ready"|"error">("checking");
  const [reports,setReports]=useState<Report[]>([]);
  const [olderPending,setOlderPending]=useState(false);
  const [decision,setDecision]=useState<Record<string,Decision>>({});
  const [reason,setReason]=useState<Record<string,string>>({});
  const [working,setWorking]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [uncertain,setUncertain]=useState(false);
  const [reload,setReload]=useState(0);
  const scope=useRef<AbortController|null>(null);
  const load=useCallback(async(signal:AbortSignal)=>{
    if(signal.aborted||!memberId)return;
    const res=await fetch("/api/member/commons/moderation/reports",{
      credentials:"same-origin",cache:"no-store",signal
    });
    if(signal.aborted)return;
    if(res.status===401||res.status===403||res.status===503){setReports([]);setState("denied");return;}
    if(!res.ok)throw Error("No authorized review response");
    const queue=parseReviewQueue(await res.json(),memberId);
    if(!signal.aborted){setReports(queue.pending);setOlderPending(queue.olderPendingMayExist);setState("ready");}
  },[memberId]);
  useEffect(()=>{
    setReports([]);setMessage("");setDecision({});setReason({});setWorking(null);setOlderPending(false);setUncertain(false);setState("checking");
    if(checking)return;
    if(!memberId){setState("denied");return;}
    const controller=new AbortController();scope.current=controller;
    void load(controller.signal).catch(()=>{if(!controller.signal.aborted)setState("error");});
    return ()=>controller.abort();
  },[checking,memberId,load,reload]);

  async function resolve(reportId:string){
    const controller=scope.current;
    const selection=decision[reportId]||"DISMISS",text=(reason[reportId]||"").trim();
    if(!memberId||!controller||controller.signal.aborted||state!=="ready"||working||uncertain||
      !validReviewReason(text)||!reports.some(item=>item.id===reportId))return;
    setWorking(reportId);setMessage("");
    try{
      const res=await fetch("/api/member/commons/moderation/reports/"+reportId+"/resolve",{
        method:"POST",credentials:"same-origin",signal:controller.signal,
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({decision:selection,reason:text})
      });
      if(controller.signal.aborted)return;
      if(res.status===401||res.status===403||res.status===503){setReports([]);setState("denied");throw Error("Authorization unavailable");}
      if(!res.ok)throw Error("Review not committed");
      if(!reviewedDecision(await res.json(),memberId,reportId,selection))throw Error("Audit unconfirmed");
      if(controller.signal.aborted)return;
      setReports(prev=>prev.filter(item=>item.id!==reportId));
      setReason(prev=>({...prev,[reportId]:""}));
      setMessage("The report decision was recorded in the moderation audit.");
    }catch{
      if(!controller.signal.aborted){setUncertain(true);setMessage("Moderation decision not verified. Reload the authorized queue before another attempt.");}
    }finally{if(!controller.signal.aborted)setWorking(null);}
  }

  return <section className="c2-page c2-moderation" data-review-state={state} aria-labelledby="commons-moderation-title">
    <Link to="/communities" className="c2-text-link">← Commons topics</Link>
    <header className="c2-intro"><span className="c2-kicker">COMMONS / STAFF REVIEW</span>
      <h1 id="commons-moderation-title">Community moderation</h1>
      <p>Private, audit-backed review of reported member discussions. A Commons account alone never grants access.</p>
    </header>
    {state==="checking"&&<p role="status">Verifying both member and staff authorization…</p>}
    {state==="denied"&&<div className="c2-truth" role="status">
      Moderator access is unavailable. A separate Cloudflare Access authorization and a verified ANEVUM member account are required.
    </div>}
    {state==="error"&&<p role="alert">Moderation service unavailable. No review decisions are permitted.</p>}
    {memberId&&!checking&&<button className="c2-review-reload" type="button" disabled={!!working||state==="checking"} onClick={()=>setReload(old=>old+1)}>Reload authorized queue</button>}
    {state==="ready"&&<section className="c2-moderation-list" aria-label="Pending member reports">
      <p className="c2-truth">Review carefully before acting. Reports are allegations, not proof of a violation. Decisions require a recorded reason.</p>
      {olderPending&&<p className="c2-truth">This queue contains up to 30 pending reports. Additional pending reports may exist. Reload after reviewing this batch.</p>}
      {reports.length===0?<div className="c2-empty"><h2>No pending reports</h2><p>No queue items were returned by the authorized server. This is not a claim that no older records exist.</p></div>:
        reports.map(item=><article key={item.id} className="c2-card c2-moderation-item">
          <div className="c2-card-meta"><span>{item.reason}</span><span>Pending report</span></div>
          <h2>{item.post.title}</h2>
          <p className="c2-moderation-post">{item.post.body}</p>
          <form onSubmit={event=>{event.preventDefault();void resolve(item.id);}}>
            <label htmlFor={"mod-decision-"+item.id}>Decision</label>
            <select disabled={!!working||uncertain} id={"mod-decision-"+item.id} value={decision[item.id]||"DISMISS"}
              onChange={event=>setDecision(old=>({...old,[item.id]:event.target.value as Decision}))}>
              <option value="DISMISS">Dismiss — no removal</option>
              <option value="HIDE">Hide published post</option>
            </select>
            <label htmlFor={"mod-reason-"+item.id}>Documented reason</label>
            <textarea disabled={!!working||uncertain} id={"mod-reason-"+item.id} value={reason[item.id]||""}
              onChange={event=>setReason(old=>({...old,[item.id]:event.target.value}))}
              minLength={8} maxLength={500} required rows={3}
              placeholder="Describe the specific policy and evidence considered."/>
            <button type="submit" disabled={!!working||uncertain||!validReviewReason(reason[item.id]||"")}>
              {working===item.id?"Recording decision…":"Record reviewed decision"}
            </button>
          </form>
        </article>)}
    </section>}
    {message&&<p role={uncertain?"alert":"status"} className="c2-moderation-message">{message}</p>}
  </section>;
}
