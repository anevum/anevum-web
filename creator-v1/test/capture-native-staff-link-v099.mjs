// V099 first-party Founder Console Chrome acceptance, isolated loopback only.
// Synthetic session and role endpoints; no production requests, credentials or writes.
import test from "node:assert/strict";
import {createServer} from "node:http";
import {promisify} from "node:util";
import {execFile} from "node:child_process";
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,statSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {build} from "esbuild";
const [chrome,destination]=process.argv.slice(2);
if(!chrome||!destination)throw Error("V099_CHROME_AND_OUTPUT_REQUIRED");
const entry=[
'import React from "react";',
'import {createRoot} from "react-dom/client";',
'import {BrowserRouter} from "react-router-dom";',
'import {VerifiedStaffShortcut} from "./creator-v1/web/src/components/VerifiedStaffShortcut.tsx";',
'function Page(){return <BrowserRouter><main>',
'<h1>ANEVUM V099 isolated staff navigation</h1>',
'<div className="ms-toolbar-links" data-qa-slot="toolbar"><VerifiedStaffShortcut location="profile"/></div>',
'<div className="av12-account-banner-links" data-qa-slot="atlas"><VerifiedStaffShortcut location="profile"/></div>',
'<section className="av79-navigation-identity" data-qa-slot="menu"><VerifiedStaffShortcut location="wayfinder"/></section>',
'</main></BrowserRouter>}',
'createRoot(document.getElementById("root")).render(<Page/>);'
].join("\n");
const stub=[
'export const canonicalAuthClient={useSession(){',
'const t=new URLSearchParams(window.location.search).get("scenario");',
'return {data:t==="guest"?null:{user:{id:"synthetic-qa-member",emailVerified:t!=="unverified"}}};',
'}};'
].join("\n");
const out=await build({
 stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:"v099-qa-entry.tsx",loader:"tsx"},
 bundle:true,platform:"browser",target:["chrome120"],format:"iife",write:false,logLevel:"silent",
 outfile:"v099-qa.js",jsx:"automatic",
 define:{"process.env.NODE_ENV":'"production"'},
 plugins:[{name:"replace-auth",setup(x){
   x.onResolve({filter:/^\.\.\/lib\/canonical-beta$/},()=>({path:"qa-canonical-beta",namespace:"qa"}));
   x.onLoad({filter:/.*/,namespace:"qa"},()=>({contents:stub,loader:"js"}));
 }}]
});
const js=out.outputFiles.find(x=>x.path.endsWith(".js"))?.text;
if(!js||js.length<3000)throw Error("V099_BUNDLE_MISSING");
const css=readFileSync("creator-v1/web/src/staff-verified-shortcut-v099.css","utf8");
const page='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<link href="/qa.css" rel="stylesheet"></head><body><div id="root"></div><script src="/qa.js" defer></script><script>'+
 // Click the actual mounted anchor inside BrowserRouter. An href-only assertion
 // cannot detect client interception of a separately routed Worker document.
 'const slot=new URLSearchParams(location.search).get("click");if(slot){'+
 'const attempt=()=>{const a=document.querySelector("[data-qa-slot="+slot+"] a");'+
 'if(a)a.click();else setTimeout(attempt,50)};setTimeout(attempt,50)}'+
 '</script></body></html>';
const style='body{background:#07111f;color:#edf3f5;font:14px system-ui;margin:0}main{padding:24px;margin:auto;max-width:780px}'+
 'main>div,main>section{margin:18px 0;padding:14px;border:1px solid #576c81;border-radius:12px}\n'+css;
let mode="guest",hits=[];
const server=createServer((req,res)=>{
 const u=new URL(req.url||"/","http://127.0.0.1");
 const send=(status,body,type="application/json")=>{
   res.writeHead(status,{"content-type":type,"cache-control":"no-store","x-synthetic-test":"v099"});
   res.end(body);
 };
 if(u.pathname==="/qa")return send(200,page,"text/html");
 if(u.pathname==="/qa.js")return send(200,js,"application/javascript");
 if(u.pathname==="/qa.css")return send(200,style,"text/css");
 if((u.pathname==="/staff"&&!u.search)||u.pathname==="/staff/observatory"){
   hits.push(mode+":document:"+u.pathname);
   return send(200,'<!doctype html><title>Isolated staff Worker</title><h1>STAFF_WORKER_DOCUMENT_LOADED</h1>',"text/html");
 }
 if(u.pathname==="/__anevum_profile_staff_role_v001"){
   hits.push(mode+":primary");
   if(mode==="founder")return send(200,JSON.stringify({role:"owner",designation:"founder"}));
   if(mode==="reviewer")return send(200,JSON.stringify({role:"reviewer",designation:null}));
   if(mode==="ordinary")return send(200,JSON.stringify({role:null,designation:null}));
   return send(503,JSON.stringify({error:"synthetic unavailable"}));
 }
 if(u.pathname==="/staff"&&u.searchParams.get("diagnose")==="1"){
   hits.push(mode+":fallback");
   return mode==="fallback"?
      send(200,JSON.stringify({access:"verified",reason:"session_and_grant_valid",role:"owner"})):
      send(503,JSON.stringify({error:"synthetic unavailable"}));
 }
 return send(404,"Not found","text/plain");
});
await new Promise((ok,fail)=>{server.once("error",fail);server.listen(0,"127.0.0.1",ok);});
const base="http://127.0.0.1:"+server.address().port;
const tmp=mkdtempSync(join(tmpdir(),"anevum-v099-chrome-"));
mkdirSync(destination,{recursive:true});
const launch=promisify(execFile);
const checks=[
 ["founder",390,3,"FOUNDER CONSOLE","/staff/observatory"],
 ["founder",1440,3,"FOUNDER CONSOLE","/staff/observatory"],
 ["reviewer",390,3,"MODERATOR PORTAL","/staff"],
 ["ordinary",390,0],
 ["guest",390,0],
 ["unverified",390,0],
 ["fallback",390,3,"OWNER CONSOLE","/staff/observatory"],
 ["bothdown",390,0]
];
const evidence=[];
try{
 for(const [scenario,width,count,label,href] of checks){
  mode=scenario;
  const id=scenario+"-"+width;
  const before=hits.length;
  const baseArgs=["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
   "--disable-background-networking","--no-first-run","--disable-extensions",
   "--virtual-time-budget=5200","--window-size="+width+",844",
   "--user-data-dir="+join(tmp,id)];
  const dom=(await launch(chrome,[...baseArgs,"--dump-dom",base+"/qa?scenario="+scenario],
   {timeout:25000,maxBuffer:5_000_000})).stdout;
  if(!dom.includes("ANEVUM V099 isolated staff navigation"))
    throw Error("V099_REACT_DID_NOT_MOUNT_"+id+":"+dom.slice(-800));
  const links=[...dom.matchAll(/<a\b[^>]*data-native-staff-shortcut="(?:owner|reviewer)"[^>]*>/g)].map(x=>x[0]);
  const roleLabels=dom.match(new RegExp("<strong>"+label+"</strong>","g"))||[];
  if(links.length!==count||count&&(roleLabels.length!==count||links.some(x=>!x.includes('href="'+href+'"'))))
    throw Error("V099_ROLE_LINK_WRONG_"+id+" expected="+count+" actual="+links.length+" text="+roleLabels.length);
  if(["guest","unverified"].includes(scenario)&&hits.length!==before)
    throw Error("V099_GUEST_REQUESTED_STAFF_ROLE_"+id);
  if(scenario==="ordinary"&&hits.slice(before).includes(scenario+":fallback"))
    throw Error("V099_ORDINARY_SESSION_GOT_FALLBACK");
  if(scenario==="fallback"&&(!hits.slice(before).includes("fallback:primary")||
    !hits.slice(before).includes("fallback:fallback")))
    throw Error("V099_FALLBACK_NOT_EXERCISED");
  evidence.push({scenario,width,visibleStaffLinks:links.length,expectedLabel:label||null,
   requestCount:hits.length-before,passed:true});
  if((scenario==="founder"&&width===390)||scenario==="reviewer"){
    const image=join(destination,id+".png");
    await launch(chrome,[...baseArgs.filter(x=>!x.startsWith("--user-data-dir=")),
      "--user-data-dir="+join(tmp,id+"-image"),
      "--screenshot="+image,base+"/qa?scenario="+scenario],{timeout:25000,maxBuffer:2_000_000});
    test.ok(statSync(image).size>2500,"V099_SCREENSHOT_MISSING_"+id);
  }
  console.log("V099_NATIVE_CHROME_"+id.toUpperCase().replaceAll("-","_")+"=PASS");
 }
 const navigation=[];
 for(const scenario of ["founder","reviewer"]){
  mode=scenario;
  for(const slot of ["toolbar","atlas","menu"]){
   const path=scenario==="founder"?"/staff/observatory":"/staff";
   const before=hits.length;
   const dom=(await launch(chrome,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
     "--disable-background-networking","--no-first-run","--disable-extensions","--virtual-time-budget=5200",
     "--user-data-dir="+join(tmp,scenario+"-click-"+slot),"--dump-dom",
     base+"/qa?scenario="+scenario+"&click="+slot],{timeout:25000,maxBuffer:5_000_000})).stdout;
   test.ok(dom.includes("STAFF_WORKER_DOCUMENT_LOADED"),"V099_CLICK_DID_NOT_LOAD_STAFF_WORKER_"+scenario+"_"+slot);
   test.ok(hits.slice(before).includes(scenario+":document:"+path),"V099_NO_SERVER_DOCUMENT_REQUEST_"+scenario+"_"+slot);
   navigation.push({scenario,slot,path,documentLoaded:true,passed:true});
  }
 }
 writeFileSync(join(destination,"native-link-acceptance.json"),JSON.stringify({
   source:"isolated loopback React + real Chrome, synthetic role/grant fixtures",
   pass:true,productionRequests:0,productionWrites:0,evidence,navigation
 },null,2));
 console.log("V099_VERIFIED_STAFF_LINK_REAL_BROWSER=PASS");
}finally{
 await new Promise(ok=>server.close(ok));
 try{rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
 catch(e){if(!["ENOTEMPTY","EBUSY"].includes(e.code))throw e;}
}
