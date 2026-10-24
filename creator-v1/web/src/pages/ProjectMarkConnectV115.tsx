import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import './project-marks-v115.css';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const STATE=/^[a-f0-9]{32,128}$/;
type Project={projectId:string;title:string;connection:'optional';trust:'creator_attested'};
async function getProject(id:string,signal:AbortSignal):Promise<Project>{
 const response=await fetch('/api/v1/public/marks/projects/'+id,{signal,method:'GET',
  mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error'});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('Project unavailable');
 const p=await response.json() as Project;
 if(p.projectId!==id||typeof p.title!=='string'||p.title.length>100||p.trust!=='creator_attested')
  throw Error('Invalid publisher');
 return p;
}
export function ProjectMarkConnectV115(){
 const [qs]=useSearchParams();
 const projectId=qs.get('project')||'',state=qs.get('state')||'';
 const valid=UUID.test(projectId)&&STATE.test(state)&&qs.size===2;
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const [record,setRecord]=useState<Project|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!valid)return;
  const ac=new AbortController();setLoading(true);setError('');setRecord(null);
  getProject(projectId,ac.signal).then(p=>{if(!ac.signal.aborted)setRecord(p);})
   .catch(()=>{if(!ac.signal.aborted)setError('This project has no approved achievement connection.');})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false);});
  return ()=>ac.abort();
 },[valid,projectId]);
 async function approve(){
  if(!record||busy||!session?.user?.emailVerified)return;
  setBusy(true);setError('');
  try{
   const result=await fetch('/api/v1/member/marks/connect',{method:'POST',mode:'same-origin',
    credentials:'same-origin',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',
    headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({projectId,state})});
   if(!result.ok||!result.headers.get('content-type')?.includes('application/json'))throw Error('Connection unavailable');
   const data=await result.json() as {redirectUrl?:string;project?:Project};
   const redirect=new URL(data.redirectUrl||'');
   if(redirect.protocol!=='https:'||redirect.username||redirect.password||!redirect.searchParams.get('code')||
    redirect.searchParams.get('state')!==state||redirect.searchParams.get('code')?.length!==64)
     throw Error('Unsafe connection destination');
   window.location.replace(redirect.href);
  }catch{setError('The connection could not be verified. No account access was granted.');setBusy(false);}
 }
 return <section className="pm-connect" aria-labelledby="pm-connect-title">
  <span className="pm-kicker">CONTINUANCE INSTITUTE / MEMBER CONNECTION</span>
  <h1 id="pm-connect-title">Connect an experience.</h1>
  {!valid?<p role="alert">This connection link is invalid. Return to the game and start again.</p>:
   <>{loading||isPending?<p role="status">Checking ANEVUM identity and approved project…</p>:null}
    {record&&<div className="pm-connection-card"><span className="pm-kicker">EXTERNAL CREATOR PROJECT</span>
      <h2>{record.title}</h2>
      <p>Let this creator report your in-game or in-app milestones to your ANEVUM collection. The creator receives an opaque connection identifier, not your email, profile details, cookies or ANEVUM password.</p>
      <p>Achievements are <strong>creator-reported project marks</strong>, not independently verified gameplay or ANEVUM institutional honors. They grant no platform XP. Your public profile stays unchanged unless you choose to feature earned marks.</p>
      {!session?.user?.id?<><p>You must sign in to your ANEVUM account to connect this project.</p>
       <Link to="/join">Sign in to ANEVUM</Link><p className="pm-muted">After signing in, start the connection from your game again.</p></>:
       session.user.emailVerified!==true?<p role="alert">Verify your ANEVUM account email before linking a game.</p>:
       <div className="pm-actions"><button type="button" disabled={busy} onClick={()=>void approve()}>{busy?'Verifying connection…':'Allow achievement connection'}</button>
        <Link to="/member">Not now</Link></div>}
    </div>}
    {error&&<p role="alert">{error}</p>}</>}
  <p className="pm-muted">You can disconnect individual games and hide all project marks in your member profile.</p>
 </section>;
}
