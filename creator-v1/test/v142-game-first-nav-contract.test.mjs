import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PORTAL_DESTINATIONS,findPortalDestinations} from "../web/src/lib/portal-destinations.ts";
const read=path=>readFileSync(new URL("../web/src/"+path,import.meta.url),"utf8");
test("current SEVERANCE game is a real, first-class quick-navigation destination",()=>{
  const item=PORTAL_DESTINATIONS.find(x=>x.id==="severance");
  assert.ok(item,"Current flagship is reachable from switchboard");
  assert.equal(item.path,"/severance");
  assert.equal(item.gated,undefined,"Development dossier is public, not playable");
  const defaults=findPortalDestinations("");
  assert.ok(defaults.some(x=>x.id==="severance"));
  assert.ok(defaults.some(x=>x.id==="guide"),"Existing free guide remains searchable and default-visible");
  assert.ok(defaults.some(x=>x.id==="status"),"Honest availability is directly discoverable");
  assert.ok(!defaults.some(x=>x.id==="start"||x.id==="tools"),"Old platform-first launch destinations no longer dominate quick switchboard");
  assert.equal(findPortalDestinations("severance")[0]?.id,"severance");
  assert.equal(findPortalDestinations("open source")[0]?.id,"libraries","Archive categories remain usable via search");
});
test("obsolete labels and misleading destination removed, preserving valid routes",()=>{
  const header=read("parity/ParityHeaderV136.tsx");
  const rail=read("parity/ConsoleWayfinderV136.tsx");
  const discover=read("parity/ParityDiscoverV136.tsx");
  assert.doesNotMatch(header,/className="av138-header-status"/,'Duplicated status button retired; canonical top nav still contains Status');
  assert.match(header,/HEADER_NAV\.map/,'Real shared Status navigation remains');
  assert.doesNotMatch(header,/>DEV LOG<\/Link>/);
  assert.match(rail,/to:'\/',label:'Home',small:'Entrance'/);
  assert.match(discover,/<Link to="\/status" className="p136-discover-helper">Publishing status/);
  assert.doesNotMatch(discover,/How publishing works/);
  const app=read("App.tsx");
  assert.match(app,/path="severance"/);
  assert.match(app,/path="studio\/packages"/);
  assert.match(app,/path="community\/write"/);
  assert.match(app,/path="atlas\/\*"/,"Historical inbound redirects remain without promoting them in navigation");
});
test("live page shell, rail and game pages have no obsolete outgoing literal destinations",()=>{
 const sources=["components/Shell.tsx","parity/ParityHeaderV136.tsx",
  "parity/ConsoleWayfinderV136.tsx","parity/StageFocusedHomeV137.tsx",
  "parity/ParityDiscoverV136.tsx","pages/SeverancePage.tsx"];
 for(const p of sources){
   const source=read(p);
   assert.doesNotMatch(source,/(?:to|href)=["']\/(?:atlas|workspace|account|create|thebutton|sign-in|portfolio)(?:[\/?"'])/,
    "No top-level link should point to a retired alias: "+p);
 }
});
