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
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store',
    // Exact production HTML policy read from anevum.com on 2026-10-24.
    // In particular: no unsafe-eval, wasm-unsafe-eval, blob worker or CDN.
    ...(extname(file)==='.html'?{'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; frame-src 'self'"}:{})});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const fixture={id:'v136-ci-fixture',title:'SYNTHETIC CI PROJECT',summary:'Loopback fixture only; not a real release.',
  category:'games',freeToUse:true,license:'MIT',publishedAt:'2026-10-24T12:00:00Z',creatorName:'CI fixture',creatorHandle:null};
const packageFixture={id:'123e4567-e89b-42d3-a456-426614174000',
  title:'SYNTHETIC APPROVED PACKAGE',summary:'Loopback-only approved package inspection fixture.',
  category:'game',version:1,status:'published',draft_status:null,cover_url:null,
  play_url:'/upload/v3/play/123e4567-e89b-42d3-a456-426614174000',published_at:1792843200};
const record=(name,data={})=>{checks.push({name,...data});console.log('PASS '+name);};
async function contextFor(width,{motion='reduce',state='empty',forceVector=false}={}){
  const context=await browser.newContext({viewport:{width,height:width===1536?1024:width<650?844:960},// CI tests CSS-pixel geometry at 1x to bound software-WebGL capture memory;
    // device-pixel 2x visual checks are a separate physical-device gate.
    deviceScaleFactor:1,reducedMotion:motion});
  if(forceVector)await context.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,...args){
      return kind==='webgl2'?null:original.call(this,kind,...args);
    };
  });
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base||!['GET','HEAD'].includes(request.method())){forbidden.push({url:request.url(),method:request.method()});await route.abort();return;}
    // The isolated uploader is optional. No real upload or unpublished package
    // endpoint is contacted during this loopback-only acceptance.
    if(state==='studio'&&url.pathname==='/upload/v3/api/v1/packages/native/session'){
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({contract:'native-creator-v095',memberId:'00000000000000000000000000000099',canUpload:true,canReview:false,resourceProtection:true})});return;
    }
    if(url.pathname==='/upload/v3/api/v1/packages/projects'){
      const published=state==='package';
      await route.fulfill({status:published?200:404,contentType:'application/json',
        body:JSON.stringify(published?{projects:[packageFixture]}:{error:'CI optional uploader disabled'})});
      return;
    }
    if(url.pathname.startsWith('/api/')){
      const page=items=>({items,count:items.length,nextCursor:null});
      const path=url.pathname;
      // Explicit public API shapes prevent test-only null responses from
      // masquerading as successful catalogue, forums or member feed reads.
      // Unknown/private endpoints remain 404 (fail closed).
      const value=path==='/api/v1/member/auth/get-session'?(state==='studio'?{user:{id:'00000000000000000000000000000099',name:'SYNTHETIC LOCAL CREATOR',email:'ci@anevum.invalid',emailVerified:true,createdAt:'2026-10-24T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'},session:{id:'loopback-fixture-only',userId:'00000000000000000000000000000099',expiresAt:'2030-01-01T00:00:00Z'}}:null):
        path==='/api/v1/projects'?page(state==='project'?[fixture]:[]):
        path==='/api/v1/status'?{features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
        path==='/api/v1/creators'?page([]):
        path==='/api/v1/categories'?{categories:[]}:
        path==='/api/v1/community/threads'?{items:[],nextCursor:null}:
        path==='/api/v1/community/members'||path==='/api/v1/community/activity'?{items:[],nextCursor:null}:null;
      const recognized=value!==null||path==='/api/v1/member/auth/get-session';
      const status=state==='unavailable'&&path==='/api/v1/projects'?503:recognized?200:404;
      await route.fulfill({status,contentType:'application/json',
        body:JSON.stringify(status===503?{error:'CI unavailable fixture'}:
          status===404?{error:'CI route not provided'}:value)});return;
    }
    await route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER_RUNTIME_ERROR '+(e.stack||e.message));});
  return {page,context};
}
try{
  // The source workstation is reached only through a session-bound creator
  // pilot fixture. Packaging is local; POST, publication and remote runtime
  // execution remain forbidden in this acceptance context.
  for(const width of [1440,390,320]){
    const {page,context}=await contextFor(width,{state:'studio',forceVector:true});
    await page.goto(base+'/studio/packages/new',{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{name:'Transmit a creation.'}).waitFor();
    await page.getByRole('button',{name:'Artifact source workbench',exact:true}).click();
    const workbench=page.locator('[data-artifact-workbench="v136.011"]');await workbench.waitFor();
    await workbench.getByRole('button',{name:'Open file…',exact:true}).click();
    const fileSearch=workbench.getByRole('combobox',{name:/Find a local source file/});
    await fileSearch.fill('styles');
    assert.equal(await workbench.getByRole('option').count(),1,'Quick open filters actual local file paths');
    await fileSearch.press('Enter');
    assert.equal(await workbench.getByRole('tab',{name:'styles.css',exact:true}).getAttribute('aria-selected'),'true');
    await workbench.getByRole('button',{name:'Open file…',exact:true}).click();
    await fileSearch.fill('no-such-source-file');
    await workbench.getByText('No matching local source files.',{exact:true}).waitFor();
    await fileSearch.press('Escape');
    assert.equal(await workbench.getByRole('combobox').count(),0,'Escape closes local source search');
    await workbench.getByRole('tab',{name:'index.html',exact:true}).click();
    assert.equal(await page.locator('.p136017-studio-quicknav').count(),1,'Private Studio uses the actual command rail');
    assert.equal(await page.locator('.p136017-studio-quicknav a[href="/studio/records"]').count(),1,'Project library remains real route navigation');
    assert.equal(await workbench.locator('.p136017-source-functionbar').count(),1,'Local source instrumentation is available');
    assert.ok((await workbench.locator('.p136017-source-ledge').innerText()).includes('index.html'),
      'Authoring instrument describes the current real file, never a simulated preview');
    if(width===1440){
      await page.locator('[data-source-editor="monaco"]').waitFor({timeout:30000});
      // Chromium's native EditContext uses a textbox DIV. Its hidden readonly
      // IME textarea is not the editor input. Enter through the actual tab order.
      await workbench.getByRole('tab',{name:'index.html',exact:true}).press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Source editor for index.html');
      await page.keyboard.press('Control+End');
      await page.waitForFunction(()=>/^Ln (?:[2-9]|[0-9]{2,}), Col [0-9]+$/.test(document.querySelector('[data-source-cursor]')?.textContent||''));
      const position=await workbench.locator('[data-source-cursor]').innerText();
      await workbench.getByRole('tab',{name:'styles.css',exact:true}).click();
      await workbench.getByRole('tab',{name:'index.html',exact:true}).click();
      assert.equal(await workbench.locator('[data-source-cursor]').innerText(),position,
        'Switching Monaco models restores the real cursor position for each local file');
      await workbench.getByRole('tab',{name:'index.html',exact:true}).press('Tab');
      await page.keyboard.press('Control+p');
      await fileSearch.fill('main.js');
      await fileSearch.press('ArrowDown');
      await fileSearch.press('Enter');
      assert.equal(await workbench.getByRole('tab',{name:'main.js',exact:true}).getAttribute('aria-selected'),'true',
        'Quick open works directly from Monaco without invoking browser print');
      await workbench.locator('#p136-source-new').fill('assets/notes.md');
      await workbench.getByRole('button',{name:'Create source file',exact:true}).click();
      const folder=workbench.getByRole('button',{name:'Folder assets',exact:true});
      await folder.waitFor();
      assert.equal(await workbench.getByRole('button',{name:'assets/notes.md',exact:true}).count(),1,'Nested local source is listed under its real folder');
      await folder.click();
      assert.equal(await workbench.getByRole('button',{name:'assets/notes.md',exact:true}).count(),0,'Collapsing a folder hides only its file buttons');
      await folder.click();
      assert.equal(await workbench.getByRole('button',{name:'assets/notes.md',exact:true}).count(),1,'Expanding restores the real source file');
      await workbench.getByRole('button',{name:'Rename file',exact:true}).click();
      await workbench.locator('#p136017-file-rename').fill('assets/reference.md');
      await workbench.getByRole('button',{name:'Save file path',exact:true}).click();
      assert.equal(await workbench.getByRole('button',{name:'assets/notes.md',exact:true}).count(),0);
      assert.equal(await workbench.getByRole('button',{name:'assets/reference.md',exact:true}).count(),1,
       'Renaming a local source changes the actual source tree, not a presentation label');
      await workbench.locator('#p136-source-new').fill('assets/scratch.js');
      await workbench.getByRole('button',{name:'Create source file',exact:true}).click();
      await workbench.getByRole('button',{name:'Remove file',exact:true}).click();
      await workbench.getByRole('button',{name:'Keep file',exact:true}).click();
      assert.equal(await workbench.getByRole('button',{name:'assets/scratch.js',exact:true}).count(),1,
       'Cancel keeps the real local source untouched');
      await workbench.getByRole('button',{name:'Remove file',exact:true}).click();
      await workbench.getByRole('button',{name:'Confirm remove file',exact:true}).click();
      assert.equal(await workbench.getByRole('button',{name:'assets/scratch.js',exact:true}).count(),0,
       'Confirmed removal drops only the selected local source');
      assert.equal(await workbench.getByRole('button',{name:'Rename file',exact:true}).isDisabled(),true,
       'The canonical root entrypoint cannot be renamed');

    }
    else assert.equal(await page.locator('[data-source-editor="monaco"]').count(),0,'Phone uses accessible text editor without Monaco allocation');
    assert.equal(await page.locator('.p136-living-world').getAttribute('data-enabled'),'false','Private source never enters public GPU');
    await workbench.getByRole('button',{name:'Prepare build archive',exact:true}).click();
    await page.locator('.av095-drop strong').filter({hasText:'continuance-build.zip'}).waitFor();
    await page.getByText('Browser build candidate',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Prepare private playtest',exact:true}).isDisabled(),true,'Archive creation never confirms publication rights or uploads');
    const workstationLayout=await workbench.evaluate(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height,pageHeight:document.documentElement.scrollHeight}));
    assert.ok(workstationLayout.height<2400,'Workbench dimensions remain bounded: '+JSON.stringify(workstationLayout));
    const visualWidth=await workbench.evaluate(node=>{
      const editor=node.querySelector('.p136-source-stage');
      const guide=node.closest('.av095-upload-grid')?.querySelector('.av095-guide');
      const panel=node.closest('.av095-upload-grid')?.querySelector('.st-panel');
      const box=editor?.getBoundingClientRect();
      const guideBox=guide?.getBoundingClientRect();
      const panelBox=panel?.getBoundingClientRect();
      return {editor:box?.width||0,guideTop:guideBox?.top||0,
        panelBottom:panelBox?.bottom||0,container:node.getBoundingClientRect().width};
    });
    assert.ok(visualWidth.editor>=(width===1440?440:width===390?255:190),
      'Code editor must be usable inside real nested Studio layout: '+JSON.stringify({width,...visualWidth}));
    if(width===1440)assert.ok(visualWidth.guideTop>=visualWidth.panelBottom-2,
      'Protocol guide belongs below the active editor, never beside and compressing it: '+JSON.stringify(visualWidth));
    if(width<650){
      const explorerFits=await workbench.locator('.p136-source-explorer nav button').evaluateAll(nodes=>nodes.every(button=>{
        const label=button.lastElementChild,range=document.createRange();range.selectNodeContents(label);
        return range.getBoundingClientRect().right<=button.getBoundingClientRect().right+1;
      }));
      assert.equal(explorerFits,true,'Phone source file labels never overlap neighbouring controls');
    }
    // Show the actual nonempty source and syntax colors in review evidence;
    // the newly-created Markdown note is deliberately blank, not an IDE demo.
    await workbench.getByRole('tab',{name:'index.html',exact:true}).click();
    await workbench.scrollIntoViewIfNeeded();
    // Private source editing does not need to compete for GPU resources with
    // prior public WebGL stress tests. Retain genuine browser screenshot QA.
    await page.screenshot({path:join(out,'artifact-workbench-'+width+'.png'),
      fullPage:false,animations:'disabled',timeout:90000});
    if(width===1440)await workbench.getByRole('button',{name:'Accessible text editor',exact:true}).click();
    await workbench.getByRole('button',{name:/styles\.css$/}).click();
    await workbench.locator('.p136-source-fallback textarea').fill('body { color: #ffffff; background: #06101d; }');
    await page.locator('.av095-drop strong').filter({hasText:'Choose a ZIP or HTML file'}).waitFor();
    assert.equal(await page.locator('.p136-source-state').innerText(),'LOCAL CHANGES','Editing invalidates the previously prepared archive');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(overflow,false,'Workbench has no horizontal page overflow');
    record('session-bound source workstation / real editor / native ZIP compatibility / stale archive invalidation '+width,{monaco:width===1440,uploads:0});
    await context.close();
  }
  // Direct evidence gate: poster presentation is NOT proof of underlying
  // 3D architectural parity. Capture both renderings in the same authenticated-
  // free loopback context and publish original PNGs for independent art review.
  if(process.env.VITE_PARITY_V136_CINEMATIC==='true'){
    for(const width of [1536,1440,390,320]){
      const {page,context}=await contextFor(width,{motion:'no-preference'});
      await page.goto(base,{waitUntil:'domcontentloaded'});
      const inspect=page.getByRole('button',{name:'Inspect live 3D scene'});
      await inspect.waitFor();
      await page.waitForFunction(()=>{
        const control=document.querySelector('[data-cinematic-inspection="v136.017"]');
        const canvas=document.querySelector('.p136-living-canvas');
        const poster=document.querySelector('.p136-cinematic-art img');
        return control?.getAttribute('data-scene-readiness')==='ready'&&
          canvas?.dataset.assetState==='ready'&&
          poster?.complete&&poster?.naturalWidth>0;
      },null,{timeout:60000});
      const reality=await page.evaluate(()=>{
        const world=document.querySelector('.p136-living-world');
        const canvas=document.querySelector('.p136-living-canvas');
        return {renderer:world?.dataset.renderer,canvasCount:document.querySelectorAll('.p136-living-canvas').length,
          modelState:canvas?.dataset.assetState,metrics:JSON.parse(canvas?.dataset.metrics||'{}')};
      });
      assert.equal(reality.renderer,'webgl','Actual Three.js scene, not vector fallback');
      assert.equal(reality.canvasCount,1,'One persistent 3D scene / one GPU context');
      assert.equal(reality.metrics.family,'atrium','The scene still uses the canonical Atrium family');
      if(process.env.VITE_PARITY_V136_HORIZON_QA==='true'){
        assert.equal(await page.locator('.p136-living-canvas').getAttribute('data-horizon'),
          'qa-only','The same original canvas owns the approved QA-only planetary horizon');
        assert.equal(await page.locator('.p136-living-canvas').getAttribute('data-horizon-composition'),
          'open-institute','The QA exterior cannot be occluded by the legacy Atrium roof');
      }
      const openExterior=process.env.VITE_PARITY_V136_HORIZON_QA==='true';
      assert.ok(reality.metrics.models>=1&&reality.metrics.triangles>(openExterior&&width<850?6000:10000)&&reality.metrics.drawCalls>0,
        'The 3D screenshot must contain real modeled geometry: '+JSON.stringify(reality));
      if(openExterior)assert.ok(reality.metrics.triangles<=(width<850?10000:25000)+128,
        'Actual exterior render excludes the occluding Atrium roof; only bounded horizon plus compositor quads: '+JSON.stringify(reality.metrics));
      const first=await page.screenshot({path:join(out,'arrival-poster-review-'+width+'.png'),
        fullPage:false,animations:'disabled'});
      assert.equal(await inspect.isDisabled(),false,'Loaded model enables live inspection');
      await inspect.click();
      await page.waitForFunction(()=>{
        const cinema=document.querySelector('[data-cinematic-v136]');
        return cinema?.dataset.inspection==='live'&&Number.parseFloat(getComputedStyle(cinema).opacity)<.05;
      });
      await page.waitForTimeout(400);
      const live=await page.screenshot({path:join(out,'arrival-real-webgl-review-'+width+'.png'),
        fullPage:false,animations:'disabled'});
      assert.ok(live.length>10000,'The actual scene capture cannot be empty');
      assert.ok(!first.equals(live),'Live model screenshot must not be identical to the cinematic poster');
      const liveHeroPaint=await page.locator('.p136-hero').evaluate(node=>{
        const style=getComputedStyle(node);
        return {image:style.backgroundImage,color:style.backgroundColor};
      });
      assert.equal(liveHeroPaint.image,'none',
        'Inspected WebGL cannot be concealed behind the old opaque hero gradient');
      assert.ok(liveHeroPaint.color==='transparent'||liveHeroPaint.color==='rgba(0, 0, 0, 0)',
        'Inspected stage must be transparent above one shared canvas: '+JSON.stringify(liveHeroPaint));
      assert.equal(await page.locator('.p136-living-canvas').count(),1,'Inspection reuses one persistent GPU canvas');
      assert.ok(await page.locator('.p136-button--primary').isVisible(),'Real public navigation remains accessible');
      const reset=page.getByRole('button',{name:'Return to cinematic arrival'});
      assert.equal(await reset.getAttribute('aria-pressed'),'true');
      await reset.click();
      await page.waitForFunction(()=>{
        const cinema=document.querySelector('[data-cinematic-v136]');
        return cinema?.dataset.inspection==='cinematic'&&Number.parseFloat(getComputedStyle(cinema).opacity)>.95;
      });
      await page.screenshot({path:join(out,'arrival-after-inspection-'+width+'.png'),
        fullPage:false,animations:'disabled'});
      if(width===1440&&process.env.VITE_PARITY_V136_HORIZON_QA==='true'){
        const canvas=page.locator('.p136-living-canvas');
        await page.waitForFunction(()=>
          document.querySelector('.p136-living-canvas')?.dataset.horizonTier==='desktop');
        await page.setViewportSize({width:390,height:844});
        await page.waitForFunction(()=>
          document.querySelector('.p136-living-canvas')?.dataset.horizonTier==='mobile');
        assert.equal(await canvas.count(),1,'Viewport retiering keeps the original renderer');
        await page.setViewportSize({width:1440,height:960});
        await page.waitForFunction(()=>
          document.querySelector('.p136-living-canvas')?.dataset.horizonTier==='desktop');
        record('live desktop to mobile to desktop QA geometry reallocation / one canvas',
          {tierRestored:'desktop',rendererCount:1});
      }
      record('direct same-context poster vs real WebGL '+(openExterior?'Institute exterior':'Atrium')+' visual evidence '+width,{
        width,renderer:reality.renderer,models:reality.metrics.models,
        triangles:reality.metrics.triangles,drawCalls:reality.metrics.drawCalls,
        composition:openExterior?'QA open Institute':'canonical Atrium',
        approvedConceptParity:false,realDeviceTested:false});
      await context.close();
    }
  }
  for(const width of [1920,1536,1440,1024,768,390,320]){
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
    if(process.env.VITE_PARITY_V136_CINEMATIC==='true'){
      const cinema=page.locator('[data-cinematic-v136="poster-pilot"]');
      assert.equal(await cinema.count(),1,'One authored cinematic presentation layer');
      const cinemaRead=await cinema.evaluate(node=>{
        const image=node.querySelector('img');
        return {hidden:node.getAttribute('aria-hidden'),pointerEvents:getComputedStyle(node).pointerEvents,
          imageLoaded:Boolean(image?.complete&&image?.naturalWidth>0),mode:node.dataset.mode,
          imageSrc:image?.currentSrc};
      });
      assert.equal(cinemaRead.hidden,'true','Cinematic artwork is decorative, not fake content');
      assert.equal(cinemaRead.pointerEvents,'none','Cinematic layer cannot block real navigation');
      assert.ok(cinemaRead.imageLoaded,'Verified same-origin cinematic poster loads');
      assert.equal(cinemaRead.mode,'poster','Unapproved motion must remain disabled');
      assert.ok(cinemaRead.imageSrc.startsWith(base+'/assets/parity-v136/'),'Only approved original source artwork');
    } else assert.equal(await page.locator('[data-cinematic-v136]').count(),0,'Cinematic pilot is opt-in');

    assert.equal(layout.h1Count,1);assert.equal(layout.dockCount,1,'One canonical IREN companion');
    assert.equal(await page.locator('.p136-console-wayfinder').count(),1,'Exactly one persistent console wayfinder');
    assert.equal(await page.locator('.p136-studio-console').count(),0,'Private Studio explorer never appears for anonymous visitor');
    assert.equal(await page.locator('.p136-console-wayfinder a[data-station]').count(),5,'Five real route stations');
    assert.equal(await page.locator('.p136-console-wayfinder').getByRole('button',{name:'Open IREN companion'}).count(),1,
      'One IREN launcher belongs to the persistent console; the header may also open the same companion');
    assert.equal(await page.locator('.p136-console-member').count(),1,
      'One canonical member entry is integrated into console');
    assert.equal(await page.getByRole('button',{name:'Search and quick navigation'}).count(),1,
      'Search command remains discoverable');

    assert.equal(await page.locator('[data-art="continuance-original-optics"]').count(),1,
      'One first-party, noninteractive Arrival engraving preserves the existing scene');
    assert.equal(await page.locator('.p136017-hero-upperline[aria-hidden="true"]').count(),1,
      'Authored hero metadata is explicitly decorative, never fabricated telemetry');
    await page.screenshot({path:join(out,'arrival-'+width+'.png'),fullPage:false,animations:'disabled'});
    assert.ok(layout.artLoaded,'Procedural vector and GPU canvas available');
    assert.ok(['webgl','vector'].includes(layout.renderer),'Supported live world renderer');
    if(width>=1440){
      assert.ok(layout.headingLines<=2.22,'Two authored headline rows, including intentional optical interline spacing: '+JSON.stringify(layout));
      assert.ok(layout.hero.height>=665&&layout.hero.height<=895,
        'New authored Arrival fills a cinematic viewport without overwhelming the first page: '+JSON.stringify(layout));
    }
    assert.ok(!/Georgia|Cambria/.test(layout.headingFont),'Concept uses sans typography');
    assert.equal(layout.animation,'none','Reduced motion has a static scene');
    for(const rect of [layout.primary,layout.secondary]){assert.ok(rect.height>=44);assert.ok(rect.width>=44);assert.ok(rect.left>=0&&rect.right<=width);}
    if(width<650)assert.ok(layout.primary.bottom<750,'Primary action stays in the first phone viewport');
    await page.screenshot({path:join(out,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    record('responsive arrival '+width,layout);
    if(width===390){
      const stations=page.locator('.p136-console-wayfinder a[data-station]');
      await stations.first().focus();
      await stations.first().press('ArrowRight');
      assert.equal(await stations.nth(1).evaluate(el=>el===document.activeElement),true,'Controller right focuses next station');
      await stations.nth(1).press('End');
      assert.equal(await stations.last().evaluate(el=>el===document.activeElement),true,'Controller End focuses final station');
      await stations.last().press('Home');
      assert.equal(await stations.first().evaluate(el=>el===document.activeElement),true,'Controller Home focuses first station');
    }
    await page.getByRole('link',{name:'Explore projects',exact:true}).click();
    await page.waitForURL(base+'/discover');
    await page.locator('.av73-discover').waitFor();
    assert.equal(await page.locator('.av73-discover').count(),1);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByRole('link',{name:'Join the community',exact:true}).click();
    await page.waitForURL(base+'/join');
    await page.getByRole('heading',{name:/ENTER THE\s*CONTINUANCE\./i}).waitFor();
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('.p136-console-wayfinder').getByRole('button',{name:'Open IREN companion',exact:true}).click();
    assert.equal(await page.locator('.ir80-dock').count(),1);
    await page.waitForFunction(()=>!!document.querySelector('.ir80-guide-layer,.ir123-tour,.ir92-tour,.ir87-panel'));
    record('canonical Discover / Join / IREN '+width);
    await context.close();
  }
  // Public destinations share the single WebGL canvas, while canonical
  // community and creators components keep their working content/controls.
  {
    const {page,context}=await contextFor(390);
    await page.goto(base,{waitUntil:'networkidle'});
    for(const [path,sector,selector] of [
      ['/community','community','.ch7-hub'],
      ['/creators','creators','.portal-creators'],
      ['/','hero','.p136-portal']
    ]){
      await page.goto(base+path,{waitUntil:'networkidle'});
      await page.locator(selector).waitFor();
      if(path==='/community'){
        assert.equal(await page.locator('.ch7-portals a').count(),4,'Four real community paths remain');
      }
      await page.locator('.p136-living-world[data-enabled="true"][data-sector="'+sector+'"]').waitFor();
      assert.equal(await page.locator('.p136-living-canvas').count(),1,
        'A single GPU surface exists on '+path);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),
        'Spatial routes do not overflow phone viewport: '+path);
    }
    record('WebGL public sectors / protected DOM route continuity');
    await context.close();
  }
  for(const state of ['project','unavailable']){
    const {page,context}=await contextFor(390,{state});
    await page.goto(base,{waitUntil:'networkidle'});
    if(state==='project'){
      await page.getByRole('heading',{name:fixture.title,exact:true}).waitFor();
      assert.equal(await page.getByRole('link',{name:'View '+fixture.title,exact:true}).count(),1);
      // The homepage remains a direct project link. Inspection is a
      // Discover-only affordance and must not be invented on the homepage.
      // Discover may keep optional catalogue/background reads active.
      // DOM readiness plus the exact approved project is the acceptance gate,
      // not a global network-silence heuristic.
      await page.goto(base+'/discover',{waitUntil:'domcontentloaded'});
      await page.getByRole('heading',{name:fixture.title,exact:true}).waitFor();
      const inspect=page.getByRole('button',{name:'Inspect '+fixture.title,exact:true});
      assert.equal(await inspect.count(),1,'Approved project has one optional Artifact Lens action');
      const before=page.url();
      await inspect.click();
      const lens=page.locator('.p136-artifact-lens[open]');
      await lens.waitFor();
      assert.equal(await lens.getByRole('heading',{name:fixture.title,exact:true}).count(),1);
      assert.equal(await lens.getByText(fixture.summary,{exact:true}).count(),1);
      assert.equal(await lens.getByText('CI fixture',{exact:true}).count(),1,'Real creator field is used');
      await page.waitForFunction(()=>document.querySelector('.p136-living-world')?.dataset.geometry==='forge');
      assert.equal(page.url(),before,'Inspecting a public release never mutates the route');
      assert.equal(await lens.getByRole('link',{name:'Open project record'}).count(),1);
      await page.screenshot({path:join(out,'artifact-lens-project-390.png'),animations:'disabled'});
      await lens.getByRole('button',{name:'Return to results'}).click();
      await page.waitForFunction(()=>!document.querySelector('.p136-artifact-lens[open]'));
      await page.waitForFunction(()=>document.querySelector('.p136-living-world')?.dataset.geometry==='archive');
      await inspect.click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('.p136-artifact-lens[open]'));
      assert.equal(page.url(),before,'Escape closes inspection without navigation');
      record('Artifact Lens approved project / native dialog / Escape / real data / scene morph', {url:before});
    }else await page.getByText('The public index is temporarily unavailable',{exact:true}).waitFor();
    await page.screenshot({path:join(out,'catalogue-'+state+'-390.png'),fullPage:true,animations:'disabled'});
    record('honest catalogue '+state);await context.close();
  }
  // Exercise the second public source independently: only approved packages
  // can open the Artifact Lens, and their play URLs remain canonical.
  {
    const {page,context}=await contextFor(390,{state:'package'});
    await page.goto(base+'/discover',{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{name:packageFixture.title,exact:true}).waitFor();
    const before=page.url();
    const inspect=page.getByRole('button',{name:'Inspect '+packageFixture.title,exact:true});
    await inspect.click();
    const lens=page.locator('.p136-artifact-lens[open]');
    await lens.waitFor();
    assert.equal(await lens.getByRole('heading',{name:packageFixture.title,exact:true}).count(),1);
    assert.equal(await lens.getByText(packageFixture.summary,{exact:true}).count(),1);
    assert.equal(await lens.getByText('Approved browser package',{exact:true}).count(),1);
    const action=lens.getByRole('link',{name:'Open approved release'});
    assert.equal(await action.getAttribute('href'),packageFixture.play_url,
      'Public package action retains the approved canonical player path');
    assert.equal(page.url(),before,'Inspecting approved package never changes route');
    await page.screenshot({path:join(out,'artifact-lens-package-390.png'),animations:'disabled'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('.p136-artifact-lens[open]'));
    record('approved package Artifact Lens / canonical player path / Escape / unchanged URL');
    await context.close();
  }
  // Exercise the actual production Three.js module and compressed GLBs,
  // rather than treating the retained standalone shader test as mesh evidence.
  for(const width of [1536,1440,390]){
    const {page,context}=await contextFor(width,{motion:'reduce'});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>{
      const canvas=document.querySelector('.p136-living-canvas');
      return canvas?.dataset.engine==='three'&&canvas.dataset.assetState==='ready';
    },null,{timeout:30000});
    await page.evaluate(()=>{document.querySelector('.p136-living-canvas').dataset.acceptanceIdentity='persistent'});
    const snapshots=[];
    for(const [route,family] of [['/','atrium'],['/discover','archive'],['/discover?category=games','forge'],['/community','relay']]){
      if(route==='/discover')await page.locator('.p136-console-wayfinder').getByRole('link',{name:'Discover',exact:true}).click();
      if(route.includes('category'))await page.getByRole('button',{name:/Games Independent play/i}).first().click();
      if(route==='/community')await page.locator('.p136-console-wayfinder').getByRole('link',{name:'Commons',exact:true}).click();
      await page.waitForFunction(family=>{
        const c=document.querySelector('.p136-living-canvas');
        const metrics=c?.dataset.metrics?JSON.parse(c.dataset.metrics):null;
        return c?.dataset.assetState==='ready'&&metrics?.family===family;
      },family,{timeout:30000});
      // Model readiness is independent of React's lazy route module. Capture
      // the functioning route, never a Suspense/loading screen over a ready mesh.
      if(family==='atrium')await page.getByRole('heading',{level:1,name:/Independent worlds/i}).waitFor();
      else if(family==='relay')await page.locator('#ch7-hero-title').waitFor();
      else await page.locator('#p136-discover-title').waitFor();
      await page.waitForFunction(()=>document.querySelector('.p136-living-canvas')?.dataset.textureState!=='loading',null,{timeout:20000});
      const metrics=await page.locator('.p136-living-canvas').evaluate(c=>({
        ...JSON.parse(c.dataset.metrics),width:c.width,height:c.height,identity:c.dataset.acceptanceIdentity,textureState:c.dataset.textureState,textureFormat:c.dataset.textureFormat,textureBytes:c.dataset.textureBytes,glError:c.getContext('webgl2').getError()
      }));
      assert.equal(metrics.glError,0,'Models and native GPU textures render without WebGL errors');
      assert.equal(metrics.identity,'persistent','Same canvas survives navigation');
      assert.ok(metrics.models>=1&&metrics.models<=2,'Bounded model cache');
      assert.ok(metrics.triangles>3000,'Actual modeled architecture was drawn');
      assert.ok(metrics.width*metrics.height<=(width<850?650000:1800000)+2500,'Bounded GPU resolution');
      assert.equal(await page.locator('.p136-living-canvas').count(),1,'One environment canvas');
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:join(out,'institute-'+family+'-'+width+'.png'),animations:'disabled'});
      snapshots.push(metrics);
    }
    const lost=await page.locator('.p136-living-canvas').evaluate(c=>{
      const ext=c.getContext('webgl2')?.getExtension('WEBGL_lose_context');ext?.loseContext();return !!ext;
    });
    assert.equal(lost,true,'Runner can exercise real context loss');
    await page.locator('.p136-living-world[data-renderer="vector"]').waitFor();
    assert.equal(await page.getByRole('heading',{level:1}).count(),1,'DOM remains usable after GPU loss');
    record('real mesh families / compressed assets / one context / cache / GPU loss '+width,{snapshots,softwareGPU:true});
    await context.close();
  }
  // Gamepad API fixture lives only in this local Chromium context. It never
  // changes the real controller status of a public production visitor.
  {
    const {page,context}=await contextFor(390);
    await context.addInitScript(()=>{
      const pad={index:0,connected:true,mapping:'standard',
        buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]};
      window.__avGamepadFixture=pad;
      Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
    });
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('[data-av-controller-status="ready"]').waitFor({timeout:10000});
    const stations=page.locator('.p136-console-wayfinder a[data-station]');
    await stations.first().focus();
    const button=async(index,pressed)=>{
      await page.evaluate(({index,pressed})=>{
        const b=window.__avGamepadFixture.buttons[index];
        b.pressed=pressed;b.value=pressed?1:0;
      },{index,pressed});
    };
    await button(15,true);
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Discover',null,{timeout:5000});
    await button(15,false);
    await page.waitForTimeout(150);
    await button(0,true);
    await page.waitForURL(base+'/discover',{timeout:8000});
    await button(0,false);
    await page.evaluate(()=>{window.__avGamepadFixture.connected=false;});
    await page.waitForFunction(()=>!document.querySelector('.p136-controller-indicator'),null,{timeout:8000});
    record('synthetic Gamepad API / connected badge / D-pad DOM focus / A route / disconnected cleanup',{hardwareVerified:false});
    await context.close();
  }
  if(process.env.VITE_PARITY_V136_CINEMATIC==='true'){
    const {page,context}=await contextFor(1440,{motion:'no-preference',forceVector:true});
    await page.goto(base,{waitUntil:'networkidle'});
    const cinema=page.locator('[data-cinematic-v136="poster-pilot"]');await cinema.waitFor();
    const opacity=()=>cinema.evaluate(el=>Number.parseFloat(getComputedStyle(el).opacity));
    assert.ok(await opacity()>.9,'Arrival poster begins visible');
    // Simulate the loading status only. The actual GPU geometry is tested in
    // its separate compiled GLB browser acceptance; this tests fade timing.
    await page.evaluate(()=>{
      const world=document.querySelector('.p136-living-world');
      const canvas=world?.querySelector('.p136-living-canvas');
      if(world)world.dataset.renderer='webgl';
      if(canvas)canvas.dataset.assetState='loading';
      window.scrollTo(0,550);
    });
    await page.waitForFunction(()=>document.querySelector('[data-cinematic-v136]')?.dataset.handoff==='hold');
    assert.ok(await opacity()>.95,'Cinema does not reveal an incompletely loaded 3D model');
    await page.evaluate(()=>{
      const canvas=document.querySelector('.p136-living-world .p136-living-canvas');
      if(canvas)canvas.dataset.assetState='ready';
    });
    await page.waitForFunction(()=>{
      const layer=document.querySelector('[data-cinematic-v136="poster-pilot"]');
      return layer&&Number.parseFloat(getComputedStyle(layer).opacity)<.5;
    });
    assert.ok(await opacity()<.5,'Poster reveals one canonical live environment on native scroll');
    await page.screenshot({path:join(out,'cinematic-handoff-scroll-1440.png'),animations:'disabled'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.locator('.p136-button--primary').click();
    await page.waitForURL(/\/discover(?:\?|$)/);
    assert.equal(await page.locator('.p136-living-canvas').count(),1,'No duplicate WebGL renderer after cinematic navigation');
    record('cinematic art-to-world fade / accessible real Discover action / one renderer');
    await context.close();
  }
  const {page,context}=await contextFor(390,{motion:'no-preference',forceVector:true});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.p136-living-world[data-renderer="vector"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.p136-living-world').dataset.motion==='true');
  await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
  await page.locator('#av79-navigation[open]').waitFor();
  const preference=page.getByRole('button',{name:'Atmospheric animation',exact:true});
  await preference.click();
  assert.equal(await preference.getAttribute('aria-pressed'),'false','Menu preference disables motion');
  await page.waitForFunction(()=>document.querySelector('.p136-living-world').dataset.motion==='false');
  await preference.click();
  assert.equal(await preference.getAttribute('aria-pressed'),'true','Menu preference restores motion');
  await page.getByRole('button',{name:'Close navigation',exact:true}).click();
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
