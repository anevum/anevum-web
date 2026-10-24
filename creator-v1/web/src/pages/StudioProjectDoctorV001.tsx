import {useMemo,useState} from 'react';
import {diagnoseStudioSource} from '../../../agent-quality-lab/project-doctor-v001.mjs';
import './studio-project-doctor-v001.css';

// Local draft inspection is opt-in and unavailable unless the Studio pilot is enabled.
export const studioProjectDoctorEnabled=import.meta.env.VITE_STUDIO_PROJECT_DOCTOR_V001==='true';

export function StudioProjectDoctorV001({source,revision,dirty}:{
 source:string;revision:number;dirty:boolean
}){
 const [opened,setOpened]=useState(false);
 const result=useMemo(()=>opened?diagnoseStudioSource(source):null,[opened,source]);
 const findings=result?.findings??[];
 const warningCount=findings.filter(item=>item.severity==='warning'||item.severity==='error').length;
 return <section className="cpd-root" aria-label="Local Project Doctor" data-studio-project-doctor="v001">
  <header className="cpd-header">
   <div className="cpd-head-copy">
    <p className="cpd-kicker">CONTINUANCE LAB / PROJECT DOCTOR V001</p>
    <h4>Inspect your project</h4>
    <p>Check scenes, connections and interface accessibility before you save.</p>
   </div>
   <button type="button" className="cpd-button" aria-expanded={opened}
    onClick={()=>setOpened(value=>!value)}>{opened?'Close findings':'Inspect draft'}</button>
  </header>
  {opened&&result&&<div className="cpd-report">
   <div className="cpd-summary">
    <span className={'cpd-count'+(result.valid&&warningCount===0?' is-clear':'')}>
     {result.valid?warningCount+' potential issue'+(warningCount===1?'':'s'):'Unsupported source'}
    </span>
    <span>{dirty?'Unsaved local changes':'Based on saved revision '+revision}</span>
   </div>
   {!result.valid?<p className="cpd-invalid" role="status">This document is not a valid supported scene or interface source. The original source was not changed.</p>:
    findings.length===0?<p className="cpd-clear" role="status">No issues detected by this limited inspection. This is not a complete accessibility, logic or security test.</p>:
    <ul className="cpd-findings">{findings.map((item,index)=><li key={item.path+':'+item.code+':'+index}>
     <span className={'cpd-severity is-'+item.severity}>{item.severity}</span>
     <div><strong>{item.message}</strong><small>{item.code} · {item.path}</small></div>
    </li>)}</ul>}
   {result.truncated&&<p className="cpd-limit">The findings list was limited to 32 entries.</p>}
   <p className="cpd-foot">Inspection runs only in this browser tab. No source is sent to a model or Railway, no edits are applied, and existing revision/review controls remain authoritative. Findings update as you edit.</p>
  </div>}
 </section>;
}
