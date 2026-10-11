import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const read = path => readFileSync(new URL("../" + path, import.meta.url),"utf8");
const workflow = read(".github/workflows/v5-disposable-d1-restore-acceptance.yml");
const runner = read("scripts/v5-disposable-d1-restore.py");

test("remote D1 restoration is an explicitly reviewed main-only manual operation",()=>{
  const trigger=workflow.split("\npermissions:")[0];
  assert.match(trigger,/^on:\s*\n\s*workflow_dispatch:/m);
  assert.doesNotMatch(trigger,/^\s*pull_request:|^\s*push:|^\s*schedule:/m);
  for(const item of [
    "RESTORE_DISPOSABLE_D1_ONLY",
    "ENCRYPTED_PREVIEW_BACKUP_VERIFIED",
    "I_AUTHORIZE_PREVIEW_DATA_IN_DISPOSABLE_D1",
    "DELETE_ONLY_CREATED_DISPOSABLE"
  ])assert.match(workflow,new RegExp(item));
  assert.match(workflow,/inputs\.reviewed_head_sha == github\.sha/);
  assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow,/git ls-remote origin refs\/heads\/main/);
  assert.match(workflow,/\.head_sha == \$sha/);
  assert.match(workflow,/\.conclusion == "success"/);
  assert.match(workflow,/\.expired == false/);
  assert.match(workflow,/gh run download "\$BACKUP_RUN_ID"/);
  assert.match(workflow,/if: always\(\)/);
  assert.match(workflow,/scripts\/v5-disposable-d1-restore\.py cleanup/);
  assert.match(workflow,/cancel-in-progress: false/);
});

test("restoration writes only to freshly owned disposable DB and never to preview/production",()=>{
  assert.match(runner,/def verify_target\(/);
  assert.match(runner,/db_uuid not in \(PRODUCTION, PREVIEW\)/);
  assert.match(runner,/def database_resource\(/);
  assert.match(runner,/def create_marker\(/);
  assert.match(runner,/os\.O_EXCL/);
  assert.match(runner,/def read_marker\(/);
  assert.match(runner,/def cleanup\(/);
  assert.match(runner,/record\.get\("uuid"\) == db_uuid/);
  assert.match(runner,/record\.get\("name"\) == name/);
  assert.match(runner,/api\("DELETE", account, token, resource\)/);
  assert.match(runner,/api\("GET", account, token, resource, missing_ok=True\) is None/);
  assert.match(runner,/verify_remote\(/);
  assert.match(runner,/PRAGMA foreign_key_check/);
  assert.match(runner,/PRAGMA integrity_check/);
  assert.match(runner,/EXPECTED_LEDGER/);
  assert.match(runner,/verified_upload_url/);
  assert.match(runner,/hashlib\.md5/);
  assert.match(runner,/Cache-Control|private archive|unbound|No Worker binding/);
  assert.doesNotMatch(workflow,/wrangler deploy|wrangler d1 migrations apply|--remote.*wrangler d1 execute/);
});

test("source keeps sensitive SQL in memory, never exposes archive or member identifiers",()=>{
  assert.match(runner,/Fernet\(key\.encode\("ascii"\)\)\.decrypt/);
  assert.match(runner,/module\.verify_restore\(raw\)/);
  assert.match(runner,/verify_remote\(lambda statement: query/);
  assert.match(runner,/NoRedirect/);
  assert.match(runner,/urlsplit/);
  assert.match(runner,/MAX_SQL_BYTES/);
  assert.doesNotMatch(workflow,/upload-artifact|::set-output|echo.*(sql|signed_url)/i);
  assert.doesNotMatch(runner,/print\((raw|sql|token|record|signed_url)\)/);
  assert.equal(JSON.parse(read("wrangler.jsonc")).vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(JSON.parse(read("wrangler.member-staging.jsonc")).vars.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
});

test("offline validation rejects protected DB, bad upload hosts and false restore proof",()=>{
  const process=spawnSync("python3",["scripts/v5-disposable-d1-restore.py","selftest"],{
    cwd:new URL("..",import.meta.url),encoding:"utf8",timeout:10_000,
    env:{...globalThis.process.env,
      GITHUB_EVENT_NAME:"pull_request",CLOUDFLARE_ACCOUNT_ID:"",CLOUDFLARE_D1_TOKEN:""}
  });
  assert.equal(process.status,0,process.stderr.slice(0,500));
  assert.match(process.stdout,/PASS: disposable-only target validation/);
});
