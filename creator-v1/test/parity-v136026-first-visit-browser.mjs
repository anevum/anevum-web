/**
 * V138 first visit acceptance: current studio/game development, not retired
 * broad-network onboarding. Keeps the existing /start page reachable.
 * Compiled Chromium, read-only synthetic loopback, no account actions.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {existsSync,mkdirSync,readFileSync,writeFileSync,statSync} from "node:fs";
import {resolve,join,extname,sep} from "node:path";

const {chromium}=createRequire(import.meta.url)("playwright");
const root=resolve("creator-v1/dist/web");
const output=resolve(process.env.PARITY_QA_OUTPUT||"evidence/parity-v136/first-visit-026");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",
 ".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",
 ".woff2":"font/woff2",".glb":"model/gltf-binary",".json":"application/json"};
const report={contract:"v138-first-visit-current-stage-loopback",status:"INCOMPLETE",
 source:process.env.ANEVUM_SOURCE_SHA||null,syntheticOnly:true,productionReleased:false,
 widths:[],blockedRequests:[],errors:[]};
assert.ok(existsSync(join(root,"index.html")),"Compiled frontend is required");
mkdirSync(output,{recursive:true});
const server=createServer((req,res)=>{
 if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);res.end();return;}
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);}
 catch{res.writeHead(400);res.end();return;}
 let file=resolve(root,"."+pathname);
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return;}
  file=join(root,"index.html");
 }
 res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream",
  "cache-control":"no-store",
  ...(extname(file)===".html"?{"content-security-policy":
   "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; form-action 'self'; object-src 'none'; frame-src 'self'"}:{})});
 res.end(req.method==="HEAD"?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,
  args:["--no-sandbox","--enable-webgl","--enable-unsafe-swiftshader","--use-angle=swiftshader"]});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width>600?960:844},
   deviceScaleFactor:1,reducedMotion:"reduce"});
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==="webgl2"?null:original.call(this,kind,...args);
   };
  });
  await context.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base||!["GET","HEAD"].includes(req.method())){
    report.blockedRequests.push({width,url:req.url(),method:req.method()});await route.abort();return;
   }
   if(url.pathname.startsWith("/api/")){
    let content={error:"Synthetic endpoint unavailable"},status=404;
    if(url.pathname==="/api/v1/member/auth/get-session"){content=null;status=200;}
    if(url.pathname==="/api/v1/status"){content={version:"v138-local-fixture",features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}};status=200;}
    if(url.pathname==="/api/v1/projects"||url.pathname==="/api/v1/creators"){content={items:[],count:0,nextCursor:null};status=200;}
    if(url.pathname==="/api/v1/categories"){content={categories:[]};status=200;}
    await route.fulfill({status,contentType:"application/json",body:JSON.stringify(content)});return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",error=>report.errors.push({width,message:String(error)}));
  await page.goto(base+"/",{waitUntil:"domcontentloaded"});
  const stage=page.locator('[data-stage-focus="severance-development"]');
  await stage.waitFor();
  assert.equal(await page.locator("main#main").count(),1,"One semantic main at "+width);
  assert.equal(await page.locator(".p136-console-wayfinder").count(),1,"One working console navigation at "+width);
  assert.equal(await page.locator(".ir80-dock").count(),1,"One retained IREN companion at "+width);
  assert.equal(await stage.locator(".av138-plate").count(),4,"Four genuine concept systems");
  assert.equal(await page.locator('[data-first-visit-guide="v136"]').count(),0,
   "Superseded first-visit mega-panel is not duplicated on focused homepage");
  assert.equal(await stage.getByRole("link",{name:/EXPLORE THE GAME/}).getAttribute("href"),"/severance");
  assert.equal(await stage.getByRole("link",{name:"DEVELOPMENT STATUS",exact:true}).getAttribute("href"),"/status");
  assert.match(await stage.locator(".av138-availability").innerText(),/No public multiplayer game or open beta is available yet/i);
  assert.equal(await page.getByRole("link",{name:/play now|join server|watch trailer/i}).count(),0,
   "No false play or trailer promises");
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"No home overflow at "+width);
  await page.screenshot({path:join(output,"current-first-contact-"+width+".png"),animations:"disabled"});
  await page.goto(base+"/status",{waitUntil:"domcontentloaded"});
  await page.locator(".v091-status-page").waitFor();
  assert.match(await page.locator(".v136-public-focus").innerText(),/Prove Severance multiplayer/);
  assert.equal(await page.locator(".v091-status-service").count(),6);
  await page.goto(base+"/start",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"WHAT BRINGS YOU HERE?"}).waitFor();
  await page.getByRole("button",{name:/I MAKE THINGS/}).click();
  assert.equal(await page.getByRole("link",{name:/EXPLORE CREATOR STUDIO/}).getAttribute("href"),"/studio");
  assert.match(await page.locator(".start-journey-detail").innerText(),/upload or publication access/i);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"No legacy onramp overflow at "+width);
  report.widths.push({width,home:true,status:true,legacyOnrampStillRoutable:true,numberOfFirstVisitPanels:0});
  await context.close();
 }
 assert.deepEqual(report.blockedRequests,[],"No external network calls or writes");
 assert.deepEqual(report.errors,[],"No uncaught JS exceptions");
 report.status="PASS";
}catch(error){report.status="FAIL";report.failure=String(error?.stack||error);throw error}
finally{
 writeFileSync(join(output,"acceptance.json"),JSON.stringify(report,null,2)+"\n");
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
