/* ANEVUM PACKAGE V004 — resource and retention policy; no secrets. */
export const MiB = 1048576;
export const POLICY = Object.freeze({
  multipartBytes: 22*MiB,
  maxArchiveBytes: 20*MiB,
  memberArchiveBytes: 100*MiB,
  memberPhysicalBytes: 200*MiB,
  pilotPhysicalBytes: 512*MiB,
  hourlyAttempts: 10,
  dailyAttempts: 30,
  dailyArchiveBytes: 300*MiB,
  leaseSeconds: 20*60,
  testSeconds: 48*3600,
  rejectedSeconds: 7*86400,
  historySeconds: 30*86400,
  cleanupBatch: 6,
  orphanBatch: 4
});
export class ResourceError extends Error {
  constructor(message,status=422){super(message);this.name="ResourceError";this.status=status;}
}
export function physicalBytes(archiveBytes,expandedBytes){
  const a=Number(archiveBytes),b=Number(expandedBytes);
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<0)
    throw new ResourceError("Invalid package size",422);
  return a+b;
}
export function isDuplicate({wantedSha,existingSha,existingSize,expectedSize,status}){
  return /^[a-f0-9]{64}$/.test(wantedSha||"") && wantedSha===existingSha &&
    existingSize===expectedSize && ["ready","published"].includes(status);
}
export function testExpired(release,retention,now,activeReleaseId) {
  return release?.status==="ready" && retention?.mode==="test" &&
    Number.isFinite(retention.expires_at) && retention.expires_at<=now &&
    activeReleaseId===release.id;
}
export function quotaFits({memberArchive=0,memberPhysical=0,pilotPhysical=0,archive=0,physical=0}){
  for(const n of [memberArchive,memberPhysical,pilotPhysical,archive,physical])
    if(!Number.isSafeInteger(n)||n<0)return false;
  return memberArchive+archive<=POLICY.memberArchiveBytes &&
    memberPhysical+physical<=POLICY.memberPhysicalBytes &&
    pilotPhysical+physical<=POLICY.pilotPhysicalBytes;
}
export function sourcePrefix(sourceKey){
  const match=String(sourceKey||"").match(/^(package-alpha\/v00[34]\/[^/]+\/[0-9a-f-]{36}\/[0-9a-f-]{36})\/source\/[^/]+$/);
  if(!match)throw new ResourceError("Invalid package storage prefix",500);
  return match[1]+"/";
}
export async function readBoundedMultipart(req){
  const ct=req.headers.get("content-type")||"";
  if(!ct.startsWith("multipart/form-data;"))throw new ResourceError("A multipart file is required",415);
  const header=req.headers.get("content-length");
  if(header!==null&&(!/^\d+$/.test(header)||Number(header)>POLICY.multipartBytes))
    throw new ResourceError("The upload exceeds 22 MiB including form data",413);
  if(!req.body)throw new ResourceError("Empty upload body",400);
  const reader=req.body.getReader(),parts=[];let received=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      received+=value?.byteLength||0;
      if(received>POLICY.multipartBytes){
        await reader.cancel().catch(()=>{});
        throw new ResourceError("The upload exceeds 22 MiB including form data",413);
      }
      parts.push(value);
    }
  }finally{reader.releaseLock();}
  try{
    return await new Request(req.url,{method:"POST",headers:{"content-type":ct},
      body:new Blob(parts)}).formData();
  }catch{throw new ResourceError("Invalid multipart upload",400);}
}
