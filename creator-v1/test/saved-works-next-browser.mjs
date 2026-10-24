/** Real compiled React / purely synthetic private fixture. No production calls. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=resolve('creator-v1/dist/web'),output='/tmp/anevum-saved-review';
mkdirSync(output,{recursive:true});
const checks=[],captures=[],errors=[],unexpected=[];
const log=label=>{checks.push(label);console.log('PASS '+label)};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');let path=resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 if(!path.startsWith(root+sep)||!existsSync(path)||!statSync(path).isFile()){
  if(extname(path)){res.writeHead(404);res.end();return}path=join(root,'index.html');
 }
 res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});
 res.end(req.method==='HEAD'?undefined:readFileSync(path));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const id=(x)=>x.repeat(32);
const saved=[
 {id:id('a'),title:'Orbital Garden',summary:'Grow a pocket universe through seasonal decisions.',category:'games',creatorHandle:'maker_one',creatorName:'A Maker',publishedAt:'2026-10-23T00:00:00Z',savedAt:1792700000},
 {id:id('b'),title:'Signal Workbench',summary:'Tools for turning structured ideas into working prototypes.',category:'tools',creatorHandle:'maker_two',creatorName:'B Maker',publishedAt:'2026-10-23T00:00:00Z',savedAt:1792700100},
 {id:id('c'),title:'Living Garden',summary:'A different playable approach to growing worlds.',category:'games',creatorHandle:'maker_three',creatorName:'C Maker',publishedAt:'2026-10-23T00:00:00Z',savedAt:1792700200}
];
let lastPage=null;let failure=null;
async function fixture(width,mode='ready'){
 const ctx=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});
 const state={mode,items:saved.map(x=>({...x})),reads:[],writes:[]};
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==base){unexpected.push('External '+url.href);await route.abort();return}
  const path=url.pathname;
  if(!path.startsWith('/api/')){if(!['GET','HEAD'].includes(req.method()))unexpected.push('Write nonapi '+path);await route.continue();return}
  state.reads.push(req.method()+' '+path);
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/v1/member/auth/get-session'){await json(state.mode==='guest'?null:{
   user:{id:'synthetic-saved-user',name:'Synthetic member',email:'local@example.invalid',emailVerified:true,createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-23T00:00:00Z'},
   session:{id:'local-session',userId:'synthetic-saved-user',token:'synthetic-only',expiresAt:'2026-10-30T00:00:00Z'}
  });return}
  if(path==='/api/v1/member/health'){await json({service:'anevum-canonical-auth-staging',status:'ready',registration:'invite-only',projectSavesReady:state.mode!=='disabled',signupEnabled:false});return}
  if(path==='/api/v1/member/project-saves'&&req.method()==='GET'){
   if(state.mode!=='ready')unexpected.push('Unexpected private list '+state.mode);
   await json({items:state.items,nextCursor:null});return
  }
  const m=path.match(/^\/api\/v1\/member\/project-saves\/([a-f0-9]{32})$/);
  if(m&&req.method()==='DELETE'){
   state.writes.push(path);state.items=state.items.filter(x=>x.id!==m[1]);
   await json({saved:false,changed:true});return
  }
  if(!['GET','HEAD'].includes(req.method()))unexpected.push('Unexpected write '+req.method()+' '+path);
  await json({error:'Not a fixture route'},503);
 });
 const page=await ctx.newPage();lastPage=page;page.setDefaultTimeout(12000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/saved',{waitUntil:'domcontentloaded'});
 await page.locator('.avsaved-shell').first().waitFor();
 return {ctx,page,state};
}
async function fit(page,label){
 const sizes=await page.evaluate(()=>({w:innerWidth,document:document.documentElement.scrollWidth}));
 assert.ok(sizes.document<=sizes.w+1,label+' '+JSON.stringify(sizes));log(label);
}
async function snap(page,name){await page.locator('.avsaved-header').evaluate(header=>{if(header.querySelector('.avsaved-fixture-marker'))return;const marker=document.createElement('p');marker.className='avsaved-fixture-marker';marker.textContent='SYNTHETIC BROWSER TEST / NOT DEPLOYED';marker.style.cssText='font:600 11px/1.4 sans-serif;letter-spacing:.06em;color:#ffe0af;margin:0 0 14px';header.prepend(marker)});await page.screenshot({path:join(output,name+'.png'),fullPage:true,animations:'disabled'});captures.push(name+'.png')}
try{
 for(const width of [1440,390,320]){
  const {ctx,page,state}=await fixture(width);
  await page.locator('.avsaved-card').first().waitFor();
  assert.equal(await page.locator('.avsaved-card').count(),3);
  assert.equal(await page.locator('.avsaved-content').getAttribute('data-view'),'list');
  log(width+' starts with real metadata and compact list');await fit(page,width+' list fits');
  await snap(page,'saved-list-'+width);
  await page.getByRole('combobox',{name:'Saved category'}).selectOption('games');
  await page.waitForFunction(()=>document.querySelectorAll('.avsaved-card').length===2);
  assert.equal(await page.locator('.avsaved-card').count(),2);log(width+' category filter');
  await page.getByRole('searchbox',{name:'Search saved work'}).fill('Orbital');
  await page.waitForFunction(()=>document.querySelectorAll('.avsaved-card').length===1);
  assert.equal(await page.locator('.avsaved-card').count(),1);log(width+' literal search intersects category');
  await page.getByRole('searchbox',{name:'Search saved work'}).fill('xxxxxxxxxxx');
  await page.getByRole('heading',{name:'No matches in the projects loaded.'}).waitFor();
  await page.getByRole('button',{name:'Show all saved projects'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.avsaved-card').length===3);log(width+' clear filters recovers');
  await page.getByRole('button',{name:'Gallery'}).click();
  assert.equal(await page.locator('.avsaved-content').getAttribute('data-view'),'grid');
  await fit(page,width+' gallery fits');await snap(page,'saved-gallery-'+width);
  await page.getByRole('button',{name:'List',exact:true}).click();
  assert.equal(await page.locator('.avsaved-content').getAttribute('data-view'),'list');
  await ctx.close();
 }
 const {ctx,page,state}=await fixture(390);
 await page.locator('.avsaved-card').first().waitFor();
 await page.getByRole('combobox',{name:'Saved category'}).selectOption('tools');
 await page.waitForFunction(()=>document.querySelectorAll('.avsaved-card').length===1);
 await page.getByRole('button',{name:'UNSAVE',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.avsaved-card').length===2);
 assert.equal(await page.getByRole('combobox',{name:'Saved category'}).inputValue(),'all');
 assert.equal(state.writes.length,1);
 log('removal retains server action and restores category after last item');await ctx.close();
 const guest=await fixture(390,'guest');
 await guest.page.getByRole('heading',{name:'THIS SPACE BELONGS TO YOU.'}).waitFor();
 assert.ok(!guest.state.reads.some(x=>x.includes('/project-saves')));log('guest cannot read private collection');await guest.ctx.close();
 const disabled=await fixture(390,'disabled');
 await disabled.page.getByRole('heading',{name:'SAVED WORKS ARE NOT YET ACTIVE.'}).waitFor();
 assert.ok(!disabled.state.reads.some(x=>x.includes('/project-saves')));log('inactive environment does not read collection');await disabled.ctx.close();
 assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);log('no runtime errors, external calls or unexpected private operations');
}catch(e){failure=e.message;if(lastPage&&!lastPage.isClosed()){await lastPage.screenshot({path:join(output,'failure.png'),fullPage:true}).catch(()=>{});}throw e}
finally{
 writeFileSync(join(output,'receipt.json'),JSON.stringify({sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks,captures,errors,unexpected,failure,synthetic:true},null,2));
 await browser.close();await new Promise(done=>server.close(done));
}
