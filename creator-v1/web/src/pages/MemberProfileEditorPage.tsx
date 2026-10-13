import {type FormEvent,useState} from "react";
import {Link} from "react-router-dom";
import {useMemberContext} from "../components/MemberGate";
import {OrbitalMark} from "../components/OrbitalMark";
import {MemberApiError,memberSaveProfile} from "../lib/member-api";

const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const FORBIDDEN=/[\u0000-\u001f\u007f]/;

export function MemberProfileEditorPage(){
  const {member,onProfileSaved}=useMemberContext();
  const [handle,setHandle]=useState(member.handle||"");
  const [displayName,setDisplayName]=useState(member.displayName||"");
  const [bio,setBio]=useState(member.bio||"");
  const [busy,setBusy]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const locked=Boolean(member.handle);
  const previewHandle=locked?member.handle||"":handle.trim().toLowerCase();

  function changed(){
    setSaved(false);setError("");
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const nextHandle=(locked?member.handle||"":handle).trim().toLowerCase();
    const nextDisplayName=displayName.trim();
    const nextBio=bio.trim();
    if(!HANDLE.test(nextHandle)){
      setError("Choose a handle of 3–30 characters, starting with a letter and using only lowercase letters, numbers and underscores.");
      return;
    }
    if(!nextDisplayName||nextDisplayName.length>80||nextBio.length>1200||FORBIDDEN.test(nextDisplayName+nextBio)){
      setError("Add a display name (up to 80 characters) and a biography of up to 1,200 characters without control characters.");
      return;
    }
    setBusy(true);setSaved(false);setError("");
    try{
      // The existing invite-only Member Worker validates ownership,
      // handle uniqueness, throttling, origin and session permissions.
      const {profile}=await memberSaveProfile({
        handle:nextHandle,displayName:nextDisplayName,bio:nextBio
      });
      setHandle(profile.handle);
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      onProfileSaved(profile);
      setSaved(true);
    }catch(e){
      setError(e instanceof MemberApiError
        ?e.message
        :"Profile could not be saved. Try again when the member service is available.");
    }finally{setBusy(false);}
  }

  return <div className="member-profile-page">
    <Link className="project-return" to="/account">← BACK TO ACCOUNT</Link>
    <section className="member-title"><span className="kicker">YOUR SPACE / MEMBER IDENTITY</span>
      <h1>MAKE IT YOURS.</h1>
      <p>Edit your creator name and public introduction without leaving the ANEVUM member workspace.
        Changes are private to your authenticated account until approved published work makes your channel discoverable.</p>
    </section>
    <div className="member-profile-layout">
      <form className="member-panel member-profile-form" onSubmit={save}>
        <div className="member-profile-form-header">
          <span className="kicker">01 / CREATOR PROFILE</span>
          <h2>YOUR PUBLIC IDENTITY</h2>
          <p>Only your creator name, handle, and biography may appear on your public channel.
            Your sign-in email remains private.</p>
        </div>
        <div className="draft-field">
          <label htmlFor="member-profile-handle">Creator handle</label>
          <div className="member-profile-handle-wrap"><span aria-hidden="true">@</span>
            <input id="member-profile-handle" name="handle" autoComplete="username"
              required minLength={3} maxLength={30} pattern="[a-z][a-z0-9_]{2,29}"
              readOnly={locked} aria-describedby="member-profile-handle-help"
              value={locked?member.handle||"":handle}
              onChange={e=>{if(!locked){setHandle(e.target.value.toLowerCase());changed();}}}/>
          </div>
          <p id="member-profile-handle-help" className="draft-hint">{locked
            ?"Your handle is fixed after creation. Handle changes are not supported in this staging release."
            :"3–30 characters, starting with a letter. Lowercase letters, numbers and underscores only. Choose carefully; it becomes permanent."}</p>
        </div>
        <div className="draft-field">
          <label htmlFor="member-profile-display">Display name</label>
          <input id="member-profile-display" name="displayName" autoComplete="nickname"
            required maxLength={80} value={displayName}
            aria-describedby="member-profile-display-help"
            onChange={e=>{setDisplayName(e.target.value);changed();}}/>
          <p id="member-profile-display-help" className="draft-hint">{displayName.length}/80 characters</p>
        </div>
        <div className="draft-field">
          <label htmlFor="member-profile-bio">About your work</label>
          <textarea id="member-profile-bio" name="bio" maxLength={1200} rows={6}
            value={bio} aria-describedby="member-profile-bio-help"
            placeholder="What do you love creating, playing, testing or learning?"
            onChange={e=>{setBio(e.target.value);changed();}}/>
          <p id="member-profile-bio-help" className="draft-hint">{bio.length}/1,200 characters. Optional; do not include private contact information.</p>
        </div>
        <div className="member-profile-submit">
          <button className="button primary" type="submit" disabled={busy}>
            {busy?"SAVING PROFILE…":"SAVE CREATOR IDENTITY"}
          </button>
          <Link className="button secondary" to="/account">CANCEL</Link>
        </div>
        {saved&&<p role="status" className="draft-notice">Your creator profile was saved by the staging member service.</p>}
        {error&&<p role="alert" className="member-error">{error}</p>}
        <p className="member-caption">All changes are verified by the existing staging Member Worker.
          Profile editing does not grant staff roles, publishing approval, XP or voting power.</p>
      </form>
      <aside className="member-profile-aside">
        <section className="member-panel member-profile-preview" aria-label="Live creator channel preview">
          <div className="member-profile-preview-top">
            <span className="kicker">02 / CHANNEL PREVIEW</span>
            <span className="member-profile-preview-label">NOT A PUBLIC LISTING</span>
          </div>
          <div className="member-profile-art" aria-hidden="true"><OrbitalMark/></div>
          <div className="member-profile-copy">
            <h2>{displayName.trim()||"YOUR DISPLAY NAME"}</h2>
            <strong>@{previewHandle||"choose_a_handle"}</strong>
            <p>{bio.trim()||"Your introduction will appear here when you write one."}</p>
          </div>
          <div className="member-profile-preview-foot">
            <span>ANEVUM / MEMBER IDENTITY</span><span>ORBITAL UNDERGROUND</span>
          </div>
        </section>
        <section className="member-panel member-profile-publishing">
          <span className="kicker">WHAT BECOMES PUBLIC?</span>
          <h2>YOUR CHANNEL, ON YOUR TERMS.</h2>
          <p>Public creator discovery only shows staff-approved published work.
            Drafts, your sign-in email, member sessions and privacy controls never belong in a public profile.</p>
          <Link to="/create" className="button secondary">MY PROJECT STUDIO ↗</Link>
        </section>
      </aside>
    </div>
  </div>;
}
