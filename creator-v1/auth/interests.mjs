// Staging-only private member discovery interests; never public-profile data.
// Authentication and same-origin POST protection live in the Member Worker.
const ROUTE='/api/v1/member/interests';
export const INTEREST_CATEGORIES=Object.freeze(['tools','games','automation','research','creative','learning','libraries','other']);
const permitted=new Set(INTEREST_CATEGORIES);
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow','vary':'Cookie'};
function respond(req,value,status=200){return new Response(req.method==='HEAD'?null:JSON.stringify(value),{status,headers});}
const error=(req,message,status)=>respond(req,{error:message},status);
const statement=(db,sql,params=[])=>params.length?db.prepare(sql).bind(...params):db.prepare(sql);
async function rows(db,sql,params=[]){
 const data=await statement(db,sql,params).all();
 if(data?.success===false||!Array.isArray(data?.results))throw Error('Discovery storage unavailable');
 return data.results;
}
async function parseSelection(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return null;
 const declared=req.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>1024))return null;
 if(!req.body)return null;
 const reader=req.body.getReader(),chunks=[];
 let bytes=0;
 try{
  for(;;){
   const {value,done}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>1024){await reader.cancel();return null;}
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const buffer=new Uint8Array(bytes);let offset=0;
 for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
 let input;
 try{input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));}catch{return null;}
 if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).length!==1||
    !Object.hasOwn(input,'categories')||!Array.isArray(input.categories)||input.categories.length>8)return null;
 if(input.categories.some(value=>typeof value!=='string'||!permitted.has(value)))return null;
 if(new Set(input.categories).size!==input.categories.length)return null;
 return INTEREST_CATEGORIES.filter(category=>input.categories.includes(category));
}
export async function interestsRoutes(req,db,member,rateLimit,now){
 const url=new URL(req.url);
 if(url.pathname!==ROUTE||url.search)return error(req,'Not found',404);
 if(!member)return error(req,'Sign-in required',401);
 if(req.method==='GET'||req.method==='HEAD'){
  try{
   const records=await rows(db,'SELECT categories_json AS categoriesJson,updated_at AS updatedAt FROM member_discovery_preferences WHERE member_id=?',[member.id]);
   const found=records[0];
   if(!found)return respond(req,{categories:[],updatedAt:null});
   const categories=JSON.parse(found.categoriesJson);
   if(!Array.isArray(categories)||categories.some(x=>!permitted.has(x))||new Set(categories).size!==categories.length)return error(req,'Discovery preferences unavailable',503);
   return respond(req,{categories,updatedAt:found.updatedAt});
  }catch{return error(req,'Discovery preferences unavailable',503);}
 }
 if(req.method!=='POST')return error(req,'Method not allowed',405);
 const categories=await parseSelection(req);
 if(!categories)return error(req,'Select zero to eight valid interests',400);
 try{
  if(!await rateLimit(db,'interests:'+member.id,now,20,3600))return error(req,'Too many preference changes',429);
  // The primary key and member foreign key are derived exclusively from the
  // authenticated session, never from a client-provided account identifier.
  const updated=await rows(db,`INSERT INTO member_discovery_preferences(member_id,categories_json,updated_at)
      SELECT id,?,? FROM member_accounts WHERE id=? AND status='active'
      ON CONFLICT(member_id) DO UPDATE SET categories_json=excluded.categories_json,updated_at=excluded.updated_at
      RETURNING categories_json AS categoriesJson,updated_at AS updatedAt`,
      [JSON.stringify(categories),now,member.id]);
  if(updated.length!==1)return error(req,'Account unavailable',403);
  return respond(req,{categories,updatedAt:updated[0].updatedAt,saved:true});
 }catch{return error(req,'Discovery preferences unavailable',503);}
}
