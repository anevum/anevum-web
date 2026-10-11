/** Pure Studio editor checks; server independently validates every mutation. */
export type StudioDraft={
 kind:"POST"|"UPDATE"|"AHA";title:string;summary:string;body:string
};
export type StudioSavedEntry=StudioDraft&{
 id:string;slug:string;status:"DRAFT"|"PUBLISHED"|"ARCHIVED";revision:number;
 createdAt:number;updatedAt:number;publishedAt:number|null
};
export type StudioAction="CREATE"|"EDIT"|"PUBLISH"|"UNPUBLISH"|"ARCHIVE";
export function studioDraftDirty(
 entry:StudioDraft|null, draft:StudioDraft
):boolean {
 if(!entry)return draft.kind!=="UPDATE"||Boolean(draft.title.trim()||draft.summary.trim()||draft.body.trim());
 return entry.kind!==draft.kind || entry.title!==draft.title ||
  entry.summary!==draft.summary || entry.body!==draft.body;
}
export function studioDraftProblem(draft:StudioDraft):string|null {
 if(!["POST","UPDATE","AHA"].includes(draft.kind))return "Choose a recognized publication type.";
 for(const [key,value,min,max] of [
  ["title",draft.title,5,120],["summary",draft.summary,15,280],["body",draft.body,20,12000]
 ] as const){
  const text=value.trim();
  if(text.length<min||text.length>max)return "The "+key+" must contain "+min+"–"+max+" characters.";
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
   return "Remove invalid control characters from the "+key+".";
 }
 return null;
}
export function studioSameSavedRevision(a:StudioSavedEntry,b:StudioSavedEntry):boolean {
 return (["id","slug","kind","title","summary","body","status","revision",
  "createdAt","updatedAt","publishedAt"] as const).every(key=>a[key]===b[key]);
}
export function studioMutationMatches(
 entry:StudioSavedEntry,action:StudioAction,current:StudioSavedEntry|null,draft:StudioDraft
):boolean {
 const state={CREATE:"DRAFT",EDIT:"DRAFT",PUBLISH:"PUBLISHED",UNPUBLISH:"DRAFT",ARCHIVE:"ARCHIVED"} as const;
 if(entry.status!==state[action]||!Number.isSafeInteger(entry.createdAt)||entry.createdAt<0||
  !Number.isSafeInteger(entry.updatedAt)||entry.updatedAt<entry.createdAt)return false;
 if(action==="CREATE"){
  if(current||entry.revision!==1||entry.createdAt!==entry.updatedAt)return false;
 }else{
  if(!current||entry.id!==current.id||entry.slug!==current.slug||
   entry.createdAt!==current.createdAt||entry.revision!==current.revision+1||
   entry.updatedAt<current.updatedAt)return false;
  const before=action==="UNPUBLISH"?"PUBLISHED":"DRAFT";
  if(current.status!==before)return false;
 }
 if(action==="PUBLISH"?entry.publishedAt!==entry.updatedAt:entry.publishedAt!==null)return false;
 const expected=action==="CREATE"||action==="EDIT"
  ? {kind:draft.kind,title:draft.title.trim(),summary:draft.summary.trim(),body:draft.body.trim()}
  : current;
 return !!expected&&(["kind","title","summary","body"] as const).every(key=>entry[key]===expected[key]);
}
export function studioPublicStateMatches(
 action:"PUBLISH"|"UNPUBLISH",status:number,data:unknown,entry:StudioSavedEntry
):boolean {
 if(!data||typeof data!=="object"||Array.isArray(data))return false;
 const response=data as Record<string,unknown>;
 if(action==="UNPUBLISH")return status===404&&response.message==="Publication not found.";
 if(status!==200||response.schemaVersion!=="anevum.studio.v1"||!response.entry||
  typeof response.entry!=="object"||Array.isArray(response.entry))return false;
 const publication=response.entry as Record<string,unknown>;
 return (["slug","kind","title","summary","body","publishedAt"] as const)
  .every(key=>publication[key]===entry[key]);
}
