/**
 * V142 read-only production visual/link census. Uses a clean anonymous browser,
 * screenshots every registered static route at desktop and mobile, opens the
 * real site menu, and reports alias/unknown/fragment links WITHOUT clicking
 * protected actions or mutating any user/account state.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const origin=process.env.ANEVUM_AUDIT_ORIGIN||'https://anevum.com';
const output=resolve(process.env.ANEVUM_AUDIT_OUTPUT||'evidence/v142-sitewide');
mkdirSync(join(output,'screens'),{recursive:true});
const publicRoutes=[
  '/','/severance','/about','/discover','/start','/guide',
  '/creators','/community','/boards','/status','/levels',
  '/recognition','/auras','/join','/support',
  '/support/transparency','/support/collection'
];
const gatedRoutes=[
  '/member','/studio','/studio/alpha','/studio/workbench','/studio/packages',
  '/studio/packages/new','/studio/packages/review','/studio/records',
  '/studio/new','/studio/review','/saved','/library','/community/review',
  '/community/write'
];
const aliasRoutes=['/workspace','/account','/account/edit','/account/studio',
  '/create','/create/new','/sign-in','/member/setup','/thebutton','/atlas/orbit'];
const routes=[...publicRoutes,...gatedRoutes,...aliasRoutes];
const widths=[1440,390];
const registered=new Set([...routes,'/staff']);
const retired=/^\/(?:atlas(?:\/|$)|workspace(?:\/|$)|account(?:\/|$)|create(?:\/|$)|sign-in(?:\/|$)|thebutton(?:\/|$)|member\/setup(?:\/|$))/;
const optionalPublic=/^\/(?:projects\/[A-Za-z0-9_-]+|creators\/[A-Za-z0-9_-]+|community\/(?:posts|threads)\/[A-Za-z0-9_-]+|@[A-Za-z0-9_]+|projects\/package\/[A-Za-z0-9_-]+|studio\/packages\/[A-Za-z0-9_-]+|studio\/[A-Za-z0-9_-]+)$/;
const allowedInfrastructure=/^\/(?:staff(?:\/|$)|api(?:\/|$)|upload(?:\/|$)|assets(?:\/|$)|_next(?:\/|$)|evolution(?:\/|$))/;
const report={session:'ANEVUM.WEB.AUDIT.2026-10-27.001.SITEWIDE-VISUAL-LINKS',
  origin,startedAt:new Date().toISOString(),pages:[],issues:[],links:[],screenshots:[],dynamicPages:[],summary:{}};
const failures=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
function slug(path){return path==='/'?'home':path.slice(1).replaceAll('/','--');}
function classify(raw,pathname,ids){
 if(!raw||raw==='#')return {kind:'placeholder',destination:raw};
 if(/^javascript:/i.test(raw))return {kind:'unsafe-js',destination:raw};
 if(/^(?:mailto:|tel:)/i.test(raw))return {kind:'protocol',destination:raw};
 if(raw.startsWith('#')){
  const id=decodeURIComponent(raw.slice(1));
  return {kind:ids.includes(id)?'fragment-ok':'fragment-missing',destination:pathname+raw};
 }
 let url;try{url=new URL(raw,origin+pathname)}catch{return {kind:'invalid',destination:raw}}
 if(url.origin!==origin)return {kind:'external',destination:url.href};
 if(url.pathname==='/')return {kind:'valid',destination:url.pathname+url.search};
 if(retired.test(url.pathname))return {kind:'obsolete-alias',destination:url.pathname+url.search};
 if(registered.has(url.pathname)||optionalPublic.test(url.pathname)||allowedInfrastructure.test(url.pathname)){
  return {kind:'valid',destination:url.pathname+url.search};
 }
 return {kind:'unknown-internal',destination:url.pathname+url.search};
}
let screenshotCount=0;
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},
   deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  for(const pathname of routes){
   const page=await context.newPage();
   page.setDefaultTimeout(12000);
   let errors=[],badRequests=[];
   page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,300)));
   page.on('requestfailed',req=>{
     if(!/ERR_ABORTED|net::ERR_ABORTED/i.test(req.failure()?.errorText||''))badRequests.push((req.method()+' '+new URL(req.url()).pathname+' '+(req.failure()?.errorText||'' )).slice(0,240));
   });
   let status=null,finalPath='',metrics={},links=[],error=null;
   try{
    const response=await page.goto(origin+pathname,{waitUntil:'domcontentloaded',timeout:25000});
    status=response?.status()??null;
    await page.locator('#main').first().waitFor({state:'attached',timeout:12000}).catch(()=>{});
    await page.waitForTimeout(450);
    finalPath=new URL(page.url()).pathname;
    const capture=await page.evaluate(()=>{
     const a=Array.from(document.querySelectorAll('a[href]')).map(el=>{
      const r=el.getBoundingClientRect(),style=getComputedStyle(el);
      return {href:el.getAttribute('href'),text:(el.textContent||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,115),
        visible:r.width>0&&r.height>0&&style.visibility!=='hidden'&&style.display!=='none',
        target:el.getAttribute('target')||null};
     });
     const main=document.querySelector('#main');
     const mainRect=main?.getBoundingClientRect();
     const nonNavBrokenImages=Array.from(document.querySelectorAll('#main img'))
      .filter(el=>el.complete&&el.naturalWidth===0).map(el=>el.getAttribute('src')).slice(0,12);
     return {title:document.title,h1:Array.from(document.querySelectorAll('h1')).map(x=>x.textContent?.trim().slice(0,100)),
       width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
       scrollHeight:document.documentElement.scrollHeight,
       mainPresent:!!main,mainHeight:mainRect?.height||0,
       links:a,ids:Array.from(document.querySelectorAll('[id]')).map(x=>x.id),
       brokenImages:nonNavBrokenImages};
    });
    const {links:a,ids,...rest}=capture;metrics=rest;
    links=a.filter(x=>x.visible).map(x=>({...x,...classify(x.href,finalPath,ids)}));
    for(const link of links){
      if(['obsolete-alias','unknown-internal','fragment-missing','placeholder','unsafe-js','invalid'].includes(link.kind)){
       report.issues.push({page:pathname,width,...link});
      }
    }
    if(metrics.scrollWidth>width+3)report.issues.push({page:pathname,width,kind:'horizontal-overflow',actual:metrics.scrollWidth});
    if(!metrics.mainPresent||metrics.mainHeight<80)report.issues.push({page:pathname,width,kind:'missing-main-or-tiny',height:metrics.mainHeight});
    if(metrics.brokenImages.length)report.issues.push({page:pathname,width,kind:'broken-images',images:metrics.brokenImages});
    const filename=width+'--'+slug(pathname)+'.png';
    await page.screenshot({path:join(output,'screens',filename),animations:'disabled',timeout:15000});
    report.screenshots.push(filename);screenshotCount++;
   }catch(e){error=String(e?.message||e).slice(0,600);failures.push({width,pathname,error});}
   const row={width,path:pathname,status,finalPath,errors,badRequests:badRequests.slice(0,8),metrics,linkCount:links.length,error};
   report.pages.push(row);
   report.links.push(...links.map(x=>({page:pathname,width,...x})));
   if(status&&status>=400)report.issues.push({page:pathname,width,kind:'http-error',status});
   if(errors.length)report.issues.push({page:pathname,width,kind:'runtime-error',errors});
   if(error)report.issues.push({page:pathname,width,kind:'screenshot-error',error});
   await page.close();
   console.log('AUDITED',width,pathname,status,finalPath,'links',links.length,'issues',report.issues.filter(x=>x.page===pathname&&x.width===width).length,error?.slice(0,80)||'');
  }
  // Open the real site drawer on both viewport classes, which ordinary page
  // screenshots intentionally keep shut. Review and audit its actual anchors.
  const page=await context.newPage();
  try{
   await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});
   const button=page.getByRole('button',{name:'Open site navigation',exact:true});
   await button.waitFor({timeout:12000});
   await button.click();
   await page.waitForTimeout(300);
   const a=await page.evaluate(()=>Array.from(document.querySelectorAll('dialog[open] a[href]')).map(el=>({
    href:el.getAttribute('href'),text:(el.textContent||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,115)
   })));
   for(const link of a){const c=classify(link.href,'/',[]);report.links.push({page:'MENU',width,...link,...c,visible:true});
    if(['obsolete-alias','unknown-internal','placeholder','unsafe-js','invalid'].includes(c.kind))report.issues.push({page:'MENU',width,...link,...c});
   }
   const filename=width+'--open-navigation.png';
   await page.screenshot({path:join(output,'screens',filename),animations:'disabled',timeout:15000});
   report.screenshots.push(filename);screenshotCount++;
   console.log('AUDITED MENU',width,'links',a.length);
  }catch(e){report.issues.push({page:'MENU',width,kind:'navigation-audit-error',error:String(e?.message||e).slice(0,400)})}
  await page.close();await context.close();
 }
}finally{await browser.close()}
report.completedAt=new Date().toISOString();
const kinds=Object.fromEntries([...new Set(report.issues.map(x=>x.kind))].sort().map(k=>[k,report.issues.filter(x=>x.kind===k).length]));
const uniqueLinks=new Map();
for(const x of report.links){const key=x.kind+'|'+x.destination+'|'+x.text;if(!uniqueLinks.has(key))uniqueLinks.set(key,{kind:x.kind,destination:x.destination,text:x.text,pages:[]});
 const a=uniqueLinks.get(key); if(!a.pages.includes(x.page))a.pages.push(x.page);}
report.summary={routeCount:routes.length,viewportCount:widths.length,
 screenshots:screenshotCount,failures:failures.length,issuesByKind:kinds,
 totalRenderedLinks:report.links.length,distinctLinks:uniqueLinks.size,
 obsolete:report.issues.filter(x=>x.kind==='obsolete-alias').length,
 unknown:report.issues.filter(x=>x.kind==='unknown-internal').length,
 missingFragments:report.issues.filter(x=>x.kind==='fragment-missing').length};
writeFileSync(join(output,'audit.json'),JSON.stringify(report,null,2)+'\n');
let md='# V142 ANEVUM Sitewide Visual and Link Audit\n\n';
md+='Source: current public site '+origin+'. All screenshots are anonymous, no account or form writes.\n\n';
md+='* '+JSON.stringify(report.summary)+'\n\n';
md+='## Distinct rendered links\n\n';
md+='| Kind | Destination | Label | Pages |\n|---|---|---|---|\n';
for(const x of [...uniqueLinks.values()].sort((a,b)=>a.kind.localeCompare(b.kind)||a.destination.localeCompare(b.destination)))md+='| '+[x.kind,x.destination,x.text,x.pages.join(', ')].map(v=>String(v||'').replaceAll('|','\\|').slice(0,180)).join(' | ')+' |\n';
md+='\n## Issues\n\n';
for(const x of report.issues)md+='- '+JSON.stringify(x)+'\n';
writeFileSync(join(output,'audit.md'),md);
console.log('V142 VISUAL LINK AUDIT SUMMARY',JSON.stringify(report.summary));
if(failures.length>10)process.exitCode=1;
