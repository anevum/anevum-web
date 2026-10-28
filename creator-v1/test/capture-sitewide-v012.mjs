// Creator V1 V012: browser-rendered visual acceptance using local synthetic fixtures.
// No real creator records, D1, authentication or production access.
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {canonicalAvailabilityProbe,canonicalParticipationProbe} from "./player-browser-probes.mjs";
import {captureCreatorIdentityV091} from "./creator-identity-browser-v091.mjs";
import {capturePackageDiscoveryV011} from "./package-discovery-browser-v011.mjs";
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=18000){
 const stop=Date.now()+timeout;
 let lastError=null;
 while(Date.now()<stop){try{let value=await fn();if(value)return value;}catch(error){lastError=error;}await delay(140);}
 throw Error("SITEWIDE_V012_BROWSER_TIMEOUT"+(lastError?": "+String(lastError).slice(0,350):""));
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),calls=new Map();let seq=0;
  socket.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((res,rej)=>{let id=++seq;calls.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}));});},
   close(){socket.close();}
  }),{once:true});
  socket.addEventListener("message",({data})=>{
   const value=JSON.parse(String(data));if(typeof value.id!=="number")return;
   const call=calls.get(value.id);if(!call)return;calls.delete(value.id);
   value.error?call.rej(Error(value.error.message)):call.res(value.result||{});
  });
  socket.addEventListener("error",()=>reject(Error("SITEWIDE_V012_CDP_CONNECT")),{once:true});
  socket.addEventListener("close",()=>{for(const call of calls.values())call.rej(Error("SITEWIDE_V012_CDP_CLOSED"));calls.clear();});
 });
}
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const chrome=option("--chrome"),base=option("--base"),output=option("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))
 throw Error("SITEWIDE_V012_ONLY_LOCAL_FIXTURES");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-v012-sitewide-"));
const child=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=0",
 "--no-first-run","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;const results=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  if(!existsSync(file))return null;
  const value=readFileSync(file,"utf8").split("\n")[0];return /^\d+$/.test(value)?value:null;
 });
 const ws=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  if(!response.ok)return null;
  return (await response.json()).find(item=>item.type==="page"&&item.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 });
 client=await connect(ws);
 await client.send("Page.enable");await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const result=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||"SITEWIDE_V012_EVALUATE_FAILED");
  return result.result?.value;
 };
 const screenshot=async label=>{
  const reply=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!reply.data)throw Error("SITEWIDE_V012_NO_IMAGE_"+label);
  const bytes=Buffer.from(reply.data,"base64");if(bytes.length<4000)throw Error("SITEWIDE_V012_SHORT_IMAGE_"+label);
  writeFileSync(join(output,label+".png"),bytes);
 };
 if(args.includes('--packages-only')||args.includes('--packages-off')){
  const acceptance=await capturePackageDiscoveryV011({client,base,evaluate,until,screenshot,enabled:!args.includes('--packages-off')});
  writeFileSync(join(output,'package-discovery-v011.json'),JSON.stringify(acceptance,null,2));
 }else{
 const pages=[
  ["home","/",".av79-home"],["discover","/discover",".portal-discover"],
  ["project","/projects/00000000000000000000000000000001",".portal-project"],
  ["creators","/creators",".portal-creators"],["creator-channel","/creators/nova_demo",".portal-creator-channel"],
  ["community","/community",".ch7-hub"],["boards","/boards",".cnb-hub"],
  ["levels","/levels",".av75-levels-page"],["recognition","/recognition",".av75-recognition-page"],["start","/start",".start-page"],
  ["guide","/guide",".field-guide-page"],["status","/status",".v091-status-page"],
  ["guest-library","/library",".member-gate"],
  ["member-account","/account",".ms-dashboard"],
  ["member-profile-editor","/account/edit",".ms-dashboard"],
  // Legacy /create routes now lead into the canonical Better Auth Studio.
  // The fixture is an unauthenticated browser, so no draft or upload appears.
  ["member-studio","/create",".st-status"],["member-draft","/create/new",".st-status"]
 ];
 const context=await fetch(base+"/__context-fixture?enabled=1");
 if(!context.ok)throw Error("SITEWIDE_V012_FIXTURE_UNAVAILABLE");
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await client.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const selected=width===1440||width===390?pages:pages.filter(([id])=>
   ["home","discover","project","community","boards","levels","recognition","guest-library"].includes(id));
  for(const [name,path,selector] of selected){
   if(name==="guest-library")await client.send("Network.clearBrowserCookies");
   // Simulate the real canonical staging capability only for project routes.
   if(name==="project"){
     const healthMode=await fetch(base+"/__player-member-fixture?mode=canonical");
     if(!healthMode.ok)throw Error("PLAYER_V005_FIXTURE_GATE_UNAVAILABLE");
   }
   const target=base+"/creator"+path;
   const result=await client.send("Page.navigate",{url:target});
   if(result.errorText)throw Error("SITEWIDE_V012_NAVIGATION_"+name+"_"+width+":"+result.errorText);
   try{
    await until(()=>evaluate("document.readyState==='complete'&&location.pathname==="+JSON.stringify("/creator"+(path==="/account"||path==="/account/edit"?"/member":
      name==="member-studio"?"/studio":name==="member-draft"?"/studio/new":path))+"&&!!document.querySelector("+JSON.stringify(selector)+")"));
   }catch(error){throw Error("SITEWIDE_V012_PAGE_MISSING_"+name+"_"+width+":"+String(error));}
   // These aliases resolve to the canonical member space. The loopback
   // fixture signs in its labelled synthetic member; a transient session
   // spinner is not an accepted account or profile-editor capture.
   if(name==="member-account"||name==="member-profile-editor"){
    await until(()=>evaluate('document.querySelector(".ms-handle")?.textContent==="@offline_artist"&&!document.querySelector(".ms-body> [role=status]")'));
    if(name==="member-profile-editor"){
     await evaluate('[...document.querySelectorAll(".ms-toolbar button")].find(button=>button.textContent.trim()==="Edit profile").click()');
     await until(()=>evaluate('!!document.querySelector(".ms-profile-editor form")'));
    }
    const memberView=await evaluate('({identity:document.querySelector(".ms-handle")?.textContent,private:document.querySelector(".ms-visibility")?.textContent,editor:!!document.querySelector(".ms-profile-editor form"),earned:document.querySelectorAll(".is-earned").length,loading:!!document.querySelector(".av12-account-await")})');
    if(memberView.identity!=="@offline_artist"||memberView.private!=="PRIVATE WORLD"||memberView.loading||memberView.earned||
       (name==="member-profile-editor"&&!memberView.editor))
     throw Error("SITEWIDE_V012_CANONICAL_MEMBER_"+name+"_"+width+":"+JSON.stringify(memberView));
   }
   await delay(240);
   const state=await evaluate('(()=>({path:location.pathname,header:document.querySelectorAll(".site-header.av9-header").length,main:document.querySelectorAll("#main").length,cinematic:!!document.querySelector(".site-shell--cinematic.av9-shell"),overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,atlas:!!document.querySelector(".atm-header,.atlas-universe-viewport"),fixture:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")}))()');
   const presentation=await evaluate(String.raw`(()=>{
     const root=document.querySelector(".site-shell--cinematic.av9-shell");
     if(!root)return {missingRoot:true};
      const styles=getComputedStyle(root);
     const active=document.querySelector(".av9-menu-trigger");
     const forbidden=[...document.querySelectorAll(".site-header a,.av9-navigation a,.site-main a,.site-footer a")]
       .map(a=>a.getAttribute("href")).filter(Boolean)
       .filter(href=>{
         let url;try{url=new URL(href,location.href);}catch{return false;}
         if(["lab.anevum.com","portfolio.anevum.com"].includes(url.hostname))return true;
         if(url.origin!==location.origin)return false;
         const pathname=url.pathname.replace(/^\/creator(?=\/|$)/,"");
         return /^\/(?:atlas|experience|workspace|portfolio)(?:\/|$)/.test(pathname);
       }).slice(0,8);
     return {
       tokens:["--av9-space","--av9-paper","--av9-display","--av9-glass","--av10-editorial"]
         .every(token=>Boolean(styles.getPropertyValue(token).trim())),
       roundedControl:active?parseFloat(getComputedStyle(active).borderTopLeftRadius)>=8:false,
       forbidden,
       legacyBrand:/\bTHE COMMONS\b/i.test(document.getElementById("main")?.innerText||"")
     };
   })()`);
   if(presentation.missingRoot||!presentation.tokens||!presentation.roundedControl||presentation.forbidden.length||presentation.legacyBrand)
     throw Error("SITEWIDE_V012_VISUAL_OR_ROUTE_DRIFT_"+name+"_"+width+":"+JSON.stringify(presentation));
   if(!state.cinematic||state.header!==1||state.main!==1||state.overflow||state.atlas||!state.fixture)
    throw Error("SITEWIDE_V012_INCONSISTENT_"+name+"_"+width+":"+JSON.stringify(state));
   if(name==="creator-channel"){
     const channelCards=await evaluate('({count:document.querySelectorAll(".portal-channel-content .av73-project-card").length,art:document.querySelectorAll(".portal-channel-content .project-art").length,widths:[...document.querySelectorAll(".portal-channel-content .av73-project-card")].map(x=>x.getBoundingClientRect().width),styles:[...document.querySelectorAll(".portal-channel-content .av73-project-card")].map(x=>({padding:parseFloat(getComputedStyle(x).paddingLeft),display:getComputedStyle(x).display,title:parseFloat(getComputedStyle(x.querySelector("h3")).fontSize)}))})');
     if(channelCards.count!==2||channelCards.art!==0||channelCards.styles.some(s=>s.padding<16||s.display!=="flex"||s.title<20)||(width<650&&channelCards.widths.some(value=>value<240)))
       throw Error("V091_CREATOR_PROJECT_READABILITY_"+width+":"+JSON.stringify(channelCards));
   }
   if(name==="levels"||name==="recognition"){
    // V075 guest acceptance: no catalogue thumbnails, reward identity,
    // unearned badges, models or full-gallery links. Owner rewards are
    // verified separately with an authenticated member API fixture.
    const privateView=await evaluate('(()=>({heading:!!document.querySelector(".av75-page-heading h1"),gate:!!document.querySelector(".av75-vault-empty"),gallery:document.querySelectorAll(".an-series-grid,.an-artifact-card,.av66-catalog-grid").length,images:document.querySelectorAll(".av75-levels-page img,.av75-recognition-page img").length,unearned:document.querySelectorAll(".av75-earned-level,.av75-earned-honor").length,models:document.querySelectorAll("canvas.av62-native-stage,.av75-model-canvas").length,sourceLeak:[...document.querySelectorAll("a")].some(a=>(a.getAttribute("href")||"").startsWith("/evolution")),overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
    if(!privateView.heading||!privateView.gate||privateView.gallery||privateView.images||
      privateView.unearned||privateView.models||privateView.sourceLeak||privateView.overflow)
      throw Error("V075_HIDDEN_REWARD_GUEST_"+name+"_"+width+":"+JSON.stringify(privateView));
    console.log("V075_REWARDS_HIDDEN_"+name+"_"+width+"=PASS");
   }
   await screenshot(name+"-"+width);
   if(name==="discover"){
     // V073: the catalogue must be a usable search/filter surface on phone
     // and desktop, not a tall, decorative hero or duplicate sidebar.
     await until(()=>evaluate('!!document.querySelector(".portal-result-toolbar,.portal-true-empty")'));
     const browse=await evaluate('(()=>{const root=document.querySelector(".av73-discover"),form=root?.querySelector(".portal-wide-search"),field=form?.querySelector("input"),submit=form?.querySelector("button"),fr=field?.getBoundingClientRect(),sr=submit?.getBoundingClientRect();return {headline:root?.querySelector(".av73-discover-intro h1")?.textContent,hero:!!root?.querySelector(".portal-page-heading"),directory:root?.querySelectorAll(".portal-directory").length||0,filters:root?.querySelectorAll(".portal-channel-filters button").length||0,searchWidth:fr?.width||0,submitWidth:sr?.width||0,searchVisible:fr?.left>=-1&&fr?.right<=innerWidth+1,submitVisible:sr?.left>=-1&&sr?.right<=innerWidth+1,subHeight:sr?.height||0,projectCards:root?.querySelectorAll(".av73-project-card").length||0,firstResultTop:root?.querySelector(".av73-project-card")?.getBoundingClientRect().top??null,decorativeCovers:root?.querySelectorAll(".portal-discover-results .project-art,.portal-discover-results img").length||0,overflow:document.documentElement.scrollWidth>innerWidth+1}})()');
     if(!browse.headline?.includes("Find something")||browse.hero||browse.directory||
       browse.filters!==9||browse.projectCards<1||(width<=390&&(browse.firstResultTop===null||browse.firstResultTop>height-25))||browse.searchWidth<170||browse.submitWidth<80||
       !browse.searchVisible||!browse.submitVisible||browse.subHeight<40||
       browse.decorativeCovers||browse.overflow)
       throw Error("V073_DISCOVER_FIRST_FOLD_"+width+":"+JSON.stringify(browse));
     await evaluate('document.querySelector(".portal-channel-filters button:nth-child(2)").click()');
     await until(()=>evaluate('new URLSearchParams(location.search).get("category")==="games"'));
     const selected=await evaluate('(()=>({pressed:document.querySelector(".portal-channel-filters button:nth-child(2)")?.getAttribute("aria-pressed"),overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
     if(selected.pressed!=="true"||selected.overflow)
       throw Error("V073_DISCOVER_FILTER_"+width+":"+JSON.stringify(selected));
     await evaluate('(()=>{const input=document.getElementById("portal-project-query");const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(input,"experiment");input.dispatchEvent(new Event("input",{bubbles:true}));})()');
     await evaluate('document.querySelector(".portal-wide-search button").click()');
     await until(()=>evaluate('new URLSearchParams(location.search).get("q")==="experiment"'));
     const term=await evaluate('(()=>({q:new URLSearchParams(location.search).get("q"),category:new URLSearchParams(location.search).get("category"),overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
     if(term.q!=="experiment"||term.category!=="games"||term.overflow)
       throw Error("V073_DISCOVER_SEARCH_"+width+":"+JSON.stringify(term));
   }

   // V002 compiled browser acceptance: synthetic player cases only.
   if(name==="project"){
     const cases=[
       ["external-game","00000000000000000000000000000001","PLAY ON CREATOR SITE","example.com"],
       ["source-only",String(9001).padStart(32,"0"),"VIEW SOURCE CODE","github.com"],
       ["unsafe-fallback",String(9002).padStart(32,"0"),"VIEW SOURCE CODE","github.com"],
       ["no-link",String(9003).padStart(32,"0"),null,null],
       ["external-app",String(9004).padStart(32,"0"),"TRY ON CREATOR SITE","example.com"],
       ["long-content",String(9005).padStart(32,"0"),"PLAY ON CREATOR SITE","example.com"]
     ];
     for(const [variant,id,expectedAction,expectedHost] of cases){
       if(variant!=="external-game"){
         const navigation=await client.send("Page.navigate",{url:base+"/creator/projects/"+id});
         if(navigation.errorText)throw Error("PLAYER_V002_NAVIGATION_"+variant+"_"+width+":"+navigation.errorText);
       }
       await until(()=>evaluate('location.pathname==='+JSON.stringify("/creator/projects/"+id)+'&&!!document.querySelector(".avp-stage")&&!!document.querySelector(".avp-passport")'));
       await until(()=>evaluate('(()=>{const a=document.querySelector(".avp-stage-art img");return !a||(a.complete&&a.naturalWidth>0);})()'));
       await until(()=>evaluate(canonicalAvailabilityProbe));
       const participation=await evaluate(canonicalParticipationProbe);
       if(participation.status!=="canonical-readonly"||participation.label!=="PARTICIPATE"||
          participation.hasVotes||participation.hasSave||!participation.invitation||!participation.falsePromise||
          !participation.links.some(x=>x.href==="/creator/community")||
          !participation.links.some(x=>x.href==="/creator/join"))
         throw Error("PLAYER_V005_CANONICAL_PARTICIPATION_"+variant+"_"+width+":"+JSON.stringify(participation));
       const requestTrace=await (await fetch(base+"/__player-member-requests")).json();
       if(!requestTrace.syntheticOnly||!Array.isArray(requestTrace.requests)||requestTrace.requests.length)
         throw Error("PLAYER_V006_CANONICAL_LEGACY_REQUEST_"+variant+"_"+width+":"+JSON.stringify(requestTrace));
       const state=await evaluate('(()=>{const st=document.querySelector(".avp-stage"),pas=document.querySelector(".avp-passport"),a=st?.querySelector(".avp-primary-action"),s=st?.getBoundingClientRect(),p=pas?.getBoundingClientRect(),art=st?.querySelector(".avp-stage-art img");return {heading:st?.querySelector("h1")?.textContent,kind:st?.className,primary:a?.textContent?.trim()||null,href:a?.getAttribute("href")||null,hostname:a?new URL(a.href).hostname:null,target:a?.getAttribute("target")||null,rel:a?.getAttribute("rel")||null,secondary:st?.querySelectorAll(".avp-secondary-action").length||0,unavailable:!!st?.querySelector(".avp-no-action"),art:!!art&&(art.complete&&art.naturalWidth>0),rect:s?{left:s.left,right:s.right,top:s.top,bottom:s.bottom,width:s.width}:null,passport:p?{left:p.left,right:p.right,top:p.top,bottom:p.bottom}:null,overflow:document.documentElement.scrollWidth>innerWidth+1,iframe:document.querySelectorAll("iframe").length,synthetic:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")};})()');
       if(state.overflow||state.iframe||!state.synthetic||!state.heading||!state.rect||!state.passport||!state.art||
          (expectedAction?(!state.primary?.includes(expectedAction)||state.hostname!==expectedHost||state.target!=="_blank"||!state.rel?.includes("noopener")||!state.rel?.includes("noreferrer")):(Boolean(state.primary)||!state.unavailable))||
          state.rect.left< -1||state.rect.right>width+1||
          (width>1040?state.passport.left<state.rect.right-3:state.passport.top<state.rect.bottom-3))
         throw Error("PLAYER_V002_VISUAL_OR_OUTBOUND_"+variant+"_"+width+":"+JSON.stringify(state));
       if(variant==="unsafe-fallback"&&state.kind.includes("external-game"))throw Error("PLAYER_V002_UNSAFE_URL_USED_"+width);
       if(variant==="long-content"){
         const compact=await evaluate('(()=>{const s=document.querySelector(".avp-stage"),t=s?.querySelector("h1"),p=s?.querySelector(".avp-stage-summary"),link=s?.querySelector(".avp-stage-readmore"),action=s?.querySelector(".avp-primary-action"),about=document.querySelector("#avp-about");return {longTitle:s?.classList.contains("avp-stage--long-title"),clamped:p?.classList.contains("avp-stage-summary--long"),lines:p?getComputedStyle(p).webkitLineClamp:null,font:t?parseFloat(getComputedStyle(t).fontSize):null,readmore:link?.getAttribute("href"),actionTop:action?.getBoundingClientRect().top,aboutFull:about?.textContent?.includes("A deliberately lengthy project summary")};})()');
         if(!compact.longTitle||!compact.clamped||compact.lines!=="4"||compact.readmore!=="#avp-about"||!compact.aboutFull||
            (width<=390&&compact.font>41))
           throw Error("PLAYER_V003_LONG_CONTENT_LAYOUT_"+width+":"+JSON.stringify(compact));
       }
       await screenshot("player-v002-"+variant+"-"+width);
       if(variant==="external-game"){
         await evaluate('document.getElementById("avp-participation").scrollIntoView({block:"start",behavior:"instant"})');
         await until(()=>evaluate('(()=>{const p=document.querySelector(".avp-participation-preview");const r=p?.getBoundingClientRect();return !!r&&r.top>=-1&&r.top<innerHeight-80;})()'));
         const layout=await evaluate('(()=>{const panel=document.querySelector(".avp-participation-preview"),r=panel.getBoundingClientRect(),actions=[...panel.querySelectorAll(".avp-participation-actions a")].map(a=>{const b=a.getBoundingClientRect();return {text:a.textContent.trim(),width:b.width,height:b.height,left:b.left,right:b.right};});return {panel:{top:r.top,left:r.left,right:r.right,bottom:r.bottom},actions,overflow:document.documentElement.scrollWidth>innerWidth+1,hasVoteInputs:!!panel.querySelector(".engagement-votes"),hasSaveButton:!!panel.querySelector("button")};})()');
         if(layout.overflow||layout.panel.left < -1||layout.panel.right > width+1||layout.hasVoteInputs||layout.hasSaveButton||
           layout.actions.length!==2||layout.actions.some(a=>a.height<44||a.width<70||a.left < -1||a.right > width+1))
           throw Error("PLAYER_V006_PARTICIPATION_LAYOUT_"+width+":"+JSON.stringify(layout));
         await screenshot("player-v006-canonical-participation-"+width);
         console.log("PLAYER_V006_PARTICIPATION_SCREEN_"+width+"=PASS");
       }
       results.push({page:"player-v002-"+variant,width,primary:state.primary,host:state.hostname,art:state.art,overflow:state.overflow});
       console.log("PLAYER_V002_"+variant.toUpperCase()+"_"+width+"=PASS");
       if(variant==="external-game"&&(width===1440||width===390)){
         await evaluate('(()=>{Object.defineProperty(navigator,"share",{configurable:true,value:undefined});Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.__playerShareCopy=text;}}});document.querySelector(".avp-stage-shortcuts button").click();})()');
         await until(()=>evaluate('!!window.__playerShareCopy&&!!document.querySelector(".avp-share-status")?.textContent?.includes("copied")'));
         const copied=await evaluate('window.__playerShareCopy');
         if(copied!==base+"/creator/projects/"+id)throw Error("PLAYER_V002_SHARE_URL_"+width+":"+copied);
         // No clipboard permission: expose actual public copy and select it
         // on desktop/mobile without persistence, network writes or new APIs.
         await evaluate('(()=>{Object.defineProperty(navigator,"clipboard",{configurable:true,value:undefined});document.querySelector(".avp-launch-kit-actions button:nth-child(2)").click()})()');
         await until(()=>evaluate('(()=>{const d=document.querySelector(".avp-launch-kit-announcement"),f=d?.querySelector("input");return d?.open&&document.activeElement===f&&f.selectionStart===0&&f.selectionEnd===f.value.length&&f.value.includes("on ANEVUM:")})()'));
         await evaluate('document.querySelector(".avp-launch-kit-actions button:first-child").click()');
         await until(()=>evaluate('(()=>{const f=document.querySelector("#avp-launch-kit-link");return document.activeElement===f&&f.selectionStart===0&&f.selectionEnd===f.value.length})()'));
         await evaluate('(()=>{const d=document.querySelector(".avp-launch-kit-embed");d.open=true;d.querySelector("button").click()})()');
         await until(()=>evaluate('(()=>{const f=document.querySelector("#avp-launch-kit-html");return document.activeElement===f&&f.selectionStart===0&&f.selectionEnd===f.value.length})()'));
         console.log("PLAYER_V139_MANUAL_SHARE_"+width+"=PASS");
         await evaluate('document.querySelector(".avp-stage-shortcuts a[href=\\"#avp-participation\\"]").click()');
         await until(()=>evaluate('location.hash==="#avp-participation"'));
         if(!await evaluate('!!document.getElementById("avp-participation")'))throw Error("PLAYER_V002_PARTICIPATION_ANCHOR_"+width);
       }
     }
     // Legacy and unavailable capability must remain independently fail-closed.
     if(width===1440||width===390){
       for(const [mode,expected] of [["legacy","legacy-guest"],["offline","unavailable"]]){
         const change=await fetch(base+"/__player-member-fixture?mode="+mode);
         if(!change.ok)throw Error("PLAYER_V005_MEMBER_MODE_SETUP_"+mode);
         await client.send("Page.navigate",{url:base+"/creator/projects/00000000000000000000000000000001"});
         await until(()=>evaluate('document.querySelector(".engagement-panel")?.getAttribute("data-avp-availability")==='+JSON.stringify(expected)));
         const info=await evaluate('(()=>{const p=document.querySelector(".engagement-panel");return {kind:p?.dataset.avpAvailability,hasVotes:!!p?.querySelector(".engagement-votes"),hasSave:!!p?.querySelector(".avp-canonical-save-button,.engagement-actions button"),retry:!!p?.querySelector("button"),heading:p?.querySelector("h2")?.textContent};})()');
         if(info.kind!==expected||info.hasVotes||info.hasSave||!info.heading||mode==="offline"&&!info.retry)throw Error("PLAYER_V005_MEMBER_GATE_"+mode+"_"+width+":"+JSON.stringify(info));
         if(mode==="offline"){
           // The server is down: retry remains fail-closed and never invents
           // member capability. When healthy again, real health decides.
           await evaluate('document.querySelector(".engagement-panel button").click()');
           await until(()=>evaluate('document.querySelector(".engagement-panel")?.getAttribute("data-avp-availability")==="unavailable"'));
           const resume=await fetch(base+"/__player-member-fixture?mode=canonical");
           if(!resume.ok)throw Error("PLAYER_V139_CAPABILITY_RESTORE_SETUP_"+width);
           await evaluate('document.querySelector(".engagement-panel button").click()');
           await until(()=>evaluate('document.querySelector(".engagement-panel")?.getAttribute("data-avp-availability")==="canonical-readonly"'));
           console.log("PLAYER_V139_AVAILABILITY_RETRY_"+width+"=PASS");
         }
         console.log("PLAYER_V005_MEMBER_GATE_"+mode.toUpperCase()+"_"+width+"=PASS");
       }
     }
     // Opt-in future save flow; the underlying staging flag is OFF. This is
     // a loopback-only synthetic member with no genuine account or publication.
     const setupSaves=await fetch(base+"/__player-member-fixture?mode=canonical-saves");
     if(!setupSaves.ok)throw Error("PLAYER_V008_SAVE_FIXTURE_UNAVAILABLE_"+width);
     await client.send("Network.clearBrowserCookies");
     const saveUrl=base+"/creator/projects/00000000000000000000000000000001";
     await client.send("Page.navigate",{url:saveUrl});
     await until(()=>evaluate('document.querySelector(".engagement-panel")?.getAttribute("data-avp-availability")==="canonical-saves-guest"'));
     const guest=await evaluate('(()=>{const p=document.querySelector(".engagement-panel"),links=[...p.querySelectorAll("a")].map(a=>a.getAttribute("href"));return {button:!!p.querySelector("button"),registration:p.textContent.includes("invite-only"),links};})()');
     if(guest.button||!guest.registration||!guest.links.includes("/creator/join"))
       throw Error("PLAYER_V008_SAVE_GUEST_"+width+":"+JSON.stringify(guest));
     await screenshot("player-v008-canonical-save-guest-"+width);
     await evaluate('document.cookie="anevum_offline_visual_fixture=1; Path=/; SameSite=Strict"');
     await client.send("Page.navigate",{url:saveUrl});
     await until(()=>evaluate('document.querySelector(".engagement-panel")?.getAttribute("data-avp-availability")==="canonical-saves-member"'));
     const before=await evaluate('(()=>{const b=document.querySelector(".avp-canonical-save-button"),r=b?.getBoundingClientRect();return {pressed:b?.getAttribute("aria-pressed"),text:b?.textContent,rect:r?{left:r.left,right:r.right,height:r.height}:null,overflow:document.documentElement.scrollWidth>innerWidth+1};})()');
     if(before.pressed!=="false"||!before.text?.includes("SAVE PROJECT")||!before.rect||before.rect.height<44||
        before.rect.left < -1||before.rect.right>width+1||before.overflow)
       throw Error("PLAYER_V008_SAVE_MEMBER_LAYOUT_"+width+":"+JSON.stringify(before));
     await evaluate('document.querySelector(".avp-canonical-save-button").scrollIntoView({block:"center",behavior:"instant"})');
     await screenshot("player-v008-canonical-save-before-"+width);
     await evaluate('document.querySelector(".avp-canonical-save-button").click()');
     await until(()=>evaluate('document.querySelector(".avp-canonical-save-button")?.getAttribute("aria-pressed")==="true"'));
     const marked=await evaluate('(()=>{const b=document.querySelector(".avp-canonical-save-button"),p=document.querySelector(".avp-canonical-save");return {label:b?.textContent,status:p?.querySelector("[role=status]")?.textContent,hasVoting:!!p?.querySelector(".engagement-votes")};})()');
     if(!marked.label?.includes("REMOVE SAVED PROJECT")||!marked.status?.includes("saved privately")||marked.hasVoting)
       throw Error("PLAYER_V008_SAVE_ACTION_"+width+":"+JSON.stringify(marked));
     await screenshot("player-v008-canonical-save-after-"+width);
     await evaluate('document.querySelector(".avp-canonical-save-button").click()');
     await until(()=>evaluate('document.querySelector(".avp-canonical-save-button")?.getAttribute("aria-pressed")==="false"'));
     const reverted=await evaluate('document.querySelector(".avp-canonical-save [role=status]")?.textContent');
     if(!reverted?.includes("removed"))throw Error("PLAYER_V008_REMOVE_ACTION_"+width+":"+reverted);
     const trace=await (await fetch(base+"/__player-member-requests")).json();
     if(!trace.syntheticOnly||trace.requests.length)throw Error("PLAYER_V008_LEGACY_IDENTITY_LEAK_"+width+":"+JSON.stringify(trace));
     console.log("PLAYER_V008_PRIVATE_SAVE_"+width+"=PASS");
     // V009: exercise the canonical private saved-works collection with
     // a synthetic verified browser session and one synthetic project.
     await evaluate('document.querySelector(".avp-canonical-save-button").click()');
     await until(()=>evaluate('document.querySelector(".avp-canonical-save-button")?.getAttribute("aria-pressed")==="true"'));
     const savedRoute=base+"/creator/saved";
     const collectionNav=await client.send("Page.navigate",{url:savedRoute});
     if(collectionNav.errorText)throw Error("PLAYER_V009_SAVED_NAVIGATION_"+width+":"+collectionNav.errorText);
     await until(()=>evaluate('location.pathname==="/creator/saved"&&document.querySelectorAll(".avsaved-card").length===1'));
     const savedCard=await evaluate('(()=>{const card=document.querySelector(".avsaved-card"),remove=card?.querySelector("button"),bounds=remove?.getBoundingClientRect();return {title:card?.querySelector("h2")?.textContent,credit:card?.querySelector(".avsaved-card-maker")?.textContent,open:card?.querySelector("a.avsaved-open")?.getAttribute("href"),btn:remove?.textContent,bounds:bounds?{left:bounds.left,right:bounds.right,height:bounds.height}:null,overflow:document.documentElement.scrollWidth>innerWidth+1,legacy:!!document.querySelector(".member-library-grid")};})()');
     if(savedCard.title!=="ARCADE AFTER DARK"||!savedCard.credit?.includes("@nova_demo")||
        !savedCard.open?.includes("from=%2Fsaved")||!savedCard.btn?.includes("REMOVE")||
        !savedCard.bounds||savedCard.bounds.height<44||savedCard.bounds.left < -1||
        savedCard.bounds.right > width+1||savedCard.overflow||savedCard.legacy)
       throw Error("PLAYER_V009_SAVED_LAYOUT_"+width+":"+JSON.stringify(savedCard));
     await evaluate('document.querySelector(".avsaved-card").scrollIntoView({block:"center",behavior:"instant"})');
     await screenshot("player-v009-canonical-saved-before-"+width);
     await evaluate('document.querySelector(".avsaved-card-actions button").click()');
     await until(()=>evaluate('document.querySelector(".avsaved-empty")!==null&&document.querySelectorAll(".avsaved-card").length===0'));
     const cleared=await evaluate('(()=>({empty:document.querySelector(".avsaved-empty h2")?.textContent,notice:document.querySelector(".avsaved-notice")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
     if(!cleared.empty?.includes("YOUR COLLECTION")||!cleared.notice?.includes("removed")||cleared.overflow)
       throw Error("PLAYER_V009_SAVED_REMOVE_"+width+":"+JSON.stringify(cleared));
     await evaluate('document.querySelector(".avsaved-empty").scrollIntoView({block:"center",behavior:"instant"})');
     await screenshot("player-v009-canonical-saved-empty-"+width);
     await client.send("Network.clearBrowserCookies");
     await client.send("Page.navigate",{url:savedRoute});
     await until(()=>evaluate('document.querySelector(".avsaved-inactive")?.textContent?.includes("Sign in with your verified ANEVUM member account")'));
     const guestSaved=await evaluate('(()=>{const panel=document.querySelector(".avsaved-inactive");return {href:panel?.querySelector("a")?.getAttribute("href"),items:document.querySelectorAll(".avsaved-card").length};})()');
     if(guestSaved.href!=="/creator/join"||guestSaved.items!==0)
       throw Error("PLAYER_V009_SAVED_GUEST_"+width+":"+JSON.stringify(guestSaved));
     await screenshot("player-v009-canonical-saved-guest-"+width);
     const staged=await fetch(base+"/__player-member-fixture?mode=canonical");
     if(!staged.ok)throw Error("PLAYER_V009_DISABLED_SETUP");
     await client.send("Page.navigate",{url:savedRoute});
     await until(()=>evaluate('document.querySelector(".avsaved-inactive")?.textContent?.includes("SAVED WORKS ARE NOT YET ACTIVE")'));
     const disabledSaved=await evaluate('(()=>({items:document.querySelectorAll(".avsaved-card").length,copy:document.querySelector(".avsaved-inactive")?.textContent}))()');
     if(disabledSaved.items!==0||!disabledSaved.copy?.includes("not enabled"))
       throw Error("PLAYER_V009_SAVED_DISABLED_"+width+":"+JSON.stringify(disabledSaved));
     console.log("PLAYER_V009_SAVED_WORKS_"+width+"=PASS");
     const reset=await fetch(base+"/__player-member-fixture?mode=legacy");
     if(!reset.ok)throw Error("PLAYER_V005_MEMBER_RESET_FAILED");
   }
   if(name==="home"){
     // V116 intentionally removes the prototype game's featured card. Validate
     // the real first-visit Wayfinder and public index without inventing content.
     await until(()=>evaluate('document.querySelectorAll(".av115-gateway").length===4&&!!document.querySelector(".av115-public-index")&&!!document.querySelector(".av115-iren-console button")'));
     const entrance=await evaluate('(()=>({headline:document.querySelector(".av115-arrival h1")?.textContent,primary:document.querySelector(".av115-arrival .av79-hero-actions a")?.getAttribute("href"),gateways:[...document.querySelectorAll(".av115-gateway")].map(x=>x.querySelector("strong")?.textContent?.trim()),join:document.querySelector(".av115-gateway-member")?.getAttribute("href"),iren:!!document.querySelector(".av115-iren-console button"),records:document.querySelectorAll(".av115-public-item").length,featuredTestGame:!!document.querySelector(".av79-feature"),oldPanels:document.querySelectorAll(".av73-world-deck,.av11-live-index,.av6-community-index").length,categoryArt:document.querySelectorAll(".av79-home .cw-artwork,.av79-home img").length,overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
     // Guest sees Join; a verified member correctly sees My Space.
     const expectedIdentityRoute=entrance.gateways[3]==="Join"?"/join":
       entrance.gateways[3]==="My Space"?"/member":null;
     if(!entrance.headline?.includes("A universe in the making")||
       !entrance.primary?.endsWith("/discover")||
       entrance.gateways.slice(0,3).join("|")!=="Discover|Create|Connect"||
       !expectedIdentityRoute||!entrance.join?.endsWith(expectedIdentityRoute)||
       !entrance.iren||entrance.featuredTestGame||
       entrance.oldPanels!==0||entrance.categoryArt!==0||entrance.overflow)
       throw Error("V116_HOME_ENTRY_"+width+":"+JSON.stringify(entrance));
     await screenshot("home-discovery-"+width);
     await evaluate('document.querySelector(".av9-menu-trigger").click()');
     await until(()=>evaluate('document.querySelector(".av79-navigation[open]")?.querySelectorAll(".av79-destination").length===4'));
     const wayfinder=await evaluate('(()=>{const menu=document.querySelector(".av79-navigation[open]");return {open:!!menu,destinations:[...menu.querySelectorAll(".av79-destination")].map(x=>x.textContent.trim()),images:menu.querySelectorAll("img,.cw-artwork,canvas").length,search:!!menu.querySelector(".av79-navigation-search"),playerAccess:!!menu.querySelector(".av79-navigation-join,.av79-navigation-identity"),overflow:menu.scrollWidth>menu.clientWidth+1}})()');
     if(!wayfinder.open||wayfinder.destinations.length!==4||wayfinder.images!==0||!wayfinder.search||!wayfinder.playerAccess||wayfinder.overflow)
       throw Error("V079_MENU_ACCESS_"+width+":"+JSON.stringify(wayfinder));
     await screenshot("wayfinder-"+width);
     await evaluate('document.querySelector(".av79-menu-close").click()');
     await until(()=>evaluate('!document.querySelector(".av79-navigation[open]")'));
   }
   results.push({page:name,width,...state});
   console.log("SITEWIDE_V012_"+name.toUpperCase()+"_"+width+"=PASS");
  }
  await client.send("Page.navigate",{url:base+"/creator/atlas/boards"});
  await until(()=>evaluate('location.pathname==="/creator/boards"&&!!document.querySelector(".cnb-hub")'));
  const archived=await evaluate('({headers:document.querySelectorAll(".site-header.av9-header").length,legacy:document.querySelectorAll(".atm-header").length})');
  if(archived.headers!==1||archived.legacy)throw Error("SITEWIDE_V012_DUPLICATE_SHELL_"+width+":"+JSON.stringify(archived));
  if(width===1440||width===390){
   await client.send("Page.navigate",{url:base+"/creator/community/posts/"+'a'.repeat(32)});
   await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector("article.discussion-page h1")'));
   const post=await evaluate('({title:document.querySelector("article.discussion-page h1")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1})');
   if(post.overflow||!post.title?.includes("Keyboard feedback"))throw Error("SITEWIDE_V012_DISCUSSION_"+width+":"+JSON.stringify(post));
   await screenshot("discussion-"+width);
   results.push({page:"discussion",width,...post});
  }
 }
 await captureCreatorIdentityV091({client,base,evaluate,until,screenshot});
 const packageOff=await capturePackageDiscoveryV011({client,base,evaluate,until,screenshot,enabled:false});
 writeFileSync(join(output,'package-discovery-v011.json'),JSON.stringify(packageOff,null,2));
 writeFileSync(join(output,"sitewide-v012-capture.json"),JSON.stringify({syntheticFixture:true,creatorIdentityV091:'PASS',pages:results},null,2));
 writeFileSync(join(output,"capture-status.txt"),"SITEWIDE_V012_BROWSER_CAPTURE=PASS\nAll records are synthetic offline visual fixtures; no live member acceptance.\n");
 console.log("SITEWIDE_V012_BROWSER_CAPTURE=PASS; PAGES="+results.length);
 }
}finally{
 try{if(client)await client.send("Browser.close");}catch{}
 client?.close();
 if(child.exitCode===null){
  const exited=new Promise(resolve=>child.once("exit",resolve));
  child.kill("SIGTERM");await Promise.race([exited,delay(2000)]);
  if(child.exitCode===null){child.kill("SIGKILL");await Promise.race([exited,delay(1000)]);}
 }
 try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error.code))throw error;console.warn("Temporary browser profile cleanup deferred:",error.code);}
}
