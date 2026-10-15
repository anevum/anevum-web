import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("profile editor is truly member gated and shares the authenticated account identity",()=>{
 const app=read("web/src/App.tsx");
 const gate=read("web/src/components/MemberGate.tsx");
 const account=read("web/src/pages/MemberAccountPage.tsx");
 const page=read("web/src/pages/MemberProfileEditorPage.tsx");
 assert.match(app,/path="account\/edit" element=\{<MemberProfileEditorPage\/>\}/);
 assert.ok(app.indexOf('<Route path="account/edit"')>app.indexOf('<Route element={<MemberGate/>}>'));
 assert.match(account,/to="\/account\/edit"/);
 assert.match(gate,/onProfileSaved/);
 assert.match(gate,/confirmedProfile\?\.id===session\.data\.member\.id/);
 assert.match(gate,/activeMember\.displayName\|\|activeMember\.handle/);
 assert.match(gate,/member:activeMember/);
 assert.match(gate,/to="\/account\/edit"/);
 assert.match(page,/useMemberContext/);
 assert.match(page,/memberSaveProfile/);
 assert.match(page,/onProfileSaved\(profile\)/);
 assert.match(page,/disabled=\{busy\}/);
 assert.match(page,/member\.handle/);
 assert.match(page,/readOnly=\{locked\}/);
 assert.match(page,/role="status"/);
 assert.match(page,/role="alert"/);
 assert.match(page,/aria-label="Live creator channel preview"/);
 assert.doesNotMatch(page,/href="\/api\/v1\/member\/join"/);
});
test("profile editor never represents editable server-owned permissions or fabricated public activity",()=>{
 const page=read("web/src/pages/MemberProfileEditorPage.tsx");
 const client=read("web/src/lib/member-api.ts");
 const css=read("web/src/member-profile.css");
 const main=read("web/src/main.tsx");
 assert.match(page,/HANDL[E]=\/\^\[a-z\]/);
 assert.match(page,/bio\.trim\(\)/);
 assert.match(page,/Your sign-in email remains private/);
 assert.match(page,/may be viewed by anyone who knows their handle/);
 assert.match(page,/NOT A PUBLIC LISTING/);
 assert.match(client,/requestMember<\{profile:MemberProfileUpdate\}>\("\/profile",\{method:"POST",body:profile\}\)/);
 assert.match(main,/import "\.\/member-profile\.css"/);
 for(const w of ["@media(max-width:640px)","@media(max-width:920px)","@media(prefers-reduced-motion:reduce)"])
   assert.ok(css.includes(w),w);
 assert.doesNotMatch(page,/Math\.random|setInterval|dangerouslySetInnerHTML|localStorage|member_id|is_staff/);
 assert.doesNotMatch(css,/mobile-bottom-nav/);
});


test("first-time invited member is guided through creator setup before any project draft",()=>{
 const projectList=read("web/src/pages/MemberProjectsPage.tsx");
 const projectEditor=read("web/src/pages/ProjectEditorPage.tsx");
 assert.match(projectList,/!member\.handle/);
 assert.match(projectList,/to="\/account\/edit">COMPLETE PROFILE/);
 assert.doesNotMatch(projectList,/href="\/api\/v1\/member\/join"/);
 assert.match(projectEditor,/useMemberContext/);
 assert.match(projectEditor,/if\(!member\.handle\)return/);
 assert.match(projectEditor,/to="\/account\/edit">COMPLETE CREATOR PROFILE/);
 assert.match(projectEditor,/memberProject\(projectId,signal\)/);
 assert.match(projectEditor,/memberCreateProject\(draft\)/);
});
