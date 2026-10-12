// ANEVUM Creator V1. Public projection only; no local demo users, fabricated projects or permissions.
const main = document.getElementById('main');
const search = document.getElementById('searchInput');
const searchForm = document.getElementById('searchForm');
const announcer = document.getElementById('routeAnnouncement');
const homeLogo = document.querySelector('.brand-lockup .anevum-brand-mark')?.outerHTML || '';
const escapeHtml = x => String(x ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const iconPaths = {
  home:'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  compass:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M16 8l-2.7 5.3L8 16l2.7-5.3z',
  plus:'M12 4v16M4 12h16',
  messages:'M3 4h18v14H9l-6 3z M7 9h10M7 13h6',
  bookmark:'M5 3h14v18l-7-5-7 5z',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 3.5-7 8-7s8 3 8 7',
  grid:'M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z',
  game:'M6 8h12a4 4 0 0 1 3.8 3l1.1 6c.3 2-2 3.5-3.6 2.2L16 16H8l-3.3 3.2C3.1 20.5.8 19 .9 17L2 11A4 4 0 0 1 6 8z M6 12h5 M8.5 9.5v5 M16.5 12h.1 M19 14h.1',
  spark:'M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z',
  arrow:'M5 12h14m-6-6 6 6-6 6',
  beaker:'M9 3h6M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3 M7 16h10',
  shield:'M12 2 4 5v7c0 5 4 8 8 10 4-2 8-5 8-10V5z M8 12l3 3 5-6',
  folder:'M3 5h7l2 3h9v12H3z',
  heart:'M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z',
  alert:'M12 3 2 21h20z M12 9v5 M12 18h.01'
};
function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="${iconPaths[name] || iconPaths.grid}"/></svg>`; }
for (const target of document.querySelectorAll('[data-symbol]')) target.innerHTML = icon(target.dataset.symbol);
const categories = [
  ['tools','Apps & tools','Useful things for everyday problems','flowstate.webp','grid'],
  ['games','Games','Small worlds worth exploring','voxel.webp','game'],
  ['creative','Creative','Art, music, design and more','neural.webp','spark'],
  ['automation','Automation','Workflows that do something real','forge.webp','beaker'],
  ['learning','Learning','Ideas made easier to understand','dream.webp','bookmark'],
  ['research','Research','Questions, evidence and experiments','aurora.webp','beaker'],
  ['libraries','Libraries','Reusable building blocks','prompt.webp','folder'],
  ['other','More creations','Unexpected, useful and unusual','rift.webp','spark']
];
const categoryName = key => categories.find(row => row[0] === key)?.[1] || 'Project';
const goLink = (href,label,kind='') => `<a data-nav href="${escapeHtml(href)}" class="action ${kind}">${escapeHtml(label)} ${icon('arrow')}</a>`;
const pageIntro = (eyebrow,title,subtitle) => `<header class="page-intro"><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></header>`;
const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : 0;
function safeExternal(value) {
  if(typeof value !== 'string' || value.length > 2048) return null;
  try {const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))return null;
    if(!u.hostname.includes('.')||u.hostname.includes(':')||/^[0-9.]+$/.test(u.hostname)||/(?:^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname))return null;
    for(const name of u.searchParams.keys())if(/^(token|access_token|api_key|secret|password)$/i.test(name))return null;
    return u.href;
  }catch{return null;}
}
function externalLink(url,label) {
  const safe=safeExternal(url);
  return safe?`<a class="action" href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer external">${escapeHtml(label)} <span aria-hidden="true">↗</span></a>`:'';
}
function categoryStrip() {
  return `<div class="category-strip">${categories.slice(0,4).map(([slug,title,description,art],index)=>`<a class="category-card" data-nav href="/discover?category=${slug}"><img src="/assets/${art}" alt="" loading="lazy"><span class="number">0${index+1} / CATEGORY</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></a>`).join('')}</div><p class="copyright-note">Category images illustrate the creative direction; they do not represent published community projects.</p>`;
}
function projectCards(items) {
  return `<div class="work-grid">${items.map(p=>{
    const title=escapeHtml(p.title),id=encodeURIComponent(String(p.id)),label=escapeHtml(categoryName(p.category));
    return `<article class="work-card"><div class="work-art">${icon(p.category==='games'?'game':p.category==='creative'?'spark':'grid')}<span class="real-data-tag">PUBLISHED PROJECT</span></div><div class="work-body"><span class="work-kind">${label}</span><h3><a data-nav href="/projects/${id}">${title}</a></h3><p>${escapeHtml(p.summary)}</p><div class="work-meta"><span>by ${escapeHtml(p.creatorName || p.creatorHandle || 'Creator')}</span><span>${p.freeToUse?'Free to use':'External terms'}</span></div></div></article>`;}).join('')}</div>`;
}
function realEmpty(searching=false){return `<section class="empty-showcase" aria-label="No published projects"><div class="empty-orb" aria-hidden="true">${icon('spark')}</div><div><span class="eyebrow">A PLACE TO BEGIN</span><h3>${searching?'No matching releases yet.':'The first creations are on their way.'}</h3><p>${searching?'Try a different term or category. No unpublished or private work appears in search.':'The catalogue displays real, approved work only. We are preparing the first creator releases; there are no invented games or ratings here.'}</p>${goLink(searching?'/discover':'/status',searching?'Explore all categories':'See what is being built')}</div></section>`;}
function home(status,listing){
 const published=number(status?.counts?.publishedProjects), creators=number(status?.counts?.publishedCreators);
 return `<section class="hero" aria-labelledby="homeTitle"><div class="hero-copy"><span class="eyebrow">CREATE / DISCOVER / BELONG</span><h1 id="homeTitle">Good ideas<br>deserve to be <em>found.</em></h1><p>Discover independent games, useful apps, creative experiments and the people behind them. Make something. Share what works. Help someone else make theirs better.</p><div class="hero-actions">${goLink('/discover','Explore creations','primary')}${goLink('/about','What is ANEVUM?')}</div></div><div class="hero-art" aria-hidden="true"><div class="hero-orbit">${homeLogo}</div><span class="art-caption">ANEVUM / ORBIT</span></div></section>
 <div class="home-lede"><div><span class="eyebrow">FIND YOUR NEXT FAVORITE THING</span><h2>What are you into?</h2><p>Whether you build software or just enjoy using it, there is a place for you here.</p></div><a data-nav class="section-link" href="/discover">All categories <span aria-hidden="true">↗</span></a></div>
 ${categoryStrip()}
 <div class="content-row"><section aria-labelledby="publishedTitle"><div class="section-heading"><div><span class="eyebrow">THE REAL CATALOGUE</span><h2 id="publishedTitle">Freshly published</h2><p>${published} published ${published===1?'project':'projects'} from ${creators} ${creators===1?'creator':'creators'}.</p></div><a data-nav class="section-link" href="/discover">Browse all <span aria-hidden="true">↗</span></a></div>${listing.items.length?projectCards(listing.items):realEmpty()}</section>
 <aside class="community-panel"><span class="eyebrow">THE PEOPLE MAKE IT</span><h3>More than a place to post.</h3><p>Thoughtful feedback, a library of discoveries and recognition for real contributions—not purchased popularity. Community features are in private development.</p><a data-nav href="/community">See the community plan <span aria-hidden="true">↗</span></a></aside></div>`;
}
function browse(params,items,counts){
 const chosen=params.get('category')||'',q=(params.get('q')||'').trim();
 const chips=[['','All'],...categories.map(row=>[row[0],row[1]])].map(([slug,title])=>{const p=new URLSearchParams();if(slug)p.set('category',slug);if(q)p.set('q',q);return `<a data-nav href="/discover${p.size?'?'+p.toString():''}" class="filter-pill ${chosen===slug?'active':''}" ${chosen===slug?'aria-current="page"':''}>${escapeHtml(title)}</a>`;}).join('');
 const next=new URLSearchParams();if(chosen)next.set('category',chosen);if(q)next.set('q',q);if(items.nextCursor)next.set('cursor',items.nextCursor);
 const all=Array.isArray(counts.categories)?counts.categories.reduce((v,c)=>v+number(c.count),0):0;
 return pageIntro('EXPLORE ANEVUM',q?`Results for “${q}”`:'Find something worth opening.','Real published work, organized by what it helps you do. Search, try, read, save later and come back for more.')+`<nav class="filter-panel" aria-label="Project categories">${chips}</nav><p class="search-meta">${items.items.length} shown · ${all} published across ANEVUM</p>${items.items.length?projectCards(items.items):realEmpty(Boolean(q||chosen))}<div class="pager">${params.has('cursor')?goLink('/discover','Start again'):''}${items.nextCursor?goLink('/discover?'+next.toString(),'Next projects','primary'):''}</div>`;
}
function projectDetail(item){
 const description=item.description||item.summary||'No further description has been provided.';
 const ext=[externalLink(item.demoUrl,'Open creator-hosted demo'),externalLink(item.sourceUrl,'View source')].filter(Boolean).join('');
 return pageIntro(`${categoryName(item.category).toUpperCase()} / BY ${item.creatorName||item.creatorHandle||'CREATOR'}`,item.title,item.summary||'Published ANEVUM project')+`<div class="detail-grid"><article class="outlined-panel detail-content"><span class="eyebrow">ABOUT THIS PROJECT</span><h2>What it does</h2><p class="detail-description">${escapeHtml(description)}</p>${ext?`<div class="button-row">${ext}</div>`:'<p class="fineprint">No public external demo or source link is provided for this project.</p>'}<h3>AI assistance disclosure</h3><p>${escapeHtml(item.aiDisclosure||'Not provided.')}</p><h3>Human contribution</h3><p>${escapeHtml(item.humanContribution||'Not provided.')}</p><p class="external-notice">External links open content on the creator’s own hosting. ANEVUM does not execute third-party code here, guarantee safety, or verify repository ownership from a listing alone.</p></article><aside class="outlined-panel detail-aside"><span class="eyebrow">PROJECT RECORD</span><dl><dt>Creator</dt><dd>${escapeHtml(item.creatorName||item.creatorHandle||'Not available')}</dd><dt>Category</dt><dd>${escapeHtml(categoryName(item.category))}</dd><dt>License</dt><dd>${escapeHtml(item.license||'Not specified')}</dd><dt>Availability</dt><dd>${item.freeToUse?'Free to use':'See the creator’s terms'}</dd></dl><p class="fineprint">Reviews, favorites and XP will be enabled only after the member system passes security and moderation acceptance.</p>${goLink('/discover','Back to discovery')}</aside></div>`;
}
function informational(which){
 const pages={
 create:{overline:'CREATE / YOUR WORK',title:'A home for what you make.',intro:'A creator profile and a clear project page for apps, games, research and useful experiments. Submissions are currently invitation-only in staging.',left:'Share the work, not just a screenshot.',right:'A review process that respects creators.',first:'Link to your demo, source or release wherever you already host it. Include authorship, licensing and honest disclosure of AI help.',second:'Drafts stay private until reviewed. Staff moderation and authentic feedback are being validated before broader access.'},
 community:{overline:'COMMUNITY / REAL PARTICIPATION',title:'Good work grows with people.',intro:'Creators need encouragement and useful criticism. Explorers, reviewers, testers and collaborators should be able to matter without publishing an app.',left:'A community worth returning to.',right:'Recognition that means something.',first:'Discussions, project responses and helpful feedback are planned as real member features, with safety tools and moderation.',second:'Free XP, levels, badges and achievements will reflect verified contributions, not payment or endless passive scrolling.'},
 library:{overline:'YOUR LIBRARY / COMING SOON',title:'Keep what matters.',intro:'Find something useful, save it, and return to it later. A private, account-scoped library is part of the invitation-only member build.',left:'Save your discoveries.',right:'Your account, your choices.',first:'Collections will point back to creator-owned project pages instead of downloading or copying someone else’s app.',second:'Private account controls and data export must be verified before public member registration opens.'},
 account:{overline:'IDENTITY / COMING SOON',title:'Your corner of ANEVUM.',intro:'A profile for projects, collections, feedback and recognition. Public sign-up is not open while member identity and recovery are reviewed.',left:'A real member profile.',right:'Private by design.',first:'Creators and explorers will share a common identity while retaining their own projects, activity and account controls.',second:'Authentication, role separation and deletion requests need independent acceptance. No brokerage or payment account is required.'},
 about:{overline:'ABOUT / ANEVUM',title:'A place for the people making things.',intro:'ANEVUM is an independent community for discovering, sharing and improving creative software. You do not need to be a developer to belong.',left:'Make, play, and learn.',right:'Keep the door open.',first:'Independent makers can showcase real games, apps, tools and experiments. Curious people can test, review and share what they discover.',second:'Meaningful free participation, a phone-friendly experience and creator-hosted projects are design requirements. We are building those capabilities in stages.'}
 };
 const p=pages[which];
 return pageIntro(p.overline,p.title,p.intro)+`<div class="info-columns"><section class="outlined-panel"><span class="eyebrow">01 / HOW IT WORKS</span><h2>${p.left}</h2><p>${p.first}</p></section><section class="outlined-panel"><span class="eyebrow">02 / WHY IT MATTERS</span><h2>${p.right}</h2><p>${p.second}</p></section></div><div class="button-row" style="margin-top:23px">${goLink('/discover','Explore published work','primary')}${goLink('/status','See development status')}</div>`;
}
function statusPage(status){
 const published=number(status.counts?.publishedProjects),creators=number(status.counts?.publishedCreators);
 const items=[
 ['Real project catalogue','Available','Only approved published projects from active creators appear publicly.'],
 ['Search and category filters','Available','Search, browse and open published project details.'],
 ['Account registration','Not public','Member sign-in and recovery remain gated pending independent security acceptance.'],
 ['Creator submissions','Not public','Private draft/review implementations exist in staging, but public submissions are not enabled.'],
 ['Votes, saves and levels','Not public','Progression must be earned, deduplicated, reversible and protected from abuse.'],
 ['Community discussions','Not public','Conversation and moderation need real operational acceptance.']
 ];
 return pageIntro('BUILD STATUS / HONESTLY', 'Building in the open.','This is a read-only public foundation. Features are released only when their data, permissions and moderation are real.')+`<div class="outlined-panel"><p>${published} published ${published===1?'project':'projects'}, ${creators} ${creators===1?'creator':'creators'} with published work. No fake users, popularity or awards are shown.</p><div class="status-list">${items.map(([label,state,desc])=>`<div class="status-item"><div><strong>${label}</strong><p>${desc}</p></div><span>${state}</span></div>`).join('')}</div></div><div class="button-row" style="margin-top:25px">${goLink('/discover','Explore the catalogue','primary')}${goLink('/about','About ANEVUM')}</div>`;
}
async function getJson(path,signal) {
 const response=await fetch(path,{credentials:'omit',cache:'no-store',signal,headers:{Accept:'application/json'}});
 if(!response.ok){const error=new Error(response.status===404?'Not found':'Service unavailable');error.status=response.status;throw error;}
 const data=await response.json();if(!data||typeof data!=='object')throw new Error('Invalid response');return data;
}
let sequence=0,controller=null;
const cleanPath=()=>location.pathname.replace(/\/+$/,'')||'/';
function chooseSection(path){if(path==='/')return 'home';if(path==='/discover'||path.startsWith('/projects/'))return 'discover';if(path==='/create')return 'create';if(path==='/community')return 'community';if(path==='/library')return 'library';if(path==='/account')return 'account';return '';}
function syncNavigation(path){const active=chooseSection(path);for(const item of document.querySelectorAll('[data-section]')){const selected=item.dataset.section===active;item.classList.toggle('active',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}}
function loadError(error){if(error.status===404)return pageIntro('NOT FOUND','That project is unavailable.','The project may have been unpublished, removed or never released.')+goLink('/discover','Browse published projects');
 return `<section class="error-box" role="alert"><span class="eyebrow">SERVICE STATUS</span><h2>We couldn't load the catalogue.</h2><p>The public data service is unavailable. This is different from an empty project list. Try again in a moment.</p><button class="action primary" type="button" id="retryLoad">Try again ${icon('arrow')}</button></section>`;}
async function render(options={}){
 const ticket=++sequence;controller?.abort();controller=new AbortController();const signal=controller.signal;
 const path=cleanPath(),params=new URLSearchParams(location.search);
 syncNavigation(path);search.value=params.get('q')||'';
 main.setAttribute('aria-busy','true');main.innerHTML='<div class="loading-panel" role="status">Loading real ANEVUM data...</div>';
 try{
  let body,title;
  if(path==='/'){
    const [status,items]=await Promise.all([getJson('/api/v1/status',signal),getJson('/api/v1/projects?limit=6',signal)]);
    body=home(status,items);title='Make. Discover. Belong.';
  }else if(path==='/discover'){
    const selected=new URLSearchParams();for(const key of ['category','q','cursor'])if(params.has(key))selected.set(key,params.get(key));
    const [items,counts]=await Promise.all([getJson('/api/v1/projects?'+selected,signal),getJson('/api/v1/categories',signal)]);
    body=browse(selected,items,counts);title='Discover';
  }else if(/^\/projects\/[A-Za-z0-9_-]{1,80}$/.test(path)){
    const data=await getJson('/api/v1/projects/'+encodeURIComponent(path.slice('/projects/'.length)),signal);
    body=projectDetail(data.item);title=data.item.title;
  }else if(path==='/status'){
    const data=await getJson('/api/v1/status',signal);body=statusPage(data);title='Build status';
  }else if(['create','community','library','account','about'].some(k=>path==='/'+k)){
    body=informational(path.slice(1));title=path.slice(1).replace(/^./,c=>c.toUpperCase());
  }else{
    body=pageIntro('NOT FOUND','Not part of this release.','This page is not available in ANEVUM Creator V1.')+goLink('/','Back home');title='Not found';
  }
  if(ticket!==sequence)return;
  main.innerHTML=body;document.title=`ANEVUM | ${title}`;announcer.textContent=`${title} loaded`;
 }catch(error){if(signal.aborted||ticket!==sequence)return;main.innerHTML=loadError(error);announcer.textContent='Unable to load page';}
 finally{if(ticket===sequence){main.removeAttribute('aria-busy');if(options.focus)main.focus({preventScroll:true});}}
}
function navigate(to){const target=new URL(to,location.origin);if(target.origin!==location.origin)return;
 if(target.pathname+target.search===location.pathname+location.search){if(target.hash)location.hash=target.hash;return;}
 history.pushState(null,'',target.pathname+target.search+target.hash);window.scrollTo({top:0,behavior:'instant'});render({focus:true});}
document.addEventListener('click',event=>{
 const retry=event.target.closest('#retryLoad');if(retry){render();return;}
 const anchor=event.target.closest('a[data-nav]');if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||anchor.target)return;
 event.preventDefault();navigate(anchor.href);
});
searchForm.addEventListener('submit',event=>{event.preventDefault();const q=search.value.trim().slice(0,100);navigate('/discover'+(q?'?q='+encodeURIComponent(q):''));});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,[contenteditable="true"]')){event.preventDefault();search.focus();}});
window.addEventListener('popstate',()=>render({focus:true}));
render();
