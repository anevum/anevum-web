// Owner-only historical viewer. Never forwards accounts, cookies or mutations.
const ARCHIVE_HEADERS = { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY', 'Referrer-Policy':'no-referrer' };
function message(text, status) { return new Response(text, { status, headers:{...ARCHIVE_HEADERS,'Content-Type':'text/plain; charset=utf-8'} }); }
function decode(text) { return Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)); }
export async function verifyArchiveAccess(token, env, fetcher = fetch, now = Math.floor(Date.now()/1000)) {
  if(typeof token!=='string'||token.length>16384)throw new Error('Invalid assertion');
  const parts=token.split('.');if(parts.length!==3)throw new Error('Invalid assertion');
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),payload=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const issuer=String(env.ACCESS_ISSUER||'').replace(/\/$/,'');
  if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!env.ACCESS_AUDIENCE)throw new Error('Access configuration required');
  if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>200)throw new Error('Invalid signing key');
  const aud=Array.isArray(payload.aud)?payload.aud:[payload.aud];
  if(payload.iss!==issuer||!aud.includes(env.ACCESS_AUDIENCE)||!Number.isFinite(payload.exp)||payload.exp<=now||(payload.nbf!==undefined&&(!Number.isFinite(payload.nbf)||payload.nbf>now))||(payload.iat!==undefined&&(!Number.isFinite(payload.iat)||payload.iat>now+60)))throw new Error('Invalid claims');
  const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():'';
  const allowed=String(env.ACCESS_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!email||!allowed.includes(email))throw new Error('Identity not allowed');
  const response=await fetcher(issuer+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Signing keys unavailable');
  const {keys}=await response.json();const jwk=Array.isArray(keys)?keys.find(k=>k.kid===header.kid):null;
  if(!jwk)throw new Error('Unknown signing key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid signature');
  return true;
}
export function archivePathAllowed(path) {
  return /^\/(?:$|(?:about|resume|products|field-notes|feed)(?:\/[^?]*)?$|assets\/[A-Za-z0-9._/-]+$|(?:favicon\.svg|icon-\d+\.png|apple-touch-icon(?:-precomposed)?\.png|site\.webmanifest|devon-akins-resume\.pdf)$)/.test(path) && !path.includes('..');
}
export async function archiveFetch(request, env, verify = verifyArchiveAccess) {
  const url=new URL(request.url);
  if(url.hostname!=='backstage.anevum.com')return message('Not found',404);
  if(!['GET','HEAD'].includes(request.method))return new Response('Read-only archive',{status:405,headers:{...ARCHIVE_HEADERS,Allow:'GET, HEAD'}});
  try{await verify(request.headers.get('cf-access-jwt-assertion')||'',env);}catch{return message('Owner authentication required',401);}
  if(!archivePathAllowed(url.pathname))return message('This historical archive does not run account APIs, administration or trading controls.',410);
  if(!env.LEGACY)return message('Archive source unavailable',503);
  try{
    // Only public historical page/asset requests reach the retained deployment.
    const upstream=new Request(url.href,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*'}});
    const response=await env.LEGACY.fetch(upstream);
    if(response.status>=300&&response.status<400)return message('Archived redirects are disabled. Open the archive homepage.',410);
    const headers=new Headers(response.headers);headers.delete('set-cookie');for(const [key,value] of Object.entries(ARCHIVE_HEADERS))headers.set(key,value);
    if(request.method==='HEAD')return new Response(null,{status:response.status,headers});
    if((headers.get('content-type')||'').includes('text/html')){
      for(const key of ['content-length','content-encoding','etag','last-modified'])headers.delete(key);
      const html=(await response.text()).replace(/<body[^>]*>/i,match=>match+'<aside role="status">Archived ANEVUM V5 &mdash; read-only historical build. Sign-in, live controls and account APIs are disabled.</aside>');
      return new Response(html,{status:response.status,headers});
    }
    return new Response(response.body,{status:response.status,headers});
  }catch{return message('Archive source unavailable',503);}
}
export default {fetch(request, env) { return archiveFetch(request, env); }};
