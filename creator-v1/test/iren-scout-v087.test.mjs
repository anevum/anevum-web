import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const scout=read("web/src/components/IrenGuidedContinuance.tsx");
const notifications=read("web/src/components/AnevumNotifications.tsx");
const shell=read("web/src/components/Shell.tsx");
const css=read("web/src/iren-guided-v080.css");

test("Only IREN owns a persistent floating bottom-right control",()=>{
 assert.doesNotThrow(()=>parse(scout,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.doesNotThrow(()=>parse(notifications,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.equal((scout.match(/className="ir80-dock ir87-scout"/g)||[]).length,1);
 assert.doesNotMatch(notifications,/an-notification-center|an-inbox-toggle|an-updates-dialog/);
 assert.match(notifications,/className=\{'an-toast/);
 assert.match(shell,/<IrenGuidedContinuance /);
});

test("Animated small IREN scout is accessible and respects motion settings",()=>{
 assert.match(scout,/function IrenScout\(\)/);
 assert.match(scout,/aria-label=\{panelOpen\?"Close IREN companion":"Open IREN companion"/);
 assert.match(scout,/unreadCount>0\?", "\+unreadCount\+" new signals"/);
 assert.match(scout,/className="ir87-unread"/);
 assert.match(css,/\.ir87-scout\.ir80-dock\{[^}]*width:54px/);
 assert.match(css,/@media\(max-width:650px\)[\s\S]*?\.ir87-scout\.ir80-dock\{width:51px/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.ir87-scout-art[\s\S]*?animation:none/);
 assert.match(scout,/document\.addEventListener\("pointerdown",onOutside\)/);
});

test("IREN combines help, guided tours and real account recognition",()=>{
 assert.match(scout,/useIrenSignals\(\)/);
 assert.match(scout,/role="tablist"/);
 assert.match(scout,/role="tabpanel"/);
 assert.match(scout,/markSignalsSeen\(\)/);
 assert.match(scout,/LevelEmblem level=\{item\.level!\}/);
 assert.match(scout,/AwardEmblem award=\{item\.award\}/);
 assert.match(scout,/start\(\)/);
 assert.match(notifications,/lastSeenRef/);
 assert.match(notifications,/signalSeenKey\(id\)/);
 assert.doesNotMatch(scout,/fetch\(|dangerouslySetInnerHTML/);
});
