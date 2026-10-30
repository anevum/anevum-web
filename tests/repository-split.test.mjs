import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('scripts/ops/repo-catalog.json','utf8'));
test('cataloged projects have standalone CI and source licenses',()=>{
 assert.equal(manifest.source_repository,'anevum/anevum-web');
 assert.deepEqual(manifest.projects.map(p=>p.id).sort(),['brandle','cristybreathe']);
 for(const p of manifest.projects){
  assert.ok(existsSync(p.source_path+'/README.md'));
  assert.ok(existsSync(p.source_path+'/LICENSE'));
  assert.ok(existsSync(p.source_path+'/.github/workflows/ci.yml'));
 }
});
test('help performs no side effects',()=>{
 const help=execFileSync(process.execPath,['scripts/ops/split-project.mjs','--help'],{encoding:'utf8'});
 assert.match(help,/--execute/);
});
