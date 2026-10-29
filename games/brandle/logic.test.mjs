import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateGuess,dailyAnswer,isValidWord,keyboardHints,randomAnswer,validateSavedGame,safeParse,shareGrid} from './logic.mjs';
test('exact green and repeated letters, counts consumed',()=>{
 assert.deepEqual(evaluateGuess('APPLE','ALLEY'),['correct','present','absent','present','absent']);
 assert.deepEqual(evaluateGuess('BANAL','AAAAA'),['absent','correct','absent','correct','absent']);
 assert.deepEqual(evaluateGuess('EERIE','EERIE'),Array(5).fill('correct'));
 assert.deepEqual(evaluateGuess('MAMMA','AMAZE'),['present','present','correct','absent','absent']);
});
test('daily answer deterministic across refresh and timezone',()=>{
 const a=new Date('2026-10-29T01:00:00.000Z'),b=new Date('2026-10-29T23:59:59.000Z');
 assert.equal(dailyAnswer(a),dailyAnswer(b)); assert.match(dailyAnswer(a),/^[A-Z]{5}$/);
});
test('dictionary validation is exact and case consistent',()=>{
 const d=new Set(['apple','crane']); assert.equal(isValidWord('APPLE',d),true);assert.equal(isValidWord('APPLE!',d),false);assert.equal(isValidWord('ABCDE',d),false);
});
test('keyboard keeps highest feedback',()=>{
 const h=keyboardHints(['ALLEY','APPLE'],'APPLE'); assert.equal(h.A,'correct'); assert.equal(h.P,'correct');assert.equal(h.L,'correct');
});
test('wild answer respects recent history',()=>{
 assert.equal(randomAnswer(['apple','cider'],['apple'],()=>0),'CIDER');
});
test('invalid persistence resets and winning game reconciles',()=>{
 const d=new Set(['apple','crane']);
 assert.equal(validateSavedGame({guesses:['WRONG'],input:''},'APPLE',d),null);
 assert.deepEqual(validateSavedGame({guesses:['APPLE'],input:'A'},'APPLE',d),{guesses:['APPLE'],input:'',finished:true,won:true});
 assert.deepEqual(safeParse('{oops}',{}),{});
});
test('share has rows without leaking answer',()=>{
 const text=shareGrid(['CRANE'],'APPLE',1);assert.match(text,/BRANDLE #1 X\/6/);assert.ok(!text.includes('APPLE'));
});
