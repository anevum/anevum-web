import {useMemo,useState} from 'react';
import {diagnoseStudioSource} from '../../../agent-quality-lab/project-doctor-v001.mjs';
import {projectDoctorBrief} from '../../../agent-quality-lab/project-doctor-brief-v001.mjs';
import {compareProjectDoctorSources} from '../../../agent-quality-lab/project-doctor-diff-v001.mjs';
import {locateProjectDoctorFinding} from '../../../agent-quality-lab/project-doctor-location-v001.mjs';
import type {ProjectDoctorTarget} from '../../../agent-quality-lab/project-doctor-location-v001.mjs';
import './studio-project-doctor-v001.css';

// Local draft inspection is opt-in and unavailable unless the Studio pilot is enabled.
export const studioProjectDoctorEnabled=import.meta.env.VITE_STUDIO_PROJECT_DOCTOR_V001==='true';

export function StudioProjectDoctorV001({source,savedSource,revision,dirty,onNavigate}:{
 source:string;savedSource:string;revision:number;dirty:boolean;
 onNavigate?:(target:ProjectDoctorTarget)=>void
}){
 const [opened,setOpened]=useState(false);
 const [filter,setFilter]=useState<'all'|'warning'|'info'>('all');
 const result=useMemo(()=>opened?diagnoseStudioSource(source):null,[opened,source]);
 const findings=result?.findings??[];
 const warnings=findings.filter(item=>item.severity!=='info').length;
 const informational=findings.length-warnings;
 const visibleFindings=filter==='all'?findings:findings.filter(item=>filter==='info'?item.severity==='info':item.severity!=='info');
 const brief=useMemo(()=>result?projectDoctorBrief(result):null,[result]);
 const comparison=useMemo(()=>opened&&dirty&&source!==savedSource?
  compareProjectDoctorSources(savedSource,source):null,[opened,dirty,savedSource,source]);
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
    <span className={'cpd-count'+(brief?.status==='no_structural_warnings'?' is-clear':'')}>
     {brief?.headline}
    </span>
    <span>{dirty?'Unsaved local changes':'Based on saved revision '+revision}</span>
   </div>
   {!result.valid?<p className="cpd-invalid" role="status">This document is not a valid supported scene or interface source. The original source was not changed.</p>:
    findings.length===0?<p className="cpd-clear" role="status">No issues detected by this limited inspection. This is not a complete accessibility, logic or security test.</p>:
    <>
     <div className="cpd-filters" role="group" aria-label="Filter inspection findings">
      <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All ({findings.length})</button>
      <button type="button" aria-pressed={filter==='warning'} onClick={()=>setFilter('warning')}>Warnings ({warnings})</button>
      <button type="button" aria-pressed={filter==='info'} onClick={()=>setFilter('info')}>Information ({informational})</button>
     </div>
     {visibleFindings.length===0?<p className="cpd-filter-empty" role="status">No findings in this filter.</p>:
      <ul className="cpd-findings">{visibleFindings.map((item,index)=>{
       const target=onNavigate?locateProjectDoctorFinding(source,item.path):null;
       return <li key={item.path+':'+item.code+':'+index}>
        <span className={'cpd-severity is-'+item.severity}>{item.severity}</span>
        <div><strong>{item.message}</strong>
         <p className="cpd-next-step"><span>Suggested next step:</span> {item.nextStep}</p>
         <small>{item.code} · {item.path}</small>
         {target&&onNavigate&&<button className="cpd-jump" type="button"
          onClick={()=>onNavigate(target)}>Open in visual editor</button>}
        </div>
       </li>;
      })}</ul>}
    </>}
   {comparison&&<section className="cpd-diff" aria-label="Changes since saved revision">
    <h5>Compared with saved revision {revision}</h5>
    {comparison.comparable?<>
     <div className="cpd-diff-metrics">
      <span><strong>{comparison.counts.introduced}</strong> newly reported</span>
      <span><strong>{comparison.counts.noLongerReported}</strong> no longer reported</span>
      <span><strong>{comparison.counts.stillReported}</strong> still reported</span>
     </div>
     <p>Only documented structural findings are compared. "No longer reported" does not guarantee a successful repair.</p>
    </>:<p role="status">{comparison.reason} Compare changes after the source validates.</p>}
   </section>}
   {result.truncated&&<p className="cpd-limit">The findings list was limited to 32 entries.</p>}
   <p className="cpd-foot">Inspection runs only in this browser tab. No source is sent to a model or Railway, no edits are applied, and existing revision/review controls remain authoritative. Findings update as you edit.</p>
  </div>}
 </section>;
}
