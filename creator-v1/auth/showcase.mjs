// Creator V1 V010 - optional, owner-selected earned achievement on public cards.
// Staged migration 0014 is required for writes; no new privileges or XP grants.
const ROOT="/api/v1/member/creators/showcase";
const KEYS=new Set(["first-signal","keen-eye","portal-guide","first-launch","three-builds","release-steward"]);
const sql=(db,text,args=[])=>{const p=db.prepare(text);return args.length?p.bind(...args):p};
async function rows(db,text,args=[]){
  const out=await sql(db,text,args).all();
  if(out?.success===false||!Array.isArray(out?.results))throw Error("Showcase database unavailable");
  return out.results;
}
async function run(db,text,args=[]){
  const out=await sql(db,text,args).run();
  if(out?.success===false)throw Error("Showcase database unavailable");
  return out;
}
export async function readFeaturedPreference(db,id){
  return (await rows(db,"SELECT award_key AS awardKey,revision FROM creator_featured_awards WHERE member_id=?",[id]))[0]||null;
}
export function earnedFeaturedAward(stats,choice,deriveAchievements){
  if(!choice||!KEYS.has(choice))return null;
  return deriveAchievements(stats).find(x=>x.key===choice&&x.earned===true)||null;
}
async function parseSelection(request){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type")||""))
    throw Error("JSON required");
  const length=Number(request.headers.get("content-length")||0);
  if(!Number.isFinite(length)||length>256)throw Error("Payload too large");
  const reader=request.body?.getReader();
  if(!reader)throw Error("Body required");
  let total=0;const chunks=[];
  try {
    while(true){
      const next=await reader.read();
      if(next.done)break;
      total+=next.value.byteLength;
      if(total>256){await reader.cancel();throw Error("Payload too large");}
      chunks.push(next.value);
    }
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;
  for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
  const data=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  if(!data||Array.isArray(data)||typeof data!=="object"||
    Object.keys(data).sort().join(",")!=="awardKey,revision"||
    (data.awardKey!==null&&(typeof data.awardKey!=="string"||!KEYS.has(data.awardKey)))||
    !Number.isSafeInteger(data.revision)||data.revision<0||data.revision>2147483647)
    throw Error("Invalid showcase preference");
  return data;
}

// Handles only the exact private showcase endpoint; caller enforces origin/CSRF.
// Session member comes from a verified member Worker, never from request JSON.
export async function handleFeaturedShowcase(req,db,member,limiter,now,context){
  const {counts,publicProfile,deriveAchievements,response}=context;
  if(new URL(req.url).pathname!==ROOT)return response(req,{error:"Not found"},404);
  if(!member)return response(req,{error:"Sign-in required"},401);
  if(!member.handle)return response(req,{error:"Complete your creator profile first"},409);
  const owner=await publicProfile(db,member.handle);
  if(!owner||owner.id!==member.id)return response(req,{error:"Creator profile unavailable"},403);
  if(req.method==="GET"||req.method==="HEAD"){
    const selection=await readFeaturedPreference(db,member.id);
    const stats=await counts(db,member.id);
    return response(req,{
      selection:{awardKey:selection?.awardKey??null,revision:Number(selection?.revision||0)},
      eligibleAwards:deriveAchievements(stats).filter(x=>x.earned)
    });
  }
  if(req.method!=="POST")return response(req,{error:"Method not allowed"},405);
  let choice;try{choice=await parseSelection(req)}catch{return response(req,{error:"Invalid featured award selection"},400);}
  const stats=await counts(db,member.id);
  if(choice.awardKey!==null&&!earnedFeaturedAward(stats,choice.awardKey,deriveAchievements))
    return response(req,{error:"Earn this achievement before featuring it"},409);
  if(!await limiter(db,"featured-award:"+member.id,now,12,3600))
    return response(req,{error:"Showcase change limit reached"},429);
  const current=await readFeaturedPreference(db,member.id);
  if(choice.revision!==Number(current?.revision||0))
    return response(req,{error:"Your featured award changed; refresh first"},409);
  const out=current
    ?await run(db,"UPDATE creator_featured_awards SET award_key=?,revision=revision+1,updated_at=? WHERE member_id=? AND revision=? AND EXISTS(SELECT 1 FROM creator_profiles WHERE member_id=? AND status='active')",
      [choice.awardKey,now,member.id,choice.revision,member.id])
    :await run(db,"INSERT INTO creator_featured_awards(member_id,award_key,revision,updated_at) SELECT ?,?,1,? WHERE EXISTS(SELECT 1 FROM creator_profiles WHERE member_id=? AND status='active') ON CONFLICT(member_id) DO NOTHING",
      [member.id,choice.awardKey,now,member.id]);
  if(Number(out.meta?.changes??out.meta?.rows_written??0)!==1)
    return response(req,{error:"Your featured award changed; refresh first"},409);
  return response(req,{selection:{awardKey:choice.awardKey,revision:choice.revision+1}});
}
