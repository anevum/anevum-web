/**
 * Actual compiled V134 review. Browser requests are loopback-only.
 * The preview's source is local-only; there is no database, member session,
 * email, publication, Cloudflare token or third-party connection.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);
const output=resolve(args.includes('--output')?args[args.indexOf('--output')+1]:'evidence/next-visual-v134');
const build=resolve('creator-v1/dist/web');
assert.ok(existsSync(join(build,'index.html')),'Flagged compiled build is required');
const playwright=createRequire(import.meta.url)('playwright');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const errors=[],forbidden=[],captures=[],checks=[],apiCalls=[];
mkdirSync(output,{recursive:true});
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let decoded;
  try{decoded=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
  const filePath=resolve(build,'.'+decoded);
  let file=filePath.startsWith(build+sep)?filePath:join(build,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){
    if(extname(file)){res.writeHead(404);res.end();return;}
    file=join(build,'index.html');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
function record(name,data={}){checks.push({name,...data});console.log('PASS '+name);}
function noOverflow(result,width,name){
  assert.ok(result.scroll<=width+1,name+' horizontal overflow: '+JSON.stringify(result));
  record(name+' width',result);
}
async function openContext(width,height=900,{synthetic=false}={}){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'reduce'});
  context.setDefaultTimeout(12000);
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin!==base){forbidden.push({reason:'external',url:req.url()});await route.abort();return;}
    if(!['GET','HEAD'].includes(req.method())){forbidden.push({reason:'write',method:req.method(),url:req.url()});await route.abort();return;}
    if(url.pathname.startsWith('/api/')){
      apiCalls.push({path:url.pathname,method:req.method(),synthetic});
      if(synthetic){
        const pageOf=(items)=>({items,count:items.length,nextCursor:null});
        const sampleProject={
          id:'synthetic-visual-v135',slug:'synthetic-visual-v135',title:'SYNTHETIC SOURCE QA RECORD',
          summary:'Local fixture only. Never published or used in public marketing.',
          category:'tools',sourceUrl:null,demoUrl:null,freeToUse:true,license:'MIT',
          publishedAt:'2026-10-24T12:00:00Z',creatorHandle:'fixture_creator',creatorName:'Synthetic Fixture'
        };
        const sampleCreator={handle:'fixture_creator',displayName:'Synthetic Fixture',publishedProjects:1};
        const path=url.pathname;
        const value=path==='/api/v1/projects'?pageOf([sampleProject]):
          path==='/api/v1/categories'?{categories:[{category:'tools',count:1}]}:
          path==='/api/v1/creators'?pageOf([sampleCreator]):null;
        if(value){await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});return;}
      }
      const session=url.pathname==='/api/v1/member/auth/get-session';
      await route.fulfill({status:session?200:404,contentType:'application/json',body:session?'null':'{"error":"Offline preview API"}'});
      return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push({width,message:error.message}));
  return {page,context};
}
async function screenshot(page,name){
  await page.screenshot({path:join(output,name+'.png'),fullPage:true,animations:'disabled'});
  captures.push(name+'.png');
}
try{
  for(const width of [1440,1024,390,320]){
    const {page,context}=await openContext(width,width===1440?900:844);
    await page.goto(base+'/__review/visual-system',{waitUntil:'domcontentloaded'});
    await page.locator('.av134-lab').waitFor();
    await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--av134-void').trim()!=='');
    const summary=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      htmlFlag:document.documentElement.dataset.avNextVisual,
      rootCount:document.querySelectorAll('.av134-lab').length,
      shellMain:document.querySelectorAll('main#main').length,
      properMark:!!document.querySelector('.av134-toolbar-brand svg'),
      iframeCount:document.querySelectorAll('iframe.av134-live-frame').length,
      tabs:[...document.querySelectorAll('.av134-file')].map(tab=>tab.textContent.trim())
    }));
    assert.equal(summary.htmlFlag,'v134');
    assert.equal(summary.rootCount,1);
    assert.equal(summary.shellMain,1);
    assert.ok(summary.properMark,'Canonical SVG mark is rendered');
    assert.equal(summary.iframeCount,0,'Default depth scene is visual CSS');
    assert.equal(summary.tabs.length,3,'Three working file tabs');
    assert.equal(await page.locator('.av134-tree .av135-file-glyph svg').count(),3,'New vector file glyphs are rendered by the real editor');
    noOverflow(summary,width,'lab '+width);
    assert.ok(await page.locator('.av134-highlight .av134-token--tag').count()>0,'HTML tags are colorized');
    await screenshot(page,'visual-system-'+width);
    await page.getByRole('tab',{name:'styles.css'}).click();
    assert.equal(await page.getByRole('tab',{name:'styles.css'}).getAttribute('aria-selected'),'true');
    const input=page.locator('textarea.av134-input');
    const previous=await input.inputValue();
    assert.ok(previous.includes('color-scheme'));
    await input.fill('body { color: #ff0077; background: #091329; }');
    assert.ok(await page.locator('.av134-highlight .av134-token--color').count()>0,'CSS values are colorized');
    await page.getByRole('button',{name:'HTML / CSS'}).click();
    const frame=page.frameLocator('iframe.av134-live-frame');
    await frame.locator('.world-card').waitFor();
    const actualColor=await frame.locator('body').evaluate(node=>getComputedStyle(node).color);
    assert.equal(actualColor,'rgb(255, 0, 119)','HTML/CSS preview reacts to source edits');
    const sandbox=await page.locator('iframe.av134-live-frame').getAttribute('sandbox');
    assert.equal(sandbox,'','No sandbox powers granted');
    await screenshot(page,'visual-system-html-'+width);
    await page.getByRole('tab',{name:'main.ts'}).click();
    await input.fill('document.body.innerHTML = "<h1>NOT EXECUTED</h1>";');
    assert.equal(await frame.locator('h1').textContent(),'Imagine beyond the ordinary.');
    await page.getByRole('button',{name:'Orbital scene'}).click();
    await page.getByRole('button',{name:'metal'}).click();
    assert.equal(await page.locator('.av134-scene').getAttribute('data-material'),'metal');
    await page.getByRole('button',{name:'Reset sample'}).click();
    await page.getByRole('tab',{name:'styles.css'}).click();
    assert.equal(await input.inputValue(),previous,'Reset restores original CSS');
    const widthCheck=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth}));
    noOverflow(widthCheck,width,'lab interactive '+width);
    record('editor/sandbox/material '+width,{actualColor,sandbox});
    await context.close();
  }
  // Review genuine React page structure without claiming synthetic/failed API
  // responses represent real project content or live account statistics.
  for(const width of [1440,390,320]){
    const {page,context}=await openContext(width,width===1440?900:844);
    for(const [path,name,contentSelector] of [
      ['/','home','.av79-home'],
      ['/discover','discover','.av73-discover'],
      ['/community','community','.ch7-hub'],
      ['/creators','creators','.portal-creators']
    ]){
      await page.goto(base+path,{waitUntil:'domcontentloaded'});
      await page.locator('.av9-header').waitFor();
      await page.locator(contentSelector).waitFor();
      await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--av134-void').trim()!=='');
      const result=await page.evaluate(()=>({
        scroll:document.documentElement.scrollWidth,
        enabled:document.documentElement.dataset.avNextVisual,
        headerBackground:getComputedStyle(document.querySelector('.av9-header')).backgroundImage
      }));
      assert.equal(result.enabled,'v134');
      assert.match(result.headerBackground,/gradient/,'Header renders real visual layer');
      noOverflow(result,width,'sitewide '+name+' '+width);
      const edgeSelector=name==='community'?'.ch7-hero > .av135-edge':
        name==='discover'?'.portal-search-hall > .av135-edge':
        name==='creators'?'.portal-page-heading > .av135-edge':null;
      if(edgeSelector){
        await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--av135-surface').trim()!=='');
        const edge=await page.locator(edgeSelector).first().evaluate(node=>({
          pointerEvents:getComputedStyle(node).pointerEvents,
          borderTopWidth:getComputedStyle(node).borderTopWidth,
          position:getComputedStyle(node).position
        }));
        assert.equal(edge.pointerEvents,'none','Glass edge cannot intercept buttons/links');
        assert.equal(edge.borderTopWidth,'1px','Real 1px high-DPI edge is present');
        assert.equal(edge.position,'absolute','Edge is a true positioned vector layer');
        record('V135 real '+name+' edge '+width,edge);
      }
      if(name==='community'){
        const actual=await page.locator('.ch7-hero h1 em').evaluate(el=>({
          style:getComputedStyle(el).fontStyle,
          family:getComputedStyle(el).fontFamily
        }));
        assert.equal(actual.style,'normal','Community headline no longer switches to italics');
        assert.match(actual.family,/Inter|sans-serif/,'Community headline uses coherent interface type');
        const guestHeading=await page.locator('.mc-own h2').first().evaluate(el=>({
          family:getComputedStyle(el).fontFamily,
          style:getComputedStyle(el).fontStyle
        }));
        assert.match(guestHeading.family,/Inter|sans-serif/,'Nested member guest heading uses consistent sans family');
        assert.equal(guestHeading.style,'normal','Nested member guest heading is not italic');
        record('Community type parity '+width,{...actual,guestHeading});
      }
      if(name==='discover'){
        await page.locator('.state-error h2').waitFor();
        const family=await page.locator('.state-error h2').evaluate(el=>getComputedStyle(el).fontFamily);
        assert.match(family,/Inter|sans-serif/,'Discover error state no longer uses legacy serif');
        record('Discover error typography '+width,{family});
      }
      const filename='route-'+name+'-'+width+'.png';
      await page.screenshot({path:join(output,filename),fullPage:false,animations:'disabled'});
      captures.push(filename);
    }
    await context.close();
  }
  // An isolated synthetic source fixture checks actual registered components
  // without implying these records exist on the live website.
  for(const width of [1440,390,320]){
    const {page,context}=await openContext(width,width===1440?900:844,{synthetic:true});
    await page.goto(base+'/discover',{waitUntil:'domcontentloaded'});
    await page.locator('.av73-project-card').first().waitFor();
    const project=await page.locator('.av73-project-card').first().evaluate(node=>{
      const edge=node.querySelector('.av135-edge');
      return {
        title:node.querySelector('h3')?.textContent?.trim(),
        border:edge?getComputedStyle(edge).borderTopWidth:null,
        interactive:edge?getComputedStyle(edge).pointerEvents:null
      };
    });
    assert.equal(project.title,'SYNTHETIC SOURCE QA RECORD');
    assert.equal(project.border,'1px');
    assert.equal(project.interactive,'none');
    const projectOverflow=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(projectOverflow<=width+1,'Synthetic project card overflows '+width);
    record('V135 synthetic-only published-card integration '+width,project);
    await page.goto(base+'/creators',{waitUntil:'domcontentloaded'});
    await page.locator('.portal-creator-tile').first().waitFor();
    const creator=await page.locator('.portal-creator-tile').first().evaluate(node=>({
      edge:!!node.querySelector('.av135-edge'),
      label:node.textContent?.includes('Synthetic Fixture')
    }));
    assert.ok(creator.edge&&creator.label,'Real creator tile has reusable edge over local fixture data');
    const creatorOverflow=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(creatorOverflow<=width+1,'Synthetic creator tile overflows '+width);
    record('V135 synthetic-only creator-card integration '+width,creator);
    await context.close();
  }
  assert.deepEqual(forbidden,[],'No external or write requests');
  assert.deepEqual(errors,[],'No uncaught page errors');
  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  writeFileSync(join(output,'acceptance.json'),JSON.stringify({pass:true,commit:sha,captures,checks,apiCalls,forbidden,errors,source:'real compiled React with isolated loopback fixture; no product publishing'},null,2));
  console.log('NEXT_VISUAL_V134_COMPILED=PASS');
}finally{
  await browser.close();
  await new Promise(done=>server.close(done));
}
