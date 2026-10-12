// Live data only. Never substitute illustrative projects or local demo votes.
const main = document.getElementById('main');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const icons = { home:'M3 10 12 3l9 7v10h-6v-6H9v6H3z', grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', user:'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M3 22c0-5 4-8 9-8s9 3 9 8', book:'M4 4h16v16H4z M8 4v16 M11 9h6 M11 13h6', rocket:'m3 21 5-1 12-12-4-4L4 16z M13 7l4 4 M3 21l1-5 M16 4h5v5', chat:'M3 4h18v13H9l-6 4z', trophy:'M7 4h10v6c0 5-3 7-5 7s-5-2-5-7z M7 6H3v3c0 3 2 4 5 4 M17 6h4v3c0 3-2 4-5 4 M12 17v3 M8 21h8', search:'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M17 17l5 5' };
const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="'+(icons[name] || icons.grid)+'"/></svg>';
const navItems = [['discover','Home','home'],['browse','Explore','grid'],['creators','Creators','user'],['publish','Create','rocket'],['community','Community','chat'],['library','Library','book'],['rankings','Rankings','trophy'],['jams','Jams','rocket'],['account','Profile','user'],['status','Build status','book']];
const categories = [['tools','Apps & Tools','flowstate'],['games','Games','voxel'],['automation','Automation','forge'],['creative','Creative software','neural'],['learning','Learning','dream'],['research','Research','forge'],['libraries','Libraries','prompt'],['other','Other','aurora']];
const nameOf = value => categories.find(x => x[0] === value)?.[1] || 'Project';
let navigation = 0, controller;
function link(text, route, primary = false) { return '<a class="btn '+(primary?'primary':'')+'" href="#'+esc(route)+'">'+esc(text)+'</a>'; }
function header(title, detail) { return '<div class="v1-heading"><div class="hero-kicker">ANEVUM / V1 IN DEVELOPMENT</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(detail)+'</p></div>'; }
function empty(title, detail) { return '<section class="panel v1-empty"><span class="v1-emblem">'+icon('rocket')+'</span><h2>'+esc(title)+'</h2><p>'+esc(detail)+'</p>'+link('See what is being built','status')+'</section>'; }
function closeMenu() { document.getElementById('mobileDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); document.getElementById('menuButton').setAttribute('aria-expanded','false'); }
function navigationUi(route) {
  for (const id of ['topNav','bottomNav','mobileDrawer']) {
    const activeRoute = route.startsWith('project/') ? 'browse' : route.startsWith('creator/') ? 'creators' : route;
    const available = id === 'topNav' ? navItems.filter(([r])=>['discover','browse','creators','community'].includes(r))
      : id === 'bottomNav' ? navItems.filter(([r])=>['discover','browse','publish','library','account'].includes(r))
      : navItems;
    document.getElementById(id).innerHTML = available.map(([r,t,i]) => '<a href="#'+r+'" class="'+(r===activeRoute?'active':'')+'" '+(r===activeRoute?'aria-current="page"':'')+'>'+icon(i)+'<span>'+t+'</span></a>').join('');
  }
}
async function get(path, signal) {
  const response = await fetch(path, { credentials:'omit', cache:'no-store', signal, headers:{Accept:'application/json'} });
  if (!response.ok) { const e = new Error(response.status === 404 ? 'not-found' : 'unavailable'); e.status = response.status; throw e; }
  return response.json();
}
function creatorLink(handle,name) {
  const visible=esc(name||handle||'Creator');
  return typeof handle==='string'&&/^[a-z][a-z0-9_]{2,29}$/i.test(handle)
    ? '<a class="v1-creator-link" href="#creator/'+encodeURIComponent(handle.toLowerCase())+'">'+visible+'</a>'
    : visible;
}
function creatorCards(items) {
  return '<div class="v1-creator-grid">'+items.map(c=>
    '<article class="panel v1-creator-card"><div class="v1-creator-avatar" aria-hidden="true">'+icon('user')+'</div>'+
    '<div><h3>'+creatorLink(c.handle,c.displayName)+'</h3><p class="tiny muted">@'+esc(c.handle)+'</p>'+
    '<p>'+Number(c.publishedProjects)+' published '+(Number(c.publishedProjects)===1?'project':'projects')+'</p></div></article>'
  ).join('')+'</div>';
}
function creatorDirectory(params,data) {
  const q=params.get('q')||'';
  const next=new URLSearchParams(params);
  if(data.nextCursor)next.set('cursor',data.nextCursor);
  return header(q?'Creators matching "'+q+'"':'Meet the creators.','These are real contributors with at least one approved public project. Unpublished profiles are never listed.')+
    '<section class="v1-section"><p class="tiny muted">'+data.items.length+' visible '+(data.items.length===1?'creator':'creators')+' on this page</p>'+
    (data.items.length?creatorCards(data.items):empty('The first creators are still ahead.','Only people with approved published projects appear here. No placeholder member accounts.'))+'</section>'+
    '<div class="v1-pagination">'+(params.has('cursor')?link('First page','creators'+(q?'?q='+encodeURIComponent(q):'')):'')+
    (data.nextCursor?link('Next page','creators?'+next.toString()):'')+'</div>';
}
function creatorProfile(profile,data,params) {
  const creator=profile.creator;
  return header(creator.displayName,'@'+creator.handle+' · Public portfolio')+
    '<div class="content-columns"><div>'+
    '<section class="panel v1-aside v1-creator-profile"><span class="hero-kicker">PUBLISHED CREATOR</span>'+
    '<div class="v1-profile-intro"><span class="v1-creator-avatar" aria-hidden="true">'+icon('user')+'</span>'+
    '<div><h2>'+esc(creator.displayName)+'</h2><p class="muted">@'+esc(creator.handle)+'</p></div></div>'+
    '<p>'+Number(creator.publishedProjects)+' approved '+(Number(creator.publishedProjects)===1?'project':'projects')+' publicly available.</p></section>'+
    '<section class="v1-section"><h2>Published work</h2><p class="muted">Only approved, currently visible releases are shown.</p></section>'+
    (data.items.length?cards(data.items):empty('No available releases.','This creator has no currently visible projects.'))+
    '<div class="v1-pagination">'+(params.has('cursor')?link('First page','creator/'+encodeURIComponent(creator.handle)):'')+
    (data.nextCursor?link('More projects','creator/'+encodeURIComponent(creator.handle)+'?cursor='+encodeURIComponent(data.nextCursor)):'')+
    '</div></div><aside><section class="panel v1-aside"><h3>People behind the projects</h3>'+
    '<p class="muted">Public portfolios highlight real published work. Private member information, saves, account status and staff powers are never exposed here.</p>'+
    link('Discover creators','creators')+link('Explore all projects','browse')+'</section></aside></div>';
}
function cards(items) {
  return '<div class="project-grid v1-live-grid">'+items.map(p => '<article class="panel v1-project"><div class="v1-project-mark">'+icon(p.category === 'games' ? 'rocket' : 'grid')+'</div><span class="tiny muted">'+esc(nameOf(p.category))+'</span><h3><a href="#project/'+encodeURIComponent(p.id)+'">'+esc(p.title)+'</a></h3><p>'+esc(p.summary)+'</p><div class="v1-project-foot"><span>by '+creatorLink(p.creatorHandle,p.creatorName)+'</span><span>'+ (p.freeToUse?'Free to use':'See pricing')+'</span></div></article>').join('')+'</div>';
}
function categoryCards() {
  return '<div class="v1-category-grid">'+categories.slice(0,4).map(([cat,title,art]) => '<a class="panel v1-category" href="#browse?category='+cat+'"><img src="/assets/'+art+'.webp" alt="" loading="lazy"><span>'+esc(title)+'</span></a>').join('')+'</div><p class="tiny muted">Category illustrations are concept artwork, not published apps.</p>';
}
function discover(status, data) {
  return '<section class="hero"><div class="hero-content"><div class="hero-kicker">THE HOME FOR AI SOFTWARE CREATORS</div><h1><span>BUILD</span><span class="line-share">SHARE</span><span class="line-play">PLAY</span><span class="line-together">TOGETHER</span></h1><p>Apps. Games. Tools. Ideas. People.<br><span class="hero-long">A new home for software made with AI. Explore the first build as the community takes shape.</span></p><div class="hero-actions">'+link('Explore projects','browse',true)+link('V1 build status','status')+'</div></div><div class="hero-side-note">IDEAS<br>TOOLS<br>PEOPLE<br>POSSIBILITIES</div><div class="hero-metrics"><div class="metric">'+icon('grid')+'<div><b>'+Number(status.counts.publishedProjects)+'</b><span>published projects</span></div></div><div class="metric">'+icon('user')+'<div><b>'+Number(status.counts.publishedCreators)+'</b><span>published creators</span></div></div><div class="metric">'+icon('rocket')+'<div><b>V1</b><span>in development</span></div></div></div></section><div class="content-columns"><div><div class="v1-section"><h2>Discover what people make.</h2><p class="muted">Useful tools, surprising games, and ideas worth sharing.</p></div>'+categoryCards()+'<div class="v1-section"><h2>Published projects</h2><p class="muted">Live catalogue. Only published work from active creators appears here.</p></div>'+(data.items.length?cards(data.items):empty('The first projects are still ahead.','No projects have been published yet. The first creator releases will appear here.'))+'</div><aside><section class="panel v1-aside"><div class="v1-event-art v1-event-illustration" aria-hidden="true">'+icon('trophy')+'</div><span class="hero-kicker">MAKE SOMETHING TOGETHER</span><h2>Creator jams are coming.</h2><p class="muted">Challenges, shared builds, and recognition for real contributions. No event is open yet.</p>'+link('View build status','status')+'</section><section class="panel v1-aside"><h3>Your work. Your identity.</h3><p class="muted">Creator profiles, reviews, voting and earned levels are part of V1. They are not active in this read-only release.</p>'+link('Publishing status','publish')+link('Meet the creators','creators')+'</section></aside></div>';
}
function listing(params, data, counts) {
  const chips = [['','All'],...categories.map(([k,t])=>[k,t])].map(([k,t]) => '<a class="dark-chip '+((params.get('category')||'')===k?'active':'')+'" href="#browse'+(k?'?category='+k:'')+'">'+esc(t)+'</a>').join('');
  const q = params.get('q') || '';
  const next = new URLSearchParams(params);
  if (data.nextCursor) next.set('cursor',data.nextCursor);
  return header(q ? 'Results for "'+q+'"' : 'Explore the catalogue.','Search real published work. Category counts follow the same visibility rules as project listings.')+'<div class="chipbar v1-filters">'+chips+'</div><p class="tiny muted">'+data.items.length+' shown'+(counts.categories.length?' / '+counts.categories.reduce((n,x)=>n+x.count,0)+' published across all categories':'')+'</p>'+(data.items.length?cards(data.items):empty(q?'No published projects match.':'Nothing published in this view yet.',q?'Try another search or browse all categories.':'Explore another category, or see which features are coming next.'))+'<div class="v1-pagination">'+(params.has('cursor')?link('First page','browse'):'')+(data.nextCursor?link('Next page','browse?'+next.toString()):'')+'</div>';
}
function external(url, label) {
  try { const parsed = new URL(url); if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return ''; } catch { return ''; }
  return '<a class="btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' <span aria-hidden="true">&#8599;</span></a>';
}
function project(item) {
  return header(item.title, item.summary)+'<div class="content-columns"><article class="panel v1-aside"><span class="tiny muted">'+esc(nameOf(item.category))+' / by '+creatorLink(item.creatorHandle,item.creatorName)+'</span><h2>About this project</h2><p class="v1-description">'+esc(item.description || item.summary)+'</p><div class="v1-actions">'+external(item.demoUrl,'Open external app')+external(item.sourceUrl,'View source')+'</div><p class="tiny muted">External projects run on their creator\'s hosting. A listing is not a safety certification.</p><h3>AI disclosure</h3><p>'+esc(item.aiDisclosure || 'Not supplied.')+'</p><h3>Human contribution</h3><p>'+esc(item.humanContribution || 'Not supplied.')+'</p></article><aside class="panel v1-aside"><h3>Project information</h3><p>License: '+esc(item.license || 'Not specified')+'</p><p>Access: '+(item.freeToUse?'Free to use':'Check the creator\'s pricing')+'</p><p class="muted">Ratings, saves and reviews will appear when member accounts and moderation are ready.</p>'+link('Back to browse','browse')+'</aside></div>';
}
function statusPage(status) {
  const featureRows = [['Discovery and search','Available','Live published-project data, category filters and project pages.'],['Public creator portfolios','Available','Only active creators with approved public projects are discoverable.'],['Member accounts and editing','Next','Registration, recovery and ownership checks.'],['Publishing and moderation','Planned','Submissions, review decisions and reports.'],['Votes, XP and levels','Planned','Persistent, abuse-resistant records of real participation.'],['Community and jams','Planned','Discussion, collaboration and challenges.']];
  return header('Building ANEVUM V1.','This is the live-data foundation, not a finished community launch.')+'<section class="panel v1-aside"><h2>What is available now</h2><p>'+Number(status.counts.publishedProjects)+' published projects. '+Number(status.counts.publishedCreators)+' creators with published work. No sample accounts or reputation totals.</p>'+featureRows.map(([t,s,d]) => '<div class="v1-feature"><div><h3>'+t+'</h3><p class="muted">'+d+'</p></div><span class="tag">'+s+'</span></div>').join('')+'</section>';
}
// Preserve feature destinations and the cinematic presentation while keeping
// actual participation behind the independent authentication/moderation gates.
function featurePreview(route) {
  const copy = {
    publish:['Create and share.','Creators will be able to submit their own original games, apps and tools for review.','Owner-controlled submissions, source links, project drafts and moderation are already being validated in staging.','/assets/forge.webp'],
    community:['Find your people.','Conversations, feedback, replies and contributions connect creators and explorers.','Discussion and moderation require accepted member identity and reporting safeguards before public activation.','/assets/jam.webp'],
    library:['Save your discoveries.','Build a collection of useful tools, games and experiments from the people who publish them.','Member-scoped saved libraries exist in staging; they cannot be used anonymously in this read-only release.','/assets/prompt.webp'],
    account:['Your space on ANEVUM.','Creator and member profiles, projects, achievements, activity and identity will live together.','Sign-in, profiles and privacy controls are being validated in isolated staging. Public registration remains closed.','/assets/profilecover.webp'],
    jams:['Build something together.','Creator jams and shared challenges will bring people together around interesting problems.','No event is open, and there are no fictional entrants, submissions or prizes.','/assets/jam.webp'],
    rankings:['Recognition you earn.','Achievements, levels and ratings should reflect useful contributions rather than arbitrary activity.','Real XP, achievements and anti-abuse checks are under staging acceptance; no fabricated leaderboards are shown.','/assets/aurora.webp'],
    templates:['Start from a useful idea.','Reusable creative resources can help more people publish their first project.','Templates will appear here when real submissions are licensed and approved.','/assets/flowstate.webp'],
    portal:['A place for creative work.','Discover projects, find collaborators and see what the ANEVUM community is creating.','This area will become interactive when the underlying community systems pass acceptance.','/assets/hero.webp']
  };
  const [title,description,state,art] = copy[route] || copy.portal;
  return header(title,description)+
    '<div class="content-columns v1-feature-preview"><div><section class="panel v1-aside">'+
    '<span class="hero-kicker">PART OF THE ANEVUM EXPERIENCE</span>'+
    '<h2>Designed as part of the whole platform.</h2><p>'+esc(state)+'</p>'+
    '<div class="v1-actions">'+link('Explore real projects','browse',true)+link('Development status','status')+'</div>'+
    '</section><section class="panel v1-aside"><h3>Built around real participation</h3>'+
    '<p class="muted">No demo accounts, synthetic ratings, XP or activity are represented as real community content.</p></section></div>'+
    '<aside class="panel v1-aside v1-illustrated-preview"><img src="'+art+'" alt="" loading="lazy">'+
    '<p class="tiny muted">Illustrative artwork only. Community content will be supplied by real creators.</p></aside></div>';
}
async function render() {
  const seq = ++navigation; controller?.abort(); controller = new AbortController();
  const direct = location.pathname === '/discover' ? 'browse'
    : location.pathname === '/creators' ? 'creators'
    : /^\/creators\/[A-Za-z][A-Za-z0-9_]{2,29}$/.test(location.pathname) ? 'creator/'+location.pathname.slice('/creators/'.length)
    : location.pathname === '/create' ? 'publish'
    : /^\/projects\/[A-Za-z0-9_-]{1,80}$/.test(location.pathname) ? 'project/'+location.pathname.slice('/projects/'.length)
    : ['community','library','account','status','about'].includes(location.pathname.slice(1)) ? (location.pathname === '/about' ? 'status' : location.pathname.slice(1))
    : 'discover';
  const hash = location.hash.slice(1) || direct, split = hash.indexOf('?');
  const route = split < 0 ? hash : hash.slice(0,split), params = new URLSearchParams(split < 0 ? (location.hash ? '' : location.search) : hash.slice(split+1));
  closeMenu(); navigationUi(route); document.title = 'ANEVUM / '+(route==='discover'?'Create. Play. Belong.':route.startsWith('project/')?'Project':route.startsWith('creator/')?'Creator':route.charAt(0).toUpperCase()+route.slice(1));
  main.setAttribute('aria-busy','true'); main.innerHTML = '<div class="panel v1-empty" role="status">Loading live community data...</div>';
  document.getElementById('searchInput').value = params.get('q') || '';
  try {
    let html;
    if (route === 'discover') { const [s,d] = await Promise.all([get('/api/v1/status',controller.signal),get('/api/v1/projects?limit=12',controller.signal)]); html = discover(s,d); }
    else if (route === 'browse') { const [d,c] = await Promise.all([get('/api/v1/projects?'+params.toString(),controller.signal),get('/api/v1/categories',controller.signal)]); html = listing(params,d,c); }
    else if (route.startsWith('project/')) { const data = await get('/api/v1/projects/'+encodeURIComponent(route.slice(8)),controller.signal); html=project(data.item); }
    else if (route === 'creators') {
      const data=await get('/api/v1/creators?'+params.toString(),controller.signal);
      html=creatorDirectory(params,data);
    }
    else if (route.startsWith('creator/')) {
      const handle=route.slice('creator/'.length);
      if(!/^[a-z][a-z0-9_]{2,29}$/i.test(handle)){const err=new Error('not-found');err.status=404;throw err;}
      const query=new URLSearchParams({creator:handle,limit:'12'});
      if(params.has('cursor'))query.set('cursor',params.get('cursor'));
      const [profile,projects]=await Promise.all([
        get('/api/v1/creators/'+encodeURIComponent(handle),controller.signal),
        get('/api/v1/projects?'+query.toString(),controller.signal)
      ]);
      html=creatorProfile(profile,projects,params);
    }
    else if (route === 'status') html = statusPage(await get('/api/v1/status',controller.signal));
    else if (['publish','account','library','community','jams','rankings','portal','templates'].includes(route)) html=featurePreview(route);
    else html=header('Page not found.','This route is not part of the current release.')+link('Back to Discover','discover');
    if(seq!==navigation)return;
    main.innerHTML=html;
  } catch(error) {
    if(seq!==navigation || error.name==='AbortError')return;
    main.innerHTML = error.status===404 ? header('Page not found.','This project or creator may be unpublished or unavailable.')+link('Browse projects','browse') : '<section class="panel v1-empty" role="alert"><h2>Community data is unavailable.</h2><p>We could not load the catalogue. This is not an empty-project result.</p><button class="btn primary" id="retryLoad" type="button">Try again</button></section>';
  } finally { if(seq===navigation)main.removeAttribute('aria-busy'); }
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');
  if(target?.id==='retryLoad'){render();return;}
  if(target?.dataset.route){location.hash=target.dataset.route;return;}
  if(target?.id==='menuButton'){const open=target.getAttribute('aria-expanded')!=='true';target.setAttribute('aria-expanded',String(open));document.getElementById('mobileDrawer').classList.toggle('open',open);document.getElementById('drawerOverlay').classList.toggle('open',open);}
});
document.getElementById('drawerOverlay').addEventListener('click',closeMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();document.getElementById('menuButton').focus();}});
document.getElementById('searchInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const q=event.target.value.trim();location.hash=(location.hash.startsWith('#creators')||location.pathname==='/creators'?'creators':'browse')+(q?'?q='+encodeURIComponent(q):'');}});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});});
render();
