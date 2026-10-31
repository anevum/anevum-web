/**
 * Source-only Chromium viewport capture for the protected Observatory.
 * Uses localhost fixture responses and synthetic members; no auth, D1, or writes.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PAGE,STYLES,CLIENT} from '../src/ui.mjs';

const browser=process.argv[2],out=process.argv[3];
if(!browser||!out)throw Error('Usage: node browser-aura-preview-v002.mjs /path/to/chrome /output/directory');
mkdirSync(out,{recursive:true});
const inject='<script>window.addEventListener("load",function(){'+
 'const probe=setInterval(function(){'+
 'const tab=document.querySelector("button[data-tab=members]");'+
 'if(!tab||tab.hidden)return;clearInterval(probe);tab.click();'+
 'setTimeout(function(){'+
 'const select=document.querySelector("select[data-aura-member]");if(!select)return;'+
 'select.value="nebula";select.dispatchEvent(new Event("change",{bubbles:true}));'+
 'const panel=document.querySelector("[data-aura-preview]");'+
 'if(panel){panel.dataset.copyWidth=Math.round(panel.querySelector(".aura-copy").getBoundingClientRect().width);}'+
 'if(window.innerWidth<=720)select.scrollIntoView({block:"center",behavior:"instant"});'+
 '},280);},90);});</script>';
const html=PAGE.replace('<body>','<body><div style="position:fixed;bottom:3px;left:3px;z-index:9999;pointer-events:none;border:1px solid #d9bb90;background:#07111fee;color:#f4dfbb;font:700 9px/1.3 monospace;padding:5px">SYNTHETIC FIXTURE - NOT PRODUCTION</div>')
 .replace('</body>',inject+'</body>');
const fake={
 overview:{role:'owner',checkedAt:1760896800,counts:{members:12,verified:11,new7d:3,sessionMembers:10,xpTesters:1,xpEvents:4,publishedProjects:2,pendingTotal:1,threads:3,replies:8,wallPosts:6,projectVotes:2,projectComments:3,projectSaves:4,recognitions:2,pendingProjects:1,pendingForum:0,projectReports:0,forumReports:0},signups:[]},
 members:{members:[{id:'fixture-member',name:'Astral Explorer',displayName:'Astral Explorer',handle:'astral_explorer',email:'fixture@example.invalid',role:'member',aura:'aurora',auraRevision:1,createdAt:1760000000,lastSessionUpdate:1760500000,sessionCount:1,testXp:0,testEvents:0,recognitions:'First Orbit'}],total:1,page:0,pageSize:50},
 rewards:{awards:[],auras:[{aura:'aurora',members:1}]},
 audit:{entries:[]}
};
const root='/staff/observatory/';
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 let data,type='text/html;charset=utf-8',status=200;
 if(pathname===root)data=html;
 else if(pathname===root+'styles.css'){data=STYLES;type='text/css;charset=utf-8';}
 else if(pathname===root+'app.js'){data=CLIENT;type='application/javascript;charset=utf-8';}
 else if(pathname===root+'api/overview'){data=JSON.stringify(fake.overview);type='application/json';}
 else if(pathname===root+'api/members'){data=JSON.stringify(fake.members);type='application/json';}
 else if(pathname===root+'api/rewards'){data=JSON.stringify(fake.rewards);type='application/json';}
 else if(pathname===root+'api/audit'){data=JSON.stringify(fake.audit);type='application/json';}
 else {data='not found';status=404;}
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
async function capture(width,height){
 const screenshot=join(out,'staff-aura-'+width+'.png');
 const url='http://127.0.0.1:'+port+root;
 const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--no-first-run','--hide-scrollbars',
  '--force-device-scale-factor=1','--window-size='+width+','+height,
  '--virtual-time-budget=4600','--screenshot='+screenshot,'--dump-dom',url];
 const result=await new Promise((resolve,reject)=>{
  const proc=spawn(browser,args,{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  proc.stdout.on('data',c=>{stdout+=c.toString();if(stdout.length>6000000)proc.kill();});
  proc.stderr.on('data',c=>{stderr+=c.toString();});
  const timeout=setTimeout(()=>{proc.kill();reject(Error('Chrome viewport capture timeout'));},50000);
  proc.once('error',err=>{clearTimeout(timeout);reject(err);});
  proc.once('close',code=>{clearTimeout(timeout);code===0?resolve({stdout,stderr}):reject(Error('Chrome exit '+code+': '+stderr.slice(-1500)));});
 });
 assert.match(result.stdout,/data-aura-preview="fixture-member"/,'member at '+width);
 assert.match(result.stdout,/data-aura="nebula"/,'aura selection at '+width);
 assert.match(result.stdout,/UNSAVED PREVIEW/,'pending status at '+width);
 const copyWidth=result.stdout.match(/data-copy-width="([0-9]+)"/);
 assert.ok(copyWidth&&Number(copyWidth[1])>=140,'aura explanation readable at '+width+'px, got '+(copyWidth?.[1]||'missing'));
 assert.match(result.stdout,/SYNTHETIC FIXTURE/,'fixture marker at '+width);
 assert.ok(statSync(screenshot).size>15000,'screenshot at '+width);
 writeFileSync(join(out,'staff-aura-'+width+'.dom.html'),result.stdout);
 console.log('PASS',width,height,screenshot);
}
try{for(const [w,h] of [[320,740],[390,844],[1440,900]])await capture(w,h);}
finally{server.close();}
