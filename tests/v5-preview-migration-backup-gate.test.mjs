import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

for(const file of [
  ".github/workflows/member-preview-d1-migrate.yml",
  ".github/workflows/member-alpaca-review-d1-migrate.yml",
]){
  test(file+" requires a successful independently restored backup before remote apply",()=>{
    const source=read(file);
    assert.match(source,/workflow_dispatch:/);
    assert.match(source,/backup_run_id:/);
    assert.match(source,/backup_reviewed:/);
    assert.match(source,/PREVIEW_BACKUP_VERIFIED/);
    assert.match(source,/inputs\.reviewed_head_sha == github\.sha/);
    assert.match(source,/actions: read/);
    assert.match(source,/GH_TOKEN: \$\{\{ github\.token \}\}/);
    assert.match(source,/\.head_sha == \$sha/);
    assert.match(source,/\.conclusion == "success"/);
    assert.match(source,/\.name == "ANEVUM V5 Preview D1 Encrypted Backup and Restore Test"/);
    assert.match(source,/\.expired == false and \.size_in_bytes > 1024/);
    const safety=source.indexOf("Verify independently restorable encrypted preview backup");
    const safetyReview=source.indexOf("Verify successful archived preview D1 backup before 0005 review migration");
    const firstSafety=Math.max(safety,safetyReview);
    const write=source.indexOf("npx wrangler d1 migrations apply MEMBER_DB");
    assert.ok(firstSafety>0&&write>firstSafety,"backup attestation must run before D1 write");
    assert.doesNotMatch(source,/d1 migrations apply MEMBER_DB --remote --config wrangler\.jsonc/);
  });
}
