import test from 'node:test';
import assert from 'node:assert/strict';
import {createContext, runInContext, Script} from 'node:vm';
import {CLIENT,PAGE} from '../site/generated.mjs';

const project={id:'fixture-game',title:'Fixture Game',summary:'Explicit isolated test fixture.',category:'games',creatorHandle:'fixturemaker',creatorName:'Fixture Maker',freeToUse:true,demoUrl:'https://creator.example/game',sourceUrl:null,description:'Fixture only.',license:'Not specified',aiDisclosure:'Test fixture.',humanContribution:'Test fixture.'};
async function fixture({hash='#browse?q=forest&category=games&cursor=p8',pathname='/',fail=false,item=project}={}){
  const events={}, requests=[], elements={};
  for(const id of ['main','topNav','bottomNav','mobileDrawer','drawerOverlay','menuButton','searchInput']){
    const attrs={},classes=new Set(),handlers={};
    elements[id]={id,innerHTML:'',value:'',handlers,setAttribute:(k,v)=>attrs[k]=String(v),getAttribute:k=>attrs[k],removeAttribute:k=>delete attrs[k],focus:()=>elements[id].focused=true,addEventListener:(k,fn)=>handlers[k]=fn,classList:{remove:k=>classes.delete(k),toggle:(k,yes)=>yes?classes.add(k):classes.delete(k)}};
  }
  const location={pathname,search:'',hash,href:'https://fixture.example'+pathname+hash};
  const history={state:null,scrollRestoration:'auto',replaceState(state){this.state=state;}};
  const window={scrollY:0,scrollTo({top}){this.scrollY=top;},addEventListener:(k,fn)=>events[k]=fn};
  const document={title:'',getElementById:id=>elements[id],addEventListener:(k,fn)=>events['document:'+k]=fn};
  const context=createContext({URL,URLSearchParams,AbortController,Map,Set,console,location,history,window,document,requestAnimationFrame:fn=>fn(),fetch:async(path,options)=>{
    requests.push({path,options});
    const url=new URL(path,'https://fixture.example');
    let data;
    if(fail)return{ok:false,status:503};
    if(url.pathname==='/api/v1/status')data={counts:{publishedProjects:1,publishedCreators:1}};
    else if(url.pathname==='/api/v1/categories')data={categories:[{category:'games',count:1}]};
    else if(url.pathname==='/api/v1/projects')data={items:url.searchParams.get('q')==='absent'?[]:[item],nextCursor:'p9'};
    else if(url.pathname==='/api/v1/creators')data={items:[{handle:'fixturemaker',displayName:'Fixture Maker',publishedProjects:1}],nextCursor:null};
    else if(url.pathname==='/api/v1/creators/fixturemaker')data={creator:{handle:'fixturemaker',displayName:'Fixture Maker',publishedProjects:1}};
    else if(url.pathname==='/api/v1/projects/fixture-game')data={item};
    else return {ok:false,status:404};
    return{ok:true,status:200,json:async()=>data};
  }});
  runInContext(CLIENT,context);
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  return{context,elements,events,requests,window,location,history,document};
}

test('deployed browser bundle has no unresolved module import',()=>{
  assert.doesNotMatch(CLIENT,/^import /m);
  assert.doesNotThrow(()=>new Script(CLIENT));
});
test('real browser client retains filters in category, page and project links',async()=>{
  const f=await fixture();
  const html=f.elements.main.innerHTML;
  assert.match(html,/#browse\?q=forest&amp;category=tools/);
  assert.match(html,/#browse\?q=forest&amp;category=games&amp;cursor=p9/);
  assert.match(html,/project\/fixture-game\?from=browse%3Fq%3Dforest%26category%3Dgames%26cursor%3Dp8/);
  assert.equal(f.elements.searchInput.value,'forest');
});
test('home speaks to audiences and retains the cinematic structure',async()=>{
  const f=await fixture({hash:'#discover'}),html=f.elements.main.innerHTML;
  for(const value of ['INDEPENDENT CREATOR NETWORK','underground-hero-mark','hero-side-note','hero-metrics','v1-category-grid','Creator jams are coming'])assert.ok(html.includes(value),value);
  assert.doesNotMatch(html,/HOME FOR AI SOFTWARE CREATORS/);
});
test('project names the external host and restores the previous results route',async()=>{
  const f=await fixture({hash:'#project/fixture-game?from='+encodeURIComponent('browse?q=forest&category=games&cursor=p8')});
  assert.match(f.elements.main.innerHTML,/Play on creator site/);
  assert.match(f.elements.main.innerHTML,/creator\.example/);
  assert.match(f.elements.main.innerHTML,/#browse\?q=forest&amp;category=games&amp;cursor=p8/);
  assert.equal(f.document.title,'Fixture Game / ANEVUM');
  assert.ok(f.requests.every(r=>!r.path.includes('from=')));
});
test('private or external return routes and executable markup are not rendered',async()=>{
  const f=await fixture({hash:'#project/fixture-game?from=https%3A%2F%2Fevil.example',item:{...project,title:'<img src=x onerror=alert(1)>',demoUrl:'javascript:alert(1)'}});
  const html=f.elements.main.innerHTML;
  assert.ok(html.includes('&lt;img'));
  assert.doesNotMatch(html,/<img src=x|href="javascript:|href="https:\/\/evil/);
  assert.match(html,/No playable or usable destination/);
});
test('empty matches have recovery; service failure is a distinct state',async()=>{
  const empty=await fixture({hash:'#browse?q=absent'});
  assert.match(empty.elements.main.innerHTML,/No published projects match/);
  assert.match(empty.elements.main.innerHTML,/Clear filters/);
  const failed=await fixture({fail:true});
  assert.match(failed.elements.main.innerHTML,/role="alert"/);
  assert.match(failed.elements.main.innerHTML,/Community data is unavailable/);
  assert.doesNotMatch(failed.elements.main.innerHTML,/No published projects match/);
});
test('a missing project retains the safe return path',async()=>{
  const f=await fixture({hash:'#project/missing?from=browse%3Fq%3Dforest'});
  assert.match(f.elements.main.innerHTML,/Page not found/);
  assert.match(f.elements.main.innerHTML,/#browse\?q=forest/);
});
test('search uses current route rather than stale direct pathname',async()=>{
  const f=await fixture({pathname:'/creators',hash:'#browse?category=games&cursor=p8'});
  f.events['document:keydown']?.({key:'Other'});
  f.elements.searchInput.handlers.keydown({key:'Enter',preventDefault(){},target:{value:'new search'}});
  assert.equal(f.location.hash,'browse?q=new+search&category=games');
});
test('skip link focuses content without becoming an app route',async()=>{
  const f=await fixture();let prevented=false;
  f.events['document:click']({target:{closest:name=>name==='a'?{getAttribute:()=>'#main'}:null},preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(f.elements.main.focused,true);
  assert.equal(f.location.hash,'#browse?q=forest&category=games&cursor=p8');
});
test('public scroll state is bounded and contains no fetched records',async()=>{
  const f=await fixture();f.window.scrollY=432;
  runInContext('rememberPosition()',f.context);
  assert.equal(f.history.state.anevumCatalogue.y,432);
  assert.deepEqual(Object.keys(f.history.state.anevumCatalogue).sort(),['key','y']);
  assert.doesNotMatch(JSON.stringify(f.history.state),/Fixture Maker|demoUrl|member_id/);
});
test('all public reads omit credentials and never perform a write',async()=>{
  const f=await fixture();
  for(const req of f.requests){assert.equal(req.options.credentials,'omit');assert.equal(req.options.cache,'no-store');assert.equal(req.options.method,undefined);}
  assert.equal(f.requests.length,2);
});

// Build 002: destination priority never invents an app or relaxes URL checks.
function externalActions(html) {
  return [...html.matchAll(/<a\b([^>]*href="https:\/\/[^>]+)>([\s\S]*?)<\/a>/g)].map(([markup,attributes,content])=>({markup,attributes,content}));
}
test('a game demo is the single primary external action; source stays secondary',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,sourceUrl:'https://github.com/fixturemaker/game'}});
  const actions=externalActions(f.elements.main.innerHTML);
  assert.equal(actions.length,2);
  assert.match(actions[0].attributes,/class="btn primary"/);
  assert.match(actions[0].content,/Play on creator site/);
  assert.match(actions[1].attributes,/class="btn"/);
  assert.match(actions[1].content,/View source/);
});
test('a utility demo has a primary Try action without claiming an install',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,category:'tools'}});
  const [action]=externalActions(f.elements.main.innerHTML);
  assert.match(action.attributes,/class="btn primary"/);
  assert.match(action.content,/Try on creator site/);
  assert.doesNotMatch(action.content,/Play|Install|Buy/);
});
test('source-only projects make source primary and disclose that destination',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,demoUrl:null,sourceUrl:'https://github.com/fixturemaker/game'}});
  const html=f.elements.main.innerHTML,actions=externalActions(html);
  assert.equal(actions.length,1);
  assert.match(actions[0].attributes,/class="btn primary"/);
  assert.match(actions[0].content,/View source/);
  assert.doesNotMatch(actions[0].content,/Play|Try|Install/);
  assert.match(html,/Source code opens on <strong>github\.com<\/strong> in a new tab/);
  assert.match(html,/No playable or usable destination/);
});
test('an unsafe demo cannot prevent a valid source-only fallback',async()=>{
  for(const demoUrl of ['javascript:alert(1)','https://localhost/app','https://127.0.0.1','https://creator.example?token=secret']){
    const f=await fixture({hash:'#project/fixture-game',item:{...project,demoUrl,sourceUrl:'https://github.com/fixturemaker/game'}});
    const actions=externalActions(f.elements.main.innerHTML);
    assert.equal(actions.length,1,demoUrl);
    assert.match(actions[0].content,/View source/);
    assert.match(actions[0].attributes,/class="btn primary"/);
    assert.doesNotMatch(f.elements.main.innerHTML,/href="javascript:|href="https:\/\/(?:localhost|127\.)|token=secret/);
  }
});
test('missing destinations have no invented external action or primary button',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,demoUrl:null,sourceUrl:null}});
  assert.equal(externalActions(f.elements.main.innerHTML).length,0);
  assert.match(f.elements.main.innerHTML,/No public source link is available/);
  assert.doesNotMatch(f.elements.main.innerHTML,/class="btn primary"/);
});
test('unsafe source never becomes a secondary or fallback action',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,sourceUrl:'https://user:secret@evil.example/repo'}});
  const actions=externalActions(f.elements.main.innerHTML);
  assert.equal(actions.length,1);
  assert.match(actions[0].content,/Play on creator site/);
  assert.doesNotMatch(f.elements.main.innerHTML,/evil\.example|user:secret/);
});
test('both actions retain accessible host labels and new-tab protections',async()=>{
  const f=await fixture({hash:'#project/fixture-game',item:{...project,sourceUrl:'https://github.com/fixturemaker/game'}});
  for(const action of externalActions(f.elements.main.innerHTML)){
    assert.match(action.attributes,/target="_blank"/);
    assert.match(action.attributes,/rel="noopener noreferrer"/);
    assert.match(action.attributes,/aria-label="[^"]+ on (?:creator\.example|github\.com) \(opens in a new tab\)"/);
  }
});
test('homepage and document metadata include AI without making it a requirement',async()=>{
  const f=await fixture({hash:'#discover'});
  assert.match(f.elements.main.innerHTML,/Games\. Apps\. Tools\. AI\. Open source\./);
  assert.match(PAGE,/<meta name="description" content="Discover independent games, useful apps, AI experiences and open-source creations\./);
  assert.doesNotMatch(PAGE+f.elements.main.innerHTML,/HOME FOR AI SOFTWARE CREATORS|software made with AI/);
  assert.match(PAGE,/Accounts, publishing and voting are not open yet/);
});
