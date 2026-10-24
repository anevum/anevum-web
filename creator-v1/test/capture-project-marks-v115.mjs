// Real compiled React V115 browser acceptance, test-only synthetic identity/SQL.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1],chrome=arg('--chrome');
const output=resolve(arg('--output')||'evidence/creator-project-marks-v115');
assert.ok(chrome,'Chromium path required');mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4178',id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const link='/creator/connect/marks?project='+id+'&state='+'a'.repeat(48);
const pause=n=>new Promise(done=>setTimeout(done,n));
async function until(fn,label,ms=20000){
 const end=Date.now()+ms;let error;
 while(Date.now()<end){try{const v=await fn();if(v)return v;}catch(e){error=e;}await pause(120);}
 throw Error(label+' timeout'+(error?' '+error.message:''));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-v115-mark-ui-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage',
 '--disable-background-networking','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',socket,seq=0;const pending=new Map(),events=new Map(),errors=[],requests=[];
child.stderr.on('data',b=>stderr+=String(b));
async function send(method,params={}){
 return new Promise((ok,no)=>{
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);no(Error('CDP '+method+' timed out'));},30000);
  pending.set(id,{ok,no,timer});socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
 if(x.exceptionDetails)throw Error(x.exceptionDetails.exception?.description||x.exceptionDetails.text);
 return x.result?.value;
}
const has=selector=>evalJS('!!document.querySelector('+JSON.stringify(selector)+')');
const txt=selector=>evalJS('document.querySelector('+JSON.stringify(selector)+')?.textContent||""');
async function navigate(path){
 await send('Page.navigate',{url:base+path});
 await until(()=>evalJS('document.readyState==="complete"'),'Page');
}
async function size(width){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?900:width===390?844:720,
  deviceScaleFactor:2,mobile:width<600});await pause(180);
 const rect=await evalJS('(()=>({viewport:window.innerWidth,document:document.documentElement.scrollWidth,root:document.querySelector(".pm-connect")?.scrollWidth,client:document.querySelector(".pm-connect")?.clientWidth}))()');
 assert.ok(rect.document<=rect.viewport+1,'Horizontal document overflow at '+width+': '+JSON.stringify(rect));
 assert.ok(rect.root<=rect.client+1,'Consent screen overflow '+width+': '+JSON.stringify(rect));
 const screenshot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 writeFileSync(join(output,'consent-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
 return rect;
}
try{
 await until(async()=>{try{const r=await fetch(base+'/__ready');return r.ok&&(await r.json()).ready;}catch{return false;}},'Compiled fixture ready');
 const port=await until(()=>{const p=join(profile,'DevToolsActivePort');return existsSync(p)?readFileSync(p,'utf8').split('\n')[0]:null;},'Chrome DevTools port',60000);
 const target=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);},'Chrome page');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
 socket.addEventListener('message',e=>{
  const m=JSON.parse(String(e.data));
  if(m.id){const p=pending.get(m.id);if(!p)return;clearTimeout(p.timer);pending.delete(m.id);m.error?p.no(Error(m.error.message)):p.ok(m.result||{});}
  else events.get(m.method)?.(m.params);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 events.set('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'Unknown JavaScript error'));
 events.set('Network.requestWillBeSent',e=>requests.push({url:e.request?.url||'',method:e.request?.method||''}));
 await send('Network.setCookie',{url:base,name:'anevum_offline_visual_fixture',value:'1',sameSite:'Strict'});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
 await navigate(link);
 await until(()=>has('.pm-connection-card'),'Published project + current member consent');
 assert.ok((await txt('.pm-connection-card h2')).includes('SYNTHETIC OBSERVATORY'));
 assert.ok((await txt('.pm-connection-card')).includes('creator-reported'));
 assert.equal(await has('.pm-actions button'),true,'Explicit choice required');
 const desktop=await size(1440),phone=await size(390),small=await size(320);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await navigate('/creator/member');
 await until(()=>has('.pm-member'),'Private profile mark cabinet',30000);
 await until(()=>has('.pm-mark'),'Earned server-seeded private project mark');
 assert.ok((await txt('.pm-member')).includes('Hidden Observatory'));
 await evalJS('document.querySelector(".pm-member").scrollIntoView({block:"start"})');await pause(200);
 const m=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 writeFileSync(join(output,'private-member-320.png'),Buffer.from(m.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
 await navigate('/creator/@v091_public');
 await until(()=>has('.pm-public .pm-mark'),'Only expressly curated mark displayed on public profile',30000);
 assert.ok((await txt('.pm-public')).includes('Hidden Observatory'));
 await evalJS('document.querySelector(".pm-public").scrollIntoView({block:"start"})');await pause(200);
 const publicShot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 writeFileSync(join(output,'public-profile-1440.png'),Buffer.from(publicShot.data,'base64'));
 // A fresh anonymous browser context must have no retained cookie, cached
 // Better Auth state or session-storage. Test the true isolated guest journey,
 // not merely a cookie value mutated in an authenticated React process.
 await send('Network.clearBrowserCookies');
 await send('Storage.clearDataForOrigin',{origin:base,storageTypes:'all'});
 const cookies=await send('Network.getCookies',{urls:[base]});
 assert.equal(cookies.cookies.some(x=>x.name==='anevum_offline_visual_fixture'),false,'Synthetic member cookie cleared');
 assert.equal((await fetch(base+'/api/v1/member/marks')).status,401,'Guest cannot read the private mark API');
 await navigate(link);
 try{
  await until(()=>txt('.pm-connection-card').then(x=>x.includes('Sign in to your ANEVUM account')),'Guest consent denial');
 }catch(error){
  const diagnostic={url:await evalJS('location.href'),body:(await txt('body')).slice(0,1800),
   memberCookie:await evalJS('document.cookie')};
  const capture=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  writeFileSync(join(output,'guest-debug.png'),Buffer.from(capture.data,'base64'));
  writeFileSync(join(output,'guest-debug.json'),JSON.stringify(diagnostic,null,2));
  throw new Error(String(error)+' / '+JSON.stringify(diagnostic));
 }
 assert.equal(await has('.pm-actions button'),false,'Guest cannot approve connection');
 assert.equal(requests.filter(x=>x.method!=='GET'&&/\/api\/v1\/marks|\/api\/v1\/member\/marks/.test(x.url)).length,0,'No live publisher/event mutation');
 assert.deepEqual(errors,[],'No React errors');
 const result={status:'PASS',syntheticOnly:true,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  widths:[desktop,phone,small],memberCabinet:true,publicCuratedProfile:true,guestNoConsent:true,
  fullBackendIssuerE2E:false,platformXpIssued:0,exceptions:0};
 writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){
 writeFileSync(join(output,'error.txt'),String(error)+'\n'+errors.join('\n')+'\n'+stderr.slice(-4500));throw error;
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.timer);socket.close();}
 if(child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await Promise.race([exited,pause(2000)]);if(child.exitCode===null)child.kill('SIGKILL');}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:140});}catch(e){console.warn('Temporary Chromium cleanup deferred: '+e);}
}
