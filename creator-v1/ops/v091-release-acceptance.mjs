/** Read-only release gate. Never interprets roles, fixture sessions or a green
 * public canary as proof of an authenticated creator/staff browser journey. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const V091_APPLICATION_SOURCE='09d3d890786b1960ed333fe73f09d163c6d7d55d';
export const V091_SOURCE_BASELINE='db2b8c0f8f79061adf1677986b87077856204267';
export const V091_RELEASE_METADATA=Object.freeze([
  '.github/workflows/v084-continuance-production.yml',
  '.github/workflows/v091-live-readonly-qa.yml',
  '.github/release-evidence/v091-authenticated.json',
  'creator-v1/ops/v091-release-acceptance.mjs',
  'creator-v1/test/v091-release-acceptance.test.mjs'
]);
const literalPath=path=>typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&
  path.split('/').every(part=>part&&part!=='.'&&part!=='..');
export function reviewedV091SourceFiles(release){
  if(typeof release!=='string')throw Error('V091 source scope requires the production workflow.');
  const lines=release.split(/\r?\n/).map(line=>line.trim());
  const start=lines.indexOf("diff -u <(printf '%s\\n' \\");
  const end=lines.indexOf('<(git diff --name-only '+V091_SOURCE_BASELINE+' HEAD)',start+1);
  if(start<0||end<=start+1)throw Error('V091 static source scope or baseline is missing.');
  const entries=lines.slice(start+1,end),files=entries.map((line,index)=>{
    const match=/^'([^']+)'(\))? \\$/.exec(line);
    if(!match||!literalPath(match[1])||Boolean(match[2])!==(index===entries.length-1))
      throw Error('V091 source scope accepts only literal file paths.');
    return match[1];
  });
  const sorted=[...files].sort();
  if(new Set(files).size!==files.length||files.some((file,index)=>file!==sorted[index]))
    throw Error('V091 source scope must be unique and sorted.');
  return files;
}
/** Independent source-only validation. It never treats checked-in flags or
 * synthetic sessions as authenticated acceptance and never changes evidence. */
export function verifyV091SourceScope({release,recordedSource,changedFiles,applicationChangedFiles,
  applicationIsAncestor,baselineIsAncestor}){
  if(recordedSource!==V091_APPLICATION_SOURCE)throw Error('V091 source evidence pin is stale.');
  if(applicationIsAncestor!==true||baselineIsAncestor!==true)
    throw Error('V091 application and baseline must be ancestors of the checked-out source.');
  const files=reviewedV091SourceFiles(release),lines=release.split(/\r?\n/).map(line=>line.trim());
  if(!lines.includes('node creator-v1/ops/v091-release-acceptance.mjs')||
      lines.some(line=>line.includes('v091-release-acceptance.mjs --source-only')))
    throw Error('V091 production must run authenticated acceptance, never source-only acceptance.');
  if(!lines.includes('git merge-base --is-ancestor '+V091_APPLICATION_SOURCE+' HEAD'))
    throw Error('V091 production ancestry pin is stale.');
  const command='git diff --exit-code '+V091_APPLICATION_SOURCE+' HEAD -- . \\';
  const start=lines.indexOf(command);
  const expected=V091_RELEASE_METADATA.map((file,index)=>"':(exclude)"+file+"'"+
    (index===V091_RELEASE_METADATA.length-1?'':' \\'));
  if(start<0||expected.some((line,index)=>lines[start+1+index]!==line))
    throw Error('V091 application delta must use exactly the five reviewed metadata exclusions.');
  for(const paths of [changedFiles,applicationChangedFiles])
    if(!Array.isArray(paths)||paths.some(path=>!literalPath(path))||new Set(paths).size!==paths.length)
      throw Error('V091 git source inventory must contain unique literal paths.');
  const missing=changedFiles.filter(file=>!files.includes(file)),extra=files.filter(file=>!changedFiles.includes(file));
  if(missing.length||extra.length)throw Error('V091 static source scope differs from git; missing: '+
    (missing.join(', ')||'none')+'; extra: '+(extra.join(', ')||'none'));
  const drift=applicationChangedFiles.filter(file=>!V091_RELEASE_METADATA.includes(file));
  if(drift.length)throw Error('V091 application changed after its source pin: '+drift.join(', '));
  return {applicationSource:V091_APPLICATION_SOURCE,baseline:V091_SOURCE_BASELINE,changedFiles:files.length};
}
export function verifyV091GitSourceScope(){
  const cwd=fileURLToPath(new URL('../../',import.meta.url));
  const git=args=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const paths=(base)=>git(['diff','--name-only','-z',base,'HEAD']).split('\0').filter(Boolean);
  // Missing/shallow history must fail, never skip the source lock.
  try{
    git(['merge-base','--is-ancestor',V091_SOURCE_BASELINE,V091_APPLICATION_SOURCE]);
    git(['merge-base','--is-ancestor',V091_APPLICATION_SOURCE,'HEAD']);
  }catch{throw Error('V091 source ancestry could not be verified; full Git history and the reviewed pin are required.');}
  const record=JSON.parse(readFileSync(new URL('../../.github/release-evidence/v091-authenticated.json',import.meta.url),'utf8'));
  return verifyV091SourceScope({
    release:readFileSync(new URL('../../.github/workflows/v084-continuance-production.yml',import.meta.url),'utf8'),
    recordedSource:record.source_sha,changedFiles:paths(V091_SOURCE_BASELINE),
    applicationChangedFiles:paths(V091_APPLICATION_SOURCE),applicationIsAncestor:true,baselineIsAncestor:true
  });
}
export function verifyV091Acceptance(record){
  if(record?.source_sha!==V091_APPLICATION_SOURCE)throw Error('V091 acceptance does not match the pinned application source.');
  for(const gate of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity']){
    if(record[gate]!==true)throw Error('V091 authenticated release gate remains unverified: '+gate);
  }
  if(typeof record.verified_at!=='string'||!Number.isFinite(Date.parse(record.verified_at))||Date.parse(record.verified_at)>Date.now())
    throw Error('V091 acceptance requires an actual verification timestamp.');
  if(!Array.isArray(record.evidence)||record.evidence.length<1||record.evidence.some(ref=>
    typeof ref!=='string'||!/^https:\/\/github\.com\/anevum\/anevum-web\/(?:actions\/runs\/\d+(?:\/artifacts\/\d+)?|pull\/554#issuecomment-\d+)$/.test(ref)))
    throw Error('V091 acceptance requires recorded repository evidence, without session credentials.');
  return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const args=process.argv.slice(2);
  if(args.length>1||(args.length===1&&args[0]!=='--source-only'))
    throw Error('V091 release gate accepts only an optional --source-only argument.');
  if(args[0]==='--source-only'){
    console.log('V091_SOURCE_SCOPE=PASS '+JSON.stringify(verifyV091GitSourceScope()));
  }else{
    verifyV091Acceptance(JSON.parse(readFileSync(new URL('../../.github/release-evidence/v091-authenticated.json',import.meta.url),'utf8')));
    console.log('V091_AUTHENTICATED_ACCEPTANCE=PASS');
  }
}
