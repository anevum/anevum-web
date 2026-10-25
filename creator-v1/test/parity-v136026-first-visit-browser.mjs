/**
 * PARITY V136.026 — browser acceptance for optional, accurate first contact.
 * GET-only loopback fixtures. No real accounts, uploads or user data.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {existsSync,readFileSync,writeFileSync,mkdirSync,statSync} from "node:fs";
import {resolve,join,extname,sep} from "node:path";

const {chromium}=createRequire(import.meta.url)("playwright");
const root=resolve("creator-v1/dist/web");
const output=resolve(process.env.PARITY_QA_OUTPUT||"evidence/parity-v136/first-visit-026");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",
 ".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",
 ".woff2":"font/woff2",".glb":"model/gltf-binary",".json":"application/json"};
const report={contract:"v136.026-first-contact-loopback",status:"INCOMPLETE",
 syntheticOnly:true,productionReleased:false,head:process.env.ANEVUM_SOURCE_SHA||null,
 widths:[],blockedRequests:[]};
assert.ok(existsSync(join(root,"index.html")),"V136 compiled frontend is required");
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
  ...(extname(file)===".html"?{
   "content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-src 'self'"}:{})});
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
  // The original native world must retain a functional vector fallback.
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    return kind==="webgl2"?null:original.call(this,kind,...args);
   };
  });
  const errors=[];
  await context.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==base||!["GET","HEAD"].includes(req.method())){
    report.blockedRequests.push({width,method:req.method(),url:req.url()});
    await route.abort();return;
   }
   if(url.pathname.startsWith("/api/")){
    let response={error:"Synthetic endpoint unavailable"},code=404;
    if(url.pathname==="/api/v1/member/auth/get-session"){response=null;code=200;}
    if(url.pathname==="/api/v1/status"){response={
      version:"v136026-loopback",features:{communityPosts:false},
      counts:{publishedProjects:0,publishedCreators:0}};code=200;}
    if(url.pathname==="/api/v1/projects"){response={items:[],nextCursor:null};code=200;}
    if(url.pathname==="/api/v1/creators"){response={items:[],nextCursor:null};code=200;}
    if(url.pathname==="/api/v1/categories"){response={categories:[]};code=200;}
    await route.fulfill({status:code,contentType:"application/json",body:JSON.stringify(response)});
    return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator(".p136-hero").waitFor();
  const guide=page.locator('[data-first-visit-guide="v136"]');
  await guide.waitFor();
  assert.equal(await guide.count(),1,"Only one first-visit panel");
  assert.equal(await page.locator(".p136-console-wayfinder").count(),1,"Original Wayfinder preserved");
  assert.equal(await page.locator(".ir80-dock").count(),1,"Canonical IREN remains single");
  assert.equal(await guide.getByRole("heading",{name:"What can you actually do here?"}).count(),1);
  assert.equal(await guide.getByRole("link",{name:"Check what works now"}).getAttribute("href"),"/status");
  assert.equal(await guide.locator("details[open]").count(),0,"No unsolicited FAQ expansion");
  assert.equal(await guide.locator("summary").count(),3,"Exactly three accessible questions");
  const disclosure=guide.locator("summary").nth(1);
  await disclosure.click();
  assert.equal(await guide.locator("details[open]").count(),1);
  assert.equal(await guide.getByRole("link",{name:"See current Studio availability"}).getAttribute("href"),"/status");
  const measure=await page.evaluate(()=>{
   const doc=document.documentElement,guide=document.querySelector(".p136-first-visit");
   const r=guide.getBoundingClientRect();
   return {viewport:innerWidth,documentWidth:doc.scrollWidth,
    guideWidth:r.width,guideLeft:r.left,guideRight:r.right,
    detailOpen:guide.querySelectorAll("details[open]").length};
  });
  assert.ok(measure.documentWidth<=width+2,"No first-visit overflow at "+width+": "+JSON.stringify(measure));
  assert.ok(measure.guideLeft>=-1&&measure.guideRight<=width+1,
   "Visible first-visit content remains in viewport: "+JSON.stringify(measure));
  await page.screenshot({path:join(output,"guide-open-"+width+".png"),fullPage:true,animations:"disabled"});
  await disclosure.click();
  assert.equal(await guide.locator("details[open]").count(),0);
  await guide.getByRole("link",{name:"Check what works now"}).click();
  await page.waitForURL(base+"/status");
  await page.locator(".v091-status-page").waitFor();
  assert.match(await page.locator(".v091-status-intro").innerText(),/actually live/i);
  const focus=page.locator(".v136-public-focus");
  assert.equal(await focus.locator("ol li").count(),3,"Public focus has Now / Next / Exploring");
  assert.equal(await focus.getByRole("button",{name:/vote/i}).count(),0,"No fake voting control");
  assert.match(await focus.innerText(),/not release dates or promises/i);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),
   "Status development focus stays responsive");
  await page.goto(base+"/start",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"WHAT BRINGS YOU HERE?"}).waitFor();
  await page.getByRole("button",{name:/I MAKE THINGS/}).click();
  assert.equal(await page.getByRole("link",{name:/EXPLORE CREATOR STUDIO/}).getAttribute("href"),"/studio");
  assert.equal(await page.getByText("The public discussion board and open member registration are not live yet.",{exact:true}).count(),0);
  assert.match(await page.locator(".start-journey-detail").innerText(),/upload or publication access/i);
  await page.screenshot({path:join(output,"start-here-"+width+".png"),fullPage:true,animations:"disabled"});
  assert.deepEqual(errors,[],"No browser exceptions for "+width+"px");
  report.widths.push({width,disclosure:"PASS",statusLink:"PASS",startHere:"PASS",
   signupModified:false,measure,screenshots:2});
  console.log("PASS v136.026 first visit "+width+"px "+JSON.stringify(measure));
  await context.close();
 }
 assert.deepEqual(report.blockedRequests,[],"No external data or non-read-only browser traffic");
 report.status="PASS";
}catch(error){
 report.status="FAIL";report.failure=String(error?.stack||error);
 throw error;
}finally{
 writeFileSync(join(output,"acceptance.json"),JSON.stringify(report,null,2)+"\n");
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
