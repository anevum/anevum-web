// Injected only by local CI browser harness (not deployed).
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(v,m)=>{if(!v)throw Error(m);};
async function main(){
 try{
  const pathname=location.pathname;
  await sleep(600);
  if(pathname==='/'){
   const cards=[...document.querySelectorAll('.project')];
   assert(cards.length===3,'Lab must list exactly three projects');
   assert(document.querySelectorAll('.project .button').length===3,'Project navigation missing');
   assert(document.querySelectorAll('.project .status.pending').length===1,'Transcosmic must remain unconnected');
   assert(document.body.textContent.includes('OPEN CONSOLE'),'RHEN research console not advertised');
   assert(document.querySelector('.project .button[href="/projects/the-fold/"]'),'Fold play link missing');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Lab catalog overflows width');
  }else if(pathname==='/projects/the-fold/'){
   assert(document.querySelector('.lab-return[href="/"]'),'No Lab return link');
   assert(document.querySelector('#introPlay'),'Fold onboarding absent');
   assert(document.querySelector('#levelNumber')?.textContent==='0','Fold did not start at level 0');
   assert(document.querySelector('#game')?.dataset.map==='demo','GPS-free world not initial');
   assert(document.querySelectorAll('#demoPins [data-quest]').length===3,'Demo pins missing');
   const r=await fetch('./icons.svg');
   assert(r.ok,'Custom Fold glyph sprite was not served');
   assert(r.headers.get('content-type')?.includes('svg'),'Glyph MIME type wrong');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Fold page horizontal overflow');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'Fold page vertical overflow');
   document.querySelector('#introPlay').click();
   await sleep(150);
   assert(document.querySelector('#intro')?.hidden,'Fold start button failed');
  }else if(pathname==='/projects/rhen/'){
   assert(document.querySelectorAll('#rhenTabs button').length===4,'RHEN research navigation missing');
   assert(document.body.textContent.includes('RUNTIME OFFLINE'),'Trading runtime misrepresented');
   assert(document.querySelector('.panel[data-view="overview"]')?.hidden===false,'Overview panel not visible');
   assert(document.querySelectorAll('.source-file a').length===5,'Actual pinned source modules missing');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'RHEN interface overflows horizontally');
   const replay=document.querySelector('[data-tab="replay"]');
   replay.click();
   assert(document.querySelector('.panel[data-view="replay"]')?.hidden===false,'Cost model tab not working');
   assert(document.querySelector('#roundtrip')?.textContent==='10.00 bps','Initial example friction must be 10 bps');
   document.querySelector('#gross5').value='25';
   document.querySelector('#gross15').value='3';
   document.querySelector('#costForm button[type="submit"]').click();
   assert(document.querySelector('#net5')?.textContent==='15.00 bps','5m manual net calculation incorrect');
   assert(document.querySelector('#net15')?.textContent==='-7.00 bps','15m manual net calculation incorrect');
   assert(document.querySelector('#net60')?.textContent==='—','Unobserved horizon must stay unpriced');
   document.querySelector('#spread').value='-1';
   assert(document.querySelector('#spread').validity.rangeUnderflow,'Browser failed to reject negative costs');
   document.querySelector('#costForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
   assert(document.querySelector('#costError')?.textContent.includes('between 0 and 1000'),'Manual validation failed to reject negative costs');
   document.querySelector('#costForm button[type="reset"]').click();
   await sleep(30);
   assert(document.querySelector('#roundtrip')?.textContent==='10.00 bps','Reset did not restore assumptions');
   document.querySelector('[data-tab="source"]').click();
   assert(document.querySelector('.panel[data-view="source"]')?.hidden===false,'Source tab does not open');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'RHEN source view overflows horizontally');
   if(new URL(location.href).searchParams.get('scenario')==='cost-lens')replay.click();
   else document.querySelector('[data-tab="overview"]').click();
 }else if(pathname==='/projects/transcosmic'){
   assert(document.body.textContent.includes('Preview not connected'),'Misleading placeholder');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Project details overflow');
  }else throw Error('Unknown scenario');
  document.documentElement.dataset.labSmoke='pass';
 }catch(error){
  document.documentElement.dataset.labSmoke='fail';
  document.documentElement.dataset.labSmokeError=String(error.message).slice(0,170);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});else main();
