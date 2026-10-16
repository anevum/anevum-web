export type ForumAuthor={
 handle:string;displayName:string;avatar:boolean;level:number|null;featuredAwards:string[]
};
export type ForumThread={
 id:string;topic:string;title:string;body:string;publishedAt:number;
 author:ForumAuthor;replyCount:number;reactions:number
};
export type ForumReply={id:string;body:string;publishedAt:number;author:ForumAuthor};
export type MemberSubmission={
 id:string;topic:string;title:string;body:string;
 status:'pending_review'|'published'|'rejected'|'hidden';created_at:number
};
export type ForumThreadPage={items:ForumThread[];nextCursor:string|null};
export const FORUM_TOPICS=[
 ['all','ALL SIGNALS'],['games','GAMES & PLAY'],['making','SOFTWARE & MAKING'],
 ['arts','ART, MEDIA & STORIES'],['community','COMMUNITY & COLLABORATION']
] as const;
export const FORUM_ID=/^[a-f0-9-]{36}$/;

export class ForumApiError extends Error {
 constructor(readonly status:number,message:string){super(message);this.name='ForumApiError'}
}
export async function forumRequest<T>(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{
 if(!/^\/api\/v1\/(?:community\/(?:threads(?:\/[a-f0-9-]{36}(?:\/(?:replies|reaction))?)?|reports)|member\/forum-submissions(?:\/[a-f0-9-]{36})?)$/.test(path.split('?')[0]))
  throw new Error('Unsupported community endpoint');
 const privateRoute=path.startsWith('/api/v1/member/')||path.split('?')[0].endsWith('/reaction');
 const response=await fetch(path,{
  method,credentials:privateRoute||method!=='GET'?'same-origin':'omit',
  mode:'same-origin',cache:'no-store',redirect:'error',referrerPolicy:'same-origin',
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body),signal
 });
 let result:{error?:string}|null=null;
 if(response.headers.get('content-type')?.includes('application/json'))
  result=await response.json().catch(()=>null);
 if(!response.ok)throw new ForumApiError(response.status,
  result?.error|| (response.status===404?'Forum not available':'Community service unavailable'));
 if(!result||typeof result!=='object'||Array.isArray(result))
  throw new ForumApiError(503,'Invalid forum service response');
 return result as unknown as T;
}
