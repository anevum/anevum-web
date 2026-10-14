import {Link} from "react-router-dom";
import {useState} from "react";
import {memberFollowing,memberSetFollowing,MemberApiError} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {EmptyState,ErrorState,LoadingState} from "../components/States";

export function MemberFollowingPage(){
  const data=useResource(memberFollowing,[]);
  const [removed,setRemoved]=useState<string[]>([]);
  const [pending,setPending]=useState<string|null>(null);
  const [error,setError]=useState("");

  async function unfollow(handle:string){
    if(pending)return;
    setPending(handle);setError("");
    try{
      const result=await memberSetFollowing(handle,false);
      if(!result.viewerFollows)setRemoved(prev=>prev.includes(handle)?prev:[...prev,handle]);
    }catch(e){
      setError(e instanceof MemberApiError?e.message:"Could not update your following list.");
    }finally{setPending(null);}
  }

  return <>
    <section className="member-title"><span className="kicker">YOUR PRIVATE CREATOR NETWORK</span>
      <h1>FOLLOWING.</h1><p>Creators you chose to follow. This list belongs to your account and does not confer XP or voting power.</p>
    </section>
    {data.state==="loading"&&<LoadingState label="Loading your followed creators"/>}
    {data.state==="error"&&<ErrorState title="FOLLOWING UNAVAILABLE" detail="Your private creator list could not be loaded from staging."/>}
    {data.state==="ready"&&(()=>{
      const items=data.data.items.filter(x=>!removed.includes(x.handle));
      return items.length?
        <section className="member-follow-grid" aria-label="Followed creator channels">
          {items.map(creator=><article className="member-panel" key={creator.handle}>
            <span className="kicker">CREATOR CHANNEL</span>
            <h2><Link to={"/creators/"+encodeURIComponent(creator.handle)}>{creator.displayName}</Link></h2>
            <p>@{creator.handle}</p>
            <div className="member-actions"><Link className="button secondary" to={"/creators/"+encodeURIComponent(creator.handle)}>OPEN CHANNEL</Link>
              <button className="button secondary" type="button" disabled={pending!==null} onClick={()=>unfollow(creator.handle)}>{pending===creator.handle?"UPDATING…":"UNFOLLOW"}</button>
            </div>
          </article>)}
        </section>:
        <EmptyState title="NO FOLLOWED CREATORS YET" detail="Find an original creator whose work you want to follow. Your list starts empty."/>;
    })()}
    {data.state==="ready"&&data.data.hasMore&&<p className="member-caption">Showing the first 100 followed creators. Additional results are not displayed in this staging version.</p>}
    {error&&<p role="alert" className="member-error">{error}</p>}
    <Link className="button secondary" to="/creators">FIND CREATORS</Link>
  </>;
}
