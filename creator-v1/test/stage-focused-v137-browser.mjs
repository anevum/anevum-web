/**
 * Stage-focused V137 browser acceptance. Local-only synthetic API.
 * No real account, email, publishing, payments or production operations.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from "node:fs";
import {join,resolve,extname,sep} from "node:path";

const {chromium}=createRequire(import.meta.url)("playwright");
const root=resolve("creator-v1/dist/web");
const out=resolve("evidence/stage-focused-v137");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".mp4":"video/mp4",".json":"application/json"};
const results={source:process.env.ANEVUM_SOURCE_SHA||null,contract:"anevum-v137-stage-focus-loopback",productionReleased:false,status:"INCOMPLETE",checks:[],blocked:[],errors:[]};
assert.ok(existsSync(join(root,"index.html")),"Compiled React frontend required");
mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
 if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);res.end();return}
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname)}catch{res.writeHead(400);res.end();return}
 let file=resolve(root,"."+pathname);
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);res.end();return}
  file=join(root,"index.html");
 }
 res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream","cache-control":"no-store",
  ...(extname(file)===".html"?{"content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; form-action 'self'; object-src 'none'; frame-src 'self'"}:{})});
 res.end(req.method==="HEAD"?undefined:readFileSync(file));
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox","--enable-webgl","--enable-unsafe-swiftshader","--use-angle=swiftshader"]});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width>600?950:844},deviceScaleFactor:1,reducedMotion:"reduce"});
  await context.addInitScript(()=>{
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){
    return type==="webgl2"?null:original.call(this,type,...args);
   };
  });
  await context.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==origin||!["GET","HEAD"].includes(req.method())){
    results.blocked.push({width,url:req.url(),method:req.method()});await route.abort();return;
   }
   if(url.pathname.startsWith("/api/")){
    let value={error:"Unimplemented in anonymous fixture"},code=404;
    if(url.pathname==="/api/v1/member/auth/get-session"){value=null;code=200}
    if(url.pathname==="/api/v1/status"){value={version:"v137-stage-loopback",features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}};code=200}
    if(url.pathname==="/api/v1/projects"||url.pathname==="/api/v1/creators"){
      value={items:[],count:0,nextCursor:null};code=200;
    }
    if(url.pathname==="/api/v1/categories"){value={categories:[]};code=200}
    await route.fulfill({status:code,contentType:"application/json",body:JSON.stringify(value)});return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",e=>results.errors.push({width,error:String(e)}));
  await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
  await page.locator('[data-stage-focus="severance-development"]').waitFor();
  assert.equal(await page.locator('[data-visual-pass="v138-hushwire"]').count(),1,"New cinematic build is mounted");
  assert.equal(await page.locator(".av138-world-scene").count(),1,"Original SVG remains in the fallback");
  assert.equal(await page.locator('.av139-cinematic[data-art-type="illustrative-cinematic-not-gameplay"]').count(),1,"Video overlay labels itself concept art");
  assert.equal(await page.locator("video.av139-film").count(),1,"One muted cinematic video is part of the homepage");
  assert.equal(await page.locator("video.av139-film").getAttribute("src"),null,"Reduced-motion user never requests moving video");
  assert.equal(await page.locator(".av139-film").getAttribute("poster"),"/assets/severance/hero-poster-v139.webp");
  assert.equal(await page.locator(".av138-plate").count(),4,"Four different world-system plates");
  assert.equal(await page.locator('[data-av139-scroll-sequence="cinematic"]').count(),1,
   "One scroll-scrub film chapter between hero and original four systems");
  assert.equal(await page.locator(".av139-sequence").getAttribute("data-frame-status"),"poster",
   "Reduced-motion users never download 96 scroll animation frames");
  assert.equal(await page.getByRole("link",{name:"EXPLORE THE GAME"}).getAttribute("href"),"/severance","No false Play Now control");
  assert.equal(await page.locator("main#main").count(),1,"Exactly one main landmark");
  assert.equal(await page.locator(".p136-console-wayfinder a[data-station]").count(),4,"Four-stage Wayfinder");
  assert.match(await page.locator("main#main").innerText(),/No public multiplayer game or open beta is available yet/i);
  assert.equal(await page.getByRole("link",{name:/Play now|Start match|Join server/i}).count(),0,"No false playable CTA");
  if(width===1440){
    const archived=await page.request.get(origin+"/portfolio/assets/rhen-interface.webp");
    assert.equal(archived.status(),404,"Retired personal-portfolio media is absent from public build");
  }
  const homeOverflow=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,offenders:Array.from(document.querySelectorAll("body *")).map(node=>{const rect=node.getBoundingClientRect();return {tag:node.tagName,cls:typeof node.className==="string"?node.className.slice(0,85):"",text:node.textContent?.trim().slice(0,40),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width)};}).filter(item=>item.right>innerWidth+2||item.left<-2).sort((a,b)=>b.right-a.right).slice(0,20)}));
  assert.ok(homeOverflow.documentWidth<=width+2,"Home fits "+width+"px "+JSON.stringify(homeOverflow));
  await page.screenshot({path:join(out,"home-"+width+".png"),animations:"disabled",fullPage:true});
  await page.getByRole("link",{name:"EXPLORE THE GAME"}).click();
  await page.waitForURL(origin+"/severance");
  await page.locator('[data-product-stage="design-prototype"]').waitFor();
  assert.equal(await page.locator(".av138-sev-mechanic").count(),4,"Four documented gameplay systems");
  assert.equal(await page.locator('.av138-sev-hero .av139-cinematic').count(),1,"Game dossier shares cinematic environment");
  assert.equal(await page.locator(".av138-sev-hero video.av139-film").getAttribute("src"),null,"Reduced-motion also respected on game dossier");
  assert.equal(await page.locator(".av138-sev-roadmap-grid li").count(),3,"Three true development gates");
  assert.equal(await page.locator('[data-public-playable="false"]').count(),1);
  assert.match(await page.locator("main#main").innerText(),/No public server, playable beta or release date is announced/i);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Severance fits "+width+"px");
  await page.screenshot({path:join(out,"severance-"+width+".png"),animations:"disabled",fullPage:true});
  await page.goto(origin+"/about",{waitUntil:"domcontentloaded"});
  await page.locator('[data-studio-stage="active-development"]').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"About fits "+width+"px");
  await page.screenshot({path:join(out,"about-"+width+".png"),animations:"disabled",fullPage:true});
  await page.goto(origin+"/status",{waitUntil:"domcontentloaded"});
  await page.locator(".v091-status-page").waitFor();
  assert.match(await page.locator(".v136-public-focus").innerText(),/Prove Severance multiplayer/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Status fits "+width+"px");
  results.checks.push({width,home:true,game:true,about:true,status:true,screenshots:3,overflow:false});
  await context.close();
 }
 // Independently verify first-party MP4 and poster can be fetched without
 // a CDN or provider runtime connection. Do not demand proprietary-codec
 // playback on a CI Chromium build that may lack local H.264 licensing.
 {
   const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"no-preference"});
   await context.route("**/*",async route=>{
     const req=route.request(),url=new URL(req.url());
     if(url.origin!==origin||!["GET","HEAD"].includes(req.method())){
       results.blocked.push({width:"motion",url:req.url(),method:req.method()});
       await route.abort();return;
     }
     if(url.pathname.startsWith("/api/")){
       const value=url.pathname==="/api/v1/member/auth/get-session"?null:
         url.pathname==="/api/v1/status"?{version:"v139-motion-loopback",features:{communityPosts:false},counts:{publishedProjects:0,publishedCreators:0}}:
         {items:[],count:0,nextCursor:null};
       await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(value)});
       return;
     }
     await route.continue();
   });
   const page=await context.newPage();
   page.on("pageerror",e=>results.errors.push({width:"motion",error:String(e)}));
   await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
   await page.locator(".av139-cinematic").waitFor();
   await page.waitForFunction(()=>{
     const node=document.querySelector("video.av139-film");
     return node?.getAttribute("src")?.includes("hero-motion-v139-1080p.mp4");
   },null,{timeout:12000});
   const video=await page.request.get(origin+"/assets/severance/hero-motion-v139-1080p.mp4");
   assert.equal(video.status(),200,"Reviewed H264 video is self-hosted");
   assert.match(video.headers()["content-type"]||"",/video\/mp4/);
   const videoBytes=(await video.body()).byteLength;
   assert.ok(videoBytes>200000,"HD cinematic exists");
   const scrollFrame=await page.request.get(origin+"/assets/severance/frames-desktop/frame-0001.webp");
   assert.equal(scrollFrame.status(),200,"Reviewed local scroll frame is available");
   assert.match(scrollFrame.headers()["content-type"]||"",/image\/webp/);
   await page.evaluate(()=>{
     const sequence=document.querySelector('.av139-sequence');
     if(!sequence)throw new Error("Cinematic scroll sequence missing");
     window.scrollTo({top:sequence.getBoundingClientRect().top+window.scrollY+100,behavior:"instant"});
   });
   await page.waitForFunction(()=>
      document.querySelector('.av139-sequence')?.getAttribute('data-frame-status')==='loaded',
      null,{timeout:12000});
   const frame=await page.locator('.av139-sequence-canvas').evaluate(node=>({
      width:node.width,height:node.height,
      context:!!node.getContext('2d'),
      frameStatus:node.closest('[data-frame-status]')?.getAttribute('data-frame-status')
   }));
   assert.ok(frame.width>500&&frame.height>300&&frame.context,"Scroll sequence frames must draw to a real 2D canvas");
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Motion scene has no horizontal overflow");
   await page.screenshot({path:join(out,"scroll-sequence-motion-1440.png"),animations:"disabled"});
   const poster=await page.request.get(origin+"/assets/severance/hero-poster-v139.webp");
   assert.equal(poster.status(),200,"Poster is self-hosted");
   assert.match(poster.headers()["content-type"]||"",/image\/webp/);
   results.checks.push({width:"motion",sameOriginMedia:true,
     mp4Bytes:videoBytes,
     posterBytes:(await poster.body()).byteLength,
     sampleFrameBytes:(await scrollFrame.body()).byteLength});
   await context.close();
 }
 assert.deepEqual(results.blocked,[],"No external requests or writes");
 assert.deepEqual(results.errors,[],"No uncaught page errors");
 results.status="PASS";
}catch(error){results.status="FAIL";results.failure=String(error?.stack||error);throw error}
finally{
 writeFileSync(join(out,"acceptance.json"),JSON.stringify(results,null,2)+"\n");
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
