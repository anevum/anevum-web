attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
uniform float uTime,uMode,uSpeed,uPhase,uExpressive,uYaw,uPitch,uZoom;
uniform vec3 uAxis,uPivot;
varying vec3 vNormal,vPosition;
varying vec2 vUV;
varying float vFlow;
mat3 rotation(vec3 axis,float angle){axis=normalize(axis);float c=cos(angle),s=sin(angle),o=1.0-c;float x=axis.x,y=axis.y,z=axis.z;return mat3(c+x*x*o,y*x*o+z*s,z*x*o-y*s,x*y*o-z*s,c+y*y*o,z*y*o+x*s,x*z*o+y*s,y*z*o-x*s,c+z*z*o);}
void main(){
 float t=uTime*uSpeed,ph=uPhase,m=uMode,e=1.0+uExpressive*.7;
 vec3 p=aPosition,n=aNormal;float angle=0.0,scale=1.0;vec3 delta=vec3(0.0);vFlow=sin(t+ph);
 if(m==1.0){angle=.012*sin(t+ph);}
 if(m==3.0){p.z+=.035*sin(p.x*4.0+p.y*3.0+t+ph)*e;}
 if(m==5.0){scale=1.0+.12*sin(t*1.7+ph)*e;delta=vec3(.012*sin(t+ph),.02*cos(t+ph),0.0);}
 if(m==6.0){angle=.045*sin(t+ph)*e;}
 if(m==7.0){scale=1.0+.085*sin(t+ph)*e;}
 if(m==8.0){p.x+=.035*sin(p.y*8.0+t*1.7+ph)*e;p.z+=.04*sin(p.y*6.0-t+ph)*e;}
 if(m==9.0){delta=.018*vec3(sin(t+ph),cos(t*1.2+ph),0.0)*e;}
 if(m==10.0){p.z+=.022*sin(p.x*5.0+t+ph)*e;}
 if(m==11.0){angle=t*.25;}
 if(m==12.0){p.z+=.007*sin(p.x*2.0-t)*e;}
 if(m==13.0){scale=1.0+.018*sin(t+ph)*e;}
 if(m==14.0){angle=t*.11;}
 if(m==15.0){scale=1.0+.022*sin(t*2.0)*e;}
 if(m==16.0){scale=1.0+.07*sin(t+ph)*e;angle=.018*sin(t+ph);}
 if(m==17.0||m==21.0||m==22.0||m==24.0||m==25.0||m==27.0||m==28.0||m==39.0||m==41.0){angle=t;}
 if(m==18.0){scale=1.0+.04*sin(t+ph)*e;}
 if(m==19.0){scale=1.0+.025*sin(t+ph)*e;p.x+=.012*cos(t+ph);}
 if(m==20.0){scale=1.0+.08*sin(t+ph)*e;}
 if(m==23.0){p.z+=.009*sin(p.x*9.0-t+ph)*e;}
 if(m==26.0){scale=1.0-.04*sin(t+ph)*e;}
 if(m==29.0){p.x+=.015*sin(p.y*5.0+t+ph)*e;}
 if(m==30.0){delta.x=.045*sin(t)*sign(ph)*e;scale=1.0+.025*cos(t);}
 if(m==31.0){angle=.045*sin(t+ph);}
 if(m==32.0){p.x+=.012*sin(p.y*4.0+t+ph)*e;}
 if(m==33.0){scale=1.0+.025*sin(t)*e;}
 if(m==34.0){p.xy+=.01*vec2(sin(t+p.y*6.0+ph),cos(t+p.x*5.0+ph))*e;}
 if(m==35.0){angle=.015*sin(t)*e;}
 if(m==36.0){scale=1.0+.16*sin(t+ph)*e;}
 if(m==38.0){p.y+=.004*sin(p.x*5.0+t+ph);}
 if(m==40.0){delta.y=.005*sin(t+ph);}
 if(m==42.0){p.xy*=1.0-.035*sin(t+ph)*e;}
 if(m==43.0){scale=1.0+.1*sin(t)*e;}
 if(m==44.0){scale=1.0+.06*sin(t)*e;}
 mat3 anim=rotation(uAxis,angle);p=anim*(p-uPivot)*scale+uPivot+delta;n=anim*n;
 mat3 view=rotation(vec3(1.0,0.0,0.0),uPitch)*rotation(vec3(0.0,1.0,0.0),uYaw);
 p=view*p;n=view*n;vPosition=p;vNormal=n;vUV=aUV;
 float perspective=1.0/(1.0-p.z*.12);gl_Position=vec4(p.xy*.91*uZoom*perspective,-p.z*.23,1.0);
}
