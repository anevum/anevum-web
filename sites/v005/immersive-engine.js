/* ANEVUM Sites / Continuance Artifact | WebGL2 signed-distance environment.
   Deterministic textures; no tracking, downloads, or external dependencies.
   Development candidate — render and measure before release. */
(function(){
  'use strict';
  const VERT = `#version 300 es
  precision highp float;
  const vec2 verts[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
  out vec2 vUv;
  void main(){vec2 p=verts[gl_VertexID];vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;out vec4 frag;
  uniform vec2 uResolution;
  uniform float uTime,uYaw,uPitch,uQuality,uExposure,uMaterial;
  #define PI 3.14159265
  #define TAU 6.28318530
  #define MAX_STEPS 92

  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  float hash1(float x){return fract(sin(x*127.1)*43758.5453);}
  float hash3(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
  float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);return n;}
  float fbm(vec3 p){float s=.0,a=.5;for(int i=0;i<4;i++){s+=a*noise3(p);p=p*2.07+vec3(2.1,4.3,1.7);a*=.52;}return s;}
  float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
  float sdRoundBox(vec3 p,vec3 b,float r){return sdBox(p,b)-r;}
  float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xy)-t.x,p.z);return length(q)-t.y;}
  float sdCyl(vec3 p,float r,float h){vec2 q=abs(vec2(length(p.xz),p.y))-vec2(r,h);return min(max(q.x,q.y),0.)+length(max(q,0.));}
  float sdSphere(vec3 p,float r){return length(p)-r;}
  vec2 pick(vec2 a,vec2 b){return a.x<b.x?a:b;}

  // A mechanically plausible object: nested shell, floating segments, hard-edged fasteners,
  // ceramic sphere, energy conduits and precision-machined platform.
  vec2 sculpture(vec3 p){
    vec3 q=p-vec3(0.,.23,0.);
    q.xy=rot(.10*sin(uTime*.15))*q.xy;
    q.xz=rot(.16*sin(uTime*.11))*q.xz;
    vec2 h=vec2(100.,0.);
    // Central faceted ceramic / crystalline pressure vessel.
    vec3 c=q;c.xz=rot(.22)*c.xz;
    float facet=max(max(abs(c.x)*.96+abs(c.y)*.22,abs(c.y)*.95+abs(c.z)*.25),abs(c.z)*.97+abs(c.x)*.20);
    float core=mix(length(c),facet,.30)-.61;
    core+=.009*sin(c.x*37.)*sin(c.y*39.)*sin(c.z*34.);
    h=pick(h,vec2(core,3.));
    // Deep gaskets around the core.
    h=pick(h,vec2(sdTorus(q,vec2(.686,.035)),7.));
    // Brushed alloy concentric gyroscopic shells.
    vec3 ring=q;ring.xz=rot(.22)*ring.xz;
    h=pick(h,vec2(sdTorus(ring,vec2(1.13,.103)),1.));
    vec3 ring2=q;ring2.yz=rot(.66)*ring2.yz;ring2.xy=rot(-.40)*ring2.xy;
    h=pick(h,vec2(sdTorus(ring2,vec2(1.28,.062)),2.));
    vec3 ring3=q;ring3.yz=rot(-.58)*ring3.yz;ring3.xy=rot(.32)*ring3.xy;
    h=pick(h,vec2(sdTorus(ring3,vec2(1.44,.027)),6.));
    // Twelve individually beveled orbit clamps with real gaps between them.
    float a=atan(ring.y,ring.x);float sector=TAU/12.;
    float aa=mod(a+sector*.5,sector)-sector*.5;
    vec3 segment=vec3(length(ring.xy)-1.14,aa*1.14,ring.z);
    float segmented=sdRoundBox(segment,vec3(.135,.202,.115),.025);
    h=pick(h,vec2(segmented,2.));
    vec3 fastener=vec3(length(ring.xy)-1.16,aa*1.16,ring.z-.126);
    h=pick(h,vec2(sdCyl(fastener.zxy,.032,.018),5.));
    // Delicate fillet band, optical seal and periodic illuminated sectors.
    vec3 inner=q;inner.xy=rot(.035)*inner.xy;
    float seam=sdTorus(inner,vec2(.735,.014));
    h=pick(h,vec2(seam,4.));
    // Ceramic ribs / contact rails around equator.
    float an=atan(q.y,q.x);float s=TAU/8.;float ai=mod(an+s*.5,s)-s*.5;
    vec3 rail=vec3(length(q.xy)-.815,ai*.815,q.z);
    h=pick(h,vec2(sdRoundBox(rail,vec3(.014,.047,.24),.012),5.));
    return h;
  }
  vec2 chamber(vec3 p){
    vec2 h=vec2(100.,0.);
    h=pick(h,vec2(p.y+1.72,8.));
    // Layered metal dais anchors object to a physical space.
    h=pick(h,vec2(sdCyl(p-vec3(0.,-1.58,0.),1.93,.20),2.));
    h=pick(h,vec2(sdCyl(p-vec3(0.,-1.335,0.),1.56,.045),1.));
    h=pick(h,vec2(sdTorus((p-vec3(0.,-1.31,0.)).xzy,vec2(1.51,.035)),4.));
    h=pick(h,vec2(sdTorus((p-vec3(0.,-1.34,0.)).xzy,vec2(1.12,.018)),6.));
    // Dark structural backdrop with orthogonal ribbing.
    h=pick(h,vec2(p.z+6.5,9.));
    vec3 rib=p;rib.x=mod(p.x+1.9,3.8)-1.9;
    h=pick(h,vec2(sdRoundBox(rib-vec3(0.,.1,-6.25),vec3(.12,3.8,.24),.028),2.));
    vec3 beam=p;beam.y=mod(p.y+.45,2.45)-1.225;
    h=pick(h,vec2(sdRoundBox(beam-vec3(0.,0.,-6.27),vec3(15.,.075,.21),.02),1.));
    return h;
  }
  vec2 scene(vec3 p){return pick(sculpture(p),chamber(p));}
  vec2 march(vec3 ro,vec3 rd,float maxDist){
    float t=.015;float mat=0.;
    for(int i=0;i<MAX_STEPS;i++){
      if(float(i)>uQuality)break;
      vec2 s=scene(ro+rd*t);
      if(s.x<.0015*(1.+t*.07)){mat=s.y;return vec2(t,mat);}
      t+=max(s.x*.78,.004);
      if(t>maxDist)break;
    }
    return vec2(maxDist,0.);
  }
  vec3 normalAt(vec3 p){float e=.003;vec2 v=vec2(e,-e);return normalize(vec3(scene(p+v.xyy).x-scene(p+v.yyy).x,scene(p+v.yxy).x-scene(p+v.yyy).x,scene(p+v.yyx).x-scene(p+v.yyy).x));}
  float ambientOcclusion(vec3 p,vec3 n){float oc=0.,scale=1.;for(int i=1;i<=5;i++){float h=.025+.085*float(i);float d=scene(p+n*h).x;oc+=max(h-d,0.)*scale;scale*=.72;}return clamp(1.-oc*1.6,0.,1.);}
  float softShadow(vec3 ro,vec3 dir,float maxt){float t=.04,res=1.;for(int i=0;i<27;i++){float h=scene(ro+dir*t).x;res=min(res,10.*h/t);t+=clamp(h,.045,.30);if(h<.004||t>maxt)break;}return clamp(res,.0,1.);}
  // GGX microfacet specular with Schlick Fresnel and Smith geometric masking.
  float ggx(float NoH,float r){float a=r*r;float a2=a*a;float d=NoH*NoH*(a2-1.)+1.;return a2/max(.003,PI*d*d);}
  float smith(float NoV,float k){return NoV/(NoV*(1.-k)+k);}
  vec3 environment(vec3 rd){
    // Wide cinematic softboxes, strip-light reflections and industrial darkness.
    float y=rd.y*.5+.5;
    vec3 c=mix(vec3(.012,.023,.031),vec3(.09,.16,.18),smoothstep(.02,.93,y));
    float left=pow(max(dot(rd,normalize(vec3(-.72,.57,.40))),0.),30.);
    float right=pow(max(dot(rd,normalize(vec3(.73,.45,-.18))),0.),46.);
    float box1=smoothstep(.82,.91,dot(rd,normalize(vec3(-.42,.60,.70))));
    float box2=smoothstep(.88,.94,dot(rd,normalize(vec3(.66,.43,.58))));
    c+=vec3(2.5,3.,2.3)*left*.27+vec3(.5,1.2,1.8)*right*.45;
    c+=vec3(1.5,1.7,1.28)*box1*.48+vec3(.40,.93,1.28)*box2*.45;
    return c;
  }
  vec3 materialColor(float m,vec3 p){
    float grain=fbm(p*18.);
    if(m<1.5)return mix(vec3(.23,.28,.30),vec3(.53,.58,.55),grain);
    if(m<2.5)return mix(vec3(.048,.067,.071),vec3(.18,.24,.23),grain);
    if(m<3.5)return mix(vec3(.015,.022,.031),vec3(.12,.19,.18),fbm(p*9.));
    if(m<4.5)return vec3(.10,.72,.48);
    if(m<5.5)return vec3(.64,.57,.40);
    if(m<6.5)return vec3(.05,.45,.62);
    if(m<7.5)return vec3(.015,.021,.022);
    if(m<8.5){float f=fbm(p*10.);return mix(vec3(.065,.072,.078),vec3(.105,.118,.12),f);}
    return vec3(.045,.054,.061);
  }
  vec3 shade(vec3 p,vec3 n,vec3 view,float mat){
    vec3 albedo=materialColor(mat,p);
    float metal=mat<3.? .86:mat<3.5? .27:mat<7.? .72: mat<8.? .62:0.;
    float rough=mat<1.5?.28:mat<2.5?.34:mat<3.5?.17:mat<7.?.23:.68;
    if(uMaterial>1.5){if(mat<3.5){albedo=mix(albedo,vec3(.13,.27,.33),.48);rough=max(.12,rough*.67);}}
    else if(uMaterial>.5){if(mat<3.5){albedo=mix(albedo,vec3(.17,.16,.22),.77);rough=min(.78,rough*1.3);}}
    // Micro-textures: subtle brushed metal, pits, erosion, and roughness change.
    float mic=noise3(p*240.);
    rough=clamp(rough+(mic-.5)*.15,.075,.96);
    float grit=fbm(p*36.);
    albedo*=mix(.88,1.09,grit);
    float NoV=max(dot(n,view),.001);
    vec3 f0=mix(vec3(.035),albedo,metal);
    vec3 color=albedo*.04;
    vec3 lightDir[3]=vec3[3](normalize(vec3(-.58,.78,.48)),normalize(vec3(.83,.42,.11)),normalize(vec3(.12,.34,-.94)));
    vec3 intens[3]=vec3[3](vec3(6.0,5.6,4.0),vec3(1.4,3.3,5.7),vec3(.5,2.9,2.3));
    for(int i=0;i<3;i++){
      vec3 l=lightDir[i],h=normalize(l+view);float NoL=max(dot(n,l),0.),NoH=max(dot(n,h),0.),VoH=max(dot(view,h),0.);
      float r2=(rough+.04),k=(r2+1.)*(r2+1.)/8.;
      vec3 fres=f0+(1.-f0)*pow(1.-VoH,5.);
      vec3 spec=ggx(NoH,r2)*smith(NoL,k)*smith(NoV,k)*fres/(4.*NoV*NoL+.02);
      float shadow=i==0?softShadow(p+n*.03,l,7.):1.;
      color+=(albedo*(1.-metal)/PI+spec)*intens[i]*NoL*shadow*.50;
    }
    vec3 r=reflect(-view,n);
    vec3 fres=f0+(1.-f0)*pow(1.-NoV,5.);
    color+=environment(r)*fres*(1.-rough*.7)*1.4;
    color+=albedo*.12*ambientOcclusion(p,n);
    if(mat>3.5&&mat<4.6){color+=(uMaterial>1.5?vec3(.60,1.35,4.4):uMaterial>.5?vec3(2.9,.45,.93):vec3(.05,3.6,1.9))*(0.55+0.45*sin(uTime*1.5));}
    if(mat>5.5&&mat<6.6){color+=(uMaterial>1.5?vec3(.06,1.5,3.6):uMaterial>.5?vec3(1.5,.15,.8):vec3(.02,1.5,3.4))*.8;}
    if(mat>2.5&&mat<3.6){
      float organic=fbm(p*13.+vec3(uTime*.03));
      float fissures=pow(smoothstep(.54,.72,organic),3.);
      float thin=pow(1.-NoV,3.);
      color+=vec3(.08,1.9,1.32)*fissures*.5+vec3(.23,.85,.72)*thin*.12;
    }
    if(mat>7.5&&mat<8.5){
      float grid=max(smoothstep(.96,.99,fract(p.x*1.20)),smoothstep(.96,.99,fract(p.z*1.20)));
      float scratch=pow(noise3(vec3(p.x*3.,p.y*95.,p.z*3.)),5.);
      color=mix(color*.85,color*.25,grid*.6);
      color+=scratch*.03;
    }
    return color;
  }
  vec3 tonemap(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  vec3 render(vec3 ro,vec3 rd){
    vec2 hit=march(ro,rd,34.);
    float t=hit.x;vec3 col=environment(rd);
    if(hit.y>.5){
      vec3 p=ro+rd*t;
      vec3 n=normalAt(p);
      col=shade(p,n,-rd,hit.y);
      // Floor contact and subtle damp reflection — cheap single additional ray.
      if(hit.y>7.5&&hit.y<8.5&&uQuality>55.){
        vec3 rr=reflect(rd,n),ori=p+n*.018;
        vec2 reflected=march(ori,rr,10.);
        if(reflected.y>0.5&&reflected.y<8.){
          vec3 at=ori+rr*reflected.x;
          vec3 reflectedColor=shade(at,normalAt(at),-rr,reflected.y);
          float fres=pow(1.-clamp(dot(-rd,n),0.,1.),2.);
          col=mix(col,reflectedColor*.34,clamp(fres*.38,0.,.30));
        }
      }
      // Distance haze with separate fore-/background optical densities.
      float fog=1.-exp(-t*.032);
      col=mix(col,environment(rd)*.65,fog);
    }
    // Distant coherent shafts and halo from chamber lights.
    float shafts=pow(max(dot(rd,normalize(vec3(-.64,.67,-.44))),0.),12.);
    col+=vec3(.15,.46,.39)*shafts*.35;
    col+=vec3(.01,.12,.15)*pow(max(dot(rd,normalize(vec3(.45,.55,-.43))),0.),22.)*.4;
    return col;
  }
  void main(){
    vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
    float yaw=uYaw,pitch=uPitch;
    vec3 ro=vec3(4.6*sin(yaw)*cos(pitch),.65+4.6*sin(pitch),4.6*cos(yaw)*cos(pitch));
    vec3 target=vec3(0.,-.08,0.);
    vec3 forward=normalize(target-ro),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
    vec3 rd=normalize(uv.x*right+uv.y*up+1.64*forward);
    vec3 linear=render(ro,rd)*uExposure;
    vec3 c=tonemap(linear);
    c=pow(c,vec3(.91));
    float vignette=1.-.28*pow(length(uv)*.88,1.6);
    c*=vignette;
    // Extremely fine film grain, disappears perceptually at normal density.
    float grain=hash3(vec3(gl_FragCoord.xy,floor(uTime*16.)))-.5;
    c+=grain*.011;
    frag=vec4(c,1.);
  }`;

  function init(canvas, opts={}){
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
    if(!gl) return null;
    const compile=(type,src)=>{const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}return shader;};
    let program,vertex,fragment;
    try{vertex=compile(gl.VERTEX_SHADER,VERT);fragment=compile(gl.FRAGMENT_SHADER,FRAG);program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}
    catch(error){console.warn('ANEVUM immersive shader fallback',error);return null;}
    gl.useProgram(program);
    const res=gl.getUniformLocation(program,'uResolution'),time=gl.getUniformLocation(program,'uTime'),yawU=gl.getUniformLocation(program,'uYaw'),pitchU=gl.getUniformLocation(program,'uPitch'),qualityU=gl.getUniformLocation(program,'uQuality'),exposureU=gl.getUniformLocation(program,'uExposure'),materialU=gl.getUniformLocation(program,'uMaterial');
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);
    let yaw=opts.yaw ?? .18,pitch=opts.pitch ?? .13,dragging=false,lastX=0,lastY=0,raf=0,disposed=false,visible=true,frames=0,lastFrame=0;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile=window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const config={maxDpr:mobile?.8:Math.min(window.devicePixelRatio||1,1.15),fps:mobile?22:36,steps:mobile?45:76,exposure:1.06,material:0};
    
    function render(now){if(disposed)return;raf=requestAnimationFrame(render);if(!visible)return;if(!reduced&&now-lastFrame<1000/config.fps)return;lastFrame=now;
      const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const w=Math.max(1,Math.floor(rect.width*config.maxDpr)),h=Math.max(1,Math.floor(rect.height*config.maxDpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}else if(frames===0)gl.viewport(0,0,w,h);
      gl.useProgram(program);gl.bindVertexArray(vao);
      if(!dragging&&!reduced)yaw+=mobile?.0004:.0009;
      gl.uniform2f(res,w,h);gl.uniform1f(time,now*.001);gl.uniform1f(yawU,yaw);gl.uniform1f(pitchU,pitch);gl.uniform1f(qualityU,config.steps);gl.uniform1f(exposureU,config.exposure);gl.uniform1f(materialU,config.material);
      gl.drawArrays(gl.TRIANGLES,0,3);frames++;
    }
    function onDown(e){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);}
    function onMove(e){if(!dragging)return;yaw+=(e.clientX-lastX)*.006;pitch=Math.max(-.28,Math.min(.5,pitch+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY;}
    function onUp(){dragging=false;}
    canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
    const observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;},{threshold:0});observer.observe(canvas);
    raf=requestAnimationFrame(render);
    return {setActive(v){visible=v;},setMode(mode){config.material=mode==='obsidian'?1:mode==='arctic'?2:0;config.exposure=mode==='obsidian'?.95:1.08;},reset(){yaw=.18;pitch=.13;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);gl.deleteVertexArray(vao);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);}};
  }
  window.ANEVUMImmersive={mount:init,version:'continuance-v005.1-cinematic'};
})();