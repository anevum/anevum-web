import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";
import { verifiedCreatorRecognition, recognitionHandles } from "../web/src/lib/creator-recognition.ts";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const hub = source("web/src/pages/CommunityPage.tsx");
const feed = source("web/src/components/CommunityHomeFeed.tsx");
const strip = source("web/src/components/CreatorRecognitionStrip.tsx");
const hook = source("web/src/lib/useVerifiedCreatorRecognition.ts");
const memberApi = source("web/src/lib/member-api.ts");
const css = source("web/src/components/creator-recognition-v009.css");

const canonical={
  creator:{handle:"nova_demo",displayName:"Synthetic Example"},
  progression:{xp:16820,level:30,artifact:"Midnight Atlas",artifactEarned:true},
  achievements:[
    {key:"first-launch",name:"First Launch",earned:true},
    {key:"keen-eye",name:"Keen Eye",earned:false},
    {key:"release-steward",name:"Release Steward",earned:true},
    {key:"malicious",name:"Administrator",earned:true}
  ]
};

test("creator recognition is bound to the exact published creator handle",()=>{
  const actual=verifiedCreatorRecognition("nova_demo",canonical);
  assert.deepEqual(actual,{
    handle:"nova_demo",level:30,artifact:"Midnight Atlas",earnedArtifact:true,
    earnedAward:{key:"release-steward",name:"Release Steward"}
  });
  assert.equal(verifiedCreatorRecognition("other_person",canonical),null);
  assert.equal(verifiedCreatorRecognition("../private",canonical),null);
  assert.equal(verifiedCreatorRecognition("nova_demo",{...canonical,creator:{handle:"other_person"}}),null);
  assert.equal(verifiedCreatorRecognition("nova_demo",{...canonical,progression:{level:0,artifact:"Midnight Atlas",artifactEarned:true}}),null);
});

test("unearned and unknown awards never appear as earned public badges",()=>{
  let base={...canonical,achievements:[{key:"first-launch",name:"First Launch",earned:false}]};
  assert.equal(verifiedCreatorRecognition("nova_demo",base)?.earnedAward,null);
  base={...canonical,achievements:[{key:"first-launch",name:"Founder",earned:true}]};
  assert.equal(verifiedCreatorRecognition("nova_demo",base)?.earnedAward,null);
  base={...canonical,achievements:[{key:"founder-title",name:"Founder",earned:true}]};
  assert.equal(verifiedCreatorRecognition("nova_demo",base)?.earnedAward,null);
  const empty=verifiedCreatorRecognition("nova_demo",{
    ...base,progression:{level:61,artifact:null,artifactEarned:false},achievements:[]
  });
  assert.deepEqual(empty,{handle:"nova_demo",level:61,artifact:null,earnedArtifact:false,earnedAward:null});
  assert.equal(verifiedCreatorRecognition("nova_demo",{...base,progression:{level:2,artifact:"",artifactEarned:true}})?.earnedArtifact,false);
});

test("public recognition request set is deduplicated, bounded, sanitized",()=>{
  const handles=["nova_demo","NOVA_DEMO","../private","moss_demo",...Array.from({length:20},(_,i)=>"artist_"+String(i).padStart(2,"0"))];
  const safe=recognitionHandles(handles);
  assert.equal(safe.length,12);
  assert.deepEqual(safe.slice(0,2),["nova_demo","moss_demo"]);
  assert.equal(new Set(safe).size,12);
  assert.ok(safe.every(x=>/^[a-z][a-z0-9_]{2,29}$/.test(x)));
});

test("visual components compile and do not mint client-side XP or selected badges",()=>{
  for(const file of [hub,feed,strip,hook]){
    assert.doesNotThrow(()=>parse(file,{sourceType:"module",plugins:["jsx","typescript"]}));
  }
  assert.match(hub,/useVerifiedCreatorRecognition/);
  assert.match(hub,/CreatorRecognitionStrip/);
  assert.match(feed,/useVerifiedCreatorRecognition/);
  assert.match(feed,/CreatorRecognitionStrip/);
  assert.match(strip,/earnedArtifact/);
  assert.match(strip,/earnedAward/);
  assert.match(strip,/size="micro"/);
  assert.match(hook,/Promise\.all/);
  assert.match(hook,/memberCreatorProfile\(handle,signal\)/);
  assert.match(memberApi,/}>/); // member types remain defined
  assert.match(memberApi,/publicHealth:true\}\); \/\/ Public, anonymous creator profile/);
  assert.doesNotMatch(strip+hook,/grantXp|awardXp|Math\.random|localStorage|fetch\(|selectedAwardId|memberVote|memberReact|dangerouslySetInnerHTML/);
});

test("recognition is compact, readable and has non-fabricated accessible labels",()=>{
  for(const selector of [".ch9-recognition",".ch9-level",".ch9-artifact",".ch9-award",".ch9-recognition--compact"])
    assert.ok(css.includes(selector));
  assert.match(strip,/aria-label=/);
  assert.match(strip,/earned achievement \(not a selected showcase award\)/i);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
