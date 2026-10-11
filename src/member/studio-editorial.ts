/** Pure Studio editor checks; server independently validates every mutation. */
export type StudioDraft={
 kind:"POST"|"UPDATE"|"AHA";title:string;summary:string;body:string
};
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
