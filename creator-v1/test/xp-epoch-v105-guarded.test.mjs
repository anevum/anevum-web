import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {patchLiveBundle,ACCOUNT,WORKER,LIVE,LIVE_ETAG,SOURCE} from '../ops/xp-epoch-v105-live-cutover.mjs';

test('live Worker patch refuses unknown or truncated source instead of silently deploying',()=>{
 assert.throws(()=>patchLiveBundle(''),/Unexpected live bundle size/);
 assert.throws(()=>patchLiveBundle('x'.repeat(2305800)),/Source drift or duplicate: epoch helper/);
});
test('all deployment and reset actions are explicitly gated',()=>{
 const s=readFileSync(new URL('../ops/xp-epoch-v105-live-cutover.mjs',import.meta.url),'utf8');
 assert.equal(ACCOUNT,'2f7ee83107240152097efd956a4e8335');
 assert.equal(WORKER,'anevum-apex-prelaunch-gateway');
 assert.equal(LIVE,'93cc7f07-cf39-457e-af69-c9f6f4c02d25');
 assert.equal(LIVE_ETAG,'2c02ac225ced8bdecd764da9c878c7dd32d0cb0d32b8dc476206ef990f25e40a');
 assert.equal(SOURCE,'a0483173eef35077bbcf04123438d6d34c5f409b');
 assert.match(s,/keep_assets:true/);
 assert.match(s,/assert\.deepEqual\(baseline\?\.versions/);
 assert.match(s,/CURRENT_XP_TEST_ENABLED|CANONICAL_XP_TEST_ENABLED/);
 assert.match(s,/const immediate=await api\(token,'GET',BASE\+'\/deployments\?per_page=1'\)/);
 assert.doesNotMatch(s,/DELETE FROM member_xp_events|DELETE FROM member_space_milestones|DELETE FROM member_recognition_grants/i);
 assert.doesNotMatch(s,/member_progression_reset_epoch\(epoch,cutoff_event_id,cutoff_at\)\s*VALUES/i);
 assert.match(s,/if\(mode==='check'\)/);
 assert.match(s,/GITHUB_HEAD_MESSAGE/);
 assert.match(s,/approved_merge:SOURCE/);
});
