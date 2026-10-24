/**
 * ANEVUM / IREN dispatches. Only explicitly published public facts belong here.
 * No creator draft, private member records, fictional engagement or test build
 * features may be represented as released in this archive.
 */
export type BulletinKind='release'|'patch'|'notice'|'maintenance';
export type BulletinAudience='everyone'|'testers';
export type ReleaseBulletin={
 id:string;kind:BulletinKind;audience:BulletinAudience;publishedAt:string;
 title:string;summary:string;changes:readonly string[];href:string;version?:string;
};
export type ReleaseBulletinFeed={schema:1;source:'approved-anevum-release-records';entries:ReleaseBulletin[]};
export const PUBLIC_BULLETIN_PATH='/communications/updates.v1.json';
const ID=/^[a-z0-9][a-z0-9-]{2,79}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SAFE_URL=/^\/updates(?:#[a-z0-9][a-z0-9-]{2,79})?$/;
const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const validText=(value:unknown,max:number)=>typeof value==='string'&&value.length>0&&value.length<=max&&value.trim()===value;
function validBulletin(value:unknown):value is ReleaseBulletin{
 if(!isRecord(value))return false;
 const {id,kind,audience,publishedAt,title,summary,changes,href,version}=value;
 return typeof id==='string'&&ID.test(id)&&
  ['release','patch','notice','maintenance'].includes(String(kind))&&
  ['everyone','testers'].includes(String(audience))&&
  typeof publishedAt==='string'&&DATE.test(publishedAt)&&!Number.isNaN(Date.parse(publishedAt+'T00:00:00Z'))&&
  validText(title,100)&&validText(summary,350)&&
  Array.isArray(changes)&&changes.length>=1&&changes.length<=9&&
  changes.every(change=>validText(change,220))&&
  typeof href==='string'&&SAFE_URL.test(href)&&
  (version===undefined||validText(version,25));
}
export function parseReleaseFeed(value:unknown):ReleaseBulletinFeed{
 if(!isRecord(value)||value.schema!==1||value.source!=='approved-anevum-release-records'||!Array.isArray(value.entries)||value.entries.length>50)throw Error('Release bulletins unavailable.');
 if(!value.entries.every(validBulletin))throw Error('Release bulletin record invalid.');
 const entries=[...value.entries] as ReleaseBulletin[];
 if(new Set(entries.map(entry=>entry.id)).size!==entries.length)throw Error('Duplicate release bulletin.');
 entries.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 return {schema:1,source:'approved-anevum-release-records',entries};
}
export async function readReleaseFeed(signal?:AbortSignal):Promise<ReleaseBulletinFeed>{
 const response=await fetch(PUBLIC_BULLETIN_PATH,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Release bulletins unavailable.');
 const raw=await response.text();
 if(raw.length>40000)throw Error('Release feed too large.');
 return parseReleaseFeed(JSON.parse(raw));
}
