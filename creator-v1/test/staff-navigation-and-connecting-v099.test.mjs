import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
import {parse} from "@babel/parser";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const worker=load("operations/anevum-iren-staff-observatory-v092.mjs");
const prior=load("operations/anevum-iren-staff-observatory-v001.mjs");
const getLiteral=name=>{
 const match=worker.match(new RegExp("const "+name+" = (\"(?:\\\\.|[^\"\\\\])*\");"));
 assert.ok(match,"Missing "+name);
 return JSON.parse(match[1]);
};
const client=getLiteral("CLIENT");
const html=getLiteral("PAGE");
const style=getLiteral("STYLES");
const shortcut=load("web/src/components/VerifiedStaffShortcut.tsx");

test("native founder link is present in all three React account navigation surfaces",()=>{
 const shell=load("web/src/components/Shell.tsx");
 const member=load("web/src/components/MemberSpaceDashboard.tsx");
 const atlas=load("web/src/pages/Phase1MemberPage.tsx");
 const main=load("web/src/main.tsx");
 for(const x of [shortcut,shell,member,atlas])
   assert.doesNotThrow(()=>parse(x,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(shell,/<VerifiedStaffShortcut location="wayfinder"\/>/);
 assert.match(member,/<VerifiedStaffShortcut location="profile"\/>/);
 assert.match(atlas,/<VerifiedStaffShortcut location="profile"\/>/);
 assert.match(main,/staff-verified-shortcut-v099\.css/);
 assert.match(shortcut,/__anevum_profile_staff_role_v001/);
 assert.match(shortcut,/credentials:"same-origin"/);
 assert.match(shortcut,/data-native-staff-shortcut=/);
 assert.match(shortcut,/verified\?\.memberId!==memberId/);
 assert.match(shortcut,/data\?\.role==="owner"/);
 assert.match(shortcut,/data\?\.role==="reviewer"/);
 assert.doesNotMatch(shortcut,/(?:window\.)?localStorage\.(?:getItem|setItem)|sessionStorage\.(?:getItem|setItem)|role\s*=\s*['"]owner['"]|OWNER_EMAIL/);
});
test("native link stays hidden without a verified server-granted staff role",()=>{
 assert.match(shortcut,/if\(!memberId\|\|verified\?\.memberId!==memberId\|\|!verified\.role\)return null/);
 assert.match(shortcut,/if\(response\.status!==200\|\|!response\.headers\.get/);
 assert.match(shortcut,/setVerified\(\{memberId,role:null,designation:null\}\)/);
 assert.match(shortcut,/window\.setTimeout\(\(\)=>request\.abort\(\),10000\)/);
 const css=load("web/src/staff-verified-shortcut-v099.css");
 assert.match(css,/:has\(> \.av99-native-staff-link\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/min-height:45px/);
});
test("Observatory server staff, D1, and access logic remains byte-for-byte unchanged",()=>{
 const start="const ORIGIN = ";
 assert.ok(worker.includes(start)&&prior.includes(start));
 assert.equal(worker.slice(worker.indexOf(start)),prior.slice(prior.indexOf(start)));
 assert.doesNotThrow(()=>new Script(client));
 assert.match(client,/AbortController/);
 assert.match(client,/redirect:'manual'/);
 assert.match(client,/12000/);
 assert.match(client,/LIVE DATA UNAVAILABLE/);
 assert.match(client,/__anevum_iren_staff_session_status_v001/);
 assert.match(style,/staff-connect-error/);
 assert.match(html,/id="lastSync"/);
 assert.match(html,/id="syncState"/);
});
async function runCase(fetchResponse){
 const map=new Map();
 const element=id=>{
  if(!map.has(id)){
   map.set(id,{textContent:"",innerHTML:"",hidden:false,disabled:false,dataset:{},
    addEventListener(){},querySelectorAll(){return []},querySelector(){return null}});
  }
  return map.get(id);
 };
 const document={
  getElementById:element,querySelectorAll(){return []},addEventListener(){}
 };
 const getTimer=(cb,ms)=>setTimeout(cb,ms===12000?15:ms);
 const context={document,window:{confirm(){return false}},
  fetch:fetchResponse,setTimeout:getTimer,clearTimeout,AbortController,console};
 runInNewContext(client,context,{timeout:1000});
 for(let attempt=0;attempt<50;attempt++){
  if(element("syncState").dataset.state==="error")break;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 assert.equal(element("syncState").dataset.state,"error","must resolve failed connection");
 assert.match(element("metrics").innerHTML,/Live metrics could not be loaded/);
 assert.match(element("metrics").innerHTML,/check staff session status/);
 assert.match(element("missionStatus").textContent,/no counts were loaded/);
 assert.equal(element("refresh").disabled,false);
 assert.match(element("refresh").innerHTML,/Refresh/);
 assert.equal(element("lastSync").textContent,"Connection unavailable");
 return {alert:element("alert").textContent,html:element("metrics").innerHTML};
}
test("401 auth failure exits Connecting and shows sign-in guidance",async()=>{
 const result=await runCase(async()=>({
  status:401,ok:false,headers:{get:()=> "application/json"},
  json:async()=>({error:"Valid staff session required"})
 }));
 assert.match(result.alert,/Staff session not verified/);
});
test("403 native staff denial does not expose dashboard",async()=>{
 const result=await runCase(async()=>({
  status:403,ok:false,headers:{get:()=> "application/json"},
  json:async()=>({error:"Staff role required"})
 }));
 assert.match(result.alert,/not authorized for staff operations/);
});
test("Access HTML, expired redirect or WAF page cannot masquerade as successful JSON",async()=>{
 const result=await runCase(async()=>({
  status:200,ok:true,headers:{get:()=> "text/html"},
  json:async()=>({role:"owner"})
 }));
 assert.match(result.alert,/non-JSON response/);
});
test("hung API is aborted and displays finite retry guidance",async()=>{
 const result=await runCase(async (_url,{signal})=>new Promise((_resolve,reject)=>{
  signal.addEventListener("abort",()=>reject(new Error("AbortError")),{once:true});
 }));
 assert.match(result.alert,/did not respond within 12 seconds/);
});
