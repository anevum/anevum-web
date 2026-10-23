/**
 * Offline, read-only comparison of two canonical member SQLite snapshots.
 * Equal data and distinct files do NOT prove independently sourced backup,
 * encryption, or operator authorization. No Cloudflare access or backup creation.
 *
 * Run ONLY on separately stored local snapshots handled by an authorized
 * operator. Do not upload either database to CI or GitHub.
 */
import {createHash} from 'node:crypto';
import {realpathSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const REQUIRED_TABLES=[
 'canonical_identity_manifest','user','session','account',
 'member_creator_profiles','member_studio_projects',
 'member_space_milestones','member_reward_notifications'
];
const UNMIGRATED_TABLES=['member_studio_file_nodes','member_studio_file_versions'];
const hash=text=>createHash('sha256').update(text).digest('hex');
const fail=code=>{throw new Error(code);};
const quote=name=>'"'+name.replaceAll('"','""')+'"';

function snapshot(db){
 db.exec('PRAGMA query_only=ON');
 const checks=db.prepare('PRAGMA integrity_check').all();
 if(checks.length!==1||checks[0].integrity_check!=='ok')fail('INTEGRITY_CHECK_FAILED');
 if(db.prepare('PRAGMA foreign_key_check').all().length)fail('FOREIGN_KEY_CHECK_FAILED');
 const schema=db.prepare(
  "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name"
 ).all();
 const tableNames=db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all().map(r=>r.name);
 for(const name of REQUIRED_TABLES)if(!tableNames.includes(name))fail('REQUIRED_SCHEMA_MISSING');
 if(UNMIGRATED_TABLES.some(name=>tableNames.includes(name)))fail('V111_MIGRATION_ALREADY_PRESENT');
 if(db.prepare('SELECT COUNT(*) AS n FROM "user"').get().n===0)fail('NO_MEMBER_ROWS');
 const rowDigests=new Map();
 for(const name of tableNames){
  if(name.startsWith('sqlite_')&&name!=='sqlite_sequence')continue;
  const hashes=[];
  for(const row of db.prepare('SELECT * FROM '+quote(name)).iterate()){
   // Digest rows in memory only; do not output identifiers, content, or hashes.
   const canonical=Object.entries(row).map(([k,v])=>[k,v===null?['null']:
    v instanceof Uint8Array?['blob',Buffer.from(v).toString('base64')]:
    typeof v==='bigint'?['bigint',v.toString()]:[typeof v,v]]);
   hashes.push(hash(JSON.stringify(canonical)));
  }
  hashes.sort();
  rowDigests.set(name,hash(JSON.stringify(hashes)));
 }
 return {schemaDigest:hash(JSON.stringify(schema)),rowDigests};
}

export function verifyOfflineStudioSnapshotPair(baselineFile,restoredFile){
 let a,b,source,destination;
 try{
  a=realpathSync(baselineFile);b=realpathSync(restoredFile);
  const first=statSync(a),second=statSync(b);
  if(!first.isFile()||!second.isFile()||!first.size||!second.size)fail('INPUT_FILE_INVALID');
  if(a===b||(first.dev===second.dev&&first.ino===second.ino))fail('SAME_FILE_DISALLOWED');
 }catch(e){if(e.message==='SAME_FILE_DISALLOWED')throw e;fail('INPUT_FILE_INVALID');}
 try{
  source=new DatabaseSync(a,{readOnly:true});
  destination=new DatabaseSync(b,{readOnly:true});
  const original=snapshot(source),restored=snapshot(destination);
  if(original.schemaDigest!==restored.schemaDigest)fail('SCHEMA_MISMATCH');
  if(original.rowDigests.size!==restored.rowDigests.size)fail('TABLE_INVENTORY_MISMATCH');
  for(const [table,digest] of original.rowDigests){
   if(restored.rowDigests.get(table)!==digest)fail('DATA_PRESERVATION_MISMATCH');
  }
  return Object.freeze({status:'PASS',distinctLocalFiles:true,readOnly:true,
   preMigration:true,privateRowsDisclosed:false});
 }finally{source?.close();destination?.close();}
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===realpathSync(process.argv[1])){
 try{
  if(process.argv.length!==4)fail('EXPECTED_TWO_LOCAL_SQLITE_FILE_ARGUMENTS');
  verifyOfflineStudioSnapshotPair(process.argv[2],process.argv[3]);
  console.log('LOCAL_SQLITE_SNAPSHOT_PAIR_MATCH');
 }catch(e){
  // Error labels are controlled constants: never disclose paths, member rows,
  // identifiers, secrets, SQL or the captured database's contents.
  const safe=new Set(['SAME_FILE_DISALLOWED','INPUT_FILE_INVALID',
   'EXPECTED_TWO_LOCAL_SQLITE_FILE_ARGUMENTS','INTEGRITY_CHECK_FAILED',
   'FOREIGN_KEY_CHECK_FAILED','REQUIRED_SCHEMA_MISSING',
   'V111_MIGRATION_ALREADY_PRESENT','NO_MEMBER_ROWS','SCHEMA_MISMATCH',
   'TABLE_INVENTORY_MISMATCH','DATA_PRESERVATION_MISMATCH']);
  console.error(safe.has(e.message)?e.message:'LOCAL_RESTORE_VERIFICATION_FAILED');
  process.exitCode=1;
 }
}
