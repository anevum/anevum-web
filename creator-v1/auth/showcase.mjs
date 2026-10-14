// Authenticated member-only creator showcase preferences. Requires migration 0015.
// This endpoint records presentation choices; no XP, awards or artifact inventory
// is ever minted or transferred here.
import {progressionFromXp,earnedArtifactsThroughLevel} from './community.mjs';
import {deriveAchievements} from './social.mjs';

const PATH='/api/v1/member/showcase';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const response=(req,data,status=200)=>new Response(req.method==='HEAD'?null:JSON.stringify(data),{status,headers:HEADERS});
const sql=(db,statement,params=[])=>{
 const item=db.prepare(statement);
 return params.length?item.bind(...params):item;
};
async function rows(db,statement,params=[]){
 const result=await sql(db,statement,params).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Showcase storage unavailable');
 return result.results;
}
async function statsFor(db,id){
 const profile=await rows(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND status='active' LIMIT 1",[id]);
 if(profile.length!==1)return null;
 const [ratings,projects,releases,xp]=await Promise.all([
  rows(db,"SELECT COUNT(*) AS n FROM community_project_votes WHERE member_id=? AND status='active'",[id]),
  rows(db,`SELECT COUNT(*) AS n FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
   WHERE p.owner_member_id=? AND p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`,[id]),
  rows(db,`SELECT COUNT(*) AS n FROM project_releases r JOIN projects p ON p.id=r.project_id
   JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.owner_member_id=?
   AND p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`,[id]),
  rows(db,"SELECT COALESCE(SUM(amount),0) AS n FROM community_xp_events WHERE member_id=?",[id])
 ]);
 return {ratings:Number(ratings[0]?.n||0),publishedProjects:Number(projects[0]?.n||0),
   releases:Number(releases[0]?.n||0),xp:Number(xp[0]?.n||0)};
}
async function readSettings(db,id){
 const entries=await rows(db,'SELECT artifact_key,award_keys_json,is_public,revision FROM member_showcase_selections WHERE member_id=?',[id]);
 const entry=entries[0]||null;
 let awardKeys=[];
 try{const parsed=JSON.parse(entry?.award_keys_json??'[]');if(Array.isArray(parsed)&&parsed.every(x=>typeof x==='string'))awardKeys=parsed.slice(0,3);}catch{}
 return {artifactKey:entry?.artifact_key??null,awardKeys,isPublic:entry?entry.is_public===1:true,
   revision:Number(entry?.revision||0)};
}
async function parseWrite(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON required');
 if(Number(req.headers.get('content-length'))>1200)throw Error('Payload too long');
 const raw=await req.text();
 if(raw.length>1200)throw Error('Payload too long');
 const body=JSON.parse(raw);
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid update');
 if(Object.keys(body).sort().join(',')!=='artifactKey,awardKeys,isPublic,revision')throw Error('Invalid fields');
 if(body.artifactKey!==null&&(typeof body.artifactKey!=='string'||body.artifactKey.length>80))throw Error('Invalid artifact');
 if(!Array.isArray(body.awardKeys)||body.awardKeys.length>3||
    body.awardKeys.some(x=>typeof x!=='string'||x.length>64)||
    new Set(body.awardKeys).size!==body.awardKeys.length)throw Error('Invalid awards');
 if(typeof body.isPublic!=='boolean'||!Number.isSafeInteger(body.revision)||body.revision<0||
    body.revision>2147483646)throw Error('Invalid revision');
 return body;
}
export async function memberShowcaseRoutes(req,db,member,limiter,now){
 if(new URL(req.url).pathname!==PATH)return response(req,{error:'Not found'},404);
 if(!['GET','HEAD','POST'].includes(req.method))return response(req,{error:'Method not allowed'},405);
 if(!member||!member.handle)return response(req,{error:'Complete sign-in and creator profile first'},401);
 try{
  const stats=await statsFor(db,member.id);
  if(!stats)return response(req,{error:'Active creator profile required'},403);
  const progression=progressionFromXp(stats.xp);
  const artifacts=earnedArtifactsThroughLevel(progression.level);
  const earned=deriveAchievements(stats).filter(a=>a.earned).map(({key,name,description})=>({key,name,description}));
  if(req.method==='GET'||req.method==='HEAD'){
   const selection=await readSettings(db,member.id);
   return response(req,{selection,level:progression.level,currentArtifact:progression.artifact,
     availableArtifacts:artifacts,availableAwards:earned});
  }
  const body=await parseWrite(req).catch(()=>null);
  if(!body)return response(req,{error:'Invalid showcase selection'},400);
  if(body.artifactKey!==null&&!artifacts.includes(body.artifactKey))
   return response(req,{error:'Artifact has not been earned'},403);
  const earnedKeys=new Set(earned.map(a=>a.key));
  if(body.awardKeys.some(key=>!earnedKeys.has(key)))
   return response(req,{error:'Awards must be verified and earned'},403);
  if(!await limiter(db,'showcase:'+member.id,now,40,3600))
   return response(req,{error:'Showcase edit limit reached'},429);
  const values=[body.artifactKey,JSON.stringify(body.awardKeys),body.isPublic?1:0,now];
  let changed;
  if(body.revision===0){
   changed=await rows(db,`INSERT INTO member_showcase_selections
    (member_id,artifact_key,award_keys_json,is_public,revision,updated_at)
    VALUES(?,?,?,?,1,?) ON CONFLICT(member_id) DO NOTHING RETURNING revision`,
    [member.id,...values]);
  }else{
   changed=await rows(db,`UPDATE member_showcase_selections SET artifact_key=?,award_keys_json=?,
    is_public=?,revision=revision+1,updated_at=?
    WHERE member_id=? AND revision=? AND revision<2147483647 RETURNING revision`,
    [...values,member.id,body.revision]);
  }
  if(changed.length!==1)return response(req,{error:'Showcase changed; refresh and try again'},409);
  const selection=await readSettings(db,member.id);
  return response(req,{selection,level:progression.level,currentArtifact:progression.artifact,
    availableArtifacts:artifacts,availableAwards:earned});
 }catch{return response(req,{error:'Showcase service unavailable; no changes confirmed'},503);}
}
