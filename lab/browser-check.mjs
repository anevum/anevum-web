// Headless Chromium private Lab preview smoke. Uses a local HTTP gateway
// to the same Worker module; does NOT expose any public domain or credentials.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import lab from './worker.mjs';
const root=resolve(fileURLToPath(new URL('./',import.meta.url)));
const out=resolve(root,'../test-artifacts/lab');
const chrome=process.env.FOLD_CHROME||['google-chrome','chromium','chromium-browser'].find(bin=>spawnSync('which',[bin],{stdio:'ignore'}).status===0);
assert.ok(chrome,'Chromium is required for Lab browser review');
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/__lab_browser_client.mjs'){
   const file=await import('node:fs/promises');
   const b=await file.readFile(join(root,'browser-check-client.mjs'),'utf8');
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'}).end(b);return;
  }
  const w=await lab.fetch(new Request('https://lab.anevum.com'+url.pathname+url.search,{method:req.method}));
  let body=await w.text(),headers=Object.fromEntries(w.headers);
  if((headers['content-type']||'').includes('text/html')){
   body=body.replace('</body>','<script type="module" src="/__lab_browser_client.mjs"></script></body>');
   // This test intentionally injects one same-origin module, which is allowed by CSP.
  }
  headers['content-length']=String(Buffer.byteLength(body));
  res.writeHead(w.status,headers);res.end(req.method==='HEAD'?'':body);
 }catch(err){res.writeHead(500).end(String(err));}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
async function screenshot(path,width,height,label){
 const profile=await mkdtemp(join(tmpdir(),'anevum-lab-test-'));
 try{
  const url='http://127.0.0.1:'+server.address().port+path;
  const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--force-device-scale-factor=1','--user-data-dir='+profile,'--window-size='+width+','+height,'--virtual-time-budget=4500','--screenshot='+join(out,label+'-'+width+'x'+height+'.png'),'--dump-dom',url];
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
  let dom='',errors='';
  child.stdout.on('data',x=>dom+=x.toString());
  child.stderr.on('data',x=>errors+=x.toString());
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  assert.equal(code,0,'Chrome exit '+code+' '+errors.slice(-1000));
  const match=dom.match(/data-lab-smoke-error="([^"]+)"/);
  assert.ok(dom.includes('data-lab-smoke="pass"'),label+' at '+width+'x'+height+' failed: '+(match?.[1]||'no pass marker')+' '+errors.slice(-450));
  console.log('PASS Lab '+label+' '+width+'x'+height);
 }finally{await rm(profile,{recursive:true,force:true,maxRetries:3});}
}
try{
 for(const [path,w,h,name] of [
  ['/',390,844,'hub'],['/',1440,900,'hub'],
  ['/projects/the-fold/',390,844,'fold'],['/projects/the-fold/',1440,900,'fold'],
  ['/projects/rhen/',390,844,'rhen'],['/projects/rhen/',1440,900,'rhen'],
  ['/projects/rhen/?scenario=cost-lens',390,844,'rhen-cost-lens'],
  ['/projects/transcosmic',390,844,'transcosmic']
 ])await screenshot(path,w,h,name);
 console.log('All nine Lab Chromium browser states passed');
}finally{await new Promise(resolve=>server.close(resolve));}
