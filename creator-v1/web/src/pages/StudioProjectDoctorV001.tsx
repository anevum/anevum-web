import {useEffect,useId,useMemo,useState} from 'react';
import {OrbitalMark} from '../components/OrbitalMark';
import {diagnoseStudioSource} from '../../../agent-quality-lab/project-doctor-v001.mjs';
import {projectDoctorBrief,formatProjectDoctorBriefText} from '../../../agent-quality-lab/project-doctor-brief-v001.mjs';
import {compareProjectDoctorSources} from '../../../agent-quality-lab/project-doctor-diff-v001.mjs';
import {locateProjectDoctorFinding} from '../../../agent-quality-lab/project-doctor-location-v001.mjs';
import type {ProjectDoctorTarget} from '../../../agent-quality-lab/project-doctor-location-v001.mjs';
import './studio-project-doctor-v001.css';

// Reuse the real OrbitalMark and NEXT visual language, scoped to this one
// feature-OFF private inspector. This remains a local diagnostic, not an AI review.
export const studioProjectDoctorEnabled=import.meta.env.VITE_STUDIO_PROJECT_DOCTOR_V001==='true';

export function StudioProjectDoctorV001({source,savedSource,revision,dirty,onNavigate}:{
 source:string;savedSource:string;revision:number;dirty:boolean;
 onNavigate?:(target:ProjectDoctorTarget)=>void
}){
 const titleId=useId();
 const reportId=useId();
 const [opened,setOpened]=useState(false);
 const [filter,setFilter]=useState<'all'|'warning'|'info'>('all');
 const [copyStatus,setCopyStatus]=useState('');
 useEffect(()=>{setCopyStatus('');},[source]);
 const result=useMemo(()=>opened?diagnoseStudioSource(source):null,[opened,source]);
 const findings=result?.findings??[];
 const warnings=findings.filter(item=>item.severity!=='info').length;
 const informational=findings.length-warnings;
 const visibleFindings=filter==='all'?findings:findings.filter(item=>filter==='info'?item.severity==='info':item.severity!=='info');
 const brief=useMemo(()=>result?projectDoctorBrief(result):null,[result]);
 const comparison=useMemo(()=>opened&&dirty&&source!==savedSource?
  compareProjectDoctorSources(savedSource,source):null,[opened,dirty,savedSource,source]);
 const outcome=!result?'idle':!result.valid?'invalid':warnings>0?'review':'clear';
 const readout=outcome==='review'?'Review needed':outcome==='invalid'?'Invalid source':outcome==='clear'?'Limited check clear':'Not yet inspected';
 async function copyBrief(){
  if(!result)return;
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
   // Only the curated, bounded brief is copied, never raw source.
   await navigator.clipboard.writeText(formatProjectDoctorBriefText(result));
   setCopyStatus('Source-free summary copied. Paste it only where you choose.');
  }catch{setCopyStatus('Clipboard unavailable. No information was sent.');}
 }
 return <section className="cpd-root" aria-label="Local Project Doctor"
  aria-labelledby={titleId} data-studio-project-doctor="v001" data-cpd-state={outcome}>
  <header className="cpd-header">
   <div className="cpd-brandline">
    <span className="cpd-brand-lockup"><OrbitalMark className="cpd-symbol"/>
     <span>ANEVUM</span></span>
    <span className="cpd-brand-divider" aria-hidden="true">/</span>
    <span>CONTINUANCE LAB</span>
    <span className="cpd-brand-version">V001.6 / LOCAL</span>
   </div>
   <div className="cpd-hero">
    <div className="cpd-head-copy">
     <p className="cpd-kicker">STUDIO INTELLIGENCE <span aria-hidden="true">—</span> STRUCTURAL ANALYSIS</p>
     <h4 id={titleId}>Inspect <em>your project.</em></h4>
     <p>Trace broken connections, reveal overlooked details, and move directly to the work that needs attention.</p>
    </div>
    <div className="cpd-hero-art" aria-hidden="true">
     <div className="cpd-orbit-frame"><i className="cpd-orbit-ring cpd-orbit-ring-a"/><i className="cpd-orbit-ring cpd-orbit-ring-b"/>
      <div className="cpd-orbit-core"><OrbitalMark className="cpd-orbit-mark"/></div><span className="cpd-orbit-satellite"/></div>
     <span className="cpd-orbit-caption">OBSERVE / UNDERSTAND / REFINE</span>
    </div>
   </div>
   <div className="cpd-toolbar">
    <div className="cpd-toolbar-meta">
     <span className="cpd-local-dot" aria-hidden="true"/>
     <span>LOCAL ONLY</span><span aria-hidden="true" className="cpd-meta-sep">/</span>
     <span>READ-ONLY</span>
    </div>
    <button type="button" className="cpd-button" aria-expanded={opened} aria-controls={reportId}
     onClick={()=>setOpened(value=>!value)}>{opened?'Close findings':'Inspect draft'} <span aria-hidden="true">{opened?'−':'↗'}</span></button>
   </div>
  </header>
  {opened&&result&&<div className="cpd-report" id={reportId}>
   <div className="cpd-overview">
    <div className="cpd-readout">
     <p className="cpd-section-index">01 <span aria-hidden="true">/</span> ANALYSIS READOUT</p>
     <div className="cpd-readout-status"><span className="cpd-readout-indicator" aria-hidden="true"/><span>{readout}</span></div>
     <p className={'cpd-count'+(brief?.status==='no_structural_warnings'?' is-clear':'')}>{brief?.headline}</p>
     <p className="cpd-revision-line">{dirty?'Unsaved local changes':'Based on saved revision '+revision}
      <span aria-hidden="true"> · </span> Structural checks only</p>
    </div>
    <div className="cpd-totals" aria-label="Diagnostic finding counts">
     <div><span>REVIEW FLAGS</span><strong>{warnings}</strong><small>Warnings / errors</small></div>
     <div><span>NOTES</span><strong>{informational}</strong><small>Informational only</small></div>
     <div><span>OBSERVED</span><strong>{findings.length}</strong><small>Findings in draft</small></div>
    </div>
   </div>
   <div className="cpd-review">
    <div className="cpd-section-heading">
     <div><p className="cpd-section-index">02 <span aria-hidden="true">/</span> SIGNALS</p>
      <h5>Findings <em>&amp; next steps</em></h5></div>
     <span className="cpd-review-scope">STRUCTURAL / SOURCE SAFE</span>
    </div>
    {!result.valid?<p className="cpd-invalid" role="status">This document is not a valid supported scene or interface source. The original source was not changed.</p>:
     findings.length===0?<p className="cpd-clear" role="status">
      <span className="cpd-clear-mark" aria-hidden="true">✓</span>
      <span><strong>No issues detected by this limited inspection.</strong>
      <small>This is not a complete accessibility, logic or security test.</small></span>
     </p>:
     <>
      <div className="cpd-filters" role="group" aria-label="Filter inspection findings">
       <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All <span>{findings.length}</span></button>
       <button type="button" aria-pressed={filter==='warning'} onClick={()=>setFilter('warning')}>Warnings <span>{warnings}</span></button>
       <button type="button" aria-pressed={filter==='info'} onClick={()=>setFilter('info')}>Information <span>{informational}</span></button>
      </div>
      {visibleFindings.length===0?<p className="cpd-filter-empty" role="status">No findings in this filter.</p>:
       <ul className="cpd-findings">{visibleFindings.map((item,index)=>{
        const target=onNavigate?locateProjectDoctorFinding(source,item.path):null;
        return <li key={item.path+':'+item.code+':'+index} data-severity={item.severity}>
         <div className="cpd-finding-rail">
          <span className={'cpd-severity is-'+item.severity}>{item.severity}</span>
          <span className="cpd-find-index">{String(index+1).padStart(2,'0')} / {String(visibleFindings.length).padStart(2,'0')}</span>
         </div>
         <div className="cpd-finding-content">
          <strong>{item.message}</strong>
          <p className="cpd-next-step"><span>Suggested next step:</span> {item.nextStep}</p>
          <div className="cpd-finding-foot">
           <small>{item.code} · {item.path}</small>
           {target&&onNavigate&&<button className="cpd-jump" type="button"
            onClick={()=>onNavigate(target)}>Open in visual editor <span aria-hidden="true">↗</span></button>}
          </div>
         </div>
        </li>;
       })}</ul>}
     </>}
    {comparison&&<section className="cpd-diff" aria-label="Changes since saved revision">
     <div className="cpd-section-heading"><div>
      <p className="cpd-section-index">03 <span aria-hidden="true">/</span> CHANGE LENS</p>
      <h5>Compared with <em>saved revision {revision}</em></h5>
     </div></div>
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
   </div>
   <div className="cpd-handoff">
    <div className="cpd-handoff-text">
     <p className="cpd-section-index">04 <span aria-hidden="true">/</span> PRIVATE HANDOFF</p>
     <h5>Bring the findings <em>with you.</em></h5>
     <p>Share a concise, source-free review only when you choose. Your project stays here.</p>
    </div>
    <button type="button" className="cpd-copy" onClick={()=>void copyBrief()}>
     Copy source-free diagnostic brief <span aria-hidden="true">↗</span>
    </button>
    {copyStatus&&<p className="cpd-copy-status" role="status" aria-live="polite">{copyStatus}</p>}
   </div>
   <p className="cpd-foot"><span className="cpd-foot-label">PRIVATE BY DESIGN</span>
    Inspection runs only in this browser tab. No source is sent to a model or Railway, no edits are applied, and existing revision/review controls remain authoritative. Findings update as you edit.</p>
  </div>}
 </section>;
}
