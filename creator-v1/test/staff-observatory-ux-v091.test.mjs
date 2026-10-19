import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const source=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v001.mjs',import.meta.url),'utf8');
const pinned=readFileSync(new URL('./fixtures/observatory-v091-baseline.txt',import.meta.url),'utf8');
function part(name) {
 const m=source.match(new RegExp('const '+name+' = ("(?:\\\\.|[^"\\\\])*");'));
 assert.ok(m,'missing '+name);
 return JSON.parse(m[1]);
}
test('polish keeps exact protected server route, identity and D1 implementation',()=>{
 const marker='const ORIGIN = ';
 assert.ok(source.includes(marker));
 assert.equal(source.slice(source.indexOf(marker)),pinned.slice(pinned.indexOf(marker)));
});
test('visual surfaces stay grounded in real API counts and existing links',()=>{
 const html=part('PAGE'),css=part('STYLES'),js=part('CLIENT');
 for(const id of ['priorityActions','missionStatus','syncState'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/positive|const count=k/);
 for(const k of ['pendingProjects','pendingForum','projectReports','forumReports','new7d'])assert.ok(js.includes("'"+k+"'"));
 for(const link of ['/staff/projects','/staff/command'])assert.ok(js.includes(link));
 assert.ok(js.includes("state.role==='owner'"));
 assert.ok(js.includes("state.role==='owner'?'Member directory'"));
 assert.ok(!js.includes('localStorage'));
 assert.ok(!js.includes('sessionStorage'));
 assert.ok(!html.includes('<iframe'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
});
test('chart fills missing signup days without inventing counts',()=>{
 const js=part('CLIENT');
 assert.ok(js.includes('Array.from({length:8}'));
 assert.ok(js.includes('byDay.get(day)||0'));
 assert.ok(js.includes("data.signups||[]"));
 assert.ok(js.includes('LIVE DATA UNAVAILABLE'));
});
test('published JS modules and embedded client syntax are valid',()=>{
 const sourcePath=new URL('../operations/anevum-iren-staff-observatory-v001.mjs',import.meta.url).pathname;
 const node=spawnSync(process.execPath,['--check',sourcePath],{encoding:'utf8'});
 assert.equal(node.status,0,node.stderr);
 const js=part('CLIENT');
 const check=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:js,encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});
