import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseReleaseFeed} from '../web/src/lib/release-bulletins.ts';

const data=JSON.parse(fs.readFileSync(new URL('../web/public/communications/updates.v1.json',import.meta.url),'utf8'));
const component=fs.readFileSync(new URL('../web/src/components/IrenGuidedContinuance.tsx',import.meta.url),'utf8');
const routes=fs.readFileSync(new URL('../web/src/App.tsx',import.meta.url),'utf8');
const archive=fs.readFileSync(new URL('../web/src/pages/ReleaseUpdatesPage.tsx',import.meta.url),'utf8');
const optin=fs.readFileSync(new URL('../web/src/components/EmailUpdatesOptIn.tsx',import.meta.url),'utf8');
test('public release record parses and contains no future or fabricated news',()=>{
 const feed=parseReleaseFeed(data);
 assert.equal(feed.source,'approved-anevum-release-records');
 assert.ok(feed.entries.length>=1);
 for(const row of feed.entries){
  assert.ok(Date.parse(row.publishedAt+'T00:00:00Z')<=Date.now(),row.id+' must be published before being exposed');
  assert.equal(row.href,'/updates#'+row.id);
  assert.ok(row.changes.length>=1);
  assert.ok(!/draft|unreleased|planned update/i.test(row.title));
 }
});
test('rejects duplicate IDs, insecure URLs and invalid release fields',()=>{
 const a=data.entries[0];
 assert.throws(()=>parseReleaseFeed({...data,entries:[a,a]}));
 assert.throws(()=>parseReleaseFeed({...data,entries:[{...a,href:'https://external.example/attack'}]}));
 assert.throws(()=>parseReleaseFeed({...data,entries:[{...a,kind:'unpublished'}]}));
});
test('existing IREN Signals panel includes source-bound release records but preserves earned rewards separation',()=>{
 assert.match(component,/readReleaseFeed/);
 assert.match(component,/PUBLIC_RELEASE_SEEN_EVENT/);
 assert.match(component,/publicReleaseUnread/);
 assert.match(component,/displaySignalCount/);
 assert.match(component,/markPublicReleaseSeen/);
 assert.match(component,/setReleaseNotes/);
 assert.match(component,/Published system availability is tracked separately/);
 assert.match(component,/READ ALL RELEASE NOTES/);
 assert.match(routes,/<Route path="updates" element={<ReleaseUpdatesPage\/>}/);
 assert.match(archive,/markPublicReleaseSeen/);
 assert.match(routes,/<Route path="updates\/preferences" element={<EmailUpdatePreferencesPage\/>}/);
});
test('email content remains separate from member signup and is explicitly gated',()=>{
 assert.match(optin,/VITE_ANEVUM_EMAIL_UPDATES==='true'/);
 assert.match(optin,/consent:true/);
 assert.match(optin,/Manage an existing subscription/);
 assert.match(optin,/type="checkbox" checked=\{releases\}/);
 assert.match(optin,/type="checkbox" checked=\{weekly\}/);
 assert.doesNotMatch(optin,/automatically subscribe|subscribe after sign in/i);
});
