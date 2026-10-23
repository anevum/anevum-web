// Private W111 Studio file-tree service. Source-only; no auto-migration or publish.
import {boundedText} from './request-body.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const JSON_HEADERS={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const respond=(data,status=200)=>Response.json(data,{status,headers:JSON_HEADERS});
const fail=(status,error)=>respond({error},status);
const fields=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const CTRL=/[\u0000-\u001f\u007f]/;
const nodeOut=(r,withContent=true)=>({id:r.id,projectId:r.project_id,parentId:r.parent_id,name:r.name,kind:r.kind,
 ...(withContent?{content:r.kind==='text'?r.content:null}:{}),revision:r.revision,deletedAt:r.deleted_at,updatedAt:r.updated_at});
const read=async(db,sql,params=[])=>db.prepare(sql).bind(...params).first();
const list=async(db,sql,params=[])=>(await db.prepare(sql).bind(...params).all()).results;
const nameOf=s=>{
 if(typeof s!=='string'||s.length>80||s.trim().length<1||s!==s.trim()||
 CTRL.test(s)||/[\\/]/.test(s)||s==='.'||s==='..'||s.endsWith('.')||s.startsWith('.'))throw Error('Invalid file name');
 return s;
};
async function payload(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const data=await boundedText(req,36000);if(data===null)return null;
 try{const value=JSON.parse(data);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}
}
export async function studioFileTree(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_STUDIO_FILE_TREE_V111!=='true'||env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')return fail(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return fail(403,'Verified member required');
 const db=env.MEMBER_DB;if(!db?.prepare)return fail(503,'Studio files unavailable');
 const url=new URL(req.url),path=url.pathname;
 const match=path.match(/^\/api\/v1\/member\/studio\/projects\/([0-9a-f-]{36})\/files(?:\/(trash|[0-9a-f-]{36})(?:\/(versions|restore))?)?$/);
 if(!match||!UUID.test(match[1])||(match[2]&&match[2]!=='trash'&&!UUID.test(match[2]))||url.search)return fail(404,'Not found');
 const [,projectId,segment,sub]=match;
 const isTrash=segment==='trash',nodeId=isTrash?null:segment;
 try{
  const schema=await list(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_studio_file_nodes','member_studio_file_versions')");
  if(schema.length!==2)return fail(503,'Studio file schema unavailable');
  const project=await read(db,'SELECT id,status FROM member_studio_projects WHERE id=? AND user_id=?',[projectId,user.id]);
  if(!project)return fail(404,'Project not found');
  const node=nodeId?await read(db,'SELECT * FROM member_studio_file_nodes WHERE id=? AND project_id=? AND user_id=?',[nodeId,projectId,user.id]):null;
  if(nodeId&&!node)return fail(404,'File not found');
  if(req.method==='GET'){
   if(sub==='restore')return fail(405,'Method not allowed');
   if(isTrash){
    const trashed=await list(db,'SELECT id,project_id,parent_id,name,kind,revision,deleted_at,updated_at FROM member_studio_file_nodes WHERE user_id=? AND project_id=? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC,id LIMIT 251',[user.id,projectId]);
    return respond({nodes:trashed.map(r=>nodeOut(r,false)),maxRetained:250});
   }
   if(sub==='versions'){
    const versions=await list(db,'SELECT revision,name,parent_id,content,deleted_at,changed_at FROM member_studio_file_versions WHERE node_id=? AND user_id=? AND project_id=? ORDER BY revision DESC LIMIT 12',[nodeId,user.id,projectId]);
    return respond({versions});
   }
   if(nodeId)return respond({node:nodeOut(node)});
   const nodes=await list(db,'SELECT id,project_id,parent_id,name,kind,revision,deleted_at,updated_at FROM member_studio_file_nodes WHERE user_id=? AND project_id=? AND deleted_at IS NULL ORDER BY parent_key,name_key LIMIT 101',[user.id,projectId]);
   return respond({nodes:nodes.map(r=>nodeOut(r,false)),maxNodes:100,maxContentBytes:32768,maxProjectContentBytes:524288});
  }
  if(isTrash)return fail(405,'Method not allowed');
  if(!['draft','changes_requested'].includes(project.status))return fail(409,'Withdraw project from review before editing files');
  const input=await payload(req);if(!input)return fail(400,'Invalid JSON request');
  if(sub==='restore'){
   if(req.method!=='POST'||!node)return fail(405,'Method not allowed');
   if(!fields(input,['revision'])||!Number.isSafeInteger(input.revision)||input.revision<1)return fail(422,'Invalid restore revision');
   if(node.deleted_at===null)return fail(409,'File is already active; reload project files');
   if(node.revision!==input.revision)return fail(409,'Deleted file changed; reload Trash');
   if(node.parent_id){
    const parent=await read(db,"SELECT id FROM member_studio_file_nodes WHERE id=? AND project_id=? AND user_id=? AND kind='folder' AND deleted_at IS NULL",[node.parent_id,projectId,user.id]);
    if(!parent)return fail(409,'Restore the parent folder before this item');
   }
   const duplicate=await read(db,'SELECT id FROM member_studio_file_nodes WHERE project_id=? AND parent_key=? AND name_key=? AND deleted_at IS NULL LIMIT 1',[projectId,node.parent_key,node.name_key]);
   if(duplicate)return fail(409,'An active sibling already uses this name');
   const active=await read(db,'SELECT COUNT(*) AS count,COALESCE(SUM(length(CAST(content AS BLOB))),0) AS bytes FROM member_studio_file_nodes WHERE project_id=? AND user_id=? AND deleted_at IS NULL',[projectId,user.id]);
   if(Number(active?.count||0)>=100)return fail(409,'Active project file limit reached');
   if(Number(active?.bytes||0)+BufferByteLength(node.content)>524288)return fail(413,'Project text limit of 512 KiB reached');
   // All checks must also hold inside the conditional UPDATE to prevent races,
   // including concurrent restoration and changes to the parent/project state.
   const restored=await db.prepare(
    "UPDATE member_studio_file_nodes SET deleted_at=NULL,revision=revision+1,updated_at=?"+
    " WHERE id=? AND project_id=? AND user_id=? AND revision=? AND deleted_at IS NOT NULL"+
    " AND (SELECT status FROM member_studio_projects WHERE id=? AND user_id=?) IN ('draft','changes_requested')"+
    " AND (parent_id IS NULL OR EXISTS(SELECT 1 FROM member_studio_file_nodes p WHERE p.id=member_studio_file_nodes.parent_id AND p.user_id=member_studio_file_nodes.user_id AND p.project_id=member_studio_file_nodes.project_id AND p.kind='folder' AND p.deleted_at IS NULL))"+
    " AND NOT EXISTS(SELECT 1 FROM member_studio_file_nodes sibling WHERE sibling.project_id=member_studio_file_nodes.project_id AND sibling.parent_key=member_studio_file_nodes.parent_key AND sibling.name_key=member_studio_file_nodes.name_key AND sibling.deleted_at IS NULL AND sibling.id<>member_studio_file_nodes.id)"+
    " AND (SELECT COUNT(*) FROM member_studio_file_nodes live WHERE live.user_id=? AND live.project_id=? AND live.deleted_at IS NULL)<100"+
    " AND (SELECT COALESCE(SUM(length(CAST(content AS BLOB))),0) FROM member_studio_file_nodes live WHERE live.user_id=? AND live.project_id=? AND live.deleted_at IS NULL)+length(CAST(member_studio_file_nodes.content AS BLOB))<=524288 RETURNING *")
    .bind(now,nodeId,projectId,user.id,input.revision,projectId,user.id,user.id,projectId,user.id,projectId).all();
   return restored.results.length?respond({node:nodeOut(restored.results[0])}):fail(409,'Restore conflict; reload Trash and project files');
  }
  if(req.method==='POST'&&!nodeId){
   if(!fields(input,['clientRequestId','parentId','name','kind'])||!UUID.test(input.clientRequestId)||!['folder','text'].includes(input.kind)||input.parentId!==null&&!UUID.test(input.parentId))return fail(400,'Invalid file request');
   let name;try{name=nameOf(input.name);}catch(e){return fail(422,e.message);}
   const previous=await read(db,'SELECT * FROM member_studio_file_nodes WHERE project_id=? AND user_id=? AND client_request_id=?',[projectId,user.id,input.clientRequestId]);
   if(previous){
    if(previous.name!==name||previous.kind!==input.kind||previous.parent_id!==input.parentId)
     return fail(409,'This request ID already belongs to a different file creation');
    return respond({node:nodeOut(previous),replayed:true});
   }
   const parent=input.parentId?await read(db,"SELECT id FROM member_studio_file_nodes WHERE id=? AND user_id=? AND project_id=? AND kind='folder' AND deleted_at IS NULL",[input.parentId,user.id,projectId]):true;
   if(!parent)return fail(409,'Parent folder unavailable');
   const result=await db.prepare('INSERT INTO member_studio_file_nodes(id,project_id,user_id,parent_id,parent_key,name,name_key,kind,content,client_request_id,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,\'\',?,?,? WHERE (SELECT status FROM member_studio_projects WHERE id=? AND user_id=?) IN (\'draft\',\'changes_requested\') AND (SELECT count(*) FROM member_studio_file_nodes WHERE user_id=? AND project_id=? AND deleted_at IS NULL)<100 AND (SELECT count(*) FROM member_studio_file_nodes WHERE user_id=? AND project_id=?)<250 ON CONFLICT DO NOTHING RETURNING *')
    .bind(crypto.randomUUID(),projectId,user.id,input.parentId,input.parentId||'',name,name.toLowerCase(),input.kind,input.clientRequestId,now,now,projectId,user.id,user.id,projectId,user.id,projectId).all();
   if(result.results.length)return respond({node:nodeOut(result.results[0]),replayed:false},201);
   return fail(409,'File limit or name conflict');
  }
  if(!nodeId||sub||req.method!=='PATCH'||!fields(input,['revision','name','parentId','content','deleted']))return fail(405,'Method not allowed');
  if(node.deleted_at!==null)return fail(409,'Deleted file cannot be edited; restore it first');
  if(!Number.isSafeInteger(input.revision)||input.revision<1||typeof input.deleted!=='boolean'||input.parentId!==null&&!UUID.test(input.parentId)||typeof input.content!=='string'||BufferByteLength(input.content)>32768)return fail(422,'Invalid revision or content');
  let name;try{name=nameOf(input.name);}catch(e){return fail(422,e.message);}
  if(node.kind==='folder'&&input.content!=='')return fail(422,'Folders cannot contain source text');
  if(input.deleted&&(input.name!==node.name||input.parentId!==node.parent_id||input.content!==node.content))return fail(422,'Delete must preserve the last saved name, parent and content');
  if(input.parentId===nodeId)return fail(409,'Folder cannot contain itself');
  if(input.parentId){
   const parent=await read(db,"SELECT id FROM member_studio_file_nodes WHERE id=? AND user_id=? AND project_id=? AND kind='folder' AND deleted_at IS NULL",[input.parentId,user.id,projectId]);
   if(!parent)return fail(409,'Parent folder unavailable');
   if(node.kind==='folder'){
    const descendants=await list(db,'WITH RECURSIVE descendants(id) AS (SELECT id FROM member_studio_file_nodes WHERE id=? UNION ALL SELECT n.id FROM member_studio_file_nodes n JOIN descendants d ON n.parent_id=d.id) SELECT id FROM descendants LIMIT 101',[nodeId]);
    if(descendants.some(x=>x.id===input.parentId))return fail(409,'Cannot move a folder into its descendant');
   }
  }
  if(!input.deleted){
   const conflict=await read(db,'SELECT id FROM member_studio_file_nodes WHERE project_id=? AND parent_key=? AND name_key=? AND deleted_at IS NULL AND id<>? LIMIT 1',[projectId,input.parentId||'',name.toLowerCase(),nodeId]);
   if(conflict)return fail(409,'A sibling file or folder already uses that name');
  }
  if(input.deleted&&node.kind==='folder'){
   const children=await read(db,'SELECT id FROM member_studio_file_nodes WHERE parent_id=? AND deleted_at IS NULL LIMIT 1',[nodeId]);
   if(children)return fail(409,'Empty folder before deleting it');
  }
  const total=await read(db,'SELECT COALESCE(SUM(length(CAST(content AS BLOB))),0) AS bytes FROM member_studio_file_nodes WHERE project_id=? AND user_id=? AND deleted_at IS NULL',[projectId,user.id]);
  const newSize=BufferByteLength(input.content);
  if(!input.deleted&&Number(total?.bytes||0)-BufferByteLength(node.content)+newSize>524288)return fail(413,'Project text limit of 512 KiB reached');
  const result=await db.prepare('UPDATE member_studio_file_nodes SET name=?,name_key=?,parent_id=?,parent_key=?,content=?,deleted_at=?,revision=revision+1,updated_at=? WHERE id=? AND project_id=? AND user_id=? AND revision=? AND deleted_at IS NULL AND (SELECT status FROM member_studio_projects WHERE id=? AND user_id=?) IN (\'draft\',\'changes_requested\') AND (?=0 OR NOT EXISTS(SELECT 1 FROM member_studio_file_nodes child WHERE child.parent_id=member_studio_file_nodes.id AND child.deleted_at IS NULL)) AND (?=1 OR (SELECT COALESCE(SUM(length(CAST(content AS BLOB))),0) FROM member_studio_file_nodes WHERE project_id=? AND user_id=? AND deleted_at IS NULL)-length(CAST(member_studio_file_nodes.content AS BLOB))+length(CAST(? AS BLOB))<=524288) RETURNING *')
   .bind(name,name.toLowerCase(),input.parentId,input.parentId||'',input.content,input.deleted?now:null,now,nodeId,projectId,user.id,input.revision,projectId,user.id,input.deleted?1:0,input.deleted?1:0,projectId,user.id,input.content).all();
  return result.results.length?respond({node:nodeOut(result.results[0])}):fail(409,'File changed or was deleted; reload');
 }catch{return fail(503,'Studio file operation unavailable');}
}
function BufferByteLength(text){return new TextEncoder().encode(text).length;}
