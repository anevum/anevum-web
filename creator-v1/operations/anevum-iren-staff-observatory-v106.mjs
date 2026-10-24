/**
 * IREN Observatory V106 — Continuance NEXT visual successor.
 * Isolated source only. All existing V104 and V105 staff APIs, privacy and
 * role checks are delegated unchanged. No production routing or writes.
 */
import previous from './anevum-iren-staff-observatory-v105.mjs';
import {NEXT_CSS,NEXT_CLIENT} from './anevum-observatory-continuance-v106-assets.mjs';

const ORIGIN='https://anevum.com';
const BASE='/staff/observatory';
const GROWTH=BASE+'/growth';
const CSS=BASE+'/continuance-v106.css';
const CLIENT=BASE+'/continuance-v106.js';
const PRIVATE_HEADERS={
 'cache-control':'private, no-store',
 'x-content-type-options':'nosniff',
 'x-frame-options':'DENY',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'referrer-policy':'no-referrer',
 'vary':'Cookie',
};
const deny=(status,message)=>new Response(JSON.stringify({error:message}),{
 status,headers:{...PRIVATE_HEADERS,'content-type':'application/json; charset=utf-8'}
});
const ORBITAL_MARK='<svg class="ci-orbital-mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'+
 '<ellipse cx="256" cy="256" rx="188" ry="76" transform="rotate(-17 256 256)" fill="none" stroke="currentColor" stroke-width="34" stroke-linecap="round"/>'+
 '<path d="M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z" fill="currentColor"/>'+
 '<circle cx="256" cy="256" r="72" fill="currentColor"/>'+
 '<circle class="mark-core-cut" cx="269" cy="251" r="34"/>'+
 '<circle class="mark-core-cut" cx="239" cy="230" r="8" opacity=".82"/>'+
 '<circle cx="391" cy="132" r="20" fill="currentColor"/></svg>';
const BRAND='<span class="ci-mark-wrap" aria-hidden="true">'+ORBITAL_MARK+'</span>';

function replaceExactlyOnce(source,needle,replacement){
 if(!source.includes(needle)||source.indexOf(needle)!==source.lastIndexOf(needle))
  throw new Error('V106 missing or repeated verified HTML anchor');
 return source.replace(needle,replacement);
}
const SPINE=(page)=>'<div class="ci-spine" aria-label="Observatory continuum navigation">'+
 '<div class="ci-spine-heading"><strong>IREN / COMMAND INTELLIGENCE</strong><small>Verified staff workspace · isolated V106 review</small></div>'+
 '<nav class="ci-spine-links" aria-label="Institute workspaces">'+
 '<a href="'+BASE+'"'+(page==='operations'?' aria-current="page"':'')+'>Operations</a>'+
 '<a href="'+GROWTH+'"'+(page==='growth'?' aria-current="page"':'')+'>Growth</a>'+
 '<a href="/staff/projects">Project reviews</a>'+
 '<a href="/staff/command">IREN Command</a></nav>'+
 '<button id="ci-motion" class="ci-motion" type="button" aria-pressed="false">Pause motion</button></div>';
const HERO='<div class="ci-hero" aria-labelledby="ci-hero-title">'+
 '<div class="ci-hero-copy"><small>THE CONTINUANCE INSTITUTE / LIVE STAFF SIGNALS</small>'+
 '<h2 id="ci-hero-title">Observe the system.<br/><em>Follow the signal.</em></h2>'+
 '<p>One protected observatory for real creator activity, community review and operational decisions. Live records remain separate from browser traffic, tests and estimates.</p>'+
 '<div class="ci-hero-actions"><a href="'+GROWTH+'">Explore growth intelligence &#8599;</a>'+
 '<a href="/staff/projects">Review creator projects &#8599;</a></div></div>'+
 '<div class="ci-field" aria-hidden="true"><span class="ci-disc">'+ORBITAL_MARK+'</span><small>CONTINUANCE / LIVE INSTRUMENTS</small></div></div>';
const RANGES='<div class="ci-range-tools" aria-label="Registration chart controls">'+
 '<strong>REGISTRATION SIGNAL / UTC CALENDAR WINDOW</strong>'+
 '<div class="ci-range-switch" role="group" aria-label="Number of calendar days">'+
 '<button type="button" data-ci-days="7" aria-pressed="false" disabled>7D</button>'+
 '<button type="button" data-ci-days="14" aria-pressed="false" disabled>14D</button>'+
 '<button type="button" data-ci-days="30" aria-pressed="true" disabled>30D</button></div>'+
 '<button class="ci-export" type="button" id="ci-export" disabled>Export verified CSV</button>'+
 '<div class="ci-range-status" id="ci-range-status" role="status" aria-live="polite">Awaiting verified registration records.</div></div>';

/** Pure HTML decoration for exact trusted V104/V105 page templates, not arbitrary HTML. */
export function decorateObservatoryHtml(html,page){
 if(typeof html!=='string'||!['operations','growth'].includes(page))
  throw new TypeError('V106 requires a verified Observatory page');
 if(html.includes('continuance-v106.css')||html.includes('class="ci-next"'))
  throw new Error('V106 duplicate decoration refused');
 let output=replaceExactlyOnce(html,'</head>',
   '<link rel="stylesheet" href="'+CSS+'">'+
   '<script src="'+CLIENT+'" defer></script></head>');
 if(page==='operations'){
  output=replaceExactlyOnce(output,'<body><div class="frame">',
    '<body class="ci-next"><a class="ci-skip" href="#main">Skip to staff content</a><div class="frame">');
  output=replaceExactlyOnce(output,'<span class="brand-mark" aria-hidden="true">&#9678;</span>',BRAND);
  output=replaceExactlyOnce(output,
   '</header>\n  <nav class="mobile-nav"',
   '</header>'+SPINE('operations')+'\n  <nav class="mobile-nav"');
  output=replaceExactlyOnce(output,
   '<section class="workspace active" id="overview" aria-labelledby="overview-title">',
   '<section class="workspace active" id="overview" aria-labelledby="overview-title">'+HERO);
 } else {
  output=replaceExactlyOnce(output,'<body><div class="shell">',
    '<body class="ci-next"><a class="ci-skip" href="#ci-growth-main">Skip to growth intelligence</a><div class="shell">');
  output=replaceExactlyOnce(output,'<div class="brand"><div><small>ANEVUM / IREN</small>',
    '<div class="brand">'+BRAND+'<div><small>ANEVUM / IREN</small>');
  output=replaceExactlyOnce(output,'<div class="orb-centre"></div>',
    '<div class="orb-centre">'+ORBITAL_MARK+'</div>');
  output=replaceExactlyOnce(output,'</header>\n<main><section class="hero"',
    '</header>'+SPINE('growth')+'\n<main id="ci-growth-main"><section class="hero"');
  output=replaceExactlyOnce(output,
   '<div class="layout"><article class="panel"><div class="panel-head"><div><div class="eyebrow gold">SIGNAL / 30 UTC CALENDAR DATES',
   RANGES+'<div class="layout"><article class="panel"><div class="panel-head"><div><div class="eyebrow gold">SIGNAL / 30 UTC CALENDAR DATES');
 }
 return output;
}

async function staffGate(request,env){
 const cookie=request.headers.get('cookie');
 if(!cookie||cookie.length>8192)return deny(401,'Valid staff session required');
 // The preexisting page handler checks verified staff identity and grant without
 // running the overview's costly COUNT subqueries once per CSS/JS asset request.
 // No user details are inspected or returned by this gate.
 const auth=new Request(ORIGIN+BASE,{
  method:'GET',headers:{cookie,accept:'text/html'},cache:'no-store',redirect:'manual'
 });
 let response;try{response=await previous.fetch(auth,env)}catch{return deny(503,'Staff authorization unavailable')}
 if(!response.ok)return deny([401,403,503].includes(response.status)?response.status:503,'Staff authorization failed');
 if(!(response.headers.get('content-type')||'').includes('text/html'))
  return deny(503,'Staff authorization unavailable');
 return null;
}

export default {
 async fetch(request,env){
  let url;try{url=new URL(request.url)}catch{return deny(404,'Not found')}
  if(url.origin!==ORIGIN||url.protocol!=='https:'||url.username||url.password)
   return previous.fetch(request,env);
  if(url.pathname===CSS||url.pathname===CLIENT){
   if(request.method!=='GET')return deny(405,'Method not allowed');
   if(url.search)return deny(400,'Unexpected query');
   const denial=await staffGate(request,env);
   if(denial)return denial;
   return new Response(url.pathname===CSS?NEXT_CSS:NEXT_CLIENT,{
    headers:{...PRIVATE_HEADERS,'content-type':url.pathname===CSS?'text/css; charset=utf-8':'application/javascript; charset=utf-8'}
   });
  }
  const isOperations=url.pathname===BASE||url.pathname===BASE+'/';
  const isGrowth=url.pathname===GROWTH||url.pathname===GROWTH+'/';
  if((isOperations||isGrowth)&&request.method==='GET'&&!url.search){
   const old=await previous.fetch(request,env);
   if(!old.ok||!(old.headers.get('content-type')||'').includes('text/html'))return old;
   try{
    const html=decorateObservatoryHtml(await old.text(),isGrowth?'growth':'operations');
    return new Response(html,{status:old.status,headers:old.headers});
   }catch{return deny(503,'Observatory visual integration unavailable')}
  }
  return previous.fetch(request,env);
 }
};
