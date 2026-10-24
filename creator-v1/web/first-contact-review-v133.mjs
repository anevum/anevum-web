// ANEVUM V133 — isolated first-contact read-only preview. No account,
// private catalogue, member data, API credentials or production routes.
const HOST="anevum-first-contact-v133-review.devonakins.workers.dev";
const PUBLIC=/^\/api\/v1\/(?:status|categories|boards|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?|community\/(?:posts(?:\/[A-Za-z0-9_-]+)?|showcases))$/i;
const BASE={
  "x-content-type-options":"nosniff",
  "x-robots-tag":"noindex, nofollow",
  "cache-control":"private, no-store",
  "referrer-policy":"no-referrer",
  "x-frame-options":"DENY",
  "cross-origin-resource-policy":"same-origin",
  "permissions-policy":"camera=(), microphone=(), geolocation=(), payment=()"
};
const CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; worker-src 'none'";
function reject(body,status=404,type="text/plain; charset=utf-8"){
  return new Response(body,{status,headers:{...BASE,"content-type":type}});
}
async function safe(response){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(BASE))headers.set(key,value);
  headers.delete("set-cookie");
  headers.delete("access-control-allow-origin");
  headers.set("x-anevum-preview","V133-READ-ONLY");
  const isHtml=(headers.get("content-type")||"").includes("text/html");
  if(isHtml){
    headers.set("content-security-policy",CSP);
    // The same real React app is visibly labelled as a non-signup visual preview.
    // This inserts outside the React root; it is not synthetic project content.
    const banner='<div role="note" aria-label="Read-only preview environment" style="position:fixed;left:10px;bottom:10px;z-index:2147483000;max-width:calc(100vw - 130px);padding:7px 10px;border:1px solid #c4a4c7;border-radius:7px;background:#141829f2;color:#ffe0c6;font:700 10px/1.35 system-ui,sans-serif;pointer-events:none">READ-ONLY PREVIEW · JOIN ON ANEVUM.COM</div>';
    const html=(await response.text()).replace("</body>",banner+"</body>");
    headers.delete("content-length");
    headers.delete("content-encoding");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.protocol!=="https:"||url.hostname!==HOST)return reject("Not found");
    if(request.method!=="GET"&&request.method!=="HEAD")return reject("Read-only Atlas review",405);
    if(url.pathname==="/robots.txt")return reject(request.method==="HEAD"?null:"User-agent: *\nDisallow: /\n",200);
    if(url.pathname==="/__review")return reject(request.method==="HEAD"?null:JSON.stringify({
      project:"ANEVUM FIRST CONTACT V133",status:"DESIGN PREVIEW",database:false,memberAccess:false,privateMessaging:false,
      productionDeployment:false,publicProjectData:"anonymous read-only anevum.com API",
      notice:"Read-only visual inspection. Sign up only on anevum.com."
    }),200,"application/json; charset=utf-8");
    if(url.pathname.startsWith("/api/")){
      if(!PUBLIC.test(url.pathname)||url.search.length>1400||
        [...url.searchParams.keys()].some(k=>/token|password|email|secret|key|session/i.test(k)))return reject("Not found");
      // Explicit anonymous, GET-only, public catalogue proxy. Never forward sessions or credentials.
      const target="https://anevum.com"+url.pathname+url.search;
      try{
        const response=await fetch(target,{method:request.method,headers:{accept:"application/json"},redirect:"manual"});
        if(!response.ok||!(response.headers.get("content-type")||"").includes("application/json"))
          return reject(JSON.stringify({error:"Public catalogue temporarily unavailable"}),503,"application/json; charset=utf-8");
        return safe(response);
      }catch{
        return reject(JSON.stringify({error:"Public catalogue temporarily unavailable"}),503,"application/json; charset=utf-8");
      }
    }
    if(url.pathname.startsWith("/__")||url.pathname.startsWith("/.well-known"))return reject("Not found");
    // No cookies or authorization are forwarded to the static asset binding.
    const clean=new Request(url.href,{method:request.method,headers:{accept:request.headers.get("accept")||"*/*"}});
    return safe(await env.ASSETS.fetch(clean));
  }
};
