import {Link,useSearchParams} from "react-router-dom";
import {type FormEvent,useEffect,useRef,useState} from "react";
import {useNavigate} from "react-router-dom";
import {canonicalAuthClient,canonicalMethods} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";
import {ContinuanceEntryArtwork} from "../components/ContinuanceEntryArtwork";

const METHODS=[
 {key:"google",name:"Google",initial:"G",caption:"Verified Google account"},
 {key:"email",name:"Email code",initial:"@",caption:"Passwordless verification"},
 {key:"github",name:"GitHub",initial:"GH",caption:"Developer sign-in"},
 {key:"passkey",name:"Passkey",initial:"PK",caption:"Secure device unlock • in development"},
 {key:"microsoft",name:"Microsoft",initial:"MS",caption:"Microsoft account"},
 {key:"apple",name:"Apple",initial:"AP",caption:"Apple ID"}
] as const;

const JOIN_TIMEOUT_MS=15_000;
class AuthRequestTimeout extends Error{
 constructor(){super("Authentication request timed out");this.name="AuthRequestTimeout";}
}
class AuthRequestRejected extends Error{
 constructor(readonly status:number){super("Authentication request rejected");this.name="AuthRequestRejected";}
}
async function withJoinDeadline<T>(operation:()=>Promise<T>):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
   return await Promise.race([
     operation(),
     new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new AuthRequestTimeout()),JOIN_TIMEOUT_MS);})
   ]);
 }finally{
   if(timer!==undefined)clearTimeout(timer);
 }
}
function joinError(error:unknown,fallback:string):string{
 if(error instanceof AuthRequestTimeout)
   return "The connection took too long. A code may still arrive; check your inbox before retrying.";
 if(error instanceof AuthRequestRejected&&error.status===429)
   return "Too many sign-in attempts. Wait 10 minutes before requesting another code.";
 if(error instanceof AuthRequestRejected&&error.status>=500)
   return "The sign-in service is temporarily unavailable. Please try again shortly.";
 return fallback;
}

/** Phase 1 only: no Creator OTP hand-off or cross-origin Google redirect.
 * A disabled provider is not a signup button. All availability is attested
 * by the SAME Better Auth backend that handles the subsequent callback.
 */
export function Phase1JoinPage(){
 const navigate=useNavigate();
 const [searchParams]=useSearchParams();
 const oauthFailure=searchParams.get("error");
 const oauthFeedback=oauthFailure==="account_not_linked"
   ?"This sign-in method is not connected to your existing ANEVUM member account. Use your original sign-in method below, open your member page, and connect the provider under Connected Sign-in Methods."
   :oauthFailure==="access_denied"||oauthFailure==="oauth_access_denied"
   ?"Provider authorization was cancelled. Your ANEVUM account is unchanged."
   :oauthFailure
   ?"Your provider could not finish signing you in. Try your original method; your ANEVUM account is unchanged."
   :null;
 const [availabilityAttempt,setAvailabilityAttempt]=useState(0);
 const capability=useResource(canonicalMethods,[availabilityAttempt]);
 const [email,setEmail]=useState("");
 const [otp,setOtp]=useState("");
 const otpRef=useRef<HTMLInputElement>(null);
 const [codeSent,setCodeSent]=useState(false);
 const [notice,setNotice]=useState("");
 const {data:session}=canonicalAuthClient.useSession();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 // Focus after the visitor requests the code, never on page arrival.
 useEffect(()=>{if(codeSent)otpRef.current?.focus({preventScroll:true});},[codeSent]);
 const ready=capability.state==="ready"&&(capability.data.registration==="invite-only"||capability.data.registration==="open");
 // An unavailable database/auth service is not an intentional registration pause.
 // The server remains authoritative: these labels never unlock signup.
 const serviceUnavailable=capability.state==="error"||
   (capability.state==="ready"&&capability.data.registration==="closed"&&
    capability.data.availability!=="ready"&&capability.data.availability!=="closed");
 const emailReady=ready&&capability.data.methods.email.available===true;
 const socialReady=(key:string)=>ready&&["google","github","apple","microsoft"].includes(key)&&capability.data.methods[key as "google"|"github"|"apple"|"microsoft"]?.available===true;
 const member=session?.user;
 const requiresEmailVerification=Boolean(member?.id&&member.emailVerified!==true);
 const sessionEmail=typeof member?.email==="string"?member.email.trim().toLowerCase():"";
 const emailForVerification=requiresEmailVerification?sessionEmail:email;
 async function signOutUnverified(){
   if(busy)return;
   setBusy(true);setError("");
   try{
     const result=await withJoinDeadline(()=>canonicalAuthClient.signOut());
     if(result.error)throw Error("Sign-out failed");
     window.location.replace("/join");
   }catch{
     setError("Could not sign out. Please retry.");
     setBusy(false);
   }
 }
 async function startSocial(provider:"google"|"github"|"apple"|"microsoft"){
   if(!socialReady(provider)||busy||requiresEmailVerification)return;
   setBusy(true);setError("");
   try{
     const response=await withJoinDeadline(()=>canonicalAuthClient.signIn.social({provider,callbackURL:"/member",errorCallbackURL:"/join"}));
     if(response.error)throw Error("Social sign-in could not be started.");
   }catch{
     setError("Sign-in is currently unavailable. No account was created.");
   }finally{setBusy(false)}
 }
 async function submitEmail(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(!emailReady||busy)return;
   const normalized=emailForVerification.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||normalized.length>254){
     setError("Enter a valid email address.");return;
   }
   setBusy(true);setError("");setNotice("");
   try{
     if(!codeSent){
       const result=await withJoinDeadline(()=>canonicalAuthClient.emailOtp.sendVerificationOtp({email:normalized,type:"sign-in"}));
       if(result.error)throw new AuthRequestRejected(result.error.status);
       setEmail(normalized);setCodeSent(true);setNotice("If delivery is available, an 8-digit code has been sent. Check your inbox.");
     }else{
       if(!/^\d{8}$/.test(otp)){setError("Enter the complete eight-digit code from your email.");return;}
       const result=await withJoinDeadline(()=>canonicalAuthClient.signIn.emailOtp({email:normalized,otp,name:"ANEVUM MEMBER"}));
       if(result.error)throw new AuthRequestRejected(result.error.status);
       navigate("/member",{replace:true});
     }
   }catch(e){setError(joinError(e,codeSent?"Code verification failed. No replacement is sent automatically; tap SEND A NEW CODE to request one.":"Email verification is temporarily unavailable."));}
   finally{setBusy(false);}
 }
 async function requestReplacementCode(){
   if(!emailReady||busy||!codeSent)return;
   const normalized=emailForVerification.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||normalized.length>254){
     setError("Enter a valid email address.");return;
   }
   setBusy(true);setError("");setNotice("");
   try{
     // A "resend" must actually contact the email service, not merely reset the form.
     // The server enforces both rate limits and eligibility without disclosing invite status.
     const result=await withJoinDeadline(()=>canonicalAuthClient.emailOtp.sendVerificationOtp({email:normalized,type:"sign-in"}));
     if(result.error)throw new AuthRequestRejected(result.error.status);
     setOtp("");
     setNotice("If delivery is available, a replacement code has been requested. Use the newest 8-digit code.");
   }catch(e){
     setError(joinError(e,"Could not request a replacement code. If you have requested several, wait up to 10 minutes and retry."));
   }finally{setBusy(false);}
 }
 function resetCode(){setCodeSent(false);setOtp("");setNotice("");setError("");}
 return <section className="join-experience av12-phase1-join" aria-labelledby="phase1-join-title">
   <div className="av52-celestial-stage" aria-hidden="true"><ContinuanceEntryArtwork/></div>
   <div className="av52-stage-grain" aria-hidden="true"/>
   <div className="av52-stage-vignette" aria-hidden="true"/>
   <div className="join-story">
     <div className="join-orbit-art" aria-hidden="true"><OrbitalMark/></div>
     <div className="av52-entry-index" aria-hidden="true"><span>TRANSMISSION 001 / ANEVUM</span><i/></div>
     <p className="kicker">ANEVUM / THE MEMBER NETWORK</p>
     <h1 id="phase1-join-title">ENTER THE<br/><em>CONTINUANCE.</em></h1>
     <p className="av52-hero-copy">A home for things people make. Discover worlds, find your people, and leave something of your own.</p>
     <div className="av52-entry-counters" aria-hidden="true"><span><b>01</b> IDENTIFY</span><span><b>02</b> VERIFY</span><span><b>03</b> CREATE</span></div>
     <div className="join-chapters" aria-label="Three-step membership">
       <div><span>01</span><strong>Join</strong><small>Enter your email.</small></div>
       <div><span>02</span><strong>Verify</strong><small>Confirm your eight-digit code.</small></div>
       <div><span>03</span><strong>Belong</strong><small>Choose a permanent handle. Your profile starts private.</small></div>
     </div>
     <aside className="av123-member-promise" aria-label="What membership offers">
       <span className="av123-promise-label">ANEVUM / YOUR CONTINUANCE</span>
       <strong>Explore freely. Join when you're ready.</strong>
       <p>Your member space gives discoveries and creations a place to return to. Creator publishing requires separate review.</p>
       <div className="av123-promise-points"><span>Private member identity</span><span>Saved discoveries</span><span>Earned recognition</span></div>
       <Link to="/guide">Read the field guide <span aria-hidden="true">↗</span></Link>
     </aside>
   </div>
   <div className="join-panel">
     <div className="join-panel-top"><span className="kicker">ANEVUM / MEMBER ACCESS</span>
       <span className="join-state" role="status">
         {capability.state==="loading"?"CHECKING ACCESS":
           ready?(capability.data.registration==="open"?"OPEN REGISTRATION":"INVITATION BETA"):
           serviceUnavailable?"SERVICE UNAVAILABLE":"REGISTRATION PAUSED"}
       </span>
     </div>
     {member?.emailVerified===true&&ready?<div className="join-return">
       <h2>WELCOME BACK.</h2>
       <p>You have a verified ANEVUM member session. Your profile is private until you publish it.</p>
       <div className="join-identity"><span className="join-identity-avatar" aria-hidden="true">◈</span>
         <div><strong>{member.name||"ANEVUM MEMBER"}</strong><small>CANONICAL MEMBER SESSION</small></div></div>
       <Link className="button primary join-main-action" to="/member">OPEN MY PROFILE <span aria-hidden="true">↗</span></Link>
     </div>:<>
       <div className="av52-form-progress" aria-label="Registration progress"><span className="is-current">01 <small>ACCOUNT</small></span><i/><span className={codeSent?"is-current":""}>02 <small>VERIFY</small></span><i/><span>03 <small>ARRIVE</small></span></div>
       <h2>{codeSent?"CHECK YOUR INBOX.":requiresEmailVerification?"VERIFY YOUR EMAIL.":"YOUR STORY STARTS HERE."}</h2>
       <p className="join-lead">{codeSent?"Your access code is on its way. Enter all eight digits below to continue.":requiresEmailVerification?"Your sign-in provider did not verify your email. Confirm the email on this session before opening your ANEVUM profile.":"A place to discover, publish and belong. No password. No cost to join."}</p>
       {oauthFeedback&&<p role="alert" className="av12-join-error">{oauthFeedback}</p>}
       {requiresEmailVerification&&<div className="join-service-note" role="status">
         <strong>EMAIL VERIFICATION REQUIRED</strong>
         <p>{sessionEmail?"Verify "+sessionEmail+" with an eight-digit code. Your existing account will remain the same.":"This provider did not supply an email address ANEVUM can verify. Sign out and use a different sign-in method."}</p>
         <button className="button secondary" type="button" onClick={()=>void signOutUnverified()} disabled={busy}>
           SIGN OUT / CHANGE ACCOUNT
         </button>
       </div>}
       {ready&&!emailReady&&<p role="status" className="join-service-note">Email sign-in is temporarily unavailable.</p>}
       
       {emailReady&&(!requiresEmailVerification||Boolean(sessionEmail))&&<form className="av12-email-entry" onSubmit={event=>void submitEmail(event)}>
         <label htmlFor="anevum-email">{codeSent?"CODE SENT TO":"YOUR EMAIL ADDRESS"}</label>
         <input id="anevum-email" type="email" autoComplete="email" placeholder="you@example.com" value={emailForVerification}
           onChange={event=>{setEmail(event.target.value);if(codeSent)resetCode();}}
           disabled={busy||codeSent} readOnly={requiresEmailVerification} required maxLength={254}/>
         {codeSent&&<>
           <label htmlFor="anevum-otp">Verification code</label>
           <input id="anevum-otp" ref={otpRef} type="text" inputMode="numeric" autoComplete="one-time-code"
             pattern="[0-9]{8}" minLength={8} maxLength={8} value={otp}
             onChange={event=>setOtp(event.target.value.replace(/\D/g,"").slice(0,8))}
             disabled={busy} placeholder="8-digit code" required/>
           <small className="av12-email-guidance">Use the latest code. It expires after a short time. We will never ask for it in chat.</small>
           <button type="button" className="av12-email-reset" onClick={()=>void requestReplacementCode()} disabled={busy}>
             {busy?"REQUESTING…":"SEND A NEW CODE"}
           </button>
           {!requiresEmailVerification&&<button type="button" className="av12-email-reset" onClick={resetCode} disabled={busy}>USE A DIFFERENT EMAIL</button>}
         </>}
         <button type="submit" className="av12-email-submit" disabled={busy} aria-busy={busy}>
           <span>{busy?"CONNECTING…":codeSent?"VERIFY & CONTINUE":"CONTINUE WITH EMAIL"}</span><span className="av52-action-arrow" aria-hidden="true">↗</span>
         </button>
         {notice&&<p role="status">{notice}</p>}
       </form>}
       {ready&&!requiresEmailVerification&&emailReady&&(["google","github","apple","microsoft"] as const).some(socialReady)&&
         <p className="av123-alternative-label">OR CONTINUE WITH</p>}
       {ready&&!requiresEmailVerification&&(["google","github","apple","microsoft"] as const).some(socialReady)&&<div className="join-methods" aria-label="Other available sign-in methods">
         {METHODS.filter(method=>method.key!=="email"&&socialReady(method.key)).map(method=><button
           key={method.key} className="join-method join-method-ready" type="button"
           onClick={()=>void startSocial(method.key as "google"|"github"|"apple"|"microsoft")} disabled={busy}>
           <span className="join-method-symbol" aria-hidden="true">{method.initial}</span>
           <span className="join-method-copy"><strong>Continue with {method.name}</strong></span>
         </button>)}
       </div>}
       <p className="join-service-note" role="status">{capability.state==="loading"?
         "Checking whether new member verification is available.":ready?
         capability.data.registration==="open"?"Registration is open.":"Early access is currently limited to invited accounts.":
         serviceUnavailable?
         "Member verification is temporarily unavailable. Registration will resume when the service recovers. Your existing account is protected.":
         "New registrations are currently paused. You can still explore ANEVUM as a guest."}</p>
       {!ready&&capability.state!=="loading"&&
         <button type="button" className="av52-retry-availability"
           onClick={()=>setAvailabilityAttempt(value=>value+1)} disabled={busy}>
           CHECK ACCESS AGAIN <span aria-hidden="true">↗</span>
         </button>}
       {error&&<p role="alert" className="av12-join-error">{error}</p>}
       <Link className="join-guest-action" to="/discover">EXPLORE AS A GUEST <span aria-hidden="true">↗</span></Link>
     </>}
     <p className="join-security"><span className="av52-privacy-icon" aria-hidden="true">◇</span>Your profile starts private. You decide what becomes public.</p>
     <aside className="av123-iren-join" aria-label="IREN membership guidance">
       <div><span>IREN / MEMBER ORIENTATION</span>
         <p>Need help with verification or your first profile? IREN explains the steps without reading your email or code.</p></div>
       <button type="button" onClick={()=>window.dispatchEvent(new Event("anevum:iren-open"))}>
         ASK IREN <span aria-hidden="true">↗</span>
       </button>
     </aside>
   </div>
 </section>;
}
