import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../src/worker.mjs';
import {validateCalendarEvent,calendarWindow,CalendarError} from '../src/calendar-core.mjs';
import {openDatabase,keys,issuer,emails,envFor} from './fixtures.mjs';
const signing=await keys(),originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{if(String(url)===issuer+'/cdn-cgi/access/certs')return Response.json({keys:[signing.pub]});throw Error('Unexpected remote URL');};
const worker=createWorker({});
async function call(env,path,method='GET',value,email=emails[0],headers={}){
  const request=new Request('https://workspace.example'+path,{method,headers:{'cf-access-jwt-assertion':await signing.token(email),'origin':'https://workspace.example','x-cristybreathe':'1','content-type':'application/json',...headers},body:value===undefined?undefined:JSON.stringify(value)});
  const res=await worker.fetch(request,env);
  return {status:res.status,data:await res.json()};
}
const event={title:'Synthetic appointment',details:'Not patient information',location:'Video call',all_day:0,starts_at:'2026-11-01T14:00:00.000Z',ends_at:'2026-11-01T15:00:00.000Z',time_zone:'America/New_York',status:'confirmed'};
test('strict validation: timezones, all-day intervals, durations, and unsafe fields',()=>{
  assert.equal(validateCalendarEvent(event).title,event.title);
  for(const bad of [
    {...event,title:''},{...event,owner:emails[1]},{...event,time_zone:'Not/A_Timezone'},
    {...event,starts_at:'2026-11-01T14:00:00-04:00'},{...event,ends_at:'2026-11-01T13:00:00.000Z'},
    {...event,location:'x'.repeat(241)},{...event,revision:0},
    {...event,all_day:1,start_date:'2026-02-30',end_date:'2026-03-01'},
    {...event,all_day:1,start_date:'2026-11-05',end_date:'2026-11-05'}
  ])assert.throws(()=>validateCalendarEvent(bad),CalendarError);
  assert.equal(calendarWindow('2026-10-30','2026-11-02').from,'2026-10-30');
  assert.throws(()=>calendarWindow('2026-10-30','2026-10-30'),CalendarError);
  assert.throws(()=>calendarWindow('2026-10-30','2027-10-30'),CalendarError);
});
test('private calendar CRUD, conflict protection, soft cancellation, and export',async()=>{
  const db=openDatabase(),env=envFor(db);
  const created=await call(env,'/api/calendar/events','POST',event);
  assert.equal(created.status,201);const id=created.data.event.id;
  assert.equal(created.data.event.revision,1);
  assert.equal((await call(env,'/api/calendar/events','POST',{...event,id})).status,200);
  assert.equal((await call(env,'/api/calendar/events','POST',{...event,id,title:'different'})).status,409);
  assert.equal((await call(env,'/api/calendar/events','GET',undefined,emails[1])).status,404);
  assert.equal((await call(env,'/api/calendar/events/'+id,'GET',undefined,emails[1])).status,404);
  assert.equal((await call(env,'/api/calendar/events/'+id,'PATCH',{revision:1,title:'No access'},emails[1])).status,404);
  assert.equal((await call(env,'/api/calendar/events/'+id,'DELETE',undefined,emails[1],{'if-match':'1'})).status,404);
  assert.equal((await call(env,'/api/calendar?from=2026-10-30&to=2026-11-08')).data.events.length,1);
  assert.equal((await call(env,'/api/calendar?from=2026-10-30&to=2026-11-08','GET',undefined,emails[1])).data.events.length,0);
  assert.equal((await call(env,'/api/calendar/events/'+id,'PATCH',{revision:1,details:'Edited synthetic detail'})).status,200);
  assert.equal((await call(env,'/api/calendar/events/'+id,'PATCH',{revision:1,title:'stale'})).status,409);
  assert.equal((await call(env,'/api/calendar/events/'+id,'DELETE',undefined,emails[0],{'if-match':'1'})).status,409);
  assert.equal((await call(env,'/api/calendar/events/'+id,'DELETE',undefined,emails[0],{'if-match':'2'})).status,200);
  assert.equal((await call(env,'/api/calendar?from=2026-10-30&to=2026-11-08')).data.events.length,0);
  const backup=(await call(env,'/api/calendar/export')).data;
  assert.equal(backup.events.length,1);assert.equal(backup.events[0].status,'cancelled');
  assert.equal('owner' in backup.events[0],false);
  assert.equal((await call(env,'/api/calendar/export','GET',undefined,emails[1])).data.events.length,0);
  db.db.close();
});
test('task due-date overlays are never copied into calendar event rows',async()=>{
  const db=openDatabase(),env=envFor(db);
  const reminder=await call(env,'/api/entries','POST',{title:'Test reminder',kind:'task',due_date:'2026-10-31'});
  assert.equal(reminder.status,201);
  const data=(await call(env,'/api/calendar?from=2026-10-30&to=2026-11-04')).data;
  assert.equal(data.events.length,0);assert.equal(data.tasks.length,1);assert.equal(data.tasks[0].title,'Test reminder');
  const other=(await call(env,'/api/calendar?from=2026-10-30&to=2026-11-04','GET',undefined,emails[1])).data;
  assert.equal(other.tasks.length,0);
  assert.equal((await call(env,'/api/calendar?from=2026-10-30&to=2026-10-30')).status,400);
  assert.equal((await call(env,'/api/calendar/events','POST',event,emails[0],{'origin':'https://evil.example'})).status,403);
  db.db.close();
});
test.after(()=>{globalThis.fetch=originalFetch;});
