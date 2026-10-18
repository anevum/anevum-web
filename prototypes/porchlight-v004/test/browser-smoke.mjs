/**
 * Porchlight V004 synthetic-only browser acceptance.
 * Uses a TEST-ONLY fixture server and random local cookie identities.
 * This must not be used as an authentication provider or public web server.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';

const serverPath=fileURLToPath(new URL('../../porchlight-v003/test/preview-server.mjs',import.meta.url));
const screenshots=fileURLToPath(new URL('./screenshots',import.meta.url));
await mkdir(screenshots,{recursive:true});
const child=spawn(process.execPath,['--experimental-sqlite',serverPath],{
  env:{...process.env,PORCHLIGHT_FIXTURE_TEST_ONLY:'1'},
  stdio:['ignore','pipe','pipe']
});
let stderr='';
child.stderr.on('data',d=>{stderr+=d.toString().slice(0,2000);});
async function fixtureConfig(){
  return new Promise((resolve,reject)=>{
    let buffer='',ready=false;
    const timeout=setTimeout(()=>{if(!ready)reject(new Error('test server start timed out: '+stderr.slice(0,500)));},15000);
    child.stdout.on('data',data=>{
      buffer+=data.toString();
      const end=buffer.indexOf('\n');
      if(!ready && end>=0){
        ready=true;clearTimeout(timeout);
        try{resolve(JSON.parse(buffer.slice(0,end)));}
        catch(error){reject(error);}
      }
    });
    child.once('exit',code=>{if(!ready){clearTimeout(timeout);reject(new Error('test fixture exited '+code+' '+stderr.slice(0,500)));}});
  });
}
let browser;
try{
  const fixture=await fixtureConfig();
  const base='http://127.0.0.1:'+fixture.port;
  const errors=[];
  browser=await chromium.launch({headless:true});
  const contexts=[];
  async function tab(role,width=390,height=900){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    contexts.push(context);
    if(role){
      await context.addCookies([{name:'pv_fixture',value:fixture.cookies[role],domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'}]);
    }
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push((role||'guest')+' '+error.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(base+'/',{waitUntil:'load'});
    await page.waitForFunction(()=>!document.getElementById('session-state').textContent.includes('Checking the session'));
    return page;
  }
  async function contains(page,id,text){
    await page.waitForFunction(([element,value])=>
      (document.getElementById(element)?.textContent||'').includes(value),[id,text],{timeout:12000});
  }
  const guest=await tab(null,1440);
  assert.equal((await guest.locator('#pin-count').innerText()).trim(),'0 homes');
  assert.equal(await guest.locator('#submit-report').isDisabled(),true);
  assert.equal(await guest.locator('#submit-host').isDisabled(),true);

  const host=await tab('host-A',390);
  await host.locator('#host-label').fill('Lantern House');
  await host.locator('#host-address').fill('123 Example Lane, Test City FL 00000');
  await host.locator('#host-block').selectOption('lantern-walk');
  await host.locator('input[name=offering][value=candy]').check();
  await host.locator('#host-adult').check();
  await host.locator('#host-authority').check();
  await host.locator('#host-consent').check();
  await host.locator('#submit-host').click();
  await contains(host,'host-result','Submitted: pending');
  assert.equal((await guest.locator('#pin-count').innerText()).trim(),'0 homes');

  const stranger=await tab('host-B',390);
  await contains(stranger,'my-state','No applications');
  const forbidden=await stranger.context().request.get(base+'/v1/organizer/events/halloween-2026/reports');
  assert.equal(forbidden.status(),403);

  const reviewer=await tab('moderator-A',1440);
  await contains(reviewer,'review-queue','123 Example Lane');
  await reviewer.locator('#review-queue textarea').first().fill('Confirmed directly with the adult resident');
  await reviewer.locator('#review-queue input[type=checkbox]').first().check();
  await reviewer.locator('#review-queue select').first().selectOption('direct-confirmation');
  await reviewer.locator('#review-queue button[type=submit]').first().click();
  await contains(reviewer,'review-queue','approved');

  await guest.locator('#refresh-directory').click();
  await contains(guest,'pin-count','1 home');
  assert.equal(await guest.locator('#submit-report').isDisabled(),false);
  const publicDirectory=await guest.locator('#pin-list').innerText();
  assert.ok(publicDirectory.includes('Fictional Lantern Walk'));
  assert.ok(!publicDirectory.includes('123 Example Lane'));

  await guest.locator('#report-target').selectOption({index:1});
  await guest.locator('#report-reason').selectOption('privacy');
  await guest.locator('#report-details').fill('Please verify the permission for this listed property.');
  await guest.locator('#submit-report').click();
  await contains(guest,'report-state','Private report received');

  await reviewer.locator('#refresh-reports').click();
  await contains(reviewer,'report-queue','Please verify the permission');
  assert.ok(!(await reviewer.locator('#report-queue').innerText()).includes('123 Example Lane'));
  await reviewer.locator('#report-queue textarea').first().fill('Confirmed the report and property permission independently.');
  await reviewer.locator('#report-queue button[type=submit]').first().click();
  await contains(reviewer,'reports-state','No unresolved private listing reports');
  assert.equal(await reviewer.locator('#report-queue article').count(),0);

  await guest.locator('#refresh-directory').click();
  await guest.locator('#report-target').selectOption({index:1});
  await guest.locator('#report-reason').selectOption('unwanted');
  await guest.locator('#report-details').fill('Homeowner has asked to remove the public listing.');
  await guest.locator('#submit-report').click();
  await contains(guest,'report-state','Private report received');

  await host.locator('#refresh-mine').click();
  await host.locator('#my-list .danger-button').first().click();
  await contains(host,'my-list','Status: withdrawn');
  await guest.locator('#refresh-directory').click();
  await contains(guest,'pin-count','0 homes');
  assert.equal(await guest.locator('#submit-report').isDisabled(),true);
  await reviewer.locator('#refresh-reports').click();
  await contains(reviewer,'reports-state','No unresolved private listing reports');
  await reviewer.locator('#refresh-queue').click();
  await contains(reviewer,'review-queue','[deleted]');

  const manager=await tab('manager-A',768);
  await manager.locator('#pause-reason').fill('Unlisted households need to remain private');
  await manager.locator('#pause-form button[type=submit]').click();
  await contains(manager,'pause-result','paused');
  await guest.locator('#refresh-directory').click();
  await contains(guest,'directory-state','inactive');

  for(const [width,page] of [[1440,guest],[390,host],[390,stranger],[1440,reviewer],[768,manager]]){
    const metrics=await page.evaluate(()=>({width:window.innerWidth,document:document.documentElement.scrollWidth}));
    assert.ok(metrics.document<=metrics.width+2,'horizontal overflow at '+width+': '+metrics.document);
  }
  for(const width of [320,390,768,1440]){
    const page=await tab(null,width);
    const m=await page.evaluate(()=>({width:window.innerWidth,document:document.documentElement.scrollWidth}));
    assert.ok(m.document<=m.width+2,'overflow at '+width);
    await page.screenshot({path:join(screenshots,'porchlight-v004-'+width+'.png'),fullPage:true});
  }
  assert.deepEqual(errors,[],'Uncaught browser JavaScript errors');
  console.log('PASS: synthetic full workflow, report resolution, withdrawal, pause and 320/390/768/1440 browser review');
  await Promise.all(contexts.map(context=>context.close()));
}finally{
  if(browser)await browser.close();
  child.kill('SIGTERM');
}
