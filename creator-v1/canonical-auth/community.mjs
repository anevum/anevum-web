// Public, opt-in canonical member discovery. Never joins legacy identities.
import {FOCUS_KEYS,worldFromRow} from './worlds.mjs';
import {spaceReady} from './space.mjs';
import {readSupporterRewards} from './supporter-rewards.mjs';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const answer=(req,data,status=200)=>new Response(req.method==='HEAD'?null:JSON.stringify(data),{status,headers});
const fail=(req,status)=>answer(req,{error:status===400?'Invalid community filters':status===503?'Member community is temporarily unavailable':'Not found'},status);
function cursor(raw,activity){
 if(raw===null)return null;
 if(raw.length>220)return false;
 try{const v=JSON.parse(atob(raw));return Array.isArray(v)&&v.length===2&&Number.isSafeInteger(v[0])&&v[0]>=0&&typeof v[1]==='string'&&(activity?/^[a-f0-9-]{36}$/:/^[a-z][a-z0-9_]{2,29}$/).test(v[1])?v:false}catch{return false}
}
const encode=(at,key)=>btoa(JSON.stringify([Number(at),key]));
export async function canonicalCommunity(req,env){
 if(!['GET','HEAD'].includes(req.method))return fail(req,405);
 const url=new URL(req.url),activity=url.pathname==='/api/v1/community/activity';
 if(!activity&&url.pathname!=='/api/v1/community/members')return fail(req,404);
 const q=(url.searchParams.get('q')||'').trim(),focus=url.searchParams.get('focus')||'',after=cursor(url.searchParams.get('after'),activity);
 if([...url.searchParams.keys()].some(k=>!['q','focus','after'].includes(k))||q.length>72||/[\u0000-\u001f\u007f]/.test(q)||(focus&&!FOCUS_KEYS.includes(focus))||after===false||[...url.searchParams.keys()].some(k=>url.searchParams.getAll(k).length>1))return fail(req,400);
 const db=env.MEMBER_DB;if(!await spaceReady(db))return fail(req,503);
 try{
  const owner=activity?'w.user_id':'p.user_id',at=activity?'w.created_at':'p.created_at',key=activity?'w.id':'p.handle';
  const where=["p.visibility='public'","u.emailVerified=1"],params=[];
  if(q){const term='%'+q.replace(/^@/,'').replace(/[\\%_]/g,'\\$&')+'%';where.push("(p.handle LIKE ? ESCAPE '\\' OR p.display_name LIKE ? ESCAPE '\\')");params.push(term,term)}
  if(focus){where.push('EXISTS(SELECT 1 FROM json_each(p.focus_json) WHERE value=?)');params.push(focus)}
  if(after){where.push(`(${at}<? OR (${at}=? AND ${key}<?))`);params.push(after[0],after[0],after[1])}
  const sql=`SELECT p.user_id AS member_user_id,p.handle,p.display_name,p.headline,p.world_theme,p.focus_json,p.created_at AS joined_at,
   EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=${owner} AND m.slot='avatar') AS avatar,
   ${activity?'w.id,w.body,w.created_at,w.updated_at':'p.created_at'}
   FROM ${activity?'member_wall_posts w JOIN member_creator_profiles p ON p.user_id=w.user_id':'member_creator_profiles p'}
   JOIN user u ON u.id=p.user_id WHERE ${where.join(' AND ')} ORDER BY ${at} DESC,${key} DESC LIMIT 13`;
  const result=await db.prepare(sql).bind(...params).all();if(result.success===false)throw Error('Unavailable');
  const hasMore=result.results.length>12,rows=result.results.slice(0,12);
  const items=await Promise.all(rows.map(async row=>{
   // Public-only recognition, no account/Stripe IDs or billing metadata
   // leave this endpoint. Absent consent or stale subscription -> no badge.
   const supporter=await readSupporterRewards(env,row.member_user_id,Date.now(),true);
   return {handle:row.handle,displayName:row.display_name,...worldFromRow(row),
     avatar:Boolean(row.avatar),joinedAt:Number(row.joined_at),
     ...(supporter?{supporterAppearance:supporter.selected}:{}),
     ...(activity?{id:row.id,excerpt:row.body.length>360?row.body.slice(0,357)+'…':row.body,createdAt:Number(row.created_at),updatedAt:Number(row.updated_at)}:{})};
  }));
  const last=rows.at(-1);return answer(req,{items,nextCursor:hasMore&&last?encode(last.created_at,activity?last.id:last.handle):null});
 }catch{return fail(req,503)}
}
