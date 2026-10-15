import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {integrateCurrencyModules,RELEASE} from './currency-overlay.mjs';
import {CURRENCY_ASSETS} from '../currency-snapshot.mjs';
const baseline=await readFile(new URL('./live-worker-baseline.mjs',import.meta.url),'utf8');
const original=[{name:'worker.mjs',code:baseline},{name:'rhen-terminal.mjs',code:'<a href="/projects/rhen/research/">OPEN RESEARCH CONSOLE</a>'},...['backstage-workspace.mjs','transcosmic-workspace.mjs','fold-snapshot.mjs','terminal-ui.mjs','rhen-ui.mjs'].map(name=>({name,code:'original '+name}))];
const integrated=integrateCurrencyModules(original,'snapshot content');
test('overlay preserves every unrelated live module and all existing routes',()=>{
 for(const m of original.filter(m=>!['worker.mjs','rhen-terminal.mjs'].includes(m.name)))assert.deepEqual(integrated.find(x=>x.name===m.name),m);
 const worker=integrated.find(m=>m.name==='worker.mjs').code;
 for(const path of ['/projects/backstage/','/projects/transcosmic/','/projects/the-fold/','/projects/rhen/api/overview','/projects/rhen/research/'])assert.ok(worker.includes(path));
 assert.ok(integrated.find(m=>m.name==='rhen-terminal.mjs').code.includes('OPEN CURRENCY SANDBOX'));
 assert.equal(original[0].code,baseline);
});
test('unexpected baseline and repeat application stop before mutation',()=>{
 assert.throws(()=>integrateCurrencyModules(integrated,'again'),/baseline/);
 assert.throws(()=>integrateCurrencyModules([],'new'),/baseline/);
});
test('integrated Worker serves currency assets behind original host and method boundaries',async()=>{
 const code=integrated.find(m=>m.name==='worker.mjs').code.replace(/^import .*;\n/gm,'').replace('export default','globalThis.labWorker=');
 const context=vm.createContext({URL,Response,JSON,Object,CURRENCY_ASSETS});new vm.Script(code).runInContext(context);
 for(const [path,content] of Object.entries(CURRENCY_ASSETS)){
  const result=await context.labWorker.fetch(new Request('https://lab.anevum.com'+path));
  assert.equal(result.status,200);assert.equal(await result.text(),content);assert.match(result.headers.get('Cache-Control'),/no-store/);
  assert.equal((await context.labWorker.fetch(new Request('https://anevum.com'+path))).status,404);
  assert.equal((await context.labWorker.fetch(new Request('https://lab.anevum.com'+path,{method:'POST'}))).status,405);
 }
 assert.ok(code.includes(RELEASE));
});
