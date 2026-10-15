// Single canonical account authority; never reuse legacy Creator V1 or V5 sessions.
// Better Auth cookies are host-only and never stored in browser localStorage.
import {createAuthClient} from "better-auth/react";
import {emailOTPClient} from "better-auth/client/plugins";

export const canonicalAuthClient=createAuthClient({
  baseURL:(typeof window!=="undefined"?window.location.origin:"https://a.anevum.com")+"/api/v1/member/auth",
  plugins:[emailOTPClient()]
});

export type CanonicalProfile={
  handle:string;displayName:string;bio:string;
  visibility:"private"|"public";revision:number;createdAt:number;updatedAt:number;
};
export type CanonicalPrivateResponse={memberId:string;profile:CanonicalProfile|null};
export type CanonicalPublicResponse={profile:{
  handle:string;displayName:string;bio:string;joinedAt:number
}};
export type AuthMethods={
  version:number;issuer:string;registration:"invite-only"|"closed";
  methods:{email:{available:boolean};google:{available:boolean}};
};
export class CanonicalBetaError extends Error {
  constructor(readonly status:number,message:string){super(message);this.name="CanonicalBetaError"}
}
async function request<T>(path:string,method:"GET"|"POST"|"PATCH"="GET",body?:unknown,signal?:AbortSignal,publicRead=false):Promise<T>{
  if(!/^\/api\/(?:v1\/member\/(?:auth-methods|creator-profile)|v1\/members\/[a-z][a-z0-9_]{2,29})$/.test(path))
    throw new Error("Unsupported canonical member route");
  const response=await fetch(path,{
    method,mode:"same-origin",credentials:publicRead?"omit":"same-origin",
    redirect:"error",cache:"no-store",
    headers:body===undefined?{Accept:"application/json"}:
      {Accept:"application/json","Content-Type":"application/json"},
    body:body===undefined?undefined:JSON.stringify(body),signal
  });
  if(!response.ok){
    const message=response.status===401?"Sign in to access your account.":
      response.status===403?"This invitation or action is not authorized.":
      response.status===404?"No public profile was found.":
      response.status===409?"This handle or profile has changed. Reload and try again.":
      response.status===429?"Too many changes. Try again later.":
      response.status===400?"Check your profile information.":
      "Member service unavailable. No changes were saved.";
    throw new CanonicalBetaError(response.status,message);
  }
  if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
    throw new CanonicalBetaError(503,"The member service returned an invalid response.");
  return await response.json() as T;
}
export async function canonicalMethods(signal?:AbortSignal):Promise<AuthMethods|null>{
 try{
   const response=await request<AuthMethods>("/api/v1/member/auth-methods","GET",undefined,signal,true);
   if(response?.version!==2||response.issuer!=="anevum-better-auth-staging-v1"||
     !["invite-only","closed"].includes(response.registration) ||
     typeof response.methods?.email?.available!=="boolean" ||
     typeof response.methods?.google?.available!=="boolean")
     return null;
   return response;
 }catch{return null;}
}
export async function canonicalReady(signal?:AbortSignal):Promise<boolean>{
 const capabilities=await canonicalMethods(signal);
 return capabilities?.registration==="invite-only"&&
   (capabilities.methods.email.available===true||capabilities.methods.google.available===true);
}
export const canonicalMe=(signal?:AbortSignal)=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","GET",undefined,signal);
export const canonicalClaim=(body:{handle:string;displayName:string;bio:string})=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","POST",body);
export const canonicalEdit=(body:{displayName:string;bio:string;visibility:"private"|"public";revision:number})=>
 request<CanonicalPrivateResponse>("/api/v1/member/creator-profile","PATCH",body);
export const canonicalPublic=(handle:string,signal?:AbortSignal)=>
 request<CanonicalPublicResponse>("/api/v1/members/"+handle,"GET",undefined,signal,true);
