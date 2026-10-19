// Synthetic-only Chrome acceptance for Cloudflare Access Lab preview.
// Loopback Node server proxies the source Worker without creating production routes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import lab from './worker.mjs';
const root=resolve('test-artifacts/lab-previews');
const chrome=process.env.CHROME_BIN||['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .find(bin=>spawnSync('which',[bin],{stdio:'ignore'}).status===0);
assert.ok(chrome,'Chromium is required for preview UX acceptance');
await mkdir(root,{recursive:true});
const qaScript=`(()=>{
 const scene=new URLSearchParams(location.search).get('scene')||'wayfinder';
 const expect=(ok,label)=>{if(!ok)throw Error(label);};
 const run=()=>{
  document.querySelector('[data-scene="'+scene+'"]').click();
  const panel=document.getElementById('preview-content');
  expect(panel.dataset.previewState===scene,'preview did not load scene');
  if(scene==='wayfinder'){
   document.querySelector('[data-gateway="CONNECT"]').click();
   expect(document.getElementById('gateway-result').textContent.includes('CONNECT'),'gateway navigation broken');
  }
  if(scene==='identity'){
   document.querySelector('[data-aura="moderator"]').click();
   document.getElementById('sample-xp').click();
   expect(document.getElementById('role-label').textContent.includes('MODERATOR'),'aura not updated');
   expect(document.getElementById('xp-value').textContent==='1450','sample XP not updated');
  }
  if(scene==='iren'){
   document.getElementById('guide-next').click();
   document.getElementById('guide-next').click();
   expect(document.querySelectorAll('.guide-target.spotlight').length===1,'spotlight target broken');
   document.getElementById('guide-close').click();
   expect(document.getElementById('iren-guide').hidden,'dismiss did not close');
   document.getElementById('guide-restart').click();
   expect(!document.getElementById('iren-guide').hidden,'guide restart broken');
  }
  if(scene==='staff'){
   document.querySelector('[data-review="1"]').click();
   document.getElementById('review-approve').click();
   expect(document.getElementById('review-state').textContent.includes('SIMULATED'),'sample moderation broken');
  }
  if(scene==='registration'){
   document.getElementById('auth-next').click();
   document.getElementById('auth-next').click();
   expect(document.getElementById('auth-title').textContent.includes('Welcome'),'registration simulation progression broken');
   document.getElementById('auth-reset').click();
   expect(document.getElementById('auth-title').textContent.includes('Your story'),'registration reset broken');
  }
  document.body.dataset.previewQa='pass';
 };
 try{run();}catch(e){document.body.dataset.previewQa='fail';document.body.dataset.previewError=String(e).slice(0,180);}
})();`;
const http=createServer(async(req,res)=>{
 try{
  const target=new URL(req.url,'http://127.0.0.1');
  if(target.pathname==='/previews/__qa.js'){
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}).end(qaScript);
   return;
  }
  const upstream=await lab.fetch(new Request('https://lab.anevum.com'+target.pathname+target.search,{method:req.method}));
  const headers=Object.fromEntries(upstream.headers);
  let body=await upstream.text();
  if((headers['content-type']||'').includes('text/html')){
   body=body.replace('</body>','<script defer src="/previews/__qa.js"></script></body>');
  }
  res.writeHead(upstream.status,headers);
  res.end(req.method==='HEAD'?'':body);
 }catch(e){res.writeHead(500,{'content-type':'text/plain'}).end('Local preview fixture failed');}
});
await new Promise((resolve,reject)=>{http.once('error',reject);http.listen(0,'127.0.0.1',resolve);});
async function capture(scene,width,height){
 const profile=await mkdtemp(join(tmpdir(),'anevum-preview-'));
 const dest=join(root,scene+'-'+width+'.png');
 try{
  const url='http://127.0.0.1:'+http.address().port+'/previews/?scene='+scene;
  const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
   '--disable-background-networking','--no-first-run','--no-default-browser-check',
   '--force-device-scale-factor=1','--user-data-dir='+profile,
   '--window-size='+width+','+height,'--virtual-time-budget=3000','--screenshot='+dest,'--dump-dom',url];
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
  let dom='',err='';
  child.stdout.on('data',b=>dom+=b.toString());
  child.stderr.on('data',b=>err+=b.toString());
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  assert.equal(code,0,'Chrome exit '+code+': '+err.slice(-1000));
  assert.match(dom,/data-preview-qa="pass"/,'Interaction failed for '+scene+' '+width+': '+(dom.match(/data-preview-error="([^"]+)"/)?.[1]||err.slice(-500)));
  assert.match(dom,new RegExp('data-preview-state="'+scene+'"'));
  console.log('PASS private Lab preview '+scene+' '+width+'x'+height);
 }finally{await rm(profile,{force:true,recursive:true,maxRetries:3});}
}
try{
 for(const scene of ['wayfinder','identity','iren','staff','registration']){
  await capture(scene,390,844);
  await capture(scene,1440,900);
 }
 await capture('registration',320,720);
 await capture('staff',320,720);
 console.log('ANEVUM Private Lab browser acceptance: 12 captures, all synthetic');
}finally{await new Promise(resolve=>http.close(resolve));}
