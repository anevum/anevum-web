// ANEVUM 1.0 privacy center — staging only. No private endpoint accepts a client member ID.
// In particular, a deletion REQUEST never changes membership state or destroys content.
const ROOT='/api/v1/member/privacy';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:HEADERS});
const error=(message,status)=>json({error:message},status);
const stmt=(db,sql,args=[])=>{const x=db.prepare(sql);return args.length?x.bind(...args):x;};
async function query(db,sql,args=[]){const x=await stmt(db,sql,args).all();if(x?.success===false||!Array.isArray(x?.results))throw Error('Database unavailable');return x.results;}
async function run(db,sql,args=[]){const x=await stmt(db,sql,args).run();if(x?.success===false)throw Error('Database unavailable');return x;}
async function requestBody(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return null;
 if(Number(req.headers.get('content-length')||0)>1024||!req.body)return null;
 const reader=req.body.getReader();let length=0;const pieces=[];
 try {for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>1024){await reader.cancel();return null;}pieces.push(value)}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let off=0;for(const p of pieces){bytes.set(p,off);off+=p.byteLength;}
 try{const o=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return o&&typeof o==='object'&&!Array.isArray(o)?o:null;}catch{return null;}
}
const isFresh=(m,now)=>Number.isInteger(m.sessionCreatedAt)&&m.sessionCreatedAt<=now+5&&m.sessionCreatedAt>now-600;
const sections=Object.freeze({
 following:{key:'creatorId',sql:`SELECT creator_member_id AS creatorId,created_at AS followedAt FROM member_creator_follows WHERE follower_member_id=? AND creator_member_id>? ORDER BY creator_member_id LIMIT ?`},
 interests:{key:'memberId',sql:`SELECT member_id AS memberId,categories_json AS categoriesJson,updated_at AS updatedAt FROM member_discovery_preferences WHERE member_id=? AND member_id>? ORDER BY member_id LIMIT ?`},
 projects:{key:'id',sql:`SELECT id,slug,title,summary,description,category,status,source_url AS sourceUrl,demo_url AS demoUrl,license_name AS license,ai_disclosure AS aiDisclosure,human_contribution AS humanContribution,free_to_use AS freeToUse,revision,published_at AS publishedAt,created_at AS createdAt,updated_at AS updatedAt FROM projects WHERE owner_member_id=? AND id>? ORDER BY id LIMIT ?`},
 releases:{key:'id',sql:`SELECT r.id,r.project_id AS projectId,r.version,r.notes,r.released_at AS releasedAt FROM project_releases r JOIN projects p ON p.id=r.project_id WHERE p.owner_member_id=? AND r.id>? ORDER BY r.id LIMIT ?`},
 library:{key:'projectId',sql:`SELECT project_id AS projectId,created_at AS createdAt FROM project_favorites WHERE member_id=? AND project_id>? ORDER BY project_id LIMIT ?`},
 votes:{key:'projectId',sql:`SELECT project_id AS projectId,score,status,revision,created_at AS createdAt,updated_at AS updatedAt FROM community_project_votes WHERE member_id=? AND project_id>? ORDER BY project_id LIMIT ?`},
 voteHistory:{key:'id',sql:`SELECT id,project_id AS projectId,action,from_score AS fromScore,to_score AS toScore,created_at AS createdAt FROM community_vote_events WHERE member_id=? AND id>? ORDER BY id LIMIT ?`},
 xp:{key:'id',sql:`SELECT id,kind,target_id AS targetId,amount,award_day AS awardDay,created_at AS createdAt FROM community_xp_events WHERE member_id=? AND id>? ORDER BY id LIMIT ?`},
 reviews:{key:'id',sql:`SELECT id,project_id AS projectId,score,body,status,created_at AS createdAt,updated_at AS updatedAt FROM project_reviews WHERE member_id=? AND id>? ORDER BY id LIMIT ?`},
 reports:{key:'id',sql:`SELECT id,target_type AS targetType,target_id AS targetId,reason,details,status,created_at AS createdAt FROM project_reports WHERE reporter_member_id=? AND id>? ORDER BY id LIMIT ?`},
 submissions:{key:'id',sql:`SELECT e.id,e.project_id AS projectId,e.actor_kind AS actorKind,e.action,e.from_status AS fromStatus,e.to_status AS toStatus,e.reason,e.created_at AS createdAt FROM project_submission_events e JOIN projects p ON p.id=e.project_id WHERE p.owner_member_id=? AND e.id>? ORDER BY e.id LIMIT ?`}
});
const SECTIONS=['account',...Object.keys(sections)];
export async function privacyRoutes(req,db,member,rateLimit,now){
 const u=new URL(req.url),path=u.pathname;
 if(!path.startsWith(ROOT))return error('Not found',404);
 if(!member)return error('Sign-in required',401);
 if(req.method==='HEAD')return error('Not found',404);
 if(req.method==='GET'&&path===ROOT){
  const requests=await query(db,"SELECT id,state,requested_at AS requestedAt,updated_at AS updatedAt FROM member_deletion_requests WHERE member_id=? ORDER BY requested_at DESC,id DESC LIMIT 5",[member.id]);
  return json({account:{email:member.email,handle:member.handle},recentSession:isFresh(member,now),deletionRequests:requests,availableExportSections:SECTIONS,notice:'Deletion requests are queued for manual review; records are not deleted when a request is submitted.'});
 }
 if(req.method==='GET'&&path===ROOT+'/export'){
  if(!isFresh(member,now))return error('Re-verify your email before exporting account data',403);
  const section=u.searchParams.get('section')||'account';
  if(!SECTIONS.includes(section))return error('Unknown export section',400);
  const cursor=u.searchParams.get('cursor')||'';
  if(cursor&&!/^[a-zA-Z0-9_-]{1,80}$/.test(cursor))return error('Invalid cursor',400);
  if(section==='account'){
   if(cursor)return error('Account export does not accept a cursor',400);
   const result=await query(db,`SELECT a.id,a.email,a.verified_at AS verifiedAt,a.created_at AS createdAt,a.status,c.handle,c.display_name AS displayName,c.bio,c.website_url AS websiteUrl,c.avatar_url AS avatarUrl FROM member_accounts a LEFT JOIN creator_profiles c ON c.member_id=a.id WHERE a.id=?`,[member.id]);
   return json({section,items:result,nextCursor:null,completed:true,exportedAt:now});
  }
  const spec=sections[section],page=await query(db,spec.sql,[member.id,cursor,51]);
  const items=page.slice(0,50);const nextCursor=page.length>50?items.at(-1)[spec.key]:null;
  return json({section,items,nextCursor,completed:nextCursor===null,exportedAt:now});
 }
 if(req.method!=='POST')return error('Not found',404);
 if(path===ROOT+'/request-deletion'){
  if(!isFresh(member,now))return error('Re-verify your email before requesting deletion',403);
  const data=await requestBody(req);
  if(!data||Object.keys(data).sort().join(',')!=='confirmation,email'||data.confirmation!=='DELETE MY ACCOUNT'||typeof data.email!=='string'||data.email.trim().toLowerCase()!==member.email.toLowerCase())return error('Enter your account email and exact deletion confirmation',400);
  if(!await rateLimit(db,'privacy:delete:'+member.id,now,3,3600))return error('Too many deletion requests',429);
  await run(db,`INSERT OR IGNORE INTO member_deletion_requests(id,member_id,state,requested_at,updated_at) VALUES (?,?,'requested',?,?)`,[crypto.randomUUID(),member.id,now,now]);
  const existing=await query(db,"SELECT id,state,requested_at AS requestedAt FROM member_deletion_requests WHERE member_id=? AND state IN ('requested','processing') ORDER BY requested_at DESC LIMIT 1",[member.id]);
  if(!existing.length)return error('Request could not be recorded',503);
  return json({request:existing[0],notice:'Request recorded for manual processing. Your account and projects remain active until review.'},202);
 }
 if(path===ROOT+'/cancel-deletion'){
  if(!isFresh(member,now))return error('Re-verify your email before changing a deletion request',403);
  const data=await requestBody(req);
  if(!data||Object.keys(data).join(',')!=='confirmation'||data.confirmation!=='CANCEL REQUEST')return error('Cancellation confirmation required',400);
  const changed=await query(db,"UPDATE member_deletion_requests SET state='cancelled',updated_at=? WHERE member_id=? AND state='requested' RETURNING id",[now,member.id]);
  return changed.length?json({cancelled:true,requestId:changed[0].id}):error('No cancellable request found',409);
 }
 if(path===ROOT+'/revoke-other-sessions'){
  if(!isFresh(member,now))return error('Re-verify your email before revoking sessions',403);
  const data=await requestBody(req);
  if(!data||Object.keys(data).join(',')!=='confirmation'||data.confirmation!=='SIGN OUT OTHER DEVICES')return error('Session revocation confirmation required',400);
  const result=await run(db,'UPDATE member_sessions SET revoked_at=? WHERE member_id=? AND token_hash<>? AND revoked_at IS NULL AND expires_at>?',[now,member.id,member.tokenHash,now]);
  return json({revokedOtherSessions:Number(result.meta?.changes??result.meta?.rows_written??0)});
 }
 return error('Not found',404);
}