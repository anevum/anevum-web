import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareStudioPublicationIntent} from '../canonical-auth/studio-publication-contract.mjs';

const sId = '12345678-1234-4123-8123-123456789abc';
const pId = '22345678-1234-4123-8123-123456789abc';
const fixture = () => ({
  submission: {
    id: sId, project_id: pId, user_id: 'canonical-owner-opaque-42',
    project_revision: 4, status: 'pending_review', submitted_at: 1_800_000_000,
    slug: 'sample-project', title: 'Sample project', summary: 'A verified external project.',
    description: 'Genuine example of a proposed public release.', category: 'tools',
    free_to_use: 1, license_name: 'MIT', source_url: 'https://github.com/org/sample',
    demo_url: 'https://sample.example.org/play', ai_disclosure: 'No AI was used',
    human_contribution: 'Created by a human.',
    assets: [{storage_key: 'private/never-public', sha256: 'secret'}]
  },
  project: {id: pId, user_id: 'canonical-owner-opaque-42', revision: 4, status: 'pending_review', title: 'Mutable draft should never win'},
  reviewerId: 'reviewer-other', reason: 'Rights and external links independently reviewed.',
  reviewedAt: 1_800_000_100
});
const prepare = changes => prepareStudioPublicationIntent(Object.assign(fixture(), changes));
const rejects = async (changes, needle) => assert.rejects(() => prepare(changes), needle);

test('frozen receipt produces deterministic private non-publishing intent', async () => {
  const input = fixture();
  const first = await prepareStudioPublicationIntent(input);
  const second = await prepareStudioPublicationIntent(input);
  assert.deepEqual(first, second);
  assert.match(first.fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(first.idempotencyKey, 'canonical-studio:' + sId + ':4');
  assert.equal(first.publicationAuthorized, false);
  assert.equal(first.projectionEnabled, false);
  assert.equal(first.metadata.title, input.submission.title);
  assert.equal(first.metadata.demoUrl, input.submission.demo_url);
  assert.equal(first.metadata.assets, undefined);
  assert.equal(first.metadata.ownerUserId, undefined);
  assert.equal(first.source.ownerUserId, input.submission.user_id);
  assert.equal(Object.isFrozen(first), true);
});

test('no self-approval, false reviewers or stale/withdrawn records', async () => {
  await rejects({reviewerId: 'canonical-owner-opaque-42'}, /Authors cannot approve/);
  await rejects({reviewerId: ''}, /reviewer/);
  await rejects({reviewerId: 'reviewer\nother'}, /reviewer/);
  await rejects({reviewerId: 'reviewer other'}, /reviewer/);
  await rejects({submission: {...fixture().submission, user_id: 'owner\nother'}}, /canonical owner/);
  await rejects({submission: {...fixture().submission, status: 'withdrawn'}}, /submission status/);
  await rejects({project: {...fixture().project, status: 'draft'}}, /project status/);
  await rejects({project: {...fixture().project, revision: 5}}, /project revision/);
  await rejects({submission: {...fixture().submission, project_revision: 5}}, /project revision/);
  await rejects({project: {...fixture().project, user_id: 'different'}}, /project owner/);
  await rejects({project: {...fixture().project, id: sId}}, /project ID/);
});

test('explicit disclosures and public HTTPS are mandatory; quarantined file is never sufficient', async () => {
  const src = fixture().submission;
  for (const bad of ['', null, 'http://example.com/demo', 'https://localhost/play',
    'https://192.168.0.2/game', 'https://user:pass@example.com',
    'https://example.com/?access_token=abc']) {
    await rejects({submission: {...src, demo_url: bad, source_url: null}}, /destination|validated external/);
  }
  await rejects({submission: {...src, source_url: null, demo_url: null}}, /validated external/);
  await rejects({submission: {...src, license_name: ''}}, /license/);
  await rejects({submission: {...src, ai_disclosure: 'no'}}, /AI disclosure/);
  await rejects({submission: {...src, human_contribution: 'x'}}, /human contribution/);
});

test('public taxonomy and immutable receipt geometry are checked before any intent', async () => {
  const src = fixture().submission;
  await rejects({submission: {...src, category: 'video'}}, /Unsupported public category/);
  await rejects({submission: {...src, slug: '../escape'}}, /slug/);
  await rejects({submission: {...src, free_to_use: '1'}}, /free-access/);
  await rejects({submission: {...src, id: 'not-uuid'}}, /submission ID/);
  await rejects({submission: {...src, submitted_at: 0}}, /submission time/);
  await rejects({reviewedAt: src.submitted_at - 1}, /review time/);
  await rejects({reason: 'ok'}, /review reason/);
});

test('one submission/revision key cannot silently hide differing frozen metadata', async () => {
  const first = await prepare();
  const changed = fixture();
  changed.submission.title = 'A different reviewed title';
  const second = await prepareStudioPublicationIntent(changed);
  assert.equal(first.idempotencyKey, second.idempotencyKey);
  assert.notEqual(first.fingerprint, second.fingerprint);
  assert.ok(first.requires.includes('audited_approval_and_outbox'));
});
