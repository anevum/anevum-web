import {type FormEvent,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {canonicalAuthClient,canonicalMethods} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const METHODS=[
  {key:"github",name:"GitHub",caption:"Developer sign-in • planned",initial:"GH"},
  {key:"passkey",name:"Passkey",caption:"Secure device sign-in • planned",initial:"PK"},
  {key:"microsoft",name:"Microsoft",caption:"Account provider • future option",initial:"MS"},
  {key:"apple",name:"Apple",caption:"Apple ID • future option",initial:"AP"}
] as const;
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}$/;
export function Phase1JoinPage(){
  const navigate=useNavigate();
  const capabilities=useResource(canonicalMethods,[]);
  const {data:session,isPending}=canonicalAuthClient.useSession();
  const [email,setEmail]=useState("");
  const [requestedEmail,setRequestedEmail]=useState("");
  const [otp,setOtp]=useState("");
  const [stage,setStage]=useState<"email"|"code">("email");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const ready=capabilities.state==="ready"&&capabilities.data?.registration==="invite-only";
  const emailReady=ready&&capabilities.data?.methods.email.available===true;
  const googleReady=ready&&capabilities.data?.methods.google.available===true;
  const member=session?.user;
  async function requestCode(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!emailReady||busy)return;
    const address=email.trim().toLowerCase();
    if(!EMAIL.test(address)||address.length>254){setError("Enter a valid email address.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await canonicalAuthClient.emailOtp.sendVerificationOtp({email:address,type:"sign-in"});
      if(response.error)throw Error("Code delivery unavailable");
      setRequestedEmail(address);setStage("code");
      setNotice("If the address is invited, an eight-digit verification code was sent. It expires in 10 minutes.");
    }catch{setError("An invitation or email delivery is unavailable for this address.");}
    finally{setBusy(false);}
  }
  async function verifyCode(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!emailReady||busy||!requestedEmail)return;
    if(!/^\d{8}$/.test(otp)){setError("Enter the eight-digit code from your email.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await canonicalAuthClient.signIn.emailOtp({
        email:requestedEmail,otp,name:"ANEVUM MEMBER"
      });
      if(response.error)throw Error("Code rejected");
      navigate("/member",{replace:true});
    }catch{
      setError("That code could not be verified. Check the code and its expiry, or request a new one.");
      setBusy(false);
    }
  }
  async function startGoogle(){
    if(!googleReady||busy)return;
    setBusy(true);setError("");
    try{
      const response=await canonicalAuthClient.signIn.social({provider:"google",callbackURL:"/join"});
      if(response.error)throw Error("Provider unavailable");
    }catch{setError("Google sign-in is unavailable. No account was created.");}
    finally{setBusy(false);}
  }
  return <section className="join-experience av12-phase1-join" aria-labelledby="canonical-join-title">
    <img className="join-world-art" src={import.meta.env.BASE_URL+"assets/cinematic/hero/skyward-city.webp"} alt="" aria-hidden="true" draggable={false}/>
    <div className="join-story">
      <div className="join-orbit-art" aria-hidden="true"><OrbitalMark/></div>
      <p className="kicker">ANEVUM / THE MEMBER NETWORK</p>
      <h1 id="canonical-join-title">YOUR OWN<br/><em>UNIVERSE.</em></h1>
      <p>Discover and share independent creations. Build your own identity and connect with the community, with a free account.</p>
      <div className="join-chapters">
        <div><span>01</span><strong>Verify</strong><small>Use an invited email to enter the beta.</small></div>
        <div><span>02</span><strong>Become</strong><small>Choose a unique handle and start with a private profile.</small></div>
        <div><span>03</span><strong>Connect</strong><small>Open your personal page when you are ready.</small></div>
      </div>
    </div>
    <div className="join-panel">
      <div className="join-panel-top"><span className="kicker">IDENTITY PORTAL / INVITED STAGING</span>
        <span className="join-state" role="status">{isPending||capabilities.state==="loading"?
          "VERIFYING SERVICE":member&&ready?"SIGNED IN":ready?"INVITATION BETA":"REGISTRATION CLOSED"}</span>
      </div>
      {member&&ready?<div className="join-return">
        <h2>WELCOME BACK.</h2>
        <p>Your account is verified by the canonical member service. Your profile stays private until you explicitly publish it.</p>
        <div className="join-identity"><span className="join-identity-avatar" aria-hidden="true">◈</span>
          <div><strong>{member.name||"ANEVUM MEMBER"}</strong><small>VERIFIED MEMBER SESSION</small></div></div>
        <Link className="button primary join-main-action" to="/member">OPEN MY PROFILE ↗</Link>
      </div>:<>
        <h2>YOUR PLACE IN ANEVUM.</h2>
        <p className="join-lead">Membership is free. No payment, brokerage account, or project is required.</p>
        {emailReady&&stage==="email"&&<form className="canonical-email-form" onSubmit={event=>void requestCode(event)}>
          <label htmlFor="canonical-email">Email address</label>
          <input id="canonical-email" type="email" autoComplete="email" inputMode="email" required
            maxLength={254} placeholder="you@example.com" value={email}
            onChange={event=>setEmail(event.target.value)} disabled={busy}/>
          <button className="join-method-open" type="submit" disabled={busy}>
            {busy?"REQUESTING CODE…":"CONTINUE WITH EMAIL ↗"}
          </button>
          <small>Invited accounts only during staging. We send a one-time code, not a password.</small>
        </form>}
        {emailReady&&stage==="code"&&<form className="canonical-email-form" onSubmit={event=>void verifyCode(event)}>
          <label htmlFor="canonical-otp">Verification code</label>
          <p className="canonical-otp-destination">Sent to {requestedEmail}</p>
          <input id="canonical-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{8}" minLength={8} maxLength={8} required placeholder="00000000"
            value={otp} onChange={event=>setOtp(event.target.value.replace(/[^0-9]/g,"").slice(0,8))}
            disabled={busy}/>
          <button className="join-method-open" type="submit" disabled={busy}>
            {busy?"VERIFYING…":"VERIFY & SIGN IN ↗"}
          </button>
          <button className="canonical-otp-back" type="button" disabled={busy}
            onClick={()=>{setStage("email");setOtp("");setNotice("");setError("");}}>USE ANOTHER EMAIL</button>
        </form>}
        {googleReady&&<button className="canonical-google-open" type="button" onClick={()=>void startGoogle()} disabled={busy}>
          CONTINUE WITH GOOGLE ↗
        </button>}
        <div className="join-methods" aria-label="Future sign-in methods">
          {METHODS.map(method=><div className="join-method" key={method.key}>
            <span className="join-method-symbol" aria-hidden="true">{method.initial}</span>
            <div className="join-method-copy"><strong>{method.name}</strong><small>{method.caption}</small></div>
            <span className="join-method-unavailable">NOT ENABLED</span>
          </div>)}
        </div>
        {!ready&&<p className="join-service-note" role="status">Registration is not activated on this staging host. You can still explore public work.</p>}
        {notice&&<p className="canonical-otp-message" role="status">{notice}</p>}
        {error&&<p className="av12-join-error" role="alert">{error}</p>}
        <Link className="join-guest-action" to="/discover">EXPLORE AS A GUEST ↗</Link>
      </>}
      <p className="join-security">Personal profiles begin private. Sign-in does not grant staff roles, project publishing rights or access to private systems.</p>
    </div>
  </section>;
}
