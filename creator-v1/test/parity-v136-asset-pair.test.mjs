import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {shareCompiledAssets,pairPackages} from '../ops/parity-v136-asset-pair.mjs';
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'parity-asset-pair-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const inputs=['baseline','old-canary','candidate'].map(name=>{const p=join(root,name);mkdirSync(join(p,'assets'),{recursive:true});writeFileSync(join(p,'index.html'),'<script src="/assets/'+name+'.js"></script>');writeFileSync(join(p,'assets',name+'.js'),name);writeFileSync(join(p,'assets','shared.js'),'shared');return p});
 return {root,inputs,out:join(root,'out')};
}
test('both versions retain their own HTML and serve every old/new entrypoint chunk',t=>{
 const {inputs,out}=fixture(t),r=shareCompiledAssets(inputs,out);
 assert.equal(r.sharedAssetCount,4);
 for(const variant of ['baseline','candidate']){
  const dest=join(out,variant,'compiled-web');
  assert.equal(readFileSync(join(dest,'index.html'),'utf8'),readFileSync(join(inputs[variant==='baseline'?0:2],'index.html'),'utf8'));
  for(const name of ['baseline','old-canary','candidate','shared'])assert.equal(readFileSync(join(dest,'assets',name+'.js'),'utf8'),name);
 }
 assert.deepEqual(r.inventories[0].filter(x=>x.path!=='index.html'),r.inventories[1].filter(x=>x.path!=='index.html'));
});
test('conflicting static bytes fail closed instead of silently changing a stable asset',t=>{
 const {inputs,out}=fixture(t);writeFileSync(join(inputs[2],'assets','shared.js'),'unexpected replacement');
 assert.throws(()=>shareCompiledAssets(inputs,out),/Conflicting static asset assets\/shared.js/);
});
test('symlinks cannot import files outside the sealed asset roots',t=>{
 const {root,inputs,out}=fixture(t);writeFileSync(join(root,'outside.txt'),'outside');symlinkSync(join(root,'outside.txt'),join(inputs[2],'assets','outside.txt'));
 assert.throws(()=>shareCompiledAssets(inputs,out),/Symlinks forbidden/);
});
test('stale output is never reused for a different asset pair',t=>{
 const {inputs,out}=fixture(t);shareCompiledAssets(inputs,out);assert.throws(()=>shareCompiledAssets(inputs,out),/stale paired package/);
});
test('cached V61 and V63 clients retain their entry, lazy chunks and styles in both new versions',t=>{
 const {root,inputs,out}=fixture(t);
 const retained=['v61','v63'].map(name=>{
  const p=join(root,name);mkdirSync(join(p,'assets'),{recursive:true});
  writeFileSync(join(p,'index.html'),'retained HTML must never replace either entrypoint');
  writeFileSync(join(p,'assets',name+'.js'),'import("./lazy-'+name+'.js");');
  writeFileSync(join(p,'assets','lazy-'+name+'.js'),'export const version="'+name+'";');
  writeFileSync(join(p,'assets',name+'.css'),':root{--version:'+name+'}');
  return p;
 });
 const result=shareCompiledAssets([...inputs,...retained],out);
 assert.equal(result.sharedAssetCount,10);
 for(const variant of ['baseline','candidate']){
  const dest=join(out,variant,'compiled-web');
  assert.equal(readFileSync(join(dest,'index.html'),'utf8'),readFileSync(join(inputs[variant==='baseline'?0:2],'index.html'),'utf8'));
  for(const name of ['v61','v63'])for(const file of [name+'.js','lazy-'+name+'.js',name+'.css'])
   assert.deepEqual(readFileSync(join(dest,'assets',file)),readFileSync(join(root,name,'assets',file)));
 }
});
test('retained cached-client URLs still reject conflicting immutable bytes',t=>{
 const {root,inputs,out}=fixture(t);
 const retained=['v61','v63'].map(name=>{const p=join(root,name);mkdirSync(join(p,'assets'),{recursive:true});writeFileSync(join(p,'index.html'),name);return p});
 writeFileSync(join(retained[1],'assets','shared.js'),'must not replace an existing client asset');
 assert.throws(()=>shareCompiledAssets([...inputs,...retained],out),/Conflicting static asset assets\/shared.js/);
});
test('production pairing refuses missing retained releases before consuming package inputs',()=>{
 assert.throws(()=>pairPackages('baseline','old','candidate','out'),/Both exact V61 and V63 packages required/);
});
