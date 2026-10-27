import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const queue=read("web/src/components/AnevumNotifications.tsx");
const guide=read("web/src/components/IrenGuidedContinuance.tsx");
const events=read("web/src/lib/ui-events.ts");
const css=read("web/src/iren-transmissions-v111.css");

test("V111 extends the existing authenticated queue and IREN rig, without a second overlay backend",()=>{
 for(const source of [queue,guide,events])
  assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(queue,/progressionRequest<RewardInbox>\('notifications'/);
 assert.match(queue,/progressionRequest\('notifications\/ack',\{id:item\.serverId\}\)/);
 assert.match(queue,/activeTransmission:active\|\|null/);
 assert.match(queue,/document\.fullscreenElement/);
 assert.match(queue,/classList\.contains\("av095-expanded"\)/);
 assert.match(queue,/new MutationObserver\(onVisible\)/);
 assert.match(queue,/document\.addEventListener\('fullscreenchange',onVisible\)/);
 assert.match(queue,/if\(!active\|\|!visible\)return/);
 assert.match(queue,/dismissTransmission:\(item\)=>\{void finish\(item\)\}/);
 assert.doesNotMatch(queue,/className=\{'an-toast/);
 assert.equal((guide.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.match(guide,/IrenLivingCanvas mood=\{mood\}/);
 assert.match(guide,/broadcast\?\[-0\.85,-0\.18\]:look/);
 assert.doesNotMatch(guide,/fetch\(|dangerouslySetInnerHTML/);
});

test("V111 presents verified rewards and all app signals, without inventing achievements",()=>{
 for(const kind of ["success","error","info","update","xp","level","award"])
  assert.ok(events.includes("'"+kind+"'"),kind);
 assert.match(guide,/activeTransmission\.kind==="level"/);
 assert.match(guide,/typeof activeTransmission\.level==="number"/);
 assert.match(guide,/LevelEmblem level=\{activeTransmission\.level\}/);
 assert.match(guide,/activeTransmission\.kind==="award"&&activeTransmission\.award/);
 assert.match(guide,/AwardEmblem award=\{activeTransmission\.award\}/);
 assert.match(guide,/activeTransmission\.preview/);
 assert.match(guide,/no XP or award was granted/);
 assert.match(queue,/A transient read failure must not invent or erase earned progress/);
 assert.match(guide,/Published system availability is tracked separately/);
 assert.match(guide,/Link to="\/status"/);
});

test("V111 does not steal focus or force visuals during tours, hidden IREN or reduced motion",()=>{
 assert.match(guide,/!hidden&&!panelOpen&&tourIndex===null/);
 assert.match(guide,/hidden&&activeTransmission&&<aside className="ir111-quiet"/);
 assert.match(guide,/className="ir111-inline"/);
 assert.match(guide,/ir111-motion-paused/);
 assert.match(guide,/aria-label="Dismiss IREN transmission"/);
 assert.match(guide,/dismissTransmission\(activeTransmission\)/);
 assert.match(guide,/previous==="guide"\?"idle":previous/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-height:460px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/ir111-arrive/);
 assert.match(css,/ir111-motion-paused/);
 assert.match(css,/overflow-x:hidden/);
 assert.match(css,/linear-gradient\(145deg,#263a56,#151e34 64%,#241d37\)/);
 assert.match(guide,/import "\.\.\/iren-transmissions-v111\.css"/);
});

test("V139 retains urgent errors under a flooded info queue without manufacturing rewards",async()=>{
 const source=read("web/src/lib/notification-delivery.ts");
 assert.doesNotThrow(()=>parse(source,{sourceType:"module",plugins:["typescript"]}));
 assert.match(queue,/setQueue\(old=>scheduleTransmission\(old,alert\)\)/);
 assert.doesNotMatch(source,/fetch\(|localStorage|award.*grant|notifications\/ack/);
 // The project's TypeScript 7 package does not expose the legacy
 // transpileModule API. Strip only type annotations using Node 22's built-in
 // parser; execute the unaltered pure queue logic, not a separate mock.
 const out=stripTypeScriptTypes(source,{mode:"strip"});
 const {scheduleTransmission}=await import("data:text/javascript;base64,"+
  Buffer.from(out).toString("base64"));
 const alert=(id,kind="info",extra={})=>({key:"local-"+id,kind,title:"TEST "+id,...extra});
 const verified=(id)=>alert("server-"+id,"award",{serverId:id,award:"verified-by-server"});
 let q=[alert("active")];
 for(let i=0;i<40;i++)q=scheduleTransmission(q,alert("background-"+i));
 assert.equal(q.length,20,"Information capacity remains bounded");
 q=scheduleTransmission(q,alert("rejected-save","error",{detail:"No private revision was saved"}));
 assert.equal(q.length,20,"Urgent error replaces a low priority pending item");
 assert.equal(q[0].key,"local-active","Do not interrupt what IREN is already presenting");
 assert.equal(q[1].key,"local-rejected-save","Next actionable error is not silently dropped");
 q=scheduleTransmission(q,alert("permission-denied","error"));
 assert.equal(q[1].key,"local-permission-denied","Coalesces stale pending errors without growing forever");
 assert.equal(q.filter(x=>x.kind==="error").length,1);
 q=scheduleTransmission(q,verified(101));
 q=scheduleTransmission(q,verified(102));
 assert.deepEqual(q.filter(x=>x.serverId).map(x=>x.serverId),[101,102],
  "Keep verified FIFO and server IDs");
 assert.strictEqual(scheduleTransmission(q,verified(101)),q,"Duplicate verified notice is not replayed");
 q=scheduleTransmission(q,alert("latest","error"));
 assert.deepEqual(q.filter(x=>x.serverId).map(x=>x.serverId),[101,102],
  "Urgent presentation must not erase verified reward records");
 let xp=[alert("active"),alert("xp-first","xp",{xp:5})];
 xp=scheduleTransmission(xp,alert("xp-second","xp",{xp:7}));
 assert.equal(xp.length,2);
 assert.equal(xp[1].xp,12);
 assert.equal(xp[1].title,"+12 XP received");
 const extra=scheduleTransmission([alert("active"),...Array.from({length:19},(_,i)=>verified(i+1))],
   alert("hard-failure","error"));
 assert.equal(extra[1].kind,"error");
 assert.equal(extra.length,21,"All-verified backlog is retained rather than deleting earned evidence");
 assert.equal(extra.filter(x=>x.serverId).length,19);
});
