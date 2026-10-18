import {useEffect} from "react";

let locks=0;
let previousOverflow="";
/** Shared, reference-counted lock for Wayfinder/search handoff and unmount. */
export function useModalScrollLock(open:boolean){
  useEffect(()=>{
    if(!open)return;
    if(locks++===0){previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden";}
    return()=>{if(--locks===0)document.documentElement.style.overflow=previousOverflow;};
  },[open]);
}
