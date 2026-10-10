import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("D1 recovery workflow is manual-only and pinned to current main", () => {
  const source = read(".github/workflows/v5-preview-d1-backup-restore.yml");
  assert.match(source, /workflow_dispatch:\s*\n\s+inputs:/);
  assert.doesNotMatch(source, /^\s+(?:push|pull_request|schedule):\s*$/m);
  assert.match(source, /inputs\.confirmation == 'BACKUP_PREVIEW_ONLY'/);
  assert.match(source, /inputs\.reviewed_head_sha == github\.sha/);
  assert.match(source, /github\.ref == 'refs\/heads\/main'/);
  assert.match(source, /git ls-remote origin refs\/heads\/main/);
  assert.match(source, /anevum-members-preview/);
  assert.match(source, /a537432e-d216-4b31-8b22-19662cc3a44a/);
  assert.match(source, /ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED/);
  assert.match(source, /ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED/);
  assert.doesNotMatch(source, /wrangler d1 migrations apply|d1\/database\/\$\{?preview\}?\/import|\/time_travel\/restore/);
});

test("only encrypted backup can be uploaded and must be downloaded and restored", () => {
  const source = read(".github/workflows/v5-preview-d1-backup-restore.yml");
  assert.match(source, /verify-v5-preview-export-backup\.py verify-sql/);
  assert.match(source, /verify-v5-preview-export-backup\.py encrypt-sql/);
  assert.match(source, /rm -f "\$private_sql"/);
  assert.match(source, /uses: actions\/upload-artifact@v4/);
  assert.match(source, /uses: actions\/download-artifact@v4/);
  assert.match(source, /verify-v5-preview-export-backup\.py verify-encrypted/);
  assert.match(source, /ANEVUM_PREVIEW_BACKUP_FERNET_KEY/);
  assert.match(source, /retention-days: 30/);
  const upload = source.split("      - name: Upload encrypted preview SQL only")[1]?.split("      - name: Re-download encrypted archive")[0];
  assert.ok(upload, "missing strictly scoped encrypted upload");
  assert.match(upload, /path: .*\.fernet/);
  assert.doesNotMatch(upload, /\.sql\s*$|\.json\s*$/m);
  assert.doesNotMatch(source, /print\(.*signed_url|echo.*signed_url/);
});

test("production and staging releases are manually gated separately", () => {
  for (const path of [
    ".github/workflows/member-staging-bootstrap.yml",
    ".github/workflows/deploy-production.yml",
  ]) {
    const source = read(path);
    assert.match(source, /inputs\.reviewed_head_sha == github\.sha/);
    assert.match(source, /git ls-remote origin refs\/heads\/main/);
  }
  const prod = read(".github/workflows/deploy-production.yml");
  assert.match(prod, /inputs\.rollback_confirmed == 'PRODUCTION_ROLLBACK_VERIFIED'/);
  assert.doesNotMatch(prod, /^\s+push:\s*$/m);
});
