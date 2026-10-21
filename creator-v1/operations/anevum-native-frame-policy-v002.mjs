/*
 * ANEVUM frame-policy v002 / protected native Studio candidate
 * Fix: canonical frontend CSP has default-src 'none' but no frame-src.
 * This prevents approved ANEVUM-hosted games from loading inside their
 * published project pages, although the direct game URL works.
 *
 * Pass through all apex requests and existing policies without modification
 * except that ANEVUM HTML documents are permitted to frame same-origin media.
 * Uploaded HTML remains protected by its own CSP and sandbox="allow-scripts"
 * without allow-same-origin. No auth, project data, storage or API writes.
 *
 * Service binding UPSTREAM -> anevum-apex-prelaunch-gateway.
 */
const SITE="https://anevum.com";
const PREVIEW="/__anevum_frame_policy_preview";
export function policy(csp,native=false){
  if(!csp)return csp;
  const runtime='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev';
  const frame=/(?:^|;)\s*frame-src\s+([^;]+)/i.exec(csp);
  if(frame){
    // Preserve upstream restrictions unless they are the known self-only policy.
    if(!native||frame[1].trim()!=="'self'")return csp;
    return csp.replace(frame[0],frame[0]+' '+runtime);
  }
  return csp.replace(/;\s*$/,"")+"; frame-src 'self'"+(native?' '+runtime:'');
}
export default{async fetch(req,env){
 const url=new URL(req.url);
 if(url.hostname!=="anevum.com")return new Response("Not found",{status:404});
 const probe=url.pathname===PREVIEW;
 const target=probe?new Request(SITE+"/projects/alpha_5764a892052647b6953b4cf6a9053c0f",{headers:{"accept":"text/html"},method:"GET"}):req;
 const res=await env.UPSTREAM.fetch(target);
 const ctype=res.headers.get("content-type")||"",oldPolicy=res.headers.get("content-security-policy")||"";
 const eligible=/text\/html/i.test(ctype)&&(res.status===200||res.status===304);
 const newPolicy=eligible?policy(oldPolicy,env.PACKAGE_NATIVE_STUDIO_ENABLED==="true"):oldPolicy;
 if(probe)return Response.json({ok:res.status===200,upstreamStatus:res.status,html:eligible,before:oldPolicy,after:newPolicy,allowSameOriginFrames:eligible&&/\bframe-src 'self'/.test(newPolicy),sandboxPreserved:!/\ballow-same-origin\b/.test(newPolicy),otherHeadersUntouched:true},{status:res.status===200?200:503,headers:{"cache-control":"no-store","x-robots-tag":"noindex"}});
 if(!eligible||newPolicy===oldPolicy)return res;
 const h=new Headers(res.headers);
 h.set("content-security-policy",newPolicy);
 h.set("x-anevum-frame-policy","v002");
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
}};