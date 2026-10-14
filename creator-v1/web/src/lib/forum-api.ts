// Creator V1 forum client: public moderation-approved reads + protected writes.
// All routes are first-party, member authentication uses the existing cookie.
export type ForumRoomId="arcade"|"workshop"|"lab"|"commons";
export interface ForumBadge {key:string;name:string;symbol:string}
export interface ForumAuthor {handle:string;displayName:string;level:number;artifact:string|null;badges:ForumBadge[]}
export interface ForumRoom {id:ForumRoomId;name:string;subject:string;threads:number}
export interface ForumThreadSummary {id:string;room:ForumRoomId;title:string;createdAt:number;postCount:number;author:ForumAuthor}
export interface ForumPost {id:string;body:string;createdAt:number;starter:boolean;author:ForumAuthor}
export interface ForumDiscussion {thread:{id:string;room:ForumRoomId;title:string;createdAt:number;author:ForumAuthor|null};posts:ForumPost[];nextCursor:string|null}
export interface ForumRoomPageResult {room:Pick<ForumRoom,"id"|"name"|"subject">;items:ForumThreadSummary[];nextCursor:string|null}
export const FORUM_ROOMS:ReadonlyArray<Pick<ForumRoom,"id"|"name"|"subject">>=[
 {id:"arcade",name:"The Arcade",subject:"Games, playtesting and interactive worlds"},
 {id:"workshop",name:"The Workshop",subject:"Independent apps, open source and practical making"},
 {id:"lab",name:"The Lab",subject:"Experiments, AI and creative problem-solving"},
 {id:"commons",name:"The Commons",subject:"Questions, introductions and collaboration"}
] as const;
const ROOT="/api/v1/member/forum";
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const ID=/^[a-f0-9]{32}$/;
const CURSOR=/^\d{1,12}\.[a-f0-9]{32}$/;
const ROOMS=new Set<string>(FORUM_ROOMS.map(room=>room.id));
export class ForumApiError extends Error {
 readonly status:number;
 constructor(status:number,message:string){super(message);this.status=status;this.name="ForumApiError"}
}
async function forumRequest<T>(route:string,options:{method?:"POST";body?:unknown;signal?:AbortSignal}={}):Promise<T> {
 if(!/^\/[a-z0-9/_-]+(?:\?cursor=[0-9]{1,12}\.[a-f0-9]{32})?$/.test(route)||route.includes("//"))throw Error("Invalid forum route");
 const response=await fetch(ROOT+route,{
  method:options.method||"GET",
  credentials:options.method?"same-origin":"omit",
  mode:"same-origin",cache:"no-store",redirect:"error",
  headers:options.method?{Accept:"application/json","Content-Type":"application/json"}:{Accept:"application/json"},
  body:options.method?JSON.stringify(options.body):undefined,
  signal:options.signal
 });
 if(!response.ok){
  const message=response.status===401?"Invited sign-in required":response.status===403?"This action is not permitted":
   response.status===404?"Community discussions are not available yet":response.status===409?"Discussion changed; reload the page":
   response.status===429?"Too many messages; try again later":
   response.status===400?"Check the message and try again":"Community service unavailable";
  throw new ForumApiError(response.status,message);
 }
 if(!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
  throw new ForumApiError(503,"Community response unavailable");
 return response.json() as Promise<T>;
}
export const readForumRooms=(signal?:AbortSignal)=>forumRequest<{rooms:ForumRoom[];access:string}>("/rooms",{signal});
export interface ForumMemberActivity {id:string;threadId:string;threadTitle:string;room:ForumRoomId;excerpt:string;createdAt:number}
export const readForumMemberActivity=(handle:string,signal?:AbortSignal)=>{
 if(!HANDLE.test(handle))throw Error("Invalid member handle");
 return forumRequest<{items:ForumMemberActivity[]}>("/members/"+handle+"/activity",{signal});
};

export const isForumRoom=(room:string):room is ForumRoomId=>ROOMS.has(room);
export const readForumRoom=(id:string,cursor="",signal?:AbortSignal)=>{
 if(!isForumRoom(id))throw Error("Invalid forum room");
 if(cursor&&!CURSOR.test(cursor))throw Error("Invalid forum cursor");
 return forumRequest<ForumRoomPageResult>("/rooms/"+id+(cursor?"?cursor="+cursor:""),{signal});
};
export const readForumThread=(id:string,cursor="",signal?:AbortSignal)=>{
 if(!ID.test(id)||cursor&&!CURSOR.test(cursor))throw Error("Invalid forum location");
 return forumRequest<ForumDiscussion>("/threads/"+id+(cursor?"?cursor="+cursor:""),{signal});
};
export const startForumThread=(room:ForumRoomId,title:string,body:string)=>{
 if(!isForumRoom(room))throw Error("Invalid forum room");
 return forumRequest<{id:string;status:"pending";notice:string}>("/threads",{method:"POST",body:{room,title,body}});
};
export const replyToForumThread=(id:string,body:string)=>{
 if(!ID.test(id))throw Error("Invalid thread identifier");
 return forumRequest<{id:string;status:"pending";notice:string}>("/threads/"+id+"/replies",{method:"POST",body:{body}});
};
export const reportForumPost=(id:string,reason:"spam"|"harassment"|"unsafe"|"copyright"|"other",details:string)=>{
 if(!ID.test(id))throw Error("Invalid post identifier");
 return forumRequest<{recorded:boolean;notice:string}>("/posts/"+id+"/report",{method:"POST",body:{reason,details}});
};
export const forumMemberPath=(handle:string)=>HANDLE.test(handle)?"/@"+handle:"/community";
