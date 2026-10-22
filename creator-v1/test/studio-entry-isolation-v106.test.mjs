import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const entry=readFileSync(new URL('../web/src/lib/studio-entry-read.ts',import.meta.url),'utf8');
const studio=readFileSync(new URL('../web/src/pages/CanonicalStudioPage.tsx',import.meta.url),'utf8');

test('entry helper and Studio page parse as TS and JSX',()=>{
 assert.doesNotThrow(()=>parse(entry,{sourceType:'module',plugins:['typescript']}));
 assert.doesNotThrow(()=>parse(studio,{sourceType:'module',plugins:['typescript','jsx']}));
});
test('list entry authenticates without a duplicate Studio inventory request',()=>{
 assert.match(entry,/deps\.profile\(signal\),deps\.health\(signal\)/);
 assert.match(entry,/if\(mode==='list'\)return \{phase:'ready'/);
 assert.match(entry,/profile\.memberId!==memberId/);
 assert.match(entry,/!profile\.profile\?\.handle/);
 assert.match(studio,/resolveStudioEntry\(id,mode,signal,/);
 assert.match(studio,/profile:canonicalMe,health:studioHealth,list:studioList/);
 const section=studio.split('function SessionStudio(')[1].split('function StudioLibrary(')[0];
 assert.doesNotMatch(section,/studioList\(signal\)/);
});
test('editor/reviewer continue server capability verification and list retries independently',()=>{
 assert.match(entry,/if\(!health\.studioReady\)/);
 assert.match(entry,/const capabilities=await deps\.list\(signal\)/);
 assert.match(entry,/canReview:capabilities\.canReview===true/);
 assert.match(studio,/RETRY STUDIO ACCESS/);
 assert.match(studio,/RETRY PROJECTS/);
 assert.match(studio,/readWithDeadline\(signal=>studioList\(signal\),ac\.signal\)/);
 assert.match(studio,/onCapabilities\(r\)/);
 assert.match(studio,/setCanReview\(capabilities\.canReview===true\)/);
 assert.match(studio,/onCapabilities\(\{canReview:false,uploadsReady:false\}\)/);
 assert.match(studio,/return\(\)=>\{live=false;controller\.abort\(\);\}/);
 assert.match(studio,/SessionStudio key=\{id\+':\'\+mode/);
});
