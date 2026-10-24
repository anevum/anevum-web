import {useEffect,useRef,useState} from 'react';
import {fragmentSource,vertexSource} from './living-world-shaders';
import {useLivingWorld,worldDensity,type WorldSector} from './LivingWorldState';
import './living-world-v136.css';

const palette:Record<WorldSector,[number,number,number]>={
  hero:[0.27,0.71,1.0],portal:[0.36,0.69,1.0],
  games:[0.61,0.42,1.0],tools:[0.24,0.82,1.0],
  creative:[0.91,0.46,0.97],research:[0.40,0.68,1.0],
  libraries:[0.36,0.90,0.79],learning:[0.78,0.63,1.0],
  automation:[0.55,0.70,1.0],other:[0.62,0.69,0.96]
};
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
  const names=['u_resolution','u_pointer','u_time','u_density','u_verified','u_tone'];
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
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  const cap=window.innerWidth<=600?2:1.75;
  const requested=Math.min(window.devicePixelRatio||1,cap);
  const budget=Math.min(1,Math.sqrt(3_100_000/Math.max(1,width*height*requested*requested)));
  const ratio=Math.max(0.55,requested*budget);
  const w=Math.max(1,Math.round(width*ratio));
  const h=Math.max(1,Math.round(height*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  gl.viewport(0,0,w,h);
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
  const phase=useRef(0);
  const {signal,paused}=useLivingWorld();
  const [renderer,setRenderer]=useState<Renderer>('booting');
  const [reduced,setReduced]=useState(false);
  const [visible,setVisible]=useState(true);
  const [saveData,setSaveData]=useState(false);
  const density=worldDensity(signal,sector);
  const active=enabled&&!paused&&!reduced&&!saveData&&visible&&renderer==='webgl';
  const tone=palette[sector];
  const param=useRef({density,tone,verified:signal.source==='verified',active});
  param.current={density,tone,verified:signal.source==='verified',active};

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
    const render=(milliseconds:number)=>{
      const compiledNow=compiled.current;
      if(!compiledNow)return;
      const {gl,program,buffer,location}=compiledNow;
      if(gl.isContextLost())return;
      const {density,tone,verified}=param.current;
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.uniform2f(location[0],gl.drawingBufferWidth,gl.drawingBufferHeight);
      gl.uniform2f(location[1],pointer.current[0],pointer.current[1]);
      gl.uniform1f(location[2],milliseconds/1000);
      gl.uniform1f(location[3],density);
      gl.uniform1f(location[4],verified?1:0);
      gl.uniform3f(location[5],tone[0],tone[1],tone[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    if(renderer!=='webgl'||!enabled)return;
    let lastTick=0,lastDraw=0;
    const tick=(now:number)=>{
      if(!param.current.active)return;
      if(!lastTick)lastTick=now;
      const delta=Math.min(100,now-lastTick);lastTick=now;
      if(now-lastDraw>=1000/30){
        phase.current+=delta;
        render(phase.current);
        lastDraw=now;
      }
      raf.current=requestAnimationFrame(tick);
    };
    if(active)raf.current=requestAnimationFrame(tick);
    else render(phase.current);
    return()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null};
  },[enabled,active,renderer,sector,density,signal.source,tone]);

  const anchorCount=signal.source==='verified'?Math.max(2,Math.min(15,Math.floor(2+density*12))):3;
  return <div className="p136-living-world" data-enabled={enabled} data-active={active}
      data-renderer={renderer==='booting'?'vector':renderer} data-sector={sector} data-source={signal.source}
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
