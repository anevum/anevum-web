export const DISCUSSION_SCHEMA="anevum.commons-discussions.v1";
export const topics=["systems","engineering","research","releases"] as const;
export type Topic=typeof topics[number];
export type Post={id:string;topic:Topic;title:string;body:string;createdAt:number;updatedAt:number;ownedByMe:boolean;authorLabel:string};
export type Reply={id:string;postId:string;body:string;createdAt:number;ownedByMe:boolean;authorLabel:string};
export type Page<T>={items:T[];nextCursor:string|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const fail=()=>{throw Error("Discussion response could not be verified.");};
const integer=(value:unknown):value is number=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=8640000000000;
export function validDiscussionText(value:string,min:number,max:number){return value.trim().length>=min&&value.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);}
function envelope(value:unknown,memberId:string):Record<string,unknown>{
  if(!object(value)||!memberId||value.schemaVersion!==DISCUSSION_SCHEMA||value.viewerMemberId!==memberId)return fail();
  return value;
}
function base(value:unknown):Record<string,unknown>{
  if(!object(value)||typeof value.id!=="string"||!uuid.test(value.id)||!integer(value.createdAt)||typeof value.ownedByMe!=="boolean"||value.authorLabel!=="Commons member")return fail();
  return value;
}
function parsePost(value:unknown):Post{
  const row=base(value);
  if(typeof row.topic!=="string"||!topics.includes(row.topic as Topic)||typeof row.title!=="string"||!validDiscussionText(row.title,8,120)||typeof row.body!=="string"||!validDiscussionText(row.body,20,3000)||!integer(row.updatedAt)||row.updatedAt<(row.createdAt as number))return fail();
  return {id:row.id as string,topic:row.topic as Topic,title:row.title,body:row.body,createdAt:row.createdAt as number,updatedAt:row.updatedAt,ownedByMe:row.ownedByMe as boolean,authorLabel:"Commons member"};
}
function parseReply(value:unknown,postId:string):Reply{
  const row=base(value);
  if(row.postId!==postId||typeof row.body!=="string"||!validDiscussionText(row.body,2,1000))return fail();
  return {id:row.id as string,postId,body:row.body,createdAt:row.createdAt as number,ownedByMe:row.ownedByMe as boolean,authorLabel:"Commons member"};
}
function compare(a:{createdAt:number;id:string},b:{createdAt:number;id:string}){return a.createdAt-b.createdAt||(a.id>b.id?1:a.id<b.id?-1:0);}
export function mergeDiscussionPage<T extends {createdAt:number;id:string}>(before:T[],after:T[],kind:"posts"|"replies"):T[]{
  const all=[...before,...after],seen=new Set<string>();
  all.forEach((row,index)=>{if(seen.has(row.id.toLowerCase())||(index>0&&(kind==="posts"?compare(all[index-1],row)<=0:compare(all[index-1],row)>=0)))fail();seen.add(row.id.toLowerCase());});
  return all;
}
function page<T extends {id:string;createdAt:number}>(value:Record<string,unknown>,items:T[],cap:number,kind:"posts"|"replies",scope:string):Page<T>{
  if(items.length>cap||value.pageCap!==cap||typeof value.hasMore!=="boolean"||!(value.nextCursor===null||typeof value.nextCursor==="string")||value.hasMore!==(value.nextCursor!==null)||value.hasMore&&items.length!==cap)return fail();
  mergeDiscussionPage([],items,kind);
  if(typeof value.nextCursor==="string"){
    if(!/^[A-Za-z0-9_-]{1,350}$/.test(value.nextCursor))return fail();
    try{const cursor=JSON.parse(atob(value.nextCursor.replaceAll("-","+").replaceAll("_","/")));const last=items.at(-1);
      if(!object(cursor)||Object.keys(cursor).sort().join(",")!=="at,id,kind,scope,v"||cursor.v!==1||cursor.kind!==kind||cursor.scope!==scope||cursor.at!==last?.createdAt||cursor.id!==last?.id)return fail();
    }catch{return fail();}
  }
  return {items,nextCursor:value.nextCursor as string|null};
}
export function parsePostPage(value:unknown,memberId:string,filter:Topic|"all"):Page<Post>{
  const payload=envelope(value,memberId);
  if(payload.available!==true||payload.pilot!==true||payload.moderationStatus!=="PILOT_REVIEW_REQUIRED"||(!Array.isArray(payload.posts)||payload.posts.length>30)||payload.olderPostsMayExist!==payload.hasMore)return fail();
  const items=payload.posts.map(parsePost);if(filter!=="all"&&items.some(post=>post.topic!==filter))return fail();
  return page(payload,items,30,"posts",filter);
}
export function parseReplyPage(value:unknown,memberId:string,postId:string):Page<Reply>{
  const payload=envelope(value,memberId);if(payload.postId!==postId||(!Array.isArray(payload.replies)||payload.replies.length>50))return fail();
  return page(payload,payload.replies.map(row=>parseReply(row,postId)),50,"replies",postId);
}
export function verifiedDiscussionAction(value:unknown,memberId:string,action:"post"|"reply"|"remove-post"|"remove-reply"|"report",expected:{postId?:string;replyId?:string;topic?:Topic;title?:string;body?:string}){
  const payload=envelope(value,memberId);
  if(action==="post"){const post=parsePost(payload.post);if(payload.created!==true||!post.ownedByMe||post.topic!==expected.topic||post.title!==expected.title||post.body!==expected.body)fail();return;}
  if(payload.postId!==expected.postId&&action!=="reply")fail();
  if(action==="reply"){const row=parseReply(payload.reply,expected.postId!);if(payload.created!==true||!row.ownedByMe||row.body!==expected.body)fail();}
  else if(action==="remove-post"||action==="remove-reply"){if(payload.removed!==true||action==="remove-reply"&&payload.replyId!==expected.replyId)fail();}
  else if(payload.reported!==true||payload.reviewStatus!=="PENDING")fail();
}
