/** Compiled React + clearly labelled synthetic data. Loopback only; no writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const build=resolve('creator-v1/dist/web'),output=resolve(process.env.PROGRESSION_QA_OUTPUT||'/tmp/progression-next-review');
mkdirSync(output,{recursive:true});
const checks=[],errors=[],writes=[],external=[],captures=[];
const record=name=>{checks.push(name);console.log('PASS '+name)};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){writes.push(req.method+' '+req.url);res.writeHead(405);res.end();return}
 let file=resolve(build,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(build+sep)||!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return}file=join(build,'index.html');
 }
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let failure=null;
async function fixture(width=1440,user=null){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});
 const state={user,error:false,invalid:false,privateReads:[]};
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==base){external.push(url.href);await route.abort();return}
  if(!['GET','HEAD'].includes(req.method())){writes.push(req.method()+' '+url.pathname);await route.abort();return}
  if(!url.pathname.startsWith('/api/')){await route.continue();return}
  const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  const p=url.pathname;
  if(p==='/api/v1/member/auth/get-session'){
   await json(state.user?{user:{id:state.user,name:'Synthetic member',email:'fixture@example.invalid',emailVerified:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},session:{id:'fixture-session',userId:state.user,token:'synthetic-not-a-token',expiresAt:new Date(Date.now()+3600000).toISOString()}}:null);return;
  }
  if(p.startsWith('/api/v1/member/'))state.privateReads.push(p);
  if(p==='/api/v1/member/progression'){
   if(!state.user){await json({error:'No fixture session'},401);return}
   if(state.error){await json({error:'Synthetic outage'},503);return}
   const first=state.user==='fixture-a';
   await json({progression:{xp:first?775:35,level:first?4:1,maxLevel:30,levelStart:state.invalid?999:first?675:0,nextLevel:first?1200:75,artifact:'Synthetic earned item',testXp:0,milestoneXp:35,awards:[{id:'first_signal',name:'First Signal',detail:'Synthetic earned milestone',xp:10,symbol:'',earnedAt:1792700000},{id:'world_shaper',name:'World Shaper',detail:'Synthetic earned milestone',xp:25,symbol:'',earnedAt:1792700100}]}});return;
  }
  if(p==='/api/v1/member/notifications'){await json({items:[],recent:[]});return}
  if(p.includes('/rewards/levels/')){
   assert.ok(state.user,'Guest must not request earned art');
   assert.match(p,new RegExp('/levels/'+(state.user==='fixture-a'?4:1)+'/card$'));
   await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="20" fill="#29233b"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="11">FIXTURE</text></svg>'});return;
  }
  if(p==='/api/v1/status'){await json({version:'synthetic',phase:'review',counts:{publishedProjects:0,publishedCreators:0},features:{communityPosts:false}});return}
  await json({error:'No synthetic data for this endpoint'},503);
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 return {page,state,context};
}
async function open(page){await page.goto(base+'/__review/progression',{waitUntil:'networkidle'});await page.locator('.px-root').waitFor()}
async function capture(page,name){await page.locator('.px-review-note').evaluate(el=>{el.textContent='SYNTHETIC DATA / COMPILED REACT REVIEW / NOT DEPLOYED'});await page.screenshot({path:join(output,name+'.png'),fullPage:true,animations:'disabled'});captures.push(name+'.png')}
async function fit(page,label){const size=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(size.s<=size.w+1,JSON.stringify(size));record(label+' fits viewport')}
try{
 for(const width of [1440,390,320]){
  const {page,state,context}=await fixture(width);await open(page);
  assert.equal(await page.locator('.px-activity').count(),19);record(width+' guest sees proposed catalog');
  assert.equal(await page.locator('.px-current').count(),0);assert.ok(!state.privateReads.includes('/api/v1/member/progression'));record(width+' guest has no private progression or art');
  await fit(page,width+' catalog');await capture(page,'guest-'+width);
  await page.getByRole('button',{name:'Creation',exact:true}).click();assert.equal(await page.locator('.px-activity').count(),5);record(width+' track filter');
  const input=page.getByRole('searchbox',{name:'Find a contribution'});await input.fill('not-present-zzz');await page.getByRole('heading',{name:'No matching paths.'}).waitFor();
  await page.getByRole('button',{name:'Clear filters'}).click();assert.equal(await page.locator('.px-activity').count(),19);record(width+' search empty recovery');
  const button=page.getByRole('button',{name:'View criteria for Write a useful field report'});await button.click();await page.locator('dialog[open]').waitFor();
  assert.match(await page.locator('dialog').innerText(),/independent review/i);await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'hidden'});
  assert.equal(await button.evaluate(el=>el===document.activeElement),true);record(width+' dialog Escape and focus restoration');
  await page.locator('.px-nav button').nth(1).click();assert.equal(await page.locator('.px-expedition').count(),3);await fit(page,width+' expeditions');await capture(page,'expeditions-'+width);
  assert.equal(await page.locator('.px-orbit-one').evaluate(el=>getComputedStyle(el).animationName),'none');record(width+' reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.px-motion').click();assert.equal(await page.locator('.px-orbit-one').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');record(width+' manual motion pause');
  await context.close();
 }
 const {page,state,context}=await fixture(390,'fixture-a');await open(page);await page.locator('.px-current').waitFor();assert.match(await page.locator('.px-current').innerText(),/Level 4/);record('member snapshot from server');await capture(page,'member-390');
 await page.locator('.px-nav button').nth(2).click();await page.locator('.px-timeline li').first().waitFor();assert.equal(await page.locator('.px-timeline li').count(),2);record('chronicle shows only earned milestones');await capture(page,'chronicle-390');
 state.user='fixture-b';await open(page);await page.locator('.px-current').waitFor();assert.match(await page.locator('.px-current').innerText(),/Level 1/);assert.doesNotMatch(await page.locator('.px-current').innerText(),/775/);record('account replacement clears prior snapshot');
 state.error=true;await open(page);await page.getByRole('heading',{name:'Progress could not be verified.'}).waitFor();state.error=false;await page.getByRole('button',{name:'Retry progress check'}).click();await page.locator('.px-current').waitFor();record('member outage recovers without synthetic XP');
 state.invalid=true;await open(page);await page.getByRole('heading',{name:'Progress could not be verified.'}).waitFor();assert.equal(await page.locator('.px-current').count(),0);record('malformed server progress fails closed');
 state.invalid=false;state.user=null;await open(page);assert.equal(await page.locator('.px-current').count(),0);record('signed-out member does not retain private art');await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);record('no runtime errors, writes or external requests');
}catch(e){failure=e.message;throw e}
finally{
 writeFileSync(join(output,'receipt.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),data:'synthetic only',checks,captures,errors,writes,external,failure},null,2));
 await browser.close();await new Promise(r=>server.close(r));
}
