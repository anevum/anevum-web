/**
 * IREN V137 / direct regression for external first-member steps 4 and 7.
 * Tests REAL compiled React, a loopback-only synthetic signed-in member and
 * both V136 responsive headers. The legacy automatic-welcome V097 suite is
 * intentionally not used as the prerequisite for these member checks.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createRequire} from "node:module";
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
const {chromium}=createRequire(import.meta.url)("playwright");
const base="http://127.0.0.1:4178";
const output=resolve("evidence/iren-v137/first-member-targets");
const report={contract:"iren-v137-member-spotlight",source:process.env.ANEVUM_SOURCE_SHA||null,
 status:"INCOMPLETE",syntheticOnly:true,realAccountTested:false,physicalDeviceTested:false,
 productionReleased:false,widths:[],unexpectedRequests:[]};
mkdirSync(output,{recursive:true});
let service, browser,log="";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,ms=24000){
 const end=Date.now()+ms;let last;
 while(Date.now()<end){
  try{const v=await fn();if(v)return v;}catch(e){last=e;}
  await sleep(140);
 }
 throw Error("V137_TIMED_OUT: "+String(last||"condition not satisfied"));
}
try{
 service=spawn(process.execPath,["creator-v1/test/portal-offline-preview.mjs"],{
  env:{...process.env,ANEVUM_V096_ALPHA_CSP_QA:"1"},
  stdio:["ignore","pipe","pipe"]});
 service.stdout?.on("data",data=>{log=(log+String(data)).slice(-2000);});
 service.stderr?.on("data",data=>{log=(log+String(data)).slice(-2000);});
 await until(async()=>{
  if(service.exitCode!==null)throw Error("OFFLINE_FIXTURE_EXITED "+log);
  const r=await fetch(base+"/__ready");return r.ok;
 },20000);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",
  args:["--no-sandbox","--enable-webgl","--enable-unsafe-swiftshader","--use-angle=swiftshader"]});
 for(const width of [390,1440]){
  const context=await browser.newContext({
   viewport:{width,height:width===390?844:900},deviceScaleFactor:1,
   reducedMotion:"reduce"});
  const errors=[];
  await context.route("**/*",async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base||!["GET","HEAD"].includes(request.method())){
    report.unexpectedRequests.push({width,method:request.method(),origin:url.origin,pathname:url.pathname});
    await route.abort();return;
   }
   await route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(base+"/creator/account",{waitUntil:"domcontentloaded"});
  await page.locator(".ms-dashboard").waitFor({timeout:24000});
  await page.locator(".ir80-dock").waitFor({timeout:24000});
  await page.locator(".ms-toolbar-more summary").waitFor({timeout:18000});
  assert.equal(await page.locator(".p136-header").count(),1,
   "QA must exercise V136 header rather than legacy-only navigation");
  assert.equal(await page.locator(".ms-toolbar-more[open]").count(),0,
   "Profile & tools starts collapsed: hidden Studio link is not targetable");
  assert.equal(await page.locator(".ms-toolbar-more-content").evaluate(el=>getComputedStyle(el).display),"none",
   "Closed Profile & tools must remove descendant controls from layout");
  await page.evaluate(()=>window.dispatchEvent(new Event("anevum:iren-tour")));
  for(let step=1;step<=7;step++){
   const bubble=page.locator('.ir97-speech-bubble[aria-label="IREN guide, step '+step+' of 7"]');
   await bubble.waitFor({timeout:24000});
   if(step===4||step===7){
    try{
     await page.waitForFunction(()=>{
      return !!document.querySelector(".ir97-target-halo")&&
        document.querySelector(".ir97-target-halo").getBoundingClientRect().width>0;
     },null,{timeout:9000});
    }catch(error){
     const diagnostic=await page.evaluate(({step})=>{
      const rectOf=e=>{const r=e?.getBoundingClientRect();return r?{
       left:r.left,top:r.top,width:r.width,height:r.height}:null;};
      const selectors=step===4?["studio","studio-tools"]:["navigation","navigation-desktop"];
      const targets=selectors.map(s=>{
       const el=document.querySelector('[data-iren-anchor="'+s+'"]');
       return {anchor:s,present:Boolean(el),rect:rectOf(el),
        rects:el?.getClientRects().length||0,
        display:el?getComputedStyle(el).display:null,
        visibility:el?getComputedStyle(el).visibility:null,
        detailsOpen:el?.closest("details")?.open??null};
      });
      return {step,path:location.pathname,search:location.search,
       bodySize:document.body.scrollHeight,viewport:[innerWidth,innerHeight],
       targets,halos:document.querySelectorAll(".ir97-target-halo").length,
       bubble:document.querySelector(".ir97-speech-bubble")?.getAttribute("aria-label"),
       guideText:document.querySelector(".ir97-bubble-line")?.textContent,
       onMain:!!document.getElementById("main"),
       toolbar:!!document.querySelector(".ms-toolbar-next"),
       collection:!!document.querySelector(".mc-hub-nav")};
     },{step});
     await page.screenshot({path:join(output,"failed-"+width+"-step-"+step+".png"),animations:"disabled"}).catch(()=>{});
     report.diagnostics=report.diagnostics||[];
     report.diagnostics.push(diagnostic);
     throw Error("IREN_V137_MISSING_SPOTLIGHT "+JSON.stringify(diagnostic)+" / "+String(error));
    }
    await sleep(700);
    const result=await page.evaluate(({step,width})=>{
     const visible=e=>!!e&&e.isConnected&&e.getClientRects().length>0&&
       getComputedStyle(e).display!=="none"&&
       getComputedStyle(e).visibility!=="hidden"&&
       e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
     const a=step===4?"studio":"navigation",
       b=step===4?"studio-tools":"navigation-desktop";
     const candidates=[document.querySelector('[data-iren-anchor="'+a+'"]'),
       document.querySelector('[data-iren-anchor="'+b+'"]')];
     const selected=candidates.find(visible);
     const halo=document.querySelector(".ir97-target-halo");
     const r=selected?.getBoundingClientRect(),h=halo?.getBoundingClientRect();
     const center=(v,start,length)=>Math.max(8,Math.min(v-8,start+length*.5));
     const aligned=!!r&&!!h&&h.width>0&&h.height>0&&
       Math.abs(center(innerWidth,r.left,r.width)-(h.left+h.width*.5))<Math.max(17,r.width*.1)&&
       Math.abs(center(innerHeight,r.top,r.height)-(h.top+h.height*.5))<Math.max(17,r.height*.1);
     return {step,width,anchor:selected?.getAttribute("data-iren-anchor")||null,
       selectedVisible:Boolean(selected),hiddenPrimary:!visible(candidates[0]),
       target:[r?.left,r?.top,r?.width,r?.height],
       halo:[h?.left,h?.top,h?.width,h?.height],
       aligned,guide:document.querySelector(".ir97-bubble-line")?.textContent||""};
    },{step,width});
    assert.ok(result.selectedVisible&&result.aligned,"Spotlight must highlight ACTUAL responsive control: "+JSON.stringify(result));
    if(step===4){
      assert.equal(result.anchor,"studio-tools","Hidden Studio link falls back to visible Profile & tools");
      assert.equal(result.hiddenPrimary,true,"Closed details cannot be highlighted");
    }else {
      // The V136 wide header can display BOTH the regular nav and its Menu.
      // If Menu is painted, it remains the actual Wayfinder control even at
      // 1440px. Fall back to desktop navigation only when Menu is CSS-hidden.
      assert.equal(result.anchor,result.hiddenPrimary?"navigation-desktop":"navigation",
       "Wayfinder must select the first genuinely painted V136 navigation control");
    }
    await page.screenshot({path:join(output,"member-"+width+"-step-"+step+".png"),animations:"disabled"});
    report.widths.push({width,...result});
   }
   await bubble.locator("[data-iren-next]").click();
  }
  await page.waitForFunction(()=>!document.querySelector(".ir97-speech-bubble"),null,{timeout:10000});
  assert.deepEqual(errors,[],"Compiled React must not throw");
  await context.close();
 }
 assert.deepEqual(report.unexpectedRequests,[],"Only loopback GET/HEAD requests are permitted");
 assert.equal(report.widths.length,4,"Both broken steps must be tested on desktop and mobile");
 report.status="PASS";
 console.log("IREN_V137_MEMBER_SPOTLIGHT_PASS "+JSON.stringify(report.widths));
}catch(error){
 report.status="FAIL";report.error=String(error?.stack||error);report.fixtureLog=log.slice(-900);
 throw error;
}finally{
 writeFileSync(join(output,"acceptance.json"),JSON.stringify(report,null,2)+"\n");
 if(browser)await browser.close();
 if(service&&service.exitCode===null)service.kill("SIGTERM");
}
