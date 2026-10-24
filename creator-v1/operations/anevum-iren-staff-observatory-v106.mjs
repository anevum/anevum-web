/**
 * IREN Observatory V106 — Continuance NEXT visual successor.
 * Isolated source only. All existing V104 and V105 staff APIs, privacy and
 * role checks are delegated unchanged. No production routing or writes.
 */
import previous from './anevum-iren-staff-observatory-v105.mjs';
import {NEXT_CSS,NEXT_CLIENT} from './anevum-observatory-continuance-v106-assets.mjs';
import {RUM_CSS,RUM_CLIENT} from './anevum-observatory-rum-v106-assets.mjs';
import {fetchRumAggregates} from '../analytics/cloudflare-rum-observatory-v106.mjs';
import {WEEKLY_CSS,WEEKLY_CLIENT} from '../analytics/anevum-observatory-weekly-v107.mjs';

const ORIGIN='https://anevum.com';
const BASE='/staff/observatory';
const GROWTH=BASE+'/growth';
const CSS=BASE+'/continuance-v106.css';
const CLIENT=BASE+'/continuance-v106.js';
const RUM_CSS_PATH=BASE+'/rum.css';
const RUM_SCRIPT=BASE+'/rum.js';
const RUM_API=BASE+'/rum/api';
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
const FOCUS_NAV='<nav class="ci-focus-nav" aria-label="Growth intelligence sections">'+
 '<span class="ci-focus-label">SIGNAL INDEX / EXPLORE</span>'+
 '<div class="ci-focus-links">'+
 '<a href="#acquisition" data-ci-section="acquisition">Registrations</a>'+
 '<a href="#ci-rum" data-ci-section="ci-rum">Browser traffic</a>'+
 '<a href="#ecosystem" data-ci-section="ecosystem">Creators</a>'+
 '<a href="#campaign" data-ci-section="campaign">Campaigns</a>'+
 '<a href="#coverage" data-ci-section="coverage">Data quality</a></div></nav>';
const CAMPAIGN_PRESETS='<div class="ci-preset-lab" aria-label="Campaign starting templates">'+
 '<div class="ci-preset-intro"><span>START WITH A CAMPAIGN</span><small>Editable link templates / no tracking activated</small></div>'+
 '<div class="ci-preset-grid" role="group" aria-label="Select campaign template">'+
 '<button type="button" data-ci-campaign="reddit" aria-pressed="false"><strong>Reddit testers</strong><small>Community recruitment</small></button>'+
 '<button type="button" data-ci-campaign="facebook" aria-pressed="false"><strong>Facebook launch</strong><small>Public awareness</small></button>'+
 '<button type="button" data-ci-campaign="flyer" aria-pressed="false"><strong>Local flyers</strong><small>In-person outreach</small></button>'+
 '<button type="button" data-ci-campaign="creator" aria-pressed="false"><strong>Creator invites</strong><small>Creator collaborations</small></button></div>'+
 '<p id="ci-preset-status" class="ci-preset-status" role="status" aria-live="polite">Choose a starting campaign. Your link updates locally; tracking is not connected.</p></div>';

const WEEKLY_PANEL='<section id="ci-weekly-signal" class="ci-weekly" data-ci-state="unavailable" aria-labelledby="ci-weekly-heading">'+
 '<header class="ci-weekly-head"><div><div class="ci-weekly-overline">COMPLETE UTC WINDOWS / VERIFIED REGISTRATIONS</div>'+
 '<h3 id="ci-weekly-heading">Weekly signal.</h3><p>Compare two completed seven-day calendar periods, not the current incomplete day or browser visits.</p></div>'+
 '<span class="ci-weekly-state" id="ci-weekly-state" role="status" aria-live="polite">DATA UNAVAILABLE</span></header>'+
 '<div class="ci-weekly-stats" aria-label="Recorded registration momentum">'+
 '<div class="ci-weekly-stat"><span>LATEST COMPLETE 7D</span><strong id="ci-weekly-current">—</strong><small id="ci-weekly-current-dates">Awaiting verified dates</small></div>'+
 '<div class="ci-weekly-stat"><span>PRECEDING COMPLETE 7D</span><strong id="ci-weekly-previous">—</strong><small id="ci-weekly-previous-dates">Awaiting verified dates</small></div>'+
 '<div class="ci-weekly-stat"><span>ABSOLUTE CHANGE</span><strong id="ci-weekly-delta">—</strong><small>Registered account records; not converted visitors</small></div></div>'+
 '<footer class="ci-weekly-foot"><p id="ci-weekly-context">No comparison without a verified 30-day registration series.</p>'+
 '<a href="#campaign">Prepare campaign links &#8599;</a></footer></section>';

const RANGES='<div class="ci-range-tools" aria-label="Registration chart controls">'+
 '<strong>REGISTRATION SIGNAL / UTC CALENDAR WINDOW</strong>'+
 '<div class="ci-range-switch" role="group" aria-label="Number of calendar days">'+
 '<button type="button" data-ci-days="7" aria-pressed="false" disabled>7D</button>'+
 '<button type="button" data-ci-days="14" aria-pressed="false" disabled>14D</button>'+
 '<button type="button" data-ci-days="30" aria-pressed="true" disabled>30D</button></div>'+
 '<button class="ci-export" type="button" id="ci-export" disabled>Export verified CSV</button>'+
 '<button class="ci-export ci-copy-brief" type="button" id="ci-copy-brief" disabled>Copy internal signal brief</button>'+
 '<div class="ci-range-status" id="ci-range-status" role="status" aria-live="polite">Awaiting verified registration records.</div>'+
 '<label class="ci-brief-fallback" id="ci-brief-fallback" for="ci-brief-output" hidden>Copy this source-qualified note manually<textarea readonly id="ci-brief-output" rows="3" aria-label="Source-qualified registration brief"></textarea></label></div>';


const RUM_PANEL='<section id="ci-rum" aria-labelledby="ci-rum-heading"><div class="heading"><div><div class="eyebrow gold">CLOUDFLARE RUM / EXTERNAL SOURCE</div><h2 id="ci-rum-heading">Browser visit signal</h2></div><span>Separate from members, funnels and unique people</span></div>'+
 '<article class="ci-rum-panel"><div class="ci-rum-head"><div><div class="eyebrow gold">SOURCE / WEB ANALYTICS</div><h3>Acquisition atmosphere.</h3>'+
 '<p>Thirty UTC calendar dates of browser beacon visits and page-load events. These are estimates, not deduplicated people or activated ANEVUM members.</p></div>'+
 '<span id="ci-rum-state" class="ci-rum-state" role="status" data-state="unavailable">NOT CONNECTED</span></div>'+
 '<div id="ci-rum-values" class="ci-rum-values" hidden></div>'+
 '<div id="ci-rum-chart" class="ci-rum-chart" role="img" aria-label="Browser-beacon visit trend unavailable" hidden></div>'+
 '<div id="ci-rum-note" class="ci-rum-note" role="status" aria-live="polite">Checking read-only Cloudflare analytics availability. No visitor estimates will be invented.</div>'+
 '<details id="ci-rum-daily" class="ci-rum-details" hidden><summary>Exact provider-reported UTC dates</summary><table id="ci-rum-table"></table></details>'+
 '<div id="ci-rum-warning" class="ci-rum-disclaimer">Browser visits, page loads and unique visitors are different metrics. Campaign attribution, registration conversion, bot classification and action retention are not connected.</div>'+
 '</article></section>';

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
  output=replaceExactlyOnce(output,'</head>',
   '<link rel="stylesheet" href="'+RUM_CSS_PATH+'"><script src="'+RUM_SCRIPT+'" defer></script></head>');
  output=replaceExactlyOnce(output,'<section id="acquisition" aria-labelledby="acq-heading">',
   FOCUS_NAV+'<section id="acquisition" aria-labelledby="acq-heading">');
  output=replaceExactlyOnce(output,'<div class="kpis" id="kpis" aria-live="polite"><div class="unavailable">Waiting for aggregate records…</div></div>',
   '<div class="kpis" id="kpis" aria-live="polite"><div class="unavailable">Waiting for aggregate records…</div></div>'+WEEKLY_PANEL);
  output=replaceExactlyOnce(output,'<div class="campaign-form">',
   CAMPAIGN_PRESETS+'<div class="campaign-form">');
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
  output=replaceExactlyOnce(output,'<section id="coverage" aria-labelledby="coverage-heading">',
   RUM_PANEL+'<section id="coverage" aria-labelledby="coverage-heading">');
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
  if(url.pathname===CSS||url.pathname===CLIENT||url.pathname===RUM_CSS_PATH||url.pathname===RUM_SCRIPT){
   if(request.method!=='GET')return deny(405,'Method not allowed');
   if(url.search)return deny(400,'Unexpected query');
   const denial=await staffGate(request,env);
   if(denial)return denial;
   const css=url.pathname===CSS||url.pathname===RUM_CSS_PATH;
   const content=url.pathname===CSS?NEXT_CSS+'\n'+WEEKLY_CSS:url.pathname===CLIENT?NEXT_CLIENT+'\n'+WEEKLY_CLIENT:url.pathname===RUM_CSS_PATH?RUM_CSS:RUM_CLIENT;
   return new Response(content,{headers:{...PRIVATE_HEADERS,'content-type':css?'text/css; charset=utf-8':'application/javascript; charset=utf-8'}});
  }
  if(url.pathname===RUM_API){
   if(request.method!=='GET')return deny(405,'Method not allowed');
   if(url.search)return deny(400,'Unexpected query');
   const denial=await staffGate(request,env);if(denial)return denial;
   try{
    const data=await fetchRumAggregates(env);
    return new Response(JSON.stringify(data),{headers:{...PRIVATE_HEADERS,'content-type':'application/json; charset=utf-8'}});
   }catch{return deny(503,'Browser visit analytics temporarily unavailable')}
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
