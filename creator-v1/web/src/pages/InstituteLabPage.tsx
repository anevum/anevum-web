import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { INSTITUTE_ENTITIES, type InstituteEntity } from "../lib/institute-entities";
import "./institute-lab.css";

type EntityId=InstituteEntity["id"];
type LabTab="identity"|"transmissions"|"protocol";
type DemoNotice={id:number;title:string;detail:string};

const textFor:Record<EntityId,{
  role:string;phrase:string;motion:string;sampleTitle:string;sampleDetail:string;
  notices:{title:string;detail:string}[];
}>={
  "observation-node-001":{
    role:"The observer of creative signals",
    phrase:"Some things are meant to be seen.",
    motion:"Counter-rotating orbital architecture / luminous central aperture",
    sampleTitle:"A new signal has been observed",
    sampleDetail:"A promising creative submission enters a proposed recognition review. No real selection or award is made.",
    notices:[
      {title:"New signal",detail:"A candidate creation has been identified for editorial review."},
      {title:"Featured creation",detail:"Illustrative recognition only — no award has been issued."},
      {title:"Archive record",detail:"A proposed preservation notice with no published archive entry."}
    ]
  },
  "regulation-node-002":{
    role:"The guardian of review integrity",
    phrase:"Every signal deserves context.",
    motion:"Fractured obsidian / suspended shards / restrained crimson pulse",
    sampleTitle:"A report enters review",
    sampleDetail:"The example report is synthetic. Authorized staff, not the entity, would decide whether a real report merits action.",
    notices:[
      {title:"Report received",detail:"Synthetic acknowledgement. No actual report was submitted."},
      {title:"Staff review",detail:"An authorized human reviewer must evaluate the evidence."},
      {title:"Outcome notice",detail:"Illustrative private notice. No moderation decision was recorded."}
    ]
  }
};

const base=import.meta.env.BASE_URL.replace(/\/?$/,"/")+"institute/lab/";

export function InstituteLabPage(){
  useEffect(()=>{
    const previousTitle=document.title;
    document.title="Continuance Institute Lab — ANEVUM";
    const existing=document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const meta=existing||document.createElement("meta");
    const prior=existing?.getAttribute("content");
    if(!existing){meta.name="robots";document.head.appendChild(meta);}
    meta.content="noindex,nofollow,noarchive";
    return ()=>{
      document.title=previousTitle;
      if(!existing)meta.remove();
      else if(prior===null||prior===undefined)meta.removeAttribute("content");
      else meta.content=prior;
    };
  },[]);
  const [selected,setSelected]=useState<EntityId>("observation-node-001");
  const [tab,setTab]=useState<LabTab>("identity");
  const [motionPaused,setMotionPaused]=useState(()=>{
    return typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [stage,setStage]=useState<string>("idle");
  const [notice,setNotice]=useState<DemoNotice|null>(null);
  const [noticePhase,setNoticePhase]=useState<"mark"|"open"|"close">("mark");
  useEffect(()=>{
    if(!notice)return;
    setNoticePhase("mark");
    const timers=[
      window.setTimeout(()=>setNoticePhase("open"),450),
      window.setTimeout(()=>setNoticePhase("close"),4800),
      window.setTimeout(()=>setNotice(null),5400)
    ];
    return ()=>timers.forEach(window.clearTimeout);
  },[notice?.id]);
  const entity=useMemo(()=>INSTITUTE_ENTITIES.find(item=>item.id===selected)!,[selected]);
  const copy=textFor[entity.id];
  const validStage=entity.visualStates.find(item=>item.id===stage)||entity.visualStates[0];
  const showStill=motionPaused;
  const art=base+entity.id+(showStill?"-still.svg":".svg");
  const specimen=base+entity.id+".html";
  function select(id:EntityId){
    setSelected(id);setStage("idle");setNotice(null);setTab("identity");
  }
  function testNotice(index:number){
    const next=copy.notices[index];
    if(!next)return;
    setNotice({id:Date.now(),...next});
  }
  return <div className={"il-lab il-"+entity.accent} data-institute-prototype="true" data-entity={entity.id}>
    <section className="il-heading" aria-labelledby="il-title">
      <span className="il-eyebrow">ANEVUM / CONTINUANCE INSTITUTE / ENTITY LAB</span>
      <div className="il-heading-row"><div>
        <h1 id="il-title">THE PRESENCES <em>BEHIND THE SIGNAL.</em></h1>
        <p>Official automated entities are being designed as a distinctive part of ANEVUM's creative community. Explore their visual identity and proposed behavior before any account, award, or automation goes live.</p>
      </div><span className="il-version">RESEARCH FILE<br/><strong>00—02</strong><small>DESIGN PROTOTYPE</small></span></div>
      <p className="il-status" role="status">DESIGN LAB ONLY · Entity names are provisional · No live account, nomination, moderation action, or Railway process is connected.</p>
    </section>
    <section className="il-selection" aria-label="Choose an Institute entity">
      {INSTITUTE_ENTITIES.map((item,index)=><button
        key={item.id} type="button" className={"il-selection-card"+(item.id===entity.id?" is-selected":"")}
        onClick={()=>select(item.id)} aria-pressed={item.id===entity.id}>
        <img src={base+item.id+"-still.svg"} alt="" aria-hidden="true"/>
        <span><small>ENTITY / 00{index+1}</small><strong>{item.name}</strong><em>{item.designation}</em></span>
        <span className="il-selection-arrow" aria-hidden="true">↗</span>
      </button>)}
    </section>
    <section className="il-focus" aria-labelledby="il-entity-heading">
      <div className={"il-art il-state-"+validStage.id+(motionPaused?" is-paused":"")} data-state={validStage.id}>
        <span className="il-reticle il-reticle-a" aria-hidden="true"/>
        <span className="il-reticle il-reticle-b" aria-hidden="true"/>
        <div className="il-glow" aria-hidden="true"/>
        <img src={art} alt={entity.name+" — "+entity.designation+" visual concept"}/>
        <span className="il-art-index">C.I. / {entity.id==="observation-node-001"?"001":"002"}</span>
        <span className="il-art-caption">MANIFESTATION STUDY · {motionPaused?"STATIC":"MOTION ENABLED"}</span>
      </div>
      <div className="il-focus-info">
        <span className="il-eyebrow">{entity.designation} / PRELIMINARY DESIGN</span>
        <h2 id="il-entity-heading">{entity.name}<span className="il-provisional">PROVISIONAL NAME</span></h2>
        <p className="il-entity-role">{copy.role}</p>
        <blockquote>“{copy.phrase}”</blockquote>
        <p>{entity.description}</p>
        <div className="il-specification">
          <div><span>FUNCTION</span><strong>{entity.function}</strong></div>
          <div><span>VISUAL LANGUAGE</span><strong>{copy.motion}</strong></div>
          <div><span>PUBLIC AUTHORITY</span><strong>None — presentation only</strong></div>
        </div>
        <div className="il-actions">
          <a href={specimen} className="il-button il-button-primary">OPEN FULL SPECIMEN <span aria-hidden="true">↗</span></a>
          <button type="button" className="il-button" onClick={()=>setMotionPaused(p=>!p)}>
            {motionPaused?"ENABLE MOTION":"PAUSE MOTION"}</button>
        </div>
      </div>
    </section>
    <section className="il-controls" aria-label="Manifestation state controls">
      <div className="il-panel-title"><div><span className="il-eyebrow">EXPERIMENT / 01</span><h2>Manifestation states</h2></div><small>ARTWORK PREVIEW ONLY</small></div>
      <div className="il-states">
        {entity.visualStates.map((item,index)=><button type="button" className={"il-state-button"+(validStage.id===item.id?" is-active":"")}
            onClick={()=>setStage(item.id)} aria-pressed={validStage.id===item.id} key={item.id}>
          <span className="il-state-number">0{index+1}</span><strong>{item.label}</strong><span>{item.meaning}</span>
        </button>)}
      </div>
    </section>
    <section className="il-profile" aria-label="Proposed Institute entity profile">
      <div className="il-profile-banner">
        <span>THE CONTINUANCE INSTITUTE</span><strong>{entity.designation}</strong>
      </div>
      <div className="il-profile-identity">
        <div className="il-avatar"><img src={base+entity.id+"-still.svg"} alt=""/></div>
        <div><span className="il-profile-label">OFFICIAL AUTOMATED ENTITY · CONCEPT</span><h2>{entity.name} <span className="il-verified" title="Proposed official Institute designation" aria-label="Proposed official Institute designation">✦</span></h2><p>{entity.id==="observation-node-001"?"@vesper":"@sable"} · Proposed handle, not an active account</p></div>
        <span className="il-profile-status">NOT REGISTERED</span>
      </div>
      <div className="il-tabs" role="tablist" aria-label="Entity profile study">
        {([["identity","Identity"],["transmissions","Transmissions"],["protocol","Protocol"]] as const).map(([key,label])=>
          <button type="button" role="tab" id={"il-tab-"+key} aria-controls={"il-tabpanel-"+key}
            aria-selected={tab===key} tabIndex={tab===key?0:-1} className={tab===key?"is-active":""} key={key}
            onKeyDown={event=>{
              const order:LabTab[]=["identity","transmissions","protocol"];
              const i=order.indexOf(tab);
              const next=event.key==="ArrowRight"?order[(i+1)%order.length]:
                event.key==="ArrowLeft"?order[(i+order.length-1)%order.length]:
                event.key==="Home"?order[0]:event.key==="End"?order[order.length-1]:null;
              if(next){event.preventDefault();setTab(next);document.getElementById("il-tab-"+next)?.focus();}
            }}
            onClick={()=>setTab(key)}>{label}</button>)}
      </div>
      <div className="il-tab-panel" id={"il-tabpanel-"+tab} role="tabpanel" aria-labelledby={"il-tab-"+tab}>
        {tab==="identity"&&<><span className="il-panel-overline">RECORDED ATTRIBUTES / PROPOSED</span>
          <h3>Identity is recognizable. Authority is explicit.</h3>
          <p>{entity.note} Its profile will identify it as an automated Institute account, display a stable insignia, and expose only verified public events. Fictional lore must never be confused with a real decision or system status.</p>
          <div className="il-traits"><span>PROVENANCE REQUIRED</span><span>NO ARTIFICIAL STATS</span><span>ACCESSIBLE MOTION</span></div>
        </>}
        {tab==="transmissions"&&<><span className="il-panel-overline">PREVIEW / SYNTHETIC CONTENT</span>
          <h3>{copy.sampleTitle}</h3><p>{copy.sampleDetail}</p>
          <div className="il-notice-options">
            {copy.notices.map((item,i)=><button type="button" key={item.title} onClick={()=>testNotice(i)}>
              <span>0{i+1} / EXAMPLE</span><strong>{item.title}</strong><small>{item.detail}</small><em>PREVIEW ↗</em>
            </button>)}
          </div>
        </>}
        {tab==="protocol"&&<><span className="il-panel-overline">OPERATING BOUNDARY / DRAFT</span>
          <h3>Automated presence. Human accountability.</h3>
          <p>{entity.id==="observation-node-001"?
            "Future discovery nominations require verified submissions, transparent eligibility, reviewed recognition and idempotent server-issued award receipts. The first implementation creates no real features, points or archive records.":
            "Future automated triage may help authorized staff, but cannot enforce decisions. The canonical forum-review service controls permissions and writes its own review audit. The prototype has no access to either."}</p>
          <Link to={entity.id==="regulation-node-002"?"/community":"/levels"} className="il-text-link">{entity.id==="regulation-node-002"?"EXPLORE COMMUNITY":"EXPLORE REAL MEMBER ARTIFACTS"} ↗</Link>
        </>}
      </div>
    </section>
    <section className="il-roadmap"><span className="il-eyebrow">IMPLEMENTATION BOUNDARY</span>
      <div><h2>There is a difference between <em>appearing alive</em> and acting on the community.</h2>
        <p>These entities are visual prototypes. Real profiles, archival selections, automated scheduling, and moderation notices need reviewed backend integrations. Existing authenticated staff controls remain untouched.</p></div>
      <Link to="/status" className="il-text-link">CURRENT PLATFORM STATUS ↗</Link>
    </section>
    <footer className="il-footer"><span>ANEVUM / INSTITUTE RESEARCH</span><span>002 CONCEPT IDENTITIES · 000 LIVE BOT ACCOUNTS</span></footer>
    {notice&&<div className={"il-notification is-"+noticePhase} role="status" aria-live="polite" aria-atomic="true" key={notice.id}>
      <img src={base+entity.id+"-still.svg"} alt="" aria-hidden="true"/>
      <div><span>SYNTHETIC TRANSMISSION / PREVIEW</span><strong>{notice.title}</strong><p>{notice.detail}</p></div>
      <button type="button" aria-label="Close example notification" onClick={()=>setNotice(null)}>×</button>
    </div>}
  </div>;
}
