/* ANEVUM IREN -- isolated staff navigation adapter.
 * Original /staff response and auth are delegated to the existing staff Worker.
 * Visual injection occurs only on a successful /staff HTML GET.
 * To roll back, rebind /staff* to anevum-staff-review-navigation-v001.
 */
const STYLE = \`
.iren-staff-dock{position:fixed;right:15px;bottom:15px;z-index:999999;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#eaf1f9;isolation:isolate}
.iren-staff-dock>summary{width:43px;height:43px;border:1px solid #b8a67b;border-radius:50%;display:grid;place-items:center;list-style:none;cursor:pointer;background:radial-gradient(circle at 40% 30%,#304e67,#101b2c 77%);box-shadow:0 4px 22px #0007,0 0 16px #d8b8872b;position:relative;transition:transform .16s,border-color .16s}
.iren-staff-dock>summary::-webkit-details-marker{display:none}
.iren-staff-dock>summary:hover,.iren-staff-dock[open]>summary{border-color:#f0d5a1;transform:scale(1.04)}
.iren-staff-dock>summary:focus-visible,.iren-staff-dock a:focus-visible{outline:2px solid #f0d5a1;outline-offset:3px}
.iren-staff-dock .orbit{width:20px;height:20px;border:1px solid #d9bd8b;border-radius:50%;display:block;position:relative;transform:rotate(-32deg)}
.iren-staff-dock .orbit:before{content:"";position:absolute;inset:6px;border:1px solid #a8cae4;border-radius:50%;box-shadow:0 0 9px #98bbdd}
.iren-staff-dock .orbit:after{content:"";position:absolute;width:25px;height:10px;border:1px solid #d9bd8b;border-radius:50%;top:3px;left:-4px}
.iren-staff-dock .menu{position:absolute;right:0;bottom:52px;width:min(242px,calc(100vw - 24px));padding:10px;background:linear-gradient(150deg,#182b3d,#0b1827);border:1px solid #607186;border-radius:12px;box-shadow:0 13px 40px #000c}
.iren-staff-dock .menu-label{padding:7px 9px 11px;color:#d2b784;text-transform:uppercase;font:bold 10px/1 system-ui;letter-spacing:.18em;border-bottom:1px solid #c8d0df23;margin-bottom:5px}
.iren-staff-dock a{display:flex;align-items:center;justify-content:space-between;padding:12px 10px;border-radius:8px;color:#e7f1fa!important;text-decoration:none!important;font:550 12px/1.2 system-ui}
.iren-staff-dock a:hover{background:#35536a90;color:#ffeac2!important}
.iren-staff-dock a span{color:#e7c48d}
@media(max-width:550px){.iren-staff-dock{right:11px;bottom:calc(12px + env(safe-area-inset-bottom))}.iren-staff-dock>summary{width:41px;height:41px}}
@media(prefers-reduced-motion:reduce){.iren-staff-dock>summary{transition:none}}
\`;
const NAV = '<details class="iren-staff-dock"><summary aria-label="Open IREN staff navigation" title="IREN staff navigation"><span class="orbit" aria-hidden="true"></span></summary><nav class="menu" aria-label="IREN staff shortcuts"><div class="menu-label">IREN / CONTINUANCE</div><a href="/staff/observatory">Engagement Observatory <span aria-hidden="true">↗</span></a><a href="/staff/projects">Project reviews <span aria-hidden="true">↗</span></a><a href="/staff">Staff operations <span aria-hidden="true">↗</span></a></nav></details>';
export default {
  async fetch(request,env) {
    let url;
    try { url=new URL(request.url); } catch { return new Response("Not found",{status:404}); }
    if (url.hostname!=="anevum.com" || url.protocol!=="https:" || !env.UPSTREAM?.fetch) return new Response("Not found",{status:404});
    const response=await env.UPSTREAM.fetch(request);
    if (request.method!=="GET" || !["/staff","/staff/"].includes(url.pathname) || !response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
    const headers=new Headers(response.headers);
    for (const key of ["content-length","content-encoding","etag","last-modified"]) headers.delete(key);
    headers.set("cache-control","private,no-store");
    headers.set("x-anevum-staff-nav","observatory-v002");
    const html=new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    return new HTMLRewriter()
      .on("head",{element(element){element.append("<style>"+STYLE+"</style>",{html:true});}})
      .on("body",{element(element){element.append(NAV,{html:true});}})
      .transform(html);
  }
};
