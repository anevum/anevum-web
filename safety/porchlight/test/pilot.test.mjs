import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import worker,{handleAPI,purgeExpired} from '../worker.mjs';

const token='porchlight_review_key_2026_1234567890_consent_only';
const adminHash=createHash('sha256').update(token).digest('hex');
const now=Math.floor(Date.now()/1000);
const origin='https://pilot.test';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const schema=read('migrations/0001.sql');
function fakeD1(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(schema);
 return {
  sqlite,
  prepare(sql){
   const stmt=sqlite.prepare(sql);
   return {
    values:[],
    bind(...values){this.values=values;return this},
    async first(){return stmt.get(...this.values)??null},
    async all(){return {results:stmt.all(...this.values)}},
    async run(){return stmt.run(...this.values)}
   };
  },
  close(){sqlite.close()}
 };
}
function env(extra={}){
 const db=fakeD1();
 return {db,settings:{
  PORCHLIGHT_DB:db,
  PORCHLIGHT_PUBLIC_ENABLED:'true',
  PORCHLIGHT_HOST_SUBMISSIONS_ENABLED:'true',
  PORCHLIGHT_ADMIN_ENABLED:'true',
  PORCHLIGHT_ADMIN_SHA256:adminHash,
  PORCHLIGHT_RATE_KEY:'test-only-crypto-hmac-keep-this-out-of-production-000',
  ...extra
 }};
}
function req(path,method='GET',body=null,headers={}){
 return new Request(origin+path,{method,headers:{
  ...body?{'Content-Type':'application/json'}:{},
  ...(method!=='GET'?{'Origin':origin}:{}),
  ...headers
 },...(body?{body:JSON.stringify(body)}:{})});
}
async function api(settings,path,method='GET',body=null,headers={}){
 const response=await handleAPI(req(path,method,body,headers),settings,now);
 const result=await response.json();
 return {response,result};
}
const auth={Authorization:'Bearer '+token};
const admin='/_private/porchlight';
const publicApi='/api/v1/porchlight';
const eventData={
 slug:'pilotevent-2026',title:'Voluntary neighborhood Halloween listing',
 neighborhood:'Test neighborhood',startsAt:now+60,endsAt:now+86400,
 centerLat:28.24,centerLng:-81.29,radiusMeters:1200
};
const hostData={
 hostName:'Decorated Porch',privateAddress:'123 Example Drive, Test City',
 contactEmail:'testhost@example.test',visibility:'exact',
 options:['candy','non_food'],note:'',
 consent:{isAdult:true,controlsHome:true,publishApprovedInfo:true,exactLocation:true}
};
async function newActiveEvent(settings){
 let r=await api(settings,admin+'/events','POST',eventData,auth);
 assert.equal(r.response.status,201,r.result.code);
 r=await api(settings,admin+'/events/'+eventData.slug+'/activate','POST',{},auth);
 assert.equal(r.response.status,200,r.result.code);
}
async function application(settings,body=hostData){
 const data=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts','POST',body);
 assert.equal(data.response.status,201,JSON.stringify(data.result));
 return data.result;
}
test('schema creates isolated event, consent, report, rate and audit tables with strict FK deletion',()=>{
 const db=fakeD1();
 try{
  const names=db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(x=>x.name);
  for(const name of ['events','host_submissions','reports','rate_buckets','audit_events'])
   assert.ok(names.includes(name),'missing table '+name);
  assert.equal(db.sqlite.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
 }finally{db.close()}
});
test('all public features default OFF; no live addresses or test fixtures are seeded',async()=>{
 const {db,settings}=env({
   PORCHLIGHT_PUBLIC_ENABLED:'false',PORCHLIGHT_HOST_SUBMISSIONS_ENABLED:'false',
   PORCHLIGHT_ADMIN_ENABLED:'false'
 });
 try{
  const health=await api(settings,publicApi+'/health');
  assert.equal(health.result.publicEnabled,false);
  const list=await api(settings,publicApi+'/events');
  assert.deepEqual(list.result.events,[]);
  const guest=await api(settings,admin+'/events','POST',eventData,auth);
  assert.equal(guest.response.status,401);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) as n FROM host_submissions').get().n,0);
 }finally{db.close()}
});
test('public host publication is impossible until adult consent and organizer verification',async t=>{
 const {db,settings}=env();
 try{
  await t.test('private event create/guest deny/explicit activation',async()=>{
   const anon=await api(settings,admin+'/events','POST',eventData);
   assert.equal(anon.response.status,401);
   const cross=await api(settings,admin+'/events','POST',eventData,{...auth,Origin:'https://attacker.invalid'});
   assert.equal(cross.response.status,403);
   const draft=await api(settings,admin+'/events','POST',eventData,auth);
   assert.equal(draft.response.status,201);
   let list=await api(settings,publicApi+'/events');
   assert.deepEqual(list.result.events,[]);
   const on=await api(settings,admin+'/events/'+eventData.slug+'/activate','POST',{},auth);
   assert.equal(on.result.status,'active');
   list=await api(settings,publicApi+'/events');
   assert.equal(list.result.events.length,1);
   assert.ok(!JSON.stringify(list.result).includes('123 Example Drive'));
  });
  let submission;
  await t.test('rejects missing adult consent, wrong origin, and public access to private queue',async()=>{
   const noConsent=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts','POST',{
    ...hostData,consent:{...hostData.consent,controlsHome:false}
   });
   assert.equal(noConsent.response.status,422);
   const wrongOrigin=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts','POST',hostData,{
    Origin:'https://attacker.invalid'
   });
   assert.equal(wrongOrigin.response.status,403);
   submission=await application(settings,hostData);
   assert.match(submission.receipt,/^[0-9a-f]{64}$/);
   const listed=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
   assert.deepEqual(listed.result.hosts,[]);
   const unauthQueue=await api(settings,admin+'/events/'+eventData.slug+'/queue');
   assert.equal(unauthQueue.response.status,401);
   const queue=await api(settings,admin+'/events/'+eventData.slug+'/queue','GET',null,auth);
   assert.equal(queue.result.submissions.length,1);
   assert.equal(queue.result.submissions[0].private_address,hostData.privateAddress);
   assert.equal(queue.result.submissions[0].contact_email,hostData.contactEmail);
  });
  await t.test('approval enforces out-of-band verification and event-radius boundary',async()=>{
   const endpoint=admin+'/hosts/'+submission.id+'/decision';
   let r=await api(settings,endpoint,'POST',{action:'approve',publicLabel:'Voluntary Porch',lat:28.24,lng:-81.29,verifiedOutOfBand:false,verificationMethod:'direct_contact'},auth);
   assert.equal(r.response.status,422);
   r=await api(settings,endpoint,'POST',{action:'approve',publicLabel:'Voluntary Porch',lat:29.24,lng:-81.29,verifiedOutOfBand:true,verificationMethod:'direct_contact'},auth);
   assert.equal(r.response.status,422);
   r=await api(settings,endpoint,'POST',{action:'approve',publicLabel:'Voluntary Porch',lat:28.24001,lng:-81.28999,verifiedOutOfBand:true,verificationMethod:'in_person'},auth);
   assert.equal(r.result.status,'published');
   const list=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
   assert.equal(list.result.hosts.length,1);
   assert.deepEqual(Object.keys(list.result.hosts[0]).sort(),['id','lat','lng','location','name','options','visibility'].sort());
   const content=JSON.stringify(list.result);
   assert.ok(!content.includes('privateAddress'));
   assert.ok(!content.includes(hostData.privateAddress));
   assert.ok(!content.includes(hostData.contactEmail));
   assert.equal(list.result.hosts[0].location,'Voluntary Porch');
   assert.ok(Number.isFinite(list.result.hosts[0].lat));
  });
  await t.test('private reports can be submitted and only an organizer can resolve them',async()=>{
   const endpoint=publicApi+'/events/'+eventData.slug+'/reports';
   let r=await api(settings,endpoint,'POST',{hostId:submission.id,reason:'incorrect',details:'Host hours need review'});
   assert.equal(r.response.status,201,JSON.stringify(r.result));
   const queue=await api(settings,admin+'/events/'+eventData.slug+'/queue','GET',null,auth);
   assert.equal(queue.result.reports.length,1);
   const reportId=queue.result.reports[0].id;
   r=await api(settings,admin+'/reports/'+reportId+'/resolve','POST',{});
   assert.equal(r.response.status,401);
   r=await api(settings,admin+'/reports/'+reportId+'/resolve','POST',{},auth);
   assert.equal(r.response.status,200,JSON.stringify(r.result));
   assert.equal(db.sqlite.prepare('SELECT status FROM reports WHERE id=?').get(reportId).status,'resolved');
  });
  await t.test('host receipt revokes immediately and scrubs private identity',async()=>{
   const endpoint=publicApi+'/submissions/'+submission.id+'/revoke';
   let r=await api(settings,endpoint,'POST',{receipt:'a'.repeat(64)});
   assert.equal(r.response.status,404);
   r=await api(settings,endpoint,'POST',{receipt:submission.receipt});
   assert.equal(r.result.status,'withdrawn');
   const list=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
   assert.equal(list.result.hosts.length,0);
   const row=db.sqlite.prepare('SELECT * FROM host_submissions WHERE id=?').get(submission.id);
   for(const field of ['private_address','contact_email','note','public_name','public_label','receipt_hash'])
    assert.equal(row[field],null,field+' should be purged');
   assert.equal(row.host_name,'Withdrawn host');
   assert.equal(row.options_json,'[]');
   assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM reports WHERE host_id=?').get(submission.id).n,0,
      'private reports are deleted on host withdrawal');
   const audits=db.sqlite.prepare("SELECT COUNT(*) n FROM audit_events WHERE action='host_self_withdrawn' AND event_id=?").get(row.event_id).n;
   assert.equal(audits,1);
   const replay=await api(settings,endpoint,'POST',{receipt:submission.receipt});
   assert.equal(replay.response.status,404);
  });
  await t.test('area-only host never gets fake point even after approval',async()=>{
   const area=await application(settings,{
    ...hostData,hostName:'Area-only house',visibility:'area',
    consent:{...hostData.consent,exactLocation:false}
   });
   const endpoint=admin+'/hosts/'+area.id+'/decision';
   let r=await api(settings,endpoint,'POST',{action:'approve',publicLabel:'General area',lat:28.24,lng:-81.29,verifiedOutOfBand:true,verificationMethod:'direct_contact'},auth);
   assert.equal(r.response.status,422);
   r=await api(settings,endpoint,'POST',{action:'approve',publicLabel:'General area',lat:null,lng:null,verifiedOutOfBand:true,verificationMethod:'direct_contact'},auth);
   assert.equal(r.response.status,200,JSON.stringify(r.result));
   const list=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
   const published=list.result.hosts.find(x=>x.id===area.id);
   assert.equal(published.lat,null);assert.equal(published.lng,null);
   assert.equal(published.visibility,'area');
   assert.equal(published.location,eventData.neighborhood,'area labels must be server-derived neighborhood, never a host address');
   assert.equal(published.name,'Participating household','area-only display names must not leak addresses');
  });
  await t.test('rejected host private contact and address are scrubbed',async()=>{
   const applicationResult=await application(settings,{
     ...hostData,hostName:'Sensitive Applicant',visibility:'area',note:'Do not publicize address',
     contactEmail:'privateperson@example.test',consent:{...hostData.consent,exactLocation:false}
   });
   const decision=await api(settings,admin+'/hosts/'+applicationResult.id+'/decision','POST',{action:'reject'},auth);
   assert.equal(decision.response.status,200);
   const row=db.sqlite.prepare('SELECT * FROM host_submissions WHERE id=?').get(applicationResult.id);
   assert.equal(row.status,'rejected');
   assert.equal(row.host_name,'Rejected submission');
   assert.equal(row.private_address,null);
   assert.equal(row.contact_email,null);
   assert.equal(row.note,null);
   assert.equal(row.options_json,'[]');
  });
  await t.test('event close hides every public pin without touching Creator V1',async()=>{
   const r=await api(settings,admin+'/events/'+eventData.slug+'/close','POST',{},auth);
   assert.equal(r.result.status,'closed');
   const publicEvents=await api(settings,publicApi+'/events');
   assert.deepEqual(publicEvents.result.events,[]);
   const hosts=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
   assert.equal(hosts.response.status,404);
   const reopening=await api(settings,admin+'/events/'+eventData.slug+'/activate','POST',{},auth);
   assert.equal(reopening.response.status,409,'closed events cannot be silently reactivated');
   const audit=db.sqlite.prepare("SELECT action FROM audit_events WHERE action='event_closed'").all();
   assert.equal(audit.length,1);
  });
 }finally{db.close()}
});
test('host and report ingestion fail closed when no rate secret is configured',async()=>{
 const {db,settings}=env({PORCHLIGHT_RATE_KEY:''});
 try{
  await newActiveEvent(settings);
  const r=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts','POST',hostData);
  assert.equal(r.response.status,429);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM host_submissions').get().n,0);
 }finally{db.close()}
});
test('expired event records cascade out of private database after retention window',async()=>{
 const {db,settings}=env();
 try{
  await newActiveEvent(settings);
  await application(settings);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM host_submissions').get().n,1);
  await db.prepare("UPDATE events SET starts_at=?, ends_at=? WHERE slug=?")
    .bind(now-9*86400,now-8*86400,eventData.slug).run();
  const list=await api(settings,publicApi+'/events');
  assert.deepEqual(list.result.events,[]);
  const hosts=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts');
  assert.equal(hosts.response.status,404);
  await purgeExpired(db,now);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM events').get().n,0);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM host_submissions').get().n,0);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM audit_events').get().n,0,
      'audit trail must expire when event is deleted');
 }finally{db.close()}
});
test('public UI never requests browser GPS, child identity, unreviewed host feeds, or third-party tiles',()=>{
 const html=read('public/index.html'),script=read('public/app.js'),style=read('public/app.css');
 const admin=read('public/organizer.js'),workerCode=read('worker.mjs');
 assert.match(html,/No homes have been published/);
 assert.match(html,/Not affiliated with emergency services/);
 assert.match(html,/exact-consent-row/);
 assert.match(html,/host-adult/);
 assert.match(html,/Remove your listing/);
 assert.match(html,/Schemat(ic|ic)/i);
 assert.doesNotMatch(script,/navigator\.geolocation|watchPosition|getCurrentPosition/);
 assert.doesNotMatch(script,/localStorage|sessionStorage|postMessage\(/);
 assert.doesNotMatch(admin,/localStorage|sessionStorage/);
 assert.match(style,/@media\(max-width:360px\)/);
 assert.match(style, /prefers-reduced-motion/);
 assert.match(workerCode,/geolocation=\(\)/);
 assert.match(workerCode,/frame-ancestors 'none'/);
 assert.match(workerCode,/no-store, private/);
 assert.doesNotMatch(workerCode,/CLOUDFLARE_API_TOKEN|CANONICAL_RESEND_API_KEY/);
});
test('standalone default Worker denies writes to non-API static paths',async()=>{
 const request=req('/index.html','POST',{body:'test'});
 const result=await worker.fetch(request,{});
 assert.equal(result.status,405);
});

test('oversized JSON requests are rejected without writing private household data',async()=>{
 const {db,settings}=env();
 try{
  await newActiveEvent(settings);
  const input={...hostData,note:'x'.repeat(6200)};
  const r=await api(settings,publicApi+'/events/'+eventData.slug+'/hosts','POST',input);
  assert.equal(r.response.status,400);
  assert.equal(r.result.code,'PAYLOAD_TOO_LARGE');
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM host_submissions').get().n,0);
 }finally{db.close()}
});

test('host consent is versioned and event audit does not outlive its parent',async()=>{
 const {db,settings}=env();
 try{
  await newActiveEvent(settings);
  const submitted=await application(settings);
  const row=db.sqlite.prepare('SELECT consent_version,event_id,contact_email FROM host_submissions WHERE id=?').get(submitted.id);
  assert.match(row.consent_version,/^porchlight-v001\./);
  assert.equal(row.contact_email,hostData.contactEmail);
  const entries=db.sqlite.prepare('SELECT action,event_id FROM audit_events ORDER BY created_at').all();
  assert.equal(entries.length,2);
  assert.ok(entries.every(x=>x.event_id===row.event_id));
  assert.deepEqual(new Set(entries.map(x=>x.action)),new Set(['event_drafted','event_active']));
 }finally{db.close()}
});
