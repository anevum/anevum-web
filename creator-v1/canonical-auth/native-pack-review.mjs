// ANEVUM Native Packs V003 -- text-only, independently gated staff inspection.
// This reads private R2 objects on the Worker ONLY, verifies frozen hashes,
// returns a bounded declarative synopsis and durably audits successful reads.
// It cannot publish, stream, return binary assets, authorize review, or mint XP.
import {MAX_PACK_BYTES} from '../web/src/lib/anevum-native-pack.ts';
import {NATIVE_PACK_MIME,isNativePackForCategory,readValidatedNativePack} from './native-pack-quarantine.mjs';

const HEX=/^[a-f0-9]{32}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const error=(status,message)=>Object.assign(new Error(message),{status});
const clip=(value,n=140)=>String(value??'')
 .replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');

async function boundedObjectBody(object,declared){
 if(!Number.isSafeInteger(declared)||declared<1||declared>MAX_PACK_BYTES||
  Number(object?.size)!==declared||!object.body?.getReader)
  throw error(503,'Private package storage is unavailable');
 const reader=object.body.getReader(),chunks=[];
 let count=0;
 try{
  for(;;){
   const chunk=await reader.read();
   if(chunk.done)break;
   if(!(chunk.value instanceof Uint8Array))throw Error('Invalid binary chunk');
   count+=chunk.value.byteLength;
   if(count>declared){await reader.cancel();throw Error('Private package size mismatch');}
   chunks.push(chunk.value);
  }
 }finally{reader.releaseLock();}
 if(count!==declared)throw error(409,'Private package changed after submission');
 const bytes=new Uint8Array(count);let offset=0;
 for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
 return bytes;
}
export async function nativeInspectionSchemaReady(db){
 try{
  const row=await db.prepare(
   "SELECT name FROM sqlite_master WHERE type='table' AND name='member_studio_native_inspections'"
  ).first();
  return row?.name==='member_studio_native_inspections';
 }catch{return false;}
}
export function summarizeNativeDocument(manifest,document,assetCount){
 const summary={
  kind:manifest.kind,title:clip(manifest.title,120),
  creditedCreator:clip(manifest.creator,120),version:clip(manifest.version,20),
  itemCount:0,assetCount,
  items:[],note:'Text metadata only. No media access, scanning, publisher verification, approval or public release.'
 };
 let rows=[];
 switch(manifest.kind){
  case 'game':
   rows=document.scenes.map(s=>({
    label:clip(s.title,120),
    detail:clip(s.text,180),
    choices:s.choices.length,
    hasImage:Boolean(s.background)
   }));
   break;
  case 'album':
   rows=document.tracks.map(t=>({label:clip(t.title,120)}));
   summary.hasCover=Boolean(document.cover);
   break;
  case 'series':
   rows=document.episodes.map(e=>({label:clip(e.title,120)}));
   summary.hasPoster=Boolean(document.poster);
   break;
  case 'visual':
   rows=document.pages.map((p,i)=>({label:'Artwork '+(i+1),detail:clip(p.caption,180)}));
   break;
  case 'project':
   rows=document.blocks.map(b=>({label:clip(b.type,40),detail:clip(b.text,180)}));
   break;
  default:throw error(422,'Unknown private native package');
 }
 summary.itemCount=rows.length;
 // ValidateNativeDocument currently bounds each type to <=64 items.
 summary.items=rows.slice(0,64);
 return summary;
}
/**
 * Called only behind canonicalStudioReview's independent, verified staff gate.
 * The SQL also checks reviewer != owner, exact frozen revision and live asset.
 */
export async function inspectFrozenNativeSummary(db,store,projectId,assetId,reviewerId,now){
 if(!HEX.test(assetId))throw error(404,'Native attachment not found');
 if(!Number.isSafeInteger(now)||now<1||typeof reviewerId!=='string'||!reviewerId)
  throw error(403,'Independent reviewer required');
 if(!await nativeInspectionSchemaReady(db))
  throw error(503,'Private inspection audit schema is not installed');
 if(!store?.get)throw error(503,'Private storage is not connected');
 const recent=await db.prepare(
  'SELECT COUNT(*) AS n FROM member_studio_native_inspections WHERE reviewer_id=? AND created_at>=?'
 ).bind(reviewerId,now-3600).first();
 if(Number(recent?.n||0)>=30)throw error(429,'Private inspection rate limit reached');
 const row=await db.prepare(
  'SELECT s.id AS submission_id,s.category,s.project_revision,s.user_id AS owner_id,'+
  'a.id AS asset_id,a.storage_key,a.status,a.sha256 AS live_sha,a.size_bytes AS live_size,'+
  'a.filename AS live_name,a.content_type AS live_type,'+
  'snap.filename,snap.sha256,snap.size_bytes,snap.content_type '+
  'FROM member_studio_submissions s '+
  'JOIN member_studio_projects p ON p.id=s.project_id AND p.user_id=s.user_id '+
  'AND p.revision=s.project_revision AND p.status=\'pending_review\' '+
  'JOIN member_studio_submission_assets snap ON snap.submission_id=s.id '+
  'JOIN member_studio_assets a ON a.id=snap.asset_id AND a.project_id=p.id AND a.user_id=s.user_id '+
  'WHERE s.project_id=? AND snap.asset_id=? AND s.status=\'pending_review\' AND s.user_id<>? LIMIT 1'
 ).bind(projectId,assetId,reviewerId).first();
 if(!row||!isNativePackForCategory(row.filename,row.category)||
    row.content_type!==NATIVE_PACK_MIME)
  throw error(404,'Native attachment not available for inspection');
 if(row.status!=='quarantined'||row.live_name!==row.filename||
    row.live_type!==row.content_type||Number(row.live_size)!==Number(row.size_bytes)||
    !DIGEST.test(String(row.sha256))||row.live_sha!==row.sha256)
  throw error(409,'Frozen private attachment no longer matches review receipt');
 // Atomically reserve and audit an attempt BEFORE any potentially expensive
 // R2 read. Failed checksum/format reads still consume quota and leave an audit.
 // The database query rechecks the immutable snapshot and prevents cap races.
 const auditId=crypto.randomUUID();
 const attempt=await db.prepare(
  'INSERT INTO member_studio_native_inspections '+
  '(id,submission_id,project_id,reviewer_id,asset_id,sha256,action,created_at) '+
  "SELECT ?,s.id,p.id,?,a.id,?,'attempt_text_summary',? "+
  'FROM member_studio_submissions s '+
  'JOIN member_studio_projects p ON p.id=s.project_id AND p.user_id=s.user_id '+
  "AND p.revision=s.project_revision AND p.status='pending_review' "+
  'JOIN member_studio_submission_assets snap ON snap.submission_id=s.id '+
  'JOIN member_studio_assets a ON a.id=snap.asset_id AND a.project_id=p.id AND a.user_id=s.user_id '+
  "WHERE s.id=? AND s.project_id=? AND snap.asset_id=? AND s.status='pending_review' "+
  "AND s.user_id<>? AND a.status='quarantined' AND a.sha256=? AND snap.sha256=? "+
  'AND a.size_bytes=snap.size_bytes AND a.filename=snap.filename '+
  'AND a.content_type=snap.content_type '+
  'AND (SELECT COUNT(*) FROM member_studio_native_inspections WHERE reviewer_id=? AND created_at>=?)<30 RETURNING id'
 ).bind(auditId,reviewerId,row.sha256,now,
  row.submission_id,projectId,assetId,reviewerId,row.sha256,row.sha256,
  reviewerId,now-3600).first();
 if(!attempt?.id){
  const after=await db.prepare(
   'SELECT COUNT(*) AS n FROM member_studio_native_inspections WHERE reviewer_id=? AND created_at>=?'
  ).bind(reviewerId,now-3600).first();
  throw Number(after?.n||0)>=30?error(429,'Private inspection rate limit reached'):
   error(409,'Private submission changed before inspection');
 }
 let object;
 try{object=await store.get(row.storage_key);}
 catch{throw error(503,'Private package storage is unavailable');}
 let bytes;
 try{bytes=await boundedObjectBody(object,Number(row.size_bytes));}
 catch(e){if(typeof e.status==='number')throw e;throw error(503,'Private package could not be read');}
 const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
 if(digest!==row.sha256)throw error(409,'Private package checksum no longer matches review receipt');
 let opened;
 try{opened=await readValidatedNativePack(row.filename,bytes,row.category);}
 catch{throw error(409,'Private native package no longer validates');}
 const summary=summarizeNativeDocument(opened.manifest,opened.document,opened.assets.size);
 // Transition the recorded attempt to success ONLY if the exact frozen
 // submission remains current. A concurrent withdrawal preserves the attempt.
 const completed=await db.prepare(
  "UPDATE member_studio_native_inspections SET action='view_text_summary' "+
  "WHERE id=? AND reviewer_id=? AND action='attempt_text_summary' AND EXISTS ("+
  'SELECT 1 FROM member_studio_submissions s '+
  'JOIN member_studio_projects p ON p.id=s.project_id AND p.user_id=s.user_id '+
  "AND p.revision=s.project_revision AND p.status='pending_review' "+
  'JOIN member_studio_submission_assets snap ON snap.submission_id=s.id '+
  'JOIN member_studio_assets a ON a.id=snap.asset_id AND a.project_id=p.id AND a.user_id=s.user_id '+
  "WHERE s.id=? AND s.project_id=? AND snap.asset_id=? AND s.status='pending_review' "+
  "AND s.user_id<>? AND a.status='quarantined' AND a.sha256=? AND snap.sha256=? "+
  'AND a.size_bytes=snap.size_bytes AND a.filename=snap.filename '+
  'AND a.content_type=snap.content_type) RETURNING id'
 ).bind(auditId,reviewerId,row.submission_id,projectId,assetId,
  reviewerId,digest,digest).first();
 if(!completed?.id)throw error(409,'Private review changed before successful inspection');
 return {projectId,revision:Number(row.project_revision),assetId,
  summary,note:summary.note};
}
