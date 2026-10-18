/**
 * ANEVUM V075 / earned Evolution media.
 * A browser-supplied level or public handle is NEVER an entitlement.
 * All media bytes remain under the Worker ASSETS binding. The apex gateway
 * blocks direct /evolution/*, including old gallery, model and poster paths.
 * Private owner and opted-in public-member reads resolve current XP in D1.
 */
import {progressionReady,readProgression} from './progression.mjs';

const OWN=/^\/api\/v1\/member\/rewards\/levels\/([1-9]|[12][0-9]|30)\/(icon|preview|poster|scene|runtime|height|albedo)$/;
const PUBLIC=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/rewards\/levels\/([1-9]|[12][0-9]|30)\/(icon|preview|poster|scene|runtime|height|albedo)$/;
const HEADERS={
 'cache-control':'private, no-store',
 'x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin',
 'vary':'Cookie'
};
const missing=(req,status=404)=>new Response(req.method==='HEAD'?null:'Not found',{
 status,headers:{...HEADERS,'content-type':'text/plain; charset=utf-8'}
});
export const matchRewardMedia=path=>{
 const owner=OWN.exec(path);
 if(owner)return {level:Number(owner[1]),kind:owner[2],handle:null};
 const other=PUBLIC.exec(path);
 return other?{level:Number(other[2]),kind:other[3],handle:other[1]}:null;
};
const sourceFile=(level,kind)=>{
 const code=String(level).padStart(2,'0');
 const files={
  icon:['level-'+code+'-compact-128.png','image/png'],
  preview:['level-'+code+'-256.webp','image/webp'],
  poster:['level-'+code+'-1024.webp','image/webp'],
  scene:['level-'+code+'-scene.gz','application/gzip'],
  runtime:['mini-runtime.json','application/json'],
  height:['height.png','image/png'],
  albedo:['albedo.webp','image/webp']
 };
 const [name,type]=files[kind];
 return {path:kind==='runtime'?'/evolution/mini-runtime.json':'/evolution/assets/'+name,type};
};
export async function earnedRewardMedia(req,env,user=null,match=matchRewardMedia(new URL(req.url).pathname)){
 if(!match)return missing(req);
 if(!['GET','HEAD'].includes(req.method))return missing(req,405);
 const url=new URL(req.url);
 if(url.search||!env?.MEMBER_DB||!env?.ASSETS||!await progressionReady(env.MEMBER_DB))return missing(req);
 let ownerId;
 try{
  if(match.handle){
   // Public consent is necessary as well as earned level. No hidden profile,
   // opted-out stats, internal account ID, or outstanding private grant leaks.
   const row=await env.MEMBER_DB.prepare(
    "SELECT p.user_id,s.show_stats FROM member_creator_profiles p "+
    "JOIN user u ON u.id=p.user_id "+
    "LEFT JOIN member_space_settings s ON s.user_id=p.user_id "+
    "WHERE p.handle=? AND p.visibility='public' AND u.emailVerified=1"
   ).bind(match.handle).first();
   if(!row||row.show_stats===0)return missing(req);
   ownerId=row.user_id;
  }else{
   if(!user?.id||user.emailVerified!==true)return missing(req,401);
   const exists=await env.MEMBER_DB.prepare('SELECT user_id FROM member_creator_profiles WHERE user_id=?').bind(user.id).first();
   if(!exists)return missing(req);
   ownerId=user.id;
  }
  // The same progression calculation that the member service uses for UI
  // state is run on each request. No client-awarded XP or localStorage.
  const state=await readProgression(env.MEMBER_DB,ownerId);
  if(!Number.isSafeInteger(state.level)||state.level<match.level)return missing(req);
  const original=sourceFile(match.level,match.kind);
  const upstream=new URL(original.path,url.origin);
  const raw=await env.ASSETS.fetch(new Request(upstream,{
   // Runtime metadata requires reading its JSON even for HEAD. The response
   // to the caller still has no body and no content length disclosure.
   method:match.kind==='runtime'?'GET':req.method,
   headers:{Accept:original.type},redirect:'error'
  }));
  if(!raw||raw.status!==200)return missing(req);
  const mime=raw.headers.get('content-type')||'';
  if(!mime.toLowerCase().startsWith(original.type.split(';')[0])&&
   !(match.kind==='scene'&&mime.toLowerCase().includes('octet-stream')))return missing(req);
  const headers=new Headers(HEADERS);
  headers.set('content-type',original.type);
  headers.set('content-disposition','inline');
  if(match.kind==='runtime'){
   // Remove all other unreached specimens' accent colors and direct static
   // texture URLs from the otherwise public V062 runtime manifest.
   const parsed=await raw.json();
   if(parsed.version!=='anevum.mini-native.v062'||
    !Array.isArray(parsed.accents)||parsed.accents.length!==30||
    typeof parsed.vertex!=='string'||typeof parsed.fragment!=='string'||
    !parsed.materials||typeof parsed.materials!=='object')
    return missing(req,503);
   parsed.accents=[parsed.accents[match.level-1]];
   const base=match.handle?
    '/api/v1/members/'+match.handle+'/rewards/levels/'+match.level:
    '/api/v1/member/rewards/levels/'+match.level;
   parsed.height=base+'/height';
   parsed.albedo=base+'/albedo';
   return new Response(req.method==='HEAD'?null:JSON.stringify(parsed),{status:200,headers});
  }
  return new Response(req.method==='HEAD'?null:raw.body,{status:200,headers});
 }catch{
  return missing(req,503);
 }
}
