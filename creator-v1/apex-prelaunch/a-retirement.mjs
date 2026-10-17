/**
 * Future-only a.anevum.com retirement Worker.
 *
 * Deploy UNROUTED and keep the current a.anevum.com platform live until
 * the permanent-domain owner preview has passed real authenticated E2E.
 * Once switched, visitors cannot bypass the apex countdown from old links.
 */
const OLD="https://a.anevum.com",NEW="https://anevum.com";
const SECURITY={
 "cache-control":"private, no-store",
 "x-content-type-options":"nosniff",
 "x-robots-tag":"noindex, nofollow, noarchive",
 "referrer-policy":"no-referrer",
 "vary":"Cookie"
};
const text=(status,body,method,extra={})=>new Response(method==="HEAD"?null:body,{
 status,headers:{...SECURITY,"content-type":"text/plain; charset=utf-8",...extra}
});
export function retireOldPublicHostname(request){
 let url;
 try{url=new URL(request.url);}catch{return text(404,"Not found",request.method);}
 if(url.origin!==OLD||url.protocol!=="https:"||url.username||url.password)
   return text(404,"Not found",request.method);
 if(!["GET","HEAD"].includes(request.method))
   return text(410,"This endpoint has moved; sign in on anevum.com.",request.method);
 if(url.pathname==="/robots.txt")
   return text(200,"User-agent: *\nDisallow: /\n",request.method);
 if(url.pathname.startsWith("/api/")||url.pathname==="/api"||
   url.pathname.startsWith("/assets/")||url.pathname==="/assets"||
   url.pathname.startsWith("/cdn-cgi/")||
   /\.[a-z0-9]{1,12}$/i.test(url.pathname))
   return text(410,"This endpoint is retired.",request.method);
 const destination=new URL(NEW);
 // Set pathname/search separately; raw-path concatenation could turn a path
 // beginning with // into an external-origin redirect.
 destination.pathname=url.pathname;
 destination.search=url.search;
 return new Response(null,{status:302,headers:{...SECURITY,location:destination.href}});
}
export default {fetch:retireOldPublicHostname};
