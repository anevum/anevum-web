import {useEffect,useState} from 'react';

/**
 * Revalidate verified member views after a confirmed local mutation, or when
 * someone returns to a background tab. Do not poll D1 in the background.
 * The API remains the only source of XP, badges, roles and profile identity.
 */
export function useMemberRevalidation(ownerId?:string, listenToChanges=true):number {
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let lastRead=Date.now();
  const refresh=()=>{lastRead=Date.now();setRevision(value=>value+1)};
  const changed=(event:Event)=>{
   if(!listenToChanges)return;
   const owner=(event as CustomEvent<{owner?:string}>).detail?.owner;
   if(ownerId&&owner&&owner!==ownerId)return;
   refresh();
  };
  const returned=()=>{
   // Returning within a few seconds of a read is not worth another D1 scan.
   if(document.visibilityState==='visible'&&Date.now()-lastRead>=15_000)refresh();
  };
  window.addEventListener('anevum:member-change',changed);
  window.addEventListener('focus',returned);
  window.addEventListener('pageshow',returned);
  document.addEventListener('visibilitychange',returned);
  return ()=>{
   window.removeEventListener('anevum:member-change',changed);
   window.removeEventListener('focus',returned);
   window.removeEventListener('pageshow',returned);
   document.removeEventListener('visibilitychange',returned);
  };
 },[ownerId,listenToChanges]);
 return revision;
}
