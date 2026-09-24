const canvas = document.getElementById("scene");
const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

if (!gl) {
  canvas.style.display = "none";
} else {
  const vertex = `#version 300 es
    in vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fragment = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec2 u_resolution;
    uniform float u_time;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f*f*(3.0-2.0*f);
      return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
    }
    mat2 rot(float a) {
      float c=cos(a), s=sin(a);
      return mat2(c,-s,s,c);
    }
    float starLayer(vec2 uv, float scale, float threshold, float t) {
      vec2 p=uv*scale;
      p*=rot(t*.003);
      vec2 cell=floor(p);
      vec2 f=fract(p)-.5;
      float h=hash21(cell);
      float d=length(f-(vec2(hash21(cell+13.1),hash21(cell+41.7))-.5)*.58);
      float star=smoothstep(.045,.003,d)*step(threshold,h);
      float twinkle=.68+.32*sin(t*(1.1+h*1.7)+h*22.0);
      return star*twinkle;
    }
    float galaxy(vec2 uv,float t) {
      vec2 p=uv-vec2(.58,.33);
      p*=rot(-.16+t*.0014);
      p.y*=2.7;
      float r=length(p);
      float a=atan(p.y,p.x);
      float spiral=.5+.5*cos(a*4.0-r*31.0);
      float core=exp(-r*10.5);
      float arms=pow(max(spiral,0.0),7.0)*exp(-r*2.9);
      float dust=noise(p*58.0+t*.004)*.32;
      return (core*.5+arms*(.6+dust))*smoothstep(.48,.08,r);
    }
    float ringSdf(vec2 p,vec2 center,vec2 scale,float rotation,float radius,float width) {
      p-=center;
      p*=rot(rotation);
      p/=scale;
      float d=abs(length(p)-radius);
      return 1.0-smoothstep(width,width+.008,d);
    }
    float circle(vec2 p,vec2 c,float r,float feather) {
      return 1.0-smoothstep(r-feather,r+feather,length(p-c));
    }

    void main() {
      vec2 frag=gl_FragCoord.xy;
      vec2 uv=frag/u_resolution;
      vec2 p=(frag*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
      float t=u_time;

      vec3 col=mix(vec3(.008,.009,.009),vec3(.026,.028,.028),smoothstep(0.0,1.0,uv.y));

      float g=galaxy(uv,t);
      col+=vec3(.35,.40,.43)*g*.23;
      float stars=starLayer(uv,72.0,.985,t)+starLayer(uv+.173,128.0,.993,-t*.7);
      col+=vec3(.79,.84,.86)*stars*.58;

      float phase=clamp(t/22.0,0.0,1.0);
      float eased=phase*phase*(3.0-2.0*phase);
      float sunY=mix(.42,-.26,eased);
      vec2 sunC=vec2(.04,sunY);
      float sun=circle(p,sunC,.68,.006);
      float halo=exp(-max(0.0,length(p-sunC)-.55)*4.8)*.12;
      float sunFade=mix(.92,.08,smoothstep(.58,1.0,phase));
      vec3 sunCol=vec3(.72,.61,.47);
      col=mix(col,sunCol,sun*sunFade);
      col+=sunCol*halo*mix(1.0,.2,phase);

      float gateRotation=-.18+sin(t*.06)*.012;
      vec2 gateC=vec2(.79,.12);
      vec2 gp=p-gateC;
      vec2 q=rot(gateRotation)*gp;
      vec2 scale=vec2(.98,.62);
      float ring=ringSdf(p,gateC,scale,gateRotation,.42,.046);
      float ringInner=ringSdf(p,gateC,scale,gateRotation,.42,.012);
      float angle=atan(q.y/scale.y,q.x/scale.x);
      float segment=smoothstep(.72,1.0,cos(angle*32.0));
      float gateLight=ring*segment;
      col=mix(col,vec3(.13,.16,.17),ring*.86);
      col+=vec3(.43,.50,.52)*ringInner*.13;
      col+=vec3(.56,.62,.63)*gateLight*.035;
      float gateInterior=circle(q/scale,vec2(0),.36,.02)*.04;
      col+=vec3(.08,.13,.15)*gateInterior;

      float horizon=smoothstep(-.18,-.05,-p.y);
      col=mix(col,vec3(.008,.009,.009),horizon);
      float line=exp(-pow((p.y+.055)*48.0,2.0))*.055;
      col+=vec3(.47,.41,.34)*line;
      float haze=exp(-pow((p.y+.02)*6.8,2.0))*.035;
      col+=vec3(.35,.31,.27)*haze*(1.0-horizon);

      float vignette=smoothstep(1.28,.35,length((uv-.5)*vec2(1.2,.95)));
      col*=mix(.58,1.0,vignette);
      float grain=hash21(frag+vec2(floor(t*12.0)))-.5;
      col+=grain*.012;
      col=pow(max(col,0.0),vec3(.96));
      outColor=vec4(col,1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    }
    return shader;
  }

  try {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
    gl.useProgram(program);

    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const started = performance.now();

    function resize() {
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      const width=Math.max(1,Math.floor(canvas.clientWidth*dpr));
      const height=Math.max(1,Math.floor(canvas.clientHeight*dpr));
      if(canvas.width!==width||canvas.height!==height){
        canvas.width=width;
        canvas.height=height;
        gl.viewport(0,0,width,height);
      }
    }

    function render(now) {
      resize();
      const elapsed=reduceMotion?15.0:(now-started)/1000;
      gl.uniform2f(resolution,canvas.width,canvas.height);
      gl.uniform1f(time,elapsed);
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(!reduceMotion) requestAnimationFrame(render);
    }

    render(performance.now());
    window.addEventListener("resize",resize,{passive:true});
  } catch (error) {
    console.error(error);
    canvas.style.display="none";
  }
}
