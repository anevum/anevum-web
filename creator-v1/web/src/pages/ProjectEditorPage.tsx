import { FormEvent,useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import {
  memberCreateProject,memberProject,memberSubmitProject,memberUpdateProject,
  MemberApiError,type MemberProject,type ProjectDraft
} from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { ErrorState,LoadingState } from "../components/States";
import { useMemberContext } from "../components/MemberGate";
import {canSubmitSavedProject,draftFingerprint,projectDestination,projectReadiness} from "../lib/project-readiness";

const blank:ProjectDraft={
  slug:"",title:"",summary:"",category:"games",description:"",
  freeToUse:true,sourceUrl:null,demoUrl:null,license:null,
  aiDisclosure:"",humanContribution:""
};
const cats=[["games","Games & Play"],["tools","Apps & Utilities"],["creative","Creative experiments"],["automation","Automation"],["research","Research"],["learning","Learning"],["libraries","Open-source & libraries"],["other","Other"]] as const;
type TextKey=Exclude<keyof ProjectDraft,"freeToUse">;
const editable=(status:string)=>status==="draft"||status==="changes_requested";
function loadDraft(p?:MemberProject):ProjectDraft {
  return p ? {
    slug:p.slug,title:p.title,summary:p.summary,category:p.category,
    description:p.description||"",freeToUse:p.freeToUse,sourceUrl:p.sourceUrl,
    demoUrl:p.demoUrl,license:p.license,aiDisclosure:p.aiDisclosure||"",
    humanContribution:p.humanContribution||""
  } : {...blank};
}
export function ProjectEditorPage(){
  const {projectId}=useParams();
  const {member}=useMemberContext();
  if(!member.handle)return <section className="member-panel">
    <span className="kicker">CREATOR STUDIO / PROFILE REQUIRED</span>
    <h1>FINISH YOUR CREATOR PROFILE.</h1>
    <p>Choose your permanent creator handle and public name before starting or editing a project.
      Your projects cannot be submitted until your verified creator identity is ready.</p>
    <div className="member-actions"><Link className="button primary" to="/account/edit">COMPLETE CREATOR PROFILE</Link>
      <Link className="button secondary" to="/create">BACK TO MY PROJECTS</Link></div>
  </section>;
  return projectId?<Existing projectId={projectId} key={projectId}/>:<Editor key="new"/>;
}
function Existing({projectId}:{projectId:string}){
  const state=useResource(signal=>memberProject(projectId,signal),[projectId]);
  if(state.state==="loading")return <LoadingState label="Opening your private project draft"/>;
  if(state.state==="error")return <ErrorState title="PRIVATE PROJECT UNAVAILABLE" detail="This project is not owned by your account, or the staging member service is unavailable."/>;
  return <Editor key={projectId+"-"+state.data.project.revision} project={state.data.project} reviewHistory={state.data.reviewHistory}/>;
}
function Editor({project,reviewHistory=[]}:{
  project?:MemberProject;
  reviewHistory?:{action:string;to_status:string;reason:string|null;created_at:string}[];
}){
  const navigate=useNavigate();
  const [draft,setDraft]=useState<ProjectDraft>(()=>loadDraft(project));
  const [savedDraft,setSavedDraft]=useState<ProjectDraft|null>(()=>project?loadDraft(project):null);
  const [refreshRequired,setRefreshRequired]=useState(false);
  const [revision,setRevision]=useState(project?.revision||0);
  const [status,setStatus]=useState(project?.status||"new");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const canEdit=(!project||editable(status))&&!refreshRequired;
  const dirty=savedDraft===null||draftFingerprint(draft)!==draftFingerprint(savedDraft);
  const readiness=projectReadiness(draft);
  const canSubmit=Boolean(project)&&!refreshRequired&&canSubmitSavedProject(draft,savedDraft,status,busy);
  const demo=projectDestination(draft.demoUrl),source=projectDestination(draft.sourceUrl);
  const setText=(key:TextKey,value:string)=>{setDraft(current=>({...current,[key]:value}));setError("");setNotice("");};
  const field=(key:TextKey,label:string,max:number,opts:{rows?:number;required?:boolean;hint?:string;min?:number;type?:string}={})=>{
    const value=draft[key]??"";
    const props={id:"draft-"+key,name:key,value,disabled:!canEdit||busy,maxLength:max,minLength:opts.min||0,required:opts.required,"aria-describedby":opts.hint?"draft-"+key+"-help":undefined,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setText(key,e.target.value)};
    return <div className="draft-field" key={key}><label htmlFor={props.id}>{label}</label>
      {opts.rows?<textarea {...props} rows={opts.rows}/>:<input {...props} type={opts.type||"text"}/>}
      {opts.hint&&<p className="draft-hint" id={"draft-"+key+"-help"}>{opts.hint}</p>}
    </div>;
  };
  async function save(e:FormEvent){
    e.preventDefault();if(!canEdit||busy)return;
    setBusy(true);setError("");setNotice("");
    try {
      if(!project) {
        const result=await memberCreateProject(draft);
        navigate("/create/"+result.id,{replace:true});
      } else {
        const result=await memberUpdateProject(project.id,revision,draft);
        setRevision(result.revision);setStatus(result.status);
        // Fetch the canonical saved fields: the server trims and normalizes URLs.
        // A failed read after a successful save must never unlock submission.
        setSavedDraft(null);
        setRefreshRequired(true);
        const confirmed=await memberProject(project.id);
        const canonical=loadDraft(confirmed.project);
        setDraft(canonical);setSavedDraft(canonical);
        setRevision(confirmed.project.revision);setStatus(confirmed.project.status);
        setRefreshRequired(false);
        setNotice("Draft saved to your own staging account. Nothing has been published.");
      }
    }catch(e){
      if(e instanceof MemberApiError&&[401,403,409].includes(e.status))setRefreshRequired(true);
      setError(e instanceof MemberApiError?e.message:"Unable to save or confirm your draft. Reload to check the saved version before submitting.");
    }
    finally{setBusy(false);}
  }
  async function submit(){
    if(!project||!canSubmit||busy)return;
    if(!window.confirm("Send the saved revision "+revision+" of “"+savedDraft?.title+"” to staff for moderation? It will not be published automatically."))return;
    setBusy(true);setError("");setNotice("");
    try {
      const result=await memberSubmitProject(project.id,revision);
      setRevision(result.revision);setStatus(result.status);
      setNotice("Submitted for staff review. Your project remains private until separately approved.");
    }catch(e){
      // The outcome of a failed network response may be unknown. Require a
      // server refresh rather than retrying an old revision blindly.
      setRefreshRequired(true);
      setError(e instanceof MemberApiError?e.message:"Unable to confirm submission. Reload to check the current project status.");
    }
    finally{setBusy(false);}
  }
  return <>
    <Link className="project-return" to="/create">← MY PROJECTS</Link>
    <section className="member-title"><span className="kicker">PRIVATE CREATOR STUDIO / INVITE-ONLY</span><h1>{project?"REFINE THE WORK.":"MAKE SOMETHING."}</h1>
      <p>Prepare the real public project passport. Saving is private. Submitting requests a separate staff review; it never publishes immediately.</p></section>
    {project&&<div className="draft-status"><strong>{status.replaceAll("_"," ").toUpperCase()}</strong><span>REVISION {revision}</span></div>}
    <form className="member-draft-form" onSubmit={save}>
      <div className="draft-grid">
        <div className="draft-column"><span className="kicker">01 / THE PROJECT</span>
          {field("title","Title",100,{required:true,min:3})}
          {field("slug","URL slug",90,{required:true,min:3,hint:"Lowercase letters, numbers and hyphens; must be unique."})}
          <div className="draft-field"><label htmlFor="draft-category">Category</label>
            <select id="draft-category" value={draft.category} disabled={!canEdit||busy} onChange={e=>setText("category",e.target.value)}>
              {cats.map(([id,label])=><option value={id} key={id}>{label}</option>)}
            </select>
          </div>
          {field("summary","Short description",280,{required:true,min:10,rows:3})}
          {field("description","Full description",8000,{rows:7,hint:"Explain the genuine experience. Don't include private information."})}
          <label className="draft-checkbox"><input type="checkbox" checked={draft.freeToUse} disabled={!canEdit||busy} onChange={e=>{setDraft(d=>({...d,freeToUse:e.target.checked}));setNotice("");setError("");}}/>Free to use</label>
        </div>
        <div className="draft-column"><span className="kicker">02 / RIGHTS + DESTINATIONS</span>
          {field("demoUrl","Hosted demo or usable experience URL",1500,{type:"url",hint:"Optional HTTPS link. The experience remains creator-hosted."})}
          {field("sourceUrl","Public source URL",1500,{type:"url",hint:"Optional HTTPS link; a public repo doesn't necessarily have an open license."})}
          {field("license","Project license",80,{hint:"Only claim rights you actually hold."})}
          {field("aiDisclosure","AI involvement",1200,{rows:4,hint:"A meaningful disclosure is required before moderation submission, even if no AI was used."})}
          {field("humanContribution","Human work and credits",1200,{rows:4,hint:"At least 10 characters describing actual human contributions are required to submit."})}
        </div>
      </div>
      <div className="project-review-layout">
        <section className="project-readiness" aria-labelledby="project-readiness-title">
          <span className="kicker">03 / BEFORE STAFF REVIEW</span>
          <h2 id="project-readiness-title">SUBMISSION CHECKLIST</h2>
          <ul>{readiness.map(check=><li key={check.key} data-ready={check.ready}>
            <strong>{check.ready?"READY":"NEEDED"}</strong><span>{check.label}</span>
          </li>)}<li data-ready={savedDraft!==null&&!dirty&&!refreshRequired}>
            <strong>{savedDraft!==null&&!dirty&&!refreshRequired?"SAVED":"NEEDED"}</strong>
            <span>Current changes saved and confirmed by the server</span>
          </li></ul>
          <p className="draft-hint">These checks help prepare your submission. Staff separately verifies rights, safety and disclosures; a checklist does not grant approval.</p>
        </section>
        <section className="project-passport-preview" aria-labelledby="project-preview-title">
          <span className="kicker">04 / PRIVATE PROJECT PREVIEW</span>
          <h2 id="project-preview-title">{draft.title.trim()||"YOUR PROJECT TITLE"}</h2>
          <p>{draft.summary.trim()||"Your short description will appear here."}</p>
          <dl><div><dt>Category</dt><dd>{cats.find(([id])=>id===draft.category)?.[1]||"Choose a category"}</dd></div>
            <div><dt>Access</dt><dd>{draft.freeToUse?"Free to use":"Not marked free to use"}</dd></div>
            <div><dt>Primary destination</dt><dd>{demo?"Hosted experience · "+demo.hostname:source?"View source · "+source.hostname:"No valid destination yet"}</dd></div>
            <div><dt>License</dt><dd>{draft.license?.trim()||"Not specified"}</dd></div>
          </dl>
          <details className="project-preview-disclosures"><summary>Preview description and credits</summary>
            <h3>Full description</h3><p>{draft.description.trim()||"No full description yet."}</p>
            <h3>AI involvement</h3><p>{draft.aiDisclosure.trim()||"Add your AI disclosure before submitting."}</p>
            <h3>Human work and credits</h3><p>{draft.humanContribution.trim()||"Add your actual contribution and credits."}</p>
          </details>
          <p className="member-caption">Not a public listing. This preview includes unsaved edits; only a saved revision can go to staff review. Private family or contact information must stay out of the project passport.</p>
        </section>
      </div>
      {canEdit&&<p id="draft-save-state" className="draft-save-state" role="status">{!project?"Create a private draft before submitting.":dirty?"You have unsaved changes. Save them before submitting for review.":"Your displayed draft matches the confirmed saved revision."}</p>}
      <div className="draft-actions">
        {canEdit&&<button type="submit" className="button primary" disabled={busy}>{busy?"WORKING…":project?"SAVE DRAFT":"CREATE PRIVATE DRAFT"}</button>}
        {project&&canEdit&&<button type="button" className="button secondary" disabled={!canSubmit} aria-describedby="draft-save-state" onClick={submit}>SUBMIT FOR STAFF REVIEW</button>}
        {refreshRequired&&<button type="button" className="button secondary" disabled={busy} onClick={()=>window.location.reload()}>RELOAD SAVED PROJECT</button>}
        {refreshRequired&&<span className="member-caption">Reload to verify the current server revision before editing or submitting. Unsaved edits will be discarded.</span>}
        {project&&!editable(status)&&<span className="member-caption">Locked while in review or after publication. Staff must request changes before further editing.</span>}
      </div>
      {notice&&<p className="draft-notice" role="status">{notice}</p>}
      {error&&<p className="member-error" role="alert">{error}</p>}
      <p className="member-caption">Server-side rules enforce ownership, revisions, submission criteria and moderation. Staff powers are independent of member XP.</p>
    </form>
    {reviewHistory.length>0&&<section className="member-panel draft-history"><span className="kicker">STAFF REVIEW RECORD</span>
      {reviewHistory.map((event,i)=><article key={i}><strong>{event.action.replaceAll("_"," ").toUpperCase()}</strong><small>{event.created_at}</small><p>{event.reason||"No reason given."}</p></article>)}
    </section>}
  </>;
}
