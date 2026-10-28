/** V138: compiled private Studio navigation and draft loss guard.
 * Synthetic single-member localhost fixture only. No actual logins, mutations,
 * private records, Cloudflare requests, data persistence or permission changes.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=resolve('creator-v1/dist/web');
const output=resolve(process.env.ANEVUM_STUDIO_QA_OUTPUT||'evidence/v138-studio-draft');
assert.ok(existsSync(join(root,'index.html')),'An exact-head compiled React bundle is required');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png',
 '.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.glb':'model/gltf-binary'};
const memberId='00000000000000000000000000000099';
const session={user:{id:memberId,name:'SYNTHETIC CI MAKER',email:'ci-studio@anevum.invalid',
 emailVerified:true,createdAt:'2026-10-24T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'},
 session:{id:'ci-local-only',userId:memberId,expiresAt:'2030-01-01T00:00:00Z'}};
const identity={memberId,profile:{handle:'ci_studio',displayName:'CI STUDIO MAKER',
 bio:'',headline:'',worldTheme:'continuance',focus:[],visibility:'private',
 revision:1,createdAt:1792800000,updatedAt:1792800000}};
const results={contract:'v138-studio-draft-guard-compiled-browser',
 source:process.env.ANEVUM_SOURCE_SHA||null,fixturesOnly:true,
 accountWrites:[],outbound:[],exceptions:[],views:[],status:'INCOMPLETE'};
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
 catch{res.writeHead(400);res.end();return;}
 let full=resolve(root,'.'+path);
 if(full!==root&&!full.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 if(!existsSync(full)||!statSync(full).isFile()){
  if(extname(full)){res.writeHead(404);res.end();return;}
  full=join(root,'index.html');
 }
 res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream',
  'cache-control':'no-store',
  ...(extname(full)==='.html'?{'content-security-policy':
   "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"}:{})});
 res.end(req.method==='HEAD'?undefined:readFileSync(full));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width<650?844:960},
   deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==='webgl2'?null:original.call(this,kind,...args);
   };
  });
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base){results.outbound.push({width,url:req.url()});await route.abort();return;}
   if(!['GET','HEAD'].includes(req.method())){
    results.accountWrites.push({width,path:url.pathname,method:req.method()});
    await route.abort();return;
   }
   const path=url.pathname;
   if(path==='/api/v1/member/auth/get-session'){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(session)});return;
   }
   if(path==='/api/v1/member/creator-profile'){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(identity)});return;
   }
   if(path==='/api/v1/member/health'){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     service:'canonical-member',status:'ready',studioReady:true,studioUploadsReady:false
    })});return;
   }
   if(path==='/api/v1/member/studio/projects'){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     projects:[],canReview:false,uploadsReady:false
    })});return;
   }
   if(path==='/api/v1/status'){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     phase:'qa',features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}
    })});return;
   }
   if(path.startsWith('/api/')||path.startsWith('/upload/')){
    await route.fulfill({status:404,contentType:'application/json',body:'{"error":"CI endpoint unavailable"}'});return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.on('pageerror',error=>results.exceptions.push({width,message:error.message}));
  await page.goto(base+'/studio/new',{waitUntil:'domcontentloaded'});
  const form=page.locator('.st-editor-form');
  await form.getByRole('heading',{name:'GIVE YOUR WORK A NAME.'}).waitFor();
  const state=page.locator('#st-save-state');
  await state.waitFor();
  assert.equal(await state.getAttribute('data-unsaved'),'false','Untouched form is clean');
  const saveButton=form.getByRole('button',{name:'CREATE PRIVATE DRAFT'});
  assert.equal(await saveButton.isDisabled(),true,'Untouched first draft cannot submit empty data');
  const title=form.locator('label.st-field').filter({hasText:'PROJECT TITLE'}).locator('input');
  await title.fill('SYNTHETIC LOCAL UNSAVED CREATION');
  await page.waitForFunction(()=>document.querySelector('#st-save-state')?.getAttribute('data-unsaved')==='true');
  assert.match(await state.innerText(),/UNSAVED CHANGES/);
  assert.equal(await saveButton.isEnabled(),true,'Editing unlocks the actual private save action');
  const dialogs=[];
  let accept=false;
  page.on('dialog',async dialog=>{
   dialogs.push({type:dialog.type(),message:dialog.message()});
   if(accept)await dialog.accept();
   else await dialog.dismiss();
  });
  const back=form.getByRole('link',{name:/RETURN TO PROJECTS/});
  await back.click();
  assert.equal(new URL(page.url()).pathname,'/studio/new','Cancel preserves current route');
  assert.equal(await title.inputValue(),'SYNTHETIC LOCAL UNSAVED CREATION','Cancel preserves draft');
  assert.equal(dialogs.length,1,'One confirmation for leaving dirty private draft');
  assert.equal(dialogs[0].type,'confirm');
  assert.match(dialogs[0].message,/unsaved Studio changes/i);
  const unload=await page.evaluate(()=>{
   const e=new Event('beforeunload',{cancelable:true});
   window.dispatchEvent(e);return e.defaultPrevented;
  });
  assert.equal(unload,true,'Hard reload is protected while there are unsaved edits');
  await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
  await page.locator('#av79-navigation[open]').waitFor();
  await page.locator('#av79-navigation a.av79-destination[href="/discover"]').click();
  assert.equal(new URL(page.url()).pathname,'/studio/new','Wayfinder route also guarded');
  assert.equal(dialogs.length,2);
  await page.getByRole('button',{name:'Close navigation',exact:true}).click();
  // Center the actual unsaved status and its save action in review captures.
  await state.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
  await page.screenshot({path:join(output,'studio-draft-unsaved-'+width+'.png'),animations:'disabled'});
  accept=true;
  await back.click();
  await page.waitForURL(base+'/studio/records');
  assert.equal(dialogs.length,3,'Explicit discard prompts exactly once');
  await page.goto(base+'/studio/new',{waitUntil:'domcontentloaded'});
  await page.locator('#st-save-state[data-unsaved="false"]').waitFor();
  const prior=dialogs.length;
  await page.getByRole('link',{name:/RETURN TO PROJECTS/}).click();
  await page.waitForURL(base+'/studio/records');
  assert.equal(dialogs.length,prior,'Untouched private form never nags');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No page overflow');
  results.views.push({width,dirtyPreserved:true,wayfinderProtected:true,unloadProtected:true,
   allowedAfterConfirmation:true,cleanLeavesWithoutPrompt:true,screenshot:'studio-draft-unsaved-'+width+'.png'});
  console.log('PASS Studio draft navigation guard '+width);
  await context.close();
 }
 assert.deepEqual(results.accountWrites,[],'No synthetic or real private writes');
 assert.deepEqual(results.outbound,[],'No out-of-origin requests');
 assert.deepEqual(results.exceptions,[],'No React exceptions');
 results.status='PASS';
}catch(error){results.status='FAIL';results.error=String(error?.stack||error);throw error}
finally{
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(results,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
