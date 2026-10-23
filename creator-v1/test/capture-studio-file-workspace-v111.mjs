/** Synthetic browser acceptance for a default-OFF private Creator Studio text-file editor.
 * Real member/API acceptance is deliberately NOT claimed. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1];
const chrome=arg('--chrome'),output=resolve(arg('--output')||'evidence/studio-v111');
assert.ok(chrome,'Chromium binary required');
mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4178',memberId='00000000000000000000000000000099';
const seedId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',createdId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const fileNodes=new Map(),fileVersions=new Map(),filePosts=[],filePatches=[];
const folderId='cccccccc-cccc-4ccc-8ccc-ccccccccccc1',sourceId='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const now=1792700000,identity={id:seedId,title:'Signal Atlas',summary:'Private synthetic project for V110 browser verification.',
 slug:'signal-atlas',description:'An offline test record.',category:'games',status:'draft',revision:1,
 freeToUse:true,license:'',sourceUrl:null,demoUrl:null,aiDisclosure:'',humanContribution:'',
 createdAt:now,updatedAt:now,submittedAt:null};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(f,label,ms=20000){
 const end=Date.now()+ms;let last;
 while(Date.now()<end){try{const v=await f();if(v)return v;}catch(e){last=e;}await pause(100);}
 throw Error(label+' timed out'+(last?': '+last.message:''));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-studio-v111-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage',
 '--disable-background-networking','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeStderr='',socket,sequence=0;
const pending=new Map(),events=new Map(),failures=[],requests=[],posts=[];
child.stderr.on('data',data=>{chromeStderr+=String(data);});
async function send(method,params={}){
 return new Promise((ok,no)=>{
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);no(Error('CDP timeout '+method));},30000);
  pending.set(id,{ok,no,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
function jsonBody(data){return Buffer.from(JSON.stringify(data)).toString('base64');}
async function fulfill(requestId,data,status=200){
 await send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[
  {name:'content-type',value:'application/json; charset=utf-8'},
  {name:'cache-control',value:'no-store'}
 ],body:jsonBody(data)});
}
try{
 await until(async()=>{try{const r=await fetch(base+'/__ready');return r.ok&&(await r.json()).ready;}catch{return false;}},'Compiled preview');
 const port=await until(()=>{const p=join(profile,'DevToolsActivePort');return existsSync(p)?readFileSync(p,'utf8').split('\n')[0]:null;},'Chromium startup',60000);
 const target=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);},'Chrome target');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
 socket.addEventListener('message',event=>{
  const msg=JSON.parse(String(event.data));
  if(msg.id){const p=pending.get(msg.id);if(!p)return;clearTimeout(p.timer);pending.delete(msg.id);
   msg.error?p.no(Error(msg.error.message)):p.ok(msg.result||{});}
  else events.get(msg.method)?.(msg.params);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 events.set('Runtime.exceptionThrown',e=>{failures.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'JavaScript exception');});
 events.set('Network.requestWillBeSent',e=>requests.push(e.request?.url||''));
 await send('Network.setCookie',{url:base,name:'anevum_offline_visual_fixture',value:'1',sameSite:'Strict'});
 events.set('Fetch.requestPaused',async e=>{
  try{
   const u=new URL(e.request.url),method=e.request.method;
   const fileRoute=u.pathname.match(/^\/api\/v1\/member\/studio\/projects\/([0-9a-f-]{36})\/files(?:\/([0-9a-f-]{36})(?:\/(versions))?)?$/);
   if(fileRoute){
    const projectId=fileRoute[1],nodeId=fileRoute[2],sub=fileRoute[3];
    if(projectId!==seedId&&projectId!==createdId)return await fulfill(e.requestId,{error:'Not found'},404);
    if(!nodeId&&method==='GET'){
     const nodes=[...fileNodes.values()].filter(n=>n.projectId===projectId&&n.deletedAt===null).map(({content,...metadata})=>metadata);
     return await fulfill(e.requestId,{nodes,maxNodes:100,maxContentBytes:32768,maxProjectContentBytes:524288});
    }
    if(!nodeId&&method==='POST'){
     const input=JSON.parse(e.request.postData||'{}');filePosts.push(input);
     const id=input.kind==='folder'?folderId:sourceId;
     const node={id,projectId,parentId:input.parentId,name:input.name,kind:input.kind,
      revision:1,deletedAt:null,updatedAt:now,content:input.kind==='folder'?null:''};
     fileNodes.set(id,node);
     fileVersions.set(id,[{revision:1,name:node.name,parent_id:node.parentId,content:node.content||'',deleted_at:null,changed_at:now}]);
     return await fulfill(e.requestId,{node,replayed:false},201);
    }
    const old=fileNodes.get(nodeId);
    if(!old||old.projectId!==projectId)return await fulfill(e.requestId,{error:'Not found'},404);
    if(sub==='versions'&&method==='GET')return await fulfill(e.requestId,{versions:fileVersions.get(nodeId)||[]});
    if(!sub&&method==='GET')return await fulfill(e.requestId,{node:old});
    if(!sub&&method==='PATCH'){
     const input=JSON.parse(e.request.postData||'{}');filePatches.push(input);
     if(input.revision!==old.revision)return await fulfill(e.requestId,{error:'Revision changed'},409);
     const updated={...old,name:input.name,parentId:input.parentId,content:input.content,
      deletedAt:input.deleted?now:null,revision:old.revision+1,updatedAt:now+filePatches.length};
     fileNodes.set(nodeId,updated);
     fileVersions.set(nodeId,[{revision:updated.revision,name:updated.name,parent_id:updated.parentId,
      content:updated.content||'',deleted_at:updated.deletedAt,changed_at:updated.updatedAt},...fileVersions.get(nodeId)]);
     return await fulfill(e.requestId,{node:updated});
    }
    return await fulfill(e.requestId,{error:'Unsupported synthetic file request'},405);
   }
   if(u.pathname==='/api/v1/member/studio/projects'){
    if(method==='GET')return await fulfill(e.requestId,{projects:[identity],uploadsReady:false,canReview:false});
    if(method==='POST'){
     const input=JSON.parse(e.request.postData||'{}');
     posts.push(input);
     assert.equal(input.clientRequestId.length,36);
     assert.equal(input.draft.title,'Orbit Garden');
     assert.equal(input.draft.category,'games');
     return await fulfill(e.requestId,{project:{...input.draft,id:createdId,status:'draft',revision:1,
      createdAt:now+1,updatedAt:now+1,submittedAt:null},replayed:false},201);
    }
   }
   if(u.pathname==='/upload/v3/api/v1/packages/native/session')
    return await fulfill(e.requestId,{contract:'native-creator-v095',memberId,canUpload:false,canReview:false,resourceProtection:true});
   await send('Fetch.continueRequest',{requestId:e.requestId});
  }catch(error){failures.push('Fixture interception '+String(error));try{await send('Fetch.failRequest',{requestId:e.requestId,errorReason:'Failed'});}catch{}}
 });
 await send('Fetch.enable',{patterns:[
  {urlPattern:'*api/v1/member/studio/projects*',requestStage:'Request'},
  {urlPattern:'*upload/v3/api/v1/packages/native/session*',requestStage:'Request'}
 ]});
 async function evaluate(expression){
  const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
  if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text||'Evaluate failed');
  return reply.result?.value;
 }
 async function navigate(path){
  await send('Page.navigate',{url:base+'/creator'+path});
  await until(()=>evaluate('document.readyState==="complete"'),'Browser page load');
 }
 const visible=selector=>evaluate('!!document.querySelector('+JSON.stringify(selector)+')');
 const click=selector=>evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing click target");el.click();return true;})()');
 const setValue=(selector,value)=>evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing field");const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return el.value;})()');
 const setTextArea=(selector,value)=>evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing textarea");const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set;setter.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return el.value;})()');
 const snap=async name=>{
  const reply=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  assert.ok(reply.data);
  writeFileSync(join(output,name+'.png'),Buffer.from(reply.data,'base64'));
 };
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await navigate('/studio/workspace');
 await until(()=>visible('[data-creator-workspace="v109"]'),'Authenticated workspace');
 await until(()=>evaluate('document.body.textContent.includes("Signal Atlas")'),'Seed project record');
 await click('.csw-file');
 await until(()=>visible('[data-studio-file-tree="v111"]'),'Private source workspace');
 await until(()=>evaluate('document.querySelector(".csf-tree-body")?.textContent.includes("No files yet")'),'Empty server-authorized file tree');
 await click('.csf-tree-actions button[title="Create folder"]');
 await until(()=>visible('.csf-create input'),'Create folder form');
 assert.equal(await setValue('.csf-create input','Scenes'),'Scenes');
 await click('.csf-create button[type="submit"]');
 await until(()=>evaluate('document.querySelector(".csf-tree-body")?.textContent.includes("Scenes")'),'Folder appears');
 await click('.csf-tree-actions button[title="Create text source file"]');
 assert.equal(await setValue('.csf-create input','intro.md'),'intro.md');
 await click('.csf-create button[type="submit"]');
 await until(()=>visible('.csf-source'),'Actual private source editor');
 assert.equal(filePosts.length,2,'One folder and one text file created');
 assert.equal(filePosts[1].parentId,folderId,'Nested file has correct parent');
 assert.equal(await setTextArea('.csf-source','# First Signal\nA choice begins here.'),'# First Signal\nA choice begins here.');
 await until(()=>evaluate('document.querySelector(".csf-editor h3")?.textContent.includes("Unsaved")'),'File dirty state');
 await click('.csf-editor-title button.csw-strong');
 await until(()=>evaluate('document.querySelector(".csf-editor")?.textContent.includes("Saved private revision 2.")'),'Server-confirmed private save');
 assert.equal(filePatches.length,1,'Exactly one file save');
 assert.equal(fileNodes.get(sourceId).content,'# First Signal\nA choice begins here.');
 assert.equal(await evaluate('document.querySelectorAll(".csf-tab").length'),1);
 const historyOpened=await evaluate('(()=>{const b=[...document.querySelectorAll(".csf-editor-title button")].find(x=>x.textContent.includes("History"));if(!b)return false;b.click();return true;})()');
 assert.equal(historyOpened,true,'History action present');
 await until(()=>evaluate('document.querySelectorAll(".csf-history>div").length===2'),'Two real fixture revisions listed');
 await snap('desktop-private-file-saved');
 await setTextArea('.csf-source','# First Signal\nUnsaved workspace-local change.');
 await until(()=>evaluate('document.querySelector(".csf-editor h3")?.textContent.includes("Unsaved")'),'Second dirty state');
 await click('.csw-toolbar button.csw-strong');
 await until(()=>visible('dialog.csw-create-dialog[open]'),'New project starter modal');
 await click('.csw-starter input[value="story"]');
 assert.equal(await setValue('.csw-create-fields input','Orbit Garden'),'Orbit Garden');
 await click('.csw-create-dialog button[type="submit"]');
 await until(()=>evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-header h2")?.textContent==="Orbit Garden"'),'New project selected without closing prior file tab');
 assert.equal(posts.length,1,'Exactly one server-bound project creation');
 assert.equal(await evaluate('document.querySelectorAll(".csw-tab").length'),2,'Both project tabs preserved');
 const back=await evaluate('(()=>{const tab=[...document.querySelectorAll(".csw-tab button[role=tab]")].find(x=>x.textContent.includes("Signal Atlas"));if(!tab)return false;tab.click();return true;})()');
 assert.equal(back,true,'Original project tab exists');
 await until(()=>evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-source")?.value.includes("Unsaved workspace-local change.")'),'Unsaved draft survives project tab switch');
 await click('.csf-editor-title button.csw-strong');
 await until(()=>evaluate('document.querySelector(".csf-editor")?.textContent.includes("Saved private revision 3.")'),'Explicit save after switching tabs');
 assert.equal(filePatches.length,2,'Two explicit saves; switching tabs did not auto-save');
 const newTab=await evaluate('(()=>{const tab=[...document.querySelectorAll(".csw-tab button[role=tab]")].find(x=>x.textContent.includes("Orbit Garden"));if(!tab)return false;tab.click();return true;})()');
 assert.equal(newTab,true,'New project tab remains available');
 await until(()=>evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-header h2")?.textContent==="Orbit Garden"'),'New project reopened');
 const opened=await evaluate('(()=>{const b=[...document.querySelectorAll(".csw-toolbar button")].find(x=>x.textContent.includes("OpenAI Agent"));if(!b)return false;b.click();return true;})()');
 assert.equal(opened,true,'Opt-in Agent Dock is visible');
 await until(()=>visible('[data-agent-dock="v110-offline"]'),'Disconnected OpenAI dock');
 assert.ok(await evaluate('document.querySelector(".csw-agent").textContent.includes("OpenAI not connected")'));
 assert.ok(await evaluate('document.querySelector(".csw-agent").textContent.includes("Orbit Garden")'));
 assert.equal(await evaluate('document.querySelector(".csw-agent select").value'),'Builder');
 assert.ok(await evaluate('document.querySelector(".csw-agent textarea").value.length>0'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await pause(250);
 const mobile=await evaluate('(()=>{const c=document.querySelector(".csw-agent"),r=c.getBoundingClientRect();return {x:r.left,right:r.right,visible:getComputedStyle(c).display!=="none",editorHidden:getComputedStyle(document.querySelector(".csw-main")).display==="none",overflow:document.querySelector(".csw-root").scrollWidth>document.querySelector(".csw-root").clientWidth+2};})()');
 assert.equal(mobile.visible,true,'Mobile Agent Dock visible');
 assert.equal(mobile.editorHidden,true,'Mobile Agent Dock takes focus instead of squeezing editor');
 assert.equal(mobile.overflow,false,'Mobile Studio does not overflow');
 assert.ok(mobile.x>=-1&&mobile.right<=391,'Agent dock within mobile viewport');
 await snap('mobile-agent-dock-disconnected');
 await send('Network.deleteCookies',{url:base,name:'anevum_offline_visual_fixture'});
 await navigate('/studio/workspace');
 await until(()=>evaluate('document.body.textContent.includes("Sign in to open your workspace.")'),'Guest view denies private workspace');
 assert.equal(await visible('.csw-file'),false,'Guest sees no private file titles');
 assert.equal(requests.filter(u=>/api\.openai\.com|chatgpt\.com\/backend-api/i.test(u)).length,0,'No external AI provider calls');
 assert.equal(failures.length,0,'No synthetic browser runtime exceptions '+failures.join('; '));
 const result={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  status:'PASS',syntheticOnly:true,realMemberAcceptance:false,providerCalls:0,
  createdProject:createdId,createdRequests:posts.length,openedTabs:2,foldersCreated:1,sourceFilesCreated:1,sourceSaves:filePatches.length,mobile,guestDenied:true};
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}catch(error){
 writeFileSync(join(output,'error.txt'),String(error)+'\n'+failures.join('\n')+'\n'+chromeStderr.slice(-7000));
 throw error;
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.timer);socket.close();}
 // Chrome writes asynchronous profile journals; wait for process exit before
 // cleaning up. A filesystem housekeeping race must not reverse passed QA.
 if(child.exitCode===null){
  const exited=new Promise(resolve=>child.once('exit',resolve));
  child.kill('SIGTERM');
  await Promise.race([exited,pause(2000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
 }
 try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:120});}
 catch(error){console.warn('Chromium temporary profile cleanup is deferred:',String(error));}
}
