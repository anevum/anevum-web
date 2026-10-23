import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {studioCreate,type StudioDraft,type StudioProject} from '../lib/canonical-studio';
import {STARTER_PRESETS,starterDraft,type StarterKind} from '../lib/studio-starters-v110';

type Props={onClose:()=>void;onCreated:(project:StudioProject)=>void};

export function StudioNewProjectDialog({onClose,onCreated}:Props){
 const [kind,setKind]=useState<StarterKind>('game');
 const [title,setTitle]=useState('');
 const [summary,setSummary]=useState(STARTER_PRESETS[0].suggestedSummary);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [attempted,setAttempted]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const locked=useRef(false);
 const requestId=useRef(crypto.randomUUID());
 const submitted=useRef<StudioDraft|null>(null);
 const onCloseRef=useRef(onClose);
 onCloseRef.current=onClose;

 useEffect(()=>{
  const element=dialog.current;
  const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(element&&!element.open)element.showModal();
  return()=>{
   if(element?.open)element.close();
   prior?.focus({preventScroll:true});
  };
 },[]);

 function select(next:StarterKind){
  if(submitted.current)return;
  setKind(next);
  setSummary(STARTER_PRESETS.find(p=>p.id===next)?.suggestedSummary||'');
  setError('');
 }

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(locked.current)return;
  let draft:StudioDraft;
  try{draft=submitted.current||starterDraft(kind,title,summary,requestId.current);}
  catch(e){setError(e instanceof Error?e.message:'Invalid project details.');return;}
  // Preserve the original draft and idempotency key after any uncertain network
  // response; retrying with different data must not create mismatched projects.
  submitted.current=draft;
  locked.current=true;setBusy(true);setError('');setAttempted(true);
  try{
   const response=await studioCreate(draft,requestId.current);
   onCreated(response.project);
  }catch(e){
   setError((e instanceof Error?e.message:'The creation result is not confirmed.')+
    ' No new project has been confirmed. Check Project records before retrying this same request.');
  }finally{locked.current=false;setBusy(false);}
 }

 return <dialog ref={dialog} className="csw-create-dialog" aria-labelledby="csw-create-title"
   aria-describedby="csw-create-description" onCancel={event=>{
    event.preventDefault();if(!locked.current)onCloseRef.current();
   }}>
  <form onSubmit={event=>void submit(event)}>
   <header className="csw-create-header">
    <p className="csw-eyebrow">CONTINUANCE INSTITUTE / CREATION PROTOCOL</p>
    <h2 id="csw-create-title">Begin a new project.</h2>
    <p id="csw-create-description">Start a real private ANEVUM project record. Playable builds and source-file work remain separate workflows.</p>
   </header>
   <fieldset className="csw-starters" disabled={busy||attempted}>
    <legend>Choose a project starter</legend>
    <div className="csw-starter-grid">
     {STARTER_PRESETS.map(p=><label key={p.id} className={'csw-starter'+(kind===p.id?' is-selected':'')}>
      <input type="radio" name="creator-starter" value={p.id} checked={kind===p.id}
       onChange={()=>select(p.id)}/>
      <span><strong>{p.label}</strong><small>{p.description}</small></span>
     </label>)}
    </div>
   </fieldset>
   <div className="csw-create-fields">
    <label>Project title
     <input autoFocus required minLength={3} maxLength={100} disabled={busy||attempted}
      value={title} onChange={event=>setTitle(event.target.value)} placeholder="The First Signal" />
    </label>
    <label>Summary
     <textarea required minLength={10} maxLength={280} rows={3} disabled={busy||attempted}
      value={summary} onChange={event=>setSummary(event.target.value)}/>
    </label>
   </div>
   <p className="csw-create-note">This creates a private editable record with the chosen category. It does not generate runnable code, publish a creation or grant upload permission.</p>
   {error&&<div className="csw-error" role="alert">{error}
    {attempted&&<p><Link to="/studio/records">Inspect existing projects ↗</Link></p>}
   </div>}
   <footer className="csw-create-actions">
    <button type="button" className="csw-action csw-subtle" onClick={onClose} disabled={busy}>Cancel</button>
    <button type="submit" className="csw-action csw-strong" disabled={busy||title.trim().length<3||summary.trim().length<10}>
     {busy?'Creating private record…':attempted?'Retry same request':'Create private project'}
    </button>
   </footer>
  </form>
 </dialog>;
}
