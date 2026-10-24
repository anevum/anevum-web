import test from 'node:test';
import assert from 'node:assert/strict';
import {previewReleaseNotifications} from '../communications/release-notification-preview.mjs';

const clock=Date.parse('2026-10-24T14:00:00Z');
const entry=(id,date,kind='patch')=>({
 id,kind,audience:'testers',publishedAt:date,
 title:'Reviewed patch notes',summary:'Verified public release record.',
 changes:['Corrected a visible interface issue.'],href:'/updates#'+id
});
const feed=entries=>({schema:1,source:'approved-anevum-release-records',entries});

test('review-only release alerts never send and only include approved unseen public bulletins',()=>{
 const result=previewReleaseNotifications(feed([
  entry('release-old','2026-10-20'),
  entry('release-new','2026-10-24'),
  entry('release-future','2026-10-25')
 ]),{now:clock,seenIds:['release-old']});
 assert.equal(result.mode,'preview-only');
 assert.equal(result.shouldSend,false);
 assert.equal(result.count,1);
 assert.deepEqual(result.items.map(x=>x.id),['release-new']);
 assert.equal(result.items[0].href,'/updates#release-new');
});

test('empty or already-seen release set does not trigger a broadcast',()=>{
 const result=previewReleaseNotifications(feed([entry('release-old','2026-10-20')]),{now:clock,seenIds:['release-old']});
 assert.equal(result.count,0);
 assert.equal(result.shouldSend,false);
 assert.equal(result.reason,'no-new-public-release');
});

test('rejects unapproved feeds, duplicate IDs, malformed dates, unsafe changes, and false URLs',()=>{
 assert.throws(()=>previewReleaseNotifications({...feed([]),source:'unreviewed-drafts'},{now:clock}));
 assert.throws(()=>previewReleaseNotifications(feed([entry('release-a','2026-10-24'),entry('release-a','2026-10-24')]),{now:clock}));
 assert.throws(()=>previewReleaseNotifications(feed([entry('release-a','2026-02-30')]),{now:clock}));
 assert.throws(()=>previewReleaseNotifications(feed([{...entry('release-a','2026-10-24'),changes:['Unapproved\ncontent']}]),{now:clock}));
 assert.throws(()=>previewReleaseNotifications(feed([{...entry('release-a','2026-10-24'),href:'https://example.org'}]),{now:clock}));
});

test('release preview rejects malformed options and retains deterministic newest-first ordering',()=>{
 assert.throws(()=>previewReleaseNotifications(feed([]),{now:NaN}));
 assert.throws(()=>previewReleaseNotifications(feed([]),{now:clock,seenIds:['../private']}));
 const result=previewReleaseNotifications(feed([entry('release-a','2026-10-20'),entry('release-b','2026-10-24')]),{now:clock});
 assert.deepEqual(result.items.map(x=>x.id),['release-b','release-a']);
});
