// CI browser regression: actual compiled UI + actual Better Auth + temporary
// SQLite. Loopback HTTPS only; no real accounts, email or deployed writes.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:https';
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import worker from '../web/a-canonical-stage.review.mjs';
import {fixture} from './helpers/canonical-fixture.mjs';
const argv=process.argv.slice(2),opt=k=>{const i=argv.indexOf(k);return i<0?undefined:argv[i+1]};
const chrome=opt('--chrome'),out=opt('--output'),engine=opt('--engine')||'chromium';
if(!out||!['chromium','webkit'].includes(engine)||(engine==='chromium'&&!chrome))throw Error('Provide --engine, --output and --chrome for Chromium');
mkdirSync(out,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),'anevum-v031-')),profile=join(temp,'chrome');mkdirSync(profile);
assert.equal(spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(temp,'key.pem'),'-out',join(temp,'cert.pem'),'-subj','/CN=127.0.0.1','-days','1'],{stdio:'ignore'}).status,0);
const {db,env}=fixture(),sent=new Map(),originalFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 if(String(url)==='https://api.resend.com/emails'){const mail=JSON.parse(options.body);sent.set(mail.to[0],/verification code is (\d{8})/.exec(mail.text)[1]);return Response.json({id:'synthetic-ci-only'})}
 return originalFetch(url,options);
};
const root=resolve('creator-v1/dist/web');
env.ASSETS={async fetch(request){const path=new URL(request.url).pathname;const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))return new Response('Not found',{status:404});const target=existsSync(file)&&extname(file)?file:join(root,'index.html');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml'}[extname(target)]||'application/octet-stream';return new Response(readFileSync(target),{headers:{'content-type':type}})}};
let base;
const server=createServer({key:readFileSync(join(temp,'key.pem')),cert:readFileSync(join(temp,'cert.pem'))},async(req,res)=>{
 try{
  if(req.url==='/__origin'){res.setHeader('content-type','application/json');res.end(JSON.stringify({origin:req.headers.origin??null}));return}
  const bytes=[];for await(const chunk of req)bytes.push(chunk);
  const headers=new Headers(req.headers);if(headers.get('origin')===base)headers.set('origin','https://a.anevum.com');headers.set('cf-connecting-ip','127.0.0.1');
  const request=new Request('https://a.anevum.com'+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(bytes)});
  const response=await worker.fetch(request,env,{});
  res.statusCode=response.status;
  for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
  const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.statusCode=500;res.end('Synthetic fixture failed');console.error(e)}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='https://127.0.0.1:'+server.address().port;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=18000){const end=Date.now()+timeout;while(Date.now()<end){try{const v=await fn();if(v)return v}catch{}await delay(100)}throw Error('Browser regression timed out')}
const launchBrowser=()=>engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
let browser=await launchBrowser();
let page;
try{
 let context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
 page=await context.newPage();
 const evaluate=expression=>page.evaluate(expression);
 const fill=async(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Input missing');const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const click=async selector=>page.locator(selector).click();
 const submit=async selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);
 const wait=async selector=>until(()=>evaluate(`!!document.querySelector(${JSON.stringify(selector)})`));
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/join');await wait('#anevum-email');
 // Demonstrate the original standard-browser failure without bypassing CSRF.
 const originProbe=await evaluate(`(async()=>({inherited:await (await fetch('/__origin',{method:'POST',mode:'same-origin'})).json(),old:await (await fetch('/__origin',{method:'POST',mode:'same-origin',referrerPolicy:'no-referrer'})).json(),fixed:await (await fetch('/__origin',{method:'POST',mode:'same-origin',referrerPolicy:'same-origin'})).json()}))()`);
 console.log('ORIGIN_POLICY_PROBE='+JSON.stringify(originProbe));if(engine==='webkit')assert.equal(originProbe.old.origin,'null');else assert.ok([base,'null'].includes(originProbe.old.origin));assert.equal(originProbe.fixed.origin,base);
 await fill('#anevum-email','pilot_a@fixture.invalid');await submit('.av12-email-entry');await wait('#anevum-otp');
 await until(()=>sent.get('pilot_a@fixture.invalid'));await fill('#anevum-otp',sent.get('pilot_a@fixture.invalid'));await submit('.av12-email-entry');await wait('#av12-handle');
 await fill('#av12-handle','browser_pilot');await fill('#av12-display','Browser Pilot');await submit('.av12-profile-form');await wait('.ms-dashboard');
 assert.equal(db.prepare('SELECT handle FROM member_creator_profiles').get().handle,'browser_pilot');
 // Real file input, blob preview, canvas crop and authenticated upload.
 async function image(slot){
  await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=800;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='#8f607f';ctx.fillRect(0,0,800,400);ctx.fillStyle='#e1c09b';ctx.fillRect(100,100,200,200);const blob=await new Promise(r=>c.toBlob(r,'image/png'));const transfer=new DataTransfer();transfer.items.add(new File([blob],'synthetic.png',{type:'image/png'}));const input=document.querySelector('.ms-image-${slot} input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait('.ms-image-'+slot+' canvas');
  await until(()=>evaluate(`(()=>{const c=document.querySelector('.ms-image-${slot} canvas');return c&&c.getContext('2d').getImageData(0,0,1,1).data[3]===255})()`));
  await click('.ms-image-'+slot+' .ms-primary');await wait('.ms-image-'+slot+' .ms-current-image');
 }
 await image('avatar');await image('banner');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_space_media').get().n,2);
 await evaluate(`[...document.querySelectorAll('.ms-toolbar nav button')].find(b=>b.textContent==='Edit profile').click()`);await wait('#av12-bio');await fill('#av12-bio','A saved introduction from a real browser test.');await submit('.av12-profile-form');await until(()=>db.prepare('SELECT bio FROM member_creator_profiles').get().bio.length>0);
 await evaluate(`[...document.querySelectorAll('.ms-toolbar nav button')].find(b=>b.textContent==='My wall').click()`);await wait('#wall-entry');await fill('#wall-entry','First browser transmission.');await submit('.ms-wall-compose');await until(()=>db.prepare('SELECT COUNT(*) AS n FROM member_wall_posts').get().n===1);await wait('.ms-wall-entry');
 const results={engine,inheritedOrigin:originProbe.inherited.origin,originalOrigin:originProbe.old.origin,correctedOriginMatches:true,realOtpSignup:true,profileSaved:true,avatarAndBannerUploaded:true,wallSaved:true,widths:[]};
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await page.setViewportSize({width,height});await delay(150);
  const state=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth+1,wall:!!document.querySelector('.ms-wall-entry'),image:[...document.querySelectorAll('.ms-cover img,.ms-portrait img')].every(i=>i.complete&&i.naturalWidth>0)})`);
  assert.equal(state.overflow,false,JSON.stringify({width,...state}));assert.equal(state.wall,true);assert.equal(state.image,true);
  await page.screenshot({path:join(out,'member-wall-'+width+'.png')});results.widths.push(width);
 }
 // Community composer respects private profiles; public opt-in enables discovery.
 await page.goto(base+'/community');await wait('.mc-own-top');
 await click('.mc-own-actions button');await wait('#community-wall-update');
 await fill('#community-wall-update','A private community draft.');await submit('.mc-compose');
 await wait('.mc-notice');assert.match(await page.locator('.mc-notice').innerText(),/private wall/);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_wall_posts').get().n,2);
 assert.equal(await page.locator('.mc-update').count(),0);
 await page.goto(base+'/member?tab=profile');await wait('#av12-bio');
 await page.locator('.av18-focus-options button').filter({hasText:'Writing'}).click();
 await page.locator('.av12-visibility input').check();await submit('.av12-profile-form');
 await until(()=>db.prepare('SELECT visibility FROM member_creator_profiles').get().visibility==='public');
 await page.goto(base+'/community?view=people');await wait('.mc-member-card');
 await fill('#member-search','@browser_pilot');await submit('.mc-directory-tools');
 await until(async()=>await page.locator('.mc-member-card').count()===1);
 assert.match(await page.locator('.mc-member-card').innerText(),/Browser Pilot/);
 await page.reload();await wait('.mc-member-card');
 await page.locator('#member-interest').selectOption('writing');await wait('.mc-member-card');
 assert.equal(await page.locator('.mc-member-card').count(),1);
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await page.setViewportSize({width,height});await delay(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Directory overflow '+width);
  await page.locator('.mc-directory').screenshot({path:join(out,'community-people-'+width+'.png')});
 }
 await page.locator('.mc-wall-link').first().click();await wait('.ms-wall-entry');
 assert.equal(await page.locator('.ms-wall-entry').count(),2);
 await page.goto(base+'/community');await wait('.mc-update');
 await click('.mc-own-actions button');await wait('#community-wall-update');
 await fill('#community-wall-update','A public signal from the community.');await submit('.mc-compose');await wait('.mc-notice');
 assert.match(await page.locator('.mc-notice').innerText(),/public wall/);
 await until(async()=>await page.locator('.mc-update').count()===3);
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await page.setViewportSize({width,height});await delay(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Community overflow '+width);
  await page.locator('.mc-activity').screenshot({path:join(out,'community-activity-'+width+'.png')});
 }
 await page.locator('.mc-update').filter({hasText:'A public signal from the community.'}).locator('.mc-wall-link').click();await wait('.ms-wall-entry.is-target');
 assert.match(await page.locator('.ms-wall-entry.is-target').innerText(),/public signal/);
 assert.equal(await page.locator('.ms-wall-entry.is-target').evaluate(el=>el===document.activeElement),true);
 await page.reload();await wait('.ms-wall-entry.is-target');
 Object.assign(results,{privateCommunityComposer:true,publicOptInDirectory:true,interestFilter:true,publicCommunityComposer:true,wallDeepLink:true});
 // Release earlier community/image screenshot surfaces before the next WebKit journey.
 // Restore the real fixture session in a new process; the original authenticated
 // user and SQLite state remain unchanged while renderer memory is reclaimed.
 const preservedSession=await context.storageState();
 await context.close();
 await browser.close();
 browser=await launchBrowser();
 context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},storageState:preservedSession});
 page=await context.newPage();
 // New progression: real fixed XP, a live level-up, persistent notices and artwork.
 await page.goto(base+'/thebutton',{waitUntil:'domcontentloaded'});await page.locator('.an-xp-button').waitFor();
 await until(async()=>await page.locator('.an-xp-button').isEnabled());
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
 for(let i=1;i<=13;i++){
  await page.locator('.an-xp-button').click();
  await until(()=>db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n===i);
  await until(async()=>await page.locator('.an-xp-button').isEnabled());
 }
 await until(async()=>/100 XP/.test(await page.locator('.an-button-progress').innerText()));
 assert.match(await page.locator('.an-button-progress').innerText(),/Level 3/);
 async function drain(){for(let i=0;i<20;i++){if(!await page.locator('.an-toast').count())break;await page.locator('.an-toast-open button').waitFor({timeout:10000});await page.locator('.an-toast-open button').click();await delay(100)}}
 // Dismiss earlier receipts in order until the real level-three unlock arrives.
 for(let i=0;i<20;i++){
  await page.locator('.an-toast-open').waitFor({timeout:10000});
  if(await page.locator('.an-toast-level').count()&&/Level 3 reached/.test(await page.locator('.an-toast-level').innerText()))break;
  await page.locator('.an-toast-open button').click();await delay(100);
 }
 await page.locator('.an-toast-level.an-toast-open').waitFor();
 assert.match(await page.locator('.an-toast-level').innerText(),/Level 3 reached/);
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await page.setViewportSize({width,height});await delay(80);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Button overflow '+width);
  await page.screenshot({path:join(out,'xp-button-level-up-'+width+'.png')});
 }
 await drain();
 await page.locator('.an-preview-controls button').filter({hasText:'PREVIEW MEDAL'}).click();
 await page.locator('.an-toast-award.an-toast-open').waitFor();
 assert.match(await page.locator('.an-toast-award').innerText(),/ANIMATION PREVIEW/);
 await page.screenshot({path:join(out,'medal-notification-'+engine+'.png')});
 await drain();
 await page.locator('.an-preview-controls button').filter({hasText:'PREVIEW UPDATE'}).click();
 await page.locator('.an-toast-info.an-toast-open').waitFor();
 // Let one complete flash-expand-hold-collapse cycle finish naturally.
 await page.locator('.an-toast-info').waitFor({state:'detached',timeout:9000});
 assert.equal(db.prepare('SELECT SUM(amount) AS n FROM member_xp_events').get().n,65);
 await page.reload();await until(async()=>/100 XP/.test(await page.locator('.an-button-progress').innerText()));
 await page.locator('.an-inbox-toggle').click();await page.locator('.an-history').waitFor();
 assert.match(await page.locator('.an-history').innerText(),/Level 3 reached/);
 await page.locator('.an-history header button').click();
 await page.goto(base+'/levels');await wait('.an-artifact-card');
 assert.equal(await page.locator('.an-artifact-card').count(),60);
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await page.setViewportSize({width,height});await delay(100);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Collection overflow '+width);
  // Force lazy images into view before checking every original SVG.
  const icons=page.locator('.an-artifact-card .level-emblem');
  for(let i=0;i<60;i++){await icons.nth(i).scrollIntoViewIfNeeded()}
  await until(()=>evaluate(`[...document.querySelectorAll('.an-artifact-card img')].every(i=>i.complete&&i.naturalWidth>0)`));
  await page.locator('.an-series').screenshot({path:join(out,'level-collection-'+width+'.png')});
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base+'/thebutton');await page.locator('.an-preview-controls button').filter({hasText:'PREVIEW LEVEL UP'}).click();
 await page.locator('.an-toast-level.an-toast-open').waitFor();
 assert.equal(await page.locator('.an-toast-mark').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.screenshot({path:join(out,'reduced-motion-level-up.png')});
 Object.assign(results,{fixedXpPresses:13,persistedTestXp:65,totalXp:100,level:3,sixtyIconsLoaded:true,notificationHistory:true,fullAnimationCycle:true,reducedMotion:true});
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(results,null,2));console.log('BROWSER_LEVELS_AWARDS_XP_NOTIFICATIONS_AND_SIXTY_ICONS=PASS');
}catch(error){
 if(page){const state=await page.evaluate('({url:location.pathname+location.hash,text:document.body.innerText.slice(-5000)})').catch(()=>null);console.error('BROWSER_FAILURE_STATE='+JSON.stringify(state));await page.screenshot({path:join(out,'failure.png')}).catch(()=>{});}
 throw error;
}finally{
 await browser.close();
 server.close();globalThis.fetch=originalFetch;db.close();rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
