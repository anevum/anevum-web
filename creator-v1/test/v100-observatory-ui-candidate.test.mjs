import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseModules,patchUi,downloadDigest,prepareInactive,uploadMetadata} from '../ops/v100-observatory-ui-candidate.mjs';
const approved=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8');
const old=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v001.mjs',import.meta.url),'utf8');
test('UI patch preserves every original server byte even when the server differs from the candidate',async()=>{
 const source=old.replace('const ORIGIN =', '// retained live transport\nconst ORIGIN =');
 const [patched]=await patchUi([{name:'worker.js',source}],approved);
 const suffix=s=>s.slice(s.indexOf('// retained live transport'));
 assert.equal(suffix(patched.source),suffix(source));
 assert.match(patched.source,/AbortController/);assert.match(patched.source,/12000/);
 assert.ok(patched.source.includes('check your staff session'));
});
test('multiple modules retain their imports, export form and unrelated modules exactly',async()=>{
 const index=old.indexOf('const ORIGIN =');
 const modules=[{name:'ui.mjs',source:old.slice(0,index).replaceAll('const ','export const ')},{name:'index.mjs',source:"import {PAGE,STYLES,CLIENT} from './ui.mjs';\n"+old.slice(index)}];
 const result=await patchUi(modules,approved);
 assert.equal(result[1].source,modules[1].source);assert.equal(result[0].name,'ui.mjs');
 assert.ok(result[0].source.startsWith('export const PAGE'));
});
test('missing, duplicate or executable UI initializers refuse patching',async()=>{
 for(const source of ['const PAGE="old";',old.replace('const PAGE =','const PAGE = String('),old+'\nconst CLIENT="duplicate";']){
  await assert.rejects(()=>patchUi([{name:'index.mjs',source}],approved));
 }
 await assert.rejects(()=>patchUi([{name:'index.mjs',source:old}],approved.replace('const PAGE =','const OLD_PAGE =')));
});
test('multipart parsing accepts casing and preserves source while rejecting ambiguous or unsafe modules',()=>{
 const encoded=boundary=>boundary+'\r\ncontent-disposition: form-data; name="worker.js"\r\nContent-Type: application/javascript+module\r\n\r\nexport default {};\n\r\n'+boundary+'--\r\n';
 assert.deepEqual(parseModules(encoded('--test-boundary')),[{name:'worker.js',source:'export default {};\n'}]);
 assert.deepEqual(parseModules(encoded('--test-boundary').replace('Content-Type: application/javascript+module\r\n','')),[{name:'worker.js',source:'export default {};\n'}]);
 assert.equal(downloadDigest(encoded('--test-boundary')),downloadDigest(encoded('--other-boundary')));
 for(const source of [encoded('--test-boundary').replace('worker.js','../worker.js'),encoded('--test-boundary').replace('application/javascript','application/json'),encoded('--test-boundary').replace('name="worker.js"','name="metadata"'),encoded('--test-boundary').replace('Content-Type:','Content-Type: text/html\r\nContent-Type:')])assert.throws(()=>parseModules(source));
});
test('headerless modules still require valid JavaScript before assembly',async()=>{
 const download='--test-boundary\r\nContent-Disposition: form-data; name="index.mjs"\r\n\r\n<html>not a worker</html>\r\n--test-boundary--\r\n';
 await assert.rejects(()=>patchUi(parseModules(download),approved));
});
test('upload metadata preserves canonical D1 identity and retained runtime settings',async()=>{
 const settings={bindings:[{name:'MEMBER_DB',type:'d1',id:'retained-db'},{name:'APEX_AUTH',type:'service',service:'retained-apex'},{name:'LABEL',type:'plain_text',text:'retained'}],compatibility_date:'2026-01-01',compatibility_flags:['nodejs_compat'],observability:{enabled:true},tags:['retained'],tail_consumers:[],logpush:false};
 const source='const worker={fetch(){return new Response("ok")}};export {worker as default};';
 const metadata=await uploadMetadata(settings,[{name:'index.mjs',source}]);
 assert.equal(metadata.main_module,'index.mjs');
 assert.deepEqual(metadata.bindings,[{name:'MEMBER_DB',type:'d1',database_id:'retained-db'},...settings.bindings.slice(1)]);
 assert.equal(settings.bindings[0].id,'retained-db');
 assert.deepEqual(metadata.compatibility_flags,settings.compatibility_flags);
 for(const key of ['observability','tags','tail_consumers','logpush'])assert.equal(key in metadata,false);
 assert.deepEqual(settings.observability,{enabled:true});
 const direct=await uploadMetadata({bindings:[{name:'MEMBER_DB',type:'d1',database_id:'canonical-db',id:'metadata-id'}]},[{name:'worker.js',source:'export default {};'}]);
 assert.equal(direct.bindings[0].database_id,'canonical-db');
 await assert.rejects(()=>uploadMetadata({bindings:[{name:'MEMBER_DB',type:'d1'}]},[{name:'worker.js',source:'export default {};'}]),/Missing database binding identifier/);
 const retained={compatibility_date:'2026-01-01',compatibility_flags:['nodejs_compat'],usage_model:'standard'};
 assert.equal((await uploadMetadata(settings,[{name:'index.mjs',source}],retained)).usage_model,'standard');
 await assert.rejects(()=>uploadMetadata(settings,[{name:'index.mjs',source}],{...retained,limits:{cpu_ms:50}}),/unsupported upload setting/);
 await assert.rejects(()=>uploadMetadata(settings,[{name:'index.mjs',source}],{...retained,compatibility_date:'2025-01-01'}),/disagrees with live settings/);
});
test('entrypoint resolution ignores UI text and rejects absent or ambiguous module defaults',async()=>{
 const helper={name:'ui.mjs',source:'export const PAGE="export default {};";'};
 const entry={name:'index.mjs',source:'import {PAGE} from "./ui.mjs"; const worker={}; export {worker as default};'};
 assert.equal((await uploadMetadata({bindings:[]},[helper,entry])).main_module,'index.mjs');
 await assert.rejects(()=>uploadMetadata({bindings:[]},[helper]),/exactly one module entrypoint/);
 await assert.rejects(()=>uploadMetadata({bindings:[]},[entry,{name:'other.mjs',source:'export default {};'}]),/exactly one module entrypoint/);
});
test('unreviewed candidate or changed live version cannot make any provider write',async()=>{
 let writes=0;
 const api=async(method,path)=>{
  if(method!=='GET')writes++;
  if(path.endsWith('/deployments'))return {deployments:[{versions:[{version_id:'unknown',percentage:100}]}]};
  return {};
 };
 await assert.rejects(()=>prepareInactive(api,{candidate:approved+'\n// drift',apply:true}));
 await assert.rejects(()=>prepareInactive(api,{candidate:approved,apply:true}));
 assert.equal(writes,0);
});
