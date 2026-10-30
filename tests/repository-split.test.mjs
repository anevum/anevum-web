import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,unlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const script=resolve('scripts/ops/split-project.mjs');
const manifest=JSON.parse(readFileSync('scripts/ops/repo-catalog.json','utf8'));
const git=(cwd,...argv)=>execFileSync('git',argv,{cwd,encoding:'utf8'}).trim();
const invoke=(...argv)=>spawnSync(process.execPath,[script,...argv],{encoding:'utf8',timeout:60000});

function fixture(){
 const top=mkdtempSync(join(tmpdir(),'anevum-repo-extraction-'));
 const source=join(top,'original');
 mkdirSync(source);
 git(source,'init','--initial-branch=main');
 git(source,'config','user.name','Test fixture');
 git(source,'config','user.email','test@example.invalid');
 const project=join(source,'games','brandle');
 mkdirSync(join(project,'.github','workflows'),{recursive:true});
 writeFileSync(join(source,'README.md'),'This is unrelated to Brandle\n');
 writeFileSync(join(project,'README.md'),'# Brandle\n');
 writeFileSync(join(project,'LICENSE'),'Fixture Apache-2.0\n');
 writeFileSync(join(project,'.github','workflows','ci.yml'),'name: CI\n');
 git(source,'add','.');
 git(source,'commit','-m','initial game and unrelated root');
 writeFileSync(join(project,'logic.mjs'),'export const valid = true;\n');
 git(source,'add','.');
 git(source,'commit','-m','game logic improvement');
 return {top,source,project};
}

test('cataloged projects carry independent CI and source licenses',()=>{
 assert.equal(manifest.source_repository,'anevum/anevum-web');
 assert.deepEqual(manifest.projects.map(p=>p.id).sort(),['brandle','cristybreathe']);
 assert.equal(new Set(manifest.projects.map(p=>p.target_repository)).size,2);
 for(const p of manifest.projects){
  assert.ok(existsSync(p.source_path+'/README.md'));
  assert.ok(existsSync(p.source_path+'/LICENSE'));
  assert.ok(existsSync(p.source_path+'/.github/workflows/ci.yml'));
 }
});

test('help does not create a repository or alter source',()=>{
 const result=invoke('--help');
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/--execute/);
});

test('preflight remains read-only; extraction exports scoped files and project history',()=>{
 const f=fixture();
 try{
  const output=join(f.top,'standalone');
  const before=git(f.source,'rev-parse','HEAD');
  const audit=invoke('--source',f.source,'--project','brandle');
  assert.equal(audit.status,0,audit.stderr);
  assert.equal(existsSync(output),false);
  const exported=invoke('--source',f.source,'--project','brandle','--execute','--output',output);
  assert.equal(exported.status,0,exported.stderr);
  assert.ok(existsSync(join(output,'README.md')));
  assert.ok(existsSync(join(output,'LICENSE')));
  assert.ok(existsSync(join(output,'.github','workflows','ci.yml')));
  assert.ok(existsSync(join(output,'logic.mjs')));
  assert.equal(existsSync(join(output,'games')),false);
  assert.equal(git(f.source,'rev-parse','HEAD'),before);
  assert.equal(git(f.source,'status','--porcelain'),'');
  assert.equal(git(output,'status','--porcelain'),'');
  const logs=git(output,'log','--format=%s');
  assert.match(logs,/game logic improvement/);
  assert.match(logs,/initial game and unrelated root/);
  assert.equal(git(output,'ls-files').includes('games/brandle'),false);
  const overwrite=invoke('--source',f.source,'--project','brandle','--execute','--output',output);
  assert.notEqual(overwrite.status,0);
  assert.match(overwrite.stderr,/Destination must be new/);
 } finally {rmSync(f.top,{recursive:true,force:true})}
});

test('preflight rejects historical credential filenames even after removal',()=>{
 const f=fixture();
 try{
  const secret=join(f.project,'.env.production');
  writeFileSync(secret,'FAKE_SECRET_TEST_ONLY=redacted\n');
  git(f.source,'add','.');
  git(f.source,'commit','-m','add fake credential file to fixture');
  unlinkSync(secret);
  git(f.source,'add','-u');
  git(f.source,'commit','-m','remove fake credential file');
  const audit=invoke('--source',f.source,'--project','brandle');
  assert.notEqual(audit.status,0);
  assert.match(audit.stderr,/Unsafe historical filename/);
 } finally {rmSync(f.top,{recursive:true,force:true})}
});

test('preflight rejects uncommitted project modifications and unrecognized projects',()=>{
 const f=fixture();
 try{
  writeFileSync(join(f.project,'logic.mjs'),'uncommitted update\n');
  const audit=invoke('--source',f.source,'--project','brandle');
  assert.notEqual(audit.status,0);
  assert.match(audit.stderr,/Uncommitted project changes/);
  const unknown=invoke('--source',f.source,'--project','ideaflow');
  assert.notEqual(unknown.status,0);
  assert.match(unknown.stderr,/Unknown project/);
 } finally {rmSync(f.top,{recursive:true,force:true})}
});
