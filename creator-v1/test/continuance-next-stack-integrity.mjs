/**
 * ANEVUM NEXT 010 — fail-closed audit of the ordered, default-off PR stack.
 * Read-only Git history: no Github API token, HTTP, filesystem writes to app
 * sources, Workers, member sessions, D1 migrations or XP. This does not
 * replace the frozen OV03 source guard in PR #676.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';

const ROOT='ad0d3aef473e12c124b003d2c3bb45b79bff520e';
const OV03='ec8ad65d687662fbc38cb0e2d6ea92875dd79ab9';
const COMMUNITY='ca4408cc8b040319e504efc2aab2aa96e84f8a85';
const LIVING='246d9940d4ee92abac6e4ebd443defc4a77cb4a8';
const paths={
  ov03:[
    '.github/workflows/continuance-next-review.yml',
    'creator-v1/test/capture-continuance-next.py',
    'creator-v1/test/continuance-next-action-lens.test.mjs',
    'creator-v1/test/continuance-next-isolation.test.mjs',
    'creator-v1/web/review/continuance-next/index.html',
    'creator-v1/web/src/experience/continuance-next/ActionLens.tsx',
    'creator-v1/web/src/experience/continuance-next/ContinuanceReview.tsx',
    'creator-v1/web/src/experience/continuance-next/action-lens.ts',
    'creator-v1/web/src/experience/continuance-next/review-main.tsx',
    'creator-v1/web/src/experience/continuance-next/tokens.css',
    'creator-v1/web/vite.continuance-next-review.config.ts',
    'docs/production/continuance-next-ov03-20261023.md'
  ],
  community:[
    'creator-v1/web/review/continuance-community-profile/index.html',
    'creator-v1/web/review/continuance-community-profile/motion-atelier.html',
    'docs/production/continuance-community-profile-concept-20261023.md',
    'docs/production/continuance-motion-atelier-concept-20261023.md'
  ],
  living:[
    '.github/workflows/continuance-next-living-commons-review.yml',
    'creator-v1/test/continuance-next-living-commons-actions.test.mjs',
    'creator-v1/test/continuance-next-living-commons-source.test.mjs',
    'creator-v1/web/review/continuance-community-profile/living-commons.html',
    'creator-v1/web/src/experience/continuance-next/living-commons-action-graph.ts',
    'docs/production/continuance-next-living-commons-20261023.md'
  ],
  react:[
    '.github/workflows/continuance-next-commons-react-review.yml',
    '.github/workflows/continuance-next-stack-integrity.yml',
    'creator-v1/test/continuance-next-community-browser.mjs',
    'creator-v1/test/continuance-next-community-model.test.mjs',
    'creator-v1/test/continuance-next-community-react.test.mjs',
    'creator-v1/test/continuance-next-navigator-browser.mjs',
    'creator-v1/test/continuance-next-navigator.test.mjs',
    'creator-v1/test/continuance-next-stack-integrity.mjs',
    'creator-v1/web/src/lib/commons-next-model.ts',
    'creator-v1/web/src/pages/CommonsQuickNavigator.tsx',
    'creator-v1/web/src/pages/CommunityNextReviewPage.tsx',
    'creator-v1/web/src/pages/commons-quick-navigator.css',
    'creator-v1/web/src/pages/community-next-review.css',
    'docs/production/continuance-commons-navigator-20261023.md',
    'docs/production/continuance-next-commons-react-20261023.md',
    'docs/production/continuance-next-stack-integrity-20261023.md'
  ]
};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4*1024*1024}).trim();
const additions=list=>list.map(file=>({status:'A',file}));
const rowsFor=(raw)=>{
  const seen=new Set();
  return raw.split(/\r?\n/).filter(Boolean).map(line=>{
    const pieces=line.split('\t');
    assert.equal(pieces.length,2,'Invalid or renamed row: '+line);
    const [status,file]=pieces;
    assert.match(status,/^[AM]$/,'Only approved adds/modifications allowed: '+line);
    assert.ok(file&&!seen.has(file),'Invalid duplicate path: '+line);
    seen.add(file);
    return {status,file};
  });
};
const ordered=rows=>rows.map(({status,file})=>status+'\t'+file).sort();
function proveLayer(name,actual,expected){
  assert.deepEqual(ordered(actual),ordered(expected),name+' file scope/status differs');
  return {name,files:actual.length,modified:actual.filter(x=>x.status==='M').length};
}
function rejectCase(label,rows,expected){
  assert.throws(()=>proveLayer(label,rows,expected),{name:'AssertionError'});
}
function selfTest(){
  const baseline=additions(['a.mjs','b.css']);
  proveLayer('reference',baseline,baseline);
  rejectCase('unauthorized path',additions(['a.mjs','worker.js']),baseline);
  rejectCase('missing path',additions(['a.mjs']),baseline);
  rejectCase('modified instead of added',[{status:'M',file:'a.mjs'},baseline[1]],baseline);
  rejectCase('deletion of protected file',rowsFor('A\ta.mjs\nA\tb.css\nM\tworker.js'),baseline);
  assert.throws(()=>rowsFor('R100\told\tnew'));
  assert.throws(()=>rowsFor('D\ta.mjs'));
  assert.throws(()=>rowsFor('A\ta.mjs\nA\ta.mjs'));
  console.log('PASS stack-scope test: unauthorized/missing/mutated/renamed/deleted paths rejected');
}
if(process.argv.includes('--self-test')){
  selfTest();
}else{
  selfTest();
  const head=git('rev-parse','HEAD');
  const ciHead=process.env.NEXT_STACK_HEAD_SHA;
  const ciBase=process.env.NEXT_STACK_BASE_SHA;
  assert.match(ciHead||'',/^[0-9a-f]{40}$/,'Must bind exact CI PR head');
  assert.equal(head,ciHead,'Checked-out commit does not equal triggering PR head');
  assert.equal(ciBase,LIVING,'PR #679 must remain stacked directly on the verified #678 head');
  const stages=[
    {name:'676 OV03 independent source',from:ROOT,to:OV03,expected:additions(paths.ov03)},
    {name:'677 Community/Profile',from:OV03,to:COMMUNITY,expected:additions(paths.community)},
    {name:'678 Living Commons concept',from:COMMUNITY,to:LIVING,expected:additions(paths.living)},
    {name:'679 real React bridge',from:LIVING,to:head,expected:[
      ...additions(paths.react),{status:'M',file:'creator-v1/web/src/App.tsx'}
    ]}
  ];
  const reports=[],all=[];
  for(const stage of stages){
    assert.equal(git('merge-base',stage.from,stage.to),stage.from,stage.name+' must be fast-forward ancestry');
    const actual=rowsFor(git('diff','--no-renames','--name-status',stage.from,stage.to));
    reports.push({...proveLayer(stage.name,actual,stage.expected),base:stage.from,head:stage.to});
    all.push(...actual);
  }
  assert.equal(new Set(all.map(x=>x.file)).size,all.length,'One path must not be owned by two layers');
  proveLayer('Full V131-to-NEXT union',rowsFor(git('diff','--no-renames','--name-status',ROOT,head)),all);
  // PR #676's exact approved source and its unchanged frozen guard must survive.
  assert.equal(git('diff','--no-renames','--name-only',OV03,head,'--',...paths.ov03),'','Protected OV03 foundation was modified by a child PR');
  const app=git('show',head+':creator-v1/web/src/App.tsx');
  assert.ok(app.includes('VITE_LIVING_COMMONS_REVIEW==="true"'),'The Commons must require an explicit build-time opt-in');
  assert.ok(app.includes('LivingCommonsReviewPage&&<Route path="__review/commons"'),'Review route must be opt-in and isolated');
  const total=reports.reduce((sum,item)=>sum+item.files,0);
  assert.equal(total,39,'Unexpected cumulative file count');
  const receipt={session:'ANEVUM.WEB.BUILD.2026-10-23.010.STACK-INTEGRITY',status:'PASS',head,root:ROOT,parentReviewBase:ciBase,originalOv03Guard:'PRESERVED; not waived or replaced',protectedV131OutOfScopeChanges:0,scope:{totalFiles:total,added:total-1,modified:1},layers:reports,productionAcceptance:false,changesToMemberData:false};
  const out='evidence/continuance-next-stack';
  mkdirSync(out,{recursive:true});
  writeFileSync(out+'/scope-receipt.json',JSON.stringify(receipt,null,2)+'\n');
  console.log('PASS four ordered NEXT layers; '+total+' exact scoped paths; no V131 runtime changes');
}
