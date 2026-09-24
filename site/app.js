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
  ["BOOKS","/books"],
  ["EXPLORE","/explore"],
  ["STORE","/store"],
  ["ABOUT","/about"]
];

const searchItems = [
  {title:"Books",note:"ANEVUM catalog and forthcoming titles",route:"/books"},
  {title:"REPLY",note:"The Transcosmic / Book One",route:"/the-book"},
  {title:"Explore",note:"Reader resources for released ANEVUM books",route:"/explore"},
  {title:"Public Wiki",note:"Released reference material",route:"/wiki"},
  {title:"Lattice",note:"Connections across released material",route:"/lattice"},
  {title:"Store",note:"Books, editions and future ANEVUM releases",route:"/store"},
  {title:"RHENLINK",note:"Reader account and release updates",route:"/rhenlink"},
  {title:"About ANEVUM",note:"The publisher and its catalog",route:"/about"},
  {title:"Contact",note:"Publishing and reader contact",route:"/contact"}
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
  '<footer class="site-footer"><div class="footer-inner"><span>ANEVUM / INDEPENDENT PUBLISHER</span><div class="footer-links">'+
  '<a href="'+routeHref("/books")+'" data-route="/books">Books</a>'+
  '<a href="'+routeHref("/about")+'" data-route="/about">About</a>'+
  '<a href="'+routeHref("/contact")+'" data-route="/contact">Contact</a>'+
  '<a href="'+routeHref("/rhenlink")+'" data-route="/rhenlink">RHENLINK</a></div></div></footer>'+
  '<div class="search-panel" id="searchPanel" role="dialog" aria-modal="true" aria-label="Search ANEVUM">'+
  '<div class="search-box"><div class="search-top"><input id="searchInput" autocomplete="off" placeholder="Search ANEVUM…" aria-label="Search ANEVUM"/><button class="icon-button" id="searchClose" aria-label="Close search">'+icons.close+'</button></div><div class="search-results" id="searchResults"></div></div></div>';
}

function button(label,route,secondary=false){
  return '<a class="button'+(secondary?' secondary':'')+'" href="'+routeHref(route)+'" data-route="'+route+'">'+label+icons.arrow+'</a>';
}

function home(){
  return '<section class="publisher-hero">'+
    '<div class="publisher-hero-copy"><p class="eyebrow">INDEPENDENT PUBLISHER</p>'+
    '<h1>ANEVUM<span>Books first.</span></h1>'+
    '<p class="hero-deck">ANEVUM publishes original fiction and nonfiction, beginning with REPLY by Devon Akins. The job is simple: make the books good, publish them well, and give readers a clear place to find what comes next.</p>'+
    '<div class="action-row">'+button("View the catalog","/books")+button("Discover REPLY","/the-book",true)+'</div>'+
    '<div class="publisher-meta"><span>FOUNDED 2026</span><span>INDEPENDENT</span><span>PUBLICATION 001 IN DEVELOPMENT</span></div></div>'+
    '<div class="publisher-mark-panel" aria-hidden="true">'+mark()+'<strong>ANEVUM</strong><span>INDEPENDENT PUBLISHER</span></div>'+
  '</section>'+
  '<section class="section featured-book"><div class="book-card featured-cover"><small>THE TRANSCOSMIC / BOOK ONE</small><strong>REPLY</strong><span>DEVON AKINS</span></div>'+
    '<div class="featured-copy"><p class="section-kicker">FEATURED TITLE / PUBLICATION 001</p><h2>REPLY</h2><p>First contact begins with a measurement nobody can explain—and reaches into ordinary lives before anyone is ready for what comes next. REPLY is the first book in The Transcosmic and the first publication from ANEVUM.</p>'+
    '<div class="book-facts"><div><span>AUTHOR</span><strong>Devon Akins</strong></div><div><span>SERIES</span><strong>The Transcosmic</strong></div><div><span>STATUS</span><strong>In development</strong></div></div>'+
    '<div class="action-row">'+button("Book details","/the-book")+button("Release updates","/rhenlink",true)+'</div></div></section>'+
  '<section class="section catalog-preview"><div class="section-head"><div><p class="section-kicker">THE CATALOG</p><h2>A publishing list built one book at a time.</h2></div><p>ANEVUM is not trying to look larger than it is. The catalog begins with REPLY and expands when the next book is ready to deserve a place beside it.</p></div>'+
    '<div class="catalog-row"><div class="catalog-number">001</div><div><span class="catalog-type">NOVEL / THE TRANSCOSMIC</span><h3>REPLY</h3><p>Devon Akins</p></div><div class="catalog-state">IN DEVELOPMENT</div><a href="'+routeHref("/the-book")+'" data-route="/the-book">View title '+icons.arrow+'</a></div>'+
    '<div class="catalog-row muted"><div class="catalog-number">NEXT</div><div><span class="catalog-type">ANEVUM CATALOG</span><h3>Forthcoming</h3><p>Additional titles will be announced when they are ready.</p></div><div class="catalog-state">UNANNOUNCED</div><span></span></div>'+
    '<div class="action-row">'+button("View all books","/books",true)+'</div></section>'+
  '<section class="section publisher-statement"><p class="section-kicker">THE PUBLISHER</p><h2>ANEVUM exists to publish books, not to become a maze of projects.</h2><div class="publisher-columns"><p>We develop work in-house, take the time to make it worth reading, and build the release around the book rather than around constant platform expansion.</p><p>Reader tools such as Wiki, Lattice, and RHENLINK are secondary. They are there to support finished books and the people who read them.</p></div><div class="action-row">'+button("About ANEVUM","/about",true)+'</div></section>'+
  '<section class="section reader-resources"><div class="section-head"><div><p class="section-kicker">FOR READERS</p><h2>Go deeper when you want to.</h2></div><p>The books remain the front door. These resources are optional layers for readers who want release updates or more context.</p></div>'+
    '<div class="resource-grid">'+
      '<a href="'+routeHref("/explore")+'" data-route="/explore"><span>EXPLORE</span><strong>Wiki and Lattice</strong><p>Released reference material and connections across the books.</p></a>'+
      '<a href="'+routeHref("/rhenlink")+'" data-route="/rhenlink"><span>RHENLINK</span><strong>Reader account</strong><p>Manage release updates and future reader features.</p></a>'+
      '<a href="'+routeHref("/store")+'" data-route="/store"><span>STORE</span><strong>Books and editions</strong><p>Purchase links and editions when they are actually available.</p></a>'+
    '</div></section>';
}
function booksPage(){
  return '<section class="route-hero books-hero"><p class="eyebrow">ANEVUM BOOKS</p><h1>The catalog.</h1><p>ANEVUM is building its publishing list deliberately. Titles appear here when they are real enough to stand behind.</p></section>'+
  '<section class="route-section"><div class="catalog-row catalog-row-large"><div class="catalog-number">001</div><div><span class="catalog-type">NOVEL / THE TRANSCOSMIC</span><h2>REPLY</h2><p>By Devon Akins. First contact, family, work, intelligence, mortality, and the consequences of discovering that humanity is not alone in the way it expected.</p></div><div class="catalog-state">IN DEVELOPMENT</div><a class="button secondary" href="'+routeHref("/the-book")+'" data-route="/the-book">View book '+icons.arrow+'</a></div></section>'+
  '<section class="route-section forthcoming-block"><p class="section-kicker">FORTHCOMING</p><h2>More books will follow. They do not need placeholder identities yet.</h2><p>Future fiction, nonfiction, and visual publishing projects will join the catalog only when their titles, formats, and release plans are ready to be public.</p></section>';
}
function toolCard(num,title,copy,route){
  return '<a class="tool-card" href="'+routeHref(route)+'" data-route="'+route+'"><span class="num">'+num+'</span><h3>'+title+'</h3><p>'+copy+'</p><span class="card-link">Open '+icons.arrow+'</span></a>';
}
function bookPage(){
  return '<section class="route-hero book-hero"><div><p class="eyebrow">PUBLICATION 001 / THE TRANSCOSMIC</p><h1>REPLY</h1><p class="route-lead">First contact begins with a measurement nobody can explain—and reaches into ordinary lives before anyone is ready for what comes next.</p><div class="action-row">'+button("Get release updates","/rhenlink")+button("Explore the world","/explore",true)+'</div></div><div class="book-card book-card-route"><small>THE TRANSCOSMIC / BOOK ONE</small><strong>REPLY</strong><span>DEVON AKINS</span></div></section>'+
  '<section class="route-section story-section"><p class="section-kicker">THE STORY</p><h2>A larger universe. A life still yours to choose.</h2><p class="story-copy">On Ovara, a worker refuses to dismiss a measurement she cannot explain. The answer leads to a civilization already living across worlds. For Nali, her sister Kerin, and the people on the other side, contact opens possibilities that reach far beyond travel. Work can change. Families can imagine longer futures. An intelligence can become part of daily life. Yet a larger universe still leaves each person with a life to choose.</p></section>'+
  '<section class="route-section"><div class="info-grid"><div class="info-card"><span>AUTHOR</span><strong>Devon Akins</strong><p>Founder of ANEVUM and author of REPLY.</p></div><div class="info-card"><span>SERIES</span><strong>The Transcosmic</strong><p>Book One is the public entry point into the larger universe.</p></div><div class="info-card"><span>AVAILABILITY</span><strong>Release preparation</strong><p>Verified edition and purchase links will appear here when the finished edition is ready to order.</p></div></div></section>'+
  '<section class="route-section"><p class="section-kicker">WHAT REPLY IS ABOUT</p><div class="theme-grid"><div><span>01</span><h3>First contact</h3><p>Not as spectacle alone, but as a collision between civilizations and the people who still have to go home afterward.</p></div><div><span>02</span><h3>Human choices</h3><p>New technology can change the limits around a life without making the choices inside that life disappear.</p></div><div><span>03</span><h3>A future that feels lived in</h3><p>Science, work, family, economics, intelligence, and mortality change together instead of existing as isolated worldbuilding.</p></div></div></section>'+
  '<section class="route-section release-cta"><p class="section-kicker">BE HERE WHEN IT IS READY</p><h2>One account. One release preference.</h2><p>RHENLINK currently handles REPLY release updates and becomes the reader identity for future ANEVUM features.</p><div class="action-row">'+button("Create or open RHENLINK","/rhenlink")+'</div></section>';
}
function explorePage(){
  return '<section class="route-hero"><p class="eyebrow">EXPLORE ANEVUM</p><h1>Go deeper after the story earns it.</h1><p>Explore is the reader layer around released work. The books remain the center; these tools help you understand, connect, and return to what has already been made public.</p></section>'+
  '<section class="route-section"><div class="explore-grid">'+
    '<a class="explore-card" href="https://wiki.anevum.com"><span>01 / REFERENCE</span><h2>Wiki</h2><p>People, places, institutions, technologies, and events from released ANEVUM material.</p><strong>Open Wiki '+icons.arrow+'</strong></a>'+
    '<a class="explore-card" href="https://lattice.anevum.com"><span>02 / RELATIONSHIPS</span><h2>Lattice</h2><p>Move through the connections between released records instead of reading isolated lore pages.</p><strong>Open Lattice '+icons.arrow+'</strong></a>'+
    '<a class="explore-card" href="'+routeHref("/rhenlink")+'" data-route="/rhenlink"><span>03 / IDENTITY</span><h2>RHENLINK</h2><p>Keep your ANEVUM identity, release preferences, and future reader features in one place.</p><strong>Open RHENLINK '+icons.arrow+'</strong></a>'+
  '</div></section>'+
  '<section class="route-section"><p class="section-kicker">THE RULE</p><h2>Story first. Reference second.</h2><p class="story-copy">Private development material stays private. Public systems should deepen finished work without spoiling it, replacing it, or asking a new reader to study the universe before they can enjoy the book.</p></section>';
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
  return '<section class="route-hero"><p class="eyebrow">ANEVUM STORE</p><h1>Books and editions.</h1><p>The Store exists to make ANEVUM publications easy to find and buy. REPLY is the first priority. Special editions and related objects come later, after the books justify them.</p><div class="action-row">'+button("View REPLY","/the-book")+button("Release updates","/rhenlink",true)+'</div></section>'+
  '<section class="route-section"><div class="store-feature"><div><p class="section-kicker">PUBLICATION 001</p><h2>REPLY</h2><p>Retailer and edition links will appear when the finished edition is available to order.</p></div><div class="store-status"><span>AVAILABILITY</span><strong>Not yet on sale</strong><small>No placeholder checkout.</small></div></div></section>'+
  '<section class="route-section"><p class="section-kicker">PUBLISHING FIRST</p><div class="info-grid"><div class="info-card"><strong>Standard editions</strong><p>The main print edition comes first.</p></div><div class="info-card"><strong>Special editions</strong><p>Produced only when the book and demand justify them.</p></div><div class="info-card"><strong>Related objects</strong><p>Secondary to the catalog, never a substitute for it.</p></div></div></section>';
}
function aboutPage(){
  return '<section class="route-hero"><p class="eyebrow">ABOUT ANEVUM</p><h1>Independent publishing, kept deliberate.</h1><p>ANEVUM is an independent publisher founded by Devon Akins. It exists to develop, publish, and support books—not to turn every experiment into a public-facing business.</p></section>'+
  '<section class="route-section"><div class="publisher-about-grid"><div><p class="section-kicker">WHAT WE PUBLISH</p><h2>Original fiction and nonfiction.</h2><p>ANEVUM begins with The Transcosmic and REPLY, while leaving room for future books that fit the same standard of serious development, strong ideas, and finished execution.</p></div><div><p class="section-kicker">HOW WE WORK</p><h2>One book at a time.</h2><p>The current catalog is developed in-house. We would rather release a smaller list we can stand behind than manufacture the appearance of a large publishing program.</p></div></div></section>'+
  '<section class="route-section"><p class="section-kicker">FOUNDER / AUTHOR</p><h2>Devon Akins</h2><p class="story-copy">Devon Akins founded ANEVUM as the publishing home for his books and the worlds, research, and reader resources that grow from them. REPLY is the first ANEVUM publication and the opening book of The Transcosmic.</p></section>'+
  '<section class="route-section"><p class="section-kicker">READER RESOURCES</p><div class="info-grid"><div class="info-card"><strong>Wiki</strong><p>Publication-safe reference material tied to released books.</p></div><div class="info-card"><strong>Lattice</strong><p>A relational way to move through released people, places, events, and ideas.</p></div><div class="info-card"><strong>RHENLINK</strong><p>Reader identity, release preferences, and future account features.</p></div></div></section>';
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
  else if(route==="/books")content=booksPage();
  else if(route==="/the-book"||route==="/reply"||route==="/stories/reply")content=bookPage();
  else if(route==="/explore")content=explorePage();
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
  const titles={
    "/":"ANEVUM — Independent Publisher",
    "/books":"Books — ANEVUM",
    "/the-book":"REPLY — ANEVUM",
    "/reply":"REPLY — ANEVUM",
    "/stories/reply":"REPLY — ANEVUM",
    "/explore":"Explore — ANEVUM",
    "/wiki":"Wiki — ANEVUM",
    "/lattice":"Lattice — ANEVUM",
    "/store":"Store — ANEVUM",
    "/rhenlink":"RHENLINK — ANEVUM",
    "/about":"About — ANEVUM",
    "/contact":"Contact — ANEVUM"
  };
  document.title=titles[route]||"ANEVUM";
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
