import type {AnevumAlert} from './ui-events';

/** Delivery order for the existing single IREN queue.
 * These are display notices, NOT grants, notification acknowledgements, or
 * a source of truth about member progression. Verified server notices remain
 * distinct and may never be silently discarded by a local presentation cap.
 */
const MAX_PRESENTATION_QUEUE=20;
const lowPriority=(item:AnevumAlert)=>!item.serverId&&
 (item.kind==='info'||item.kind==='update');
function freeLowPrioritySlot(queue:AnevumAlert[]){
 if(queue.length<MAX_PRESENTATION_QUEUE)return queue;
 // The active signal (index 0), earned server records and actionable signals
 // are not silently removed merely because information notices are noisy.
 const index=queue.findIndex((item,i)=>i>0&&lowPriority(item));
 return index<0?queue:[...queue.slice(0,index),...queue.slice(index+1)];
}
export function scheduleTransmission(queue:AnevumAlert[],incoming:AnevumAlert):AnevumAlert[]{
 // React effects may request the same server record twice; display once.
 if(queue.some(item=>item.key===incoming.key||
   (incoming.serverId!==undefined&&item.serverId===incoming.serverId)))return queue;
 if(incoming.serverId!==undefined){
  // Preserve FIFO between verified records, but never bury an actionable
  // local error under a new set of celebration/information notices.
  const position=queue.findIndex((item,i)=>i>0&&item.serverId===undefined&&item.kind!=='error');
  return position<0?[...queue,incoming]:[...queue.slice(0,position),incoming,...queue.slice(position)];
 }
 if(incoming.kind==='error'){
  // The latest actionable error must survive even when info fills all slots.
  // Coalesce only a pending error; never interrupt the active announcement.
  const pending=queue.findIndex((item,i)=>i>0&&item.kind==='error');
  const withoutPending=pending<0?queue:queue.filter((_,i)=>i!==pending);
  const withSpace=freeLowPrioritySlot(withoutPending);
  return withSpace.length?[withSpace[0],incoming,...withSpace.slice(1)]:[incoming];
 }
 if(incoming.kind==='xp'){
  const position=queue.findIndex((item,i)=>i>0&&item.kind==='xp'&&item.serverId===undefined);
  if(position>=0){
   const amount=(queue[position].xp||0)+(incoming.xp||0);
   return queue.map((item,i)=>i===position?{...item,xp:amount,title:'+'+amount+' XP received'}:item);
  }
 }
 if(incoming.kind==='success'){
  const position=queue.findIndex((item,i)=>i>0&&item.kind==='success'&&item.serverId===undefined);
  if(position>=0)return queue.map((item,i)=>i===position?incoming:item);
  const withSpace=freeLowPrioritySlot(queue);
  if(withSpace.length<MAX_PRESENTATION_QUEUE)return [...withSpace,incoming];
 }
 if(queue.length>=MAX_PRESENTATION_QUEUE)return queue;
 return [...queue,incoming];
}
