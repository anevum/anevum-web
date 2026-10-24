/**
 * ANEVUM Creator Studio V120 quick-open model.
 * Filters ONLY owner-scoped file metadata already fetched by the existing
 * V111 service or the clearly labeled synthetic preview's local files.
 * Nothing here loads file content, writes data or interprets command strings.
 */
const clean=v=>typeof v==='string'?v.normalize('NFKC').toLocaleLowerCase('en').trim():'';
const lower=v=>clean(v).replace(/[\/\\]/g,' ');
export const PALETTE_MODES=Object.freeze(['files','commands']);
export function studioFileItems(nodes,paths=[],recentIds=[]){
 if(!Array.isArray(nodes))return [];
 const recent=new Set(recentIds.slice(0,8));
 return nodes.filter(x=>x&&x.kind!=='folder'&&typeof x.id==='string'&&typeof x.name==='string')
  .slice(0,100).map(item=>{
   const itemPath=paths.find(p=>p.id===item.id)?.path||item.name;
   return {id:'file:'+item.id,fileId:item.id,kind:'file',label:item.name,
    detail:itemPath,category:'FILES',priority:recent.has(item.id)?18:0,disabled:false};
  });
}
export function studioCommandItems(allowed){
 if(!Array.isArray(allowed))return [];
 const commands=[
  {id:'new-file',label:'File: New source file',detail:'Create a private text file',shortcut:'',category:'FILE'},
  {id:'new-folder',label:'File: New folder',detail:'Create in the current folder',shortcut:'',category:'FILE'},
  {id:'refresh-tree',label:'Explorer: Refresh files',detail:'Reload owner-scoped metadata',shortcut:'',category:'EXPLORER'},
  {id:'expand-folders',label:'Explorer: Expand all',detail:'Expand all project folders',shortcut:'',category:'EXPLORER'},
  {id:'collapse-folders',label:'Explorer: Collapse all',detail:'Collapse project folders',shortcut:'',category:'EXPLORER'},
  {id:'close-tabs',label:'Editor: Close all tabs',detail:'Checks before discarding changes',shortcut:'',category:'EDITOR'},
  {id:'toggle-trash',label:'Explorer: Toggle private Trash',detail:'View previously deleted items',shortcut:'',category:'EXPLORER'},
  {id:'open-world',label:'Studio: World Composer',detail:'Return to the real WebGL scene',shortcut:'',category:'STUDIO'},
  {id:'open-interface',label:'Studio: Interface Builder',detail:'Open responsive interface tools',shortcut:'',category:'STUDIO'},
  {id:'open-scripts',label:'Studio: Script Editor',detail:'Open code editing',shortcut:'',category:'STUDIO'}
 ];
 const allow=new Set(allowed);
 return commands.filter(c=>allow.has(c.id)).map(c=>({...c,kind:'command',disabled:false,priority:0}));
}
function subsequence(text,query){
 let at=0,gap=0;
 for(let i=0;i<text.length&&at<query.length;i++){
  if(text[i]===query[at])at++;
  else if(at)gap++;
 }
 return at===query.length?Math.max(1,24-Math.min(gap,22)):0;
}
function score(item,q){
 if(!q)return 8;
 const label=clean(item.label),path=lower(item.detail);
 if(label===q)return 160;
 if(label.startsWith(q))return 116-Math.min(label.length-q.length,30);
 const pos=label.indexOf(q);
 if(pos>=0)return 82-Math.min(pos,35);
 if(path.includes(q))return 65-Math.min(path.indexOf(q),50);
 const tokens=q.split(/\s+/).filter(Boolean);
 if(tokens.length>1&&tokens.every(t=>label.includes(t)||path.includes(t)))return 60;
 return subsequence(label,q);
}
export function rankStudioItems(items,query='',limit=12){
 if(!Array.isArray(items))return [];
 const q=clean(query),cap=Math.max(1,Math.min(20,Number.isFinite(limit)?Math.floor(limit):12));
 return items.slice(0,150).map((x,i)=>({x,i,score:score(x,q)}))
  .filter(x=>x.score>0)
  .sort((a,b)=>b.score+Math.min(24,b.x.priority||0)-a.score-Math.min(24,a.x.priority||0)
   ||a.i-b.i)
  .slice(0,cap).map(x=>x.x);
}
