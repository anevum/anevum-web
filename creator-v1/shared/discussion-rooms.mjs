// Shared, fixed taxonomy and cursor validation; there is no user-provided SQL identifier.
export const DISCUSSION_ROOMS=Object.freeze([
 Object.freeze({id:'arcade',label:'THE ARCADE',subtitle:'Games, playtests and interactive fiction'}),
 Object.freeze({id:'workshop',label:'THE WORKSHOP',subtitle:'Apps, open source and useful tools'}),
 Object.freeze({id:'lab',label:'THE LAB',subtitle:'Creative experiments, art and responsible AI'}),
 Object.freeze({id:'commons',label:'THE COMMON THREAD',subtitle:'Collaboration, ideas and help'})
]);
export const VALID_ROOMS=new Set(DISCUSSION_ROOMS.map(x=>x.id));
export const DISCUSSION_ID=/^[a-f0-9]{32}$/;
export const DISCUSSION_CURSOR=/^([1-9]\d{9,12})\.([a-f0-9]{32})$/;
export function parseDiscussionFilters(url,{replies=false}={}){
 const allowed=new Set(replies?['cursor','limit']:['room','cursor','limit']);
 for(const key of url.searchParams.keys()){
  if(!allowed.has(key)||url.searchParams.getAll(key).length!==1)throw Error('Invalid discussion parameters');
 }
 const room=url.searchParams.get('room')||'';
 if(room&&!VALID_ROOMS.has(room))throw Error('Invalid room');
 const limitText=url.searchParams.get('limit')||'12';
 if(!/^[1-9]\d?$/.test(limitText)||Number(limitText)>24)throw Error('Discussion limit must be between 1 and 24');
 const cursor=url.searchParams.get('cursor')||'';
 const match=cursor?DISCUSSION_CURSOR.exec(cursor):null;
 if(cursor&&!match)throw Error('Invalid discussion cursor');
 return {room,limit:Number(limitText),cursor:match?{createdAt:Number(match[1]),id:match[2]}:null};
}
export const discussionCursor=x=>String(x.createdAt)+'.'+x.id;
