import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createPorchlightHandler} from '../service.mjs';

const SCHEMA = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
export const ORIGIN = 'https://porchlight.anevum.test';
export const BLOCK_FORM = Object.freeze({
  label:'Lantern House', privateAddress:'123 Example Street, Test City, FL 00000', blockCode:'lantern-walk',
  displayMode:'block', tags:['candy','decor'], consentVersion:'porchlight-host-consent-v1', consentConfirmed:true,
  adultAttested:true, authorizedResidentAttested:true,
});
export const EXACT_FORM = Object.freeze({...BLOCK_FORM, displayMode:'exact', lat:28.25, lng:-81.29,
  exactLocationConsent:true, exactAddressConsent:true});

export class SqliteD1 {
  constructor() {this.raw = new DatabaseSync(':memory:'); this.raw.exec(SCHEMA);}
  prepare(sql) {
    const raw = this.raw;
    return {bind(...params) {
      const bound = () => raw.prepare(sql);
      return {
        first: async () => bound().get(...params) || null,
        all: async () => ({results:bound().all(...params)}),
        run: async () => {const result=bound().run(...params);return {success:true, meta:{changes:Number(result.changes), last_row_id:Number(result.lastInsertRowid)}};},
      };
    }};
  }
  async batch(statements) {
    this.raw.exec('BEGIN IMMEDIATE');
    try {
      const results=[];
      for (const statement of statements) results.push(await statement.run());
      this.raw.exec('COMMIT');
      return results;
    } catch(error) {this.raw.exec('ROLLBACK');throw error;}
  }
  rows(sql, ...params) {return this.raw.prepare(sql).all(...params);}
  one(sql, ...params) {return this.raw.prepare(sql).get(...params);}
  exec(sql) {return this.raw.exec(sql);}
  close() {this.raw.close();}
}
export function createHarness({today='2026-10-29T12:00:00.000Z', quota=true, flag='true', withResolver=true}={}) {
  const db=new SqliteD1();
  const clock={today};
  const actors=new WeakMap();
  const env={PORCHLIGHT_ORIGIN:ORIGIN,PORCHLIGHT_DATA_ENABLED:flag,PORCHLIGHT_DB:db};
  for (const [id,slug,title] of [['ev-one','halloween-2026','Halloween Trail'],['ev-two','lights-2026','Winter Lights']]) {
    db.raw.prepare(`INSERT INTO porchlight_events (id,slug,title,region_label,public_from,starts_at,ends_at,status,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`).run(id,slug,title,'Test region','2026-10-25T00:00:00.000Z',
       '2026-10-31T16:00:00.000Z','2026-11-01T02:00:00.000Z','open','2026-10-17T00:00:00.000Z');
  }
  for (const [event, code, label] of [
    ['ev-one','lantern-walk','Fictional Lantern Walk'],
    ['ev-one','oak-court','Fictional Oak Court'],
    ['ev-two','snow-ridge','Fictional Snow Ridge'],
  ]) db.raw.prepare('INSERT INTO porchlight_event_blocks (event_id,code,public_label) VALUES (?,?,?)').run(event,code,label);
  for (const [event,id,role,revoked] of [
    ['ev-one','moderator-A','reviewer',null],
    ['ev-one','manager-A','manager',null],
    ['ev-one','retired-A','manager','2026-10-17T00:00:00.000Z'],
    ['ev-two','moderator-B','reviewer',null],
  ]) db.raw.prepare(`INSERT INTO porchlight_organizer_grants (event_id,principal_id,role,granted_at,revoked_at) VALUES (?,?,?,?,?)`).run(event,id,role,'2026-10-17T00:00:00.000Z',revoked);
  let num=0;
  const handler=createPorchlightHandler({
    resolveActor:withResolver ? request => actors.get(request) || null : undefined,
    authorizeWriteQuota:quota===null ? undefined : () => quota,
    now:()=>clock.today,
    createId:()=>`test-id-${++num}`,
  });
  async function request(method,path,{body,actor,headers={},overrideEnv={}}={}) {
    const req=new Request(ORIGIN+path,{
      method, headers:{ ...(method==='POST'?{'Origin':ORIGIN,'content-type':'application/json'}:{}),...headers},
      ...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{}),
    });
    if(actor) actors.set(req, typeof actor==='object'?actor:{id:actor,verified:true});
    const res=await handler(req,{...env,...overrideEnv});
    const value=await res.json();
    return {status:res.status, body:value, headers:res.headers};
  }
  return {db,clock,env,request,handler};
}
export async function submit(h,actor='host-A',body=BLOCK_FORM,event='halloween-2026') {
  return h.request('POST',`/v1/events/${event}/submissions`,{actor,body});
}
export async function review(h,id,action,actor='moderator-A',revision=1) {
  return h.request('POST',`/v1/organizer/submissions/${id}/${action}`,{
    actor,body: action==='approve' ? {expectedRevision:revision,reason:'Confirmed directly with authorized homeowner',verifiedPropertyAuthority:true,verificationMethod:'direct-confirmation'} : {expectedRevision:revision,reason:'Verified report requires temporary removal'},
  });
}
