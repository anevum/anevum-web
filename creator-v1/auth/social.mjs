// ANEVUM V1 / independent staging creator profiles, achievement cabinet, saved library.
// Achievements are read-only derived evidence, NOT XP, moderation trust or paid advantages.
import {progressionFromXp} from './community.mjs';

const ROOT='/api/v1/member';
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const ID=/^[a-f0-9]{32}$/;
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const response=(req,data,status=200)=>new Response(req.method==='HEAD'?null:JSON.stringify(data),{status,headers:HEADERS});
const query=(db,sql,args=[])=>{const s=db.prepare(sql);return args.length?s.bind(...args):s;};
async function rows(db,sql,args=[]){const r=await query(db,sql,args).all();if(r?.success===false||!Array.isArray(r?.results))throw Error('Community database unavailable');return r.results;}
async function run(db,sql,args=[]){const r=await query(db,sql,args).run();if(r?.success===false)throw Error('Community database unavailable');return r;}
const publicVisibility=`p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`;

export const ACHIEVEMENTS=Object.freeze([
 Object.freeze({key:'first-signal',name:'First Signal',description:'Rate your first published project',metric:'ratings',target:1,symbol:'✦'}),
 Object.freeze({key:'keen-eye',name:'Keen Eye',description:'Rate five published projects',metric:'ratings',target:5,symbol:'◇'}),
 Object.freeze({key:'portal-guide',name:'Portal Guide',description:'Rate twenty-five published projects',metric:'ratings',target:25,symbol:'✳'}),
 Object.freeze({key:'first-launch',name:'First Launch',description:'Publish your first project after staff review',metric:'publishedProjects',target:1,symbol:'⟡'}),
 Object.freeze({key:'three-builds',name:'Three Builds',description:'Publish three projects after staff review',metric:'publishedProjects',target:3,symbol:'⬡'}),
 Object.freeze({key:'release-steward',name:'Release Steward',description:'Ship a versioned update to a published project',metric:'releases',target:1,symbol:'✺'})
]);
export function deriveAchievements(stats){
 return ACHIEVEMENTS.map(({key,name,description,metric,target,symbol})=>({key,name,description,symbol,earned:Number(stats?.[metric]||0)>=target,progress:Math.min(target,Math.max(0,Number(stats?.[metric]||0))),target}));
}
async function publicProfile(db,handle){
 const found=await rows(db,`SELECT c.member_id AS id,c.handle,c.display_name AS displayName,c.bio,c.created_at AS joinedAt
 FROM creator_profiles c LEFT JOIN member_accounts a ON a.id=c.member_id
 WHERE c.handle=? AND c.status='active' AND (a.status='active' OR (a.id IS NULL AND c.member_id='anevum-official')) LIMIT 1`,[handle]);
 return found[0]||null;
}
async function counts(db,id){
 const [ratings,published,releases,xp]=await Promise.all([
  rows(db,"SELECT COUNT(*) AS count FROM community_project_votes WHERE member_id=? AND status='active'",[id]),
  rows(db,`SELECT COUNT(*) AS count FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.owner_member_id=? AND ${publicVisibility}`,[id]),
  rows(db,`SELECT COUNT(*) AS count FROM project_releases r JOIN projects p ON p.id=r.project_id JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.owner_member_id=? AND ${publicVisibility}`,[id]),
  rows(db,'SELECT COALESCE(SUM(amount),0) AS amount FROM community_xp_events WHERE member_id=?',[id])
 ]);
 return {ratings:Number(ratings[0]?.count||0),publishedProjects:Number(published[0]?.count||0),releases:Number(releases[0]?.count||0),xp:Math.max(0,Number(xp[0]?.amount||0))};
}
async function parseSave(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON body required');
 if(Number(req.headers.get('content-length')||0)>100)throw Error('Payload too large');
 const raw=await req.text();if(raw.length>100)throw Error('Payload too large');
 const body=JSON.parse(raw);
 if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length!==1||typeof body.saved!=='boolean')throw Error('Invalid saved state');
 return body.saved;
}
async function savedProject(db,id){
 const p=await rows(db,`SELECT p.id FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.id=? AND ${publicVisibility} LIMIT 1`,[id]);
 return !!p[0];
}
async function parseFollow(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON required');
 if(Number(req.headers.get('content-length')||0)>96)throw Error('Payload too large');
 const raw=await req.text();if(raw.length>96)throw Error('Payload too large');
 const b=JSON.parse(raw);
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==1||typeof b.following!=='boolean')throw Error('Invalid follow action');
 return b.following;
}
async function followState(db,creatorId,viewerId){
 const followers=await rows(db,`SELECT COUNT(*) AS count FROM member_creator_follows f
   JOIN member_accounts a ON a.id=f.follower_member_id AND a.status='active'
   WHERE f.creator_member_id=?`,[creatorId]);
 const own=viewerId?await rows(db,'SELECT 1 AS present FROM member_creator_follows WHERE follower_member_id=? AND creator_member_id=?',[viewerId,creatorId]):[];
 return {followers:Number(followers[0]?.count||0),viewerFollows:own.length===1};
}
function publicDto(x){return {id:x.id,title:x.title,slug:x.slug,summary:x.summary,category:x.category,creatorHandle:x.creatorHandle,sourceUrl:x.sourceUrl,demoUrl:x.demoUrl,publishedAt:x.publishedAt};}
export async function socialRoutes(req,db,member,limiter,now,{followsEnabled=false,worldsEnabled=false}={}){
 const path=new URL(req.url).pathname;
 try {
  if(!['GET','HEAD','POST'].includes(req.method))return response(req,{error:'Method not allowed'},405);
  if(path===ROOT+'/following'&&['GET','HEAD'].includes(req.method)){
   if(!followsEnabled)return response(req,{error:'Following is not enabled'},404);
   if(!member)return response(req,{error:'Sign-in required'},401);
   const entries=await rows(db,`SELECT c.handle,c.display_name AS displayName,f.created_at AS followedAt
     FROM member_creator_follows f JOIN creator_profiles c ON c.member_id=f.creator_member_id
     LEFT JOIN member_accounts a ON a.id=c.member_id
     WHERE f.follower_member_id=? AND c.status='active'
       AND (EXISTS(SELECT 1 FROM projects p WHERE p.owner_member_id=c.member_id
          AND p.status='published' AND p.published_at IS NOT NULL AND julianday(p.published_at)<=julianday('now'))
          ${worldsEnabled?"OR EXISTS(SELECT 1 FROM member_world_appearances w WHERE w.member_id=c.member_id AND w.visibility='public')":""})
       AND (a.status='active' OR (a.id IS NULL AND c.member_id='anevum-official'))
     ORDER BY f.created_at DESC,c.handle ASC LIMIT 101`,[member.id]);
   return response(req,{items:entries.slice(0,100),hasMore:entries.length>100});
  }
  const followMatch=/^\/api\/v1\/member\/creators\/([a-z][a-z0-9_]{2,29})\/follow$/.exec(path);
  if(followMatch){
   if(!followsEnabled)return response(req,{error:'Following is not enabled'},404);
   if(req.method!=='POST')return response(req,{error:'Method not allowed'},405);
   if(!member)return response(req,{error:'Sign-in required'},401);
   const creator=await publicProfile(db,followMatch[1]);
   if(!creator)return response(req,{error:'Creator not found'},404);
   if(creator.id===member.id)return response(req,{error:'Cannot follow your own channel'},403);
   const released=await rows(db,`SELECT 1 AS present FROM projects WHERE owner_member_id=?
     AND status='published' AND published_at IS NOT NULL AND julianday(published_at)<=julianday('now') LIMIT 1`,[creator.id]);
   const optedIn=worldsEnabled && (await rows(db,"SELECT 1 AS present FROM member_world_appearances WHERE member_id=? AND visibility='public' LIMIT 1",[creator.id])).length===1;
   if(released.length!==1&&!optedIn)return response(req,{error:'Creator channel not publicly available'},404);
   let desired;try{desired=await parseFollow(req)}catch{return response(req,{error:'Invalid follow action'},400)}
   if(!await limiter(db,'follow:'+member.id,now,40,3600))return response(req,{error:'Too many follow changes'},429);
   const existing=await rows(db,'SELECT 1 AS present FROM member_creator_follows WHERE follower_member_id=? AND creator_member_id=?',[member.id,creator.id]);
   if(desired&&existing.length)return response(req,{following:true,changed:false,...await followState(db,creator.id,member.id)});
   if(!desired&&!existing.length)return response(req,{following:false,changed:false,...await followState(db,creator.id,member.id)});
   if(desired){
    const changed=await run(db,`INSERT INTO member_creator_follows(follower_member_id,creator_member_id,created_at)
      SELECT ?,?,? WHERE (SELECT COUNT(*) FROM member_creator_follows WHERE follower_member_id=?)<500
      ON CONFLICT(follower_member_id,creator_member_id) DO NOTHING`,[member.id,creator.id,now,member.id]);
    if(Number(changed.meta?.changes??changed.meta?.rows_written??0)!==1)return response(req,{error:'Follow limit reached or account changed'},409);
   }else{
    const changed=await run(db,'DELETE FROM member_creator_follows WHERE follower_member_id=? AND creator_member_id=?',[member.id,creator.id]);
    if(Number(changed.meta?.changes??changed.meta?.rows_written??0)!==1)return response(req,{error:'Follow changed; refresh first'},409);
   }
   return response(req,{following:desired,changed:true,...await followState(db,creator.id,member.id)});
  }
  const profileMatch=/^\/api\/v1\/member\/creators\/([a-z][a-z0-9_]{2,29})(?:\/(projects))?$/.exec(path);
  if(profileMatch){
   if(!['GET','HEAD'].includes(req.method))return response(req,{error:'Method not allowed'},405);
   const handle=profileMatch[1],c=await publicProfile(db,handle);
   if(!c)return response(req,{error:'Creator not found'},404);
   if(profileMatch[2]){
    const records=await rows(db,`SELECT p.id,p.slug,p.title,p.summary,p.category,p.source_url AS sourceUrl,p.demo_url AS demoUrl,p.published_at AS publishedAt,c.handle AS creatorHandle
      FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
      WHERE p.owner_member_id=? AND ${publicVisibility} ORDER BY p.published_at DESC,p.id DESC LIMIT 48`,[c.id]);
    return response(req,{items:records.map(publicDto),count:records.length});
   }
   const [stats,following]=await Promise.all([counts(db,c.id),followsEnabled?followState(db,c.id,member?.id):Promise.resolve(null)]);
   return response(req,{creator:{handle:c.handle,displayName:c.displayName,bio:c.bio,joinedAt:c.joinedAt},contributions:{ratings:stats.ratings,publishedProjects:stats.publishedProjects,releases:stats.releases},progression:progressionFromXp(stats.xp),achievements:deriveAchievements(stats),...(following||{})});
  }
  if(path===ROOT+'/library'&&['GET','HEAD'].includes(req.method)){
   if(!member)return response(req,{error:'Sign-in required'},401);
   const records=await rows(db,`SELECT p.id,p.slug,p.title,p.summary,p.category,p.source_url AS sourceUrl,p.demo_url AS demoUrl,p.published_at AS publishedAt,c.handle AS creatorHandle,f.created_at AS savedAt
      FROM project_favorites f JOIN projects p ON p.id=f.project_id JOIN creator_profiles c ON c.member_id=p.owner_member_id
      WHERE f.member_id=? AND ${publicVisibility} ORDER BY f.created_at DESC,p.id DESC LIMIT 100`,[member.id]);
   return response(req,{items:records.map(x=>({...publicDto(x),savedAt:x.savedAt})),count:records.length});
  }
  const fav=/^\/api\/v1\/member\/library\/([a-f0-9]{32})$/.exec(path);
  if(fav&&req.method==='POST'){
   if(!member)return response(req,{error:'Sign-in required'},401);
   if(!member.handle)return response(req,{error:'Complete your creator profile first'},409);
   const owner=await rows(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND status='active'",[member.id]);
   if(owner.length!==1)return response(req,{error:'Creator profile unavailable'},403);
   let saved;try{saved=await parseSave(req)}catch{return response(req,{error:'Invalid saved state'},400)}
   if(!await limiter(db,'library:'+member.id,now,100,3600))return response(req,{error:'Library update limit reached'},429);
   if(saved){
    if(!await savedProject(db,fav[1]))return response(req,{error:'Project not found'},404);
    const out=await run(db,`INSERT INTO project_favorites(member_id,project_id) SELECT ?,p.id FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.id=? AND ${publicVisibility} ON CONFLICT(member_id,project_id) DO NOTHING`,[member.id,fav[1]]);
    return response(req,{saved:true,changed:Number(out.meta?.changes??out.meta?.rows_written??0)===1});
   }
   const out=await run(db,'DELETE FROM project_favorites WHERE member_id=? AND project_id=?',[member.id,fav[1]]);
   return response(req,{saved:false,changed:Number(out.meta?.changes??out.meta?.rows_written??0)===1});
  }
  return response(req,{error:'Not found'},404);
 } catch {return response(req,{error:'Community feature temporarily unavailable'},503)}
}