/* ANEVUM IREN staff navigation: additive project-review entry. No changes to staff auth or app assets. */
const STYLE='.anevum-alpha-review-nav{position:fixed;right:20px;bottom:20px;z-index:99999;display:flex;align-items:center;gap:11px;min-height:46px;padding:10px 15px;color:#f2e9d5!important;background:#1d2b3b;border:1px solid #bca67d;border-radius:10px;box-shadow:0 8px 25px #0008;text-decoration:none!important;font:680 12px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.015em}.anevum-alpha-review-nav:hover{background:#283b50;border-color:#f1d69e}.anevum-alpha-review-nav>span{color:#e7c58e;font-size:17px}.anevum-alpha-review-nav:focus-visible{outline:2px solid #f3d9a6;outline-offset:4px}@media(max-width:520px){.anevum-alpha-review-nav{right:12px;bottom:12px;min-height:40px;padding:9px 11px;font-size:11px}}';
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(url.hostname!=="anevum.com")return new Response("Not found",{status:404});
 const base=await env.UPSTREAM.fetch(req);
 if(req.method!=="GET"||!["/staff","/staff/"].includes(url.pathname)||!base.ok||!(base.headers.get("content-type")||"").includes("text/html"))return base;
 const headers=new Headers(base.headers);
 for(const k of ["content-length","content-encoding","etag","last-modified"])headers.delete(k);
 headers.set("cache-control","private,no-store");
 headers.set("x-anevum-staff-nav","project-review-v001");
 const response=new Response(base.body,{status:base.status,statusText:base.statusText,headers});
 return new HTMLRewriter().on("head",{element(e){e.append("<style>"+STYLE+"</style>",{html:true})}})
   .on("body",{element(e){e.append('<a class="anevum-alpha-review-nav" href="/staff/projects" aria-label="Open staff project approval queue"><span aria-hidden="true">◇</span> PROJECT REVIEWS →</a>',{html:true})}})
   .transform(response);
}};
