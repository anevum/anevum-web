import {useState} from "react";
import {memberHealth,memberMe,memberSetFollowing,MemberApiError} from "../lib/member-api";
import {useResource} from "../lib/useResource";

type Access = "closed"|"guest"|"self"|"member";

export function CreatorFollowPanel({
  handle,followers,viewerFollows
}:{handle:string;followers:number;viewerFollows:boolean}){
  const access=useResource<Access>(async signal=>{
    try{
      const health=await memberHealth(signal);
      if(health.status!=="ok")return "closed";
      const {member}=await memberMe(signal);
      return member.handle===handle?"self":"member";
    }catch(error){
      return error instanceof MemberApiError&&error.status===401?"guest":"closed";
    }
  },[handle]);
  const [verified,setVerified]=useState({followers,viewerFollows});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function change(){
    if(busy)return;
    setBusy(true);setMessage("");setError("");
    try{
      const saved=await memberSetFollowing(handle,!verified.viewerFollows);
      setVerified({followers:saved.followers,viewerFollows:saved.viewerFollows});
      setMessage(saved.viewerFollows?"Creator added to your private following list.":"Creator removed from your following list.");
    }catch(e){
      setError(e instanceof MemberApiError?e.message:"Could not update your following list.");
    }finally{setBusy(false);}
  }

  return <section className="portal-follow-panel" aria-label="Creator follows">
    <div><span className="kicker">CREATOR NETWORK / STAGING</span>
      <p role="status"><strong>{verified.followers.toLocaleString()}</strong> {verified.followers===1?"FOLLOWER":"FOLLOWERS"}</p>
    </div>
    {access.state==="ready"&&access.data==="member"&&
      <button type="button" className="button secondary" disabled={busy}
        aria-pressed={verified.viewerFollows} onClick={change}>
        {busy?"UPDATING…":verified.viewerFollows?"FOLLOWING ✓":"FOLLOW CREATOR"}
      </button>}
    {access.state==="ready"&&access.data==="guest"&&<p className="member-caption">Creator follows are currently limited to invited members.</p>}
    {access.state==="ready"&&access.data==="self"&&<p className="member-caption">This is your own creator channel.</p>}
    {(access.state==="error"||(access.state==="ready"&&access.data==="closed"))&&
      <p className="member-caption">Following is not available on this host.</p>}
    {message&&<p role="status" className="engagement-success">{message}</p>}
    {error&&<p role="alert" className="member-error">{error}</p>}
  </section>;
}
