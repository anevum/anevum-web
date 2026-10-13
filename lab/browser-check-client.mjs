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
   assert(document.querySelectorAll('.project .status.pending').length===2,'Unconnected projects not marked');
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
  }else if(pathname==='/projects/rhen'||pathname==='/projects/transcosmic'){
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
