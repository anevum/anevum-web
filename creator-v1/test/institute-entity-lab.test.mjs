import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const demoRoot=resolve(repoRoot,'web/public/institute/lab');
const read=(file)=>readFileSync(resolve(demoRoot,file),'utf8');

test('Institute Lab has two named, nonindexable prototype routes',()=>{
  for(const page of ['index.html','observation-node-001.html','regulation-node-002.html']){
    const html=read(page);
    assert.match(html,/<html lang="en">/);
    assert.match(html,/noindex,nofollow,noarchive/);
    assert.doesNotMatch(html,/<script[^>]+src=/i);
  }
  for(const asset of ['observation-node-001.svg','regulation-node-002.svg']) assert.ok(existsSync(resolve(demoRoot,asset)));
});

test('Both nodes have distinct, accessible animated vector identities',()=>{
  const observation=read('observation-node-001.svg');
  const regulation=read('regulation-node-002.svg');
  assert.match(observation,/Observation Node 001/);
  assert.match(regulation,/Regulation Node 002/);
  assert.match(observation,/prefers-reduced-motion/);
  assert.match(regulation,/prefers-reduced-motion/);
  assert.notEqual(observation,regulation);
  assert.match(regulation,/obsidian/i);
});

test('Regulation prototype clearly separates synthetic triage from human decisions',()=>{
  const page=read('regulation-node-002.html');
  assert.match(page,/SYNTHETIC CASES ONLY/);
  assert.match(page,/SIMULATED STAFF REVIEW/);
  assert.match(page,/human authorization/i);
  assert.match(page,/server-configured forum reviewer grants/i);
  assert.doesNotMatch(page,/Cloudflare Access identity/);
  assert.match(page,/No action performed/);
  assert.match(page,/no report is filed/i);
  assert.match(page,/id="triage"/);
  assert.match(page,/id="review"/);
  assert.match(page,/id="notice"/);
  assert.doesNotMatch(page,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket\s*\(/);
  assert.doesNotMatch(page,/\blocalStorage\b|\bsessionStorage\b/);
});

test('Lab hub links only to local prototype nodes and keeps names provisional',()=>{
  const page=read('index.html');
  for(const linked of ['observation-node-001.html','regulation-node-002.html','observation-node-001.svg','regulation-node-002.svg']) assert.ok(page.includes('./'+linked));
  assert.match(page,/Provisional entity names/);
  assert.match(page,/No live activity/i);
});