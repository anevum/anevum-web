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

import {isHostedAlphaRelease} from '../web/src/lib/hosted-release.ts';
test('native release passport distinguishes exact first-party play links from external demos',()=>{
 const project={id:'alpha_123456781234123412341234567890ab',demoUrl:'https://anevum.com/play/12345678-1234-1234-1234-1234567890ab'};
 assert.equal(isHostedAlphaRelease(project,'https://anevum.com'),true);
 for(const demoUrl of [null,'https://external.example/play/12345678-1234-1234-1234-1234567890ab',project.demoUrl+'?token=private',project.demoUrl+'#play',project.demoUrl.replace('7890ab','7890ac')])
  assert.equal(isHostedAlphaRelease({...project,demoUrl},'https://anevum.com'),false);
 assert.equal(isHostedAlphaRelease({...project,id:'regular-project'},'https://anevum.com'),false);
});
