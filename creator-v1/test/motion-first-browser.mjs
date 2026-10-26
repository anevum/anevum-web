/** Real compiled React UI; anonymous empty/error fixtures only, confined to loopback. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import preview from '../web/v136-visual-review.worker.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const build=resolve('creator-v1/dist/react-staging');
const output=resolve(process.env.MOTION_QA_OUTPUT||'evidence/owner-v136/responsive');
mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json'};
const errors=[],forbidden=[],checks=[];
const ASSETS={async fetch(request){
 const url=new URL(request.url);let file=resolve(build,'.'+url.pathname);
 if(!file.startsWith(build+sep)&&file!==build)return new Response('Denied',{status:403});
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file))return new Response('Missing',{status:404});
  file=join(build,'index.html');
 }
 const data=readFileSync(file);const headers={'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'};
 const range=request.headers.get('range');
 if(range&&/bytes=\d+-\d*/.test(range)){
  const [,start,end]=range.match(/bytes=(\d+)-(\d*)/);const a=Number(start),b=end?Math.min(Number(end),data.length-1):data.length-1;
  return new Response(data.subarray(a,b+1),{status:206,headers:{...headers,'content-range':`bytes ${a}-${b}/${data.length}`,'accept-ranges':'bytes'}});
 }
 return new Response(data,{headers});
}};
const server=createServer(async(req,res)=>{
 try{const incoming=new Request('https://anevum-v136-visual-review-001.devonakins.workers.dev'+req.url,{method:req.method,headers:req.headers});
 const result=await preview.fetch(incoming,{ASSETS});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
 catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let success=false;
async function context(width,{motion='reduce',saveData=false,brokenMedia=false,apiError=false}={}){
 const ctx=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:1,reducedMotion:motion});
 if(saveData)await ctx.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}}));
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin||!['GET','HEAD'].includes(req.method())){forbidden.push({url:req.url(),method:req.method()});return route.abort();}
  const path=url.pathname.replace(/^\/creator/,'');
  if(brokenMedia&&/\/review-001\/.*\.(webp|mp4|webm)$/.test(path))return route.fulfill({status:404,body:'Intentional media failure fixture'});
  if(path.startsWith('/api/')){
   if(path.startsWith('/api/v1/member/'))return route.fulfill({status:403,contentType:'application/json',body:'{"error":"visual-review-no-accounts"}'});
   const page={items:[],count:0,nextCursor:null};
   const value=path==='/api/v1/status'?{version:'loopback-empty-fixture',phase:'testing',features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
    path==='/api/v1/categories'?{categories:[]}:
    path==='/api/v1/boards'?{source:'approved-public-projects',qualityRankingAvailable:false,labels:{latestReleases:'Latest releases',firstLooks:'First looks',publishingCreators:'Publishing creators'},latestReleases:[],firstLooks:[],publishingCreators:[]}:
    /\/community\//.test(path)?{...page,sort:'new'}:page;
   return route.fulfill({status:apiError?503:200,contentType:'application/json',body:JSON.stringify(apiError?{error:'Intentional offline fixture'}:value)});
  }
  return route.continue();
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));return {ctx,page};
}
async function geometry(page){
 const g=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelectorAll('.p136-living-canvas').length,
  logo:document.querySelectorAll('[data-anevum-mark="orbital-underground"]').length}));
 assert.ok(g.scroll<=g.width+1,JSON.stringify(g));assert.equal(g.canvas,0);assert.ok(g.logo>0);return g;
}
try{
 for(const width of [320,390,768,1440,1920]){
  const {ctx,page}=await context(width);
  for(const [name,path] of [['arrival','/'],['discover','/discover'],['creators','/creators'],['commons','/community'],['studio-guest','/studio'],['guide','/guide'],['boards','/boards']]){
   await page.goto(origin+'/creator'+path,{waitUntil:'networkidle'});
   await page.locator('main').waitFor();
   assert.ok(await page.locator('main').innerText());
   const g=await geometry(page);
   if(name==='arrival'){
    await page.locator('.p136-cinematic-art img').waitFor();
    assert.equal(await page.locator('video').count(),0,'Reduced motion must not mount video');
    assert.ok(await page.locator('.p136-cinematic-art img').evaluate(n=>n.complete&&n.naturalWidth>0));
    await page.getByRole('link',{name:'Explore projects',exact:true}).click();
    assert.match(page.url(),/\/discover/);await page.goBack({waitUntil:'networkidle'});
   }
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:join(output,`${name}-${width}.png`),fullPage:false});
   checks.push({name,width,...g});
  }
  await ctx.close();
 }
 // Real native video, one only; pause control, offscreen release and Save-Data.
 {
  const {ctx,page}=await context(1440,{motion:'no-preference'});
  await page.goto(origin+'/creator/',{waitUntil:'networkidle'});
  try{await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.readyState>=2;});}
  catch(error){checks.push({name:'video-failure-diagnostic',detail:await page.evaluate(()=>({surface:document.querySelector('[data-cinematic-v136]')?.dataset,media:[...document.querySelectorAll('video')].map(v=>({source:v.currentSrc,ready:v.readyState,paused:v.paused,error:v.error?.message}))}))});throw error;}
  assert.equal(await page.locator('video').count(),1);
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(()=>!document.querySelector('video'));
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.readyState>=2;});
  await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
  await page.getByRole('button',{name:'Atmospheric animation',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('video'));
  checks.push({name:'native-video-play-and-pause'});await ctx.close();
 }
 for(const [name,options] of [['save-data',{motion:'no-preference',saveData:true}],['media-failure',{motion:'no-preference',brokenMedia:true}],['api-error',{apiError:true}]]){
  const {ctx,page}=await context(390,options);
  await page.goto(origin+'/creator/',{waitUntil:'networkidle'});await geometry(page);
  if(name!=='api-error'){
   await page.waitForFunction(()=>!document.querySelector('video'));
   assert.equal(await page.locator('video').count(),0);
  }
  await page.getByRole('link',{name:'Explore projects',exact:true}).click();assert.match(page.url(),/\/discover/);
  checks.push({name});await ctx.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);success=true;
}finally{
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({status:success?'PASS':'FAIL',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'compiled read-only preview with empty/error loopback fixtures; Chromium CSS viewport emulation, not physical iPhone/Safari/Xbox',checks,errors,forbidden},null,2));
 await browser.close();await new Promise(done=>server.close(done));
}
