import {useEffect,useRef,useState} from 'react';
import type {PointerEvent,WheelEvent,KeyboardEvent} from 'react';
import type {WorldDocument,WorldCamera} from '../../../world-composer/document.mjs';
import {createWorldRenderer,type WorldRenderer} from './world-webgl2-v115';

type Props={
 document:WorldDocument;camera:WorldCamera;selection:string|null;
 onCamera:(next:WorldCamera)=>void;onSelect:(id:string|null)=>void;
};
type Status='initializing'|'webgl2'|'unsupported'|'lost'|'error';
type Pointer={x:number;y:number;moved:boolean};
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));

/** Actual GPU canvas with invalidation rendering; sleep when not visible,
 * clamp DPR, retain accessible inspector fallback for unsupported devices.
 */
export function WorldCanvasV115({document,camera,selection,onCamera,onSelect}:Props){
 const ref=useRef<HTMLCanvasElement>(null);
 const engine=useRef<WorldRenderer|null>(null);
 const gesture=useRef<Pointer|null>(null);
 const frame=useRef<number|null>(null);
 const current=useRef<Props>({document,camera,selection,onCamera,onSelect});
 const [status,setStatus]=useState<Status>('initializing');
 const [reason,setReason]=useState('');
 const [restartKey,setRestartKey]=useState(0);
 current.current={document,camera,selection,onCamera,onSelect};
 function schedule(){
  if(frame.current!==null||documentVisibilityHidden())return;
  frame.current=requestAnimationFrame(()=>{
   frame.current=null;
   const canvas=ref.current,renderer=engine.current;
   if(!canvas||!renderer)return;
   const rect=canvas.getBoundingClientRect();
   if(rect.width<1||rect.height<1)return;
   try{
    const p=current.current;
    renderer.render(p.document,p.camera,p.selection,rect.width,rect.height);
   }catch(error){
    setReason(error instanceof Error?error.message:'GPU rendering failed');
    setStatus('error');
    renderer.dispose();engine.current=null;
   }
  });
 }
 function documentVisibilityHidden(){return typeof window==='undefined'||window.document.hidden;}
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  let closed=false;
  function init(){
   if(closed)return;
   if(engine.current){engine.current.dispose();engine.current=null;}
   try{
    engine.current=createWorldRenderer(canvas!);
    setStatus('webgl2');setReason('');schedule();
   }catch(error){
    setReason(error instanceof Error?error.message:'WebGL2 unavailable');
    setStatus('unsupported');
   }
  }
  function contextLost(event:Event){
   event.preventDefault();engine.current?.dispose();engine.current=null;
   setReason('Graphics context lost. The scene document and editor remain available.');
   setStatus('lost');
  }
  function contextRestored(){init();}
  const observer=new ResizeObserver(()=>schedule());
  observer.observe(canvas);
  const visible=()=>schedule();
  window.document.addEventListener('visibilitychange',visible);
  canvas.addEventListener('webglcontextlost',contextLost);
  canvas.addEventListener('webglcontextrestored',contextRestored);
  init();
  return ()=>{
   closed=true;observer.disconnect();window.document.removeEventListener('visibilitychange',visible);
   canvas.removeEventListener('webglcontextlost',contextLost);
   canvas.removeEventListener('webglcontextrestored',contextRestored);
   if(frame.current!==null)cancelAnimationFrame(frame.current);
   frame.current=null;engine.current?.dispose();engine.current=null;
  };
  // Recreate GPU resources only after an explicit retry; ordinary edits use refs.
 },[restartKey]);
 useEffect(()=>{if(status==='webgl2')schedule();},[document,camera,selection,status]);
 function orbit(dx:number,dy:number){
  const p=current.current;
  p.onCamera({...p.camera,yaw:clamp(p.camera.yaw-dx*.008,-50,50),
   pitch:clamp(p.camera.pitch+dy*.007,-1.32,1.32)});
 }
 function zoom(delta:number){
  const p=current.current;
  p.onCamera({...p.camera,distance:clamp(p.camera.distance+delta,4,80)});
 }
 function down(event:PointerEvent<HTMLCanvasElement>){
  if(status!=='webgl2'||event.button!==0)return;
  gesture.current={x:event.clientX,y:event.clientY,moved:false};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function move(event:PointerEvent<HTMLCanvasElement>){
  const g=gesture.current;if(!g)return;
  const dx=event.clientX-g.x,dy=event.clientY-g.y;
  if(Math.abs(dx)+Math.abs(dy)<1)return;
  g.moved=true;g.x=event.clientX;g.y=event.clientY;orbit(dx,dy);
 }
 function up(event:PointerEvent<HTMLCanvasElement>){
  const g=gesture.current;if(!g)return;
  gesture.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))
   event.currentTarget.releasePointerCapture(event.pointerId);
  if(g.moved)return;
  const bounds=event.currentTarget.getBoundingClientRect(),p=current.current;
  const hit=engine.current?.pick(p.document,p.camera,event.clientX-bounds.left,
   event.clientY-bounds.top,bounds.width,bounds.height)||null;
  if(hit)p.onSelect(hit);
  schedule();
 }
 function wheel(event:WheelEvent<HTMLCanvasElement>){
  if(status!=='webgl2')return;
  event.preventDefault();zoom(Math.sign(event.deltaY)*Math.max(.5,Math.abs(event.deltaY)*.015));
 }
 function retryGraphics(){
  gesture.current=null;
  if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null;}
  engine.current?.dispose();engine.current=null;
  setStatus('initializing');setReason('');
  setRestartKey(value=>value+1);
 }
 function keydown(event:KeyboardEvent<HTMLCanvasElement>){
  if(status!=='webgl2')return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0'].includes(event.key))event.preventDefault();
  if(event.key==='ArrowLeft')orbit(-22,0);
  if(event.key==='ArrowRight')orbit(22,0);
  if(event.key==='ArrowUp')orbit(0,-20);
  if(event.key==='ArrowDown')orbit(0,20);
  if(event.key==='+'||event.key==='=')zoom(-1.8);
  if(event.key==='-')zoom(1.8);
  if(event.key==='0')current.current.onCamera(current.current.document.camera);
 }
 return <div className={"cvw-canvas-container"+(document.environment.sky==="night"?" is-night":"")} data-world-canvas-v115={status} data-camera-yaw={camera.yaw.toFixed(3)}>
  <canvas key={restartKey} ref={ref} className="cvw-world-canvas" tabIndex={0}
   aria-label="Interactive WebGL2 world. Drag to orbit; mouse wheel or plus and minus to zoom; arrow keys rotate; click an object to select. The scene hierarchy offers an accessible alternate selection method."
   onPointerDown={down} onPointerMove={move} onPointerUp={up}
   onPointerCancel={()=>{gesture.current=null;}}
   onWheel={wheel} onKeyDown={keydown}/>
  {status!=='webgl2'&&<div className="cvw-renderer-fallback" role="status">
   <div className="cvw-fallback-orbit" aria-hidden="true"/>
   <strong>{status==='initializing'?'Initializing local graphics…':
    status==='lost'?'Graphics context interrupted':
    status==='unsupported'?'WebGL2 unavailable on this device':'World renderer unavailable'}</strong>
   <p>{reason||'Your objects and document are still accessible in the hierarchy and Inspector.'}</p>
   <p>Use the object hierarchy and transform inputs while the 3D viewport is unavailable.</p>
   {status!=='initializing'&&<button type="button" className="cvw-retry-graphics" onClick={retryGraphics}>Retry graphics on a fresh canvas</button>}
  </div>}
  {status==='webgl2'&&<div className="cvw-renderer-live" role="status">
   <span className="cvw-signal-dot"/> WEBGL2 / LOCAL DEVICE GPU
  </div>}
  <div className="cvw-viewport-instructions">DRAG TO ORBIT · SCROLL TO ZOOM · CLICK TO SELECT</div>
 </div>;
}
