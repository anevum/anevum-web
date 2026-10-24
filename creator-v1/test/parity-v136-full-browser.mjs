/** CI-only compiled UI. Synthetic catalogue records never leave loopback. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const out=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/full-browser');
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
async function contextFor(width,{motion='reduce',state='empty',forceVector=false}={}){
  const context=await browser.newContext({viewport:{width,height:width<650?844:960},deviceScaleFactor:2,reducedMotion:motion});
  if(forceVector)await context.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,...args){
      return kind==='webgl2'?null:original.call(this,kind,...args);
    };
  });
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base||!['GET','HEAD'].includes(request.method())){forbidden.push({url:request.url(),method:request.method()});await route.abort();return;}
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
  for(const width of [1920,1440,1024,768,390,320]){
    const {page,context}=await contextFor(width);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('.p136-hero').waitFor();
    await page.locator('.p136-empty-index').waitFor();
    const layout=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
      const world=document.querySelector('.p136-living-world');
      const vector=world?.querySelector('svg.p136-living-vector');
      const canvas=world?.querySelector('canvas.p136-living-canvas');
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,
        hero:rect('.p136-hero'),primary:rect('.p136-button--primary'),secondary:rect('.p136-button--signal'),
        artLoaded:Boolean(vector&&canvas),source:world?.dataset.source,renderer:world?.dataset.renderer,
        headingFont:getComputedStyle(document.querySelector('.p136-hero h1')).fontFamily,
        headingLines:document.querySelector('.p136-hero h1').getBoundingClientRect().height/parseFloat(getComputedStyle(document.querySelector('.p136-hero h1')).lineHeight),
        animation:getComputedStyle(document.querySelector('.p136-living-orbitals')).animationName,
        h1Count:document.querySelectorAll('h1').length,dockCount:document.querySelectorAll('.ir80-dock').length};
    });
    assert.ok(layout.scroll<=width+1,'No horizontal overflow: '+JSON.stringify(layout));
    assert.equal(layout.h1Count,1);assert.equal(layout.dockCount,1,'One canonical IREN companion');
    assert.ok(layout.artLoaded,'Procedural vector and GPU canvas available');
    assert.ok(['webgl','vector'].includes(layout.renderer),'Supported live world renderer');
    if(width>=1440){assert.ok(layout.headingLines<=2.1,'Desktop headline remains two lines: '+JSON.stringify(layout));assert.ok(layout.hero.height<=690,'Desktop hero retains concept density');}
    assert.ok(!/Georgia|Cambria/.test(layout.headingFont),'Concept uses sans typography');
    assert.equal(layout.animation,'none','Reduced motion has a static scene');
    for(const rect of [layout.primary,layout.secondary]){assert.ok(rect.height>=44);assert.ok(rect.width>=44);assert.ok(rect.left>=0&&rect.right<=width);}
    if(width<650)assert.ok(layout.primary.bottom<750,'Primary action stays in the first phone viewport');
    await page.screenshot({path:join(out,'arrival-'+width+'.png'),fullPage:false,animations:'disabled'});
    await page.screenshot({path:join(out,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    record('responsive arrival '+width,layout);
    await page.getByRole('link',{name:'Explore projects',exact:true}).click();
    await page.waitForURL(base+'/discover');
    await page.locator('.av73-discover').waitFor();
    assert.equal(await page.locator('.av73-discover').count(),1);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByRole('link',{name:'Join the community',exact:true}).click();
    await page.waitForURL(base+'/join');
    await page.getByRole('heading',{name:/ENTER THE\s*CONTINUANCE\./i}).waitFor();
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Open IREN companion',exact:true}).click();
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
      assert.equal(await page.getByRole('link',{name:'View '+fixture.title,exact:true}).count(),1);
    }else await page.getByText('The public index is temporarily unavailable',{exact:true}).waitFor();
    await page.screenshot({path:join(out,'catalogue-'+state+'-390.png'),fullPage:true,animations:'disabled'});
    record('honest catalogue '+state);await context.close();
  }
  const {page,context}=await contextFor(390,{motion:'no-preference',forceVector:true});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.p136-living-world[data-renderer="vector"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.p136-living-world').dataset.motion==='true');
  await page.getByRole('button',{name:'Pause atmospheric animation',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Pause atmospheric animation',exact:true}).getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>document.querySelector('.p136-living-world').dataset.motion==='false');
  await page.getByRole('button',{name:'Pause atmospheric animation',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.p136-living-world').dataset.motion==='false');
  await page.getByRole('link',{name:'Explore projects',exact:true}).press('Tab');
  const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));
  assert.equal(focus.tag,'A');assert.equal(focus.outline,'solid');
  await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
  await page.locator('#av79-navigation[open]').waitFor();
  await page.getByRole('button',{name:'Close navigation',exact:true}).press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#av79-navigation').open);
  assert.equal(await page.getByRole('button',{name:'Open site navigation',exact:true}).evaluate(e=>e===document.activeElement),true,'Menu restores trigger focus');
  await page.getByRole('searchbox',{name:'Search approved ANEVUM projects',exact:true}).fill('orbital & worlds');
  await page.getByRole('searchbox',{name:'Search approved ANEVUM projects',exact:true}).press('Enter');
  await page.waitForURL(base+'/discover?q=orbital%20%26%20worlds');
  await page.goto(base,{waitUntil:'networkidle'});
  await page.screenshot({path:join(out,'vector-fallback-390.png'),animations:'disabled'});
  record('WebGL unavailable / procedural vector fallback / pause / reduced motion / keyboard / menu focus / search',focus);await context.close();
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
