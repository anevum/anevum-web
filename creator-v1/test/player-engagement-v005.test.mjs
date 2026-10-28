import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
import {canonicalAvailabilityProbe,canonicalParticipationProbe} from "./player-browser-probes.mjs";
import {projectEngagementGateway} from "../web/src/lib/project-engagement.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("canonical health is read-only regardless of session, XP readiness or linked creator flag",()=>{
 for(const linkedCreatorAccounts of [true,false]){
  for(const signupEnabled of [true,false]){
   const response={service:"anevum-canonical-auth-staging",status:"ready",registration:"invite-only",linkedCreatorAccounts,progressionReady:true,signupEnabled};
   assert.deepEqual(projectEngagementGateway(response),{kind:"canonical-readonly",registration:"invite-only"});
  }
 }
 assert.deepEqual(projectEngagementGateway({service:"anevum-canonical-auth-staging",status:"ready",registration:"open"}),{kind:"canonical-readonly",registration:"open"});
 assert.deepEqual(projectEngagementGateway({service:"anevum-canonical-auth-staging",status:"ready",registration:"closed"}),{kind:"canonical-readonly",registration:"closed"});
 assert.deepEqual(projectEngagementGateway({service:"anevum-canonical-auth-staging",status:"closed",registration:"open"}),{kind:"canonical-readonly",registration:"closed"});
});

test("legacy supported contract stays available, unknown and malicious health fail closed",()=>{
 assert.deepEqual(projectEngagementGateway({service:"OFFLINE-SYNTHETIC-FIXTURE",status:"ok",signupEnabled:false}),{kind:"legacy"});
 for(const response of [null,undefined,[],{},{"status":"ready"},{"status":"ok"},{"status":"ok","signupEnabled":"true"},{service:"anevum-canonical-auth-staging",status:"ok",registration:"open",signupEnabled:true}]){
  assert.notEqual(projectEngagementGateway(response).kind,"legacy");
 }
});

test("canonical display explicitly disables rating, saving and XP without accessing legacy identity",()=>{
 const panel=read("web/src/components/MemberEngagementPanel.tsx");
 const shortcut=read("web/src/components/ProjectPlayerShell.tsx");
 assert.match(panel,/projectEngagementGateway\(health\)/);
 assert.ok(panel.indexOf('gateway.kind==="canonical-readonly"')<panel.indexOf("await memberMe(signal)"),"canonical response must not query legacy identity");
 assert.match(panel,/RATINGS NOT ACTIVE/);
 assert.match(panel,/Signing in does not activate project rating, saving, or XP/);
 assert.match(panel,/to="\/join"/);
 assert.match(panel,/to="\/community"/);
 assert.match(panel,/catch\{return \{kind:"unavailable"\};\}/);
 assert.match(panel,/data-avp-availability="unavailable"/);
 assert.match(panel,/onRetry=\{\(\)=>setAttempt\(n=>n\+1\)\}/);
 assert.match(panel,/onClick=\{onRetry\}/);
 assert.match(panel,/No rating, saving, or XP action is available until the server responds/);
 assert.match(panel,/data-avp-availability="closed"/);

 const style=read("web/src/components/project-player-shell.css");
 assert.match(style,/\.av9-shell \.avp-project \.avp-participation-actions a\{[^}]*min-height:56px/);
 assert.match(shortcut,/>PARTICIPATE<\/a>/);
 assert.doesNotMatch(shortcut,/>RATE \/ SAVE<\/a>/);
});

test("compiled browser fixture tests canonical invite-only, legacy guest and outage without enabling writes",()=>{
 const capture=read("test/capture-sitewide-v012.mjs");
 const fixture=read("test/portal-offline-preview.mjs");
 assert.match(fixture,/__player-member-fixture/);
 assert.match(fixture,/playerMemberHealthMode==="canonical"/);
 assert.match(fixture,/playerMemberHealthMode==="offline"/);
 assert.match(capture,/PLAYER_V005_CANONICAL_PARTICIPATION/);
 assert.match(capture,/PLAYER_V005_MEMBER_GATE/);
 assert.match(capture,/PLAYER_V005_MEMBER_RESET_FAILED/);
 assert.match(capture,/PLAYER_V006_CANONICAL_LEGACY_REQUEST/);
 assert.match(capture,/PLAYER_V006_PARTICIPATION_LAYOUT/);
 assert.match(capture,/PLAYER_V006_PARTICIPATION_SCREEN/);
 assert.match(fixture,/__player-member-requests/);
 assert.match(fixture,/projectMemberRequests\.push/);
 assert.match(fixture,/projectMemberRequests\.length=0/);
 assert.doesNotMatch(read("web/src/main.tsx"),/__player-member-fixture|playerMemberHealthMode/);
});

test("V005 browser probes compile and inspect a canonical read-only participation DOM",()=>{
 for(const expression of [canonicalAvailabilityProbe,canonicalParticipationProbe]){
  assert.doesNotThrow(()=>new Script(expression));
 }
 const status={
  textContent:"RATINGS NOT ACTIVE. Member access is currently invite-only. Signing in does not activate project rating, saving, or XP.",
  getAttribute(name){return name==="data-avp-availability"?"canonical-readonly":null},
  querySelector(){return null},
  querySelectorAll(){return [
    {textContent:"EXPLORE COMMUNITY",getAttribute:()=>"/creator/community"},
    {textContent:"MEMBER ACCESS",getAttribute:()=>"/creator/join"}
  ]}
 };
 const nav={querySelector(selector){
  assert.equal(selector,'a[href="#avp-participation"]');
  return {textContent:"PARTICIPATE"}
 }};
 const document={querySelector(selector){
  if(selector==='.engagement-panel[data-avp-availability="canonical-readonly"]')return status;
  if(selector===".engagement-panel")return status;
  if(selector===".avp-stage-shortcuts")return nav;
  throw Error("Unexpected selector: "+selector);
 }};
 assert.equal(runInNewContext(canonicalAvailabilityProbe,{document}),true);
 const result=runInNewContext(canonicalParticipationProbe,{document});
 assert.equal(result.status,"canonical-readonly");
 assert.equal(result.label,"PARTICIPATE");
 assert.equal(result.hasVotes,false);
 assert.equal(result.hasSave,false);
 assert.equal(result.invitation,true);
 assert.equal(result.falsePromise,true);
 assert.deepEqual(Array.from(result.links,x=>x.href),["/creator/community","/creator/join"]);
});
