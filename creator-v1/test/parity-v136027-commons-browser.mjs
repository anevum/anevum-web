/**
 * V136.027: Real React Commons URL/history, approved-public API & privacy smoke.
 * Only CI-owned labelled synthetic records are used on localhost; never live.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';

const {chromium}=createRequire(import.meta.url)('playwright');
const root=resolve('creator-v1/dist/web');
const destination=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/commons-027');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.json':'application/json','.glb':'model/gltf-binary'};
const projects=[
 {id:'ci-commons-game',slug:null,title:'SYNTHETIC COMMONS GAME',
  summary:'Loopback-only public approval fixture; not an actual creator release.',
  category:'games',freeToUse:true,creatorName:'SYNTHETIC MAKER',
  creatorHandle:'ci_maker',publishedAt:'2026-10-25T15:00:00Z',license:'MIT',sourceUrl:null,demoUrl:null},
 {id:'ci-commons-tool',slug:null,title:'SYNTHETIC COMMONS UTILITY',
  summary:'Loopback-only public fixture with a deliberately unlinked creator channel.',
  category:'tools',freeToUse:false,creatorName:'UNLINKED CI MAKER',
  creatorHandle:null,publishedAt:'2026-10-25T14:00:00Z',license:null,sourceUrl:null,demoUrl:null}
];
const creators=[
 {handle:'ci_maker',displayName:'SYNTHETIC MAKER',publishedProjects:1},
 {handle:'ci_helper',displayName:'SYNTHETIC HELPER',publishedProjects:2}
];
const receipt={contract:'v136.027-commons-compiled-browser',
 commit:process.env.ANEVUM_SOURCE_SHA||null,status:'INCOMPLETE',
 syntheticFixture:true,views:[],forbidden:[]};
assert.ok(existsSync(join(root,'index.html')),'Compiled full-flag React build required');
mkdirSync(destination,{recursive:true});
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
 catch{res.writeHead(400);res.end();return;}
 let path=resolve(root,'.'+pathname);
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 if(!existsSync(path)||!statSync(path).isFile()){
  if(extname(path)){res.writeHead(404);res.end();return;}
  path=join(root,'index.html');
 }
 res.writeHead(200,{
  'content-type':mime[extname(path)]||'application/octet-stream',
  'cache-control':'no-store',
  ...(extname(path)==='.html'?{
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"
  }:{})
 });
 res.end(req.method==='HEAD'?undefined:readFileSync(path));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
async function checkParams(page,expected){
 await page.waitForFunction(expect=>{
  const url=new URL(location.href);
  return Object.entries(expect).every(([key,value])=>
    value===null?!url.searchParams.has(key):url.searchParams.get(key)===value);
 },expected,{timeout:12000});
}
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
 ]});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({
   viewport:{width,height:width<650?844:960},deviceScaleFactor:1,
   reducedMotion:'reduce'
  });
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==='webgl2'?null:original.call(this,kind,...args);
   };
  });
  const requests=[],errors=[];
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base||!['GET','HEAD'].includes(request.method())){
    receipt.forbidden.push({width,url:request.url(),method:request.method()});
    await route.abort();return;
   }
   if(url.pathname.startsWith('/api/')){
    const path=url.pathname;
    if(path==='/api/v1/projects'){
     const category=url.searchParams.get('category');
     requests.push({type:'projects',category});
     const filtered=category?projects.filter(p=>p.category===category):projects;
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      items:filtered,count:filtered.length,nextCursor:null
     })});return;
    }
    if(path==='/api/v1/creators'){
     const q=(url.searchParams.get('q')||'').trim().toLowerCase();
     requests.push({type:'creators',q});
     const matches=q?creators.filter(p=>p.handle.includes(q)||p.displayName.toLowerCase().includes(q)):creators;
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      items:matches,count:matches.length,nextCursor:null
     })});return;
    }
    if(path==='/api/v1/status'){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      version:'ci-loopback',phase:'test',features:{communityPosts:false},
      counts:{publishedProjects:2,publishedCreators:2}
     })});return;
    }
    if(path==='/api/v1/community/posts'){
     receipt.forbidden.push({width,reason:'Community posts API requested while moderation is disabled'});
     await route.fulfill({status:403,contentType:'application/json',body:'{"error":"moderation disabled"}'});
     return;
    }
    if(path==='/api/v1/member/auth/get-session'){
     await route.fulfill({status:200,contentType:'application/json',body:'null'});return;
    }
    if(path==='/api/v1/community/members'||path==='/api/v1/community/activity'||
       path==='/api/v1/community/threads'){
     await route.fulfill({status:200,contentType:'application/json',
       body:JSON.stringify({items:[],count:0,nextCursor:null})});return;
    }
    await route.fulfill({status:404,contentType:'application/json',body:'{"error":"Unavailable CI-only endpoint"}'});
    return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error.stack||error.message)));
  await page.goto(base+'/community',{waitUntil:'domcontentloaded'});
  const hub=page.locator('.p136-community[data-community-phase="v136.027"]');
  await hub.waitFor({timeout:20000});
  const entries=hub.locator('.ch7-stream .ch7-project');
  await hub.getByRole('heading',{name:'SYNTHETIC COMMONS GAME',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-stream .ch7-project').length===2);
  assert.equal(await hub.getByLabel('Approved public community counts').count(),1);
  assert.equal(await hub.locator('.ch7-entry [aria-label="Public creator channel not linked"]').count(),1,
    'Unlinked project credit has no fabricated channel URL');
  assert.equal(await hub.locator('a[href*="/creators/null"]').count(),0);
  const geometry=await hub.evaluate(element=>({
   viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,
   hubWidth:Math.round(element.getBoundingClientRect().width)
  }));
  assert.ok(geometry.document<=geometry.viewport+2,'No sideways Commons scroll: '+JSON.stringify(geometry));
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'commons-all-'+width+'.png'),fullPage:true,animations:'disabled'});
  const tabs=hub.locator('.ch7-tabs');
  const categoryRead=page.waitForResponse(response=>{
   const url=new URL(response.url());
   return url.pathname==='/api/v1/projects'&&url.searchParams.get('category')==='games'&&response.status()===200;
  },{timeout:16000});
  await tabs.getByRole('button',{name:'PROJECTS'}).click();
  await checkParams(page,{view:'projects'});
  await hub.locator('.ch7-field-filter select').selectOption('games');
  await checkParams(page,{view:'projects',category:'games'});
  await categoryRead;
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-stream .ch7-project').length===1);
  assert.equal(await hub.getByRole('heading',{name:'SYNTHETIC COMMONS GAME',exact:true}).count(),1);
  assert.equal(await hub.getByRole('heading',{name:'SYNTHETIC COMMONS UTILITY',exact:true}).count(),0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'commons-projects-games-'+width+'.png'),fullPage:true,animations:'disabled'});
  await page.goBack({waitUntil:'domcontentloaded'});
  await checkParams(page,{view:'projects',category:null});
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-stream .ch7-project').length===2);
  assert.equal(await hub.locator('.ch7-field-filter select').inputValue(),'all',
   'Browser Back restores unfiltered projects');
  await tabs.getByRole('button',{name:'PEOPLE'}).click();
  await checkParams(page,{view:'people',category:null,sort:null,q:null});
  const person=hub.locator('.ch7-people .ch7-person');
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-people .ch7-person').length===2);
  const searchResponse=page.waitForResponse(response=>{
   const url=new URL(response.url());
   return url.pathname==='/api/v1/creators'&&url.searchParams.get('q')==='HELPER'&&response.status()===200;
  },{timeout:16000});
  const search=hub.locator('.ch7-search input[name="q"]');
  await search.fill('HELPER');
  await search.press('Enter');
  await checkParams(page,{view:'people',q:'HELPER'});
  await searchResponse;
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-people .ch7-person').length===1);
  assert.equal(await person.getByRole('heading',{name:'SYNTHETIC HELPER'}).count(),1);
  assert.equal(await search.inputValue(),'HELPER');
  assert.equal(await hub.locator('a[href*="/creators/null"]').count(),0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'commons-people-search-'+width+'.png'),fullPage:true,animations:'disabled'});
  await page.goBack({waitUntil:'domcontentloaded'});
  await checkParams(page,{view:'people',q:null});
  await page.waitForFunction(()=>document.querySelectorAll('.ch7-people .ch7-person').length===2);
  assert.equal(await search.inputValue(),'','Search draft restores from URL on Back');
  await tabs.getByRole('button',{name:'DISCUSSIONS'}).click();
  await checkParams(page,{view:'conversations',q:null,category:null});
  await hub.getByRole('heading',{name:'Conversations are in private testing.'}).waitFor();
  await hub.locator('.ch7-sort').getByRole('button',{name:'HOT'}).click();
  await checkParams(page,{view:'conversations',sort:'hot'});
  // React commits the URL transition asynchronously; wait for the actual
  // selected button rather than reading its stale previous DOM state.
  await hub.locator('.ch7-sort button[aria-pressed="true"]').filter({hasText:'HOT'}).waitFor();
  assert.equal(await hub.locator('.ch7-sort [aria-pressed="true"]').innerText(),'HOT');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'commons-closed-discussions-'+width+'.png'),fullPage:true,animations:'disabled'});
  await page.goBack({waitUntil:'domcontentloaded'});
  await checkParams(page,{view:'conversations',sort:null});
  await hub.locator('.ch7-sort button[aria-pressed="true"]').filter({hasText:'NEWEST'}).waitFor();
  assert.equal(await hub.locator('.ch7-sort [aria-pressed="true"]').innerText(),'NEWEST');
  assert.deepEqual(errors,[],'No React page exceptions at '+width);
  receipt.views.push({width,geometry,networkReads:requests.length,screenshots:4,checks:'PASS'});
  console.log('PASS V136.027 Commons '+width+': '+JSON.stringify(geometry));
  await context.close();
 }
 assert.deepEqual(receipt.forbidden,[],'No unauthorized outbound/POST/moderation API calls');
 receipt.status='PASS';
} catch(error){
 receipt.status='FAIL';receipt.error=String(error?.stack||error);
 throw error;
} finally{
 writeFileSync(join(destination,'acceptance.json'),JSON.stringify(receipt,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
