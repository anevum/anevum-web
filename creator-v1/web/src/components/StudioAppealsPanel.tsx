import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {
 studioOwnerAppeals,studioFileAppeal,studioAppealReviewQueue,studioDecideAppeal,
 type StudioOwnerAppeal,type StudioReviewAppeal,
 type StudioAppealReason,type StudioAppealDecision
} from '../lib/canonical-studio';

const grounds:[StudioAppealReason,string][]=[
 ['ownership','I can demonstrate rights or original ownership'],
 ['false_positive','The takedown was based on an error'],
 ['missing_context','Material context was overlooked'],
 ['other','Other documented grounds']
];
const decisions:[StudioAppealDecision,string][]=[
 ['upheld','Uphold the removal'],
 ['eligible_for_re_review','Allow a new, separate publication review']
];
const status=(v:StudioOwnerAppeal)=>v.decision==='upheld'?'REMOVAL UPHELD':
 v.decision==='eligible_for_re_review'?'ELIGIBLE FOR FRESH REVIEW':
 v.appealId?'AWAITING INDEPENDENT DECISION':'APPEAL AVAILABLE';

export function StudioAppealsPanel(){
 const [cases,setCases]=useState<StudioOwnerAppeal[]>([]);
 const [busy,setBusy]=useState(''),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [grounds,setGrounds]=useState<Record<string,StudioAppealReason>>({});
 const [details,setDetails]=useState<Record<string,string>>({});
 useEffect(()=>{
  const controller=new AbortController();
  studioOwnerAppeals(controller.signal).then(v=>{if(!controller.signal.aborted)setCases(v.cases)})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Appeals unavailable')})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[]);
 async function submit(item:StudioOwnerAppeal){
  const reason=grounds[item.projectId],statement=(details[item.projectId]||'').trim();
  if(busy||!reason||statement.length<40||statement.length>2000)return;
  if(!window.confirm('File one permanent appeal for '+item.title+'? The submission and decision remain in the private audit record. Filing does not restore content or achievements.'))return;
  setBusy(item.projectId);setError('');setNotice('');
  try{
   await studioFileAppeal(item.projectId,item.takenDownAt,reason,statement);
   const records=await studioOwnerAppeals();
   setCases(records.cases);
   setNotice('Appeal recorded for independent review. The public release and revoked awards remain inactive.');
  }catch(e){setError(e instanceof Error?e.message:'The appeal was not accepted.');}
  finally{setBusy('')}
 }
 return <section className="st-panel st-appeal-desk" aria-label="My creation appeals">
  <div className="st-section-head"><div>
   <p className="st-kicker">CONTINUANCE INSTITUTE / CREATOR RIGHTS</p>
   <h2>CHALLENGE A SAFETY REMOVAL.</h2>
  </div></div>
  <p className="st-muted">You may contest an independently documented removal of your original creation. An appeal goes to a different reviewer who was not involved in publication approval or the takedown. Your private uploads remain private.</p>
  {loading&&<p role="status">Verifying your private publication history…</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
  {notice&&<p role="status" className="st-success">{notice}</p>}
  {!loading&&!error&&cases.length===0&&<div className="st-empty">
   <h3>NO CREATION REMOVALS.</h3>
   <p>There are no independent takedown decisions linked to your verified account.</p>
   <Link className="st-action" to="/studio">RETURN TO MY PROJECTS ↗</Link>
  </div>}
  <div className="st-review-list">{cases.map(item=><article className="st-review" key={item.projectId}>
   <p className="st-kicker">PRIVATE RECORD / {item.takedownReason.toUpperCase().replaceAll('_',' ')} / {new Date(item.takenDownAt*1000).toLocaleDateString()}</p>
   <h3>{item.title}</h3>
   <div className="st-publication-state"><strong>{status(item)}</strong><small>The creation remains unavailable in the public atlas unless it passes a new independent release procedure.</small></div>
   {item.appealId?<div className="st-appeal-outcome">
    <p><strong>YOUR APPEAL</strong> · {item.reasonCode?.replaceAll('_',' ')}</p>
    <p className="st-muted">{item.statement}</p>
    {item.reviewExplanation&&<><p><strong>INDEPENDENT FINDING</strong> · {item.decision?.replaceAll('_',' ')}</p>
     <p className="st-muted">{item.reviewExplanation}</p></>}
   </div>:<>
    <label className="st-field"><span>GROUNDS FOR REVIEW</span>
     <select disabled={Boolean(busy)} value={grounds[item.projectId]||''}
      onChange={e=>setGrounds(v=>({...v,[item.projectId]:e.target.value as StudioAppealReason}))}>
      <option value="">Select the strongest grounds</option>
      {groundsList().map(([key,name])=><option key={key} value={key}>{name}</option>)}
     </select></label>
    <label className="st-field"><span>YOUR EVIDENCE AND EXPLANATION / 40–2000 CHARACTERS</span>
     <textarea rows={6} maxLength={2000} disabled={Boolean(busy)} value={details[item.projectId]||''}
      onChange={e=>setDetails(v=>({...v,[item.projectId]:e.target.value}))}
      placeholder="Describe the evidence, original authorship, license or specific error. Do not include passwords, private contact details or credentials."/>
    </label>
    <button className="st-button" type="button"
     disabled={Boolean(busy)||!grounds[item.projectId]||(details[item.projectId]||'').trim().length<40}
     onClick={()=>void submit(item)}>
     {busy===item.projectId?'RECORDING APPEAL…':'SUBMIT FORMAL CREATION APPEAL'}
    </button>
   </>}
  </article>)}</div>
  <p className="st-muted">An accepted appeal does not automatically republish removed links, restore XP, or reissue awards. A new rights-and-safety approval is required.</p>
 </section>;
}
function groundsList(){return grounds;}

export function StudioAppealReviewDesk(){
 const [cases,setCases]=useState<StudioReviewAppeal[]>([]),[loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [chosen,setChosen]=useState<Record<string,StudioAppealDecision>>({});
 const [explanations,setExplanations]=useState<Record<string,string>>({});
 useEffect(()=>{
  const ac=new AbortController();
  studioAppealReviewQueue(ac.signal).then(v=>{if(!ac.signal.aborted)setCases(v.cases)})
   .catch(e=>{if(!ac.signal.aborted)setError(e instanceof Error?e.message:'Independent appeal review unavailable')})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[]);
 async function decide(item:StudioReviewAppeal){
  const decision=chosen[item.id],why=(explanations[item.id]||'').trim();
  if(busy||!decision||why.length<40||why.length>1800)return;
  if(!window.confirm('Record this final independent review decision for '+item.title+'? It does not restore the public work or any revoked badge, and it cannot be edited.'))return;
  setBusy(item.id);setError('');setNotice('');
  try{
   await studioDecideAppeal(item.id,item.filedAt,decision,why);
   const refreshed=await studioAppealReviewQueue();
   setCases(refreshed.cases);
   setNotice('Independent finding saved. The takedown remains active; an eligible case requires a separate fresh release review.');
  }catch(e){setError(e instanceof Error?e.message:'Review decision rejected.');}
  finally{setBusy('')}
 }
 return <section className="st-panel st-appeal-desk" aria-label="Independent creator appeal review">
  <div className="st-section-head"><div>
   <p className="st-kicker">CONTINUANCE INSTITUTE / SECOND-REVIEW AUTHORITY</p>
   <h2>INDEPENDENT APPEALS.</h2>
  </div></div>
  <p className="st-muted">Reviewers must be separately allowlisted and cannot be the original creation owner, publication approver, or takedown officer. Decisions are permanent evidence; this desk cannot republish content or restore awards.</p>
  {loading&&<p role="status">Checking the independently assigned appeal queue…</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
  {notice&&<p role="status" className="st-success">{notice}</p>}
  {!loading&&!error&&cases.length===0&&<p className="st-muted">No pending appeals are eligible for your independent review.</p>}
  <div className="st-review-list">{cases.map(item=><article className="st-review" key={item.id}>
   <p className="st-kicker">@{item.handle} / {item.takedownReason.toUpperCase().replaceAll('_',' ')} / APPEALED {new Date(item.filedAt*1000).toLocaleDateString()}</p>
   <h3>{item.title}</h3>
   <div className="st-appeal-outcome"><strong>CREATOR'S STATEMENT · {item.reasonCode.replaceAll('_',' ').toUpperCase()}</strong><p className="st-muted">{item.statement}</p></div>
   <label className="st-field"><span>SECOND-REVIEW DETERMINATION</span>
    <select value={chosen[item.id]||''} disabled={Boolean(busy)}
     onChange={e=>setChosen(v=>({...v,[item.id]:e.target.value as StudioAppealDecision}))}>
     <option value="">Choose one verified determination</option>
     {decisions.map(([key,name])=><option key={key} value={key}>{name}</option>)}
    </select></label>
   <label className="st-field"><span>EXPLAIN EVIDENCE AND GROUNDS / 40–1800 CHARACTERS</span>
    <textarea rows={5} maxLength={1800} disabled={Boolean(busy)}
     value={explanations[item.id]||''} onChange={e=>setExplanations(v=>({...v,[item.id]:e.target.value}))}
     placeholder="State the evidence you independently checked and why your finding is justified."/>
   </label>
   <button className="st-button" type="button" disabled={Boolean(busy)||!chosen[item.id]||(explanations[item.id]||'').trim().length<40}
    onClick={()=>void decide(item)}>
    {busy===item.id?'SAVING THE INDEPENDENT FINDING…':'RECORD FINAL SECOND-REVIEW DECISION'}
   </button>
  </article>)}</div>
 </section>;
}
