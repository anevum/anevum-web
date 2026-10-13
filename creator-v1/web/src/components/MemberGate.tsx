import { Link, Outlet, NavLink, useOutletContext } from "react-router-dom";
import {useState} from "react";
import { memberHealth,memberMe,MemberApiError,type MemberHealth,type MemberIdentity } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { LoadingState } from "./States";
import { OrbitalMark } from "./OrbitalMark";

export interface MemberContext {
 member:MemberIdentity;
 health:MemberHealth;
 onProfileSaved:(profile:Pick<MemberIdentity,"handle"|"displayName"|"bio">)=>void;
}

export function useMemberContext():MemberContext {
  return useOutletContext<MemberContext>();
}
export function MemberGate(){
  const session=useResource(async signal=>{
    const health=await memberHealth(signal);
    try{
      const {member}=await memberMe(signal);
      return {health,member};
    }catch(error){
      if(error instanceof MemberApiError&&error.status===401)return {health,member:null};
      throw error;
    }
  },[]);
  // Only update the local displayed identity after the existing Member Worker
  // confirms a successful, authorized profile write for this exact account.
  const [confirmedProfile,setConfirmedProfile]=useState<{
    id:string; handle:string; displayName:string; bio:string;
  }|null>(null);
  if(session.state==="loading")return <LoadingState label="Checking member access"/>;
  if(session.state==="error")return <section className="member-gate" role="status">
    <div className="member-gate-mark"><OrbitalMark/></div>
    <span className="kicker">CREATOR V1 / CONTROLLED ACCESS</span>
    <h1>YOUR WORKSPACE IS TAKING SHAPE.</h1>
    <p>Member profiles, saved projects and creator submissions are in invited testing. You can explore ANEVUM now; open registration and publishing will follow when they're ready.</p>
    <div className="member-actions"><Link className="button primary" to="/discover">EXPLORE PUBLISHED WORK</Link><Link className="button secondary" to="/status">BUILD STATUS</Link></div>
  </section>;
  if(!session.data.member)return <section className="member-gate">
    <div className="member-gate-mark"><OrbitalMark/></div>
    <span className="kicker">CREATOR V1 / INVITED TESTING</span>
    <h1>YOUR PLACE IN THE NETWORK.</h1>
    <p>Member accounts are in private staging. A real invitation and verified email are required; public registration is not yet open.</p>
    <div className="member-actions">
      {session.data.health.signupEnabled&&<a className="button primary" href="/api/v1/member/join">INVITED MEMBER SIGN-IN</a>}
      <Link className="button secondary" to="/discover">EXPLORE AS A GUEST</Link>
    </div>
  </section>;
  const activeMember=confirmedProfile?.id===session.data.member.id
    ? {...session.data.member,...confirmedProfile}
    : session.data.member;
  return <div className="member-shell">
    <header className="member-header">
      <div><span className="kicker">PRIVATE MEMBER WORKSPACE / STAGING</span><strong>{activeMember.displayName||activeMember.handle||"YOUR ACCOUNT"}</strong></div>
      <nav aria-label="Member workspace navigation">
        <NavLink to="/account">ACCOUNT</NavLink>
        <NavLink to="/account/edit">EDIT PROFILE</NavLink>
        <NavLink to="/create">MY PROJECTS</NavLink>
        <NavLink to="/library">LIBRARY</NavLink>
      </nav>
    </header>
    <Outlet context={{
      member:activeMember,
      health:session.data.health,
      onProfileSaved:(profile:Pick<MemberIdentity,"handle"|"displayName"|"bio">)=>
        setConfirmedProfile({id:activeMember.id,handle:profile.handle||"",displayName:profile.displayName||"",bio:profile.bio})
    }}/>
  </div>;
}
