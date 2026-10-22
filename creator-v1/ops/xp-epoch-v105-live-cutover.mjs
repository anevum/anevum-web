// ANEVUM.OPS.MAINT.2026-10-22.001.FINAL-XP-RESET
// Surgical, source-pinned Worker patch. This file never deploys traffic or modifies D1.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const ACCOUNT='2f7ee83107240152097efd956a4e8335';
export const WORKER='anevum-apex-prelaunch-gateway';
export const LIVE='93cc7f07-cf39-457e-af69-c9f6f4c02d25';
export const LIVE_ETAG='2c02ac225ced8bdecd764da9c878c7dd32d0cb0d32b8dc476206ef990f25e40a';
export const INACTIVE='7b9dbcdf-0fbd-4cbc-8e98-184724324553';
export const SOURCE='a0483173eef35077bbcf04123438d6d34c5f409b';
const sha=s=>createHash('sha256').update(s).digest('hex');
const BASE='/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER;

export function patchLiveBundle(input){
 assert.equal(typeof input,'string');
 assert.ok(input.length>2000000 && input.length<3000000,'Unexpected live bundle size');
 let code=input;
 const changes=[];
 const only=(before,after,key)=>{
  assert.equal(code.split(before).length-1,1,'Source drift or duplicate: '+key);
  code=code.replace(before,after);changes.push(key);
 };
 const edit=(name,transform)=>{
  const begin=code.indexOf((name==='publicMemberColumns'||name==='notification'?'function ':'async function ')+name+'(');
  const sentinel='__name('+name+', "'+name+'");';
  const end=code.indexOf(sentinel,begin);
  assert.ok(begin>0&&end>begin&&end-begin<20000,'Missing or changed function: '+name);
  const prior=code.slice(begin,end);
  const next=transform(prior);
  assert.ok(next!==prior && next.includes(name+'('),'No patch for '+name);
  code=code.slice(0,begin)+next+code.slice(end);
  changes.push(name);
 };
 const epoch=[
  'async function progressionReset(db) {',
  '  try {',
  '    const row = await db.prepare("SELECT cutoff_event_id,cutoff_at FROM member_progression_reset_epoch WHERE epoch=1").bind().first();',
  '    if (!row) return null;',
  '    const cutoffEventId=Number(row.cutoff_event_id),cutoffAt=Number(row.cutoff_at);',
  '    if (!Number.isSafeInteger(cutoffEventId)||cutoffEventId<0||!Number.isSafeInteger(cutoffAt)||cutoffAt<=0) throw Error("Invalid XP reset epoch");',
  '    return {cutoffEventId,cutoffAt};',
  '  } catch(err2) {',
  '    if (/no such table:\\s*member_progression_reset_epoch/i.test(String(err2?.message||err2))) return null;',
  '    throw err2;',
  '  }',
  '}',
  '__name(progressionReset, "progressionReset");'
 ].join('\n')+'\n';
 const point='async function readProgression(db, id) {';
 only(point,epoch+point,'epoch helper');
 edit('readProgression',()=>[
  'async function readProgression(db,id) {',
  '  const reset=await progressionReset(db);',
  '  const earned=await rows2(db,reset?"SELECT milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id=?":"SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?",id);',
  '  let total;',
  '  if (reset) {',
  '    total=await db.prepare("SELECT COALESCE(SUM(amount),0) AS xp FROM member_xp_events WHERE user_id=? AND id>?").bind(id,reset.cutoffEventId).first();',
  '  } else {',
  '    try {total=await db.prepare("SELECT xp FROM member_xp_totals WHERE user_id=?").bind(id).first();}',
  '    catch(err2) {',
  '      if (!/no such table:\\s*member_xp_totals/i.test(String(err2?.message||err2))) throw err2;',
  '      total=await db.prepare("SELECT COALESCE(SUM(amount),0) AS xp FROM member_xp_events WHERE user_id=?").bind(id).first();',
  '    }',
  '  }',
  '  const milestoneXp=MILESTONES.reduce((n,a)=>n+(earned.some(e=>e.milestone===a.id)?a.xp:0),0),testXp=Number(total?.xp)||0;',
  '  return {...levelProgress(milestoneXp+testXp),testXp,milestoneXp,awards:MILESTONES.map(a=>({...a,earnedAt:earned.find(e=>e.milestone===a.id)?.earned_at??null}))};',
  '}',''
 ].join('\n'));
 edit('syncRewardNotifications',()=>[
  'async function syncRewardNotifications(db,id,now2) {',
  '  const p=await readProgression(db,id),reset=await progressionReset(db);',
  '  const prefix=reset?"evo60-e1-":"evo60-";',
  '  const last=await db.prepare("SELECT COALESCE(MAX(level),1) AS level FROM member_reward_notifications WHERE user_id=? AND kind=\'level\' AND reference LIKE ? AND level<=? AND created_at>?").bind(id,prefix+"%",p.level,reset?.cutoffAt??0).first();',
  '  const statements=p.awards.filter(a=>a.earnedAt!==null).map(a=>db.prepare("INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at) VALUES(?,\'award\',?,?)").bind(id,reset?"epoch1:"+a.id:a.id,a.earnedAt));',
  '  for(let level=Number(last?.level||1)+1;level<=p.level;level++)statements.push(db.prepare("INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,level,created_at) VALUES(?,\'level\',?,?,?)").bind(id,prefix+level,level,now2));',
  '  if(statements.length){const results2=await db.batch(statements);if(results2.some(r=>r.success===false))throw Error("Notification save unavailable");}',
  '  return p;',
  '}',''
 ].join('\n'));
 edit('notification',()=>[
  'function notification(row2) {',
  '  if(row2.kind==="level")return {id:row2.id,kind:"level",level:row2.level,title:"Level "+row2.level+" reached",detail:level_artifacts_default[row2.level-1]?.name??"Your continuance expands.",createdAt:row2.created_at};',
  '  const awardId=row2.reference.startsWith("epoch1:")?row2.reference.slice(7):row2.reference;',
  '  const a=MILESTONES.find(item=>item.id===awardId);',
  '  return {id:row2.id,kind:"award",award:awardId,title:a?.name??recognitionBadgeName(awardId)??"Badge earned",detail:a?"Badge earned · +"+a.xp+" XP":"Verified achievement recorded · badge earned",createdAt:row2.created_at};',
  '}',''
 ].join('\n'));
 edit('canonicalProgression',prior=>{
  let out=prior;
  const replace=(a,b,k)=>{assert.equal(out.split(a).length-1,1,'canonical drift '+k);out=out.replace(a,b);};
  replace('  try {\n    if (!await db.prepare("SELECT handle FROM member_creator_profiles', '  try {\n    const reset=await progressionReset(db);\n    if(path.endsWith("/xp-test")&&reset)return error3(404,"Not found");\n    if (!await db.prepare("SELECT handle FROM member_creator_profiles','reset gate');
  replace('testButtonEnabled: test }','testButtonEnabled: test && !reset }','flag');
  const a=out.indexOf('      const items = await rows2(db,');
  const b=out.indexOf('      return json2({ items: items.map(notification)',a);
  assert.ok(a>0&&b>a&&b-a<1300,'Canonical notice drift');
  out=out.slice(0,a)+[
    '      const visible=reset?',
    '        "((kind=\'award\' AND EXISTS(SELECT 1 FROM member_recognition_grants g WHERE g.user_id=member_reward_notifications.user_id AND g.kind=\'badge\' AND g.recognition_id=member_reward_notifications.reference AND g.revoked_at IS NULL)) OR (kind=\'award\' AND reference IN (\'epoch1:first_signal\',\'epoch1:world_shaper\') AND created_at>?) OR (kind=\'level\' AND reference LIKE \'evo60-e1-%\' AND level<=30 AND created_at>?))":',
    '        "(kind!=\'level\' OR (reference LIKE \'evo60-%\' AND level<=30))";',
    '      const args=reset?[reset.cutoffAt,reset.cutoffAt]:[];',
    '      const items=await rows2(db,"SELECT id,kind,reference,level,created_at FROM member_reward_notifications WHERE user_id=? AND id>? AND "+visible+" ORDER BY id LIMIT 24",user.id,after,...args);',
    '      const recent=await rows2(db,"SELECT id,kind,reference,level,created_at FROM member_reward_notifications WHERE user_id=? AND "+visible+" ORDER BY id DESC LIMIT 12",user.id,...args);'
  ].join('\n')+'\n'+out.slice(b);
  return out;
 });
 edit('grantMilestones',()=>[
  'async function grantMilestones(db,id,now2) {',
  '  const reset=await progressionReset(db);',
  '  if(reset){',
  '    await db.batch([',
  '      db.prepare("INSERT OR IGNORE INTO member_progression_epoch_milestones(epoch,user_id,milestone,earned_at) SELECT 1,?,\'first_signal\',? WHERE EXISTS(SELECT 1 FROM member_wall_posts WHERE user_id=? AND created_at>?)").bind(id,now2,id,reset.cutoffAt),',
  '      db.prepare("INSERT OR IGNORE INTO member_progression_epoch_milestones(epoch,user_id,milestone,earned_at) SELECT 1,?,\'world_shaper\',? WHERE EXISTS(SELECT 1 FROM member_creator_profiles WHERE user_id=? AND length(bio)>0 AND updated_at>?) AND (SELECT COUNT(*) FROM member_space_media WHERE user_id=? AND updated_at>?)=2").bind(id,now2,id,reset.cutoffAt,id,reset.cutoffAt)',
  '    ]);',
  '  } else {',
  '    await db.batch([',
  '      db.prepare("INSERT OR IGNORE INTO member_space_milestones(user_id,milestone,earned_at) SELECT ?, \'first_signal\', ? WHERE EXISTS(SELECT 1 FROM member_wall_posts WHERE user_id=?)").bind(id,now2,id),',
  '      db.prepare("INSERT OR IGNORE INTO member_space_milestones(user_id,milestone,earned_at) SELECT ?, \'world_shaper\', ? WHERE EXISTS(SELECT 1 FROM member_creator_profiles WHERE user_id=? AND length(bio)>0) AND (SELECT COUNT(*) FROM member_space_media WHERE user_id=?)=2").bind(id,now2,id,id)',
  '    ]);',
  '  }',
  '  if(await progressionReady(db))try{await syncRewardNotifications(db,id,now2);}catch{}',
  '}',''
 ].join('\n'));
 edit('spaceSnapshot',prior=>{
  const original='  const earned = await rows3(db, "SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?", id);';
  assert.equal(prior.split(original).length-1,1,'spaceSnapshot drift');
  return prior.replace(original,'  const reset=await progressionReset(db);\n  const earned=await rows3(db,reset?"SELECT milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id=?":"SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?",id);');
 });
 edit('memberRecognitionState',prior=>{
  const first='  const [pref, milestones2, issued] = await Promise.all([';
  const sql='    getRows(db, "SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?", userId),';
  assert.equal(prior.split(first).length-1,1,'recognition state drift1');
  assert.equal(prior.split(sql).length-1,1,'recognition state drift2');
  return prior.replace(first,'  const reset=await progressionReset(db);\n'+first).replace(sql,'    getRows(db,reset?"SELECT milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id=?":"SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?",userId),');
 });
 edit('publicRecognitionMap',prior=>{
  const first='  const marks = ids.map(() => "?").join(",");';
  const sql='    getRows(db, "SELECT user_id,milestone,earned_at FROM member_space_milestones WHERE user_id IN (" + marks + ")", ...ids),';
  assert.equal(prior.split(first).length-1,1,'recognition map drift1');
  assert.equal(prior.split(sql).length-1,1,'recognition map drift2');
  return prior.replace(first,first+'\n  const reset=await progressionReset(db);').replace(sql,'    getRows(db,(reset?"SELECT user_id,milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id IN (":"SELECT user_id,milestone,earned_at FROM member_space_milestones WHERE user_id IN (")+marks+")",...ids),');
 });
 edit('publicMemberColumns',()=>[
  'function publicMemberColumns(owner) {',
  '  if(!ownerColumns.has(owner))throw Error("Unsafe identity column");',
  '  return [',
  '    owner+" AS member_identity_key,s.featured_json,s.show_stats,",',
  '    "COALESCE((SELECT m.version FROM member_space_media m WHERE m.user_id="+owner+" AND m.slot=\'avatar\'),0) AS avatar_version,",',
  '    "(COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id="+owner+" AND x.id>COALESCE((SELECT cutoff_event_id FROM member_progression_reset_epoch WHERE epoch=1),-1)),0)+",',
  '    "COALESCE((SELECT SUM(CASE milestone WHEN \'first_signal\' THEN 10 WHEN \'world_shaper\' THEN 25 ELSE 0 END) FROM member_space_milestones z WHERE z.user_id="+owner+" AND NOT EXISTS(SELECT 1 FROM member_progression_reset_epoch WHERE epoch=1)),0)+",',
  '    "COALESCE((SELECT SUM(CASE milestone WHEN \'first_signal\' THEN 10 WHEN \'world_shaper\' THEN 25 ELSE 0 END) FROM member_progression_epoch_milestones z WHERE z.user_id="+owner+" AND z.epoch=1),0)) AS member_xp,",',
  '    "(SELECT GROUP_CONCAT(milestone) FROM (SELECT milestone FROM member_space_milestones e WHERE e.user_id="+owner+" AND NOT EXISTS(SELECT 1 FROM member_progression_reset_epoch WHERE epoch=1) AND e.milestone IN (\'first_signal\',\'world_shaper\') UNION ALL SELECT milestone FROM member_progression_epoch_milestones e WHERE e.user_id="+owner+" AND e.epoch=1 AND e.milestone IN (\'first_signal\',\'world_shaper\'))) AS earned_awards"',
  '  ].join(" ");',
  '}',''
 ].join('\n'));
 assert.deepEqual(changes,['epoch helper','readProgression','syncRewardNotifications','notification','canonicalProgression','grantMilestones','spaceSnapshot','memberRecognitionState','publicRecognitionMap','publicMemberColumns']);
 assert.ok(code.includes('member_progression_epoch_milestones')&&code.includes('id>?')&&code.includes('evo60-e1-'));
 assert.equal(code.split('async function progressionReset(').length-1,1);
 return {source:code,prior_sha256:sha(input),candidate_sha256:sha(code),patched_regions:changes,prior_bytes:Buffer.byteLength(input),candidate_bytes:Buffer.byteLength(code)};
}

async function api(token,method,path,body){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{
  method,headers:{Authorization:'Bearer '+token,...(body instanceof FormData?{}:body?{'content-type':'application/json'}:{})},
  ...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})
 });
 const data=await response.json();
 assert.ok(response.ok&&data.success!==false,'Cloudflare '+method+' '+path+' failed '+response.status+': '+JSON.stringify(data.errors||[]));
 return data.result;
}
function lockBindings(bindings){
 return bindings.map(b=>({name:b.name,type:b.type,value:b.type==='plain_text'?b.text:b.type==='d1'?(b.database_id||b.id):undefined})).sort((a,b)=>a.name.localeCompare(b.name));
}
export async function run(mode,token){
 assert.ok(['check','upload-inactive'].includes(mode));
 assert.ok(typeof token==='string'&&token.length>30,'Missing Cloudflare token');
 const dep=await api(token,'GET',BASE+'/deployments?per_page=1');
 const baseline=dep.deployments?.[0];
 assert.deepEqual(baseline?.versions,[{version_id:LIVE,percentage:100},{version_id:INACTIVE,percentage:0}],'Deployment changed; stop and re-review');
 const [v,snapshot,versions,source]=await Promise.all([
  api(token,'GET',BASE+'/versions/'+LIVE),
  api(token,'GET',BASE+'/settings'),
  api(token,'GET',BASE+'/versions?per_page=1'),
  api(token,'GET','/accounts/'+ACCOUNT+'/workers/workers/'+WORKER+'/versions/'+LIVE+'?include=modules')
 ]);
 assert.equal(v.resources.script.etag,LIVE_ETAG,'Live source ETag drift');
 assert.equal(source.main_module,'gateway.js');
 assert.equal(source.modules?.length,1);
 assert.equal(source.modules[0]?.content_type,'application/javascript+module');
 assert.equal(versions.items?.[0]?.id,INACTIVE,'Latest upload changed; stop and re-review');
 assert.deepEqual(lockBindings(v.resources.bindings),lockBindings(snapshot.bindings),'Live bindings and settings differ');
 assert.equal(v.resources.script_runtime?.compatibility_date,'2026-10-17');
 assert.deepEqual(v.resources.script_runtime?.compatibility_flags,['nodejs_compat']);
 const prior=Buffer.from(source.modules[0].content_base64,'base64').toString('utf8');
 const result=patchLiveBundle(prior);
 const meta={
  main_module:'gateway.js',
  compatibility_date:'2026-10-17',
  compatibility_flags:['nodejs_compat'],
  usage_model:'standard',
  keep_assets:true,
  bindings:v.resources.bindings.map(b=>{
    if(b.type==='secret_text')return {name:b.name,type:'inherit'};
    if(b.type==='d1')return {name:b.name,type:'d1',database_id:b.database_id||b.id};
    if(b.type==='assets')return {name:b.name,type:'assets'};
    if(b.type==='plain_text')return {name:b.name,type:'plain_text',text:b.name==='CANONICAL_XP_TEST_ENABLED'?'false':b.text};
    throw Error('Unsupported binding type: '+b.name);
  }),
  annotations:{'workers/message':'ANEVUM V105 XP epoch reset; protected inactive, preserved production code + assets'}
 };
 assert.equal(meta.bindings.find(b=>b.name==='CANONICAL_XP_TEST_ENABLED')?.text,'false');
 assert.ok(meta.bindings.some(b=>b.name==='MEMBER_DB'&&b.database_id==='e1d29049-c83b-4534-8355-dc1fa36ba6d8'));
 const receipt={mode,source_pr:618,approved_merge:SOURCE,baseline_deployment:baseline.id,live_version:LIVE,
  ...Object.fromEntries(Object.entries(result).filter(([k])=>k!=='source'))};
 if(mode==='check'){
  if(process.env.REVIEW_CANDIDATE_FILE)writeFileSync(process.env.REVIEW_CANDIDATE_FILE,result.source,{mode:0o600});
  return {...receipt,read_only:true};
 }
 assert.equal(process.env.GITHUB_REPOSITORY,'anevum/anevum-web');
 assert.equal(process.env.GITHUB_ACTOR,'anevum');
 assert.equal(process.env.GITHUB_REF,'refs/heads/release/v084-continuance-approved-20261019');
 assert.equal(process.env.GITHUB_HEAD_MESSAGE,'release(v105): upload non-destructive XP epoch candidate inactive');
 assert.ok(process.env.GITHUB_SHA);
 const immediate=await api(token,'GET',BASE+'/deployments?per_page=1');
 assert.deepEqual(immediate.deployments?.[0]?.versions,baseline.versions,'Concurrent deployment drift');
 assert.equal(immediate.deployments?.[0]?.id,baseline.id,'Deployment ID changed');
 const form=new FormData();
 form.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));
 form.append('gateway.js',new Blob([result.source],{type:'application/javascript+module'}),'gateway.js');
 const created=await api(token,'POST',BASE+'/versions?bindings_inherit=strict',form);
 assert.ok(typeof created?.id==='string'&&created.id.length===36,'Upload unacknowledged');
 const after=await api(token,'GET',BASE+'/deployments?per_page=1');
 assert.equal(after.deployments?.[0]?.id,baseline.id,'Traffic deployment changed after upload');
 assert.deepEqual(after.deployments?.[0]?.versions,baseline.versions,'Production traffic changed after upload');
 const candidate=await api(token,'GET',BASE+'/versions/'+created.id);
 const expected=lockBindings(v.resources.bindings).map(x=>x.name==='CANONICAL_XP_TEST_ENABLED'?{...x,value:'false'}:x);
 assert.deepEqual(lockBindings(candidate.resources.bindings),expected,'Candidate binding mismatch');
 assert.deepEqual(candidate.resources.script_runtime,v.resources.script_runtime,'Candidate runtime/asset configuration drift');
 const done={...receipt,status:'UPLOADED_INACTIVE_ONLY',candidate_version:created.id,traffic_changed:false};
 if(process.env.RECEIPT_FILE)writeFileSync(process.env.RECEIPT_FILE,JSON.stringify(done,null,2)+'\n',{mode:0o600});
 return done;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const mode=process.argv[2]||'check';
 run(mode,process.env.CLOUDFLARE_API_TOKEN).then(x=>{console.log(JSON.stringify(x));}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
