/** PARITY V136.004 compiled Discover acceptance.
 * All records are synthetic and served from loopback. No production mutations.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';

const {chromium}=createRequire(import.meta.url)('playwright');
const out=resolve(process.env.PARITY_DISCOVER_QA_OUTPUT||'evidence/parity-v136/discover-browser');
const build=resolve('creator-v1/dist/web');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const errors=[],forbidden=[],checks=[];
const synthetic=[
  {id:'e0b3a572-54e1-4a36-93ac-b839662d4e91',slug:'synthetic-game',title:'SYNTHETIC ORBITAL GAME',summary:'Internal loopback fixture. This is not a real public project.',category:'games',sourceUrl:null,demoUrl:null,freeToUse:true,license:'MIT',publishedAt:'2026-10-24T12:00:00Z',creatorName:'Fixture creator',creatorHandle:'ci_author'},
  {id:'7e2b4523-5b8f-401e-827b-f652ed1e3abb',slug:'synthetic-tool',title:'SYNTHETIC TOOL WORKSHOP',summary:'A second local-only fixture for category and cost filters.',category:'tools',sourceUrl:null,demoUrl:null,freeToUse:false,license:null,publishedAt:'2026-10-24T11:00:00Z',creatorName:'Fixture creator',creatorHandle:'ci_author'}
];
const packageFixture={
 id:'fe8d028d-e719-4591-a76a-5b856390924c',title:'SYNTHETIC BROWSER GAME',summary:'Approved-only package response on loopback.',
 category:'game',version:1,status:'published',draft_status:null,cover_url:null,
 play_url:'/upload/v3/play/fe8d028d-e719-4591-a76a-5b856390924c',published_at:1792843200
};
mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400);res.end();return}
  let file=resolve(build,'.'+name);
  if(file!==build&&!file.startsWith(build+sep)){res.writeHead(403);res.end();return}
  if(!existsSync(file)||!statSync(file).isFile()){
    if(extname(file)){res.writeHead(404);res.end();return}
    file=join(build,'index.html');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
function record(name,data={}){checks.push({name,...data});console.log('PASS '+name)}
async function makeContext(width,{state='projects',packages='none',projectCount=2}={}){
  const context=await browser.newContext({viewport:{width,height:width<650?844:950},deviceScaleFactor:2,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base||!['GET','HEAD'].includes(request.method())){
      forbidden.push({url:request.url(),method:request.method()});await route.abort();return
    }
    if(url.pathname==='/upload/v3/api/v1/packages/projects'){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({projects:packages==='approved'?[packageFixture]:[]})});return
    }
    if(url.pathname.startsWith('/api/')){
      const items=(state==='empty'?[]:synthetic.slice(0,projectCount)).filter(item=>
          (!url.searchParams.get('q')||(item.title+' '+item.summary).toLowerCase().includes(url.searchParams.get('q').toLowerCase()))&&
          (!url.searchParams.get('category')||item.category===url.searchParams.get('category'))&&
          (url.searchParams.get('free')!=='1'||item.freeToUse));
      const result=url.pathname==='/api/v1/projects'?
        {items,nextCursor:null,count:items.length}
        :url.pathname==='/api/v1/categories'?
          {categories:[{category:'games',count:items.filter(x=>x.category==='games').length},{category:'tools',count:items.filter(x=>x.category==='tools').length}]}
        :url.pathname==='/api/v1/status'?
          {phase:'public',version:'test',counts:{publishedProjects:items.length,publishedCreators:1}}
        :url.pathname==='/api/v1/member/auth/get-session'?null
        :null;
      const status=state==='unavailable'&&url.pathname==='/api/v1/projects'?503:200;
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===503?{error:'CI catalogue unavailable'}:result)});return
    }
    await route.continue()
  });
  const page=await context.newPage();
  page.on('pageerror',err=>errors.push(err.message));
  return {page,context};
}
try{
  for(const width of [1920,1440,1024,768,390,320]){
    const {page,context}=await makeContext(width);
    await page.goto(base+'/discover',{waitUntil:'networkidle'});
    await page.locator('[data-parity-discover="v136.004"]').waitFor();
    await page.getByRole('heading',{name:'Discover what comes next.'}).waitFor();
    await page.getByRole('heading',{name:'SYNTHETIC ORBITAL GAME'}).waitFor();
    const layout=await page.evaluate(()=>{
      const rect=selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON();
      return {
        width:innerWidth,scroll:document.documentElement.scrollWidth,
        hero:rect('.p136-discover-hero'),search:rect('.p136-discover-search-form'),
        cta:rect('.p136-discover-action-primary'),
        headings:document.querySelectorAll('h1').length,
        worlds:document.querySelectorAll('.p136-discover-world').length,
        siteIren:document.querySelectorAll('.ir80-dock').length,
        ambientRenderers:document.querySelectorAll('.p136-living-world,.p136-living-canvas').length,
        nativeFields:document.querySelectorAll('.p136-discover-world .av136-index-field[data-presentation="native-index"]').length,
        decorativeImages:document.querySelectorAll('.p136-discover-world img').length,
        font:getComputedStyle(document.querySelector('.p136-discover-hero h1')).fontFamily,
        editorial:getComputedStyle(document.documentElement).getPropertyValue('--av-editorial').trim(),
        railScroll:getComputedStyle(document.querySelector('.p136-discover-featured')).overflowX,
        scrollSnap:getComputedStyle(document.querySelector('.p136-discover-featured')).scrollSnapType
      }
    });
    assert.ok(layout.scroll<=width+1,'Horizontal overflow: '+JSON.stringify(layout));
    assert.equal(layout.headings,1,'A single page heading');
    assert.equal(layout.worlds,4,'Four real filter gateways');
    assert.equal(layout.siteIren,1,'Single shared IREN');
    assert.equal(layout.nativeFields,4,'All four gateways render native interface panels');
    assert.equal(layout.decorativeImages,0,'No decorative AI image elements in the category gateways');
    assert.equal(layout.ambientRenderers,0,'Motion-first Discover does not mount the retired ambient renderer');
    assert.equal(await page.locator('.p136-discover-count').innerText(),'2 approved releases on this page','Visible count represents the actual approved catalogue');
    if(width<=600){
      assert.equal(layout.railScroll,'auto','Mobile console rail is swipeable without page overflow');
      assert.ok(layout.scrollSnap.includes('mandatory'),'Mobile rail snaps between scene gateways');
    }
    assert.ok(layout.editorial.includes('Georgia'),'The existing Continuance authority supplies the editorial heading');
    const normalizeFont=value=>value.replaceAll(/['"]/g,'').replaceAll(/\s*,\s*/g,',');
    assert.equal(normalizeFont(layout.font),normalizeFont(layout.editorial),'Discover uses the shared Continuance heading typography');
    for(const box of [layout.cta,layout.search]){
      assert.ok(box&&box.left>=-1&&box.right<=width+1,'Controls remain in viewport: '+JSON.stringify(layout))
    }
    assert.ok(layout.cta.height>=44,'Mobile-safe primary control');
    assert.equal(await page.locator('.p136-discover-results article').count(),2,'Only approved fixture projects');
    if(width===390){
      const firstWorld=page.locator('.p136-discover-world').first();
      const secondWorld=page.locator('.p136-discover-world').nth(1);
      await firstWorld.focus();await firstWorld.press('ArrowRight');
      assert.equal(await secondWorld.evaluate(element=>element===document.activeElement),true,'Console navigation moves focus to next scene');
      await page.getByRole('link',{name:'Open Creator Studio'}).focus();
    }
    await page.screenshot({path:join(out,'discover-'+width+'.png'),fullPage:true,animations:'disabled'});
    record('responsive live catalogue '+width,layout);
    await context.close();
  }
  {
    const {page,context}=await makeContext(390);
    await page.goto(base+'/discover',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/Games Independent play/i}).first().click();
    await page.waitForURL(url=>url.pathname==='/discover'&&url.searchParams.get('category')==='games');
    // Navigation commits the URL before the new query finishes. Wait for the
    // actual compiled filtered render rather than asserting stale cards.
    await page.waitForFunction(()=>document.querySelectorAll('.p136-discover-results article').length===1);
    assert.equal(await page.getByRole('heading',{name:'SYNTHETIC TOOL WORKSHOP'}).count(),0,'Category excludes other categories');
    await page.getByRole('button',{name:'List',exact:true}).click();
    await page.locator('.p136-discover-results--compact').waitFor();
    await page.getByRole('button',{name:'Marked free'}).click();
    await page.waitForURL(url=>url.searchParams.get('free')==='1'&&url.searchParams.get('category')==='games');
    assert.equal(await page.getByRole('button',{name:'Marked free'}).evaluate(node=>node===document.activeElement),true,
      'Filtering must retain the activating control focus rather than focus main');
    await page.getByRole('searchbox',{name:'Search published projects'}).fill('ORBITAL & TEST');
    assert.equal(await page.getByRole('searchbox',{name:'Search published projects'}).inputValue(),'ORBITAL & TEST','Controlled search retains typed input before submission');
    await page.evaluate(()=>{window.__parityNavigationDocumentMarker='same-document-'+Math.random()});
    await page.getByRole('searchbox',{name:'Search published projects'}).press('Enter');
    await page.waitForFunction(()=>new URLSearchParams(location.search).get('q')==='ORBITAL & TEST',
      null,{timeout:10000});
    assert.equal(new URL(page.url()).searchParams.get('category'),'games','Search preserves category');
    assert.equal(new URL(page.url()).searchParams.get('free'),'1','Search preserves free access filter');
    assert.equal(await page.evaluate(()=>window.__parityNavigationDocumentMarker?.startsWith('same-document-')),true,
      'Search must stay within the mounted application; no native GET navigation');
    await page.getByRole('heading',{name:'No matching projects yet.'}).waitFor();
    await page.getByRole('link',{name:/Clear filters/}).click();
    await page.waitForURL(url=>url.pathname==='/discover'&&url.searchParams.get('view')==='list'&&!url.searchParams.has('q')&&!url.searchParams.has('category')&&!url.searchParams.has('free'));
    assert.equal(await page.getByRole('button',{name:'List',exact:true}).getAttribute('aria-pressed'),'true','Clearing filters preserves the selected list layout');
    await page.getByRole('heading',{name:'SYNTHETIC TOOL WORKSHOP'}).waitFor();
    await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
    await page.locator('#av79-navigation[open]').waitFor();
    const focusBefore=await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120));
    await page.keyboard.press('ArrowDown');
    const focusAfter=await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120));
    assert.notEqual(focusAfter,focusBefore,'Directional input advances modal navigation focus');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#av79-navigation').open);
    record('spatial menu directional focus and escape');
    assert.equal(await page.locator('.p136-discover-category-nav button[aria-pressed="true"]').innerText(),'All work','Reset restores the unfiltered public category');
    record('interactive category, list, free, encoded query, true empty, reset');
    await context.close();
  }
  {
    const {page,context}=await makeContext(390,{state:'unavailable',packages:'approved'});
    await page.goto(base+'/discover',{waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'SYNTHETIC BROWSER GAME'}).waitFor();
    await page.getByText('PART OF THE CATALOGUE COULD NOT LOAD').waitFor();
    assert.equal(await page.locator('.p136-discover-results article').count(),1);
    await page.screenshot({path:join(out,'discover-partial-outage-390.png'),fullPage:true,animations:'disabled'});
    record('public package displayed while legacy catalogue unavailable');
    await context.close();
  }
  {
    const {page,context}=await makeContext(320,{state:'empty'});
    await page.goto(base+'/discover',{waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'No approved projects yet.'}).waitFor();
    assert.equal(await page.locator('.p136-discover-results article').count(),0);
    await page.screenshot({path:join(out,'discover-empty-320.png'),fullPage:true,animations:'disabled'});
    record('honest zero-project state');
    await context.close();
  }
  // Catalogue growth changes the visible cards and honest result count.
  // These synthetic scenarios are isolated contexts, never site telemetry.
  const catalogueCounts=[];
  for(const projectCount of [1,2]){
    const {page,context}=await makeContext(390,{projectCount});
    await page.goto(base+'/discover',{waitUntil:'networkidle'});
    await page.locator('.p136-discover-count').waitFor();
    const count=await page.locator('.p136-discover-results article').count();
    assert.equal(count,projectCount);
    assert.equal(await page.locator('.p136-discover-count').innerText(),`${count} approved ${count===1?'release':'releases'} on this page`);
    assert.equal(await page.locator('.p136-living-world,.p136-living-canvas').count(),0);
    catalogueCounts.push(count);
    await context.close();
  }
  assert.ok(catalogueCounts[1]>catalogueCounts[0],'Verified public catalogue growth changes rendered results');
  record('public content growth changes actual catalogue cards and counts',{catalogueCounts});
  assert.deepEqual(errors,[],'No runtime page errors');
  assert.deepEqual(forbidden,[],'No external calls or unsafe mutations');
} catch(error){
  for(const context of browser.contexts())for(const page of context.pages()){
    await page.screenshot({path:join(out,'discover-failure.png'),fullPage:true}).catch(()=>{});
    writeFileSync(join(out,'failure.json'),JSON.stringify({url:page.url(),body:await page.locator('body').innerText().catch(()=>''),input:await page.getByRole('searchbox',{name:'Search published projects'}).inputValue().catch(()=>null),focus:await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,300)),errors,forbidden,error:String(error)},null,2));
  }
  throw error;
} finally{
  writeFileSync(join(out,'acceptance.json'),JSON.stringify({
    source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    checks,errors,forbidden,fixtureOnly:true,productionAccepted:false
  },null,2)+'\n');
  await browser.close();await new Promise(done=>server.close(done));
}
