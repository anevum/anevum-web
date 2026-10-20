// ANEVUM.WEB.RELEASE.2026-10-13.001.MAIN-SITE-CONSOLIDATION
// Trusted public UI only. Member, moderation and broker services stay separate.
import production from "./production-worker.mjs";

const portfolioFiles = new Set([
  "/portfolio/index.html", "/portfolio/app.js", "/portfolio/styles.css",
  "/portfolio/assets/FONT-LICENSE.txt", "/portfolio/assets/anevum-interface.webp",
  "/portfolio/assets/anevum-mark.svg", "/portfolio/assets/body.woff",
  "/portfolio/assets/devon-akins.jpg", "/portfolio/assets/display.woff",
  "/portfolio/assets/editorial.woff", "/portfolio/assets/favicon.svg",
  "/portfolio/assets/fold-interface.webp", "/portfolio/assets/rhen-interface.webp",
  "/portfolio/assets/social-card.jpg", "/portfolio/assets/social-card.svg"
]);
const missing = () => new Response("Not found", { status:404, headers:{"cache-control":"no-store","x-content-type-options":"nosniff"} });
const redirect = (path) => new Response(null,{status:308,headers:{Location:path,"cache-control":"no-store","x-content-type-options":"nosniff"}});

export default {
  async fetch(request,env,ctx) {
    const url = new URL(request.url);
    if(url.protocol!=="https:" || url.hostname!=="anevum.com" || (url.port && url.port!=="443") || !["GET","HEAD"].includes(request.method))
      return production.fetch(request,env,ctx);
    if(url.pathname==="/portfolio") return redirect("/portfolio/"+url.search);
    if(url.pathname==="/creator" || url.pathname.startsWith("/creator/")) {
      const target=url.pathname.slice("/creator".length)||"/";
      if(target.startsWith("//") || /^\/api(?:\/|$)/i.test(target))return missing();
      return redirect(target+url.search);
    }
    if(url.pathname.startsWith("/portfolio/")) {
      const path=url.pathname==="/portfolio/"?"/portfolio/index.html":url.pathname;
      if(!portfolioFiles.has(path)) return missing();
      url.pathname=path;
      // Run the shared hostname/header/credential boundary for trusted static files.
      const clean=new Request(url.href,{method:request.method,headers:{Accept:request.headers.get("accept")||"*/*"}});
      return production.fetch(clean,env,ctx);
    }
    if(url.pathname==="/robots.txt")return new Response(request.method==="HEAD"?null:"User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /create\nDisallow: /library\nDisallow: /workspace\nSitemap: https://anevum.com/sitemap.xml\n",{headers:{"content-type":"text/plain; charset=utf-8"}});
    if(url.pathname==="/sitemap.xml") {
      const paths=["/","/discover","/creators","/start","/guide","/levels","/community","/portfolio/"];
      return new Response(request.method==="HEAD"?null:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>https://anevum.com${p}</loc></url>`).join("")+"</urlset>",{headers:{"content-type":"application/xml; charset=utf-8"}});
    }
    return production.fetch(request,env,ctx);
  }
};
