/**
 * First-party portfolio cinematic UI browser acceptance.
 * Never contacts live ANEVUM or external services; captures a static working
 * page with its actual checked-in images, fonts, JS and CSS on loopback only.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep, join } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve('creator-v1/web/public');
const output = resolve(process.env.PORTFOLIO_QA_OUTPUT || 'evidence/portfolio-cinematic-v1');
const checks = [], errors = [], forbidden = [];
mkdirSync(output, {recursive:true});
const mime = {
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml',
  '.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png',
  '.woff':'font/woff','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm'
};
const server = createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  let uri;try{uri=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);res.end();return;}
  let path;
  try {path=decodeURIComponent(uri.pathname);}catch{res.writeHead(400);res.end();return;}
  if (path === '/portfolio' || path === '/portfolio/') path='/portfolio/index.html';
  const file=resolve(root, '.'+path);
  if (!file.startsWith(root+sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);res.end();return;
  }
  res.writeHead(200, {
    'content-type':mime[extname(file)]||'application/octet-stream',
    'cache-control':'no-store',
    'content-security-policy':"default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"
  });
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const note=(name,data={})=>{checks.push({name,...data});console.log('PASS '+name);};
const failures=[];
async function run(width,height,motion='no-preference') {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:motion});
  await context.route('**/*',async route=>{
    const request=route.request();
    if (!request.url().startsWith(origin+'/') || !['GET','HEAD'].includes(request.method())) {
      forbidden.push({width,url:request.url(),method:request.method()});await route.abort();return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({width,type:'pageerror',message:e.message}));
  page.on('console',msg=>{if(msg.type()==='error')errors.push({width,type:'console',message:msg.text()});});
  page.on('response',response=>{
    if(response.status()>=400) errors.push({width,type:'http',status:response.status(),url:response.url()});
  });
  await page.goto(origin+'/portfolio/',{waitUntil:'networkidle',timeout:45000});
  await page.locator('#hero-title').waitFor({state:'visible'});
  const title=await page.locator('#hero-title').innerText();
  assert.match(title,/I BUILD/i);
  const shape=await page.evaluate(()=>{
    const el=document.documentElement;
    const hero=document.querySelector('#hero-title').getBoundingClientRect();
    const intro=document.querySelector('.hero-description').getBoundingClientRect();
    const button=document.querySelector('.hero-buttons .button').getBoundingClientRect();
    const header=document.querySelector('.site-header').getBoundingClientRect();
    const offenders = [...document.body.querySelectorAll('*')].map(element=>({element,box:element.getBoundingClientRect()})).filter(entry=>entry.box.width>0&&entry.box.right>innerWidth+1&&entry.box.left>=-2).slice(0,18).map(({element,box})=>({tag:element.tagName,cls:String(element.className||'').slice(0,80),id:element.id,right:Math.round(box.right),left:Math.round(box.left),width:Math.round(box.width),position:getComputedStyle(element).position}));
    const footer=document.querySelector('.hero-footer').getBoundingClientRect();
    return {scrollWidth:el.scrollWidth,viewport:innerWidth,offenders,hero:{x:hero.x,y:hero.y,right:hero.right,bottom:hero.bottom},intro:{x:intro.x,right:intro.right},button:{x:button.x,right:button.right,y:button.y},footer:{top:footer.top,bottom:footer.bottom},headerBottom:header.bottom,mainCount:document.querySelectorAll('main').length,sculptures:document.querySelectorAll('canvas').length};
  });
  assert.ok(shape.scrollWidth <= shape.viewport + 1, 'overflow '+width+': '+JSON.stringify(shape));
  assert.equal(shape.mainCount,1);
  assert.equal(shape.sculptures,1,'exactly one authored three-dimensional field, no duplicate sculptures');
  assert.ok(shape.hero.x>=-1 && shape.hero.right<=width+1,'hero headline clipped at '+width+': '+JSON.stringify(shape));
  assert.ok(shape.intro.x>=-1 && shape.intro.right<=width+1,'intro copy clipped '+width);
  assert.ok(shape.hero.y>=shape.headerBottom-1,'header obscures hero at '+width);
  assert.ok(shape.button.x>=-1 && shape.button.right<=width+1,'hero CTA clipped at '+width);
  // Transcosmic V136.040: verify actual GPU geometry and a working camera
  // journey, not just a CSS gradient or an autoplay video.
  const universe=page.locator('[data-transcosmic-field]');
  await page.waitForFunction(()=>['webgl2','fallback'].includes(document.querySelector('[data-transcosmic-field]')?.dataset.renderMode),null,{timeout:45000});
  const firstMode=await universe.getAttribute('data-render-mode');
  const firstDepth=await universe.getAttribute('data-scene-depth');
  assert.equal(firstMode,'webgl2','Source-pinned Chromium with software WebGL must render actual 3D at '+width);
  assert.equal(firstDepth,'perspective','Deep field must use real perspective geometry');
  const pixels=Number(await universe.getAttribute('data-render-pixels'));
  assert.ok(pixels>0&&pixels<=1650000+1,'Bounded viewport pixels at '+width+': '+pixels);
  assert.equal(await page.locator('canvas[data-depth-canvas]').count(),1);
  assert.equal(await page.locator('.institute-backdrop').getAttribute('src'),'/portfolio/assets/transcosmic-continuum.svg');
  const initialState=await page.locator('[data-universe-stage="0"]').getAttribute('aria-pressed');
  assert.equal(initialState,'true');
  assert.equal(await universe.getAttribute('data-render-realm'),'threshold','Initial portal occupies threshold geometry');
  const thresholdVertices=Number(await universe.getAttribute('data-realm-vertices'));
  assert.ok(thresholdVertices>10000,'Threshold is true three-dimensional geometry');
  await page.screenshot({path:join(output,'transcosmic-hero-'+width+'-'+motion+'.png'),animations:'disabled'});
  await page.locator('[data-universe-stage="1"]').click();
  assert.equal(await page.locator('[data-universe-stage="1"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-universe-name]').innerText(),'THE ARCHIVE');
  await page.waitForFunction(()=>Number(document.querySelector('[data-transcosmic-field]')?.dataset.cameraTravel)>.30,
    null,{timeout:30000});
  const archiveTravel=Number(await universe.getAttribute('data-camera-travel'));
  assert.equal(await universe.getAttribute('data-render-realm'),'archive',
    'Archive must draw its own separate GPU geometry, not recolor the tunnel');
  const archiveVertices=Number(await universe.getAttribute('data-realm-vertices'));
  assert.ok(archiveVertices>3000 && archiveVertices!==thresholdVertices,'Archive has real distinct mesh');
  await page.screenshot({path:join(output,'transcosmic-archive-'+width+'.png'),animations:'disabled'});
  await page.locator('[data-universe-stage="2"]').click();
  assert.equal(await page.locator('[data-universe-name]').innerText(),'THE CONTINUUM');
  await page.waitForFunction(()=>Number(document.querySelector('[data-transcosmic-field]')?.dataset.cameraTravel)>.70,
    null,{timeout:30000});
  const beyondTravel=Number(await universe.getAttribute('data-camera-travel'));
  assert.equal(await universe.getAttribute('data-render-realm'),'beyond',
    'Beyond must draw real planetary-space geometry, not repeat the same tunnel');
  const beyondVertices=Number(await universe.getAttribute('data-realm-vertices'));
  assert.ok(beyondVertices>1000 && beyondVertices!==archiveVertices && beyondVertices!==thresholdVertices,
    'All three destinations have their own 3D mesh');
  assert.ok(beyondTravel>archiveTravel,'Viewport camera must actually travel through 3D space');
  await page.screenshot({path:join(output,'transcosmic-beyond-'+width+'.png'),animations:'disabled'});
  await page.locator('[data-universe-stage="0"]').click();
  await page.locator('[data-universe-stage="1"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-universe-stage="1"]').getAttribute('aria-pressed'),'true',
    'Keyboard selection remains native and accessible');
  assert.equal(await page.locator('[data-universe-name]').innerText(),'THE ARCHIVE');
  await page.locator('[data-universe-stage="0"]').click();
  note('single GPU Transcosmic field / actual camera viewpoints / bounded pixels '+width,
    {mode:firstMode,sceneDepth:firstDepth,pixels,archiveTravel,beyondTravel,
      realmVertices:[thresholdVertices,archiveVertices,beyondVertices],reducedMotion:motion==='reduce'});
  // ANEVUM and Transcosmic are real principal projects, not two unequal
  // rows with a dead empty column on wide screens.
  const fullWidthWork=await page.evaluate(()=>{
    const anevum=document.querySelector('.project-anevum').getBoundingClientRect();
    const transcosmic=document.querySelector('.project-transcosmic').getBoundingClientRect();
    const visual=document.querySelector('.project-transcosmic .project-visual').getBoundingClientRect();
    return {anevumWidth:anevum.width,transcosmicWidth:transcosmic.width,
      visualHeight:visual.height,transcosmicRight:transcosmic.right};
  });
  assert.ok(Math.abs(fullWidthWork.anevumWidth-fullWidthWork.transcosmicWidth)<3,
    'Transcosmic must occupy the whole work row at '+width+': '+JSON.stringify(fullWidthWork));
  assert.ok(fullWidthWork.transcosmicRight<=width+1 &&
    fullWidthWork.visualHeight>=250,'Real project exhibit fits the viewport');
  note('full-width principal Transcosmic project / no empty portfolio row '+width,fullWidthWork);
  // A real screenshot review caught a full-width feature title clipped at the
  // desktop card boundary. Keep the title intact and contained at every width.
  const featureTitleFlow = await page.locator('.project-transcosmic .project-meta h3').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el.firstChild);
    const ink = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    const column = el.closest('.project-meta').getBoundingClientRect();
    const index = el.querySelector('span')?.getBoundingClientRect();
    return {lines:ink.length, left:Math.min(...ink.map(rect => rect.left)),
      right:Math.max(...ink.map(rect => rect.right)),columnRight:column.right,
      indexRight:index?.right ?? 0};
  });
  assert.equal(featureTitleFlow.lines,1,
    'Featured Transcosmic project title must not wrap at '+width+': '+JSON.stringify(featureTitleFlow));
  assert.ok(featureTitleFlow.left>=-1 &&
    featureTitleFlow.right <= featureTitleFlow.columnRight + 1 &&
    featureTitleFlow.indexRight <= featureTitleFlow.columnRight + 1,
    'Featured Transcosmic story/title must not clip out of its card at '+width+': '+JSON.stringify(featureTitleFlow));
  note('featured Transcosmic title fits case record column '+width,featureTitleFlow);

  note('layout '+width+'px',shape);
  // Reproduce actual reading/scrolling so lazy-loaded images and reveal states
  // are visible in full-page screenshots, instead of falsely appearing blank.
  const revealed = await page.evaluate(async () => {
    const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
    const prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const step=Math.max(300,Math.floor(innerHeight*0.75));
    for(let y=0;y<document.documentElement.scrollHeight;y+=step){
      scrollTo({top:y,behavior:'instant'});await sleep(110);
    }
    scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});await sleep(250);
    scrollTo({top:0,behavior:'instant'});await sleep(600);
    document.documentElement.style.scrollBehavior = prevBehavior;
    return {total:document.querySelectorAll('.reveal').length,visible:document.querySelectorAll('.reveal.visible').length};
  });
  if (motion!=='reduce') assert.ok(revealed.visible >= revealed.total-2, 'Missing scroll reveals: '+JSON.stringify(revealed));
  note('real scroll reveal '+width,revealed);
  await page.screenshot({path:join(output,'portfolio-'+width+'-'+motion+'.png'),fullPage:true,animations:'disabled'});
  // The author/worldbuilder hero entry opens the real existing case-story
  // dialog; no concept link or fake secondary route is introduced.
  await page.getByRole('button',{name:/Discover Transcosmic/i}).click();
  await page.locator('#project-dialog[open]').waitFor({state:'visible'});
  assert.match(await page.locator('#case-title').innerText(),/Transcosmic/i);
  await page.locator('.case-close').click();
  await page.locator('#project-dialog').waitFor({state:'hidden'});
  await page.locator('.project-hit[data-project="anevum"]').click();
  await page.locator('#project-dialog[open]').waitFor({state:'visible'});
  assert.match(page.url(),/project=anevum/);
  assert.match(await page.locator('#case-title').innerText(),/ANEVUM/i);
  await page.locator('[data-case-direction="1"]').click();
  assert.match(await page.locator('#case-title').innerText(),/Fold/i);
  assert.match(page.url(),/project=fold/);
  await page.locator('.case-close').click();
  await page.locator('#project-dialog').waitFor({state:'hidden'});
  await page.waitForURL(url => !new URL(url).searchParams.has('project'));
  assert.doesNotMatch(page.url(),/project=/);
  note('project story open/next/close '+width);

  // The convergence reel is a DOM storytelling chapter in Selected Work,
  // not an overlapping hero or another renderer.
  const dossier = page.locator('[data-portfolio-dossier]');
  assert.equal(await dossier.getAttribute('data-dossier-project'),'anevum');
  assert.equal(await page.locator('[data-dossier-select]').count(),4);
  assert.equal(await page.locator('canvas').count(),1);
  await page.locator('[data-dossier-select="rhen"]').click();
  assert.equal(await dossier.getAttribute('data-dossier-project'),'rhen');
  assert.equal(await dossier.getAttribute('data-dossier-kind'),'phone');
  assert.match(await page.locator('[data-dossier-proof]').innerText(),/NO LIVE TRADING/);
  assert.match(await page.locator('[data-dossier-image]').getAttribute('alt'),/no connected live trading account/);
  await page.locator('#dossier-open').click();
  await page.locator('#project-dialog[open]').waitFor({state:'visible'});
  assert.equal((await page.locator('#case-title').innerText()).toLowerCase(),'rhen');
  await page.locator('.case-close').click();
  // Element-scoped keyboard input establishes the actual native focus owner.
  // Mobile screenshot/scroll activity must not redirect End to a stale target.
  await page.locator('[data-dossier-select="fold"]').press('ArrowRight');
  assert.equal(await page.locator('[data-dossier-select="rhen"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-dossier-select="rhen"]').press('End');
  assert.equal(await dossier.getAttribute('data-dossier-project'),'transcosmic');
  assert.equal(await dossier.getAttribute('data-dossier-kind'),'art');
  assert.match(await page.locator('[data-dossier-proof]').innerText(),/NOT GAMEPLAY/);
  const titleFlow = await page.locator('[data-dossier-name]').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    const ink = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    const bounds = el.closest('.dossier-story').getBoundingClientRect();
    return {lines:ink.length, left:Math.min(...ink.map(x => x.left)),right:Math.max(...ink.map(x => x.right)),containerRight:bounds.right};
  });
  assert.equal(titleFlow.lines,1,'Transcosmic project title must never split between letters at '+width+': '+JSON.stringify(titleFlow));
  assert.ok(titleFlow.left >= -1 && titleFlow.right <= titleFlow.containerRight + 1,
    'Transcosmic project title must fit inside the editorial story column at '+width+': '+JSON.stringify(titleFlow));
  await page.locator('.dossier-body').screenshot({path:join(output,'portfolio-project-dossier-'+width+'.png'),animations:'disabled'});
  // Screenshot capture can move native focus; explicitly place focus on the
  // active selector before testing its keyboard Home shortcut.
  await page.locator('[data-dossier-select="transcosmic"]').focus();
  assert.equal(await page.locator('[data-dossier-select="transcosmic"]').evaluate(el => el === document.activeElement),true);
  await page.keyboard.press('Home');
  assert.equal(await dossier.getAttribute('data-dossier-project'),'anevum');
  assert.equal(await page.locator('[data-dossier-select="anevum"]').getAttribute('aria-pressed'),'true');
  note('converged project reel / keyboard chapters / existing real case story '+width);
  await page.locator('[data-process="make"]').click();
  assert.equal(await page.locator('#process-heading').innerText(),'Make something someone can use.');
  await page.locator('[data-process="verify"]').click();
  assert.equal(await page.locator('[data-process="verify"]').getAttribute('aria-pressed'),'true');
  note('interactive process '+width);
  await page.locator('[data-filter="product"]').click();
  assert.equal(await page.locator('.project:visible').count(),2);
  await page.locator('[data-filter="experience"]').click();
  assert.equal(await page.locator('.project:visible').count(),2);
  await page.locator('[data-filter="all"]').click();
  assert.equal(await page.locator('.project:visible').count(),4);
  note('project filters '+width);
  const motionInitial = await page.locator('#motion-toggle').getAttribute('aria-pressed');
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),motionInitial === 'true' ? 'false' : 'true');
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),motionInitial);
  note('motion toggle '+width);
  if (width<=850) {
    await page.locator('.mobile-nav summary').click();
    assert.equal(await page.locator('.mobile-nav').getAttribute('open'),'');
    await page.locator('.mobile-nav a[href="#about"]').click();
    assert.equal(await page.locator('.mobile-nav').getAttribute('open'),null);
    note('mobile menu '+width);
  }
  await page.goto(origin+'/portfolio/?project=rhen',{waitUntil:'domcontentloaded'});
  await page.locator('#project-dialog[open]').waitFor({state:'visible'});
  assert.equal((await page.locator('#case-title').innerText()).toLowerCase(),'rhen');
  await page.keyboard.press('Escape');
  await page.locator('#project-dialog').waitFor({state:'hidden'});
  note('direct case links / escape '+width);
  await context.close();
}

async function runWithoutWebGL(){
  // An explicit software-disabled context: the original authored SVG must
  // carry the actual page, not a blank canvas or a fake execution claim.
  const context=await browser.newContext({
    viewport:{width:390,height:844},reducedMotion:'reduce',deviceScaleFactor:1
  });
  await context.addInitScript(()=>{
    const native=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==='webgl2')return null;
      return native.call(this,type,...args);
    };
  });
  await context.route('**/*',async route=>{
    const request=route.request();
    if(!request.url().startsWith(origin+'/')||!['GET','HEAD'].includes(request.method())){
      forbidden.push({width:390,mode:'webgl-denied',url:request.url(),method:request.method()});
      await route.abort();return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push({width:390,mode:'webgl-denied',message:error.message}));
  page.on('console',msg=>{
    if(msg.type()==='error')errors.push({width:390,mode:'webgl-denied',message:msg.text()});
  });
  await page.goto(origin+'/portfolio/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-transcosmic-field]')?.dataset.renderMode==='fallback');
  const backdrop=page.locator('.transcosmic-field .institute-backdrop');
  assert.equal(await backdrop.getAttribute('src'),'/portfolio/assets/transcosmic-continuum.svg');
  assert.ok(Number(await backdrop.evaluate(element=>getComputedStyle(element).opacity))>.95,
    'WebGL-denied site retains visible first-party scalable scene');
  assert.match(await page.locator('.universe-disclaimer').innerText(),/STATIC ART FALLBACK \/ 3D NOT AVAILABLE/,
    'The site must not claim that its 3D runtime is available when blocked');
  assert.equal(await page.locator('canvas[data-depth-canvas]').count(),1,
    'Semantic DOM and single nonfunctional canvas remain, not an extra renderer');
  assert.ok(await page.getByRole('heading',{name:/I BUILD WORLDS THAT WORK/i}).isVisible());
  await page.locator('[data-universe-stage="2"]').click();
  assert.equal(await page.locator('[data-universe-name]').innerText(),'THE CONTINUUM',
    'Native viewpoints stay usable without WebGL');
  await page.getByRole('button',{name:/Discover Transcosmic/i}).click();
  await page.locator('#project-dialog[open]').waitFor({state:'visible'});
  assert.match(await page.locator('#case-title').innerText(),/Transcosmic/);
  await page.locator('.case-close').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:join(output,'transcosmic-no-webgl-fallback-390.png'),animations:'disabled'});
  note('authored static fallback with native controls and case story / 390px');
  await context.close();
}
try {
  for(const [width,height,motion] of [[1440,900,'no-preference'],[390,844,'no-preference'],[320,740,'reduce'],[1920,1080,'no-preference']]) {
    try {await run(width,height,motion);}catch(e){failures.push({width,message:e.message,stack:e.stack});console.error('FAIL '+width+' '+e.stack);}
  }
  try{await runWithoutWebGL();}catch(e){
    failures.push({width:390,mode:'webgl-denied',message:e.message,stack:e.stack});
    console.error('FAIL no-WebGL fallback '+e.stack);
  }
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
  writeFileSync(join(output,'acceptance.json'),JSON.stringify({checks,errors,forbidden,failures},null,2));
}
assert.equal(forbidden.length,0,'external or non-read-only calls: '+JSON.stringify(forbidden));
assert.equal(errors.length,0,'browser errors: '+JSON.stringify(errors));
assert.equal(failures.length,0,'browser acceptance failures: '+JSON.stringify(failures));
console.log('PASS entire portfolio cinematic browser acceptance');
