const APP = document.getElementById("app");
const SUPABASE_URL = "https://mfntzxheldzdvlokyntk.supabase.co";
const SUPABASE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const SESSION_KEY = "anevum.rhenlink.session.v2";
const fileMode = location.protocol === "file:";

const icons = {
  search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  menu:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  user:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4.3 4.1-6 8-6s6.6 1.7 8 6"/></svg>',
  arrow:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  close:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg>'
};

function mark(){
  return '<svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><path d="M49 12C47 35 41 56 25 81M51 12C53 35 59 56 75 81" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="5"/><path d="M50 28C45 49 40 63 33 73M50 28C55 49 60 63 67 73" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".46"/><circle cx="50" cy="80" r="4.8" fill="currentColor"/></svg>';
}

const navItems = [
  ["EXPERIMENT","/"],
  ["PROOF","/proof"],
  ["SYSTEM","/method"],
  ["RESEARCH","/research"],
  ["WIKI","/wiki"],
  ["ABOUT","/about"]
];

const searchItems = [
  {title:"The Experiment",note:"The sub-$100 live-capital experiment",route:"/"},
  {title:"Proof Ledger",note:"Equity record, strategy versions, runs, and closed trades",route:"/proof"},
  {title:"System",note:"How ANEVUM observes, qualifies, risks, executes, and reviews",route:"/method"},
  {title:"Research",note:"What is being measured, tested, and improved",route:"/research"},
  {title:"ANEVUM Wiki",note:"Working map of current systems, projects, decisions, and archives",route:"/wiki"},
  {title:"Transcosmic Archive",note:"Preserved earlier publishing and Transcosmic material",route:"/wiki/archive/transcosmic"},
  {title:"Command",note:"Private operations portal and live bot telemetry",route:"/command"},
  {title:"RHENLINK",note:"ANEVUM identity and private access",route:"/rhenlink"},
  {title:"About ANEVUM",note:"Why one person is building this in public",route:"/about"},
  {title:"Contact",note:"Reach ANEVUM directly",route:"/contact"}
];

function routeHref(route){
  return fileMode ? "#" + route : route;
}
function currentRoute(){
  if(fileMode){
    const value = location.hash.replace(/^#/,"");
    return value || "/";
  }
  return location.pathname.replace(/\/+$/,"") || "/";
}
function navLink(label,route){
  const active = currentRoute() === route || (route !== "/" && currentRoute().startsWith(route));
  return '<a class="nav-link'+(active?' active':'')+'" href="'+routeHref(route)+'" data-route="'+route+'">'+label+'</a>';
}
function shell(content){
  const desktop = navItems.map(([label,route])=>navLink(label,route)).join("");
  const mobile = navItems.map(([label,route])=>'<a class="nav-link" href="'+routeHref(route)+'" data-route="'+route+'"><span>'+label+'</span>'+icons.arrow+'</a>').join("");
  return '<a class="skip-link" href="#main">Skip to content</a>'+
  '<header class="site-header"><div class="header-inner">'+
  '<a class="brand" href="'+routeHref("/")+'" data-route="/">'+mark()+'<strong>ANEVUM</strong><span class="brand-mode">SYSTEMS</span></a>'+
  '<nav class="primary-nav" aria-label="Primary">'+desktop+'</nav>'+
  '<div class="header-actions"><button class="icon-button" id="searchButton" aria-label="Search">'+icons.search+'</button>'+
  '<a class="rhenlink-button" href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">'+icons.user+'<span>RHENLINK</span></a>'+
  '<button class="menu-button" id="menuButton" aria-label="Menu" aria-expanded="false">'+icons.menu+'</button></div></div>'+
  '<nav class="mobile-panel" id="mobilePanel" aria-label="Mobile navigation">'+mobile+'</nav></header>'+
  '<main id="main" class="page">'+content+'</main>'+
  '<footer class="site-footer"><div class="footer-inner"><div><strong>ANEVUM</strong><span>A small-capital quantitative experiment, built in public.</span></div><div class="footer-links">'+
  '<a href="'+routeHref("/proof")+'" data-route="/proof">Proof</a>'+
  '<a href="'+routeHref("/research")+'" data-route="/research">Research</a>'+
  '<a href="'+routeHref("/about")+'" data-route="/about">About</a>'+
  '<a href="/command" data-route="/command">Command</a></div><small>ANEVUM trades its own capital. Nothing on this site is a promise of returns or investment advice. Losses and failed experiments remain part of the public record.</small></div></footer>'+
  '<div class="search-panel" id="searchPanel" role="dialog" aria-modal="true" aria-label="Search ANEVUM">'+
  '<div class="search-box"><div class="search-top"><input id="searchInput" autocomplete="off" placeholder="Search ANEVUM…" aria-label="Search ANEVUM"/><button class="icon-button" id="searchClose" aria-label="Close search">'+icons.close+'</button></div><div class="search-results" id="searchResults"></div></div></div>';
}

function commandShell(content){
  const session=loadSession();
  const email=session?.user?.email||"RHENLINK";
  return '<div class="command-app-shell">'+
    '<header class="command-topbar">'+
      '<div class="command-topbrand"><a href="'+routeHref("/")+'" data-route="/">'+mark()+'<span>ANEVUM</span></a><i></i><strong>COMMAND</strong></div>'+
      '<nav class="command-topnav" aria-label="Command sections">'+
        '<a href="#cmd-overview">Overview</a><a href="#cmd-scanner">Scanner</a><a href="#cmd-feed">Feed</a><a href="#cmd-trades">Trades</a><a href="#cmd-system">System</a>'+
      '</nav>'+
      '<div class="command-topaccount"><span class="command-source-pill"><b></b>ALPACA DATA</span><a href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">'+escapeHtml(email)+'</a></div>'+
    '</header>'+
    '<main id="main" class="command-workspace">'+content+'</main>'+
  '</div>';
}

function button(label,route,secondary=false){
  return '<a class="button'+(secondary?' secondary':'')+'" href="'+routeHref(route)+'" data-route="'+route+'">'+label+icons.arrow+'</a>';
}

function home(){
  return '<section class="experiment-hero">'+
    '<div class="experiment-copy"><p class="eyebrow">PUBLIC LIVE-CAPITAL EXPERIMENT / STARTED BELOW $100</p>'+
    '<h1>Can a tiny account<br/><span>become something bigger?</span></h1>'+
    '<p class="hero-deck">ANEVUM is one person building an automated trading system for his own family capital. The idea is deliberately small: start with less than $100, let software make rules-based decisions, and publish the evidence instead of asking anyone to believe the pitch.</p>'+
    '<div class="action-row">'+button("See the proof ledger","/proof")+button("How the system works","/method",true)+'</div>'+
    '<div class="experiment-trust"><span><b></b> REAL CAPITAL</span><span>AUTOMATED EXECUTION</span><span>LOSSES STAY ON THE RECORD</span></div>'+
    '</div>'+
    '<aside class="experiment-live-card" aria-label="Live experiment summary">'+
      '<div class="experiment-live-head"><span><i></i> PUBLIC RECORD</span><b data-public="freshness">CONNECTING</b></div>'+
      '<div class="experiment-balance"><span>CURRENT EQUITY</span><strong data-public="current-equity">—</strong><small data-public="equity-move">Loading verified data…</small></div>'+
      '<div class="experiment-chart" data-public="equity-chart"><div class="experiment-chart-empty">Loading the public equity record…</div></div>'+
      '<div class="experiment-card-grid">'+
        '<div><span>START</span><strong data-public="start-equity">—</strong></div>'+
        '<div><span>SNAPSHOTS</span><strong data-public="snapshot-count">—</strong></div>'+
        '<div><span>CLOSED TRADES</span><strong data-public="trade-count">—</strong></div>'+
        '<div><span>STRATEGY</span><strong data-public="active-strategy">—</strong></div>'+
      '</div>'+
    '</aside>'+
  '</section>'+
  '<section class="experiment-stats" aria-label="Public experiment metrics">'+
    '<article><span>STARTING RECORD</span><strong data-public="start-equity">—</strong><small>The first canonical public snapshot</small></article>'+
    '<article><span>CURRENT EQUITY</span><strong data-public="current-equity">—</strong><small data-public="equity-move-short">—</small></article>'+
    '<article><span>MAX DRAWDOWN</span><strong data-public="max-drawdown">—</strong><small>Observed in the public record</small></article>'+
    '<article><span>VERIFIED CLOSED TRADES</span><strong data-public="trade-count">—</strong><small data-public="win-loss">Canonical ledger only</small></article>'+
  '</section>'+
  '<section class="section experiment-idea"><div class="section-head"><div><p class="section-kicker">THE IDEA</p><h2>Do the experiment first.<br/>Make the claim later.</h2></div><p>The public site is not a sales page for a magic bot. It is the lab notebook. Equity snapshots, strategy versions, completed runs, and closed trades are published automatically from a sanitized copy of the real telemetry.</p></div>'+
    '<div class="evidence-grid">'+
      evidenceCard("PROVEN","The plumbing works","Market data, automated decision logic, live broker execution, telemetry, and public reporting can operate as one system.")+
      evidenceCard("TESTING","The trading edge","Positive long-term expectancy, robustness across market regimes, and scalable risk-adjusted returns still require evidence.")+
      evidenceCard("RULE","Nothing disappears","A losing trade, drawdown, rejected strategy, or failed hypothesis remains part of the record instead of being edited out.")+
    '</div>'+
  '</section>'+
  '<section class="section experiment-flow"><div><p class="section-kicker">THE MACHINE</p><h2>Five layers.<br/>One record.</h2></div>'+
    '<div class="flow-rail">'+
      flowStep("01","SCAN","Watch a defined universe for measurable setups.")+
      flowStep("02","QUALIFY","Require explicit signal and confirmation rules.")+
      flowStep("03","RISK","Gate size, exposure, loss limits, and account state.")+
      flowStep("04","EXECUTE","Place and manage real broker orders automatically.")+
      flowStep("05","PUBLISH","Copy safe aggregate results into the public proof ledger.")+
    '</div>'+
  '</section>'+
  '<section class="section experiment-cta"><div><p class="section-kicker">FOLLOW THE RECORD</p><h2>You do not have to believe the idea.</h2><p>Watch what the system actually does. The public record updates from the trading telemetry without a weekly manual rewrite.</p></div><div class="action-row">'+button("Open proof ledger","/proof")+button("Read the research","/research",true)+'</div></section>';
}
function evidenceCard(label,title,copy){
  return '<article class="evidence-card"><span>'+label+'</span><h3>'+title+'</h3><p>'+copy+'</p></article>';
}
function flowStep(num,title,copy){
  return '<article class="flow-step"><b>'+num+'</b><div><strong>'+title+'</strong><p>'+copy+'</p></div></article>';
}
function proofPage(){
  return '<section class="route-hero proof-hero"><p class="eyebrow">PROOF LEDGER</p><h1>The record, not the pitch.</h1><p>This page is generated from sanitized copies of ANEVUM’s canonical trading telemetry. Private broker identifiers, credentials, raw control state, and sensitive account details are never published.</p><div class="proof-freshness"><i></i><span data-public="freshness-long">Loading public record…</span></div></section>'+
  '<section class="route-section proof-overview">'+
    '<div class="experiment-stats proof-stats">'+
      '<article><span>STARTING RECORD</span><strong data-public="start-equity">—</strong><small data-public="first-observed">—</small></article>'+
      '<article><span>CURRENT EQUITY</span><strong data-public="current-equity">—</strong><small data-public="equity-move-short">—</small></article>'+
      '<article><span>MAX DRAWDOWN</span><strong data-public="max-drawdown">—</strong><small>Since public recording began</small></article>'+
      '<article><span>CLOSED TRADES</span><strong data-public="trade-count">—</strong><small data-public="win-loss">—</small></article>'+
    '</div>'+
    '<article class="proof-chart-card"><div class="proof-card-head"><div><span>EQUITY RECORD</span><strong data-public="snapshot-count">— snapshots</strong></div><small>Canonical public snapshots</small></div><div class="proof-chart-large" data-public="equity-chart"><div class="experiment-chart-empty">Loading equity history…</div></div></article>'+
  '</section>'+
  '<section class="route-section"><div class="section-head"><div><p class="section-kicker">STRATEGY LEDGER</p><h2>Every version has a reason.</h2></div><p>Live and shadow versions stay visible so changes can be traced back to an explicit hypothesis rather than hindsight.</p></div><div id="publicStrategyLedger" class="strategy-ledger"><div class="proof-empty">Loading strategy versions…</div></div></section>'+
  '<section class="route-section"><div class="section-head"><div><p class="section-kicker">CLOSED TRADES</p><h2>Wins and losses use the same table.</h2></div><p>Only closed positions written to the canonical ledger appear here. If the ledger has none, the site says none.</p></div><div id="publicTradeLedger" class="trade-ledger"><div class="proof-empty">Loading closed trades…</div></div></section>'+
  '<section class="route-section proof-standard"><div><p class="section-kicker">EVIDENCE STANDARD</p><h2>What would actually count as success?</h2></div><div class="proof-standard-list"><p><b>01</b><span>A meaningful sample of completed trades—not one green afternoon.</span></p><p><b>02</b><span>Positive expectancy after costs and realistic execution.</span></p><p><b>03</b><span>Drawdowns that remain inside explicit risk limits.</span></p><p><b>04</b><span>Performance that survives different market conditions and strategy revisions.</span></p></div></section>';
}
function systemCard(num,title,copy){
  return '<article class="system-card"><span>'+num+'</span><h3>'+title+'</h3><p>'+copy+'</p></article>';
}
function researchPage(){
  return '<section class="route-hero research-hero"><p class="eyebrow">RESEARCH</p><h1>Find out why it moved.</h1><p>ANEVUM treats each run as an experiment. The question is not whether a trade happened to win; it is whether the rules produce repeatable results under real execution, costs, and risk limits.</p></section>'+
  '<section class="route-section"><div class="section-head"><div><p class="section-kicker">MEASUREMENT</p><h2>The numbers that matter.</h2></div><p>The public record will become more useful as the sample grows. These are the measurements used to judge the system rather than cherry-picking account balance alone.</p></div><div class="metric-grid">'+
    '<article><strong>Expectancy</strong><p>Average net outcome per completed trade across both wins and losses.</p></article>'+
    '<article><strong>Payoff ratio</strong><p>Average winning trade relative to the average losing trade.</p></article>'+
    '<article><strong>Drawdown</strong><p>How far equity falls from a previous high before recovering.</p></article>'+
    '<article><strong>Execution quality</strong><p>Whether modeled entries and exits survive real spreads, timing, and fills.</p></article>'+
    '<article><strong>Exposure</strong><p>How much family capital is actually at risk at one time.</p></article>'+
    '<article><strong>Robustness</strong><p>Whether results persist after strategy changes and different market conditions.</p></article>'+
  '</div></section>'+
  '<section class="route-section research-note"><p class="section-kicker">CURRENT PHASE</p><h2>Build the sample before scaling the story.</h2><p>The account is intentionally small. Early results are engineering evidence, not statistical proof of a durable trading edge. Capital and complexity should scale only after the data earns it.</p></section>';
}
function methodPage(){
  return '<section class="route-hero"><p class="eyebrow">THE SYSTEM</p><h1>Rules before orders.</h1><p>ANEVUM separates observation, qualification, risk authorization, execution, telemetry, and review so every decision has a traceable reason and every failure has somewhere specific to look.</p></section>'+
  '<section class="route-section"><div class="method-stack">'+
    '<article><span>01 / OBSERVE</span><h2>Read the market.</h2><p>Collect the data required by the active strategy and reject incomplete or stale inputs.</p></article>'+
    '<article><span>02 / QUALIFY</span><h2>Require a setup.</h2><p>The scanner can watch continuously without inventing a reason to trade. A setup either passes the rules or it does not.</p></article>'+
    '<article><span>03 / AUTHORIZE</span><h2>Protect the account.</h2><p>Position size, exposure, loss limits, funding state, and execution state are checked before an order is allowed.</p></article>'+
    '<article><span>04 / EXECUTE</span><h2>Use the broker deliberately.</h2><p>Orders are tagged, tracked, reconciled, and connected back to the strategy version that produced them.</p></article>'+
    '<article><span>05 / RECORD</span><h2>Leave evidence.</h2><p>Snapshots, runs, strategy versions, positions, fills, and incidents build a record that can be tested later.</p></article>'+
    '<article><span>06 / REVIEW</span><h2>Change one thing for a reason.</h2><p>Revisions are treated as experiments with a hypothesis instead of invisible tuning after the outcome is known.</p></article>'+
  '</div></section>'+
  '<section class="route-section"><div class="boundary-grid"><article><span>PUBLIC</span><strong>Sanitized evidence</strong><p>Equity history, closed trades, strategy versions, and methodology can be published automatically.</p></article><article><span>PRIVATE</span><strong>Command</strong><p>Credentials, raw broker IDs, scanner internals, controls, and sensitive account state stay behind authenticated access.</p></article></div></section>';
}
function wikiCard(label,title,copy,route){
  return '<a class="info-card" href="'+routeHref(route)+'" data-route="'+route+'"><span>'+label+'</span><strong>'+title+'</strong><p>'+copy+'</p></a>';
}
function wikiPage(){
  return '<section class="route-hero"><p class="eyebrow">ANEVUM WIKI</p><h1>The working map of ANEVUM.</h1><p>ANEVUM is Devon Akins’s personal umbrella project and online home: a place to document active systems, experiments, decisions, projects, and the evidence they produce. Automated trading is the current primary build, not the permanent definition of ANEVUM.</p><div class="action-row">'+button("Current system","/method")+button("Open Command","/command",true)+'</div></section>'+
  '<section class="route-section"><div class="section-head"><div><p class="section-kicker">CURRENT</p><h2>What ANEVUM is working on now.</h2></div><p>The wiki follows the work as it changes. Current material stays easy to find; retired directions move to Archive instead of being erased or left mixed into active documentation.</p></div><div class="info-grid">'+
    wikiCard("ACTIVE","Automated Capital System","The current primary engineering project: market observation, qualification, risk, execution, telemetry, review, and controlled scaling.","/method")+
    wikiCard("EVIDENCE","Proof Ledger","Canonical public account snapshots, closed trades, strategy versions, and experiment history.","/proof")+
    wikiCard("RESEARCH","Trading Research","Measurements, hypotheses, execution questions, and the evidence required before claims or scaling.","/research")+
    wikiCard("PRIVATE","Command","Authenticated operating console for the live bot, scanner, positions, orders, controls, and telemetry.","/command")+
    wikiCard("IDENTITY","RHENLINK","The persistent ANEVUM identity and access layer used for preferences and permission-gated tools.","/rhenlink")+
    wikiCard("ARCHIVE","Transcosmic","Earlier publishing, REPLY, worldbuilding, Wiki/Lattice, and related creative-site material preserved together in one archive.","/wiki/archive/transcosmic")+
  '</div></section>'+
  '<section class="route-section"><div class="boundary-grid"><article><span>ACTIVE</span><strong>Current source of truth</strong><p>Material that describes what ANEVUM is building, testing, or operating now.</p></article><article><span>ARCHIVE</span><strong>Preserved, not current</strong><p>Older projects and identities remain accessible without competing with present work.</p></article></div></section>'+
  '<section class="route-section archive-note"><div><p class="section-kicker">OPERATING RULE</p><h2>Keep history. Keep the present clean.</h2></div><p>When ANEVUM changes direction, old work moves into a named archive rather than being deleted or silently rewritten. That keeps the site useful as both a current command map and a long-term record of what was built.</p></section>';
}
function transcosmicArchivePage(){
  return '<section class="route-hero"><p class="eyebrow">WIKI / ARCHIVE / TRANSCOSMIC</p><h1>Transcosmic Archive</h1><p>This folder preserves ANEVUM’s earlier publishing identity and the public-facing material built around The Transcosmic. It is historical material, not the current definition or operating focus of ANEVUM.</p><div class="action-row">'+button("Back to Wiki","/wiki")+button("Current experiment","/",true)+'</div></section>'+
  '<section class="route-section"><div class="section-head"><div><p class="section-kicker">ARCHIVED 2026-09-25</p><h2>One folder for the creative era.</h2></div><p>REPLY, The Transcosmic, the publishing-first ANEVUM identity, the old public Wiki/Lattice concept, and related store/release surfaces are grouped here instead of remaining scattered through active navigation.</p></div><div class="info-grid">'+
    '<article class="info-card"><span>PUBLICATION</span><strong>REPLY</strong><p>The former intended first publication and public entry point into The Transcosmic.</p></article>'+
    '<article class="info-card"><span>UNIVERSE</span><strong>The Transcosmic</strong><p>The shared fictional setting that previously anchored ANEVUM’s public identity.</p></article>'+
    '<article class="info-card"><span>TOOLS</span><strong>Wiki + Lattice</strong><p>Earlier reader-reference and relationship-exploration concepts associated with released creative material.</p></article>'+
    '<article class="info-card"><span>PUBLISHING</span><strong>ANEVUM Books</strong><p>The retired publisher-first framing. The publishing side can be renamed and separated later without losing its history.</p></article>'+
    '<article class="info-card"><span>COMMERCE</span><strong>Store + Editions</strong><p>Earlier plans for book editions, release surfaces, and related creative products.</p></article>'+
    '<article class="info-card"><span>STATUS</span><strong>Archived</strong><p>Preserved for continuity and possible future reuse. Nothing in this folder should be treated as the current ANEVUM operating model.</p></article>'+
  '</div></section>'+
  '<section class="route-section archive-note"><div><p class="section-kicker">PRESERVATION</p><h2>Archived does not mean abandoned.</h2></div><p>The material remains part of Devon Akins’s creative history and intellectual property. Moving it here separates it from the current ANEVUM project while keeping the work recoverable if the publishing side returns under a new name.</p></section>';
}
function bookPage(){return transcosmicArchivePage();}
function latticePage(){return transcosmicArchivePage();}
function storePage(){return transcosmicArchivePage();}
function aboutPage(){
  return '<section class="route-hero about-experiment"><p class="eyebrow">ABOUT ANEVUM</p><h1>One person. Family capital. A system that has to prove itself.</h1><p>ANEVUM is an independent experiment founded by Devon Akins. Right now it is not a fund, brokerage, signal service, or outside-capital manager. It is a quantitative system being built to research and trade the founder’s own small family account—and to document what actually happens.</p></section>'+
  '<section class="route-section"><div class="info-grid"><div class="info-card"><span>WHY</span><strong>Grow capability before capital</strong><p>The first objective is a trustworthy process: automation, measurement, risk control, and reproducible evidence.</p></div><div class="info-card"><span>HOW</span><strong>Build in public</strong><p>Publish safe aggregate results and strategy history so claims can be checked against the record.</p></div><div class="info-card"><span>WHAT NEXT</span><strong>Let evidence decide</strong><p>If the system proves useful, software and research products can grow from it later. That decision has not been forced early.</p></div></div></section>'+
  '<section class="route-section archive-note"><div><p class="section-kicker">HISTORY</p><h2>Past work has a home.</h2></div><p>Retired creative and publishing material is preserved in the Wiki Archive so ANEVUM can change direction without deleting its history or mixing obsolete material into current operations. <a href="'+routeHref("/wiki/archive/transcosmic")+'" data-route="/wiki/archive/transcosmic">Open the archive →</a></p></section>';
}
function contactPage(){
  return '<section class="route-hero"><p class="eyebrow">CONTACT</p><h1>Reach ANEVUM.</h1><p>For technical, research, media, or company inquiries, use the public ANEVUM email.</p><div class="action-row"><a class="button" href="mailto:devon@anevum.com">devon@anevum.com'+icons.arrow+'</a></div></section>';
}
function notFound(){
  return '<section class="route-hero"><p class="eyebrow">404</p><h1>Nothing here yet.</h1><p>This route is not part of the current public ANEVUM site.</p><div class="action-row">'+button("Return home","/")+'</div></section>';
}

function loadSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch{return null}
}
function saveSession(session){
  if(session)localStorage.setItem(SESSION_KEY,JSON.stringify({...session,saved_at:Date.now()}));
  else localStorage.removeItem(SESSION_KEY);
}
function authHeaders(token){
  const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};
  if(token)headers.Authorization="Bearer "+token;
  return headers;
}
async function api(path,init={}){
  const res=await fetch(SUPABASE_URL+path,{...init,headers:{...authHeaders(init.token),...(init.headers||{})}});
  const payload=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(payload.message||payload.msg||payload.error_description||payload.error||"Request failed");
  return payload;
}
async function publicTable(table,query){
  return api("/rest/v1/"+table+"?"+query,{method:"GET",headers:{"Accept":"application/json"}});
}
async function fetchPublicExperiment(){
  const [equity,strategies,runs,trades]=await Promise.all([
    publicTable("trading_public_equity","select=observed_at,equity,realized_pnl,unrealized_pnl,drawdown_pct,open_positions&order=observed_at.asc&limit=1000"),
    publicTable("trading_public_strategies","select=version_id,strategy_name,status,environment,hypothesis,activated_at,retired_at,created_at&order=created_at.desc&limit=100"),
    publicTable("trading_public_runs","select=public_id,strategy_version_id,environment,status,started_at,ended_at,starting_equity,ending_equity,deposits,withdrawals&order=started_at.desc&limit=100"),
    publicTable("trading_public_trades","select=public_id,strategy_version_id,symbol,side,opened_at,closed_at,qty,avg_entry_price,avg_exit_price,realized_pnl,net_pnl,exit_reason&order=closed_at.desc&limit=250")
  ]);
  return {equity,strategies,runs,trades};
}
function compactMoney(value){
  const n=Number(value);
  return Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n):"—";
}
function signedMoney(value){
  const n=Number(value);
  if(!Number.isFinite(n))return "—";
  return (n>0?"+":"")+compactMoney(n);
}
function publicDate(value){
  if(!value)return "—";
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"—":d.toLocaleString([],{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
}
function publicEquitySvg(rows){
  const clean=(Array.isArray(rows)?rows:[]).map(row=>({at:row.observed_at,value:Number(row.equity)})).filter(x=>Number.isFinite(x.value));
  if(!clean.length)return '<div class="experiment-chart-empty">No public equity snapshots yet.</div>';
  let lo=Math.min(...clean.map(x=>x.value));
  let hi=Math.max(...clean.map(x=>x.value));
  if(hi===lo){hi+=0.05;lo-=0.05}
  const width=760,height=260,left=18,right=18,top=18,bottom=26;
  const x=i=>clean.length===1?width/2:left+i*(width-left-right)/(clean.length-1);
  const y=v=>top+(hi-v)*(height-top-bottom)/(hi-lo);
  const points=clean.map((p,i)=>x(i).toFixed(1)+","+y(p.value).toFixed(1)).join(" ");
  const first=clean[0],last=clean[clean.length-1];
  return '<svg class="public-equity-svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Public account equity over time">'+
    '<defs><linearGradient id="publicEquityFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".18"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>'+
    '<path class="public-grid" d="M18 54H742M18 104H742M18 154H742M18 204H742"/>'+
    '<polyline class="public-equity-shadow" points="'+points+'"></polyline>'+
    '<polyline class="public-equity-line" points="'+points+'"></polyline>'+
    '<circle class="public-equity-dot" cx="'+x(clean.length-1).toFixed(1)+'" cy="'+y(last.value).toFixed(1)+'" r="4.5"></circle>'+
    '<text class="public-chart-label" x="18" y="252">'+escapeHtml(publicDate(first.at))+'</text>'+
    '<text class="public-chart-label" x="742" y="252" text-anchor="end">'+escapeHtml(publicDate(last.at))+'</text>'+
  '</svg>';
}
function setPublicText(key,value,className){
  document.querySelectorAll('[data-public="'+key+'"]').forEach(el=>{
    el.textContent=value;
    if(className!==undefined)el.className=className;
  });
}
function renderPublicExperiment(data){
  const equity=Array.isArray(data.equity)?data.equity:[];
  const strategies=Array.isArray(data.strategies)?data.strategies:[];
  const trades=Array.isArray(data.trades)?data.trades:[];
  const first=equity[0]||{};
  const last=equity[equity.length-1]||{};
  const start=Number(first.equity);
  const current=Number(last.equity);
  const move=Number.isFinite(start)&&Number.isFinite(current)?current-start:null;
  const movePct=Number.isFinite(move)&&start?move/start:null;
  const maxDd=equity.reduce((m,row)=>Math.max(m,Number(row.drawdown_pct)||0),0);
  const wins=trades.filter(t=>Number(t.net_pnl??t.realized_pnl)>0).length;
  const losses=trades.filter(t=>Number(t.net_pnl??t.realized_pnl)<0).length;
  const active=strategies.find(s=>s.environment==="live"&&["active","limited_live","scaled"].includes(s.status))||
    strategies.find(s=>s.environment==="live")||strategies[0];
  setPublicText("start-equity",compactMoney(start));
  setPublicText("current-equity",compactMoney(current));
  const moveClass=move>0?"positive":move<0?"negative":"";
  setPublicText("equity-move",Number.isFinite(move)?signedMoney(move)+" since the public record began"+(Number.isFinite(movePct)?" · "+(movePct*100).toFixed(2)+"%":""):"Waiting for enough data",moveClass);
  setPublicText("equity-move-short",Number.isFinite(move)?signedMoney(move)+(Number.isFinite(movePct)?" · "+(movePct*100).toFixed(2)+"%":""):"—",moveClass);
  setPublicText("snapshot-count",equity.length.toLocaleString());
  setPublicText("trade-count",trades.length.toLocaleString());
  setPublicText("win-loss",trades.length?wins+" wins · "+losses+" losses":"No canonical closed trades yet");
  setPublicText("max-drawdown",(maxDd*100).toFixed(2)+"%");
  setPublicText("active-strategy",active?String(active.strategy_name||active.version_id).replaceAll("_"," ").toUpperCase():"—");
  setPublicText("first-observed",first.observed_at?"Since "+publicDate(first.observed_at):"—");
  const age=last.observed_at?Math.max(0,Date.now()-new Date(last.observed_at).getTime()):null;
  const fresh=age===null?"NO DATA":age<120000?"LIVE":age<3600000?"RECENT":"RECORDED";
  setPublicText("freshness",fresh);
  setPublicText("freshness-long",last.observed_at?"Latest public snapshot: "+publicDate(last.observed_at):"No public snapshot yet");
  document.querySelectorAll('[data-public="equity-chart"]').forEach(el=>el.innerHTML=publicEquitySvg(equity));

  const strategyLedger=document.getElementById("publicStrategyLedger");
  if(strategyLedger){
    strategyLedger.innerHTML=strategies.length?strategies.map(s=>
      '<article class="strategy-ledger-row"><div><span>'+escapeHtml(String(s.environment||"").toUpperCase())+'</span><strong>'+escapeHtml(s.version_id)+'</strong></div><div><b>'+escapeHtml(String(s.status||"").replaceAll("_"," ").toUpperCase())+'</b><p>'+escapeHtml(s.hypothesis||"No public hypothesis recorded.")+'</p></div><time>'+escapeHtml(publicDate(s.activated_at||s.created_at))+'</time></article>'
    ).join(""):'<div class="proof-empty">No strategy versions have been published yet.</div>';
  }
  const tradeLedger=document.getElementById("publicTradeLedger");
  if(tradeLedger){
    tradeLedger.innerHTML=trades.length?
      '<div class="trade-ledger-head"><span>CLOSED</span><span>SYMBOL</span><span>SIDE</span><span>ENTRY → EXIT</span><span>NET P&L</span><span>EXIT</span></div>'+
      trades.map(t=>{
        const pnl=Number(t.net_pnl??t.realized_pnl);
        return '<article class="trade-ledger-row"><time>'+escapeHtml(publicDate(t.closed_at))+'</time><strong>'+escapeHtml(t.symbol)+'</strong><span>'+escapeHtml(String(t.side||"").toUpperCase())+'</span><span>'+compactMoney(t.avg_entry_price)+' → '+compactMoney(t.avg_exit_price)+'</span><b class="'+(pnl>0?"positive":pnl<0?"negative":"")+'">'+signedMoney(pnl)+'</b><span>'+escapeHtml(t.exit_reason||"—")+'</span></article>';
      }).join("")
      :'<div class="proof-empty"><strong>No canonical closed trades yet.</strong><span>The ledger will populate automatically when a position is closed and recorded by the trading system.</span></div>';
  }
}
let publicExperimentPollTimer=null;
let publicExperimentInFlight=false;
function stopPublicExperimentPolling(){
  if(publicExperimentPollTimer){clearInterval(publicExperimentPollTimer);publicExperimentPollTimer=null}
}
async function hydratePublicExperiment(){
  if(publicExperimentInFlight||!["/","/proof"].includes(currentRoute()))return;
  publicExperimentInFlight=true;
  try{
    const data=await fetchPublicExperiment();
    if(["/","/proof"].includes(currentRoute()))renderPublicExperiment(data);
  }catch(err){
    setPublicText("freshness","DATA ERROR","negative");
    setPublicText("freshness-long","Public record unavailable: "+err.message);
  }finally{
    publicExperimentInFlight=false;
  }
}
function bindPublicExperiment(){
  hydratePublicExperiment();
  publicExperimentPollTimer=setInterval(hydratePublicExperiment,60000);
}

async function currentUser(session){
  if(!session?.access_token)return null;
  try{
    const user=await api("/auth/v1/user",{method:"GET",token:session.access_token});
    const next={...session,user};
    saveSession(next);
    return next;
  }catch{
    saveSession(null);
    return null;
  }
}
async function signUp(form){
  const redirect = fileMode ? "https://anevum.com/rhenlink" : location.origin+"/rhenlink";
  return api("/auth/v1/signup?redirect_to="+encodeURIComponent(redirect),{method:"POST",body:JSON.stringify({
    email:form.email.value.trim(),
    password:form.password.value,
    data:{display_name:form.displayName.value.trim(),rhenlink_handle:form.handle.value.trim().toLowerCase(),product:"RHENLINK"}
  })});
}
async function signIn(form){
  return api("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email:form.email.value.trim(),password:form.password.value})});
}
async function updateMetadata(patch){
  const session=loadSession();
  if(!session)throw new Error("Sign in first.");
  const data={...(session.user?.user_metadata||{}),...patch};
  const user=await api("/auth/v1/user",{method:"PUT",token:session.access_token,body:JSON.stringify({data})});
  const next={...session,user};
  saveSession(next);
  return next;
}
async function signOut(){
  const session=loadSession();
  if(session?.access_token)fetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:authHeaders(session.access_token)}).catch(()=>{});
  saveSession(null);
}


let commandPollTimer=null;
let commandPollInFlight=false;

function stopCommandPolling(){
  if(commandPollTimer){
    clearInterval(commandPollTimer);
    commandPollTimer=null;
  }
  commandPollInFlight=false;
}

function isCommandAdmin(session=loadSession()){
  const user=session?.user;
  if(!user)return false;
  const meta=user.app_metadata||{};
  const role=String(meta.role||"").trim().toLowerCase();
  const email=String(user.email||"").trim().toLowerCase();
  const confirmed=Boolean(user.email_confirmed_at||user.confirmed_at);
  return (email==="devon@anevum.com"&&confirmed)
    || meta.command_admin===true
    || meta.wiki_admin===true
    || ["owner","founder","admin","command_admin","wiki_admin"].includes(role);
}

async function commandApi(path,init={}){
  const session=loadSession();
  if(!session?.access_token)throw new Error("Resolve RHENLINK before using COMMAND.");
  const res=await fetch("/api/command/trader"+path,{
    method:init.method||"GET",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+session.access_token,
      ...(init.headers||{})
    },
    body:init.body
  });
  const payload=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(payload.detail||payload.message||"COMMAND trader request failed.");
  return payload;
}

function money(value){
  const n=Number(value);
  return Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n):"—";
}
function pct(value,digits=2){
  const n=Number(value);
  return Number.isFinite(n)?(n*100).toFixed(digits)+"%":"—";
}
function commandTime(value){
  if(!value)return"—";
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"—":d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"});
}
function commandCheck(label,value){
  const state=value===true?"pass":value===false?"fail":"pending";
  const mark=value===true?"✓":value===false?"×":"·";
  return '<span class="command-check '+state+'"><b>'+mark+'</b>'+escapeHtml(label)+'</span>';
}
function commandConfirmation(label,value){
  if(!value)return commandCheck(label,null);
  if(String(value.reason||"").includes("self-confirmation skipped")){
    return '<span class="command-check pending"><b>·</b>'+escapeHtml(label)+' self</span>';
  }
  return commandCheck(label,value.ok===true);
}

function authPage(){
  const session=loadSession();
  if(session?.user){
    const meta=session.user.user_metadata||{};
    const display=meta.display_name||meta.rhenlink_handle||session.user.email||"RHENLINK member";
    const enabled=meta.anevum_system_updates===true;
    const commandShortcut=isCommandAdmin(session)?'<div class="action-row"><a class="button secondary" href="'+routeHref("/command")+'" data-route="/command">Open Command'+icons.arrow+'</a></div>':"";
    return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>'+escapeHtml(display)+'</h1><p>Your ANEVUM identity is active.</p></section>'+
    '<section class="route-section auth-wrap"><div class="account-card"><h2>Preferences</h2><div class="switch-row"><div><strong>ANEVUM development updates</strong><p>Store this preference on your RHENLINK identity.</p></div><label class="switch"><input id="releaseToggle" type="checkbox" '+(enabled?'checked':'')+'/><span></span></label></div><p id="accountStatus" class="form-status"></p><button class="button secondary" id="signOutButton" type="button">Sign out</button></div>'+
    '<div class="account-card"><h2>Account</h2><p>'+escapeHtml(session.user.email||"")+'</p><p class="form-status">RHENLINK remains the identity layer for ANEVUM and gates administrator access to Command.</p>'+commandShortcut+'</div></section>';
  }
  return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>Your ANEVUM identity.</h1><p>Create one account for ANEVUM preferences and authenticated tools. Administrator access to the private trading portal is permission-gated separately.</p></section>'+
  '<section class="route-section auth-wrap"><div class="auth-card"><div class="auth-tabs"><button id="createTab" class="active" type="button">Create</button><button id="signinTab" type="button">Sign in</button></div>'+
  '<form id="createForm"><div class="field"><label>Display name</label><input name="displayName" required autocomplete="name"/></div><div class="field"><label>RHENLINK handle</label><input name="handle" required autocomplete="username" autocapitalize="none"/></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password"/></div><div class="action-row"><button class="button" type="submit">Create RHENLINK</button></div></form>'+
  '<form id="signinForm" hidden><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"/></div><div class="action-row"><button class="button" type="submit">Sign in</button></div></form><p id="authStatus" class="form-status"></p></div>'+
  '<div class="account-card"><h2>What RHENLINK does now</h2><div class="info-card"><strong>Identity</strong><p>One authenticated account for ANEVUM preferences and future member tools.</p></div><div class="info-card" style="margin-top:10px"><strong>Command gate</strong><p>Approved administrator identities can enter the private trading operations portal.</p></div></div></section>';
}
function commandPage(){
  const session=loadSession();
  if(!session?.user){
    return '<section class="command-access-gate"><div class="command-gate-mark">'+mark()+'</div><p>ANEVUM COMMAND</p><h1>Private operations portal.</h1><span>Connect your RHENLINK administrator identity to access Alpaca account data and bot telemetry.</span><a class="button" href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">Resolve RHENLINK'+icons.arrow+'</a></section>';
  }
  if(!isCommandAdmin(session)){
    return '<section class="command-access-gate"><div class="command-gate-mark">'+mark()+'</div><p>ANEVUM COMMAND</p><h1>Administrator access required.</h1><span>This RHENLINK is authenticated but is not authorized for the private trading portal.</span></section>';
  }
  return '<section class="command-console command-v2" aria-live="polite">'+
    '<section id="cmd-overview" class="command-v2-hero">'+
      '<div><p class="command-kicker">PRIVATE OPERATIONS / LIVE CAPITAL</p><h1>Command</h1><p class="command-v2-deck">One screen for the Alpaca account, automated trader, live scanner, fills, and decision feed.</p></div>'+
      '<div class="command-connection command-v2-connection"><span id="cmdLiveDot"></span><div><strong id="cmdMode">CONNECTING</strong><small id="cmdUpdated">Waiting for bot heartbeat…</small></div><button id="cmdRefresh" class="command-refresh" type="button" aria-label="Refresh Command">↻</button></div>'+
    '</section>'+
    '<section class="command-v2-stats">'+
      '<article class="hero-stat"><span>TOTAL EQUITY</span><strong id="cmdEquity">—</strong><small id="cmdDayPnl">Today —</small></article>'+
      '<article><span>CASH</span><strong id="cmdCash">—</strong><small id="cmdBuyingPower">Buying power —</small></article>'+
      '<article><span>MARKET</span><strong id="cmdMarket">—</strong><small id="cmdWindow">Entry window —</small></article>'+
      '<article><span>BOT</span><strong id="cmdBot">—</strong><small id="cmdAttempts">Entries —</small></article>'+
      '<article><span>POSITION</span><strong id="cmdPositionMini">—</strong><small id="cmdPositionMiniPnl">No open position</small></article>'+
    '</section>'+
    '<section class="command-v2-grid">'+
      '<div class="command-v2-primary">'+
        '<article id="cmd-scanner" class="command-panel command-v2-panel command-scanner-panel">'+
          '<div class="command-panel-head"><div><span>LIVE SCANNER</span><strong id="cmdScannerSummary">Waiting for strategy…</strong></div><small id="cmdScanTime">Waiting for first scan…</small></div>'+
          '<div class="command-scan-header"><span>SYMBOL</span><span>PRICE</span><span>MOMENTUM</span><span>VWAP EDGE</span><span>CHECKS</span><span>STATUS</span></div>'+
          '<div id="commandScanner" class="command-scanner-list"><div class="command-empty">Connecting to scanner…</div></div>'+
        '</article>'+
        '<div class="command-performance-grid command-v2-performance">'+
          '<article class="command-panel command-v2-panel"><div class="command-panel-head"><div><span>ACCOUNT PATH</span><strong id="cmdTodayResult">Waiting for fills…</strong></div><small id="cmdWinLoss">—</small></div><div id="cmdEquityPath" class="command-equity-path"><div class="command-empty">Account path appears after the first refresh.</div></div></article>'+
          '<article id="cmd-trades" class="command-panel command-v2-panel"><div class="command-panel-head"><div><span>COMPLETED TRADES</span><strong id="cmdTradeCount">0 round trips</strong></div><small>Alpaca fills</small></div><div id="cmdTrades" class="command-trade-list"><div class="command-empty">No completed bot trades yet.</div></div></article>'+
        '</div>'+
        '<article class="command-panel command-v2-panel"><div class="command-panel-head"><div><span>ORDER TAPE</span><strong id="cmdOrderCount">0 OPEN</strong></div><small>Bot-tagged Alpaca orders</small></div><div id="cmdOrders" class="command-order-list"><div class="command-empty">No ANEVUM orders yet.</div></div></article>'+
      '</div>'+
      '<aside class="command-v2-side">'+
        '<article class="command-panel command-v2-panel command-position-panel"><div class="command-panel-head"><div><span>ACTIVE POSITION</span><strong id="cmdPositionTitle">FLAT</strong></div><small>Live from Alpaca</small></div><div id="cmdPositionBody" class="command-empty">No open position.</div></article>'+
        '<article id="cmd-feed" class="command-panel command-v2-panel command-feed-panel"><div class="command-panel-head"><div><span>LIVE FEED</span><strong>Bot decisions + orders</strong></div><small>Newest first</small></div><div id="cmdDecisionFeed" class="command-decision-feed"><div class="command-empty">Waiting for bot activity…</div></div></article>'+
        '<article id="cmd-system" class="command-panel command-v2-panel"><div class="command-panel-head"><div><span>BOT SYSTEM</span><strong id="cmdSystemHeadline">Connecting…</strong></div><small id="cmdHeartbeat">—</small></div>'+
          '<div class="command-system-grid">'+
            '<div><span>STRATEGY</span><strong id="cmdStrategyName">—</strong></div>'+
            '<div><span>DATA FEED</span><strong id="cmdDataFeed">—</strong></div>'+
            '<div><span>FUNDING</span><strong id="cmdFunding">—</strong></div>'+
            '<div><span>DAILY LOSS LIMIT</span><strong id="cmdLossLimit">—</strong></div>'+
            '<div><span>ORDER SIZE</span><strong id="cmdOrderSize">—</strong></div>'+
            '<div><span>LAST DECISION</span><strong id="cmdLastDecision">—</strong></div>'+
          '</div>'+
          '<p id="cmdLastError" class="command-system-error"></p>'+
        '</article>'+
        '<section class="command-control-bar command-v2-controls"><div><span>EXECUTION CONTROLS</span><p id="cmdControlStatus">Controls act on the live bot and require administrator authorization.</p></div><div class="command-control-actions">'+
          '<button class="button secondary" id="cmdEntryToggle" type="button" disabled>Loading…</button>'+
          '<button class="button secondary" id="cmdCancelOrders" type="button" disabled>Cancel pending orders</button>'+
          '<button class="button command-danger" id="cmdClosePosition" type="button" disabled>Close bot position</button>'+
        '</div></section>'+
      '</aside>'+
    '</section>'+
    '<p id="cmdError" class="command-error" role="status"></p>'+
  '</section>';
}

function completedBotTrades(orders){
  const fills=(Array.isArray(orders)?orders:[]).filter(order=>{
    const qty=Number(order.filled_qty);
    const price=Number(order.filled_avg_price);
    return qty>0&&price>0&&(order.filled_at||order.submitted_at);
  }).slice().sort((a,b)=>new Date(a.filled_at||a.submitted_at)-new Date(b.filled_at||b.submitted_at));
  const openBuys=new Map();
  const trades=[];
  for(const order of fills){
    const symbol=String(order.symbol||"").toUpperCase();
    const side=String(order.side||"").toLowerCase();
    if(side==="buy"){
      openBuys.set(symbol,order);
      continue;
    }
    if(side!=="sell")continue;
    const buy=openBuys.get(symbol);
    if(!buy)continue;
    const buyPrice=Number(buy.filled_avg_price);
    const sellPrice=Number(order.filled_avg_price);
    const qty=Math.min(Number(buy.filled_qty)||0,Number(order.filled_qty)||0);
    if(!(buyPrice>0&&sellPrice>0&&qty>0))continue;
    const pnl=(sellPrice-buyPrice)*qty;
    trades.push({
      symbol,
      buyPrice,
      sellPrice,
      qty,
      pnl,
      returnPct:(sellPrice-buyPrice)/buyPrice,
      openedAt:buy.filled_at||buy.submitted_at,
      closedAt:order.filled_at||order.submitted_at
    });
    openBuys.delete(symbol);
  }
  return trades;
}

function commandEquityChart(startEquity,currentEquity,trades){
  const start=Number(startEquity);
  const current=Number(currentEquity);
  if(!Number.isFinite(start)||!Number.isFinite(current))return '<div class="command-empty">Equity data unavailable.</div>';
  const points=[{label:"Start",value:start}];
  let running=start;
  trades.forEach((trade,index)=>{
    running+=Number(trade.pnl)||0;
    points.push({label:trade.symbol+" "+(index+1),value:running});
  });
  if(Math.abs(current-points[points.length-1].value)>.0001)points.push({label:"Now",value:current});
  else points[points.length-1].label="Now";

  let lo=Math.min(...points.map(p=>p.value));
  let hi=Math.max(...points.map(p=>p.value));
  if(hi===lo){hi+=.05;lo-=.05}
  const pad=(hi-lo)*.18||.05;
  lo-=pad;hi+=pad;
  const width=520,height=150,left=18,right=18,top=16,bottom=28;
  const x=index=>points.length===1?width/2:left+index*(width-left-right)/(points.length-1);
  const y=value=>top+(hi-value)*(height-top-bottom)/(hi-lo);
  const coords=points.map((p,index)=>x(index).toFixed(1)+","+y(p.value).toFixed(1)).join(" ");
  const dots=points.map((p,index)=>'<circle cx="'+x(index).toFixed(1)+'" cy="'+y(p.value).toFixed(1)+'" r="3.5"></circle>').join("");
  const labels=points.map((p,index)=>'<text x="'+x(index).toFixed(1)+'" y="'+(height-8)+'" text-anchor="'+(index===0?"start":index===points.length-1?"end":"middle")+'">'+escapeHtml(p.label)+'</text>').join("");
  return '<div class="command-chart-summary"><span>Start <b>'+money(start)+'</b></span><span>Now <b>'+money(current)+'</b></span><span>Move <b class="'+(current>start?"positive":current<start?"negative":"")+'">'+money(current-start)+'</b></span></div>'+
    '<svg class="command-equity-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Today account equity path"><polyline points="'+coords+'"></polyline>'+dots+labels+'</svg>';
}

function commandPercentNumber(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function commandActivityItems(history,orders){
  const decisions=(Array.isArray(history)?history:[]).map(item=>({
    at:item.at,
    symbol:item.symbol||item.kind||"BOT",
    label:String(item.action||"DECISION").toUpperCase(),
    message:item.reason||item.message||"",
    kind:"decision"
  }));
  const orderItems=(Array.isArray(orders)?orders:[]).map(order=>{
    const side=String(order.side||"").toUpperCase();
    const status=String(order.status||"").toUpperCase();
    const price=order.filled_avg_price?money(order.filled_avg_price):"";
    return {
      at:order.filled_at||order.submitted_at,
      symbol:order.symbol||"ORDER",
      label:(side+" "+status).trim(),
      message:price?"Broker fill "+price:"Order "+status.toLowerCase(),
      kind:"order"
    };
  });
  return decisions.concat(orderItems)
    .filter(item=>item.at)
    .sort((a,b)=>new Date(b.at)-new Date(a.at))
    .slice(0,60);
}

function renderCommandSnapshot(data){
  const account=data.account||{};
  const bot=data.bot||{};
  const strategy=data.strategy||{};
  const risk=data.risk||{};
  const positions=Array.isArray(data.positions)?data.positions:[];
  const openOrders=Array.isArray(data.open_orders)?data.open_orders:[];
  const recentOrders=Array.isArray(data.recent_orders)?data.recent_orders:[];
  const scanner=data.scanner||{};

  const mode=document.getElementById("cmdMode");
  const liveDot=document.getElementById("cmdLiveDot");
  if(mode)mode.textContent=String(data.mode||"—").toUpperCase()+" / "+(bot.bot_armed?"ARMED":"DISARMED");
  if(liveDot)liveDot.className=(bot.execution_authorized&&bot.bot_armed&&!bot.runtime_paused)?"online":"offline";
  const updated=document.getElementById("cmdUpdated");
  if(updated)updated.textContent="Console refresh "+new Date().toLocaleTimeString();

  const equityEl=document.getElementById("cmdEquity");
  if(equityEl)equityEl.textContent=money(account.equity);
  const day=Number(account.day_pnl);
  const dayEl=document.getElementById("cmdDayPnl");
  if(dayEl){
    dayEl.textContent="Today "+money(account.day_pnl);
    dayEl.className=Number.isFinite(day)?(day>0?"positive":day<0?"negative":""):"";
  }
  const cashEl=document.getElementById("cmdCash");
  if(cashEl)cashEl.textContent=money(account.cash);
  const bpEl=document.getElementById("cmdBuyingPower");
  if(bpEl)bpEl.textContent="Buying power "+money(account.buying_power);
  const marketEl=document.getElementById("cmdMarket");
  if(marketEl)marketEl.textContent=data.market?.is_open?"OPEN":"CLOSED";
  const windowEl=document.getElementById("cmdWindow");
  if(windowEl)windowEl.textContent="Entries "+(strategy.entry_start||"—")+"–"+(strategy.entry_cutoff||"—")+" ET";
  const botEl=document.getElementById("cmdBot");
  if(botEl)botEl.textContent=bot.entries_enabled?"WATCHING":"ENTRY LOCK";
  const attemptsEl=document.getElementById("cmdAttempts");
  if(attemptsEl)attemptsEl.textContent=(risk.entries_remaining??"—")+" of "+(risk.max_daily_orders??"—")+" entries remain";

  const completedTrades=completedBotTrades(recentOrders);
  const realizedPnl=completedTrades.reduce((sum,trade)=>sum+(Number(trade.pnl)||0),0);
  const wins=completedTrades.filter(trade=>trade.pnl>0).length;
  const losses=completedTrades.filter(trade=>trade.pnl<0).length;
  const todayResult=document.getElementById("cmdTodayResult");
  if(todayResult){
    todayResult.textContent=(realizedPnl>=0?"+":"")+money(realizedPnl).replace("-$","$-")+" realized";
    todayResult.className=realizedPnl>0?"positive":realizedPnl<0?"negative":"";
  }
  const winLoss=document.getElementById("cmdWinLoss");
  if(winLoss)winLoss.textContent=wins+"W / "+losses+"L";
  const tradeCount=document.getElementById("cmdTradeCount");
  if(tradeCount)tradeCount.textContent=completedTrades.length+" round trip"+(completedTrades.length===1?"":"s");
  const tradeList=document.getElementById("cmdTrades");
  if(tradeList)tradeList.innerHTML=completedTrades.length?completedTrades.slice().reverse().map(trade=>
    '<div class="command-trade-row"><time>'+commandTime(trade.closedAt)+'</time><strong>'+escapeHtml(trade.symbol)+'</strong><span>'+money(trade.buyPrice)+' → '+money(trade.sellPrice)+'</span><b class="'+(trade.pnl>0?"positive":trade.pnl<0?"negative":"")+'">'+(trade.pnl>=0?"+":"")+money(trade.pnl).replace("-$","$-")+' / '+pct(trade.returnPct)+'</b></div>'
  ).join(""):'<div class="command-empty">No completed bot trades yet.</div>';
  const equityPath=document.getElementById("cmdEquityPath");
  if(equityPath)equityPath.innerHTML=commandEquityChart(account.last_equity,account.equity,completedTrades);

  const position=positions[0];
  const mini=document.getElementById("cmdPositionMini");
  const miniPnl=document.getElementById("cmdPositionMiniPnl");
  if(mini)mini.textContent=position?String(position.symbol||"OPEN"):"FLAT";
  if(miniPnl){
    const miniPl=Number(position?.unrealized_pl);
    miniPnl.textContent=position?money(position.unrealized_pl)+" / "+pct(position.unrealized_plpc):"No open position";
    miniPnl.className=Number.isFinite(miniPl)?(miniPl>0?"positive":miniPl<0?"negative":""):"";
  }
  const positionTitle=document.getElementById("cmdPositionTitle");
  const positionBody=document.getElementById("cmdPositionBody");
  if(position&&positionTitle&&positionBody){
    positionTitle.textContent=String(position.symbol||"POSITION");
    const pl=Number(position.unrealized_pl);
    const entry=Number(position.avg_entry_price);
    const stopPct=Number(strategy.stop_pct);
    const targetPct=Number(strategy.target_pct);
    const stop=Number.isFinite(entry)&&Number.isFinite(stopPct)?entry*(1-stopPct):null;
    const target=Number.isFinite(entry)&&Number.isFinite(targetPct)?entry*(1+targetPct):null;
    const buy=recentOrders.find(order=>String(order.symbol||"").toUpperCase()===String(position.symbol||"").toUpperCase()&&String(order.side||"").toLowerCase()==="buy"&&order.filled_avg_price);
    const openedAt=buy?.filled_at||buy?.submitted_at;
    const heldMinutes=openedAt?Math.max(0,Math.floor((Date.now()-new Date(openedAt).getTime())/60000)):null;
    const tvSymbol=encodeURIComponent(String(position.symbol||""));
    positionBody.className="command-position";
    positionBody.innerHTML='<div><span>MARKET VALUE</span><strong>'+money(position.market_value)+'</strong></div>'+
      '<div><span>ENTRY</span><strong>'+money(position.avg_entry_price)+'</strong></div>'+
      '<div><span>CURRENT</span><strong>'+money(position.current_price)+'</strong></div>'+
      '<div><span>QTY</span><strong>'+escapeHtml(position.qty||"—")+'</strong></div>'+
      '<div><span>STOP / TARGET</span><strong>'+money(stop)+' / '+money(target)+'</strong></div>'+
      '<div><span>TIME HELD</span><strong>'+(heldMinutes===null?"—":heldMinutes+" min")+'</strong></div>'+
      '<div class="command-position-pnl"><span>UNREALIZED P&L</span><strong class="'+(pl>0?"positive":pl<0?"negative":"")+'">'+money(position.unrealized_pl)+' / '+pct(position.unrealized_plpc)+'</strong><a href="https://www.tradingview.com/chart/?symbol='+tvSymbol+'" target="_blank" rel="noopener">Open '+escapeHtml(position.symbol||"symbol")+' in TradingView ↗</a></div>';
  }else if(positionTitle&&positionBody){
    positionTitle.textContent="FLAT";
    positionBody.className="command-empty";
    positionBody.textContent="No open position. The scanner is looking for the next qualified setup.";
  }

  const orderCount=document.getElementById("cmdOrderCount");
  if(orderCount)orderCount.textContent=openOrders.length+" OPEN";
  const ordersEl=document.getElementById("cmdOrders");
  const shown=recentOrders.slice(0,8);
  if(ordersEl)ordersEl.innerHTML=shown.length?shown.map(order=>{
    const fill=order.filled_avg_price?money(order.filled_avg_price):"—";
    return '<div class="command-order-row"><time>'+commandTime(order.filled_at||order.submitted_at)+'</time><strong>'+escapeHtml(order.symbol||"—")+'</strong><span>'+escapeHtml(String(order.side||"").toUpperCase())+'</span><span>'+escapeHtml(String(order.status||"").toUpperCase())+'</span><b>'+fill+'</b></div>';
  }).join(""):'<div class="command-empty">No ANEVUM orders yet.</div>';

  const ordered=(strategy.scan_symbols||Object.keys(scanner)).filter(symbol=>scanner[symbol]);
  const readyCount=ordered.filter(symbol=>scanner[symbol]?.action==="buy").length;
  const scannerSummary=document.getElementById("cmdScannerSummary");
  if(scannerSummary)scannerSummary.textContent=ordered.length+" symbols · "+readyCount+" qualified · one position maximum";
  const scannerEl=document.getElementById("commandScanner");
  if(scannerEl)scannerEl.innerHTML=ordered.map(symbol=>{
    const row=scanner[symbol]||{};
    const meta=row.metadata||{};
    const checks=meta.checks||{};
    const confirmations=meta.confirmations||{};
    const ready=row.action==="buy";
    const reason=String(row.reason||"waiting");
    const rolling=("momentum_pct" in meta)||("fast_above_slow" in checks);
    const state=ready?"ready":reason.includes("blocked")||reason.includes("spread")?"blocked":"waiting";
    const price=money(meta.current_close);
    if(rolling){
      const momentum=commandPercentNumber(meta.momentum_pct);
      const edge=commandPercentNumber(meta.vwap_edge_pct);
      const momentumLabel=momentum===null?"—":(momentum*100).toFixed(3)+"%";
      const edgeLabel=edge===null?"—":(edge*100).toFixed(3)+"%";
      const checkValues=[
        checks.fast_above_slow,
        checks.rising,
        checks.momentum_ok,
        checks.vwap_ok,
        ...Object.values(confirmations).filter(v=>!String(v?.reason||"").includes("self-confirmation skipped")).map(v=>v?.ok)
      ];
      const passCount=checkValues.filter(Boolean).length;
      const totalChecks=checkValues.length;
      return '<article class="command-scan-row '+state+'">'+
        '<div class="command-scan-symbol"><b>'+escapeHtml(symbol)+'</b><small>'+escapeHtml(reason)+'</small></div>'+
        '<strong>'+price+'</strong>'+
        '<span class="'+(momentum!==null&&momentum>=0?"positive":"")+'">'+momentumLabel+'</span>'+
        '<span class="'+(edge!==null&&edge>=0?"positive":"")+'">'+edgeLabel+'</span>'+
        '<span class="command-scan-checks">'+passCount+'/'+totalChecks+' passed</span>'+
        '<span class="command-scan-state">'+(ready?"QUALIFIED":"SCANNING")+'</span>'+
      '</article>';
    }
    const dist=Number(meta.distance_to_breakout_pct);
    return '<article class="command-scan-row '+state+'">'+
      '<div class="command-scan-symbol"><b>'+escapeHtml(symbol)+'</b><small>'+escapeHtml(reason)+'</small></div>'+
      '<strong>'+price+'</strong>'+
      '<span>OR '+(Number.isFinite(dist)?(dist*100).toFixed(2)+"%":"—")+'</span>'+
      '<span>'+pct((Number(meta.current_close)-Number(meta.session_vwap))/Number(meta.session_vwap),3)+'</span>'+
      '<span class="command-scan-checks">Opening range</span>'+
      '<span class="command-scan-state">'+escapeHtml(String(row.action||"hold").toUpperCase())+'</span>'+
    '</article>';
  }).join("")||'<div class="command-empty">Scanner has not published a completed cycle yet.</div>';

  const scanTime=document.getElementById("cmdScanTime");
  if(scanTime)scanTime.textContent="Strategy "+commandTime(bot.last_strategy_at);
  const feed=document.getElementById("cmdDecisionFeed");
  const activity=commandActivityItems(data.history,recentOrders);
  if(feed)feed.innerHTML=activity.length?activity.map(item=>
    '<div class="command-feed-row '+item.kind+'"><time>'+commandTime(item.at)+'</time><div><strong>'+escapeHtml(item.symbol)+'</strong><span>'+escapeHtml(item.label)+'</span></div><p>'+escapeHtml(item.message)+'</p></div>'
  ).join(""):'<div class="command-empty">No bot activity recorded since this process started.</div>';

  const strategyName=document.getElementById("cmdStrategyName");
  if(strategyName)strategyName.textContent=String(strategy.name||"rolling_momentum_vwap");
  const dataFeed=document.getElementById("cmdDataFeed");
  if(dataFeed)dataFeed.textContent=String(strategy.data_feed||"—").toUpperCase();
  const funding=document.getElementById("cmdFunding");
  if(funding){
    funding.textContent=bot.funding_ready?"READY":"NOT READY";
    funding.className=bot.funding_ready?"positive":"negative";
  }
  const lossLimit=document.getElementById("cmdLossLimit");
  if(lossLimit)lossLimit.textContent=money(risk.max_daily_loss);
  const orderSize=document.getElementById("cmdOrderSize");
  if(orderSize)orderSize.textContent=money(strategy.order_notional);
  const lastDecision=document.getElementById("cmdLastDecision");
  if(lastDecision)lastDecision.textContent=String(bot.last_decision||"—");
  const lastError=document.getElementById("cmdLastError");
  if(lastError)lastError.textContent=bot.last_error?"ERROR: "+bot.last_error:"No runtime error";
  const systemHeadline=document.getElementById("cmdSystemHeadline");
  if(systemHeadline)systemHeadline.textContent=(bot.execution_authorized&&bot.bot_armed&&!bot.runtime_paused)?"AUTONOMOUS / LIVE":"CHECK REQUIRED";
  const heartbeat=document.getElementById("cmdHeartbeat");
  if(heartbeat)heartbeat.textContent="Heartbeat "+commandTime(data.observed_at||data.market?.timestamp);

  const toggle=document.getElementById("cmdEntryToggle");
  if(toggle){
    toggle.disabled=false;
    toggle.dataset.enabled=String(Boolean(bot.entries_enabled));
    toggle.textContent=bot.entries_enabled?"Disable new entries":"Enable new entries";
  }
  const cancel=document.getElementById("cmdCancelOrders");
  if(cancel)cancel.disabled=openOrders.length===0||positions.length>0;
  const close=document.getElementById("cmdClosePosition");
  if(close)close.disabled=positions.length===0;
  const controlStatus=document.getElementById("cmdControlStatus");
  if(controlStatus)controlStatus.textContent=bot.entries_enabled
    ?"New entries are permitted when every strategy and risk condition passes."
    :"New entries are disabled. Monitoring and existing-position management continue.";
}

async function refreshCommand(){
  if(commandPollInFlight||currentRoute()!=="/command")return;
  commandPollInFlight=true;
  const error=document.getElementById("cmdError");
  try{
    const data=await commandApi("/status");
    if(currentRoute()==="/command")renderCommandSnapshot(data);
    if(error)error.textContent="";
  }catch(err){
    if(error)error.textContent=err.message;
  }finally{
    commandPollInFlight=false;
  }
}

function bindCommand(){
  if(!isCommandAdmin(loadSession()))return;
  document.getElementById("cmdRefresh")?.addEventListener("click",()=>refreshCommand());
  const toggle=document.getElementById("cmdEntryToggle");
  toggle?.addEventListener("click",async()=>{
    const enabled=toggle.dataset.enabled==="true";
    const verb=enabled?"disable":"enable";
    if(!confirm((enabled?"Disable":"Enable")+" new live entries? Monitoring and position management will continue."))return;
    toggle.disabled=true;
    try{
      await commandApi("/entries/"+verb,{method:"POST",body:"{}"});
      await refreshCommand();
    }catch(err){
      document.getElementById("cmdError").textContent=err.message;
      toggle.disabled=false;
    }
  });
  document.getElementById("cmdCancelOrders")?.addEventListener("click",async e=>{
    if(!confirm("Cancel pending ANEVUM orders while the account is flat?"))return;
    e.currentTarget.disabled=true;
    try{await commandApi("/orders/cancel",{method:"POST",body:"{}"});await refreshCommand();}
    catch(err){document.getElementById("cmdError").textContent=err.message;e.currentTarget.disabled=false;}
  });
  document.getElementById("cmdClosePosition")?.addEventListener("click",async e=>{
    if(!confirm("Close the bot-managed live position at market? This also disables new entries."))return;
    e.currentTarget.disabled=true;
    try{await commandApi("/position/close",{method:"POST",body:"{}"});await refreshCommand();}
    catch(err){document.getElementById("cmdError").textContent=err.message;e.currentTarget.disabled=false;}
  });
  refreshCommand();
  commandPollTimer=setInterval(refreshCommand,3000);
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function render(){
  stopCommandPolling();
  stopPublicExperimentPolling();
  const route=currentRoute();
  let content;
  if(route==="/")content=home();
  else if(route==="/proof")content=proofPage();
  else if(route==="/research")content=researchPage();
  else if(route==="/method")content=methodPage();
  else if(route==="/wiki")content=wikiPage();
  else if(route==="/wiki/archive/transcosmic")content=transcosmicArchivePage();
  else if(route==="/the-book"||route==="/reply"||route==="/stories/reply"||route==="/universe"||route==="/lattice"||route==="/store")content=transcosmicArchivePage();
  else if(route==="/rhenlink")content=authPage();
  else if(route==="/command")content=commandPage();
  else if(route==="/about")content=aboutPage();
  else if(route==="/contact")content=contactPage();
  else content=notFound();
  APP.innerHTML=route==="/command"?commandShell(content):shell(content);
  if(route!=="/command")bindShell();
  else{
    document.querySelectorAll("[data-route]").forEach(el=>el.addEventListener("click",e=>{
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();
      navigate(el.dataset.route);
    }));
  }
  bindRoute();
  if(route==="/"||route==="/proof")bindPublicExperiment();
  window.scrollTo(0,0);
  document.title=(route==="/"?"ANEVUM — The Small-Capital Experiment":route==="/proof"?"PROOF LEDGER — ANEVUM":route==="/wiki"?"WIKI — ANEVUM":route==="/wiki/archive/transcosmic"?"TRANSCOSMIC ARCHIVE — ANEVUM":route==="/command"?"COMMAND — ANEVUM":route.slice(1).toUpperCase()+" — ANEVUM");
}

function navigate(route){
  if(fileMode){
    if(location.hash==="#"+route)render();
    else location.hash=route;
  }else{
    if(location.pathname!==route)history.pushState({},"",route);
    render();
  }
}
function bindShell(){
  document.querySelectorAll("[data-route]").forEach(el=>el.addEventListener("click",e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();
    navigate(el.dataset.route);
  }));
  const menuButton=document.getElementById("menuButton");
  const panel=document.getElementById("mobilePanel");
  menuButton?.addEventListener("click",()=>{
    const open=panel.classList.toggle("open");
    menuButton.setAttribute("aria-expanded",String(open));
  });
  const searchPanel=document.getElementById("searchPanel");
  const input=document.getElementById("searchInput");
  const results=document.getElementById("searchResults");
  const close=()=>{searchPanel.classList.remove("open");input.value="";};
  document.getElementById("searchButton")?.addEventListener("click",()=>{
    searchPanel.classList.add("open");renderSearch("");setTimeout(()=>input.focus(),0);
  });
  document.getElementById("searchClose")?.addEventListener("click",close);
  searchPanel?.addEventListener("click",e=>{if(e.target===searchPanel)close()});
  input?.addEventListener("input",()=>renderSearch(input.value));
  document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",esc)}});
  function renderSearch(q){
    const term=q.trim().toLowerCase();
    const matches=searchItems.filter(x=>!term||(x.title+" "+x.note).toLowerCase().includes(term));
    results.innerHTML=matches.length?matches.map(x=>'<a class="search-result" href="'+routeHref(x.route)+'" data-route="'+x.route+'"><strong>'+x.title+'</strong><span>'+x.note+'</span></a>').join(""):'<div class="empty-state">No results.</div>';
    results.querySelectorAll("[data-route]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();close();navigate(el.dataset.route)}));
  }
}
function bindRoute(){
  const route=currentRoute();
  if(route==="/command"){
    bindCommand();
    return;
  }
  if(route!=="/rhenlink")return;
  const session=loadSession();
  if(session?.user){
    document.getElementById("releaseToggle")?.addEventListener("change",async e=>{
      const status=document.getElementById("accountStatus");
      status.textContent="Saving…";
      try{
        await updateMetadata({anevum_system_updates:e.target.checked,anevum_system_updates_at:new Date().toISOString(),anevum_system_updates_source:"anevum-web"});
        status.textContent=e.target.checked?"ANEVUM development updates enabled.":"ANEVUM development updates disabled.";
      }catch(err){
        e.target.checked=!e.target.checked;
        status.textContent=err.message;
      }
    });
    document.getElementById("signOutButton")?.addEventListener("click",async()=>{await signOut();render()});
    return;
  }
  const createTab=document.getElementById("createTab");
  const signinTab=document.getElementById("signinTab");
  const createForm=document.getElementById("createForm");
  const signinForm=document.getElementById("signinForm");
  const status=document.getElementById("authStatus");
  const setMode=mode=>{
    const create=mode==="create";
    createTab.classList.toggle("active",create);
    signinTab.classList.toggle("active",!create);
    createForm.hidden=!create;
    signinForm.hidden=create;
    status.textContent="";
  };
  createTab?.addEventListener("click",()=>setMode("create"));
  signinTab?.addEventListener("click",()=>setMode("signin"));
  createForm?.addEventListener("submit",async e=>{
    e.preventDefault();status.textContent="Creating RHENLINK…";
    try{
      const payload=await signUp(createForm);
      if(payload.access_token&&payload.user){
        saveSession(payload);
        await updateMetadata({anevum_system_updates:true,anevum_system_updates_at:new Date().toISOString(),anevum_system_updates_source:"rhenlink-create"});
        render();
      }else{
        status.textContent="Check your email to confirm the RHENLINK, then sign in.";
      }
    }catch(err){status.textContent=err.message}
  });
  signinForm?.addEventListener("submit",async e=>{
    e.preventDefault();status.textContent="Signing in…";
    try{
      const payload=await signIn(signinForm);
      saveSession(payload);
      render();
    }catch(err){status.textContent=err.message}
  });
}

window.addEventListener("popstate",render);
window.addEventListener("hashchange",()=>{if(fileMode)render()});

(async()=>{
  const session=loadSession();
  if(session)await currentUser(session);
  render();
})();
