// Staging-only member API client. No standalone auth, cookies, storage or cross-origin fetch.
// These endpoints are served exclusively by the existing next.anevum.com member Worker.
// Production and worker.dev without a same-origin member Worker fail closed.
export const MEMBER_ROOT="/api/v1/member";

export interface MemberHealth { service:string; status:string; signupEnabled:boolean }
export interface MemberIdentity { id:string; email:string; handle:string|null; displayName:string|null; bio:string }
export interface MemberProject {
  id:string; slug:string; title:string; summary:string; description:string; category:string;
  freeToUse:boolean; sourceUrl:string|null; demoUrl:string|null; license:string|null;
  aiDisclosure:string; humanContribution:string; status:string; revision:number;
  publishedAt:string|null; updatedAt:string|null;
}
export interface ProjectDraft {
  slug:string; title:string; summary:string; description:string; category:string;
  freeToUse:boolean; sourceUrl:string|null; demoUrl:string|null;
  license:string|null; aiDisclosure:string; humanContribution:string;
}
export interface Progression {
  xp:number; level:number; maxLevel:number|null; artifact:string|null; artifactEarned:boolean;
  levelStartXp:number; nextLevelXp:number|null; progressWithinLevel:number;
}
export interface SavedProject {
  id:string; slug:string|null; title:string; summary:string; category:string;
  creatorHandle:string; sourceUrl:string|null; demoUrl:string|null; publishedAt:string|null; savedAt:string;
}
export interface MemberRating {
  votes:number; average:number|null; myVote:{score:number;revision:number}|null;
}
export interface MemberProfile {
  handle:string; displayName:string; bio:string; joinedAt:string;
}
export interface MemberAchievement {
  key:string; name:string; description:string; symbol:string;
  earned:boolean; progress:number; target:number;
}

export class MemberApiError extends Error {
  readonly status:number;
  constructor(status:number, message:string){
    super(message);
    this.status=status;
    this.name="MemberApiError";
  }
}

function memberPath(segment:string):string {
  if (!/^\/[a-z0-9/_-]+$/i.test(segment) || segment.includes("//") ||
      segment.includes("/../") || segment.endsWith("/..") || segment.includes("/./"))
    throw new Error("Invalid member route");
  return MEMBER_ROOT+segment;
}
export function memberProjectId(id:string):string {
  if (!/^[a-f0-9]{32}$/.test(id)) throw new Error("Invalid project identifier");
  return id;
}
async function requestMember<T>(
  route:string,
  options:{method?:"GET"|"POST"|"PATCH";body?:unknown;signal?:AbortSignal;publicHealth?:boolean}={}
):Promise<T> {
  const path=memberPath(route);
  const method=options.method||"GET";
  const response=await fetch(path,{
    method,
    credentials: options.publicHealth?"omit":"same-origin",
    mode:"same-origin",
    cache:"no-store",
    redirect:"error",
    headers:options.body===undefined?{Accept:"application/json"}:{Accept:"application/json","Content-Type":"application/json"},
    body:options.body===undefined?undefined:JSON.stringify(options.body),
    signal:options.signal
  });
  if(!response.ok){
    let message="Member service unavailable";
    if(response.status===401) message="Sign-in required";
    else if(response.status===403) message="Action not permitted";
    else if(response.status===409) message="This changed since you opened it; refresh and try again";
    else if(response.status===429) message="Too many requests; try again later";
    else if(response.status===422) message="Project information is incomplete";
    else if(response.status===400) message="Check the entered information";
    // Render only safe server validation copy for known 400/409/422 errors.
    if([400,409,422].includes(response.status)){
      try{
        const body=await response.json() as {error?:unknown};
        if(typeof body.error==="string"&&body.error.length<=160&&!/[\u0000-\u001f\u007f]/.test(body.error))
          message=body.error;
      }catch{}
    }
    throw new MemberApiError(response.status,message);
  }
  if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
    throw new MemberApiError(503,"Member response unavailable");
  return response.json() as Promise<T>;
}
export const memberHealth=(signal?:AbortSignal)=>requestMember<MemberHealth>("/health",{signal,publicHealth:true});
export const memberMe=(signal?:AbortSignal)=>requestMember<{member:MemberIdentity}>("/me",{signal});
export interface MemberProfileUpdate { handle:string; displayName:string; bio:string }
export const memberSaveProfile=(profile:MemberProfileUpdate)=>
  requestMember<{profile:MemberProfileUpdate}>("/profile",{method:"POST",body:profile});
export const memberProjects=(signal?:AbortSignal)=>requestMember<{projects:MemberProject[]}>("/projects",{signal});
export const memberProject=(id:string,signal?:AbortSignal)=>
  requestMember<{project:MemberProject;reviewHistory:{action:string;to_status:string;reason:string|null;created_at:string}[]}>("/projects/"+memberProjectId(id),{signal});
export const memberCreateProject=(draft:ProjectDraft)=>
  requestMember<{id:string;status:string;revision:number}>("/projects",{method:"POST",body:draft});
export const memberUpdateProject=(id:string,revision:number,draft:ProjectDraft)=>
  requestMember<{id:string;status:string;revision:number}>("/projects/"+memberProjectId(id),{method:"PATCH",body:{...draft,revision}});
export const memberSubmitProject=(id:string,revision:number)=>
  requestMember<{id:string;status:string;revision:number}>("/projects/"+memberProjectId(id)+"/submit",{method:"POST",body:{revision}});
export const memberLibrary=(signal?:AbortSignal)=>requestMember<{items:SavedProject[];count:number}>("/library",{signal});
export const memberSetSaved=(id:string,saved:boolean)=>
  requestMember<{saved:boolean;changed:boolean}>("/library/"+memberProjectId(id),{method:"POST",body:{saved}});
export const memberProgress=(signal?:AbortSignal)=>requestMember<{progression:Progression}>("/community/me",{signal});
export const memberCreatorProfile=(handle:string,signal?:AbortSignal)=>{
  if(!/^[a-z][a-z0-9_]{2,29}$/.test(handle))throw new Error("Invalid public creator handle");
  return requestMember<{
    creator:MemberProfile;
    contributions:{ratings:number;publishedProjects:number;releases:number};
    progression:Progression;
    achievements:MemberAchievement[];
  }>("/creators/"+handle,{signal});
};

export const memberRating=(id:string,signal?:AbortSignal)=>
  requestMember<{rating:MemberRating}>("/community/projects/"+memberProjectId(id),{signal});
export const memberVote=(id:string,score:number,revision:number)=>{
  if(!Number.isSafeInteger(score)||score<1||score>5||!Number.isSafeInteger(revision)||revision<0)throw new Error("Invalid rating");
  return requestMember<{rating:MemberRating;changed:boolean;progression:Progression}>(
    "/community/projects/"+memberProjectId(id)+"/vote",{method:"POST",body:{score,revision}}
  );
};
export const memberSignOut=()=>requestMember<{signedOut:boolean}>("/sign-out",{method:"POST",body:{}});
