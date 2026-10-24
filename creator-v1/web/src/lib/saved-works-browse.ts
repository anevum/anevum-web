import type {CanonicalSavedProject} from './canonical-project-saves';
/** Only organize loaded, server-approved private saves. Never invent folders. */
const LABELS:Readonly<Record<string,string>>={games:'Games',tools:'Tools',automation:'Automation',research:'Research',creative:'Creative',learning:'Learning',libraries:'Libraries',other:'Other'};
export type CategoryOption=Readonly<{id:string;label:string;count:number}>;
export function savedCategoryFilters(items:ReadonlyArray<CanonicalSavedProject>):CategoryOption[]{
 const counts=new Map<string,number>();
 for(const item of items)counts.set(item.category,(counts.get(item.category)||0)+1);
 return [...counts].sort(([a,n],[b,m])=>m-n||a.localeCompare(b)).map(([id,count])=>({id,label:LABELS[id]||'Other',count}));
}
export function browseSavedWorks(items:ReadonlyArray<CanonicalSavedProject>,category:string,query:string):CanonicalSavedProject[]{
 const q=query.trim().toLowerCase().slice(0,100);
 return items.filter(item=>(category==='all'||item.category===category)&&(!q||
  [item.title,item.summary,item.creatorName,item.creatorHandle].some(value=>value.toLowerCase().includes(q))))
  .sort((a,b)=>b.savedAt-a.savedAt||a.id.localeCompare(b.id));
}
