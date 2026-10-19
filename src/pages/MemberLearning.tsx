import {useCallback,useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";
import {rhenLessons} from "../data/rhen-learning";
import {parseLearningSnapshot,parseLearningAcknowledgement,isCurrentLessonRead,type LearningSnapshot} from "../member/learning-progress";
import learningCss from "../styles/member-learning.css?inline";

const catalog=Object.fromEntries(rhenLessons.map(lesson=>[lesson.slug,lesson.version]));
const ENDPOINT="/api/member/learning/progress";

export default function MemberLearning() {
  const availability=useMemberAvailability();
  const {data:session,isPending}=memberAuthClient.useSession();
  const checking=availability==="checking" || isPending;
  const memberId=availability==="available" && !checking ? session?.user?.id || "" : "";
  // Unmount all account-scoped state during pending, sign-out or account switch.
  return <LearningAccount key={memberId || "signed-out"} memberId={memberId} checking={checking}/>;
}

function LearningAccount({memberId,checking}:{memberId:string;checking:boolean}) {
  const [data,setData]=useState<LearningSnapshot|null>(null);
  const [phase,setPhase]=useState<"loading"|"ready"|"unavailable"|"error">("loading");
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const scope=useRef<AbortController|null>(null);
  const operation=useRef(false);
  const load=useCallback(async(signal:AbortSignal):Promise<LearningSnapshot|null>=>{
    const response=await fetch(ENDPOINT,{method:"GET",credentials:"same-origin",cache:"no-store",
      redirect:"error",signal:AbortSignal.any([signal,AbortSignal.timeout(8000)]),
      headers:{"X-ANEVUM-EXPECTED-MEMBER-ID":memberId}});
    if(signal.aborted)return null;
    if(response.status===503){setData(null);setPhase("unavailable");return null;}
    if(!response.ok)throw Error("Cannot verify learning account.");
    const body:unknown=await response.json();
    if(signal.aborted)return null;
    return parseLearningSnapshot(body,memberId,catalog);
  },[memberId]);

  useEffect(()=>{
    if(!memberId)return;
    const controller=new AbortController();scope.current=controller;
    setData(null);setPhase("loading");setMessage("");
    void load(controller.signal).then(snapshot=>{
      if(!controller.signal.aborted && snapshot){setData(snapshot);setPhase("ready");}
    }).catch(()=>{if(!controller.signal.aborted){setData(null);setPhase("error");}});
    return ()=>{controller.abort();if(scope.current===controller)scope.current=null;};
  },[memberId,load]);

  async function refresh() {
    const controller=scope.current;
    if(!controller || controller.signal.aborted || operation.current)return;
    operation.current=true;setData(null);setPhase("loading");setMessage("");
    try {
      const snapshot=await load(controller.signal);
      if(!controller.signal.aborted && snapshot){setData(snapshot);setPhase("ready");}
    } catch {if(!controller.signal.aborted){setData(null);setPhase("error");}}
    finally {if(scope.current===controller && !controller.signal.aborted)operation.current=false;}
  }
  async function save(slug:string,completed:boolean) {
    const controller=scope.current;
    const lesson=rhenLessons.find(item=>item.slug===slug);
    if(!lesson || !controller || controller.signal.aborted || operation.current ||
      !data || data.memberId!==memberId || phase!=="ready")return;
    const previous=data.progress.find(item=>item.lessonSlug===slug);
    const expectedRevision=previous?.revision || 0;
    operation.current=true;setBusy(slug);setMessage("");
    try {
      const response=await fetch(ENDPOINT+"/"+slug,{method:"PUT",credentials:"same-origin",cache:"no-store",
        redirect:"error",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]),
        headers:{"Content-Type":"application/json","X-ANEVUM-EXPECTED-MEMBER-ID":memberId},
        body:JSON.stringify({lessonVersion:lesson.version,completed,expectedRevision})});
      if(controller.signal.aborted)return;
      if(!response.ok)throw Error("Save rejected or uncertain.");
      const body:unknown=await response.json();
      if(controller.signal.aborted)return;
      const saved=parseLearningAcknowledgement(body,memberId,slug,lesson.version,completed,expectedRevision);
      const snapshot=await load(controller.signal);
      if(controller.signal.aborted)return;
      const confirmed=snapshot?.progress.find(item=>item.lessonSlug===slug);
      if(!snapshot || !confirmed || JSON.stringify(confirmed)!==JSON.stringify(saved))throw Error("Save raced with another tab.");
      setData(snapshot);setPhase("ready");setMessage(completed?"Marked read in your account.":"Marked unread in your account.");
    } catch {
      if(!controller.signal.aborted){setData(null);setPhase("error");setMessage("The update could not be confirmed. Reload saved progress before trying again.");}
    } finally {
      if(scope.current===controller && !controller.signal.aborted){operation.current=false;setBusy("");}
    }
  }
  const available=Boolean(memberId && data?.memberId===memberId && phase==="ready");
  const readCount=available?rhenLessons.filter(lesson=>isCurrentLessonRead(data?.progress.find(row=>row.lessonSlug===lesson.slug),lesson.version)).length:0;
  return <main className="member-page member-learning" data-member-learning="true">
    <style>{learningCss}</style>
    <header><p className="workshop-kicker">COMMAND / LEARNING</p><h1>My learning</h1>
      <p>Keep an optional, private record of the lessons you have read. Reading and self-checks stay free and public.</p>
      <nav aria-label="Learning navigation"><Link to="/command">My Command</Link><Link to="/products/rhen/learn">Read the lessons</Link><Link to="/me/settings">Account and export</Link></nav>
    </header>
    {checking?<p role="status">Checking your account...</p>:!memberId?
      <p>Sign in to check saved progress. No sign-in is needed to read. <Link to="/sign-in">Sign in</Link></p>:
      phase==="loading"?<p role="status">Reading saved progress...</p>:
      phase==="unavailable"?<p role="status">Saving lesson progress is not available on this site yet. Both lessons remain open to read.</p>:
      phase==="error"?<div role="alert"><p>{message||"Saved progress could not be verified. No completion state is being shown."}</p><button type="button" onClick={()=>void refresh()}>Reload saved progress</button></div>:null}
    {available&&<p className="ml-summary" role="status">{message||`${readCount} of ${rhenLessons.length} current lessons marked read.`}</p>}
    <section className="ml-lessons" aria-label="Your lesson list">
      {rhenLessons.map(lesson=>{
        const progress=available?data?.progress.find(row=>row.lessonSlug===lesson.slug):undefined;
        const read=isCurrentLessonRead(progress,lesson.version);
        const changed=Boolean(progress && progress.lessonVersion!==lesson.version);
        return <article key={lesson.slug} className="ml-lesson" data-lesson={lesson.slug}>
          <p className="workshop-kicker">LESSON {lesson.number} / VERSION {lesson.version}</p>
          <h2>{lesson.title}</h2><p>{lesson.summary}</p>
          {available&&<p className="ml-state">{changed?"Updated since your last saved version. Read the current lesson before marking it read.":read?"Marked read":"Not marked read"}</p>}
          <div className="ml-actions"><Link to={"/products/rhen/learn/"+lesson.slug}>Read lesson and self-checks</Link>
            {available&&<button type="button" disabled={Boolean(busy)} onClick={()=>void save(lesson.slug,!read)}>
              {busy===lesson.slug?"Verifying save...":read?"Mark unread":changed?"Mark current version read":"Mark read"}
            </button>}
          </div>
        </article>;
      })}
    </section>
    <p className="ml-boundary">A read marker is your own record, not a graded assessment, certificate, reward or trading permission. No answers or reading history are collected automatically. Saved markers are included in your account export and removed with account deletion.</p>
  </main>;
}
