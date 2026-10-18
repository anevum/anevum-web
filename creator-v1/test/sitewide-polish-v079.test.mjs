import test from 'node:test';
import assert from 'node:assert/strict';
import {safeReturnPath,projectDetailPath} from '../web/src/lib/navigation.ts';

test('Boards project return keeps only supported public filter state',()=>{
 assert.equal(safeReturnPath('/boards?view=firstLooks&category=tools'),'/boards?view=firstLooks&category=tools');
 assert.equal(safeReturnPath('/boards?view=private&category=secret&token=private'),'/boards');
 assert.equal(safeReturnPath('//other.example/boards'),'/discover');
 assert.equal(safeReturnPath('/boards#private'),'/discover');
 assert.equal(safeReturnPath('/boards?view=publishing&category=automation'),'/boards?view=publishing&category=automation');
 const link=new URL(projectDetailPath('alpha_synthetic','/boards?category=games'),'https://anevum.invalid');
 assert.equal(link.pathname,'/projects/alpha_synthetic');
 assert.equal(link.searchParams.get('from'),'/boards?category=games');
});
