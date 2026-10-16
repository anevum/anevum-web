import {Link} from "react-router-dom";
import {type FormEvent,useState} from "react";
import {useNavigate} from "react-router-dom";
import {canonicalAuthClient,canonicalMethods} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const METHODS=[
 {key:"google",name:"Google",initial:"G",caption:"Verified Google account"},
 {key:"email",name:"Email code",initial:"@",caption:"Passwordless verification"},
 {key:"github",name:"GitHub",initial:"GH",caption:"Developer sign-in"},
 {key:"passkey",name:"Passkey",initial:"PK",caption:"Secure device unlock • in development"},
 {key:"microsoft",name:"Microsoft",initial:"MS",caption:"Microsoft account"},
 {key:"apple",name:"Apple",initial:"AP",caption:"Apple ID"}
] as const;

/** Phase 1 only: no Creator OTP hand-off or cross-origin Google redirect.
 * A disabled provider is not a signup button. All availability is attested
 * by the SAME Better Auth backend that handles the subsequent callback.
 */
export function Phase1JoinPage(){
 const navigate=useNavigate();
 const capability=useResource(canonicalMethods,[]);
 const [email,setEmail]=useState("");
 const [otp,setOtp]=useState("");
 const [codeSent,setCodeSent]=useState(false);
 const [notice,setNotice]=useState("");
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const ready=capability.state==="ready"&&(capability.data.registration==="invite-only"||capability.data.registration==="open");
 const emailReady=ready&&capability.data.methods.email.available===true;
 const socialReady=(key:string)=>ready&&["google","github","apple","microsoft"].includes(key)&&capability.data.methods[key as "google"|"github"|"apple"|"microsoft"]?.available===true;
 const member=session?.user;
 async function startSocial(provider:"google"|"github"|"apple"|"microsoft"){
   if(!socialReady(provider)||busy)return;
   setBusy(true);setError("");
   try{
     const response=await canonicalAuthClient.signIn.social({provider,callbackURL:"/join"});
     if(response.error)throw Error("Social sign-in could not be started.");
   }catch{
     setError("Sign-in is currently unavailable. No account was created.");
   }finally{setBusy(false)}
 }
 async function submitEmail(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(!emailReady||busy)return;
   const normalized=email.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||normalized.length>254){
     setError("Enter a valid email address.");return;
   }
   setBusy(true);setError("");setNotice("");
   try{
     if(!codeSent){
       const result=await canonicalAuthClient.emailOtp.sendVerificationOtp({email:normalized,type:"sign-in"});
       if(result.error)throw Error("Email verification could not be started");
       setEmail(normalized);setCodeSent(true);setNotice("If delivery is available, an 8-digit code has been sent. Check your inbox.");
     }else{
       if(!/^\d{8}$/.test(otp))throw Error("Invalid code");
       const result=await canonicalAuthClient.signIn.emailOtp({email:normalized,otp,name:"ANEVUM MEMBER"});
       if(result.error)throw Error("Invalid or expired verification code");
       navigate("/member",{replace:true});
     }
   }catch{setError(codeSent?"Code verification failed. No replacement is sent automatically; tap SEND A NEW CODE to request one.":"Email verification is temporarily unavailable.");}
   finally{setBusy(false);}
 }
 async function requestReplacementCode(){
   if(!emailReady||busy||!codeSent)return;
   const normalized=email.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||normalized.length>254){
     setError("Enter a valid email address.");return;
   }
   setBusy(true);setError("");setNotice("");
   try{
     // A "resend" must actually contact the email service, not merely reset the form.
     // The server enforces both rate limits and eligibility without disclosing invite status.
     const result=await canonicalAuthClient.emailOtp.sendVerificationOtp({email:normalized,type:"sign-in"});
     if(result.error)throw Error("Replacement email code unavailable");
     setOtp("");
     setNotice("If delivery is available, a replacement code has been requested. Use the newest 8-digit code.");
   }catch{
     setError("Could not request a replacement code. If you have requested several, wait up to 10 minutes and retry.");
   }finally{setBusy(false);}
 }
 function resetCode(){setCodeSent(false);setOtp("");setNotice("");setError("");}
 return <section className="join-experience av12-phase1-join" aria-labelledby="phase1-join-title">
   <img className="join-world-art" src={import.meta.env.BASE_URL+"assets/cinematic/hero/skyward-city.webp"}
     alt="" aria-hidden="true" draggable={false}/>
   <div className="join-story">
     <div className="join-orbit-art" aria-hidden="true"><OrbitalMark/></div>
     <p className="kicker">ANEVUM / THE MEMBER NETWORK</p>
     <h1 id="phase1-join-title">ENTER THE<br/><em>CONTINUANCE.</em></h1>
     <p>Discover new worlds, share what you make, and find your people. Your free account is the beginning.</p>
     <div className="join-chapters" aria-label="Three-step membership">
       <div><span>01</span><strong>Join</strong><small>Enter your email.</small></div>
       <div><span>02</span><strong>Verify</strong><small>Confirm your eight-digit code.</small></div>
       <div><span>03</span><strong>Belong</strong><small>Choose your name and enter the community.</small></div>
     </div>
   </div>
   <div className="join-panel">
     <div className="join-panel-top"><span className="kicker">ANEVUM / MEMBER ACCESS</span>
       <span className="join-state" role="status">
         {capability.state==="loading"||isPending?"VERIFYING SERVICE":
           ready?(capability.data.registration==="open"?"OPEN REGISTRATION":"INVITATION BETA"):"REGISTRATION CLOSED"}
       </span>
     </div>
     {member&&ready?<div className="join-return">
       <h2>WELCOME BACK.</h2>
       <p>You have a verified ANEVUM member session. Your profile is private until you publish it.</p>
       <div className="join-identity"><span className="join-identity-avatar" aria-hidden="true">◈</span>
         <div><strong>{member.name||"ANEVUM MEMBER"}</strong><small>CANONICAL MEMBER SESSION</small></div></div>
       <Link className="button primary join-main-action" to="/member">OPEN MY PROFILE <span aria-hidden="true">↗</span></Link>
     </div>:<>
       <h2>{codeSent?"CHECK YOUR INBOX.":"YOUR STORY STARTS HERE."}</h2>
       <p className="join-lead">{codeSent?"Enter the latest eight-digit code sent to your email.":"One email, one verification, and you are in. Membership is free."}</p>
       {ready&&!emailReady&&<p role="status" className="join-service-note">Email sign-in is temporarily unavailable.</p>}
       {ready&&(["google","github","apple","microsoft"] as const).some(socialReady)&&<div className="join-methods" aria-label="Other available sign-in methods">
         {METHODS.filter(method=>method.key!=="email"&&socialReady(method.key)).map(method=><button
           key={method.key} className="join-method join-method-ready" type="button"
           onClick={()=>void startSocial(method.key as "google"|"github"|"apple"|"microsoft")} disabled={busy}>
           <span className="join-method-symbol" aria-hidden="true">{method.initial}</span>
           <span className="join-method-copy"><strong>Continue with {method.name}</strong></span>
         </button>)}
       </div>}
       {emailReady&&<form className="av12-email-entry" onSubmit={event=>void submitEmail(event)}>
         <label htmlFor="anevum-email">{codeSent?"VERIFICATION SENT TO":"YOUR EMAIL ADDRESS"}</label>
         <input id="anevum-email" type="email" autoComplete="email" placeholder="you@example.com" value={email}
           onChange={event=>{setEmail(event.target.value);if(codeSent)resetCode();}}
           disabled={busy||codeSent} required maxLength={254}/>
         {codeSent&&<>
           <label htmlFor="anevum-otp">Verification code</label>
           <input id="anevum-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
             pattern="[0-9]{8}" minLength={8} maxLength={8} value={otp}
             onChange={event=>setOtp(event.target.value.replace(/\D/g,"").slice(0,8))}
             disabled={busy} placeholder="8-digit code" required/>
           <small className="av12-email-guidance">Use the latest code. It expires after a short time. We will never ask for it in chat.</small>
           <button type="button" className="av12-email-reset" onClick={()=>void requestReplacementCode()} disabled={busy}>
             {busy?"REQUESTING…":"SEND A NEW CODE"}
           </button>
           <button type="button" className="av12-email-reset" onClick={resetCode} disabled={busy}>USE A DIFFERENT EMAIL</button>
         </>}
         <button type="submit" className="av12-email-submit" disabled={busy}>
           {busy?"WORKING…":codeSent?"VERIFY & CONTINUE":"CONTINUE WITH EMAIL"}
         </button>
         {notice&&<p role="status">{notice}</p>}
       </form>}
       <p className="join-service-note" role="status">{ready?
         capability.data.registration==="open"?"Registration is open.":"Early access is currently limited to invited accounts.":
         "Registration is not yet activated. The public catalogue remains available."}</p>
       {error&&<p role="alert" className="av12-join-error">{error}</p>}
       <Link className="join-guest-action" to="/discover">EXPLORE AS A GUEST <span aria-hidden="true">↗</span></Link>
     </>}
     <p className="join-security">Your profile starts private. You choose what others can see.</p>
   </div>
 </section>;
}
