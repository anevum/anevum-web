/**
 * PARITY V136.019 — Portable static hosting primitives.
 *
 * These functions format untrusted metadata; they do not grant permission to
 * publish, authenticate a caller, copy R2 objects, or register a public route.
 * Authoritative approval and object integrity checks belong to an isolated
 * server-side release controller before these keys could be used in serving.
 *
 * Until a separate release is approved, NO Worker imports or serves this file.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const MiB=1024*1024;
const MAX_FILES=180,MAX_EXPANDED=48*MiB,MAX_ASSET=12*MiB;
const TYPES=Object.freeze({
 html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',
 json:'application/json',wasm:'application/wasm',
 png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',
 avif:'image/avif',woff2:'font/woff2',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',
 txt:'text/plain'
});
const fail=reason=>Object.freeze({ok:false,reason});
const good=value=>Object.freeze({ok:true,...value});

export function staticFilePath(value){
 if(typeof value!=='string'||value.length<1||value.length>240||
    value.startsWith('/')||value.endsWith('/')||value.includes('//')||
    !/^[A-Za-z0-9_./-]+$/.test(value))return null;
 const segments=value.split('/');
 if(segments.length>12||segments.some(s=>s==='.'||s==='..'||s.startsWith('.')||s.length>90))return null;
 // Reject path segments that may resolve to executable server configuration.
 if(segments.some(s=>/^(?:node_modules|\.git|\.well-known|private|secrets)$/i.test(s)))return null;
 return value;
}

export function inspectStaticBundle(files){
 if(!Array.isArray(files)||files.length===0||files.length>MAX_FILES)
  return fail('Invalid static release file count');
 const normalized=[],seen=new Set();let total=0,entry=false;
 for(const file of files){
  if(!file||typeof file!=='object'||Array.isArray(file))return fail('Malformed release file');
  const path=staticFilePath(file.path);
  if(!path)return fail('Unsafe release path');
  const canonical=path.toLowerCase();
  if(seen.has(canonical))return fail('Duplicate or case-colliding release path');
  seen.add(canonical);
  const ext=path.split('.').at(-1).toLowerCase();
  const mime=TYPES[ext];
  if(!mime||file.contentType!==mime)return fail('Unsupported or mismatched static file type');
  const size=file.sizeBytes;
  if(!Number.isSafeInteger(size)||size<1||size>MAX_ASSET)return fail('Invalid static file size');
  if(typeof file.sha256!=='string'||!SHA.test(file.sha256))return fail('Invalid file digest');
  total+=size;
  if(!Number.isSafeInteger(total)||total>MAX_EXPANDED)return fail('Static release exceeds expanded size budget');
  if(path==='index.html')entry=true;
  normalized.push(Object.freeze({path,contentType:mime,sizeBytes:size,sha256:file.sha256}));
 }
 if(!entry)return fail('Missing exact root index.html entrypoint');
 return good({files:Object.freeze(normalized),totalBytes:total,fileCount:normalized.length});
}

/**
 * Immutable, owner-scoped R2 key construction for FUTURE release controllers.
 * "staged" objects MUST NOT be directly publicly routable. "released" keys
 * may be used only after verified server-owned independent approval and
 * copied-object digest reconciliation — the input below is not such evidence.
 */
export function managedObjectKey({ownerId,projectId,releaseId,sha256,path},phase='staged'){
 if(!['staged','released'].includes(phase))throw Error('Unknown storage lifecycle');
 if(!UUID.test(ownerId)||!UUID.test(projectId)||!UUID.test(releaseId)||!SHA.test(sha256))
  throw Error('Invalid immutable release identity');
 const safe=staticFilePath(path);
 if(!safe)throw Error('Unsafe hosted file path');
 return 'hosted-static/v1/'+phase+'/'+ownerId+'/'+projectId+'/'+releaseId+'/'+sha256+'/'+safe;
}

/** Advisory-only quota arithmetic; the existing Worker/D1/R2 reservation is
 * authoritative and must repeat these checks transactionally.
 */
export function calculateHostingHeadroom({
 memberUsedBytes,memberLimitBytes,pilotUsedBytes,pilotLimitBytes,
 projectFileCount,projectFileLimit
}){
 const nums=[memberUsedBytes,memberLimitBytes,pilotUsedBytes,pilotLimitBytes,projectFileCount,projectFileLimit];
 if(nums.some(n=>!Number.isSafeInteger(n)||n<0))return fail('Usage or limit is not trustworthy');
 const memberRemaining=Math.max(0,memberLimitBytes-memberUsedBytes);
 const pilotRemaining=Math.max(0,pilotLimitBytes-pilotUsedBytes);
 const freeSlots=Math.max(0,projectFileLimit-projectFileCount);
 return good({remainingBytes:Math.min(memberRemaining,pilotRemaining),
  remainingFiles:freeSlots,canQueueFile:freeSlots>0&&Math.min(memberRemaining,pilotRemaining)>0});
}

/**
 * Planning-only STANDARD R2 cost estimate in USD, using caller-supplied rates.
 * No claim to forecast other services (Workers/queues/monitoring/moderation).
 * Requests are rounded upward in million-request billing units, as are GB-months.
 */
export function estimateStandardR2Budget({storageGbMonths,writeRequests,readRequests},rates){
 const numbers=[storageGbMonths,writeRequests,readRequests,
   rates?.storagePerGbMonth,rates?.writesPerMillion,rates?.readsPerMillion,
   rates?.includedGbMonths,rates?.includedWrites,rates?.includedReads];
 if(numbers.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0))
  return fail('Missing or invalid cost input');
 const billedGB=Math.max(0,Math.ceil(storageGbMonths-rates.includedGbMonths));
 const billedWrites=Math.max(0,Math.ceil((writeRequests-rates.includedWrites)/1000000));
 const billedReads=Math.max(0,Math.ceil((readRequests-rates.includedReads)/1000000));
 const estimate=billedGB*rates.storagePerGbMonth+
   billedWrites*rates.writesPerMillion+billedReads*rates.readsPerMillion;
 if(!Number.isFinite(estimate))return fail('Cost estimate overflow');
 return good({estimatedStorageAndR2OpsUSD:Math.ceil(estimate*100)/100,
   billedGBMonths:billedGB,billedWriteMillions:billedWrites,billedReadMillions:billedReads,
   excluded:'Workers, queues, caching, abuse, moderation, payment and other provider costs'});
}
