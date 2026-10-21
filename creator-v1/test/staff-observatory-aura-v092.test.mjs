import test from 'node:test';
import assert from 'node:assert/strict';
import {Script,runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
const server=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8');
const [PAGE,STYLES,CLIENT]=['PAGE','STYLES','CLIENT'].map(name=>JSON.parse(server.match(new RegExp('const '+name+' = ("(?:\\\\.|[^"\\\\])*");'))[1]));

const catalogText=CLIENT.match(/const AURA_CATALOG = Object\.freeze\((\[[^\n]+\])\);/);
const catalog=catalogText?JSON.parse(catalogText[1]):[];

test('owner UI compiles and exposes the six persistent, nonprivileged aura identifiers',()=>{
 assert.doesNotThrow(()=>new Script(CLIENT));
 assert.deepEqual(catalog.map(a=>a.id),['none','aurora','eclipse','ember','nebula','transcosmic']);
 assert.deepEqual(catalog.map(a=>a.discipline),['Open Signal','Discovery','Inquiry','Creation','Imagination','Continuance']);
 for(const aura of catalog)for(const property of ['name','meaning','motto','appearance'])
  assert.ok(typeof aura[property]==='string'&&aura[property].length>=4,aura.id+'.'+property);
 assert.match(CLIENT,/Cosmetic only: never grants clearance, XP, REP or awards/);
 assert.match(CLIENT,/UNSAVED PREVIEW/);
 assert.match(CLIENT,/AURA_CATALOG\.some/);
 assert.match(server,/const AURAS = new Set\(\['none', 'aurora', 'eclipse', 'ember', 'nebula', 'transcosmic'\]\)/);
 assert.match(server,/if \(staff\.role !== 'owner'\) return error\(403, 'Owner clearance required'\)/);
 assert.match(server,/staff_access_grants/);
});

test('IREN Observatory supports small screens, semantic status and reduced motion',()=>{
 assert.match(PAGE,/<html lang="en"/);
 assert.match(PAGE,/viewport-fit=cover/);
 assert.match(PAGE,/id="memberRows"/);
 assert.match(PAGE,/Auras describe personal creative affinities/);
 assert.match(STYLES,/@media\(max-width:720px\)/);
 assert.match(STYLES,/@media\(max-width:380px\)/);
 assert.match(STYLES,/table-wrapper tbody tr\{display:grid/);
 assert.match(STYLES,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(STYLES,/@media\(forced-colors:active\)/);
 assert.match(CLIENT,/role="status" aria-live="polite"/);
});

function fixture(role='owner'){
 const dom=new Map(),listeners={};
 let savedAura='aurora',revision=2;
 const posts=[],confirmations=[],reads=[];
 const preview={dataset:{auraPreview:'member-1',aura:savedAura,dirty:'false'},innerHTML:''};
 const save={dataset:{action:'aura',member:'member-1'},disabled:true,textContent:'Saved'};
 const select={dataset:{auraMember:'member-1'},value:savedAura};
 const get=id=>{
  if(!dom.has(id))dom.set(id,{innerHTML:'',textContent:'',disabled:false,hidden:false,style:{},dataset:{},
   scrollTop:0,querySelectorAll:()=>[],addEventListener(kind,fn){listeners[id+':'+kind]=fn}});
  return dom.get(id);
 };
 const query=selector=>{
  if(selector==='[data-aura-preview]')return [preview];
  if(selector==='button[data-action="aura"]')return [save];
  if(selector==='select[data-aura-member]')return [select];
  return [];
 };
 const document={
  getElementById:get,querySelectorAll:query,addEventListener(kind,fn){listeners[kind]=fn}
 };
 const member=()=>({
  id:'member-1',role:'member',name:'Explorer',displayName:'Explorer',
  handle:'explorer',email:'explorer@example.test',createdAt:1760000000,
  lastSessionUpdate:1760000000,sessionCount:1,testXp:0,testEvents:0,
  recognitions:'No recorded grants',aura:savedAura,auraRevision:revision
 });
 async function fetch(url,options){
  const isPost=options?.method==='POST';
  if(isPost){
   posts.push({url,payload:JSON.parse(options.body)});
   savedAura=JSON.parse(options.body).aura;revision++;
   return {status:200,ok:true,headers:{get:()=> 'application/json'},json:async()=>({ok:true,aura:savedAura})};
  }
  reads.push(url);
  const resource=url.split('/api/')[1]||'';
  let payload={};
  if(resource==='overview')payload={role,counts:{},signups:[],checkedAt:1760000000};
  else if(resource.startsWith('members'))payload={members:[member()],page:0,total:1,pageSize:50};
  else if(resource==='rewards')payload={auras:[{aura:savedAura,members:1}],awards:[]};
  else if(resource==='audit')payload={entries:[]};
  else throw new Error('Unexpected GET '+url);
  return {status:200,ok:true,headers:{get:()=> 'application/json'},json:async()=>payload};
 }
 const window={confirm:(message)=>{confirmations.push(message);return true;}};
 runInNewContext(CLIENT,{document,fetch,window,setTimeout,clearTimeout},{timeout:2500});
 const settle=async()=>{for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));};
 const change=id=>{
  select.value=id;
  listeners.change({target:{closest:()=>select}});
 };
 const apply=()=>{listeners.click({target:{closest:()=>save}});};
 return {dom,preview,save,select,reads,posts,confirmations,settle,change,apply};
}

test('owner sees saved cosmetics, previews changes without writing, then explicitly confirms one audited request',async()=>{
 const app=fixture();
 await app.settle();
 assert.match(app.dom.get('memberRows').innerHTML,/Aurora · Discovery/);
 assert.match(app.dom.get('memberRows').innerHTML,/SAVED APPEARANCE/);
 assert.equal(app.posts.length,0);
 app.change('nebula');
 assert.equal(app.preview.dataset.aura,'nebula');
 assert.equal(app.preview.dataset.dirty,'true');
 assert.match(app.preview.innerHTML,/Nebula · Imagination/);
 assert.match(app.preview.innerHTML,/UNSAVED PREVIEW/);
 assert.equal(app.save.disabled,false);
 assert.equal(app.posts.length,0,'preview must be read-only');
 app.apply();
 await app.settle();
 assert.equal(app.posts.length,1);
 assert.equal(app.posts[0].url,'/staff/observatory/api/aura');
 assert.deepEqual(app.posts[0].payload,{memberId:'member-1',aura:'nebula',revision:2});
 assert.match(app.confirmations[0],/Staff access, XP, reputation and awards stay unchanged/);
 assert.match(app.dom.get('memberRows').innerHTML,/Nebula · Imagination/);
 assert.match(app.dom.get('memberRows').innerHTML,/SAVED APPEARANCE/);
});

test('reviewer cannot inspect or change member cosmetics through UI',async()=>{
 const app=fixture('reviewer');
 await app.settle();
 assert.equal(app.reads.some(u=>u.includes('/members')),false);
 assert.equal(app.reads.some(u=>u.includes('/rewards')),false);
 app.change('ember');app.apply();
 await app.settle();
 assert.equal(app.posts.length,0);
 assert.equal(app.preview.dataset.aura,'aurora');
});

test('invalid aura is ignored and no request is sent',async()=>{
 const app=fixture();
 await app.settle();
 app.change('founder');
 assert.equal(app.preview.dataset.aura,'aurora');
 app.apply();
 await app.settle();
 assert.equal(app.posts.length,0);
});
