/** CI-only compiled UI. Synthetic catalogue records never leave loopback. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const out=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/browser');
const build=resolve('creator-v1/dist/web');
const {chromium}=createRequire(import.meta.url)('playwright');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const errors=[],forbidden=[],checks=[];
mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
  let file=resolve(build,'.'+name);
  if(file!==build&&!file.startsWith(build+sep)){res.writeHead(403);res.end();return;}
  if(!existsSync(file)||!statSync(file).isFile()){
    if(extname(file)){res.writeHead(404);res.end();return;}
    file=join(build,'index.html');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const fixture={id:'v136-ci-fixture',title:'SYNTHETIC CI PROJECT',summary:'Loopback fixture only; not a real release.',
  category:'games',freeToUse:true,license:'MIT',publishedAt:'2026-10-24T12:00:00Z',creatorName:'CI fixture',creatorHandle:null};
const record=(name,data={})=>{checks.push({name,...data});console.log('PASS '+name);};
async function contextFor(width,{motion='reduce',state='empty',failedArt=false}={}){
  const context=await browser.newContext({viewport:{width,height:width<650?844:960},deviceScaleFactor:2,reducedMotion:motion});
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base||!['GET','HEAD'].includes(request.method())){forbidden.push({url:request.url(),method:request.method()});await route.abort();return;}
    if(failedArt&&url.pathname.includes('/community-portals/games-')){await route.fulfill({status:404,body:''});return;}
    if(url.pathname.startsWith('/api/')){
      const page=items=>({items,count:items.length,nextCursor:null});
      const path=url.pathname;
      const value=path==='/api/v1/member/auth/get-session'?null:
        path==='/api/v1/projects'?page(state==='project'?[fixture]:[]):
        path==='/api/v1/creators'?page([]):
        path==='/api/v1/categories'?{categories:[]}:null;
      const status=state==='unavailable'&&path==='/api/v1/projects'?503:200;
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===503?{error:'CI unavailable fixture'}:value)});return;
    }
    await route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER_RUNTIME_ERROR '+e.message);});
  return {page,context};
}
try{
  for(const width of [1440,1024,390,320]){
    const {page,context}=await contextFor(width);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('.av136-arrival').waitFor();
    await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--av136-void').trim()!=='');
    await page.locator('.av133-first-look-empty').waitFor();
    const layout=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
      const img=document.querySelector('.av136-environment img');
      const cta=document.querySelector('.av136-action--primary');
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,hero:rect('.av136-arrival'),primary:rect('.av136-action--primary'),secondary:rect('.av136-action--secondary'),
        color:getComputedStyle(cta).color,background:getComputedStyle(cta).backgroundColor,
        headingStyle:getComputedStyle(document.querySelector('.av136-arrival h1 em')).fontStyle,
        artLoaded:img.complete&&img.naturalWidth>0,source:img.currentSrc,decorative:img.alt==='',
        animation:getComputedStyle(document.querySelector('.av136-orbit')).animationName,
        h1Count:document.querySelectorAll('h1').length,dockCount:document.querySelectorAll('.ir80-dock').length};
    });
    assert.ok(layout.scroll<=width+1,'No horizontal overflow');
    assert.equal(layout.h1Count,1);assert.equal(layout.dockCount,1,'One canonical IREN companion');
    assert.equal(layout.headingStyle,'normal');assert.ok(layout.artLoaded&&layout.decorative);
    assert.equal(layout.color,'rgb(16, 27, 42)','Primary action has dark readable text');
    assert.equal(layout.animation,'none','Reduced motion has a static scene');
    for(const rect of [layout.primary,layout.secondary]){assert.ok(rect.height>=44);assert.ok(rect.width>=44);assert.ok(rect.left>=0&&rect.right<=width);}
    if(width>=1024)assert.ok(layout.hero.height<=570,'Desktop first contact remains compact');
    if(width<650)assert.ok(layout.primary.bottom<750,'Primary action stays in the first phone viewport');
    await page.screenshot({path:join(out,'arrival-'+width+'.png'),fullPage:false,animations:'disabled'});
    await page.screenshot({path:join(out,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    record('responsive arrival '+width,layout);
    await page.getByRole('link',{name:'Explore real projects',exact:true}).click();
    await page.waitForURL(base+'/discover');
    await page.locator('.av73-discover').waitFor();
    assert.equal(await page.locator('.av73-discover').count(),1);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByRole('link',{name:'Join the early community',exact:true}).click();
    await page.waitForURL(base+'/join');
    await page.getByRole('heading',{name:/ENTER THE\s*CONTINUANCE\./i}).waitFor();
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Need a guide? Meet IREN',exact:true}).click();
    assert.equal(await page.locator('.ir80-dock').count(),1);
    await page.waitForFunction(()=>!!document.querySelector('.ir80-guide-layer,.ir123-tour,.ir92-tour,.ir87-panel'));
    record('canonical Discover / Join / IREN '+width);
    await context.close();
  }
  for(const state of ['project','unavailable']){
    const {page,context}=await contextFor(390,{state});
    await page.goto(base,{waitUntil:'networkidle'});
    if(state==='project'){
      await page.getByRole('heading',{name:fixture.title,exact:true}).waitFor();
      assert.equal(await page.getByRole('link',{name:'View this project',exact:true}).count(),1);
    }else await page.getByText('INDEX TEMPORARILY UNAVAILABLE',{exact:true}).waitFor();
    await page.screenshot({path:join(out,'catalogue-'+state+'-390.png'),fullPage:true,animations:'disabled'});
    record('honest catalogue '+state);await context.close();
  }
  const {page,context}=await contextFor(390,{motion:'no-preference',failedArt:true});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.av136-art-fallback').waitFor();
  await page.waitForFunction(()=>document.querySelector('.av136-arrival').dataset.active==='true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.av136-arrival').dataset.active==='false');
  await page.getByRole('link',{name:'Explore real projects',exact:true}).press('Tab');
  const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));
  assert.equal(focus.tag,'A');assert.equal(focus.outline,'solid');
  await page.screenshot({path:join(out,'art-fallback-390.png'),animations:'disabled'});
  record('art failure / live reduced motion / keyboard focus',focus);await context.close();
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
}catch(error){
  for(const context of browser.contexts())for(const page of context.pages()){
    await page.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});
    writeFileSync(join(out,'failure.json'),JSON.stringify({url:page.url(),body:await page.locator('body').innerText().catch(()=>''),errors,forbidden,error:String(error)},null,2));
  }
  throw error;
}finally{
  writeFileSync(join(out,'acceptance.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks,errors,forbidden,fixtureOnly:true},null,2)+'\n');
  await browser.close();await new Promise(done=>server.close(done));
}
