/** V137: actual compiled Wayfinder focus, route and search handoff.
 * CI-only anonymous loopback. No worker deployment, login, write, fake awards
 * or requests outside this origin. Browser assertions are source stamped.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const build=resolve('creator-v1/dist/web');
const out=resolve(process.env.ANEVUM_WAYFINDER_OUTPUT||'evidence/v137-wayfinder');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp',
 '.woff2':'font/woff2','.json':'application/json','.glb':'model/gltf-binary'};
assert.ok(existsSync(join(build,'index.html')),'Compiled current frontend required');
mkdirSync(out,{recursive:true});
const receipt={contract:'v137-wayfinder-compiled-anonymous-browser',
 source:process.env.ANEVUM_SOURCE_SHA||null,syntheticOnly:true,
 remoteRequests:[],writes:[],errors:[],results:[],status:'INCOMPLETE'};
const server=createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
 catch{res.writeHead(400);res.end();return;}
 let file=resolve(build,'.'+pathname);
 if(file!==build&&!file.startsWith(build+sep)){res.writeHead(403);res.end();return;}
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return;}
  file=join(build,'index.html');
 }
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
 'cache-control':'no-store',
 ...(extname(file)==='.html'?{'content-security-policy':
 "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"}:{})});
 res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width<650?844:960},deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==='webgl2'?null:original.call(this,kind,...args);
   };
  });
  const page=await context.newPage();
  page.setDefaultTimeout(18000);
  page.on('pageerror',e=>receipt.errors.push({width,message:String(e)}));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base){receipt.remoteRequests.push({width,url:request.url()});await route.abort();return;}
   if(!['GET','HEAD'].includes(request.method())){receipt.writes.push({width,url:request.url(),method:request.method()});await route.abort();return;}
   if(!url.pathname.startsWith('/api/')){await route.continue();return;}
   const path=url.pathname;
   const content=path==='/api/v1/member/auth/get-session'?null:
     path==='/api/v1/status'?{phase:'anonymous-qa',features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
     path==='/api/v1/projects'||path==='/api/v1/creators'||
       path==='/api/v1/community/members'||path==='/api/v1/community/activity'||path==='/api/v1/community/threads'?
       {items:[],count:0,nextCursor:null}:null;
   await route.fulfill({status:content===null&&path!=='/api/v1/member/auth/get-session'?404:200,
    contentType:'application/json',body:JSON.stringify(content??(path==='/api/v1/member/auth/get-session'?null:{error:'Unavailable in loopback'}))});
  });
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const trigger=page.getByRole('button',{name:'Open site navigation',exact:true});
  await trigger.waitFor();
  await trigger.click();
  await page.locator('#av79-navigation[open]').waitFor();
  await page.getByRole('button',{name:'Close navigation',exact:true}).press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#av79-navigation')?.open);
  assert.equal(await trigger.evaluate(node=>node===document.activeElement),true,'Escape returns focus to menu trigger '+width);
  await trigger.click();
  await page.locator('#av79-navigation[open]').waitFor();
  await page.locator('#av79-navigation a.av79-destination[href="/discover"]').click();
  await page.waitForURL(base+'/discover');
  await page.waitForFunction(()=>!document.querySelector('#av79-navigation')?.open&&document.activeElement?.id==='main');
  assert.equal(await page.locator('main#main').count(),1,'Exactly one main landmark '+width);
  await trigger.click();
  await page.locator('#av79-navigation[open]').waitFor();
  await page.locator('#av79-navigation .av79-navigation-search').click();
  await page.locator('.portal-launcher[open]').waitFor();
  await page.waitForFunction(()=>document.activeElement?.matches('.portal-launcher input[type="search"]'));
  const input=page.locator('.portal-launcher input[type="search"]');
  await input.fill('no real creator in this fixture');
  await page.locator('.portal-launcher-live-status').getByText(/DIRECT MATCHES FROM THE PUBLIC DIRECTORY/).waitFor();
  assert.equal(await page.locator('.portal-launcher-result').filter({hasText:'SYNTHETIC CREATOR'}).count(),0);
  await page.screenshot({path:join(out,'wayfinder-'+width+'.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Close quick navigation',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.portal-launcher')?.open);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No overflow '+width);
  receipt.results.push({width,escapeFocus:true,destinationFocus:true,searchFocus:true,noSyntheticEntries:true,overflow:false});
  console.log('PASS Wayfinder V137 '+width);
  await context.close();
 }
 assert.deepEqual(receipt.remoteRequests,[],'No outbound network');
 assert.deepEqual(receipt.writes,[],'No writes');
 assert.deepEqual(receipt.errors,[],'No page errors');
 receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.error=String(error?.stack||error);throw error}
finally{
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(receipt,null,2)+'\n');
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
