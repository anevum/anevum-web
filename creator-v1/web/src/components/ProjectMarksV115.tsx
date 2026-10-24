import {useEffect,useState} from 'react';
import './project-marks-v115.css';
type Mark={id:string;projectId:string;projectTitle:string;stableKey:string;title:string;description:string;
 motif:string;rewardLabel:string;earnedAt:number;trust:'creator_attested'};
type MemberResponse={marks:Mark[];links:{linkId:string;projectId:string;title:string}[];
 display:{mode:'hidden'|'curated';pinnedIds:string[];revision:number};platformXp:0};
type PublicResponse={marks:Mark[]};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function validMark(m:Mark){return !!m&&UUID.test(m.id)&&UUID.test(m.projectId)&&
  typeof m.title==='string'&&m.title.length<=80&&typeof m.projectTitle==='string'&&m.projectTitle.length<=100&&
  typeof m.description==='string'&&m.description.length<=600&&m.trust==='creator_attested'&&
  Number.isSafeInteger(m.earnedAt)&&m.earnedAt>0;}
const format=at=>new Date(at*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
function Card({item}:{item:Mark}){
 return <article className="pm-mark">
  <span className="pm-symbol" aria-hidden="true">{({beacon:'◈',orbit:'◎',spark:'✧',atlas:'◇',key:'⌖',constellation:'✣'} as Record<string,string>)[item.motif]||'◈'}</span>
  <div><span className="pm-kicker">CREATOR-REPORTED PROJECT MARK</span><h3>{item.title}</h3>
   <p>{item.description}</p><small>From {item.projectTitle} · Earned {format(item.earnedAt)}</small>
   {item.rewardLabel&&<p className="pm-reward">Project reward: {item.rewardLabel}</p>}
  </div>
 </article>;
}
export function ProjectMarksPublicPanel({handle}:{handle:string}){
 const [marks,setMarks]=useState<Mark[]|null>(null);
 useEffect(()=>{
  if(import.meta.env.VITE_PROJECT_MARK_BRIDGE_V115!=='true')return;
  const ac=new AbortController();setMarks(null);
  fetch('/api/v1/members/'+encodeURIComponent(handle)+'/marks',{signal:ac.signal,
   credentials:'omit',mode:'same-origin',cache:'no-store',redirect:'error'}).then(async r=>{
    if(!r.ok)return null;const x=await r.json() as PublicResponse;
    return Array.isArray(x.marks)&&x.marks.length<=6&&x.marks.every(validMark)?x.marks:null;
   }).then(x=>{if(!ac.signal.aborted)setMarks(x);}).catch(()=>{if(!ac.signal.aborted)setMarks(null);});
  return ()=>ac.abort();
 },[handle]);
 if(import.meta.env.VITE_PROJECT_MARK_BRIDGE_V115!=='true'||!marks?.length)return null;
 return <section className="pm-public" aria-labelledby="pm-public-title">
  <span className="pm-kicker">PERSONAL COLLECTION / CURATED</span>
  <h2 id="pm-public-title">Earned across other worlds.</h2>
  <p className="pm-muted">Project achievements reported by their creators. These are separate from ANEVUM institutional honors.</p>
  <div className="pm-mark-grid">{marks.map(m=><Card key={m.id} item={m}/>)}</div>
 </section>;
}
export function ProjectMarksMemberPanel(){
 const [data,setData]=useState<MemberResponse|null>(null);
 const [selected,setSelected]=useState<string[]>([]);
 const [mode,setMode]=useState<'hidden'|'curated'>('hidden');
 const [pending,setPending]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  if(import.meta.env.VITE_PROJECT_MARK_BRIDGE_V115!=='true')return;
  const ac=new AbortController();setData(null);setNotice('');setError('');
  fetch('/api/v1/member/marks',{signal:ac.signal,mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error'})
   .then(async r=>{if(!r.ok)throw Error('private collection not ready');return r.json() as Promise<MemberResponse>;})
   .then(x=>{if(ac.signal.aborted)return;
    if(!Array.isArray(x.marks)||x.marks.length>100||!x.marks.every(validMark)||!Array.isArray(x.links)||
     !x.display||!Array.isArray(x.display.pinnedIds)||!['hidden','curated'].includes(x.display.mode)||
     !Number.isSafeInteger(x.display.revision))throw Error('invalid collection');
    setData(x);setMode(x.display.mode);setSelected(x.display.pinnedIds);
   }).catch(()=>{if(!ac.signal.aborted)setError('Your project marks are temporarily unavailable.');});
  return ()=>ac.abort();
 },[refresh]);
 async function save(){
  if(!data||pending)return;
  setPending(true);setNotice('');setError('');
  try{
   const selectedIds=mode==='curated'?selected:[];
   const res=await fetch('/api/v1/member/marks/display',{method:'PATCH',
    mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error',
    headers:{'content-type':'application/json'},body:JSON.stringify({mode,pinnedIds:selectedIds,revision:data.display.revision})});
   if(!res.ok)throw Error('Save rejected');
   setNotice('Profile visibility saved.');setRefresh(n=>n+1);
  }catch{setError('Display preferences changed or could not be saved. Reload before retrying.');}
  finally{setPending(false);}
 }
 async function disconnect(linkId:string){
  if(pending||!window.confirm('Disconnect this game from ANEVUM? Already earned marks remain in your private collection.'))return;
  setPending(true);setError('');
  try{
   const res=await fetch('/api/v1/member/marks/disconnect',{method:'POST',mode:'same-origin',credentials:'same-origin',
    cache:'no-store',redirect:'error',headers:{'content-type':'application/json'},body:JSON.stringify({linkId})});
   if(!res.ok)throw Error('Disconnect unavailable');
   setRefresh(n=>n+1);
  }catch{setError('The game connection could not be changed.');}
  finally{setPending(false);}
 }
 if(import.meta.env.VITE_PROJECT_MARK_BRIDGE_V115!=='true')return null;
 return <section className="pm-member" aria-labelledby="pm-member-title">
  <span className="pm-kicker">YOUR CONTINUANCE / PROJECT MARKS</span>
  <h2 id="pm-member-title">Achievements from other worlds.</h2>
  <p className="pm-muted">Separate from your official ANEVUM honors and XP. Your collection is private until you select what appears publicly.</p>
  {!data&&!error?<p role="status">Opening your project collection…</p>:null}
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {data&&<><div className="pm-mark-grid">{data.marks.length?data.marks.map(m=><Card key={m.id} item={m}/>):<p>No creator-reported achievements earned yet.</p>}</div>
   <fieldset className="pm-preferences"><legend>Public profile display</legend>
    <label><input type="radio" name="mark-mode" checked={mode==='hidden'} disabled={pending} onChange={()=>setMode('hidden')}/> Keep all private</label>
    <label><input type="radio" name="mark-mode" checked={mode==='curated'} disabled={pending} onChange={()=>setMode('curated')}/> Show selected marks</label>
    {mode==='curated'&&<div className="pm-picks">{data.marks.map(m=><label key={m.id}>
      <input type="checkbox" disabled={pending||(!selected.includes(m.id)&&selected.length>=6)}
       checked={selected.includes(m.id)} onChange={e=>setSelected(xs=>e.currentTarget.checked?[...xs,m.id]:xs.filter(id=>id!==m.id))}/>
      {m.title} <small>from {m.projectTitle}</small>
     </label>)}</div>}
    <button type="button" disabled={pending} onClick={()=>void save()}>Save public display</button>
   </fieldset>
   {data.links.length>0&&<section className="pm-links"><h3>Connected experiences</h3>
    {data.links.map(l=><div key={l.linkId}><span>{l.title}</span>
     <button type="button" disabled={pending} onClick={()=>void disconnect(l.linkId)}>Disconnect</button></div>)}
   </section>}
  </>}
 </section>;
}
