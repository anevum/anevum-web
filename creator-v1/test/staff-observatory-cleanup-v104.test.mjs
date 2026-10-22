import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';

const base=new URL('../operations/',import.meta.url);
const next=readFileSync(new URL('anevum-iren-staff-observatory-v104.mjs',base),'utf8');
const prior=readFileSync(new URL('anevum-iren-staff-observatory-v001.mjs',base),'utf8');
const read=name=>{
 const match=next.match(new RegExp('const '+name+' = ("(?:\\\\.|[^"\\\\])*");'));
 assert.ok(match,'missing '+name);
 return JSON.parse(match[1]);
};
const html=read('PAGE'),css=read('STYLES'),client=read('CLIENT');
const server=s=>s.slice(s.indexOf('const ORIGIN = '));

test('V104 has five semantically aligned member columns and no synthetic XP counters',()=>{
 assert.match(html,/<th>Recognition \/ aura<\/th><th>Staff clearance<\/th>/);
 assert.doesNotMatch(html,/<th>Test XP<\/th>|id="xpSignal"|XP button activity|XP tests are not organic activity/);
 assert.doesNotMatch(client,/xpSignal|testXp|testEvents|xpTesters|xpEvents|XP test participants|XP test events/);
 assert.match(client,/colspan="5"/);
 assert.match(css,/tbody td:nth-child\(4\):before\{content:"RECOGNITION \/ AURA"\}/);
 assert.match(css,/tbody td:nth-child\(5\):before\{content:"STAFF ACCESS"\}/);
 assert.doesNotMatch(css,/tbody td:nth-child\(6\)/);
});

test('V104 removes only XP telemetry read queries from protected server',()=>{
 let expected=server(prior);
 const removals=[
  /^\s*\(SELECT COUNT\(\*\) FROM member_xp_events\) AS xpEvents,\n/m,
  /^\s*\(SELECT COUNT\(DISTINCT user_id\) FROM member_xp_events\) AS xpTesters,\n/m,
  /^\s*COALESCE\(x\.testEvents,0\) AS testEvents,COALESCE\(x\.testXp,0\) AS testXp,\n/m,
  /^\s*LEFT JOIN \(SELECT user_id, COUNT\(\*\) AS testEvents, SUM\(amount\) AS testXp\n\s*FROM member_xp_events GROUP BY user_id\) x ON x.user_id=u.id\n/m,
 ];
 for(const pattern of removals){
  assert.match(expected,pattern);
  expected=expected.replace(pattern,'\n');
 }
 assert.equal(server(next),expected);
 assert.doesNotMatch(server(next),/member_xp_events|xpEvents|xpTesters|testXp|testEvents/);
 assert.match(server(next),/staff_access_grants/);
 assert.match(server(next),/member_recognition_grants/);
 assert.match(server(next),/getStaff\(request, env\)/);
});

test('V104 UI and client parse without modifying frozen V092 release',()=>{
 const file=new URL('anevum-iren-staff-observatory-v104.mjs',base);
 const result=spawnSync(process.execPath,['--check',file.pathname],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.doesNotThrow(()=>new Script(client));
 assert.match(html,/id="syncState"/);
 assert.match(client,/LIVE DATA UNAVAILABLE/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(html,/id="memberRows"/);
});
