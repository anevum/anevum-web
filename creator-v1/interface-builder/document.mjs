// V113: declarative, bounded, text-only UI documents; never executed as HTML or JS.
// Each document is saved as a regular, revisioned private Studio text source file.
export const PREFIX='ANEVUM_UI_V1\n';
export const SCHEMA='anevum.ui.v1';
export const KINDS=Object.freeze(['heading','paragraph','card','button','input','counter','notice','divider']);
export const THEMES=Object.freeze(['continuance','midnight','dawn']);
export const TONES=Object.freeze(['neutral','accent','success','warning']);
export const ALIGNS=Object.freeze(['start','center','end']);
export const WIDTHS=Object.freeze(['full','half']);
export const ACTIONS=Object.freeze(['none','navigate','increment','decrement','toggle','reset']);
export const LIMITS=Object.freeze({pages:8,componentsPerPage:24,components:64,title:100,text:800,name:80,bytes:28000});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const INVALID_TEXT=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const safeText=(s,max)=>typeof s==='string'&&s.length<=max&&!INVALID_TEXT.test(s);
const validId=s=>typeof s==='string'&&UUID.test(s);

export function component(kind='paragraph',title='',text=''){
 if(!KINDS.includes(kind))throw Error('Unsupported interface component.');
 return {id:crypto.randomUUID(),kind,title,text,tone:'neutral',align:'start',
  width:'full',action:'none',target:null};
}
export function page(name='New page'){
 if(!safeText(name,LIMITS.name)||!name.trim())throw Error('Invalid page name.');
 return {id:crypto.randomUUID(),name,components:[]};
}
export function validate(value){
 if(!exact(value,['schema','name','theme','pages'])||value.schema!==SCHEMA||
  !safeText(value.name,LIMITS.name)||!value.name.trim()||
  !THEMES.includes(value.theme)||!Array.isArray(value.pages)||
  value.pages.length<1||value.pages.length>LIMITS.pages)
  throw Error('Unsupported interface document. The original source was not changed.');
 const seen=new Set(),pageIds=new Set(),pages=[];
 let total=0;
 for(const pg of value.pages){
  if(!exact(pg,['id','name','components'])||!validId(pg.id)||pageIds.has(pg.id)||
   !safeText(pg.name,LIMITS.name)||!pg.name.trim()||
   !Array.isArray(pg.components)||pg.components.length>LIMITS.componentsPerPage)
   throw Error('Invalid page structure.');
  pageIds.add(pg.id);
  const components=[];
  for(const item of pg.components){
   if(!exact(item,['id','kind','title','text','tone','align','width','action','target'])||
    !validId(item.id)||seen.has(item.id)||!KINDS.includes(item.kind)||
    !safeText(item.title,LIMITS.title)||!safeText(item.text,LIMITS.text)||
    !TONES.includes(item.tone)||!ALIGNS.includes(item.align)||!WIDTHS.includes(item.width)||
    !ACTIONS.includes(item.action)||!(item.target===null||validId(item.target))||
    (item.kind!=='button'&&(item.action!=='none'||item.target!==null))||
    (item.kind==='button'&&
     ((item.action==='none'||item.action==='reset')&&item.target!==null||
      !['none','reset'].includes(item.action)&&item.target===null)))
    throw Error('Invalid component or interaction.');
   seen.add(item.id);
   components.push({...item});
  }
  total+=components.length;
  pages.push({id:pg.id,name:pg.name,components});
 }
 if(total>LIMITS.components)throw Error('Interface component limit reached.');
 const pagesById=new Set(pages.map(p=>p.id));
 for(const pg of pages){
  for(const c of pg.components){
   if(c.action==='navigate'&&!pagesById.has(c.target))
    throw Error('Button links to a missing page.');
   if(['increment','decrement','toggle'].includes(c.action)){
    const target=pg.components.find(t=>t.id===c.target);
    if(!target||target.kind!==(c.action==='toggle'?'notice':'counter'))
     throw Error('Button interaction must target an appropriate component on its own page.');
   }
  }
 }
 return {schema:SCHEMA,name:value.name,theme:value.theme,pages};
}
export function encode(value){
 const text=PREFIX+JSON.stringify(validate(value));
 if(new TextEncoder().encode(text).length>LIMITS.bytes)
  throw Error('Interface source exceeds the 28 KiB pilot limit. Reduce page content before saving.');
 return text;
}
export function decode(raw){
 if(typeof raw!=='string'||!raw.startsWith(PREFIX)||
  new TextEncoder().encode(raw).length>LIMITS.bytes)return null;
 try{
  const parsed=validate(JSON.parse(raw.slice(PREFIX.length)));
  return encode(parsed)===raw?parsed:null;
 }catch{return null;}
}
export function removeComponent(doc,pageId,componentId){
 const valid=validate(doc);
 const pages=valid.pages.map(pg=>pg.id!==pageId?pg:{
  ...pg,components:pg.components.filter(c=>c.id!==componentId).map(c=>c.target===componentId?
   {...c,action:'none',target:null}:c)});
 return validate({...valid,pages});
}
export function removePage(doc,id){
 const valid=validate(doc);
 if(valid.pages.length===1)throw Error('At least one page must remain.');
 const pages=valid.pages.filter(pg=>pg.id!==id).map(pg=>({
  ...pg,components:pg.components.map(c=>c.action==='navigate'&&c.target===id?
   {...c,action:'none',target:null}:c)
 }));
 return validate({...valid,pages});
}
export function starter(){
 const home=page('Signal Overview'),details=page('Archive Details');
 const hero=component('heading','The Continuance Institute','');
 const intro=component('paragraph','','A living interface built inside ANEVUM Creator Studio.');
 const metric=component('counter','Recorded signals','0');
 const increment=component('button','Record signal','');increment.action='increment';increment.target=metric.id;increment.tone='accent';increment.width='half';
 const learn=component('button','Explore archive','');learn.action='navigate';learn.target=details.id;learn.width='half';
 const notice=component('notice','Signal received','Your interaction was registered in this local preview.');notice.tone='success';
 const toggle=component('button','Toggle reception notice','');toggle.action='toggle';toggle.target=notice.id;
 const back=component('button','Return to overview','');back.action='navigate';back.target=home.id;
 const detailText=component('card','Explore this interface','Add pages, components and actions. Nothing here executes third-party code or contacts a server.');
 home.components=[hero,intro,metric,increment,learn,notice,toggle];
 details.components=[detailText,back];
 return validate({schema:SCHEMA,name:'Signal Interface',theme:'continuance',pages:[home,details]});
}
