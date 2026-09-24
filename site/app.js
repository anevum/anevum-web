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
  '<footer class="site-footer"><div class="footer-inner"><span>ANEVUM / IDEAS, GIVEN FORM.</span><div class="footer-links">'+
  '<a href="'+routeHref("/contact")+'" data-route="/contact">Contact</a>'+
  '<a href="mailto:devon@anevum.com">Email</a>'+
  '<a href="https://command.anevum.com">Command</a>'+
  '<a href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">RHENLINK</a></div></div></footer>'+
  '<div class="search-panel" id="searchPanel" role="dialog" aria-modal="true" aria-label="Search ANEVUM">'+
  '<div class="search-box"><div class="search-top"><input id="searchInput" autocomplete="off" placeholder="Search ANEVUM…" aria-label="Search ANEVUM"/><button class="icon-button" id="searchClose" aria-label="Close search">'+icons.close+'</button></div><div class="search-results" id="searchResults"></div></div></div>';
}

function button(label,route,secondary=false){
  return '<a class="button'+(secondary?' secondary':'')+'" href="'+routeHref(route)+'" data-route="'+route+'">'+label+icons.arrow+'</a>';
}

function home(){
  return '<section class="hero hero-ideas">'+
    '<div class="hero-copy"><p class="eyebrow">ANEVUM / INDEPENDENT PUBLISHER</p>'+
    '<h1>Ideas,<span>given form.</span></h1>'+
    '<p class="hero-deck">ANEVUM turns strong ideas into finished work. Books are the public core. The tools and systems around them exist to help the work go further—not to become a maze of separate brands.</p>'+
    '<div class="action-row">'+button("Discover REPLY","/the-book")+button("What is ANEVUM?","/about",true)+'</div>'+
    '<div class="hero-proof"><span>PUBLICATION 001</span><strong>REPLY</strong><em>THE TRANSCOSMIC · BOOK ONE</em></div></div>'+
    '<div class="idea-object" aria-hidden="true"><div class="idea-halo halo-one"></div><div class="idea-halo halo-two"></div><div class="idea-axis"></div><div class="idea-core"></div><div class="idea-object-copy"><span>IDEA</span><span>WORK</span><span>RELEASE</span></div></div>'+
  '</section>'+
  '<section class="thesis-band"><p class="section-kicker">THE ANEVUM THESIS</p><h2>When the tools become abundant, choosing what deserves to exist matters more.</h2><p>AI can compress the cost of research, iteration, and production. It does not decide what is worth making or finish the work for us. ANEVUM is built around the part that remains scarce: ideas, judgment, and follow-through.</p></section>'+
  '<section class="section reply-panel"><div class="book-card"><small>THE TRANSCOSMIC / BOOK ONE</small><strong>REPLY</strong><span>DEVON AKINS</span></div><div class="reply-copy"><p class="section-kicker">PUBLICATION 001</p><h2>The first idea we are taking all the way.</h2><p>REPLY is the current public priority: finish the book, make the release worth noticing, and give readers a clear path into The Transcosmic. Everything else on ANEVUM should support that job.</p><div class="action-row">'+button("Explore REPLY","/the-book")+button("Get release updates","/rhenlink",true)+'</div></div></section>'+
  '<section class="section"><div class="section-head"><div><p class="section-kicker">ONE COMPANY</p><h2>Three layers. One direction.</h2></div><p>ANEVUM can experiment widely without making the public identity confusing. The rule is simple: the work at the center stays clear.</p></div>'+
    '<div class="company-grid">'+
      '<div class="company-pillar"><span>01 / PUBLIC CORE</span><h3>Publishing</h3><p>Books and finished stories come first. They are the product, the proof, and the reason the rest of the company exists.</p></div>'+
      '<div class="company-pillar"><span>02 / READER LAYER</span><h3>World systems</h3><p>Wiki, Lattice, RHENLINK, and the Store deepen released work without asking the reader to understand the machinery behind it.</p></div>'+
      '<div class="company-pillar"><span>03 / INTERNAL LAYER</span><h3>R&amp;D and operations</h3><p>Automation, analytics, financial tools, and other experiments help ANEVUM operate and compound. They stay internal until one earns a real public purpose.</p></div>'+
    '</div>'+
  '</section>'+
  '<section class="section work-section"><div class="section-head"><div><p class="section-kicker">THE OPERATING RULE</p><h2>Ideas only matter when they become work.</h2></div><p>The site should reinforce the same sequence the company follows. No endless expansion before the current thing is finished.</p></div>'+
    '<div class="work-cycle"><div><span>01</span><strong>IDEA</strong></div><div><span>02</span><strong>BUILD</strong></div><div><span>03</span><strong>FINISH</strong></div><div><span>04</span><strong>RELEASE</strong></div><div><span>05</span><strong>COMPOUND</strong></div></div>'+
  '</section>';
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
  return '<section class="route-hero"><p class="eyebrow">ABOUT ANEVUM</p><h1>Ideas, given form.</h1><p>ANEVUM is an independent publisher and creative company founded by Devon Akins. Its job is not to collect projects. Its job is to turn worthwhile ideas into finished work people can actually read, use, explore, or own.</p></section>'+
  '<section class="route-section"><p class="section-kicker">WHAT COMES FIRST</p><h2>Publishing is the center.</h2><div class="company-grid company-grid-route"><div class="company-pillar"><span>STORIES</span><h3>Books</h3><p>Original fiction and nonfiction are the clearest public expression of ANEVUM. Finished releases outrank platform expansion.</p></div><div class="company-pillar"><span>SYSTEMS</span><h3>Reader infrastructure</h3><p>Wiki, Lattice, RHENLINK, and commerce exist to make the books easier to discover, understand, revisit, and support.</p></div><div class="company-pillar"><span>EXPERIMENTS</span><h3>Internal R&amp;D</h3><p>Software, automation, analytics, and financial systems can improve how the company operates. An experiment only becomes a public product when it has proven a reason to exist.</p></div></div></section>'+
  '<section class="route-section"><div class="thesis-band compact"><p class="section-kicker">WHY IDEAS</p><h2>Making is getting cheaper. Deciding what is worth making is not.</h2><p>ANEVUM uses modern tools aggressively, including AI, but the standard is still human: choose well, develop deeply, finish the work, and put something real into the world.</p></div></section>';
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

function authPage(){
  const session=loadSession();
  if(session?.user){
    const meta=session.user.user_metadata||{};
    const display=meta.display_name||meta.rhenlink_handle||session.user.email||"RHENLINK member";
    const enabled=meta.reply_release_updates===true;
    return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>'+escapeHtml(display)+'</h1><p>Your ANEVUM reader identity is active.</p></section>'+
    '<section class="route-section auth-wrap"><div class="account-card"><h2>Reader preferences</h2><div class="switch-row"><div><strong>REPLY release updates</strong><p>Store this preference on your RHENLINK identity.</p></div><label class="switch"><input id="releaseToggle" type="checkbox" '+(enabled?'checked':'')+'/><span></span></label></div><p id="accountStatus" class="form-status"></p><button class="button secondary" id="signOutButton" type="button">Sign out</button></div>'+
    '<div class="account-card"><h2>Account</h2><p>'+escapeHtml(session.user.email||"")+'</p><p class="form-status">RHENLINK keeps account and release preference separate from the public site design.</p></div></section>';
  }
  return '<section class="route-hero"><p class="eyebrow">RHENLINK</p><h1>Your ANEVUM identity.</h1><p>Create one account for release preferences and future reader features. Sign-in is handled by the existing ANEVUM Supabase project.</p></section>'+
  '<section class="route-section auth-wrap"><div class="auth-card"><div class="auth-tabs"><button id="createTab" class="active" type="button">Create</button><button id="signinTab" type="button">Sign in</button></div>'+
  '<form id="createForm"><div class="field"><label>Display name</label><input name="displayName" required autocomplete="name"/></div><div class="field"><label>RHENLINK handle</label><input name="handle" required autocomplete="username" autocapitalize="none"/></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password"/></div><div class="action-row"><button class="button" type="submit">Create RHENLINK</button></div></form>'+
  '<form id="signinForm" hidden><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"/></div><div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"/></div><div class="action-row"><button class="button" type="submit">Sign in</button></div></form><p id="authStatus" class="form-status"></p></div>'+
  '<div class="account-card"><h2>What RHENLINK does now</h2><div class="info-card"><strong>Release preference</strong><p>Opt in to REPLY release updates on your identity.</p></div><div class="info-card" style="margin-top:10px"><strong>Persistent account</strong><p>One account can later hold saves, purchases, achievements and reading progress.</p></div></div></section>';
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function render(){
  const route=currentRoute();
  let content;
  if(route==="/")content=home();
  else if(route==="/the-book"||route==="/reply"||route==="/stories/reply")content=bookPage();
  else if(route==="/wiki")content=wikiPage();
  else if(route==="/lattice")content=latticePage();
  else if(route==="/store")content=storePage();
  else if(route==="/rhenlink")content=authPage();
  else if(route==="/about")content=aboutPage();
  else if(route==="/contact")content=contactPage();
  else content=notFound();
  APP.innerHTML=shell(content);
  bindShell();
  bindRoute();
  window.scrollTo(0,0);
  document.title=(route==="/"?"ANEVUM":route==="/the-book"?"REPLY — ANEVUM":route.slice(1).toUpperCase()+" — ANEVUM");
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
