import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseModules,patchUi,downloadDigest,prepareInactive} from '../ops/v100-observatory-ui-candidate.mjs';
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
 assert.equal(downloadDigest(encoded('--test-boundary')),downloadDigest(encoded('--other-boundary')));
 for(const source of [encoded('--test-boundary').replace('worker.js','../worker.js'),encoded('--test-boundary').replace('application/javascript','application/json'),encoded('--test-boundary').replace('name="worker.js"','name="metadata"')])assert.throws(()=>parseModules(source));
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
