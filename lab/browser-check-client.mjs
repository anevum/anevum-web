// Injected only by local CI browser harness (not deployed).
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(v,m)=>{if(!v)throw Error(m);};
async function main(){
 try{
  const pathname=location.pathname;
  await sleep(600);
  if(pathname==='/'){
   const entries=[...document.querySelectorAll('.project-entry')];
   assert(entries.length===4,'Lab should expose four projects');
   assert(document.body.textContent.includes('ANEVUM LAB'),'Terminal heading not found');
   assert(document.querySelector('#terminalForm'),'DOS command line not mounted');
   assert(document.querySelector('#selectedLink')?.getAttribute('href')==='/projects/the-fold/','First project route absent');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Lab horizontally scrolls');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'Lab vertically scrolls');
   document.querySelectorAll('.project-entry')[3].click();
   assert(document.querySelector('#selectedLink')?.getAttribute('href')==='/projects/backstage/','Backstage not selectable');
   const input=document.querySelector('#terminalInput');
   input.value='STATUS';
   document.querySelector('#terminalForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   assert(document.querySelector('#terminalLog').textContent.includes('RHEN'),'STATUS command failed');
   input.value='SELECT 2';
   document.querySelector('#terminalForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   assert(document.querySelector('#selectedLink')?.getAttribute('href')==='/projects/rhen/','SELECT command failed');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'Lab scrolls after command output');
  }else if(pathname==='/projects/backstage/'){
   assert(document.querySelector('#caseShell'),'Backstage case desk missing');
   assert(document.querySelector('#countAll')?.textContent==='0','Empty local queue should show 0 cases');
   assert(document.body.textContent.includes('NOT CONNECTED TO COMMUNITY DATA'),'Backstage is not labeled local-only');
   document.querySelector('#newCase').click();
   assert(document.querySelector('#newCaseForm'),'Case form failed to open');
   document.querySelector('#newTitle').value='Local test case';
   document.querySelector('#newTarget').value='PRIVATE-TEST-REF';
   document.querySelector('#newDescription').value='Browser-only smoke test; no community action.';
   document.querySelector('#newCaseForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   assert(document.querySelector('#countAll')?.textContent==='1','Local case was not saved');
   assert(document.querySelectorAll('.entry').length===1,'Local queue entry missing');
   document.querySelector('#editStatus').value='review';
   document.querySelector('#editReason').value='Manual owner review started.';
   document.querySelector('#updateCaseForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   assert(document.querySelector('#countReview')?.textContent==='1','Case status not updated');
   assert(JSON.parse(localStorage.getItem('anevum.lab.backstage.cases.v1')).cases[0].events.length===2,'Local event log missing');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Backstage horizontally scrolls');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'Backstage vertically scrolls');
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
   assert(document.querySelector('#terminal'),'RHEN single-screen terminal missing');
   assert(document.querySelector('#holoStage'),'RHEN animated 3D stage missing');
   assert(document.querySelector('#metricEquity')?.textContent==='—','Unconfigured broker cannot show fake equity');
   assert(document.querySelector('#statusTrading')?.textContent==='DISABLED','Trading must stay off');
   assert(document.querySelector('#brokerPillText')?.textContent.includes('NOT CONNECTED'),'Broker should default to not connected');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'RHEN horizontal overflow');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'RHEN vertical overflow');
   document.querySelector('#sourceBtn').click();
   assert(!document.querySelector('#sourceDialog').hidden,'Source dialog failed to open');
   assert(document.querySelector('#sourceDialog').textContent.includes('OPEN RESEARCH CONSOLE'),'Research navigation missing');
   document.querySelector('#closeDialog').click();
   assert(document.querySelector('#sourceDialog').hidden,'Source dialog did not close');
   assert(document.querySelector('#historySvg')?.hidden,'Synthetic equity curve not permitted');
  }else if(pathname==='/projects/rhen/research/'){
   assert(document.querySelectorAll('#rhenTabs button').length===4,'RHEN research navigation missing');
   assert(document.body.textContent.includes('RUNTIME OFFLINE'),'Research runtime status incorrect');
   const replay=document.querySelector('[data-tab="replay"]');replay.click();
   assert(document.querySelector('.panel[data-view="replay"]')?.hidden===false,'Research cost lens broken');
   document.querySelector('#gross5').value='25';
   document.querySelector('#costForm button[type="submit"]').click();
   assert(document.querySelector('#net5')?.textContent==='15.00 bps','Research cost calculation broken');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'RHEN research horizontal overflow');
  }else if(pathname==='/projects/transcosmic/'){
   assert(document.querySelector('#workspacePanels'),'Transcosmic studio missing');
   assert(document.querySelector('#docCount')?.textContent==='0','Studio should begin with empty local library');
   document.querySelector('#createDoc').click();
   assert(document.querySelector('#docTitle')?.disabled===false,'New document failed');
   const title=document.querySelector('#docTitle');title.value='Test Chapter';title.dispatchEvent(new Event('input',{bubbles:true}));
   const editor=document.querySelector('#docBody');editor.value='Testing an ANEVUM Lab local chapter editor.';editor.dispatchEvent(new Event('input',{bubbles:true}));
   assert(document.querySelector('#docCount')?.textContent==='1','Library did not register new chapter');
   assert(document.querySelector('#wordsCount')?.textContent==='7','Word count incorrect');
   const backing=JSON.parse(localStorage.getItem('anevum.lab.transcosmic.documents.v1'));
   assert(backing.documents[0].body.includes('local chapter'),'Local document did not persist');
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Transcosmic horizontally scrolls');
   assert(document.documentElement.scrollHeight<=innerHeight+1,'Transcosmic vertically scrolls');

  }else throw Error('Unknown scenario');
  document.documentElement.dataset.labSmoke='pass';
 }catch(error){
  document.documentElement.dataset.labSmoke='fail';
  document.documentElement.dataset.labSmokeError=String(error.message).slice(0,170);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});else main();
