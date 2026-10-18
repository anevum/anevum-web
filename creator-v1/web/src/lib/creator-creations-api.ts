// External-link-only canonical ANEVUM public creation records.
// Never use legacy project identity or private Studio session for this feed.
import type {PublicIdentity} from '../components/CompactMemberIdentity';
const ROOT='/api/v1/creations';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export type PublicCreation={
 id:string;title:string;summary:string;category:string;handle:string;
 freeToUse:boolean;license:string;
 sourceUrl:string|null;demoUrl:string|null;publishedAt:number;
 delivery:'external-link-only';creator:PublicIdentity
};
export class CreationsUnavailable extends Error{
 constructor(readonly status:number){super('Public creations service unavailable');}
}
const validate=(record:unknown):PublicCreation=>{
 if(!record||typeof record!=='object'||Array.isArray(record))
  throw new Error('Invalid creation');
 const x=record as Partial<PublicCreation>;
 if(typeof x.id!=='string'||!UUID.test(x.id)||
  typeof x.title!=='string'||x.title.length>100||
  typeof x.summary!=='string'||x.summary.length>280||
  typeof x.handle!=='string'||!/^[a-z][a-z0-9_]{2,29}$/.test(x.handle)||
  typeof x.category!=='string'||x.category.length>30||
  typeof x.publishedAt!=='number'||!Number.isSafeInteger(x.publishedAt)||
  x.delivery!=='external-link-only'||typeof x.freeToUse!=='boolean'||
  !x.creator||x.creator.handle!==x.handle||
  typeof x.creator.displayName!=='string'||x.creator.displayName.length>80)
  throw new Error('Unverified public creator record');
 for(const url of [x.demoUrl,x.sourceUrl]){
  if(url===null||url===undefined)continue;
  if(typeof url!=='string'||url.length>1500)throw new Error('Invalid external link');
  let parsed:URL;try{parsed=new URL(url);}catch{throw new Error('Invalid external link')}
  if(parsed.protocol!=='https:'||Boolean(parsed.username)||Boolean(parsed.password))
   throw new Error('Untrusted external link');
 }
 return x as PublicCreation;
};
async function get(path:string,signal?:AbortSignal):Promise<unknown>{
 const response=await fetch(path,{
  credentials:'omit',method:'GET',mode:'same-origin',redirect:'error',
  cache:'no-store',referrerPolicy:'no-referrer',
  headers:{Accept:'application/json'},signal
 });
 if(!response.ok)throw new CreationsUnavailable(response.status);
 if(!response.headers.get('content-type')?.includes('application/json'))
  throw new Error('Unverified public creations response');
 return response.json();
}
export async function readPublicCreations(signal?:AbortSignal):Promise<PublicCreation[]>{
 const result=await get(ROOT,signal) as {creations?:unknown};
 if(!Array.isArray(result?.creations)||result.creations.length>24)
  throw new Error('Invalid public creations collection');
 return result.creations.map(validate);
}
export async function readPublicCreation(id:string,signal?:AbortSignal):Promise<PublicCreation>{
 if(!UUID.test(id))throw new CreationsUnavailable(404);
 const result=await get(ROOT+'/'+id,signal) as {creation?:unknown};
 return validate(result?.creation);
}
