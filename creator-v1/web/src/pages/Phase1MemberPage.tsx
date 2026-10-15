import {type FormEvent,useEffect,useState} from "react";
import {Link,Navigate,useNavigate} from "react-router-dom";
import {canonicalAuthClient,canonicalClaim,canonicalEdit,canonicalMe,canonicalReady,
  type CanonicalProfile} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const CONTROL=/[\u0000-\u001f\u007f]/;

function MemberEditor({memberId,memberName}:{memberId:string;memberName:string}){
  // Force an entirely new form/key when the verified Better Auth user changes.
  const navigate=useNavigate();
  const current=useResource(canonicalMe,[memberId]);
  const [handle,setHandle]=useState("");
  const [displayName,setDisplayName]=useState(memberName);
  const [bio,setBio]=useState("");
  const [publicVisible,setPublicVisible]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [persisted,setPersisted]=useState<CanonicalProfile|null>(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    if(current.state!=="ready"||current.data?.memberId!==memberId)return;
    const value=current.data.profile;
    setHandle(value?.handle||"");
    setDisplayName(value?.displayName||memberName);
    setBio(value?.bio||"");
    setPublicVisible(value?.visibility==="public");
    setPersisted(value);
    setLoaded(true);
  },[current.state, current.state==="ready"?current.data?.profile?.revision:null,memberId,memberName]);

  const ready=current.state==="ready"&&current.data.memberId===memberId&&loaded;
  const claimed=Boolean(persisted?.handle);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!ready||busy)return;
    const name=displayName.trim(),description=bio.trim();
    const requestedHandle=handle.trim().toLowerCase();
    if((!claimed&&(!HANDLE.test(requestedHandle)))||!name||name.length>80||
       description.length>1200||CONTROL.test(name+description)){
      setError("Check the handle, display name and biography.");return;
    }
    setBusy(true);setError("");setNotice("");
    try{
      // Create always starts PRIVATE. Publishing requires a second deliberate
      // save after the server has confirmed the canonical handle claim.
      const result=claimed?
        await canonicalEdit({displayName:name,bio:description,
          visibility:publicVisible?"public":"private",revision:persisted!.revision}):
        await canonicalClaim({handle:requestedHandle,displayName:name,bio:description});
      if(result.memberId!==memberId||!result.profile)throw Error("Member identity mismatch");
      // Verify against the authoritative server rather than trusting write ack.
      const checked=await canonicalMe();
      if(checked.memberId!==memberId||!checked.profile ||
         checked.profile.revision!==result.profile.revision)throw Error("Server verification unavailable");
      setPersisted(checked.profile);
      setHandle(checked.profile.handle);
      setDisplayName(checked.profile.displayName);
      setBio(checked.profile.bio);
      setPublicVisible(checked.profile.visibility==="public");
      setNotice(claimed?"Your profile changes were saved.":"Your unique handle is claimed. Your profile is private.");
    }catch{
      setError("Your changes were not verified. Reload this page before trying again.");
    }finally{setBusy(false)}
  }
  async function signOut(){
    if(busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      const result=await canonicalAuthClient.signOut();
      if(result.error)throw Error("Sign out unavailable");
      navigate("/join",{replace:true});
    }catch{setError("Could not sign out. Try again.");setBusy(false)}
  }
  const previewHandle=claimed?persisted?.handle:handle.trim().toLowerCase();
  return <section className="av12-account" aria-labelledby="av12-account-title">
    <div className="av12-account-banner">
      <div className="av12-account-orb" aria-hidden="true"><OrbitalMark/></div>
      <p className="kicker">ANEVUM / MEMBER ATLAS</p>
      <h1 id="av12-account-title">{claimed?"YOUR OWN UNIVERSE.":"BEGIN YOUR PROFILE."}</h1>
      <p>Define who you are in the ANEVUM community. Your account, session and private information remain yours.</p>
      <div className="av12-account-banner-links"><Link to="/discover">EXPLORE THE NETWORK ↗</Link>
        <button type="button" onClick={()=>void signOut()} disabled={busy}>SIGN OUT</button></div>
    </div>
    <div className="av12-account-layout">
      <section className="av12-editor-panel" aria-labelledby="av12-editor-heading">
        <span className="kicker">01 / IDENTITY PROFILE</span>
        <h2 id="av12-editor-heading">{claimed?"MAKE IT YOURS.":"CLAIM YOUR HANDLE."}</h2>
        {current.state==="loading"&&<p role="status">Loading your verified member profile…</p>}
        {current.state==="error"&&<p role="alert">Your profile cannot be verified. No changes can be made right now.</p>}
        {current.state==="ready"&&current.data.memberId!==memberId&&
          <p role="alert">The signed-in account has changed. Sign in again.</p>}
        {ready&&<form className="av12-profile-form" onSubmit={event=>void submit(event)}>
          <label htmlFor="av12-handle">Personal handle</label>
          <div className="av12-handle-input"><span>@</span><input id="av12-handle"
            value={handle} onChange={e=>{if(!claimed)setHandle(e.target.value.toLowerCase());}}
            pattern="[a-z][a-z0-9_]{2,29}" minLength={3} maxLength={30}
            autoComplete="username" required readOnly={claimed} disabled={busy}
            aria-describedby="av12-handle-guide"/></div>
          <small id="av12-handle-guide">{claimed?
            "This handle belongs to your account and cannot be changed in this beta.":
            "3–30 lowercase letters, numbers or underscores. Start with a letter. Your handle is permanent."}</small>
          <label htmlFor="av12-display">Display name</label>
          <input id="av12-display" maxLength={80} value={displayName} required disabled={busy}
            onChange={e=>setDisplayName(e.target.value)}/>
          <label htmlFor="av12-bio">Your introduction</label>
          <textarea id="av12-bio" rows={5} maxLength={1200} value={bio} disabled={busy}
            placeholder="What do you like to make, discover, learn or collaborate on?"
            onChange={e=>setBio(e.target.value)}/>
          <small>{bio.length}/1200 characters. Do not share private contact information.</small>
          {claimed?<label className="av12-visibility"><input type="checkbox" checked={publicVisible}
             onChange={e=>setPublicVisible(e.target.checked)} disabled={busy}/>
             <span><strong>Make my profile public</strong><small>Others can visit /@{persisted?.handle}.
               Public pages show only your chosen name and biography—not your email or account ID.</small></span>
           </label>:<p className="av12-privacy-note">Your new profile is private by default. You can opt in to a public page afterward.</p>}
          <button className="av12-save-button" type="submit" disabled={busy}>
            {busy?"VERIFYING SAVE…":claimed?"SAVE MY PROFILE":"CREATE MY PRIVATE PROFILE"}
          </button>
          {notice&&<p role="status" className="av12-save-notice">{notice}</p>}
          {error&&<p role="alert" className="av12-save-error">{error}</p>}
        </form>}
      </section>
      <aside className="av12-profile-preview" aria-label="Your current profile preview">
        <span className="kicker">02 / PERSONAL WORLD</span>
        <div className="av12-preview-portrait" aria-hidden="true"><OrbitalMark/></div>
        <h2>{displayName||"NEW MEMBER"}</h2>
        <p className="av12-preview-handle">@{previewHandle||"your_handle"}</p>
        <div className="av12-preview-visibility">{persisted?.visibility==="public"?"PUBLIC PROFILE":"PRIVATE PROFILE"}</div>
        <p className="av12-preview-description">{bio||"Your introduction will appear here."}</p>
        {persisted?.visibility==="public"&&<Link to={"/@"+persisted.handle}
          className="av12-preview-open">VIEW PUBLIC PROFILE ↗</Link>}
        <p className="av12-preview-foot">Identity preview only. Real achievements and earned artifacts require separate verified progression integration.</p>
      </aside>
    </div>
  </section>;
}
export function Phase1MemberPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const capabilities=useResource(canonicalReady,[]);
 if(isPending||capabilities.state==="loading")
   return <section className="av12-account-await" role="status">VERIFYING YOUR MEMBER SESSION…</section>;
 if(capabilities.state!=="ready"||capabilities.data!==true)
   return <section className="av12-account-await"><h1>MEMBER ACCESS IS CLOSED.</h1>
     <p>Canonical member registration is not activated in this environment.</p>
     <Link to="/join">JOIN STATUS</Link></section>;
 const member=session?.user;
 if(!member?.id)return <Navigate to="/join" replace/>;
 if(member.emailVerified!==true)
   return <section className="av12-account-await"><h1>VERIFY YOUR EMAIL.</h1>
     <p>A verified account is required before opening the profile editor.</p>
     <Link to="/join">RETURN TO SIGN-IN</Link></section>;
 return <MemberEditor key={member.id} memberId={member.id} memberName={member.name||"ANEVUM MEMBER"}/>;
}
