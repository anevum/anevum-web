/** Isolated QA-only staging build with REAL original optimized Blender GLB.
 * Test never sends credentials, alters production or interprets browser pixels as a public deployment.
 * Requires: staged manifest+GLB copied into creator-v1/web/public/assets/cinematic-v136/stage
 * and a build made with VITE_PARITY_V136_SHARED_SCENE_QA=true.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)('playwright');
const dir=resolve('creator-v1/dist/web');
const out=resolve('evidence/parity-v136/cinematic-shared-stage');
mkdirSync(out,{recursive:true});
assert.equal(process.env.VITE_PARITY_V136_SHARED_SCENE_QA,'true','Test must run only in isolated opted-in QA build');
assert.ok(existsSync(join(dir,'assets/cinematic-v136/stage/manifest.json')),'No QA authored source manifest');
const manifest=JSON.parse(readFileSync(join(dir,'assets/cinematic-v136/stage/manifest.json'),'utf8'));
assert.equal(manifest.status,'UNREVIEWED_QA_ONLY');
assert.equal(manifest.approvedForProduction,false);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.json':'application/json','.woff2':'font/woff2'};
const badRequests=[],pageErrors=[];
const server=createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400);res.end();return}
 let file=resolve(dir,'.'+pathname);
 if(file!==dir&&!file.startsWith(dir+sep)){res.writeHead(403);res.end();return}
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return}
  file=join(dir,'index.html');
 }
 res.writeHead(200,{
  'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store',
  ...(extname(file)==='.html'?{'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; frame-src 'self'"}:{})
 });
 res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},
   deviceScaleFactor:1,reducedMotion:'no-preference'});
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base||!['GET','HEAD'].includes(request.method())){
    badRequests.push({method:request.method(),url:request.url()});
    await route.abort();return;
   }
   if(url.pathname.startsWith('/api/')){
    const path=url.pathname;
    const body=path==='/api/v1/status'?
      {features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
      path==='/api/v1/categories'?{categories:[]}:
      path==='/api/v1/projects'||path==='/api/v1/creators'?{items:[],count:0,nextCursor:null}:
      null;
    await route.fulfill({status:body===null?404:200,contentType:'application/json',
      body:JSON.stringify(body??{error:'QA fixture route unavailable'})});return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.p136-hero').waitFor();
  await page.waitForFunction(()=>{
   const canvas=document.querySelector('.p136-living-canvas');
   return canvas?.dataset.cinemaStage==='ready'&&canvas?.dataset.assetState==='ready';
  },null,{timeout:60000});
  // Mesh readiness precedes the existing 1-second opacity/draw transition.
  // Sample stable geometry rather than temporarily double-drawn materials.
  await page.waitForTimeout(1800);
  const start=await page.evaluate(()=>{
   const canvas=document.querySelector('.p136-living-canvas');
   const world=document.querySelector('.p136-living-world');
   const cinema=document.querySelector('[data-cinematic-v136]');
   const main=document.querySelector('.p136-button--primary');
   return {renderer:world?.dataset.renderer,model:canvas?.dataset.cinemaStage,
    asset:canvas?.dataset.assetState,cameraRevision:canvas?.dataset.cinemaRevision,
    cameraProgress:Number(canvas?.dataset.cinemaCameraProgress||0),
    modelBudget:JSON.parse(canvas?.dataset.metrics||'{}'),
    cinema:cinema?.dataset.mode,mediaCount:document.querySelectorAll('video').length,
    canvasCount:document.querySelectorAll('.p136-living-canvas').length,
    controlsVisible:Boolean(main&&main.getBoundingClientRect().width>80)};
  });
  assert.equal(start.renderer,'webgl','One real three.js renderer');
  assert.equal(start.model,'ready','Exact hash-validated original shared GLB');
  assert.equal(start.cameraRevision,'continuance-stage-v136016-001');
  assert.equal(start.canvasCount,1,'Never create a competing WebGL context');
  assert.ok(start.cameraProgress>=0&&start.cameraProgress<=1,'Bounded source camera scrub');
  assert.ok(start.modelBudget.models>=1,'Real model is loaded');
  assert.ok(start.modelBudget.triangles>10000,'Staged GLB not replaced by empty scene');
  assert.equal(start.modelBudget.family,'atrium','Camera and geometry belong to the same route');
  assert.equal(start.mediaCount,0,'No reviewed cinematic video or autoplay');
  assert.equal(start.cinema,'poster','No media approvals were invented');
  assert.ok(start.controlsVisible,'The real Discover action remains usable');
  console.log('OBSERVED_STAGE_METRICS '+JSON.stringify({width,model:start.model,metrics:start.modelBudget}));
  assert.ok(start.modelBudget.drawCalls<=65,
   'Staged authoring must not destroy GPU draw-call budget: '+JSON.stringify(start.modelBudget));
  assert.ok(start.modelBudget.triangles<=200000,'Staged geometry must be bounded');
  const capture=async name=>{
   const png=await page.locator('.p136-living-canvas').screenshot({animations:'disabled'});
   writeFileSync(join(out,name),png);
   return createHash('sha256').update(png).digest('hex');
  };
  const first=await capture('shared-scene-'+width+'-arrival.png');
  await page.evaluate(()=>window.scrollTo(0,Math.min(400,document.querySelector('.p136-hero').getBoundingClientRect().height*.7)));
  await page.waitForFunction(()=>Number(document.querySelector('.p136-living-canvas')?.dataset.cinemaCameraProgress||0)>.15);
  const second=await capture('shared-scene-'+width+'-crossing.png');
  assert.notEqual(first,second,'QA camera must render distinct real frames, not replace CSS opacity');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('.p136-button--primary').click();
  await page.waitForURL(/\/discover(?:\?|$)/);
  assert.equal(await page.locator('.p136-living-canvas').count(),1);
  const result={width,sourceSha256:manifest.sourceReviewGeometrySha256,
   assetBytes:manifest.variants[width<850?'mobile':'desktop'].bytes,
   cameraProgressObserved:true,singleContext:true,navigationWorked:true,
   firstScreenshotHash:first,crossingScreenshotHash:second,
   runtime:start.modelBudget,errors:pageErrors};
  writeFileSync(join(out,'result-'+width+'.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS QA shared cinematic Atrium '+JSON.stringify(result));
  await context.close();
 }
 assert.deepEqual(badRequests,[],'No origin escape or network/service calls');
 assert.deepEqual(pageErrors,[],'No browser JS errors');
}finally{await browser.close();await new Promise(done=>server.close(done))}
