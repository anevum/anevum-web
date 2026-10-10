import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("no push can deploy production: owner confirms exact current-main SHA and rollback", () => {
  const y = read(".github/workflows/deploy-production.yml");
  assert.match(y, /workflow_dispatch:\s*\n\s+inputs:/);
  assert.doesNotMatch(y, /^\s+push:\s*$/m);
  assert.match(y, /DEPLOY_ANEVUM_PRODUCTION_V5/);
  assert.match(y, /PRODUCTION_ROLLBACK_VERIFIED/);
  assert.match(y, /inputs\.reviewed_head_sha == github\.sha/);
  assert.match(y, /git ls-remote origin refs\/heads\/main/);
  assert.match(y, /Deploy to Cloudflare Workers/);
  assert.equal((y.match(/cloudflare\/wrangler-action@v3/g)||[]).length,1);
});

test("staging deploy is manual, scoped and rejects stale source", () => {
  const y = read(".github/workflows/member-staging-bootstrap.yml");
  assert.match(y, /DEPLOY_MEMBER_STAGING_ONLY/);
  assert.match(y, /inputs\.reviewed_head_sha == github\.sha/);
  assert.match(y, /github\.ref == 'refs\/heads\/main'/);
  assert.match(y, /git ls-remote origin refs\/heads\/main/);
  const lines = y.split(/\n      - name:/);
  const deploy = lines.find(l=>l.startsWith(" Deploy isolated staging OAuth Worker"));
  assert.ok(deploy);
  assert.match(deploy, /if: github\.event_name == 'workflow_dispatch'/);
});

test("preview backup is manual-only and never uploads plaintext SQL", () => {
  const y=read(".github/workflows/v5-preview-d1-backup-restore.yml");
  assert.match(y, /workflow_dispatch:\s*\n\s+inputs:/);
  assert.doesNotMatch(y, /^\s+(?:push|pull_request|schedule):\s*$/m);
  assert.match(y, /BACKUP_PREVIEW_ONLY/);
  assert.match(y, /inputs\.reviewed_head_sha == github\.sha/);
  assert.match(y, /ANEVUM_PREVIEW_BACKUP_FERNET_KEY/);
  assert.match(y, /anevum-members-preview/);
  assert.match(y, /RESTORED_AND_VERIFIED_SQLITE_PREVIEW_ONLY/);
  assert.match(y, /uses: actions\/upload-artifact@v4/);
  assert.match(y, /uses: actions\/download-artifact@v4/);
  const onlyUpload=y.split("      - name: Upload encrypted preview SQL only")[1]
    ?.split("      - name: Re-download encrypted archive")[0];
  assert.ok(onlyUpload);
  assert.match(onlyUpload, /path: .*\.fernet/);
  assert.doesNotMatch(onlyUpload, /^\s*path: .*\.sql\s*$/m);
  assert.doesNotMatch(y, /d1 migrations apply|time_travel\/restore|d1\/database\/.*\/import/);
});

test("helper handles private data in memory, without logging SQL or identities", () => {
  const py=read("scripts/verify-v5-preview-export-backup.py");
  assert.match(py, /sqlite3\.connect\(":memory:"\)/);
  assert.match(py, /PRAGMA integrity_check/);
  assert.match(py, /PRAGMA foreign_key_check/);
  assert.match(py, /ANEVUM_PREVIEW_BACKUP_FERNET_KEY/);
  assert.match(py, /Fernet\(/);
  assert.match(py, /PREVIEW_BACKUP_BLOCKED/);
  assert.doesNotMatch(py, /print\(sql\)|print\(raw\)|print\(.*email/);
});
