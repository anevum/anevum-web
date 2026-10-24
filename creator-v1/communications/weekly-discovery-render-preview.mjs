/**
 * ANEVUM / IREN weekly Discovery: deterministic design preview ONLY.
 * Approved public data; no delivery envelope, recipients, tracking, send
 * action, scheduler, subscriber lookup or implicit authorization to email.
 */
import {selectWeeklyDiscoveryCandidates} from './weekly-discovery-preview.mjs';

const ENTITIES={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,ch=>ENTITIES[ch]);}
function projectHref(id){
 if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(id))throw Error('Unsafe public project ID');
 return 'https://anevum.com/projects/'+encodeURIComponent(id);
}
export function buildWeeklyDiscoveryDesignPreview(board,{now=Date.now()}={}){
 const selection=selectWeeklyDiscoveryCandidates(board,{now});
 const base={source:selection.source,mode:'preview-only',shouldSend:false,
  windowStart:selection.windowStart,windowEnd:selection.windowEnd,
  reason:selection.reason,count:selection.items.length};
 if(!selection.eligible)return {...base,html:null,text:null};
 const intro='Independent creations published on ANEVUM this week. This is an editorial preview, not a popularity ranking.';
 const plain=[
  'ANEVUM / CONTINUANCE INSTITUTE',
  'THIS WEEK IN THE UNIVERSE — DESIGN PREVIEW ONLY','',intro,'',
  ...selection.items.flatMap((item,i)=>[
   String(i+1)+'. '+item.title,
   'By '+item.creatorName+' (@'+item.creatorHandle+')',
   item.summary,projectHref(item.id),''
  ]),
  'Only approved public publications appear here.',
  'This is NOT an outbound email. Real newsletters require verified consent, suppression, and unsubscribe.'
 ].join('\n');
 const cards=selection.items.map(item=>
  '<article style="padding:24px 0;border-top:1px solid #455b73">'+
  '<p style="margin:0 0 7px;font:700 11px/1.5 system-ui;letter-spacing:.12em;color:#d7b88c">CREATOR / '+escapeHtml(item.creatorHandle)+'</p>'+
  '<h2 style="margin:0 0 8px;font:700 24px/1.25 system-ui;letter-spacing:-.025em;color:#f9f5ee">'+escapeHtml(item.title)+'</h2>'+
  '<p style="margin:0 0 12px;color:#c3d0df;font:14px/1.6 system-ui">By '+escapeHtml(item.creatorName)+'</p>'+
  (item.summary?'<p style="margin:0 0 15px;color:#dce6ee;font:15px/1.7 system-ui">'+escapeHtml(item.summary)+'</p>':'')+
  '<a href="'+projectHref(item.id)+'" style="display:inline-block;color:#9ce7f7;text-decoration:underline;text-underline-offset:4px;font:700 14px/1.5 system-ui">View published creation</a>'+
  '</article>'
 ).join('');
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow,noarchive">'+
  '<title>ANEVUM / Weekly Discovery - design preview</title></head>'+
  '<body style="margin:0;background:#070e19;color:#f6f0e7">'+
  '<main style="max-width:660px;margin:0 auto;padding:35px 25px;font:15px/1.65 system-ui,Arial,sans-serif">'+
  '<p style="margin:0 0 16px;font:700 11px/1.6 system-ui;letter-spacing:.18em;color:#efc993">ANEVUM / THE CONTINUANCE INSTITUTE</p>'+
  '<div style="border-top:1px solid #a4bbca;padding-top:28px">'+
  '<p style="margin:0 0 10px;font:700 11px/1.6 system-ui;letter-spacing:.15em;color:#a9e5f3">INDEPENDENT CREATIONS / WEEKLY DISCOVERY</p>'+
  '<h1 style="margin:0 0 18px;font:700 46px/1.08 system-ui;letter-spacing:-.045em;color:#faf4e8">This week in<br>the universe.</h1>'+
  '<p style="margin:0 0 33px;font:15px/1.7 system-ui;color:#d7e2ec">'+escapeHtml(intro)+'</p></div>'+
  cards+
  '<footer style="border-top:1px solid #455b73;padding-top:25px;margin-top:8px;color:#a9bccf;font:12px/1.65 system-ui">'+
  '<strong style="display:block;color:#efd2a2;margin-bottom:8px">REVIEW ONLY / NO EMAIL WILL BE SENT</strong>'+
  '<p style="margin:0">Only approved public publications appear here. A future actual email must include consent checks, a working unsubscribe mechanism and sender information. No tracking pixels, third-party assets or invented rankings.</p>'+
  '</footer></main></body></html>';
 return {...base,html,text:plain};
}
