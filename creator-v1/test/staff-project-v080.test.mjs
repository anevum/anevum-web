import test from "node:test";
import assert from "node:assert/strict";
import {Script} from "node:vm";
import {renderStaffOperations} from "../operations/staff-project-ui-v080.mjs";
import {staffInventory,staffOwnerAction,staffReviewAction,controlSchemaReady} from "../operations/staff-project-control-v080.mjs";
const id="11111111-1111-4111-8111-111111111111";
const sample={id,title:"Single Drift",creator:"Sample maker",summary:"A safely escaped sample <script>",kind:"html",status:"published",filename:"index.html"};
test("staff output escapes creator-controlled markup",()=>{
 const html=renderStaffOperations({projects:[sample],role:"reviewer"});
 assert.ok(html.includes("&lt;script&gt;"));assert.ok(!html.includes("sample <script>"));
 assert.ok(!html.includes('id="dialog"'));assert.ok(!html.includes('data-action="delete"'));
});
test("owner can see distinct actions, but controls require migration",()=>{
 const locked=renderStaffOperations({projects:[sample],role:"owner",controlsReady:false});
 assert.ok(!locked.includes('id="dialog"'));
 const enabled=renderStaffOperations({projects:[sample],role:"owner",controlsReady:true});
 assert.ok(enabled.includes('data-action="unpublish"'));
 assert.ok(enabled.includes('data-action="delete"'));
});
test("no staff role can mutate a project",async()=>{
 const env={DB:{prepare(){throw Error("Database must not be used")}}};
 const rejected=await staffOwnerAction(env,"member","reviewer",{action:"delete",projectId:id});
 assert.equal(rejected.status,403);
 const anonymous=await staffOwnerAction(env,null,"owner",{action:"delete",projectId:id});
 assert.equal(anonymous.status,403);
});
test("malformed owner request is rejected before database access",async()=>{
 const out=await staffOwnerAction({DB:{prepare(){throw Error("No database calls")}}},"owner-id","owner",{action:"delete",projectId:"invalid"});
 assert.equal(out.status,400);
});
test("missing lifecycle tables disables mutation path",async()=>{
 const db={prepare(){return {async all(){return {success:true,results:[]}},bind(){return this}}}};
 assert.equal(await controlSchemaReady(db),false);
 const out=await staffOwnerAction({DB:db},"owner-id","owner",{action:"delete",projectId:id});
 assert.equal(out.status,503);
});
test("reviewer inventory only requests pending records",async()=>{
 const statements=[];
 const db={prepare(sql){statements.push(sql);return {async all(){return {success:true,results:[]}},bind(){return this}}}};
 const result=await staffInventory(db,"reviewer");
 assert.deepEqual(result.projects,[]);
 assert.ok(statements[0].includes("WHERE p.status='pending_review'"));
 assert.equal(result.controlsReady,false);
});

test("reviewer decision validation rejects invalid requests without mutations",async()=>{
 const env={DB:{prepare(){throw Error("Must not query")}}};
 assert.equal((await staffReviewAction(env,"reviewer","reviewer",{projectId:"invalid",action:"publish"})).status,400);
 assert.equal((await staffReviewAction(env,"reviewer","reviewer",{projectId:id,action:"reject",reason:"no"})).status,422);
 assert.equal((await staffReviewAction(env,"reviewer","member",{projectId:id,action:"publish"})).status,403);
});
test("review submission controls appear only on pending projects",()=>{
 const html=renderStaffOperations({projects:[{...sample,status:"pending_review"}],role:"reviewer"});
 assert.ok(html.includes('data-review="publish"'));
 assert.ok(html.includes('data-review="reject"'));
 assert.ok(!html.includes('data-action="delete"'));
});

test("embedded mobile review and preview client parses as JavaScript",()=>{
 const html=renderStaffOperations({projects:[{...sample,status:"pending_review"}],role:"owner",controlsReady:true});
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,"staff HTML must contain an inline client");
 assert.doesNotThrow(()=>new Script(script[1]));
 assert.match(html,/id="preview-dialog"/);
 assert.match(html,/sandbox="allow-scripts"/);
 assert.doesNotMatch(html,/sandbox="allow-scripts allow-same-origin"/);
 assert.match(html,/data-preview=/);
});
test("no controls on owner view when lifecycle schema not ready",()=>{
 const html=renderStaffOperations({projects:[sample],role:"owner",controlsReady:false});
 assert.doesNotMatch(html,/data-action="delete"/);
 assert.doesNotMatch(html,/data-action="unpublish"/);
});
