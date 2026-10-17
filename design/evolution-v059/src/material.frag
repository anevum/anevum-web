#ifdef GL_ES
precision highp float;
#endif
varying vec3 vNormal,vPosition;
varying vec2 vUV;
varying float vFlow;
uniform vec3 uColor;
uniform float uRoughness,uMetallic,uEmission,uOpacity,uFamily,uTime,uPhase,uMode,uExpressive;
uniform sampler2D uTexture,uAlbedo;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.55+noise(p*2.03)*.25+noise(p*4.13)*.13+noise(p*8.1)*.07;}
vec3 brdf(vec3 N,vec3 V,vec3 L,vec3 albedo,float rough,float metal){vec3 H=normalize(V+L);float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.001),nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);float a=rough*rough,a2=a*a;float den=nh*nh*(a2-1.0)+1.0;float D=a2/(3.14159*den*den+.0001);float k=(rough+1.0)*(rough+1.0)/8.0;float G=(nl/(nl*(1.0-k)+k))*(nv/(nv*(1.0-k)+k));vec3 F0=mix(vec3(.045),albedo,metal);vec3 F=F0+(1.0-F0)*pow(1.0-vh,5.0);return ((1.0-F)*(1.0-metal)*albedo/3.14159+D*G*F/max(4.0*nl*nv,.001))*nl;}
void main(){
 vec3 P=vPosition;float tm=uTime*.08;float tex=texture2D(uTexture,vUV*vec2(1.0,1.0)).r;
 float coarse=fbm(P*6.0+uPhase),micro=noise(P*180.0);vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 float grain=(micro-.5)*.035;N=normalize(N+vec3(grain,grain*.6,-grain*.7));vec3 base=uColor;
 float rough=uRoughness,em=uEmission;float alpha=uOpacity;
 if(uFamily==1.0){base*=.27+coarse*.55+tex*.63;vec3 mineral=texture2D(uAlbedo,vUV*1.6).rgb;base*=.5+mineral*2.8;float seam=pow(max(0.0,1.0-abs(sin(P.y*19.0+coarse*8.0))),19.0);base+=vec3(.06,.07,.065)*seam;rough=clamp(rough+(tex-.5)*.15,.12,.95);}
 if(uFamily==2.0){float f=pow(1.0-abs(N.z),2.0);base=mix(base*.25,base*1.45,f);base+=vec3(.11,.03,.15)*sin(coarse*9.0);alpha=clamp(alpha*.45+f*.65,.20,1.0);}
 if(uFamily==3.0){float brush=sin(vUV.y*1000.0+tex*10.0)*.035;base*=.79+tex*.3+brush;}
 if(uFamily==4.0){float flow=fbm(P*15.0+vec3(tm,-tm*3.0,tm));float vein=pow(flow,3.0);base=mix(base*.10,base*2.6,vein);base+=vec3(1.0,.65,.25)*pow(flow,8.0)*2.0;em*=.75+.3*sin(uTime*.7+uPhase+flow*3.0);}
 if(uFamily==5.0){float land=fbm(P*6.0);float wave=noise(P*130.0+vec3(tm,0,0));base*=.65+wave*.3;if(uColor.g>.4){base=mix(base*.4,vec3(.22,.45,.18),smoothstep(.45,.70,land));}else{base+=vec3(.01,.11,.13)*pow(wave,6.0);float cloud=fbm(P*10.0+vec3(tm,tm*.2,0.0));base=mix(base,vec3(.60,.70,.73),smoothstep(.63,.77,cloud)*.82);}}
 if(uFamily==6.0){float wall=pow(1.0-abs(N.z),2.0);base*=.5+coarse*.65;base+=vec3(.08,.28,.11)*wall;alpha=clamp(alpha*.63+wall*.4,.3,.95);}
 if(uFamily==7.0){vec2 q=vUV*2.0-1.0;float radial=max(0.0,1.0-dot(q,q));float density=fbm(vec3(vUV*8.0+uPhase,uTime*.012));alpha*=radial*radial*(.4+density);base*=.65+density;}
 if(uMode==2.0||uMode==4.0||uMode==12.0||uMode==23.0||uMode==34.0||uMode==37.0||uMode==38.0||uMode==42.0||uMode==43.0||uMode==44.0){float flow=.3+.7*pow(.5+.5*sin(uTime*.7+uPhase-P.y*6.0+P.x*4.0),5.0);em*=flow;alpha*=.65+.35*flow;}
 if(uMode==36.0){alpha*=.35+.65*max(0.0,sin(uTime*.6-uPhase));}
 vec3 V=normalize(vec3(0,0,4)-P),L=normalize(vec3(-3,4,5));
 vec3 col=brdf(N,V,L,base,rough,uMetallic)*vec3(3.6,3.5,3.25);
 col+=brdf(N,V,normalize(vec3(3,-1,1)),base,rough,uMetallic)*vec3(.43,.72,1.2);
 col+=base*(.045+.08*max(N.y,0.0));
 float fres=pow(1.0-max(dot(N,V),0.0),3.0);col+=fres*base*vec3(.5,.8,1.0)*(.15+uMetallic*.6);
 col+=base*em;col=vec3(1.0)-exp(-col*1.15);col=pow(max(col,0.0),vec3(.454545));
 gl_FragColor=vec4(col,alpha);
}
