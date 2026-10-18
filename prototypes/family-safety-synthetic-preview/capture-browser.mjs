/**
 * Visual verification of real WebGL scene in headless Chrome, both viewpoints.
 * Fail when only the glass UI loads but no 3D objects are actually rendered.
 *
 * Runs against local synthetic-only fixture, no real GPS permission or member API.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE=process.env.FIELD_PREVIEW_BASE||"http://127.0.0.1:8899";
const CHROME=process.env.CHROME_BIN||"/usr/bin/google-chrome";
const OUT=resolve(process.env.FIELD_EVIDENCE_DIR||"evidence/family-field");
mkdirSync(OUT,{recursive:true});
const report=[];
const browser=await chromium.launch({
  executablePath:CHROME,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader"]
});
try{
  for(const device of [
    {name:"desktop",width:1440,height:920,isMobile:false,hasTouch:false},
    {name:"mobile",width:390,height:844,isMobile:true,hasTouch:true}
  ]){
    const context=await browser.newContext({
      viewport:{width:device.width,height:device.height},
      deviceScaleFactor:1,isMobile:device.isMobile,hasTouch:device.hasTouch,
      permissions:[],colorScheme:"dark"
    });
    const page=await context.newPage();
    const entry={device:device.name,consoleErrors:[],requestsFailed:[],pageErrors:[]};
    page.on("console",msg=>{if(msg.type()==="error"||msg.type()==="warning")
      entry.consoleErrors.push(msg.text().slice(0,300));});
    page.on("pageerror",e=>entry.pageErrors.push(String(e.message).slice(0,300)));
    page.on("requestfailed",r=>entry.requestsFailed.push({
      url:r.url().replace(BASE,"[LOCAL]"),failure:r.failure()?.errorText
    }));
    const response=await page.goto(BASE+"/",{waitUntil:"domcontentloaded",timeout:12000});
    entry.httpStatus=response?.status();
    await page.waitForTimeout(5500);
    entry.before=await page.evaluate(()=>window.__FIELD_SYNTHETIC_QA__?.snapshot?.()||null);
    await page.screenshot({path:resolve(OUT,device.name+".png"),fullPage:false});
    await page.locator("#sim-start").click();
    await page.waitForTimeout(950);
    entry.afterStart=await page.evaluate(()=>window.__FIELD_SYNTHETIC_QA__?.snapshot?.()||null);
    entry.clock=await page.locator("#sim-clock").textContent();
    await page.locator("#sim-revoke-a").click();
    entry.afterRevoke=await page.evaluate(()=>({
      aState:document.getElementById("device-a-state").textContent,
      bState:document.getElementById("device-b-state").textContent,
      sample:window.__FIELD_SYNTHETIC_QA__?.snapshot?.()
    }));
    report.push(entry);
    await context.close();
  }
}finally{await browser.close();}
writeFileSync(resolve(OUT,"browser-assertions.json"),JSON.stringify(report,null,2)+"\n");
for(const r of report){
  if(r.httpStatus!==200)throw Error(r.device+" main document failed");
  if(!r.before?.ready)throw Error(r.device+" MapLibre did not load: "+JSON.stringify(r));
  if(r.before.visualBuildingCount<8)
    throw Error(r.device+" map showed no visible 3D buildings: "+JSON.stringify(r));
  if(r.before.errors?.length)throw Error(r.device+" map style errors: "+JSON.stringify(r.before.errors));
  if(!r.afterStart?.running||r.afterStart.deviceMarkers!==2)
    throw Error(r.device+" simulation failed to produce two fictional markers");
  if(r.afterRevoke.aState!=="Hidden"||r.afterRevoke.bState!=="Recent")
    throw Error(r.device+" synthetic share revocation wasn't reflected in UI");
  if(r.pageErrors.length)throw Error(r.device+" JS failures: "+JSON.stringify(r.pageErrors));
}
process.stdout.write("FAMILY_SYNTHETIC_REAL_3D_BROWSER_QA=PASS\n");
