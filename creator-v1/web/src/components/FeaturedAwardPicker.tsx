import {useEffect,useState,type FormEvent} from "react";
import {memberFeaturedAward,memberSetFeaturedAward,MemberApiError} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {CelestialEmblem} from "./CelestialEmblem";
import {achievementMotif} from "../lib/artifact-art";
import "./creator-featured-award-v010.css";

/** Protected member-profile preference. The server validates actual earned
 * awards, creator ownership, mutation origin, rate limits and revision.
 */
export function FeaturedAwardPicker(){
  const [revision,setRevision]=useState(0);
  const [choice,setChoice]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [failure,setFailure]=useState("");
  const data=useResource(signal=>memberFeaturedAward(signal),[revision]);
  useEffect(()=>{
    if(data.state!=="ready")return;
    const requested=data.data.selection.awardKey;
    setChoice(requested&&data.data.eligibleAwards.some(x=>x.key===requested)?requested:"");
  },[data.state,data.state==="ready"?data.data.selection.revision:null]);

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy||data.state!=="ready")return;
    setBusy(true);setFailure("");setMessage("");
    try{
      const chosen=choice||null;
      const answer=await memberSetFeaturedAward(chosen,data.data.selection.revision);
      if(answer.selection.awardKey!==chosen)throw new Error("The selected award could not be confirmed.");
      setMessage(chosen?"Your featured award is saved. It appears publicly only while earned.":"Your featured award is cleared.");
      setRevision(x=>x+1);
    }catch(error){
      setFailure(error instanceof MemberApiError?error.message:"Could not save the featured award. No changes were confirmed.");
    }finally{setBusy(false);}
  }
  return <section className="member-panel ch10-showcase" aria-labelledby="ch10-title">
    <span className="kicker">03 / CREATOR RECOGNITION</span>
    <h2 id="ch10-title">YOUR FEATURED AWARD.</h2>
    <p>Select one award you actually earned to highlight beside your level artifact on posts and creator cards. Recognition cannot be bought, and your choice never changes your rank or privileges.</p>
    {data.state==="loading"&&<p role="status">Checking your verified achievements…</p>}
    {data.state==="error"&&<p role="status">Award selection is not available on this member service yet. Existing public achievements are unaffected.</p>}
    {data.state==="ready"&&<form onSubmit={event=>void save(event)}>
      <label htmlFor="ch10-award-key">Featured achievement</label>
      <select id="ch10-award-key" value={choice} disabled={busy}
        onChange={event=>{setChoice(event.target.value);setFailure("");setMessage("");}}>
        <option value="">No featured award</option>
        {data.data.eligibleAwards.map(item=><option value={item.key} key={item.key}>{item.name}</option>)}
      </select>
      {choice&&<div className="ch10-award-preview">
        <CelestialEmblem motif={achievementMotif(choice)||"orbital"} size="small" state="earned"/>
        <span><strong>{data.data.eligibleAwards.find(item=>item.key===choice)?.name||"Earned award"}</strong>
          <small>CREATOR-SELECTED / VERIFIED SERVER RECORD</small></span>
      </div>}
      {!data.data.eligibleAwards.length&&<p className="ch10-empty">No earned achievements are available for featuring. You can still participate and collect awards as you contribute.</p>}
      <button type="submit" disabled={busy||(
        choice===(data.data.eligibleAwards.some(x=>x.key===data.data.selection.awardKey)?data.data.selection.awardKey:"") )}>
        {busy?"SAVING…":"SAVE FEATURED AWARD"}
      </button>
    </form>}
    {message&&<p className="ch10-success" role="status">{message}</p>}
    {failure&&<p className="ch10-error" role="alert">{failure}</p>}
    <p className="ch10-note">Only a verified signed-in account can change this. A revoked award automatically stops appearing publicly.</p>
  </section>;
}
