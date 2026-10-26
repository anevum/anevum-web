import {useEffect,useRef,useState} from 'react';

export type SourcePreviewDevice='desktop'|'phone'|'small-phone';
const devices:Record<SourcePreviewDevice,{width:number;height:number;label:string;name:string}>={
 desktop:{width:1280,height:720,label:'Desktop',name:'Desktop preview'},
 phone:{width:390,height:844,label:'Phone',name:'Phone preview'},
 'small-phone':{width:320,height:720,label:'Small phone',name:'Small phone preview'}
};

/** One scriptless, opaque-origin frame. Scaling changes presentation only;
 * the real CSS viewport remains the selected width for responsive layout. */
export function SourcePreviewV136({html,device,onDevice,focused,onFocused}:{
 html:string;device:SourcePreviewDevice;onDevice:(device:SourcePreviewDevice)=>void;
 focused:boolean;onFocused:(focused:boolean)=>void;
}){
 const viewport=useRef<HTMLDivElement>(null);
 const [available,setAvailable]=useState(0);
 useEffect(()=>{
  const node=viewport.current;if(!node)return;
  const measure=()=>{
   const css=getComputedStyle(node);
   setAvailable(Math.max(1,node.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-2));
  };
  measure();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);
  observer?.observe(node);window.addEventListener('resize',measure);
  return()=>{observer?.disconnect();window.removeEventListener('resize',measure)};
 },[focused]);
 const preset=devices[device],scale=Math.min(1,available/preset.width);
 return <div className="p136037-preview" data-source-preview="local" aria-label="Isolated local HTML and CSS preview">
  <header className="p136037-preview-header">
   <div><strong>LAYOUT PREVIEW</strong><span>HTML + CSS / LOCAL</span></div>
   <button type="button" className="p136030-preview-focus" aria-pressed={focused}
    aria-label={focused?'Return to source editor':'Focus layout preview'}
    onClick={()=>onFocused(!focused)}>{focused?'Return to editor':'Focus preview'}</button>
   <div className="p136037-preview-devices" role="group" aria-label="Preview device size">
    {(Object.keys(devices) as SourcePreviewDevice[]).map(key=><button key={key} type="button"
     aria-label={devices[key].name} aria-pressed={device===key} onClick={()=>onDevice(key)}>{devices[key].label}</button>)}
   </div>
  </header>
  <div className="p136030-preview-readout" aria-label="Preview viewport dimensions">
   <span>{preset.width} × {preset.height} CSS px</span><span>Fit {Math.round(scale*100)}%</span>
  </div>
  <div ref={viewport} className="p136037-preview-viewport" data-source-preview-device={device}
   tabIndex={0} aria-label="Layout preview canvas">
   {available>0&&<div className="p136030-preview-canvas" style={{width:preset.width*scale,height:preset.height*scale}}>
    <iframe title="Isolated local HTML and CSS preview" data-source-preview-frame
     sandbox="" referrerPolicy="no-referrer" loading="eager" srcDoc={html}
     style={{width:preset.width,height:preset.height,transform:`scale(${scale})`,border:0}}/>
   </div>}
  </div>
  <p>Live HTML/CSS layout. JavaScript stays off here. Prepare the build archive, then use the private playtest for interaction.</p>
 </div>;
}
