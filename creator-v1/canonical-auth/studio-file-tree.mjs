// Private W111 Studio file-tree service. Source-only; no auto-migration or publish.
const BASE='/api/v1/member/studio/projects/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const JSON_HEADERS={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const respond=(data,status=200)=>Response.json(data,{status,headers:JSON_HEADERS});
const fail=(status,error)=>respond({error},status);
const fields=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const CTRL=/[\u0000-\u001f\u007f]/;
const nodeOut=r=>({id:r.id,projectId:r.project_id,parentId:r.parent_id,name:r.name,kind:r.kind,
 content:r.kind==='text'?r.content:null,revision:r.revision,deletedAt:r.deleted_at,updatedAt:r.updated_at});
const read=async(db,sql,params=[])=>db.prepare(sql).bind(...params).first();
const list=async(db,sql,params=[])=>(await db.prepare(sql).bind(...params).all()).results;
const write=async(db,sql,params=[])=>db.prepare(sql).bind(...params).run();
const nameOf=s=>{
 if(typeof s!=='string'||s.length>80||s.trim().length<1||s!==s.trim()||
 CTRL.test(s)||/[\\/]/.test(s)||s==='.'||s==='..'||s.endsWith('.')||s.startsWith('.'))throw Error('Invalid file name');
 return s;
};
async function payload(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const data=await req.text();if(data.length>36000)return null;
 try{const value=JSON.parse(data);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}
}
export async function studioFileTree(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_STUDIO_FILE_TREE_V111!=='true'||env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')return fail(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return fail(403,'Verified member required');
 const db=env.MEMBER_DB;if(!db?.prepare)return fail(503,'Studio files unavailable');
 const path=new URL(req.url).pathname,match=path.match(/^\/api\/v1\/member\/studio\/projects\/([0-9a-f-]{36})\/files(?:\/([0-9a-f-]{36})(?:\/(versions))?)?$/);
 if(!match||!UUID.test(match[1])||(match[2]&&!UUID.test(match[2]))||new URL(req.url).search)return fail(404,'Not found');
 const [,projectId,nodeId,sub]=match;
 try{
  const schema=await list(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_studio_file_nodes','member_studio_file_versions')");
  if(schema.length!==2)return fail(503,'Studio file schema unavailable');
  const project=await read(db,'SELECT id,status FROM member_studio_projects WHERE id=? AND user_id=?',[projectId,user.id]);
  if(!project)return fail(404,'Project not found');
  const node=nodeId?await read(db,'SELECT * FROM member_studio_file_nodes WHERE id=? AND project_id=? AND user_id=?',[nodeId,projectId,user.id]):null;
  if(nodeId&&!node)return fail(404,'File not found');
  if(req.method==='GET'){
   if(sub==='versions'){
    const versions=await list(db,'SELECT revision,name,parent_id,content,deleted_at,changed_at FROM member_studio_file_versions WHERE node_id=? AND user_id=? AND project_id=? ORDER BY revision DESC LIMIT 12',[nodeId,user.id,projectId]);
    return respond({versions});
   }
   if(nodeId)return respond({node:nodeOut(node)});
   const nodes=await list(db,'SELECT * FROM member_studio_file_nodes WHERE user_id=? AND project_id=? ORDER BY parent_key,name_key LIMIT 200',[user.id,projectId]);
   return respond({nodes:nodes.map(nodeOut),maxNodes:100,maxContentBytes:32768});
  }
  if(!['draft','changes_requested'].includes(project.status))return fail(409,'Withdraw project from review before editing files');
  const input=await payload(req);if(!input)return fail(400,'Invalid JSON request');
  if(req.method==='POST'&&!nodeId){
   if(!fields(input,['clientRequestId','parentId','name','kind'])||!UUID.test(input.clientRequestId)||!['folder','text'].includes(input.kind)||input.parentId!==null&&!UUID.test(input.parentId))return fail(400,'Invalid file request');
   let name;try{name=nameOf(input.name);}catch(e){return fail(422,e.message);}
   const previous=await read(db,'SELECT * FROM member_studio_file_nodes WHERE project_id=? AND user_id=? AND client_request_id=?',[projectId,user.id,input.clientRequestId]);
   if(previous)return respond({node:nodeOut(previous),replayed:true});
   const parent=input.parentId?await read(db,"SELECT id FROM member_studio_file_nodes WHERE id=? AND user_id=? AND project_id=? AND kind='folder' AND deleted_at IS NULL",[input.parentId,user.id,projectId]):true;
   if(!parent)return fail(409,'Parent folder unavailable');
   const result=await db.prepare('INSERT INTO member_studio_file_nodes(id,project_id,user_id,parent_id,parent_key,name,name_key,kind,content,client_request_id,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,\'\',?,?,? WHERE (SELECT count(*) FROM member_studio_file_nodes WHERE user_id=? AND project_id=?)<100 ON CONFLICT DO NOTHING RETURNING *')
    .bind(crypto.randomUUID(),projectId,user.id,input.parentId,input.parentId||'',name,name.toLowerCase(),input.kind,input.clientRequestId,now,now,user.id,projectId).all();
   if(result.results.length)return respond({node:nodeOut(result.results[0]),replayed:false},201);
   return fail(409,'File limit or name conflict');
  }
  if(!nodeId||sub||req.method!=='PATCH'||!fields(input,['revision','name','parentId','content','deleted']))return fail(405,'Method not allowed');
  if(!Number.isSafeInteger(input.revision)||input.revision<1||typeof input.deleted!=='boolean'||input.parentId!==null&&!UUID.test(input.parentId)||typeof input.content!=='string'||BufferByteLength(input.content)>32768)return fail(422,'Invalid revision or content');
  let name;try{name=nameOf(input.name);}catch(e){return fail(422,e.message);}
  if(node.kind==='folder'&&input.content!=='')return fail(422,'Folders cannot contain source text');
  if(input.parentId===nodeId)return fail(409,'Folder cannot contain itself');
  if(input.parentId){
   const parent=await read(db,"SELECT id FROM member_studio_file_nodes WHERE id=? AND user_id=? AND project_id=? AND kind='folder' AND deleted_at IS NULL",[input.parentId,user.id,projectId]);
   if(!parent)return fail(409,'Parent folder unavailable');
   if(node.kind==='folder'){
    const descendants=await list(db,'WITH RECURSIVE descendants(id) AS (SELECT id FROM member_studio_file_nodes WHERE id=? UNION ALL SELECT n.id FROM member_studio_file_nodes n JOIN descendants d ON n.parent_id=d.id) SELECT id FROM descendants LIMIT 101',[nodeId]);
    if(descendants.some(x=>x.id===input.parentId))return fail(409,'Cannot move a folder into its descendant');
   }
  }
  if(input.deleted&&node.kind==='folder'){
   const children=await read(db,'SELECT id FROM member_studio_file_nodes WHERE parent_id=? AND deleted_at IS NULL LIMIT 1',[nodeId]);
   if(children)return fail(409,'Empty folder before deleting it');
  }
  const result=await db.prepare('UPDATE member_studio_file_nodes SET name=?,name_key=?,parent_id=?,parent_key=?,content=?,deleted_at=?,revision=revision+1,updated_at=? WHERE id=? AND project_id=? AND user_id=? AND revision=? AND deleted_at IS NULL RETURNING *')
   .bind(name,name.toLowerCase(),input.parentId,input.parentId||'',input.content,input.deleted?now:null,now,nodeId,projectId,user.id,input.revision).all();
  return result.results.length?respond({node:nodeOut(result.results[0])}):fail(409,'File changed or was deleted; reload');
 }catch{return fail(503,'Studio file operation unavailable');}
}
function BufferByteLength(text){return new TextEncoder().encode(text).length;}
