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
const studioOnly=process.argv.includes('--studio-only');
let accepted=false;
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
// Three fabricated records exist only inside the loopback acceptance browser.
// Test both a published version and a separate, unpublished revision together.
const nativeStudioLibraryFixture=[
  {id:'11111111-1111-4111-8111-111111111111',title:'SYNTHETIC LIVE WORK',summary:'Offline published browser fixture only.',category:'game',status:'published',version:1,updatedAt:1792870000,publishedAt:1792860000,coverUrl:null,liveReleaseId:'44444444-4444-4444-8444-444444444444',draftReleaseId:null,draftStatus:null},
  {id:'22222222-2222-4222-8222-222222222222',title:'SYNTHETIC PRIVATE WORK',summary:'Unsubmitted private browser fixture only.',category:'app',status:'ready',version:1,updatedAt:1792870001,publishedAt:null,coverUrl:null,liveReleaseId:null,draftReleaseId:'55555555-5555-4555-8555-555555555555',draftStatus:'ready',retention:'saved'},
  {id:'33333333-3333-4333-8333-333333333333',title:'SYNTHETIC REVIEW WORK',summary:'Offline private revision pending while prior release remains approved.',category:'simulation',status:'published',version:2,updatedAt:1792870002,publishedAt:1792860000,coverUrl:null,liveReleaseId:'66666666-6666-4666-8666-666666666666',draftReleaseId:'77777777-7777-4777-8777-777777777777',draftStatus:'pending_review'}
];
const COVER_ROUTE='/upload/v3/api/v1/packages/covers/'+packageFixture.id;
const COVER_FIXTURE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#124b79"/><path d="M150 150L1450 750" stroke="#c0f4ff" stroke-width="70"/></svg>';
const record=(name,data={})=>{checks.push({name,...data});console.log('PASS '+name);};
async function contextFor(width,{motion='reduce',state='empty',forceVector=false,cover='missing'}={}){
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
    if(state==='studio'&&url.pathname==='/upload/v3/api/v1/packages/native/mine'){
      await route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({contract:'native-creator-v095',memberId:'00000000000000000000000000000099',
          projects:nativeStudioLibraryFixture,usage:{memberPhysicalBytes:8192,memberPhysicalLimit:209715200,
            pilotPhysicalBytes:8192,pilotPhysicalLimit:209715200,cleanupPending:0}})});return;
    }
    if(url.pathname===COVER_ROUTE){
      // A first-party synthetic cover fixture; no external calls or real member media.
      await route.fulfill(cover==='provided'
        ?{status:200,contentType:'image/svg+xml',body:COVER_FIXTURE}
        :{status:404,contentType:'text/plain',body:'Missing thumbnail fixture'});
      return;
    }
    if(url.pathname==='/upload/v3/api/v1/packages/projects'){
      const published=state==='package';
      const candidate={...packageFixture,cover_url:cover==='missing'?null:COVER_ROUTE};
      await route.fulfill({status:published?200:404,contentType:'application/json',
        body:JSON.stringify(published?{projects:[candidate]}:{error:'CI optional uploader disabled'})});
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
        path==='/api/v1/projects/'+fixture.id&&state==='project'?{item:{...fixture,description:fixture.summary,demoUrl:null,sourceUrl:null}}:
        path==='/api/v1/status'?{features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
        path==='/api/v1/creators'?(state==='creators'?(()=>{
          // Public data fixture exists ONLY in the loopback compiled browser.
          const people=[
            {handle:'qa_maker',displayName:'SYNTHETIC CI MAKER',publishedProjects:1},
            {handle:'fixture_lab',displayName:'SYNTHETIC CI LAB',publishedProjects:2}
          ];
          const search=(url.searchParams.get('q')||'').trim().toLowerCase();
          const filtered=search?people.filter(item=>
            item.displayName.toLowerCase().includes(search)||
            item.handle.includes(search)):people;
          const cursor=url.searchParams.get('cursor');
          return {items:cursor?[]:filtered,count:cursor?0:filtered.length,
            nextCursor:!cursor&&!search?'ci-next-page':null};
        })():page([])):
        path==='/api/v1/categories'?{categories:[]}:
        path==='/api/v1/boards'?{source:'approved-public-projects',qualityRankingAvailable:false,
          latestReleases:[fixture],firstLooks:[fixture],
          publishingCreators:[{handle:'qa_creator',displayName:'SYNTHETIC QA MAKER',publishedProjects:1}]}:
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
    page.setDefaultTimeout(45000);

    // V136.032: verify the real, compiled private archive before editing.
    // Filtering/search/layout must neither transmit unpublished data nor call
    // upload/review APIs. Its "live + pending" overlap is intentional.
    const nativeReads=[];
    page.on('request',request=>{if(new URL(request.url()).pathname==='/upload/v3/api/v1/packages/native/mine')nativeReads.push(request.method());});
    await page.goto(base+'/studio/packages',{waitUntil:'domcontentloaded'});
    const buildRows=page.locator('[data-native-project]');
    await page.waitForFunction(()=>document.querySelectorAll('[data-native-project]').length===3);
    const controls=page.locator('.av136032-library-tools');
    await controls.waitFor();
    assert.equal(await controls.locator('[data-native-filter="all"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await controls.locator('.av136032-tab-count').allInnerTexts(),['3','1','1','2']);
    assert.equal(await page.locator('.av136032-record-blank').count(),3,'No invented creator artwork in empty-media fixture');
    const initialReads=nativeReads.length;
    assert.ok(initialReads>0&&nativeReads.every(method=>method==='GET'),'Read-only, member-bound inventory');
    const filter=async (name,count)=>{
      await controls.locator('[data-native-filter="'+name+'"]').click();
      await page.waitForFunction(expected=>document.querySelectorAll('[data-native-project]').length===expected,count);
      assert.equal(await controls.locator('[data-native-filter="'+name+'"]').getAttribute('aria-pressed'),'true');
    };
    await filter('private',1);
    assert.match(await buildRows.first().innerText(),/SYNTHETIC PRIVATE WORK/);
    await filter('review',1);
    assert.match(await buildRows.first().innerText(),/SYNTHETIC REVIEW WORK/);
    await filter('live',2);
    assert.match(await page.locator('[data-native-project="33333333-3333-4333-8333-333333333333"]').innerText(),
      /approved public release retained/i,'Pending update never hides the live release');
    await page.locator('.av095-search input').fill('NONE MATCHES THIS PRIVATE ARCHIVE');
    await page.waitForFunction(()=>document.querySelectorAll('[data-native-project]').length===0);
    await page.getByRole('button',{name:'Show all builds'}).click();
    await page.waitForFunction(()=>document.querySelectorAll('[data-native-project]').length===3);
    await page.locator('.av095-search input').fill('SyNtHeTiC PrIvAtE');
    await page.waitForFunction(()=>document.querySelectorAll('[data-native-project]').length===1);
    assert.match(await buildRows.first().innerText(),/SYNTHETIC PRIVATE WORK/,'Search remains case-insensitive');
    await page.locator('.av095-search input').fill('');
    await page.waitForFunction(()=>document.querySelectorAll('[data-native-project]').length===3);
    await controls.locator('[data-library-view="list"]').click();
    await page.waitForFunction(()=>document.querySelector('.av136032-build-grid')?.getAttribute('data-layout')==='list');
    assert.equal(await controls.locator('[data-library-view="list"]').getAttribute('aria-pressed'),'true');
    assert.equal(await buildRows.first().evaluate(el=>getComputedStyle(el).display),width>650?'grid':'block',
      'List actually changes card geometry at the selected CSS breakpoint');
    assert.equal(await page.locator('.av095-search input').evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize)),16,
      'Mobile search avoids Safari zoom and preserves readable desktop sizing');
    assert.equal(await page.evaluate(()=>location.pathname==='/studio/packages'&&!location.search),true,
      'Unpublished filtering state never enters a public/shareable URL');
    assert.equal(nativeReads.length,initialReads,'Local controls must not refetch or transmit private inventory');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,
      'Creator archive must not overflow at '+width+' CSS pixels');
    await page.screenshot({path:join(out,'studio-archive-list-'+width+'.png'),animations:'disabled',timeout:90000});
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
      // An existing index.html reference must be displayed before a creator
      // renames or removes styles.css; the audit does not silently edit HTML.
      await workbench.getByRole('tab',{name:'styles.css',exact:true}).click();
      await workbench.getByRole('button',{name:'Rename file',exact:true}).click();
      const renameAudit=workbench.locator('[data-source-reference-audit="rename"]');
      assert.match(await renameAudit.innerText(),/index\.html/);
      assert.match(await renameAudit.innerText(),/no code will be rewritten automatically/i);
      // A dependency chip is real editor navigation, not a decorative badge.
      await renameAudit.getByRole('button',{name:'Inspect index.html',exact:true}).click();
      assert.equal(await workbench.getByRole('tab',{name:'index.html',exact:true}).getAttribute('aria-selected'),'true');
      assert.equal(await renameAudit.count(),0,'Reference navigation cancels the pending rename');
      assert.equal(await workbench.getByRole('tab',{name:'styles.css',exact:true}).count(),1,'No source was renamed');
      assert.match(await workbench.locator('.p136-source-notice').innerText(),/pending file operation was canceled/);
      await workbench.getByRole('tab',{name:'styles.css',exact:true}).click();
      await workbench.getByRole('button',{name:'Rename file',exact:true}).click();
      assert.match(await renameAudit.innerText(),/index\.html/);
      await workbench.getByRole('button',{name:'Cancel rename',exact:true}).click();
      assert.equal(await renameAudit.count(),0,'Canceled rename closes the dependency notice');
      await workbench.getByRole('button',{name:'Remove file',exact:true}).click();
      const removalAudit=workbench.locator('[data-source-reference-audit="remove"]');
      assert.match(await removalAudit.innerText(),/index\.html/);
      await removalAudit.getByRole('button',{name:'Inspect index.html',exact:true}).click();
      assert.equal(await workbench.getByRole('tab',{name:'index.html',exact:true}).getAttribute('aria-selected'),'true');
      assert.equal(await removalAudit.count(),0,'Reference navigation cancels the pending removal');
      assert.equal(await workbench.getByRole('tab',{name:'styles.css',exact:true}).count(),1,'Dependency inspection cannot delete source');
      await workbench.getByRole('tab',{name:'styles.css',exact:true}).click();
      await workbench.getByRole('button',{name:'Remove file',exact:true}).click();
      await workbench.getByRole('button',{name:'Keep file',exact:true}).click();
      await workbench.getByRole('tab',{name:'assets/notes.md',exact:true}).click();
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
      const monacoPosition=await workbench.locator('[data-source-cursor]').innerText();
      await workbench.getByRole('button',{name:'Focus layout preview',exact:true}).click();
      assert.equal(await workbench.locator('[data-source-editor="monaco"]').count(),1,
        'Preview focus retains the mounted Monaco model');
      await workbench.getByRole('button',{name:'Return to source editor',exact:true}).click();
      await workbench.locator('[data-source-editor="monaco"]').waitFor({state:'visible'});
      assert.equal(await workbench.locator('[data-source-cursor]').innerText(),monacoPosition,
        'Returning from preview preserves the actual Monaco cursor');

    }
    else assert.equal(await page.locator('[data-source-editor="monaco"]').count(),0,'Phone uses accessible text editor without Monaco allocation');
    assert.equal(await page.locator('.p136-living-world').getAttribute('data-enabled'),'false','Private source never enters public GPU');
    // V136.034: the concept's Preview/Build checks navigation must use the
    // actual mounted sandbox and static diagnostics, not claim Run/Deploy.
    const mountedEditorCount=await workbench.locator('[data-source-editor="monaco"]').count();
    const sourceBeforeCommand=await workbench.locator('.p136-source-state').innerText();
    await workbench.getByRole('button',{name:'Open focused HTML/CSS layout preview',exact:true}).click();
    await workbench.locator('[data-preview-focused="true"]').waitFor();
    assert.equal(await workbench.locator('[data-source-editor="monaco"]').count(),mountedEditorCount,
      'First-class Preview preserves any mounted Monaco editor');
    assert.equal(await workbench.locator('[data-source-preview-frame]').count(),1,
      'Preview command does not introduce another local/runtime frame');
    assert.equal(await workbench.locator('[data-source-preview-frame]').getAttribute('sandbox'),'',
      'Preview command retains scriptless opaque sandbox');
    assert.match(await workbench.locator('.p136034-preview-mode').innerText(),/Scripts, external resources and publishing remain disabled/i);
    const viewportLabel=await workbench.locator('.p136030-preview-readout').innerText();
    assert.match(viewportLabel,width<768?/390 × 844 CSS px/:/1280 × 720 CSS px/,
      'The existing viewport remains a real CSS width');
    assert.equal(await workbench.locator('.p136-source-stage').isVisible(),false,
      'Focused preview gives the actual layout the workbench width');
    await page.keyboard.press('Escape');
    await workbench.locator('[data-preview-focused="false"]').waitFor();
    await page.waitForFunction(()=>document.activeElement?.id?.startsWith('p136-source-tab-'));
    assert.equal(await workbench.locator('.p136-source-state').innerText(),sourceBeforeCommand,
      'Preview/return does not modify source or invalidate prepared archives');
    assert.equal(await workbench.locator('[data-source-editor="monaco"]').count(),mountedEditorCount,
      'Editor remains mounted after preview exit');
    const diagnosticsInitiallyOpen=await workbench.locator('.p136030-build-details').evaluate(el=>el.open);
    await workbench.getByRole('button',{name:/Open local build checks:/}).click();
    await page.waitForFunction(()=>document.querySelector('.p136030-build-details')?.open);
    await page.waitForFunction(()=>document.activeElement?.tagName==='SUMMARY'&&
      document.activeElement.textContent?.startsWith('Build checks'));
    assert.equal(await workbench.locator('.p136-source-stage').isVisible(),true,
      'Build checks open alongside the real code editor, not a duplicate IDE');
    assert.equal(await page.locator('[data-source-editor="monaco"]').count(),mountedEditorCount,
      'Diagnostics navigation retains the exact source editor instance');
    // The command intentionally opens diagnostics; reset the disclosure after
    // this check so subsequent mobile assertions still exercise the untouched
    // phone default (closed) rather than state deliberately changed by QA.
    if(!diagnosticsInitiallyOpen){
      await workbench.locator('.p136030-build-details > summary').click();
      await page.waitForFunction(()=>document.querySelector('.p136030-build-details')?.open===false);
    }
    await workbench.getByRole('button',{name:'Prepare build archive',exact:true}).click();
    await page.locator('.av095-drop strong').filter({hasText:'continuance-build.zip'}).waitFor();
    const picker=page.locator('.av136033-build-picker');
    assert.equal(await picker.getAttribute('data-selected-source'),'workbench','Source workbench ZIP is the actual selected build');
    assert.equal(await picker.locator('details').evaluate(node=>node.open),false,'Prepared ZIP closes unused native chooser');
    assert.equal(await picker.locator('input[type=file]').isVisible(),false,'Browser cannot claim No file chosen when ZIP is already prepared');
    assert.match(await picker.locator('.av136033-prepared-note').innerText(),/already selected/i);
    await picker.locator('summary').click();
    assert.equal(await picker.locator('input[type=file]').isVisible(),true,'Creator can deliberately replace the prepared ZIP');
    await picker.locator('summary').click();
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
    assert.equal(await picker.getAttribute('data-selected-source'),'none','Editing revokes the in-memory archive selection');
    assert.equal(await picker.locator('input[type=file]').isVisible(),true,'Creator can import a device export after invalidation');
    assert.equal(await page.locator('.p136-source-state').innerText(),'LOCAL CHANGES','Editing invalidates the previously prepared archive');
    if(width===1440){
      const diagnostics=workbench.locator('[data-source-link-diagnostics="local"]');
      assert.match(await diagnostics.innerText(),/0 missing/);
      await workbench.locator('.p136-source-fallback textarea').fill('@import "assets/missing.css"; body { color: #ffffff; }');
      await diagnostics.getByText('Missing: assets/missing.css',{exact:true}).waitFor();
      await diagnostics.getByRole('button',{name:'Inspect styles.css missing reference assets/missing.css'}).click();
      assert.equal(await workbench.getByRole('tab',{name:'styles.css',exact:true}).getAttribute('aria-selected'),'true',
       'Inspector navigates to the real file containing the missing local source link');
      assert.match(await workbench.locator('.p136-source-notice').innerText(),/No source was rewritten or uploaded/);
      assert.equal(await page.locator('.av095-drop strong').filter({hasText:'Choose a ZIP or HTML file'}).count(),1,
       'Diagnostics never override existing private package/archive invalidation');
    }
    const preview=workbench.locator('[data-source-preview="local"]');
    assert.equal(await workbench.locator('.p136030-build-details').evaluate(e=>e.open),width===1440,
      'Phone defaults keep advanced checks available behind a real disclosure');
    const previewFrame=workbench.frameLocator('[data-source-preview-frame]');
    const previewCss=':root { --qa-breakpoint: wide; } body { margin:0; background:#06101d; color:#fff; font:24px system-ui; } main { padding:24px; } @media(max-width:400px) { :root { --qa-breakpoint: phone; } } @media(max-width:340px) { :root { --qa-breakpoint: small; } }';
    await workbench.locator('.p136-source-fallback textarea').fill(previewCss);
    await workbench.getByRole('button',{name:'Prepare build archive',exact:true}).click();
    await page.locator('.p136-source-state').filter({hasText:'ARCHIVE PREPARED'}).waitFor();
    const assertViewport=async(expected,label)=>{
      let state;
      const stop=Date.now()+12000;
      do{
        state=await previewFrame.locator('html').evaluate(e=>({
          width:innerWidth,breakpoint:getComputedStyle(e).getPropertyValue('--qa-breakpoint').trim()
        }));
        if(state.width===expected&&state.breakpoint===label)break;
        await new Promise(resolve=>setTimeout(resolve,50));
      }while(Date.now()<stop);
      assert.deepEqual(state,{width:expected,breakpoint:label},'Preview must use actual CSS media-query widths');
    };
    await preview.getByRole('button',{name:'Phone preview',exact:true}).click();
    await assertViewport(390,'phone');
    await preview.getByRole('button',{name:'Small phone preview',exact:true}).press('Enter');
    await assertViewport(320,'small');
    await preview.getByRole('button',{name:'Desktop preview',exact:true}).click();
    await assertViewport(1280,'wide');
    assert.equal(await preview.locator('iframe').getAttribute('sandbox'),'','Layout frame remains opaque-origin/scriptless');
    assert.equal(await previewFrame.locator('script').count(),0);
    assert.equal(await preview.locator('iframe').count(),1,'One existing preview, never a second runtime');
    await preview.getByRole('button',{name:'Focus layout preview',exact:true}).click();
    await workbench.locator('[data-preview-focused="true"]').waitFor();
    assert.equal(await workbench.locator('.p136-source-stage').isVisible(),false);
    assert.equal(await workbench.locator('.p136-source-stage textarea').count(),1,'Focus mode retains the mounted real source editor');
    if(width<650){await preview.getByRole('button',{name:'Phone preview',exact:true}).click();await assertViewport(390,'phone');}
    await preview.scrollIntoViewIfNeeded();
    const previewGeometry=await preview.evaluate(node=>{
      const r=node.getBoundingClientRect(),frame=node.querySelector('iframe');
      return {panel:{width:r.width,height:r.height},frame:{width:frame?.offsetWidth,height:frame?.offsetHeight}};
    });
    writeFileSync(join(out,'studio-preview-geometry-'+width+'.json'),JSON.stringify(previewGeometry,null,2));
    const previewCaptureStarted=Date.now();
    await page.screenshot({path:join(out,'studio-layout-preview-'+width+'.png'),fullPage:false,animations:'disabled',timeout:90000});
    console.log('STUDIO_PREVIEW_CAPTURE '+JSON.stringify({width,elapsedMs:Date.now()-previewCaptureStarted,...previewGeometry}));
    await preview.getByRole('button',{name:'Return to source editor',exact:true}).press('Escape');
    await workbench.locator('[data-preview-focused="false"]').waitFor();
    await page.waitForFunction(()=>document.activeElement?.id==='p136-source-tab-styles.css');
    assert.equal(await workbench.locator('.p136-source-fallback textarea').inputValue(),previewCss,'Return preserves the creator source');
    assert.equal(await page.locator('.p136-source-state').innerText(),'ARCHIVE PREPARED','Preview controls cannot invalidate or mutate source/archive');
    assert.equal(await page.getByRole('button',{name:'Prepare private playtest',exact:true}).isDisabled(),true,'Layout preview grants no upload or publication rights');
    const buildForm=page.locator('.av095-upload-grid form');
    const upload=buildForm.getByRole('button',{name:'Prepare private playtest',exact:true});
    const rights=buildForm.getByRole('checkbox',{name:/I own this project/});
    assert.equal(await buildForm.getByRole('region',{name:'Browser build',exact:true}).count(),1);
    assert.equal(await buildForm.getByRole('region',{name:'Project details',exact:true}).count(),1);
    assert.equal(await buildForm.getByRole('region',{name:'Private playtest',exact:true}).count(),1);
    await page.getByRole('button',{name:'Continue to build details',exact:true}).press('Enter');
    const title=buildForm.getByRole('textbox',{name:'Project title',exact:true});
    assert.equal(await title.evaluate(node=>node===document.activeElement),true,'Archive handoff focuses the actual title input');
    assert.equal(await workbench.locator('.p136-source-fallback textarea').inputValue(),previewCss,'Handoff keeps the source editor and actual text');
    await title.fill('Synthetic Studio QA build');
    await buildForm.getByRole('textbox',{name:'What can someone do in it?',exact:true}).fill('Synthetic fixture for the private form handoff.');
    await page.locator('#av136031-preparation').filter({hasText:'Confirm your rights'}).waitFor();
    assert.equal(await upload.isDisabled(),true);
    await rights.check();
    await page.locator('#av136031-preparation').filter({hasText:'Ready for a private upload'}).waitFor();
    assert.equal(await upload.isEnabled(),true,'Only real file/check/rights state enables the unchanged private upload action');
    assert.equal(await page.locator('.ir80-dock[aria-expanded="false"]').isVisible(),false,'Idle IREN dock yields the private authoring controls');
    await upload.scrollIntoViewIfNeeded();
    const unobstructed=await upload.evaluate(button=>{
      const r=button.getBoundingClientRect();
      return [.1,.5,.9].every(x=>[.2,.8].every(y=>button.contains(document.elementFromPoint(r.left+r.width*x,r.top+r.height*y))));
    });
    assert.equal(unobstructed,true,'Private playtest action remains pointer-accessible across its surface');
    await buildForm.getByRole('heading',{name:'Project details',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,'studio-build-details-'+width+'.png'),animations:'disabled',timeout:90000});
    await upload.scrollIntoViewIfNeeded();
    await page.screenshot({path:join(out,'studio-private-playtest-'+width+'.png'),animations:'disabled',timeout:90000});
    await page.getByRole('button',{name:'Open site navigation',exact:true}).click();
    await page.getByRole('button',{name:/IREN \/ Field assistant/}).click();
    await page.getByRole('region',{name:'IREN companion',exact:true}).waitFor();
    await page.getByRole('button',{name:'Close IREN',exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Open site navigation');
    assert.equal(await page.locator('.ir80-dock[aria-expanded="false"]').isVisible(),false,'IREN remains available through real navigation and closes without covering the form');
    // Editing after confirmation invalidates both the actual archive and rights.
    await workbench.locator('.p136-source-fallback textarea').fill(previewCss+'\n/* revised synthetic source */');
    assert.equal(await rights.isChecked(),false);
    assert.equal(await upload.isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'Continue to build details',exact:true}).count(),0);
    assert.equal(await title.inputValue(),'Synthetic Studio QA build','Repackaging never discards project metadata');
    await workbench.getByRole('button',{name:'Prepare build archive',exact:true}).click();
    await page.getByText('Browser build candidate',{exact:true}).waitFor();
    assert.equal(await rights.isChecked(),false,'Preparing a new revision never reuses a previous rights confirmation');
    assert.equal(await upload.isDisabled(),true);
    assert.equal(await picker.getAttribute('data-selected-source'),'workbench','Repackaging binds the new source file');
    await picker.locator('summary').click();
    await picker.locator('input[type=file]').setInputFiles({name:'synthetic-alternate.html',mimeType:'text/html',
      buffer:Buffer.from('<!doctype html><html lang="en"><head><title>Alternate fixture</title></head><body><main>Local browser test</main></body></html>')});
    await page.locator('.av095-drop strong').filter({hasText:'synthetic-alternate.html'}).waitFor();
    assert.equal(await picker.getAttribute('data-selected-source'),'device','Manual replacement binds the actual chosen file');
    assert.equal(await picker.locator('input[type=file]').evaluate(node=>node.files?.[0]?.name),'synthetic-alternate.html',
      'Switching sources keeps the real file input mounted and selected');
    assert.equal(await picker.locator('.av136033-prepared-note').count(),0,'Device selection removes the stale workbench claim');
    assert.equal(await rights.isChecked(),false,'Alternate build requires a fresh rights confirmation');
    assert.equal(await upload.isDisabled(),true);
    assert.equal(await page.locator('.p136-console-wayfinder').isVisible(),false,
      'A redundant fixed site dock must never cover the mobile or desktop code editor');
    const overflow=await page.evaluate(()=>{
      const allowed=document.documentElement.clientWidth+1;
      const excess=document.documentElement.scrollWidth-allowed;
      // Ignore SVG drawing bounds. Paths inside oversized viewBoxes can
      // exceed the viewport even when their parent does not affect layout.
      // Report real HTML boxes and the actual Studio/header boundaries.
      const offenders=[...document.body.querySelectorAll('*')]
        .filter(node=>node instanceof HTMLElement)
        .map(node=>{
          const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
          return {tag:node.tagName,cls:typeof node.className==='string'?node.className.slice(0,110):'',
            right:Math.round(rect.right*100)/100,left:Math.round(rect.left*100)/100,
            width:Math.round(rect.width*100)/100,
            scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
            position:style.position,overflowX:style.overflowX};
        }).filter(x=>x.right>allowed&&x.width>0)
        .sort((a,b)=>b.right-a.right).slice(0,15);
      const boundaries=['.p136-header','.p136-header-inner','.p136-header-actions',
        '.p136-studio-console','.p136-studio-console-stage','.p136-workbench']
        .map(selector=>{
          const node=document.querySelector(selector),rect=node?.getBoundingClientRect();
          return {selector,right:rect?Math.round(rect.right*100)/100:null,
            width:rect?Math.round(rect.width*100)/100:null};
        });
      return {excess,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        offenders,boundaries};
    });
    assert.ok(overflow.excess<=0,'Workbench must not expand the document horizontally: '+JSON.stringify({width,...overflow}));
    record('session-bound source workstation / real editor / native ZIP compatibility / stale archive invalidation '+width,{monaco:width===1440,uploads:0});
    await context.close();
  }
  // Local/focused Studio QA reuses the same private loopback fixture and all
  // Studio assertions above. Normal full Spatial CI retains every group below.
  if(!studioOnly){
  // Direct evidence gate: native interface decoration is NOT proof of
  // 3D architectural parity. Capture the native overlay and modeled scene
  // in the same loopback context for independent visual comparison.
  if(process.env.VITE_PARITY_V136_CINEMATIC==='true'){
    for(const width of [1536,1440,390,320]){
      const {page,context}=await contextFor(width,{motion:'no-preference'});
      await page.goto(base,{waitUntil:'domcontentloaded'});
      const inspect=page.getByRole('button',{name:'Inspect live 3D scene'});
      await inspect.waitFor();
      await page.waitForFunction(()=>{
        const control=document.querySelector('[data-cinematic-inspection="v136.017"]');
        const canvas=document.querySelector('.p136-living-canvas');
        const native=document.querySelector('[data-arrival-surface="native-interface"]');
        return control?.getAttribute('data-scene-readiness')==='ready'&&
          canvas?.dataset.assetState==='ready'&&Boolean(native)&&
          !native.querySelector('img,picture');
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
      const first=await page.screenshot({path:join(out,'arrival-native-interface-review-'+width+'.png'),
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
      assert.ok(!first.equals(live),'Live model screenshot must differ from the native interface overlay');
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
      record('direct same-context native interface vs real WebGL '+(openExterior?'Institute exterior':'Atrium')+' visual evidence '+width,{
        width,renderer:reality.renderer,models:reality.metrics.models,
        triangles:reality.metrics.triangles,drawCalls:reality.metrics.drawCalls,
        composition:openExterior?'QA open Institute':'canonical Atrium',
        approvedConceptParity:false,realDeviceTested:false});
      await context.close();
    }
  }
  // V136.017.042 loopback-only full-browser UI acceptance.
  for(const width of [1440,390,320]){
    const {page,context}=await contextFor(width,{state:'project',forceVector:true});
    await page.goto(base+'/community',{waitUntil:'domcontentloaded'});
    await page.locator('.p136-community[data-parity-community="v136.017"]').waitFor();
    await page.locator('.p136-community .ch7-entry-art .av136-project-thumbnail[data-thumbnail-source="default"]').waitFor();
    assert.equal(await page.locator('.p136-community .ch7-hero .cw-artwork, .p136-community .ch7-entry-art .cw-artwork, .p136-community .ch7-field-art .cw-artwork').count(),0,
      'Migrated public Community panels cannot display generated art');
    const communityWidth=await page.locator('.p136-community').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
    assert.ok(communityWidth.scroll<=communityWidth.client+2,'Community overflow at '+width+'px '+JSON.stringify(communityWidth));
    await page.locator('.mc-activity .mc-empty h3').waitFor();
    const widgetStyle=await page.locator('.mc-activity').evaluate(panel=>({
      font:getComputedStyle(panel.querySelector('h2')).fontFamily,
      emptyFont:getComputedStyle(panel.querySelector('.mc-empty h3')).fontFamily,
      radius:parseFloat(getComputedStyle(panel).borderRadius)
    }));
    assert.ok(!/Georgia|serif(?:,|$)/i.test(widgetStyle.font.replaceAll('sans-serif','')),'Community widget uses Institute typography');
    assert.ok(!/Georgia|serif(?:,|$)/i.test(widgetStyle.emptyFont.replaceAll('sans-serif','')),'Empty state uses the same functional typography');
    assert.ok(widgetStyle.radius<=12,'Community panel matches shared compact materials');
    if(width>=1280){
      const clearance=await page.evaluate(()=>({
        nav:document.querySelector('.p136-console-wayfinder').getBoundingClientRect().toJSON(),
        content:document.querySelector('.p136-community').getBoundingClientRect().toJSON()
      }));
      assert.ok(clearance.nav.right+6<=clearance.content.left,'Console remains outside public content: '+JSON.stringify(clearance));
    }
    await page.getByRole('button',{name:'PEOPLE',exact:true}).click();
    await page.waitForURL(/\/community\?view=people$/);
    await page.locator('.p136-community .ch7-tabs button[aria-pressed="true"]').filter({hasText:'PEOPLE'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'PEOPLE',exact:true}).getAttribute('aria-pressed'),'true');
    await page.goBack({waitUntil:'domcontentloaded'});
    // React Router restores the URL before the location-driven view effect
    // commits. Wait for the actual DOM state rather than racing a microtask.
    await page.waitForFunction(()=>document.querySelector('.p136-community .ch7-tabs button')?.getAttribute('aria-pressed')==='true');
    assert.equal(await page.getByRole('button',{name:'LATEST',exact:true}).getAttribute('aria-pressed'),'true');
    await page.screenshot({path:join(out,'public-community-'+width+'.png'),animations:'disabled'});
    await page.goto(base+'/creators',{waitUntil:'domcontentloaded'});
    await page.locator('.p136-creators[data-parity-creators="v136.017"]').waitFor();
    await page.getByRole('link',{name:/Community spaces/}).waitFor();
    const creatorWidth=await page.locator('.p136-creators').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
    assert.ok(creatorWidth.scroll<=creatorWidth.client+2,'Creator directory overflow at '+width+'px '+JSON.stringify(creatorWidth));
    await page.screenshot({path:join(out,'public-creators-'+width+'.png'),animations:'disabled'});
    record('V136 public Commons and creator directory '+width+'px',{communityWidth,creatorWidth});
    await context.close();
  }

  // V136.025: Creator Directory search, URL history, pagination and
  // compact layouts tested with public-only synthetic loopback responses.
  for(const width of [1440,390,320]){
    const {page,context}=await contextFor(width,{state:'creators',forceVector:true});
    await page.goto(base+'/creators',{waitUntil:'domcontentloaded'});
    const directory=page.locator('.p136-creators[data-directory-phase="v136.025"]');
    await directory.waitFor();
    const cards=directory.locator('.portal-creator-tile');
    await cards.first().waitFor();
    assert.equal(await cards.count(),2,'Exactly the two loopback creator channels appear');
    assert.equal(await directory.locator('.portal-creator-grid').getAttribute('data-layout'),'grid');
    const geometry=await page.evaluate(()=>({
      innerWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,
      rootWidth:document.querySelector('.p136-creators').scrollWidth,
      rootClient:document.querySelector('.p136-creators').clientWidth,
      gridColumns:getComputedStyle(document.querySelector('.p136-creators .portal-creator-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
      cardWidth:document.querySelector('.p136-creators .portal-creator-tile').getBoundingClientRect().width
    }));
    assert.ok(geometry.documentWidth<=geometry.innerWidth+2,
      'No page overflow at '+width+': '+JSON.stringify(geometry));
    assert.ok(geometry.rootWidth<=geometry.rootClient+2,'No directory overflow at '+width);
    assert.ok(geometry.cardWidth>=240,'Creator identity remains legible at '+width);
    assert.equal(geometry.gridColumns,width>=1161?3:1,
      'Grid tracks respond to phone/desktop viewport width '+width);
    const list=page.getByRole('button',{name:'List',exact:true});
    await list.click();
    await page.waitForURL(/\/creators\?view=list$/);
    await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
    assert.equal(await list.getAttribute('aria-pressed'),'true');
    await page.goBack({waitUntil:'domcontentloaded'});
    await directory.locator('.portal-creator-grid[data-layout="grid"]').waitFor();
    assert.equal(await page.getByRole('button',{name:'Grid',exact:true}).getAttribute('aria-pressed'),'true',
      'Browser Back restores URL-owned grid state');
    await page.getByRole('button',{name:'List',exact:true}).click();
    await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
    await page.getByRole('link',{name:/NEXT PAGE/}).click();
    await page.waitForURL(/view=list&cursor=ci-next-page/);
    await page.getByRole('heading',{name:'No further channels on this page.'}).waitFor();
    await page.getByRole('searchbox',{name:'Search published creators'}).fill('QA');
    await page.getByRole('button',{name:/Find creators/}).click();
    await page.waitForURL(/\/creators\?q=QA&view=list$/);
    await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
    assert.equal(await cards.count(),1,'Search is server-filtered with the fixture API');
    assert.match(await cards.first().innerText(),/SYNTHETIC CI MAKER/);
    assert.equal(new URL(page.url()).searchParams.has('cursor'),false,
      'New search clears the old pagination cursor');
    await page.getByRole('searchbox',{name:'Search published creators'}).fill('nonexistent');
    await page.getByRole('searchbox',{name:'Search published creators'}).press('Enter');
    await page.waitForURL(/q=nonexistent&view=list$/);
    await page.getByRole('heading',{name:'No matching creators yet.'}).waitFor();
    assert.equal(await directory.locator('.portal-creator-tile').count(),0);
    await page.getByRole('link',{name:'Clear search'}).click();
    await page.waitForURL(/\/creators\?view=list$/);
    await directory.locator('.portal-creator-grid[data-layout="list"]').waitFor();
    await page.screenshot({path:join(out,'public-creators-directory-'+width+'.png'),animations:'disabled'});
    record('V136.025 Creator Directory interactive URL, search and responsive layouts '+width+'px',{geometry,syntheticFixture:true});
    await context.close();
  }

  // V136.017.045: real published-only Boards with controlled URL history, not rankings.
  for(const width of [1440,390,320]){
    const {page,context}=await contextFor(width,{state:'project',forceVector:true});
    await page.goto(base+'/boards',{waitUntil:'domcontentloaded'});
    await page.locator('.p136-boards[data-parity-boards="v136.017"]').waitFor();
    await page.locator('.p136-boards .cnb-project-art .av136-project-thumbnail[data-thumbnail-source="default"]').waitFor();
    assert.equal(await page.locator('.p136-boards .cw-artwork').count(),0,
      'Public Boards uses authored type covers and an original field, never generated illustrations');
    await page.getByRole('button',{name:/FIRST LOOKS/}).click();
    await page.waitForURL(/\/boards\?view=firstLooks$/);
    await page.getByRole('button',{name:'GAMES',exact:true}).click();
    await page.waitForURL(/\/boards\?view=firstLooks&category=games$/);
    // Router history changes before React commits the URL-derived selection.
    // Wait for the rendered state; retain the exact selection assertion below.
    await page.locator('.p136-boards .cnb-filters button[aria-pressed="true"]').filter({hasText:'GAMES'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'GAMES',exact:true}).getAttribute('aria-pressed'),'true');
    await page.goBack({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('.p136-boards .cnb-filters button[aria-pressed="true"]')?.textContent?.trim()==='EVERYTHING');
    await page.screenshot({path:join(out,'public-boards-'+width+'.png'),animations:'disabled'});
    const geometry=await page.locator('.p136-boards').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
    assert.ok(geometry.scroll<=geometry.client+2,'Boards overflow at '+width+'px '+JSON.stringify(geometry));
    record('V136 public Boards categories/history and default covers '+width+'px',{geometry});
    await context.close();
  }
  // Unified stack: Open Signal is available only for an approved public record.
  for(const width of [1440,390,320]){
    const {page,context}=await contextFor(width,{state:'project',forceVector:true});
    await page.goto(base+'/projects/'+fixture.id,{waitUntil:'domcontentloaded'});
    const kit=page.locator('.avp-launch-kit');await kit.waitFor();
    assert.equal(await kit.getByRole('textbox',{name:'Shareable public project link'}).inputValue(),base+'/projects/'+fixture.id);
    await kit.getByRole('button',{name:'Copy announcement',exact:true}).click();
    await kit.getByRole('status').waitFor();
    await kit.getByText('Embeddable project link',{exact:true}).click();
    const embed=await kit.locator('textarea').inputValue();
    assert.ok(embed.includes('/projects/'+fixture.id));
    assert.ok(!/<(?:script|iframe|img)\b/i.test(embed));
    const size=await page.evaluate(()=>({client:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(size.scroll<=size.client+2,'Project/share overflow at '+width+'px '+JSON.stringify(size));
    if(width<650){
      const copy=kit.getByRole('button',{name:'Copy embed HTML',exact:true});
      await copy.evaluate(el=>{el.focus();el.scrollIntoView({block:'end',behavior:'instant'});});
      const clearance=await page.evaluate(()=>({
        control:document.querySelector('.avp-launch-kit-embed button').getBoundingClientRect().toJSON(),
        dock:document.querySelector('.p136-console-wayfinder').getBoundingClientRect().toJSON()
      }));
      assert.ok(clearance.control.bottom+6<=clearance.dock.top,'Focused share control clears mobile dock: '+JSON.stringify(clearance));
    }
    await page.screenshot({path:join(out,'open-signal-'+width+'.png'),animations:'disabled'});
    await page.goto(base+'/projects/unpublished-ci-fixture',{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{name:'PROJECT NOT AVAILABLE'}).waitFor();
    assert.equal(await page.locator('.avp-launch-kit').count(),0,'Unapproved/missing record must not offer a launch kit');
    record('Unified Open Signal/publication boundary '+width+'px',{size});
    await context.close();
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
    if(width<650){
      const compact=await page.locator('.p136-hero-content h1').boundingBox();
      assert.ok(compact&&compact.y-layout.hero.y<230,'Mobile heading cannot reserve a poster-sized blank area');
      assert.ok(layout.primary.bottom<844-100,'Primary action is available above the phone console');
      const inspection=await page.locator('.p136017-scene-inspection').boundingBox();
      const register=await page.locator('.p136-hero-register').boundingBox();
      if(inspection)assert.ok(register&&inspection.y+inspection.height+8<=register.y,
        'Mobile inspection status stays clear of the first-contact label: '+JSON.stringify({inspection,register}));
    }

    if(process.env.VITE_PARITY_V136_CINEMATIC==='true'){
      const cinema=page.locator('[data-cinematic-v136="native-institute"]');
      assert.equal(await cinema.count(),1,'One authored native Institute presentation layer');
      const cinemaRead=await cinema.evaluate(node=>({
        hidden:node.getAttribute('aria-hidden'),
        pointerEvents:getComputedStyle(node).pointerEvents,
        native:Boolean(node.querySelector('[data-arrival-surface="native-interface"]')),
        retiredImages:node.querySelectorAll('img,picture').length,
        mode:node.dataset.mode
      }));
      assert.equal(cinemaRead.hidden,'true','Native arrival framing is decorative, not invented content');
      assert.equal(cinemaRead.pointerEvents,'none','Native interface cannot block real navigation');
      assert.ok(cinemaRead.native,'The first-party native Institute interface is mounted');
      assert.equal(cinemaRead.retiredImages,0,'Removed promotional posters must not be requested');
      assert.equal(cinemaRead.mode,'poster','Legacy static-mode token retains reduced-motion behavior');
    } else assert.equal(await page.locator('[data-cinematic-v136]').count(),0,'Cinematic pilot is opt-in');

    assert.equal(layout.h1Count,1);assert.equal(layout.dockCount,1,'One canonical IREN companion');
    assert.equal(await page.locator('.p136-console-wayfinder').count(),1,'Exactly one persistent console wayfinder');
    if(width>=1280){
      const rail=await page.locator('.p136-hero-rail').boundingBox();
      const wayfinder=await page.locator('.p136-console-wayfinder').boundingBox();
      assert.ok(rail&&wayfinder&&wayfinder.x+wayfinder.width+4<rail.x,
        'The wide-screen console rail must live in the outer gutter, not obscure actionable hero tiles: '+
        JSON.stringify({rail,wayfinder}));
    }
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
    // V136.035: real category links must not be hidden beneath an unrelated
    // second layer of placeholder numerals and repeated default index names.
    const categoryPlates=page.locator('.p136-passages .p136-passage');
    assert.equal(await categoryPlates.count(),4,'Four existing discovery categories remain linked');
    assert.deepEqual(await categoryPlates.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))),
      ['/discover?category=games','/discover?category=tools','/discover?category=creative','/discover?category=research'],
      'Public category destinations stay unchanged');
    assert.equal(await categoryPlates.locator('.cw-artwork, .av136-index-field').count(),0,
      'Category links cannot render duplicate fallback cover art or giant numeric captions');
    assert.equal(await categoryPlates.locator('.p136035-category-surface[aria-hidden="true"]').count(),4,
      'New background is noninteractive and never claims to be creator media');
    const categoryGeometry=await categoryPlates.evaluateAll(nodes=>nodes.map(node=>{
      const body=node.querySelector('.p136-passage-copy'),heading=body.querySelector('strong'),summary=body.querySelector('small');
      const r=node.getBoundingClientRect(),h=heading.getBoundingClientRect(),d=summary.getBoundingClientRect();
      return {height:r.height,copyOverflows:body.scrollWidth>body.clientWidth+1,
       titleOverflows:heading.scrollWidth>heading.clientWidth+1,detailOverflows:summary.scrollWidth>summary.clientWidth+1,
       titleBelowDetail:h.bottom>d.top+1,right:r.right};
    }));
    assert.ok(categoryGeometry.every(x=>x.height>=120&&!x.copyOverflows&&!x.titleOverflows&&!x.detailOverflows&&!x.titleBelowDetail&&x.right<=width+1),
      'Category text must fit without overlap or horizontal clipping at '+width+'px: '+JSON.stringify(categoryGeometry));
    await page.screenshot({path:join(out,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
    // Source port from #749: a single, opt-in first-visit explanation linked to
    // the authoritative public Status page; no duplicate Wayfinder or tracking.
    const intro=page.locator('[data-first-visit-guide="v136"]');
    assert.equal(await intro.count(),1,'Exactly one native first-visit orientation section');
    assert.equal(await intro.getByRole('heading',{name:'What can you actually do here?'}).count(),1);
    assert.equal(await intro.getByRole('link',{name:'Check what works now'}).getAttribute('href'),'/status');
    assert.equal(await intro.locator('details[open]').count(),0,'Questions are opt-in');
    assert.equal(await page.locator('.p136-console-wayfinder').count(),1,'No second console navigation');
    const discoverOrder=await page.evaluate(()=>{
      const category=document.querySelector('.p136-passages'),guide=document.querySelector('[data-first-visit-guide="v136"]');
      return category?.compareDocumentPosition(guide)&Node.DOCUMENT_POSITION_FOLLOWING;
    });
    assert.ok(discoverOrder,'Published discovery stays before the optional guide');
    if([320,390,1440].includes(width)){
      const question=intro.locator('summary').nth(1);
      await question.click();
      assert.equal(await intro.locator('details[open]').count(),1);
      assert.equal(await intro.getByRole('link',{name:'See current Studio availability'}).getAttribute('href'),'/status');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,
        'Expanded native disclosure must not cause horizontal overflow');
      await page.screenshot({path:join(out,'first-visit-open-'+width+'.png'),fullPage:false,animations:'disabled'});
      await question.click();
      assert.equal(await intro.locator('details[open]').count(),0,'Native disclosure collapses without navigation');
    }
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
    if(width===390){
      await page.goto(base+'/start',{waitUntil:'domcontentloaded'});
      await page.getByRole('heading',{name:'WHAT BRINGS YOU HERE?'}).waitFor();
      await page.getByRole('button',{name:/I MAKE THINGS/i}).click();
      assert.equal(await page.getByRole('link',{name:/EXPLORE CREATOR STUDIO/i}).getAttribute('href'),'/studio');
      assert.equal(await page.getByText('Joining ANEVUM does not automatically grant upload or publication access.',{exact:false}).count(),1);
      assert.equal(await page.getByText('The public discussion board and open member registration are not live yet.',{exact:true}).count(),0);
      record('V136.036 Start Here uses honest publishing boundaries');
    }
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
  // The uploaded original must beat the category default; an unreadable
  // canonical cover must fall back to the correct type, without external fetch.
  for(const cover of ['provided','broken','missing']){
    const {page,context}=await contextFor(390,{state:'package',cover});
    await page.goto(base+'/discover',{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{name:packageFixture.title,exact:true}).waitFor();
    const thumb=page.locator('.av010-work-card .av136-project-thumbnail').first();
    await thumb.waitFor();
    const expected=cover==='provided'?'creator':'default';
    await page.waitForFunction(expected=>{
      const image=document.querySelector('.av010-work-card .av136-project-thumbnail');
      return image?.dataset.thumbnailSource===expected&&image.complete&&image.naturalWidth>0;
    },expected,{timeout:15000});
    assert.equal(await thumb.getAttribute('data-thumbnail-source'),expected);
    assert.equal(await thumb.getAttribute('data-thumbnail-kind'),'games');
    const src=await thumb.getAttribute('src');
    if(expected==='creator')assert.equal(src,COVER_ROUTE,'Approved creator image has priority');
    else assert.match(src,/\/assets\/default-thumbnails\/games\.svg$/,
      'Missing or broken thumbnail resolves to its own type-specific SVG');
    const requests=await page.evaluate(()=>performance.getEntriesByType('resource')
      .map(entry=>entry.name).filter(url=>url.includes('/assets/default-thumbnails/')));
    assert.ok(expected==='creator'||requests.some(url=>url.endsWith('/games.svg')),
      'Fallback must be fetched as a real first-party image');
    record('creator thumbnail source '+cover+' / '+expected);
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
      if(family==='atrium')await page.getByRole('heading',{level:1,name:/A creative universe/i}).waitFor();
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
    const cinema=page.locator('[data-cinematic-v136="native-institute"]');await cinema.waitFor();
    const opacity=()=>cinema.evaluate(el=>Number.parseFloat(getComputedStyle(el).opacity));
    assert.ok(await opacity()>.9,'Native interface overlay begins visible');
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
    assert.ok(await opacity()>.95,'Native overlay does not reveal an incompletely loaded 3D model');
    await page.evaluate(()=>{
      const canvas=document.querySelector('.p136-living-world .p136-living-canvas');
      if(canvas)canvas.dataset.assetState='ready';
    });
    await page.waitForFunction(()=>{
      const layer=document.querySelector('[data-cinematic-v136="native-institute"]');
      return layer&&Number.parseFloat(getComputedStyle(layer).opacity)<.5;
    });
    assert.ok(await opacity()<.5,'Native overlay reveals one canonical live environment on scroll');
    await page.screenshot({path:join(out,'cinematic-handoff-scroll-1440.png'),animations:'disabled'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.locator('.p136-button--primary').click();
    await page.waitForURL(/\/discover(?:\?|$)/);
    assert.equal(await page.locator('.p136-living-canvas').count(),1,'No duplicate WebGL renderer after cinematic navigation');
    record('native interface-to-world fade / accessible real Discover action / one renderer');
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

  }
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
  accepted=true;
}catch(error){
  for(const context of browser.contexts())for(const page of context.pages()){
    await page.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});
    writeFileSync(join(out,'failure.json'),JSON.stringify({url:page.url(),body:await page.locator('body').innerText().catch(()=>''),errors,forbidden,error:String(error)},null,2));
  }
  throw error;
}finally{
  // Generated screenshot receipts are outputs, not a source modification.
  const sourceChanges=execFileSync('git',['status','--porcelain','--untracked-files=all','--','.',':(exclude)evidence/**'],{encoding:'utf8'}).trim();
  writeFileSync(join(out,'acceptance.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeDirty:Boolean(sourceChanges),status:accepted?'PASS':'FAIL',scope:studioOnly?'studio-only':'full',checks,errors,forbidden,fixtureOnly:true},null,2)+'\n');
  await browser.close();await new Promise(done=>server.close(done));
}
