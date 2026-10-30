'use strict';
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const oneDay = 86400000;
  const dateKey = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const parseDay = s => new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10)),12);
  const addDays = (s,n) => {const d=parseDay(s);d.setDate(d.getDate()+n);return dateKey(d);};
  const weekday = s => parseDay(s).toLocaleDateString(undefined,{weekday:'short'});
  const displayDay = s => parseDay(s).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const localValue = instant => {const d=new Date(instant),pad=n=>String(n).padStart(2,'0');return dateKey(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes());};
  const timeLabel = e => e.all_day?'All day':new Date(e.starts_at).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
  const storage={focus:dateKey(new Date()),mode:'agenda',events:[],tasks:[],loaded:false,notice:'',loading:false,busy:false};
  const range = () => {
    const focus=storage.focus;
    if(storage.mode==='day')return [focus,addDays(focus,1)];
    if(storage.mode==='week'){const day=parseDay(focus).getDay();const start=addDays(focus,-((day+6)%7));return [start,addDays(start,7)];}
    if(storage.mode==='month'){const first=focus.slice(0,7)+'-01';return [first,addDays(dateKey(new Date(Number(first.slice(0,4)),Number(first.slice(5,7)),0,12)),1)];}
    return [focus,addDays(focus,14)];
  };
  function visible(e) {
    const [from,to]=range();
    if(e.all_day)return e.start_date<to && e.end_date>from;
    const start=new Date(e.starts_at),end=new Date(e.ends_at);
    // Compare calendar-day boundaries in the viewing device's local time zone.
    const first=new Date(Number(from.slice(0,4)),Number(from.slice(5,7))-1,Number(from.slice(8,10)));
    const last=new Date(Number(to.slice(0,4)),Number(to.slice(5,7))-1,Number(to.slice(8,10)));
    return start<last && end>first;
  }
  function occurrences(){
    const [from,to]=range(),days=[];
    for(let current=from;current<to;current=addDays(current,1)){
      const a=new Date(Number(current.slice(0,4)),Number(current.slice(5,7))-1,Number(current.slice(8,10)));
      const b=new Date(Number(addDays(current,1).slice(0,4)),Number(addDays(current,1).slice(5,7))-1,Number(addDays(current,1).slice(8,10)));
      const events=storage.events.filter(e=>e.all_day?e.start_date<=current&&e.end_date>current:new Date(e.starts_at)<b&&new Date(e.ends_at)>a).sort((x,y)=>Number(y.all_day)-Number(x.all_day)||String(x.starts_at).localeCompare(String(y.starts_at)));
      const tasks=storage.tasks.filter(t=>t.due_date===current);
      days.push({date:current,events,tasks});
    }
    return days;
  }
  function item(e){return '<button type="button" class="cal-item" data-cal-edit="'+esc(e.id)+'"><span class="cal-item-time">'+(e.all_day?'All day':esc(timeLabel(e)))+'</span><span class="cal-item-main"><b>'+esc(e.title)+'</b>'+(e.location?'<small>'+esc(e.location)+'</small>':'')+'</span><span aria-hidden="true">›</span></button>';}
  function task(t){return '<div class="cal-item cal-task"><span class="cal-item-time">Task</span><span class="cal-item-main"><b>'+esc(t.title)+'</b><small>'+(t.status==='done'?'Completed':'From your reminders')+'</small></span></div>';}
  function agenda(){const days=occurrences().filter(d=>d.events.length||d.tasks.length||storage.mode==='day');return days.length?days.map(d=>'<section class="cal-day"><div class="cal-date"><span>'+esc(weekday(d.date))+'</span><h2>'+esc(displayDay(d.date))+'</h2>'+(d.date===dateKey(new Date())?'<small>Today</small>':'')+'</div><div class="cal-items">'+(d.events.length?d.events.map(item).join(''):'')+d.tasks.map(task).join('')+(!d.events.length&&!d.tasks.length?'<p class="cal-empty">Your day is open.</p>':'')+'</div></section>').join(''):'<div class="cal-welcome"><h2>Space for what matters.</h2><p>No appointments or dated reminders in this range.</p><button type="button" class="button primary" data-cal-add>Add an appointment</button></div>';}
  function month(){
    const first=storage.focus.slice(0,7)+'-01',firstDay=(parseDay(first).getDay()+6)%7,start=addDays(first,-firstDay);
    let html='<div class="cal-month-weekdays">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(s=>'<span>'+s+'</span>').join('')+'</div><div class="cal-month-grid">';
    for(let i=0;i<42;i++){
      const date=addDays(start,i),entries=storage.events.filter(e=>e.all_day?e.start_date<=date&&e.end_date>date:dateKey(new Date(e.starts_at))===date),tasks=storage.tasks.filter(t=>t.due_date===date);
      html+='<button type="button" class="cal-month-date '+(date.slice(0,7)!==first.slice(0,7)?'outside ':'')+(date===dateKey(new Date())?'is-today':'')+'" data-cal-date="'+date+'" aria-label="'+esc(displayDay(date))+', '+(entries.length+tasks.length)+' items"><b>'+Number(date.slice(8))+'</b><small>'+(entries.length+tasks.length?entries.length+tasks.length+' item'+(entries.length+tasks.length===1?'':'s'):'')+'</small></button>';
    }
    return html+'</div><p class="cal-hint">Choose a date to open its agenda.</p>';
  }
  function render() {
    const [from,to]=range();
    const heading=storage.mode==='month'?parseDay(storage.focus).toLocaleDateString(undefined,{month:'long',year:'numeric'}):displayDay(from)+(storage.mode==='day'?'':' – '+displayDay(addDays(to,-1)));
    return '<div class="page-heading"><div><p class="eyebrow">MY SPACE / CALENDAR</p><h1>A calmer way to plan.</h1><p>Appointments and reminders, all in one gentle view.</p></div><button class="button primary" data-cal-add>Add appointment</button></div>'+
      '<section class="cal-shell"><div class="cal-toolbar"><div class="cal-nav"><button class="button subtle" data-cal-shift="-1" aria-label="Previous period">‹</button><button class="button subtle" data-cal-today>Today</button><button class="button subtle" data-cal-shift="1" aria-label="Next period">›</button></div><h2>'+esc(heading)+'</h2><div class="cal-modes" role="group" aria-label="Calendar view">'+['agenda','day','week','month'].map(m=>'<button type="button" class="'+(storage.mode===m?'active':'')+'" data-cal-mode="'+m+'" aria-pressed="'+(storage.mode===m)+'">'+m[0].toUpperCase()+m.slice(1)+'</button>').join('')+'</div></div><p class="cal-zone">Times shown in '+esc(zone.replaceAll('_',' '))+' · Your calendar is private</p>'+
      '<div class="cal-status" role="status">'+(storage.notice?esc(storage.notice):storage.loading?'Loading your schedule…':'')+'</div><div id="calendar-content">'+(storage.loaded?storage.mode==='month'?month():agenda():'<div class="cal-welcome">Loading your private calendar…</div>')+'</div></section>'+
      '<div class="data-actions"><button class="button subtle" data-cal-export>Export calendar backup</button></div>'+
      '<dialog id="calendar-editor" class="editor-sheet cal-editor" aria-labelledby="calendar-editor-title"><form id="calendar-form"><div class="sheet-top"><div><p class="eyebrow">PRIVATE APPOINTMENT</p><h2 id="calendar-editor-title">Add an appointment</h2></div><button class="icon-button" type="button" data-cal-close aria-label="Close event editor">✕</button></div><p id="calendar-form-error" class="editor-error" role="alert" hidden></p>'+
      '<div class="cal-fields"><label>Appointment title<input name="title" maxlength="160" required autocomplete="off"></label><label>Location (optional)<input name="location" maxlength="240"></label><label class="cal-toggle"><input name="all_day" type="checkbox"> All-day event</label><div id="cal-timed"><label>Starts<input name="start" type="datetime-local"></label><label>Ends<input name="end" type="datetime-local"></label></div><div id="cal-allday" hidden><label>First day<input name="start_date" type="date"></label><label>Last day (inclusive)<input name="last_date" type="date"></label></div><label>Private details<textarea name="details" maxlength="4000" rows="3"></textarea></label></div><p class="cal-zone">Only your signed-in account can see this appointment. Sharing and repeat events are not enabled yet.</p><div class="sheet-bottom"><button class="button subtle" type="button" data-cal-close>Cancel</button><button class="button danger" type="button" id="cal-delete" hidden>Cancel appointment</button><button class="button primary" type="submit" id="cal-save">Save appointment</button></div></form></dialog>';
  }
  const $=id=>document.getElementById(id);
  function redraw(){const root=$('main');if(!root||!location.hash.endsWith('calendar'))return;root.innerHTML=render();bind();}
  async function load(){storage.loading=true;storage.notice='';redraw();const [from,to]=range();try{const res=await fetch('/api/calendar?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to),{cache:'no-store',credentials:'same-origin'});if(!res.ok)throw new Error((await res.json()).error||'Calendar unavailable');const data=await res.json();storage.events=data.events;storage.tasks=data.tasks;storage.loaded=true;}catch(err){storage.notice=err.message;storage.loaded=false;}finally{storage.loading=false;redraw();}}
  async function request(path,method,value,revision){const res=await fetch(path,{method,credentials:'same-origin',headers:{'content-type':'application/json','x-cristybreathe':'1',...(revision?{'if-match':String(revision)}:{})},body:value===undefined?undefined:JSON.stringify(value)});let data;try{data=await res.json();}catch{throw Error('Your secure session may have expired. Copy your changes before reopening.');}if(!res.ok)throw Error(data.error||'Unable to save this appointment.');return data;}
  let selected=null;
  function startEditor(id){
    selected=id?storage.events.find(e=>e.id===id):null;const d=$('calendar-editor'),f=$('calendar-form'),now=new Date();
    f.reset();$('calendar-form-error').hidden=true;$('calendar-editor-title').textContent=selected?'Edit appointment':'Add an appointment';$('cal-delete').hidden=!selected;
    const start=new Date(now.getTime()+3600000);start.setMinutes(0,0,0);const end=new Date(start.getTime()+3600000);
    f.elements.title.value=selected?.title||'';f.elements.location.value=selected?.location||'';f.elements.details.value=selected?.details||'';f.elements.all_day.checked=Boolean(selected?.all_day);
    f.elements.start.value=selected&&!selected.all_day?localValue(selected.starts_at):localValue(start);
    f.elements.end.value=selected&&!selected.all_day?localValue(selected.ends_at):localValue(end);
    f.elements.start_date.value=selected?.start_date||storage.focus;
    f.elements.last_date.value=selected?.end_date?addDays(selected.end_date,-1):storage.focus;
    toggleAllDay();d.showModal();f.elements.title.focus();
  }
  function toggleAllDay(){const all=$('calendar-form').elements.all_day.checked;$('cal-allday').hidden=!all;$('cal-timed').hidden=all;}
  async function save(e){e.preventDefault();if(storage.busy)return;const form=$('calendar-form'),error=$('calendar-form-error'),all=form.elements.all_day.checked;
    const payload={title:form.elements.title.value,details:form.elements.details.value,location:form.elements.location.value,all_day:Number(all),time_zone:zone,status:'confirmed'};
    error.hidden=true;
    if(all){
      if(!form.elements.start_date.value||!form.elements.last_date.value||form.elements.last_date.value<form.elements.start_date.value){error.textContent='Choose valid first and last days.';error.hidden=false;return;}
      payload.start_date=form.elements.start_date.value;payload.end_date=addDays(form.elements.last_date.value,1);
    } else {
      if(!form.elements.start.value||!form.elements.end.value){error.textContent='Choose both start and end times.';error.hidden=false;return;}
      const a=new Date(form.elements.start.value),b=new Date(form.elements.end.value);
      if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a){error.textContent='The end must be after the start.';error.hidden=false;return;}
      payload.starts_at=a.toISOString();payload.ends_at=b.toISOString();
    }
    storage.busy=true;$('cal-save').disabled=true;
    try{await request(selected?'/api/calendar/events/'+selected.id:'/api/calendar/events',selected?'PATCH':'POST',selected?{...payload,revision:selected.revision}:payload);$('calendar-editor').close();await load();}
    catch(err){error.textContent=err.message;error.hidden=false;}finally{storage.busy=false;if($('cal-save'))$('cal-save').disabled=false;}
  }
  async function cancelEvent(){if(!selected||storage.busy||!confirm('Cancel this appointment? It will no longer appear in your calendar.'))return;storage.busy=true;
    try{await request('/api/calendar/events/'+selected.id,'DELETE',undefined,selected.revision);$('calendar-editor').close();await load();}
    catch(err){$('calendar-form-error').textContent=err.message;$('calendar-form-error').hidden=false;}finally{storage.busy=false;}
  }
  async function exportCalendar(){try{const res=await fetch('/api/calendar/export',{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw Error('Calendar export unavailable.');const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cristybreathe-calendar-'+dateKey(new Date())+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(err){storage.notice=err.message;redraw();}}
  function bind(){
    const root=$('main');if(!root||!$('calendar-content'))return;
    root.onclick=e=>{const b=e.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-cal-add'))startEditor();
      else if(b.dataset.calEdit)startEditor(b.dataset.calEdit);
      else if(b.dataset.calDate){storage.focus=b.dataset.calDate;storage.mode='day';load();}
      else if(b.dataset.calMode){storage.mode=b.dataset.calMode;load();}
      else if(b.hasAttribute('data-cal-today')){storage.focus=dateKey(new Date());load();}
      else if(b.dataset.calShift){const n=Number(b.dataset.calShift);if(storage.mode==='month'){const d=parseDay(storage.focus);d.setMonth(d.getMonth()+n);storage.focus=dateKey(d);}else storage.focus=addDays(storage.focus,n*(storage.mode==='week'?7:storage.mode==='agenda'?14:1));load();}
      else if(b.hasAttribute('data-cal-close')){$('calendar-editor').close();}
      else if(b.id==='cal-delete')cancelEvent();
      else if(b.hasAttribute('data-cal-export'))exportCalendar();
    };
    $('calendar-form').onsubmit=save;
    $('calendar-form').elements.all_day.onchange=toggleAllDay;
    $('calendar-editor').onclose=()=>{selected=null;};
  }
  window.CristyCalendar={render,mount(){bind();load();}};
})();
