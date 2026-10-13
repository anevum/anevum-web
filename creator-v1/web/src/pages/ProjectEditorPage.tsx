import { FormEvent,useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import {
  memberCreateProject,memberProject,memberSubmitProject,memberUpdateProject,
  MemberApiError,type MemberProject,type ProjectDraft
} from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { ErrorState,LoadingState } from "../components/States";
import { useMemberContext } from "../components/MemberGate";

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
  const [revision,setRevision]=useState(project?.revision||0);
  const [status,setStatus]=useState(project?.status||"new");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const canEdit=!project||editable(status);
  const canSubmit=Boolean(project)&&canEdit&&Boolean(draft.sourceUrl||draft.demoUrl)&&
    draft.aiDisclosure.trim().length>=10&&draft.humanContribution.trim().length>=10;
  const setText=(key:TextKey,value:string)=>{setDraft(current=>({...current,[key]:value}));setError("");setNotice("");};
  const field=(key:TextKey,label:string,max:number,opts:{rows?:number;required?:boolean;hint?:string;min?:number;type?:string}={})=>{
    const value=draft[key]??"";
    const props={id:"draft-"+key,name:key,value,disabled:!canEdit||busy,maxLength:max,minLength:opts.min||0,required:opts.required,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setText(key,e.target.value)};
    return <div className="draft-field" key={key}><label htmlFor={props.id}>{label}</label>
      {opts.rows?<textarea {...props} rows={opts.rows}/>:<input {...props} type={opts.type||"text"}/>}
      {opts.hint&&<p className="draft-hint">{opts.hint}</p>}
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
        setNotice("Draft saved to your own staging account. Nothing has been published.");
      }
    }catch(e){setError(e instanceof MemberApiError?e.message:"Unable to save your draft. Check your inputs and try again.");}
    finally{setBusy(false);}
  }
  async function submit(){
    if(!project||!canSubmit||busy)return;
    if(!window.confirm("Send this project to staff for moderation? It will not be published automatically."))return;
    setBusy(true);setError("");setNotice("");
    try {
      const result=await memberSubmitProject(project.id,revision);
      setRevision(result.revision);setStatus(result.status);
      setNotice("Submitted for staff review. Your project remains private until separately approved.");
    }catch(e){setError(e instanceof MemberApiError?e.message:"Unable to submit. Please refresh your draft and try again.");}
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
          <label className="draft-checkbox"><input type="checkbox" checked={draft.freeToUse} disabled={!canEdit||busy} onChange={e=>setDraft(d=>({...d,freeToUse:e.target.checked}))}/>Free to use</label>
        </div>
        <div className="draft-column"><span className="kicker">02 / RIGHTS + DESTINATIONS</span>
          {field("demoUrl","Hosted demo or usable experience URL",1500,{type:"url",hint:"Optional HTTPS link. The experience remains creator-hosted."})}
          {field("sourceUrl","Public source URL",1500,{type:"url",hint:"Optional HTTPS link; a public repo doesn't necessarily have an open license."})}
          {field("license","Project license",80,{hint:"Only claim rights you actually hold."})}
          {field("aiDisclosure","AI involvement",1200,{rows:4,hint:"A meaningful disclosure is required before moderation submission, even if no AI was used."})}
          {field("humanContribution","Human work and credits",1200,{rows:4,hint:"At least 10 characters describing actual human contributions are required to submit."})}
        </div>
      </div>
      <div className="draft-actions">
        {canEdit&&<button type="submit" className="button primary" disabled={busy}>{busy?"WORKING…":project?"SAVE DRAFT":"CREATE PRIVATE DRAFT"}</button>}
        {project&&canEdit&&<button type="button" className="button secondary" disabled={busy||!canSubmit} onClick={submit}>SUBMIT FOR STAFF REVIEW</button>}
        {project&&!canEdit&&<span className="member-caption">Locked while in review or after publication. Staff must request changes before further editing.</span>}
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
