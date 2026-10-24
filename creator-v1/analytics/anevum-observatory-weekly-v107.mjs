/**
 * IREN Observatory V107: comparable complete UTC calendar-day registration windows.
 * Pure/read-only; the last partial UTC day is excluded, never inferred.
 */
export function summarizeCompleteUtcWeeks(records) {
 if(!Array.isArray(records)||records.length!==30)return null;
 const days=[];
 for(let i=0;i<records.length;i++){
  const x=records[i];
  if(!x||typeof x.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.day)||
    !Number.isSafeInteger(x.count)||x.count<0)return null;
  const time=Date.parse(x.day+'T00:00:00.000Z');
  if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==x.day||
   (i>0&&time-days[i-1].time!==86400000))return null;
  days.push({day:x.day,count:x.count,time});
 }
 const prev=days.slice(-15,-8),curr=days.slice(-8,-1);
 const sum=a=>a.reduce((total,x)=>total+x.count,0);
 const previous=sum(prev),current=sum(curr);
 if(!Number.isSafeInteger(previous)||!Number.isSafeInteger(current))return null;
 const delta=current-previous;
 const pct=previous>0&&Math.abs(delta/previous)<1000?
   Math.round(delta/previous*1000)/10:null;
 return Object.freeze({
  source:'MEMBER_DB',status:'verified_snapshot',basis:'two_complete_utc_calendar_windows',
  current:Object.freeze({from:curr[0].day,to:curr[6].day,count:current}),
  previous:Object.freeze({from:prev[0].day,to:prev[6].day,count:previous}),
  delta,percent:pct,direction:delta>0?'up':delta<0?'down':'flat',
  latestPartialDayExcluded:days[29].day,
  limitation:'Stored registrations, including possible untagged test accounts; not visitors, acquisition attribution, retention or conversion.'
 });
}

/** Progressive enhancement: one existing verified D1 chart, zero new network requests. */
function attachWeeklySignal(derive){
 'use strict';
 const root=document.getElementById('ci-weekly-signal');
 const daily=document.getElementById('dailyTable');
 if(!root||!daily||typeof derive!=='function')return;
 const fields={
  current:document.getElementById('ci-weekly-current'),
  previous:document.getElementById('ci-weekly-previous'),
  delta:document.getElementById('ci-weekly-delta'),
  currentDates:document.getElementById('ci-weekly-current-dates'),
  previousDates:document.getElementById('ci-weekly-previous-dates'),
  context:document.getElementById('ci-weekly-context'),
  status:document.getElementById('ci-weekly-state')
 };
 if(Object.values(fields).some(x=>!x))return;
 const pretty=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:0});
 const reset=()=>{
  root.dataset.ciState='unavailable';
  fields.current.textContent='—';fields.previous.textContent='—';fields.delta.textContent='—';
  fields.currentDates.textContent='Awaiting verified dates';
  fields.previousDates.textContent='Awaiting verified dates';
  fields.context.textContent='No comparison without a verified 30-day registration series.';
  fields.status.textContent='DATA UNAVAILABLE';
 };
 const draw=()=>{
  const tableRows=[...daily.querySelectorAll('tbody tr')];
  if(tableRows.length!==30||document.querySelectorAll('#kpis .kpi').length!==8){reset();return}
  const records=tableRows.map(row=>{
   const cells=row.querySelectorAll('td'),day=(cells[0]?.textContent||'').trim();
   const text=(cells[1]?.textContent||'').trim();
   if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text))return {day,count:NaN};
   return {day,count:Number(text.replaceAll(',',''))};
  });
  const value=derive(records);
  if(!value){reset();return}
  root.dataset.ciState='verified';
  root.dataset.ciDirection=value.direction;
  fields.current.textContent=pretty(value.current.count);
  fields.previous.textContent=pretty(value.previous.count);
  fields.delta.textContent=(value.delta>0?'+':value.delta<0?'−':'')+pretty(Math.abs(value.delta));
  const displayDay=s=>new Date(s+'T00:00:00.000Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
  const displayRange=(from,to)=>displayDay(from)+' – '+displayDay(to)+', '+to.slice(0,4)+' UTC';
  fields.currentDates.textContent=displayRange(value.current.from,value.current.to);
  fields.previousDates.textContent=displayRange(value.previous.from,value.previous.to);
  const percent=value.percent===null?'Relative change not defined with zero or extreme baseline':
    (value.percent>0?'+':'')+value.percent.toFixed(1)+'% against the preceding complete window';
  fields.context.textContent=percent+'. '+value.limitation+' Today ('+value.latestPartialDayExcluded+' UTC) is excluded.';
  fields.status.textContent='VERIFIED MEMBER_DB / NOT ORGANIC ACQUISITION';
 };
 new MutationObserver(draw).observe(daily,{childList:true,subtree:true});
 draw();
}

export const WEEKLY_CSS="body.ci-next .ci-weekly{scroll-margin-top:108px;position:relative;isolation:isolate;margin:16px 0 17px;padding:clamp(16px,1.8vw,24px);border:1px solid #897e7a;border-radius:12px;background:radial-gradient(ellipse at 100% 0%,#4d43604a,transparent 45%),linear-gradient(130deg,#1a283c,#111c2b);box-shadow:inset 0 1px #fff1,0 14px 35px #0003}\nbody.ci-next .ci-weekly *{box-sizing:border-box}\nbody.ci-next .ci-weekly-head{display:flex;justify-content:space-between;align-items:start;gap:15px;flex-wrap:wrap}\nbody.ci-next .ci-weekly-overline{font:750 10px/1.5 ui-monospace,monospace;letter-spacing:.11em;color:#e2c28b}\nbody.ci-next .ci-weekly h3{margin:7px 0 8px;color:#f1eddf;font:400 clamp(24px,2.5vw,34px)/1.09 Georgia,serif;letter-spacing:-.045em}\nbody.ci-next .ci-weekly-head p{max-width:64ch;color:#bfcbd8;font-size:12px;line-height:1.5;margin:0}\nbody.ci-next .ci-weekly-state{border:1px solid #9b865f;border-radius:5px;padding:7px 9px;color:#ead2a9;font:680 10px ui-monospace,monospace;letter-spacing:.04em}\nbody.ci-next .ci-weekly[data-ci-state=verified] .ci-weekly-state{border-color:#8fb8c9;color:#bce3ef}\nbody.ci-next .ci-weekly-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:16px 0}\nbody.ci-next .ci-weekly-stat{padding:13px 15px;border:1px solid #64788e;border-radius:8px;background:#0c1b2abf;min-width:0}\nbody.ci-next .ci-weekly-stat>span{display:block;color:#bbcad8;font:700 10px/1.4 ui-monospace,monospace;letter-spacing:.075em}\nbody.ci-next .ci-weekly-stat strong{display:block;margin:9px 0 6px;color:#f1eddf;font:420 clamp(25px,2.8vw,38px)/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}\nbody.ci-next .ci-weekly-stat small{display:block;color:#aabdcf;font:10px/1.5 system-ui,sans-serif;overflow-wrap:normal}\nbody.ci-next .ci-weekly[data-ci-direction=up] #ci-weekly-delta{color:#bcdfcc}\nbody.ci-next .ci-weekly[data-ci-direction=down] #ci-weekly-delta{color:#f0bcad}\nbody.ci-next .ci-weekly-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #5a6f85;padding-top:12px}\nbody.ci-next .ci-weekly-foot p{margin:0;color:#c3d2dd;font-size:11px;line-height:1.6;max-width:76ch}\nbody.ci-next .ci-weekly-foot a{flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #dabd8e;border-radius:6px;min-height:43px;padding:9px 12px;color:#f1dfba;background:#262c3e;text-decoration:none;font-size:11px;font-weight:750}\nbody.ci-next .ci-weekly-foot a:hover{background:#3e3b51;border-color:#f2d7b0}\n@media(max-width:700px){body.ci-next .ci-weekly-stats{grid-template-columns:repeat(2,minmax(0,1fr))}body.ci-next .ci-weekly-stat:last-child{grid-column:1/-1}body.ci-next .ci-weekly-foot{align-items:stretch;flex-direction:column}body.ci-next .ci-weekly-foot a{align-self:stretch}body.ci-next .ci-weekly{padding:14px}}\n@media(max-width:370px){body.ci-next .ci-weekly-stat{padding:11px}body.ci-next .ci-weekly-stat strong{font-size:26px}}\n@media(prefers-reduced-motion:reduce){body.ci-next .ci-weekly *{transition:none!important;animation:none!important}}\n";
export const WEEKLY_CLIENT='('+attachWeeklySignal.toString()+')('+summarizeCompleteUtcWeeks.toString()+');';
