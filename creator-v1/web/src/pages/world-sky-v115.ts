/**
 * GPU procedural sky for V115. No textures, external assets, animations,
 * network calls, paid rendering, or external shader code. The sky is rendered
 * as a fullscreen triangle before real world geometry and is excluded from
 * the object-picking buffer.
 */
const vertexSource=[
 '#version 300 es',
 'precision highp float;',
 'void main(){',
 ' vec2 pos=vec2(gl_VertexID==2?3.0:-1.0,gl_VertexID==1?3.0:-1.0);',
 ' gl_Position=vec4(pos,0.0,1.0);',
 '}'
].join('\n');
const fragmentSource=[
 '#version 300 es',
 'precision highp float;',
 'uniform vec2 uResolution;',
 'uniform float uNight;',
 'uniform float uYaw;',
 'uniform float uIntensity;',
 'out vec4 outColor;',
 'float hash(vec2 p){',
 ' p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);',
 ' return fract(p.x*p.y);',
 '}',
 'float noise2(vec2 p){',
 ' vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
 ' float a=hash(i),b=hash(i+vec2(1.0,0.0));',
 ' float c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));',
 ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);',
 '}',
 'float fbm(vec2 p){',
 ' return .54*noise2(p)+.3*noise2(p*2.04)+.16*noise2(p*4.01);',
 '}',
 'void main(){',
 ' vec2 uv=gl_FragCoord.xy/max(uResolution,vec2(1.0));',
 ' float aspect=uResolution.x/max(uResolution.y,1.0);',
 ' float zenith=smoothstep(0.0,1.0,pow(uv.y,.8));',
 ' vec3 day=mix(vec3(.22,.43,.57),vec3(.016,.066,.16),zenith);',
 ' day+=vec3(.12,.09,.075)*(1.0-smoothstep(.03,.38,uv.y));',
 ' vec3 nocturne=mix(vec3(.11,.15,.28),vec3(.012,.024,.075),zenith);',
 ' nocturne+=vec3(.12,.025,.19)*exp(-pow((uv.y-.57)/.25,2.0))*.55;',
 ' vec3 color=mix(day,nocturne,uNight);',
 ' vec2 flow=vec2(uv.x*3.1+uYaw*.075,uv.y*5.4);',
 ' float cloud=fbm(flow+vec2(0.0,noise2(flow*.8)*.35));',
 ' float cloudMask=smoothstep(.49,.75,cloud);',
 ' cloudMask*=.64*(1.0-smoothstep(.31,.79,uv.y));',
 ' color=mix(color,mix(vec3(.74,.83,.86),vec3(.28,.28,.49),uNight),cloudMask);',
 ' float haze=exp(-pow((uv.y-.19)/.19,2.0));',
 ' color+=mix(vec3(.13,.18,.21),vec3(.07,.015,.13),uNight)*haze*.55;',
 ' vec2 planetCenter=vec2(.76+.05*sin(uYaw*.4),.77);',
 ' vec2 p=vec2((uv.x-planetCenter.x)*aspect,uv.y-planetCenter.y);',
 ' float d=length(p);',
 ' float radius=.185;',
 ' float planetMask=1.0-smoothstep(radius-.002,radius+.002,d);',
 ' float bands=.5+.5*sin(p.y*43.0+sin(p.x*15.0)*.45);',
 ' float smallBands=.5+.5*sin(p.y*122.0+p.x*8.0);',
 ' vec3 planet=vec3(.26,.43,.62)+vec3(.13,.16,.17)*bands;',
 ' planet+=vec3(.035,.055,.065)*smallBands;',
 ' float phase=smoothstep(-.88,.66,p.x/max(radius,.01));',
 ' planet*=mix(.35,1.18,phase);',
 ' planet+=vec3(.15,.15,.18)*pow(max(0.0,1.0-d/radius),3.0);',
 ' color=mix(color,mix(planet,planet*vec3(.64,.69,.85),uNight),planetMask);',
 ' float limb=exp(-pow((d-radius)/.012,2.0))*.17;',
 ' color+=limb*mix(vec3(.3,.57,.81),vec3(.33,.24,.64),uNight);',
 ' vec2 sun=vec2((uv.x-.98)*aspect,uv.y-.59);',
 ' float scatter=exp(-length(sun)*8.0);',
 ' color+=mix(vec3(.26,.20,.15),vec3(.15,.075,.31),uNight)*scatter*clamp(uIntensity,.2,2.0);',
 ' vec2 stars=floor(vec2(uv.x*aspect,uv.y)*vec2(240.0,155.0));',
 ' float star=step(.9978,hash(stars));',
 ' float starBrightness=.6+.4*hash(stars+12.7);',
 ' star*=smoothstep(.28,.7,uv.y)*starBrightness;',
 ' color+=vec3(.7,.81,1.0)*star*mix(.32,1.0,uNight);',
 ' float vignette=1.0-.3*smoothstep(.48,1.0,length((uv-.5)*vec2(1.25,.9)));',
 ' outColor=vec4(clamp(color*vignette,0.0,1.0),1.0);',
 '}'
].join('\n');
function compile(gl:WebGL2RenderingContext,type:number,source:string){
 const shader=gl.createShader(type);
 if(!shader)throw Error('World sky shader allocation failed');
 gl.shaderSource(shader,source);
 gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
  const log=gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);
  throw Error('World sky shader failed: '+log);
 }
 return shader;
}
export type WorldSkyRenderer={
 render:(width:number,height:number,yaw:number,night:boolean,sunIntensity:number)=>void;
 dispose:()=>void;
};
export function createWorldSky(gl:WebGL2RenderingContext):WorldSkyRenderer{
 const program=gl.createProgram();
 if(!program)throw Error('World sky program unavailable');
 const vs=compile(gl,gl.VERTEX_SHADER,vertexSource);
 const fs=compile(gl,gl.FRAGMENT_SHADER,fragmentSource);
 gl.attachShader(program,vs);gl.attachShader(program,fs);
 gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
  const log=gl.getProgramInfoLog(program);
  gl.deleteProgram(program);
  throw Error('World sky link failed: '+log);
 }
 const vao=gl.createVertexArray();
 if(!vao){gl.deleteProgram(program);throw Error('Sky VAO unavailable');}
 const resolution=gl.getUniformLocation(program,'uResolution');
 const yaw=gl.getUniformLocation(program,'uYaw');
 const night=gl.getUniformLocation(program,'uNight');
 const sunlight=gl.getUniformLocation(program,'uIntensity');
 let disposed=false;
 return {
  render(width,height,skyYaw,skyNight,skySun){
   if(disposed||gl.isContextLost())return;
   gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
   gl.useProgram(program);
   gl.uniform2f(resolution,width,height);
   gl.uniform1f(yaw,skyYaw);
   gl.uniform1f(night,skyNight?1:0);
   gl.uniform1f(sunlight,skySun);
   gl.bindVertexArray(vao);
   gl.drawArrays(gl.TRIANGLES,0,3);
   gl.bindVertexArray(null);
   gl.clear(gl.DEPTH_BUFFER_BIT);
   gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
  },
  dispose(){
   if(disposed)return;
   disposed=true;
   if(!gl.isContextLost()){
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
   }
  }
 };
}
