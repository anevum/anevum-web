#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D uScene;
uniform vec2 uPixel;
varying vec2 vScreen;
vec3 highlight(vec4 c){return c.rgb*max(0.0,max(max(c.r,c.g),c.b)-.66)*c.a;}
void main(){vec4 src=texture2D(uScene,vScreen);vec3 glow=vec3(0.0);float halo=0.0;
for(int j=-2;j<=2;j++){for(int i=-2;i<=2;i++){vec2 d=vec2(float(i),float(j));float w=exp(-dot(d,d)*.45);vec4 s=texture2D(uScene,vScreen+d*uPixel*7.0);glow+=highlight(s)*w*.065;halo+=max(max(s.r,s.g),s.b)*s.a*w*.003;}}
float ga=max(max(glow.r,glow.g),glow.b);float alpha=clamp(src.a+ga*.45+halo*.3,0.0,1.0);gl_FragColor=vec4(min(vec3(1.0),src.rgb+glow*.45),alpha);}
