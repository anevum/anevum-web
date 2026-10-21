import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const member=readFileSync(new URL('../web/src/components/MemberSpaceDashboard.tsx',import.meta.url),'utf8');
const project=readFileSync(new URL('../web/src/pages/CanonicalStudioPage.tsx',import.meta.url),'utf8');
const native=readFileSync(new URL('../web/src/pages/NativeCreatorStudio.tsx',import.meta.url),'utf8');

test('private My Space has independent wall and space requests with no coupled failure',()=>{
 assert.doesNotThrow(()=>parse(member,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(member,/async function reloadSpace\(\)/);
 assert.match(member,/async function reloadWall\(\)/);
 const spaceFn=member.split('async function reloadSpace()')[1].split('async function reloadWall()')[0];
 const wallFn=member.split('async function reloadWall()')[1].split('async function refresh()')[0];
 assert.match(spaceFn,/await canonicalSpace\(\)/);
 assert.doesNotMatch(spaceFn,/canonicalWall\(/);
 assert.match(wallFn,/await canonicalWall\(\)/);
 assert.doesNotMatch(wallFn,/canonicalSpace\(/);
 assert.doesNotMatch(member,/Promise\.all\(\[canonicalSpace\(\),canonicalWall\(\)\]\)/);
 assert.match(member,/Promise\.all\(\[reloadSpace\(\),reloadWall\(\)\]\)/);
});
test('account replacement, stale fetch and individual retry never expose old identities',()=>{
 assert.match(member,/MemberSpaceDashboardView key=\{profile\.handle\+':'\+profile\.revision\}/);
 assert.match(member,/spaceRequestVersion=useRef\(0\),wallRequestVersion=useRef\(0\)/);
 assert.match(member,/version!==spaceRequestVersion\.current/);
 assert.match(member,/version!==wallRequestVersion\.current/);
 assert.match(member,/spaceRequestVersion\.current\+\+;wallRequestVersion\.current\+\+;/);
 assert.match(member,/onClick=\{\(\)=>void reloadSpace\(\)\}>RETRY SPACE/);
 assert.match(member,/onClick=\{\(\)=>void reloadWall\(\)\}>RETRY WALL/);
});
test('unavailable wall never masquerades as an empty member history or hides founder access',()=>{
 assert.match(member,/tab==='wall'&&\(wallError\?/);
 assert.match(member,/!wallReady\?<p role="status">Loading your verified wall/);
 assert.match(member,/wallError\?'Wall temporarily unavailable'/);
 assert.match(member,/wallLoading&&<p role="status">Refreshing your wall/);
 assert.match(member,/<VerifiedStaffShortcut location="profile"\/>/);
 assert.match(member,/<MemberPresenceStatus aura=\{space\.aura\} role=\{space\.role\}/);
 assert.doesNotMatch(member,/role\s*[:=]\s*['"]founder['"]/);
});
test('Creator Studio navigation obtains the native signed-in capability independently',()=>{
 assert.doesNotThrow(()=>parse(project,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(project,/<NativeStudioNavigation\/>/);
 assert.match(native,/readNativeSession\(identity\.id!,signal\)/);
 assert.match(native,/capabilities\|\|own\.data/);
 assert.match(native,/permissions\?\.canUpload/);
 assert.match(native,/permissions\?\.canReview/);
});
