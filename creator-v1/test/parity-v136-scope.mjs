/** Successor gate. The original OV03/four-layer guards are not weakened. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const baseline='b429e6ab39665d51c8902878ff861f1a646df119';
const frozen='ec8ad65d687662fbc38cb0e2d6ea92875dd79ab9';
const allowed=new Map([
  ['.github/workflows/parity-v136-arrival-qa.yml','A'],
  ['creator-v1/test/parity-v136-scope.mjs','A'],
  ['creator-v1/test/parity-v136-browser.mjs','A'],
  ['creator-v1/web/src/components/ParityArrivalV136.tsx','A'],
  ['creator-v1/web/src/parity-v136.css','A'],
  ['creator-v1/web/src/main.tsx','M'],
  ['creator-v1/web/src/pages/CinematicLandingPage.tsx','M'],
  ['docs/production/parity-v136-20261024.md','A'],
  ['docs/production/parity-v136-reference-register.json','A']
]);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('merge-base','--is-ancestor',baseline,'HEAD');
const revision=process.argv.includes('--working-tree')?[]:['HEAD'];
const rows=git('diff','--name-status',baseline,...revision).split('\n').filter(Boolean);
for(const row of rows){
  const [status,path,...extra]=row.split('\t');
  assert.equal(extra.length,0,'Renames/copies are outside this increment');
  assert.equal(allowed.get(path),status,'Unreviewed source/status: '+row);
}
const frozenPaths=[
  '.github/workflows/continuance-next-review.yml',
  'creator-v1/web/src/experience/continuance-next',
  'creator-v1/web/review/continuance-next',
  'creator-v1/web/vite.continuance-next-review.config.ts',
  'creator-v1/test/continuance-next-isolation.test.mjs',
  'creator-v1/test/continuance-next-stack-integrity.mjs',
  '.github/workflows/continuance-next-stack-integrity.yml'
];
// The original OV03 files match their original checkpoint. Later stack audit
// files match V135 because they did not exist in OV03.
for(const path of frozenPaths){
  const ref=path.includes('stack-integrity')?baseline:frozen;
  // Compare every file present at that checkpoint. Later legitimate layers
  // added files to the directory; they are not part of the original OV03 set.
  const files=git('ls-tree','-r','--name-only',ref,'--',path).split('\n').filter(Boolean);
  assert.ok(files.length>0,'Missing frozen reference: '+path);
  for(const file of files)
    assert.equal(git('diff',ref,...revision,'--',file),'','Frozen source changed: '+file);
}
const receipt={session:'ANEVUM.WEB.BUILD.2026-10-24.001.PARITY-V136',baseline,
  head:git('rev-parse','HEAD'),workingTree:process.argv.includes('--working-tree'),
  scope:rows,frozenPaths,productionMutation:false};
mkdirSync('evidence/parity-v136',{recursive:true});
writeFileSync('evidence/parity-v136/scope.json',JSON.stringify(receipt,null,2)+'\n');
console.log('PASS V136 bounded successor scope; frozen OV03 preserved; '+rows.length+' paths');
