import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";

type Report={
  id:string;reason:string;createdAt:number;
  post:{id:string;title:string;body:string;status:string};
};
type Decision="HIDE"|"DISMISS";

export default function CommonsModeration(){
  const {data:session,isPending}=memberAuthClient.useSession();
  const availability=useMemberAvailability();
  const [state,setState]=useState<"checking"|"denied"|"ready"|"error">("checking");
  const [reports,setReports]=useState<Report[]>([]);
  const [decision,setDecision]=useState<Record<string,Decision>>({});
  const [reason,setReason]=useState<Record<string,string>>({});
  const [working,setWorking]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const memberId=session?.user?.id;

  useEffect(()=>{
    setReports([]);setMessage("");setState("checking");
    if(isPending||availability==="checking")return;
    if(availability!=="available"||!memberId){setState("denied");return;}
    const controller=new AbortController();
    void fetch("/api/member/commons/moderation/reports",{
      credentials:"same-origin",cache:"no-store",signal:controller.signal
    }).then(async res=>{
      if(res.status===401||res.status===403||res.status===503)return null;
      if(!res.ok)throw Error("No authorized review response");
      return await res.json() as {pending?:Report[]};
    }).then(value=>{
      if(controller.signal.aborted)return;
      if(!value){setState("denied");return;}
      if(!Array.isArray(value.pending))throw Error("Invalid review data");
      setReports(value.pending);setState("ready");
    }).catch(()=>{if(!controller.signal.aborted)setState("error");});
    return ()=>controller.abort();
  },[availability,isPending,memberId]);

  async function resolve(reportId:string){
    const selection=decision[reportId]||"DISMISS",text=(reason[reportId]||"").trim();
    if(state!=="ready"||working||text.length<8||text.length>500)return;
    setWorking(reportId);setMessage("");
    try{
      const res=await fetch("/api/member/commons/moderation/reports/"+reportId+"/resolve",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({decision:selection,reason:text})
      });
      if(!res.ok)throw Error("Review not committed");
      const payload=await res.json() as {resolved?:boolean;moderationAuditRecorded?:boolean};
      if(payload.resolved!==true||payload.moderationAuditRecorded!==true)
        throw Error("Audit unconfirmed");
      setReports(prev=>prev.filter(item=>item.id!==reportId));
      setReason(prev=>({...prev,[reportId]:""}));
      setMessage("The report decision was recorded in the moderation audit.");
    }catch{
      setMessage("Moderation decision not verified. Check the queue before retrying.");
    }finally{setWorking(null);}
  }

  return <section className="c2-page c2-moderation" aria-labelledby="commons-moderation-title">
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
    {state==="ready"&&<section className="c2-moderation-list" aria-label="Pending member reports">
      <p className="c2-truth">Review carefully before acting. Reports are allegations, not proof of a violation. Decisions require a recorded reason.</p>
      {reports.length===0?<div className="c2-empty"><h2>No pending reports</h2><p>No queue items were returned by the authorized server. This is not a claim that no older records exist.</p></div>:
        reports.map(item=><article key={item.id} className="c2-card c2-moderation-item">
          <div className="c2-card-meta"><span>{item.reason}</span><span>Pending report</span></div>
          <h2>{item.post.title}</h2>
          <p className="c2-moderation-post">{item.post.body}</p>
          <form onSubmit={event=>{event.preventDefault();void resolve(item.id);}}>
            <label htmlFor={"mod-decision-"+item.id}>Decision</label>
            <select id={"mod-decision-"+item.id} value={decision[item.id]||"DISMISS"}
              onChange={event=>setDecision(old=>({...old,[item.id]:event.target.value as Decision}))}>
              <option value="DISMISS">Dismiss — no removal</option>
              <option value="HIDE">Hide published post</option>
            </select>
            <label htmlFor={"mod-reason-"+item.id}>Documented reason</label>
            <textarea id={"mod-reason-"+item.id} value={reason[item.id]||""}
              onChange={event=>setReason(old=>({...old,[item.id]:event.target.value}))}
              minLength={8} maxLength={500} required rows={3}
              placeholder="Describe the specific policy and evidence considered."/>
            <button type="submit" disabled={!!working||(reason[item.id]?.trim().length||0)<8}>
              {working===item.id?"Recording decision…":"Record reviewed decision"}
            </button>
          </form>
        </article>)}
    </section>}
    {message&&<p role="status" className="c2-moderation-message">{message}</p>}
  </section>;
}
