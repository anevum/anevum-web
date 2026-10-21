import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audit,cloudflareRead} from '../ops/staff-release-live-inventory-v099.mjs';
test('audit emits booleans only, with no internal configuration or identities',async()=>{
 const b=JSON.parse(readFileSync(new URL('../operations/v095-inactive-baseline-20261020.json',import.meta.url),'utf8'));
 const result=await audit(async path=>{
  if(path.endsWith('/workers/routes'))return b.routes;
  if(path.endsWith('/deployments'))return {deployments:[{id:'never-print-deployment',versions:[{version_id:b.live_version.id,percentage:100}]}]};
  if(path.endsWith('/settings'))return {bindings:[{type:'service',name:'APEX_AUTH',service:'never-print-service'},{type:'d1',name:'MEMBER_DB',id:b.database_ids.MEMBER_DB}]};
  if(path.endsWith('/access/apps'))throw Error('never-print-sensitive-error');
  return {id:path.split('/').at(-1),resources:{bindings:[{type:'plain_text',name:'QA_ROUTING_TOKEN',text:'never-print-secret'}]}};
 });
 assert.ok(Object.values(result).every(v=>typeof v==='boolean'));
 assert.doesNotMatch(JSON.stringify(result),/never-print|@|anevum\.com|bindings|version_id/);
 assert.equal(result.accessInventoryComplete,false);
 assert.equal(result.staffUiAccessDestinationAbsent,false,'incomplete Access reads cannot prove removal');
});
test('audit rejects unexpected scopes before any network request',async()=>{
 await assert.rejects(()=>cloudflareRead('/accounts/other/workers/scripts'),/Unexpected scope/);
 await assert.rejects(()=>cloudflareRead('/zones/other/access/apps'),/Unexpected scope/);
});
