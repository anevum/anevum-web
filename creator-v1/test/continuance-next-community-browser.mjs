/**
 * Living Commons: real compiled React, loopback-only browser acceptance.
 * All catalogue data below is synthetic and prominently labelled in captures.
 * No account, email, production API, Cloudflare credential or database is used.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,existsSync,mkdirSync,writeFileSync,statSync,rmSync,mkdtempSync,cpSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';

const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i===-1?undefined:args[i+1]};
const output=resolve(option('--output')||'/tmp/anevum-commons-browser');
const captureOnly=args.includes('--capture-only');
const publicSnapshotDirectory=option('--public-snapshot');
assert.ok(!publicSnapshotDirectory||captureOnly,'Public snapshots are capture-only; behavioral tests use synthetic fixtures');
const publicSnapshot=publicSnapshotDirectory?Object.fromEntries(['status','projects','categories','creators'].map(name=>[
  '/api/v1/'+name,JSON.parse(readFileSync(join(resolve(publicSnapshotDirectory),name+'.json'),'utf8'))
])):null;
const engine=option('--engine')||'chromium';
assert.ok(['chromium','webkit'].includes(engine),'Unsupported browser engine');
let playwright;
try {playwright=createRequire(import.meta.url)('playwright');}
catch (error) {
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
  playwright=createRequire(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'package.json'))('playwright');
}
const sourceBuild=resolve('creator-v1/dist/web');
assert.ok(existsSync(join(sourceBuild,'index.html')),'Build the flagged React review before browser QA');
// Serve one immutable copy even if another local task rebuilds dist during QA.
const build=mkdtempSync(join(tmpdir(),'anevum-commons-compiled-'));
cpSync(sourceBuild,build,{recursive:true});
mkdirSync(output,{recursive:true});
rmSync(join(output,'browser-review-failure.json'),{force:true});

const projects=[
  ['field-notes','Field Notes Observatory','research','A small observatory for recording questions, comparing evidence, and keeping a research trail.','mira_chen','Mira Chen'],
  ['orbital-garden','Orbital Garden','games','A quiet world about cultivating living systems, one growing season at a time.','elias_ward','Elias Ward'],
  ['signal-workbench','Signal Workbench','tools','A focused tool for arranging ideas, testing interactions, and turning useful sketches into working software.','mira_chen','Mira Chen'],
  ['open-patterns','Open Patterns','libraries','Reusable interface patterns with readable source and carefully documented decisions.','ada_rivers','Ada Rivers']
].map(([id,title,category,summary,creatorHandle,creatorName],i)=>({
  id,slug:id,title,category,summary,creatorHandle,creatorName,sourceUrl:null,demoUrl:null,
  freeToUse:i!==1,license:i===1?null:'MIT',publishedAt:'2026-10-23T12:00:00Z'
}));
const creators=[
  {handle:'mira_chen',displayName:'Mira Chen',publishedProjects:2},
  {handle:'elias_ward',displayName:'Elias Ward',publishedProjects:1},
  {handle:'ada_rivers',displayName:'Ada Rivers',publishedProjects:1}
];
const posts=[
  {id:'research-discussion',title:'What makes an experiment worth sharing?',excerpt:'A conversation about evidence, unfinished questions, and documenting what we learn along the way.',authorHandle:'mira_chen',authorName:'Mira Chen',topic:'research',publishedAt:'2026-10-23T13:00:00Z',score:3,replyCount:4,project:projects[0]},
  {id:'making-discussion',title:'Building tools that leave room to think',excerpt:'How do you decide which interaction belongs in the first version, and which can wait?',authorHandle:'ada_rivers',authorName:'Ada Rivers',topic:'making',publishedAt:'2026-10-22T16:00:00Z',score:2,replyCount:1,project:projects[2]}
];
const categoryNames=['games','tools','creative','libraries','research','learning','automation','other'];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const forbidden=[];
const requests=[];
const errors=[];
const checks=[];
const captures=[];
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourceTrackedChanges=execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim();
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){forbidden.push({method:req.method,path:req.url});res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://127.0.0.1');
  let file=resolve(build,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(build+sep)){file=join(build,'index.html');}
  if(!existsSync(file)||!statSync(file).isFile()){
    if(extname(file)){res.writeHead(404);res.end();return;}
    file=join(build,'index.html');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const chrome=option('--chrome');
const browser=await playwright[engine].launch({headless:true,...(chrome?{executablePath:chrome}:{}),...(engine==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});

function record(name,detail={}){checks.push({name,...detail});console.log('PASS '+name);}
async function fixture({width=1440,height=1000,scenario='ready',reducedMotion='reduce'}={}){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion});
  context.setDefaultTimeout(12_000);
  context.setDefaultNavigationTimeout(20_000);
  const state={scenario,requests:[],attempts:{},slow:[]};
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base){forbidden.push({reason:'external',url:request.url()});await route.abort();return;}
    if(!['GET','HEAD'].includes(request.method())){forbidden.push({reason:'write',method:request.method(),url:request.url()});await route.abort();return;}
    if(!url.pathname.startsWith('/api/')){await route.continue();return;}
    const path=url.pathname;
    requests.push({scenario:state.scenario,method:request.method(),path,query:url.search});
    state.requests.push({path,query:url.search});
    state.attempts[path]=(state.attempts[path]||0)+1;
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(path==='/api/v1/member/auth/get-session'){await json(null);return;}
    if(path.startsWith('/api/v1/member/')||path.startsWith('/api/v1/members/')){
      forbidden.push({reason:'private-read',path});await json({error:'No private fixture data'},403);return;
    }
    if(publicSnapshot){
      if(Object.hasOwn(publicSnapshot,path)){await json(publicSnapshot[path]);return;}
      forbidden.push({reason:'public-snapshot-missing-endpoint',path});
      await json({error:'Public snapshot has no response for this endpoint'},503);return;
    }
    if(state.scenario==='loading'&&path==='/api/v1/projects')await new Promise(r=>state.slow.push(r));
    if(state.scenario==='status-error'&&path==='/api/v1/status'){await json({error:'Synthetic status outage'},503);return;}
    if(state.scenario==='errors'&&path!=='/api/v1/status'){await json({error:'Synthetic public service outage'},503);return;}
    if(path==='/api/v1/status'){
      await json({version:'synthetic-browser-fixture',phase:'review',counts:{publishedProjects:projects.length,publishedCreators:creators.length},features:{communityPosts:state.scenario!=='closed'}});return;
    }
    if(path==='/api/v1/projects'){
      const q=(url.searchParams.get('q')||'').toLowerCase(),category=url.searchParams.get('category');
      const items=state.scenario==='empty'?[]:projects.filter(p=>(!category||p.category===category)&&(!q||(p.title+' '+p.summary).toLowerCase().includes(q)));
      await json({items,count:items.length,nextCursor:state.scenario==='pagination'?'more-projects':null});return;
    }
    if(path==='/api/v1/community/posts'){
      if(state.scenario==='posts-404'){await json({error:'Closed'},404);return;}
      await json({items:state.scenario==='empty'?[]:posts,count:state.scenario==='empty'?0:posts.length,nextCursor:null,sort:url.searchParams.get('sort')||'new'});return;
    }
    if(path==='/api/v1/categories'){
      await json({categories:categoryNames.map(category=>({category,count:projects.filter(p=>p.category===category).length}))});return;
    }
    if(path==='/api/v1/creators'){
      const q=(url.searchParams.get('q')||'').toLowerCase();
      const items=state.scenario==='empty'?[]:creators.filter(c=>(c.displayName+' '+c.handle).toLowerCase().includes(q));
      await json({items,count:items.length,nextCursor:state.scenario==='pagination'?'more-creators':null});return;
    }
    forbidden.push({reason:'unexpected-api',path});await json({error:'No fixture for this endpoint'},404);
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push({scenario:state.scenario,message:error.message}));
  return {context,page,state,close:async()=>{state.slow.splice(0).forEach(release=>release());await context.close();}};
}
async function open(page,query=''){
  await page.goto(base+'/__review/commons'+query,{waitUntil:'networkidle'});
  await page.locator('.lnx-root').waitFor();
}
async function settled(page,selector){await page.locator(selector).first().waitFor();}
async function label(page){
  await page.locator('.lnx-preview-warning').evaluate((element,text)=>{element.textContent=text;},
    publicSnapshot?'READ-ONLY PUBLIC API SNAPSHOT · LOCAL REACT REVIEW · NOT DEPLOYED':
      'SYNTHETIC PUBLIC DATA · COMPILED REACT REVIEW · NOT LIVE');
}
async function capture(page,name,{fullPage=true}={}){
  await page.evaluate(async()=>{
    const images=[...document.querySelectorAll('.lnx-root img')];
    images.forEach(image=>{image.loading='eager';});
    await Promise.all(images.map(image=>image.decode().catch(()=>{})));
    await document.fonts.ready;
  });
  await label(page);
  await page.screenshot({path:join(output,name+'.png'),fullPage,animations:'disabled'});
  captures.push(name+'.png');
}
async function noOverflow(page,name){
  const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(size.document<=size.viewport+1,`${name} overflows: ${JSON.stringify(size)}`);
  record(name+' fits viewport',size);
}
async function visibleText(page,pattern){return page.getByText(pattern,{exact:false}).first().waitFor({state:'visible'});}

try {
  // Desktop first, then mobile. The captures are actual application rendering,
  // not the older standalone HTML concept or generated product artwork.
  for(const width of [1440,390,320]){
    const f=await fixture({width,height:width===1440?1000:844});
    for(const [view,ready] of [['signals','.lnx-project-card'],['atlas','.lnx-atlas-row'],['people','.lnx-person']]){
      await open(f.page,view==='signals'?'':'?view='+view);
      if(publicSnapshot){
        await f.page.waitForFunction(()=>!document.querySelector('.lnx-loading')&&
          ![...document.querySelectorAll('.lnx-status')].some(e=>/Loading|Checking/.test(e.textContent)));
      }else await settled(f.page,ready);
      await noOverflow(f.page,`${view} ${width}`);
      const layout=await f.page.evaluate(()=>{
        const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height)}};
        const targets=[...document.querySelectorAll('.lnx-mode-switch button,.lnx-search button,.lnx-filter-row,.lnx-atlas-controls button')].map(e=>{
          const r=e.getBoundingClientRect();return {name:e.textContent.trim(),width:Math.round(r.width),height:Math.round(r.height)};
        }).filter(r=>r.width&&r.height);
        return {hero:box('.lnx-intro'),navigation:box('.lnx-mode-switch'),main:box('#lnx-main'),viewportHeight:innerHeight,targets};
      });
      record(`${view} ${width} layout measurements`,layout);
      assert.equal(await f.page.locator('.ir80-companion').count(),1,'One original IREN companion');
      assert.equal(await f.page.locator('main').count(),1,'One Shell main landmark');
      if(width!==320){
        await capture(f.page,`${view}-${width}`);
        if(view==='signals')await capture(f.page,`${view}-${width}-viewport`,{fullPage:false});
      }
    }
    await f.close();
  }

  if(!captureOnly){
    const f=await fixture({scenario:'pagination'});
    await open(f.page,'?category=tools&q=signal&sort=hot');
    await settled(f.page,'.lnx-project-card');
    assert.equal(await f.page.locator('.lnx-project-card').count(),1);
    const more=f.page.locator('.lnx-more-note a').first();
    const discovery=new URL(await more.getAttribute('href'),base);
    assert.equal(discovery.pathname,'/discover');
    assert.equal(discovery.searchParams.get('q'),'signal');
    assert.equal(discovery.searchParams.get('category'),'tools');
    record('Discover continuation retains query and district');
    const detail=new URL(await f.page.locator('.lnx-project-content h3 a').first().getAttribute('href'),base);
    const returnPath=new URL(detail.searchParams.get('from'),base);
    assert.equal(returnPath.pathname,'/discover');
    assert.equal(returnPath.searchParams.get('q'),'signal');
    assert.equal(returnPath.searchParams.get('category'),'tools');
    record('Project detail uses the existing safe public return route with its filters');
    await f.page.locator('#lnx-search').fill('garden');
    await f.page.locator('.lnx-search button[type=submit]').click();
    await visibleText(f.page,'Nothing published in this view yet');
    assert.equal(new URL(f.page.url()).searchParams.get('q'),'garden');
    await f.page.goBack();
    await settled(f.page,'.lnx-project-card');
    assert.equal(await f.page.locator('#lnx-search').inputValue(),'signal');
    assert.equal(new URL(f.page.url()).searchParams.get('category'),'tools');
    record('Search and browser history restore bounded URL state');
    await open(f.page,'?view=people&q=mira');
    await settled(f.page,'.lnx-person');
    const directory=new URL(await f.page.locator('.lnx-more-note a').getAttribute('href'),base);
    assert.equal(directory.pathname,'/creators');assert.equal(directory.searchParams.get('q'),'mira');
    const peopleContext=await f.page.locator('.lnx-context-card h2').innerText();
    await f.page.locator('.lnx-mode-switch').getByRole('button',{name:/District Atlas/}).click();
    await settled(f.page,'.lnx-atlas-row');
    assert.notEqual(await f.page.locator('.lnx-context-card h2').innerText(),peopleContext);
    record('Creator search continuation and section-specific Context Lens');
    await f.close();

    const filters=await fixture();
    await open(filters.page,'?category=research&q=field');
    await settled(filters.page,'.lnx-project-card');
    assert.equal(await filters.page.locator('.lnx-filter-chip').count(),2);
    await filters.page.getByRole('button',{name:'Remove discipline filter: Research'}).click();
    await filters.page.waitForURL(url=>url.searchParams.get('category')===null && url.searchParams.get('q')==='field');
    await settled(filters.page,'.lnx-project-card');
    record('Remove only the discipline filter; project search and results remain');
    await filters.page.goBack();
    await filters.page.waitForURL(url=>url.searchParams.get('category')==='research' && url.searchParams.get('q')==='field');
    await filters.page.getByRole('button',{name:'Remove project search: field'}).click();
    await filters.page.waitForURL(url=>url.searchParams.get('category')==='research' && url.searchParams.get('q')===null);
    assert.equal(await filters.page.locator('#lnx-search').inputValue(),'');
    await settled(filters.page,'.lnx-project-card');
    record('Remove only the search chip; selected discipline and input state remain correct');
    await filters.page.getByRole('button',{name:'Clear all filters'}).click();
    await filters.page.waitForURL(url=>url.searchParams.get('category')===null && url.searchParams.get('q')===null);
    await filters.page.waitForFunction(()=>document.querySelectorAll('.lnx-project-card').length===4);
    assert.equal(await filters.page.locator('.lnx-filter-chip').count(),0);
    record('Clear all filters restores the real public project list');
    await filters.close();

    for(const scenario of ['closed','posts-404','status-error','empty']){
      const f=await fixture({scenario});
      await open(f.page);
      if(scenario==='status-error'){
        await visibleText(f.page,'Discussion availability unknown');
        assert.equal(f.state.requests.filter(r=>r.path==='/api/v1/community/posts').length,0);
        f.state.scenario='ready';
        await f.page.getByRole('button',{name:'Retry availability',exact:true}).click();
        await settled(f.page,'.lnx-thread-card');
        record('Unknown availability fails closed and recovers after retry');
      }else if(scenario==='empty'){
        await visibleText(f.page,'Nothing published in this view yet');
        await visibleText(f.page,'No approved discussions yet');
        await capture(f.page,'empty-1440');
        record('Empty records stay empty without synthetic substitutes');
      }else{
        await visibleText(f.page,'Public conversations not available yet');
        if(scenario==='closed')assert.equal(f.state.requests.filter(r=>r.path==='/api/v1/community/posts').length,0);
        record(scenario+' fails closed');
      }
      await f.close();
    }

    const loading=await fixture({scenario:'loading'});
    await loading.page.goto(base+'/__review/commons',{waitUntil:'domcontentloaded'});
    await visibleText(loading.page,/Loading approved public projects/);
    assert.equal(await loading.page.locator('.lnx-project-card').count(),0);
    loading.state.scenario='ready';loading.state.slow.splice(0).forEach(release=>release());
    await settled(loading.page,'.lnx-project-card');
    record('Loading state resolves to real response records');
    await loading.close();

    const failures=await fixture({scenario:'errors'});
    await open(failures.page);
    await visibleText(failures.page,'Public project catalogue unavailable');
    await visibleText(failures.page,'Discussions temporarily unavailable');
    await capture(failures.page,'errors-1440');
    failures.state.scenario='ready';
    await failures.page.getByRole('button',{name:'Retry projects',exact:true}).focus();
    await failures.page.keyboard.press('Enter');
    await settled(failures.page,'.lnx-project-card');
    assert.equal(await failures.page.evaluate(()=>document.activeElement?.id),'lnx-projects');
    record('Keyboard retry keeps focus on its persistent result section');
    await failures.page.getByRole('button',{name:'Retry discussions',exact:true}).click();
    await settled(failures.page,'.lnx-thread-card');
    record('Independent project and discussion recovery');
    failures.state.scenario='errors';
    await open(failures.page,'?view=people');
    await visibleText(failures.page,'Public creators unavailable');
    failures.state.scenario='ready';
    await failures.page.getByRole('button',{name:'Retry directory',exact:true}).click();
    await settled(failures.page,'.lnx-person');
    record('Creator directory recovery');
    failures.state.scenario='errors';
    await open(failures.page,'?view=atlas');
    await failures.page.getByRole('button',{name:'Retry counts',exact:true}).waitFor();
    failures.state.scenario='ready';
    await failures.page.getByRole('button',{name:'Retry counts',exact:true}).click();
    await failures.page.waitForFunction(()=>[...document.querySelectorAll('.lnx-atlas-row')].some(e=>e.textContent.includes('1 approved project')));
    record('Atlas category totals recover without blocking district navigation');
    await failures.close();

    const mobile=await fixture({width:390,height:844});
    await open(mobile.page,'?view=atlas');
    const list=mobile.page.getByRole('button',{name:'Accessible list',exact:true});
    assert.equal(await list.getAttribute('aria-pressed'),'true');
    const map=mobile.page.getByRole('button',{name:'Spatial map',exact:true});
    await map.click();
    await mobile.page.locator('.lnx-atlas-map').waitFor({state:'visible'});
    assert.equal(await map.getAttribute('aria-pressed'),'true');
    assert.equal(new URL(mobile.page.url()).searchParams.get('atlas'),'map');
    await mobile.page.waitForFunction(() => document.querySelector('.lnx-atlas-controls button[aria-pressed="true"]')===document.activeElement);
    assert.equal(await map.evaluate(el=>el===document.activeElement),true,'Changing presentation retains keyboard focus');
    await noOverflow(mobile.page,'Atlas mobile optional map');
    await capture(mobile.page,'atlas-map-390');
    await mobile.page.reload({waitUntil:'domcontentloaded'});
    await mobile.page.locator('.lnx-atlas-map').waitFor({state:'visible'});
    assert.equal(await map.getAttribute('aria-pressed'),'true');
    record('Atlas spatial layout survives copyable URL and hard reload on a phone');
    await list.click();
    assert.equal(await list.getAttribute('aria-pressed'),'true');
    await mobile.page.waitForFunction(() => document.querySelector('.lnx-atlas-controls button[aria-pressed="true"]')===document.activeElement);
    assert.equal(await list.evaluate(el=>el===document.activeElement),true,'List selection retains keyboard focus despite Shell navigation');
    assert.equal(new URL(mobile.page.url()).searchParams.get('atlas'),'list');
    await mobile.page.goBack();
    await mobile.page.waitForURL(url=>url.searchParams.get('atlas')==='map');
    await mobile.page.locator('.lnx-atlas-map').waitFor({state:'visible'});
    await mobile.page.getByRole('button',{name:'Use device default'}).click();
    await mobile.page.waitForURL(url=>url.searchParams.get('atlas')===null);
    // The URL may settle one render ahead of React's responsive default.
    // Wait for *both* the selected state and focus before asserting either.
    await mobile.page.waitForFunction(() => {
      const selected = document.querySelector('.lnx-atlas-controls button[aria-pressed="true"]');
      return selected?.textContent?.includes('Accessible list') && document.activeElement === selected;
    });
    assert.equal(await list.getAttribute('aria-pressed'),'true');
    assert.equal(await list.evaluate(el=>el===document.activeElement),true,'Device default restores focus to the active layout control');
    record('Atlas history restores map selection; device default returns to accessible list');
    await mobile.page.locator('.lnx-atlas-row').first().click();
    assert.equal(new URL(mobile.page.url()).searchParams.get('category'),'games');
    await settled(mobile.page,'.lnx-project-card');
    await mobile.page.waitForFunction(()=>document.activeElement?.id==='lnx-main');
    const contentTop=await mobile.page.locator('#lnx-main').evaluate(e=>e.getBoundingClientRect().top);
    assert.ok(contentTop>=-1&&contentTop<200,'Local navigation should land at the content, not repeat the hero');
    record('Mobile Atlas exposes accurate list and optional map controls');
    record('Local district navigation restores content focus and viewport position');
    await mobile.close();

    const motion=await fixture({reducedMotion:'no-preference'});
    await open(motion.page);
    assert.equal(await motion.page.locator('.lnx-root').getAttribute('data-motion'),'on');
    await motion.page.locator('.lnx-motion-switch').click();
    assert.equal(await motion.page.locator('.lnx-root').getAttribute('data-motion'),'off');
    await motion.page.locator('.lnx-motion-switch').click();
    assert.equal(await motion.page.locator('.lnx-root').getAttribute('data-motion'),'on');
    await motion.page.emulateMedia({reducedMotion:'reduce'});
    await motion.page.waitForFunction(()=>document.querySelector('.lnx-root')?.dataset.motion==='off');
    assert.match(await motion.page.locator('.lnx-motion-switch').innerText(),/Reduced motion is on/);
    assert.equal(await motion.page.locator('.lnx-motion-switch').isDisabled(),true);
    assert.equal(await motion.page.locator('.lnx-intro-shape').evaluate(e=>getComputedStyle(e).animationName),'none');
    record('Motion pause/resume and operating-system reduced motion');
    await motion.page.locator('.lnx-skip').focus();
    await motion.page.keyboard.press('Enter');
    assert.equal(await motion.page.evaluate(()=>document.activeElement?.id),'lnx-main');
    await motion.page.keyboard.press('Tab');
    const focus=await motion.page.evaluate(()=>({inside:document.querySelector('.lnx-root').contains(document.activeElement),outline:getComputedStyle(document.activeElement).outlineStyle}));
    assert.equal(focus.inside,true);assert.notEqual(focus.outline,'none');
    record('Skip link and keyboard-visible focus');
    await motion.close();
  }
  assert.deepEqual(errors,[],'Uncaught browser errors');
  assert.deepEqual(forbidden,[],'External, private, unexpected or mutating requests');
  record('No external services, private profile reads, or write requests');
  const receipt={
    session:'ANEVUM.WEB.BUILD.2026-10-23.007.LIVING-COMMONS-REACT-BRIDGE',
    sourceHead,sourceTrackedChanges,
    compiledReact:true,syntheticPublicFixtures:!publicSnapshot,readOnlyPublicSnapshot:Boolean(publicSnapshot),productionAcceptance:false,
    engine,captureOnly,checks,captures,requests,errors,forbidden
  };
  writeFileSync(join(output,'browser-review.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({result:'PASS',engine,checks:checks.length,captures:captures.length,output,captureOnly}));
} catch(error) {
  writeFileSync(join(output,'browser-review-failure.json'),JSON.stringify({
    sourceHead,sourceTrackedChanges,engine,captureOnly,checks,captures,requests,errors,forbidden,
    error:{name:error.name,message:error.message}
  },null,2)+'\n');
  throw error;
} finally {
  await browser.close();
  await new Promise(r=>server.close(r));
  rmSync(build,{recursive:true,force:true});
}
