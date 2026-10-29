import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright');}catch{}
const origin='http://127.0.0.1:8787';
test('synthetic browser: autosave, themes, mobile layout, search and review', {skip:!playwright,timeout:90000},async()=>{
 const server=spawn(process.execPath,['scripts/test-server.mjs'],{cwd:new URL('..',import.meta.url),stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break;}catch{}await delay(100);}
  browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CRISTYBREATHE_TEST_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await context.newPage();
  const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
  await page.goto(origin);await page.getByRole('heading',{name:/Cristy\./}).waitFor();
  await page.getByRole('button',{name:'Leave a thought',exact:true}).first().click();
  const title='Synthetic browser '+Date.now();
  await page.getByLabel('Title',{exact:true}).fill(title);await page.getByLabel('Your thought',{exact:true}).fill('Saved by the real API to the local SQL database.');
  await page.getByRole('status').filter({hasText:'Draft saved in your private space'}).waitFor();
  await page.getByRole('button',{name:'Save draft and close',exact:true}).click();
  await page.reload();await page.getByRole('heading',{name:/Cristy\./}).waitFor();
  await page.getByRole('button',{name:'Notes & collections',exact:true}).click();
  await page.getByRole('button',{name:'Drafts',exact:true}).click();
  await page.getByRole('button',{name:new RegExp(title)}).filter({has:page.locator('h3')}).click();
  await page.getByRole('textbox',{name:'Your thought',exact:true}).fill('Updated synthetic browser text. <script>window.bad=1</script>');
  await page.locator('summary').filter({hasText:'Organize this thought'}).click();
  await page.getByLabel('Collection',{exact:true}).fill('Synthetic home');await page.getByLabel('A priority',{exact:true}).check();
  await page.getByRole('button',{name:/Keep this thought/}).click();await page.locator('#editor').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Find anything',exact:true}).first().click();
  await page.getByRole('searchbox',{name:'Search your entire space'}).fill('Updated synthetic browser');
  await page.locator('#search-results h3').filter({hasText:title}).waitFor();
  assert.equal(await page.evaluate(()=>window.bad),undefined);
  await page.getByRole('button',{name:'Daily review',exact:true}).click();
  const reviewItem=page.locator('.review-item').filter({has:page.locator('h3',{hasText:title})});
  await reviewItem.getByRole('button',{name:'Tomorrow',exact:true}).click();
  await page.getByRole('heading',{name:'0 things for your attention.'}).waitFor();
  await page.locator('.review-item').filter({has:page.locator('h3',{hasText:title})}).getByRole('button',{name:'Review',exact:true}).click();
  await page.route('**/api/entries/*',route=>route.request().method()==='PATCH'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic temporary failure'})}):route.continue());
  await page.getByLabel('Your thought',{exact:true}).fill('Recovered after a synthetic failed save.');
  await page.getByRole('status').filter({hasText:'Not saved · your text is still here'}).waitFor();
  assert.equal(await page.getByLabel('Your thought',{exact:true}).inputValue(),'Recovered after a synthetic failed save.');
  await page.unroute('**/api/entries/*');
  await page.getByRole('button',{name:'Try saving again',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Saved in your private space'}).waitFor();
  await page.getByRole('button',{name:'Save draft and close',exact:true}).click();
  await page.locator('.review-item').filter({has:page.locator('h3',{hasText:title})}).getByRole('button',{name:'Done',exact:true}).click();
  await page.locator('summary').filter({hasText:'Done & reviewed'}).waitFor();
  await page.getByRole('button',{name:'Personalize',exact:true}).click();
  await mkdir(new URL('../.private/qa/',import.meta.url),{recursive:true});
  for(const [theme,label] of [['sage','Sage After Dark'],['lavender','Lavender Twilight'],['autumn','Warm Autumn'],['teal','Midnight Teal'],['porcelain','Soft Porcelain']]){
   await page.getByRole('button',{name:new RegExp(label)}).click();await page.getByRole('status').filter({hasText:'Preferences saved'}).waitFor();
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   const contrast=await page.evaluate(()=>{
    const css=getComputedStyle(document.documentElement),rgb=s=>{s=s.replace('#','');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);};
    const luminance=s=>rgb(s).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0),ratio=(a,b)=>{a=luminance(css.getPropertyValue(a).trim());b=luminance(css.getPropertyValue(b).trim());return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
    return {text:ratio('--text','--surface'),muted:ratio('--muted','--surface'),accent:ratio('--on-accent','--accent')};
   });
   for(const value of Object.values(contrast))assert.ok(value>=4.5,theme+' contrast '+JSON.stringify(contrast));
   await page.screenshot({path:new URL('../.private/qa/theme-'+theme+'.png',import.meta.url).pathname,fullPage:true});
  }
  await page.getByRole('button',{name:/Sage After Dark/}).click();await page.getByRole('status').filter({hasText:'Preferences saved'}).waitFor();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export my data',exact:true}).click();
  assert.ok((await downloadPromise).suggestedFilename().startsWith('cristybreathe-backup-'));
  const exported=await context.request.get(origin+'/api/export'),backup=await exported.json();
  const restoreFile=new URL('../.private/qa/synthetic-backup.json',import.meta.url).pathname;
  await writeFile(restoreFile,JSON.stringify(backup));
  await page.locator('#import-file').setInputFiles(restoreFile);
  await page.getByRole('button',{name:'Restore thoughts',exact:true}).click();
  await page.getByRole('status').filter({hasText:/thoughts restored/}).waitFor();
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  const cached=await page.evaluate(async()=>{const result=[];for(const name of await caches.keys())for(const req of await(await caches.open(name)).keys())result.push(new URL(req.url).pathname);return result;});
  assert.deepEqual(cached.sort(),['/offline.css','/offline.html']);
  await page.getByRole('button',{name:'My space',exact:true}).first().click();
  await page.screenshot({path:new URL('../.private/qa/desktop-home.png',import.meta.url).pathname,fullPage:true});
  for(const width of [320,390,430,768]){
   await page.setViewportSize({width,height:844});await page.reload();await page.getByRole('heading',{name:/Cristy\./}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' has no horizontal overflow');
   await page.screenshot({path:new URL('../.private/qa/home-'+width+'.png',import.meta.url).pathname,fullPage:true});
   await page.getByRole('button',{name:'Leave a thought',exact:true}).filter({visible:true}).first().click();
   const bounds=await page.locator('#editor').boundingBox();assert.ok(bounds.x>=0&&bounds.width<=width+1);
   await page.getByRole('button',{name:'Save draft and close'}).click();
  }
  assert.deepEqual(failures.filter(message=>!message.includes('503')),[]);
  // Remove synthetic records from this local test database through the app API.
  const list=await context.request.get(origin+'/api/entries');
  const items=(await list.json()).entries.filter(e=>e.title.startsWith('Synthetic browser '));
  for(const item of items)await context.request.delete(origin+'/api/entries/'+item.id,{headers:{origin,'x-cristybreathe':'1','if-match':String(item.revision)}});
 }finally{await browser?.close();server.kill();}
});
