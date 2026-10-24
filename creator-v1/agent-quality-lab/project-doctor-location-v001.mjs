// Pure Project Doctor path resolver for *local* Studio visual selection only.
// Reads canonical document IDs; never edits source, fetches data or uses project metadata.
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';

const INDEX='(?:0|[1-9][0-9]{0,2})';
const STORY_PATH=new RegExp('^blocks/('+INDEX+')$');
const PAGE_PATH=new RegExp('^pages/('+INDEX+')$');
const COMPONENT_PATH=new RegExp('^pages/('+INDEX+')/components/('+INDEX+')$');

/**
 * Returns an allowlisted, stable selection target for a validated document.
 * Null means the location cannot be selected safely in an existing visual editor.
 * @param {string} source
 * @param {string} path
 */
export function locateProjectDoctorFinding(source,path){
  if(typeof source!=='string'||typeof path!=='string'||path.length>56)return null;
  if(source.startsWith(blocks.PREFIX)){
    const match=STORY_PATH.exec(path);
    if(!match)return null;
    const doc=blocks.decode(source);
    const block=doc?.blocks[Number(match[1])];
    return block?{kind:'scene',blockId:block.id}:null;
  }
  if(source.startsWith(ui.PREFIX)){
    const component=COMPONENT_PATH.exec(path);
    const page=component?null:PAGE_PATH.exec(path);
    if(!component&&!page)return null;
    const doc=ui.decode(source);
    const pageIndex=Number(component?component[1]:page[1]);
    const selectedPage=doc?.pages[pageIndex];
    if(!selectedPage)return null;
    const selectedComponent=component?selectedPage.components[Number(component[2])]:null;
    if(component&&!selectedComponent)return null;
    return {kind:'interface',pageId:selectedPage.id,componentId:selectedComponent?.id||null};
  }
  return null;
}
