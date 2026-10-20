import { Link } from "react-router-dom";
import { memberLibrary,memberSetSaved,MemberApiError } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

export function MemberLibraryPage(){
  const resources=useResource(memberLibrary,[]);
  const [removed,setRemoved]=useState<string[]>([]);
  const [pending,setPending]=useState<string|null>(null);
  const [error,setError]=useState("");
  async function remove(id:string){
    if(pending)return;
    setPending(id);setError("");
    try{await memberSetSaved(id,false);setRemoved(previous=>previous.concat(id));}
    catch(e){setError(e instanceof MemberApiError?e.message:"Could not update the saved library.");}
    finally{setPending(null);}
  }
  return <>
    <section className="member-title"><span className="kicker">PRIVATE MEMBER COLLECTION</span><h1>YOUR LIBRARY.</h1><p>Real published projects you saved. Hidden or withdrawn work is automatically excluded by the server.</p></section>
    {resources.state==="loading"&&<LoadingState label="Loading your saved projects"/>}
    {resources.state==="error"&&<ErrorState title="LIBRARY UNAVAILABLE" detail="Your private library could not be read from the authenticated staging service."/>}
    {resources.state==="ready"&&(()=>{
      const items=resources.data.items.filter(item=>!removed.includes(item.id));
      return items.length?
        <section className="member-library-grid">{items.map(project=><article key={project.id} className="member-panel">
          <span className="kicker">{project.category.toUpperCase()}</span>
          <h2><Link to={"/projects/"+encodeURIComponent(project.id)}>{project.title}</Link></h2>
          <p>{project.summary}</p>
          <div className="member-library-actions"><Link to={"/creators/"+encodeURIComponent(project.creatorHandle)}>@{project.creatorHandle}</Link><button type="button" disabled={pending===project.id} onClick={()=>remove(project.id)}>{pending===project.id?"UPDATING…":"REMOVE SAVED"}</button></div>
        </article>)}</section>:
        <EmptyState title="NO SAVED PROJECTS YET" detail="Explore published work and save the projects that you want to return to."/>;
    })()}
    {error&&<p role="alert" className="member-error">{error}</p>}
    <Link className="button secondary" to="/discover">EXPLORE PROJECTS</Link>
  </>;
}
