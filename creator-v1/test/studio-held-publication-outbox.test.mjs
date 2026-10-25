// ANEVUM P0 held-publication contract. Disposable SQLite only; never
// route a public endpoint, grant staff access, or write COMMUNITY_DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {recordHeldStudioPublication} from '../canonical-auth/publication-candidate/held-outbox.mjs';

const migration = name => readFileSync(new URL('../canonical-auth/migrations/'+name, import.meta.url),'utf8');
const heldMigration = readFileSync(new URL(
  '../canonical-auth/publication-candidate/0001_held_outbox_staging_only.sql', import.meta.url),'utf8');
const sid = '12345678-1234-4123-8123-123456789abc';
const pid = '22345678-1234-4123-8123-123456789abc';
const rid = '32345678-1234-4123-8123-123456789abc';
const actor = 'pilot-bob', owner = 'pilot-alice', createdAt = 1_800_000_000;
const review = () => ({
  submissionId:sid, reviewerId:actor,
  reason:'External destination and attribution require independent release approval.',
  reviewedAt:createdAt+100
});
function setup() {
  const f = fixture();
  f.db.exec(migration('0008_private_creator_studio.sql'));
  f.db.exec(migration('0009_private_review_snapshots.sql'));
  for (const user of [owner, actor]) {
    f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
      .run(user,user,user+'@fixture.invalid');
  }
  f.db.prepare(
    'INSERT INTO member_studio_projects('+
    'id,user_id,client_request_id,slug,title,summary,description,category,'+
    'free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,'+
    'status,revision,created_at,updated_at,submitted_at) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(pid,owner,rid,'verified-test','Verified test project',
    'Authentic external software candidate.','Description from the mutable draft',
    'tools',1,'MIT','https://github.com/example/verified-test',
    'https://example.org/verified-test','No generative AI was used',
    'Designed and implemented by pilot Alice',
    'pending_review',4,createdAt,createdAt,createdAt);
  f.db.prepare(
    'INSERT INTO member_studio_submissions('+
    'id,project_id,user_id,project_revision,slug,title,summary,description,category,'+
    'free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,status,submitted_at) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(sid,pid,owner,4,'verified-test','Frozen reviewed project',
    'Authentic external software candidate.','Frozen summary of the submitted source',
    'tools',1,'MIT','https://github.com/example/verified-test',
    'https://example.org/verified-test','No generative AI was used',
    'Designed and implemented by pilot Alice','pending_review',createdAt);
  return f;
}
function staged() {const f=setup();f.db.exec(heldMigration);return f;}
function inspect(f) {
  return {
    reviews:f.db.prepare('SELECT * FROM member_studio_publication_reviews').all(),
    outbox:f.db.prepare('SELECT * FROM member_studio_publication_outbox').all()
  };
}
test('held tables are opt-in and do not modify existing canonical migrations',()=>{
  const f=setup();try{
    assert.equal(f.db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='member_studio_publication_outbox'").get().n,0);
    assert.match(heldMigration,/UNROUTED/);
    assert.doesNotMatch(heldMigration,/CREATE\s+TABLE\s+(?:projects|creator_profiles)\b/i);
    assert.doesNotMatch(heldMigration,/status IN \([^)]*published/i);
    assert.ok(!heldMigration.includes('CREATE TRIGGER trg_publish'));
  }finally{f.db.close();}
});
test('one frozen review creates one held outbox atomically without a publication right',async()=>{
  const f=staged();try{
    const result=await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    assert.equal(result.status,'held');
    assert.equal(result.replayed,false);
    assert.equal(result.publicationAuthorized,false);
    assert.equal(result.projectionEnabled,false);
    const {reviews,outbox}=inspect(f);
    assert.equal(reviews.length,1);
    assert.equal(outbox.length,1);
    assert.equal(reviews[0].submission_id,sid);
    assert.equal(reviews[0].project_revision,4);
    assert.equal(outbox[0].review_id,result.reviewId);
    assert.equal(outbox[0].fingerprint,result.fingerprint);
    assert.equal(outbox[0].status,'held');
    assert.equal(outbox[0].idempotency_key,result.idempotencyKey);
    const record=JSON.parse(reviews[0].snapshot_json);
    assert.equal(record.metadata.title,'Frozen reviewed project');
    assert.equal(record.source.ownerUserId,owner);
    assert.equal(record.review.reviewerId,actor);
    assert.equal(record.metadata.assets,undefined);
    assert.equal(record.publicationAuthorized,undefined);
    assert.ok(!reviews[0].snapshot_json.includes('storage_key'));
  }finally{f.db.close();}
});
test('exact payload is idempotent; conflicting reason or time cannot overwrite review',async()=>{
  const f=staged();try{
    const first=await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    const replay=await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    assert.equal(replay.replayed,true);
    assert.equal(replay.reviewId,first.reviewId);
    assert.deepEqual(inspect(f).outbox.map(x=>x.id),[first.reviewId]);
    await assert.rejects(
      recordHeldStudioPublication(f.env.MEMBER_DB,{...review(),reason:'A different reviewer explanation must be rejected.'}),
      /idempotency conflict/
    );
    await assert.rejects(
      recordHeldStudioPublication(f.env.MEMBER_DB,{...review(),reviewedAt:createdAt+200}),
      /idempotency conflict/
    );
    assert.equal(inspect(f).reviews.length,1);
    assert.equal(inspect(f).outbox.length,1);
  }finally{f.db.close();}
});
test('missing staff identity, self-review and stale/missing frozen receipt fail closed',async()=>{
  const f=staged();try{
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,{...review(),reviewerId:owner}),/Authors cannot approve/);
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,{...review(),reviewerId:'unknown-user'}));
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,{...review(),submissionId:pid}),/Frozen submission not found/);
    f.db.prepare("UPDATE member_studio_projects SET revision=revision+1,updated_at=? WHERE id=?").run(createdAt+1,pid);
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,review()),/project revision/);
    assert.equal(inspect(f).outbox.length,0);
  }finally{f.db.close();}
});
test('project withdrawal cancels both rows and cancelled keys never rearm',async()=>{
  const f=staged();try{
    await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    f.db.prepare("UPDATE member_studio_projects SET status='draft',revision=revision+1,updated_at=? WHERE id=?")
      .run(createdAt+200,pid);
    const {reviews,outbox}=inspect(f);
    assert.equal(reviews[0].status,'cancelled');
    assert.equal(outbox[0].status,'cancelled');
    assert.equal(outbox[0].cancelled_at,createdAt+200);
    assert.throws(()=>f.db.prepare("UPDATE member_studio_publication_outbox SET status='held',cancelled_at=NULL").run(),/rearm/);
    assert.throws(()=>f.db.prepare("UPDATE member_studio_publication_reviews SET fingerprint=?").run('f'.repeat(64)),/immutable/);
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,review()),/project status/);
  }finally{f.db.close();}
});
test('receipt withdrawal without project change cancels both rows',async()=>{
  const f=staged();try{
    await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    f.db.prepare("UPDATE member_studio_submissions SET status='withdrawn',resolved_at=? WHERE id=?")
      .run(createdAt+300,sid);
    const {reviews,outbox}=inspect(f);
    assert.equal(reviews[0].status,'cancelled');
    assert.equal(outbox[0].status,'cancelled');
    assert.equal(outbox[0].cancelled_at,createdAt+300);
    await assert.rejects(recordHeldStudioPublication(f.env.MEMBER_DB,review()),/submission status/);
  }finally{f.db.close();}
});
test('a revoked reviewer cannot leave an anonymous held review',async()=>{
  const f=staged();try{
    await recordHeldStudioPublication(f.env.MEMBER_DB,review());
    f.db.prepare('DELETE FROM "user" WHERE id=?').run(actor);
    const {reviews,outbox}=inspect(f);
    assert.equal(reviews[0].reviewer_user_id,null);
    assert.equal(reviews[0].status,'cancelled');
    assert.equal(outbox[0].status,'cancelled');
  }finally{f.db.close();}
});
test('direct SQL cannot create held reviews referencing withdrawn receipts',async()=>{
  const f=staged();try{
    f.db.prepare("UPDATE member_studio_submissions SET status='withdrawn',resolved_at=? WHERE id=?").run(createdAt+20,sid);
    const key='canonical-studio:'+sid+':4';
    assert.throws(()=>f.db.prepare(
      'INSERT INTO member_studio_publication_reviews '+
      '(id,submission_id,project_id,owner_user_id,reviewer_user_id,project_revision,'+
      'idempotency_key,fingerprint,snapshot_json,reviewer_reason,created_at,status) '+
      "VALUES(?,?,?,?,?,?,?,?,?,?,?,'held')"
    ).run(crypto.randomUUID(),sid,pid,owner,actor,4,key,'e'.repeat(64),
      JSON.stringify({testOnly:true}),'A valid but withdrawn review fixture.',createdAt),/stale or unverified/);
    assert.equal(inspect(f).reviews.length,0);
    assert.equal(inspect(f).outbox.length,0);
  }finally{f.db.close();}
});
