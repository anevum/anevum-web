import test from "node:test";
import assert from "node:assert/strict";
import {applyLiveMessage, emptyLiveState, forecastCurrent, sourceHistoryValid} from "../src/lib/command-live-events.ts";

const timestamp = "2026-10-06T15:30:00Z";
function message(kind, payload, sequence=1, generation="g1") {
  return {schema_version:"command-live.v1",message_type:kind,payload,sequence,stream_generation:generation,server_time:timestamp};
}
function snapshot(generation="g1") {
  return applyLiveMessage(emptyLiveState(),message("snapshot",{visual_schema:"command-visual.v1",scanner:{},series:{},execution_events:[],system:{entry_authority:false}},1,generation));
}
function point(at=timestamp, value=100) { return {timestamp:at,value,provenance:"OBSERVED",source:"ALPACA/iex",quality_state:"LIVE"}; }

test("source history enforces actual availability and observed provenance",()=>{
  const p={...point(),available_at:timestamp};
  const clock=Date.parse(timestamp);
  assert.equal(sourceHistoryValid([p],clock),true);
  assert.equal(sourceHistoryValid([{...p,available_at:"2026-10-06T15:31:00Z"}],clock),false);
  assert.equal(sourceHistoryValid([point()],clock),false);
  assert.equal(sourceHistoryValid([{...p,provenance:"FORECAST"}],clock),false);
  assert.equal(sourceHistoryValid([p,p],clock),false);
});

test("snapshot fence rejects another generation until replacement",()=>{
  const old = snapshot();
  const stale = applyLiveMessage(old,message("system_patch",{entry_authority:true},2,"g2"));
  assert.equal(stale.stale,true); assert.equal(stale.system.entry_authority,false);
  assert.equal(applyLiveMessage(stale,message("system_patch",{quality_state:"LIVE"},3,"g1")).stale,true);
  const fresh = applyLiveMessage(stale,message("snapshot",{visual_schema:"command-visual.v1",system:{entry_authority:false}},1,"g2"));
  assert.equal(fresh.stale,false); assert.equal(fresh.generation,"g2");
});

test("old/duplicate sequence cannot replace authoritative values",()=>{
  const current = applyLiveMessage(snapshot(),message("scanner_patch",{symbol:"SPY",mid:100},2));
  assert.equal(applyLiveMessage(current,message("scanner_patch",{symbol:"SPY",mid:10},2)),current);
});

test("series append and current patch preserve real gaps and bounded history",()=>{
  let state = snapshot();
  state = applyLiveMessage(state,message("series_append",{series_id:"mid:SPY",point:point()},2));
  state = applyLiveMessage(state,message("series_patch_last",{series_id:"mid:SPY",point:point(timestamp,101)},3));
  assert.equal(state.series["mid:SPY"].length,1);
  state = applyLiveMessage(state,message("series_append",{series_id:"mid:SPY",point:point("2026-10-06T15:40:00Z")},4));
  assert.equal(state.series["mid:SPY"].length,2);
  assert.throws(()=>applyLiveMessage(state,message("series_patch_last",{series_id:"mid:SPY",point:point("2026-10-06T15:41:00Z")},5)));
  for(let i=1;i<2500;i++) state = applyLiveMessage(state,message("series_append",{series_id:"mid:SPY",point:point(new Date(Date.parse("2026-10-06T15:40:00Z")+i*60000).toISOString())},i+5));
  assert.equal(state.series["mid:SPY"].length,2400);
});

test("visual series reject absent provenance and nonfinite market values",()=>{
  assert.throws(()=>applyLiveMessage(snapshot(),message("series_append",{series_id:"x",point:{timestamp,value:100}},2)));
  assert.throws(()=>applyLiveMessage(snapshot(),message("series_append",{series_id:"x",point:point(timestamp,NaN)},2)));
});

test("broker markers require evidence and idempotent identity",()=>{
  const marker = {...point(),event_id:"fill1",event_type:"FILL",order_ref:"order1",symbol:"SPY"};
  const state = applyLiveMessage(snapshot(),message("execution_event",marker,2));
  assert.equal(applyLiveMessage(state,message("execution_event",marker,3)).executions.length,1);
  assert.throws(()=>applyLiveMessage(state,message("execution_event",{...marker,order_ref:""},4)));
});

test("24 independent scanner patches retain all symbols",()=>{
  let state = snapshot();
  for(let i=0;i<24;i++) state=applyLiveMessage(state,message("scanner_patch",{symbol:"S"+i,mid:100},i+2));
  const row=state.scanner.S1;
  state=applyLiveMessage(state,message("scanner_patch",{symbol:"S0",mid:101},26));
  assert.equal(Object.keys(state.scanner).length,24); assert.equal(state.scanner.S1,row);
});

test("forecast expiry, PIT, horizon, and exact uncertainty bounds",()=>{
  const now=Date.parse(timestamp), next=new Date(now+60000).toISOString();
  const f={forecast_id:"f",symbol:"SPY",issued_at:timestamp,feature_as_of:timestamp,expires_at:new Date(now+600000).toISOString(),
    horizon_seconds:600,model_version:"v1",methodology_version:"frozen-v1",provenance:"FORECAST",uncertainty_state:"AVAILABLE",quality_state:"LIVE",
    central_path:[{timestamp:next,value:100}],lower_path:[{timestamp:next,value:98}],upper_path:[{timestamp:next,value:102}]};
  assert.equal(forecastCurrent(f,now),true);
  assert.equal(forecastCurrent(f,now+600000),false);
  assert.equal(forecastCurrent({...f,feature_as_of:next},now),false);
  assert.equal(forecastCurrent({...f,horizon_seconds:30},now),false);
  assert.equal(forecastCurrent({...f,upper_path:null},now),false);
  assert.equal(forecastCurrent({...f,lower_path:[{timestamp:next,value:101}]},now),false);
});
