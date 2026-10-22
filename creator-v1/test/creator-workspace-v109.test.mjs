import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';

const page=readFileSync('creator-v1/web/src/pages/CreatorStudioWorkspaceV109.tsx','utf8');
const style=readFileSync('creator-v1/web/src/pages/creator-workspace-v109.css','utf8');
const app=readFileSync('creator-v1/web/src/App.tsx','utf8');
const native=readFileSync('creator-v1/web/src/pages/NativeCreatorStudio.tsx','utf8');
const records=readFileSync('creator-v1/web/src/pages/CanonicalStudioPage.tsx','utf8');

test('V109 workspace TSX remains syntactically valid',()=>{
 const ast=parse(page,{sourceType:'module',plugins:['typescript','jsx']});
 assert.ok(ast.program.body.length>5);
});
test('new route is default OFF and legacy Studio routes remain retained',()=>{
 assert.match(app,/VITE_CREATOR_WORKSPACE_V109==='true'/);
 assert.match(app,/studio\/workspace/);
 assert.match(app,/path="studio" element=\{nativeCreatorEnabled/);
 assert.match(app,/path="studio\/records"/);
 assert.match(app,/path="studio\/packages"/);
 assert.match(app,/path="studio\/workbench"/);
 assert.match(native,/VITE_CREATOR_WORKSPACE_V109==='true'/);
 assert.match(records,/VITE_CREATOR_WORKSPACE_V109==='true'/);
});
test('workspace uses existing canonical account and server-owned inventories',()=>{
 assert.match(page,/canonicalAuthClient\.useSession\(\)/);
 assert.match(page,/session\.user\.id/);
 assert.match(page,/readWithDeadline\(signal=>studioList\(signal\)/);
 assert.match(page,/readNativeSession\(memberId,signal\)/);
 assert.match(page,/readNativeLibrary\(memberId,signal\)/);
 assert.match(page,/allowed\.has\(keyOf\(tab\)\)/);
 assert.match(page,/return <MemberWorkspace key=\{memberId\}/);
 assert.match(page,/controller\.abort\(\)/);
});
test('tab persistence contains opaque identifiers only and respects limits',()=>{
 assert.match(page,/const MAX_TABS=12/);
 assert.match(page,/sessionStorage\.setItem\(KEY\+memberId/);
 assert.match(page,/raw\.filter\(validTab\)\.slice\(0,MAX_TABS\)/);
 assert.match(page,/old\.from|next\.splice\(to,0,item\)/);
 assert.match(page,/Unpin the document before closing it/);
 assert.doesNotMatch(page,/localStorage\.setItem/);
});
test('workspace clearly isolates prototype features and respects reduced motion',()=>{
 assert.match(page,/Custom folders and source-file editing require the next reviewed workspace data layer/);
 assert.match(page,/not yet provide persistent folders, a source-code editor or general app execution/);
 assert.match(style,/@media\(max-width:390px\)/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(page,/Private playtest/);
});
