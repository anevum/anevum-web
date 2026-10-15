// ANEVUM V009 -- isolated, no-database, read-only creator-network visual review.
const HOST="anevum-v009-visual-review-20261014.devonakins.workers.dev";
const PUBLIC=/^\/api\/v1\/(?:status|categories|boards|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?|community\/posts(?:\/[a-f0-9]{32})?)$/i;
const BASE={
  "x-content-type-options":"nosniff",
  "x-anevum-review":"V009-isolated-read-only",
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
  for(const sensitive of ["set-cookie","location","access-control-allow-credentials"])headers.delete(sensitive);
  const html=(headers.get("content-type")||"").includes("text/html");
  if(html){
    headers.set("content-security-policy",CSP);
    const banner='<div role="status" aria-label="Unpublished design preview" style="position:fixed;bottom:10px;left:10px;z-index:99999;max-width:calc(100vw - 20px);padding:7px 11px;border:1px solid #c6e7ff;border-radius:12px;background:#07152af2;color:#d6f5ff;font:700 10px/1.3 system-ui,sans-serif;box-shadow:0 5px 20px #000c;pointer-events:none">V009 DESIGN REVIEW · READ ONLY · NOT THE LIVE SITE</div>';
    const body=(await response.text()).replace("</body>",banner+"</body>");
    return new Response(body,{status:response.status,statusText:response.statusText,headers});
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.protocol!=="https:"||url.hostname!==HOST)return reject("Not found");
    if(request.method!=="GET"&&request.method!=="HEAD")return reject("Read-only V009 review",405);
    if(url.pathname==="/robots.txt")return reject(request.method==="HEAD"?null:"User-agent: *\nDisallow: /\n",200);
    if(url.pathname==="/__review")return reject(request.method==="HEAD"?null:JSON.stringify({
      project:"ANEVUM CREATOR V009",status:"DESIGN PREVIEW",database:false,memberAccess:false,privateMessaging:false,nativeCreatorHosting:false,firstPartyPlayerLab:false,communityPostsOpen:false,
      productionDeployment:false,publicProjectData:"anonymous read-only a.anevum.com API"
    }),200,"application/json; charset=utf-8");
    if(url.pathname.startsWith("/api/")){
      if(!PUBLIC.test(url.pathname))return reject("Not found");
      // Explicit anonymous, GET-only, public catalogue proxy. Never forward sessions or credentials.
      const target="https://a.anevum.com"+url.pathname+url.search;
      try{
        const response=await fetch(target,{method:request.method,headers:{accept:"application/json"},redirect:"manual"});
        if(!response.ok||!(response.headers.get("content-type")||"").includes("application/json"))
          return reject(JSON.stringify({error:"Public catalogue temporarily unavailable"}),503,"application/json; charset=utf-8");
        return await safe(response);
      }catch{
        return reject(JSON.stringify({error:"Public catalogue temporarily unavailable"}),503,"application/json; charset=utf-8");
      }
    }
    if(url.pathname.startsWith("/__")||url.pathname.startsWith("/.well-known"))return reject("Not found");
    // No cookies or authorization are forwarded to the static asset binding.
    const clean=new Request(url.href,{method:request.method,headers:{accept:request.headers.get("accept")||"*/*"}});
    return await safe(await env.ASSETS.fetch(clean));
  }
};
