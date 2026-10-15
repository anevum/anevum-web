// Canonical Better Auth client used ONLY for the invite-only Phase 1 beta.
// No JWT/localStorage session material, cross-origin proxy or Creator V1 OTP
// identity. Server decides the account ID for all mutation paths.
import {createAuthClient} from "better-auth/react";
import {emailOTPClient} from "better-auth/client/plugins";
export const canonicalAuthClient=createAuthClient({
  basePath:"/api/v1/member/auth",
  plugins:[emailOTPClient()]
});

export const WORLD_THEME_OPTIONS = [
  {id:"continuance",name:"Continuance",detail:"Archival rose and violet"},
  {id:"nocturne",name:"Nocturne",detail:"Deep blue and pale starlight"},
  {id:"verdant",name:"Evergrove",detail:"Forest green and amber"}
] as const;
export type WorldTheme=typeof WORLD_THEME_OPTIONS[number]["id"];
export const FOCUS_OPTIONS = [
  {id:"games",label:"Games"},{id:"apps",label:"Apps"},{id:"art",label:"Art"},
  {id:"writing",label:"Writing"},{id:"music",label:"Music"},{id:"research",label:"Research"},
  {id:"learning",label:"Learning"},{id:"tools",label:"Tools"},{id:"community",label:"Community"}
] as const;
export type FocusKey=typeof FOCUS_OPTIONS[number]["id"];
export type CanonicalProfile={
  handle:string;displayName:string;bio:string;
  headline:string;worldTheme:WorldTheme;focus:FocusKey[];
  visibility:"private"|"public";revision:number;createdAt:number;updatedAt:number;
};
export type CanonicalPrivateResponse={memberId:string;profile:CanonicalProfile|null};
export type CanonicalPublicResponse={profile:{
  handle:string;displayName:string;bio:string;joinedAt:number;
  headline:string;worldTheme:WorldTheme;focus:FocusKey[];
}};
export class CanonicalBetaError extends Error {
  constructor(readonly status:number,message:string){super(message);this.name="CanonicalBetaError"}
}
async function safeJson<T>(response:Response):Promise<T>{
 if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
   throw new CanonicalBetaError(503,"The member service returned an invalid response.");
 const data=await response.json() as unknown;
 if(!data||typeof data!=="object"||Array.isArray(data))
   throw new CanonicalBetaError(503,"The member service response could not be verified.");
 return data as T;
}
async function request<T>(path:string,method:"GET"|"POST"|"PATCH"="GET",body?:unknown,signal?:AbortSignal,publicRead=false):Promise<T>{
 if(!/^\/api\/v1\/(?:member\/(?:auth-methods|creator-profile)|members\/[a-z][a-z0-9_]{2,29})$/.test(path))
   throw new Error("Unsupported canonical member route");
 const response=await fetch(path,{
  method,mode:"same-origin",credentials:publicRead?"omit":"same-origin",
  redirect:"error",cache:"no-store",
  headers:body===undefined?{Accept:"application/json"}:
    {Accept:"application/json","Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body),signal
 });
 if(!response.ok){
   let message=response.status===401?"Sign in to access your account.":
     response.status===403?"This invitation or action is not authorized.":
     response.status===404?"No public member profile was found.":
     response.status===409?"This handle or profile has changed. Reload and try again.":
     response.status===429?"Too many changes. Try again in an hour.":
     "Account service unavailable. No changes were saved.";
   if(response.status===400)message="Check your handle and profile details.";
   throw new CanonicalBetaError(response.status,message);
 }
 return safeJson<T>(response);
}
export type CanonicalMethods={
  registration:"closed"|"invite-only"|"open";
  methods:{email:{available:boolean};google:{available:boolean}};
};
export const canonicalMethods=(signal?:AbortSignal)=>
 request<CanonicalMethods>("/api/v1/member/auth-methods","GET",undefined,signal);
export async function canonicalReady(signal?:AbortSignal):Promise<boolean>{
 try{
   const data=await canonicalMethods(signal);
   return (data.registration==="invite-only"||data.registration==="open")&&(data.methods.email.available===true||data.methods.google.available===true);
 }catch{return false;}
}
export const canonicalMe=(signal?:AbortSignal)=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","GET",undefined,signal);
export const canonicalClaim=(body:{handle:string;displayName:string;bio:string})=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","POST",body);
export const canonicalEdit=(body:{displayName:string;bio:string;visibility:"private"|"public";revision:number;
  headline:string;worldTheme:WorldTheme;focus:FocusKey[]})=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","PATCH",body);
export const canonicalPublic=(handle:string,signal?:AbortSignal)=>
 request<CanonicalPublicResponse>("/api/v1/members/"+handle,"GET",undefined,signal,true);
