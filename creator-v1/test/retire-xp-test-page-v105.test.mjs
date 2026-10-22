import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../web/src/App.tsx',import.meta.url),'utf8');
test('retired XP calibration is not exposed as a production route',()=>{
 assert.doesNotMatch(src,/import \{TheButtonPage\}/);
 assert.doesNotMatch(src,/<Route path="thebutton" element=\{<TheButtonPage\/>\}/);
 assert.match(src,/<Route path="thebutton" element=\{<Navigate to="\/levels" replace\/>\}/);
 assert.match(src,/<Route path="levels" element=\{<LevelsPage\/>\}/);
 assert.match(src,/AnevumNotifications/);
});
