import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCompleteUtcWeeks,WEEKLY_CLIENT,WEEKLY_CSS} from '../analytics/anevum-observatory-weekly-v107.mjs';
const midnight=Date.UTC(2026,9,24);
const fixture=()=>{
 const rows=Array.from({length:30},(_,i)=>({
  day:new Date(midnight-(29-i)*86400000).toISOString().slice(0,10),
  count:i===29?1000:i>=22?3:i>=15?2:0
 }));
 return rows;
};
test('V107 compares two equal completed seven-day UTC windows, excluding the incomplete current date',()=>{
 const x=summarizeCompleteUtcWeeks(fixture());
 assert.equal(x.status,'verified_snapshot');
 assert.equal(x.source,'MEMBER_DB');
 assert.equal(x.basis,'two_complete_utc_calendar_windows');
 assert.equal(x.current.count,21);
 assert.equal(x.previous.count,14);
 assert.equal(x.delta,7);
 assert.equal(x.percent,50);
 assert.equal(x.direction,'up');
 assert.equal(x.latestPartialDayExcluded,'2026-10-24');
 assert.equal(x.current.to,'2026-10-23');
 assert.equal(x.previous.to,'2026-10-16');
 assert.notEqual(x.current.to,x.latestPartialDayExcluded);
 assert.match(x.limitation,/untagged test accounts/);
});
test('same-day comparison is zero, not manufactured conversion or activation',()=>{
 const rows=fixture().map((x,i)=>({...x,count:i===29?999:0}));
 const result=summarizeCompleteUtcWeeks(rows);
 assert.equal(result.current.count,0);
 assert.equal(result.previous.count,0);
 assert.equal(result.delta,0);
 assert.equal(result.direction,'flat');
 assert.equal(result.percent,null);
});
test('zero comparison baseline yields absolute change but no infinite or claimed percentage',()=>{
 const rows=fixture().map((x,i)=>({...x,count:i>=22&&i<=28?1:0}));
 const result=summarizeCompleteUtcWeeks(rows);
 assert.equal(result.current.count,7);
 assert.equal(result.previous.count,0);
 assert.equal(result.delta,7);
 assert.equal(result.percent,null);
 assert.equal(result.direction,'up');
});
test('decline reports negative absolute delta and finite signed percentage',()=>{
 const rows=fixture().map((x,i)=>({...x,count:i>=15&&i<=21?4:i>=22&&i<=28?1:0}));
 const result=summarizeCompleteUtcWeeks(rows);
 assert.equal(result.current.count,7);
 assert.equal(result.previous.count,28);
 assert.equal(result.delta,-21);
 assert.equal(result.percent,-75);
 assert.equal(result.direction,'down');
});
test('invalid, missing, unordered, duplicate and noncalendar rows fail closed',()=>{
 const originals=fixture();
 const changes=[
  originals.slice(1),
  originals.concat([originals[0]]),
  originals.map((x,i)=>i===5?{...x,day:originals[4].day}:x),
  originals.map((x,i)=>i===3?{...x,count:-1}:x),
  originals.map((x,i)=>i===3?{...x,count:'1'}:x),
  originals.map((x,i)=>i===3?{...x,count:Infinity}:x),
  originals.map((x,i)=>i===3?{...x,count:Number.MAX_SAFE_INTEGER+1}:x),
  originals.map((x,i)=>i===10?{...x,day:'2026-02-30'}:x),
  originals.map((x,i)=>i===3?null:x),
  originals.map((x,i)=>i===18?{...x,day:'2026-10-17'}:x)
 ];
 for(const data of changes)assert.equal(summarizeCompleteUtcWeeks(data),null);
});
test('unsafe seven-day sums cannot result in a plausible displayed registration signal',()=>{
 const rows=fixture().map((x,i)=>({...x,count:i>=22&&i<=28?Number.MAX_SAFE_INTEGER:0}));
 assert.equal(summarizeCompleteUtcWeeks(rows),null);
});
test('source-safe browser code uses the same pure derivation and no independent analytics requests',()=>{
 assert.doesNotThrow(()=>new Function(WEEKLY_CLIENT));
 assert.match(WEEKLY_CLIENT,/function summarizeCompleteUtcWeeks/);
 assert.match(WEEKLY_CLIENT,/MutationObserver\(draw\)/);
 assert.match(WEEKLY_CLIENT,/document\.getElementById\('dailyTable'\)/);
 assert.match(WEEKLY_CLIENT,/status\.textContent='DATA UNAVAILABLE'/);
 assert.match(WEEKLY_CLIENT,/today \(/i);
 assert.doesNotMatch(WEEKLY_CLIENT,/fetch\s*\(|sendBeacon\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML\s*=/i);
});
test('responsive weekly surface respects clear attribution boundaries and reduced motion',()=>{
 assert.match(WEEKLY_CSS,/\.ci-weekly-stats/);
 assert.match(WEEKLY_CSS,/@media\(max-width:700px\)/);
 assert.match(WEEKLY_CSS,/@media\(max-width:370px\)/);
 assert.match(WEEKLY_CSS,/scroll-margin-top:108px/);
 assert.match(WEEKLY_CLIENT,/displayRange/);
 assert.match(WEEKLY_CLIENT,/timeZone:'UTC'/);
 assert.match(WEEKLY_CSS,/@media\(prefers-reduced-motion:reduce\)/);
});
