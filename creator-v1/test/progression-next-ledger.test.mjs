import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {awardContribution,applyReviewDecision,readCandidateTotal,windows} from '../experiments/progression-next/ledger.mjs';
const NOW=1792792800; // fixed fixture clock, not a production timestamp
function fixture(){
 const raw=new DatabaseSync(':memory:');
 raw.exec('CREATE TABLE user(id TEXT PRIMARY KEY)');
 for(const id of ['alice','bob','reviewer'])raw.prepare('INSERT INTO user VALUES(?)').run(id);
 raw.exec(readFileSync(new URL('../experiments/progression-next/schema.sql',import.meta.url),'utf8'));
 const db={prepare(sql){let args=[];return {bind(...v){args=v;return this},async run(){const r=raw.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}},async first(){return raw.prepare(sql).get(...args)??null}}}};
 function evidence(id,kind='review',extra={}){
  const e={id,kind,user:'alice',subject:id,scope:kind==='release'?'project-one':id,owner:['project','release','thread'].includes(kind)?'alice':'bob',reviewer:'reviewer',status:'approved',at:NOW,...extra};
  raw.prepare('INSERT INTO next_xp_evidence VALUES(?,?,?,?,?,?,?,?,?)').run(e.id,e.user,e.kind,e.subject,e.scope,e.owner,e.reviewer,e.status,e.at);
 }
 function decision(id,grant,action,revision,extra={}){
  const d={reviewer:'reviewer',at:NOW+10,...extra};
  raw.prepare('INSERT INTO next_xp_decisions VALUES(?,?,?,?,?,?,?)').run(id,grant,d.reviewer,action,'Independent review evidence',d.at,revision);
 }
 return {raw,db,evidence,decision,close:()=>raw.close()};
}
const on={enabled:true};
test('disabled engine does not touch a database',async()=>{
 const db={prepare(){throw Error('must not touch')}};
 assert.deepEqual(await awardContribution(db,'x',NOW),{status:'disabled'});
 assert.deepEqual(await applyReviewDecision(db,'x',NOW),{status:'disabled'});
 assert.deepEqual(await awardContribution(db,'x',NOW,{enabled:'true'}),{status:'disabled'});
});
test('one approved award is atomic with one history event; replay is inert',async()=>{
 const f=fixture();try{f.evidence('r1');
 assert.equal((await awardContribution(f.db,'r1',NOW,on)).status,'awarded');
 assert.equal((await awardContribution(f.db,'r1',NOW,on)).status,'ineligible-or-duplicate');
 assert.equal(await readCandidateTotal(f.db,'alice'),15);
 assert.equal(await readCandidateTotal(f.db,'bob'),0);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM next_xp_events').get().n,1);
 }finally{f.close()}
});
test('replayed requests and multiple evidence IDs cannot double-award a subject',async()=>{
 const x=fixture();try{x.evidence('a');x.evidence('b','review',{subject:'a'});
 const out=await Promise.all(Array.from({length:12},(_,i)=>awardContribution(x.db,i%2?'a':'b',NOW,on)));
 assert.equal(out.filter(r=>r.status==='awarded').length,1);
 assert.equal(await readCandidateTotal(x.db,'alice'),15);
 }finally{x.close()}
});
for(const [name,extra] of [['pending',{status:'pending'}],['rejected',{status:'rejected'}],['self-reviewed',{reviewer:'alice'}],['self-contribution',{owner:'alice'}],['future-approved',{at:NOW+1}]]){
 test(name+' evidence cannot pay',async()=>{const f=fixture();try{f.evidence('r','review',extra);assert.equal((await awardContribution(f.db,'r',NOW,on)).status,'ineligible-or-duplicate');assert.equal(await readCandidateTotal(f.db,'alice'),0)}finally{f.close()}});
}
test('daily cap survives a reversal and resets only at UTC midnight',async()=>{
 const f=fixture();try{for(const id of ['a','b','c'])f.evidence(id);
 await awardContribution(f.db,'a',NOW,on);await awardContribution(f.db,'b',NOW,on);
 f.decision('revoke-a','a','revoke',1);await applyReviewDecision(f.db,'revoke-a',NOW+10,on);
 assert.equal((await awardContribution(f.db,'c',NOW+20,on)).status,'ineligible-or-duplicate');
 assert.equal((await awardContribution(f.db,'c',windows(NOW).day+86400,on)).status,'awarded');
 assert.equal(await readCandidateTotal(f.db,'alice'),30);
 }finally{f.close()}
});
test('weekly bug cap is atomic across simultaneous candidates',async()=>{
 const f=fixture();try{for(let i=0;i<6;i++)f.evidence('b'+i,'bug');
 const r=await Promise.all(Array.from({length:6},(_,i)=>awardContribution(f.db,'b'+i,NOW,on)));
 assert.equal(r.filter(x=>x.status==='awarded').length,3);
 assert.equal(await readCandidateTotal(f.db,'alice'),90);
 }finally{f.close()}
});
test('first discussion and first reply award once each',async()=>{
 const f=fixture();try{for(const kind of ['thread','reply'])for(let i=0;i<2;i++){const id=kind+i;f.evidence(id,kind);await awardContribution(f.db,id,NOW,on)}
 assert.equal(await readCandidateTotal(f.db,'alice'),45);
 }finally{f.close()}
});
test('first project is 150 not 250; later project observes rolling cooldown',async()=>{
 const f=fixture();try{for(const id of ['p1','p2'])f.evidence(id,'project');
 await awardContribution(f.db,'p1',NOW,on);
 assert.equal(await readCandidateTotal(f.db,'alice'),150);
 assert.equal((await awardContribution(f.db,'p2',NOW+14*86400-1,on)).status,'ineligible-or-duplicate');
 assert.equal((await awardContribution(f.db,'p2',NOW+14*86400,on)).status,'awarded');
 assert.equal(await readCandidateTotal(f.db,'alice'),250);
 }finally{f.close()}
});
test('monthly release cap uses project scope, not version identity',async()=>{
 const f=fixture();try{for(const id of ['v1','v2'])f.evidence(id,'release');
 await awardContribution(f.db,'v1',NOW,on);
 assert.equal((await awardContribution(f.db,'v2',NOW+1,on)).status,'ineligible-or-duplicate');
 const d=new Date(NOW*1000);const next=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)/1000;
 assert.equal((await awardContribution(f.db,'v2',next,on)).status,'awarded');
 assert.equal(await readCandidateTotal(f.db,'alice'),120);
 }finally{f.close()}
});
test('appeal restores original amount only, with replay and stale-decision protection',async()=>{
 const f=fixture();try{f.evidence('r');await awardContribution(f.db,'r',NOW,on);
 f.decision('old','r','revoke',1);f.decision('no','r','revoke',1);
 assert.equal((await applyReviewDecision(f.db,'no',NOW+10,on)).status,'applied');
 assert.equal(await readCandidateTotal(f.db,'alice'),0);
 f.decision('yes','r','restore',2,{at:NOW+20});
 assert.equal((await applyReviewDecision(f.db,'yes',NOW+20,on)).status,'applied');
 assert.equal((await applyReviewDecision(f.db,'yes',NOW+21,on)).status,'ineligible-or-duplicate');
 assert.equal((await applyReviewDecision(f.db,'old',NOW+21,on)).status,'ineligible-or-duplicate');
 assert.equal(await readCandidateTotal(f.db,'alice'),15);
 assert.deepEqual(f.raw.prepare('SELECT delta FROM next_xp_events ORDER BY id').all().map(x=>x.delta),[15,-15,15]);
 }finally{f.close()}
});
test('self-review, future and out-of-order decisions cannot alter balances',async()=>{
 const f=fixture();try{f.evidence('r');await awardContribution(f.db,'r',NOW,on);
 f.decision('self','r','revoke',1,{reviewer:'alice'});f.decision('future','r','revoke',1,{at:NOW+99});
 for(const id of ['self','future'])assert.equal((await applyReviewDecision(f.db,id,NOW+10,on)).status,'ineligible-or-duplicate');
 assert.equal(await readCandidateTotal(f.db,'alice'),15);
 }finally{f.close()}
});
test('failure to append history rolls back its grant, not a partial reward',async()=>{
 const f=fixture();try{f.evidence('r');f.raw.exec("CREATE TRIGGER simulated_failure BEFORE INSERT ON next_xp_events BEGIN SELECT RAISE(ABORT,'fixture failure'); END;");
 await assert.rejects(awardContribution(f.db,'r',NOW,on),/fixture failure/);
 assert.equal(f.raw.prepare('SELECT COUNT(*) n FROM next_xp_grants').get().n,0);
 }finally{f.close()}
});
test('immutable journal and invalid input fail closed',async()=>{
 const f=fixture();try{f.evidence('r');await awardContribution(f.db,'r',NOW,on);
 assert.throws(()=>f.raw.exec('UPDATE next_xp_events SET delta=150'),/append-only/);
 assert.throws(()=>f.raw.exec('UPDATE next_xp_grants SET points=150'),/Invalid grant/);
 for(const now of [-1,0,Infinity,1.2,Number.MAX_SAFE_INTEGER])await assert.rejects(awardContribution(f.db,'r',now,on));
 await assert.rejects(awardContribution(f.db,"';DROP TABLE user;--",NOW,on));
 assert.equal(new Date(windows(NOW).week*1000).getUTCDay(),1);
 }finally{f.close()}
});
