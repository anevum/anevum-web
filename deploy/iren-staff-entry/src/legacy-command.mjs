/* ANEVUM.IREN.PATCH.2026-10-19.001.STAFF-SESSION-ROUTING - legacy command adapter */
const ORIGIN='https://anevum.com';
export default {async fetch(request,env){
 let url;try{url=new URL(request.url)}catch{return new Response('Not found',{status:404})}
 if(url.origin!==ORIGIN||!['/staff/command','/staff/command/'].includes(url.pathname))return new Response('Not found',{status:404});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(!env.LEGACY_STAFF?.fetch)return new Response('Legacy staff UI temporarily unavailable',{status:503});
 const target=new URL(url);target.pathname='/staff';target.search='';
 try{
  const response=await env.LEGACY_STAFF.fetch(new Request(target.href,request));
  const headers=new Headers(response.headers);headers.set('x-anevum-legacy-command','v001');
  headers.set('cache-control','private, no-store');headers.delete('content-length');headers.delete('set-cookie');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }catch{return new Response('Legacy staff UI temporarily unavailable',{status:503,headers:{'cache-control':'no-store'}})}
}};
