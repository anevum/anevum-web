// ANEVUM 1.0 public discovery API; separate D1, no V5 or RHEN bindings.
// Canonical session ANEVUM.WEB.BUILD.2026-10-11.002.CREATOR-V1-FOUNDATION
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','access-control-allow-origin':'https://anevum.com','vary':'Origin'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS})}
export default {async fetch(req,env){
 const url=new URL(req.url),path=url.pathname;
 if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Read-only API; authenticated publishing not enabled'},405);
 if(path==='/health')return json({service:'anevum-creator-v1',status:'ok',database:env.COMMUNITY_DB?'bound':'not_bound'});
 if(path!=='/api/v1/projects'&&path!=='/api/v1/categories')return json({error:'Not found'},404);
 if(!env.COMMUNITY_DB)return json({error:'Community database unavailable'},503);
 try {
  if(path==='/api/v1/categories'){
   const result=await env.COMMUNITY_DB.prepare("SELECT category, COUNT(*) AS count FROM projects WHERE status='published' GROUP BY category ORDER BY category").all();
   return json({categories:result.results||[]});
  }
  const raw=Number(url.searchParams.get('limit')||'24'),limit=Math.min(48,Math.max(1,Number.isFinite(raw)?Math.trunc(raw):24));
  const cursor=url.searchParams.get('cursor')||'';
  if(cursor.length>80)return json({error:'Invalid cursor'},400);
  const category=url.searchParams.get('category')||'';
  const categories=['tools','games','automation','research','creative','learning','libraries','other'];
  if(category&&!categories.includes(category))return json({error:'Invalid category'},400);
  const q=(url.searchParams.get('q')||'').trim().slice(0,100).replace(/[\\%_]/g,'');
  const args=[cursor];
  let sql="SELECT p.id, p.slug, p.title, p.summary, p.category, p.source_url AS sourceUrl, p.demo_url AS demoUrl, p.free_to_use AS freeToUse, p.license_name AS license, p.published_at AS publishedAt, c.handle AS creatorHandle, c.display_name AS creatorName FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.status='published' AND c.status='active' AND p.id > ?";
  if(category){sql+=' AND p.category=?';args.push(category)}
  if(q){sql+=" AND (p.title LIKE ? OR p.summary LIKE ?)";args.push('%'+q+'%','%'+q+'%')}
  sql+=' ORDER BY p.id ASC LIMIT ?';args.push(limit+1);
  const result=await env.COMMUNITY_DB.prepare(sql).bind(...args).all();
  const rows=result.results||[],items=rows.slice(0,limit);
  return json({items,nextCursor:rows.length>limit?items[items.length-1].id:null,count:items.length});
 }catch{return json({error:'Service temporarily unavailable'},503)}
}};
