/**
 * PARITY V136.026 — focused actual compiled public Discover acceptance.
 * This runs only on a loopback HTTP server, with synthetic approved projects.
 * It does not authorize a release, create users or contact an external API.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';

const {chromium}=createRequire(import.meta.url)('playwright');
const root=resolve('creator-v1/dist/web');
const destination=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/discovery-026');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.glb':'model/gltf-binary','.json':'application/json'};
const projects=[
 {id:'ci-orbit-game',title:'SYNTHETIC ORBIT GAME',summary:'Test-only approved game record; not a public release.',
  category:'games',freeToUse:true,license:'MIT',publishedAt:'2026-10-25T12:00:00Z',
  creatorName:'SYNTHETIC CI AUTHOR',creatorHandle:null},
 {id:'ci-useful-tool',title:'SYNTHETIC USEFUL TOOL',summary:'Test-only approved utility record; not a public release.',
  category:'tools',freeToUse:false,license:'MIT',publishedAt:'2026-10-25T11:00:00Z',
  creatorName:'SYNTHETIC CI AUTHOR',creatorHandle:null}
];
const report={contract:'v136.026-discovery-compiled-browser',commit:process.env.ANEVUM_SOURCE_SHA||null,
 status:'INCOMPLETE',syntheticFixture:true,widths:[],forbidden:[]};
assert.ok(existsSync(join(root,'index.html')),'Compiled V136 full-flag frontend is required');
mkdirSync(destination,{recursive:true});
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
   'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"
  }:{})
 });
 res.end(req.method==='HEAD'?undefined:readFileSync(path));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const checkParams=async(page,expected)=>{
 await page.waitForFunction(expected=>{
  const params=new URL(location.href).searchParams;
  return Object.entries(expected).every(([key,value])=>
   value===null?!params.has(key):params.get(key)===value);
 },expected,{timeout:10000});
};
let browser;
try{
 browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
 ]});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({
   viewport:{width,height:width<650?844:960},deviceScaleFactor:1,reducedMotion:'reduce'
  });
  // UI must not depend on a working GPU context for ordinary catalogue access.
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==='webgl2'?null:original.call(this,kind,...args);
   };
  });
  let published=true;
  const errors=[],requests=[];
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base||!['GET','HEAD'].includes(request.method())){
    report.forbidden.push({width,url:request.url(),method:request.method()});
    await route.abort();return;
   }
   if(url.pathname.startsWith('/api/')){
    const path=url.pathname;
    if(path==='/api/v1/projects'){
     const query=(url.searchParams.get('q')||'').trim().toLowerCase();
     const cat=url.searchParams.get('category');
     const free=url.searchParams.get('free')==='1';
     const cursor=url.searchParams.get('cursor');
     const results=!published||cursor?[]:projects.filter(item=>
      (!query||item.title.toLowerCase().includes(query)||item.summary.toLowerCase().includes(query))&&
      (!cat||item.category===cat)&&(!free||item.freeToUse));
     requests.push({query,cat,free,cursor});
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      items:results,count:results.length,nextCursor:published&&!query&&!cat&&!free&&!cursor?'ci-page-2':null
     })});return;
    }
    if(path==='/api/v1/categories'){
     await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({categories:[{category:'games',count:1},{category:'tools',count:1}]})});return;
    }
    const project=projects.find(item=>path==='/api/v1/projects/'+item.id);
    if(project){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({item:project})});return;
    }
    if(path==='/api/v1/status'){
     await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}})});return;
    }
    if(path==='/api/v1/creators'){
     await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({items:[],count:0,nextCursor:null})});return;
    }
    if(path==='/api/v1/member/auth/get-session'){
     await route.fulfill({status:200,contentType:'application/json',body:'null'});return;
    }
    await route.fulfill({status:404,contentType:'application/json',body:'{"error":"CI unavailable API route"}'});
    return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error.stack||error.message)));
  await page.goto(base+'/discover',{waitUntil:'domcontentloaded'});
  const discovery=page.locator('.p136-discovery[data-discovery-phase="v136.026"]');
  await discovery.waitFor({timeout:20000});
  const cards=page.locator('.p136-discover-results article.project-card');
  await page.getByRole('heading',{name:'SYNTHETIC ORBIT GAME',exact:true}).waitFor();
  assert.equal(await cards.count(),2,'Only two explicitly synthetic approved projects');
  const grid=page.locator('.p136-discover-results[data-layout="grid"]');
  const initial=await grid.evaluate(element=>{
   const doc=document.documentElement;
   return {viewport:doc.clientWidth,document:doc.scrollWidth,
    columns:getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    width:element.getBoundingClientRect().width};
  });
  assert.ok(initial.document<=initial.viewport+2,
   'Discovery must not horizontally overflow: '+JSON.stringify(initial));
  assert.equal(initial.columns,width>=1201?3:1,'Grid layout density at '+width);
  const gateway=discovery.locator('.p136-discover-featured .p136-discover-world').first();
  const gatewayState=await gateway.evaluate(element=>{
   const core=element.querySelector('.av136-index-field');
   const overlay=element.querySelector('.p136-discover-world-copy strong');
   const description=element.querySelector('.p136-discover-world-copy small');
   return {label:element.getAttribute('aria-label'),nativeCount:element.querySelectorAll('.av136-index-field').length,
    indexVisible:!!core&&getComputedStyle(core).display!=='none',
    duplicateHidden:!!overlay&&getComputedStyle(overlay).display==='none',
    descriptionVisible:!!description&&getComputedStyle(description).display!=='none'};
  });
  assert.equal(gatewayState.nativeCount,1,'One native category instrument is displayed');
  assert.ok(gatewayState.label?.includes('Games'),'Gateway retains useful accessible name');
  assert.ok(gatewayState.indexVisible&&gatewayState.duplicateHidden&&gatewayState.descriptionVisible,
   'Native category name and separate description must not overlap at '+width+': '+JSON.stringify(gatewayState));
  assert.equal(await discovery.locator('.av136-project-thumbnail[data-thumbnail-source="default"]').count(),2,
   'Legacy projects use approved first-party type defaults, not fabricated uploaded covers');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'discover-grid-'+width+'.png'),fullPage:true,animations:'disabled',timeout:90000});
  // Grid/list changes are URL-only; the server reads are unchanged.
  const beforeView=requests.length;
  await discovery.locator('.p136-discover-layout-switch').getByRole('button',{name:'List',exact:true}).click();
  await checkParams(page,{view:'list',q:null,category:null,cursor:null,free:null});
  const list=page.locator('.p136-discover-results[data-layout="list"]');
  await list.waitFor();
  assert.equal(await list.locator('article.project-card').count(),2);
  assert.equal(await list.locator('.project-art').count(),0,
   'Legacy list mode is actual editorial rows, not another visual grid');
  assert.equal(await list.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length),1,
   'One full-width result per List row at '+width);
  assert.equal(requests.length,beforeView,'Layout-only changes must not re-query public catalogue');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'discover-list-'+width+'.png'),fullPage:true,animations:'disabled',timeout:90000});
  await list.getByRole('link',{name:'View project',exact:true}).first().click();
  await page.locator('.portal-project').waitFor();
  assert.equal(await page.locator('a[href*="/creators/null"]').count(),0,'Project credit must not fabricate a null channel');
  assert.equal(await page.getByLabel('Public creator channel not linked',{exact:true}).count(),1);
  const returnLink=page.locator('.portal-crumbs').getByRole('link',{name:/BACK TO RESULTS/});
  assert.equal(await returnLink.getAttribute('href'),'/discover?view=list');
  await returnLink.click();
  await list.waitFor();
  assert.equal(await list.locator('article.project-card').count(),2);
  // Recover the original List history entry before the preserved Grid Back test.
  await page.goBack();await page.locator('.portal-project').waitFor();
  await page.goBack();await list.waitFor();
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('.p136-discover-results[data-layout="grid"]').waitFor();
  await discovery.locator('.p136-discover-layout-switch').getByRole('button',{name:'List',exact:true}).click();
  await list.waitFor();
  // A category and free toggle keep the selected view, but reset stale cursors.
  await discovery.locator('.p136-discover-category-nav').getByRole('button',{name:'Games',exact:true}).click();
  await checkParams(page,{view:'list',category:'games',cursor:null});
  // A URL update precedes React's awaited public catalogue response. The
  // prior two-card DOM may disappear into a real loading state between reads.
  await page.waitForFunction(()=>document.querySelectorAll('.p136-discover-results article.project-card').length===1);
  await page.getByRole('heading',{name:'SYNTHETIC ORBIT GAME',exact:true}).waitFor();
  assert.equal(await cards.count(),1);
  // Register the response gate before clicking. An URL-only assertion can
  // win the race against React dispatching the updated public catalogue GET.
  const freeResponse=page.waitForResponse(response=>{
    const url=new URL(response.url());
    return url.pathname==='/api/v1/projects'&&url.searchParams.get('category')==='games'&&
      url.searchParams.get('free')==='1'&&response.status()===200;
  },{timeout:15000});
  await discovery.locator('.p136-discover-availability').getByRole('button',{name:/Marked free/}).click();
  await checkParams(page,{view:'list',category:'games',free:'1'});
  await freeResponse;
  await page.waitForFunction(()=>document.querySelectorAll('.p136-discover-results article.project-card').length===1);
  assert.ok(requests.some(read=>read.cat==='games'&&read.free),'Marked-free filter reaches the real project query');
  assert.equal(await cards.count(),1);
  const search=discovery.locator('.p136-discover-search-form').getByRole('searchbox',{name:'Search published projects'});
  const searchResponse=page.waitForResponse(response=>{
    const url=new URL(response.url());
    return url.pathname==='/api/v1/projects'&&url.searchParams.get('q')==='ORBIT'&&
      url.searchParams.get('category')==='games'&&url.searchParams.get('free')==='1'&&
      response.status()===200;
  },{timeout:15000});
  await search.fill('ORBIT');
  await search.press('Enter');
  await checkParams(page,{view:'list',category:'games',free:'1',q:'ORBIT',cursor:null});
  await searchResponse;
  // Route transitions intentionally render a loading state until the true
  // response paints. A URL update or stale previous heading alone is not
  // sufficient evidence that a filtered catalogue is ready.
  await page.waitForFunction(()=>document.querySelectorAll('.p136-discover-results article.project-card').length===1);
  await page.getByRole('heading',{name:'SYNTHETIC ORBIT GAME',exact:true}).waitFor();
  assert.equal(await cards.count(),1);
  await page.evaluate(()=>window.scrollTo(0,0));
  // Grid and List already have full-page receipts. Capture the true filtered
  // project result in-view without a third heavyweight full-document screenshot.
  await page.locator('.p136-discover-results').scrollIntoViewIfNeeded();
  await page.screenshot({path:join(destination,'discover-filtered-'+width+'.png'),
    fullPage:false,animations:'disabled',timeout:60000});
  await discovery.getByRole('link',{name:/Clear filters/}).click();
  await checkParams(page,{view:'list',q:null,category:null,free:null,cursor:null});
  await page.getByRole('heading',{name:'SYNTHETIC USEFUL TOOL',exact:true}).waitFor();
  assert.equal(await cards.count(),2);
  await page.getByRole('link',{name:/NEXT PAGE/i}).click();
  await checkParams(page,{view:'list',cursor:'ci-page-2'});
  await page.getByRole('heading',{name:'No additional releases on this page.'}).waitFor();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'discover-page-end-'+width+'.png'),fullPage:true,animations:'disabled',timeout:90000});
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'SYNTHETIC ORBIT GAME',exact:true}).waitFor();
  const refreshedSearch=discovery.locator('.p136-discover-search-form').getByRole('searchbox',{name:'Search published projects'});
  await refreshedSearch.fill('unknown-discovery');
  await refreshedSearch.press('Enter');
  await checkParams(page,{q:'unknown-discovery',cursor:null,view:'list'});
  await page.getByRole('heading',{name:'No matching projects yet.'}).waitFor();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'discover-no-matches-'+width+'.png'),fullPage:true,animations:'disabled',timeout:90000});
  published=false;
  await discovery.getByRole('link',{name:/Clear filters/}).click();
  await checkParams(page,{view:'list',q:null,category:null,cursor:null});
  await page.getByRole('heading',{name:'No approved projects yet.'}).waitFor();
  assert.equal(await cards.count(),0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(destination,'discover-no-public-'+width+'.png'),fullPage:true,animations:'disabled',timeout:90000});
  assert.deepEqual(errors,[],'No runtime page errors at '+width);
  report.widths.push({width,initial,screenshots:6,networkReads:requests.length,checks:'PASS'});
  console.log('PASS Discover public URL/grid/list at '+width+'px: '+JSON.stringify(initial));
  await context.close();
 }
 assert.deepEqual(report.forbidden,[],'No external, private or write browser requests');
 report.status='PASS';
} catch(error){
 report.status='FAIL';report.error=String(error?.stack||error);
 throw error;
} finally {
 writeFileSync(join(destination,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
