/* ANEVUM — Public Alpha Discover bridge v001
   Read-only canonical API adaptation, reviewed/published alpha records only.
   Never updates creator or account data; anonymous labels do not expose private profiles. */
const HOST="https://anevum.com", UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, CAT={html:"games",image:"creative",audio:"creative",video:"creative",document:"learning"};
const SQL="SELECT id,title,summary,kind,published_at FROM anevum_alpha_projects WHERE status='published'";
const META={"x-content-type-options":"nosniff","referrer-policy":"no-referrer","cache-control":"public,max-age=15"};
const key=id=>"alpha_"+id.replace(/-/g,"");
const fromKey=k=>{if(!/^alpha_[0-9a-f]{32}$/.test(k))return null;let t=k.slice(6);let id=t.slice(0,8)+"-"+t.slice(8,12)+"-"+t.slice(12,16)+"-"+t.slice(16,20)+"-"+t.slice(20);return UUID.test(id)?id:null};
const map=p=>({id:key(p.id),slug:"alpha-"+p.id,title:p.title,summary:p.summary,category:CAT[p.kind]||"other",
  license:null,publishedAt:new Date(p.published_at*1000).toISOString(),creatorHandle:null,
  creatorName:"ANEVUM member",sourceUrl:null,demoUrl:HOST+"/play/"+p.id,
  freeToUse:false,alphaRelease:true,releaseSource:"reviewed-upload"});
function native(req,env,pathname){
 const u=new URL(req.url);u.pathname=pathname;const h=new Headers(req.headers);h.delete("host");
 return env.UPSTREAM.fetch(new Request(u.href,{method:req.method,headers:h,redirect:"manual"}));
}
async function list(env){
 const z=await env.DB.prepare(SQL+" ORDER BY published_at DESC LIMIT 96").all();
 if(z.success===false||!Array.isArray(z.results))throw Error("Database unavailable");
 return z.results.filter(p=>UUID.test(p.id)&&CAT[p.kind]&&p.title&&p.published_at>0).map(map);
}
function narrow(items,url){
 if(url.searchParams.get("creator")||url.searchParams.get("free")==="1"||url.searchParams.get("cursor"))return [];
 let c=url.searchParams.get("category")||"",q=(url.searchParams.get("q")||"").toLowerCase().trim();
 return items.filter(p=>(!c||p.category===c)&&(!q||(p.title+" "+p.summary).toLowerCase().includes(q)));
}
function format(data,up,method){
 const h=new Headers(up.headers);for(const k of ["content-length","content-encoding","etag","last-modified","set-cookie"])h.delete(k);
 Object.entries(META).forEach(([k,v])=>h.set(k,v));h.set("content-type","application/json; charset=utf-8");
 h.set("x-anevum-discovery-bridge","v001");
 return new Response(method==="HEAD"?null:JSON.stringify(data),{status:up.status,headers:h});
}
export default {async fetch(req,env){
 const u=new URL(req.url);if(u.hostname!=="anevum.com")return Response.json({error:"Not found"},{status:404});
 let path=u.pathname;
 let preview=false;
 if(path==="/__anevum_alpha_bridge_preview"){path="/api/v1/projects";preview=true;}
 if(path==="/__anevum_alpha_bridge_preview_categories"){path="/api/v1/categories";preview=true;}
 if(path==="/__anevum_alpha_bridge_preview_status"){path="/api/v1/status";preview=true;}
 const m=/^\/api\/v1\/projects\/(alpha_[0-9a-f]{32})$/.exec(path);
 if(m){
  if(!["GET","HEAD"].includes(req.method))return Response.json({error:"Read-only"},{status:405});
  const id=fromKey(m[1]);if(!id)return Response.json({error:"Not found"},{status:404});
  try{
   const x=await env.DB.prepare(SQL+" AND id=? LIMIT 1").bind(id).first();
   if(!x)return Response.json({error:"Not found"},{status:404});
   return new Response(req.method==="HEAD"?null:JSON.stringify({item:{...map(x),description:"Reviewed alpha creation",aiDisclosure:"",humanContribution:""}}),
   {status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=30","x-content-type-options":"nosniff","x-anevum-discovery-bridge":"v001"}});
  }catch{return Response.json({error:"Discovery temporarily unavailable"},{status:503})}
 }
 if(!["/api/v1/projects","/api/v1/categories","/api/v1/status","/api/v1/boards"].includes(path))
  return preview?Response.json({error:"Not found"},{status:404}):native(req,env,path);
 const upstream=await native(req,env,path);
 if(!["GET","HEAD"].includes(req.method)||!upstream.ok||!(upstream.headers.get("content-type")||"").includes("application/json"))return upstream;
 try{
  const data=await upstream.clone().json();if(!data||Array.isArray(data))return upstream;
  const alpha=await list(env);
  if(path==="/api/v1/projects"){
   if(!Array.isArray(data.items))return upstream;
   const limit=Math.min(48,Number(u.searchParams.get("limit")||24)||24);
   const add=narrow(alpha,u).slice(0,limit);
   if(!add.length)return upstream;
   const sort=u.searchParams.get("sort")==="new";
   const merged=sort?[...data.items,...add].sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0)):[...add,...data.items];
   return format({...data,items:merged.slice(0,limit),count:Math.min(limit,merged.length)},upstream,req.method);
  }
  if(path==="/api/v1/categories"){
   if(!Array.isArray(data.categories))return upstream;
   const counts={};for(const p of alpha)counts[p.category]=(counts[p.category]||0)+1;
   const touched=new Set();const categories=data.categories.map(p=>{touched.add(p.category);return {...p,count:Number(p.count||0)+(counts[p.category]||0)}});
   for(const [category,count] of Object.entries(counts))if(!touched.has(category))categories.push({category,count});
   return format({...data,categories},upstream,req.method);
  }
  if(path==="/api/v1/status"){
   if(!data.counts||!Number.isFinite(data.counts.publishedProjects))return upstream;
   return format({...data,counts:{...data.counts,publishedProjects:data.counts.publishedProjects+alpha.length}},upstream,req.method);
  }
  if(path==="/api/v1/boards"){
   if(!Array.isArray(data.latestReleases))return upstream;
   const latest=[...data.latestReleases,...alpha].sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0)).slice(0,12);
   return format({...data,latestReleases:latest},upstream,req.method);
  }
  return upstream;
 }catch{return upstream}
}};