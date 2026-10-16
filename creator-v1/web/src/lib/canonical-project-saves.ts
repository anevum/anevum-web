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
