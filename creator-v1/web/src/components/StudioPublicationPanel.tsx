import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import type {StudioProject,StudioPublicationState,StudioReviewReceipt} from '../lib/canonical-studio';
import {
 studioPublicationConsent,studioPublicationState,studioPublicationWithdraw,studioReviewReceipts
} from '../lib/canonical-studio';

/** V070: creator consent is attached to one frozen, independent-review snapshot.
 * This component NEVER publishes or plays user-uploaded bytes. It is rendered
 * only if the server advertises the separately gated publication readiness.
 */
export function StudioPublicationPanel({project,onStatusChange}:{
 project:StudioProject;onStatusChange?:(status:string|null)=>void
}){
 const [state,setState]=useState<StudioPublicationState|null>(null);
 const [receipt,setReceipt]=useState<StudioReviewReceipt|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{
  const abort=new AbortController();setLoading(true);setError('');setMessage('');
  Promise.all([studioPublicationState(project.id,abort.signal),
   studioReviewReceipts(project.id,abort.signal)])
   .then(([status,history])=>{
    if(abort.signal.aborted)return;
    setState(status);
    setReceipt(history.submissions.find(item=>item.revision===project.revision)??null);
    onStatusChange?.(status.publicationStatus??null);
   }).catch(e=>{
    if(abort.signal.aborted)return;
    setError(e instanceof Error?e.message:'Publication status could not be verified.');
    onStatusChange?.('unknown');
   }).finally(()=>{if(!abort.signal.aborted)setLoading(false)});
  return()=>abort.abort();
 },[project.id,project.revision,onStatusChange]);
 const eligible=Boolean(receipt?.status==='pending_review'&&receipt.assets.length===0&&
  (receipt.sourceUrl||receipt.demoUrl)&&project.status==='pending_review');
 async function mutate(action:'consent'|'withdraw'){
  if(!receipt||busy||!confirmed||!state)return;
  if(action==='consent'&&!eligible)return;
  if(action==='withdraw'&&!window.confirm('Remove your public creation listing or revoke the permission to publish it? This does not delete your private project or historic review records.'))return;
  setBusy(true);setError('');setMessage('');
  try{
   if(action==='consent'){
    await studioPublicationConsent(project.id,receipt.id,project.revision);
    const next={...state,consented:true};
    setState(next);setMessage('Consent saved for this exact submission. Independent review is still required; nothing has been published.');
   }else{
    const result=await studioPublicationWithdraw(project.id,receipt.id,project.revision);
    const next={...state,consented:false,publicationStatus:result.publicationStatus??null};
    setState(next);onStatusChange?.(next.publicationStatus);
    setMessage('Your public listing and/or release consent has been withdrawn. Private files remain untouched.');
   }
   setConfirmed(false);
  }catch(e){setError(e instanceof Error?e.message:'Could not change publication consent.');}
  finally{setBusy(false)}
 }
 return <section className="st-panel st-publication" aria-label="External metadata publication consent">
  <p className="st-kicker">05 / EXTERNAL PUBLICATION PILOT</p>
  <h2>AUTHORIZE THE PUBLIC RECORD.</h2>
  <p className="st-muted">Only the title, summary, rights, your creator handle and verified external HTTPS links can become public. This does not host your files or make games executable. Uploaded files always remain private.</p>
  {loading&&<p role="status">Verifying the frozen submission and your publication status…</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
  {!loading&&state&&<>
   <div className="st-publication-state">
    <strong>{state.publicationStatus==='published'?'PUBLIC METADATA LIVE':state.publicationStatus==='withdrawn'?'PUBLICATION WITHDRAWN':
     state.consented?'AWAITING INDEPENDENT RELEASE REVIEW':'NOT AUTHORIZED FOR PUBLIC RELEASE'}</strong>
    <small>Scope: external metadata only · Revision {project.revision}</small>
   </div>
   {!eligible&&!state.publicationStatus&&<p className="st-muted">A current frozen submission with an external HTTPS link and zero attached files is required. Remove private attachments before resubmitting; file scanning and native playback are not part of this release.</p>}
   {!state.consented&&!state.publicationStatus&&eligible&&<label className="st-check">
    <input type="checkbox" checked={confirmed} disabled={busy}
      onChange={event=>setConfirmed(event.target.checked)}/>
    I authorize the named external links and descriptive metadata from this exact submission to appear publicly if independent staff approve its rights and contents.
   </label>}
   {state.publicationStatus==='published'&&<p className="st-muted">This external-link record is publicly available. You can withdraw the listing without deleting your private draft.</p>}
   {(state.consented||state.publicationStatus==='published')&&<label className="st-check">
    <input type="checkbox" checked={confirmed} disabled={busy}
      onChange={event=>setConfirmed(event.target.checked)}/>
    I understand that revoking consent removes the public listing, not the internal review history.
   </label>}
   <div className="st-actions">
    {!state.consented&&!state.publicationStatus&&eligible&&<button type="button" className="st-button"
     disabled={!confirmed||busy} onClick={()=>void mutate('consent')}>AUTHORIZE EXTERNAL METADATA</button>}
    {(state.consented||state.publicationStatus==='published')&&<button type="button" className="st-link"
     disabled={!confirmed||busy} onClick={()=>void mutate('withdraw')}>REVOKE CONSENT / WITHDRAW PUBLIC RECORD</button>}
    <Link to="/recognition" className="st-link">ACHIEVEMENT CRITERIA ↗</Link>
   </div>
   {message&&<p role="status" className="st-success">{message}</p>}
  </>}
 </section>;
}
