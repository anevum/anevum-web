// ANEVUM Native Player V001 -- real Chromium loopback acceptance.
// Synthetic package bytes and the built frontend only. No live member, R2, D1,
// Cloudflare origin, public upload, web socket to a creator server, or credentials.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync,statSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,extname,sep} from 'node:path';
import {createNativePack} from '../web/src/lib/anevum-native-pack.ts';

const argv=process.argv.slice(2);
const option=name=>{const i=argv.indexOf(name);return i<0?null:argv[i+1];};
const chrome=option('--chrome'),out=option('--output');
if(!chrome||!out)throw Error('Provide --chrome and --output');
const dist=resolve('creator-v1/dist/web');
assert.ok(existsSync(join(dist,'index.html')),'Build Creator V1 web before browser acceptance');
mkdirSync(out,{recursive:true});

const temp=mkdtempSync(join(tmpdir(),'anevum-native-player-'));
const profile=join(temp,'chrome');
const image=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ekAAAAASUVORK5CYII=','base64'));
const gameDoc={schema:'anevum.game.v1',startScene:'arrival',scenes:[
 {id:'arrival',title:'The First Observatory',text:'A transcosmic passage opens.',background:'assets/orbit.png',
  choices:[{label:'Enter the signal',to:'signal'}]},
 {id:'signal',title:'Beyond the Aperture',text:'The corridor gives way to the Continuance Institute.',
  choices:[{label:'Return to the observatory',to:'arrival'}]}
]};
const game=await createNativePack({kind:'game',title:'The First Signal',creator:'Synthetic Creator',
 version:'0.1.0',document:gameDoc,assets:{'assets/orbit.png':image}});
const goodPath=join(temp,game.filename);
writeFileSync(goodPath,Buffer.from(game.bytes));
const brokenPath=join(temp,'tampered.anvg');
const broken=new Uint8Array(game.bytes.length+1);
broken.set(game.bytes);
writeFileSync(brokenPath,Buffer.from(broken));
const wav=new Uint8Array(16);
wav.set([82,73,70,70,8,0,0,0,87,65,86,69,102,109,116,32]);
const album=await createNativePack({kind:'album',title:'Signals Vol. 1',creator:'Synthetic Creator',
 version:'0.1.0',document:{schema:'anevum.album.v1',tracks:[
  {id:'signal-one',title:'First Transmission',file:'assets/signal.wav'}
 ]},assets:{'assets/signal.wav':wav}});
const albumPath=join(temp,album.filename);
writeFileSync(albumPath,Buffer.from(album.bytes));

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml',
 '.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon',
 '.json':'application/json'};
const trace=[];
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url||'/','http://127.0.0.1');
  trace.push({method:req.method,path:url.pathname});
  if(req.method!=='GET'&&req.method!=='HEAD'){
   res.statusCode=405;res.end('Method denied in native player fixture');return;
  }
  if(url.pathname.startsWith('/api/')){
   res.statusCode=404;res.setHeader('content-type','application/json');
   res.end('{"error":"synthetic offline only"}');return;
  }
  const candidate=resolve(dist,'.'+decodeURIComponent(url.pathname));
  const safe=candidate.startsWith(dist+sep)&&existsSync(candidate)&&statSync(candidate).isFile();
  const path=safe?candidate:join(dist,'index.html');
  res.setHeader('content-type',mime[extname(path)]||'application/octet-stream');
  res.setHeader('cache-control','no-store');
  if(req.method==='HEAD'){res.end();return;}
  res.end(readFileSync(path));
 }catch(e){console.error('NATIVE_FIXTURE_ERROR='+String(e));res.statusCode=500;res.end('Fixture failed');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--no-first-run','--remote-allow-origins=*',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=25000){
 const end=Date.now()+timeout;
 while(Date.now()<end){
  try{const result=await fn();if(result)return result;}catch{}
  await pause(125);
 }
 throw Error('NATIVE_PLAYER_BROWSER_TIMEOUT');
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url);
  const pending=new Map();let id=0;
  socket.addEventListener('open',()=>resolve({
   send(method,params={}){
    const key=++id;return new Promise((accept,fail)=>{
     pending.set(key,{accept,fail});socket.send(JSON.stringify({id:key,method,params}));
    });
   },close(){socket.close();}
  }),{once:true});
  socket.addEventListener('message',event=>{
   const response=JSON.parse(String(event.data));
   const p=pending.get(response.id);if(!p)return;
   pending.delete(response.id);
   response.error?p.fail(Error(response.error.message)):p.accept(response.result||{});
  });
  socket.addEventListener('error',()=>reject(Error('CDP connection failed')),{once:true});
 });
}
let c=null;
const acceptance={fixture:'offline synthetic',route:'/open',tests:[],screenshots:[],
 userUploadRequests:0,backgroundMediaLoaded:false};
try{
 const port=await until(()=>{
  const path=join(profile,'DevToolsActivePort');
  return existsSync(path)?readFileSync(path,'utf8').split('\n')[0]:null;
 });
 const socket=await until(async()=>{
  const pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return pages.find(x=>x.type==='page')?.webSocketDebuggerUrl;
 });
 c=await connect(socket);
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('DOM.enable');
 async function evaluate(expression){
  const r=await c.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Chrome evaluation failed');
  return r.result?.value;
 }
 async function navigate(path){
  await c.send('Page.navigate',{url:base+path});
  await until(()=>evaluate("document.readyState==='complete'"));
 }
 async function pick(path){
  const {root}=await c.send('DOM.getDocument',{depth:1});
  const result=await c.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#np-local-package'});
  assert.ok(result.nodeId,'Missing native player file input');
  await c.send('DOM.setFileInputFiles',{nodeId:result.nodeId,files:[path]});
 }
 async function shot(name){
  await pause(220);
  const x=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  assert.ok(x.data,'No Chromium screenshot data');
  writeFileSync(join(out,name),Buffer.from(x.data,'base64'));
  acceptance.screenshots.push(name);
 }
 await navigate('/open');
 await until(()=>evaluate("Boolean(document.querySelector('#np-local-package')&&document.querySelector('.np-page-empty'))"));
 assert.match(String(await evaluate("document.querySelector('.np-page-header h1')?.textContent")),'OPEN A WORLD');
 acceptance.tests.push('Unauthenticated /open route boots from isolated web build');

 await pick(goodPath);
 await until(()=>evaluate("document.querySelector('.np-page-loaded h2')?.textContent==='The First Signal'"));
 let stage=await evaluate("({scene:document.querySelector('.np-game h4')?.textContent,background:document.querySelector('.np-game img')?.complete,choices:document.querySelectorAll('.np-game .np-choices button').length})");
 assert.equal(stage.scene,'The First Observatory');assert.equal(stage.choices,1);
 acceptance.backgroundMediaLoaded=Boolean(stage.background);
 await evaluate("document.querySelector('.np-game .np-choices button').click()");
 await until(()=>evaluate("document.querySelector('.np-game h4')?.textContent==='Beyond the Aperture'"));
 await evaluate("document.querySelector('.np-game .np-restart').click()");
 await until(()=>evaluate("document.querySelector('.np-game h4')?.textContent==='The First Observatory'"));
 acceptance.tests.push('Validated ANVG with bundled artwork: open, branch, and restart');

 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await pause(140);
  const layout=await evaluate("(()=>{const p=document.querySelector('.np-page');const x=p.getBoundingClientRect();return {pageLeft:x.left,pageRight:x.right,pageOverflow:p.scrollWidth>p.clientWidth+2,documentOverflow:document.documentElement.scrollWidth>innerWidth+2,width:innerWidth,loaded:!!document.querySelector('.np-game')}})()");
  assert.equal(layout.documentOverflow,false,JSON.stringify(layout));
  assert.equal(layout.pageOverflow,false,JSON.stringify(layout));
  assert.ok(layout.pageLeft>=-2&&layout.pageRight<=width+3,JSON.stringify(layout));
  await evaluate("document.querySelector('.np-page-player').scrollIntoView({block:'start'})");
  await shot('native-player-'+width+'.png');
  acceptance.tests.push('Responsive native player at '+width+'px without horizontal overflow');
 }
 await c.send('Emulation.clearDeviceMetricsOverride');
 await pick(brokenPath);
 await until(()=>evaluate("Boolean(document.querySelector('.np-page-error'))"));
 assert.match(String(await evaluate("document.querySelector('.np-page-error')?.textContent")),/Invalid ANEVUM pack|archive|ZIP/i);
 acceptance.tests.push('Rejects tampered ZIP without running creator code');

 await pick(albumPath);
 await until(()=>evaluate("document.querySelector('.np-page-loaded h2')?.textContent==='Signals Vol. 1'"));
 assert.equal(await evaluate("document.querySelectorAll('.np-media-entry audio[controls]').length"),1);
 assert.ok((await evaluate("document.querySelector('.np-media-entry strong')?.textContent")).includes('First Transmission'));
 acceptance.tests.push('Validated ANVA opens track list with native audio control');
 await evaluate("document.querySelector('.np-page-clear').click()");
 await until(()=>evaluate("Boolean(document.querySelector('.np-page-empty'))"));
 acceptance.tests.push('Close clears player and returns to empty local stage');

 acceptance.userUploadRequests=trace.filter(x=>x.method!=='GET'&&x.method!=='HEAD').length;
 assert.equal(acceptance.userUploadRequests,0,'Local player must never POST/PUT a package');
 acceptance.tests.push('No POST, PUT or upload attempt against the offline server');
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(acceptance,null,2));
 console.log('ANEVUM_NATIVE_PLAYER_BROWSER=PASS; TESTS='+acceptance.tests.length+
  '; WIDTHS=1440,390,320; UPLOAD_REQUESTS=0');
}catch(e){
 console.error('ANEVUM_NATIVE_PLAYER_BROWSER=FAIL; '+String(e));
 throw e;
}finally{
 c?.close();browser.kill();
 await new Promise(resolve=>{
  if(browser.exitCode!==null||browser.signalCode!==null){resolve();return;}
  const timer=setTimeout(resolve,4000);
  browser.once('exit',()=>{clearTimeout(timer);resolve();});
 });
 await new Promise(resolve=>server.close(resolve));
 try{rmSync(temp,{recursive:true,force:true,maxRetries:20,retryDelay:180});}
 catch(err){console.warn('Chrome fixture cleanup deferred: '+String(err));}
}
