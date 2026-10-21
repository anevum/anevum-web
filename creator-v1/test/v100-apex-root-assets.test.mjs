/** Verify the actual / apex build, not the independent /creator/ staging build.
 * A staging-base upload makes iPhone Safari show only "Skip to content".
 * Test-only. Does not change public app routing or ship to Cloudflare.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';

export function verifyApexRootAssets(directory){
  const root=resolve(directory);
  const html=readFileSync(join(root,'index.html'),'utf8');
  assert.match(html,/<div id="root"><\/div>/,'Canonical React mount missing');
  assert.match(html,/Skip to content/,'Accessible document shell missing');
  assert.doesNotMatch(html,/\/(?:creator|src)\/(?:assets\/)?(?:index|src\/main)/,'Staging-base or uncompiled script leaked');
  const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(x=>x[1]);
  const styles=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)].map(x=>x[1]);
  // Vite's output may put href before rel. Reject *any* misplaced compiled asset.
  const assets=[...html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css))"/g)].map(x=>x[1]);
  assert.ok(scripts.length>0,'No Vite executable script');
  assert.ok(styles.length>0,'No Vite stylesheet');
  assert.ok(assets.length>=2,'Expected CSS and JS assets');
  for(const url of assets){
    assert.match(url,/^\/assets\/[a-zA-Z0-9._/-]+\.(?:js|css)$/,'Compiled assets must be rooted at /assets/');
    assert.ok(!url.split('/').includes('..'),'Unsafe asset path');
    assert.ok(existsSync(join(root,url.slice(1))),'Compiled asset not found: '+url);
  }
  assert.ok(assets.some(x=>x.endsWith('.js')),'JavaScript asset missing');
  assert.ok(assets.some(x=>x.endsWith('.css')),'CSS asset missing');
  return {status:'APEX_ROOT_ASSETS_PASS',script:scripts[0],styles:styles.length,assets:assets.length};
}
function fixture(index,files){
  const folder=mkdtempSync(join(tmpdir(),'anevum-root-assets-'));
  writeFileSync(join(folder,'index.html'),index);
  for(const [path,bytes] of Object.entries(files||{})){
    const dest=join(folder,path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);
  }
  return folder;
}
const shell='<div id="root"></div><a href="#main">Skip to content</a>';
test('accept root /assets script, style and real files',()=>{
 const folder=fixture(shell+'<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script>',{'assets/app.js':'console.log(1)','assets/app.css':'body{}'});
 try{assert.equal(verifyApexRootAssets(folder).status,'APEX_ROOT_ASSETS_PASS');}
 finally{rmSync(folder,{recursive:true,force:true});}
});
test('reject staging /creator/assets build even when its assets happen to exist',()=>{
 const folder=fixture(shell+'<link rel="stylesheet" href="/creator/assets/app.css"><script type="module" src="/creator/assets/app.js"></script>',{'creator/assets/app.js':'console.log(1)','creator/assets/app.css':'body{}'});
 try{assert.throws(()=>verifyApexRootAssets(folder),/rooted at \/assets\//);}
 finally{rmSync(folder,{recursive:true,force:true});}
});
test('reject missing JavaScript module while preserving document shell',()=>{
 const folder=fixture(shell+'<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/missing.js"></script>',{'assets/app.css':'body{}'});
 try{assert.throws(()=>verifyApexRootAssets(folder),/Compiled asset not found/);}
 finally{rmSync(folder,{recursive:true,force:true});}
});
if(process.argv[1]&&process.argv[2]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const folder=process.argv[2];
 console.log(JSON.stringify(verifyApexRootAssets(folder)));
}
