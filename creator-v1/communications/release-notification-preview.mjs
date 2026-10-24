/**
 * IREN public release notification candidate builder.
 * Review-only. It never queries subscribers or dispatches messages.
 * It refuses to label future or unapproved content as a shipped release.
 */
const KINDS=new Set(['release','patch','notice','maintenance']);
const ID=/^[a-z0-9][a-z0-9-]{2,79}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const clean=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max&&value.trim()===value&&!/[\u0000-\u001f\u007f]/.test(value);
export function previewReleaseNotifications(feed,{now=Date.now(),seenIds=[]}={}){
 if(!Number.isSafeInteger(now)||!Array.isArray(seenIds)||seenIds.length>200||
   seenIds.some(id=>typeof id!=='string'||!ID.test(id)))throw Error('Invalid review options');
 if(!feed||feed.schema!==1||feed.source!=='approved-anevum-release-records'||
   !Array.isArray(feed.entries)||feed.entries.length>50)throw Error('Unapproved release source');
 const seen=new Set(seenIds),unique=new Set(),eligible=[];
 for(const item of feed.entries){
  if(!item||typeof item!=='object'||!ID.test(item.id)||unique.has(item.id)||
   !KINDS.has(item.kind)||!['everyone','testers'].includes(item.audience)||
   !DATE.test(item.publishedAt)||!clean(item.title,100)||!clean(item.summary,350)||
   !Array.isArray(item.changes)||item.changes.length<1||item.changes.length>9||
   !item.changes.every(change=>clean(change,220))||
   item.href!=='/updates#'+item.id)throw Error('Invalid release bulletin');
  const published=Date.parse(item.publishedAt+'T00:00:00Z');
  if(!Number.isFinite(published)||new Date(published).toISOString().slice(0,10)!==item.publishedAt)throw Error('Invalid release date');
  unique.add(item.id);
  if(published>now||seen.has(item.id))continue;
  eligible.push({id:item.id,kind:item.kind,audience:item.audience,title:item.title,
   summary:item.summary,publishedAt:item.publishedAt,href:item.href});
 }
 eligible.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 return {mode:'preview-only',source:'approved-anevum-release-records',shouldSend:false,
  count:eligible.length,items:eligible,reason:eligible.length?'approved-unseen-bulletins':'no-new-public-release'};
}
