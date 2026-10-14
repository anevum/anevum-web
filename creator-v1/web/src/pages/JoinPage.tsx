import {Link,useLocation} from "react-router-dom";
import {memberMe,memberSignInCapabilities,MemberApiError,type MemberLoginMethod} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const METHODS: ReadonlyArray<{id:MemberLoginMethod;label:string;detail:string;symbol:string}>=[
  {id:"email",label:"Email code",detail:"Passwordless verification to your inbox",symbol:"@"},
  {id:"google",label:"Google",detail:"Use your verified Google identity",symbol:"G"},
  {id:"github",label:"GitHub",detail:"For makers, contributors and developers",symbol:"GH"},
  {id:"passkey",label:"Passkey",detail:"Your device's secure unlock",symbol:"PK"},
  {id:"microsoft",label:"Microsoft",detail:"Personal Microsoft accounts",symbol:"MS"},
  {id:"apple",label:"Apple",detail:"Apple ID and private email relay",symbol:"AP"}
];

/**
 * Only a method confirmed by the SAME origin-bound member backend is usable.
 * The archived Better Auth login must not be mistaken for a Creator V1 session.
 */
export function JoinPage(){
  const inAtlas=useLocation().pathname.startsWith("/atlas/");
  const result=useResource(async signal=>{
    const [capabilities,member]=await Promise.all([
      memberSignInCapabilities(signal).catch(()=>null),
      memberMe(signal).then(({member})=>member).catch(error=>{
        if(error instanceof MemberApiError && [401,403,404,503].includes(error.status))return null;
        throw error;
      })
    ]);
    return {capabilities,member};
  },[]);
  const member=result.state==="ready"?result.data.member:null;
  const capabilities=result.state==="ready"?result.data.capabilities:null;
  const emailReady=capabilities?.methods.email.available===true &&
    capabilities.methods.email.path==="/api/v1/member/join";
  const status=result.state==="loading"?"CHECKING ACCESS":
    result.state==="error"?"SERVICE UNAVAILABLE":
    capabilities?.registration==="invite-only"?"INVITATION ONLY":
    capabilities?.registration==="open"?"REGISTRATION OPEN":"REGISTRATION CLOSED";
  return <section className="join-experience" aria-labelledby="join-title">
    <img className="join-world-art" src={import.meta.env.BASE_URL+"assets/cinematic/hero/skyward-city.webp"} alt="" aria-hidden="true" draggable={false}/>
    <div className="join-story">
      <span className="join-orbit-art" aria-hidden="true"><OrbitalMark/></span>
      <p className="kicker">ANEVUM / CREATOR IDENTITY</p>
      <h1 id="join-title">YOUR OWN<br/><em>UNIVERSE.</em></h1>
      <p>Discover worlds. Follow people who make things. Keep your own collection, publish approved work and build a creator identity.</p>
      <div className="join-chapters" aria-label="Your first steps">
        <div><span>01</span><strong>Enter the network</strong><small>Start with a verified account. Browsing never requires one.</small></div>
        <div><span>02</span><strong>Build your profile</strong><small>Claim a unique handle and choose how you introduce yourself.</small></div>
        <div><span>03</span><strong>Make it yours</strong><small>Save projects and contribute when your member features are enabled.</small></div>
      </div>
    </div>
    <div className="join-panel">
      <div className="join-panel-top"><span className="kicker">MEMBER PORTAL / 001</span><span className="join-state" role="status">{status}</span></div>
      {member?<div className="join-return">
        <h2>WELCOME BACK.</h2>
        <p>Your verified member session is active.</p>
        <div className="join-identity"><span className="join-identity-avatar" aria-hidden="true">◈</span>
          <div><strong>{member.displayName||member.handle||"ANEVUM MEMBER"}</strong><small>{member.handle?"@"+member.handle:"PROFILE SETUP PENDING"}</small></div></div>
        <Link className="button primary join-main-action" to={member.handle?(inAtlas?"/atlas/account":"/account"):(inAtlas?"/atlas/account/edit":"/account/edit")}>
          {member.handle?"OPEN MY SPACE":"COMPLETE MY PROFILE"} <span aria-hidden="true">↗</span>
        </Link>
        <p className="join-help">Your existing profile, projects and XP remain attached to your verified account.</p>
      </div>:<>
        <h2>FIND YOUR WAY IN.</h2>
        <p className="join-lead">Membership is free. No brokerage account, payment or project is needed.</p>
        <div className="join-methods" aria-label="Sign-in methods">
          {METHODS.map(method=>{
            const available=method.id==="email" && emailReady;
            return <div key={method.id} className={"join-method"+(available?" join-method-ready":"")}>
              <span className="join-method-symbol" aria-hidden="true">{method.symbol}</span>
              <div className="join-method-copy"><strong>{method.label}</strong><small>{method.detail}</small></div>
              {available?<a className="join-method-open" href="/api/v1/member/join" aria-label="Continue with an email sign-in code">CONTINUE <span aria-hidden="true">↗</span></a>:
                <span className="join-method-unavailable">NOT ENABLED</span>}
            </div>;
          })}
        </div>
        <p className="join-service-note" role="status">{result.state==="loading"?"Checking real member-service availability…":
          result.state==="error"?"The member service could not be verified. No signup method is available.":
          emailReady?"Email access is restricted to approved invitations during testing.":
          "Public signups are closed on this site while identity integration is reviewed."}</p>
        <Link className="join-guest-action" to={inAtlas?"/atlas/discover":"/discover"}>EXPLORE AS A GUEST <span aria-hidden="true">↗</span></Link>
        <p className="join-more">Also under review: Discord, LinkedIn and Reddit identity options. Phone/SMS registration is deferred.</p>
      </>}
      <p className="join-security">Your sign-in never grants access to another member's account, staff controls or brokerage data. Other providers can be linked only through a future verified account-linking process.</p>
    </div>
  </section>;
}
