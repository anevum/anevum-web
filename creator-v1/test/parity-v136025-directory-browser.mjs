/**
 * PARITY V136.025 — focused actual compiled creator-directory acceptance.
 * All creator entries below are loopback-only synthetic data. This test does
 * not authenticate, write public data, call providers or replace full V136 QA.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=resolve('creator-v1/dist/web');
const output=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/creator-directory-025');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.glb':'model/gltf-binary','.json':'application/json'};
const people=[
 {handle:'qa_maker',displayName:'SYNTHETIC CI MAKER',publishedProjects:1},
 {handle:'fixture_lab',displayName:'SYNTHETIC CI LAB',publishedProjects:2}
];
const release={id:'ci-channel-release',title:'SYNTHETIC CHANNEL RELEASE',
 summary:'Loopback-only published work for creator-channel navigation acceptance.',
 description:'Synthetic local browser fixture, never a public creator release.',
 category:'tools',creatorHandle:'qa_maker',creatorName:'SYNTHETIC CI MAKER',
 publishedAt:'2026-10-25T12:00:00Z',freeToUse:true,license:'MIT',demoUrl:null,sourceUrl:null};
const report={contract:'v136.025-loopback-directory',status:'INCOMPLETE',syntheticFixture:true,
 commit:process.env.ANEVUM_SOURCE_SHA||null,widths:[],rejections:[]};
assert.ok(existsSync(join(root,'index.html')),'Full-flag compiled V136 frontend required');
mkdirSync(output,{recursive:true});
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
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
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"
  }:{})
 });
 res.end(req.method==='HEAD'?undefined:readFileSync(path));
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width<650?844:960},deviceScaleFactor:1,reducedMotion:'reduce'});
  // Public directory must remain usable without WebGL or cinematic shaders.
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==='webgl2'?null:original.call(this,kind,...args);
   };
  });
  let published=true;
  const errors=[];
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base||!['GET','HEAD'].includes(req.method())){
    report.rejections.push({width,url:req.url(),method:req.method()});
    await route.abort();return;
   }
   if(url.pathname.startsWith('/api/')){
    if(url.pathname==='/api/v1/creators/qa_maker'){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({creator:people[0]})});return;
    }
    if(url.pathname==='/api/v1/projects'){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[release],count:1,nextCursor:null})});return;
    }
    if(url.pathname==='/api/v1/projects/'+release.id){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({item:release})});return;
    }
    if(url.pathname==='/api/v1/creators'){
     const q=(url.searchParams.get('q')||'').trim().toLowerCase();
     const cursor=url.searchParams.get('cursor');
     const results=!published||cursor?[]:people.filter(p=>
      p.displayName.toLowerCase().includes(q)||p.handle.includes(q));
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      items:results,count:results.length,
      nextCursor:published&&!cursor&&!q?'ci-next-page':null
     })});return;
    }
    if(url.pathname==='/api/v1/status'){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}
     })});return;
    }
    if(url.pathname==='/api/v1/member/auth/get-session'){
     await route.fulfill({status:200,contentType:'application/json',body:'null'});return;
    }
    await route.fulfill({status:404,contentType:'application/json',body:'{"error":"Fixture endpoint unavailable"}'});
    return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/creators',{waitUntil:'domcontentloaded'});
  const directory=page.locator('.p136-creators[data-directory-phase="v136.025"]');
  await directory.waitFor();
  const cards=directory.locator('.portal-creator-tile');
  await cards.first().waitFor();
  assert.equal(await cards.count(),2,'Only two synthetic loopback creators appear');
  const geometry=await page.evaluate(()=>{
   const root=document.querySelector('.p136-creators'),grid=root.querySelector('.portal-creator-grid');
   return {clientWidth:document.documentElement.clientWidth,
    documentWidth:document.documentElement.scrollWidth,
    rootWidth:root.scrollWidth,rootClient:root.clientWidth,
    columns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
    cardWidth:root.querySelector('.portal-creator-tile').getBoundingClientRect().width};
  });
  assert.ok(geometry.documentWidth<=geometry.clientWidth+2,
   'Document must not overflow at '+width+': '+JSON.stringify(geometry));
  assert.ok(geometry.rootWidth<=geometry.rootClient+2,
   'Directory must not overflow at '+width+': '+JSON.stringify(geometry));
  assert.ok(geometry.cardWidth>=240,'Readable cards at '+width);
  // A genuine 320px full-page capture revealed that the fixed bottom dock
  // crossed the duplicated hero count card. At 320, the actual count remains
  // in the result toolbar, where it can be reached by normal scrolling.
  const readout=directory.locator('.p136-creators-register-panel');
  assert.equal(await readout.isVisible(),width>=360,
    'Creator index readout must not sit under the 320px fixed dock');
  assert.equal(geometry.columns,width>=1161?3:1,
   'Correct desktop/mobile grid density at '+width);
  assert.equal(await directory.locator('.portal-creator-grid').getAttribute('data-layout'),'grid');
  await page.screenshot({path:join(output,'creators-grid-'+width+'.png'),fullPage:true,animations:'disabled',timeout:30000});
  const list=page.getByRole('button',{name:'List',exact:true});
  await list.click();
  await page.waitForURL(/\/creators\?view=list$/);
  await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
  assert.equal(await list.getAttribute('aria-pressed'),'true');
  await page.screenshot({path:join(output,'creators-list-'+width+'.png'),fullPage:true,animations:'disabled',timeout:30000});
  await page.goBack({waitUntil:'domcontentloaded'});
  await directory.locator('.portal-creator-grid[data-layout="grid"]').waitFor();
  await page.getByRole('button',{name:'List',exact:true}).click();
  await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
  await page.getByRole('link',{name:/NEXT PAGE/}).click();
  await page.waitForURL(/view=list&cursor=ci-next-page/);
  await page.getByRole('heading',{name:'No further channels on this page.'}).waitFor();
  await page.getByRole('searchbox',{name:'Search published creators'}).fill('QA');
  await page.getByRole('button',{name:/Find creators/}).click();
  await page.waitForURL(/\/creators\?q=QA&view=list$/);
  await cards.first().waitFor();
  assert.equal(await cards.count(),1,'Search filters the approved public fixture');
  assert.match(await cards.first().innerText(),/SYNTHETIC CI MAKER/);
  assert.equal(new URL(page.url()).searchParams.has('cursor'),false,'Search resets cursor');
  // Exercise the actual keyboard directory -> channel -> project -> channel
  // -> filtered directory journey, including nested public return context.
  await cards.first().press('Enter');
  const channel=page.locator('.p136-creator-channel[data-channel-phase="v136.029"]');
  await channel.waitFor();
  const channelURL=new URL(page.url());
  const channelPath=channelURL.pathname+channelURL.search;
  assert.equal(channelURL.searchParams.get('from'),'/creators?q=QA&view=list');
  const titleStyle=await channel.locator('.portal-channel-identity h1').evaluate(e=>({
   family:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight
  }));
  assert.match(titleStyle.family,/sans-serif/);assert.ok(Number(titleStyle.weight)>=700);
  assert.equal(await channel.locator('.portal-channel-avatar svg').count(),1,'Native channel fallback, never an invented portrait');
  const channelGeometry=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(channelGeometry.document<=channelGeometry.width+2,'Creator channel must fit '+width);
  await channel.getByRole('heading',{name:release.title,exact:true}).waitFor();
  const workLayout=await channel.locator('.portal-discover-results').evaluate(e=>({
   columns:getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length,
   width:e.getBoundingClientRect().width,card:e.querySelector('.project-card').getBoundingClientRect().width
  }));
  assert.equal(workLayout.columns,1,'Channel work uses the available editorial row');
  assert.ok(workLayout.card>=workLayout.width-2,'A sparse grid must not squeeze actual project content');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(output,'creator-channel-'+width+'.png'),fullPage:true,animations:'disabled',timeout:30000});
  await channel.getByRole('link',{name:'View project',exact:true}).click();
  await page.locator('.portal-project').waitFor();
  const returnProject=page.locator('.portal-crumbs').getByRole('link',{name:/BACK TO CREATOR/});
  assert.equal(await returnProject.getAttribute('href'),channelPath);
  await returnProject.click();await channel.waitFor();
  const returnDirectory=channel.getByRole('link',{name:/ALL PUBLIC CREATORS/});
  assert.equal(await returnDirectory.getAttribute('href'),'/creators?q=QA&view=list');
  await returnDirectory.click();await cards.first().waitFor();
  await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
  assert.equal(await page.getByRole('searchbox',{name:'Search published creators'}).inputValue(),'QA');
  assert.equal(await cards.count(),1);
  await page.getByRole('searchbox',{name:'Search published creators'}).fill('unlisted-name');
  await page.getByRole('searchbox',{name:'Search published creators'}).press('Enter');
  await page.getByRole('heading',{name:'No matching creators yet.'}).waitFor();
  assert.equal(await cards.count(),0);
  await page.screenshot({path:join(output,'creators-no-matches-'+width+'.png'),fullPage:true,animations:'disabled',timeout:30000});
  published=false;
  await page.getByRole('link',{name:'Clear search'}).click();
  await page.waitForURL(/\/creators\?view=list$/);
  await page.getByRole('heading',{name:'No public creator channels yet.'}).waitFor();
  await page.screenshot({path:join(output,'creators-unpublished-'+width+'.png'),fullPage:true,animations:'disabled',timeout:30000});
  assert.deepEqual(errors,[],'No runtime exceptions at '+width);
  report.widths.push({width,geometry,channelGeometry,screenshots:5,checks:'PASS'});
  console.log('PASS directory full-flag '+width+'px: '+JSON.stringify(geometry));
  await context.close();
 }
 assert.deepEqual(report.rejections,[],'No outbound/non-read-only browser traffic');
 report.status='PASS';
} catch(error){
 report.status='FAIL';report.failure=String(error?.stack||error);
 throw error;
} finally {
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
