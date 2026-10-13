import { Link } from "react-router-dom";
import { useMemberContext } from "../components/MemberGate";
import { memberProjects } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

export function MemberProjectsPage(){
  const {member}=useMemberContext();
  const projects=useResource(member.handle?memberProjects:async()=>({projects:[]}),[member.handle]);
  return <>
    <section className="member-title"><span className="kicker">CREATOR STUDIO / YOUR WORK</span><h1>MY PROJECTS.</h1><p>Your drafts, submissions and published releases. Moderation is handled separately by authorized staff.</p></section>
    {!member.handle?<section className="member-panel"><h2>FINISH YOUR CREATOR PROFILE</h2><p>A unique handle is required before your first project.</p><a className="button primary" href="/api/v1/member/join">COMPLETE PROFILE</a></section>:<>
      <div className="member-toolbar"><Link className="button primary" to="/create/new">START A PROJECT DRAFT</Link><span className="member-caption">DRAFTS STAY PRIVATE UNTIL STAFF APPROVAL</span></div>
      {projects.state==="loading"&&<LoadingState label="Loading your own projects"/>}
      {projects.state==="error"&&<ErrorState title="YOUR PROJECTS ARE UNAVAILABLE" detail="The authenticated staging service could not return this member's project list."/>}
      {projects.state==="ready"&&(projects.data.projects.length?
        <div className="member-project-list">{projects.data.projects.map(project=><article className="member-panel" key={project.id}>
          <div className="member-project-heading"><div><span className="kicker">{project.category.toUpperCase()}</span><h2>{project.title}</h2></div><span className="member-status">{project.status.replaceAll("_"," ").toUpperCase()}</span></div>
          <p>{project.summary}</p>
          <div className="member-project-footer"><span>REVISION {project.revision}</span><Link to={"/create/"+encodeURIComponent(project.id)}>{["draft","changes_requested"].includes(project.status)?"EDIT DRAFT":"VIEW SUBMISSION"} →</Link></div>
        </article>)}</div>:
        <EmptyState title="YOUR FIRST PROJECT IS WAITING." detail="Create a private draft, refine its presentation and send it to staff for review when ready."/>)}
    </>}
  </>;
}
