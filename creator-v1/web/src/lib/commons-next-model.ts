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
export function decodeCommonsQuery(params:URLSearchParams):CommonsPreviewQuery{
 const rawView=params.get('view');
 const view:CommonsPreviewView=rawView==='atlas'||rawView==='people'?rawView:'signals';
 const requested=params.get('category');
 const category=COMMONS_DISTRICTS.find(item=>item.id===requested)?.id??'';
 const q=(params.get('q')??'').slice(0,72);
 const sort:CommunityPostSort=params.get('sort')==='hot'?'hot':'new';
 return {view,category,q,sort};
}
export function nextCommonsQuery(current:URLSearchParams,changes:Partial<CommonsPreviewQuery>):URLSearchParams{
 const result=new URLSearchParams(current);
 for(const [key,value] of Object.entries(changes)){
  if(value)result.set(key,key==='q'?value.trim().slice(0,72):value);
  else result.delete(key);
 }
 return result;
}
/** Only authoritative true enables public moderated posts. Missing status fails closed. */
export function moderatedPostsEnabled(status:Pick<Status,'features'>|null|undefined):boolean{
 return status?.features?.communityPosts===true;
}