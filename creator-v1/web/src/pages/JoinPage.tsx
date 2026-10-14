import {Link} from "react-router-dom";
import {memberSignInCapabilities} from "../lib/member-api";
import {useResource} from "../lib/useResource";
export function JoinPage(){
 const result=useResource(memberSignInCapabilities,[]);
 const capabilities=result.state==="ready"?result.data:null;
 const emailReady=capabilities?.methods.email.available===true;
 return <section className="join-experience">
  <header><span className="kicker">ANEVUM / MEMBERSHIP</span><h1>MAKE YOUR MARK.</h1><p>Join the community, build your profile, discover projects and share your work.</p></header>
  <div className="join-panel"><h2>YOUR ANEVUM ACCOUNT</h2><p>Choose a sign-in method.</p>
  {(["Google","GitHub","Passkey","Microsoft","Apple"] as const).map(name=><div className="join-method" key={name}><strong>{name}</strong><span>COMING LATER</span></div>)}
  <div className="join-method"><strong>Email verification code</strong>{emailReady?<a href="/api/v1/member/join">CONTINUE</a>:<span>INVITATION ONLY</span>}</div>
  <p role="status">{capabilities?.registration==="invite-only"?"Invitation-only testing.":"Public registration is not yet open."}</p>
  <Link to="/discover">Explore without an account</Link></div>
 </section>;
}