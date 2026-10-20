import test from 'node:test';
import assert from 'node:assert/strict';
import {isAnevumHostedRelease} from '../web/src/lib/project-hosting.ts';
const id='alpha_5764a892052647b6953b4cf6a9053c0f';
const href='https://anevum.com/play/5764a892-0526-47b6-953b-4cf6a9053c0f';
test('only the matching native release is described as ANEVUM hosted',()=>{
 assert.equal(isAnevumHostedRelease(id,new URL(href)),true);
 assert.equal(isAnevumHostedRelease(id,null),false);
 for(const value of [href.replace('https:','http:'),href.replace('anevum.com','anevum.com.example.invalid'),href.replace('/play/','/projects/'),href+'?redirect=external',href+'#external',href.replace('https://','https://user:password@'),href.replace('5764a892','5764a893')])
  assert.equal(isAnevumHostedRelease(id,new URL(value)),false,value);
 assert.equal(isAnevumHostedRelease('ordinary-project',new URL(href)),false);
});
