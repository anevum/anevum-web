import test from 'node:test';
import assert from 'node:assert/strict';
import {patchSource,parseSource,plannedBindings} from '../ops/v100-entry-inactive.mjs';
const OLD='3ba8602c-6616-49a4-af29-1efe60ad164a';
const code='var QA_SOURCE = "d5af32fd8f04b05e0381f7ac12c59d06c0e836a2";\nvar QA_CANDIDATE = "'+OLD+'";\nTest V095/V096 on this device';
test('patch changes exactly three reviewed literals',()=>{const next=patchSource(code);assert.ok(next.includes('8ed503b6-5df6-42a5-a536-63ccf928d25d'));assert.ok(next.includes('28f163a0015631b1d8eb58922c03596ae8febd22'));assert.ok(next.includes('Test integrated V100'));assert.equal(next.split('var QA_').length,3)});
test('mismatched source cannot be patched',()=>{assert.throws(()=>patchSource(code.replace(OLD,'corrupt')));assert.throws(()=>patchSource(code+code))});
test('strict multipart requires one exact module',()=>{const boundary='--exact-boundary';const value=boundary+'\r\nContent-Disposition: form-data; name="entry.mjs"\r\n\r\n'+code+'\r\n'+boundary+'--\r\n';assert.equal(parseSource(value),code);assert.throws(()=>parseSource('plain text'));assert.throws(()=>parseSource(value.replace('entry.mjs','wrong.mjs')))});
test('no secret value is transported as a literal',()=>{const result=plannedBindings([{name:'QA_ROUTING_TOKEN',type:'secret_text'},{name:'ANEVUM_ACCESS_AUD',type:'plain_text'},{name:'QA_CANDIDATE',type:'plain_text',text:OLD}]);assert.deepEqual(result,[{name:'QA_ROUTING_TOKEN',type:'inherit'},{name:'ANEVUM_ACCESS_AUD',type:'inherit'},{name:'QA_CANDIDATE',type:'plain_text',text:'8ed503b6-5df6-42a5-a536-63ccf928d25d'}])});
