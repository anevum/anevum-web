import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const j=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const s=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('public event reporting requires a published listing and explicit private description',()=>{
  for(const id of ['report-target','report-reason','report-details','report-state','submit-report','report-form'])
    assert.ok(h.includes('id="'+id+'"'),id);
  assert.match(h,/id="report-target" required disabled/);
  assert.match(h,/id="submit-report"[^>]*disabled/);
  assert.match(h,/For emergencies, call 911/);
  assert.match(j,/data\.reportingAvailable === true/);
  assert.match(j,/select\.disabled=!enabled/);
});
test('staff report actions remain tied to independently verified role and revision',()=>{
  for(const id of ['reports-state','reports-feedback','report-queue','refresh-reports'])
    assert.ok(h.includes('id="'+id+'"'),id);
  assert.match(j,/!app\.role/);
  assert.match(j,/expectedRevision:report\.revision/);
  assert.match(j,/refresh-reports/);
  assert.doesNotMatch(h,/name="role"|id="role"/);
});
test('reporting client does not collect GPS, use third-party scripts or inject HTML',()=>{
  assert.doesNotMatch(j,/innerHTML|document\.write|navigator\.geolocation|localStorage|sessionStorage|indexedDB/);
  assert.match(j,/credentials:'same-origin'/);
  assert.doesNotMatch(h,/<script[^>]*src="https?:\/\//);
  assert.doesNotMatch(h,/<link[^>]*href="https?:\/\//);
  assert.match(s,/@media\(prefers-reduced-motion:reduce\)/);
});
