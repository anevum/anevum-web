// ANEVUM Lab: four owner-only project entries, CRT shell, original Fold and RHEN assets.
// Cloudflare Access remains the actual identity gate; host check is additional fail-closed protection.
import {FOLD_SOURCE_SHA,FOLD_ASSETS} from './fold-snapshot.mjs';
import {RHEN_REVIEW,RHEN_SOURCE} from './rhen-snapshot.mjs';
import {renderRhenPage,RHEN_CSS,RHEN_JS} from './rhen-ui.mjs';
import {LAB_CSS,LAB_JS,LAB_ICON_SVG,renderLabPage,renderBackstagePage,renderTranscosmicPage} from './terminal-ui.mjs';
const HOST='lab.anevum.com';
const VERSION='2026-10-13.lab.v3-crt-backstage';
const BACK_CSS=".lab-return{position:fixed;z-index:25;top:103px;right:clamp(12px,3.4vw,54px);min-height:36px;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 11px;background:linear-gradient(145deg,#496063,#132d37);border:1px solid #e6bc83;border-radius:10px 3px 10px 3px;color:#ffe5b8;text-decoration:none;font:900 11px/1 system-ui,sans-serif;letter-spacing:.1em;box-shadow:inset 0 2px #ffffff3e,0 4px 0 #0a1922,0 9px 15px #06141a}.lab-return:focus-visible{outline:3px solid #55d3c3;outline-offset:3px}@media(max-width:900px){.lab-return{top:129px;right:9px;font-size:10px;min-height:32px}}@media(max-height:620px){.lab-return{top:10px;right:70px}}";

const headers={
'Cache-Control':'private, no-store, max-age=0',
'X-Content-Type-Options':'nosniff',
'X-Robots-Tag':'noindex, nofollow, noarchive',
'Referrer-Policy':'no-referrer',
'Cross-Origin-Resource-Policy':'same-origin',
'Permissions-Policy':'camera=(), microphone=(), geolocation=(self)',
'Content-Security-Policy':"default-src 'none'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*.openfreemap.org; font-src 'self' data: https://*.openfreemap.org; connect-src 'self' https://unpkg.com https://*.openfreemap.org; worker-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"
};
function response(body,type='text/html; charset=utf-8',status=200,extra={}){return new Response(body,{status,headers:{...headers,'Content-Type':type,...extra}});}
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',svg:'image/svg+xml; charset=utf-8'};
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.hostname!==HOST)return response('Not Found','text/plain; charset=utf-8',404);
 if(!['GET','HEAD'].includes(request.method))return response('Method not allowed','text/plain; charset=utf-8',405,{Allow:'GET, HEAD'});
 const path=url.pathname;
 let res;
 if(path==='/'||path==='/projects'||path==='/projects/')res=response(renderLabPage());
 else if(path==='/terminal.css')res=response(LAB_CSS,'text/css; charset=utf-8');
 else if(path==='/terminal.js')res=response(LAB_JS,'text/javascript; charset=utf-8');
 else if(path==='/projects/the-fold')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/the-fold/'});
 else if(path==='/projects/rhen')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/rhen/'});
 else if(path==='/projects/rhen/'||path==='/projects/rhen/index.html')res=response(renderRhenPage());
 else if(path==='/projects/rhen/app.css')res=response(RHEN_CSS,'text/css; charset=utf-8');
 else if(path==='/projects/rhen/app.js')res=response(RHEN_JS,'text/javascript; charset=utf-8');
 else if(Object.prototype.hasOwnProperty.call(RHEN_SOURCE,path))res=response(RHEN_SOURCE[path],'text/plain; charset=utf-8');
 else if(path==='/projects/backstage')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/backstage/'});
 else if(path==='/projects/backstage/'||path==='/projects/backstage/index.html')res=response(renderBackstagePage());
 else if(path==='/projects/transcosmic'||path==='/projects/transcosmic/')res=response(renderTranscosmicPage());
 else if(path==='/projects/the-fold/'||path==='/projects/the-fold/index.html'){
  const page=FOLD_ASSETS['/projects/the-fold/index.html'];
  const nav='<a href="/" class="lab-return" aria-label="Back to ANEVUM Lab">← LAB</a><style>'+BACK_CSS+'</style>';
  res=page?response(page.replace('</body>',nav+'</body>')):response('Fold snapshot missing','text/plain; charset=utf-8',503);
 }else if(Object.prototype.hasOwnProperty.call(FOLD_ASSETS,path)){
  const ext=path.split('.').pop();
  res=response(FOLD_ASSETS[path],types[ext]||'application/octet-stream');
 }else if(path==='/favicon.svg')res=response(LAB_ICON_SVG,'image/svg+xml; charset=utf-8');
 else if(path==='/robots.txt')res=response('User-agent: *\nDisallow: /\n','text/plain; charset=utf-8');
 else if(path==='/health')res=response(JSON.stringify({status:'ok',lab:VERSION,fold:FOLD_SOURCE_SHA.slice(0,12),projects:4,rhen:RHEN_REVIEW.source_commit.slice(0,12)}),'application/json; charset=utf-8');
 else res=response('Not Found','text/plain; charset=utf-8',404);
 return request.method==='HEAD'?new Response(null,{status:res.status,headers:res.headers}):res;
}};
