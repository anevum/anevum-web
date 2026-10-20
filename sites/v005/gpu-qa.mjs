// Dependency-free Chrome DevTools Protocol GPU QA.
// Reports unsupported WebGL2 separately from shader compilation failure.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=process.env.CHROME || 'google-chrome';
const source=resolve(process.argv[2]||'sites/v005/shader-check.html');
const output=resolve(process.argv[3]||'/tmp/sites-v005/gpu-qa.png');
const profile=await mkdtemp(resolve(tmpdir(),'anevum-gpu-'));
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-features=Vulkan','--remote-debugging-port=0','--window-size=1152,720','--no-first-run','--hide-scrollbars',`--user-data-dir=${profile}`,pathToFileURL(source).href];
const proc=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
let stderr='';proc.stderr.on('data',c=>{stderr+=c.toString();if(stderr.length>30000)stderr=stderr.slice(-30000);});
let ws;
try {
  let port;
  for(let attempt=0;attempt<80;attempt++){if(proc.exitCode!==null)throw Error('Chrome exited early');try{const data=await readFile(resolve(profile,'DevToolsActivePort'),'utf8');port=Number(data.split('\n')[0]);if(port)break;}catch{}await wait(200);}
  if(!port)throw Error('Chrome debug port unavailable: '+stderr.slice(-1500));
  let tab;
  for(let i=0;i<30;i++){const res=await fetch(`http://127.0.0.1:${port}/json/list`);const tabs=await res.json();tab=tabs.find(t=>t.type==='page');if(tab)break;await wait(250);}
  if(!tab)throw Error('Chrome page target unavailable');
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  const callbacks=new Map(),events=[];let next=1;
  ws.addEventListener('message',ev=>{const d=JSON.parse(String(ev.data));if(d.id&&callbacks.has(d.id)){callbacks.get(d.id)(d);callbacks.delete(d.id);}else if(d.method==='Runtime.exceptionThrown'||d.method==='Runtime.consoleAPICalled'){events.push(d);}});
  await new Promise((ok,err)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',err,{once:true});});
  function call(method,params={}){const id=next++;return new Promise((ok,err)=>{const t=setTimeout(()=>{callbacks.delete(id);err(Error(`CDP timeout: ${method}`));},12000);callbacks.set(id,res=>{clearTimeout(t);res.error?err(Error(JSON.stringify(res.error))):ok(res.result);});ws.send(JSON.stringify({id,method,params}));});}
  await call('Runtime.enable');await call('Page.enable');
  let status='WAITING';for(let i=0;i<60;i++){const r=await call('Runtime.evaluate',{expression:"String(window.__ANE_GPU_QA||'WAITING')",returnByValue:true});status=r.result?.value||'WAITING';if(status!=='WAITING')break;await wait(350);}
  await wait(status==='RENDERER_READY'?1900:350);
  const img=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile(output,Buffer.from(img.data,'base64'));
  const report={status,screenshot:output,exceptions:events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails?.text||'exception'),messages:events.filter(e=>e.method==='Runtime.consoleAPICalled').map(e=>e.params.args?.map(a=>a.value||a.description).join(' ')).slice(-8)};
  await writeFile(output.replace(/\.png$/,'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  if(status.startsWith('SHADER_COMPILE_FAILED')||status.startsWith('ERROR:'))process.exitCode=1;
  if(status==='NO_WEBGL2')console.warn('WebGL2 unavailable on CI renderer. Physical-device GPU verification remains mandatory.');
} finally {
  if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
  proc.kill('SIGTERM');
  await wait(150);
  await rm(profile,{recursive:true,force:true}).catch(()=>{});
}