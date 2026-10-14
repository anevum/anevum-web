// ANEVUM Creator V1 — original voting and contribution progression.
// STAGING: no pay-to-win, no admin power from levels, no unpublished project votes.
// The authenticated member and same-origin request checks come from worker.mjs.
const P='/api/v1/member/community';
const RESPONSE_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const reply=(request,obj,status=200)=>new Response(request.method==='HEAD'?null:JSON.stringify(obj),{status,headers:RESPONSE_HEADERS});
const idPattern=/^[a-f0-9]{32}$/;
const dailyLimit=5;
const firstVoteXp=2;
// The initial artifact series has 60 names; it is not a level ceiling.
const artifactSeriesLength=60;
const relics=[
  'Foundry Spark','Copper Key','Blackglass Seed','Ivory Compass','Iron Moth','Brass Dial','Quartz Spool','Ember Lantern','Prism Mask','Cobalt Coil',
  'Silver Needle','Aether Bell','Obsidian Feather','Sunken Astrolabe','Clockwork Finch','Glass Meridian','Furnace Rose','Amber Tuning Fork','Marble Eye','Paper Engine',
  'Ceramic Ghost','Mercury Hourglass','Saffron Beacon','Gilded Gear','Basalt Crown','Lunar Caliper','Magnetic Rose','Aurora Cartridge','Bronze Orrery','Midnight Atlas',
  'Jade Relay','Tidal Key','Hollow Star','Crystal Loom','Auric Beetle','Sundial Heart','Sable Pendant','Velvet Catalyst','Amber Gyroscope','Echo Prism',
  'Forged Telescope','Arc Lantern','Ivory Sextant','Molten Cipher','Silver Harp','Cobalt Furnace','Night Compass','Dawn Engine','Glass Cathedral','Radiant Crucible',
  'Solar Orrery','Gravity Spindle','Quantum Leaf','Iron Comet','Aether Vessel','Obsidian Crown','Aurora Monolith','Starforge Dial','Celestial Engine','The First Light'
];
/** Server-authoritative earned Series One items. A member may equip any
 * previously earned item in this series, not arbitrary client-provided art.
 * Levels above 60 remain valid but do not mint non-existent extra items.
 */
export function earnedArtifactsThroughLevel(level){
 if(!Number.isSafeInteger(level)||level<1)return [];
 return relics.slice(0,Math.min(level,relics.length));
}
// Keep the current 20x quadratic pacing pending #337 balance acceptance.
// Levels have no fixed end; cap only unsafe number inputs, not the attainable level.
export function thresholdForLevel(level){
 if(!Number.isSafeInteger(level)||level<1)throw Error('Invalid level');
 return 20*(level-1)*(level-1);
}
export function progressionFromXp(raw){
 const amount=Number(raw);
 const xp=Number.isFinite(amount)&&amount>0 ? Math.min(Number.MAX_SAFE_INTEGER,Math.floor(amount)):0;
 const level=Math.floor(Math.sqrt(xp/20))+1;
 const floor=thresholdForLevel(level);
 const next=thresholdForLevel(level+1);
 const artifact=level<=artifactSeriesLength?relics[level-1]:null;
 return {xp,level,maxLevel:null,artifact,artifactEarned:artifact!==null,levelStartXp:floor,nextLevelXp:next,progressWithinLevel:Math.max(0,Math.min(1,(xp-floor)/(next-floor)))};
}
const sql=(db,text,params=[])=>{const s=db.prepare(text);return params.length?s.bind(...params):s;};
async function list(db,text,params=[]){const r=await sql(db,text,params).all();if(r?.success===false||!Array.isArray(r?.results))throw Error('Storage unavailable');return r.results;}
async function batch(db,queries){const r=await db.batch(queries);if(!Array.isArray(r)||r.some(x=>x.success===false))throw Error('Storage unavailable');return r;}
const utcDay=(now)=>new Date(now*1000).toISOString().slice(0,10);
async function loadStats(db,projectId,memberId){
 const r=await list(db,`SELECT COUNT(*) AS count,AVG(score) AS average FROM community_project_votes WHERE project_id=? AND status='active'`,[projectId]);
 const own=memberId?await list(db,'SELECT score,revision,status FROM community_project_votes WHERE project_id=? AND member_id=?',[projectId,memberId]):[];
 return {votes:Number(r[0]?.count||0),average:r[0]?.average===null?null:Math.round(Number(r[0].average)*100)/100,myVote:own[0]?.status==='active'?{score:own[0].score,revision:own[0].revision}:null};
}
async function published(db,id){
 const r=await list(db,`SELECT p.id,p.title,p.category,p.owner_member_id AS ownerId,c.handle AS creatorHandle
    FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
    WHERE p.id=? AND p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`,[id]);
 return r[0]||null;
}
async function parseVote(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON content required');
 if(Number(req.headers.get('content-length'))>300)throw Error('Vote payload too large');
 const content=await req.text();if(content.length>300)throw Error('Vote payload too large');
 const body=JSON.parse(content);
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(x=>!['score','revision'].includes(x)))throw Error('Invalid vote');
 if(!Number.isInteger(body.score)||body.score<0||body.score>5||!Number.isSafeInteger(body.revision)||body.revision<0||body.revision>2147483647)throw Error('Invalid vote');
 return body;
}
async function xp(db,id){const r=await list(db,'SELECT COALESCE(SUM(amount),0) AS amount FROM community_xp_events WHERE member_id=?',[id]);return progressionFromXp(r[0]?.amount||0);}
export async function communityRoutes(req,db,member,limiter,now){
 const u=new URL(req.url),path=u.pathname;
 if(!path.startsWith(P+'/'))return reply(req,{error:'Not found'},404);
 if(!['GET','HEAD','POST'].includes(req.method))return reply(req,{error:'Method not allowed'},405);
 try{
  if(path===P+'/me'&&['GET','HEAD'].includes(req.method)){
   if(!member)return reply(req,{error:'Sign-in required'},401);
   return reply(req,{progression:await xp(db,member.id)});
  }
  if(path===P+'/projects'&&['GET','HEAD'].includes(req.method)){
   const publishedRows=await list(db,`SELECT p.id,p.title,p.category,c.handle AS creatorHandle
     FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
     WHERE p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')
     ORDER BY p.published_at DESC,p.id DESC LIMIT 24`);
   const items=[];for(const row of publishedRows)items.push({id:row.id,title:row.title,category:row.category,creatorHandle:row.creatorHandle,rating:await loadStats(db,row.id,member?.id)});
   return reply(req,{items,count:items.length});
  }
  const match=/^\/api\/v1\/member\/community\/projects\/([a-f0-9]{32})(?:\/(vote))?$/.exec(path);
  if(!match)return reply(req,{error:'Not found'},404);
  const projectId=match[1];
  const item=await published(db,projectId);
  if(!item)return reply(req,{error:'Project not found'},404);
  if(req.method==='GET'||req.method==='HEAD'){
   if(match[2])return reply(req,{error:'Method not allowed'},405);
   const stats=await loadStats(db,projectId,member?.id);
   return reply(req,{project:{id:item.id,title:item.title,category:item.category,creatorHandle:item.creatorHandle},rating:stats});
  }
  if(req.method!=='POST'||match[2]!=='vote')return reply(req,{error:'Not found'},404);
  if(!member)return reply(req,{error:'Sign-in required'},401);
  if(!member.handle)return reply(req,{error:'Complete your creator profile first'},409);
  if(item.ownerId===member.id)return reply(req,{error:'You cannot rate your own project'},403);
  const profile=await list(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND status='active'",[member.id]);
  if(profile.length!==1)return reply(req,{error:'Creator profile unavailable'},403);
  let vote;try{vote=await parseVote(req)}catch{return reply(req,{error:'Invalid vote'},400)}
  if(!await limiter(db,'rating:'+member.id,now,30,3600))return reply(req,{error:'Rating limit reached'},429);
  const old=await list(db,'SELECT score,revision,status FROM community_project_votes WHERE member_id=? AND project_id=?',[member.id,projectId]);
  const previous=old[0]||null;
  if(previous?.status==='hidden')return reply(req,{error:'Your rating is under moderation review'},403);
  if((previous?.revision||0)!==vote.revision)return reply(req,{error:'Rating changed; refresh first'},409);
  if(previous?.score===vote.score)return reply(req,{changed:false,rating:await loadStats(db,projectId,member.id),progression:await xp(db,member.id)});
  const evt=crypto.randomUUID(),clock=now,day=utcDay(now);
  const allowed=`EXISTS(SELECT 1 FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.id=? AND p.status='published' AND c.status='active' AND p.owner_member_id<>? AND julianday(p.published_at)<=julianday('now'))`;
  let changes=0;
  try{
   const stmts=[];
   if(!previous){
    stmts.push(sql(db,`INSERT INTO community_project_votes(member_id,project_id,score,revision,status,created_at,updated_at)
       SELECT ?,?,?,1,'active',?,? WHERE ${allowed} ON CONFLICT(member_id,project_id) DO NOTHING`,[member.id,projectId,vote.score,clock,clock,projectId,member.id]));
   }else{
    stmts.push(sql(db,`UPDATE community_project_votes SET score=?,revision=revision+1,updated_at=? WHERE member_id=? AND project_id=? AND revision=? AND status='active' AND ${allowed}`, [vote.score,clock,member.id,projectId,previous.revision,projectId,member.id]));
   }
   stmts.push(sql(db,`INSERT INTO community_vote_events(id,member_id,project_id,action,from_score,to_score,reason,created_at)
    SELECT ?,?,?,?,?,?,NULL,? WHERE changes()=1`,[evt,member.id,projectId,previous?'revise':'cast',previous?.score??null,vote.score,clock]));
   if(!previous)stmts.push(sql(db,`INSERT INTO community_xp_events(id,member_id,kind,target_id,amount,award_day,created_at)
    SELECT ? ,?,'vote_first',?, ?,?,? WHERE EXISTS(SELECT 1 FROM community_vote_events WHERE id=?)
    AND (SELECT COUNT(*) FROM community_xp_events WHERE member_id=? AND kind='vote_first' AND award_day=? AND amount>0)<?
    ON CONFLICT(member_id,kind,target_id) DO NOTHING`,[crypto.randomUUID(),member.id,projectId,firstVoteXp,day,clock,evt,member.id,day,dailyLimit]));
   const results=await batch(db,stmts);changes=Number(results[0]?.meta?.changes??results[0]?.meta?.rows_written);
  }catch{return reply(req,{error:'Rating unavailable; try again'},503)}
  if(changes!==1)return reply(req,{error:'Rating changed; refresh first'},409);
  return reply(req,{changed:true,rating:await loadStats(db,projectId,member.id),progression:await xp(db,member.id)});
 }catch{return reply(req,{error:'Community service temporarily unavailable'},503)}
}