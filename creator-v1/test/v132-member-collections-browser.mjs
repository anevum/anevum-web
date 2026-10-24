/** ANEVUM V011: compiled React + synthetic private data; no external or production writes. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=resolve('creator-v1/dist/web'),output='/tmp/member-collections-v011';
mkdirSync(output,{recursive:true});
const checks=[],captures=[],errors=[],unexpected=[],artRequests=[];
const check=name=>{checks.push(name);console.log('PASS '+name)};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');let file=resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!['GET','HEAD'].includes(req.method)){unexpected.push('Origin write '+req.method+' '+u.pathname);res.writeHead(405);res.end();return}
 if(!file.startsWith(root+sep)||!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return}file=join(root,'index.html');
 }
 res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
 res.end(req.method==='HEAD'?undefined:readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const id=x=>x.repeat(32);
const fixtureSaves=[
 {id:id('a'),title:'Orbit Garden',summary:'Cultivate a world.',category:'games',creatorHandle:'maker_one',creatorName:'A Maker',publishedAt:'2026-10-20T00:00:00Z',savedAt:1792700000},
 {id:id('b'),title:'Signal Workbench',summary:'Tools to make meaningful prototypes.',category:'tools',creatorHandle:'maker_two',creatorName:'B Maker',publishedAt:'2026-10-20T00:00:00Z',savedAt:1792700300}
];
const granted=['first_signal','world_shaper','first_orbit','first_reply','first_creation'].map((x,i)=>({id:x,name:'Synthetic Badge '+(i+1),detail:'Server fixture only',xp:0,symbol:'',earnedAt:1792700000+i*50}));
const inventory={currentLevel:5,levels:[1,2,3,4,5].map(i=>({level:i,name:'Earned Sample '+i,subtitle:'Fixture-earned progression',motion:'Static fixture art'}))};
const profile={handle:'fixture_member',displayName:'Synthetic Member',bio:'',headline:'Testing one account',worldTheme:'continuance',focus:[],visibility:'private',revision:1,createdAt:1792700000,updatedAt:1792700000};
const recognition={badgeMode:'automatic',badgeIds:[],earnedBadges:granted,featuredBadges:granted.slice(0,3),earnedMedals:[],earnedRibbons:[],medalId:null,ribbonIds:[],aura:'none',revision:1};
let activePage=null,fail=null;
async function fixture(width,mode='ready',pagePath='/saved'){
 const ctx=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});
 const state={mode,reads:[],writes:[],items:[...fixtureSaves]};
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(url.origin!==origin){unexpected.push('External '+url.href);await route.abort();return}
  if(!['GET','HEAD'].includes(req.method())){state.writes.push(req.method()+' '+path);unexpected.push('Write '+req.method()+' '+path);await route.abort();return}
  if(path.startsWith('/api/'))state.reads.push(path);
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/v1/member/auth/get-session'){
   const guest=mode==='guest';await json(guest?null:{user:{id:'fixture-member-001',name:'Synthetic Member',email:'local@example.invalid',emailVerified:true,createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-23T00:00:00Z'},session:{id:'fixture-session',userId:'fixture-member-001',token:'not-a-real-token',expiresAt:'2026-11-01T00:00:00Z'}});return;
  }
  if(path==='/api/v1/member/health'){await json({service:'anevum-canonical-auth-staging',status:'ready',registration:'invite-only',projectSavesReady:mode!=='disabled',signupEnabled:false});return}
  if(path==='/api/v1/member/project-saves'&&req.method()==='GET'){if(mode!=='ready')unexpected.push('Private saves fetched when disabled');await json({items:state.items,nextCursor:null});return}
  if(path==='/api/v1/member/progression'){await json({progression:{xp:1200,testXp:0,milestoneXp:35,level:5,maxLevel:30,levelStart:1200,nextLevel:1875,artifact:'Earned fixture specimen',awards:granted.slice(0,2)}});return}
  if(path==='/api/v1/member/notifications'){await json({items:[],recent:[]});return}
  if(path==='/api/v1/member/rewards/inventory'){await json(inventory);return}
  if(path==='/api/v1/member/recognition'){await json(recognition);return}
  if(path==='/api/v1/member/auth-methods'){await json({registration:'invite-only',linking:'explicit',methods:{email:{available:true},google:{available:false},github:{available:false},apple:{available:false},microsoft:{available:false},passkey:{available:false}}});return}
  if(path==='/api/v1/member/creator-profile'){await json({memberId:'fixture-member-001',profile});return}
  if(path==='/api/v1/member/space'){await json({media:{},awards:granted.slice(0,2),featuredAwards:[],earnedBadges:granted,showStats:true,revision:1,aura:'none',stats:{level:5,xp:1200,levelStart:1200,nextLevel:1875,awards:2,wallPosts:0}});return}
  if(path==='/api/v1/member/wall'){await json({posts:[]});return}
  if(path.match(/^\/api\/v1\/member\/rewards\/levels\/(\d+)\/card$/)){
   const m=Number(path.match(/levels\/(\d+)\//)[1]);artRequests.push(m);
   if(m<1||m>5)unexpected.push('Unearned specimen requested '+m);
   await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#352947"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="12">FIXTURE</text></svg>'});return;
  }
  if(path==='/api/v1/status'){await json({version:'fixture',phase:'review',counts:{publishedProjects:0,publishedCreators:0}});return}
  if(!path.startsWith('/api/')){await route.continue();return}
  await json({error:'Not a fixture endpoint'},503);
 });
 const page=await ctx.newPage();activePage=page;page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+pagePath,{waitUntil:'domcontentloaded'});
 return {ctx,page,state};
}
async function fit(page,name){const a=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(a.scroll<=a.w+1,JSON.stringify(a));check(name+' viewport fits')}
async function shot(page,name){
 await page.evaluate(()=>{let el=document.querySelector('#synthetic-qa-banner');if(el)return;el=document.createElement('div');el.id='synthetic-qa-banner';el.textContent='SYNTHETIC MEMBER DATA / COMPILED REACT / NOT DEPLOYED';el.setAttribute('role','note');el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#271b3f;color:#f3e2bd;padding:4px 14px;text-align:center;font:600 11px/1.5 sans-serif;pointer-events:none';document.body.append(el)});
 await page.evaluate(()=>{document.activeElement instanceof HTMLElement&&document.activeElement.blur();window.scrollTo({top:0,left:0,behavior:'instant'})});
 await page.waitForFunction(()=>scrollY<=1);
 await page.screenshot({path:join(output,name+'.png'),fullPage:true,animations:'disabled'});captures.push(name+'.png');
}
function nav(page){return page.getByRole('navigation',{name:'My collection navigation'})}
try{
 for(const width of [1440,390,320]){
  const {ctx,page,state}=await fixture(width);
  await page.locator('.avsaved-card').first().waitFor();
  await nav(page).getByRole('link',{name:'Saved Projects'}).waitFor();
  assert.equal(await nav(page).getByRole('link',{name:'Saved Projects'}).getAttribute('aria-current'),'page');
  assert.equal(await nav(page).getByRole('link').count(),4);
  check(width+' saved library uses four shared destinations');await fit(page,width+' saved');
  await shot(page,'saved-'+width);
  await nav(page).getByRole('link',{name:'Evolution'}).click();
  await page.getByRole('heading',{name:'Your evolution.'}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.av75-earned-level').length===4);
  assert.equal(await nav(page).getByRole('link',{name:'Evolution'}).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('.av75-earned-honor').count(),0);
  assert.match(await page.locator('.av75-earned-level').first().innerText(),/Earned Sample 5/);
  check(width+' earned-only levels default to four with no duplicate awards');
  await page.getByRole('button',{name:'Show 1 more earned levels'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.av75-earned-level').length===5);
  assert.match(await page.locator('.av75-earned-level').first().innerText(),/Earned Sample 5/);
  await page.getByRole('button',{name:'Show fewer earned levels'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.av75-earned-level').length===4);
  check(width+' level collection expands and collapses');await fit(page,width+' evolution');
  await shot(page,'evolution-'+width);
  await nav(page).getByRole('link',{name:'Awards'}).click();
  await page.getByRole('heading',{name:'Marks of your journey.'}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.av75-earned-honor').length===3);
  check(width+' verified awards default to three');
  await page.getByRole('button',{name:'Show 2 more earned distinctions'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.av75-earned-honor').length===5);
  check(width+' verified awards expand without unearned art');await fit(page,width+' recognition');
  await shot(page,'recognition-'+width);
  await nav(page).getByRole('link',{name:'My Space'}).click();
  await page.locator('.ms-toolbar-next').waitFor();
  await nav(page).getByRole('link',{name:'My Space'}).waitFor();
  const expectedTabs=process.env.VITE_PACKAGE_CREATOR_GALLERY_V010==='true'?4:3;
  assert.equal(await page.locator('.ms-toolbar-next nav button').count(),expectedTabs);
  for(const label of ['Overview','My wall','Player card'])await page.locator('.ms-toolbar-next nav').getByRole('button',{name:label,exact:true}).waitFor();
  check(width+' simplified member toolbar exposes core tabs');
  await page.locator('.ms-toolbar-more summary').click();
  await page.getByRole('button',{name:'Appearance',exact:true}).click();
  await page.locator('.ms-appearance-grid').waitFor();
  check(width+' profile and appearance settings remain accessible');await fit(page,width+' member');
  await shot(page,'member-'+width);
  assert.equal(state.writes.length,0);
  await ctx.close();
 }
 const guest=await fixture(390,'guest');
 await guest.page.getByRole('heading',{name:'THIS SPACE BELONGS TO YOU.'}).waitFor();
 assert.equal(await nav(guest.page).count(),0);
 assert.equal(guest.state.reads.includes('/api/v1/member/project-saves'),false);
 check('guest cannot see collection navigation or saved-work metadata');await guest.ctx.close();
 const disabled=await fixture(390,'disabled');
 await disabled.page.getByRole('heading',{name:'SAVED WORKS ARE NOT YET ACTIVE.'}).waitFor();
 assert.equal(await nav(disabled.page).count(),0);
 assert.equal(disabled.state.reads.includes('/api/v1/member/project-saves'),false);
 check('disabled collection has no private fetch and no misleading member hub');await disabled.ctx.close();
 assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 assert.ok(artRequests.every(level=>level>=1&&level<=5));
 check('no runtime errors, forged XP, external calls or unauthorised specimen requests');
}catch(e){fail=e.message;if(activePage&&!activePage.isClosed())await activePage.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e}
finally{
 writeFileSync(join(output,'receipt.json'),JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),synthetic:true,checks,captures,errors,unexpected,artRequests,fail},null,2));
 await browser.close();await new Promise(done=>server.close(done));
}
