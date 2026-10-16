import {boundedText} from './request-body.mjs';

export const MILESTONES=Object.freeze([
 {id:'first_signal',name:'First Signal',detail:'Save your first wall entry.',xp:10,symbol:'✦'},
 {id:'world_shaper',name:'World Shaper',detail:'Add an introduction, portrait and banner.',xp:25,symbol:'◈'}
]);
const HEADERS={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'};
const json=(value,status=200)=>Response.json(value,{status,headers:HEADERS});
const error=(status,message)=>json({error:message},status);
const keys=(v,expected)=>Object.keys(v).sort().join(',')===expected.sort().join(',');
async function input(req,max=9000){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const text=await boundedText(req,max);if(text===null)return null;
 try{const v=JSON.parse(text);return v&&typeof v==='object'&&!Array.isArray(v)?v:null}catch{return null}
}
export async function spaceReady(db){
 try{const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_space_media','member_space_settings','member_wall_posts','member_space_milestones')").all();return r.results?.length===4}catch{return false}
}
async function rows(db,sql,...args){const r=await db.prepare(sql).bind(...args).all();if(!r.success)throw Error('Space unavailable');return r.results}
async function allowance(db,id,now){
 const r=await rows(db,"INSERT INTO member_creator_edit_limits(user_id,window_start,requests) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,requests=CASE WHEN window_start<? THEN 1 ELSE requests+1 END WHERE window_start<? OR requests<20 RETURNING requests",id,now,now-3600,now-3600,now-3600);
 return r.length===1;
}
export async function grantMilestones(db,id,now){
 // Idempotent insert selected from authoritative records, never client XP.
 await db.batch([
  db.prepare("INSERT OR IGNORE INTO member_space_milestones(user_id,milestone,earned_at) SELECT ?, 'first_signal', ? WHERE EXISTS(SELECT 1 FROM member_wall_posts WHERE user_id=?)").bind(id,now,id),
  db.prepare("INSERT OR IGNORE INTO member_space_milestones(user_id,milestone,earned_at) SELECT ?, 'world_shaper', ? WHERE EXISTS(SELECT 1 FROM member_creator_profiles WHERE user_id=? AND length(bio)>0) AND (SELECT COUNT(*) FROM member_space_media WHERE user_id=?)=2").bind(id,now,id,id)
 ]);
}
export async function spaceSnapshot(db,id){
 const mediaRows=await rows(db,'SELECT slot,version FROM member_space_media WHERE user_id=?',id);
 const earned=await rows(db,'SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?',id);
 const settings=await db.prepare('SELECT featured_json,show_stats,revision FROM member_space_settings WHERE user_id=?').bind(id).first();
 const count=await db.prepare('SELECT COUNT(*) AS count FROM member_wall_posts WHERE user_id=?').bind(id).first();
 const awards=MILESTONES.map(item=>({...item,earnedAt:Number(earned.find(e=>e.milestone===item.id)?.earned_at)||null}));
 const xp=awards.reduce((sum,item)=>sum+(item.earnedAt?item.xp:0),0);
 const level=1+Math.floor(Math.sqrt(xp/25));
 const levelStart=25*(level-1)**2,nextLevel=25*level**2;
 let featured=[];try{featured=JSON.parse(settings?.featured_json||'[]')}catch{}
 return {media:Object.fromEntries(mediaRows.map(r=>[r.slot,Number(r.version)])),
  awards,featuredAwards:featured.filter(id=>awards.some(a=>a.id===id&&a.earnedAt)),
  showStats:settings?.show_stats!==0,revision:Number(settings?.revision)||0,
  stats:{wallPosts:Number(count?.count)||0,awards:earned.length,xp,level,levelStart,nextLevel}};
}
async function wall(db,id){
 return (await rows(db,'SELECT id,body,created_at,updated_at,revision FROM member_wall_posts WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 50',id)).map(r=>({id:r.id,body:r.body,createdAt:Number(r.created_at),updatedAt:Number(r.updated_at),revision:Number(r.revision)}));
}
// Restrict raster uploads to bounded JPEGs. Browser canvas strips metadata and
// crops before upload. No SVG, remote URLs, HTML or user-supplied MIME values.
export function jpegDimensions(bytes){
 if(bytes.length<12||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)return null;
 let i=2;
 while(i+4<bytes.length){
  if(bytes[i++]!==255)return null;
  while(bytes[i]===255)i++;
  const marker=bytes[i++];if(marker===0xDA||marker===0xD9)return null;
  if(marker===0x01||(marker>=0xD0&&marker<=0xD7))continue;
  const length=(bytes[i]<<8)|bytes[i+1];
  if(length<2||i+length>bytes.length)return null;
  if([0xC0,0xC1,0xC2].includes(marker))return length>=8?{height:(bytes[i+3]<<8)|bytes[i+4],width:(bytes[i+5]<<8)|bytes[i+6]}:null;
  i+=length;
 }
 return null;
}
async function imageBody(req){
 if(req.headers.get('content-type')!=='image/jpeg')return null;
 const reader=req.body?.getReader();if(!reader)return null;
 const parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();return null}parts.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length}return bytes;
 }finally{reader.releaseLock()}
}
function imageResponse(data){
 const bytes=data instanceof ArrayBuffer?new Uint8Array(data):new Uint8Array(data);
 return new Response(bytes,{headers:{...HEADERS,'content-type':'image/jpeg','content-security-policy':"default-src 'none'; sandbox",'content-disposition':'inline'}});
}
export async function canonicalSpace(req,env,user,publicHandle=null,now=Math.floor(Date.now()/1000)){
 const db=env.MEMBER_DB;
 if(!await spaceReady(db))return error(503,'Member space is being prepared. Try again shortly.');
 const path=new URL(req.url).pathname;
 if(new URL(req.url).search)return error(400,'Query not supported');
 try{
  const isPublic=publicHandle!==null;
  let id=user?.id;
  if(isPublic){
   const p=await db.prepare("SELECT p.user_id FROM member_creator_profiles p JOIN user u ON p.user_id=u.id WHERE p.handle=? AND p.visibility='public' AND u.emailVerified=1").bind(publicHandle).first();
   if(!p)return error(404,'Profile not public');id=p.user_id;
  }else{
   if(!user||user.emailVerified!==true)return error(403,'Verified member email required');
   const p=await db.prepare('SELECT handle FROM member_creator_profiles WHERE user_id=?').bind(id).first();
   if(!p)return error(409,'Choose your handle before customizing your space.');
  }
  const media=path.match(/\/media\/(avatar|banner)$/);
  if(media){
   const slot=media[1];
   if(req.method==='GET'){
    const row=await db.prepare('SELECT data FROM member_space_media WHERE user_id=? AND slot=?').bind(id,slot).first();
    return row?imageResponse(row.data):error(404,'Image not found');
   }
   if(isPublic)return error(405,'Read only');
   if(req.method==='DELETE'){
    if(!await allowance(db,id,now))return error(429,'Too many changes. Try again in an hour.');
    await db.prepare('DELETE FROM member_space_media WHERE user_id=? AND slot=?').bind(id,slot).run();return json({ok:true});
   }
   if(req.method!=='PUT')return error(405,'Method not allowed');
   const bytes=await imageBody(req),dimensions=bytes&&jpegDimensions(bytes);
   if(!dimensions||dimensions.width<64||dimensions.height<64||dimensions.width>1600||dimensions.height>900||
      (slot==='avatar'&&(dimensions.width!==dimensions.height||dimensions.width>512)))return error(400,'Use a cropped JPEG image under 256 KB.');
   if(!await allowance(db,id,now))return error(429,'Too many changes. Try again in an hour.');
   await db.prepare('INSERT INTO member_space_media(user_id,slot,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,slot) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at,version=version+1').bind(id,slot,bytes.buffer,now).run();
   await grantMilestones(db,id,now);return json({ok:true});
  }
  const postId=path.match(/\/wall\/([a-f0-9-]{36})$/)?.[1];
  if(path.endsWith('/wall')||postId){
   if(req.method==='GET'&&!postId)return json({posts:await wall(db,id)});
   if(isPublic)return error(405,'Read only');
   if(req.method==='DELETE'&&postId){
    if(!await allowance(db,id,now))return error(429,'Too many changes. Try again in an hour.');
    const deleted=await rows(db,'DELETE FROM member_wall_posts WHERE user_id=? AND id=? RETURNING id',id,postId);
    return deleted.length?json({ok:true}):error(404,'Entry not found');
   }
   if(!['POST','PATCH'].includes(req.method)||Boolean(postId)!==(req.method==='PATCH'))return error(405,'Method not allowed');
   const body=await input(req);
   if(!body||!keys(body,postId?['body','revision']:Object.hasOwn(body,'expectedVisibility')?['body','expectedVisibility']:['body'])||typeof body.body!=='string'||!body.body.trim()||body.body.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body.body)||
     (!postId&&Object.hasOwn(body,'expectedVisibility')&&!['public','private'].includes(body.expectedVisibility))||
     (postId&&(!Number.isSafeInteger(body.revision)||body.revision<1)))return error(400,'Write an entry of 1–2,000 characters.');
   if(!await allowance(db,id,now))return error(429,'Too many changes. Try again in an hour.');
   if(postId){
    const changed=await rows(db,'UPDATE member_wall_posts SET body=?,updated_at=?,revision=revision+1 WHERE user_id=? AND id=? AND revision=? RETURNING id',body.body.trim(),now,id,postId,body.revision);
    if(!changed.length)return error(409,'Entry changed. Reload before editing.');
   }else{
    const count=await db.prepare('SELECT COUNT(*) AS count FROM member_wall_posts WHERE user_id=?').bind(id).first();
    if(count.count>=50)return error(409,'Your wall holds 50 entries. Remove an older entry before posting.');
    const inserted=await rows(db,'INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_wall_posts WHERE user_id=?)<50 AND (? IS NULL OR EXISTS(SELECT 1 FROM member_creator_profiles WHERE user_id=? AND visibility=?)) RETURNING id',crypto.randomUUID(),id,body.body.trim(),now,now,id,body.expectedVisibility??null,id,body.expectedVisibility??null);
    if(!inserted.length)return error(409,'Your wall or its visibility changed. Reload before posting.');
   }
   await grantMilestones(db,id,now);return json({ok:true},postId?200:201);
  }
  if(path.endsWith('/space')){
   if(req.method==='GET'){
    const data=await spaceSnapshot(db,id);
    if(isPublic){delete data.revision;if(!data.showStats)delete data.stats;data.awards=data.awards.filter(a=>a.earnedAt&&data.featuredAwards.includes(a.id));}
    return json(data);
   }
   if(isPublic||req.method!=='PATCH')return error(405,'Read only');
   const body=await input(req,1000);
   if(!body||!keys(body,['featuredAwards','showStats','revision'])||typeof body.showStats!=='boolean'||!Number.isSafeInteger(body.revision)||body.revision<0||!Array.isArray(body.featuredAwards)||body.featuredAwards.length>3||new Set(body.featuredAwards).size!==body.featuredAwards.length)return error(400,'Invalid display preferences');
   const snapshot=await spaceSnapshot(db,id);
   if(body.featuredAwards.some(key=>!snapshot.awards.some(a=>a.id===key&&a.earnedAt)))return error(400,'Only earned awards can be displayed');
   if(!await allowance(db,id,now))return error(429,'Too many changes. Try again in an hour.');
   const changed=body.revision===0?
    await rows(db,'INSERT INTO member_space_settings(user_id,featured_json,show_stats) VALUES(?,?,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision',id,JSON.stringify(body.featuredAwards),Number(body.showStats)):
    await rows(db,'UPDATE member_space_settings SET featured_json=?,show_stats=?,revision=revision+1 WHERE user_id=? AND revision=? RETURNING revision',JSON.stringify(body.featuredAwards),Number(body.showStats),id,body.revision);
   if(!changed.length)return error(409,'Display preferences changed. Reload before saving.');
   return json(await spaceSnapshot(db,id));
  }
  return error(404,'Not found');
 }catch{return error(503,'Member space could not be saved or loaded. Try again.');}
}
