import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function withServer(fn, extra=[]) {
 const child=spawn(process.execPath,['server.mjs',...extra,'--port','0','--minutes','1'],{cwd:root,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',chunk=>stdout+=chunk);
 child.stderr.on('data',chunk=>stderr+=chunk);
 try{
  const start=Date.now();let port;
  while(Date.now()-start<8000) {
   const match=/PORT=(\d+)/.exec(stdout);
   if(match){port=Number(match[1]);break}
   if(child.exitCode!==null)throw Error('Server exited: '+stderr);
   await new Promise(done=>setTimeout(done,30));
  }
  assert.ok(port,'Server failed to open: '+stderr);
  return await fn('http://127.0.0.1:'+port);
 } finally {child.kill('SIGTERM')}
}
test('serves only fictional HTML with no-store, restrictive CSP, and no device permissions',async()=>{
 await withServer(async base=>{
  const response=await fetch(base+'/');
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);
  assert.match(response.headers.get('content-security-policy'),/form-action 'none'/);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.match(response.headers.get('permissions-policy'),/geolocation=\(\)/);
  const body=await response.text();
  assert.match(body,/NO LIVE HOUSEHOLDS/);
  assert.match(body,/FICTIONAL OFFLINE REVIEW/);
  assert.doesNotMatch(body,/<script[^>]+src=/i);
  assert.doesNotMatch(body,/<link[^>]+rel=['"]stylesheet/i);
  assert.match(body,/window\.fetch = async/);
 });
});
test('rejects writes, missing routes and DNS-rebinding host headers',async()=>{
 await withServer(async base=>{
  let res=await fetch(base+'/api/v1/porchlight/events',{method:'POST',body:'{}'});
  assert.equal(res.status,405);
  res=await fetch(base+'/api/v1/porchlight/events');assert.equal(res.status,404);
  res=await fetch(base+'/organizer.html');assert.equal(res.status,404);
  const u=new URL(base);
  const status=await new Promise((yes,no)=>{
    const req=http.request({hostname:u.hostname,port:u.port,path:'/',headers:{host:'untrusted.invalid'}},r=>{
      r.resume();r.on('end',()=>yes(r.statusCode));
    });
    req.on('error',no);req.end();
  });
  assert.equal(status,421);
  const health=await fetch(base+'/health');
  assert.equal(health.status,200);
  assert.deepEqual(await health.json(),{ok:true,fictional:true,cloud:false,realHomes:false,storage:false});
 });
});
test('HEAD and GET are safe without persistent state',async()=>{
 await withServer(async base=>{
  const head=await fetch(base+'/',{method:'HEAD'});
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
  const html=await (await fetch(base+'/index.html')).text();
  assert.match(html,/NO EXTERNAL CONNECTION/);
 });
});
test('LAN opt-in does not enable writes, staff login, remote APIs, or GPS',async()=>{
 await withServer(async base=>{
  const html=await (await fetch(base+'/')).text();
  assert.match(html,/FICTIONAL OFFLINE REVIEW/);
  assert.doesNotMatch(html,/navigator\.geolocation|localStorage|sessionStorage|serviceWorker\.register/i);
  assert.equal((await fetch(base+'/api/v1/porchlight/events',{method:'POST',body:'{}'})).status,405);
  assert.equal((await fetch(base+'/organizer.html')).status,404);
 },['--lan']);
});
