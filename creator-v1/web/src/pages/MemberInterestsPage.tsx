import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type Category, readCategories } from "../lib/api";
import { memberInterests, memberSaveInterests, MemberApiError } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { LoadingState } from "../components/States";
import { Icon } from "../components/Icons";
import { OrbitalMark } from "../components/OrbitalMark";

const allInterests: ReadonlyArray<{id:Category;label:string;number:string;symbol:string;subtitle:string}> = [
  {id:"games",label:"GAMES & PLAY",number:"01",symbol:"✦",subtitle:"Playtesting, worlds and interactive stories"},
  {id:"tools",label:"APPS & TOOLS",number:"02",symbol:"⌘",subtitle:"Useful independent software"},
  {id:"creative",label:"CREATIVE & AI",number:"03",symbol:"✳",subtitle:"Creative practice and experiments"},
  {id:"libraries",label:"OPEN SOURCE",number:"04",symbol:"⟡",subtitle:"Shared code and libraries"},
  {id:"automation",label:"AUTOMATION",number:"05",symbol:"↗",subtitle:"Bots, scripts and better workflows"},
  {id:"research",label:"RESEARCH",number:"06",symbol:"⊕",subtitle:"Evidence, ideas and questions"},
  {id:"learning",label:"LEARNING",number:"07",symbol:"◇",subtitle:"Guides, lessons and useful knowledge"},
  {id:"other",label:"THE UNCLASSIFIED",number:"08",symbol:"+",subtitle:"Everything beyond the usual categories"}
];
const known=new Set<string>(allInterests.map(item=>item.id));
function ordered(values:readonly string[]):Category[] {
  return allInterests.filter(item=>values.includes(item.id)).map(item=>item.id);
}

export function MemberInterestsPage() {
  const profile=useResource(memberInterests,[]);
  const catalogue=useResource(readCategories,[]);
  const [selected,setSelected]=useState<Category[]>([]);
  const [confirmed,setConfirmed]=useState<Category[]>([]);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState("");
  const [isError,setIsError]=useState(false);
  const loaded=profile.state==="ready";
  const serverValues=loaded?profile.data.categories:[];
  const fingerprint=serverValues.join("|");
  useEffect(()=>{
    if(loaded){
      const list=ordered(serverValues.filter(category=>known.has(category)));
      setSelected(list);
      setConfirmed(list);
    }
  },[loaded,fingerprint]);
  const counts=new Map((catalogue.state==="ready"?catalogue.data.categories:[]).map(item=>[item.category,item.count]));
  const dirty=selected.join("|")!==confirmed.join("|");

  function toggle(id:Category){
    if(!loaded||busy)return;
    setSelected(values=>values.includes(id)?values.filter(item=>item!==id):ordered([...values,id]));
    setFeedback("");setIsError(false);
  }
  async function save(){
    if(!loaded||busy||!dirty)return;
    setBusy(true);setFeedback("");setIsError(false);
    try{
      const reply=await memberSaveInterests(selected);
      if(reply.saved!==true)throw new Error("Preferences were not confirmed");
      const saved=ordered(reply.categories);
      setConfirmed(saved);setSelected(saved);
      setFeedback("Your private discovery preferences were saved to your member account.");
    }catch(err){
      setFeedback(err instanceof MemberApiError?err.message:"The member service could not confirm your changes. Nothing has been marked as saved.");
      setIsError(true);
    }finally{setBusy(false);}
  }
  return <div className="member-interests">
    <Link to="/account" className="project-return">← BACK TO MY ACCOUNT</Link>
    <div className="member-interests-hero">
      <div className="member-interests-title">
        <span className="kicker">YOUR SIGNAL / PERSONAL DISCOVERY</span>
        <h1>MAKE IT <em>YOURS.</em></h1>
        <p>Choose the worlds you want to explore. Your selections belong to your private account — not your public creator profile. No project submission is needed.</p>
        <div className="member-interests-ribbon"><span><Icon name="save" size={16}/> PRIVATE BY DEFAULT</span><span><Icon name="star" size={16}/> NO XP FOR SELECTIONS</span></div>
      </div>
      <div className="member-interests-orbit" aria-hidden="true"><div className="member-interests-ring"/><OrbitalMark/></div>
    </div>

    <div className="member-interests-columns">
      <section className="member-interests-main" aria-labelledby="interests-heading">
        <header className="member-interests-section-head">
          <div><span className="kicker">01 / CURATE YOUR OWN UNIVERSE</span><h2 id="interests-heading">WHAT ARE YOU INTO?</h2><p>Select any combination of categories. Choose none if you want to browse everything equally.</p></div>
          <strong>{selected.length} <small>/ 08 SELECTED</small></strong>
        </header>
        {profile.state==="loading"&&<LoadingState label="Reading your private discovery preferences"/>}
        {profile.state==="error"&&<section className="member-interests-message" role="alert"><strong>PREFERENCES UNAVAILABLE.</strong><p>Your member service is unavailable or its isolated database has not been upgraded. No local selections have been claimed as saved.</p><Link to="/account" className="button secondary">BACK TO ACCOUNT</Link></section>}
        {loaded&&<>
          <div className="member-interests-grid" role="group" aria-label="Select private discovery interests">
            {allInterests.map(item=>{
              const active=selected.includes(item.id);
              const count=counts.get(item.id);
              return <button type="button" key={item.id} onClick={()=>toggle(item.id)}
                disabled={busy} aria-pressed={active}
                className={"member-interest-tile member-interest-"+item.id+(active?" member-interest-active":"")}>
                <span className="member-interest-top"><small>{item.number} / PORTAL</small><span className="member-interest-check" aria-hidden="true">{active?"✓":"+"}</span></span>
                <span className="member-interest-symbol" aria-hidden="true">{item.symbol}</span>
                <strong>{item.label}</strong>
                <span className="member-interest-description">{item.subtitle}</span>
                <span className="member-interest-bottom">{count===undefined?"RELEASE COUNT UNAVAILABLE":count===0?"NO RELEASES YET":count===1?"1 APPROVED RELEASE":count+" APPROVED RELEASES"}<span aria-hidden="true">{active?"IN YOUR MIX":"SELECT TO ADD"}</span></span>
              </button>;
            })}
          </div>
          <div className="member-interest-actions">
            <div><span className="kicker">YOUR PICKS / PRIVATE TO YOU</span><p>{selected.length?selected.map(id=>allInterests.find(item=>item.id===id)?.label).join(" · "):"EVERYTHING IS STILL OPEN TO EXPLORE"}</p></div>
            <button type="button" onClick={save} className="button primary" disabled={!dirty||busy}>{busy?"SAVING TO YOUR ACCOUNT…":dirty?"SAVE MY INTERESTS":"PREFERENCES UP TO DATE"}</button>
          </div>
          {feedback&&<p className={isError?"member-interests-feedback error":"member-interests-feedback"} role={isError?"alert":"status"}>{feedback}</p>}
          <p className="member-interests-caption">Saving requires a real, authenticated staging member session. Changes are only confirmed after the server accepts them. These picks do not affect rankings, votes, badges, moderation or your XP balance.</p>
        </>}
      </section>
      <aside className="member-interests-side">
        <section className="member-interests-aside-card">
          <span className="kicker">02 / JUMP INTO YOUR WORLDS</span><h2>GO EXPLORING.</h2>
          <p>Discovery works even when the public catalogue is empty. These links use actual category filters and never show fake projects.</p>
          {confirmed.length?<nav aria-label="Browse saved interest categories">{confirmed.map(id=><Link to={"/discover?category="+encodeURIComponent(id)} key={id}><span>{allInterests.find(item=>item.id===id)?.label}</span><Icon name="arrow" size={15}/></Link>)}</nav>:
            <p className="member-interests-empty">Save some interests to create your personal category shortcuts.</p>}
          <Link className="button secondary" to="/discover">BROWSE ALL RELEASES</Link>
        </section>
        <section className="member-interests-aside-card secondary-card">
          <span className="kicker">03 / PRIVACY + PARTICIPATION</span><h2>YOUR INTERESTS STAY YOURS.</h2>
          <p>These categories are private account preferences. They are not published to your creator channel, do not follow anyone, and cannot grant permissions or XP.</p>
          <p>They are included in the authenticated account-data export and subject to account deletion handling.</p>
          <div className="member-interests-side-links"><a href="/api/v1/member/privacy/manage">ACCOUNT PRIVACY <Icon name="arrow" size={15}/></a><Link to="/guide">PRACTICE THE FIELD GUIDE <Icon name="arrow" size={15}/></Link></div>
        </section>
      </aside>
    </div>
  </div>;
}
