// Synthetic accounts and requests exist only in this browser fixture, never the server.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-discussion-qa-"));
const chrome = spawn("google-chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let port;
async function runCase(width, state) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl), pending = new Map(), errors = [];
  let next = 0;
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const value = JSON.parse(String(event.data));
    if (value.method === "Runtime.exceptionThrown") errors.push(value.params.exceptionDetails.text);
    if (!value.id) return;
    const task = pending.get(value.id); if (!task) return;
    pending.delete(value.id); clearTimeout(task.timer);
    if (value.error) task.reject(new Error(value.error.message)); else task.resolve(value.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next, timer = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 30000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  const root='document.querySelector(".anevum-commons-v5-mount")?.shadowRoot';
  const surface=root+'?.querySelector(".c2-social")';
  const waitFor=async(expression,label)=>{for(let n=0;n<120;n++){if(await evaluate(expression))return;await pause(100);}throw Error("Discussion timeout: "+label+" / "+state+" / "+JSON.stringify(await snapshot()));};
  const snapshot=()=>evaluate(`(() => {const page=${surface};return {state:page?.dataset.discussionState,text:page?.textContent||"",posts:page?.querySelectorAll('.c2-social-post').length||0,replies:page?.querySelectorAll('.c2-social-reply').length||0,title:page?.querySelector('#commons-social-title')?.value,mutations:window.__discussionQa.mutations,loads:window.__discussionQa.loads,blocked:[...(page?.querySelectorAll('button:not(.c2-social-reload)')||[])].every(button=>button.disabled)};})()`);
  const clickText=async(text,within=surface)=>evaluate(`[...${within}.querySelectorAll('button')].find(button=>button.textContent===${JSON.stringify(text)}).click()`);
  const enter=async(selector,text)=>{await evaluate(`${surface}.querySelector(${JSON.stringify(selector)}).focus()`);await send("Input.insertText",{text});};
  const compose=async()=>{await enter('#commons-social-title','A synthetic private draft');await enter('#commons-social-body','Evidence for an independently considered research discussion.');};
  const firstPost=surface+"?.querySelector('.c2-social-post')";
  const saveCapture=async(name)=>{const png=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(output,`discussion-${name}-${width}.png`),Buffer.from(png.data,"base64"));};
  try{
    await send("Page.enable");await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride",{width,height:width<760?900:1000,deviceScaleFactor:1,mobile:width<760});
    await send("Page.addScriptToEvaluateOnNewDocument",{source:`(() => {
      const state=${JSON.stringify(state)},original=window.fetch.bind(window);
      const id=n=>"223e4567-e89b-12d3-a456-"+String(n).padStart(12,"0");
      const qa=window.__discussionQa={member:"alpha",mutations:[],loads:[],held:[],aborted:[],confirm:false,pageFailed:false};
      qa.release=kind=>{qa.held.filter(item=>item.kind===kind).forEach(item=>item.resolve());qa.held=qa.held.filter(item=>item.kind!==kind);};
      const hold=kind=>new Promise(resolve=>qa.held.push({kind,resolve}));window.confirm=()=>qa.confirm;
      const paged=["pages","page-error","duplicate-page","invalid-cursor"].includes(state);
      const makePost=(n,member)=>({id:id(n),topic:n%2?"systems":"research",title:member+" private discussion "+n,body:"Independent methodological discussion with detailed supporting evidence.",createdAt:1000+n,updatedAt:1000+n,ownedByMe:n===1,authorLabel:"Commons member"});
      qa.posts=Array.from({length:paged?31:2},(_,n)=>makePost(n+1,"alpha")).sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id));
      qa.replies=Array.from({length:state==="pages"?51:2},(_,n)=>({id:id(1000+n),postId:qa.posts[0].id,body:"Methodological reply "+n,createdAt:2000+n,ownedByMe:n===0,authorLabel:"Commons member"}));
      const cursor=(kind,scope,row)=>btoa(JSON.stringify({v:1,kind,scope,at:row.createdAt,id:row.id})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
      window.fetch=async(input,init={})=>{
        const raw=String(input),url=new URL(raw,location.origin),member=qa.member,method=init.method||"GET",pathname=url.pathname;
        if(pathname==="/api/member/availability")return Response.json({available:state!=="disabled",provider:"google"});
        if(pathname==="/api/auth/get-session")return Response.json(state==="signed-out"||state==="disabled"?null:{session:{id:"session-"+member,userId:member,expiresAt:new Date(Date.now()+3600000).toISOString()},user:{id:member,name:member,email:member+"@example.test",emailVerified:true}});
        if(pathname.startsWith("/api/member/commons/posts")){
          init.signal?.addEventListener("abort",()=>qa.aborted.push(member),{once:true});
          if(method!=="GET"){
            const body=init.body?JSON.parse(init.body):undefined;qa.mutations.push({member,method,path:pathname,body});
            if(state==="switch-write")await hold("write"); // Deliberately complete despite cancellation.
            if(state==="quota")return Response.json({message:"Quota exceeded"},{status:429});
            if(state==="revoked")return Response.json({message:"Membership revoked"},{status:403});
            const envelope={schemaVersion:"anevum.commons-discussions.v1",viewerMemberId:state==="wrong-write"?"beta":member};
            const parts=pathname.split("/"),postId=parts[5];
            if(pathname==="/api/member/commons/posts"){
              const post={id:id(900),...body,createdAt:9000,updatedAt:9000,ownedByMe:true,authorLabel:"Commons member"};qa.posts.unshift(post);
              if(state==="network-write")throw TypeError("Synthetic lost acknowledgement");
              return Response.json({...envelope,created:true,post},{status:201});
            }
            if(pathname.endsWith("/report"))return Response.json({...envelope,reported:true,postId:state==="wrong-report"?id(999):postId,reviewStatus:"PENDING"},{status:201});
            if(method==="POST"&&pathname.endsWith("/replies")){
              const reply={id:id(999),postId,body:body.body,createdAt:9999,ownedByMe:true,authorLabel:"Commons member"};qa.replies.push(reply);return Response.json({...envelope,created:true,reply},{status:201});
            }
            if(method==="DELETE"&&parts.length===8){const replyId=parts[7];qa.replies=qa.replies.filter(row=>row.id!==replyId);return Response.json({...envelope,removed:true,postId,replyId:state==="wrong-remove"?id(777):replyId});}
            if(method==="DELETE"){qa.posts=qa.posts.filter(row=>row.id!==postId);return Response.json({...envelope,removed:true,postId});}
            throw Error("Unexpected synthetic mutation");
          }
          const isReplies=pathname.endsWith("/replies"),kind=isReplies?"replies":"feed";qa.loads.push({member,kind,cursor:url.searchParams.get("cursor")});
          if(state==="late-feed"&&!isReplies&&member==="alpha")await hold("feed");
          if(state==="late-replies"&&isReplies&&member==="alpha")await hold("replies");
          if(state==="off")return Response.json({available:false},{status:503});
          if(state==="denied")return Response.json({message:"Denied"},{status:403});
          const envelope={schemaVersion:"anevum.commons-discussions.v1",viewerMemberId:state==="crossed"?"beta":member};
          const cap=isReplies?50:30,postId=pathname.split("/")[5],scope=isReplies?postId:url.searchParams.get("topic")||"all";
          let records=isReplies?qa.replies.filter(row=>row.postId===postId):member==="beta"?[makePost(10,"beta")]:qa.posts;
          if(!isReplies&&scope!=="all")records=records.filter(row=>row.topic===scope);
          const token=url.searchParams.get("cursor");
          if(token){
            if(state==="page-error"&&!qa.pageFailed){qa.pageFailed=true;return Response.json({message:"Transient page failure"},{status:500});}
            const c=JSON.parse(atob(token.replaceAll("-","+").replaceAll("_","/")));records=records.filter(row=>isReplies?row.createdAt>c.at||row.createdAt===c.at&&row.id>c.id:row.createdAt<c.at||row.createdAt===c.at&&row.id<c.id);
            if(state==="duplicate-page")records=[qa.posts[29]];
          }
          const items=records.slice(0,cap),hasMore=records.length>cap;
          const page={pageCap:cap,hasMore,nextCursor:hasMore?cursor(isReplies?"replies":"posts",scope,items.at(-1)):null};
          if(state==="invalid-cursor"&&!isReplies)page.nextCursor=cursor("posts","research",items.at(-1));
          if(isReplies){if(state==="bad-replies")items[0]={...items[0],postId:id(777)};return Response.json({...envelope,postId,replies:items,...page});}
          if(state==="malformed")items[0]={...items[0],ownedByMe:"true"};
          return Response.json({...envelope,available:true,pilot:true,moderationStatus:"PILOT_REVIEW_REQUIRED",posts:items,...page,olderPostsMayExist:hasMore});
        }
        if(pathname.startsWith("/api/command/"))return Response.json({message:"Operator authorization required"},{status:401});
        if(pathname.startsWith("/api/member/"))throw Error("Unexpected member fixture request");return original(input,init);
      };
    })()`});
    await send("Page.navigate",{url:base+"/communities"});
    if(["signed-out","disabled"].includes(state)){
      await waitFor(`${surface}?.textContent.includes("Sign in to Commons")`,"signed-out discussion");
      const info=await snapshot();if(info.posts||info.loads.length||info.mutations.length)throw Error("Unavailable member requested discussion data");
    }else if(["off","denied","malformed","crossed","invalid-cursor"].includes(state)){
      await waitFor(`${surface}?.dataset.discussionState===${JSON.stringify(["off","denied"].includes(state)?"off":"error")}`,"closed feed");
      const info=await snapshot();if(info.posts||info.text.includes("alpha private")||info.mutations.length)throw Error("Unverified feed rendered writable private rows");
    }else if(["late-feed","late-replies","switch-write"].includes(state)){
      if(state==="late-feed")await waitFor('window.__discussionQa.held.some(item=>item.kind==="feed")',"held feed");
      else{
        await waitFor(`${surface}?.dataset.discussionState==="ready"`,"alpha feed");
        await compose();
        if(state==="late-replies")await clickText("View replies",firstPost);else await evaluate(`${surface}.querySelector('.c2-social-composer').requestSubmit()`);
        await waitFor(`window.__discussionQa.held.some(item=>item.kind===${JSON.stringify(state==="late-replies"?"replies":"write")})`,"held action");
      }
      await evaluate(`window.__discussionQa.member="beta";window.dispatchEvent(new StorageEvent("storage",{key:"better-auth.message",newValue:JSON.stringify({event:"session",data:{trigger:"getSession"},clientId:"fixture-other-tab"})}))`);
      await waitFor(`${surface}?.dataset.discussionState==="ready"&&${surface}?.textContent.includes("beta private discussion")`,"beta feed");
      await evaluate(`window.__discussionQa.release(${JSON.stringify(state==="late-feed"?"feed":state==="late-replies"?"replies":"write")})`);await pause(300);
      const info=await snapshot();if(info.title!==""||info.posts!==1||info.replies||info.text.includes("alpha private")||info.text.includes("Post published")||info.text.includes("Action not verified"))throw Error("Late Alpha completion changed Beta discussion state");
      if(info.mutations.length!==(state==="switch-write"?1:0)||info.mutations.some(row=>row.member!=="alpha")||!await evaluate('window.__discussionQa.aborted.includes("alpha")'))throw Error("Cross-account request isolation failed");
    }else{
      await waitFor(`${surface}?.dataset.discussionState==="ready"`,"authorized feed");
      if(["pages","page-error","duplicate-page"].includes(state)){
        if((await snapshot()).posts!==30)throw Error("Initial feed cap failed");await clickText("Load older discussions");
        if(state==="page-error"||state==="duplicate-page"){
          await waitFor(`${surface}?.textContent.includes("Could not load this page")`,"page failure");if((await snapshot()).posts!==30)throw Error("Failed page changed existing feed");
          if(state==="page-error"){await clickText("Load older discussions");await waitFor(`${surface}?.querySelectorAll('.c2-social-post').length===31`,"page retry");}
        }else{
          await waitFor(`${surface}?.querySelectorAll('.c2-social-post').length===31`,"older page");
          if(await evaluate(`!!${surface}.querySelector('.c2-social-more')`))throw Error("Terminal feed retained more button");
          await clickText("View replies",firstPost);await waitFor(`${surface}?.querySelectorAll('.c2-social-reply').length===50`,"first replies page");
          await clickText("Load more replies",firstPost);await waitFor(`${surface}?.querySelectorAll('.c2-social-reply').length===51`,"next replies page");
          if(await evaluate(`[...${firstPost}.querySelectorAll('button')].some(button=>button.textContent==="Load more replies")`))throw Error("Terminal replies retained more button");
          await clickText("Systems",surface+".querySelector('.c2-tabs')");await waitFor(`${surface}?.dataset.discussionState==="ready"&&${surface}?.querySelectorAll('.c2-social-post').length===16`,"topic filter");
          if((await snapshot()).replies)throw Error("Topic change retained prior reply list");
        }
      }else if(state==="bad-replies"){
        await clickText("View replies",firstPost);await waitFor(`${surface}?.textContent.includes("Could not load this page")`,"crossed replies");if((await snapshot()).replies)throw Error("Crossed replies were displayed");
      }else if(state==="wrong-report"){
        await clickText("Report",firstPost);await waitFor(`${surface}?.textContent.includes("Action not verified")`,"crossed report acknowledgement");if(!(await snapshot()).blocked)throw Error("Uncertain report permitted retry");
      }else if(state==="wrong-remove"){
        await clickText("View replies",firstPost);await waitFor(`${surface}?.querySelectorAll('.c2-social-reply').length===2`,"own reply list");await evaluate('window.__discussionQa.confirm=true');await clickText("Remove my reply",firstPost);
        await waitFor(`${surface}?.textContent.includes("Action not verified")`,"crossed removal acknowledgement");if((await snapshot()).replies!==2||!(await snapshot()).blocked)throw Error("Wrong removal acknowledgement deleted visible reply or unlocked writes");
      }else if(["wrong-write","network-write","quota","revoked"].includes(state)){
        await compose();await evaluate(`${surface}.querySelector('.c2-social-composer').requestSubmit()`);
        await waitFor(`${surface}?.textContent.includes("Action not verified")`,"uncertain publication");let info=await snapshot();
        if(info.mutations.length!==1||info.text.includes("Post published")||!info.blocked)throw Error("Unverified write claimed success or remained mutable");
        if(state==="revoked"&&(info.posts||info.state!=="off"))throw Error("Authorization revocation retained feed");
        if(state==="network-write"){
          await clickText("Reload latest discussions");await waitFor(`${surface}?.dataset.discussionState==="ready"&&${surface}?.textContent.includes("A synthetic private draft")`,"authoritative reload after lost acknowledgement");
          info=await snapshot();if(info.mutations.length!==1||info.text.includes("Action not verified")||info.text.includes("Post published"))throw Error("Reload repeated mutation or invented success");
        }
      }else{
        if((await snapshot()).posts!==2)throw Error("Lifecycle fixture did not load real-form posts");
        await evaluate(`${surface}.scrollIntoView({block:'start'})`);await saveCapture("composer");
        await compose();
        await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
        await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
        if(!await evaluate(`(() => {const button=${surface}.querySelector('.c2-social-composer button');return ${root}.activeElement===button&&getComputedStyle(button).outlineStyle!=="none";})()`))throw Error("Discussion submit lacks keyboard focus");
        await evaluate(`${surface}.querySelector('.c2-social-composer').requestSubmit()`);await waitFor(`${surface}?.textContent.includes("Post published")`,"publication");
        let info=await snapshot();if(info.posts!==3||info.title!=="")throw Error("Published post did not reload or clear composer");
        const published=surface+".querySelector('.c2-social-post')";
        await clickText("Remove my post",published);if((await snapshot()).mutations.length!==1)throw Error("Cancelled post removal sent request");
        await evaluate('window.__discussionQa.confirm=true');await clickText("Remove my post",published);await waitFor(`${surface}?.textContent.includes("Your post was removed")`,"post removal");
        await clickText("View replies",firstPost);await waitFor(`${surface}?.querySelectorAll('.c2-social-reply').length===2`,"replies");
        if(await evaluate(`${firstPost}.querySelectorAll('.c2-social-reply button').length!==1`))throw Error("Foreign reply received removal control");
        await enter('.c2-social-replies textarea','Independently considered reply evidence.');await evaluate(`${surface}.querySelector('.c2-social-replies form').requestSubmit()`);await waitFor(`${surface}?.querySelectorAll('.c2-social-reply').length===3`,"reply publication");
        await evaluate('window.__discussionQa.confirm=false');await clickText("Remove my reply",firstPost);const count=(await snapshot()).mutations.length;if(count!==3)throw Error("Cancelled reply removal sent request");
        await evaluate('window.__discussionQa.confirm=true');await clickText("Remove my reply",firstPost);await waitFor(`${surface}?.textContent.includes("Your reply was removed")`,"reply removal");
        if((await snapshot()).replies!==2)throw Error("Removed reply stayed visible");
        await clickText("Report",firstPost);await waitFor(`${surface}?.textContent.includes("Report recorded")`,"moderator report");
        info=await snapshot();if(info.mutations.length!==5)throw Error("Unexpected lifecycle mutation count");
        const fields=info.mutations.filter(row=>row.method==="POST").map(row=>Object.keys(row.body).sort().join(","));if(fields.join("|")!=="body,title,topic|body|reason")throw Error("Client supplied an authority field");
        await evaluate(`${firstPost}.scrollIntoView({block:'start'})`);
      }
    }
    const overflow=await evaluate(`(() => {const page=${surface};return document.documentElement.scrollWidth>innerWidth+1||[...(page?.querySelectorAll('*')||[])].some(el=>el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).display!=="inline");})()`);
    if(overflow||errors.length)throw Error("Discussion layout/runtime error: "+JSON.stringify({overflow,errors}));
    if(state!=="lifecycle")await evaluate(`${surface}.scrollIntoView({block:'start'})`);
    await saveCapture(state);console.log(JSON.stringify({route:"/communities",state,width,ok:true}));
  } finally {
    ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  }
}
try {
  for (let i = 0; i < 200; i++) {
    try { port = Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]); if(port) break; } catch {}
    if(chrome.exitCode!==null) throw new Error("Chrome exited before discussion QA");
    await pause(100);
  }
  if (!port) throw new Error("Chrome did not start");
  for (const width of [320,390,768,1024,1440]) await runCase(width,"lifecycle");
  for (const state of ["signed-out","disabled","off","denied","malformed","crossed","invalid-cursor","pages","page-error","duplicate-page","bad-replies","wrong-write","network-write","quota","wrong-report","wrong-remove","revoked","late-feed","late-replies","switch-write"] ) await runCase(390,state);
} finally {
  if (chrome.exitCode===null&&chrome.signalCode===null) {
    await new Promise(resolve=>{
      const timer=setTimeout(()=>{chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",()=>{clearTimeout(timer);resolve();});chrome.kill();
    });
  }
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
