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
const overlay='<style>body::after{content:"SYNTHETIC OFFLINE REVIEW — NOT REAL CONTENT";position:fixed;bottom:78px;right:7px;z-index:2147483647;background:#fff0b2;color:#1c1010;border:2px solid #1c1010;padding:5px 8px;font:900 8px system-ui,sans-serif;max-width:230px}.cinema-portal-fx{display:none!important}.cinema-hero-art,.cinema-atmosphere-layer img{animation:none!important;transition:none!important}</style>';
// The offline screenshot fixture freezes continuous ambient motion for reliable static captures.\n// Fixture is ONLY served from this local 127.0.0.1 dev script for screenshot QA.
// It does not run in Cloudflare Workers, staging D1 or any shipped assets.
const FAKE_MEMBER=Object.freeze({
 id:"00000000000000000000000000000099",
 email:"synthetic-account@anevum.invalid",
 handle:"offline_artist",
 displayName:"Synthetic Creator Preview",
 bio:"An illustrative account for testing layout only. Not a real ANEVUM member."
});
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
  if(url.pathname==="/api/v1/member/community/me"&&req.method==="GET"){
    const cookies=(req.headers.cookie||"").split(";").map(x=>x.trim());
    return cookies.includes(LOCAL_REVIEW_COOKIE)
      ?json(res,{progression:{xp:180,level:4,maxLevel:null,artifact:"Ivory Compass",artifactEarned:true,levelStartXp:180,nextLevelXp:320,progressWithinLevel:0}})
      :json(res,{error:"Sign-in required"},401);
  }
  if(url.pathname==="/api/v1/member/creators/offline_artist"&&req.method==="GET"){
    return json(res,{
      creator:{handle:"offline_artist",displayName:"Synthetic Creator Preview",bio:FAKE_MEMBER.bio,joinedAt:"2026-10-12"},
      contributions:{ratings:1,publishedProjects:1,releases:0},
      progression:{xp:180,level:4,maxLevel:null,artifact:"Ivory Compass",artifactEarned:true,levelStartXp:180,nextLevelXp:320,progressWithinLevel:0},
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
const mime={".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp"};
createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://127.0.0.1:4178");
  if(u.pathname==="/__ready")return json(res,{ready:existsSync(resolve(dist,"index.html"))});
  if(u.pathname.startsWith("/creator/api/v1/"))return api(res,u);
  if(u.pathname.startsWith("/api/v1/member/"))return offlineMember(req,res,u);
  if(u.pathname.startsWith("/creator/assets/")){
    const rel=u.pathname.slice(9);
    if(!/^assets\/(?:[a-zA-Z0-9._-]+|cinematic\/(?:hero|categories)\/[a-zA-Z0-9._-]+\.webp|cinematic-v2\/atmosphere\/orbital-(?:haze|dust)-(?:desktop|mobile)\.webp)$/.test(rel))return json(res,{error:"not-found"},404);
    const path=resolve(dist,rel);
    if(!existsSync(path))return json(res,{error:"not-found"},404);
    res.writeHead(200,{"content-type":mime[extname(path)]||"application/octet-stream"});
    return res.end(readFileSync(path));
  }
  if(u.pathname==="/creator"||u.pathname.startsWith("/creator/")){
    const header={"content-type":"text/html; charset=utf-8","cache-control":"no-store"};
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
}).listen(4178,"127.0.0.1",()=>console.log("ANEVUM_VISUAL_FIXTURE_READY"));
