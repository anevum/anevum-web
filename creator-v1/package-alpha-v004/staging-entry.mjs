/* ANEVUM Creator Package V004 — isolated same-origin staging router.
 * Only opt-in paths enter this Worker. All existing /upload and /play routes
 * remain on the deployed V003/alpha controllers. The staging DB and R2 are new.
 */
import core from "./api.mjs";
export const SPACE="/creator-lab/v004";
export const API_SPACE="/api/v1/packages/v004/";
export function internalPath(path) {
  if(path===SPACE||path===SPACE+"/")return "/upload/v3";
  if(path===SPACE+"/projects")return "/packages";
  if(path===SPACE+"/help")return "/help/packages";
  if(path===SPACE+"/staff")return "/staff/packages";
  if(/^\/creator-lab\/v004\/play\/[0-9a-f-]{36}\/?$/.test(path))
    return "/play/v3/"+path.slice((SPACE+"/play/").length);
  if(path.startsWith(API_SPACE))return "/api/v1/packages/"+path.slice(API_SPACE.length);
  return null;
}
export function rewriteStageText(body) {
  return String(body)
    .replaceAll("/api/v1/packages/","/api/v1/packages/v004/")
    .replaceAll("/play/v3/","/creator-lab/v004/play/")
    .replaceAll("/upload/v3","/creator-lab/v004")
    .replaceAll("/staff/packages","/creator-lab/v004/staff")
    .replaceAll("/help/packages","/creator-lab/v004/help")
    .replaceAll('href="/packages"','href="/creator-lab/v004/projects"');
}
const hide={"cache-control":"private,no-store","x-robots-tag":"noindex,nofollow"};
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url),target=internalPath(url.pathname);
    if(!target||(!url.hostname.endsWith(".devonakins.workers.dev")&&url.origin!=="https://anevum.com"))
      return new Response("Not found",{status:404,headers:hide});
    if(url.hostname.endsWith(".devonakins.workers.dev") && request.method!=="GET")
      return new Response("Not found",{status:404,headers:hide});
    url.pathname=target;
    const upstream=await core.fetch(new Request(url,request),env,ctx);
    const headers=new Headers(upstream.headers);
    headers.set("cache-control","private,no-store");
    headers.set("x-robots-tag","noindex,nofollow");
    const type=headers.get("content-type")||"";
    if(!/text\/html|application\/json/.test(type))return new Response(upstream.body,{status:upstream.status,headers});
    headers.delete("content-length");
    return new Response(rewriteStageText(await upstream.text()),{status:upstream.status,headers});
  },
  scheduled(event,env,ctx){return core.scheduled(event,env,ctx);}
};
