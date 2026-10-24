import * as React from 'react';
import {ACHIEVEMENT_MOTIFS,ACHIEVEMENT_STARTERS,normalizeAchievementDraft,previewAchievement,type AchievementDraft} from '../../../shared/creator-achievements-v114.mjs';
import type {AchievementTransport,AchievementRecord,AchievementInventory,AchievementHistory} from '../lib/studio-achievements-v114';
import './studio-achievements-v114.css';
type Props={projectId:string;api:AchievementTransport};
type State={inventory:AchievementInventory|null;selected:AchievementRecord|null;draft:AchievementDraft;baseline:string;
 loading:boolean;busy:boolean;error:string;notice:string;conflict:boolean;showArchived:boolean;count:number;history:AchievementHistory[]|null};
const fromRecord=(r:AchievementRecord):AchievementDraft=>({stableKey:r.stableKey,title:r.title,description:r.description,triggerKey:r.triggerKey,targetCount:r.targetCount,visibility:r.visibility,motif:r.motif,rewardLabel:r.rewardLabel});
const message=(e:unknown)=>e instanceof Error?e.message:'The draft could not be confirmed.';
/** Only a decorative project emblem, never the corporate mark or an official honor. */
function ProjectSigil({motif,ready}:{motif:string|null;ready:boolean}){
 return <svg className={'cav-sigil'+(ready?' is-ready':'')} viewBox="0 0 240 240" aria-hidden="true">
  <circle cx="120" cy="120" r="100"/><circle className="cav-sigil-orbit" cx="120" cy="120" r="88"/>
  <path d="M120 9v18m0 186v18M9 120h18m186 0h18"/>
  {motif===null?<path d="M99 115v-15a21 21 0 0142 0v15m-47 0h52v47H94z"/>:
   motif==='key'?<path d="M92 115a24 24 0 110-48 24 24 0 010 48zm16-8 52 52m-13-13 12-12m-24 0 12-12"/>:
   motif==='constellation'?<><path d="m72 139 35-60 56 28-18 55-73-23 91-32"/><circle cx="107" cy="79" r="7"/><circle cx="163" cy="107" r="7"/><circle cx="145" cy="162" r="7"/><circle cx="72" cy="139" r="7"/></>:
   motif==='atlas'?<><path d="m120 62 52 56-52 60-52-60zM68 118h104M120 62v116"/><circle cx="120" cy="118" r="24"/></>:
   motif==='spark'?<path d="m120 57 14 44 45 19-45 15-14 48-17-48-44-15 44-19z"/>:
   motif==='orbit'?<><circle cx="120" cy="120" r="30"/><ellipse cx="120" cy="120" rx="71" ry="25" transform="rotate(-35 120 120)"/></>:
   <><path d="m120 59 15 75-15 47-15-47zM77 120h86"/><circle cx="120" cy="120" r="44"/></>}
 </svg>;
}
export class CreatorAchievementBuilderV114 extends React.Component<Props,State>{
 private controller=new AbortController();
 private pendingCreate:{id:string;json:string}|null=null;
 state:State={inventory:null,selected:null,draft:{...ACHIEVEMENT_STARTERS[0].draft},baseline:JSON.stringify(ACHIEVEMENT_STARTERS[0].draft),loading:true,busy:false,error:'',notice:'',conflict:false,showArchived:false,count:0,history:null};
 componentDidMount(){if(this.controller.signal.aborted)this.controller=new AbortController();void this.load();window.addEventListener('beforeunload',this.beforeUnload);}
 componentWillUnmount(){this.controller.abort();window.removeEventListener('beforeunload',this.beforeUnload);}
 private beforeUnload=(event:BeforeUnloadEvent)=>{if(this.dirty){event.preventDefault();event.returnValue='';}};
 private get dirty(){return JSON.stringify(this.state.draft)!==this.state.baseline;}
 private get canEdit(){return !!this.state.inventory&&['draft','changes_requested'].includes(this.state.inventory.project.status);}
 private async load(){
  const signal=this.controller.signal;
  this.setState({loading:true,error:''});
  try{const inventory=await this.props.api.list(this.props.projectId,signal);if(!signal.aborted)this.setState({inventory,loading:false});}
  catch(e){if(!signal.aborted)this.setState({loading:false,error:message(e)});}
 }
 private choose(row:AchievementRecord|null,starter:AchievementDraft={...ACHIEVEMENT_STARTERS[0].draft}){
  if(this.state.busy||(this.dirty&&!window.confirm('Discard unsaved achievement edits?')))return;
  const draft=row?fromRecord(row):{...starter};this.pendingCreate=null;
  this.setState({selected:row,draft,baseline:JSON.stringify(draft),count:0,error:'',notice:'',history:null,conflict:false});
 }
 private change<K extends keyof AchievementDraft>(key:K,value:AchievementDraft[K]){
  this.setState(s=>({draft:{...s.draft,[key]:value},notice:'',error:'',count:0}));
 }
 private async save(archived=false){
  const signal=this.controller.signal;
  if(this.state.busy||this.state.loading||this.state.conflict||!this.canEdit)return;
  let draft:AchievementDraft;try{draft=normalizeAchievementDraft(this.state.draft);}catch(e){this.setState({error:message(e)});return;}
  const selected=this.state.selected,json=JSON.stringify(draft);
  if(!selected&&this.pendingCreate?.json!==json)this.pendingCreate={id:crypto.randomUUID(),json};
  this.setState({busy:true,error:'',notice:''});
  try{
   const saved=await this.props.api.save(this.props.projectId,draft,selected?{id:selected.id,revision:selected.revision,archived}:{clientRequestId:this.pendingCreate!.id},signal);
   if(signal.aborted)return;
   const clean=fromRecord(saved);this.pendingCreate=null;
   this.setState(s=>({selected:saved,draft:clean,baseline:JSON.stringify(clean),busy:false,history:null,
    inventory:s.inventory?{...s.inventory,achievements:[saved,...s.inventory.achievements.filter(r=>r.id!==saved.id)]}:null,
    notice:archived?'Private draft archived. It can be restored.':'Private draft saved. No player award, unlock or XP was issued.'}));
  }catch(e){if(!signal.aborted)this.setState({busy:false,error:message(e),conflict:!!e&&typeof e==='object'&&'status' in e&&[401,403,409].includes(Number(e.status))});}
 }
 private async reloadSelected(){
  const signal=this.controller.signal;
  if(this.dirty&&!window.confirm('Replace unsaved edits with the saved revision?'))return;
  this.setState({loading:true,error:''});
  try{
   const inventory=await this.props.api.list(this.props.projectId,signal);
   if(signal.aborted)return;
   const selected=inventory.achievements.find(r=>r.id===this.state.selected?.id)??null;
   const draft=selected?fromRecord(selected):{...ACHIEVEMENT_STARTERS[0].draft};
   this.pendingCreate=null;this.setState({inventory,selected,draft,baseline:JSON.stringify(draft),loading:false,conflict:false,history:null,count:0});
  }catch(e){if(!signal.aborted)this.setState({loading:false,error:message(e)});}
 }
 private async history(){
  const signal=this.controller.signal;
  const id=this.state.selected?.id;if(!id)return;
  this.setState({busy:true,error:''});
  try{const history=await this.props.api.history(this.props.projectId,id,signal);if(!signal.aborted)this.setState({history,busy:false});}
  catch(e){if(!signal.aborted)this.setState({error:message(e),busy:false});}
 }
 render(){
  const s=this.state,active=s.inventory?.achievements.filter(r=>r.archivedAt===null).length??0;
  const locked=s.loading||s.busy||s.conflict||!this.canEdit||s.selected?.archivedAt!==null&&!!s.selected;
  let preview;try{preview=previewAchievement(s.draft,{triggerKey:s.draft.triggerKey,count:s.count});}catch{preview=null;}
  const field=(key:'stableKey'|'title'|'description'|'triggerKey'|'rewardLabel',label:string,max:number,help:string)=>
   <label className="cav-field"><span>{label}</span>{key==='description'?
    <textarea rows={3} maxLength={max} value={s.draft[key]} disabled={locked} onChange={e=>this.change(key,e.currentTarget.value)}/>:
    <input maxLength={max} value={s.draft[key]} disabled={locked||(key==='stableKey'&&!!s.selected)} onChange={e=>this.change(key,e.currentTarget.value)}/>}<small>{help}</small></label>;
  return <section className="cav-root" aria-labelledby="cav-title" data-achievement-builder="v114">
   <header className="cav-header"><div><p className="cav-eyebrow">CONTINUANCE INSTITUTE / CREATOR STUDIO</p><h1 id="cav-title">Achievements &amp; rewards</h1><p>Give meaningful moments a mark of their own.</p></div><span className="cav-tag">PRIVATE DESIGN / NOT ISSUING</span></header>
   <div className="cav-boundary"><strong>{s.inventory?.project.title||'Verifying private project'}</strong><span>Creator-defined project marks. No ANEVUM XP or institutional honors.</span></div>
   {s.loading&&<p role="status" className="cav-status">Loading private achievement drafts...</p>}
   {s.error&&<div role="alert" className="cav-error"><p>{s.error}</p><button type="button" disabled={s.busy||s.loading} onClick={()=>void this.reloadSelected()}>Reload saved drafts</button></div>}
   {s.notice&&<p role="status" className="cav-notice">{s.notice}</p>}
   {s.inventory&&!this.canEdit&&<p role="status" className="cav-status">This project is {s.inventory.project.status.replaceAll('_',' ')}. Withdraw it from review before editing.</p>}
   {s.inventory&&<div className="cav-layout">
    <aside className="cav-library" aria-label="Achievement drafts">
     <div className="cav-section-heading"><h2>Project marks</h2><span>{active} / 50 active</span></div>
     <button className="cav-primary cav-wide" type="button" disabled={!this.canEdit||s.busy||active>=50} onClick={()=>this.choose(null)}>New achievement</button>
     <label className="cav-toggle"><input type="checkbox" checked={s.showArchived} onChange={e=>this.setState({showArchived:e.currentTarget.checked})}/> Show archived drafts</label>
     <div className="cav-draft-list">{s.inventory.achievements.filter(r=>s.showArchived||r.archivedAt===null).map(row=><button key={row.id} type="button" disabled={s.busy} className={'cav-draft'+(row.id===s.selected?.id?' is-selected':'')} aria-pressed={row.id===s.selected?.id} onClick={()=>this.choose(row)}>
      <strong>{row.title}</strong><span>{row.archivedAt?'Archived':row.visibility==='secret'?'Secret milestone':'Project milestone'} / revision {row.revision}</span></button>)}</div>
     {!s.inventory.achievements.length&&<p className="cav-muted">No saved marks yet. Choose a starting point and make it your own.</p>}
     <div className="cav-starters"><h3>Starting points</h3>{ACHIEVEMENT_STARTERS.map(item=><button type="button" key={item.label} disabled={!this.canEdit||s.busy} onClick={()=>this.choose(null,{...item.draft})}>{item.label}</button>)}</div>
     <p className="cav-muted">Save definitions here. Publishing, event verification and player issuance remain separate steps.</p>
    </aside>
    <form className="cav-editor" onSubmit={e=>{e.preventDefault();void this.save();}}>
     <div className="cav-section-heading"><h2>{s.selected?'Refine the mark':'Design a project mark'}</h2><span>{s.selected?'REV '+s.selected.revision:'UNSAVED DRAFT'}</span></div>
     {field('title','Achievement name',80,'The name members will see after the mark is earned.')}
     {field('stableKey','Stable identifier',48,'Lowercase letters, numbers and underscores. Locked after the first save.')}
     {field('description','Milestone description',600,'Describe what the player or app user actually accomplishes.')}
     <div className="cav-pair">{field('triggerKey','Event key',64,'The game or app integration will report this event.')}
      <label className="cav-field"><span>Required total</span><input type="number" min={1} max={100000} step={1} value={s.draft.targetCount||''} disabled={locked} onChange={e=>this.change('targetCount',Number(e.currentTarget.value))}/><small>1 for one milestone; a higher total for cumulative progress.</small></label></div>
     <div className="cav-pair"><label className="cav-field"><span>Before it is earned</span><select value={s.draft.visibility} disabled={locked} onChange={e=>this.change('visibility',e.currentTarget.value as AchievementDraft['visibility'])}><option value="visible">Show the milestone</option><option value="secret">Keep it secret</option></select></label>
      <label className="cav-field"><span>Project emblem</span><select value={s.draft.motif} disabled={locked} onChange={e=>this.change('motif',e.currentTarget.value as AchievementDraft['motif'])}>{ACHIEVEMENT_MOTIFS.map(m=><option key={m} value={m}>{m[0].toUpperCase()+m.slice(1)}</option>)}</select></label></div>
     {field('rewardLabel','Planned reward label (optional)',120,'Describe a project title or collectible. This draft does not deliver an in-app unlock.')}
     <div className="cav-actions"><button type="submit" className="cav-primary" disabled={locked||(!this.dirty&&!!s.selected)}>{s.busy?'Saving...':'Save private draft'}</button>
      {s.selected&&<><button type="button" disabled={s.busy||s.loading||s.conflict||!this.canEdit||this.dirty} onClick={()=>void this.save(s.selected!.archivedAt===null)}>{s.selected.archivedAt?'Restore draft':'Archive draft'}</button><button type="button" disabled={s.busy||s.loading} onClick={()=>void this.history()}>Revision history</button></>}</div>
     {this.dirty&&<p className="cav-muted">Unsaved changes. Save this draft before leaving the editor.</p>}
     {s.history&&<section className="cav-history" aria-label="Private revision history"><h3>Saved revisions</h3>{s.history.map(v=><p key={v.revision}><strong>Revision {v.revision}</strong> / {v.snapshot.title} / target {v.snapshot.targetCount}{v.snapshot.archivedAt?' / archived':''}</p>)}</section>}
    </form>
    <aside className="cav-preview" aria-label="Local achievement preview">
     <p className="cav-eyebrow">PROFILE PREVIEW / NOT EARNED</p>
     <ProjectSigil motif={preview?.motif??null} ready={preview?.ready===true}/>
     <span className="cav-tag">CREATOR-DEFINED PROJECT MARK</span><h2>{preview?.title||'Complete the definition'}</h2><p>{preview?.description||'Enter valid fields to preview this achievement.'}</p>
     <p className="cav-source">From {s.inventory.project.title}</p>
     {preview&&<><progress max={preview.target} value={preview.count} aria-label="Simulated milestone progress"/><p className="cav-progress-label">{preview.count} / {preview.target} / {preview.ready?'SIMULATED COMPLETION':'PREVIEW PROGRESS'}</p></>}
     {preview?.rewardLabel&&<div className="cav-reward"><small>PLANNED PROJECT REWARD</small><strong>{preview.rewardLabel}</strong></div>}
     <div className="cav-simulator"><h3>Test the milestone</h3><p>This local simulation does not contact the game, award a badge or change a profile.</p>
      <button type="button" disabled={!preview} onClick={()=>this.setState({count:Math.min(100000,s.count+1)})}>Simulate one matching event</button>
      <button type="button" disabled={!preview} onClick={()=>this.setState({count:s.draft.targetCount})}>Preview completed milestone</button>
      <button type="button" onClick={()=>this.setState({count:0})}>Reset preview</button>
     </div>
    {import.meta.env.VITE_PROJECT_MARK_BRIDGE_V115==='true'&&<section className="cav-integration">
      <h3>Game &amp; app integration</h3><p>After this project has a separately approved public release, install the ANEVUM browser SDK in your game. A confidential creator backend must verify milestones before reporting earned marks.</p>
      <code>{'await anevum.achievements.unlock("'+s.draft.stableKey+'");'}</code>
      <small>SOURCE PREVIEW ONLY. This does not install an SDK, generate credentials, mint XP or publish a mark.</small>
     </section>}
    </aside>
   </div>}
   <footer className="cav-footer">A draft is not an earned record. Live profile display requires a published definition, a verified issuance path, and the member's display preferences.</footer>
  </section>;
 }
}
