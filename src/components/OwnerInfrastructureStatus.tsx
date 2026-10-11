import {useEffect,useState} from "react";

type Worker = {name:string;environment:string;state:string;revision:string|null;deployed_at:string|null};
type Service = {name:string;state:string;deployment_status:string|null;deployed_at:string|null};
type Infra = {
  schema_version:"anevum.owner.infrastructure.v1";
  observed_at:string;
  can_mutate:false;
  broker_connected:false;
  providers:{
    cloudflare:{provider:"cloudflare";state:string;workers:Worker[]};
    railway:{provider:"railway";state:string;environment:string;project_name:string|null;services:Service[];truncated:boolean}
  };
};
const STATE = new Set(["OBSERVED","PARTIAL","NOT_CONFIGURED","UNAVAILABLE","NO_SERVICES","NO_DEPLOYMENTS","NO_DEPLOYMENT"]);
const workers = ["anevum-web-nextgen","anevum-member-staging"];
function valid(value:unknown):value is Infra {
  if (!value || typeof value !== "object") return false;
  const v=value as Partial<Infra>, cf=v.providers?.cloudflare, rail=v.providers?.railway;
  return v.schema_version==="anevum.owner.infrastructure.v1" && v.can_mutate===false &&
    v.broker_connected===false && !!v.observed_at && !!cf && !!rail &&
    cf.provider==="cloudflare" && STATE.has(cf.state) &&
    Array.isArray(cf.workers) && cf.workers.length===2 &&
    cf.workers.every((w,i)=>w.name===workers[i] && STATE.has(w.state)) &&
    rail.provider==="railway" && STATE.has(rail.state) && rail.environment==="production" &&
    Array.isArray(rail.services) && rail.services.length<=8 &&
    rail.services.every(row=>STATE.has(row.state)) && typeof rail.truncated==="boolean";
}
function stamp(value:string|null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "No verified time";
  return new Date(value).toLocaleString();
}
function stateText(state:string){
  if(state==="NOT_CONFIGURED")return "Not connected";
  if(state==="NO_SERVICES")return "No deployed services";
  if(state==="NO_DEPLOYMENTS"||state==="NO_DEPLOYMENT")return "No deployment record";
  if(state==="PARTIAL")return "Partial observation";
  if(state==="OBSERVED")return "Source observed";
  return "Unavailable";
}
export default function OwnerInfrastructureStatus(){
  const [data,setData]=useState<Infra|null>(null);
  const [error,setError]=useState("Loading provider observations…");
  useEffect(()=>{
    const controller=new AbortController();
    async function read(){
      try{
        const resp=await fetch("/api/command/integrations/infrastructure",{
          method:"GET",credentials:"same-origin",cache:"no-store",signal:controller.signal
        });
        if(!resp.ok)throw new Error("Not authorized or unavailable");
        const json:unknown=await resp.json();
        if(!valid(json))throw new Error("Unexpected infrastructure contract");
        if(!controller.signal.aborted){setData(json);setError("");}
      }catch{
        if(!controller.signal.aborted){setData(null);setError("Provider evidence unavailable; do not assume services are online.");}
      }
    }
    void read();
    const timer=window.setInterval(()=>void read(),300000);
    return ()=>{controller.abort();window.clearInterval(timer);};
  },[]);
  const cf=data?.providers.cloudflare;
  const rw=data?.providers.railway;
  return <section className="command-v4-card command-v4-infrastructure" aria-label="Owner infrastructure observations">
    <header><div><span>INFRASTRUCTURE / READ-ONLY</span><strong>Cloudflare and Railway</strong></div>
      <small>{data?"Checked "+stamp(data.observed_at):"Not yet verified"}</small></header>
    <p className="command-v4-github-disclaimer">Provider deployment records are not proof of service health. Missing credentials, incomplete reads and retired runtimes are never shown as healthy.</p>
    {error && <p className="command-v4-github-disclaimer" role="status">{error}</p>}
    <div className="command-v4-infra-group">
      <h3>Cloudflare · {stateText(cf?.state||"UNAVAILABLE")}</h3>
      <div className="command-v4-table">
        {(cf?.workers||workers.map((name,i)=>({name,environment:i?"review-staging":"production",state:"UNAVAILABLE",revision:null,deployed_at:null}))).map(w=>
          <div className="command-v4-infra-row" key={w.name}>
            <strong>{w.name}</strong><span>{w.environment}</span>
            <span>{stateText(w.state)}{w.revision?" · "+w.revision.slice(0,8):""}</span>
            <b>{stamp(w.deployed_at)}</b>
          </div>)}
      </div>
    </div>
    <div className="command-v4-infra-group">
      <h3>Railway · {stateText(rw?.state||"UNAVAILABLE")}</h3>
      <p className="command-v4-github-disclaimer">{rw?.project_name||"RHEN project"} · production environment. Deployment outcome only; no live-trading claim.</p>
      {rw?.state==="NO_SERVICES" && <p className="command-v4-github-disclaimer">No RHEN services are deployed in the queried production environment.</p>}
      {rw?.truncated && <p className="command-v4-github-disclaimer">Additional services exist beyond the bounded observation limit.</p>}
      <div className="command-v4-table">{(rw?.services||[]).map((service,i)=>
        <div className="command-v4-infra-row" key={i}>
          <strong>{service.name}</strong>
          <span>{stateText(service.state)}</span>
          <span>{service.deployment_status||"No trusted deployment state"}</span>
          <b>{stamp(service.deployed_at)}</b>
        </div>)}</div>
    </div>
    <p className="command-v4-github-disclaimer">Connections require separately approved provider credentials. No deployment, database, broker or infrastructure mutations are possible from this view.</p>
  </section>;
}
