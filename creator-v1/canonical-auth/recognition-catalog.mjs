// V069: public *availability*, never member achievement inventory.
// This does not issue grants, reveal user IDs, XP or award evidence.
import {recognitionReady} from './recognition.mjs';
import {progressionReady} from './progression.mjs';
const headers={
 'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store',
 'x-content-type-options':'nosniff',
 'cross-origin-resource-policy':'same-origin'
};
const milestones=Object.freeze(['first_signal','world_shaper']);
const independentlyModerated=Object.freeze(['first_orbit','first_thread','first_reply','conversationalist']);
export async function canonicalRecognitionCatalog(request,env){
 if(request.method!=='GET'&&request.method!=='HEAD')
  return Response.json({error:'Read-only endpoint'},{status:405,headers});
 if(new URL(request.url).search)return Response.json({error:'Unexpected query'},{status:400,headers});
 let active=[];
 try{
  if(env?.MEMBER_DB&&await progressionReady(env.MEMBER_DB))
   active=[...milestones];
  if(env?.CANONICAL_RECOGNITION_ENABLED==='true'&&env.MEMBER_DB&&
    await recognitionReady(env.MEMBER_DB))
   active=[...active,...independentlyModerated];
 }catch{
  return Response.json({error:'Catalog verification unavailable'},{status:503,headers});
 }
 // Never claim that a definition has been awarded to an account. Distinctions
 // stay planned until a reviewed issuance workflow has been established.
 const body={version:1,activeBadgeIds:active,activeRibbonIds:[],activeMedalIds:[]};
 return new Response(request.method==='HEAD'?null:JSON.stringify(body),{status:200,headers});
}
