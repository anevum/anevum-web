/* IREN staff diagnostics: inspect current browser session without exposing identities or tokens. */
const ORIGIN='https://anevum.com';
export default {async fetch(request,env){
  let url;try{url=new URL(request.url)}catch{return new Response('Not found',{status:404})}
  if(url.origin!==ORIGIN||url.pathname!=='/staff/access-check'||url.search||request.method!=='GET')return new Response('Not found',{status:404});
  if(!env?.ENTRY?.fetch)return Response.json({access:'unavailable',reason:'verification_service_missing'},{status:503,headers:{'cache-control':'no-store'}});
  const cookie=request.headers.get('cookie')||'';
  if(cookie.length>8192)return Response.json({access:'signed_out',reason:'cookie_too_large'},{status:401,headers:{'cache-control':'no-store'}});
  const upstream=new Request(ORIGIN+'/staff?diagnose=1',{method:'GET',headers:{cookie,accept:'application/json'},cache:'no-store',redirect:'error'});
  try{
    const response=await env.ENTRY.fetch(upstream);
    if(!response.ok || !response.headers.get('content-type')?.includes('application/json'))return Response.json({access:'unavailable',reason:'diagnostic_unavailable'},{status:503,headers:{'cache-control':'no-store'}});
    const body=await response.text();
    return new Response(body,{status:200,headers:{'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','vary':'Cookie','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
  }catch{return Response.json({access:'unavailable',reason:'diagnostic_request_failed'},{status:503,headers:{'cache-control':'no-store'} })}
}};