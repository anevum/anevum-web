/** Native presentation adapter for the existing V003 controller.
 * No new identity, database, review authority, upload pipeline or public bucket.
 * Helpers are injected by api.mjs so the native and retained interfaces use
 * exactly the same canonical session and project permission checks.
 */
import {mintPreview} from './tokens.mjs';
import {COVER_PATH} from './cover.mjs';
import {getStorageUsage,resourcePolicyReady} from './resource-service.mjs';
const PREFIX='/api/v1/packages/native/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const positive=n=>Number.isSafeInteger(Number(n))&&Number(n)>0?Number(n):null;
const safeId=id=>typeof id==='string'&&UUID.test(id)?id:null;
const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
const response=(body,status=200)=>Response.json(body,{status,headers:{
 'cache-control':'private, no-store','vary':'Cookie','referrer-policy':'no-referrer',
 'x-content-type-options':'nosniff','x-robots-tag':'noindex',
 'content-security-policy':"default-src 'none'; frame-ancestors 'none'"
}});
const error=(status,message)=>response({error:message},status);
function coverURL(id){return safeId(id)?'/upload/v3/api/v1/packages/covers/'+id:null;}
export function nativeProjectRecord(p,privateFields=false){
 const result={id:safeId(p.id),title:text(p.title,100),summary:text(p.summary,500),
  category:text(p.category,40),status:text(p.status,40),version:positive(p.release_version),
  updatedAt:positive(p.updated_at),publishedAt:positive(p.published_at),
  coverUrl:coverURL(p.cover_release_id),
  liveReleaseId:safeId(p.live_release_id)};
 if(privateFields)Object.assign(result,{
  draftReleaseId:safeId(p.draft_release_id),draftStatus:text(p.draft_status,40)||null,
  draftTitle:text(p.draft_title,100)||null,draftSummary:text(p.draft_summary,500)||null,
  draftCategory:text(p.draft_category,40)||null,
  retention:['test','saved'].includes(p.draft_mode)?p.draft_mode:null,
  expiresAt:positive(p.draft_expires_at),reviewReason:text(p.review_reason,1000)||null
 });
 return result;
}
export async function nativeStudioApi(req,env,h){
 const url=new URL(req.url),path=url.pathname;
 if(!path.startsWith(PREFIX))return null;
 if(env.PACKAGE_NATIVE_STUDIO_ENABLED!=='true')return error(404,'Native Creator Studio is not active in this environment.');
 if(req.method!=='GET')return error(405,'This presentation endpoint is read-only.');
 if(url.origin!=='https://anevum.com'||url.username||url.password||path.includes('%')||path.includes('\\'))return error(404,'Not found');
 const resource=path.slice(PREFIX.length);
 if(url.search&&!(resource.startsWith('projects/')&&url.search==='?preview=1'))return error(400,'Unexpected request parameters.');
 const isProject=resource.startsWith('projects/');
 if(!['session','mine','review'].includes(resource)&&!isProject)return error(404,'Not found');
 const id=isProject?resource.slice('projects/'.length):null;
 if(isProject&&!safeId(id))return error(404,'Project unavailable.');
 // No caller-supplied owner or reviewer ID is accepted. The shared controller
 // resolves its real canonical session through the AUTH service binding.
 const user=await h.member(req,env);
 const canUpload=!!user&&h.pilot(env,user.id),canReview=!!user&&h.staff(env,user.id);
 if(!isProject&&!user)return error(401,'Sign in with your existing ANEVUM account.');
 if(resource==='session')return response({contract:'native-creator-v095',memberId:user.id,
  canUpload,canReview,resourceProtection:env.PACKAGE_RESOURCE_PROTECTION_ENABLED==='true'});
 if(resource==='mine'){
  if(!canUpload)return error(403,'Playable uploads are limited to approved pilot creators.');
  const protectedMode=env.PACKAGE_RESOURCE_PROTECTION_ENABLED==='true';
  const ready=protectedMode&&await resourcePolicyReady(env.DB);
  if(protectedMode&&!ready)return error(503,'Private-build storage checks are unavailable.');
  const projects=await h.ownerList(env.DB,user.id,ready);
  return response({contract:'native-creator-v095',memberId:user.id,
   projects:projects.map(p=>nativeProjectRecord(p,true)),
   usage:ready?await getStorageUsage(env.DB,user.id):null});
 }
 if(resource==='review'){
  if(!canReview)return error(403,'An independently authorized package reviewer is required.');
  const [pending,moderation]=await Promise.all([h.reviewList(env.DB),h.moderationList(env.DB)]);
  return response({contract:'native-creator-v095',memberId:user.id,
   pending:pending.map(p=>nativeProjectRecord(p,true)),
   moderation:moderation.map(p=>nativeProjectRecord(p,true))});
 }
 const p=await h.getProject(env.DB,id);
 if(!p||p.status==='suspended')return error(404,'Project unavailable.');
 const preview=url.search==='?preview=1';
 let release;
 if(preview){
  if(!user||(p.owner_id!==user.id&&!canReview))return error(404,'Project unavailable.');
  release=await h.getDraft(env.DB,p);
  if(!release||!['ready','pending_review'].includes(release.status))return error(404,'No playable private revision is available.');
  if(env.PACKAGE_RESOURCE_PROTECTION_ENABLED==='true'&&release.status==='ready'&&await h.expiredDraft(env,release.id))return error(410,'This private test has expired. Return to your Studio.');
 }else{
  if(p.status!=='published'||!p.live_release_id)return error(404,'Project unavailable.');
  release=await env.DB.prepare("SELECT * FROM anevum_package_releases WHERE id=? AND project_id=? AND status='published'").bind(p.live_release_id,p.id).first();
  if(!release)return error(404,'Project unavailable.');
 }
 const host=h.isolatedHost(env);
 if(!host)return error(503,'The isolated player is not configured.');
 const entry=await env.DB.prepare("SELECT object_key,bytes,sha256 FROM anevum_package_files WHERE release_id=? AND path='index.html'").bind(release.id).first();
 const object=entry?await env.MEDIA.head(entry.object_key):null;
 if(!object||object.size!==entry.bytes||object.customMetadata?.sha256!==entry.sha256)return error(503,'This build is temporarily unavailable. Its public release has not changed.');
 const cover=await env.DB.prepare('SELECT release_id FROM anevum_package_files WHERE release_id=? AND path=?').bind(release.id,COVER_PATH).first();
 const token=preview?await mintPreview(env.DB,release.id,user.id):null;
 const record=nativeProjectRecord({...p,
  title:preview?release.proposed_title:p.title,summary:preview?release.proposed_summary:p.summary,
  category:preview?release.proposed_category:p.category,
  release_version:release.version,cover_release_id:cover?.release_id,
  draft_status:preview?release.status:null},preview);
 return response({contract:'native-creator-v095',memberId:preview?user.id:null,project:record,preview,
  release:{id:release.id,version:release.version,status:release.status,
   fileCount:release.file_count,expandedBytes:release.expanded_bytes,
   archiveSha256:preview?release.archive_sha256:null},
  canEdit:preview&&!!user&&p.owner_id===user.id&&canUpload,
  canReview:preview&&canReview&&p.owner_id!==user.id&&release.status==='pending_review',
  runtimeUrl:'https://'+host+(preview?'/p/'+release.id+'/'+token:'/r/'+release.id)+'/index.html',
  expiresAt:preview?Math.floor(Date.now()/1000)+900:null});
}
