import {Link} from "react-router-dom";
import {useState} from "react";
import {canonicalAuthClient,canonicalReady} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const METHODS=[
 {key:"google",name:"Google",initial:"G",caption:"Verified Google account • invitation required"},
 {key:"email",name:"Email code",initial:"@",caption:"Passwordless email • not enabled on canonical accounts"},
 {key:"github",name:"GitHub",initial:"GH",caption:"Developer sign-in • awaiting security review"},
 {key:"passkey",name:"Passkey",initial:"PK",caption:"Secure device unlock • in development"},
 {key:"microsoft",name:"Microsoft",initial:"MS",caption:"Account provider • planned"},
 {key:"apple",name:"Apple",initial:"AP",caption:"Apple ID • planned"}
] as const;

/** Phase 1 only: no Creator OTP hand-off or cross-origin Google redirect.
 * A disabled provider is not a signup button. All availability is attested
 * by the SAME Better Auth backend that handles the subsequent callback.
 */
export function Phase1JoinPage(){
 const capability=useResource(canonicalReady,[]);
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const ready=capability.state==="ready"&&capability.data===true;
 const member=session?.user;
 async function startGoogle(){
   if(!ready||busy)return;
   setBusy(true);setError("");
   try{
     const response=await canonicalAuthClient.signIn.social({provider:"google",callbackURL:"/member"});
     if(response.error)throw Error("Google sign-in could not be started.");
   }catch{
     setError("Sign-in is currently unavailable. No account was created.");
   }finally{setBusy(false)}
 }
 return <section className="join-experience av12-phase1-join" aria-labelledby="phase1-join-title">
   <img className="join-world-art" src={import.meta.env.BASE_URL+"assets/cinematic/hero/skyward-city.webp"}
     alt="" aria-hidden="true" draggable={false}/>
   <div className="join-story">
     <div className="join-orbit-art" aria-hidden="true"><OrbitalMark/></div>
     <p className="kicker">ANEVUM / THE MEMBER NETWORK</p>
     <h1 id="phase1-join-title">YOUR OWN<br/><em>UNIVERSE.</em></h1>
     <p>Claim your place in a community of creators, builders and explorers.
       Keep your profile, projects and discoveries together. Membership will remain free.</p>
     <div className="join-chapters">
       <div><span>01</span><strong>Enter</strong><small>Verify your account on the canonical member service.</small></div>
       <div><span>02</span><strong>Become</strong><small>Claim a unique handle and establish your private profile.</small></div>
       <div><span>03</span><strong>Connect</strong><small>Publish your world only when you decide it is ready.</small></div>
     </div>
   </div>
   <div className="join-panel">
     <div className="join-panel-top"><span className="kicker">IDENTITY PORTAL / PHASE 1</span>
       <span className="join-state" role="status">
         {capability.state==="loading"||isPending?"VERIFYING SERVICE":
           ready?"INVITATION BETA":"REGISTRATION CLOSED"}
       </span>
     </div>
     {member&&ready?<div className="join-return">
       <h2>WELCOME BACK.</h2>
       <p>You have a verified ANEVUM member session. Your profile is private until you publish it.</p>
       <div className="join-identity"><span className="join-identity-avatar" aria-hidden="true">◈</span>
         <div><strong>{member.name||"ANEVUM MEMBER"}</strong><small>CANONICAL MEMBER SESSION</small></div></div>
       <Link className="button primary join-main-action" to="/member">OPEN MY PROFILE <span aria-hidden="true">↗</span></Link>
     </div>:<>
       <h2>THE NEXT CHAPTER.</h2>
       <p className="join-lead">Free community membership. No payment, brokerage account, or project required.</p>
       <div className="join-methods" aria-label="Member sign-in methods">
         {METHODS.map(method=><div className={"join-method"+(method.key==="google"&&ready?" join-method-ready":"")} key={method.key}>
           <span className="join-method-symbol" aria-hidden="true">{method.initial}</span>
           <div className="join-method-copy"><strong>{method.name}</strong><small>{method.caption}</small></div>
           {method.key==="google"&&ready?
             <button className="join-method-open" type="button" onClick={()=>void startGoogle()} disabled={busy}>
               {busy?"OPENING":"CONTINUE"} <span aria-hidden="true">↗</span>
             </button>:
             <span className="join-method-unavailable">NOT ENABLED</span>}
         </div>)}
       </div>
       <p className="join-service-note" role="status">{ready?
         "Only invited, verified Google identities can register in this staging beta.":
         "Registration is not yet activated. The public catalogue remains available."}</p>
       {error&&<p role="alert" className="av12-join-error">{error}</p>}
       <Link className="join-guest-action" to="/discover">EXPLORE AS A GUEST <span aria-hidden="true">↗</span></Link>
     </>}
     <p className="join-security">Personal profiles start private. You choose when to show them.
       Joining never unlocks staff controls, private creator drafts, or RHEN brokerage access.</p>
   </div>
 </section>;
}
