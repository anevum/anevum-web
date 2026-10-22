import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {readWithDeadline,ReadDeadlineError} from '../shared/read-deadline.mjs';

test('a hung read settles, aborts its transport, and is never replayed',async()=>{
 let calls=0,signal;
 await assert.rejects(readWithDeadline(s=>{calls++;signal=s;return new Promise(()=>{});},undefined,15),ReadDeadlineError);
 assert.equal(calls,1);assert.equal(signal.aborted,true);
});
test('response parsing is part of the deadline, even if its body ignores abort',async()=>{
 await assert.rejects(readWithDeadline(async()=>{
  const response={json:()=>new Promise(()=>{})};
  return await response.json();
 },undefined,10),ReadDeadlineError);
});
test('a disposed account cancels a read immediately and no late value replaces it',async()=>{
 const controller=new AbortController();let finish,signal;
 const reason=new DOMException('Account changed','AbortError');
 const promise=readWithDeadline(s=>{signal=s;return new Promise(resolve=>{finish=resolve;});},controller.signal);
 await Promise.resolve();controller.abort(reason);
 await assert.rejects(promise,e=>e===reason);assert.equal(signal.aborted,true);
 finish({private:'previous account'});
 await assert.rejects(promise,e=>e===reason);
});
test('already disposed reads make no network call, and normal failures stay intact',async()=>{
 const controller=new AbortController();controller.abort();let called=0;
 await assert.rejects(readWithDeadline(async()=>{called++;},controller.signal),{name:'AbortError'});
 assert.equal(called,0);
 const denied=Error('Current server permission denied');
 await assert.rejects(readWithDeadline(async()=>{throw denied;}),e=>e===denied);
 assert.deepEqual(await readWithDeadline(async()=>({ok:true})),{ok:true});
});
test('canonical Studio isolates account, mode and project before rendering private state',()=>{
 const studio=readFileSync(new URL('../web/src/pages/CanonicalStudioPage.tsx',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../web/src/lib/studio-entry-read.ts',import.meta.url),'utf8');
 assert.doesNotThrow(()=>parse(entry,{sourceType:'module',plugins:['typescript']}));
 assert.doesNotThrow(()=>parse(studio,{sourceType:'module',plugins:['jsx','typescript']}));
 assert.match(studio,/<SessionStudio key=\{id\+':\'\+mode\+':\'\+\(projectId\|\|''\)\}/);
 for(const retry of ['RETRY STUDIO ACCESS','RETRY PROJECTS','RETRY REVIEW QUEUE'])assert.ok(studio.includes(retry));
 assert.match(studio,/readWithDeadline\(signal=>resolveStudioEntry\(id,mode,signal,/);
 assert.match(entry,/profile\.memberId!==memberId/);
 assert.doesNotMatch(studio,/setInterval\(|localStorage|sessionStorage/);
 const hook=readFileSync(new URL('../web/src/lib/useResource.ts',import.meta.url),'utf8');
 assert.match(hook,/Object.is\(value,deps\[index\]\)/);
 assert.match(hook,/readWithDeadline\(loader, controller.signal\)/);
});
test('apex-root capture imports only supported native APIs',async()=>{
 const source=readFileSync(new URL('./capture-v100-apex-root.mjs',import.meta.url),'utf8');
 for(const [,names,module] of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)){
  if(!module.startsWith('node:'))continue;
  const namespace=await import(module);
  for(const name of names.split(',').map(n=>n.trim()))assert.ok(name in namespace,module+' exports '+name);
 }
});
