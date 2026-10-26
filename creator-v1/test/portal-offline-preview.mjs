// Development-only visual fixture, not bundled into the shipped site.
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {createPackageDiscoveryFixture} from "./package-discovery-fixture-v011.mjs";
// Root-mode is a test-only fixture for the actual apex / asset contract.
// The default staging-path behavior remains byte-for-byte equivalent.
const APEX_ROOT_QA=process.env.ANEVUM_APEX_ROOT_QA==="1";
const dist=resolve(fileURLToPath(new URL(APEX_ROOT_QA?"../dist/web/":"../dist/react-staging/",import.meta.url)));
const port=APEX_ROOT_QA?4180:4178;
const packageDiscoveryFixture=createPackageDiscoveryFixture();
const people=[["nova_demo","Nova Studio"],["moss_demo","Moss Workshop"],["oxide_demo","Oxide Collective"],["relay_demo","Relay Lab"]].map(([handle,displayName])=>({handle,displayName,publishedProjects:2}));
const seeds=[
 ["ARCADE AFTER DARK","games","nova_demo"],["PLANET PUZZLE","games","moss_demo"],["VOID RUNNER","games","oxide_demo"],
 ["FIELD KIT","tools","nova_demo"],["QUIET DESK","tools","moss_demo"],
 ["NOISE GARDEN","creative","oxide_demo"],["COSMIC SKETCH","creative","relay_demo"],["OPEN ATLAS","libraries","relay_demo"]
];
const work=seeds.map(([title,category,creatorHandle],i)=>({
 id:String(i+1).padStart(32,"0"),slug:title.toLowerCase().replaceAll(" ","-"),
 title,category,creatorHandle,creatorName:people.find(x=>x.handle===creatorHandle).displayName,
 summary:"Illustrative "+category+" creation for visual layout testing only.",
 description:"OFFLINE SYNTHETIC DESIGN FIXTURE. NOT A PUBLISHED PROJECT.",
 freeToUse:true,demoUrl:"https://example.com/",sourceUrl:null,license:null,publishedAt:"2026-10-12T00:00:00.000Z",
 aiDisclosure:"Offline synthetic design fixture.",humanContribution:"No real human creator record."
}));

// Independent incident regression: one approved-but-unlinked publication.
// Enabled only in local loopback browser tests. Never shipped to production.
if(process.env.ANEVUM_UNLINKED_ALPHA_VISUAL_TEST==="1"){
  work[0]={...work[0],title:"UNLINKED ALPHA RELEASE",creatorHandle:null,creatorName:"ANEVUM member"};
}
// Synthetic-only player cases live in the loopback fixture, not the public listings.
// No real creator or approval is inferred from these test records.
const playerCases=new Map([
  [9001,"SOURCE ARCHIVE / OFFLINE REVIEW","games",null,"https://github.com/example/source-archive"],
  [9002,"BLOCKED DEMO / SAFE SOURCE","games","http://insecure.example.com/game","https://github.com/example/safe-source"],
  [9003,"NO LINKED EXPERIENCE / OFFLINE REVIEW","games",null,null],
  [9004,"APPLICATION DESK / OFFLINE REVIEW","tools","https://example.com/application",null],
  [9005,"CHRONICLES OF THE PERPETUALLY UNFOLDING CONSTELLATION — VOLUME VII","games","https://example.com/long-title-demo",null]
].map(([number,title,category,demoUrl,sourceUrl])=>{
  const id=String(number).padStart(32,"0");
  return [id,{...work[0],id,slug:null,title,category,demoUrl,sourceUrl,
    creatorName:number===9005?"THE CARTOGRAPHERS OF THE ECHOING CONSTELLATIONS":work[0].creatorName,
    summary:number===9005?"SYNTHETIC OFFLINE REVIEW. A deliberately lengthy project summary exercises wrap, reading order and touch controls on narrow phones without asserting actual creator data. ".repeat(3):"SYNTHETIC OFFLINE project for player control and layout testing.",
    description:"OFFLINE SYNTHETIC DESIGN FIXTURE. NOT A PUBLISHED PROJECT."}];
}));
const categories=[...new Set(work.map(p=>p.category))].map(category=>({category,count:work.filter(p=>p.category===category).length}));
// Browser-only scenario switch. Disabled by default; never used by a Worker.
let contextFixtureEnabled=false;
// Separate project participation health simulation; never shipped or persisted.
let playerMemberHealthMode="legacy";
let syntheticProjectSaved=false;
const projectMemberRequests=[]; // Only local fixture traces, never credential content.
const contextProject={id:work[0].id,title:work[0].title,category:work[0].category,creatorHandle:work[0].creatorHandle,creatorName:work[0].creatorName};
const discussionFixtures=[
 {id:'a'.repeat(32),title:'Keyboard feedback for Arcade After Dark',excerpt:'SYNTHETIC OFFLINE discussion fixture: testing project context and accessible input.',body:'SYNTHETIC OFFLINE discussion fixture. This is not a real submission or earned contribution.',topic:'games',authorHandle:'moss_demo',authorName:'Moss Workshop',publishedAt:'2026-10-12T01:00:00Z',score:1,replyCount:1,project:contextProject},
 {id:'b'.repeat(32),title:'A question about creative process',excerpt:'SYNTHETIC OFFLINE creator-activity fixture, not real engagement.',body:'SYNTHETIC OFFLINE fixture for a general community discussion.',topic:'creative',authorHandle:'nova_demo',authorName:'Nova Studio',publishedAt:'2026-10-12T02:00:00Z',score:0,replyCount:0,project:null}
];
const overlay='<style>body::after{content:"SYNTHETIC OFFLINE REVIEW — NOT REAL CONTENT";position:fixed;bottom:5px;right:7px;pointer-events:none;z-index:2147483647;background:#fff0b2;color:#1c1010;border:2px solid #1c1010;padding:5px 8px;font:900 8px system-ui,sans-serif;max-width:230px}</style>';
// Fixture is ONLY served from this local 127.0.0.1 dev script for screenshot QA.
// It does not run in Cloudflare Workers, staging D1 or any shipped assets.
const FAKE_MEMBER=Object.freeze({
 id:"00000000000000000000000000000099",
 email:"synthetic-account@anevum.invalid",
 handle:"offline_artist",
 displayName:"Synthetic Creator Preview",
 bio:"An illustrative account for testing layout only. Not a real ANEVUM member."
});
const LOCAL_REVIEW_COOKIE="anevum_offline_visual_fixture=1";
const publicWallFailures=new Set();
function offlineMember(req,res,url){
  // V091 anonymous public identity fixtures. These are loopback-only records,
  // not authentication, actual members, earned specimens or production data.
  const publicFixture=/^\/api\/v1\/members\/(v091_public|v091_other|v091_private|v091_offline|v091_wall_(?:1440|390|320))(\/.*)?$/.exec(url.pathname);
  if(publicFixture){
    const [,handle,tail='']=publicFixture;
    if(req.method!=='GET')return json(res,{error:'Read-only synthetic fixture'},405);
    if(handle==='v091_private')return json(res,{error:'Not found'},404);
    if(handle==='v091_offline')return json(res,{error:'Synthetic service outage'},503);
    if(!tail)return json(res,{profile:{handle,displayName:'SYNTHETIC / '+handle,
      bio:'Offline browser acceptance fixture, not a real member.',joinedAt:1791763200,
      headline:'Synthetic public identity',worldTheme:'nocturne',focus:['games']}});
    if(tail==='/space')return json(res,{media:{},awards:[],featuredAwards:[],showStats:true,revision:1,
      stats:{level:5,xp:900,levelStart:750,nextLevel:1200}});
    if(tail==='/wall'){
      if(handle.startsWith('v091_wall_')&&!publicWallFailures.has(handle)){
        publicWallFailures.add(handle);
        return json(res,{error:'Synthetic one-time public wall outage'},503);
      }
      return json(res,{posts:[]});
    }
    if(tail==='/rewards/levels/5/card'){
      if(handle==='v091_public')return json(res,{error:'Synthetic media outage'},503);
      res.writeHead(200,{'content-type':'image/svg+xml','cache-control':'no-store'});
      return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#101d34"/><circle cx="128" cy="128" r="96" fill="none" stroke="#b6ddee" stroke-width="4"/><text x="128" y="150" text-anchor="middle" fill="#edf5ff" font-size="72">5</text></svg>');
    }
    return json(res,{error:'No additional synthetic rewards'},404);
  }
  // Synthetic auth and saved works are loopback-only and do not exist in the
  // compiled production Worker. No actual session can be created here.
  if(url.pathname==="/api/v1/member/auth/get-session"&&req.method==="GET"){
    const loggedIn=(req.headers.cookie||"").split(";").some(x=>x.trim()===LOCAL_REVIEW_COOKIE);
    return json(res,loggedIn?{
      user:{id:"00000000000000000000000000000099",name:"Offline Synthetic Member",
        email:"synthetic-account@anevum.invalid",emailVerified:true,
        createdAt:"2026-10-12T00:00:00.000Z",updatedAt:"2026-10-12T00:00:00.000Z"},
      session:{id:"synthetic-session-not-valid",userId:"00000000000000000000000000000099",
        expiresAt:"2027-01-01T00:00:00.000Z",createdAt:"2026-10-12T00:00:00.000Z",
        updatedAt:"2026-10-12T00:00:00.000Z"}
    }:null);
  }
  // Synthetic member-space browser scenario. This is read-only and strictly
  // loopback; it cannot authenticate, alter accounts, grant roles or publish.
  const hasSyntheticSession=(req.headers.cookie||"").split(";")
    .some(x=>x.trim()===LOCAL_REVIEW_COOKIE);
  if(url.pathname==="/api/v1/member/auth-methods"&&req.method==="GET")
    return json(res,{registration:"invite-only",availability:"ready",linking:"disabled",
      methods:{email:{available:true},google:{available:false},
        github:{available:false},apple:{available:false},
        microsoft:{available:false},passkey:{available:false}}});
  if(url.pathname==="/api/v1/member/creator-profile"&&req.method==="GET")
    return hasSyntheticSession?json(res,{memberId:FAKE_MEMBER.id,
      profile:{handle:"offline_artist",displayName:"Synthetic Creator Preview",
        bio:FAKE_MEMBER.bio,headline:"OFFLINE / TEST ONLY",worldTheme:"continuance",
        focus:["games"],visibility:"private",revision:1,
        createdAt:1791763200,updatedAt:1791763200}})
      :json(res,{error:"Sign-in required"},401);
  if(url.pathname==="/api/v1/member/space"&&req.method==="GET")
    return hasSyntheticSession?json(res,{media:{},awards:[],
      featuredAwards:[],showStats:false,revision:1,
      stats:{wallPosts:0,awards:0,xp:0,level:1,levelStart:0,nextLevel:100}})
      :json(res,{error:"Sign-in required"},401);
  if(url.pathname==="/api/v1/member/wall"&&req.method==="GET")
    return hasSyntheticSession?json(res,{posts:[]})
      :json(res,{error:"Sign-in required"},401);
  if(url.pathname==="/api/v1/member/project-saves"&&req.method==="GET"){
    if(playerMemberHealthMode!=="canonical-saves")
      return json(res,{error:"not-available"},404);
    if(!(req.headers.cookie||"").split(";").some(x=>x.trim()===LOCAL_REVIEW_COOKIE))
      return json(res,{error:"Sign-in required"},401);
    const item=work[0];
    return json(res,{items:syntheticProjectSaved?[{
      id:item.id,title:item.title,summary:item.summary,category:item.category,
      creatorHandle:item.creatorHandle,creatorName:item.creatorName,
      publishedAt:item.publishedAt,savedAt:1791763200
    }]:[],nextCursor:null});
  }
  const savePath=/^\/api\/v1\/member\/project-saves\/([a-f0-9]{32})$/.exec(url.pathname);
  if(savePath){
    if(playerMemberHealthMode!=="canonical-saves"||savePath[1]!==work[0].id)
      return json(res,{error:"not-available"},404);
    if(!(req.headers.cookie||"").split(";").some(x=>x.trim()===LOCAL_REVIEW_COOKIE))
      return json(res,{error:"Sign-in required"},401);
    if(req.method==="GET")return json(res,{available:true,saved:syntheticProjectSaved});
    if(req.method==="PUT"||req.method==="DELETE"){
      const wanted=req.method==="PUT",changed=syntheticProjectSaved!==wanted;
      syntheticProjectSaved=wanted;
      return json(res,{saved:syntheticProjectSaved,changed});
    }
    return json(res,{error:"method-not-allowed"},405);
  }
  if(/^\/api\/v1\/member\/(?:me|library(?:\/|$)|community\/projects(?:\/|$))/.test(url.pathname))
    projectMemberRequests.push({path:url.pathname,method:req.method});
  if(url.pathname==="/api/v1/member/health"&&req.method==="GET"){
    if(playerMemberHealthMode==="canonical-saves")return json(res,{
      service:"anevum-canonical-auth-staging",status:"ready",registration:"invite-only",
      linkedCreatorAccounts:false,projectSavesReady:true
    });
    if(playerMemberHealthMode==="canonical")return json(res,{
      service:"anevum-canonical-auth-staging",status:"ready",registration:"invite-only",
      linkedCreatorAccounts:false,progressionReady:true
    });
    if(playerMemberHealthMode==="offline")return json(res,{error:"unavailable"},503);
    return json(res,{service:"OFFLINE-SYNTHETIC-FIXTURE",status:"ok",signupEnabled:false});
  }
  if(url.pathname==="/api/v1/member/me"&&req.method==="GET"){
    const cookies=(req.headers.cookie||"").split(";").map(x=>x.trim());
    return cookies.includes(LOCAL_REVIEW_COOKIE)
      ?json(res,{member:FAKE_MEMBER})
      :json(res,{error:"Sign-in required"},401);
  }
  if(url.pathname==="/api/v1/member/community/me"&&req.method==="GET"){
    const cookies=(req.headers.cookie||"").split(";").map(x=>x.trim());
    return cookies.includes(LOCAL_REVIEW_COOKIE)
      ?json(res,{progression:{xp:180,level:2,maxLevel:30,artifact:"Vacuum Whisper",artifactEarned:true,levelStartXp:75,nextLevelXp:300,progressWithinLevel:105/225}})
      :json(res,{error:"Sign-in required"},401);
  }
  if(url.pathname==="/api/v1/member/creators/offline_artist"&&req.method==="GET"){
    return json(res,{
      creator:{handle:"offline_artist",displayName:"Synthetic Creator Preview",bio:FAKE_MEMBER.bio,joinedAt:"2026-10-12"},
      contributions:{ratings:1,publishedProjects:1,releases:0},
      progression:{xp:180,level:2,maxLevel:30,artifact:"Vacuum Whisper",artifactEarned:true,levelStartXp:75,nextLevelXp:300,progressWithinLevel:105/225},
      achievements:[
        {key:"first-signal",name:"First Signal",description:"Rate your first published project",symbol:"✦",earned:true,progress:1,target:1},
        {key:"keen-eye",name:"Keen Eye",description:"Rate five published projects",symbol:"◇",earned:false,progress:1,target:5},
        {key:"portal-guide",name:"Portal Guide",description:"Rate twenty-five published projects",symbol:"✳",earned:false,progress:1,target:25},
        {key:"first-launch",name:"First Launch",description:"Publish your first project after staff review",symbol:"⟡",earned:true,progress:1,target:1},
        {key:"three-builds",name:"Three Builds",description:"Publish three projects after staff review",symbol:"⬡",earned:false,progress:1,target:3},
        {key:"release-steward",name:"Release Steward",description:"Ship a versioned update to a published project",symbol:"✺",earned:false,progress:0,target:1}
      ]
    });
  }
  // No credential verification, writes, project or staff actions in this fixture.
  return json(res,{error:"no member Worker in offline fixture"},404);
}

function json(res,obj,status=200){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(obj));}
function api(res,url){
 const path=url.pathname.slice("/creator/api/v1".length);
 if(path==="/status")return json(res,{version:"SYNTHETIC-FIXTURE",phase:"offline",counts:{publishedProjects:work.length,publishedCreators:people.length},features:{communityPosts:contextFixtureEnabled,projectDiscussions:contextFixtureEnabled}});
 if(path==='/community/posts'&&contextFixtureEnabled){
   const project=url.searchParams.get('project'),creator=url.searchParams.get('creator');
   const items=discussionFixtures.filter(p=>(!project||p.project?.id===project)&&(!creator||p.authorHandle===creator));
   return json(res,{items,count:items.length,nextCursor:null,sort:url.searchParams.get('sort')||'new'});
 }
 if(path.startsWith('/community/posts/')&&contextFixtureEnabled){
   const post=discussionFixtures.find(p=>p.id===path.slice('/community/posts/'.length));
   return json(res,post?{post,replies:post.replyCount?[{id:'c'.repeat(32),body:'SYNTHETIC OFFLINE approved reply for responsive reading checks.',authorHandle:'oxide_demo',authorName:'Oxide Collective',publishedAt:'2026-10-12T03:00:00Z'}]:[]}:{error:'not-found'},post?200:404);
 }
 if(path==="/community/showcases"){
  // SYNTHETIC OFFLINE creator ledger; this is fixture-only review media.
  // No such member, badge, level or selected award exists in deployed D1.
  const requested=(url.searchParams.get("handles")||"").split(",").filter(Boolean);
  const items={};
  for(const handle of requested){
    if(!people.some(person=>person.handle===handle))continue;
    const developed=handle==="nova_demo"||handle==="moss_demo";
    if(!developed)continue; // Also exercise private/opted-out fallback.
    items[handle]={
      handle,level:handle==="nova_demo"?2:4,currentArtifact:handle==="nova_demo"?"Vacuum Whisper":"Symmetry Field",
      equippedArtifact:{name:handle==="nova_demo"?"Vacuum Whisper":"Symmetry Field",series:"Evolution of Everything"},
      featuredAwards:handle==="nova_demo"?
        [{key:"first-signal",name:"First Signal",description:"SYNTHETIC OFFLINE milestone"}]:
        [{key:"first-launch",name:"First Launch",description:"SYNTHETIC OFFLINE milestone"},
         {key:"keen-eye",name:"Keen Eye",description:"SYNTHETIC OFFLINE milestone"}],
      earnedAwardCount:handle==="nova_demo"?1:2
    };
  }
  return json(res,{source:"verified-creator-ledger",items});
 }
 if(path==="/categories")return json(res,{categories});
 if(path==="/boards"){
  // SYNTHETIC OFFLINE visual fixtures only. Production boards use canonical SQL.
  // This script cannot publish content and is never shipped as a Worker.
  const sorted=[...work].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||b.id.localeCompare(a.id));
  const firstMakers=new Set(people.filter(p=>p.publishedProjects===1).map(p=>p.handle));
  return json(res,{
    source:"approved-public-projects",
    labels:{
      latestReleases:"Latest approved publications",
      firstLooks:"Creators with one approved publication",
      publishingCreators:"Approved release counts, not quality rankings"
    },
    latestReleases:sorted.slice(0,12),
    firstLooks:sorted.filter(p=>firstMakers.has(p.creatorHandle)).slice(0,12),
    publishingCreators:[...people].sort((a,b)=>b.publishedProjects-a.publishedProjects||a.handle.localeCompare(b.handle)).slice(0,12),
    qualityRankingAvailable:false
  });
 }

 if(path==="/creators"){
  const q=(url.searchParams.get("q")||"").toLowerCase();
  const items=people.filter(p=>!q||(p.handle+" "+p.displayName).toLowerCase().includes(q));
  return json(res,{items,count:items.length,nextCursor:null});
 }
 if(path.startsWith("/creators/")){const p=people.find(p=>p.handle===path.slice(10));return json(res,p?{creator:p}:{error:"not-found"},p?200:404);}
 if(path==="/projects"){
  const cat=url.searchParams.get("category"),q=(url.searchParams.get("q")||"").toLowerCase(),who=url.searchParams.get("creator");
  const candidates=url.searchParams.get('cursor')==='synthetic-empty'?[]:packageDiscoveryFixture.legacy(work);
  const freeOnly=url.searchParams.get('free')==='1';
  const items=candidates.filter(p=>(!cat||p.category===cat)&&(!q||(p.title+' '+p.summary).toLowerCase().includes(q))&&(!who||who===p.creatorHandle)&&(!freeOnly||p.freeToUse)).slice(0,Math.min(24,Number(url.searchParams.get("limit"))||24));
  return json(res,{items,count:items.length,nextCursor:null});
 }
 if(path.startsWith("/projects/")){const id=path.slice(10);const p=work.find(p=>p.id===id)||playerCases.get(id);return json(res,p?{item:p}:{error:"not-found"},p?200:404);}
 return json(res,{error:"not-found"},404);
}
const mime={".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp"};
createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://127.0.0.1:4178");
  if(packageDiscoveryFixture.handle(req,res,u))return;
  if(u.pathname==="/__player-member-fixture"&&req.headers.host==="127.0.0.1:4178"&&req.method==="GET"){
    const mode=u.searchParams.get("mode");
    if(!["canonical","canonical-saves","legacy","offline"].includes(mode))return json(res,{error:"invalid-mode"},400);
    playerMemberHealthMode=mode;
    projectMemberRequests.length=0;
    syntheticProjectSaved=false;
    return json(res,{syntheticOnly:true,mode:playerMemberHealthMode});
  }
  if(u.pathname==="/__player-member-requests"&&req.headers.host==="127.0.0.1:4178"&&req.method==="GET")
    return json(res,{syntheticOnly:true,requests:[...projectMemberRequests]});
  if(u.pathname==='/__context-fixture'&&req.headers.host==='127.0.0.1:4178'&&req.method==='GET'){
    contextFixtureEnabled=u.searchParams.get('enabled')==='1';
    return json(res,{syntheticOnly:true,enabled:contextFixtureEnabled});
  }
  // Synthetic local-only issuer status. No real D1, XP, users or credentials.
  if(u.pathname==="/api/v1/public/recognition/catalog"){
    if(req.method!=="GET"&&req.method!=="HEAD")return json(res,{error:"Read-only"},405);
    if(u.search)return json(res,{error:"Unexpected query"},400);
    res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
    return res.end(req.method==="HEAD"?"":JSON.stringify({
      version:1,activeBadgeIds:["first_signal","world_shaper","first_orbit","first_thread","first_reply","conversationalist"],
      activeRibbonIds:[],activeMedalIds:[]
    }));
  }
  if(u.pathname==="/__ready")return json(res,{ready:existsSync(resolve(dist,"index.html"))});
  if(APEX_ROOT_QA&&u.pathname.startsWith("/assets/")){
    const rel=u.pathname.slice(1);
    if(!/^assets\/[a-zA-Z0-9._/-]+$/.test(rel)||rel.split("/").includes(".."))return json(res,{error:"not-found"},404);
    const path=resolve(dist,rel);
    if(!path.startsWith(dist+"/")||!existsSync(path))return json(res,{error:"not-found"},404);
    res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream","x-content-type-options":"nosniff","cache-control":"no-store"});
    return res.end(readFileSync(path));
  }
  if(APEX_ROOT_QA&&u.pathname==="/"){
    res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store",
      "x-content-type-options":"nosniff",
      "content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"});
    return res.end(readFileSync(resolve(dist,"index.html"),"utf8").replace("</head>",overlay+"</head>"));
  }
  if(u.pathname.startsWith("/creator/api/v1/"))return api(res,u);
  if(u.pathname.startsWith("/api/v1/member/")||u.pathname.startsWith("/api/v1/members/"))return offlineMember(req,res,u);
  if(u.pathname.startsWith("/creator/assets/")){
    const rel=u.pathname.slice(9);
    if(!/^assets\/(?:[a-zA-Z0-9._-]+|cinematic\/(?:hero|categories)\/[a-zA-Z0-9._-]+\.webp|cinematic-v2\/atmosphere\/[a-zA-Z0-9._-]+\.webp|community-portals\/(?:games|tools|creative|libraries)-(?:768|1536)\.webp|default-thumbnails\/(?:games|tools|automation|research|creative|learning|libraries|other|simulation|story)\.svg|default-thumbnails\/v136-baseline-005\/(?:games|tools|automation|research|creative|learning|libraries|other|simulation|story)\.svg|site-v136-005\/(?:favicon\.svg|site\.webmanifest))$/.test(rel))return json(res,{error:"not-found"},404);
    const path=resolve(dist,rel);
    if(!existsSync(path))return json(res,{error:"not-found"},404);
    res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream"});
    return res.end(readFileSync(path));
  }
  if(u.pathname==="/creator"||u.pathname.startsWith("/creator/")){
    const header={"content-type":"text/html; charset=utf-8","cache-control":"no-store"};
    // V096 local browser QA: replay the route-specific production frame CSP
    // only when explicitly requested. Never alter other fixture scenarios.
    if(process.env.ANEVUM_V096_ALPHA_CSP_QA==="1"&&u.pathname==="/creator/studio/alpha"){
      header["content-security-policy"]=
        "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "+
        "img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; "+
        "frame-src 'self' about: blob:; base-uri 'none'; form-action 'self'; object-src 'none'";
      header["x-frame-options"]="DENY";
    }
    // Restrict the fake member cookie to the local one-off editor visual capture.
    if(u.pathname==="/creator/account"&&req.headers.host==="127.0.0.1:4178")
      header["set-cookie"]=LOCAL_REVIEW_COOKIE+"; Path=/; SameSite=Strict";
    if(u.pathname==="/creator/account/edit"&&req.headers.host==="127.0.0.1:4178")
      header["set-cookie"]=LOCAL_REVIEW_COOKIE+"; Path=/; SameSite=Strict";
    if(u.pathname==="/creator/create/new"&&req.headers.host==="127.0.0.1:4178")
      header["set-cookie"]=LOCAL_REVIEW_COOKIE+"; Path=/; SameSite=Strict";
    res.writeHead(200,header);
    return res.end(readFileSync(resolve(dist,"index.html"),"utf8").replace("</head>",overlay+"</head>"));
  }
  return json(res,{error:"not-found"},404);
 }catch(e){console.error(e);return json(res,{error:"fixture-error"},500);}
}).listen(port,"127.0.0.1",()=>console.log("ANEVUM_VISUAL_FIXTURE_READY_"+(APEX_ROOT_QA?"APEX_ROOT":"STAGING")));
