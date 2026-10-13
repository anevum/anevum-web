// Development-only visual fixture, not bundled into the shipped site.
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,extname} from "node:path";
import {fileURLToPath} from "node:url";
const dist=resolve(fileURLToPath(new URL("../dist/react-staging/",import.meta.url)));
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
const categories=[...new Set(work.map(p=>p.category))].map(category=>({category,count:work.filter(p=>p.category===category).length}));
const overlay='<style>body::after{content:"SYNTHETIC OFFLINE REVIEW — NOT REAL CONTENT";position:fixed;bottom:78px;right:7px;z-index:2147483647;background:#fff0b2;color:#1c1010;border:2px solid #1c1010;padding:5px 8px;font:900 8px system-ui,sans-serif;max-width:230px}</style>';
// Fixture is ONLY served from this local 127.0.0.1 dev script for screenshot QA.
// It does not run in Cloudflare Workers, staging D1 or any shipped assets.
const FAKE_MEMBER=Object.freeze({
 id:"00000000000000000000000000000099",
 email:"synthetic-account@anevum.invalid",
 handle:"offline_artist",
 displayName:"Synthetic Creator Preview",
 bio:"An illustrative account for testing layout only. Not a real ANEVUM member."
});
const FICTIONAL_FORUM_AUTHOR=Object.freeze({
 handle:"nova_demo",displayName:"Nova Studio",level:7,artifact:"Quartz Spool",
 badges:[{key:"first-signal",name:"First Signal",symbol:"✦"},{key:"keen-eye",name:"Keen Eye",symbol:"◇"}]
});
const FICTIONAL_FORUM_PEER=Object.freeze({
 handle:"moss_demo",displayName:"Moss Workshop",level:3,artifact:"Blackglass Seed",
 badges:[{key:"first-launch",name:"First Launch",symbol:"⟡"}]
});
const FORUM_FIXTURE_ID="000000000000000000000000000000f1";
const FORUM_FIXTURE_POSTS=[
 {id:"000000000000000000000000000000e1",body:"I am experimenting with a small browser game about exploring an unknown place. What's a good way to make the first few minutes inviting without adding too many instructions?\n\nThis is an offline visual fixture, not a real member post.",createdAt:1791800000,starter:true,author:FICTIONAL_FORUM_AUTHOR},
 {id:"000000000000000000000000000000e2",body:"You could make the first action immediately playable, then introduce one idea at a time. The atmosphere can carry a lot of discovery without a tutorial wall.",createdAt:1791800600,starter:false,author:FICTIONAL_FORUM_PEER},
 {id:"000000000000000000000000000000e3",body:"That's useful. I'll try making the entrance itself a tutorial. Maybe the environment should teach the controls before any text appears.",createdAt:1791800900,starter:false,author:FICTIONAL_FORUM_AUTHOR}
];
const FORUM_FIXTURE_ROOM={id:"arcade",name:"The Arcade",subject:"Games, playtesting and interactive worlds"};
const LOCAL_REVIEW_COOKIE="anevum_offline_visual_fixture=1";
function offlineMember(req,res,url){
  if(url.pathname==="/api/v1/member/health"&&req.method==="GET")
    return json(res,{service:"OFFLINE-SYNTHETIC-FIXTURE",status:"ok",signupEnabled:false});
  if(url.pathname==="/api/v1/member/me"&&req.method==="GET"){
    const cookies=(req.headers.cookie||"").split(";").map(x=>x.trim());
    return cookies.includes(LOCAL_REVIEW_COOKIE)
      ?json(res,{member:FAKE_MEMBER})
      :json(res,{error:"Sign-in required"},401);
  }
  if(req.method==="GET"&&["/api/v1/member/community/me","/api/v1/member/creators/offline_artist"].includes(url.pathname)){
    const cookie=(req.headers.cookie||"").split(";").map(x=>x.trim());
    if(!cookie.includes(LOCAL_REVIEW_COOKIE))return json(res,{error:"Sign-in required"},401);
    const progression={level:4,xp:180,artifact:"Ivory Compass",maxLevel:null,artifactEarned:true,
      levelStartXp:180,nextLevelXp:320,progressWithinLevel:0};
    if(url.pathname==="/api/v1/member/community/me")return json(res,{progression});
    return json(res,{creator:{handle:"offline_artist",displayName:"Synthetic Creator Preview",
      bio:FAKE_MEMBER.bio,joinedAt:"2026-10-10"},
      contributions:{ratings:1,publishedProjects:0,releases:0},progression,
      achievements:[
       {key:"first-signal",name:"First Signal",symbol:"✦",description:"Fixture-only verified badge",earned:true,progress:1,target:1},
       {key:"keen-eye",name:"Keen Eye",symbol:"◇",description:"Fixture-only locked badge",earned:false,progress:1,target:5}
      ]});
  }
  // These routes exist ONLY in the loopback screenshot fixture; all records
  // are labeled synthetic in the visible screenshot watermark.
  if(req.method==="GET"&&url.pathname==="/api/v1/member/forum/rooms")
    return json(res,{rooms:[
      {...FORUM_FIXTURE_ROOM,threads:1},
      {id:"workshop",name:"The Workshop",subject:"Independent apps, open source and practical making",threads:0},
      {id:"lab",name:"The Lab",subject:"Experiments, AI and creative problem-solving",threads:0},
      {id:"commons",name:"The Commons",subject:"Questions, introductions and collaboration",threads:0}
    ],access:"offline-synthetic"});
  if(req.method==="GET"&&url.pathname==="/api/v1/member/forum/rooms/arcade")
    return json(res,{room:FORUM_FIXTURE_ROOM,items:[
      {id:FORUM_FIXTURE_ID,room:"arcade",title:"How should an unknown world teach players to explore?",createdAt:1791800000,postCount:3,author:FICTIONAL_FORUM_AUTHOR}
    ],nextCursor:null});
  if(req.method==="GET"&&url.pathname==="/api/v1/member/forum/threads/"+FORUM_FIXTURE_ID)
    return json(res,{thread:{id:FORUM_FIXTURE_ID,room:"arcade",title:"How should an unknown world teach players to explore?",createdAt:1791800000,author:FICTIONAL_FORUM_AUTHOR},posts:FORUM_FIXTURE_POSTS,nextCursor:null});
  if(req.method==="GET"&&url.pathname==="/api/v1/member/creators/nova_demo")
    return json(res,{creator:{handle:"nova_demo",displayName:"Nova Studio",bio:"Offline synthetic maker for layout testing.",joinedAt:"2026-10-10"},contributions:{ratings:5,publishedProjects:2,releases:0},progression:{level:7,xp:720,artifact:"Quartz Spool",maxLevel:null,artifactEarned:true,levelStartXp:720,nextLevelXp:980,progressWithinLevel:0},achievements:FICTIONAL_FORUM_AUTHOR.badges.map(b=>({...b,earned:true,progress:1,target:1}))});
  // No credential verification, writes, project or staff actions in this fixture.
  return json(res,{error:"no member Worker in offline fixture"},404);
}

function json(res,obj,status=200){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(obj));}
function api(res,url){
 const path=url.pathname.slice("/creator/api/v1".length);
 if(path==="/status")return json(res,{version:"SYNTHETIC-FIXTURE",phase:"offline",counts:{publishedProjects:work.length,publishedCreators:people.length}});
 if(path==="/categories")return json(res,{categories});
 if(path==="/creators"){
  const q=(url.searchParams.get("q")||"").toLowerCase();
  const items=people.filter(p=>!q||(p.handle+" "+p.displayName).toLowerCase().includes(q));
  return json(res,{items,count:items.length,nextCursor:null});
 }
 if(path.startsWith("/creators/")){const p=people.find(p=>p.handle===path.slice(10));return json(res,p?{creator:p}:{error:"not-found"},p?200:404);}
 if(path==="/projects"){
  const cat=url.searchParams.get("category"),q=(url.searchParams.get("q")||"").toLowerCase(),who=url.searchParams.get("creator");
  const items=work.filter(p=>(!cat||p.category===cat)&&(!q||p.title.toLowerCase().includes(q))&&(!who||who===p.creatorHandle)).slice(0,Math.min(24,Number(url.searchParams.get("limit"))||24));
  return json(res,{items,count:items.length,nextCursor:null});
 }
 if(path.startsWith("/projects/")){const p=work.find(p=>p.id===path.slice(10));return json(res,p?{item:p}:{error:"not-found"},p?200:404);}
 return json(res,{error:"not-found"},404);
}
const mime={".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png"};
createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://127.0.0.1:4178");
  if(u.pathname==="/__ready")return json(res,{ready:existsSync(resolve(dist,"index.html"))});
  if(u.pathname.startsWith("/creator/api/v1/"))return api(res,u);
  if(u.pathname.startsWith("/api/v1/member/"))return offlineMember(req,res,u);
  if(u.pathname.startsWith("/creator/assets/")){
    const rel=u.pathname.slice(9);
    if(!/^assets\/[a-zA-Z0-9._-]+$/.test(rel))return json(res,{error:"not-found"},404);
    const path=resolve(dist,rel);
    if(!existsSync(path))return json(res,{error:"not-found"},404);
    res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream"});
    return res.end(readFileSync(path));
  }
  if(u.pathname==="/creator"||u.pathname.startsWith("/creator/")){
    const header={"content-type":"text/html; charset=utf-8","cache-control":"no-store"};
    // Restrict the synthetic member cookie to explicit local account/editor design captures only.
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
}).listen(4178,"127.0.0.1",()=>console.log("ANEVUM_VISUAL_FIXTURE_READY"));
