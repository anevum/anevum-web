// ANEVUM Creator V1 — signed-Access staff-only moderation for community ratings.
// Authentication, CSRF, and database provisioning are enforced by Studio Worker.
const ID=/^[a-f0-9]{32}$/;
const output=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const stmt=(db,sql,args=[])=>{const s=db.prepare(sql);return args.length?s.bind(...args):s};
const query=async(db,sql,args=[])=>{const r=await stmt(db,sql,args).all();if(r.success===false||!Array.isArray(r.results))throw Error('Storage unavailable');return r.results};
const transaction=async(db,entries)=>{const r=await db.batch(entries);if(!Array.isArray(r)||r.some(x=>x.success===false))throw Error('Storage unavailable');return r};
async function parseBody(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON required');
 const s=await req.text();if(s.length>1200)throw Error('Too large');
 const b=JSON.parse(s);if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.reason!=='string'||b.reason.trim().length<12||b.reason.length>800)return null;
 return b.reason.trim();
}
export async function voteModeration(req,db,actor){
 const url=new URL(req.url),path=url.pathname;
 const id=url.searchParams.get('project')||'';
 if(path==='/api/community-votes'&&req.method==='GET'){
  if(!ID.test(id))return output({error:'Valid project ID required'},400);
  const rows=await query(db,`SELECT v.member_id AS memberId,c.handle,v.project_id AS projectId,v.score,v.revision,v.status,v.created_at AS createdAt,v.updated_at AS updatedAt
    FROM community_project_votes v JOIN creator_profiles c ON c.member_id=v.member_id
    WHERE v.project_id=? ORDER BY v.updated_at DESC LIMIT 100`,[id]);
  return output({votes:rows});
 }
 const m=/^\/api\/community-votes\/([a-f0-9]{32})\/([^/]{1,120})\/(hide|restore)$/.exec(path);
 if(!m)return output({error:'Not found'},404);
 if(req.method!=='POST')return output({error:'Method not allowed'},405);
 const [,projectId,memberId,action]=m;
 let reason;try{reason=await parseBody(req)}catch{return output({error:'Invalid moderation reason'},400)}
 if(!reason)return output({error:'A reason of at least 12 characters is required'},400);
 const rows=await query(db,`SELECT score,status FROM community_project_votes WHERE project_id=? AND member_id=?`,[projectId,memberId]);
 const current=rows[0];if(!current)return output({error:'Vote not found'},404);
 const before=action==='hide'?'active':'hidden',after=action==='hide'?'hidden':'active';
 if(current.status!==before)return output({error:'Vote already changed'},409);
 const first=await query(db,`SELECT amount FROM community_xp_events WHERE member_id=? AND kind='vote_first' AND target_id=?`,[memberId,projectId]);
 const adjustments=await query(db,`SELECT COALESCE(SUM(x.amount),0) AS amount FROM community_xp_events x
   JOIN community_vote_events e ON e.id=x.target_id
   WHERE x.member_id=? AND x.kind='vote_adjustment' AND e.project_id=?`,[memberId,projectId]);
 const initial=Number(first[0]?.amount||0),net=initial+Number(adjustments[0]?.amount||0);
 const delta=action==='hide'&&net>0?-net:action==='restore'&&initial>0&&net<=0?initial:0;
 const eventId=crypto.randomUUID(),now=Math.floor(Date.now()/1000),day=new Date(now*1000).toISOString().slice(0,10);
 const statement=[
  stmt(db,`UPDATE community_project_votes SET status=?,updated_at=? WHERE project_id=? AND member_id=? AND status=?`,[after,now,projectId,memberId,before]),
  stmt(db,`INSERT INTO community_vote_events(id,member_id,project_id,action,from_score,to_score,reason,created_at)
   SELECT ?,?,?,?,?,?,?,? WHERE changes()=1`,[eventId,memberId,projectId,action,action==='hide'?current.score:null,action==='restore'?current.score:null,`Staff ${actor}: ${reason}`,now])
 ];
 if(delta!==0)statement.push(stmt(db,`INSERT INTO community_xp_events(id,member_id,kind,target_id,amount,award_day,created_at)
   SELECT ?,?,'vote_adjustment',?,?,?,? WHERE EXISTS(SELECT 1 FROM community_vote_events WHERE id=?)`,[crypto.randomUUID(),memberId,eventId,delta,day,now,eventId]));
 try{
  const out=await transaction(db,statement);const n=Number(out[0]?.meta?.changes??out[0]?.meta?.rows_written);
  if(n!==1)return output({error:'Vote changed; refresh first'},409);
  return output({projectId,memberId,status:after,xpAdjustment:delta,reviewed:true});
 }catch{return output({error:'Moderation unavailable'},503)}
}