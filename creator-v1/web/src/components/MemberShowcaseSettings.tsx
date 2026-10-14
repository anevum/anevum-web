import {useEffect,useState,type FormEvent} from "react";
import {memberSaveShowcase,memberShowcase,MemberApiError,type MemberShowcaseSelection} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {CelestialEmblem} from "./CelestialEmblem";
import {achievementMotif,seriesOneArtifactMotif} from "../lib/artifact-art";

/** Authenticated settings only. No demo ownership, local-only save claims, or
 * public editing actions. Writes need the existing session and origin checks.
 */
export function MemberShowcaseSettings(){
  const resource=useResource(memberShowcase,[]);
  const [draft,setDraft]=useState<MemberShowcaseSelection|null>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    if(resource.state==="ready")setDraft({...resource.data.selection,awardKeys:[...resource.data.selection.awardKeys]});
  },[resource.state,resource.state==="ready"?resource.data.selection.revision:null]);

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!draft||saving)return;
    setSaving(true);setMessage("");
    try{
      const result=await memberSaveShowcase(draft);
      setDraft({...result.selection,awardKeys:[...result.selection.awardKeys]});
      setMessage("Your public showcase preferences were saved by the member service.");
    }catch(error){
      setMessage(error instanceof MemberApiError?error.message:"Showcase changes were not saved. Try again.");
    }finally{setSaving(false)}
  }
  function chooseAward(key:string){
    if(!draft||saving)return;
    const awardKeys=draft.awardKeys.includes(key)?
      draft.awardKeys.filter(x=>x!==key):[...draft.awardKeys,key].slice(0,3);
    if(!draft.awardKeys.includes(key)&&draft.awardKeys.length>=3){
      setMessage("Choose up to three earned awards. Remove one before adding another.");return;
    }
    setDraft({...draft,awardKeys});setMessage("");
  }
  return <section className="member-panel av7-settings" aria-labelledby="av7-settings-title">
    <div className="portal-box-header"><div>
      <span className="kicker">PERSONAL IDENTITY / EQUIPPED DISPLAY</span>
      <h2 id="av7-settings-title">YOUR COMMUNITY SHOWCASE</h2>
    </div></div>
    <p>Choose the earned artifact and up to three real achievements displayed beside your community posts. Your level is calculated by ANEVUM, not editable here.</p>
    {resource.state==="loading"&&<p role="status">Reading your verified collection…</p>}
    {resource.state==="error"&&<p role="status">Your showcase is not available on this identity service yet. No changes were made.</p>}
    {resource.state==="ready"&&draft&&<form onSubmit={event=>void save(event)} className="av7-settings-form">
      <div className="av7-settings-head">
        <CelestialEmblem motif={seriesOneArtifactMotif(draft.artifactKey||resource.data.currentArtifact)} size="small" state="earned"/>
        <div><span className="kicker">SERVER-VERIFIED</span>
          <strong>LEVEL {resource.data.level}</strong>
          <small>{draft.artifactKey||resource.data.currentArtifact||"No issued Series One artifact at this level"}</small>
        </div>
      </div>
      <label className="av7-settings-label" htmlFor="av7-artifact-select">EQUIPPED ARTIFACT</label>
      <select id="av7-artifact-select" value={draft.artifactKey||""} disabled={saving}
        onChange={event=>{setDraft({...draft,artifactKey:event.target.value||null});setMessage("")}}>
        <option value="">Use current earned artifact</option>
        {resource.data.availableArtifacts.map(name=><option key={name} value={name}>{name}</option>)}
      </select>
      <div className="av7-settings-live-preview" aria-label="Selected public showcase preview">
        <div className="av7-settings-preview-relic" aria-hidden="true">
          <CelestialEmblem motif={seriesOneArtifactMotif(draft.artifactKey||resource.data.currentArtifact)} size="medium" state="earned"/>
        </div>
        <div>
          <span className="kicker">EXHIBIT / {draft.isPublic?"PUBLIC WHEN SAVED":"PRIVATE"}</span>
          <strong>{draft.artifactKey||resource.data.currentArtifact||"CURRENT ARTIFACT UNAVAILABLE"}</strong>
          <small>LEVEL {String(resource.data.level).padStart(2,"0")} · SERIES ONE · {draft.awardKeys.length} FEATURED AWARDS</small>
        </div>
      </div>
      <fieldset className="av7-award-fieldset" disabled={saving}>
        <legend>FEATURED AWARDS / {draft.awardKeys.length} OF 3</legend>
        {resource.data.availableAwards.length===0&&<p>No verified achievements to feature yet. Keep contributing to unlock them.</p>}
        <div className="av7-picker-grid">{resource.data.availableAwards.map(award=>
          <label key={award.key} className="av7-picker-option">
            <input type="checkbox" checked={draft.awardKeys.includes(award.key)}
              onChange={()=>chooseAward(award.key)}/>
            <CelestialEmblem motif={achievementMotif(award.key)||"orbital"} size="small" state="earned"/>
            <span><strong>{award.name}</strong><small>{award.description}</small></span>
          </label>)}
        </div>
      </fieldset>
      <label className="av7-privacy-setting">
        <input type="checkbox" checked={draft.isPublic} disabled={saving}
          onChange={event=>{setDraft({...draft,isPublic:event.target.checked});setMessage("")}}/>
        <span>Display my earned level, chosen artifact and featured awards publicly.</span>
      </label>
      <div className="member-actions">
        <button className="button primary" type="submit" disabled={saving}>
          {saving?"SAVING…":"SAVE MY SHOWCASE"}
        </button>
      </div>
      <p className="member-caption">Turning this off hides the complete showcase projection, including your level, while leaving your already published creator identity and posts unchanged.</p>
      {message&&<p role="status" className="av7-settings-notice">{message}</p>}
    </form>}
  </section>;
}
