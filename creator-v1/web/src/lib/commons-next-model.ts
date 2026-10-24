/** Pure Living Commons preview taxonomy and URL state; no I/O, authorization or account writes. */
import type {Category, CommunityPostSort, Status} from './api';
export type CommonsPreviewView='signals'|'atlas'|'people';
export type CommonsPreviewQuery=Readonly<{view:CommonsPreviewView;category:Category|'';q:string;sort:CommunityPostSort}>;
export type District=Readonly<{id:Category;title:string;description:string;coordinates:readonly [number,number];code:string}>;
export const COMMONS_DISTRICTS:readonly District[]=[
 {id:'games',title:'Play & Worlds',description:'Playable ideas and interactive experiments',coordinates:[21,27],code:'01'},
 {id:'tools',title:'Apps & Tools',description:'Useful software and independent utilities',coordinates:[52,17],code:'02'},
 {id:'creative',title:'Creative Signals',description:'Art, interactive stories and AI-assisted work',coordinates:[81,32],code:'03'},
 {id:'libraries',title:'Open Source',description:'Libraries, documented code and shared components',coordinates:[32,55],code:'04'},
 {id:'research',title:'Research',description:'Experiments with evidence and thoughtful questions',coordinates:[70,61],code:'05'},
 {id:'learning',title:'Learning',description:'Resources for gaining and sharing skills',coordinates:[15,79],code:'06'},
 {id:'automation',title:'Automation',description:'Practical workflows and repeatable systems',coordinates:[49,84],code:'07'},
 {id:'other',title:'Other Worlds',description:'Original work outside established categories',coordinates:[85,82],code:'08'},
];
/** Match submitted and restored search text without carrying control characters into public links. */
export function normalizeCommonsSearch(raw:string):string{
 const clean=raw.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim();
 // Keep the existing 72-code-unit budget without cutting an emoji in half.
 return clean.slice(0,72).replace(/[\ud800-\udbff]$/,'').trimEnd();
}
export function decodeCommonsQuery(params:URLSearchParams):CommonsPreviewQuery{
 const rawView=params.get('view');
 const view:CommonsPreviewView=rawView==='atlas'||rawView==='people'?rawView:'signals';
 const requested=params.get('category');
 const category=COMMONS_DISTRICTS.find(item=>item.id===requested)?.id??'';
 const q=normalizeCommonsSearch(params.get('q')??'');
 const sort:CommunityPostSort=params.get('sort')==='hot'?'hot':'new';
 return {view,category,q,sort};
}
export function nextCommonsQuery(current:URLSearchParams,changes:Partial<CommonsPreviewQuery>):URLSearchParams{
 const result=new URLSearchParams(current);
 for(const [key,value] of Object.entries(changes)){
  const normalized=key==='q'?normalizeCommonsSearch(value??''):value;
  if(normalized)result.set(key,normalized);
  else result.delete(key);
 }
 return result;
}

function directoryPath(path:'/discover'|'/creators',search:string,category:Category|''=''):string{
 const query=new URLSearchParams();
 let q=normalizeCommonsSearch(search);
 if(q)query.set('q',q);
 if(category)query.set('category',category);
 const serialize=()=>path+(query.size?'?'+query.toString():'');
 // Project return links accept at most 512 encoded characters. A long non-Latin
 // query can exceed that despite the input budget; shorten whole characters
 // here so navigation keeps the category instead of falling back to /discover.
 while(q&&serialize().length>512){
  const characters=Array.from(q);
  characters.pop();q=characters.join('').trimEnd();
  if(q)query.set('q',q);else query.delete('q');
 }
 return serialize();
}
/** Only supported filters cross from the review into the real public catalogue. */
export function commonsDiscoverPath(query:Pick<CommonsPreviewQuery,'q'|'category'>):string{
 const category=COMMONS_DISTRICTS.find(item=>item.id===query.category)?.id??'';
 return directoryPath('/discover',query.q,category);
}
/** Creator directory search is independent of project category and discussion sort. */
export function commonsCreatorsPath(query:Pick<CommonsPreviewQuery,'q'>):string{
 return directoryPath('/creators',query.q);
}
/** Only authoritative true enables public moderated posts. Missing status fails closed. */
export function moderatedPostsEnabled(status:Pick<Status,'features'>|null|undefined):boolean{
 return status?.features?.communityPosts===true;
}
