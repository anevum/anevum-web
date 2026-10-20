import {useState} from "react";
import {Link} from "react-router-dom";
import {useResource} from "../lib/useResource";
import {
 readCanonicalProjectSave,setCanonicalProjectSaved,CanonicalProjectSaveError
} from "../lib/canonical-project-saves";

type Registration="open"|"invite-only"|"closed";
/**
 * Renders only when server capability health explicitly advertises a ready,
 * separately migrated canonical project saves service. No vote or XP controls.
 */
export function CanonicalProjectSavePanel({projectId,registration}:{
 projectId:string;registration:Registration;
}){
 const result=useResource(signal=>readCanonicalProjectSave(projectId,signal),[projectId]);
 if(result.state==="loading")return <section className="engagement-panel avp-participation-preview" aria-label="Checking private save availability">
  <span className="kicker">COMMUNITY SIGNAL / PRIVATE SAVES</span>
  <p role="status">Checking your project's save status…</p>
 </section>;
 if(result.state==="error"){
  const guest=result.error instanceof CanonicalProjectSaveError&&result.error.status===401;
  return <section className="engagement-panel avp-participation-preview" data-avp-availability={guest?"canonical-saves-guest":"canonical-saves-unavailable"} aria-label="Project saves availability">
   <header className="avp-participation-heading">
    <span className="kicker">COMMUNITY SIGNAL / PRIVATE SAVES</span>
    <span className="avp-participation-status">{guest?"MEMBER ACCESS":"SAVING UNAVAILABLE"}</span>
   </header>
   <h2>{guest?"YOUR CREATIVE LIBRARY STARTS HERE.":"EXPLORE NOW. SAVE LATER."}</h2>
   <p>{guest?"Sign in with your ANEVUM member account to save this published work privately. Rating and XP are not active.":"Project saving cannot be verified at the moment. You can still visit the community and explore approved work."}</p>
   <div className="avp-participation-actions">
    <Link className="button secondary" to="/community">EXPLORE COMMUNITY →</Link>
    {guest&&registration!=="closed"&&<Link className="button secondary" to="/join">MEMBER ACCESS →</Link>}
   </div>
   {guest&&registration==="invite-only"&&<p className="member-caption">New member registration remains invite-only.</p>}
  </section>;
 }
 return <CanonicalSaveControls key={projectId} projectId={projectId} initialSaved={result.data.saved}/>;
}

function CanonicalSaveControls({projectId,initialSaved}:{projectId:string;initialSaved:boolean}){
 const [saved,setSaved]=useState(initialSaved);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [failure,setFailure]=useState("");
 async function change(){
  if(busy)return;
  setBusy(true);setMessage("");setFailure("");
  try{
   const next=await setCanonicalProjectSaved(projectId,!saved);
   setSaved(next.saved);
   setMessage(next.changed
    ?next.saved?"Project saved privately.":"Project removed from your saved works."
    :next.saved?"This project is already saved.":"Project is not in your saved works.");
  }catch(error){
   setFailure(error instanceof CanonicalProjectSaveError?error.message:"Project saves are temporarily unavailable");
  }finally{setBusy(false);}
 }
 return <section className="engagement-panel avp-participation-preview avp-canonical-save" data-avp-availability="canonical-saves-member" aria-label="Private project saves">
  <header className="avp-participation-heading">
   <span className="kicker">COMMUNITY SIGNAL / PRIVATE SAVES</span>
   <span className="avp-participation-status">{saved?"IN YOUR SAVED WORKS":"NOT YET SAVED"}</span>
  </header>
  <h2>KEEP THIS PROJECT CLOSE.</h2>
  <p>Save approved work to your private ANEVUM collection. Only you can see this selection. Voting and XP are not active for project saves.</p>
  <div className="avp-participation-actions">
   <button className="button secondary avp-canonical-save-button" type="button" aria-pressed={saved} disabled={busy} onClick={()=>{void change();}}>
    {busy?"UPDATING…":saved?"REMOVE SAVED PROJECT":"SAVE PROJECT"}
   </button>
   <Link className="button secondary" to="/saved">MY SAVED WORKS →</Link>
   <Link className="button secondary" to="/community">EXPLORE COMMUNITY →</Link>
  </div>
  {message&&<p role="status" className="engagement-success">{message}</p>}
  {failure&&<p role="alert" className="member-error">{failure}</p>}
  <p className="member-caption">Your saved-project choice is verified by the canonical member service. No client-generated achievements, XP or rankings.</p>
 </section>;
}
