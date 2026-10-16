import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectPlayer} from "../web/src/lib/player-registry.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Player V002 uses only available approved external destinations",()=>{
 const game=selectPlayer("games",true,true);
 assert.equal(game.kind,"external-game");
 assert.equal(game.primaryAction,"PLAY ON CREATOR SITE");
 const app=selectPlayer("tools",true,false);
 assert.equal(app.kind,"external-app");
 assert.equal(app.primaryAction,"TRY ON CREATOR SITE");
 assert.equal(selectPlayer("automation",true,false).kind,"external-app");
 assert.equal(selectPlayer("creative",true,false).kind,"external-creation");
 const source=selectPlayer("games",false,true);
 assert.equal(source.kind,"source-only");
 assert.equal(source.primaryAction,"VIEW SOURCE CODE");
 assert.match(source.explanation,/not an executable demo/);
 const absent=selectPlayer("games",false,false);
 assert.equal(absent.kind,"unavailable");
 assert.equal(absent.primaryAction,null);
});

test("Player V002 preserves existing project, participation and source boundaries",()=>{
 const page=read("web/src/pages/ProjectPage.tsx");
 const shell=read("web/src/components/ProjectPlayerShell.tsx");
 const styles=read("web/src/components/project-player-shell.css");
 for(const name of ["ProjectPlayerShell","safeExternal(p.demoUrl)","safeExternal(p.sourceUrl)",
   "MemberEngagementPanel","ContextDiscussions","RepositoryPanel","AI INVOLVEMENT","HUMAN CONTRIBUTION"])
   assert.ok(page.includes(name),name);
 assert.match(shell,/selectPlayer\(project\.category,Boolean\(demo\),Boolean\(source\)\)/);
 assert.match(shell,/target="_blank" rel="noopener noreferrer"/);
 assert.match(shell,/navigator\.share/);
 assert.match(shell,/navigator\.clipboard/);
 assert.match(shell,/avp-project-title/);
 assert.match(styles,/max-width:390px/);
 assert.match(styles,/prefers-reduced-motion:reduce/);
 assert.match(styles,/forced-colors:active/);
 for(const code of [page,shell])
   assert.doesNotMatch(code,/<iframe|dangerouslySetInnerHTML|autoplay|grantXp|play_completed/);
});
