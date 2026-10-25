/* ANEVUM / Portfolio V136.040 — original single-canvas Transcosmic field.
   True perspective WebGL2 geometry and 3D star volumes; no CDN, no telemetry,
   no video or audio, no publication features. Decorative; semantic DOM remains.
*/
(() => {
  'use strict';
  const stage = document.querySelector('[data-transcosmic-field]');
  const canvas = stage?.querySelector('canvas[data-depth-canvas]');
  if (!stage || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  const weakDevice = Number(navigator.deviceMemory || 4) <= 2;
  const root = document.documentElement;
  const selectors = [...document.querySelectorAll('[data-universe-stage]')];
  const liveName = document.querySelector('[data-universe-name]');
  const liveDescription = document.querySelector('[data-universe-description]');
  const modeNote = document.querySelector('.universe-disclaimer');
  const markFallback=()=>{
    stage.dataset.renderMode='fallback';
    stage.dataset.sceneDepth='static';
    if(modeNote)modeNote.textContent='STATIC ART FALLBACK / 3D NOT AVAILABLE';
  };
  const scenes = [
    ['THE THRESHOLD', 'An opening into work, worlds, and unfinished possibilities.'],
    ['THE ARCHIVE', 'Many disciplines. One continuing record of what becomes real.'],
    ['THE CONTINUUM', 'Beyond a single screen, story, product, or lifetime.']
  ];
  let sector = 0;
  let visible = true;
  let disposed = false;
  let frame = 0;
  let lastTime = 0;
  let lastDrawTime = 0;
  let clock = 0;
  let pointer = [0, 0];
  let eased = [0, 0];
  let travel = 0;
  let gl = null;
  let drawScene = null;
  const motionEnabled = () => !document.hidden && visible && !saveData &&
    !reduced.matches && !root.classList.contains('motion-paused');
  const describe = value => {
    sector = value;
    selectors.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.universeStage) === sector)));
    if (liveName) liveName.textContent = scenes[sector][0];
    if (liveDescription) liveDescription.textContent = scenes[sector][1];
    stage.dataset.viewStage = String(sector);
    requestFrame();
  };
  selectors.forEach(button => button.addEventListener('click', () => describe(Number(button.dataset.universeStage))));
  describe(0);
  const mul = (a,b) => {
    const out = new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) out[c*4+r] += a[k*4+r]*b[c*4+k];
    return out;
  };
  const norm = v => {const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cameraMatrix=(eye,target,ratio) => {
    const z=norm(eye.map((v,i)=>v-target[i]));
    const x=norm(cross([0,1,0],z)),y=cross(z,x);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
    const f=1/Math.tan((ratio<.72?68:56)*Math.PI/360), n=.3,far=500;
    const projection=new Float32Array([f/ratio,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);
    return mul(projection,view);
  };
  const rand = (()=>{let n=81723;return ()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};})();
  const vertices=[];
  const triangle=(a,b,c) => {vertices.push(...a,...b,...c);};
  const position=(p,n,color,kind)=>[...p,...n,...color,kind];
  function ring(cx,cy,cz,r,tube,phase,kind,span=Math.PI*2){
    const steps=span===Math.PI*2?(weakDevice?72:136):(weakDevice?64:116);
    const side=weakDevice?6:9;
    const colors=kind===3?[.58,.77,.95]:kind===2?[.97,.76,.47]:kind===1?[.34,.56,.77]:[.23,.33,.44];
    const rotate=(p)=>[p[0]*Math.cos(phase)+p[2]*Math.sin(phase),p[1],p[2]*Math.cos(phase)-p[0]*Math.sin(phase)];
    const sample=(i,j)=>{
      const a=(i/steps)*span-(span===Math.PI*2?0:Math.PI*.08);
      const b=(j/side)*Math.PI*2;
      const radial=r+tube*Math.cos(b);
      const p=rotate([radial*Math.cos(a),radial*Math.sin(a)*.88,tube*Math.sin(b)]);
      const nn=norm(rotate([Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)]));
      return position([p[0]+cx,p[1]+cy,p[2]+cz],nn,colors,kind);
    };
    for(let i=0;i<steps;i++)for(let j=0;j<side;j++){
      const a=sample(i,j),b=sample(i+1,j),c=sample(i+1,j+1),d=sample(i,j+1);
      triangle(a,b,d);triangle(b,c,d);
    }
  }
  function sphere(cx,cy,cz,r,color,kind,lod=1){
    // Small far-world satellites should not cost a full hero-sized sphere.
    const rows=lod===0?11:weakDevice?16:24;
    const columns=lod===0?18:weakDevice?24:36;
    const point=(i,j)=>{
      const v=i/rows*Math.PI,u=j/columns*2*Math.PI;
      const n=[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];
      return position([cx+r*n[0],cy+r*n[1],cz+r*n[2]],n,color,kind);
    };
    for(let i=0;i<rows;i++) for(let j=0;j<columns;j++){
      const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);
      triangle(a,b,d);triangle(b,c,d);
    }
  }
  // The aperture is a volume, not a flat billboard. Successive rings occupy
  // actual distances, so orbit, dolly and pointer shifts change their parallax.
  for(let i=0;i<9;i++){
    const z=-22-i*19;
    const x=4.9+Math.sin(i*.78)*1.7, y=.15+Math.cos(i*.57)*.7;
    const radius=10.6+i*.95;
    ring(x,y,z,radius,i===0?.57:.42,i*.17,0);
    ring(x,y,z-.45,radius-.6,.085,i*.17,2);
    if(i<7)ring(x,y,z+1.6,radius+1.0,.11,-i*.17,3,Math.PI*1.61);
    if(i<6)ring(x,y,z-2.7,radius*.77,.075,i*.3,1,Math.PI*1.92);
  }
  // Distant worlds exist beyond the aperture, on different depth planes,
  // rather than a giant glowing orb covering the actual project material.
  sphere(8.5,3.4,-106,5.8,[.39,.48,.67],0);
  sphere(-7.2,-3.8,-147,8.4,[.40,.28,.52],0);
  sphere(9.2,-5.4,-193,7.1,[.48,.38,.32],2);
  ring(8.5,3.4,-106,8.7,.12,.44,2);
  const thresholdVertices=vertices.length/10;

  // Separate real 3D regions, not a color filter on one repeated tunnel.
  // Archive: a receding observatory of floating archival monoliths, radial
  // instruments, and a central stellar record. Each object occupies a depth.
  const prism=(cx,cy,cz,w,h,d,color,kind=0)=>{
    const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,z0=cz-d/2,z1=cz+d/2;
    const faces=[
      [[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]],
      [[0,0,-1],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]]],
      [[1,0,0],[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]]],
      [[-1,0,0],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]],
      [[0,1,0],[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]],
      [[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]]
    ];
    faces.forEach(([n,points])=>{
      const [a,b,c,d]=points.map(p=>position(p,n,color,kind));
      triangle(a,b,d);triangle(b,c,d);
    });
  };
  const archiveStart=vertices.length/10;
  for(let i=0;i<8;i++){
    const z=-38-i*21,span=11.0+i*.6;
    const height=15+i*1.5;
    // Deliberate negative space through which the camera can actually fly.
    prism(5-span,0,z,1.6,height,2.4,[.28,.40,.53],0);
    prism(5+span,0,z,1.6,height,2.4,[.28,.40,.53],0);
    // Break the lintels into hovering fragments; the observatory is not
    // an enclosed rectangular hallway or a conventional office building.
    for(const side of [-1,1]){
      prism(5+side*span*.49,8.3+i*.42,z-.3,span*.72,.48,1.7,[.45,.38,.30],2);
      prism(5+side*span*.49,-8.6-i*.35,z,span*.69,.36,1.5,[.26,.36,.50],0);
    }
    ring(5,0,z-3.2,7.0+i*.4,.13,i*.085,2,Math.PI*1.92);
    ring(5,0,z-4.5,4.0+i*.29,.085,-i*.10,3,Math.PI*1.72);
    for(const side of [-1,1]){
      const sx=5+side*(span-1.4);
      prism(sx,3.9,z+2,.28,2.7,.26,[.86,.63,.35],2);
      prism(sx,-3.9,z+2,.28,2.7,.26,[.86,.63,.35],2);
    }
  }
  sphere(5,1.2,-184,8.3,[.40,.43,.61],0);
  ring(5,1.2,-184,12.0,.20,.18,3);
  const archiveVertices=vertices.length/10-archiveStart;

  // Beyond: actual large worlds and planetary halos on distant planes,
  // with long sightlines. No second renderer or stock illustration.
  const beyondStart=vertices.length/10;
  sphere(6.0,1.6,-71,9.3,[.30,.35,.60],4);
  sphere(-21,-8.1,-114,16.0,[.50,.30,.52],4);
  sphere(28,10.3,-153,19.4,[.38,.48,.58],4);
  sphere(2,15,-227,12.0,[.58,.38,.26],4);
  ring(6,1.6,-71,14.2,.13,-.43,2,Math.PI*1.87);
  ring(-21,-8.1,-114,22.8,.13,.55,3,Math.PI*1.74);
  ring(28,10.3,-153,27.5,.15,-.21,2,Math.PI*1.91);
  for(let i=0;i<18;i++){
    const z=-85-i*11,theta=i*2.3999;
    const x=8+Math.cos(theta)*(12+i*.55),y=Math.sin(theta)*(9+i*.3);
    sphere(x,y,z,.95+(i%4)*.29,[.37+.025*(i%5),.42,.60],0,0);
  }
  const beyondVertices=vertices.length/10-beyondStart;
  const realmRanges=[
    {name:'threshold',start:0,count:thresholdVertices},
    {name:'archive',start:archiveStart,count:archiveVertices},
    {name:'beyond',start:beyondStart,count:beyondVertices}
  ];
  const mesh=new Float32Array(vertices);
  const stars=[];
  for(let i=0;i<(weakDevice?2500:6800);i++){
    const z=-8-Math.pow(rand(),.63)*310;
    const spread=30+Math.abs(z)*.40;
    const x=(rand()-.5)*spread*2, y=(rand()-.5)*spread;
    const t=rand();
    stars.push(x,y,z,t<.17?.92:t<.5?.67:.40,t<.2?.72:t<.55?.77:.57,t<.3?.49:.9,.65+rand()*2.5);
  }
  const starBuffer=new Float32Array(stars);
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const info=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('Transcosmic shader: '+info);}return shader;};
  const program=(vert,frag)=>{const a=compile(gl.VERTEX_SHADER,vert),b=compile(gl.FRAGMENT_SHADER,frag);const out=gl.createProgram();gl.attachShader(out,a);gl.attachShader(out,b);gl.linkProgram(out);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(out,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(out));return out;};
  const skyVertex=`#version 300 es
    precision highp float;
    out vec2 vUv;
    void main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const skyFrag=`#version 300 es
    precision highp float;
    in vec2 vUv;out vec4 pixel;
    uniform vec2 uResolution;uniform float uTime;uniform vec2 uPointer;uniform float uTravel;uniform float uRealm;
    float hash(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){
      vec2 uv=gl_FragCoord.xy/uResolution.xy;
      vec2 p=(uv-.5)*vec2(uResolution.x/uResolution.y,1.);
      p-=vec2(.26+uPointer.x*.07,-.03+uPointer.y*.035);
      float r=length(p),a=atan(p.y,p.x);
      float drift=uTime*.003;
      float strata=noise(p*3.+drift)*.60+noise(p*7.3-drift*2.)*.24+noise(p*17.1)*.16;
      float flowing=exp(-abs(r-(.40+.13*sin(a*2.1+strata*4.)))*3.5);
      float cloud=pow(max(0.,strata-.29),1.65)*flowing;
      vec3 ink=vec3(.008,.011,.026);
      ink+=vec3(.08,.07,.17)*cloud*.82;
      ink+=vec3(.015,.10,.13)*pow(max(0.,cloud-.08),1.5);
      ink+=vec3(.14,.09,.075)*exp(-abs(r-.22)*8.)*strata*.24;
      float spine=exp(-r*4.5)*(.06+.05*sin(a*6.+strata*5.));
      ink+=vec3(.06,.16,.19)*spine;
      // The horizon beyond the apertures contains a layered galactic arm,
      // not a flat background photograph. Offset keeps text-space legible.
      vec2 galaxy=(uv-vec2(.72,.52))*vec2(uResolution.x/uResolution.y,1.);
      float gr=length(galaxy),ga=atan(galaxy.y,galaxy.x);
      float grain2=noise(galaxy*6.+vec2(drift*5.,-drift*2.));
      float arms=.5+.5*cos(ga*3.7-gr*19.+grain2*2.9+uTime*.018);
      float darkLane=pow(arms,2.4)*(.43+grain2*.57);
      float disk=exp(-pow(gr/.68,1.65))*(.22+darkLane*.78);
      ink+=vec3(.070,.066,.155)*disk*1.2;
      ink+=vec3(.061,.123,.165)*darkLane*exp(-gr*3.3)*.82;
      ink+=vec3(.19,.107,.071)*exp(-gr*8.)*(.28+grain2*.55);
      // Three distinct spatial destinations. A threshold is a portal; the
      // archive is a lit observatory; beyond is an immense spiral gulf.
      // Uniform realm branching skips expensive secondary nebula passes
      // when those universes are not on screen (important for mobile GPUs).
      if(uRealm>.5 && uRealm<1.5){
        vec2 observatory=(uv-vec2(.67,.52))*vec2(uResolution.x/uResolution.y,1.);
        float vault=exp(-abs(length(observatory)-.37)*7.);
        float filaments=abs(sin(atan(observatory.y,observatory.x)*18.0+gr*13.));
        vec3 archiveSky=vec3(.008,.017,.036)
          +vec3(.19,.13,.075)*vault*(.18+.36*pow(filaments,13.))
          +vec3(.025,.067,.080)*pow(max(0.,strata-.13),2.)*1.4;
        ink=mix(ink,archiveSky,.91);
      }else if(uRealm>1.5){
        vec2 gulf=(uv-vec2(.76,.55))*vec2(uResolution.x/uResolution.y,1.);
        float radius=length(gulf),angle=atan(gulf.y,gulf.x);
        float dustField=noise(gulf*5.2+uTime*.004);
        float spiral=.5+.5*cos(angle*4.-radius*21.+dustField*3.);
        float galacticDisk=exp(-radius*2.3);
        vec3 beyondSky=vec3(.010,.006,.037)
          +vec3(.080,.050,.20)*galacticDisk*(.2+.65*spiral)
          +vec3(.020,.13,.18)*pow(spiral,3.)*galacticDisk*.7
          +vec3(.18,.080,.054)*exp(-radius*8.)*.9
          +vec3(.05,.065,.105)*pow(max(0.,noise(gulf*13.)-.22),2.);
        ink=mix(ink,beyondSky,.92);
      }
      for(int l=0;l<3;l++){
        float scale=l==0?155.:l==1?310.:620.;
        vec2 q=uv*scale+vec2(float(l)*17.3,float(l)*31.1);
        vec2 cell=floor(q), f=fract(q)-.5;
        vec2 jitter=vec2(hash(cell+2.1),hash(cell+19.3))-.5;
        float dist=length(f-jitter*.76);
        float strength=step(.988,hash(cell+float(l)*9.))*(l==0?.52:l==1?.25:.10);
        float star=exp(-dist*dist*280.)*strength;
        ink+=vec3(.50,.73,1.)*star;
      }
      // Deep space and high contrast around actual text, not a stock galaxy.
      float textClear=smoothstep(.03,.73,uv.x);
      ink*=mix(.39,1.0,textClear);
      float vignette=1.-smoothstep(.35,1.16,length((uv-.5)*vec2(1.16,1.)));
      ink*=.57+.43*vignette;
      pixel=vec4(ink,1.);
    }`;
  const meshVertex=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec3 aNormal;
    layout(location=2) in vec3 aColor;
    layout(location=3) in float aKind;
    uniform mat4 uVP;uniform float uTime;uniform float uTravel;
    out vec3 vColor;out vec3 vNormal;out float vKind;out float vDistance;out vec3 vWorld;
    void main(){
      vec3 p=aPosition;
      float spin=uTime*.016*(aKind>2.5?1.:-.23);
      p.xy+=vec2(sin(p.z*.022+spin),cos(p.z*.017-spin))*.08;
      vWorld=p;vColor=aColor;vNormal=aNormal;vKind=aKind;
      vDistance=length(p-vec3(0.,0.,8.-uTravel*18.));
      gl_Position=uVP*vec4(p,1.);
    }`;
  const meshFrag=`#version 300 es
    precision highp float;
    in vec3 vColor,vNormal,vWorld;in float vKind,vDistance;
    out vec4 pixel;uniform float uTime;
    void main(){
      vec3 n=normalize(vNormal);
      vec3 sun=normalize(vec3(-.27,.75,.8));
      float diff=max(dot(n,sun),0.);
      float edge=pow(1.-abs(dot(n,normalize(vec3(.1,.0,1.)))),2.);
      float grain=sin(vWorld.x*17.4+sin(vWorld.y*11.3))*sin(vWorld.y*10.8+vWorld.z*.21)*(vKind>3.5?.018:.095);
      float cool=clamp(diff*.74+edge*.35+.10+grain,0.,1.);
      vec3 color=vColor*cool;
      color+=vColor*(vKind>1.5?.38:.04)*pow(max(0.,diff),2.);
      if(vKind>2.5&&vKind<3.5)color+=vec3(.13,.26,.32)*(.27+.17*sin(uTime*.21+vWorld.z));
      if(vKind>3.5){
        // Spherical worlds require planet-scale material, directional day/night
        // shading and atmospheric rim, not the torus' high-frequency metal.
        float bands=sin(vWorld.y*.47+sin(vWorld.x*.30)*.8+sin(vWorld.z*.26)*.65);
        float clouds=smoothstep(.15,.92,bands);
        float atmosphere=pow(max(0.,1.-abs(n.z)),3.2);
        color=mix(vColor*.16,vColor*1.17,clamp(diff*.87+.20,0.,1.));
        color+=vec3(.06,.08,.15)*clouds*.25;
        color+=vec3(.095,.14,.26)*atmosphere*.48;
      }
      float fog=exp(-pow(vDistance/190.,1.8));
      color=mix(vec3(.005,.013,.027),color,fog);
      pixel=vec4(color,1.);
    }`;
  const starVertex=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec3 aColor;
    layout(location=2) in float aSize;
    uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;
    out vec3 vColor;out float vAlpha;
    void main(){
      vec3 p=aPosition;
      p.xy+=vec2(sin(aPosition.z*.027+uTime*.05),cos(aPosition.z*.029-uTime*.043))*.2;
      gl_Position=uVP*vec4(p,1.);
      float depth=length(p-uCamera);
      gl_PointSize=clamp(aSize*55./max(15.,depth),1.,5.);
      vColor=aColor;vAlpha=clamp(1.8-depth/400.,.1,1.);
    }`;
  const starFrag=`#version 300 es
    precision highp float;
    in vec3 vColor;in float vAlpha;out vec4 pixel;
    void main(){float d=length(gl_PointCoord-.5);float core=pow(max(0.,1.-d*2.),2.8);if(core<.015)discard;pixel=vec4(vColor,core*vAlpha*.88);}`;
  function init(){
    if(disposed)return;
    try {
      gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'default',depth:true,stencil:false,preserveDrawingBuffer:false});
      if(!gl)throw Error('WebGL2 not available');
      const sky=program(skyVertex,skyFrag),solid=program(meshVertex,meshFrag),dust=program(starVertex,starFrag);
      const vao=gl.createVertexArray();gl.bindVertexArray(vao);
      const meshBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,meshBuffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
      const stride=10*4;
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,stride,0);
      gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,stride,3*4);
      gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,stride,6*4);
      gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,stride,9*4);
      gl.bindVertexArray(null);
      const dustVAO=gl.createVertexArray();gl.bindVertexArray(dustVAO);
      const dustBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,dustBuffer);gl.bufferData(gl.ARRAY_BUFFER,starBuffer,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,7*4,0);
      gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,7*4,3*4);
      gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,7*4,6*4);
      gl.bindVertexArray(null);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      const uniforms=(program,names)=>Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,name)]));
      const skyU=uniforms(sky,['uResolution','uTime','uPointer','uTravel','uRealm']);
      const meshU=uniforms(solid,['uVP','uTime','uTravel']);
      const starU=uniforms(dust,['uVP','uCamera','uTime']);
      let lastWidth=0,lastHeight=0;
      drawScene=(time)=>{
        const box=canvas.getBoundingClientRect();
        const budget=weakDevice?820000:1650000;
        const requested=Math.min(devicePixelRatio||1,weakDevice?1:1.5);
        const factor=Math.min(requested,Math.sqrt(budget/Math.max(1,box.width*box.height)));
        const width=Math.max(1,Math.floor(box.width*factor)),height=Math.max(1,Math.floor(box.height*factor));
        if(width!==lastWidth||height!==lastHeight){canvas.width=lastWidth=width;canvas.height=lastHeight=height;gl.viewport(0,0,width,height);}
        const smooth=(target,current)=>current+(target-current)*.055;
        eased[0]=smooth(pointer[0],eased[0]);eased[1]=smooth(pointer[1],eased[1]);
        const progress=Math.max(0,Math.min(1,window.scrollY/Math.max(stage.parentElement?.clientHeight||1,1)));
        const destination=sector*.38+progress*.31;
        // View changes remain usable under reduced-motion and Pause: render
        // the chosen camera once at its final position, never a 5% transition.
        travel=motionEnabled()?travel+(destination-travel)*.14:destination;
        stage.dataset.cameraTravel=travel.toFixed(3);
        const phone=box.width<650;
        // Camera changes are physically distinct and source-pinned. The
        // Archive faces monoliths; Beyond looks between actual planets.
        const eye=sector===0
          ? [(phone?.7:-.25)+eased[0]*.85+travel*2.1,eased[1]*.62+travel*.45,9-travel*56]
          : sector===1
            ? [(phone?5:2.4)+eased[0]*1.1,3.2+eased[1]*.9,12-travel*19]
            : [(phone?4:0)+eased[0]*1.2,1.7+eased[1]*.8,7-travel*25];
        const target=sector===0
          ? [(phone?.4:4.1)+travel*.70,Math.sin(time*.035)*.26,-38-travel*37]
          : sector===1 ? [5,1.5,-93] : [phone?3.0:-5.0,-.5,-120];
        const vp=cameraMatrix(eye,target,width/height);
        gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
        gl.useProgram(sky);
        gl.uniform2f(skyU.uResolution,width,height);
        gl.uniform1f(skyU.uTime,time);gl.uniform2f(skyU.uPointer,eased[0],eased[1]);gl.uniform1f(skyU.uTravel,travel);gl.uniform1f(skyU.uRealm,sector);
        gl.drawArrays(gl.TRIANGLES,0,3);
        gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(dust);gl.uniformMatrix4fv(starU.uVP,false,vp);gl.uniform3f(starU.uCamera,...eye);gl.uniform1f(starU.uTime,time);
        gl.bindVertexArray(dustVAO);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.POINTS,0,starBuffer.length/7);
        gl.disable(gl.BLEND);gl.depthMask(true);
        gl.useProgram(solid);gl.uniformMatrix4fv(meshU.uVP,false,vp);gl.uniform1f(meshU.uTime,time);gl.uniform1f(meshU.uTravel,travel);
        const selected=realmRanges[sector];
        gl.bindVertexArray(vao);gl.drawArrays(gl.TRIANGLES,selected.start,selected.count);
        gl.bindVertexArray(null);
        stage.dataset.renderRealm=selected.name;
        stage.dataset.realmVertices=String(selected.count);
        if(stage.dataset.renderMode!=='webgl2'){
          stage.dataset.renderMode='webgl2';stage.dataset.sceneDepth='perspective';
          if(modeNote)modeNote.textContent='ART-DIRECTED 3D STUDY / NOT A RELEASED GAME';
        }
        stage.dataset.renderPixels=String(width*height);
      };
      requestFrame();
    }catch(err){markFallback();gl=null;drawScene=null;}
  }
  function render(now){
    frame=0;if(disposed||!drawScene)return;
    const moving=motionEnabled();
    // Cap low-memory devices to roughly 24fps. On reduced motion, Pause, or
    // a keyboard viewpoint change, always render the destination immediately.
    if(weakDevice&&moving&&lastDrawTime&&now-lastDrawTime<40){requestFrame();return;}
    lastDrawTime=now;
    if(moving)clock+=Math.min(55,Math.max(0,now-lastTime||16))*.001;
    lastTime=now;
    try{drawScene(clock);}catch(err){markFallback();drawScene=null;return;}
    if(moving)requestFrame();
  }
  function requestFrame(){if(!frame&&drawScene&&!disposed)frame=requestAnimationFrame(render);}
  const onPointer=event=>{
    if(event.pointerType==='touch')return;
    pointer=[(event.clientX/Math.max(1,innerWidth)-.5)*2,(event.clientY/Math.max(1,innerHeight)-.5)*2];
    if(!motionEnabled())return;
    requestFrame();
  };
  document.addEventListener('pointermove',onPointer,{passive:true});
  addEventListener('scroll',requestFrame,{passive:true});addEventListener('resize',requestFrame,{passive:true});
  document.addEventListener('visibilitychange',requestFrame);
  reduced.addEventListener?.('change',requestFrame);
  document.querySelector('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(requestFrame));
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting);if(visible)requestFrame();},{rootMargin:'120px'}).observe(stage);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(frame)cancelAnimationFrame(frame);frame=0;drawScene=null;markFallback();});
  canvas.addEventListener('webglcontextrestored',init);
  init();
})();
