import test from 'node:test';
import assert from 'node:assert/strict';
import {integrateCadetsModules,CADETS_LAB_RELEASE} from './cadets-overlay.mjs';
const baseWorker=`import {LAB_CSS,LAB_JS,LAB_ICON_SVG,renderLabPage,renderBackstagePage,renderTranscosmicPage} from './terminal-ui.mjs';
import {CURRENCY_ASSETS} from './currency-snapshot.mjs';
const VERSION='2026-10-15.lab.v5-currency-sandbox';
const u='url.hostname!==HOST';
if(0){} else if(path==='/projects/the-fold/'||path==='/projects/the-fold/index.html'){}
const health={projects:4};`;
const fixture=()=>[{name:'worker.mjs',code:baseWorker},{name:'terminal-ui.mjs',code:'REVIEWED CONSOLE'}, {name:'currency-snapshot.mjs',code:'EXISTING CURRENCY ASSET'},...Array.from({length:9},(_,i)=>({name:'legacy-'+i+'.mjs',code:'LEGACY-'+i}))];
const options={snapshot:'CADETS SNAPSHOT'.repeat(5000),expectedTerminal:'REVIEWED CONSOLE',newTerminal:'FIVE PROJECT CONSOLE'};
test('overlay adds one module and only alters the entrypoint and launcher',()=>{
 const before=fixture(),after=integrateCadetsModules(before,options);
 assert.equal(after.length,before.length+1);
 assert.match(after.find(x=>x.name==='worker.mjs').code,/\/projects\/cadets/);
 assert.match(after.find(x=>x.name==='worker.mjs').code,/import \{CADETS_FILES\}/);
 assert.match(after.find(x=>x.name==='worker.mjs').code,/projects:5/);
 assert.match(after.find(x=>x.name==='worker.mjs').code,new RegExp(CADETS_LAB_RELEASE));
 assert.equal(after.find(x=>x.name==='terminal-ui.mjs').code,options.newTerminal);
 assert.equal(after.find(x=>x.name==='cadets-snapshot.mjs').code,options.snapshot);
 for(const item of before.filter(x=>!['worker.mjs','terminal-ui.mjs'].includes(x.name)))assert.equal(after.find(x=>x.name===item.name).code,item.code);
 assert.equal(before[0].code,baseWorker);
});
test('repeated, stale, and unexpected baseline deployments fail closed',()=>{
 const opts={...options,expectedTerminal:'ANOTHER'};
 assert.throws(()=>integrateCadetsModules(fixture(),opts),/differs/);
 const old=fixture();old[0]={...old[0],code:old[0].code.replace('2026-10-15','2026-10-13')};
 assert.throws(()=>integrateCadetsModules(old,options),/Unexpected live Lab/);
 const modified=fixture();modified.push({name:'cadets-snapshot.mjs',code:'x'});
 assert.throws(()=>integrateCadetsModules(modified,options),/already present/);
 const repeated=fixture();repeated.push({...repeated[0]});
 assert.throws(()=>integrateCadetsModules(repeated,options),/duplicated/);
});
