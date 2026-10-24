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
const folderId='cccccccc-cccc-4ccc-8ccc-ccccccccccc1',sourceId='dddddddd-dddd-4ddd-8ddd-dddddddddddd',source2Id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const now=1792700000,identity={id:seedId,title:'Signal Atlas',summary:'Private synthetic project for V110 browser verification.',
 slug:'signal-atlas',description:'An offline test record.',category:'games',status:'draft',revision:1,
 freeToUse:true,license:'',sourceUrl:null,demoUrl:null,aiDisclosure:'',humanContribution:'',
 createdAt:now,updatedAt:now,submittedAt:null};
const projectRecords=[identity];
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
let acceptNextConfirmation=false;
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
 events.set('Page.javascriptDialogOpening',dialog=>{
  const accept=dialog.type==='confirm'&&acceptNextConfirmation;
  acceptNextConfirmation=false;
  void send('Page.handleJavaScriptDialog',{accept}).catch(e=>failures.push('Dialog handling '+String(e)));
 });
 await send('Network.setCookie',{url:base,name:'anevum_offline_visual_fixture',value:'1',sameSite:'Strict'});
 events.set('Fetch.requestPaused',async e=>{
  try{
   const u=new URL(e.request.url),method=e.request.method;
   const fileRoute=u.pathname.match(/^\/api\/v1\/member\/studio\/projects\/([0-9a-f-]{36})\/files(?:\/(trash|[0-9a-f-]{36})(?:\/(versions|restore))?)?$/);
   if(fileRoute){
    const projectId=fileRoute[1],segment=fileRoute[2],nodeId=segment==='trash'?null:segment,sub=fileRoute[3];
    if(projectId!==seedId&&projectId!==createdId)return await fulfill(e.requestId,{error:'Not found'},404);
    if(segment==='trash'&&method==='GET'){
     const nodes=[...fileNodes.values()].filter(n=>n.projectId===projectId&&n.deletedAt!==null)
      .map(({content,...metadata})=>metadata);
     return await fulfill(e.requestId,{nodes,maxRetained:250});
    }
    if(!nodeId&&method==='GET'){
     const nodes=[...fileNodes.values()].filter(n=>n.projectId===projectId&&n.deletedAt===null).map(({content,...metadata})=>metadata);
     return await fulfill(e.requestId,{nodes,maxNodes:100,maxContentBytes:32768,maxProjectContentBytes:524288});
    }
    if(!nodeId&&method==='POST'){
     const input=JSON.parse(e.request.postData||'{}');filePosts.push(input);
     const id=input.kind==='folder'?folderId:fileNodes.has(sourceId)?source2Id:sourceId;
     const node={id,projectId,parentId:input.parentId,name:input.name,kind:input.kind,
      revision:1,deletedAt:null,updatedAt:now,content:input.kind==='folder'?null:''};
     fileNodes.set(id,node);
     fileVersions.set(id,[{revision:1,name:node.name,parent_id:node.parentId,content:node.content||'',deleted_at:null,changed_at:now}]);
     return await fulfill(e.requestId,{node,replayed:false},201);
    }
    const old=fileNodes.get(nodeId);
    if(!old||old.projectId!==projectId)return await fulfill(e.requestId,{error:'Not found'},404);
    if(sub==='versions'&&method==='GET')return await fulfill(e.requestId,{versions:fileVersions.get(nodeId)||[]});
    if(sub==='restore'&&method==='POST'){
     const input=JSON.parse(e.request.postData||'{}');
     if(old.deletedAt===null||old.revision!==input.revision)return await fulfill(e.requestId,{error:'Stale restore'},409);
     const parent=old.parentId?fileNodes.get(old.parentId):null;
     if(old.parentId&&(!parent||parent.deletedAt!==null||parent.kind!=='folder'))return await fulfill(e.requestId,{error:'Parent unavailable'},409);
     if([...fileNodes.values()].some(n=>n.id!==old.id&&n.deletedAt===null&&n.projectId===projectId&&n.parentId===old.parentId&&n.name.toLowerCase()===old.name.toLowerCase()))
      return await fulfill(e.requestId,{error:'Name conflict'},409);
     const restored={...old,deletedAt:null,revision:old.revision+1,updatedAt:now+filePatches.length+1};
     fileNodes.set(nodeId,restored);
     fileVersions.set(nodeId,[{revision:restored.revision,name:restored.name,parent_id:restored.parentId,content:restored.content||'',deleted_at:null,changed_at:restored.updatedAt},...fileVersions.get(nodeId)]);
     return await fulfill(e.requestId,{node:restored});
    }
    if(!sub&&method==='GET')return await fulfill(e.requestId,{node:old});
    if(!sub&&method==='PATCH'){
     const input=JSON.parse(e.request.postData||'{}');filePatches.push(input);
     if(input.revision!==old.revision||old.deletedAt!==null)return await fulfill(e.requestId,{error:'Revision changed'},409);
     if(input.deleted&&(input.content!==(old.content||'')||input.name!==old.name||input.parentId!==old.parentId))
      return await fulfill(e.requestId,{error:'Delete source mismatch'},422);
     if(input.deleted&&old.kind==='folder'&&[...fileNodes.values()].some(n=>n.parentId===nodeId&&n.deletedAt===null))
      return await fulfill(e.requestId,{error:'Folder not empty'},409);
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
    if(method==='GET')return await fulfill(e.requestId,{projects:projectRecords,uploadsReady:false,canReview:false});
    if(method==='POST'){
     const input=JSON.parse(e.request.postData||'{}');
     posts.push(input);
     assert.equal(input.clientRequestId.length,36);
     assert.equal(input.draft.title,'Orbit Garden');
     assert.equal(input.draft.category,'games');
     const project={...input.draft,id:createdId,status:'draft',revision:1,
      createdAt:now+1,updatedAt:now+1,submittedAt:null};
     projectRecords.push(project);
     return await fulfill(e.requestId,{project,replayed:false},201);
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
 try{
  await until(()=>evaluate('document.querySelector(".csf-tree-body")?.textContent.includes("No files yet")'),'Empty server-authorized file tree',7000);
 }catch(error){
  const state=await evaluate('(()=>({workspace:document.querySelector(".csw-work")?.textContent.slice(0,1400),tree:document.querySelector(".csf-tree")?.textContent.slice(0,1200),error:document.querySelector(".csf-error")?.textContent,loading:document.querySelector(".csf-tree-body [role=status]")?.textContent,host:document.querySelector(".csw-file-host:not([hidden])")?.innerHTML.slice(0,900)}))()');
  const evidence={state,requests:requests.filter(url=>url.includes('/studio/')),fileNodes:fileNodes.size};
  console.error('W111_EMPTY_TREE_DIAGNOSTICS',JSON.stringify(evidence));
  writeFileSync(join(output,'empty-tree-debug.json'),JSON.stringify(evidence,null,2));
  throw error;
 }
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
 await until(()=>evaluate('document.querySelector(".csf-status")?.textContent.includes("0 UNSAVED CHANGES")'),'Source save finalized before navigation');
 await navigate('/studio/workspace');
 await until(()=>evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-header h2")?.textContent==="Signal Atlas"'),'Original project restored after full browser reload');
 await until(()=>evaluate('document.querySelector(".csf-tree-body")?.textContent.includes("intro.md")'),'Folder tree persisted after browser reload');
 await click('.csf-tree-row[title="Scenes / intro.md"]');
 await until(()=>evaluate('document.querySelector(".csf-source")?.value==="# First Signal\\nUnsaved workspace-local change."'),'Saved source reopened from verified server snapshot');
 assert.equal(filePatches.length,2,'Browser reload does not silently write changes');
 await snap('desktop-private-source-reopened');
 // V120: Quick Open uses only existing authorized file metadata.
 await click('.csw-file-host:not([hidden]) .csf-quick-open');
 await until(()=>visible('[data-studio-command-palette="v120"]'),'Private Quick Open');
 assert.equal(await setValue('.csp-inputbar input','intro'),'intro');
 await until(()=>evaluate('document.querySelector(".csp-result")?.textContent.includes("intro.md")'),'Existing authorized file appears in Quick Open');
 assert.equal(await evaluate('document.querySelector(".csp-result small")?.textContent.includes("Scenes")'),true,'Quick Open shows authorized folder path');
 await snap('desktop-private-quick-open-v120');
 await click('.csp-result:first-child');
 await until(()=>evaluate('!document.querySelector(".csp-modal")'),'Quick Open closes after file selection');
 assert.equal(await evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-editor h3")?.textContent.includes("intro.md")'),true);
 assert.equal(filePatches.length,2,'Quick Open cannot mutate a revision');
 // Ctrl+Shift+P invokes only an allowlisted existing folder action.
 await evaluate('(()=>{window.dispatchEvent(new KeyboardEvent("keydown",{key:"p",ctrlKey:true,shiftKey:true,bubbles:true}));return true;})()');
 await until(()=>visible('[data-studio-command-palette="v120"]'),'Keyboard command palette');
 await until(()=>evaluate('document.querySelector(".csp-switch button:nth-child(2)")?.getAttribute("aria-pressed")==="true"'),'Command palette mode');
 assert.equal(await setValue('.csp-inputbar input','collapse'),'collapse');
 await until(()=>evaluate('document.querySelector(".csp-result")?.textContent.includes("Collapse all")'),'Allowed folder command');
 await click('.csp-result:first-child');
 await until(()=>evaluate('document.querySelector(".csf-tree-row[aria-expanded]")?.getAttribute("aria-expanded")==="false"'),'Collapse command');
 await click('.csf-tree-actions button[title="Expand all folders"]');
 await until(()=>evaluate('document.querySelector(".csf-tree-row[aria-expanded]")?.getAttribute("aria-expanded")==="true"'),'Expand after palette');
 assert.equal(filePatches.length,2,'Command navigation does not mutate revisions');
 acceptNextConfirmation=true;
 await click('.csf-editor-title .csw-danger');
 await until(()=>evaluate('document.querySelector(".csf-message")?.textContent.includes("Moved intro.md")'),'Saved source moved to private Trash');
 assert.ok(fileNodes.get(sourceId).deletedAt!==null,'Fixture confirms deletion as a tombstone');
 await click('.csf-trash-toggle');
 await until(()=>evaluate('document.querySelector(".csf-trash-item")?.textContent.includes("intro.md")'),'Trash shows deleted source metadata');
 await click('.csf-trash-item button[aria-label="Restore intro.md"]');
 await until(()=>evaluate('document.querySelector(".csf-message")?.textContent.includes("Restored intro.md")'),'Exact-revision restore confirmed');
 assert.equal(fileNodes.get(sourceId).deletedAt,null,'Restored file is active again');
 await click('.csf-tree-row[title="Scenes / intro.md"]');
 await until(()=>evaluate('document.querySelector(".csf-source")?.value==="# First Signal\\nUnsaved workspace-local change."'),'Restored source retains saved content');
 await snap('desktop-private-trash-restored');
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
 const mobileLayouts=[];
 for(const width of [390,360,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  await pause(240);
  const layout=await evaluate('(()=>{const c=document.querySelector(".csw-agent"),r=c.getBoundingClientRect();return {x:r.left,right:r.right,visible:getComputedStyle(c).display!=="none",editorHidden:getComputedStyle(document.querySelector(".csw-main")).display==="none",overflow:document.querySelector(".csw-root").scrollWidth>document.querySelector(".csw-root").clientWidth+2};})()');
  assert.equal(layout.visible,true,'Agent Dock visible at '+width+'px');
  assert.equal(layout.editorHidden,true,'Agent Dock focused at '+width+'px');
  assert.equal(layout.overflow,false,'No Studio horizontal overflow at '+width+'px');
  assert.ok(layout.x>=-1&&layout.right<=width+1,'Dock within '+width+'px viewport');
  mobileLayouts.push({width,...layout});
  await snap('mobile-'+width+'-agent-dock-disconnected');
 }
 const mobile=mobileLayouts[0];
 await click('.csw-agent-close');
 await until(()=>evaluate('getComputedStyle(document.querySelector(".csw-main")).display!=="none"'),'Mobile editor restored after closing Agent Dock');
 const returned=await evaluate('(()=>{const tab=[...document.querySelectorAll(".csw-tab button[role=tab]")].find(x=>x.textContent.includes("Signal Atlas"));if(!tab)return false;tab.click();return true;})()');
 assert.equal(returned,true,'Original private project tab accessible at 320px');
 await until(()=>evaluate('document.querySelector(".csw-file-host:not([hidden]) .csf-source")?.value.includes("Unsaved workspace-local change.")'),'Saved source accessible at 320px');
 const sourceMobile=await evaluate('(()=>{const e=document.querySelector(".csw-file-host:not([hidden]) .csf-source"),root=document.querySelector(".csw-root"),r=e.getBoundingClientRect();return {visible:r.width>0&&getComputedStyle(e).display!=="none",left:r.left,right:r.right,overflow:root.scrollWidth>root.clientWidth+2};})()');
 assert.equal(sourceMobile.visible,true,'Source editor visible at 320px');
 assert.equal(sourceMobile.overflow,false,'No source workspace horizontal overflow at 320px');
 assert.ok(sourceMobile.left>=-1&&sourceMobile.right<=321,'Source editor within 320px viewport');
 await snap('mobile-320-private-source-editor');
 // V121: two existing private files, genuine independent revision mounts.
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await pause(150);
 await click('.csf-tree-actions button[title="Create text source file"]');
 assert.equal(await setValue('.csf-create input','logic.ts'),'logic.ts');
 await click('.csf-create button[type="submit"]');
 await until(()=>evaluate('document.querySelectorAll(".csf-tab").length===2'),'Two real private source tabs');
 const logicCode='export function assembleWorld() {\n  return "safe source";\n}\n';
 await until(()=>visible('.csf-editor-mount.is-primary .csf-source'),'New private source editor');
 assert.equal(await setTextArea('.csf-editor-mount.is-primary .csf-source',logicCode),logicCode);
 await until(()=>evaluate('document.querySelector(".csf-editor-mount.is-primary .csf-editor h3")?.textContent.includes("Unsaved")'),'New source marked unsaved');
 assert.equal(filePatches.length,3,'Creating/editing a second source did not auto-save');
 await click('.csf-split-toggle');
 await until(()=>evaluate('document.querySelectorAll(".csf-editor-mount:not([hidden])").length===2'),'Two real visible independent source mounts');
 assert.ok(await evaluate('!!document.querySelector(".csf-editor-decks.is-split")'),'Actual split layout');
 await until(()=>evaluate('getComputedStyle(document.querySelector(".csf-tree")).display==="none"'),'Split focus hides the file explorer to reclaim code width');
 assert.equal(await evaluate('document.querySelector(".csf-editor-mount.is-secondary .csf-source")?.value.includes("First Signal")'),true,'Secondary retains its private content');
 await click('.csf-editor-mount.is-primary .csi-toolbar-actions button[aria-label="Document outline"]');
 await until(()=>evaluate('document.querySelector(".csf-editor-mount.is-primary .csi-outline-item")?.textContent.includes("assembleWorld")'),'Live TS outline from private draft');
 await click('.csf-editor-mount.is-primary .csi-outline-item:first-child');
 await until(()=>evaluate('document.querySelector(".csf-editor-mount.is-primary .csi-status")?.textContent.includes("Ln 1")'),'Outline navigates to private declaration');
 const splitDesktop=await evaluate('(()=>{const d=document.querySelector(".csf-editor-decks");return {width:d.clientWidth,panes:[...d.querySelectorAll(".csf-editor-mount:not([hidden])")].map(e=>e.getBoundingClientRect().width)}})()');
 assert.ok(splitDesktop.panes.length===2&&splitDesktop.panes.every(w=>w>=260),'Readable split at 1440 '+JSON.stringify(splitDesktop));
 await snap('desktop-v121-private-split-source');
 await click('.csf-editor-mount.is-primary .csf-editor-title button.csw-strong');
 await until(()=>evaluate('document.querySelector(".csf-editor-mount.is-primary .csf-editor")?.textContent.includes("Saved private revision 2.")'),'Independent canonical source save');
 assert.equal(fileNodes.get(source2Id).content,logicCode,'Only the selected source revision was written');
 assert.ok(fileNodes.get(sourceId).content.includes('First Signal'),'Secondary source revision unchanged');
 await click('.csf-split-toggle');
 await until(()=>evaluate('!document.querySelector(".csf-editor-decks.is-split")'),'Single view restored');
 await until(()=>evaluate('getComputedStyle(document.querySelector(".csf-tree")).display!=="none"'),'Single view restores private project Explorer');
 await click('.csf-tab button:first-child');
 await until(()=>evaluate('document.querySelector(".csf-editor-mount.is-primary .csf-source")?.value.includes("First Signal")'),'First tab restored');
 await click('.csf-split-toggle');
 await until(()=>evaluate('document.querySelectorAll(".csf-editor-mount:not([hidden])").length===2'),'Split reopened');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await pause(150);
 const mobileSplit=await evaluate('(()=>{const d=document.querySelector(".csf-editor-decks"),panes=[...d.querySelectorAll(".csf-editor-mount:not([hidden])")].map(e=>e.getBoundingClientRect()),root=document.querySelector(".csw-root");return {panes:panes.map(r=>({top:r.top,bottom:r.bottom,width:r.width})),overflow:root.scrollWidth>root.clientWidth+2}})()');
 assert.equal(mobileSplit.overflow,false,'Mobile split avoids horizontal overflow');
 const mobileViewControl=await evaluate('(()=>{const e=document.querySelector(".csf-view-toolbar .csf-split-toggle"),r=e.getBoundingClientRect();return {left:r.left,right:r.right,visible:getComputedStyle(e).display!=="none"}})()');
 assert.ok(mobileViewControl.visible&&mobileViewControl.left>=-1&&mobileViewControl.right<=391,
  'Mobile Single view toggle stays visible without horizontal scrolling '+JSON.stringify(mobileViewControl));
 assert.equal(mobileSplit.panes.length,2);
 assert.ok(mobileSplit.panes[1].top>=mobileSplit.panes[0].bottom-1,'Mobile private panes stack vertically');
 await snap('mobile-v121-private-stacked-split');
 await click('.csf-split-toggle');
 await until(()=>evaluate('!document.querySelector(".csf-editor-decks.is-split")'),'Mobile split resets without losing files');

 await send('Network.deleteCookies',{url:base,name:'anevum_offline_visual_fixture'});
 await navigate('/studio/workspace');
 await until(()=>evaluate('document.body.textContent.includes("Sign in to open your workspace.")'),'Guest view denies private workspace');
 assert.equal(await visible('.csw-file'),false,'Guest sees no private file titles');
 assert.equal(requests.filter(u=>/api\.openai\.com|chatgpt\.com\/backend-api/i.test(u)).length,0,'No external AI provider calls');
 assert.equal(failures.length,0,'No synthetic browser runtime exceptions '+failures.join('; '));
 const result={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  status:'PASS',syntheticOnly:true,realMemberAcceptance:false,providerCalls:0,
  createdProject:createdId,createdRequests:posts.length,openedTabs:2,foldersCreated:1,sourceFilesCreated:2,sourceSaves:filePatches.filter(x=>!x.deleted).length,trashMoves:filePatches.filter(x=>x.deleted).length,restores:1,mobile,mobileLayouts,sourceMobile,guestDenied:true};
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
