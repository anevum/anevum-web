/** In-memory loopback fixtures for the compiled React Discover/gallery checks.
 * Never bundled into a Worker; no real publication, identity, auth or D1 writes. */
export const PACKAGE_DISCOVERY_IDS=Object.freeze({
 game:'5764a892-0526-47b6-953b-4cf6a9053c0f',
 simulation:'6764a892-0526-47b6-953b-4cf6a9053c0f',
 app:'7764a892-0526-47b6-953b-4cf6a9053c0f',
 story:'8764a892-0526-47b6-953b-4cf6a9053c0f',
 duplicate:'9764a892-0526-47b6-953b-4cf6a9053c0f'
});
const projects=[
 [PACKAGE_DISCOVERY_IDS.game,'Signal Drift','game','An offline synthetic browser game about a distant signal.'],
 [PACKAGE_DISCOVERY_IDS.simulation,'Orbital Lab','simulation','An offline synthetic gravity simulation.'],
 [PACKAGE_DISCOVERY_IDS.app,'Task Ledger','app','An offline synthetic planning application.'],
 [PACKAGE_DISCOVERY_IDS.story,'Echo Chronicle','story','An offline synthetic interactive story.'],
 [PACKAGE_DISCOVERY_IDS.duplicate,'Duplicate Package Record','game','The same synthetic release already has a canonical legacy demo link.']
].map(([id,title,category,summary])=>({id,title,category,summary,version:1,cover_url:null}));
const playerPath=id=>'/upload/v3/play/'+id;
function json(res,value,status=200){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
 res.end(JSON.stringify(value));
}
export function createPackageDiscoveryFixture(){
 let mode='disabled';
 const requests=[];
 return {
  legacy(items){
   if(mode==='disabled')return items;
   // Exact canonical URL de-duplication, not matching titles or creator names.
   return items.map((item,index)=>index===0
    ?{...item,demoUrl:'https://anevum.com'+playerPath(PACKAGE_DISCOVERY_IDS.duplicate)}
    :index===4?{...item,freeToUse:false}:item);
  },
  handle(req,res,url){
   if(req.headers.host!=='127.0.0.1:4178')return false;
   const path=url.pathname;
   if(path==='/__package-discovery-fixture'){
    if(req.method!=='GET'){json(res,{error:'Read-only synthetic fixture'},405);return true;}
    const next=url.searchParams.get('mode');
    if(!['published','disabled','unavailable','suspended','empty'].includes(next)){
     json(res,{error:'Invalid synthetic mode'},400);return true;
    }
    mode=next;requests.length=0;
    json(res,{syntheticOnly:true,mode});return true;
   }
   if(path==='/__package-discovery-requests'){
    json(res,{syntheticOnly:true,mode,requests:[...requests]});return true;
   }
   if(path==='/upload/v3/api/v1/packages/projects'||/^\/upload\/v3\/api\/v1\/packages\/creators\/[^/]+\/projects$/.test(path)){
    requests.push({path,method:req.method,hadCookie:Boolean(req.headers.cookie)});
    if(req.method!=='GET'){json(res,{error:'Read-only synthetic fixture'},405);return true;}
    if(mode==='unavailable'){json(res,{error:'Synthetic package outage'},503);return true;}
    if(mode==='disabled'){json(res,{error:'Not found'},404);return true;}
    if(path==='/upload/v3/api/v1/packages/projects'){
     json(res,{projects:mode==='published'?projects:[]});return true;
    }
    if(mode!=='published'||path!=='/upload/v3/api/v1/packages/creators/v091_other/projects'){
     json(res,{error:'Not found'},404);return true;
    }
    json(res,{handle:'v091_other',projects:[{...projects[0],play_url:playerPath(projects[0].id),published_at:1792454400}]});
    return true;
   }
   if(path.startsWith('/upload/v3/play/')){
    if(req.method!=='GET'||mode!=='published'||!projects.some(project=>playerPath(project.id)===path)||url.search){
     json(res,{error:'Not found'},404);return true;
    }
    // A landing marker proves a real navigation to the established route.
    // Package execution itself is covered by the controller/runtime tests.
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end('<!doctype html><html><head><title>Offline synthetic package player</title></head><body><h1 id="synthetic-package-player">OFFLINE SYNTHETIC PACKAGE PLAYER</h1><p>Route acceptance fixture only. No uploaded code is executed.</p></body></html>');
    return true;
   }
   return false;
  }
 };
}
