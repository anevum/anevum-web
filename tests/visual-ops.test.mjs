import { test } from "node:test";
import assert from "node:assert/strict";
import { SYSTEMS, publicSystem, commandSystem, fleetState, freshStamp, displayState, systemWork } from "../src/lib/system-display.ts";
const now = Date.parse("2026-10-03T12:00:00Z");
const stamp = new Date(now).toISOString();
const feed = () => ({ok:true, generated_at:stamp, systems:Object.fromEntries(SYSTEMS.map(name => [name,{health_state:"HEALTHY",runtime_state:"RUNNING",observed_at:stamp,activity:"Canonical observation"}]))});
const snapshot = () => ({schema_version:"iren_command.v2",revision:1,observed_at:stamp,stale:false,state:"HEALTHY",action_required:false,incidents:[],topology:{services:SYSTEMS.map(name => ({service_id:name.toLowerCase(),status:"HEALTHY",liveness:true,readiness:true,observed_at:stamp})),dependencies:{}},work:{jobs:[],objectives:[]}});
test("friendly labels retain raw values and rejected research is not a runtime failure", () => {
  assert.equal(displayState("CANONICAL_CONTROL_STATE"), "Control active");
  assert.equal(displayState("OFFLINE"), "Offline");
  assert.equal(displayState("IDLE"), "Ready / idle");
  assert.equal(displayState("REJECTED"), "Rejected");
});
test("freshness rejects missing, invalid, unzoned, future and expired timestamps", () => {
  for (const value of [null, "invalid", "2026-10-03T12:00:00", new Date(now+1).toISOString(),new Date(now-180001).toISOString()]) assert.equal(freshStamp(value,now),false);
  assert.equal(freshStamp(stamp,now),true);
});
test("public unavailable or stale observations cannot become healthy or active", () => {
  assert.equal(publicSystem("IREN",null,now).raw,"UNAVAILABLE");
  const value=feed();
  value.systems.IREN.observed_at=new Date(now-180001).toISOString();
  assert.equal(publicSystem("IREN",value,now).raw,"STALE");
  assert.equal(publicSystem("IREN",value,now).active,false);
  assert.equal(publicSystem("RHEN",value,now,true).raw,"UNAVAILABLE");
  value.ok=false;
  assert.equal(publicSystem("RHEN",value,now).fresh,false);
});
test("offline NOSTRA overrides a generic healthy field and idle VELUM stays calm", () => {
  const value=feed();
  value.systems.NOSTRA.runtime_state="OFFLINE";
  value.systems.VELUM.runtime_state="IDLE";
  const nostra=publicSystem("NOSTRA",value,now), velum=publicSystem("VELUM",value,now);
  assert.equal(nostra.raw,"OFFLINE"); assert.equal(nostra.active,false);
  assert.equal(velum.raw,"IDLE"); assert.equal(velum.active,false);
  assert.equal(fleetState(SYSTEMS.map(name=>publicSystem(name,value,now))),"DEGRADED");
});
test("service health alone never animates research or forecasting work", () => {
  const value=feed();
  for(const name of ["GRAEN","NOSTRA","VELUM"]) assert.equal(publicSystem(name,value,now).active,false);
  value.systems.GRAEN.runtime_state="RESEARCHING";
  assert.equal(publicSystem("GRAEN",value,now).active,true);
  value.systems.GRAEN.observed_at=new Date(now-180001).toISOString();
  assert.equal(publicSystem("GRAEN",value,now).active,false);
});
test("RHEN scan motion requires positive counts and a fresh recorded scan", () => {
  const value=feed(); value.telemetry={scan_events_10m:3};
  assert.equal(publicSystem("RHEN",value,now).active,false);
  value.operational={latest_scan:{observed_at:stamp}};
  assert.equal(publicSystem("RHEN",value,now).active,true);
  value.telemetry.scan_events_10m=0;
  assert.equal(publicSystem("RHEN",value,now).active,false);
});
test("private runtime failures take precedence over public healthy observations", () => {
  const value=snapshot(); value.topology.services[1].liveness=false;
  const view=commandSystem("RHEN",value,feed(),now);
  assert.equal(view.raw,"OFFLINE"); assert.equal(view.active,false);
  assert.equal(commandSystem("RHEN",value,feed(),now,true).raw,"STALE");
});
test("missing private evidence is not supplied from public service health", () => {
  const value=snapshot(); value.topology.services=[];
  assert.equal(commandSystem("VELUM",value,feed(),now).raw,"UNAVAILABLE");
  assert.equal(commandSystem("GRAEN",null,feed(),now).jobs,undefined);
  value.work=undefined;
  assert.equal(commandSystem("GRAEN",value,feed(),now).objectives,undefined);
});
test("only current owned work drives activity; failed jobs do not", () => {
  const value=snapshot(); value.work.jobs=[{owner_system:"GRAEN",status:"RUNNING",title:"Evaluate retained evidence"},{owner_system:"VELUM",status:"FAILED",title:"Replay failed"}];
  assert.equal(commandSystem("GRAEN",value,null,now).active,true);
  assert.equal(commandSystem("VELUM",value,null,now).active,false);
  assert.equal(systemWork(value,"GRAEN").jobs.length,1);
  value.incidents=[{key:"graen.evidence",severity:"critical",reason:"Evidence unavailable"}];
  assert.equal(commandSystem("GRAEN",value,null,now).active,false);
});
test("fleet health fails closed for incomplete, unknown or stale evidence", () => {
  const value=feed(); let views=SYSTEMS.map(name=>publicSystem(name,value,now));
  assert.equal(fleetState(views),"HEALTHY");
  assert.equal(fleetState(views.slice(0,4)),"UNAVAILABLE");
  views[2]={...views[2],raw:"UNRECOGNIZED_PROVIDER_STATE"};
  assert.notEqual(fleetState(views),"HEALTHY");
});

test("a fresh IREN envelope cannot refresh an expired subsystem observation", () => {
  const value=snapshot();
  const old=new Date(now-180001).toISOString();
  value.topology.services[2].last_heartbeat_at=old;
  value.work.jobs=[{owner_system:"GRAEN",status:"RUNNING",title:"Retained work"}];
  const view=commandSystem("GRAEN",value,feed(),now);
  assert.equal(view.fresh,false);
  assert.equal(view.raw,"STALE");
  assert.equal(view.active,false);
  assert.equal(view.observedAt,old);
});

test("healthy idle Command runtimes stay healthy without pretending to work", () => {
  const value=snapshot();
  for (const row of value.topology.services) row.status="IDLE";
  const graen=commandSystem("GRAEN",value,null,now);
  assert.equal(graen.raw,"HEALTHY");
  assert.equal(graen.runtime,"IDLE");
  assert.equal(graen.active,false);
  assert.equal(graen.signal,undefined);
  assert.match(graen.activity,/No active research run/);
});

test("only substantive work produces a Command activity signal", () => {
  const value=snapshot();
  for (const row of value.topology.services) row.status="IDLE";
  value.work.jobs=[{owner_system:"IREN",status:"RUNNING",title:"Verify runtime evidence"}];
  const iren=commandSystem("IREN",value,null,now);
  assert.equal(iren.raw,"HEALTHY");
  assert.equal(iren.runtime,"RUNNING");
  assert.equal(iren.active,true);
  assert.ok(iren.signal);
  assert.equal(iren.activity,"Verify runtime evidence");
});
