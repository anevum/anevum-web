// ANEVUM.IREN.BUILD.2026-10-19.001.OWNER-CONTROL-ROOM
// Owner-only, read-only member and reward inspection. No grant, XP or role writes.
// Only call after real Better Auth session AND live D1 staff_access_grants check.
const HEAD={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8',
 'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive','vary':'Cookie'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEAD});
const CONTROL=/[\u0000-\u001f\u007f]/;
const PAGE=25;
export const OWNER_LANES=Object.freeze(['owner-members','owner-member','owner-releases']);
const RELEASES=Object.freeze([
 {id:'v084-live',name:'V084 Continuance',status:'LIVE',kind:'production',
  summary:'Current website: Continuance login, 2D emblems, premium player cards and IREN walkthrough.',
  page:'https://anevum.com',evidence:'https://github.com/anevum/anevum-web/actions/runs/39271162169',
  captures:'https://github.com/anevum/anevum-web/actions/runs/39271162169/artifacts/12195298181'},
 {id:'v084-ui',name:'V084 responsive acceptance',status:'VERIFIED CAPTURE',kind:'evidence',
  summary:'Actual compiled React screenshot inspection across mobile and desktop; not an independent staging deployment.',
  page:'https://github.com/anevum/anevum-web/actions/runs/39266440691',
  evidence:'https://github.com/anevum/anevum-web/actions/runs/39266440691',
  captures:'https://github.com/anevum/anevum-web/actions/runs/39266440691/artifacts/12192583247'},
 {id:'v081-emblems',name:'Player cards and Evolution',status:'VERIFIED CAPTURE',kind:'evidence',
  summary:'Earned 2D specimen icons, role and earned-aura visual checks. Historical 3D mini-models retired.',
  page:'https://github.com/anevum/anevum-web/actions/runs/39266440685',
  evidence:'https://github.com/anevum/anevum-web/actions/runs/39266440685',
  captures:'https://github.com/anevum/anevum-web/actions/runs/39266440685/artifacts/12193611782'},
 {id:'private-lab',name:'Private Lab studies',status:'SYNTHETIC ONLY',kind:'simulation',
  summary:'Owner-only interactive preview studies, not authenticated member staging or deployable approval.',
  page:'https://lab.anevum.com/previews/',evidence:'https://github.com/anevum/anevum-web/pull/540',captures:null}
]);
const FIELDS='SELECT u.id,u.name,u.email,u.emailVerified AS verified,u.createdAt AS joinedAt,'+
 "COALESCE(p.display_name,u.name,'Member') AS displayName,"+
 "COALESCE(p.handle,'') AS handle,COALESCE(p.visibility,'private') AS visibility,"+
 'g.role AS staffRole '+
 'FROM "user" u LEFT JOIN member_creator_profiles p ON p.user_id=u.id '+
 'LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL '+
 '';
const shape=r=>({id:r.id,name:r.name||'Member',displayName:r.displayName||r.name||'Member',
 email:r.email,verified:r.verified===1||r.verified===true,handle:r.handle,
 visibility:r.visibility,joinedAt:r.joinedAt,staffRole:r.staffRole||null,
 selectedAura:r.selectedAura||'none'});
const queryRows=async query=>{const r=await query.all();if(r.success===false)throw Error('Database unavailable');return r.results||[];};
const expected=(url,keys)=>{
 const allow=new Set(keys);
 return [...url.searchParams.keys()].every(k=>allow.has(k)&&url.searchParams.getAll(k).length===1);
};
export async function ownerControlLane(req,db,permit){
 if(permit?.role!=='owner'||!permit.memberId)return json({error:'Owner access required'},403);
 if(req.method!=='GET')return json({error:'Read-only endpoint'},405);
 const url=new URL(req.url),lane=url.searchParams.get('lane');
 if(!OWNER_LANES.includes(lane))return json({error:'Unknown owner request'},400);
 if(lane==='owner-releases'){
  if(!expected(url,['lane']))return json({error:'Invalid query'},400);
  return json({releases:RELEASES,realIsolatedStaging:false,
   note:'The existing private Lab contains simulated scenes; an isolated compiled-build staging environment is not yet available.'});
 }
 if(lane==='owner-members'){
  if(!expected(url,['lane','q','page']))return json({error:'Invalid query'},400);
  const q=(url.searchParams.get('q')||'').trim(),raw=url.searchParams.get('page')||'0';
  if(CONTROL.test(q)||q.length>64||(q.length>0&&q.length<2)||!/^\d{1,2}$/.test(raw))
   return json({error:'Invalid search or page'},400);
  const page=Number(raw);
  const where=q?"WHERE (u.email LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\' OR p.handle LIKE ? ESCAPE '\\' OR p.display_name LIKE ? ESCAPE '\\') ":'';
  const pattern='%'+q.replace(/[\\%_]/g,x=>'\\'+x)+'%';
  const args=q?[pattern,pattern,pattern,pattern,PAGE+1,page*PAGE]:[PAGE+1,page*PAGE];
  const rows=await queryRows(db.prepare(FIELDS+where+'ORDER BY u.createdAt DESC,u.id DESC LIMIT ? OFFSET ?').bind(...args));
  return json({members:rows.slice(0,PAGE).map(shape),page,hasMore:rows.length>PAGE,pageSize:PAGE,
   query:q,source:'canonical-member-db'});
 }
 if(!expected(url,['lane','member']))return json({error:'Invalid query'},400);
 const id=url.searchParams.get('member');
 if(!id||id.length>128||CONTROL.test(id))return json({error:'Invalid member'},400);
 const row=await db.prepare(FIELDS+'WHERE u.id=? LIMIT 1').bind(id).first();
 if(!row)return json({error:'Member not found'},404);
 const schema=await queryRows(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_recognition_grants','member_space_milestones','member_role_grants','member_xp_totals','member_recognition_preferences')"));
 const tables=new Set(schema.map(x=>x.name));
 const grants=tables.has('member_recognition_grants')?await queryRows(db.prepare(
  "SELECT kind,recognition_id AS id,earned_at AS earnedAt FROM member_recognition_grants WHERE user_id=? AND revoked_at IS NULL ORDER BY earned_at DESC LIMIT 70"
 ).bind(id)):null;
 const milestones=tables.has('member_space_milestones')?await queryRows(db.prepare(
  "SELECT milestone AS id,earned_at AS earnedAt FROM member_space_milestones WHERE user_id=? ORDER BY earned_at DESC LIMIT 20"
 ).bind(id)):null;
 const roleBadges=tables.has('member_role_grants')?await queryRows(db.prepare(
  "SELECT role,granted_at AS grantedAt FROM member_role_grants WHERE user_id=? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 4"
 ).bind(id)):null;
 const chosenAura=tables.has('member_recognition_preferences')?await db.prepare('SELECT aura FROM member_recognition_preferences WHERE user_id=?').bind(id).first():null;
 const audit=await queryRows(db.prepare(
  "SELECT action,created_at AS createdAt FROM staff_access_audit WHERE member_id=? ORDER BY created_at DESC LIMIT 15"
 ).bind(id));
 return json({member:{...shape(row),selectedAura:chosenAura?.aura||'none'},recognition:{grants,milestones,roleBadges,
   verifiedRoleRegistryReady:tables.has('member_role_grants')},
  staffAudit:audit,storage:{xpAggregateReady:tables.has('member_xp_totals')},
  controls:{moderatorAssignments:'Personnel',earnedLevels:'automatic-only',
   roleHalos:'independent-review-required',cosmeticAura:'member-controlled'},
  source:'canonical-earned-records'});
}
