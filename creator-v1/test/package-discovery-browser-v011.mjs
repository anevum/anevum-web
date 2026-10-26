/** Real compiled React interactions against the existing loopback fixture.
 * This proves frontend behavior only; it is not live publication acceptance. */
import assert from 'node:assert/strict';
import {PACKAGE_DISCOVERY_IDS as ids} from './package-discovery-fixture-v011.mjs';
export async function capturePackageDiscoveryV011({client,base,evaluate,until,screenshot,enabled}){
 assert.match(base,/^http:\/\/127\.0\.0\.1:4178$/);
 const results=[];
 const switchMode=async mode=>{
  const response=await fetch(base+'/__package-discovery-fixture?mode='+mode);
  assert.equal(response.ok,true,'Synthetic package fixture is unavailable');
  assert.equal((await response.json()).syntheticOnly,true);
 };
 const trace=async()=>{
  const value=await (await fetch(base+'/__package-discovery-requests')).json();
  assert.equal(value.syntheticOnly,true);
  for(const request of value.requests){
   assert.equal(request.method,'GET','Package read unexpectedly used a mutation');
   assert.equal(request.hadCookie,false,'Anonymous package metadata sent browser credentials');
  }
  return value.requests;
 };
 const navigate=async path=>{
  const before=await evaluate('performance.timeOrigin');
  const result=await client.send('Page.navigate',{url:base+path});
  assert.equal(result.errorText,undefined);
  await until(()=>evaluate('document.readyState==="complete"&&location.pathname+location.search==='+JSON.stringify(path)+'&&performance.timeOrigin!=='+JSON.stringify(before)));
 };
 const settled=async()=>{
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  return until(()=>evaluate(`!!document.querySelector('.portal-result-toolbar')&&
   !document.querySelector('.portal-discover .loading-line')&&
   ![...document.querySelectorAll('.av010-discovery-status')].some(x=>x.textContent.includes('Checking'))`));
 };
 const state=()=>evaluate(`({
  ids:[...document.querySelectorAll('.portal-discover-results [data-package-id]')].map(x=>x.dataset.packageId),
  legacy:document.querySelectorAll('.portal-discover-results .av73-project-card').length,
  empty:document.querySelector('.portal-true-empty h2')?.textContent||null,
  notice:[...document.querySelectorAll('.av010-discovery-status')].map(x=>x.textContent).join(' '),
  overflow:document.documentElement.scrollWidth>innerWidth+1
 })`);
 const category=async label=>{
  await evaluate('[...document.querySelectorAll(".portal-channel-filters button")].find(x=>x.textContent.includes('+JSON.stringify(label)+')).click()');
  await settled();
 };
 const search=async value=>{
  await evaluate('(()=>{const input=document.getElementById("portal-project-query");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await evaluate('document.querySelector(".portal-wide-search button").click()');
  await until(()=>evaluate('(new URLSearchParams(location.search).get("q")||"")==='+JSON.stringify(value)));
  await settled();
 };
 try{
  await switchMode('published');
  await client.send('Network.enable');
  await client.send('Network.setCookie',{name:'anevum_package_cookie_probe',value:'synthetic',url:base,path:'/',sameSite:'Strict'});
  await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  if(!enabled){
   await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
   await navigate('/creator/discover');await settled();
   const off=await state();assert.equal(off.legacy,8);assert.deepEqual(off.ids,[]);
   assert.equal(off.overflow,false);assert.equal(off.notice,'');
   await screenshot('package-discovery-v011-disabled-390');
   await navigate('/creator/@v091_other');
   await until(()=>evaluate('!!document.querySelector(".ms-public")'));
   assert.equal(await evaluate('!!document.querySelector(".av010-package-gallery")'),false);
   assert.equal((await trace()).length,0,'Flag-off build requested a package catalogue or member gallery');
   results.push({case:'build-flag-off',packageRequests:0,legacy:off.legacy});
   console.log('PACKAGE_DISCOVERY_V011_BUILD_FLAG_OFF=PASS');
   return {syntheticFixture:true,enabled:false,status:'PASS',cases:results};
  }

  for(const [width,height] of [[1440,900],[390,844],[320,720]]){
   await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
   await navigate('/creator/discover');await settled();
   const initial=await state();
   assert.deepEqual(initial.ids,[ids.game,ids.simulation,ids.app,ids.story]);
   assert.equal(initial.legacy,8);assert.equal(initial.overflow,false);
   assert.equal(await evaluate('document.cookie.includes("anevum_package_cookie_probe=synthetic")'),true);
   assert.equal(await evaluate('document.querySelectorAll(".av73-filter-count").length'),0,'Combined counts must not invent package category totals');
   const actions=await evaluate(`([...document.querySelectorAll('.portal-discover-results .av010-work-primary')].map(a=>{
    const r=a.getBoundingClientRect();return {href:a.getAttribute('href'),height:r.height,left:r.left,right:r.right};
   }))`);
   assert.equal(actions.length,4);
   for(const action of actions){
    assert.match(action.href,/^\/upload\/v3\/play\/[0-9a-f-]{36}$/);
    assert.ok(action.height>=44&&action.left>=-1&&action.right<=width+1,'Package action must fit the viewport with a 44px target');
   }
   await evaluate('document.querySelector(".portal-discover-results").scrollIntoView({block:"start",behavior:"instant"})');
   await screenshot('package-discovery-v011-grid-'+width);
   await evaluate('[...document.querySelectorAll(".portal-result-actions button")].find(x=>x.textContent.includes("LIST")).click()');
   // URL-owned React layout commits after the click. Observe the final compact
   // cards before inspecting them; keep the strict class and hidden-cover gate.
   await until(()=>evaluate(`new URLSearchParams(location.search).get('view')==='list'&&
    document.querySelectorAll('.portal-discover-results .av010-work-card--compact').length===4&&
    [...document.querySelectorAll('.portal-discover-results .av010-work-card')].every(x=>
     getComputedStyle(x.querySelector('.av010-work-cover')).display==='none')`));
   const compact=await evaluate(`([...document.querySelectorAll('.portal-discover-results .av010-work-card')].map(x=>({
    compact:x.classList.contains('av010-work-card--compact'),cover:getComputedStyle(x.querySelector('.av010-work-cover')).display
   })))`);
   assert.equal(compact.length,4);assert.ok(compact.every(x=>x.compact&&x.cover==='none'));
   assert.equal((await state()).overflow,false);
   await screenshot('package-discovery-v011-list-'+width);
   results.push({case:'grid-list-layout',width,packages:initial.ids.length,legacy:initial.legacy});
  }
  const beforeFilters=(await trace()).length;
  await category('Games');
  assert.deepEqual((await state()).ids,[ids.game,ids.simulation]);
  await search('Orbital');
  assert.deepEqual((await state()).ids,[ids.simulation]);assert.equal((await state()).legacy,0);
  await search('');await category('Apps & Tools');
  assert.deepEqual((await state()).ids,[ids.app]);
  await category('Creative / AI');assert.deepEqual((await state()).ids,[ids.story]);
  await category('Open Source');assert.deepEqual((await state()).ids,[]);
  await category('All work');
  assert.equal((await trace()).length,beforeFilters,'Local search/category filters reloaded the same bounded catalogue');
  await evaluate('document.querySelector(".portal-availability-filter button").click()');
  await until(()=>evaluate('new URLSearchParams(location.search).get("free")==="1"'));await settled();
  assert.deepEqual((await state()).ids,[]);assert.equal((await state()).legacy,7);
  assert.equal((await trace()).length,beforeFilters,'The explicit free-only filter requested undeclared package costs');
  await evaluate('document.querySelector(".portal-availability-filter button").click()');
  await settled();assert.equal((await state()).ids.length,4);
  results.push({case:'query-category-free-and-dedup',status:'PASS'});

  // A normal anchor must leave the React base path and reach the canonical
  // package route. This fixture does not replace or execute the real runtime.
  await evaluate('document.querySelector('+JSON.stringify('[data-package-id="'+ids.game+'"] .av010-work-primary')+').click()');
  await until(()=>evaluate('location.pathname==='+JSON.stringify('/upload/v3/play/'+ids.game)+'&&!!document.getElementById("synthetic-package-player")'));
  await navigate('/creator/@v091_other');
  await until(()=>evaluate('document.querySelectorAll(".av010-package-gallery [data-package-id]").length===1'));
  assert.equal(await evaluate('document.querySelector(".av010-package-gallery .av010-work-primary").getAttribute("href")'),'/upload/v3/play/'+ids.game);
  assert.equal(await evaluate('!!document.querySelector(".av010-package-gallery a[href*=preview]")'),false);
  await evaluate('document.querySelector(".av010-package-gallery").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('package-discovery-v011-member-wall-320');
  await navigate('/creator/@v091_private');
  await until(()=>evaluate('document.getElementById("av12-world-heading")?.textContent==="A PRIVATE WORLD."'));
  assert.equal(await evaluate('!!document.querySelector(".av010-package-gallery")'),false);
  assert.equal((await trace()).some(x=>x.path.includes('/creators/v091_private/')),false);
  results.push({case:'canonical-play-and-public-member-wall',status:'PASS'});

  for(const mode of ['suspended','disabled','empty','unavailable']){
   await switchMode(mode);await navigate('/creator/discover');await settled();
   const missing=await state();assert.deepEqual(missing.ids,[]);assert.equal(missing.legacy,8);
   assert.equal(missing.overflow,false);assert.equal(missing.empty,null);
   assert.equal(missing.notice.includes('temporarily unavailable'),mode==='unavailable');
   if(mode==='suspended'){
    await navigate('/creator/@v091_other');
    await until(()=>evaluate('!!document.querySelector(".ms-public")&&!document.querySelector(".av010-package-gallery")'));
    assert.equal((await fetch(base+'/upload/v3/play/'+ids.game)).status,404);
   }
   await trace();results.push({case:'backend-'+mode,status:'PASS'});
  }
  // A failed feed must not masquerade as a genuinely empty search. Conversely,
  // older pages and free-only searches do not depend on the package service.
  await navigate('/creator/discover?q=no-synthetic-match');await settled();
  let empty=await state();assert.equal(empty.legacy,0);assert.equal(empty.empty,null);
  assert.match(empty.notice,/temporarily unavailable/);
  await switchMode('unavailable');
  for(const path of ['/creator/discover?cursor=synthetic-empty','/creator/discover?free=1&q=no-synthetic-match']){
   await navigate(path);await settled();empty=await state();
   assert.equal(empty.legacy,0);assert.deepEqual(empty.ids,[]);assert.ok(empty.empty);
   assert.equal(empty.notice,'');assert.equal((await trace()).length,0);
  }
  await switchMode('empty');await navigate('/creator/discover?q=no-synthetic-match');await settled();
  assert.equal((await state()).empty,'NO MATCHING PROJECTS YET');
  await trace();results.push({case:'outage-versus-empty-and-out-of-scope',status:'PASS'});
  console.log('PACKAGE_DISCOVERY_V011_COMPILED_REACT=PASS');
  return {syntheticFixture:true,enabled:true,status:'PASS',cases:results};
 }finally{
  await switchMode('disabled');
  await client.send('Network.deleteCookies',{name:'anevum_package_cookie_probe',url:base});
 }
}
