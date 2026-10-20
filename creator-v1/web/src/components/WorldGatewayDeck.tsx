import {useRef,useState,type KeyboardEvent} from "react";
import {Link} from "react-router-dom";
import {Icon} from "./Icons";
import {projectDetailPath} from "../lib/navigation";
import type {Creator,Project,Status} from "../lib/api";

/**
 * ANEVUM / V073 - function-first module navigator.
 * Four doors are actual destinations, never fictional creative works.
 * Previews use existing independently approved public records only.
 */
type ModuleKey="play"|"discover"|"connect"|"create";
type Props={
  projects:readonly Project[];
  creators:readonly Creator[];
  status:Status|null;
  state:"loading"|"ready"|"error";
};
const modules:ReadonlyArray<{
  id:ModuleKey;number:string;name:string;short:string;heading:string;description:string;
  to:string;action:string;
}>=[
  {
    id:"play",number:"01",name:"Play",short:"Games and experiences",
    heading:"Find something worth playing.",
    description:"Browse independently made games, interactive worlds and playful experiments. Start with an approved experience, not a promotional illustration.",
    to:"/discover?category=games",action:"Browse games"
  },
  {
    id:"discover",number:"02",name:"Discover",short:"Work made by people",
    heading:"Find work worth exploring.",
    description:"Browse released apps, artwork, code and experiments from independent makers. Search by interest and open the work itself.",
    to:"/discover",action:"Explore published work"
  },
  {
    id:"connect",number:"03",name:"Connect",short:"People and conversations",
    heading:"Find the people behind the work.",
    description:"Meet creators, read approved conversations and explore public community boards. Participation becomes available only when its safety controls are ready.",
    to:"/community",action:"Open community"
  },
  {
    id:"create",number:"04",name:"Create",short:"Your own workspace",
    heading:"Make something of your own.",
    description:"Open the Creator Studio to manage your work. Private authoring and publication are separate: only approved releases enter the public network.",
    to:"/studio",action:"Open Creator Studio"
  }
];
function Availability({state}:{state:Props["state"]}){
  return <span className="av73-module-availability" role="status">
    <span aria-hidden="true" className={"av73-module-dot "+(state==="ready"?"is-ready":"")}/>
    {state==="ready"?"Approved public records":state==="loading"?"Checking public records":"Public index unavailable"}
  </span>;
}
export function WorldGatewayDeck({projects,creators,status,state}:Props){
  const [active,setActive]=useState<ModuleKey>("discover");
  const buttons=useRef<Array<HTMLButtonElement|null>>([]);
  const selected=modules.find(item=>item.id===active)!;
  const games=projects.filter(item=>item.category==="games");
  const latest=[...projects].sort((a,b)=>(Date.parse(b.publishedAt||"")||0)-(Date.parse(a.publishedAt||"")||0))[0];
  const creator=creators[0];
  const hasVerifiedRecords=state==="ready";
  function select(index:number){
    setActive(modules[index].id);
    buttons.current[index]?.focus();
  }
  function keydown(event:KeyboardEvent<HTMLButtonElement>,index:number){
    const key=event.key;
    const next=key==="ArrowRight"||key==="ArrowDown"?(index+1)%modules.length:
      key==="ArrowLeft"||key==="ArrowUp"?(index+modules.length-1)%modules.length:
      key==="Home"?0:key==="End"?modules.length-1:null;
    if(next!==null){event.preventDefault();select(next);}
  }
  return <section id="world-gateways" className="av9-world-deck av73-world-deck" aria-labelledby="av73-world-heading">
    <header className="av73-world-heading">
      <span className="av73-world-eyebrow">ANEVUM / A CREATIVE NETWORK</span>
      <h1 id="av73-world-heading">What will you <em>make of it?</em></h1>
      <p>Play something. Find something. Meet someone. Make something. Choose an entry point and get straight to what matters.</p>
    </header>
    <div className="av73-world-workspace">
      <div className="av73-world-tabs" role="tablist" aria-label="Explore ANEVUM modules">
        {modules.map((item,index)=><button
          type="button" key={item.id} id={"av73-module-tab-"+item.id}
          ref={el=>{buttons.current[index]=el;}}
          className="av73-world-tab" role="tab" aria-selected={active===item.id}
          aria-controls="av73-module-content" tabIndex={active===item.id?0:-1}
          onClick={()=>setActive(item.id)} onKeyDown={event=>keydown(event,index)}>
          <span className="av73-tab-number">{item.number}</span>
          <span className="av73-tab-copy"><strong>{item.name}</strong><small>{item.short}</small></span>
          <Icon name="arrow" size={16}/>
        </button>)}
      </div>
      <div className={"av73-world-stage av73-world-stage--"+active}
        id="av73-module-content" role="tabpanel"
        aria-labelledby={"av73-module-tab-"+active} tabIndex={0}>
        <div className="av73-stage-top">
          <span className="av73-stage-index">MODULE / {selected.number}</span>
          {active==="create"?<span className="av73-stage-state">Access checked inside Studio</span>:<Availability state={state}/>}
        </div>
        <div className="av73-stage-description">
          <h2>{selected.heading}</h2>
          <p>{selected.description}</p>
        </div>
        <div className="av73-stage-evidence">
          {active==="play"&&<div className="av73-stage-record">
            {hasVerifiedRecords?
              games.length?<><span>FROM APPROVED GAMES</span><strong>{games[0].title}</strong><Link to={projectDetailPath(games[0].id,"/")}>Open this game <Icon name="arrow" size={15}/></Link></>:
              <><span>PUBLIC GAME DIRECTORY</span><strong>No approved games published yet.</strong><small>The catalogue is open for browsing; no releases have been invented to fill it.</small></>:
              <><span>PUBLIC GAME DIRECTORY</span><strong>{state==="loading"?"Checking available games":"Cannot verify games at present"}</strong></>}
          </div>}
          {active==="discover"&&<div className="av73-stage-record">
            {hasVerifiedRecords&&latest?<><span>LATEST APPROVED RELEASE</span><strong>{latest.title}</strong><Link to={projectDetailPath(latest.id,"/")}>Open this work <Icon name="arrow" size={15}/></Link></>:
              <><span>PUBLIC CATALOGUE</span><strong>{hasVerifiedRecords?"No approved releases published yet.":state==="loading"?"Checking available work":"Cannot verify releases at present"}</strong></>}
          </div>}
          {active==="connect"&&<div className="av73-stage-record">
            {hasVerifiedRecords?<><span>{status?.features?.communityPosts===true?"COMMUNITY DISCUSSIONS AVAILABLE":"COMMUNITY READING"}</span>
              <strong>{creator?creator.displayName:"Creator directory"}</strong>
              <small>{status?.features?.communityPosts===true?"Read independently reviewed discussions and meet members.":"Public reading is available. Posting remains gated until enabled."}</small>
              {creator&&<Link to={"/creators/"+encodeURIComponent(creator.handle)}>Meet this creator <Icon name="arrow" size={15}/></Link>}</>:
              <><span>COMMUNITY DIRECTORY</span><strong>{state==="loading"?"Checking public creators":"Cannot verify community records at present"}</strong></>}
          </div>}
          {active==="create"&&<div className="av73-stage-record">
            <span>CREATOR WORKSPACE</span><strong>Your work stays yours.</strong>
            <small>Draft privately. Publishing is subject to member access, review and current platform availability.</small>
          </div>}
        </div>
        <div className="av73-stage-actions">
          <Link className="av73-action-main" to={selected.to}>{selected.action}<Icon name="arrow" size={16}/></Link>
          <div className="av73-action-secondary">
            {active==="play"&&<><Link to="/discover?category=games">All games</Link><Link to="/discover?category=learning">Interactive learning</Link></>}
            {active==="discover"&&<><Link to="/discover?category=tools">Apps</Link><Link to="/discover?category=creative">Art</Link><Link to="/discover?category=libraries">Open source</Link></>}
            {active==="connect"&&<><Link to="/creators">Creators</Link><Link to="/boards">Public boards</Link></>}
            {active==="create"&&<><Link to="/join">Member access</Link><Link to="/guide">Field guide</Link></>}
          </div>
        </div>
      </div>
    </div>
    <p className="av73-world-footnote">Real work. Real people. No synthetic projects, audience statistics, or activity.</p>
  </section>;
}
