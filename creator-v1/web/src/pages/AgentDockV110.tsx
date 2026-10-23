import {useEffect,useMemo,useState} from 'react';

export interface AgentProjectContext {
 id:string;kind:'record'|'build';title:string;summary:string;category:string;
 status:string;revision:number|null;
}
type Role='Builder'|'Designer'|'Debugger'|'Story Architect'|'QA Observer';
const ROLES:readonly {id:Role;description:string;task:string}[]=[
 {id:'Builder',description:'Plan practical screens, components and interactions.',
  task:'Outline the smallest useful feature I can implement next, with acceptance checks.'},
 {id:'Designer',description:'Review usability, structure and responsive layouts.',
  task:'Review the interface for usability, accessibility and mobile issues. Suggest specific improvements.'},
 {id:'Debugger',description:'Investigate errors and propose reversible fixes.',
  task:'Help me reason about a reproducible issue. Start by asking for the error and steps to reproduce.'},
 {id:'Story Architect',description:'Structure scenes, dialogue and branching choices.',
  task:'Help me design a short interactive story scene with clear choices and outcomes.'},
 {id:'QA Observer',description:'Plan meaningful tests and document evidence.',
  task:'Draft a minimal test plan for the next iteration without claiming tests have already passed.'}
];

export function AgentDockV110({project,onClose}:{project:AgentProjectContext|null;onClose:()=>void}){
 const [role,setRole]=useState<Role>('Builder');
 const [task,setTask]=useState(ROLES[0].task);
 const [includeSummary,setIncludeSummary]=useState(false);
 const [copyState,setCopyState]=useState('');
 useEffect(()=>{
  setTask(ROLES[0].task);setRole('Builder');setIncludeSummary(false);setCopyState('');
 },[project?.id,project?.kind]);
 const brief=useMemo(()=>{
  if(!project)return '';
  return [
   'ANEVUM CREATOR STUDIO — MANUALLY SHARED TASK BRIEF',
   'This is a user-prepared prompt, not an ANEVUM/OpenAI account connection.',
   'Project: '+project.title,
   'Type: '+project.category+' / '+project.kind,
   'Current status: '+project.status,
   'Revision: '+(project.revision??'not available'),
   ...(includeSummary?['Project summary: '+project.summary]:[]),
   'Requested assistant role: '+role,
   'Task: '+task.trim(),
   'Constraints: Do not assume access to private project files, credentials, deployed application state or live test results. Ask for additional context when necessary. Suggest changes for my review; do not claim to have applied or published them.'
  ].join('\n');
 },[project,role,task,includeSummary]);
 async function copy(){
  if(!brief||!task.trim()){setCopyState('Choose a project and describe a task first.');return;}
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
   await navigator.clipboard.writeText(brief);
   setCopyState('Task brief copied. Paste it manually into your own ChatGPT conversation.');
  }catch{setCopyState('Clipboard permission was unavailable. Select and copy the task brief below manually.');}
 }
 const selected=ROLES.find(item=>item.id===role)||ROLES[0];
 return <aside className="csw-agent" aria-label="OpenAI agent planning dock" data-agent-dock="v110-offline">
  <header className="csw-pane-header csw-agent-heading">
   <div><p className="csw-eyebrow">CREATOR STUDIO / OPENAI</p><h2>Agent Dock</h2></div>
   <button type="button" className="csw-agent-close" onClick={onClose} aria-label="Close Agent Dock">×</button>
  </header>
  <div className="csw-agent-connection" role="status">
   <span className="csw-agent-led" aria-hidden="true"/>
   <div><strong>OpenAI not connected</strong>
    <small>No model access or account linking is active in this workspace.</small></div>
  </div>
  <section className="csw-agent-section">
   <h3>Project context</h3>
   {project?<><p><strong>{project.title}</strong></p>
    <p className="csw-small">Private {project.kind} · {project.category} · Revision {project.revision??'—'}</p>
    <p className="csw-small">Project source and private files have not been attached or transmitted.</p></>:
    <p className="csw-small">Open an authorized project from Explorer to prepare a task brief.</p>}
  </section>
  <section className="csw-agent-section">
   <label htmlFor="csw-agent-role">Agent role</label>
   <select id="csw-agent-role" value={role} onChange={e=>{const next=e.target.value as Role;setRole(next);
    setTask(ROLES.find(x=>x.id===next)?.task||'');setCopyState('');
   }}>{ROLES.map(item=><option key={item.id} value={item.id}>{item.id}</option>)}</select>
   <p className="csw-small">{selected.description}</p>
   <label htmlFor="csw-agent-task">Prepare a task</label>
   <textarea id="csw-agent-task" value={task} rows={5} maxLength={1500}
    onChange={e=>{setTask(e.target.value);setCopyState('');}}
    placeholder="Describe what you'd like help with…"/>
   <label className="csw-agent-check">
    <input type="checkbox" disabled={!project} checked={includeSummary} onChange={e=>setIncludeSummary(e.target.checked)}/>
    Include this project's summary when I copy the brief
   </label>
   <button type="button" className="csw-action csw-strong" disabled={!project||!task.trim()} onClick={()=>void copy()}>
    Copy task brief
   </button>
   {copyState&&<p className="csw-small" role="status">{copyState}</p>}
  </section>
  {project&&<section className="csw-agent-section">
   <details className="csw-agent-details">
    <summary>Review exact text to copy</summary>
    <textarea readOnly rows={9} value={brief} aria-label="Prepared OpenAI task brief"/>
   </details>
  </section>}
  <section className="csw-agent-section csw-agent-future">
   <h3>Future connection</h3>
   <p className="csw-small">A real OpenAI connection will require an approved authorization method, project/file consent, spending limits and server-side tool permissions. No sign-in or paid call is initiated here.</p>
   <p className="csw-small">IREN remains the native ANEVUM guide. An OpenAI agent will later suggest reviewable changes, not silently save or publish.</p>
  </section>
 </aside>;
}
