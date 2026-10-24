/** Compiled, local-only Quick Navigator QA. Synthetic responses, no member writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,existsSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);
const option=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]};
const output=resolve(option('--output','/tmp/anevum-commons-navigator'));
const engine=option('--engine','chromium');
assert.ok(['chromium','webkit'].includes(engine));
const {chromium,webkit}=createRequire(import.meta.url)('playwright');
const build=resolve('creator-v1/dist/web');
assert.ok(existsSync(join(build,'index.html')),'Build the flagged React preview first');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const errors=[],forbidden=[],requests=[],checks=[],captures=[];
const timeline=[],serverRequests=[];
const mark=(kind,detail={})=>{
  if(timeline.length<450)timeline.push({ms:Date.now(),kind,...detail});
};
const pathOnly=raw=>{try{const url=new URL(raw,base);return url.pathname+url.search;}catch{return String(raw).slice(0,120);}};
/** Same-origin synthetic public API through real HTTP, not route.fulfill().
 * WebKit may classify a pending intercepted fulfillment as an access-control
 * failure when the containing document navigates away. A normal HTTP response
 * exercises the production fetch path while preserving the strict fixture gate.
 */
function fixturePayload(pathname){
  if(pathname==='/api/v1/member/auth/get-session')return null;
  if(pathname==='/api/v1/status')return {version:'synthetic-navigator-fixture',counts:{publishedProjects:0,publishedCreators:0},features:{communityPosts:false}};
  if(pathname==='/api/v1/projects'||pathname==='/api/v1/creators')return {items:[],count:0,nextCursor:null};
  if(pathname==='/api/v1/categories')return {categories:[]};
  return undefined;
}
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const server=createServer((req,res)=>{
  const observed={ms:Date.now(),method:req.method,path:req.url};
  if(serverRequests.length<450)serverRequests.push(observed);
  res.once('finish',()=>{observed.status=res.statusCode;observed.finished=Date.now()});
  if(!['GET','HEAD'].includes(req.method)){forbidden.push({method:req.method,path:req.url});res.writeHead(405).end();return;}
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname.startsWith('/api/')){
    const payload=fixturePayload(url.pathname);
    if(payload===undefined){
      forbidden.push({path:url.pathname,reason:'Unexpected or private API reached fixture server'});
      res.writeHead(403,{'content-type':'application/json','cache-control':'no-store'}).end(req.method==='HEAD'?undefined:JSON.stringify({error:'No fixture'}));
      return;
    }
    res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'}).end(req.method==='HEAD'?undefined:JSON.stringify(payload));
    return;
  }
  let file=resolve(build,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(build+sep)||!existsSync(file)||!statSync(file).isFile()){
    if(extname(file)){res.writeHead(404).end();return;}
    file=join(build,'index.html');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const record=(name,detail={})=>{checks.push({name,...detail});console.log('PASS '+name)};
async function readyCommons(page){
  await page.locator('.lnx-quick-entry').waitFor({state:'visible'});
  await page.waitForFunction(()=>{
    const counts=document.querySelector('#lnx-counts');
    const regions=[...document.querySelectorAll('.lnx-resource-region')];
    return counts?.getAttribute('aria-busy')==='false'&&regions.length>0&&regions.every(region=>region.getAttribute('aria-busy')==='false');
  });
}
async function visitCommons(page,query=''){
  // Readiness is the rendered application state, not 500ms of network silence.
  // https://playwright.dev/docs/api/class-page#page-goto
  const expected=new URL('/__review/commons'+query,base);
  mark('hard-navigation-start',{from:pathOnly(page.url()),to:pathOnly(expected.href)});
  const response=await page.goto(expected.href,{waitUntil:'domcontentloaded'});
  mark('hard-navigation-dom-ready',{status:response?.status(),to:pathOnly(page.url())});
  assert.equal(response?.status(),200,'Compiled document must load successfully');
  await readyCommons(page);
  mark('hard-navigation-app-ready',{url:pathOnly(page.url())});
  assert.equal(page.url(),expected.href,'The requested public review state must be restored');
}
async function closeGlobalLauncher(page){
  // Native close() hides a dialog before dispatching its queued close event.
  // Wait for that real event to reach the original React onClose before reopening.
  await page.locator('.portal-launcher').evaluate(element=>{
    element.dataset.qaClosePending='true';
    element.addEventListener('close',()=>requestAnimationFrame(()=>{
      delete element.dataset.qaClosePending;
    }),{once:true});
  });
  await page.getByRole('button',{name:'Close quick navigation',exact:true}).click();
  await page.waitForFunction(()=>{
    const element=document.querySelector('.portal-launcher');
    return element&&!element.open&&!element.dataset.qaClosePending;
  });
}
async function fixture(width=1440,height=1000,reducedMotion='reduce'){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion});
  context.setDefaultTimeout(12000);
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base||!['GET','HEAD'].includes(request.method())){
      forbidden.push({method:request.method(),url:request.url()});await route.abort();return;
    }
    if(!url.pathname.startsWith('/api/')){await route.continue();return;}
    requests.push({path:url.pathname,query:url.search});
    if(fixturePayload(url.pathname)===undefined){
      forbidden.push({path:url.pathname,reason:'Unexpected or private API'});
      await route.abort();return;
    }
    // Keep routing policy, but return bytes through the same-origin HTTP server.
    await route.continue();
    return;
  });
  const page=await context.newPage();
  page.on('pageerror',error=>{errors.push(error.message);mark('pageerror',{message:error.message})});
  page.on('crash',()=>mark('page-crash'));
  page.on('close',()=>mark('page-close'));
  page.on('domcontentloaded',()=>mark('domcontentloaded',{url:pathOnly(page.url())}));
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())mark('main-frame-navigated',{url:pathOnly(frame.url())})});
  page.on('request',request=>{if(request.isNavigationRequest())mark('navigation-request',{method:request.method(),url:pathOnly(request.url())})});
  page.on('response',response=>{if(response.request().isNavigationRequest())mark('navigation-response',{status:response.status(),url:pathOnly(response.url())})});
  page.on('requestfailed',request=>mark('requestfailed',{url:pathOnly(request.url()),error:request.failure()?.errorText}));
  page.on('console',message=>{if(message.type()==='error')mark('console-error',{text:message.text().slice(0,150)})});
  await visitCommons(page);
  return {context,page};
}
async function openQuick(page){
  await page.locator('.lnx-quick-entry').click();
  await page.locator('#lnx-quick-dialog').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.activeElement?.id==='lnx-quick-search');
}
async function capture(page,name){
  await page.locator('.lnx-quick-note').evaluate(el=>{el.textContent='SYNTHETIC API RESPONSES / COMPILED REACT / NOT LIVE'});
  await page.locator('.lnx-quick-top>.lnx-kicker').evaluate(el=>{el.textContent='COMPILED REACT / SYNTHETIC API / NOT LIVE'});
  await page.screenshot({path:join(output,name+'.png'),animations:'disabled'});
  captures.push(name+'.png');
}
try{
  browser=await ({chromium,webkit}[engine]).launch({headless:true});
  browser.on('disconnected',()=>mark('browser-disconnected'));
  for(const [width,height] of [[1440,1000],[390,844],[320,720],[390,460]]){
    const f=await fixture(width,height);
    await openQuick(f.page);
    const bounds=await f.page.locator('#lnx-quick-dialog').evaluate(el=>{
      const box=el.getBoundingClientRect();
      return {x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:innerWidth,height:innerHeight,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
    });
    assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width+1&&bounds.bottom<=height+1,JSON.stringify(bounds));
    assert.ok(bounds.scrollWidth<=bounds.clientWidth+1,'No hidden horizontal dialog overflow');
    assert.equal(await f.page.locator('.lnx-quick-choice').count(),13);
    assert.equal(await f.page.locator('#lnx-quick-dialog').getAttribute('aria-modal'),'true');
    assert.equal(await f.page.locator('.lnx-quick-entry').getAttribute('aria-expanded'),'true');
    assert.equal(await f.page.locator('main').count(),1);
    assert.equal(await f.page.locator('.ir80-companion').count(),1);
    record('Modal and 13 destinations fit '+width+'x'+height,bounds);
    const targets=await f.page.locator('.lnx-quick-close,.lnx-quick-choice').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));
    assert.ok(targets.every(height=>height>=44),'Minimum 44px controls');
    record('Touch targets at least 44px '+width+'x'+height);
    await capture(f.page,'navigator-'+width+'x'+height);
    await f.page.keyboard.press('Escape');
    await f.page.locator('#lnx-quick-dialog').waitFor({state:'hidden'});
    await f.page.waitForFunction(()=>document.activeElement?.classList.contains('lnx-quick-entry'));
    record('Escape restores pointer invoker '+width+'x'+height);
    await f.context.close();
  }
  const f=await fixture();
  const {page}=f;
  for(const key of ['Control+k','Meta+k']){
    await page.keyboard.press(key);
    await page.locator('.portal-launcher').waitFor({state:'visible'});
    assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>el.open),false);
    await page.keyboard.press('Alt+k');
    assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>el.open),false);
    assert.equal(await page.locator('dialog[open]').count(),1);
    await closeGlobalLauncher(page);
    record(key+' remains owned by the original site-wide launcher');
  }
  await page.locator('.lnx-quick-entry').focus();
  await page.keyboard.press('Alt+k');
  await page.locator('#lnx-quick-dialog').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.activeElement?.id==='lnx-quick-search');
  const before=requests.length;
  await page.locator('#lnx-quick-search').fill('research');
  assert.equal(await page.locator('.lnx-quick-choice').count(),1);
  await page.locator('#lnx-quick-search').dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true});
  assert.equal(await page.locator('#lnx-quick-dialog').isVisible(),true);
  assert.equal(new URL(page.url()).searchParams.get('category'),null);
  record('IME composition does not trigger navigation');
  assert.equal(requests.length,before,'Local filtering must not query a service');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('.lnx-quick-choice').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'lnx-quick-search');
  await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.searchParams.get('category')==='research');
  await page.waitForFunction(()=>document.activeElement?.id==='lnx-main');
  record('Alt+K, local search and arrow/Enter navigate to a canonical district');
  await openQuick(page);
  await page.locator('#lnx-quick-search').fill('no-such-destination');
  await page.getByText('No matching destinations.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  assert.equal(await page.locator('.lnx-quick-choice').count(),13);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'lnx-quick-search');
  record('Empty search recovery restores destinations and input focus');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-destination')),'creators');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-destination')),'signals');
  await page.locator('.lnx-quick-close').focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-destination')),'creators');
  assert.equal(await page.evaluate(()=>document.querySelector('#lnx-quick-dialog')?.contains(document.activeElement)),true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.lnx-quick-close').evaluate(el=>el===document.activeElement),true);
  record('Home/End and forward/reverse Tab stay in the modal');
  await page.keyboard.press('Control+k');
  await page.locator('.portal-launcher').waitFor({state:'visible'});
  assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>el.open),false);
  assert.equal(await page.locator('dialog[open]').count(),1);
  await closeGlobalLauncher(page);
  record('Global shortcut hands off from Commons without stacking two modals');
  await page.keyboard.press('Alt+k');
  await page.locator('#lnx-quick-dialog').waitFor({state:'visible'});
  await page.locator('#lnx-quick-search').fill('district atlas');
  await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.searchParams.get('view')==='atlas');
  await page.waitForFunction(()=>document.activeElement?.id==='lnx-main');
  mark('history-back-start',{from:pathOnly(page.url())});
  await page.goBack({waitUntil:'domcontentloaded'});
  mark('history-back-returned',{to:pathOnly(page.url())});
  await page.waitForURL(url=>url.searchParams.get('category')==='research'&&url.searchParams.get('view')==='signals');
  await readyCommons(page);
  await page.waitForFunction(()=>document.activeElement?.id==='lnx-main');
  record('Scoped navigation changes views and history preserves the selected district');
  await visitCommons(page,'?category=tools&q=signal');
  await openQuick(page);
  await page.locator('#lnx-quick-search').fill('full discover');
  await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.pathname==='/discover');
  assert.equal(new URL(page.url()).searchParams.get('category'),'tools');
  assert.equal(new URL(page.url()).searchParams.get('q'),'signal');
  record('Full Discover destination preserves public project filters');
  await visitCommons(page,'?view=people&q=maker');
  await openQuick(page);
  await page.locator('#lnx-quick-search').fill('creator directory');
  await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.pathname==='/creators');
  assert.equal(new URL(page.url()).searchParams.get('q'),'maker');
  record('Creator Directory destination preserves public creator search');
  await visitCommons(page);
  await page.evaluate(()=>{
    const other=document.createElement('dialog');other.id='qa-other-modal';
    other.innerHTML='<button id="qa-other-focus">Other modal</button>';document.body.append(other);other.showModal();
  });
  await page.keyboard.press('Alt+k');
  assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#qa-other-modal').evaluate(el=>el.open),true);
  await page.evaluate(()=>document.querySelector('#qa-other-modal').remove());
  record('Navigator does not steal another modal shortcut');
  await page.locator('#lnx-search').fill('ordinary keyboard');
  await page.keyboard.press('k');
  assert.equal(await page.locator('#lnx-search').inputValue(),'ordinary keyboardk');
  assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>el.open),false);
  record('Ordinary typing is not intercepted');
  await openQuick(page);
  assert.equal(await page.locator('#lnx-quick-dialog').evaluate(el=>getComputedStyle(el).animationName),'none');
  record('Reduced motion suppresses the dialog entrance');
  await f.context.close();
  assert.deepEqual(errors,[],'Uncaught browser errors');
  assert.deepEqual(forbidden,[],'External requests, unknown APIs or account writes');
  record('No external, private-data or mutating requests');
  writeFileSync(join(output,'navigator-review.json'),JSON.stringify({session:'ANEVUM.WEB.BUILD.2026-10-23.009.WEBKIT-NAVIGATION-DIAGNOSTIC',sourceHead,engine,syntheticFixtures:true,compiledReact:true,productionAcceptance:false,checks,captures,requests,errors,forbidden,timeline,serverRequests},null,2)+'\n');
  console.log(JSON.stringify({result:'PASS',engine,checks:checks.length,captures:captures.length}));
}catch(error){
  mark('failure',{error:String(error)});
  let focusState=null,serverProbe=null;
  const within=(promise,ms)=>Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve(null),ms))]);
  try{
    const response=await within(fetch(base+'/__review/commons?category=tools&q=signal'),3000);
    serverProbe=response?{status:response.status,bytes:(await within(response.arrayBuffer(),3000))?.byteLength}:null;
  }catch(probeError){serverProbe={error:String(probeError)}}
  try{
    const page=browser?.contexts().flatMap(context=>context.pages()).at(-1);
    if(page){
      focusState=await within(page.evaluate(()=>({url:location.href,readyState:document.readyState,active:{tag:document.activeElement?.tagName,id:document.activeElement?.id},openDialogs:Array.from(document.querySelectorAll('dialog[open]')).map(el=>el.id||el.className)})),2500);
      await within(page.screenshot({path:join(output,'navigator-failure-state.png'),timeout:2500}),2800);
    }
  }catch{}
  writeFileSync(join(output,'navigator-failure.json'),JSON.stringify({sourceHead,engine,checks,captures,errors,forbidden,focusState,serverProbe,timeline,serverRequests,requests,error:String(error),stack:error.stack},null,2)+'\n');
  throw error;
}finally{
  if(browser)await browser.close();
  await new Promise(r=>server.close(r));
}
