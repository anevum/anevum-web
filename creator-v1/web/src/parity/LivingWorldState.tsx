import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {readCategories,readStatus,type Category} from '../lib/api';

/** Public, aggregate-only inputs. Never fetches member identity, private work,
 * session state, behavioral analytics or moderation data.
 */
const categories=['games','tools','creative','libraries','automation','research','learning','other'] as const satisfies readonly Category[];
export type WorldSector=Category|'hero'|'portal'|'community'|'creators'|'studio';
export type WorldSignal={
  source:'unavailable'|'partial'|'verified';
  publishedProjects:number|null;
  publishedCreators:number|null;
  categories:Partial<Record<Category,number>>;
  observedAt:number|null;
};
export type WorldContextValue={
  signal:WorldSignal;
  paused:boolean;
  setPaused:(next:boolean|((previous:boolean)=>boolean))=>void;
  previewSector:WorldSector|null;
  setPreviewSector:(next:WorldSector|null)=>void;
};
export const EMPTY_WORLD:WorldSignal={source:'unavailable',publishedProjects:null,publishedCreators:null,categories:{},observedAt:null};
const WorldContext=createContext<WorldContextValue>({
  signal:EMPTY_WORLD,paused:false,setPaused:()=>{},previewSector:null,setPreviewSector:()=>{}
});
const validCount=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=10_000_000;
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);

export function normalizeWorldSignals(status:unknown,counts:unknown,observedAt:number):WorldSignal {
  let publishedProjects:number|null=null,publishedCreators:number|null=null;
  const byCategory:Partial<Record<Category,number>>={};
  if(object(status)&&object(status.counts)){
    if(validCount(status.counts.publishedProjects))publishedProjects=status.counts.publishedProjects;
    if(validCount(status.counts.publishedCreators))publishedCreators=status.counts.publishedCreators;
  }
  if(object(counts)&&Array.isArray(counts.categories)){
    for(const entry of counts.categories){
      if(!object(entry)||typeof entry.category!=='string'||!categories.some(x=>x===entry.category)||!validCount(entry.count))continue;
      byCategory[entry.category as Category]=entry.count;
    }
  }
  const hasTotal=publishedProjects!==null||publishedCreators!==null;
  const hasCategories=Object.keys(byCategory).length>0;
  return {
    source:hasTotal&&hasCategories?'verified':hasTotal||hasCategories?'partial':'unavailable',
    publishedProjects,publishedCreators,categories:byCategory,
    observedAt:hasTotal||hasCategories?observedAt:null
  };
}

export function worldDensity(signal:WorldSignal,sector:WorldSector):number {
  const count=sector==='creators'?signal.publishedCreators:
    sector==='hero'||sector==='portal'||sector==='community'||sector==='studio'
      ?signal.publishedProjects:signal.categories[sector];
  // An unknown count is not zero. A zero count still renders a quiet neutral
  // field. Log scaling prevents large catalogues from saturating the scene.
  return count===null||count===undefined?0.24:Math.min(0.94,0.18+Math.log2(1+count)*0.075);
}

/** Shared for all PARITY pages. The same public snapshot survives route changes.
 * A five-minute foreground refresh changes the environment when content grows.
 * Local pointer/focus interactions never leave the browser.
 */
export function LivingWorldProvider({children}:{children:ReactNode}){
  const [signal,setSignal]=useState<WorldSignal>(EMPTY_WORLD);
  const [paused,setPaused]=useState(false);
  // Ephemeral scene selection is visual-only. Never records browsing,
  // dispatches analytics or replaces the actual router destination.
  const [previewSector,setPreviewSector]=useState<WorldSector|null>(null);
  useEffect(()=>{
    let disposed=false;
    let controller:AbortController|null=null;
    const refresh=async()=>{
      if(document.visibilityState==='hidden')return;
      controller?.abort();
      const next=new AbortController();controller=next;
      const [status,counts]=await Promise.allSettled([
        readStatus(next.signal),readCategories(next.signal)
      ]);
      if(disposed||next.signal.aborted)return;
      const safe=normalizeWorldSignals(status.status==='fulfilled'?status.value:null,
        counts.status==='fulfilled'?counts.value:null,Date.now());
      setSignal(safe);
    };
    void refresh();
    const interval=window.setInterval(()=>{void refresh()},300_000);
    const visibility=()=>{if(document.visibilityState==='visible')void refresh();else controller?.abort()};
    document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;controller?.abort();window.clearInterval(interval);document.removeEventListener('visibilitychange',visibility)};
  },[]);
  const value=useMemo(()=>({signal,paused,setPaused,previewSector,setPreviewSector}),[signal,paused,previewSector]);
  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useLivingWorld(){return useContext(WorldContext)}
