/** Real compiled React UI; anonymous empty/error fixtures only, confined to loopback. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const production=process.argv.includes('--production');
const prefix=production?'':'/creator';
const preview=production?null:(await import('../web/v136-visual-review.worker.mjs')).default;
const {chromium}=createRequire(import.meta.url)('playwright');
const build=resolve(production?'creator-v1/dist/web':'creator-v1/dist/react-staging');
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
 const result=production?await ASSETS.fetch(incoming):await preview.fetch(incoming,{ASSETS});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
 catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let success=false;
async function context(width,{motion='reduce',saveData=false,brokenMedia=false,apiError=false,withoutRandomUUID=false}={}){
 const ctx=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:1,reducedMotion:motion});
 if(withoutRandomUUID)await ctx.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:undefined}));
 if(saveData)await ctx.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}}));
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin||!['GET','HEAD'].includes(req.method())){forbidden.push({url:req.url(),method:req.method()});return route.abort();}
  const path=production?url.pathname:url.pathname.replace(/^\/creator/,'');
  if(brokenMedia&&/\/review-001\/.*\.(webp|mp4|webm)$/.test(path))return route.fulfill({status:404,body:'Intentional media failure fixture'});
  if(path==='/upload/v3/api/v1/packages/projects')return route.fulfill({status:apiError?503:200,contentType:'application/json',body:JSON.stringify(apiError?{error:'Intentional offline package fixture'}:{projects:[]})});
  if(path.startsWith('/upload/'))return route.fulfill({status:404,contentType:'application/json',body:'{"error":"Private uploader unavailable in public loopback fixture"}'});
  if(path.startsWith('/api/')){
   if(path.startsWith('/api/v1/member/'))return route.fulfill({status:403,contentType:'application/json',body:'{"error":"visual-review-no-accounts"}'});
   if(/^\/api\/v1\/(projects|creators)\/baseline-unavailable$/.test(path))return route.fulfill({status:404,contentType:'application/json',body:'{"error":"not-found"}'});
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
 const g=await page.evaluate(()=>{
  const style=getComputedStyle(document.documentElement);
  const token=name=>style.getPropertyValue(name).trim().toLowerCase();
  const rect=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,width:r.width}:null};
  const surfaces={};
  for(const selector of ['.p136-community .ch7-hero','.p136-boards .cnb-hero','.p136-creators-search','.st-status','.field-guide-page .portal-page-heading','.field-guide-page .guide-training-hero','.start-journey','.start-portals','.start-journey-detail','.p136-discover-main','.join-panel','.state-card']){
   const node=document.querySelector(selector);if(!node)continue;
   const s=getComputedStyle(node);surfaces[selector]={background:s.backgroundImage,color:s.backgroundColor};
  }
  const primary=document.querySelector('.p136-community .ch7-button-primary');
  const guide=document.querySelector('.field-guide-page .portal-page-heading-copy h1 em');
  let guideText=null;
  if(guide){const range=document.createRange();range.selectNodeContents(guide);const r=range.getBoundingClientRect();const box=guide.closest('.portal-page-heading').getBoundingClientRect();guideText={right:r.right,left:r.left,containerRight:box.right,containerLeft:box.left};}
  return {width:innerWidth,scroll:document.documentElement.scrollWidth,
   primary:primary?{background:getComputedStyle(primary).backgroundImage,color:getComputedStyle(primary).color}:null,guideText,
   header:rect('.p136-header'),rail:rect('.p136-console-wayfinder'),surfaces,
   canvas:document.querySelectorAll('.p136-living-canvas').length,
   logo:document.querySelectorAll('[data-anevum-mark="orbital-underground"]').length,
   palette:{void:token('--av-void'),text:token('--av-text'),
    copper:token('--av-copper'),violet:token('--av-violet'),ice:token('--av-ice')}};
 });
 assert.ok(g.scroll<=g.width+1,JSON.stringify(g));assert.equal(g.canvas,0);assert.ok(g.logo>0);
 assert.deepEqual(g.palette,{void:'#07060b',text:'#efe6da',
  copper:'#d2a57f',violet:'#b49bce',ice:'#a8cbd2'},
  'V136 public pages must use the same computed Continuance theme');
 if(g.width>=1280&&g.header&&g.rail)assert.ok(g.rail.top>=g.header.bottom+8,'Desktop Wayfinder must clear the review banner and header: '+JSON.stringify(g));
 for(const [selector,surface] of Object.entries(g.surfaces)){
  assert.ok(surface.background.includes('35, 26, 41')||surface.color==='rgb(16, 13, 22)',selector+' must render the Continuance material, not only inherit unused root tokens: '+JSON.stringify(surface));
 }
 if(g.primary){assert.ok(g.primary.background.includes('242, 228, 211'),'Commons primary button must retain its light surface');assert.equal(g.primary.color,'rgb(21, 14, 23)');}
 if(g.guideText)assert.ok(g.guideText.right<=g.guideText.containerRight-8&&g.guideText.left>=g.guideText.containerLeft,'Field Guide text must fit inside the clipped heading: '+JSON.stringify(g.guideText));
 return g;
}
try{
 for(const width of [320,390,768,1440,1920]){
  const {ctx,page}=await context(width);
  for(const [name,path] of [['arrival','/'],['discover','/discover'],['creators','/creators'],['commons','/community'],['studio-guest','/studio'],['guide','/guide'],['boards','/boards'],['start','/start'],['status','/status'],['join','/join'],['member-guest','/member'],['project-unavailable','/projects/baseline-unavailable'],['creator-unavailable','/creators/baseline-unavailable']]){
   await page.goto(origin+prefix+path,{waitUntil:'domcontentloaded'});
   await page.locator('main').waitFor();
   await page.locator('main').getByRole('heading').first().waitFor();
   if(name==='boards')await page.locator('#cnb-heading').waitFor();
   if(name==='discover')await page.locator('.p136-discover-empty').waitFor();
   if(name==='creators')await page.locator('.p136-creators-empty').waitFor();
   if(name==='start')await page.waitForFunction(()=>document.querySelector('.start-catalogue-proof')?.textContent?.includes('published projects'));

   assert.ok(await page.locator('main').innerText());
   const g=await geometry(page);
   if(name==='arrival'){
    if(production){
     assert.equal(await page.locator('[data-art-status="native-fallback"]').count(),1);
     assert.equal(await page.locator('.p136-cinematic-art,video').count(),0,'Unapproved review imagery/video never mount publicly');
    }else{
     await page.locator('.p136-cinematic-art img').waitFor();
     assert.equal(await page.locator('video').count(),0,'Reduced motion must not mount video');
     assert.ok(await page.locator('.p136-cinematic-art img').evaluate(n=>n.complete&&n.naturalWidth>0));
    }
    await page.getByRole('link',{name:'Explore projects',exact:true}).click();
    assert.match(page.url(),/\/discover/);await page.goBack({waitUntil:'domcontentloaded'});await page.locator('#p136-hero-title').waitFor();
   }
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:join(output,`${name}-${width}.png`),fullPage:false});
   if(name==='start'){
    await page.getByRole('button',{name:/I MAKE THINGS/}).click();
    assert.equal(await page.getByRole('button',{name:/I MAKE THINGS/}).getAttribute('aria-pressed'),'true');
    const detail=page.locator('.start-journey-detail');
    assert.equal(await detail.getByRole('link',{name:/EXPLORE CREATOR STUDIO/}).getAttribute('href'),prefix+'/studio');
    assert.equal(await page.locator('.start-choice-active').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(59, 43, 65)');
    await geometry(page);
    await detail.scrollIntoViewIfNeeded();
    await page.screenshot({path:join(output,`start-selected-${width}.png`),fullPage:false,timeout:90000});
   }
   if(name==='guide'){
    const next=page.getByRole('button',{name:/NEXT DECISION/});
    assert.equal(await next.isDisabled(),true,'Practice progress requires a correct answer');
    await page.getByRole('button',{name:/Invent a creator name to search/}).click();
    await page.getByText('THINK IT THROUGH.',{exact:true}).waitFor();
    assert.equal(await next.isDisabled(),true,'An incorrect answer cannot advance practice');
    assert.equal(await page.locator('.guide-feedback').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(48, 34, 25)');
    await page.getByRole('button',{name:/Explore the Games category/}).click();
    await page.getByText('GOOD DECISION.',{exact:true}).waitFor();
    assert.equal(await next.isEnabled(),true);
    assert.equal(await page.locator('.guide-feedback').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(24, 39, 31)');
    await page.locator('.guide-feedback').scrollIntoViewIfNeeded();
    await page.screenshot({path:join(output,`guide-feedback-${width}.png`),fullPage:false,timeout:90000});
    await next.click();
    await page.getByRole('heading',{name:/A project lists a hosted demo/}).waitFor();
    assert.equal(await next.isDisabled(),true,'The next decision starts without a reused answer');
   }
   checks.push({name,width,...g});
  }
  await ctx.close();
 }
 // Real owner-review media checks remain separate from the production fallback.
 if(!production){
  const {ctx,page}=await context(1440,{motion:'no-preference'});
  await page.goto(origin+prefix+'/',{waitUntil:'networkidle'});
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
 for(const [name,options] of (production?[['api-error',{apiError:true}]]:[['save-data',{motion:'no-preference',saveData:true}],['media-failure',{motion:'no-preference',brokenMedia:true}],['api-error',{apiError:true}]])){
  const {ctx,page}=await context(390,options);
  await page.goto(origin+prefix+'/',{waitUntil:'networkidle'});await geometry(page);
  if(name!=='api-error'){
   await page.waitForFunction(()=>!document.querySelector('video'));
   assert.equal(await page.locator('video').count(),0);
  }
  await page.getByRole('link',{name:'Explore projects',exact:true}).click();assert.match(page.url(),/\/discover/);
  checks.push({name});await ctx.close();
 }
 {
  const {ctx,page}=await context(390,{withoutRandomUUID:true});
  await page.goto(origin+prefix+'/community',{waitUntil:'networkidle'});
  await page.locator('#ch7-hero-title').waitFor();await geometry(page);
  checks.push({name:'public-commons-without-randomUUID'});await ctx.close();
 }
 if(production){
  assert.equal(existsSync(join(build,'assets/cinematic-v136/arrival/review-001')),false);
  for(const file of ['assets/site-v136-005/favicon.svg','assets/site-v136-005/site.webmanifest','assets/default-thumbnails/v136-baseline-005/games.svg'])assert.equal(existsSync(join(build,file)),true);
  checks.push({name:'production-art-exclusion-and-versioned-static-assets'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);success=true;
}finally{
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({status:success?'PASS':'FAIL',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeDirty:Boolean(execFileSync('git',['status','--porcelain','--untracked-files=all','--','.',':(exclude)evidence/**'],{encoding:'utf8'}).trim()),scope:production?'production-mode compiled frontend with read-only loopback fixtures; no provider writes or physical-device certification':'compiled read-only preview with empty/error loopback fixtures; Chromium CSS viewport emulation, not physical iPhone/Safari/Xbox',checks,errors,forbidden},null,2));
 await browser.close();await new Promise(done=>server.close(done));
}
