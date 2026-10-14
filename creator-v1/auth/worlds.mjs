// ANEVUM Creator V1 — guarded member-owned worlds, staging source only.
// Requires MEMBER_WORLDS_ENABLED=true AND a verified isolated migration 0010.
// New profiles are PRIVATE until their owner explicitly selects public.
const ROOT="/api/v1/member";
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const THEMES=new Set(["astral","ember","verdigris","obsidian"]);
const SCENES=new Set(["portal","games","research","creative"]);
const SECTIONS=new Set(["work","cabinet","community"]);
const DEFAULT=Object.freeze({
  visibility:"private",theme:"astral",scene:"portal",
  sections:Object.freeze(["work","cabinet","community"])
});
const HEADERS={
  "content-type":"application/json; charset=utf-8","cache-control":"private, no-store",
  "x-content-type-options":"nosniff","referrer-policy":"no-referrer",
  "x-robots-tag":"noindex, nofollow"
};
const reply=(req,obj,status=200)=>new Response(req.method==="HEAD"?null:JSON.stringify(obj),{status,headers:HEADERS});
const sql=(db,q,args=[])=>{const s=db.prepare(q);return args.length?s.bind(...args):s;};
async function rows(db,q,args=[]){
  const r=await sql(db,q,args).all();
  if(r?.success===false||!Array.isArray(r?.results))throw Error("Database unavailable");
  return r.results;
}
async function run(db,q,args=[]){
  const r=await sql(db,q,args).run();
  if(r?.success===false)throw Error("Database unavailable");
  return r;
}
function parseRow(row){
  const sections=JSON.parse(row.section_order);
  if(!Array.isArray(sections)||sections.length!==3||
    new Set(sections).size!==3||!sections.every(item=>SECTIONS.has(item)))throw Error("Invalid saved sections");
  if(!["private","public"].includes(row.visibility)||!THEMES.has(row.theme)||!SCENES.has(row.scene))throw Error("Invalid saved world");
  return {visibility:row.visibility,theme:row.theme,scene:row.scene,sections};
}
async function boundedJson(req){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get("content-type")||""))return null;
  if(Number(req.headers.get("content-length")||0)>768||!req.body)return null;
  const reader=req.body.getReader();let count=0;const parts=[];
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      count+=value.byteLength;
      if(count>768){await reader.cancel();return null;}
      parts.push(value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(count);let index=0;
  for(const part of parts){bytes.set(part,index);index+=part.byteLength;}
  try{
    const value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
    if(!value||typeof value!=="object"||Array.isArray(value))return null;
    if(Object.keys(value).sort().join(",")!=="scene,sections,theme,visibility")return null;
    if(!["public","private"].includes(value.visibility))return null;
    if(!THEMES.has(value.theme)||!SCENES.has(value.scene))return null;
    if(!Array.isArray(value.sections)||value.sections.length!==3||
       new Set(value.sections).size!==3||!value.sections.every(item=>typeof item==="string"&&SECTIONS.has(item)))return null;
    return value;
  }catch{return null;}
}
export async function worldRoutes(req,db,member,limiter,now){
  const pathname=new URL(req.url).pathname;
  const publicMatch=/^\/api\/v1\/member\/worlds\/([a-z][a-z0-9_]{2,29})$/.exec(pathname);
  if(publicMatch){
    if(!["GET","HEAD"].includes(req.method))return reply(req,{error:"Method not allowed"},405);
    try{
      const profile=await rows(db,`SELECT c.handle,c.display_name AS displayName,c.bio,
         w.theme,w.scene,w.section_order,w.visibility
         FROM member_world_appearances w
         JOIN creator_profiles c ON c.member_id=w.member_id
         JOIN member_accounts a ON a.id=w.member_id
         WHERE c.handle=? AND c.status='active' AND a.status='active'
           AND w.visibility='public' LIMIT 1`,[publicMatch[1]]);
      if(profile.length!==1)return reply(req,{error:"Member world not found"},404);
      const row=profile[0];
      return reply(req,{profile:{handle:row.handle,displayName:row.displayName,bio:row.bio||""},
        appearance:parseRow(row)});
    }catch{return reply(req,{error:"Member worlds unavailable"},503);}
  }
  if(pathname!==ROOT+"/world")return reply(req,{error:"Not found"},404);
  if(!member)return reply(req,{error:"Sign-in required"},401);
  if(!member.handle||!HANDLE.test(member.handle))return reply(req,{error:"Complete your member profile first"},409);
  if(!["GET","HEAD","POST"].includes(req.method))return reply(req,{error:"Method not allowed"},405);
  try{
    if(req.method==="POST"){
      const data=await boundedJson(req);
      if(!data)return reply(req,{error:"Invalid world appearance"},400);
      if(!await limiter(db,"world:"+member.id,now,20,3600))return reply(req,{error:"Too many profile appearance changes"},429);
      await run(db,`INSERT INTO member_world_appearances(member_id,visibility,theme,scene,section_order,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?)
         ON CONFLICT(member_id) DO UPDATE SET visibility=excluded.visibility,theme=excluded.theme,
           scene=excluded.scene,section_order=excluded.section_order,updated_at=excluded.updated_at`,
        [member.id,data.visibility,data.theme,data.scene,JSON.stringify(data.sections),now,now]);
    }
    const result=await rows(db,`SELECT visibility,theme,scene,section_order FROM member_world_appearances WHERE member_id=? LIMIT 1`,[member.id]);
    const appearance=result.length===1?parseRow(result[0]):DEFAULT;
    return reply(req,{appearance,saved:req.method==="POST"});
  }catch{return reply(req,{error:"Member worlds unavailable"},503);}
}
