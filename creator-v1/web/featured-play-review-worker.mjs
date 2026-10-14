// ANEVUM COMMUNITY FEED — isolated read-only creator-network review, with no private resource bindings.
const HOST="anevum-featured-play-review-20261014.devonakins.workers.dev";
const PUBLIC=/^\/api\/v1\/(?:status|categories|projects(?:\/[A-Za-z0-9_-]+(?:\/repository)?)?|creators(?:\/[a-z][a-z0-9_]{2,29})?)$/i;
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
function safe(response){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(BASE))headers.set(key,value);
  if((headers.get("content-type")||"").includes("text/html"))headers.set("content-security-policy",CSP);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.protocol!=="https:"||url.hostname!==HOST)return reject("Not found");
    if(request.method!=="GET"&&request.method!=="HEAD")return reject("Read-only Atlas review",405);
    if(url.pathname==="/robots.txt")return reject(request.method==="HEAD"?null:"User-agent: *\nDisallow: /\n",200);
    if(url.pathname==="/__review")return reject(request.method==="HEAD"?null:JSON.stringify({
      project:"ANEVUM COMMUNITY FEED",status:"DESIGN PREVIEW",database:false,memberAccess:false,privateMessaging:false,nativeCreatorHosting:false,firstPartyPlayerLab:false,communityPostsOpen:false,
      productionDeployment:false,publicProjectData:"anonymous read-only anevum.com API"
    }),200,"application/json; charset=utf-8");
    if(url.pathname.startsWith("/api/")){
      if(!PUBLIC.test(url.pathname))return reject("Not found");
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
