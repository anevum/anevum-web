import {type FormEvent,useEffect,useState} from "react";
import {Link,Navigate,useNavigate,useSearchParams} from "react-router-dom";
import {canonicalAuthClient,canonicalClaim,canonicalEdit,canonicalMe,canonicalReady,canonicalMethods,
  CanonicalBetaError,type CanonicalProfile,type WorldTheme,type FocusKey,WORLD_THEME_OPTIONS,FOCUS_OPTIONS} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";
import {MemberSpaceDashboard} from "../components/MemberSpaceDashboard";
import {MemberExperienceMap} from "../components/MemberExperienceMap";
import {MemberClosurePanel} from "../components/MemberClosurePanel";
import {VerifiedStaffShortcut} from "../components/VerifiedStaffShortcut";

const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const CONTROL=/[\u0000-\u001f\u007f]/;


const SOCIAL_PROVIDER_NAMES={
  google:"Google",github:"GitHub",apple:"Apple",microsoft:"Microsoft"
} as const;
type SocialProvider=keyof typeof SOCIAL_PROVIDER_NAMES;

/**
 * A verified member explicitly authorizes each additional sign-in method.
 * Never silently merge another identity because its email happens to match.
 */
function ConnectedSignInMethods({memberId}:{memberId:string}){
  const methods=useResource(canonicalMethods,[]);
  const [searchParams]=useSearchParams();
  const linkFailureCode=searchParams.get("error");
  const linkFailure=linkFailureCode==="email_doesnt_match"||linkFailureCode==="email_doesn't_match"
    ?"This provider uses a different email address. ANEVUM does not merge identities across email addresses."
    :linkFailureCode==="account_already_linked_to_different_user"
    ?"That provider is already connected to another ANEVUM account. No accounts were merged."
    :linkFailureCode
    ?"That provider could not be linked. Your existing ANEVUM account was not changed."
    :null;
  const [refreshCounter,setRefreshCounter]=useState(0);
  const [linked,setLinked]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState<SocialProvider|null>(null);
  const available=methods.state==="ready"&&methods.data.linking==="explicit"
    ?(Object.keys(SOCIAL_PROVIDER_NAMES) as SocialProvider[]).filter(key=>methods.data.methods[key]?.available===true)
    :[];
  useEffect(()=>{
    if(methods.state!=="ready"||methods.data.linking!=="explicit")return;
    let mounted=true;
    setLoading(true);
    setLinked([]);
    void canonicalAuthClient.listAccounts().then(result=>{
      if(!mounted)return;
      if(result.error){setError("Your connected sign-in methods could not be verified.");return;}
      setLinked((result.data||[]).map(account=>account.providerId));
      setError("");
    }).catch(()=>{
      if(mounted)setError("Your connected sign-in methods could not be verified.");
    }).finally(()=>{if(mounted)setLoading(false)});
    return ()=>{mounted=false};
  },[memberId,methods.state,methods.state==="ready"?methods.data.linking:null,refreshCounter]);
  async function link(provider:SocialProvider){
    if(busy||loading||linked.includes(provider)||!available.includes(provider))return;
    setBusy(provider);setError("");
    try{
      const result=await canonicalAuthClient.linkSocial({provider,callbackURL:"/member",errorCallbackURL:"/member"});
      if(result.error)throw Error("Provider authorization failed");
    }catch{
      setError("Could not connect that sign-in method. Your existing member identity is unchanged.");
    }finally{setBusy(null)}
  }
  if(available.length===0)return null;
  return <section className="av12-editor-panel" aria-labelledby="av12-linked-methods-title">
    <span className="kicker">MEMBER IDENTITY / ACCESS METHODS</span>
    <h2 id="av12-linked-methods-title">CONNECTED SIGN-IN METHODS</h2>
    <p>Keep one ANEVUM identity. Connect a second login provider here while signed in. Matching email addresses alone never merge accounts.</p>
    {linkFailure&&<p role="alert">{linkFailure}</p>}
    {loading?<p role="status">Checking your connected providers…</p>:
      error?<button type="button" className="button secondary"
        onClick={()=>{setError("");setRefreshCounter(value=>value+1);}}>
        RETRY PROVIDER CHECK
      </button>:available.map(provider=><div key={provider} className="member-actions">
        <strong>{SOCIAL_PROVIDER_NAMES[provider]}</strong>
        {linked.includes(provider)?<span>CONNECTED</span>:
          <button type="button" className="button secondary"
            disabled={Boolean(busy)||loading}
            onClick={()=>void link(provider)}>
            {busy===provider?"CONNECTING…":"CONNECT "+SOCIAL_PROVIDER_NAMES[provider].toUpperCase()}
          </button>}
      </div>)}
    {error&&<p role="alert">{error}</p>}
  </section>;
}

function MemberEditor({memberId,memberName,memberEmail}:{memberId:string;memberName:string;memberEmail:string}){
  // Force an entirely new form/key when the verified Better Auth user changes.
  const navigate=useNavigate();
  const current=useResource(canonicalMe,[memberId]);
  const [handle,setHandle]=useState("");
  const [displayName,setDisplayName]=useState(memberName);
  const [bio,setBio]=useState("");
  const [headline,setHeadline]=useState("");
  const [worldTheme,setWorldTheme]=useState<WorldTheme>("continuance");
  const [focus,setFocus]=useState<FocusKey[]>([]);
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
    setDisplayName(value?.displayName||(memberName==="ANEVUM MEMBER"?"":memberName));
    setBio(value?.bio||"");
    setHeadline(value?.headline||"");
    setWorldTheme(value?.worldTheme||"continuance");
    setFocus(value?.focus||[]);
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
       description.length>1200||(CONTROL.test(name+headline)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(description))||headline.length>120||
       focus.length>4){
      setError("Check the handle, display name and biography.");return;
    }
    setBusy(true);setError("");setNotice("");
    try{
      // Create always starts PRIVATE. Publishing requires a second deliberate
      // save after the server has confirmed the canonical handle claim.
      const result=claimed?
        await canonicalEdit({displayName:name,bio:description,
          visibility:publicVisible?"public":"private",revision:persisted!.revision,
          headline:headline.trim(),worldTheme,focus}):
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
      setHeadline(checked.profile.headline);
      setWorldTheme(checked.profile.worldTheme);
      setFocus(checked.profile.focus);
      setPublicVisible(checked.profile.visibility==="public");
      setNotice(claimed?"Your profile changes were saved.":"Your identity is saved. Welcome to ANEVUM. You can explore now and customize your profile later.");
      if(!claimed){
        navigate("/member?tab=overview",{replace:true});
        window.dispatchEvent(new CustomEvent("anevum:member-created",{detail:{memberId}}));
      }
    }catch(cause){
      setError(cause instanceof CanonicalBetaError?cause.message:
        "The server did not confirm your save. Your account remains signed in; refresh and try again.");
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
  // The preview reflects pending choices without asserting that public access
  // has changed before the canonical server confirms the new revision.
  const storedVisibility=persisted?.visibility??"private";
  const visibilityPending=claimed&&(publicVisible?"public":"private")!==storedVisibility;
  function toggleFocus(key:FocusKey){
    if(busy)return;
    setFocus(value=>value.includes(key)?value.filter(item=>item!==key):
      value.length<4?[...value,key]:value);
  }
  const editor = <section className={"av12-account"+(claimed?"":" av26-first-visit")} aria-labelledby="av12-account-title">
    <div className="av12-account-banner">
      <div className="av12-account-orb" aria-hidden="true"><OrbitalMark/></div>
      <p className="kicker">ANEVUM / MEMBER ATLAS</p>
      <h1 id="av12-account-title">{claimed?"YOUR OWN UNIVERSE.":"CHOOSE YOUR NAME."}</h1>
      <p>{claimed?"Shape your presence in the ANEVUM community.":"Your email is verified. Choose a handle and the name people will see. Your wall is next."}</p>
      <div className="av12-account-banner-links">{claimed&&<Link to="/discover">EXPLORE THE NETWORK ↗</Link>}
        {claimed&&<a href="/api/v1/member/account-export" download="anevum-member-export.json">
          DOWNLOAD MY DATA ↓
        </a>}
        <VerifiedStaffShortcut location="profile"/>
        <button type="button" onClick={()=>void signOut()} disabled={busy}>SIGN OUT</button></div>
    </div>
    {!claimed&&<aside className="av123-first-claim-assist" aria-label="First profile guidance">
      <p><strong>FIRST SIGNAL / PRIVATE BY DEFAULT</strong> Your handle cannot be changed during this beta. Choose one you want to keep. You can personalize and publish your profile later.</p>
      <button type="button" onClick={()=>window.dispatchEvent(new Event("anevum:iren-open"))}>ASK IREN ABOUT MY SPACE</button>
    </aside>}
    {ready&&claimed&&<MemberExperienceMap profile={persisted}/>}
    <div className="av12-account-layout">
      <section className="av12-editor-panel" aria-labelledby="av12-editor-heading">
        <span className="kicker">01 / IDENTITY PROFILE</span>
        <h2 id="av12-editor-heading">{claimed?"MAKE IT YOURS.":"YOUR PLACE IN ANEVUM."}</h2>
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
          <input id="av12-display" autoComplete="nickname" placeholder="The name people will see" maxLength={80} value={displayName} required disabled={busy}
            onChange={e=>setDisplayName(e.target.value)}/>
          {claimed&&<><label htmlFor="av12-bio">Your introduction</label>
          <textarea id="av12-bio" rows={5} maxLength={1200} value={bio} disabled={busy}
            placeholder="What do you like to make, discover, learn or collaborate on?"
            onChange={e=>setBio(e.target.value)}/>
          <small>{bio.length}/1200 characters. Do not share private contact information.</small></>}
          {claimed&&<fieldset className="av18-world-customizer" disabled={busy}>
            <legend>SHAPE YOUR WORLD</legend>
            <p>Select one approved visual atmosphere for your personal page. This does not change the website's overall theme.</p>
            <div className="av18-world-choices" aria-label="Profile atmosphere">
              {WORLD_THEME_OPTIONS.map(option=><button type="button" key={option.id}
                className={"av18-theme-option av18-theme-"+option.id}
                aria-pressed={worldTheme===option.id} onClick={()=>setWorldTheme(option.id)}>
                <span className="av18-theme-swatch" aria-hidden="true"/>
                <strong>{option.name}</strong><small>{option.detail}</small>
              </button>)}
            </div>
            <label htmlFor="av18-headline">Your headline</label>
            <input id="av18-headline" value={headline} maxLength={120}
              onChange={event=>setHeadline(event.target.value)}
              placeholder="A short line about what you create or explore"/>
            <small>{headline.length}/120 characters</small>
            <div className="av18-focus-heading"><strong>Your interests</strong><small>Select up to four.</small></div>
            <div className="av18-focus-options" aria-label="Creative interests">
              {FOCUS_OPTIONS.map(option=><button type="button" key={option.id}
                aria-pressed={focus.includes(option.id)}
                disabled={!focus.includes(option.id)&&focus.length>=4}
                onClick={()=>toggleFocus(option.id)}>{option.label}</button>)}
            </div>
          </fieldset>}
          {claimed?<label className="av12-visibility"><input type="checkbox" checked={publicVisible}
             onChange={e=>setPublicVisible(e.target.checked)} disabled={busy}/>
             <span><strong>Make my profile public</strong><small>Others can visit /@{persisted?.handle}.
               Your name, introduction, images, wall entries and featured awards can appear in the community. You choose whether to display your stats. Your email stays private.</small></span>
           </label>:<p className="av12-privacy-note">Your new profile is private by default. You can opt in to a public page afterward.</p>}
          <button className="av12-save-button" type="submit" disabled={busy}>
            {busy?"SAVING…":claimed?"SAVE MY PROFILE":"CREATE MY SPACE →"}
          </button>
          {notice&&<p role="status" className="av12-save-notice">{notice}</p>}
          {notice&&claimed&&<Link to="/discover" className="av26-continue-world">ENTER THE COMMUNITY <span aria-hidden="true">↗</span></Link>}
          {error&&<p role="alert" className="av12-save-error">{error}</p>}
        </form>}
      </section>
      {claimed&&<aside className={"av12-profile-preview av18-world-"+worldTheme} aria-label="Your current profile preview">
        <span className="kicker">02 / PERSONAL WORLD</span>
        <div className="av12-preview-portrait" aria-hidden="true"><OrbitalMark/></div>
        <h2>{displayName||"NEW MEMBER"}</h2>
        <p className="av12-preview-handle">@{previewHandle||"your_handle"}</p>
        {headline&&<p className="av18-preview-headline">{headline}</p>}
        <div className="av12-preview-visibility" role="status">{visibilityPending?(publicVisible?"PUBLIC AFTER SAVE":"PRIVATE AFTER SAVE"):(storedVisibility==="public"?"PUBLIC PROFILE":"PRIVATE PROFILE")}</div>
        <p className="av12-preview-description">{bio||"Your introduction will appear here."}</p>
        {focus.length>0&&<div className="av18-preview-focus">{focus.map(item=><span key={item}>{FOCUS_OPTIONS.find(option=>option.id===item)?.label}</span>)}</div>}
        {persisted?.visibility==="public"&&<Link to={"/@"+persisted.handle}
          className="av12-preview-open">VIEW PUBLIC PROFILE ↗</Link>}
        <p className="av12-preview-foot">Appearance and visibility changes shown here remain drafts until saved and server-confirmed. The public page follows your last saved visibility setting. Achievements and artifacts require server-verified progression.</p>
      </aside>}
    </div>
  </section>;
  const privacyControls=<MemberClosurePanel memberId={memberId} memberEmail={memberEmail}/>;
  return <><div>{claimed&&persisted?<MemberSpaceDashboard profile={persisted} editor={editor}/>:editor}</div><ConnectedSignInMethods memberId={memberId}/>{privacyControls}</>;
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
 return <MemberEditor key={member.id} memberId={member.id} memberName={member.name||"ANEVUM MEMBER"} memberEmail={member.email||""}/>;
}
