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
  ["REPLY","/the-book"],
  ["WIKI","/wiki"],
  ["LATTICE","/lattice"],
  ["STORE","/store"],
  ["ABOUT","/about"]
];

const searchItems = [
  {title:"REPLY",note:"The Transcosmic / Book One",route:"/the-book"},
  {title:"Public Wiki",note:"Released people, places, ideas and records",route:"/wiki"},
  {title:"Lattice",note:"Relational discovery layer",route:"/lattice"},
  {title:"Store",note:"Books and ANEVUM objects",route:"/store"},
  {title:"RHENLINK",note:"Account, release updates and reader identity",route:"/rhenlink"},
  {title:"About ANEVUM",note:"What ANEVUM is and what it is building",route:"/about"},
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
  '<a class="brand" href="'+routeHref("/")+'" data-route="/">'+mark()+'<strong>ANEVUM</strong></a>'+
  '<nav class="primary-nav" aria-label="Primary">'+desktop+'</nav>'+
  '<div class="header-actions"><button class="icon-button" id="searchButton" aria-label="Search">'+icons.search+'</button>'+
  '<a class="rhenlink-button" href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">'+icons.user+'<span>RHENLINK</span></a>'+
  '<button class="menu-button" id="menuButton" aria-label="Menu" aria-expanded="false">'+icons.menu+'</button></div></div>'+
  '<nav class="mobile-panel" id="mobilePanel" aria-label="Mobile navigation">'+mobile+'</nav></header>'+
  '<main id="main" class="page">'+content+'</main>'+
  '<footer class="site-footer"><div class="footer-inner"><span>ANEVUM / 2026</span><div class="footer-links">'+
  '<a href="'+routeHref("/contact")+'" data-route="/contact">Contact</a>'+
  '<a href="mailto:devon@anevum.com">Email</a>'+
  '<a href="/command" data-route="/command">Command</a>'+
  '<a href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">RHENLINK</a></div></div></footer>'+
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
  return '<section class="hero">'+
    '<div><p class="eyebrow">INDEPENDENT PUBLISHER · STORY UNIVERSE</p>'+
    '<h1>ANEVUM<span>Current focus: REPLY.</span></h1>'+
    '<p class="hero-deck">ANEVUM publishes original stories and builds the reader tools around them. The first priority is REPLY, The Transcosmic Book One; the Wiki, Lattice, RHENLINK, and Store exist to support the books rather than compete with them.</p>'+
    '<div class="action-row">'+button("Open REPLY","/the-book")+button("Get release updates","/rhenlink",true)+'</div></div>'+
    '<div class="hero-object" aria-hidden="true"><div class="gate"></div><div class="hero-object-copy"><strong>REPLY</strong><span>THE TRANSCOSMIC<br/>BOOK ONE</span></div></div>'+
  '</section>'+
  '<section class="status-strip" aria-label="ANEVUM current status">'+
    '<div><span class="status-label">PUBLICATION</span><strong>REPLY / Book One</strong></div>'+
    '<div><span class="status-label">READER SYSTEM</span><strong>RHENLINK connected</strong></div>'+
    '<div><span class="status-label">SITE PRIORITY</span><strong>Useful first, cinematic second</strong></div>'+
  '</section>'+
  '<section class="section"><div class="section-head"><div><p class="section-kicker">USE THE SITE</p><h2>Everything has a job.</h2></div><p>No decorative dead ends. Each surface below should either help someone understand the book, explore released material, keep their place, or buy something real.</p></div>'+
    '<div class="tool-grid">'+
      toolCard("01","REPLY","Book details, story entry, publication status.","/the-book")+
      toolCard("02","WIKI","Public reference material and released canon.","/wiki")+
      toolCard("03","LATTICE","Explore relationships across the public universe.","/lattice")+
      toolCard("04","RHENLINK","Account, release updates, identity and progress.","/rhenlink")+
    '</div>'+
  '</section>'+
  '<section class="section reply-panel"><div class="book-card"><small>THE TRANSCOSMIC / BOOK ONE</small><strong>REPLY</strong><span>DEVON AKINS</span></div><div class="reply-copy"><p class="section-kicker">PUBLICATION 001</p><h2>REPLY is the reason the site exists right now.</h2><p>The homepage does not need to explain the whole universe. It needs to get a reader to the book, let them understand what it is, let them ask to hear when it is available, and give interested readers somewhere deeper to go.</p><div class="action-row">'+button("Book page","/the-book")+button("Release updates","/rhenlink",true)+'</div></div></section>';
}
function toolCard(num,title,copy,route){
  return '<a class="tool-card" href="'+routeHref(route)+'" data-route="'+route+'"><span class="num">'+num+'</span><h3>'+title+'</h3><p>'+copy+'</p><span class="card-link">Open '+icons.arrow+'</span></a>';
}
function bookPage(){
  return '<section class="route-hero"><p class="eyebrow">THE TRANSCOSMIC / BOOK ONE</p><h1>REPLY</h1><p>ANEVUM’s first publication. Release details will be shown here only when they are locked and useful to readers.</p><div class="action-row">'+button("Get release updates","/rhenlink")+button("Explore the public Wiki","/wiki",true)+'</div></section>'+
  '<section class="route-section"><div class="info-grid"><div class="info-card"><span>AUTHOR</span><strong>Devon Akins</strong><p>Founder of ANEVUM and author of REPLY.</p></div><div class="info-card"><span>SERIES</span><strong>The Transcosmic</strong><p>Book One is the public entry point.</p></div><div class="info-card"><span>STATUS</span><strong>Release preparation</strong><p>Purchase links appear only when there is a verified place to buy the finished edition.</p></div></div></section>'+
  '<section class="route-section"><h2>What this page will do.</h2><div class="info-grid"><div class="info-card"><strong>Understand the book</strong><p>Clear synopsis, genre, themes, edition details and spoiler-light entry.</p></div><div class="info-card"><strong>Read or buy</strong><p>Excerpt and purchase actions become primary as soon as they are available.</p></div><div class="info-card"><strong>Stay connected</strong><p>RHENLINK stores release-update preference so readers do not have to keep checking the site.</p></div></div></section>';
}
function wikiPage(){
  return '<section class="route-hero"><p class="eyebrow">PUBLIC KNOWLEDGE</p><h1>Wiki</h1><p>The public Wiki is for material that has actually been released. Private development canon stays private until publication makes it appropriate to expose.</p><div class="action-row"><a class="button" href="https://wiki.anevum.com">Open wiki.anevum.com'+icons.arrow+'</a></div></section>'+
  '<section class="route-section"><h2>Built for reference, not spoilers.</h2><div class="info-grid"><div class="info-card"><strong>Searchable</strong><p>Readers should be able to find a person, place, institution, technology, event, or concept quickly.</p></div><div class="info-card"><strong>Release-gated</strong><p>Public pages should reflect what the books have earned the right to reveal.</p></div><div class="info-card"><strong>Connected</strong><p>Wiki records feed naturally into Lattice rather than becoming two conflicting sources of truth.</p></div></div></section>';
}
function latticePage(){
  return '<section class="route-hero"><p class="eyebrow">RELATIONAL EXPLORATION</p><h1>Lattice</h1><p>Lattice is the navigable relationship layer around released ANEVUM material: not another lore dump, but a way to see how public records connect.</p><div class="action-row"><a class="button" href="https://lattice.anevum.com">Open Lattice'+icons.arrow+'</a>'+button("Open Wiki","/wiki",true)+'</div></section>'+
  '<section class="route-section"><h2>The job of Lattice.</h2><div class="info-grid"><div class="info-card"><strong>See relationships</strong><p>Move from one released record to related people, places, events and ideas.</p></div><div class="info-card"><strong>Keep context</strong><p>Use RHENLINK to retain reader identity and eventually saved discoveries.</p></div><div class="info-card"><strong>Stay subordinate to story</strong><p>The books remain the center; Lattice makes depth easier to navigate after interest already exists.</p></div></div></section>';
}
function storePage(){
  return '<section class="route-hero"><p class="eyebrow">ANEVUM STORE</p><h1>Real products only.</h1><p>The Store will list REPLY and later ANEVUM objects when they can actually be ordered. No fake checkout buttons, placeholder pricing, or dead merch cards.</p><div class="action-row">'+button("View REPLY","/the-book")+button("Get release updates","/rhenlink",true)+'</div></section>'+
  '<section class="route-section"><div class="empty-state"><strong>REPLY is the first store priority.</strong><br/>Verified edition and purchase links will be added here when they are live. Fourthwall merchandise remains secondary to getting the book right.</div></section>';
}
function aboutPage(){
  return '<section class="route-hero"><p class="eyebrow">ABOUT ANEVUM</p><h1>Books first.</h1><p>ANEVUM is an independent publishing and creative company founded by Devon Akins. It develops stories, public world-reference tools, reader identity, and physical objects around finished creative work.</p></section>'+
  '<section class="route-section"><div class="info-grid"><div class="info-card"><strong>Stories</strong><p>Finished books are the primary product and the source of truth for what deserves expansion.</p></div><div class="info-card"><strong>Reader tools</strong><p>Wiki, Lattice and RHENLINK help readers go deeper without forcing the story to become a manual.</p></div><div class="info-card"><strong>Objects</strong><p>Print editions and merchandise support the stories rather than becoming a separate brand maze.</p></div></div></section>';
}
function contactPage(){
  return '<section class="route-hero"><p class="eyebrow">CONTACT</p><h1>Reach ANEVUM.</h1><p>For reader questions, publishing inquiries, corrections, or support, use the public company email.</p><div class="action-row"><a class="button" href="mailto:devon@anevum.com">devon@anevum.com'+icons.arrow+'</a></div></section>';
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
    const enabled=meta.reply_release_updates===true;
    const commandShortcut=isCommandAdmin(session)?'<div class="action-row"><a class="button secondary" href="'+routeHref("/command")+'" data-route="/command">Open Command'+icons.arrow+'</a></div>':"";
    return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>'+escapeHtml(display)+'</h1><p>Your ANEVUM reader identity is active.</p></section>'+
    '<section class="route-section auth-wrap"><div class="account-card"><h2>Reader preferences</h2><div class="switch-row"><div><strong>REPLY release updates</strong><p>Store this preference on your RHENLINK identity.</p></div><label class="switch"><input id="releaseToggle" type="checkbox" '+(enabled?'checked':'')+'/><span></span></label></div><p id="accountStatus" class="form-status"></p><button class="button secondary" id="signOutButton" type="button">Sign out</button></div>'+
    '<div class="account-card"><h2>Account</h2><p>'+escapeHtml(session.user.email||"")+'</p><p class="form-status">RHENLINK keeps account and release preference separate from the public site design.</p>'+commandShortcut+'</div></section>';
  }
  return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>Your ANEVUM identity.</h1><p>Create one account for release preferences and future reader features. Sign-in is handled by the existing ANEVUM Supabase project.</p></section>'+
  '<section class="route-section auth-wrap"><div class="auth-card"><div class="auth-tabs"><button id="createTab" class="active" type="button">Create</button><button id="signinTab" type="button">Sign in</button></div>'+
  '<form id="createForm"><div class="field"><label>Display name</label><input name="displayName" required autocomplete="name"/></div><div class="field"><label>RHENLINK handle</label><input name="handle" required autocomplete="username" autocapitalize="none"/></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password"/></div><div class="action-row"><button class="button" type="submit">Create RHENLINK</button></div></form>'+
  '<form id="signinForm" hidden><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"/></div><div class="action-row"><button class="button" type="submit">Sign in</button></div></form><p id="authStatus" class="form-status"></p></div>'+
  '<div class="account-card"><h2>What RHENLINK does now</h2><div class="info-card"><strong>Release preference</strong><p>Opt in to REPLY release updates on your identity.</p></div><div class="info-card" style="margin-top:10px"><strong>Persistent account</strong><p>One account can later hold saves, purchases, achievements and reading progress.</p></div></div></section>';
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
  const route=currentRoute();
  let content;
  if(route==="/")content=home();
  else if(route==="/the-book"||route==="/reply"||route==="/stories/reply")content=bookPage();
  else if(route==="/wiki")content=wikiPage();
  else if(route==="/lattice")content=latticePage();
  else if(route==="/store")content=storePage();
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
  window.scrollTo(0,0);
  document.title=(route==="/"?"ANEVUM":route==="/the-book"?"REPLY — ANEVUM":route==="/command"?"COMMAND — ANEVUM":route.slice(1).toUpperCase()+" — ANEVUM");
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
        await updateMetadata({reply_release_updates:e.target.checked,reply_release_updates_at:new Date().toISOString(),reply_release_updates_source:"anevum-web"});
        status.textContent=e.target.checked?"REPLY release updates enabled.":"REPLY release updates disabled.";
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
        await updateMetadata({reply_release_updates:true,reply_release_updates_at:new Date().toISOString(),reply_release_updates_source:"rhenlink-create"});
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
