// Canonical Better Auth project saves, never the legacy Creator V1 library.
// The server authenticates the user, verifies public publication and enforces
// limits. Do not send member IDs, XP, rating, account roles, or credentials.
export type CanonicalProjectSaveState={available:true;saved:boolean};
export type CanonicalProjectSaveMutation={saved:boolean;changed:boolean};
export class CanonicalProjectSaveError extends Error{
 readonly status:number;
 constructor(status:number,message:string){super(message);this.status=status;this.name="CanonicalProjectSaveError"}
}
const ID=/^[a-f0-9]{32}$/;
function route(projectId:string){
 if(!ID.test(projectId))throw new Error("Invalid published project identifier");
 return "/api/v1/member/project-saves/"+projectId;
}
async function request<T>(id:string,method:"GET"|"PUT"|"DELETE",signal?:AbortSignal):Promise<T>{
 const response=await fetch(route(id),{
  method,credentials:"same-origin",mode:"same-origin",redirect:"error",cache:"no-store",
  headers:{Accept:"application/json"},signal
 });
 if(!response.ok){
  const status=response.status;
  const message=status===401?"Sign in to save this project":
    status===403?"Project saving is not permitted for this account":
    status===404?"This project is not available for saving":
    status===409?"Your saved-project library has reached its limit":
    status===429?"Too many save changes. Try again later":
    "Project saves are temporarily unavailable";
  throw new CanonicalProjectSaveError(status,message);
 }
 if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
  throw new CanonicalProjectSaveError(503,"Project saves response unavailable");
 const data=await response.json() as unknown;
 if(!data||typeof data!=="object"||Array.isArray(data))
  throw new CanonicalProjectSaveError(503,"Invalid project saves response");
 const value=data as Record<string,unknown>;
 if(typeof value.saved!=="boolean"||
    (method==="GET" ? value.available!==true:typeof value.changed!=="boolean"))
  throw new CanonicalProjectSaveError(503,"Invalid project saves response");
 return data as T;
}
export const readCanonicalProjectSave=(id:string,signal?:AbortSignal)=>
 request<CanonicalProjectSaveState>(id,"GET",signal);
export const setCanonicalProjectSaved=(id:string,saved:boolean)=>
 request<CanonicalProjectSaveMutation>(id,saved?"PUT":"DELETE");


/** Public metadata is revalidated by the canonical service against the
 * approved, currently published Creator catalogue. No private save row,
 * email, account ID or hidden project metadata is included in this DTO. */
export interface CanonicalSavedProject{
 id:string;title:string;summary:string;category:string;
 creatorHandle:string;creatorName:string;publishedAt:string|null;savedAt:number;
}
export interface CanonicalSavedProjectsPage{
 items:CanonicalSavedProject[];nextCursor:string|null;
}
const SAVE_CURSOR=/^[A-Za-z0-9_-]{8,160}$/;
const SAVED_CATEGORY=/^(?:tools|games|automation|research|creative|learning|libraries|other)$/;
const SAVED_CREATOR=/^[a-z][a-z0-9_]{2,29}$/;
function validateSavedPage(payload:unknown):CanonicalSavedProjectsPage{
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new CanonicalProjectSaveError(503,"Invalid saved works response");
 const value=payload as Record<string,unknown>;
 if(!Array.isArray(value.items)||value.items.length>24||
  !(value.nextCursor===null||(typeof value.nextCursor==="string"&&SAVE_CURSOR.test(value.nextCursor))))
  throw new CanonicalProjectSaveError(503,"Invalid saved works response");
 const found=new Set<string>();
 for(const raw of value.items){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
   throw new CanonicalProjectSaveError(503,"Invalid saved works response");
  const p=raw as Record<string,unknown>;
  if(typeof p.id!=="string"||!ID.test(p.id)||found.has(p.id)||
    typeof p.title!=="string"||p.title.length<1||p.title.length>100||
    typeof p.summary!=="string"||p.summary.length>280||
    typeof p.category!=="string"||!SAVED_CATEGORY.test(p.category)||
    typeof p.creatorHandle!=="string"||!SAVED_CREATOR.test(p.creatorHandle)||
    typeof p.creatorName!=="string"||p.creatorName.length>80||
    (p.publishedAt!==null&&typeof p.publishedAt!=="string")||
    !Number.isSafeInteger(p.savedAt)||Number(p.savedAt)<=0)
    throw new CanonicalProjectSaveError(503,"Invalid saved works response");
  found.add(p.id);
 }
 return value as unknown as CanonicalSavedProjectsPage;
}
export async function readCanonicalSavedProjects(after?:string,signal?:AbortSignal):Promise<CanonicalSavedProjectsPage>{
 if(after!==undefined&&!SAVE_CURSOR.test(after))throw new Error("Invalid saved works cursor");
 const query=new URLSearchParams({limit:"12"});
 if(after!==undefined)query.set("after",after);
 const response=await fetch("/api/v1/member/project-saves?"+query,{
   method:"GET",credentials:"same-origin",mode:"same-origin",cache:"no-store",
   redirect:"error",headers:{Accept:"application/json"},signal
 });
 if(!response.ok)throw new CanonicalProjectSaveError(response.status,
  response.status===401?"Sign in to view your saved works":
  response.status===404?"Saved works are not active yet":
  "Your private saved works are temporarily unavailable");
 if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
  throw new CanonicalProjectSaveError(503,"Invalid saved works response");
 return validateSavedPage(await response.json());
}
