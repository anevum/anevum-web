import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {
 studioSafetyQueue,studioSafetyTakedown,
 type StudioSafetyRecord,type StudioSafetyReason
} from '../lib/canonical-studio';

const reasons:{code:StudioSafetyReason;label:string}[]=[
 {code:'rights',label:'Copyright, ownership or licensing'},
 {code:'unsafe_content',label:'Unsafe public content'},
 {code:'malicious_link',label:'Malicious or compromised external link'},
 {code:'impersonation',label:'Identity or authorship impersonation'},
 {code:'fraud',label:'Falsified evidence or award farming'},
 {code:'other',label:'Other documented safety violation'}
];

/** Independent release officer only. This UI never grants moderator rights. */
export function StudioSafetyDesk(){
 const [items,setItems]=useState<StudioSafetyRecord[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null);
 const [code,setCode]=useState<Record<string,StudioSafetyReason>>({});
 const [reason,setReason]=useState<Record<string,string>>({});
 const [ack,setAck]=useState<Record<string,boolean>>({});
 useEffect(()=>{
  const controller=new AbortController();
  studioSafetyQueue(controller.signal)
   .then(x=>{if(!controller.signal.aborted)setItems(x.creations)})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Safety review unavailable')})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[]);
 async function takeDown(item:StudioSafetyRecord){
  if(busy!==null||!code[item.id]||!ack[item.id]||(reason[item.id]?.trim().length??0)<25)return;
  const confirmation=window.confirm(
   'Remove this public creation record and reconcile any earned creation badges?\n\n'+
   item.title+' by @'+item.handle+
   '\n\nThis is an audited action. Reinstatement requires a separate appeal. Private files remain private.'
  );
  if(!confirmation)return;
  setBusy(item.id);setError('');setNotice('');
  try{
   const result=await studioSafetyTakedown(item.id,item.publishedAt,code[item.id],reason[item.id].trim());
   setItems(existing=>existing.filter(x=>x.id!==item.id));
   setNotice('Public record removed. Historical evidence retained. '+
    (result.revokedBadges.length?'Revoked: '+result.revokedBadges.join(', '):'No badges fell below the verified threshold.')+
    ' No XP, medals or private assets were changed.');
  }catch(e){setError(e instanceof Error?e.message:'The takedown was not accepted. Check the record and try again.')}
  finally{setBusy(null)}
 }
 return <section className="st-panel st-safety-desk" aria-label="Independent Studio publication safety review">
  <div className="st-section-head"><div>
   <p className="st-kicker">INDEPENDENT SAFETY OFFICER / CREATION RELEASES</p>
   <h2>PUBLICATION SAFEGUARDS.</h2>
  </div></div>
  <p className="st-muted">This role is separate from forum moderation and ordinary Creator Studio review. Every decision records a reason, the reviewing officer, its exact publication and the effect on earned creation badges. A creator cannot review their own record.</p>
  <p className="st-muted">This desk does not scan or serve private files. A takedown hides public metadata and reconciles creation badges; XP and prestigious medals are unchanged. Appeals and reinstatements require separate review.</p>
  {loading&&<p role="status">Verifying your independent safety authority…</p>}
  {error&&<p className="st-error" role="alert">{error}</p>}
  {notice&&<p className="st-success" role="status">{notice}</p>}
  {!loading&&!error&&items.length===0&&<div className="st-empty"><h3>NO REVIEWABLE PUBLIC RECORDS.</h3><p>All currently verified releases are clear, or no public metadata has been published yet.</p><Link to="/creations" className="st-action">VIEW PUBLIC ATLAS ↗</Link></div>}
  <div className="st-review-list">
   {items.map(item=><article key={item.id} className="st-review st-safety-record">
    <p className="st-kicker">{item.category.toUpperCase()} / @{item.handle} / VERIFIED PUBLICATION</p>
    <h3>{item.title}</h3><p>{item.summary}</p>
    <small>Publication ID: <code>{item.id}</code> · Published {new Date(item.publishedAt*1000).toLocaleDateString()}</small>
    <div className="st-actions"><Link to={'/creations/'+item.id} className="st-link">INSPECT PUBLIC RECORD ↗</Link></div>
    <label className="st-field"><span>REVIEW FINDING</span>
     <select disabled={busy!==null} value={code[item.id]||''}
      onChange={e=>setCode(x=>({...x,[item.id]:e.target.value as StudioSafetyReason}))}>
      <option value="">Select an evidenced reason</option>
      {reasons.map(v=><option key={v.code} value={v.code}>{v.label}</option>)}
     </select>
    </label>
    <label className="st-field"><span>REVIEW EVIDENCE / EXPLANATION (25-1200 CHARACTERS)</span>
     <textarea disabled={busy!==null} maxLength={1200} rows={4}
      value={reason[item.id]||''} onChange={e=>setReason(x=>({...x,[item.id]:e.target.value}))}
      placeholder="Document the verified harm, rights issue or review evidence. Do not paste private credentials."/>
    </label>
    <label className="st-check">
     <input type="checkbox" disabled={busy!==null} checked={ack[item.id]===true}
      onChange={e=>setAck(x=>({...x,[item.id]:e.target.checked}))}/>
     I verified the exact publication record and understand that removal may revoke creation badges whose verified work thresholds are no longer met.
    </label>
    <button type="button" className="st-button st-takedown-button"
     disabled={busy!==null||!code[item.id]||(reason[item.id]?.trim().length??0)<25||ack[item.id]!==true}
     onClick={()=>void takeDown(item)}>
     {busy===item.id?'RECORDING AUDITED DECISION…':'TAKE DOWN PUBLIC RECORD / RECONCILE AWARDS'}
    </button>
   </article>)}
  </div>
 </section>;
}
