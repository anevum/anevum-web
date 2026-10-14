import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMemberContext } from "../components/MemberGate";
import { CosmicArtwork } from "../components/CosmicArtwork";
import { memberWorldAppearance, memberSaveWorldAppearance, type WorldAppearance, MemberApiError } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { LoadingState } from "../components/States";

const THEMES = [
  { id:"astral", name:"Astral Gold", hint:"Midnight navy and radiant brass" },
  { id:"ember", name:"Ember", hint:"Copper light and warm shadows" },
  { id:"verdigris", name:"Verdigris", hint:"Patinated metal and teal" },
  { id:"obsidian", name:"Obsidian", hint:"Blackglass and cold starlight" }
] as const;
const SCENES = [
  {id:"portal",name:"Skyward Portal"}, {id:"games",name:"Arcade Worlds"},
  {id:"research",name:"Research Nebula"}, {id:"creative",name:"Creative Universe"}
] as const;
const LABELS = {work:"Published Creations",cabinet:"Achievement Cabinet",community:"Community"} as const;

export function MemberWorldEditorPage(){
  const {member}=useMemberContext();
  const state=useResource(memberWorldAppearance,[]);
  const [draft,setDraft]=useState<WorldAppearance|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{
    if(state.state==="ready")setDraft({...state.data.appearance,sections:[...state.data.appearance.sections]});
  },[state]);
  const change=(data:Partial<WorldAppearance>)=>{
    setDraft(current=>current?{...current,...data}:current);
    setMessage("");setError("");
  };
  const move=(index:number,offset:number)=>{
    if(!draft || index+offset<0 || index+offset>=draft.sections.length)return;
    const next=[...draft.sections];
    const [moved]=next.splice(index,1);
    next.splice(index+offset,0,moved);
    change({sections:next});
  };
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!draft||busy)return;
    setBusy(true);setError("");setMessage("");
    try{
      const result=await memberSaveWorldAppearance(draft);
      if(result.saved!==true)throw Error("Appearance not confirmed");
      setDraft({...result.appearance,sections:[...result.appearance.sections]});
      setMessage("Appearance saved by the private member service. Production publication remains separately gated.");
    }catch(e){
      setError(e instanceof MemberApiError?e.message:"The member world service did not confirm this change. No settings were saved.");
    }finally{setBusy(false);}
  }

  return <div className="member-world-editor">
    <Link className="project-return" to="/account">← BACK TO MY ACCOUNT</Link>
    <section className="member-title">
      <span className="kicker">MEMBER WORLDS / SAFE PERSONALIZATION</span>
      <h1>MAKE YOUR SPACE YOURS.</h1>
      <p>Choose the visual atmosphere and order of your public sections. Settings are stored on your authenticated account only after the staging service confirms a save. Custom uploads, arbitrary CSS and scripts are not enabled.</p>
    </section>
    {!member.handle ? <section className="member-panel">
      <h2>CREATE YOUR HANDLE FIRST.</h2>
      <p>A personal world needs a permanent member handle before it can be customized.</p>
      <Link className="button secondary" to="/account/edit">EDIT MEMBER IDENTITY</Link>
    </section> : state.state==="loading" ? <LoadingState label="Loading private member world settings" /> :
      state.state==="error" ? <section className="member-panel" role="status">
        <h2>WORLD CUSTOMIZATION IS NOT ENABLED.</h2>
        <p>This feature is still gated behind private staging migration and security acceptance. Existing profile editing remains available.</p>
        <Link className="button secondary" to="/account/edit">EDIT MEMBER NAME AND BIO</Link>
      </section> : draft && <div className="member-world-editor-layout">
      <form className="member-panel member-world-editor-form" onSubmit={save}>
        <fieldset><legend>01 / Profile visibility</legend>
          <label className="member-world-option"><input type="radio" name="visibility" value="private" checked={draft.visibility==="private"} onChange={()=>change({visibility:"private"})}/><span><strong>Private (default)</strong><small>No opt-in member-world page is published.</small></span></label>
          <label className="member-world-option"><input type="radio" name="visibility" value="public" checked={draft.visibility==="public"} onChange={()=>change({visibility:"public"})}/><span><strong>Public member world</strong><small>Allows guests to see your public name, handle, bio, theme, approved work and verified public achievements after release acceptance.</small></span></label>
        </fieldset>
        <fieldset><legend>02 / Your atmosphere</legend>
          <div className="member-world-themes">
            {THEMES.map(theme=><label key={theme.id} className={"member-world-theme-option"+(draft.theme===theme.id?" is-selected":"")}>
              <input type="radio" name="theme" value={theme.id} checked={draft.theme===theme.id} onChange={()=>change({theme:theme.id})}/>
              <span className={"member-world-colorway member-world-colorway--"+theme.id} aria-hidden="true"/>
              <strong>{theme.name}</strong><small>{theme.hint}</small>
            </label>)}
          </div>
          <label className="member-world-scene-label" htmlFor="member-world-scene">Banner world</label>
          <select id="member-world-scene" value={draft.scene} onChange={event=>change({scene:event.target.value as WorldAppearance["scene"]})}>
            {SCENES.map(scene=><option value={scene.id} key={scene.id}>{scene.name}</option>)}
          </select>
        </fieldset>
        <fieldset><legend>03 / Section order</legend>
          <p>Arrange the verified modules on your personal page. Sections with no public content remain honest empty states.</p>
          <div className="member-world-order">
            {draft.sections.map((key,index)=><div className="member-world-order-item" key={key}>
              <span>{String(index+1).padStart(2,"0")} / {LABELS[key]}</span>
              <div>
                <button type="button" aria-label={"Move "+LABELS[key]+" up"} disabled={index===0} onClick={()=>move(index,-1)}>↑</button>
                <button type="button" aria-label={"Move "+LABELS[key]+" down"} disabled={index===draft.sections.length-1} onClick={()=>move(index,1)}>↓</button>
              </div>
            </div>)}
          </div>
        </fieldset>
        <button className="button primary" type="submit" disabled={busy}>{busy?"SAVING PRIVATE SETTINGS…":"SAVE MY WORLD"}</button>
        {message&&<p role="status" className="member-world-save-ok">{message}</p>}
        {error&&<p role="alert" className="member-error">{error}</p>}
        <p className="member-caption">A public profile does not display your sign-in email, private drafts, saved items, unpublished activity or account settings. Member world publication on anevum.com is still separately gated.</p>
      </form>
      <aside className={"member-world-editor-preview member-world--"+draft.theme}>
        <div className="member-world-preview-banner"><CosmicArtwork scene={draft.scene}/></div>
        <div className="member-world-preview-avatar" aria-hidden="true">{(member.displayName||member.handle).slice(0,1).toUpperCase()}</div>
        <div className="member-world-preview-copy">
          <span className="kicker">LIVE LOCAL PREVIEW / NOT PUBLISHED</span>
          <h2>{member.displayName||member.handle}</h2>
          <strong>@{member.handle}</strong>
          <p>{member.bio||"Your member introduction will appear here."}</p>
          <span className="member-world-visibility-tag">{draft.visibility==="private"?"PRIVATE BY DEFAULT":"PUBLIC OPT-IN SELECTED"}</span>
          <div className="member-world-preview-sections">{draft.sections.map(key=><span key={key}>{LABELS[key]}</span>)}</div>
        </div>
      </aside>
    </div>}
  </div>;
}
