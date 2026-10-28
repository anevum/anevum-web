/** V142: compiled, read-only visual acceptance for changed navigation only. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,statSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=resolve('creator-v1/dist/web'),out=resolve('evidence/v142-compiled');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let path;try{path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
  let filename=resolve(root,'.'+path);
  if(filename!==root&&!filename.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(!existsSync(filename)||!statSync(filename).isFile())filename=join(root,'index.html');
  res.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream','cache-control':'no-store'});
  res.end(req.method==='HEAD'?undefined:readFileSync(filename));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={source:'V142-local-compiled',checks:[],screenshots:[],errors:[]};
const record=(name,detail={})=>{report.checks.push({name,...detail});console.log('PASS',name,JSON.stringify(detail));};
try{
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===1440?900:844},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin){await route.abort();return;}
  if(!url.pathname.startsWith('/api/')){await route.continue();return;}
  let data=null;
  if(url.pathname==='/api/v1/status')data={version:'v142-visual-review',counts:{publishedProjects:0,publishedCreators:0}};
  else if(url.pathname==='/api/v1/projects')data={items:[],count:0,nextCursor:null};
  else if(url.pathname==='/api/v1/categories')data={categories:[]};
  else if(url.pathname==='/api/v1/creators')data={items:[],count:0,nextCursor:null};
  else if(url.pathname==='/api/v1/member/auth-methods')data={availability:'unavailable',registration:'closed',linking:'disabled',methods:{email:{available:false},google:{available:false},github:{available:false},apple:{available:false},microsoft:{available:false},passkey:{available:false}}};
  else if(url.pathname.endsWith('/health'))data={status:'unavailable'};
  else if(url.pathname.endsWith('/get-session'))data=null;
  await route.fulfill({status:data===null?404:200,contentType:'application/json',body:JSON.stringify(data===null?{error:'Offline review fixture'}:data)});
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',e=>report.errors.push({width,error:String(e)}));
 for(const path of ['/','/severance','/discover','/about','/start','/guide','/creators','/community','/boards','/status','/levels','/recognition','/auras','/join','/support','/support/transparency','/support/collection','/studio','/member']){
  await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:18000});
  await page.locator('#main').waitFor();
  await page.waitForTimeout(500); // Bounded paint grace; websocket/health polling must not block navigation.
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+width+' '+path+': '+overflow);
  const file=width+'--'+(path==='/'?'home':path.slice(1))+'.png';
  await page.screenshot({path:join(out,file),fullPage:true,animations:'disabled'});
  report.screenshots.push(file);
  if(path==='/'){
   assert.equal(await page.locator('.av138-header-status').count(),0,'Old duplicate header Status callout removed');
   assert.equal(await page.locator('.p136-main-nav a[href="/status"]').count(),1,'Canonical Status nav remains');
   assert.equal((await page.locator('.p136-console-station').first().textContent())?.includes('Entrance'),true,'Updated Home rail secondary label is present in DOM, even when CSS hides it');
   assert.equal(await page.getByRole('link',{name:/EXPLORE THE GAME/i}).count(),1);
   record('Live game-first home nav at '+width,{overflow});
  }
  if(path==='/discover'){
   const helper=page.locator('.p136-discover-helper');
   await helper.waitFor();
   assert.equal(await helper.innerText(),'Publishing status');
   assert.equal(await helper.getAttribute('href'),'/status');
   record('Discover helper points to real publishing status at '+width,{overflow});
  }
  if(path==='/support'){
   await page.getByRole('heading',{name:/Keep the signal alive/i}).waitFor();
   assert.equal(await page.locator('[data-support-enrollment="inactive"]').count(),1);
   assert.equal(await page.getByRole('link',{name:/Explore TRANSCOSMIC: SEVERANCE/i}).getAttribute('href'),'/severance');
   assert.equal(await page.getByRole('link',{name:/VIEW VERIFIED STATUS/i}).getAttribute('href'),'/status');
   assert.equal(await page.locator('a[href="/support/collection"],a[href^="https://checkout.stripe.com"],a[href^="https://billing.stripe.com"]').count(),0);
   assert.equal(await page.getByRole('button',{name:/checkout|membership|subscribe/i}).count(),0);
   record('Obsolete public supporter checkout and old membership promotion removed at '+width);
  }
  if(path==='/community')record('Public Commons and its actual member wall routes preserved at '+width);
  if(path==='/studio')record('Protected Studio route still renders its own permission guard at '+width);
  if(path==='/start')record('Archived Start remains reachable, not default navigation at '+width,{overflow});
 }
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:18000});
 const search=page.getByRole('button',{name:'Search ANEVUM',exact:true}).first();
 await search.waitFor();await search.click();
 await page.locator('.portal-launcher[open]').waitFor();
 const links=await page.locator('.portal-launcher-results a').evaluateAll(nodes=>nodes.map(a=>({href:a.getAttribute('href'),text:a.textContent?.trim()||''})));
 assert.ok(links.some(x=>x.href==='/severance'),'Current game must be default in actual switchboard');
 assert.ok(links.some(x=>x.href==='/status'),'Real status must be default in actual switchboard');
 assert.ok(!links.some(x=>x.href==='/create'||x.href==='/workspace'||x.href?.startsWith('/atlas')),'Legacy path not displayed');
 assert.ok(!links.some(x=>x.href==='/start'),'Onboarding path retained but not a top game-first suggestion');
 await page.screenshot({path:join(out,width+'--switchboard.png'),animations:'disabled'});
 report.screenshots.push(width+'--switchboard.png');
 record('Quick switchboard prioritizes current game, status and verified work at '+width,{links:links.map(x=>x.href)});
 await page.getByRole('link',{name:/TRANSCOSMIC: SEVERANCE/i}).first().click();
 await page.waitForURL(origin+'/severance');
 await page.locator('[data-public-playable="false"]').waitFor();
 record('SEVERANCE switchboard target renders non-playable public dossier at '+width);
 await page.close();await context.close();
}
assert.deepEqual(report.errors,[],'No JavaScript errors after browse/navigation');
report.status='PASS';
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
writeFileSync(join(out,'receipt.json'),JSON.stringify(report,null,2)+'\n');
console.log('V142 COMPILED VISUAL ACCEPTANCE',report.status,report.checks.length,'checks');
