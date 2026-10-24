import {useEffect,useRef,useState} from 'react';
import {fragmentSource,vertexSource} from './living-world-shaders';
import {sceneProfile,frameFor,advanceSceneFrame,sceneRenderSize,type SceneFrame} from './SceneDirectorV136';
import {useLivingWorld,worldDensity,type WorldSector} from './LivingWorldState';
import './living-world-v136.css';
import './scene-materials-v136.css';

/** All route colors, camera targets and geometry families come from SceneDirectorV136. */
type Renderer='booting'|'webgl'|'vector';
type Compiled={
  gl:WebGL2RenderingContext;
  program:WebGLProgram;
  buffer:WebGLBuffer;
  location:WebGLUniformLocation[];
};
function shader(gl:WebGL2RenderingContext,kind:number,source:string){
  const result=gl.createShader(kind);
  if(!result)throw Error('Shader allocation unavailable');
  gl.shaderSource(result,source);gl.compileShader(result);
  if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){
    gl.deleteShader(result);throw Error('Procedural environment shader is unsupported');
  }
  return result;
}
function compile(gl:WebGL2RenderingContext):Compiled{
  const vert=shader(gl,gl.VERTEX_SHADER,vertexSource);
  const frag=shader(gl,gl.FRAGMENT_SHADER,fragmentSource);
  const program=gl.createProgram();
  if(!program){gl.deleteShader(vert);gl.deleteShader(frag);throw Error('Shader program unavailable')}
  gl.attachShader(program,vert);gl.attachShader(program,frag);
  gl.linkProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
    gl.deleteProgram(program);throw Error('Procedural world program unsupported')
  }
  const buffer=gl.createBuffer();
  if(!buffer){gl.deleteProgram(program);throw Error('World buffer unavailable')}
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);
  const position=gl.getAttribLocation(program,'a_position');
  if(position<0){gl.deleteBuffer(buffer);gl.deleteProgram(program);throw Error('World vertex attribute unavailable')}
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const names=['u_resolution','u_pointer','u_time','u_density','u_verified','u_tone','u_pulse','u_center','u_architecture','u_shape','u_signature'];
  const location=names.map(name=>gl.getUniformLocation(program,name));
  if(location.some(x=>x===null)){
    gl.deleteBuffer(buffer);gl.deleteProgram(program);throw Error('World uniforms unavailable')
  }
  return {gl,program,buffer,location:location as WebGLUniformLocation[]};
}
function dispose(compiled:Compiled|null){
  if(!compiled)return;
  try{
    compiled.gl.deleteBuffer(compiled.buffer);
    compiled.gl.deleteProgram(compiled.program);
  }catch{/* Context may already have been lost. */}
}
function resize(canvas:HTMLCanvasElement,gl:WebGL2RenderingContext){
  const size=sceneRenderSize(canvas.clientWidth,canvas.clientHeight,window.devicePixelRatio||1);
  if(canvas.width!==size.width||canvas.height!==size.height){
    canvas.width=size.width;canvas.height=size.height;
  }
  gl.viewport(0,0,size.width,size.height);
}

/** Single persistent canvas above the site backdrop and below actual UI.
 * GPU work uses only sanitized public aggregate counts plus transient local
 * pointer coordinates. There is no pixel readback, analytics or private input.
 */
export function LivingWorldField({sector='hero',enabled}:{sector?:WorldSector;enabled:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const compiled=useRef<Compiled|null>(null);
  const raf=useRef<number|null>(null);
  const pointer=useRef<[number,number]>([0,0]);
  const architecturalBlend=useRef(0);
  const pulse=useRef(0);
  const phase=useRef(0);
  const {signal,paused,previewSector}=useLivingWorld();
  const [renderer,setRenderer]=useState<Renderer>('booting');
  const [reduced,setReduced]=useState(false);
  const [visible,setVisible]=useState(true);
  const [saveData,setSaveData]=useState(false);
  const activeSector=enabled?(previewSector||sector):sector;
  const density=worldDensity(signal,activeSector);
  const motionAllowed=enabled&&!paused&&!reduced&&!saveData&&visible;
  const active=motionAllowed&&renderer==='webgl';
  const scene=sceneProfile(activeSector);
  const target=frameFor(scene,density);
  const directorFrame=useRef<SceneFrame>(target);
  const architecture=activeSector==='community'?1:activeSector==='creators'?2:activeSector==='studio'?3:activeSector==='games'?4:0;
  const param=useRef({target,architecture,verified:signal.source==='verified',active});
  param.current={target,architecture,verified:signal.source==='verified',active};

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean;addEventListener?:(event:string,fn:()=>void)=>void;removeEventListener?:(event:string,fn:()=>void)=>void}}).connection;
    const sync=()=>{setReduced(media.matches);setSaveData(Boolean(connection?.saveData))};
    const observeVisibility=()=>setVisible(document.visibilityState==='visible');
    sync();observeVisibility();
    media.addEventListener('change',sync);
    connection?.addEventListener?.('change',sync);
    document.addEventListener('visibilitychange',observeVisibility);
    return()=>{media.removeEventListener('change',sync);connection?.removeEventListener?.('change',sync);document.removeEventListener('visibilitychange',observeVisibility)};
  },[]);

  useEffect(()=>{
    const element=canvas.current;
    if(!element)return;
    let disposed=false;
    let webgl:WebGL2RenderingContext|null=null;
    const initialize=()=>{
      dispose(compiled.current);compiled.current=null;
      try{
        webgl=element.getContext('webgl2',{
          alpha:false,antialias:false,depth:false,stencil:false,
          premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'
        });
        if(!webgl)throw Error('WebGL2 not available');
        compiled.current=compile(webgl);
        resize(element,webgl);
        if(!disposed)setRenderer('webgl');
      }catch{
        dispose(compiled.current);compiled.current=null;
        if(!disposed)setRenderer('vector');
      }
    };
    const lost=(event:Event)=>{event.preventDefault();compiled.current=null;if(!disposed)setRenderer('vector')};
    const restored=()=>{if(!disposed)initialize()};
    element.addEventListener('webglcontextlost',lost);
    element.addEventListener('webglcontextrestored',restored);
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>{
      if(compiled.current)resize(element,compiled.current.gl)
    }):null;
    ro?.observe(element);
    const onResize=()=>{if(compiled.current)resize(element,compiled.current.gl)};
    window.addEventListener('resize',onResize,{passive:true});
    initialize();
    return()=>{
      disposed=true;
      ro?.disconnect();window.removeEventListener('resize',onResize);
      element.removeEventListener('webglcontextlost',lost);
      element.removeEventListener('webglcontextrestored',restored);
      dispose(compiled.current);compiled.current=null;
    };
  },[]);

  useEffect(()=>{
    if(!enabled||paused||reduced||saveData||!visible)return;
    const move=(event:PointerEvent)=>{
      pointer.current=[
        Math.max(-1,Math.min(1,(event.clientX/window.innerWidth-0.5)*2)),
        Math.max(-1,Math.min(1,(0.5-event.clientY/window.innerHeight)*2))
      ];
    };
    window.addEventListener('pointermove',move,{passive:true});
    return()=>window.removeEventListener('pointermove',move);
  },[enabled,paused,reduced,saveData,visible]);

  useEffect(()=>{
    if(!enabled)return;
    const interaction=(target:EventTarget|null)=>{
      if(target instanceof Element&&target.closest('button,a,input,[role="button"]'))
        pulse.current=1;
    };
    const tap=(event:PointerEvent)=>interaction(event.target);
    const press=(event:KeyboardEvent)=>{
      if(event.key==='Enter'||event.key===' ')interaction(event.target);
    };
    window.addEventListener('pointerdown',tap,{passive:true});
    window.addEventListener('keydown',press);
    return()=>{window.removeEventListener('pointerdown',tap);window.removeEventListener('keydown',press)};
  },[enabled]);

  useEffect(()=>{
    const render=(milliseconds:number,elapsedMs:number)=>{
      const compiledNow=compiled.current;
      if(!compiledNow)return;
      const {gl,program,buffer,location}=compiledNow;
      if(gl.isContextLost())return;
      const {target,architecture,verified}=param.current;
      directorFrame.current=advanceSceneFrame(directorFrame.current,target,elapsedMs,param.current.active);
      const frame=directorFrame.current;
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.uniform2f(location[0],gl.drawingBufferWidth,gl.drawingBufferHeight);
      gl.uniform2f(location[1],pointer.current[0],pointer.current[1]);
      gl.uniform1f(location[2],milliseconds/1000);
      gl.uniform1f(location[3],frame.density);
      gl.uniform1f(location[4],verified?1:0);
      architecturalBlend.current+=(architecture-architecturalBlend.current)*(param.current.active?(1-Math.exp(-elapsedMs/220)):1);
      gl.uniform3f(location[5],frame.tone[0],frame.tone[1],frame.tone[2]);
      gl.uniform1f(location[6],pulse.current);
      gl.uniform3f(location[7],frame.camera[0],frame.camera[1],frame.camera[2]);
      gl.uniform1f(location[8],architecturalBlend.current);
      gl.uniform4f(location[9],frame.silhouette[0],frame.silhouette[1],
        frame.silhouette[2],frame.silhouette[3]);
      gl.uniform1f(location[10],frame.signature);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    if(renderer!=='webgl'||!enabled)return;
    let lastDraw=0;
    const interval=sceneRenderSize(canvas.current?.clientWidth||window.innerWidth,
      canvas.current?.clientHeight||window.innerHeight,window.devicePixelRatio||1).frameIntervalMs;
    const tick=(now:number)=>{
      if(!param.current.active)return;
      if(now-lastDraw>=interval){
        const elapsed=lastDraw?Math.min(100,now-lastDraw):interval;
        lastDraw=now;
        phase.current+=elapsed;
        pulse.current=Math.max(0,pulse.current-elapsed/380);
        render(phase.current,elapsed);
      }
      raf.current=requestAnimationFrame(tick);
    };
    if(active)raf.current=requestAnimationFrame(tick);
    else render(phase.current,0);
    return()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null};
  },[enabled,active,renderer,activeSector,density,signal.source,scene]);

  const anchorCount=signal.source==='verified'?Math.max(2,Math.min(15,Math.floor(2+density*12))):3;
  return <div className="p136-living-world" data-enabled={enabled} data-active={active} data-motion={motionAllowed}
      data-renderer={renderer==='booting'?'vector':renderer} data-sector={activeSector} data-geometry={scene.geometry} data-source={signal.source} data-anchors={anchorCount}
      aria-hidden="true">
    <canvas ref={canvas} className="p136-living-canvas"/>
    <svg className="p136-living-vector" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="p136-living-nebula"><stop stopColor="#243e80"/><stop offset=".58" stopColor="#0b1a3b"/><stop offset="1" stopColor="#040b19"/></radialGradient>
        <radialGradient id="p136-living-core"><stop stopColor="#8ae6ff"/><stop offset=".18" stopColor="#3a8cbe"/><stop offset=".77" stopColor="#132b59"/><stop offset="1" stopColor="#060e28"/></radialGradient>
        <linearGradient id="p136-living-orbit"><stop stopColor="#4ce9ff" stopOpacity=".04"/><stop offset=".5" stopColor="#b1e9ff"/><stop offset="1" stopColor="#a787ff" stopOpacity=".12"/></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#p136-living-nebula)"/>
      <g className="p136-living-orbitals">
        <ellipse cx="1080" cy="410" rx={315+density*60} ry="132" transform="rotate(-28 1080 410)" fill="none" stroke="url(#p136-living-orbit)" strokeWidth="6"/>
        <ellipse cx="1080" cy="410" rx={260+density*42} ry="193" transform="rotate(37 1080 410)" fill="none" stroke="url(#p136-living-orbit)" strokeWidth="2"/>
        <circle cx="1080" cy="410" r="152" fill="url(#p136-living-core)" stroke="#69c9ee" strokeOpacity=".38" strokeWidth="3"/>
        <circle cx="1080" cy="410" r="171" fill="none" stroke="#75dbff" strokeOpacity=".25" strokeWidth="18"/>
      </g>
      <g stroke="#60b8e6" strokeOpacity=".20" fill="none">
        {Array.from({length:13},(_,i)=><path key={'floor'+i} d={'M'+(i*160-260)+' 900L'+(680+(i-6)*25)+' 555'} strokeWidth="1"/>)}
        {Array.from({length:6},(_,i)=><path key={'lane'+i} d={'M0 '+(625+i*i*11)+'H1600'}/>)}
      </g>
      <g fill="#a7e8ff">
        {Array.from({length:anchorCount},(_,i)=>{
          const a=i*2.399963;
          const x=1080+Math.cos(a)*330,y=410+Math.sin(a)*210;
          return <circle key={'signal'+i} cx={x} cy={y} r={i%4===0?4:2} opacity={.4+(i%3)*.18}/>;
        })}
      </g>
    </svg>
    <div className="p136-living-shade"/>
  </div>;
}
