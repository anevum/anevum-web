import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const publicPage=read('web/src/pages/Phase1PublicMemberPage.tsx');
const home=read('web/src/home-navigation-v079.css');
const recovery=read('web/src/continuance-experience-v091.css');
const app=read('web/src/App.tsx');

test('V104 public member page parses and never couples wall failure to verified public identity',()=>{
  assert.doesNotThrow(()=>parse(publicPage,{sourceType:'module',plugins:['typescript','jsx']}));
  const core=publicPage.split('const resource=useResource')[1].split('const wallResource=useResource')[0];
  const wall=publicPage.split('const wallResource=useResource')[1].split('const data=resource.state')[0];
  assert.match(core,/canonicalPublic\(handle,signal\)/);
  assert.match(core,/spaceRequest<MemberSpace>\(base\+'\/space'/);
  assert.doesNotMatch(core,/\/wall|posts|WallEntry/);
  assert.match(wall,/base\+'\/wall'/);
  assert.doesNotMatch(wall,/canonicalPublic|\/space/);
  assert.doesNotMatch(publicPage,/Promise\.all\(\[spaceRequest<MemberSpace>[^\]]+wall/);
  assert.match(publicPage,/const data=resource\.state==='ready'\?resource\.data:null/);
  assert.match(publicPage,/const posts=wallResource\.state==='ready'\?wallResource\.data:null/);
  assert.match(publicPage,/posts!==null\?<MemberWall/);
  assert.match(publicPage,/wallResource\.state==='error'\?<div className="ms-public-wall-feedback"/);
  assert.match(publicPage,/Opening public wall…/);
  assert.match(publicPage,/setWallRetry\(value=>value\+1\)/);
});

test('V104 maintains private/missing status ambiguity while letting transient failures recover',()=>{
  assert.match(publicPage,/\[401,403,404\]\.includes/);
  assert.match(publicPage,/A PRIVATE WORLD\./);
  assert.match(publicPage,/This profile is not published, does not exist, or cannot be viewed right now/);
  assert.match(publicPage,/PUBLIC WORLD UNAVAILABLE/);
  assert.match(publicPage,/setProfileRetry\(value=>value\+1\)/);
  assert.match(publicPage,/<PublicMemberWorld key=\{memberHandle\}/);
  assert.match(publicPage,/\[handle,revalidation,profileRetry,wallRetry,resource\.state\]/);
  assert.doesNotMatch(publicPage,/localStorage|sessionStorage|Math\.random|memberCreate|memberSave|staffGrant/);
  assert.match(app,/path=":memberHandle" element=\{<CanonicalPublicHandle\/>\}/);
});

test('V104 is a narrowly scoped, readable mobile treatment with nondecorative recovery controls',()=>{
  assert.match(home,/V104 first-visit legibility repair/);
  assert.match(recovery,/V104 public profile recovery/);
  assert.match(home,/@media\(max-width:650px\)/);
  assert.match(home,/\.av79-home \.av79-gateway small/);
  assert.match(home,/\.av79-home \.av79-feature-status/);
  assert.match(recovery,/\.ms-public-wall-feedback button:focus-visible/);
  assert.match(recovery,/min-height:44px/);
  assert.match(recovery,/\.ms-public \.ms-public-bio/);
  assert.doesNotMatch(home+recovery,/image-rendering:\s*pixelated|url\(https?:/);
});
